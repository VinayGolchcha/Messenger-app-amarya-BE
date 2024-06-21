
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const UserSchema = new mongoose.Schema({
    username: { type: String, default: "" , trim: true },
    email: { type: String, default: "", trim: true },
    password: { type: String, default: "" },
    is_registered: { type: Boolean, default: true },
    auth_token: { type: String, default: null },
    socket_id: { type: String, default: null},
});

UserSchema.plugin(timestamps);

export const UserModel = mongoose.model("User", UserSchema);
