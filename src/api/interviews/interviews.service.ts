import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface InterviewOptions {
    topic: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    duration?: number;
    questionsCount?: number;
}

interface InterviewStreamOptions {
    maxTokens?: number;
    temperature?: number;
}

export class InterviewService {
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
     * Create a new interview session
     */
    public async createInterview(userId: string, options: InterviewOptions) {
        try {
            // Create a new interview in the database
            const interview = await this.prisma.interview.create({
                data: {
                    userId,
                    topic: options.topic,
                    level: options.level,
                    duration: options.duration || 30, // Default 30 minutes
                    status: 'CREATED'
                }
            });

            // Create system message with interview configuration
            const systemMessage = this.generateSystemMessage(options);

            // Save the system message
            await this.prisma.interviewMessage.create({
                data: {
                    interviewId: interview.id,
                    role: 'system',
                    content: systemMessage
                }
            });

            // Generate the first interviewer question
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            const result = await model.generateContent(
                `${systemMessage}\n\nStart the interview with a brief introduction and your first question.`
            );
            const firstQuestion = result.response.text();

            // Save the first interviewer message
            await this.prisma.interviewMessage.create({
                data: {
                    interviewId: interview.id,
                    role: 'interviewer',
                    content: firstQuestion
                }
            });

            // Update interview status
            await this.prisma.interview.update({
                where: { id: interview.id },
                data: { status: 'IN_PROGRESS' }
            });

            return {
                interviewId: interview.id,
                firstQuestion,
                topic: options.topic,
                level: options.level
            };
        } catch (error) {
            console.error('Error creating interview:', error);
            throw error;
        }
    }

