import mongoose from "mongoose";
import timestamps from 'mongoose-timestamp';

const MessageSchema = new mongoose.Schema({
    senders_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receivers_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image', 'audio', 'video', 'document'], required: true },
    media_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    content: { type: String, default: null },
    is_read: { type: Boolean, default: false },
    is_new: { type: Boolean, default: true },
    sent_at: { type: Date, default: new Date },
    senders_deleted: { type: Boolean, default: false }, // New field
    receivers_deleted: { type: Boolean, default: false } // New field
});

MessageSchema.plugin(timestamps);

export const MessageModel = mongoose.model("Messages", MessageSchema);
