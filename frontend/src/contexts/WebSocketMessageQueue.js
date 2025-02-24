import React, { createContext, useContext, useRef, useCallback } from 'react';

const WebSocketMessageQueueContext = createContext(null);

export function WebSocketMessageQueueProvider({ children }) {
    // Queue to store messages
    const messageQueue = useRef([]);
    // Flag to track if we're currently processing messages
    const isProcessing = useRef(false);

    // Process messages in the queue
    const processQueue = useCallback(async () => {
        if (isProcessing.current || messageQueue.current.length === 0) {
            return;
        }

        isProcessing.current = true;
        
        try {
            // Get the next message and its handler
            const { message, handler } = messageQueue.current[0];
            console.log("Processing: ", JSON.parse(message.data).type)
            // Process the message
            await handler(message);
            
            // Remove the processed message from queue
            messageQueue.current.shift();
            
            // If there are more messages, process the next one
            if (messageQueue.current.length > 0) {
                processQueue();
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        } finally {
            isProcessing.current = false;
        }
    }, []);

    // Add message to queue
    const enqueueMessage = useCallback((message, handler) => {
        messageQueue.current.push({ message, handler });
        processQueue();
    }, [processQueue]);

    const value = {
        enqueueMessage
    };

    return (
        <WebSocketMessageQueueContext.Provider value={value}>
            {children}
        </WebSocketMessageQueueContext.Provider>
    );
}

export function useWebSocketMessageQueue() {
    const context = useContext(WebSocketMessageQueueContext);
    if (!context) {
        throw new Error('useWebSocketMessageQueue must be used within a WebSocketMessageQueueProvider');
    }
    return context;
}