    /**
     * Continue an interview with a user response
     */
    public async continueInterview(
        interviewId: string,
        userId: string,
        userResponse: string
    ) {
        try {
            // Verify the interview exists and belongs to this user
            const interview = await this.prisma.interview.findFirst({
                where: {
                    id: interviewId,
                    userId
                }
            });

            if (!interview) {
                throw new Error('Interview not found or does not belong to this user');
            }

            if (interview.status === 'COMPLETED' || interview.status === 'EVALUATED') {
                throw new Error('This interview has already been completed');
            }

            // Save the user's response
            await this.prisma.interviewMessage.create({
                data: {
                    interviewId,
                    role: 'user',
                    content: userResponse
                }
            });

            // Get all previous messages for context
            const messages = await this.prisma.interviewMessage.findMany({
                where: { interviewId },
                orderBy: { createdAt: 'asc' }
            });

            // Format messages for the AI
            const formattedMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Configure model
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Create chat context with interview history
            const chat = model.startChat({
                history: formattedMessages.map(msg => ({
                    role: msg.role === 'interviewer' ? 'model' : msg.role,
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    temperature: 0.7,
                }
            });

            // Get next interviewer response
            const prompt = "Continue the interview. Respond as the interviewer. Ask a follow-up question based on the candidate's last response or move to a new relevant question if appropriate.";
            const result = await chat.sendMessage(prompt);
            const interviewerResponse = result.response.text();

            // Save the interviewer's response
            await this.prisma.interviewMessage.create({
                data: {
                    interviewId,
                    role: 'interviewer',
                    content: interviewerResponse
                }
            });

            return {
                interviewId,
                message: interviewerResponse
            };
        } catch (error) {
            console.error('Error continuing interview:', error);
            throw error;
        }
    }

    /**
     * Continue an interview with streaming response
     */
    public async continueInterviewStream(
        interviewId: string,
        userId: string,
        userResponse: string,
        options: InterviewStreamOptions = {}
    ) {
        try {
            // Verify the interview exists and belongs to this user
            const interview = await this.prisma.interview.findFirst({
                where: {
                    id: interviewId,
                    userId
                }
            });

            if (!interview) {
                throw new Error('Interview not found or does not belong to this user');
            }

            if (interview.status === 'COMPLETED' || interview.status === 'EVALUATED') {
                throw new Error('This interview has already been completed');
            }

            // Save the user's response
            await this.prisma.interviewMessage.create({
                data: {
                    interviewId,
                    role: 'user',
                    content: userResponse
                }
            });

            // Get all previous messages for context
            const messages = await this.prisma.interviewMessage.findMany({
                where: { interviewId },
                orderBy: { createdAt: 'asc' }
            });

            // Format messages for the AI
            const formattedMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Configure model
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Create chat context with interview history
            const chat = model.startChat({
                history: formattedMessages.map(msg => ({
                    role: msg.role === 'interviewer' ? 'model' : msg.role,
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                }
            });

            // Get next interviewer response as a stream
            const prompt = "Continue the interview. Respond as the interviewer. Ask a follow-up question based on the candidate's last response or move to a new relevant question if appropriate.";
            const streamingResponse = await chat.sendMessageStream(prompt);

            // Process and save the response in the background
            const savePromise = this.saveStreamingResponse(
                streamingResponse.stream,
                interviewId
            );

            return {
                stream: streamingResponse.stream,
                interviewId,
                savePromise
            };
        } catch (error) {
            console.error('Error in streaming interview continuation:', error);
            throw error;
        }
    }

    /**
     * Complete an interview and generate feedback
     */
    public async completeInterview(interviewId: string, userId: string) {
        try {
            // Verify the interview exists and belongs to this user
            const interview = await this.prisma.interview.findFirst({
                where: {
                    id: interviewId,
                    userId,
                    status: 'IN_PROGRESS'
                },
                include: {
                    interviewMessages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });

            if (!interview) {
                throw new Error('Active interview not found or does not belong to this user');
            }

            // Format messages for the AI
            const messages = interview.interviewMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Configure model
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                safetySettings: this.safetySettings
            });

            // Generate feedback
            const feedbackPrompt = `
                Based on this interview about ${interview.topic} at ${interview.level} level, provide:
                
                1. A detailed feedback of the candidate's performance
                2. Strengths demonstrated during the interview
                3. Areas for improvement
                4. A score on a scale of 0-100
                5. Suggested resources for further improvement
                
                Format the response in a structured way with clear sections. Include the numerical score separately at the beginning in format "SCORE: X"
            `;

            const chat = model.startChat({
                history: messages.map(msg => ({
                    role: msg.role === 'interviewer' ? 'model' : msg.role,
                    parts: [{ text: msg.content }]
                }))
            });

            const result = await chat.sendMessage(feedbackPrompt);
            const feedbackText = result.response.text();

            // Extract score from feedback
            let score = 70; // Default score
            const scoreMatch = feedbackText.match(/SCORE:\s*(\d+)/i);
            if (scoreMatch && scoreMatch[1]) {
                score = parseInt(scoreMatch[1]);
                if (score < 0) score = 0;
                if (score > 100) score = 100;
            }

            // Update interview status and add feedback
            await this.prisma.interview.update({
                where: { id: interviewId },
                data: {
                    status: 'EVALUATED',
                    feedback: feedbackText,
                    score
                }
            });

            return {
                interviewId,
                feedback: feedbackText,
                score
            };
        } catch (error) {
            console.error('Error completing interview:', error);
            throw error;
        }
    }

    /**
     * Get interview history for a user
     */
    public async getInterviewHistory(userId: string, limit: number = 10, page: number = 1) {
        const skip = (page - 1) * limit;

        const interviews = await this.prisma.interview.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit,
        });

        const totalCount = await this.prisma.interview.count({
            where: {
                userId
            }
        });

        return {
            interviews,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        };
    }

    /**
     * Get details of a specific interview
     */
    public async getInterviewDetails(interviewId: string, userId: string) {
        const interview = await this.prisma.interview.findFirst({
            where: {
                id: interviewId,
                userId
            },
            include: {
                interviewMessages: {
                    orderBy: { createdAt: 'asc' },
                    where: {
                        role: {
                            not: 'system' // Exclude system messages from the response
                        }
                    }
                }
            }
        });

        if (!interview) {
            throw new Error('Interview not found or does not belong to this user');
        }

        return interview;
    }

    /**
     * Generate system message for interview setup
     */
    private generateSystemMessage(options: InterviewOptions): string {
        let difficulty = '';
        switch (options.level) {
            case 'BEGINNER':
                difficulty = 'entry-level or student with basic knowledge';
                break;
            case 'INTERMEDIATE':
                difficulty = 'someone with moderate experience or a recent graduate';
                break;
            case 'ADVANCED':
                difficulty = 'someone with significant experience and expertise';
                break;
            case 'EXPERT':
                difficulty = 'a senior professional or expert in the field';
                break;
        }

        const questionCount = options.questionsCount || 5;

        return `
        You are an experienced interviewer conducting a technical/academic interview on the topic of "${options.topic}".
        
        Interview parameters:
        - This is a ${options.level.toLowerCase()} level interview for ${difficulty}
        - You should ask approximately ${questionCount} questions throughout the interview
        - The interview should take about ${options.duration || 30} minutes in real time
        - Your questions should be relevant to ${options.topic} and appropriate for the ${options.level.toLowerCase()} level
        - Ask one question at a time and wait for the response
        - Follow up based on the candidate's responses
        - Be critical but supportive - this is a learning experience
        
        Your role:
        - You are the interviewer
        - Start with a brief introduction and your first question
        - Wait for the candidate's response before asking the next question
        - Ask follow-up questions if the answer needs clarification
        - If the answer is incorrect or incomplete, provide gentle guidance
        - As interviewer, your messages should be labeled with role "interviewer"
        - The candidate's messages will be labeled with role "user"
        - End the interview when appropriate based on the number of questions
        
        Be natural and conversational, as though you're a real interviewer.
        `;
    }

    /**
     * Save a streaming response
     */
    private async saveStreamingResponse(
        stream: AsyncIterable<{ text: () => string }>,
        interviewId: string
    ): Promise<string> {
        try {
            // Collect the full response
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text();
            }

            // Save the interviewer's response
            await this.prisma.interviewMessage.create({
                data: {
                    interviewId,
                    role: 'interviewer',
                    content: fullResponse
                }
            });

            return fullResponse;
        } catch (error) {
            console.error('Error saving streaming response:', error);
            throw error;
        }
    }

    /**
     * Simple token count estimator
     */
    public estimateTokenCount(text: string): number {
        // Rough approximation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }
}
