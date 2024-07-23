import mongoose from 'mongoose';
import { VoiceModel } from './voiceModel.js';

export const logCallQuery = async (callData) => {
    try {
      const call = new VoiceModel(callData);
      return await call.save();
    } catch (error) {
      console.error('Error logging call:', error);
      throw error;
    }
  };
  
  export const updateCallStatusQuery = async (callId, status) => {
    try {
      return await VoiceModel.findByIdAndUpdate(callId, { status }, { new: true });
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  };
  
  export const updateCallEndQuery = async (callId, end_time, duration) => {
    try {
      return await VoiceModel.findByIdAndUpdate(callId, { end_time, duration, status: "ended" }, { new: true });
    } catch (error) {
      console.error('Error updating call end time:', error);
      throw error;
    }
  };
  
  export const findCallById = async (callId) => {
    try {
      return await VoiceModel.findById(callId);
    } catch (error) {
      console.error('Error finding call by ID:', error);
      throw error;
    }
  };

 
