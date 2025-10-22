# Quick Setup Guide

## Prerequisites
- Node.js v18 or higher installed
- OpenAI API key with access to GPT-4o Realtime API

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

### 3. Start the Server
```bash
npm start
```

The application will be running at `http://localhost:3000`

## Using the Application

### Connect to the Agent
1. Open `http://localhost:3000` in your browser
2. Click the "Connect" button
3. Allow microphone access when prompted

### Voice Support
- **Press and hold** the "Push to Talk" button
- Speak your technical issue
- **Release** when done speaking
- The agent will respond with both voice and text

### Image Analysis
1. Click "📷 Upload Image"
2. Select a screenshot or photo of your technical issue
3. The agent will analyze the image and provide guidance

### Text Chat
- Type your question in the text box
- Press Enter or click "Send"
- Get instant text responses

## Features

### Built-in Tools
The agent has access to several specialized tools:
- **System Information**: Browser, OS, network, hardware details
- **Troubleshooting Steps**: Guides for common issues (internet, software crashes, performance, etc.)
- **Compatibility Checker**: Software/hardware compatibility verification
- **Error Code Lookup**: Search for error code meanings
- **Custom Solutions**: Tailored solutions for your specific problems

### Supported Issue Types
- Internet connection problems
- Software crashes and errors
- Slow system performance
- Login and authentication issues
- Printer problems
- Audio/video issues
- Display problems
- And more!

## Troubleshooting

### "Connection Failed"
- Verify your OpenAI API key is correct in `.env`
- Ensure you have access to the Realtime API
- Check your internet connection

### "Microphone Access Denied"
- Click the lock icon in your browser's address bar
- Allow microphone access for the site
- Refresh the page and try again

### Port Already in Use
```bash
# Change the port in .env
PORT=3001
```

## Security Notes

⚠️ **Important**: 
- Never commit your `.env` file
- Keep your API key secure
- Use HTTPS in production
- Monitor API usage to control costs

## Development

For auto-restart during development:
```bash
npm run dev
```

## Need Help?
- Check the main README.md for detailed documentation
- Review OpenAI's Realtime API documentation
- Open an issue on GitHub if you encounter problems

---

Happy troubleshooting! 🛠️
