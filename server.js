import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RealtimeClient } from './realtime-client.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure to create a .env file with your OPENAI_API_KEY`);
});

// WebSocket server for real-time communication
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  const realtimeClient = new RealtimeClient(process.env.OPENAI_API_KEY);
  
  // Handle messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start') {
        // Initialize realtime connection
        await realtimeClient.connect((event) => {
          // Forward OpenAI events to client
          ws.send(JSON.stringify(event));
        });
        
        ws.send(JSON.stringify({ 
          type: 'status', 
          status: 'connected',
          message: 'Connected to Technical Support Agent'
        }));
      } else if (data.type === 'audio') {
        // Forward audio data to OpenAI
        await realtimeClient.sendAudio(data.audio);
      } else if (data.type === 'image') {
        // Send image for analysis
        await realtimeClient.sendImage(data.image, data.description || 'Please analyze this technical issue');
      } else if (data.type === 'text') {
        // Send text message
        await realtimeClient.sendText(data.text);
      } else if (data.type === 'stop') {
        // Disconnect
        realtimeClient.disconnect();
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    realtimeClient.disconnect();
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});
