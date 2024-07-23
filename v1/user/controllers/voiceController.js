import dotenv from "dotenv"
import { validationResult } from "express-validator"
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse, internalServerErrorResponse } from "../../../utils/response.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { logCallQuery,updateCallStatusQuery,updateCallEndQuery,findCallById } from '../models/voiceQuery.js'
dotenv.config();

export const initiateCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let { caller_id, callee_id } = req.body;
        let status;
        let start_time;
        caller_id = new mongoose.Types.ObjectId(caller_id);
        callee_id = new mongoose.Types.ObjectId(callee_id);
        status= "initiated",
        start_time= new Date()
        const callData = {
            caller_id,
            callee_id,
            status,
            start_time
        };
        const call = await logCallQuery(callData);
        return successResponse(res, call, "Call initiated successfully!");
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};

export const answerCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const { call_id } = req.body;
        call_id = new mongoose.Types.ObjectId(call_id);

        const call = await updateCallStatusQuery(call_id, "answered");
        return successResponse(res, call, "Call answered successfully!");
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};

export const rejectCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const { call_id } = req.body;
        call_id = new mongoose.Types.ObjectId(call_id);
        const call = await updateCallStatusQuery(call_id, "rejected");
        return successResponse(res, call, "Call rejected successfully!");
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};

export const endCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "");
        }

        const { call_id } = req.body;
        const end_time = new Date();
        const call = await findCallById(call_id);
        
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        const duration = (end_time - call.start_time) / 1000; // duration in seconds

        // Update call with end_time and duration
        const updatedCall = await updateCallEndQuery(call_id, end_time, duration);
        return successResponse(res, updatedCall, "Call ended successfully!");
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};


