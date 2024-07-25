import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const { Schema } = mongoose;

const voiceSchema = new Schema({
  caller_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  callee_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  call_initiated_time: { type: Date, required: true },
  start_time: { type: Date },
  end_time: { type: Date },
  duration: { type: Number, min: 0 }, // Duration in seconds, must be non-negative
  status: { type: String }
});

voiceSchema.plugin(timestamps);

export const VoiceModel = mongoose.model('Voice', voiceSchema);
