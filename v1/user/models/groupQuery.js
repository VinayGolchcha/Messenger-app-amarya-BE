import mongoose from 'mongoose';
import { GroupModel} from './groupModel.js';
import { GroupMessageModel } from './groupMessagesModel.js';
import { UserModel } from './userModel.js';

export const createGroupQuery = async (data) => {
    return await GroupModel.create(data);
}

export const updateGroupQuery = async (id, data) => {
    try {
        return await GroupModel.findByIdAndUpdate(id, {$set: data}, { safe: true, upsert: false, new: true });
    } catch (error) {
        console.error('Error finding checkGroupNameExistsQuery details:', error);
        throw error;
    }
}

export const groupDetailQuery = async (id, user_id) => {
    return await GroupModel.findOne({ _id: id, 'members': user_id })
    .lean();
}

export const checkGroupNameExistsQuery = async(group_name) => {
    try {
        return await GroupModel.find({group_name: group_name}).select('group_name created_by members');
    } catch (error) {
        console.error('Error finding checkGroupNameExistsQuery details:', error);
        throw error;
    }
}

export const addGroupMessageQuery = async(message_data) => {
    try {
        return await GroupMessageModel.create(message_data);
    } catch (error) {
        console.error('Error finding addGroupMessageQuery details:', error);
        throw error;
    }
}

export const getGroupDataQuery = async(group_name) => {
    try {
        return await GroupModel.findOne({'group_name': group_name});
    } catch (error) {
        console.error('Error finding getGroupDataQuery details:', error);
        throw error;
    }
}

