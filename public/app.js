class TechnicalSupportApp {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.isRecording = false;
        this.isConnected = false;
        this.audioChunks = [];
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.connectBtn = document.getElementById('connectBtn');
        this.pushToTalkBtn = document.getElementById('pushToTalkBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.imageInput = document.getElementById('imageInput');
        this.textInput = document.getElementById('textInput');
        this.sendTextBtn = document.getElementById('sendTextBtn');
        this.chatContainer = document.getElementById('chatContainer');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.audioVisualizer = document.getElementById('audioVisualizer');
        this.visualizerCanvas = document.getElementById('visualizerCanvas');
    }

    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.toggleConnection());
        
        this.pushToTalkBtn.addEventListener('mousedown', () => this.startRecording());
        this.pushToTalkBtn.addEventListener('mouseup', () => this.stopRecording());
        this.pushToTalkBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        this.pushToTalkBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        this.imageBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        this.sendTextBtn.addEventListener('click', () => this.sendTextMessage());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendTextMessage();
        });
    }

    async toggleConnection() {
        if (this.isConnected) {
            this.disconnect();
        } else {
            await this.connect();
        }
    }

    async connect() {
        try {
            this.updateStatus('Connecting...', 'connecting');
            
            // Connect to WebSocket server
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = async () => {
                console.log('WebSocket connected');
                
                // Request microphone permission
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.setupAudioContext(stream);
                    
                    // Send start message to server
                    this.ws.send(JSON.stringify({ type: 'start' }));
                    
                } catch (error) {
                    console.error('Microphone permission denied:', error);
                    this.addMessage('system', 'Microphone access denied. Voice chat will not be available.');
                }
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('Connection error', 'error');
                this.addMessage('system', 'Connection error occurred. Please try again.');
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.handleDisconnect();
            };

        } catch (error) {
            console.error('Connection error:', error);
            this.updateStatus('Failed to connect', 'error');
            this.addMessage('system', 'Failed to connect to server. Please check your connection.');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'stop' }));
            this.ws.close();
        }
        this.handleDisconnect();
    }

    handleDisconnect() {
        this.isConnected = false;
        this.updateStatus('Disconnected', 'disconnected');
        this.connectBtn.textContent = 'Connect';
        this.connectBtn.classList.remove('btn-danger');
        this.connectBtn.classList.add('btn-primary');
        
        this.pushToTalkBtn.disabled = true;
        this.imageBtn.disabled = true;
        this.textInput.disabled = true;
        this.sendTextBtn.disabled = true;
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    setupAudioContext(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(stream);
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        source.connect(this.analyser);
        
        // Setup MediaRecorder for audio capture
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.audioChunks = [];
            
            // Convert to base64 and send to server
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result.split(',')[1];
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'audio',
                        audio: base64Audio
                    }));
                }
            };
            reader.readAsDataURL(audioBlob);
            
            this.audioVisualizer.classList.remove('active');
        };
    }

    startRecording() {
        if (!this.isConnected || !this.mediaRecorder) return;
        
        this.isRecording = true;
        this.audioChunks = [];
        this.mediaRecorder.start();
        this.pushToTalkBtn.classList.add('active');
        this.pushToTalkBtn.innerHTML = '<span class="mic-icon">🔴</span><span>Recording...</span>';
        
        this.audioVisualizer.classList.add('active');
        this.visualizeAudio();
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.mediaRecorder.stop();
        this.pushToTalkBtn.classList.remove('active');
        this.pushToTalkBtn.innerHTML = '<span class="mic-icon">🎤</span><span>Push to Talk</span>';
    }

    visualizeAudio() {
        if (!this.isRecording) return;
        
        const canvas = this.visualizerCanvas;
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const draw = () => {
            if (!this.isRecording) return;
            
            requestAnimationFrame(draw);
            
            this.analyser.getByteTimeDomainData(dataArray);
            
            canvasCtx.fillStyle = '#f8fafc';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#2563eb';
            canvasCtx.beginPath();
            
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };
        
        draw();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Display image in chat
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgData = e.target.result;
            this.addMessage('user', 'Uploaded an image for analysis', imgData);
            
            // Send to server
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'image',
                    image: imgData,
                    description: 'I need help with this technical issue. Please analyze this image and provide guidance.'
                }));
            }
        };
        reader.readAsDataURL(file);
        
        // Reset input
        event.target.value = '';
    }

    sendTextMessage() {
        const text = this.textInput.value.trim();
        if (!text || !this.isConnected) return;
        
        this.addMessage('user', text);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'text',
                text: text
            }));
        }
        
        this.textInput.value = '';
    }

    handleServerMessage(data) {
        console.log('Server message:', data);
        
        switch (data.type) {
            case 'status':
                if (data.status === 'connected') {
                    this.isConnected = true;
                    this.updateStatus('Connected', 'connected');
                    this.connectBtn.textContent = 'Disconnect';
                    this.connectBtn.classList.remove('btn-primary');
                    this.connectBtn.classList.add('btn-danger');
                    
                    this.pushToTalkBtn.disabled = false;
                    this.imageBtn.disabled = false;
                    this.textInput.disabled = false;
                    this.sendTextBtn.disabled = false;
                    
                    // Clear welcome message
                    const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
                    if (welcomeMsg) welcomeMsg.remove();
                    
                    this.addMessage('system', data.message || 'Connected to support agent');
                }
                break;
                
            case 'error':
                this.addMessage('system', `Error: ${data.message}`);
                break;
                
            case 'response.audio_transcript.delta':
                // User's speech transcription
                if (data.delta) {
                    this.updateOrAddTranscript('user', data.delta);
                }
                break;
                
            case 'response.audio_transcript.done':
                // Complete user transcription
                if (data.transcript) {
                    this.finalizeTranscript('user', data.transcript);
                }
                break;
                
            case 'response.text.delta':
                // Assistant's text response (streaming)
                if (data.delta) {
                    this.updateOrAddTranscript('assistant', data.delta);
                }
                break;
                
            case 'response.text.done':
                // Complete assistant response
                if (data.text) {
                    this.finalizeTranscript('assistant', data.text);
                }
                break;
                
            case 'response.audio.delta':
                // Play audio response (if implementing audio playback)
                this.playAudioDelta(data.delta);
                break;
                
            case 'response.done':
                // Response complete
                console.log('Response completed');
                break;
                
            case 'conversation.item.created':
                // New conversation item
                if (data.item && data.item.type === 'message') {
                    const content = data.item.content?.[0];
                    if (content?.text) {
                        this.addMessage(data.item.role, content.text);
                    }
                }
                break;
        }
    }

    updateOrAddTranscript(role, delta) {
        const lastMessage = this.chatContainer.lastElementChild;
        
        if (lastMessage && lastMessage.classList.contains(role) && lastMessage.dataset.streaming === 'true') {
            // Append to existing message
            const content = lastMessage.querySelector('.message-content');
            content.textContent += delta;
        } else {
            // Create new message
            const messageDiv = this.createMessageElement(role, delta);
            messageDiv.dataset.streaming = 'true';
            this.chatContainer.appendChild(messageDiv);
            this.scrollToBottom();
        }
    }

    finalizeTranscript(role, text) {
        const lastMessage = this.chatContainer.lastElementChild;
        
        if (lastMessage && lastMessage.classList.contains(role) && lastMessage.dataset.streaming === 'true') {
            const content = lastMessage.querySelector('.message-content');
            content.textContent = text;
            delete lastMessage.dataset.streaming;
        }
    }

    addMessage(role, text, imageData = null) {
        const messageDiv = this.createMessageElement(role, text, imageData);
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    createMessageElement(role, text, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        if (imageData) {
            const img = document.createElement('img');
            img.src = imageData;
            img.className = 'message-image';
            messageDiv.appendChild(img);
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        messageDiv.appendChild(contentDiv);
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timestamp);
        
        return messageDiv;
    }

    playAudioDelta(audioData) {
        // Implement audio playback if needed
        // This would require decoding the base64 audio and playing it
        console.log('Audio delta received');
    }

    updateStatus(text, status) {
        this.statusText.textContent = text;
        this.statusIndicator.className = 'status-indicator ' + status;
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TechnicalSupportApp();
});
