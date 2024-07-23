import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
const Schema = mongoose.Schema;

const voiceSchema = new mongoose.Schema({
  caller_id: { type: Schema.Types.ObjectId,   ref: 'User',required: true },
  callee_id: { type: Schema.Types.ObjectId,  ref: 'User', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  duration: { type: Number, required: true }
});

voiceSchema.plugin(timestamps);

export const VoiceModel = mongoose.model('Voice', voiceSchema);


