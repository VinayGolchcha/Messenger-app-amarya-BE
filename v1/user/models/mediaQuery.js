
import mongoose from 'mongoose';
import {MediaModel} from './mediaModel.js';

export const uploadMediaQuery = async (media_data) => {
    try{
        return await MediaModel.create(media_data);
    } catch (error) {
        console.error('Error finding addMessageQuery details:', error);
        throw error;
    }
}