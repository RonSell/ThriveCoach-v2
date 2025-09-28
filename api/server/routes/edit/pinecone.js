const express = require('express');
const { logger } = require('@librechat/data-schemas');
const { sendEvent } = require('@librechat/api');
const { ContentTypes, Constants } = require('librechat-data-provider');
const EditController = require('~/server/controllers/EditController');
const { initializeClient, addTitle } = require('~/server/services/Endpoints/pinecone');
const { setHeaders, validateEndpoint, buildEndpointOption } = require('~/server/middleware');

const router = express.Router();

// Custom handler for Pinecone streaming
const handlePineconeStream = async (req, res, next) => {
  try {
    const { client, openAIApiKey } = await initializeClient({ req, res, endpointOption: req.endpointOption });
    
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
        sender: 'Thrive Coach',
        isCreatedByUser: false,
        parentMessageId: req.body.parentMessageId,
        model: 'gpt-4o',
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
        model: 'gpt-4o',
        finish_reason: 'stop',
      }
    });

    // Send done event
    sendEvent(res, { event: 'done', data: '[DONE]' });

    // Generate title if needed
    if (req.body.isNewConversation) {
      await addTitle(req, {
        text: messages[messages.length - 1]?.content || '',
        response: { conversationId },
        client
      });
    }

    res.end();
  } catch (error) {
    logger.error('[Pinecone Route] Error:', {
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
};

// Route handler
router.post(
  '/',
  validateEndpoint,
  buildEndpointOption,
  setHeaders,
  handlePineconeStream
);

module.exports = router;