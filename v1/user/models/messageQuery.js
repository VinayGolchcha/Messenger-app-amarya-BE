import mongoose from 'mongoose';
import {MessageModel} from './messageModel.js';
import {ReplyMessageModel} from './replyMessageModel.js'

export const addMessageQuery = async (message_data) => {
    try{
        return await MessageModel.create(message_data);
    } catch (error) {
        console.error('Error finding addMessageQuery details:', error);
        throw error;
    }
}

export const markAsReadQuery = async (id) => {
    return await MessageModel.findByIdAndUpdate(id, { is_read: true, is_new: false });
}

export const findMessageQuery = async (senders_id, recievers_id, search_text) => {
    try {
        const pipeline = [
            {
                $match: {
                    senders_id: senders_id,
                    recievers_id: recievers_id,
                    content: { $regex: search_text, $options: 'i' },
                    sender_deleted: false
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
                $project: {
                    senders_id: 1,
                    recievers_id: 1,
                    content: 1,
                    message_type: 1,
                    is_read: 1,
                    media_id: 1,
                    'media.file_type': 1,
                    'media.file_name': 1,
                    'media.download_link': 1,
                    time: {
                        $dateToString: {
                            format: "%H:%M",
                            date: "$sent_at",
                            timezone: "+05:30"
                        }
                    }
                }
            }
        ];

        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding findMessageQuery details:', error);
        throw error;
    }
};

export const fetchChatHistoryQuery = async (sender_id, reciever_id, skip, limit) => {
    try {
            const pipeline = [
                {
                    $match: {
                        $or: [{senders_id: sender_id, recievers_id: reciever_id }, {senders_id: reciever_id, recievers_id: sender_id}],
                        'delete_chat.userId': sender_id,
                        'delete_chat.delete_status': false
                    }
                },
                {
                    $addFields: {
                        is_sender: { $eq: ["$senders_id", sender_id] },
                        is_receiver: { $eq: ["$recievers_id", sender_id] }
                    }
                },
                {
                    $redact: {
                        $cond: {
                            if: {
                                $or: [
                                    { $and: [{ $eq: ["$is_sender", true] }, { $eq: ["$sender_deleted", false] }] },
                                    { $and: [{ $eq: ["$is_receiver", true] }, { $eq: ["$reciever_deleted", false] }] }
                                ]
                            },
                            then: "$$KEEP",
                            else: "$$PRUNE"
                        }
                    }
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
                                    download_link: 1
                                }
                            }
                        ],
                        as: 'media'
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
                    $lookup: {
                        from: 'users',
                        localField: 'recievers_id',
                        foreignField: '_id',
                        as: 'receiver'
                    }
                },
                {
                    $lookup: {
                        from: 'replymessages',
                        localField: '_id',
                        foreignField: 'message_replied_on_id',
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
                        from: 'messages',
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
                    $lookup: {
                        from: 'users',
                        localField: 'replied_message.senders_id',
                        foreignField: '_id',
                        as: 'reply_sender'
                    }
                },
                {
                    $unwind: {
                        path: '$reply_sender',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $sort: { sent_at: -1 }
                },
                {
                    $project: {
                        message_id: "$_id",
                        senders_id: 1,
                        sender_name: { $arrayElemAt: ['$sender.username', 0] },
                        recievers_id: 1,
                        receiver_name: { $arrayElemAt: ['$receiver.username', 0] },
                        content: 1,
                        message_type: 1,
                        is_read: 1,
                        media: 1,
                        time: {
                            $dateToString: {
                                format: "%H:%M",
                                date: "$sent_at",
                                timezone: "+05:30"
                            }
                        },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } },
                        is_sent_by_sender: { $eq: ['$senders_id', sender_id] },
                        replied_message: {
                            message_id: "$replied_message._id",
                            senders_id: "$replied_message.senders_id",
                            reply_sender: "$reply_sender.username",
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

            return await MessageModel.aggregate(pipeline);

    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};


export const fetchNewMessagesForUserQuery = async(user_id) => {
    try {
        return await MessageModel.find({ 
            recievers_id: user_id, 
            is_new: true, 
            // reciever_deleted: false 
        })
        .select('senders_id recievers_id content message_type is_read media_id sent_at')
        .populate('media_id', 'file_type file_name download_link');
    } catch (error) {
        console.error('Error finding fetchNewMessagesForUserQuery details:', error);
        throw error;
    }
}

export const checkUserForGivenMessageQuery = async(user_id, message_id) => {
    try {
        return await MessageModel.findOne({
            _id: message_id,
            $or: [
                { recievers_id: user_id },
                { senders_id: user_id }
            ]
        }).select('senders_id recievers_id content message_type is_read media_id sent_at');
    } catch (error) {
        console.error('Error finding checkUserForGivenMessageQuery details:', error);
        throw error;
    }
}

export const updateDeleteStatusForUserQuery = async (is_user_sender, id) => {
    try {
        if(is_user_sender == true){
            return await MessageModel.findByIdAndUpdate(id, { sender_deleted: true }, { safe: true, upsert: true, new: true });
        }else{
            return await MessageModel.findByIdAndUpdate(id, { reciever_deleted: true }, { safe: true, upsert: true, new: true });
        }
    } catch (error) {
        console.error('Error finding updateDeleteStatusForUserQuery details:', error);
        throw error;
    }
}

export const deleteMessageByIdQuery = async(message_id) => {
    try {
        return await MessageModel.deleteOne({ _id: new mongoose.Types.ObjectId(message_id) });
    } catch (error) {
        console.error('Error finding deleteMessageByIdQuery details:', error);
        throw error;
    }
}

export const updateDeleteStatusForAllMessagesInChatQuery = async(user_id, reciever_id) => {
    try {
        return await MessageModel.updateMany(
            {
              $or: [
                { senders_id: user_id, recievers_id: reciever_id },
                { senders_id: reciever_id, recievers_id: user_id }
              ],
                'delete_chat.userId': user_id
            },
            {
              $set: { 'delete_chat.$.delete_status': true }
            },
            {
              safe: true,
              upsert: false,
              new: true
            }
          );
    } catch (error) {
        console.error('Error finding updateDeleteStatusForAllMessagesInChatQuery details:', error);
        throw error;
    }
}

export const fetchNewMessagesForNotificationQuery = async(user_id) => {
    try {
        const pipeline = [
            {
                $match: { 
                    recievers_id: user_id, 
                    is_new: true
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
                $lookup: {
                    from: 'users',
                    localField: 'recievers_id',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$receiver'
            },
            {
                $lookup: {
                    from: 'users',
                    let: { sender_id: "$senders_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", user_id]
                                }
                            }
                        },
                        {
                            $project: {
                                isMuted: {
                                    $filter: {
                                        input: "$mute_notifications.direct_messages",
                                        as: "dm",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$dm.userId", "$$sender_id"] },
                                                { $eq: ["$$dm.mute_status", true] }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    as: 'sender_mute_status'
                }
            },
            {
                $match: {
                    "sender_mute_status.isMuted": { $size: 0 }
                }
            },
            {
                $group: {
                    _id: "$senders_id",
                    sender_name: { $first: "$sender.username" },
                    reciever_email: { $first: "$receiver.email" },
                    messages: {
                        $push: {
                            senders_id: "$senders_id",
                            recievers_id: "$recievers_id",
                            content: "$content",
                            message_type: "$message_type",
                            is_read: "$is_read",
                            media_id: "$media_id",
                            media_details: {
                                file_type: "$media.file_type",
                                file_name: "$media.file_name",
                                download_link: "$media.download_link"
                            },
                            time: "$sent_at"
                        }
                    }
                }
            },
            {
                $project: {
                    senders_id: "$_id",
                    sender_name: 1,
                    reciever_email: 1, 
                    messages: 1,
                    _id: 0
                }
            }
        ];

        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchNewMessagesForUserQuery details:', error);
        throw error;
    }
}

export const fetchConversationListQuery = async(user_id) => {
    try {
        const pipeline = [
            {
                $match: { 
                    recievers_id: user_id
                }
            },
            {
                $match: {
                    reciever_deleted: { $ne: true }
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
                $lookup: {
                    from: 'users',
                    localField: 'recievers_id',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$receiver'
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: "$senders_id",
                    sender_name: { $first: "$sender.username" },
                    socket_id: { $first: "$sender.socket_id" },
                    reciever_username: { $first: "$receiver.username" },
                    messages: {
                        $first: {
                            content: "$content",
                            message_type: "$message_type",
                            is_read: "$is_read",
                            media_id: "$media_id",
                            media_details: {
                                file_type: "$media.file_type",
                                file_name: "$media.file_name",
                                download_link: "$media.download_link"
                            },
                            sent_at: "$sent_at",
                            time: {
                                $dateToString: {
                                    format: "%H:%M",
                                    date: "$sent_at",
                                    timezone: "+05:30"
                                }
                            },
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } }
                        }
                    },
                    new_messages_count: {
                        $sum: {
                            $cond: [{ $eq: ["$is_new", true] }, 1, 0]
                        }
                    },
                    last_message_time: { $first: "$sent_at" }
                }
            },
            {
                $sort: { last_message_time: -1 }
            },
            {
                $project: {
                    senders_id: "$_id",
                    sender_name: {
                        $cond: {
                            if: { $eq: ["$_id", user_id] },
                            then: "You",
                            else: "$sender_name"
                        }
                    },
                    socket_id: 1,
                    reciever_username: 1, 
                    content : "$messages.content",
                    message_type : "$messages.message_type",
                    is_read : "$messages.is_read",
                    media_id : "$messages.media_id",
                    media_details : "$messages.media_details",
                    time : "$messages.time",
                    date : "$messages.date",
                    sent_at : "$messages.sent_at",
                    new_messages_count: 1,
                    _id: 0
                }
            }
        ];
        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchConversationListQuery details:', error);
        throw error;
    }
}

export const fetchRemainingConversationListQuery = async(user_id) => {
    try {
        const pipeline = [
            {
                $match: { 
                    senders_id: user_id
                }
            },
            {
                $lookup: {
                    from: 'media',
                    localField: 'media_id',
                    foreignField: '_id',
                    as: 'media_details'
                }
            },
            {
                $unwind: {
                    path: '$media_details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$recievers_id",
                    messages: {
                        $first: {
                            content: "$content",
                            message_type: "$message_type",
                            is_read: "$is_read",
                            media_id: "$media_id",
                            media_details: {
                                file_type: "$media_details.file_type",
                                file_name: "$media_details.file_name",
                                download_link: "$media_details.download_link"
                            },
                            sent_at: "$sent_at",
                            time: {
                                $dateToString: {
                                    format: "%H:%M",
                                    date: "$sent_at",
                                    timezone: "+05:30"
                                }
                            },
                            date: { 
                                $dateToString: { 
                                    format: "%Y-%m-%d", 
                                    date: "$sent_at" 
                                } 
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$receiver'
            },
            // {
            //     $lookup: {
            //         from: 'users',
            //         localField: 'senders_id',
            //         foreignField: '_id',
            //         as: 'sender'
            //     }
            // },
            // {
            //     $unwind: '$sender'
            // },
            {
                $lookup: {
                    from: 'messages',
                    let: { receiverId: "$_id" },
                    pipeline: [
                        { 
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$senders_id", "$$receiverId"] },
                                        { $eq: ["$recievers_id", user_id] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'replies'
                }
            },
            {
                $addFields: {
                    hasReplies: { $gt: [{ $size: "$replies" }, 0] }
                }
            },
            {
                $match: {
                    hasReplies: false
                }
            },
            {
                $sort: { "messages.sent_at": -1 }
            },
            {
                $project: {
                    _id: 0,
                    senders_id: "$receiver._id",
                    sender_name: {
                        $cond: {
                            if: { $eq: ["$_id", user_id] },
                            then: "You",
                            else: "$receiver.username"
                        }
                    },
                    socket_id: "$receiver.socket_id",
                    content : "$messages.content",
                    message_type : "$messages.message_type",
                    is_read : "$messages.is_read",
                    media_id : "$messages.media_id",
                    media_details : "$messages.media_details",
                    time : "$messages.time",
                    date : "$messages.date",
                    sent_at : "$messages.sent_at",
                    new_messages_count: { $toInt: '0' }
                }
            }
        ];
        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchRemainingConversationListQuery details:', error);
        throw error;
    }
}

export const addEntryForDeleteChatQuery = async(id, senders_id, receivers_id) => {
    try {
        const data1 = await MessageModel.updateOne(
            {
                _id: id,
                senders_id: senders_id, recievers_id: receivers_id,
            },
            {
                $push: {
                    delete_chat: {$each: [
                        { userId: senders_id},
                        { userId: receivers_id}
                      ]}
                }
            },
            { upsert: true }
        );
        return data1
    } catch (error) {
        console.error('Error in addEntryForDeleteChatQuery details:', error);
        throw error;
    }
}

export const addRepliedMessageDetailQuery = async(id, message_id) => {
    try {
        const data = {
            replied_message_id: new mongoose.Types.ObjectId(id), message_replied_on_id: new mongoose.Types.ObjectId(message_id)
        }
            return await ReplyMessageModel.create(data);
    } catch (error) {
        console.error('Error in addRepliedMessageDetailQuery details:', error);
        throw error;
    }
}

export const repliedMessageDetailQuery = async(id) => {
    try {
        let object_id = new mongoose.Types.ObjectId(id);
            const pipeline = [
                {
                    $match: { 
                        replied_message_id: object_id
                    }
                },
                {
                    $lookup: {
                        from: 'messages',
                        localField: 'replied_message_id',
                        foreignField: '_id',
                        as: 'message'
                    }
                },
                {
                    $unwind: {
                        path: '$message'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'message.senders_id',
                        foreignField: '_id',
                        as: 'sender'
                    }
                },
                {
                    $unwind: {
                        path: '$sender'
                    }
                },
                {
                    $project: {
                        senders_id: "$message.senders_id",
                        sender_name: "$sender.username",
                        recievers_id: "$message.recievers_id",
                        message_type: "$message.message_type",
                        media_id: "$message.media_id", 
                        content: "$message.content"
                    }
                }
            ];
    
            return await ReplyMessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error in repliedMessageDetailQuery details:', error);
        throw error;
    }
}

export const addRepliedGroupMessageDetailQuery = async(id, group_id) => {
    try {
        const data = {
            replied_message_id: new mongoose.Types.ObjectId(id), message_replied_on_group_id: new mongoose.Types.ObjectId(group_id)
        }
            return await ReplyMessageModel.create(data);
    } catch (error) {
        console.error('Error in addRepliedGroupMessageDetailQuery details:', error);
        throw error;
    }
}

export const repliedGroupMessageDetailQuery = async(id) => {
    try {
        let object_id = new mongoose.Types.ObjectId(id);
            const pipeline = [
                {
                    $match: { 
                        replied_message_id: object_id
                    }
                },
                {
                    $lookup: {
                        from: 'groupmessages',
                        localField: 'replied_message_id',
                        foreignField: '_id',
                        as: 'message'
                    }
                },
                {
                    $unwind: {
                        path: '$message'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'message.senders_id',
                        foreignField: '_id',
                        as: 'sender'
                    }
                },
                {
                    $unwind: {
                        path: '$sender'
                    }
                },
                {
                    $project: {
                        senders_id: "$message.senders_id",
                        sender_name: "$sender.username",
                        message_type: "$message.message_type",
                        media_id: "$message.media_id", 
                        content: "$message.content"
                    }
                }
            ];
    
            return await ReplyMessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error in repliedMessageDetailQuery details:', error);
        throw error;
    }
}