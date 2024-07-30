import mongoose from 'mongoose';
import { VoiceModel } from './voiceModel.js';

export const logCallQuery = async (callData) => {
    try {
        return await new VoiceModel(callData).save();
    } catch (error) {
        console.error('Error logging call:', error);
        throw error;
    }
};

export const updateCallStatusQuery = async (callId, status) => {
    try {
        const updatedCall = await VoiceModel.findByIdAndUpdate(callId, { status }, { new: true });
        if (!updatedCall) {
            throw new Error('Call not found');
        }
        return updatedCall;
    } catch (error) {
        console.error('Error updating call status:', error);
        throw error;
    }
};

export const updateCallEndQuery = async (callId, end_time, duration) => {
    try {
        const updatedCall = await VoiceModel.findByIdAndUpdate(
            callId,
            { end_time, duration, status: 'ended' },
            { new: true }
        );
        if (!updatedCall) {
            throw new Error('Call not found');
        }
        return updatedCall;
    } catch (error) {
        console.error('Error updating call end time:', error);
        throw error;
    }
};

export const updateCallAnswerQuery = async (callId, start_time) => {
    try {
        const updatedCall = await VoiceModel.findByIdAndUpdate(
            callId,
            { start_time, status: 'answered' },
            { new: true }
        );
        if (!updatedCall) {
            throw new Error('Call not found');
        }
        return updatedCall;
    } catch (error) {
        console.error('Error updating call answer time:', error);
        throw error;
    }
};

export const findCallById = async (callId) => {
    try {
        const call = await VoiceModel.findById(callId);
        if (!call) {
            throw new Error('Call not found');
        }
        return call;
    } catch (error) {
        console.error('Error finding call by ID:', error);
        throw error;
    }
};

export const fetchCallLogsHistoryQuery = async (caller_id) => {
    try {
        return await VoiceModel.find({$or: [{caller_id: caller_id}, {callee_id : caller_id}] });
    } catch (error) {
        console.error('Error fetching call logs history:', error);
        throw error;
    }
};
