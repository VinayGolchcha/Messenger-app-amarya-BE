
import mongoose from 'mongoose';
import {MediaModel} from './mediaModel.js';

export const uploadMediaQuery = async (media_data) => {
    try{
        return await MediaModel.create(media_data);
    } catch (error) {
        console.error('Error in addMessageQuery details:', error);
        throw error;
    }
}

export const fetchMediaDetailsQuery = async (media_id) => {
    try{
        return await MediaModel.findOne({_id: media_id});
    } catch (error) {
        console.error('Error in fetchMediaDetailsQuery details:', error);
        throw error;
    }
}