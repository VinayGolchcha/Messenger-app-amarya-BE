
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const GroupSchema = new mongoose.Schema({
    group_name: { type: String, default: "" , unique: true},
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: {type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default : []}
});

GroupSchema.plugin(timestamps);

export const GroupModel = mongoose.model("Groups", GroupSchema);
