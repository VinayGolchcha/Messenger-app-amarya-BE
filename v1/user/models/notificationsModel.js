
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const notificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, default: null },
    email: { type: String, default: "", trim: true },
    notification_content: { type: String, default: "", trim: true },
    sent_status: {type: Boolean, default: false}
});

notificationSchema.plugin(timestamps);

export const NotificationsModel = mongoose.model("Notification", notificationSchema);
