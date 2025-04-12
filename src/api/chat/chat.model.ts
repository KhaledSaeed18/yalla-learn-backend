import mongoose, { Schema, Document } from 'mongoose';

// Chat conversation schema
export interface IConversation extends Document {
    listingId: string;
    participants: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
    {
        listingId: {
            type: String,
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

// Create indexes for faster queries
ConversationSchema.index({ listingId: 1 });
ConversationSchema.index({ participants: 1 });
MessageSchema.index({ conversationId: 1 });
MessageSchema.index({ senderId: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);