const https = require('https');

// Test Pinecone API directly
const testPineconeAPI = async () => {
  const apiKey = 'pcsk_6QWEna_SDWGWn5Nm9ngjYns5UcFHFBBnV3K39fRjkbE6cXW9QRmUnErmE1ugqwoQ7UxsYW';
  
  const requestBody = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Hello, this is a test message'
      }
    ],
    stream: false,
    model: 'gpt-4o'
  });

  const options = {
    hostname: 'prod-1-data.ke.pinecone.io',
    path: '/assistant/chat/thrive-coach',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'Content-Length': requestBody.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Response:', data);
        
        if (res.statusCode !== 200) {
          console.error('Error response from Pinecone API');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
};

console.log('Testing Pinecone API connection...');
testPineconeAPI()
  .then(() => console.log('Test complete'))
  .catch((err) => console.error('Test failed:', err));