import mongoose from 'mongoose';
import {GroupModel} from './groupModel.js';

export const createGroupQuery = async (user_data) => {
    return await GroupModel.create(user_data);
}

export const groupDetailQuery = async ( user_id) => {
    return await GroupModel.findOne({ 'members': user_id })
    .lean();
}
