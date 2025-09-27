# Pinecone Assistant Integration for LibreChat

## Overview
This integration connects LibreChat with the Pinecone Assistant API (ThriveCoach) to provide personal development and coaching capabilities through the LibreChat interface.

## What Was Implemented

### 1. Configuration (`librechat.yaml`)
- Added Pinecone Assistant as a custom endpoint
- Configured MCP server connection for real-time streaming
- Set up authentication with Pinecone API key

### 2. Backend Integration
Created the following files to handle Pinecone integration:
- `api/server/services/Endpoints/pinecone/initialize.js` - Pinecone client initialization
- `api/server/services/Endpoints/pinecone/build.js` - Request builder
- `api/server/services/Endpoints/pinecone/title.js` - Title generation
- `api/server/routes/edit/pinecone.js` - Route handler for chat requests

### 3. Frontend Updates
- Added Pinecone icon to assets (`client/public/assets/pinecone.png`)
- Updated `MessageEndpointIcon.tsx` to display Pinecone/ThriveCoach branding

### 4. Environment Configuration (`.env`)
Created environment file with:
- Pinecone API key configuration
- Server settings
- MongoDB connection string

## Setup Instructions

### Prerequisites
1. **MongoDB**: You need MongoDB running locally or use MongoDB Atlas (free tier)
   - Local: Install MongoDB and run `mongod`
   - Atlas: Get a free connection string from [MongoDB Atlas](https://www.mongodb.com/atlas)

2. **Node.js**: Version 16.x or higher

### Installation Steps

1. **Install dependencies:**
   ```bash
   cd "/Users/ronsell/GitHub Projects/ThriveCoach-v2"
   npm install --cache /tmp/npm-cache
   ```

2. **Update MongoDB connection:**
   Edit `.env` file and update `MONGO_URI` with your MongoDB connection string:
   ```
   MONGO_URI=mongodb://localhost:27017/LibreChat  # For local MongoDB
   # OR
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/LibreChat  # For MongoDB Atlas
   ```

3. **Start the backend server:**
   ```bash
   npm run backend
   ```

4. **In a new terminal, build and start the frontend:**
   ```bash
   npm run frontend:dev
   ```

5. **Access the application:**
   Open http://localhost:3090 in your browser

## Using ThriveCoach

1. Register/Login to LibreChat
2. Select "Pinecone Assistant" from the endpoint dropdown menu
3. Start chatting with ThriveCoach for personal development guidance

## Architecture

The integration follows LibreChat's custom endpoint pattern:
- **SSE Streaming**: Real-time responses using Server-Sent Events
- **MCP Protocol**: Leverages Model Context Protocol for tool integration
- **Custom Client**: Dedicated Pinecone client handles API communication
- **Route Handler**: Processes chat requests and manages streaming responses

## Files Modified/Created

### Created:
- `/librechat.yaml` - Main configuration
- `/.env` - Environment variables
- `/api/server/services/Endpoints/pinecone/` - Pinecone service modules
- `/api/server/routes/edit/pinecone.js` - Route handler
- `/client/public/assets/pinecone.png` - Pinecone icon
- `/PINECONE_INTEGRATION.md` - This documentation

### Modified:
- `/api/server/routes/edit/index.js` - Added Pinecone route
- `/client/src/components/Endpoints/MessageEndpointIcon.tsx` - Added Pinecone icon display

## API Details

- **Endpoint URL**: https://prod-1-data.ke.pinecone.io/assistant/chat
- **MCP Server**: https://prod-1-data.ke.pinecone.io/mcp/assistants/thrive-coach
- **Assistant Name**: thrive-coach
- **Authentication**: API key in headers

## Troubleshooting

1. **MongoDB Connection Issues:**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - For Atlas, whitelist your IP address

2. **Port Already in Use:**
   - Backend runs on port 3080
   - Frontend runs on port 3090
   - Kill existing processes: `lsof -ti:3080 | xargs kill`

3. **API Key Issues:**
   - Verify Pinecone API key in `.env`
   - Check key format and permissions

## Next Steps

To fully test the integration:
1. Set up MongoDB
2. Start both backend and frontend
3. Create a user account
4. Select Pinecone Assistant and start chatting

The integration is ready for use once MongoDB is configured and the services are running.