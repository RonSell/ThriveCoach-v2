# MongoDB Setup for LibreChat

LibreChat requires MongoDB to run. You have two options:

## Option 1: MongoDB Atlas (Recommended - Free Cloud Database)

### Quick Setup Steps:

1. **Sign up for MongoDB Atlas** (free):
   - Go to https://www.mongodb.com/atlas
   - Create a free account
   - Choose "FREE Shared" tier (M0 Sandbox)

2. **Create a cluster**:
   - Select your preferred cloud provider (any works)
   - Choose closest region to you
   - Click "Create Cluster"

3. **Set up database access**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `librechat`
   - Password: Choose a secure password (save this!)
   - Database User Privileges: "Read and write to any database"

4. **Configure network access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: For production, add only your specific IP

5. **Get your connection string**:
   - Go back to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string, it looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
     ```

6. **Update your .env file**:
   Replace the MONGO_URI line with:
   ```
   MONGO_URI=mongodb+srv://librechat:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/LibreChat?retryWrites=true&w=majority
   ```
   - Replace `YOUR_PASSWORD` with the password you created
   - Replace `cluster0.xxxxx` with your actual cluster address

## Option 2: Local MongoDB

### For macOS:
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
```

### For Windows:
Download and install from: https://www.mongodb.com/try/download/community

### For Linux:
Follow instructions at: https://www.mongodb.com/docs/manual/administration/install-on-linux/

## Verify Connection

After setting up MongoDB (either option), run:
```bash
npm run backend
```

You should see:
- "MongoDB connected" message
- Server starting on port 3080

## Troubleshooting

### Connection Refused Error:
- **Local**: Make sure MongoDB service is running
- **Atlas**: Check your IP is whitelisted in Network Access

### Authentication Failed:
- Double-check username and password in connection string
- Ensure no special characters need URL encoding

### Network Timeout:
- Atlas: Verify Network Access allows your IP
- Check firewall settings

## Next Steps

Once MongoDB is connected:
1. Run `npm run backend` in one terminal
2. Run `npm run frontend:dev` in another terminal
3. Access http://localhost:3090
4. Create an account and select "Pinecone Assistant" to use ThriveCoach