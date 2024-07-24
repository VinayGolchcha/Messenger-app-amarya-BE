import dotenv from 'dotenv';
import { validationResult } from 'express-validator';
import { successResponse, errorResponse, internalServerErrorResponse } from '../../../utils/response.js';
import mongoose from 'mongoose';
import { logCallQuery, updateCallStatusQuery, updateCallEndQuery, findCallById } from '../models/voiceQuery.js';

dotenv.config();

export const initiateCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), '');
        }

        const { caller_id, callee_id } = req.body;
        const callerObjectId = new mongoose.Types.ObjectId(caller_id);
        const calleeObjectId = new mongoose.Types.ObjectId(callee_id);
        const status = 'initiated';
        const start_time = new Date();

        const callData = {
            caller_id: callerObjectId,
            callee_id: calleeObjectId,
            status,
            start_time
        };

        const call = await logCallQuery(callData);
        return successResponse(res, call, 'Call initiated successfully!');
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};

export const answerCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), '');
        }

        const { call_id } = req.body;
        const callObjectId = new mongoose.Types.ObjectId(call_id);

        const call = await updateCallStatusQuery(callObjectId, 'answered');
        return successResponse(res, call, 'Call answered successfully!');
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};

export const rejectCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), '');
        }

        const { call_id } = req.body;
        const callObjectId = new mongoose.Types.ObjectId(call_id);

        const call = await updateCallStatusQuery(callObjectId, 'rejected');
        return successResponse(res, call, 'Call rejected successfully!');
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};

export const endCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), '');
        }

        const { call_id } = req.body;
        const callObjectId = new mongoose.Types.ObjectId(call_id);
        const end_time = new Date();

        const call = await findCallById(callObjectId);
        if (!call) {
            return notFoundResponse(res, 'Call not found');
        }

        const duration = (end_time - call.start_time) / 1000; // duration in seconds

        // Update call with end_time and duration
        const updatedCall = await updateCallEndQuery(callObjectId, end_time, duration);
        return successResponse(res, updatedCall, 'Call ended successfully!');
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};
