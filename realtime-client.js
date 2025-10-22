import WebSocket from 'ws';

export class RealtimeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ws = null;
    this.onEvent = null;
  }

  async connect(onEvent) {
    this.onEvent = onEvent;
    
    return new Promise((resolve, reject) => {
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
      
      this.ws = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      this.ws.on('open', () => {
        console.log('Connected to OpenAI Realtime API');
        
        // Configure session with tools
        this.ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are a helpful technical support agent. Your role is to:
- Help users troubleshoot technical issues with their devices, software, and systems
- Analyze images of error messages, screens, or hardware problems
- Provide step-by-step guidance for resolving issues
- Suggest common solutions and best practices
- Be patient, clear, and thorough in your explanations
- Ask clarifying questions when needed
- Use the available tools to help diagnose and resolve issues

When users send images, carefully analyze them and provide specific guidance based on what you see.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [
              {
                type: 'function',
                name: 'get_system_info',
                description: 'Get information about common system configurations and requirements',
                parameters: {
                  type: 'object',
                  properties: {
                    component: {
                      type: 'string',
                      enum: ['browser', 'operating_system', 'network', 'hardware'],
                      description: 'The system component to get information about'
                    }
                  },
                  required: ['component']
                }
              },
              {
                type: 'function',
                name: 'troubleshooting_steps',
                description: 'Get step-by-step troubleshooting instructions for common technical issues',
                parameters: {
                  type: 'object',
                  properties: {
                    issue_type: {
                      type: 'string',
                      enum: ['internet_connection', 'software_crash', 'slow_performance', 'login_issues', 'printer_problems', 'audio_issues', 'display_issues'],
                      description: 'The type of technical issue to troubleshoot'
                    }
                  },
                  required: ['issue_type']
                }
              },
              {
                type: 'function',
                name: 'check_compatibility',
                description: 'Check software/hardware compatibility and requirements',
                parameters: {
                  type: 'object',
                  properties: {
                    software: {
                      type: 'string',
                      description: 'The software name to check compatibility for'
                    },
                    version: {
                      type: 'string',
                      description: 'The software version (optional)'
                    }
                  },
                  required: ['software']
                }
              },
              {
                type: 'function',
                name: 'error_code_lookup',
                description: 'Look up information about error codes and messages',
                parameters: {
                  type: 'object',
                  properties: {
                    error_code: {
                      type: 'string',
                      description: 'The error code or message to look up'
                    },
                    context: {
                      type: 'string',
                      description: 'Additional context about where the error occurred (optional)'
                    }
                  },
                  required: ['error_code']
                }
              },
              {
                type: 'function',
                name: 'suggest_solution',
                description: 'Generate a customized solution based on the problem description',
                parameters: {
                  type: 'object',
                  properties: {
                    problem: {
                      type: 'string',
                      description: 'Description of the technical problem'
                    },
                    attempted_solutions: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Solutions that have already been attempted (optional)'
                    }
                  },
                  required: ['problem']
                }
              }
            ],
            tool_choice: 'auto',
            temperature: 0.8
          }
        }));
        
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString());
          
          // Handle function calls
          if (event.type === 'response.function_call_arguments.done') {
            this.handleFunctionCall(event);
          }
          
          // Forward all events to the client
          if (this.onEvent) {
            this.onEvent(event);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from OpenAI Realtime API');
      });
    });
  }

  async handleFunctionCall(event) {
    const { call_id, name, arguments: args } = event;
    let result = '';

    try {
      const parsedArgs = JSON.parse(args);
      
      switch (name) {
        case 'get_system_info':
          result = this.getSystemInfo(parsedArgs.component);
          break;
        case 'troubleshooting_steps':
          result = this.getTroubleshootingSteps(parsedArgs.issue_type);
          break;
        case 'check_compatibility':
          result = this.checkCompatibility(parsedArgs.software, parsedArgs.version);
          break;
        case 'error_code_lookup':
          result = this.errorCodeLookup(parsedArgs.error_code, parsedArgs.context);
          break;
        case 'suggest_solution':
          result = this.suggestSolution(parsedArgs.problem, parsedArgs.attempted_solutions);
          break;
        default:
          result = 'Function not implemented';
      }

      // Send function result back to OpenAI
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: call_id,
          output: JSON.stringify(result)
        }
      }));

      // Generate response based on function result
      this.ws.send(JSON.stringify({
        type: 'response.create'
      }));
    } catch (error) {
      console.error('Error handling function call:', error);
    }
  }

  getSystemInfo(component) {
    const info = {
      browser: {
        summary: 'Browser Information',
        details: 'Common browsers: Chrome, Firefox, Safari, Edge. Check version by going to Settings > About or Help > About.',
        tips: ['Clear cache and cookies', 'Disable extensions', 'Try incognito/private mode', 'Update to latest version']
      },
      operating_system: {
        summary: 'Operating System Information',
        details: 'Major OS: Windows, macOS, Linux. Check version: Windows (Settings > System > About), macOS (Apple menu > About This Mac), Linux (Settings > About)',
        tips: ['Keep OS updated', 'Check for driver updates', 'Run system diagnostics', 'Free up disk space']
      },
      network: {
        summary: 'Network Configuration',
        details: 'Check connection type (WiFi/Ethernet), signal strength, router status',
        tips: ['Restart router and modem', 'Check cable connections', 'Test with other devices', 'Run speed test', 'Check firewall settings']
      },
      hardware: {
        summary: 'Hardware Information',
        details: 'CPU, RAM, storage, graphics card specifications',
        tips: ['Check system requirements', 'Monitor temperature', 'Clean dust from vents', 'Check for physical damage']
      }
    };

    return info[component] || { summary: 'Component not found', details: '', tips: [] };
  }

  getTroubleshootingSteps(issueType) {
    const steps = {
      internet_connection: [
        'Check if other devices can connect to the internet',
        'Restart your router and modem (unplug for 30 seconds)',
        'Forget and reconnect to the WiFi network',
        'Check if airplane mode is off',
        'Run network troubleshooter',
        'Update network drivers',
        'Contact ISP if issue persists'
      ],
      software_crash: [
        'Note any error messages that appear',
        'Close and restart the application',
        'Check for software updates',
        'Run the application as administrator',
        'Check system logs for errors',
        'Temporarily disable antivirus',
        'Reinstall the application if needed'
      ],
      slow_performance: [
        'Check CPU and memory usage in Task Manager',
        'Close unnecessary programs and browser tabs',
        'Run disk cleanup to free up space',
        'Disable startup programs',
        'Update device drivers',
        'Check for malware',
        'Consider hardware upgrade if needed'
      ],
      login_issues: [
        'Verify username and password are correct',
        'Check Caps Lock is off',
        'Try password reset if available',
        'Clear browser cache and cookies',
        'Try different browser',
        'Check if account is locked or suspended',
        'Contact account support if needed'
      ],
      printer_problems: [
        'Check printer is powered on and connected',
        'Verify paper and ink/toner levels',
        'Check for paper jams',
        'Restart printer and computer',
        'Update printer drivers',
        'Run printer troubleshooter',
        'Check print queue for stuck jobs'
      ],
      audio_issues: [
        'Check volume is turned up and not muted',
        'Verify correct audio device is selected',
        'Check cable connections',
        'Update audio drivers',
        'Run audio troubleshooter',
        'Test with different audio source',
        'Check Windows audio services are running'
      ],
      display_issues: [
        'Check cable connections (HDMI, DisplayPort, etc.)',
        'Try different cable or port',
        'Adjust display resolution and refresh rate',
        'Update graphics drivers',
        'Check monitor power and input source',
        'Test with different monitor if available',
        'Check for physical damage'
      ]
    };

    return {
      issue: issueType.replace(/_/g, ' '),
      steps: steps[issueType] || ['Contact technical support for assistance']
    };
  }

  checkCompatibility(software, version) {
    return {
      software: software,
      version: version || 'latest',
      recommendations: [
        'Check the official website for system requirements',
        'Ensure your operating system is supported',
        'Verify you have sufficient RAM and storage',
        'Check for required dependencies',
        'Consider 32-bit vs 64-bit compatibility'
      ],
      note: 'For specific compatibility information, please visit the software vendor\'s website or documentation.'
    };
  }

  errorCodeLookup(errorCode, context) {
    return {
      error_code: errorCode,
      context: context || 'general',
      guidance: 'Error codes can vary by application and system. Here are general steps:',
      steps: [
        'Search for the exact error code online with your software/OS version',
        'Check the application or system logs for more details',
        'Note when the error occurs (startup, during specific action, etc.)',
        'Try recent changes that might have caused the issue',
        'Check vendor knowledge base or support forums',
        'Document any patterns or triggers for the error'
      ]
    };
  }

  suggestSolution(problem, attemptedSolutions = []) {
    return {
      problem: problem,
      already_tried: attemptedSolutions,
      suggestions: [
        'Restart the affected application or device',
        'Check for software/system updates',
        'Review recent changes that might have caused the issue',
        'Test in safe mode or with minimal configuration',
        'Check system logs and error messages',
        'Verify all cables and connections are secure',
        'Try on a different user account or device',
        'Back up data and consider reinstalling if needed'
      ],
      next_steps: 'Please try the suggestions that you haven\'t attempted yet. If the issue persists, gather specific error messages and system details for further diagnosis.'
    };
  }

  async sendAudio(audioData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioData
      }));
    }
  }

  async sendImage(imageData, description) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send image as a user message with vision capability
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: description
            },
            {
              type: 'input_image',
              image: imageData
            }
          ]
        }
      }));

      // Trigger response
      this.ws.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  }

  async sendText(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text
            }
          ]
        }
      }));

      // Trigger response
      this.ws.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
