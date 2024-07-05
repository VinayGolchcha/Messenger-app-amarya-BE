import mongoose from 'mongoose';
import {NotificationsModel} from './notificationsModel.js';

export const createNotificationQuery = async (user_id, email, content) => {
    try{
        return await NotificationsModel.create({user_id: user_id, email : email, notification_content: content});
    } catch (error) {
        console.error('Error finding createNotificationQuery details:', error);
        throw error;
    }
}

export const updateNotification = async (id) => {
    try{
        return await NotificationsModel.findByIdAndUpdate(id, { sent_status: true});
    } catch (error) {
        console.error('Error finding createNotificationQuery details:', error);
        throw error;
    }
}
