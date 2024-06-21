
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const MediaSchema = new mongoose.Schema({
    file_type: { type: String, enum: ['text', 'image', 'audio', 'video', 'document'], required: true},
    file_name: { type: String},
    file_data: { type: Buffer, required: true },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaded_at: { type: Date, default: new Date}
});

MediaSchema.plugin(timestamps);
MediaSchema.index({ "senders_id": 1 }, { name: "sender's id for data" });

export const MediaModel = mongoose.model("Media", MediaSchema);
