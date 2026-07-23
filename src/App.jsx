import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Code, Bot, User, Loader } from 'lucide-react';

const CodingChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            id: `bot-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'bot',
            content: "Hi! I'm your coding assistant. Ask me anything about programming, algorithms, debugging, or software development!",
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cleanup effect to prevent memory leaks
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Streams a reply from the backend, which proxies to the Claude API.
    // Calls onDelta(text) for each incoming chunk so the UI can render incrementally.
    const streamAIResponse = async (history, onDelta, signal) => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history }),
            signal,
        });

        if (!response.ok || !response.body) {
            throw new Error(`Chat request failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // keep the last, possibly incomplete, chunk

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6);
                if (payload === '[DONE]') return;

                const parsed = JSON.parse(payload);
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.delta) onDelta(parsed.delta);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userMessage = {
            id: userMessageId,
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        const history = [...messages, userMessage]
            .filter(m => m.type === 'user' || m.type === 'bot')
            .map(m => ({ role: m.type, content: m.content }));

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        const botMessageId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let botMessageAdded = false;

        try {
            await streamAIResponse(history, (delta) => {
                if (!isMountedRef.current) return;

                setMessages(prev => {
                    if (!botMessageAdded) {
                        botMessageAdded = true;
                        return [...prev, { id: botMessageId, type: 'bot', content: delta, timestamp: new Date() }];
                    }
                    return prev.map(m => m.id === botMessageId ? { ...m, content: m.content + delta } : m);
                });
            }, abortControllerRef.current.signal);
        } catch (error) {
            // Check if component is still mounted and error is not due to abort
            if (!isMountedRef.current || error.name === 'AbortError') return;

            const errorMessageId = `bot-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const errorMessage = {
                id: errorMessageId,
                type: 'bot',
                content: "Sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            // Only update loading state if component is still mounted
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessage = useCallback((content) => {
        // Simple code block formatting
        const parts = content.split(/```(\w+)?\n?([\s\S]*?)```/);

        return parts.map((part, index) => {
            if (index % 3 === 2) {
                // This is code content
                const language = parts[index - 1] || 'text';
                return (
                    <pre key={index} className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto my-3">
                        <code className={`language-${language}`}>{part}</code>
                    </pre>
                );
            } else if (index % 3 === 1) {
                // This is the language identifier, skip it
                return null;
            } else {
                // This is regular text
                return (
                    <span key={index} className="whitespace-pre-wrap">
                        {part}
                    </span>
                );
            }
        });
    }, []); // Empty dependency array since function doesn't depend on any props or state

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                    <Code className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Coding Assistant</h1>
                    <p className="text-sm text-gray-500">Ask me anything about programming</p>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.type === 'bot' && (
                            <div className="bg-blue-500 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                <Bot className="text-white" size={16} />
                            </div>
                        )}

                        <div
                            className={`max-w-3xl px-4 py-3 rounded-lg ${message.type === 'user'
                                    ? 'bg-blue-500 text-white ml-12'
                                    : 'bg-white border border-gray-200 mr-12'
                                }`}
                        >
                            <div className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                {formatMessage(message.content)}
                            </div>
                            <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {message.type === 'user' && (
                            <div className="bg-gray-500 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                <User className="text-white" size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="bg-blue-500 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                            <Bot className="text-white" size={16} />
                        </div>
                        <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg mr-12 flex items-center gap-2">
                            <Loader className="animate-spin text-gray-500" size={16} />
                            <span className="text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a coding question... (e.g., 'How do I implement a binary search in Python?')"
                        className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
};

export default CodingChatInterface;