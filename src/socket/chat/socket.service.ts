import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyJWT } from '../../utils/jwt';
import { Conversation, Message } from '../../api/chat/chat.model';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SocketService {
    private io: Server;
    private connectedUsers: Map<string, string> = new Map();

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.initializeSocketEvents();
    }

    private initializeSocketEvents(): void {
        this.io.on('connection', async (socket: Socket) => {
            console.log(`New socket connection: ${socket.id}`);

            // Authenticate user
            const token = socket.handshake.auth.token;
            if (!token) {
                socket.disconnect();
                return;
            }

            try {
                const decodedToken = verifyJWT(token);
                const userId = decodedToken.userId;

                // Store user's socket id
                this.connectedUsers.set(userId, socket.id);

                console.log(`User ${userId} authenticated and connected`);

                // Handle disconnect
                socket.on('disconnect', () => {
                    console.log(`User ${userId} disconnected`);
                    this.connectedUsers.delete(userId);
                });

                // Handle sending a message
                socket.on('send-message', async (data: {
                    conversationId?: string;
                    content: string;
                    listingId?: string;
                    serviceId?: string;
                    receiverId: string;
                }) => {
                    try {
                        if (!data.content || !data.receiverId) {
                            socket.emit('error', { message: 'Message content and receiver ID are required' });
                            return;
                        }

                        let conversationId = data.conversationId;

                        // If no conversation ID provided, find or create a conversation
                        if (!conversationId) {
                            // We need either a listing ID or service ID
                            if (!data.listingId && !data.serviceId) {
                                socket.emit('error', { message: 'Either listing ID or service ID is required' });
                                return;
                            }

                            // Set entity type and ID
                            const entityType = data.listingId ? 'listing' : 'service';
                            const entityId = data.listingId || data.serviceId;

                            // Find existing conversation
                            let conversation;
                            if (entityType === 'listing') {
                                conversation = await Conversation.findOne({
                                    listingId: entityId,
                                    participants: { $all: [userId, data.receiverId] }
                                });
                            } else {
                                conversation = await Conversation.findOne({
                                    serviceId: entityId,
                                    participants: { $all: [userId, data.receiverId] }
                                });
                            }

                            // If no conversation exists, create a new one
                            if (!conversation) {
                                const conversationData: {
                                    participants: string[];
                                    entityType: 'listing' | 'service';
                                    listingId?: string;
                                    serviceId?: string;
                                } = {
                                    participants: [userId, data.receiverId],
                                    entityType
                                };

                                if (entityType === 'listing') {
                                    conversationData.listingId = entityId;
                                } else {
                                    conversationData.serviceId = entityId;
                                }

                                conversation = await Conversation.create(conversationData);
                            }

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            conversationId = (conversation as any)._id.toString();
                        }

                        // Create and save the message
                        const newMessage = await Message.create({
                            conversationId,
                            senderId: userId,
                            content: data.content,
                            read: false
                        });

                        // Update conversation timestamp (for sorting by latest)
                        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

                        // Get basic sender info
                        const sender = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { firstName: true, lastName: true }
                        });

                        // Send the message to the receiver
                        const receiverSocketId = this.connectedUsers.get(data.receiverId);
                        if (receiverSocketId) {
                            this.io.to(receiverSocketId).emit('new-message', {
                                message: {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    id: (newMessage as any)._id,
                                    conversationId,
                                    content: data.content,
                                    senderId: userId,
                                    senderName: `${sender?.firstName} ${sender?.lastName}`,
                                    createdAt: newMessage.createdAt
                                }
                            });
                        }

                        // Confirm to the sender
                        socket.emit('message-sent', {
                            success: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            messageId: (newMessage as any)._id,
                            conversationId
                        });

                    } catch (error) {
                        console.error('Error sending message:', error);
                        socket.emit('error', { message: 'Failed to send message' });
                    }
                });

            } catch (error) {
                console.error('Socket authentication error:', error);
                socket.disconnect();
            }
        });
    }
}
