const { getResponseSender } = require('librechat-data-provider');
const { sendMessage, createOnProgress } = require('~/server/utils');

const addTitle = async (req, { text, response, client }) => {
  const { conversationId } = response;
  const title = 'ThriveCoach Session';
  
  // Use a simple title generation or just use a default
  // Since Pinecone Assistant is specialized, we can use context-aware titles
  const titleText = text.length > 50 ? text.substring(0, 50) + '...' : text;
  
  await req.app.locals.services.Conversations.update(conversationId, { title: titleText });
  
  return {
    title: titleText
  };
};

module.exports = addTitle;