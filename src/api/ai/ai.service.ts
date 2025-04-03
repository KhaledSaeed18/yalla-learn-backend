import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatCompletionOptions {
    maxTokens?: number;
    temperature?: number;
}

export class AIService {
    private prisma: PrismaClient;
    private genAI: GoogleGenerativeAI;
    private safetySettings: {
        category: HarmCategory;
        threshold: HarmBlockThreshold;
    }[];

    constructor() {
        this.prisma = new PrismaClient();

        // Initialize Google Generative AI with API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);

        // Set default safety settings
        this.safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];
    }

    /**
    * Creates a chat completion with the Gemini model
    */
    public async createChatCompletion(
        messages: ChatMessage[],
        userId: string,
        options: ChatCompletionOptions = {}
    ) {
        try {
            // Validate userId
            if (!userId) {
                throw new Error('userId is required for chat completion');
            }

            // Configure model settings
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Format messages for Gemini API
            const formattedMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.content }]
            }));

            // Create a chat session
            const chat = model.startChat({
                history: formattedMessages.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                },
            });

            // Get the last message (the prompt to respond to)
            const lastMessage = messages[messages.length - 1];

            // Generate the response
            const result = await chat.sendMessage(lastMessage.content);
            const responseText = result.response.text();

            // Save the conversation to the database
            const conversationId = await this.saveConversation(userId, messages, responseText);

            return {
                conversationId,
                message: responseText,
                usage: {
                    promptTokens: this.estimateTokenCount(messages.map(m => m.content).join(' ')),
                    completionTokens: this.estimateTokenCount(responseText),
                }
            };
        } catch (error) {
            console.error('Error in AI completion:', error);
            throw error;
        }
    }

    /**
     * Creates a streaming chat completion with the Gemini model
     */
    public async createStreamingChatCompletion(
        messages: ChatMessage[],
        userId: string,
        options: ChatCompletionOptions = {}
    ) {
        try {
            // Validate userId
            if (!userId) {
                throw new Error('userId is required for chat completion');
            }

            // Configure model settings
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Format messages for Gemini API
            const formattedMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.content }]
            }));

            // Create a chat session
            const chat = model.startChat({
                history: formattedMessages.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                },
            });

            // Get the last message (the prompt to respond to)
            const lastMessage = messages[messages.length - 1];

            // Generate the response as a stream
            const streamingResponse = await chat.sendMessageStream(lastMessage.content);

            // Save the conversation in the background after streaming starts
            // We'll need to collect the full response for saving
            const fullResponsePromise = this.collectStreamResponse(streamingResponse.stream, userId, messages);

            return {
                stream: streamingResponse.stream,
                conversationPromise: fullResponsePromise
            };
        } catch (error) {
            console.error('Error in AI streaming completion:', error);
            throw error;
        }
    }

    /**
     * Collects the full response from a stream and saves the conversation
     * @private
     */
    private async collectStreamResponse(
        stream: AsyncIterable<{ text: () => string }>,
        userId: string,
        messages: ChatMessage[]
    ): Promise<{ conversationId: string, fullResponse: string }> {
        try {
            let fullResponse = '';

            // Collect the full response from the stream
            for await (const chunk of stream) {
                fullResponse += chunk.text();
            }

            // Save the conversation to the database
            const conversationId = await this.saveConversation(userId, messages, fullResponse);

            return {
                conversationId,
                fullResponse
            };
        } catch (error) {
            console.error('Error collecting stream response:', error);
            throw error;
        }
    }

    /**
     * Continue an existing conversation with streaming response
     */
    public async continueConversationStream(
        conversationId: string,
        newMessage: string,
        userId: string,
        options: ChatCompletionOptions = {}
    ) {
        try {
            // Validate parameters
            if (!conversationId) {
                throw new Error('conversationId is required to continue a conversation');
            }
            if (!userId) {
                throw new Error('userId is required for chat completion');
            }

            // Verify the conversation exists and belongs to this user
            const conversation = await this.prisma.aIConversation.findFirst({
                where: {
                    id: conversationId,
                    userId
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found or does not belong to this user');
            }

            // Format previous messages for the API
            const messages: ChatMessage[] = conversation.messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }));

            // Add the new message
            messages.push({
                role: 'user',
                content: newMessage
            });

            // Configure model settings
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Format messages for Gemini API
            const formattedMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.content }]
            }));

            // Create a chat session
            const chat = model.startChat({
                history: formattedMessages.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                },
            });

            // Get the response to the new message as a stream
            const streamingResponse = await chat.sendMessageStream(newMessage);

            // Process and save the response in the background
            const savePromise = this.saveStreamingContinuation(
                streamingResponse.stream,
                conversationId,
                newMessage
            );

            return {
                stream: streamingResponse.stream,
                conversationId,
                savePromise
            };
        } catch (error) {
            console.error('Error in streaming conversation continuation:', error);
            throw error;
        }
    }

    /**
     * Save the streamed continuation messages
     * @private
     */
    private async saveStreamingContinuation(
        stream: AsyncIterable<{ text: () => string }>,
        conversationId: string,
        userMessage: string
    ): Promise<string> {
        try {
            // First save the user message
            await this.prisma.aIMessage.create({
                data: {
                    conversationId,
                    content: userMessage,
                    role: 'user'
                }
            });

            // Collect the full response
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text();
            }

            // Save the assistant's response
            await this.prisma.aIMessage.create({
                data: {
                    conversationId,
                    content: fullResponse,
                    role: 'assistant'
                }
            });

            // Update the conversation timestamp
            await this.prisma.aIConversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });

            return fullResponse;
        } catch (error) {
            console.error('Error saving streaming continuation:', error);
            throw error;
        }
    }

    /**
     * Get conversation history for a user
     */
    public async getConversationHistory(userId: string, limit: number = 10, page: number = 1) {
        const skip = (page - 1) * limit;

        const conversations = await this.prisma.aIConversation.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit,
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        const totalCount = await this.prisma.aIConversation.count({
            where: {
                userId
            }
        });

        return {
            conversations,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        };
    }

    /**
* Save a conversation and its messages to the database
* @returns The ID of the conversation
*/
    private async saveConversation(userId: string, messages: ChatMessage[], response: string): Promise<string> {
        // Create a new conversation if this is the first message
        // or add to an existing conversation
        const latestConversation = await this.prisma.aIConversation.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        let conversationId: string;

        // If no conversation exists or the last one was created more than 1 hour ago,
        // create a new conversation
        if (!latestConversation ||
            new Date().getTime() - new Date(latestConversation.createdAt).getTime() > 60 * 60 * 1000) {

            if (!userId) {
                throw new Error('userId is required to create a conversation');
            }

            const newConversation = await this.prisma.aIConversation.create({
                data: {
                    userId: userId
                }
            });
            conversationId = newConversation.id;
        } else {
            conversationId = latestConversation.id;
        }

        // Save user message
        const lastMessage = messages[messages.length - 1];
        await this.prisma.aIMessage.create({
            data: {
                conversationId: conversationId,
                content: lastMessage.content,
                role: lastMessage.role
            }
        });

        // Save assistant response
        await this.prisma.aIMessage.create({
            data: {
                conversationId: conversationId,
                content: response,
                role: 'assistant'
            }
        });

        return conversationId;
    }

    /**
     * Simple token count estimator
     * This is a very rough approximation - in production, use a proper tokenizer
     */
    public estimateTokenCount(text: string): number {
        // Rough approximation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    /**
 * Continues an existing conversation with a new message
 */
    public async continueConversation(
        conversationId: string,
        newMessage: string,
        userId: string,
        options: ChatCompletionOptions = {}
    ) {
        try {
            // Validate parameters
            if (!conversationId) {
                throw new Error('conversationId is required to continue a conversation');
            }
            if (!userId) {
                throw new Error('userId is required for chat completion');
            }

            // Verify the conversation exists and belongs to this user
            const conversation = await this.prisma.aIConversation.findFirst({
                where: {
                    id: conversationId,
                    userId
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found or does not belong to this user');
            }

            // Format previous messages for the API
            const messages: ChatMessage[] = conversation.messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }));

            // Add the new message
            messages.push({
                role: 'user',
                content: newMessage
            });

            // Configure model settings
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Format messages for Gemini API - Map 'assistant' role to 'model' for the API
            const formattedMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.content }]
            }));

            // Create a chat session
            const chat = model.startChat({
                history: formattedMessages.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                },
            });

            // Get the response to the new message
            const result = await chat.sendMessage(newMessage);
            const responseText = result.response.text();

            // Save the new message and response
            await this.prisma.aIMessage.create({
                data: {
                    conversationId,
                    content: newMessage,
                    role: 'user'
                }
            });

            await this.prisma.aIMessage.create({
                data: {
                    conversationId,
                    content: responseText,
                    role: 'assistant'
                }
            });

            // Update the conversation's updatedAt timestamp
            await this.prisma.aIConversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });

            return {
                conversationId,
                message: responseText,
                usage: {
                    promptTokens: this.estimateTokenCount(messages.map(m => m.content).join(' ')),
                    completionTokens: this.estimateTokenCount(responseText),
                }
            };
        } catch (error) {
            console.error('Error continuing conversation:', error);
            throw error;
        }
    }
}