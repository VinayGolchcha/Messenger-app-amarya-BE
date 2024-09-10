import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse, internalServerErrorResponse } from "../../../utils/response.js"
import {createGroupQuery, groupDetailQuery, checkGroupNameExistsQuery, fetchGroupChatHistoryQuery, fetchGroupsDataForUserQuery, checkUserAsAdminForGroupQuery, updateGroupQuery, findMessageinGroupQuery,fetchGroupDetailQuery, fetchGroupConversationListQuery, exitGroupQuery, exitReadByArrayQuery, getGroupMembersAndDetailsQuery, deleteGroupByIdQuery} from "../models/groupQuery.js"
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
        
        if(group_name_exists.length > 0){
            return notFoundResponse(res, '', 'Group name already exists, please create a new name')
        }
        
        if(members.length == 0){
            return errorResponse(res, '', 'Members list is empty, pls add members to proceed')
        }else if(members.length == 1){
            const exists = members.includes(user_id);
            if (exists == true){
                return errorResponse(res, '', 'Only Admin cannot create the group, one other member is required to proceed for group creation.')
            }
        }
        const exists = members.includes(user_id);
        if (exists == false){
            members.push(user_id);
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
        if(members.length == 0){
            await deleteGroupByIdQuery(group_id)
        }
        
        const group_data = {
            group_name: group_name,
            members: members
        }
        await updateGroupQuery(group_id, group_data)
        const [is_group] = await getGroupMembersAndDetailsQuery(group_id)
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

        let {user_id, group_id, skip, limit} = req.body;
        user_id = new mongoose.Types.ObjectId(user_id);
        group_id = new mongoose.Types.ObjectId(group_id);
        const data = await fetchGroupChatHistoryQuery(group_id, user_id, skip, limit);

        if(data.length == 0){
            return successResponse(res, data, `No chats found in the given date range`);
        };
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
        const group_data = await fetchGroupsDataForUserQuery(user_id);
        const data = await fetchGroupConversationListQuery(user_id);
      
        const mergeArrays = (arr1, arr2) => {
            const map = new Map();
            arr1.forEach(obj => {
              map.set(obj.group_id.toString(), obj);
            });
        
            arr2.forEach(obj => {
              map.set(obj.group_id.toString(), obj);
            });
        
            // const mergedArray = Array.from(map.values());
            const mergedArray = Array.from(map.values()).sort((a, b) => {
                const hasMessageA = a.content !== null;
                const hasMessageB = b.content !== null;
            
                if (hasMessageA && !hasMessageB) return -1;
                if (!hasMessageA && hasMessageB) return 1;
            
                if (hasMessageA && hasMessageB) {
                  return new Date(b.sent_at) - new Date(a.sent_at);
                }
           
                return 0;
              });
            return mergedArray;
          };
          const merged_array = mergeArrays(group_data, data);
          
        return successResponse(res, merged_array, `Group Data fetched successfully!`);
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

export const fetchGroupDetail = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let group_id = req.params.group_id;
        group_id = new mongoose.Types.ObjectId(group_id)
        const data = await fetchGroupDetailQuery(group_id);
        if (data.length == 0){
            return notFoundResponse(res, '', `No Group Found In Data`)
        }
        return successResponse(res, data, `Group fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const exitGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let { group_id, user_id } = req.body

        user_id = new mongoose.Types.ObjectId(user_id);
        group_id = new mongoose.Types.ObjectId(group_id);
        
        const is_group = await exitGroupQuery(group_id, user_id)
        if (is_group.modifiedCount == 0) {
            return notFoundResponse(res, '', `User not found in Group`)
        }
        await exitReadByArrayQuery(group_id, user_id)
        return successResponse(res, is_group, `User exited group successfully`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error);
    }
}
