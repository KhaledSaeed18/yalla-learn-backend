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
                origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
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

                // Join user's personal room (for direct messages)
                socket.join(userId);

                console.log(`User ${userId} authenticated and connected`);

                // Handle disconnect
                socket.on('disconnect', () => {
                    console.log(`User ${userId} disconnected`);
                    this.connectedUsers.delete(userId);
                });

                // Handle joining a conversation
                socket.on('join-conversation', (conversationId: string) => {
                    socket.join(conversationId);
                    console.log(`User ${userId} joined conversation ${conversationId}`);
                });

                // Handle sending a message
                socket.on('send-message', async (data: {
                    conversationId: string;
                    content: string;
                    listingId?: string;
                    serviceId?: string;
                    receiverId?: string;
                }) => {
                    try {
                        let conversationId = data.conversationId;

                        // If this is a new conversation (no conversationId), create it
                        if (!conversationId && ((data.listingId || data.serviceId) && data.receiverId)) {
                            let entityType: 'listing' | 'service';
                            let entityId: string;
                            let entityExists = false;

                            if (data.listingId) {
                                // Check if listing exists in PostgreSQL
                                const listing = await prisma.listing.findUnique({
                                    where: { id: data.listingId }
                                });

                                if (!listing) {
                                    socket.emit('error', { message: 'Listing not found' });
                                    return;
                                }

                                entityType = 'listing';
                                entityId = data.listingId;
                                entityExists = true;
                            } else if (data.serviceId) {
                                // Check if service exists in PostgreSQL
                                const service = await prisma.gigService.findUnique({
                                    where: { id: data.serviceId }
                                });

                                if (!service) {
                                    socket.emit('error', { message: 'Service not found' });
                                    return;
                                }

                                entityType = 'service';
                                entityId = data.serviceId;
                                entityExists = true;
                            } else {
                                socket.emit('error', { message: 'Either listing ID or service ID is required' });
                                return;
                            }

                            if (entityExists) {
                                // Create the conversation data
                                const conversationData: {
                                    participants: string[];
                                    entityType: 'listing' | 'service';
                                    listingId?: string;
                                    serviceId?: string;
                                } = {
                                    participants: [userId, data.receiverId],
                                    entityType
                                };

                                // Add the appropriate ID based on entity type
                                if (entityType === 'listing') {
                                    conversationData.listingId = entityId;
                                } else {
                                    conversationData.serviceId = entityId;
                                }

                                // Create a new conversation
                                const newConversation = await Conversation.create(conversationData);

                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                conversationId = (newConversation as any)._id.toString();

                                // Join both users to the conversation room
                                socket.join(conversationId);
                                const receiverSocketId = this.connectedUsers.get(data.receiverId);
                                if (receiverSocketId) {
                                    this.io.sockets.sockets.get(receiverSocketId)?.join(conversationId);
                                }

                                // Emit new conversation event to both users
                                this.io.to(conversationId).emit('new-conversation', {
                                    conversation: newConversation
                                });
                            }
                        }

                        // Create and save the message
                        const newMessage = await Message.create({
                            conversationId,
                            senderId: userId,
                            content: data.content
                        });

                        // Populate sender info from PostgreSQL
                        const sender = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { firstName: true, lastName: true, avatar: true }
                        });

                        // Emit message to the conversation room
                        this.io.to(conversationId).emit('new-message', {
                            message: {
                                ...newMessage.toObject(),
                                sender: {
                                    id: userId,
                                    firstName: sender?.firstName,
                                    lastName: sender?.lastName,
                                    avatar: sender?.avatar
                                }
                            }
                        });
                    } catch (error) {
                        console.error('Error sending message:', error);
                        socket.emit('error', { message: 'Failed to send message' });
                    }
                });

                // Handle marking messages as read
                socket.on('mark-read', async (conversationId: string) => {
                    try {
                        await Message.updateMany(
                            {
                                conversationId,
                                senderId: { $ne: userId }, // Only mark messages from other users
                                read: false
                            },
                            { read: true }
                        );

                        // Notify other participants that messages have been read
                        socket.to(conversationId).emit('messages-read', {
                            conversationId,
                            readBy: userId
                        });
                    } catch (error) {
                        console.error('Error marking messages as read:', error);
                    }
                });

            } catch (error) {
                console.error('Socket authentication error:', error);
                socket.disconnect();
            }
        });
    }

    // Method to send notification to a specific user
    public sendNotification(userId: string, type: string, data: Record<string, unknown>): void {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('notification', { type, data });
        }
    }
}