import mongoose from 'mongoose';
import { VoiceModel } from './voiceModel.js';

export const logCallQuery = async (callData) => {
    try {
        const call = new VoiceModel(callData);
        return await call.save();
    } catch (error) {
        console.error('Error logging call:', error);
        throw new Error('Error logging call');
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
        throw new Error('Error updating call status');
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
        throw new Error('Error updating call end time');
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
        throw new Error('Error updating call answer time');
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
        throw new Error('Error finding call by ID');
    }
};

export const fetchCallLogsHistoryQuery = async (caller_id, callee_id) => {
    try {
        return await VoiceModel.find({caller_id: caller_id, callee_id: callee_id});
    } catch (error) {
        console.error('Error finding call by ID:', error);
        throw new Error('Error finding call by ID');
    }
};
