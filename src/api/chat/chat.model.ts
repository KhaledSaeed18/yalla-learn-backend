import mongoose, { Schema, Document } from 'mongoose';

// Chat conversation schema
export interface IConversation extends Document {
    listingId?: string;
    serviceId?: string;
    entityType: 'listing' | 'service';
    participants: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
    {
        listingId: {
            type: String,
            required: false
        },
        serviceId: {
            type: String,
            required: false
        },
        entityType: {
            type: String,
            enum: ['listing', 'service'],
            required: true
        },
        participants: [
            {
                type: String,
                required: true
            }
        ],
    },
    { timestamps: true }
);

// Message schema
export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: string;
    content: string;
    read: boolean;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true
        },
        senderId: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Simple indexes for query performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ listingId: 1, participants: 1 });
ConversationSchema.index({ serviceId: 1, participants: 1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);