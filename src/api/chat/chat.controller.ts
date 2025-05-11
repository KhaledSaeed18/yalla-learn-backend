import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Conversation, Message } from './chat.model';
import { errorHandler } from '../../utils/errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatControllerSimple {
    // Get conversations for the current user
    async getUserConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, 'Unauthorized'));
                return;
            }

            const userId = req.user.userId;
            const { page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            // Find all conversations the user is part of
            const conversations = await Conversation.find({
                participants: userId
            })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit as string));

            // Get the total count for pagination
            const totalConversations = await Conversation.countDocuments({
                participants: userId
            });

            // Get latest message for each conversation
            const conversationsWithDetails = await Promise.all(conversations.map(async (conversation) => {
                // Get latest message
                const latestMessage = await Message.findOne({
                    conversationId: conversation._id
                }).sort({ createdAt: -1 }).lean();

                // Get other participant details
                const otherParticipantId = conversation.participants.find(id => id !== userId);
                let otherParticipant = null;

                if (otherParticipantId) {
                    otherParticipant = await prisma.user.findUnique({
                        where: { id: otherParticipantId },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    });
                }

                return {
                    id: conversation._id,
                    entityType: conversation.entityType,
                    entityId: conversation.entityType === 'listing' ? conversation.listingId : conversation.serviceId,
                    otherParticipant,
                    lastMessage: latestMessage ? {
                        content: latestMessage.content,
                        senderId: latestMessage.senderId,
                        createdAt: latestMessage.createdAt
                    } : null,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt
                };
            }));

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Conversations retrieved successfully",
                data: {
                    conversations: conversationsWithDetails,
                    pagination: {
                        total: totalConversations,
                        page: parseInt(page as string),
                        limit: parseInt(limit as string),
                        pages: Math.ceil(totalConversations / parseInt(limit as string))
                    }
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve conversations"));
        }
    }

    // Get conversation messages
    async getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, 'Unauthorized'));
                return;
            }

            const userId = req.user.userId;
            const { conversationId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            // Validate conversationId format
            if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                next(errorHandler(400, 'Invalid conversation ID'));
                return;
            }

            // Find the conversation
            const conversation = await Conversation.findById(conversationId);

            if (!conversation) {
                next(errorHandler(404, 'Conversation not found'));
                return;
            }

            // Check if user is a participant
            if (!conversation.participants.includes(userId)) {
                next(errorHandler(403, 'You are not a participant in this conversation'));
                return;
            }

            // Get messages with pagination (newest first)
            const messages = await Message.find({
                conversationId
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit as string))
                .lean();

            // Get total count for pagination
            const totalMessages = await Message.countDocuments({ conversationId });

            // Get other participant details
            const otherParticipantId = conversation.participants.find(id => id !== userId);
            const otherParticipant = otherParticipantId ? await prisma.user.findUnique({
                where: { id: otherParticipantId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }) : null;

            // Format messages for response
            const formattedMessages = messages.map(message => ({
                id: message._id,
                content: message.content,
                senderId: message.senderId,
                isFromCurrentUser: message.senderId === userId,
                createdAt: message.createdAt
            }));

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Conversation messages retrieved successfully",
                data: {
                    conversation: {
                        id: conversation._id,
                        entityId: conversation.entityType === 'listing' ? conversation.listingId : conversation.serviceId,
                        entityType: conversation.entityType,
                        otherParticipant,
                        createdAt: conversation.createdAt,
                        updatedAt: conversation.updatedAt
                    },
                    messages: formattedMessages,
                    pagination: {
                        total: totalMessages,
                        page: parseInt(page as string),
                        limit: parseInt(limit as string),
                        pages: Math.ceil(totalMessages / parseInt(limit as string))
                    }
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve conversation messages"));
        }
    }

    // Create a new conversation
    async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, 'Unauthorized'));
                return;
            }

            const userId = req.user.userId;
            const { listingId, serviceId, receiverId } = req.body;

            // Validate request
            if (!receiverId) {
                next(errorHandler(400, 'Receiver ID is required'));
                return;
            }

            if (!listingId && !serviceId) {
                next(errorHandler(400, 'Either listing ID or service ID is required'));
                return;
            }

            if (listingId && serviceId) {
                next(errorHandler(400, 'Provide either listing ID or service ID, not both'));
                return;
            }

            // Cannot create a conversation with yourself
            if (receiverId === userId) {
                next(errorHandler(400, 'Cannot create a conversation with yourself'));
                return;
            }

            // Determine entity type
            const entityType = listingId ? 'listing' : 'service';
            const entityId = listingId || serviceId;

            // Check if a conversation already exists
            let conversation;
            if (entityType === 'listing') {
                conversation = await Conversation.findOne({
                    listingId: entityId,
                    participants: { $all: [userId, receiverId] }
                });
            } else {
                conversation = await Conversation.findOne({
                    serviceId: entityId,
                    participants: { $all: [userId, receiverId] }
                });
            }

            // If conversation exists, return it
            if (conversation) {
                res.status(200).json({
                    status: "success",
                    statusCode: 200,
                    message: "Conversation already exists",
                    data: {
                        conversationId: conversation._id
                    }
                });
                return;
            }

            // Create new conversation
            const conversationData: {
                participants: string[];
                entityType: 'listing' | 'service';
                listingId?: string;
                serviceId?: string;
            } = {
                participants: [userId, receiverId],
                entityType
            };

            if (entityType === 'listing') {
                conversationData.listingId = entityId;
            } else {
                conversationData.serviceId = entityId;
            }

            const newConversation = await Conversation.create(conversationData);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Conversation created successfully",
                data: {
                    conversationId: newConversation._id
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create conversation"));
        }
    }

    // Send a message to an existing conversation
    async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, 'Unauthorized'));
                return;
            }

            const userId = req.user.userId;
            const { conversationId } = req.params;
            const { content } = req.body;

            // Validate request
            if (!content) {
                next(errorHandler(400, 'Message content is required'));
                return;
            }

            if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                next(errorHandler(400, 'Invalid conversation ID'));
                return;
            }

            // Check if conversation exists
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                next(errorHandler(404, 'Conversation not found'));
                return;
            }

            // Check if user is a participant
            if (!conversation.participants.includes(userId)) {
                next(errorHandler(403, 'You are not a participant in this conversation'));
                return;
            }

            // Create and save the message
            const newMessage = await Message.create({
                conversationId,
                senderId: userId,
                content,
                read: false
            });

            // Update conversation timestamp (for sorting)
            await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Message sent successfully",
                data: {
                    messageId: newMessage._id,
                    conversationId,
                    content,
                    senderId: userId,
                    createdAt: newMessage.createdAt
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to send message"));
        }
    }
}
