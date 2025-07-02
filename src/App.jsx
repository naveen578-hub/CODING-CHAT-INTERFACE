import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, Bot, User, Loader } from 'lucide-react';

const CodingChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: "Hi! I'm your coding assistant. Ask me anything about programming, algorithms, debugging, or software development!",
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Simulated AI response function (replace with actual API call)
    const getAIResponse = async (userMessage) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const lowerMessage = userMessage.toLowerCase();

        // Simple pattern matching for demo purposes
        if (lowerMessage.includes('react') || lowerMessage.includes('jsx')) {
            return `Here's a React example:

\`\`\`jsx
import React, { useState } from 'react';

function MyComponent() {
    const [count, setCount] = useState(0);
    
    return (
    <div>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>
        Increment
        </button>
    </div>
    );
}
\`\`\`

This demonstrates basic React hooks and state management. The \`useState\` hook allows you to add state to functional components.`;
        }

        if (lowerMessage.includes('python') || lowerMessage.includes('algorithm')) {
            return `Here's a Python algorithm example:

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Usage
numbers = [1, 3, 5, 7, 9, 11, 13]
index = binary_search(numbers, 7)
print(f"Found at index: {index}")
\`\`\`

This binary search algorithm has O(log n) time complexity and efficiently finds elements in sorted arrays.`;
        }

        if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
            return `Here's a useful JavaScript pattern:

\`\`\`javascript
// Async/await with error handling
async function fetchUserData(userId) {
    try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const userData = await response.json();
    return userData;
    } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
    }
}

// Usage with proper error handling
fetchUserData(123)
.then(user => console.log(user))
.catch(err => console.error('Failed to load user:', err));
\`\`\`

This shows modern JavaScript async patterns with proper error handling.`;
        }

        if (lowerMessage.includes('debug') || lowerMessage.includes('error')) {
            return `Here are some debugging strategies:

**1. Console Logging:**
\`\`\`javascript
console.log('Variable value:', myVar);
console.table(arrayData); // For arrays/objects
console.trace(); // Shows call stack
\`\`\`

**2. Browser DevTools:**
- Set breakpoints in Sources tab
- Use Network tab for API issues
- Check Console for errors

**3. Common Error Patterns:**
- Null/undefined reference errors
- Async timing issues
- Scope problems with closures
- Type mismatches

**4. Debugging Steps:**
1. Reproduce the issue consistently
2. Isolate the problem area
3. Add logging/breakpoints
4. Test assumptions step by step

What specific error are you encountering?`;
        }

        // Default response
        return `I understand you're asking about: "${userMessage}"

I'm a coding assistant that can help with:
• Programming languages (JavaScript, Python, React, etc.)
• Algorithms and data structures
• Debugging and troubleshooting
• Code reviews and best practices
• Architecture and design patterns

Could you provide more specific details about what you'd like help with? For example:
- What programming language?
- What's the specific problem you're trying to solve?
- Are you getting any error messages?

Feel free to share code snippets and I'll help you improve them!`;
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const aiResponse = await getAIResponse(inputMessage);

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: aiResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: "Sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessage = (content) => {
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
    };

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