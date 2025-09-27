const express = require('express');
const EditController = require('~/server/controllers/EditController');
const { initializeClient } = require('~/server/services/Endpoints/custom');
const { addTitle } = require('~/server/services/Endpoints/openAI');
const {
  handleAbort,
  setHeaders,
  validateModel,
  validateEndpoint,
  buildEndpointOption,
} = require('~/server/middleware');

const router = express.Router();

router.post(
  '/',
  validateEndpoint,
  validateModel,
  buildEndpointOption,
  setHeaders,
  async (req, res, next) => {
    const { logger } = require('@librechat/data-schemas');
    
    // Log incoming request details
    logger.info('[Custom Route] Incoming request:', {
      endpoint: req.endpointOption?.endpoint,
      assistantName: req.endpointOption?.customEndpoint?.assistantName,
      hasMessages: !!req.body?.messages,
      messageCount: req.body?.messages?.length,
      bodyKeys: Object.keys(req.body || {}),
      endpointOptionKeys: Object.keys(req.endpointOption || {})
    });
    
    // Check if this is a Pinecone Assistant request
    if (req.endpointOption?.endpoint === 'Pinecone Assistant' || 
        req.endpointOption?.customEndpoint?.assistantName === 'thrive-coach') {
      
      logger.info('[Custom Route] Routing to Pinecone handler');
      
      // Use Pinecone handler directly
      const pineconeInitialize = require('~/server/services/Endpoints/pinecone');
      const { sendEvent } = require('@librechat/api');
      const { Constants } = require('librechat-data-provider');
      
      try {
        const { client } = await pineconeInitialize.initializeClient({ req, res, endpointOption: req.endpointOption });
        
        const { messages, stream = true } = req.body;
        
        // Set SSE headers for streaming
        if (stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');
        }

        const messageId = req.body.messageId || Constants.USE_PRELIM_RESPONSE_MESSAGE_ID;
        const conversationId = req.body.conversationId;

        // Send initial message event
        sendEvent(res, {
          event: 'message',
          data: {
            messageId,
            conversationId,
            text: '',
            sender: 'ThriveCoach',
            isCreatedByUser: false,
            parentMessageId: req.body.parentMessageId,
            model: 'thrive-coach',
          }
        });

        let fullResponse = '';

        // Progress callback for streaming
        const onProgress = (text) => {
          fullResponse += text;
          sendEvent(res, {
            event: 'text',
            data: {
              text: fullResponse,
              messageId,
            }
          });
        };

        // Make the chat completion request
        const response = await client.chatCompletion(
          {
            messages,
            stream
          },
          stream ? onProgress : null
        );

        if (!stream) {
          // Non-streaming response
          const content = response.choices[0]?.message?.content || '';
          sendEvent(res, {
            event: 'text',
            data: {
              text: content,
              messageId,
            }
          });
          fullResponse = content;
        }

        // Send final message
        sendEvent(res, {
          event: 'message',
          data: {
            messageId,
            conversationId,
            text: fullResponse,
            sender: 'ThriveCoach',
            isCreatedByUser: false,
            parentMessageId: req.body.parentMessageId,
            model: 'thrive-coach',
            finish_reason: 'stop',
          }
        });

        // Send done event
        sendEvent(res, { event: 'done', data: '[DONE]' });

        // Generate title if needed
        if (req.body.isNewConversation) {
          await pineconeInitialize.addTitle(req, {
            text: messages[messages.length - 1]?.content || '',
            response: { conversationId },
            client
          });
        }

        res.end();
      } catch (error) {
        logger.error('[Pinecone Custom Route] Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          body: req.body,
          endpoint: req.endpointOption
        });
        
        // Send more detailed error to client
        sendEvent(res, {
          event: 'error',
          data: {
            message: error.message || 'An error occurred while processing your request',
            type: 'api_error',
            details: process.env.DEBUG === 'true' ? {
              errorName: error.name,
              errorMessage: error.message,
              endpoint: req.endpointOption?.endpoint
            } : undefined
          }
        });
        
        res.end();
      }
      return;
    }
    
    // Otherwise use standard custom endpoint handler
    await EditController(req, res, next, initializeClient, addTitle);
  },
);

module.exports = router;