export const fetchGroupChatHistoryQuery = async (group_id, sender_id, skip, limit) => {
    try {
            const pipeline = [
                {
                    $match: {
                        group_id: group_id,
                        deleted_by_users: { $ne: sender_id }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'senders_id',
                        foreignField: '_id',
                        as: 'sender'
                    }
                },
                {
                    $unwind: '$sender'
                },
                {
                    $addFields: {
                        media_id: { $ifNull: ["$media_id", []] }
                    }
                },
                {
                    $lookup: {
                        from: 'media',
                        let: { media_ids: "$media_id" },
                        pipeline: [
                            { $match: { $expr: { $in: ["$_id", "$$media_ids"] } } },
                            {
                                $project: {
                                    file_type: 1,
                                    file_name: 1,
                                    file_data: 1
                                }
                            }
                        ],
                        as: 'media'
                    }
                },
                {
                    $lookup: {
                        from: 'replymessages',
                        localField: '_id',
                        foreignField: 'message_replied_on_group_id',
                        as: 'replied_message_info'
                    }
                },
                {
                    $unwind: {
                        path: '$replied_message_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'groupmessages',
                        localField: 'replied_message_info.replied_message_id',
                        foreignField: '_id',
                        as: 'replied_message'
                    }
                },
                {
                    $unwind: {
                        path: '$replied_message',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $sort: { sent_at: -1 }
                },
                {
                    $project: {
                        message_id: "$_id",
                        group_id: 1,
                        senders_id: 1,
                        'sender.username': 1,
                        content: 1,
                        message_type: 1,
                        media: 1,
                        sent_at: {
                            $dateToString: {
                                format: "%H:%M",
                                date: "$sent_at",
                                timezone: "+05:30"
                            }
                        },
                        is_read: 1,
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } },
                        is_sent_by_sender: { $eq: ['$senders_id', sender_id] },
                        replied_message: {
                            message_id: "$replied_message._id",
                            senders_id: "$replied_message.senders_id",
                            content: "$replied_message.content",
                            time: {
                                $dateToString: {
                                    format: "%H:%M",
                                    date: "$replied_message.sent_at",
                                    timezone: "+05:30"
                                }
                            }
                        }
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ];

            return await GroupMessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error fetching group chat history:', error);
        throw error;
    }
};

export const fetchGroupsDataForUserQuery = async(user_id) => {
    try {
        const pipeline = [
            {
                $match: {
                    members: user_id
                }
            },
            {
                $project: {
                    sender_name: null, 
                    group_id: '$_id',
                    group_name: 1,
                    members: 1,
                    created_by: 1,
                    new_messages_count: null,
                    senders_id: null,
                    sender_socket_id: null, 
                    messages: []
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ];

        const result = await GroupModel.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error('Error finding fetchGroupsDataForUserQuery details:', error);
        throw error;
    }
}

export const checkUserAsAdminForGroupQuery = async(id, user_id) => {
    try {
        return await GroupModel.findOne({_id: id, created_by: user_id}).select('group_name created_by members');
    } catch (error) {
        console.error('Error finding checkUserAsAdminForGroupQuery details:', error);
        throw error;
    }
}

export const findGroupByNameQuery = async(search_text) => {
    try {
        return await GroupModel.find({ group_name: { $regex: search_text, $options: 'i' } }).select('_id group_name created_by');
    } catch (error) {
        console.error('Error finding findGroupByNameQuery details:', error);
        throw error;
    }
}

export const findMessageinGroupQuery = async(search_text, group_id) => {
    try {
        return await GroupMessageModel.find({ 
            content: { $regex: search_text, $options: 'i' }, 
            group_id: group_id 
          })
          .select('_id content message_type senders_id media_id')
          .populate('media_id', 'file_type file_name file_data');
    } catch (error) {
        console.error('Error finding findMessageinGroupQuery details:', error);
        throw error;
    }
}

export const fetchGroupConversationListQuery = async(user_id, limit_per_sender = 1) => {
    try {
        const pipeline = [
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group_id',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            {
                $unwind: '$group'
            },
            {
                $match: { 
                        'group.members': user_id
                }
            },
            {
                $match: {
                    senders_id: { $ne: user_id }
                }
            },
            {
                $lookup: {
                    from: 'media',
                    localField: 'media_id',
                    foreignField: '_id',
                    as: 'media'
                }
            },
            {
                $unwind: {
                    path: '$media',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senders_id',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: '$sender'
            },
            {
                $sort: { sent_at: -1 }
            },
            {
                $group: {
                    _id: "$senders_id",
                    sender_name: { $first: "$sender.username" },
                    sender_socket_id: {$first: "$sender.socket_id"},
                    group_id: { $first: "$group._id" },
                    group_name: { $first: "$group.group_name" },
                    members: { $first: "$group.members" },
                    created_by: { $first: "$group.created_by" },
                    is_read: { $first: "$group.is_read" },
                    messages: {
                        $push: {
                            senders_id: "$senders_id",
                            content: "$content",
                            message_type: "$message_type",
                            media_id: "$media_id",
                            media_details: {
                                file_type: "$media.file_type",
                                file_name: "$media.file_name",
                                file_data: "$media.file_data"
                            },
                            time: {
                                $dateToString: {
                                    format: "%H:%M",
                                    date: "$sent_at",
                                    timezone: "+05:30"
                                }
                            }
                        }
                    },
                    new_messages_count: {
                        $sum: {
                            $cond: [{ $not: { $in: [user_id, "$read_by"] } }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    senders_id: "$_id",
                    sender_name: 1,
                    sender_socket_id: "$sender_socket_id",
                    group_id: 1,
                    group_name: 1,
                    members: 1,
                    created_by: 1, 
                    is_read: 1,
                    messages: { $slice: ["$messages", limit_per_sender] },
                    new_messages_count: 1,
                    _id: 0
                }
            }
        ];

        return await GroupMessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchGroupConversationListQuery details:', error);
        throw error;
    }
}

export const updateReadByStatusQuery = async(id, user_id) => {
    try {
        return await GroupMessageModel.updateOne({_id: id}, { $addToSet: { read_by: user_id } });
    } catch (error) {
        console.error('Error finding updateReadByStatusQuery details:', error);
        throw error;
    }
}

export const markAllUnreadMessagesAsReadQuery = async (id, group_name) => {
    try {
        const user_id = new mongoose.Types.ObjectId(id);
        const messagesToUpdate = await GroupMessageModel.aggregate([
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group_id',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            {
                $unwind: '$group'
            },
            {
                $match: {
                    'group.group_name': group_name,
                    senders_id: { $ne: user_id },
                    read_by: { $ne: user_id }
                }
            },
            {
                $project: {
                    _id: 1,
                    read_by: 1
                }
            }
        ]);

        const updatePromises = messagesToUpdate.map(async (msg) => {
            const message = await GroupMessageModel.findById(msg._id);
            if (message && !message.read_by.includes(user_id)) {
                message.read_by.push(user_id);
                await message.save();
            }
        });

        await Promise.all(updatePromises);
        return { success: true, updatedCount: messagesToUpdate.length };
    } catch (error) {
        console.error('Error updating read_by status:', error);
        throw error;
    }
};

export const fetchNewMessagesForGroupNotificationQuery = async (id) => {
    try {
        const user_id = new mongoose.Types.ObjectId(id);
        const user = await UserModel.findById(user_id);

        const userGroups = await GroupModel.find({ members: user_id });
        const groupIds = userGroups.map(group => group._id);

        const messages = await GroupMessageModel.aggregate([
            {
                $match: {
                    group_id: { $in: groupIds },
                    senders_id: { $ne: user_id },
                    read_by: { $ne: user_id }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { group_id: "$group_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", user_id] },
                                        { $eq: ["$mute_notifications.groups.group_id", "$$group_id"] },
                                        { $eq: ["$mute_notifications.groups.mute_status", true] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'userMuteStatus'
                }
            },
            {
                $match: {
                    "userMuteStatus": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group_id',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            {
                $unwind: '$group'
            },
            {
                $group: {
                    _id: '$group._id',
                    group_name: { $first: '$group.group_name' },
                    reciever_email:{ $first: user.email },
                    messages: {
                        $push: {
                            _id: '$_id',
                            read_by: '$read_by'
                        }
                    }
                }
            }
        ]);
        return messages;
    } catch (error) {
        console.error('Error in fetchNewMessagesForGroupNotificationQuery:', error);
        throw error;
    }
};

export const fetchGroupDetailQuery = async(group_id) => {
    try {
        return await GroupModel.findOne({_id: group_id}).select('_id group_name created_by members');
    } catch (error) {
        console.error('Error finding fetchGroupdetailQuery details:', error);
        throw error;
    }
}

export const deleteGroupMessageByIdQuery = async(message_id) => {
    try {
        return await GroupMessageModel.deleteOne({ _id: new mongoose.Types.ObjectId(message_id) });
    } catch (error) {
        console.error('Error in deleteGroupMessageByIdQuery details:', error);
        throw error;
    }
}

export const checkIfUserIsAdminQuery = async(user_id) => {
    try {
        return await GroupModel.findOne({ created_by: new mongoose.Types.ObjectId(user_id) });
    } catch (error) {
        console.error('Error in checkIfUserIsAdminQuery details:', error);
        throw error;
    }
}

export const deleteGroupChatCompleteQuery = async(group_id) => {
    try {
        return await GroupMessageModel.deleteMany({ group_id: new mongoose.Types.ObjectId(group_id) });
    } catch (error) {
        console.error('Error in deleteGroupChatCompleteQuery details:', error);
        throw error;
    }
}

export const updateDeleteUserStatusForGroupQuery = async(id, user_id) => {
    try {
        return await GroupMessageModel.updateOne({_id: id}, { $addToSet: { deleted_by_users: user_id } });
    } catch (error) {
        console.error('Error finding updateDeleteUserStatusForGroupQuery details:', error);
        throw error;
    }
}

export const getIsReadStatusQuery = async(message_id) => {
    try {
        const id = new mongoose.Types.ObjectId(message_id);
        return await GroupMessageModel.findOne({ _id: id });
    } catch (error) {
        console.error('Error in getIsReadStatusQuery details:', error);
        throw error;
    }
}

export const exitGroupQuery = async (id, user_id) => {
    try {
        return await GroupModel.updateOne({_id: id}, {$pull: {members: user_id}});
    } catch (error) {
        console.error('Error finding exitGroupQuery details:', error);
        throw error;
    }
}

export const exitReadByArrayQuery = async (id, user_id) => {
    try {
        return await GroupMessageModel.updateMany({group_id: id}, {$pull: {read_by: user_id}});
    } catch (error) {
        console.error('Error finding exitReadByArrayQuery details:', error);
        throw error;
    }
}