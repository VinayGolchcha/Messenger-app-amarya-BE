import mongoose from 'mongoose';
import {GroupModel} from './groupModel.js';

export const createGroupQuery = async (user_data) => {
    return await GroupModel.create(user_data);
}

export const groupDetailQuery = async (user_id) => {
    return await GroupModel.findOne({ 'members': user_id })
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