
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const GroupMessageSchema = new mongoose.Schema({
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Groups', required: true },
    senders_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image', 'audio', 'video', 'document'], required: true},
    media_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Media'},
    content: { type: String, default: null},
    sent_at: { type: Date, default: new Date},
    sender_deleted: { type: Boolean, default: false},
});

GroupMessageSchema.plugin(timestamps);
GroupMessageSchema.index({ "senders_id": 1 }, { name: "sender's id for data" });
GroupMessageSchema.index({ "group_id": 1 }, { name: "group id for data" });

export const GroupMessageModel = mongoose.model("GroupMessages", GroupMessageSchema);
