import dotenv from 'dotenv';
import { validationResult } from 'express-validator';
import { successResponse, errorResponse, internalServerErrorResponse } from '../../../utils/response.js';
import mongoose from 'mongoose';
import { fetchCallLogsHistoryQuery } from '../models/voiceQuery.js';

dotenv.config();

export const fetchCallLogs = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), '');
        }

        let { caller_id, callee_id } = req.body;
        caller_id = new mongoose.Types.ObjectId(caller_id);
        callee_id = new mongoose.Types.ObjectId(callee_id);

        const data = await fetchCallLogsHistoryQuery(caller_id, callee_id);
        return successResponse(res, data, 'Call Logs fetched successfully');
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};
