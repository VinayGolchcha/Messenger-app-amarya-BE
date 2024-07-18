
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const voiceSchema = new mongoose.Schema({
    caller_id: { type: String, default: "" , unique: true},
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: {type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default : []}
});

voiceSchema.plugin(timestamps);

export const VoiceModel = mongoose.model("Voice", voiceSchema);
