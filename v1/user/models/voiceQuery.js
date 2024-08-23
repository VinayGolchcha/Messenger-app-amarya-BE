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
        const pipeline = [
            {
                $match: {
                    $or: [
                        { caller_id: caller_id },
                        { callee_id: caller_id }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'caller_id',
                    foreignField: '_id',
                    as: 'caller'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'callee_id',
                    foreignField: '_id',
                    as: 'callee'
                }
            },
            {
                $unwind: {
                    path: '$caller',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$callee',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    caller_name: "$caller.username",
                    callee_name: "$callee.username",
                    call_type: {
                        $cond: {
                            if: { $eq: ["$caller_id", caller_id] }, 
                            then: {
                                $cond: {
                                    if: { $eq: ["$status", "missed"] }, 
                                    then: "outgoing_missed", 
                                    else: "outgoing"
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $eq: ["$status", "missed"] }, 
                                    then: "incoming_missed", 
                                    else: "incoming"
                                }
                            }
                        }
                    },
                    duration: {
                        $cond: {
                            if: { $and: [{ $ne: ["$start_time", null] }, { $ne: ["$end_time", null] }] },
                            then: { 
                                $divide: [{ $subtract: ["$end_time", "$start_time"] }, 1000] // Convert milliseconds to seconds
                            },
                            else: 0.00
                        }
                    }
                },
            },
            {
                $addFields: {
                    duration: {
                        $toDouble: {
                            $round: ["$duration", 2]
                        }
                    },
                    name: {
                        $cond: {
                            if: {
                                $or: [
                                    { $eq: ["$call_type", "incoming"] },
                                    { $eq: ["$call_type", "incoming_missed"] }
                                ]
                            },
                            then: "$caller_name",
                            else: "$callee_name"
                        }
                    }
                }
            },
            {
                $sort: { updatedAt: -1 }
            },
            {
                $project: {
                    _id: 1,
                    caller_id: 1,
                    callee_id: 1,
                    call_type: '$call_type',
                    username: '$name',
                    call_duration: '$duration',  //in seconds
                    status: 1,
                    time: {
                        $dateToString: {
                            format: "%H:%M",
                            date: "$createdAt",
                            timezone: "+05:30"
                        }
                    },
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                }
            }
        ];
        return await VoiceModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error fetching call logs history:', error);
        throw error;
    }
};

export const updateMissedCallStatusQuery = async (callId) => {
    try {
        const updatedCall = await VoiceModel.findByIdAndUpdate(
            callId,
            { status: 'missed' },
            { new: true }
        );
        if (!updatedCall) {
            throw new Error('Call not found');
        }
        return updatedCall;
    } catch (error) {
        console.error('Error updateMissedCallStatusQuery call:', error);
        throw error;
    }
};
