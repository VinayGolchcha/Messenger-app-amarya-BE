import mongoose from 'mongoose';
import {UserModel} from './userModel.js';

export const create = async (user_data) => {
    return await UserModel.create(user_data);
}

export const userDetailQuery = async (email) => {
    return await UserModel.findOne({ 'email': email, 'is_registered': true })
    .lean();
}

export const userDataQuery = async (id) => {
    let object_id = new mongoose.Types.ObjectId(id);
    return await UserModel.findOne({ '_id': object_id, 'is_registered': true })
    .lean();
}

export const insertTokenQuery = async (token, id) => {
    return await UserModel.findOneAndUpdate({ _id: id, is_registered: true }, { $set: { "auth_token": token } }, { safe: true, upsert: false, new: true });
}

export const updateSocketId = async(email, socket_id) => {
    return await UserModel.findOneAndUpdate({ email: email }, { $set: {"socket_id": socket_id} }, { safe: true, upsert: true, new: true });
}

export const userGroupDetailQuery = async(socket_id, user_id, group_name) => {
    try {
        let object_id = new mongoose.Types.ObjectId(user_id);
        const pipeline = [
            {
                $match: {
                    socket_id: socket_id,
                    _id: object_id
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: '_id',
                    foreignField: 'members',
                    as: 'group_members'
                }
            },
            {
                $unwind: {
                    path: '$group_members',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'group_members.group_name': group_name
                }
            },
            {
                $project: {
                    username: 1,
                    group_name: '$group_members.group_name'
                }
            }
        ];

        return await UserModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding userGroupDetailQuery details:', error);
        throw error;
    }
}

export const findUserDetailQuery = async(socket_id) => {
    return await UserModel.findOne({ socket_id: socket_id }).lean();
}

export const findAllUserDetailQuery = async() => {
    try {
        return await UserModel.find({is_registered: true}).select('_id username email socket_id');
    } catch (error) {
        console.error('Error finding findAllUserDetailQuery details:', error);
        throw error;
    }
}

export const findUserByNameQuery = async(search_text) => {
    try {
        return await UserModel.find({ username: { $regex: search_text, $options: 'i' } }).select('_id username email socket_id');
    } catch (error) {
        console.error('Error finding findUserByNameQuery details:', error);
        throw error;
    }
}

export const getAllUsersQuery = async() => {
    try {
        return await UserModel.find().select('_id username email');
    } catch (error) {
        console.error('Error finding getAllUsersQuery details:', error);
        throw error;
    }
}

export const addMuteDataQuery = async(user_id, recievers_id) => {
    try {
        const data1 = await UserModel.updateOne(
            { _id: user_id },
            {
                $push: {
                    "mute_notifications.direct_messages": {
                        userId: recievers_id
                    }
                }
            },
            { upsert: true }
        );
        const data2 = await UserModel.updateOne(
            { _id: recievers_id },
            {
                $push: {
                    "mute_notifications.direct_messages": {
                        userId: user_id
                    }
                }
            },
            { upsert: true }
        );

        return data1, data2
    } catch (error) {
        console.error('Error finding addMuteDataQuery details:', error);
        throw error;
    }
}

export const addGroupMuteDataQuery = async(user_id, group_id) => {
    try {
        const data1 = await UserModel.updateOne(
            { _id: user_id },
            {
                $push: {
                    "mute_notifications.groups": {
                        group_id: group_id
                    }
                }
            },
            { upsert: true }
        );

        return data1
    } catch (error) {
        console.error('Error finding addMuteDataQuery details:', error);
        throw error;
    }
}

export const updateNotificationStatusQuery = async (user_id, recievers_id, status) => {
    try {
        const updateResult = await UserModel.updateOne({_id: user_id, "mute_notifications.direct_messages.userId": new mongoose.Types.ObjectId(recievers_id)}, {$set: { "mute_notifications.direct_messages.$.mute_status": status}});
                     
        if (updateResult.modifiedCount === 0) {
            const pushUpdate = await UserModel.updateOne(
                { _id: user_id },
                {
                    $push: {
                        "mute_notifications.direct_messages": {
                            userId: recievers_id,
                            mute_status: status
                        }
                    }
                }
            );
            return pushUpdate;
        }

        return updateResult;
    } catch (error) {
        console.error('Error updating mute status:', error);
        throw error;
    }
};

export const updateNotificationStatusForGroupQuery = async (user_id, group_id, status) => {
    try {
        const updateResult = await UserModel.updateOne({_id: user_id, "mute_notifications.groups.group_id": new mongoose.Types.ObjectId(group_id)}, {$set: { "mute_notifications.groups.$.mute_status": status}});
                     
        if (updateResult.modifiedCount === 0) {
            const pushUpdate = await UserModel.updateOne(
                { _id: user_id },
                {
                    $push: {
                        "mute_notifications.groups": {
                            group_id: group_id,
                            mute_status: status
                        }
                    }
                }
            );
            return pushUpdate;
        }

        return updateResult;
    } catch (error) {
        console.error('Error updating mute status:', error);
        throw error;
    }
};