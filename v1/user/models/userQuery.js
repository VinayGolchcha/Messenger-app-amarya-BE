import mongoose from 'mongoose';
import {UserModel} from './userModel.js';

export const create = async (user_data) => {
    return await UserModel.create(user_data);
}

export const userDetailQuery = async (email) => {
    return await UserModel.findOne({ 'email': email, 'is_registered': true })
    .lean();
}

export const insertTokenQuery = async (token, id) => {
    return await UserModel.findOneAndUpdate({ _id: id, is_registered: true }, { $set: { "auth_token": token } }, { safe: true, upsert: false, new: false });
}

export const insertOtpQuery = async(email, otp) => {
    return await UserModel.findOneAndUpdate({ email: email, is_registered: true }, { $set: { "otp": otp} }, { safe: true, upsert: false, new: false });
}

export const getOtpQuery = async(email) => { 
    return await UserModel.findOne({ 'email': email, 'is_registered': true })
    .select('otp')
    .lean()
}

export const updateUserPasswordQuery = async(email, password) => {
    return await UserModel.findOneAndUpdate({ email: email, is_registered: true }, { $set: { "password": password} }, { safe: true, upsert: false, new: false });
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
        console.error('Error finding userGroup details:', error);
        throw error;
    }
}

export const findUserDetailQuery = async(socket_id) => {
    return await UserModel.findOne({ socket_id: socket_id }).lean();
}