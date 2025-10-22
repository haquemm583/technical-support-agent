# 🛠️ Technical Support Agent

An AI-powered conversational technical support agent built with OpenAI's GPT-4o Realtime API. This web application provides real-time voice conversations, image analysis, and text-based support for technical issues.

## Features

- 🎤 **Voice Conversations**: Push-to-talk interface for hands-free technical support
- 🖼️ **Image Analysis**: Upload screenshots of error messages or technical problems for instant analysis
- 💬 **Text Chat**: Type your questions for text-based support
- 🔧 **Built-in Tools**: Access to system diagnostics, troubleshooting guides, error code lookup, and more
- 🌊 **Real-time Streaming**: Get responses as they're generated
- 🎨 **Modern UI**: Clean, responsive interface that works on desktop and mobile

## Prerequisites

- Node.js (v18 or higher)
- An OpenAI API key with access to GPT-4o Realtime API

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/haquemm583/technical-support-agent.git
cd technical-support-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### 4. Start the Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Connecting to the Agent

1. Open your browser and navigate to `http://localhost:3000`
2. Click the "Connect" button to start a session
3. Grant microphone permissions when prompted (for voice features)

### Voice Support

- **Hold** the "Push to Talk" button while speaking
- **Release** the button when you're done
- The agent will respond with voice and text

### Image Analysis

1. Click the "📷 Upload Image" button
2. Select a screenshot or photo of your technical issue
3. The agent will analyze the image and provide guidance

### Text Chat

- Type your question in the text input field
- Press Enter or click "Send"

## Available Tools

The support agent has access to several built-in tools:

- **System Information**: Get details about browsers, OS, network, and hardware
- **Troubleshooting Steps**: Step-by-step guides for common issues
- **Compatibility Checker**: Verify software/hardware compatibility
- **Error Code Lookup**: Search for error code meanings and solutions
- **Custom Solutions**: Get tailored solutions based on your specific problem

## Project Structure

```
technical-support-agent/
├── public/
│   ├── index.html       # Main HTML file
│   ├── styles.css       # CSS styles
│   └── app.js          # Frontend JavaScript
├── server.js           # Express server and WebSocket handler
├── realtime-client.js  # OpenAI Realtime API client
├── package.json        # Project dependencies
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Technology Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: OpenAI GPT-4o Realtime API
- **Audio**: Web Audio API, MediaRecorder API

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Troubleshooting

### Connection Issues

- Ensure your OpenAI API key is valid and has access to the Realtime API
- Check that port 3000 is not in use by another application
- Verify your internet connection is stable

### Microphone Not Working

- Check browser permissions for microphone access
- Ensure you're using HTTPS or localhost (required for media access)
- Try a different browser (Chrome, Firefox, Safari, or Edge recommended)

### Audio Issues

- Verify your speakers/headphones are working
- Check system volume settings
- Try refreshing the page and reconnecting

## Security Notes

- Never commit your `.env` file or expose your API key
- Use HTTPS in production environments
- Implement rate limiting for production use
- Consider adding authentication for public deployments

## API Costs

This application uses OpenAI's Realtime API, which has usage-based pricing. Monitor your usage in the OpenAI dashboard to avoid unexpected costs.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OpenAI's Realtime API documentation
3. Open an issue on GitHub

## Acknowledgments

- Built with OpenAI's GPT-4o Realtime API
- Inspired by the need for accessible, conversational technical support

---

Made with ❤️ for better technical support experiences