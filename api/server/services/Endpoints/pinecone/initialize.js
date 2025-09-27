const { SSE } = require('sse.js');
const { logger } = require('@librechat/data-schemas');
const { sendEvent } = require('@librechat/api');
const { Constants, ContentTypes } = require('librechat-data-provider');

class PineconeClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://prod-1-data.ke.pinecone.io/assistant/chat';
    this.assistantName = options.assistantName || 'thrive-coach';
    this.req = options.req;
    this.res = options.res;
    this.abortController = options.abortController;
    this.debug = options.debug || false;
  }

  async chatCompletion(payload, onProgress) {
    const { messages, stream = true } = payload;
    
    if (!messages || messages.length === 0) {
      throw new Error('Messages are required for chat completion');
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    const messageText = typeof userMessage.content === 'string' 
      ? userMessage.content 
      : userMessage.content?.map(c => c.text || '').join(' ') || '';

    const requestBody = {
      assistant: this.assistantName,
      messages: [
        {
          role: 'user',
          content: messageText
        }
      ],
      stream: stream,
      model: 'gpt-4'  // Pinecone Assistant uses GPT-4 by default
    };

    if (this.debug) {
      logger.debug('[PineconeClient] Request:', requestBody);
    }

    try {
      if (!stream) {
        // Non-streaming request
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: this.abortController?.signal,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Pinecone API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return {
          choices: [{
            message: {
              role: 'assistant',
              content: data.message || data.content || ''
            }
          }]
        };
      }

      // Streaming request using SSE
      return new Promise((resolve, reject) => {
        const eventSource = new SSE(this.baseURL, {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.apiKey,
          },
          payload: JSON.stringify(requestBody),
          method: 'POST',
        });

        let fullContent = '';
        let messageId = null;

        eventSource.addEventListener('message', (event) => {
          if (this.debug) {
            logger.debug('[PineconeClient] SSE Event:', event.data);
          }

          try {
            // Handle different event types from Pinecone
            if (event.data === '[DONE]') {
              eventSource.close();
              resolve({
                choices: [{
                  message: {
                    role: 'assistant',
                    content: fullContent
                  }
                }]
              });
              return;
            }

            const data = JSON.parse(event.data);
            
            // Handle Pinecone streaming format
            if (data.choices && data.choices[0]) {
              const delta = data.choices[0].delta;
              if (delta && delta.content) {
                fullContent += delta.content;
                if (onProgress) {
                  onProgress(delta.content);
                }
              }
            } else if (data.content) {
              // Alternative format
              fullContent += data.content;
              if (onProgress) {
                onProgress(data.content);
              }
            } else if (data.message) {
              // Non-delta format
              fullContent = data.message;
              if (onProgress) {
                onProgress(data.message);
              }
            }

            // Store message ID if provided
            if (data.id) {
              messageId = data.id;
            }
          } catch (parseError) {
            logger.error('[PineconeClient] Error parsing SSE data:', parseError);
          }
        });

        eventSource.addEventListener('error', (error) => {
          logger.error('[PineconeClient] SSE Error:', error);
          eventSource.close();
          reject(new Error(`Pinecone streaming error: ${error.message || 'Unknown error'}`));
        });

        // Handle abort
        if (this.abortController) {
          this.abortController.signal.addEventListener('abort', () => {
            eventSource.close();
            reject(new Error('Request aborted'));
          });
        }

        eventSource.stream();
      });
    } catch (error) {
      logger.error('[PineconeClient] Chat completion error:', error);
      throw error;
    }
  }

  // Generate a response (compatibility method)
  async generateChatCompletion(payload) {
    return this.chatCompletion(payload, null);
  }

  // Get available models (returns Pinecone assistant info)
  async getModels() {
    return {
      data: [
        {
          id: 'thrive-coach',
          object: 'model',
          created: Date.now(),
          owned_by: 'pinecone',
          permission: [],
          root: 'thrive-coach',
          parent: null,
        }
      ]
    };
  }
}

const initializeClient = async ({ req, res, endpointOption }) => {
  const { key, endpoint, model } = req.body;
  
  // Extract API key from endpoint option or use environment variable
  const apiKey = endpointOption?.apiKey || process.env.PINECONE_API_KEY;
  
  if (process.env.DEBUG === 'true') {
    logger.debug('[PineconeClient] Initializing with:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      endpointOption,
      bodyKeys: Object.keys(req.body || {})
    });
  }
  
  if (!apiKey) {
    throw new Error('Pinecone API key is required');
  }

  const clientOptions = {
    baseURL: endpointOption?.baseURL,
    assistantName: endpointOption?.customEndpoint?.assistantName || 'thrive-coach',
    req,
    res,
    abortController: req.abortController,
    debug: process.env.DEBUG === 'true'
  };

  const client = new PineconeClient(apiKey, clientOptions);

  return {
    client,
    openAIApiKey: apiKey,
    openAIBaseURL: clientOptions.baseURL,
  };
};

module.exports = initializeClient;