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

        let { user_id } = req.body;
        user_id = new mongoose.Types.ObjectId(user_id);

        const data = await fetchCallLogsHistoryQuery(user_id);
        return successResponse(res, data, 'Call Logs fetched successfully');
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
};
