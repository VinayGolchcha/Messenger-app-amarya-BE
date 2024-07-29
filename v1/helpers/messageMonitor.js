import {GroupMessageModel} from '../user/models/groupMessagesModel.js'
import {GroupModel} from '../user/models/groupModel.js'

export const monitorMessages = async() =>{
    try {
        const change_stream = GroupMessageModel.watch();
        change_stream.on('change', async (change) => {
        if (change.operationType === 'update' && change.updateDescription.updatedFields.read_by) {
            const message = await GroupMessageModel.findOne({ _id: change.documentKey._id });
            const group_members = await GroupModel.findOne({ _id: message.group_id });
            if (message.read_by.length === group_members.members.length) {
            await GroupMessageModel.updateOne({ _id: message._id }, { $set: { is_read: true } });
            }
        }
        });
        change_stream.on('error', (error) => {
            console.error('Change stream error:', error);
            monitorMessages();
          });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
}
