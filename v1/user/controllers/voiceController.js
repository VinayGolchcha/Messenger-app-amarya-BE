import dotenv from "dotenv"
import { validationResult } from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import {logCallQuery,updateCallStatusQuery, updateCallEndQuery,findCallById  } from "../models/voiceQuery";
dotenv.config();

export const initiateCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const { caller_id, callee_id } = req.body;
        const callData = {
            caller_id,
            callee_id,
            status: "initiated",
            start_time: new Date()
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
            return errorResponse(res, errors.array(), "")
        }

        const { call_id } = req.body;
        const end_time = new Date();
        const call = await findCallById(call_id);
        const duration = (end_time - call.start_time) / 1000; // duration in seconds

        const updatedCall = await updateCallEndQuery(call_id, end_time, duration);
        return successResponse(res, updatedCall, "Call ended successfully!");
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};


