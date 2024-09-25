
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const MessageSchema = new mongoose.Schema({
    senders_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recievers_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image', 'audio', 'video', 'document'], required: true},
    unique_message_key: { type: String, required: true },
    media_id : {type: [{type : mongoose.Schema.Types.ObjectId, ref: 'Media'}]},
    content: { type: String, default: null},
    is_read: { type: Boolean, default: false},
    is_new: { type: Boolean, default: true},
    sent_at: { type: Date, default: new Date},
    sender_deleted: { type: Boolean, default: false},
    reciever_deleted: { type: Boolean, default: false},
    delete_chat: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        delete_status: { type: Boolean, default: false }
    }]
});

MessageSchema.plugin(timestamps);
MessageSchema.index({ senders_id: 1, sent_at: -1 });

export const MessageModel = mongoose.model("Messages", MessageSchema);
