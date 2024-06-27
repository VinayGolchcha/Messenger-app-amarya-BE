import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse } from "../../../utils/response.js"
import {createGroupQuery, groupDetailQuery} from "../models/groupQuery.js"
import { userDetailQuery, userDataQuery} from "../models/userQuery.js"

dotenv.config();

export const createGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const { group_name, user_id, members } = req.body
        const user_data = await userDataQuery(user_id)
        const group_data = {
            group_name: group_name,
            created_by: user_data._id,
            members: members
        }
        const is_group = await createGroupQuery(group_data)
       
        return successResponse(res, is_group, `Group created successfully`);
    } catch (error) {
        console.error(error);
    }
}