import mongoose from 'mongoose';

const muteSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Chat'
    },
    muted: {
        type: Boolean,
        default: false
    },
    muted_until: {
        type: Date
    }
});

export const MuteModel = mongoose.model('Mute', muteSchema);
