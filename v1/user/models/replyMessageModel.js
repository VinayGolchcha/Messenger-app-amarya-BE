
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const ReplyMessageSchema = new mongoose.Schema({
    replied_message_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Messages', required: true },
    message_replied_on_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Messages'},
    message_replied_on_group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Groups' }
});

ReplyMessageSchema.plugin(timestamps);

export const ReplyMessageModel = mongoose.model("ReplyMessages", ReplyMessageSchema);
