import { Request, Response, NextFunction } from 'express';
import { Conversation, Message } from './chat.model';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from '../../utils/errorHandler';
import mongoose from 'mongoose';

const prisma = new PrismaClient();

export class ChatController {
    // Get conversations for the current user
    async getUserConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const userId = req.user.userId
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
                // Get the most recent message
                const lastMessage = await Message.findOne({
                    conversationId: conversation._id
                })
                    .sort({ createdAt: -1 })
                    .lean();

                // Get unread messages count
                const unreadCount = await Message.countDocuments({
                    conversationId: conversation._id,
                    senderId: { $ne: userId },
                    read: false
                });

                // Get entity details from PostgreSQL based on entity type
                let entity;
                if (conversation.entityType === 'listing' && conversation.listingId) {
                    entity = await prisma.listing.findUnique({
                        where: { id: conversation.listingId },
                        select: {
                            id: true,
                            title: true,
                            images: true
                        }
                    });
                } else if (conversation.entityType === 'service' && conversation.serviceId) {
                    entity = await prisma.gigService.findUnique({
                        where: { id: conversation.serviceId },
                        select: {
                            id: true,
                            title: true
                        }
                    });
                }

                // Get other participant details from PostgreSQL
                const otherParticipantId = conversation.participants.find(id => id !== userId);
                const otherParticipant = otherParticipantId ? await prisma.user.findUnique({
                    where: { id: otherParticipantId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }) : null;

                return {
                    _id: conversation._id,
                    entityId: conversation.entityType === 'listing' ? conversation.listingId : conversation.serviceId,
                    entityType: conversation.entityType,
                    entity,
                    participant: otherParticipant,
                    lastMessage,
                    unreadCount,
                    updatedAt: conversation.updatedAt,
                    createdAt: conversation.createdAt
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

    // Get conversation details and messages
    async getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const userId = req.user.userId;
            const { conversationId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            // Validate conversationId format
            if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                next(errorHandler(400, "Invalid conversation ID"));
                return;
            }

            // Find the conversation
            const conversation = await Conversation.findById(conversationId);

            if (!conversation) {
                next(errorHandler(404, "Conversation not found"));
                return;
            }

            // Check if user is a participant
            if (!conversation.participants.includes(userId)) {
                next(errorHandler(403, "You don't have permission to access this conversation"));
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

            // Get entity details based on entity type
            let entity;
            if (conversation.entityType === 'listing' && conversation.listingId) {
                entity = await prisma.listing.findUnique({
                    where: { id: conversation.listingId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true
                            }
                        }
                    }
                });
            } else if (conversation.entityType === 'service' && conversation.serviceId) {
                entity = await prisma.gigService.findUnique({
                    where: { id: conversation.serviceId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true
                            }
                        }
                    }
                });
            }

            // Get other participant details
            const otherParticipantId = conversation.participants.find(id => id !== userId);
            const otherParticipant = otherParticipantId ? await prisma.user.findUnique({
                where: { id: otherParticipantId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            }) : null;

            // Enhance messages with sender info
            const messagesWithSender = await Promise.all(messages.map(async (message) => {
                const sender = message.senderId === userId ?
                    req.user :
                    otherParticipant;

                return {
                    ...message,
                    sender
                };
            }));

            // Mark unread messages as read
            await Message.updateMany(
                {
                    conversationId,
                    senderId: { $ne: userId },
                    read: false
                },
                { read: true }
            );

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Conversation messages retrieved successfully",
                data: {
                    conversation: {
                        id: conversation._id,
                        entityId: conversation.entityType === 'listing' ? conversation.listingId : conversation.serviceId,
                        entityType: conversation.entityType,
                        entity,
                        participant: otherParticipant,
                        createdAt: conversation.createdAt,
                        updatedAt: conversation.updatedAt
                    },
                    messages: messagesWithSender,
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

    // Create or get conversation with a listing/service owner
    async createOrGetConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const userId = req.user.userId;
            const { listingId, serviceId } = req.body;

            // Validate request - either listingId or serviceId must be provided
            if (!listingId && !serviceId) {
                next(errorHandler(400, "Either listing ID or service ID is required"));
                return;
            }

            if (listingId && serviceId) {
                next(errorHandler(400, "Please provide either a listing ID or a service ID, not both"));
                return;
            }

            let ownerId: string;
            let entityId: string;
            let entityType: 'listing' | 'service';
            let entityTitle: string;

            // Check if entity exists and get owner ID
            if (listingId) {
                const listing = await prisma.listing.findUnique({
                    where: { id: listingId },
                    select: {
                        id: true,
                        userId: true,
                        title: true
                    }
                });

                if (!listing) {
                    next(errorHandler(404, "Listing not found"));
                    return;
                }

                ownerId = listing.userId;
                entityId = listing.id;
                entityTitle = listing.title;
                entityType = 'listing';
            } else {
                const service = await prisma.gigService.findUnique({
                    where: { id: serviceId! },
                    select: {
                        id: true,
                        userId: true,
                        title: true
                    }
                });

                if (!service) {
                    next(errorHandler(404, "Service not found"));
                    return;
                }

                ownerId = service.userId;
                entityId = service.id;
                entityTitle = service.title;
                entityType = 'service';
            }

            // Cannot create a conversation with yourself
            if (ownerId === userId) {
                next(errorHandler(400, "You cannot start a conversation with yourself"));
                return;
            }

            // Check if conversation already exists between these users for this entity
            let conversation;
            if (entityType === 'listing') {
                conversation = await Conversation.findOne({
                    listingId: entityId,
                    entityType,
                    participants: { $all: [userId, ownerId] }
                });
            } else {
                conversation = await Conversation.findOne({
                    serviceId: entityId,
                    entityType,
                    participants: { $all: [userId, ownerId] }
                });
            }

            // If conversation doesn't exist, create it
            if (!conversation) {
                const conversationData: {
                    participants: string[];
                    entityType: 'listing' | 'service';
                    listingId?: string;
                    serviceId?: string;
                } = {
                    participants: [userId, ownerId],
                    entityType
                };

                if (entityType === 'listing') {
                    conversationData.listingId = entityId;
                } else {
                    conversationData.serviceId = entityId;
                }

                conversation = await Conversation.create(conversationData);
            }

            // Get other participant details
            const otherParticipant = await prisma.user.findUnique({
                where: { id: ownerId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            });

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Conversation retrieved/created successfully",
                data: {
                    conversation: {
                        id: conversation._id,
                        entityId: entityType === 'listing' ? conversation.listingId : conversation.serviceId,
                        entityType,
                        entity: {
                            id: entityId,
                            title: entityTitle
                        },
                        participant: otherParticipant,
                        createdAt: conversation.createdAt,
                        updatedAt: conversation.updatedAt
                    }
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve/create conversation"));
        }
    }
}