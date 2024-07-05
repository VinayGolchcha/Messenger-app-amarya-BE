import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse, internalServerErrorResponse } from "../../../utils/response.js"
import {createGroupQuery, groupDetailQuery, checkGroupNameExistsQuery, fetchGroupChatHistoryQuery, fetchGroupsDataForUserQuery, checkUserAsAdminForGroupQuery, updateGroupQuery, findMessageinGroupQuery} from "../models/groupQuery.js"
import { userDetailQuery, userDataQuery} from "../models/userQuery.js"

dotenv.config();

export const createGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const { group_name, user_id, members } = req.body

        const group_name_exists = await checkGroupNameExistsQuery(group_name)
        const user_data = await userDataQuery(user_id)
        
        if(group_name_exists){
            return notFoundResponse(res, '', 'Group name already exists, please create a new name')
        }
        
        const group_data = {
            group_name: group_name,
            created_by: user_data._id,
            members: members
        }
        const is_group = await createGroupQuery(group_data)
       
        return successResponse(res, is_group, `Group created successfully`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
}

export const updateGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let { group_id, group_name, user_id, members } = req.body

        user_id = new mongoose.Types.ObjectId(user_id);
        group_id = new mongoose.Types.ObjectId(group_id);

        const is_user_admin = await checkUserAsAdminForGroupQuery(group_id, user_id)
 
        if(!is_user_admin){
            return notFoundResponse(res, '', 'User does not have access to update the group details, only admin user can update the details.')
        }
        
        const group_data = {
            group_name: group_name,
            members: members
        }
        const is_group = await updateGroupQuery(group_id, group_data)
       
        return successResponse(res, is_group, `Group updated successfully`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
}

export const fetchGroupChatHistory = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {user_id, group_id, date} = req.body;
        user_id = new mongoose.Types.ObjectId(user_id);
        group_id = new mongoose.Types.ObjectId(group_id);
        const data = await fetchGroupChatHistoryQuery(group_id, date, user_id);
        return successResponse(res, data, `Group Messages fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchGroupDataForUser = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let user_id = req.params.user_id;
        user_id = new mongoose.Types.ObjectId(user_id);
        const data = await fetchGroupsDataForUserQuery(user_id);
        return successResponse(res, data, `Group Data fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const searchMessageInGroup = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {user_id, group_id, search_text} = req.body;
        group_id = new mongoose.Types.ObjectId(group_id)
        search_text = search_text.toLowerCase();
        const data = await findMessageinGroupQuery(search_text, group_id);
        return successResponse(res, data, `Messages fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}