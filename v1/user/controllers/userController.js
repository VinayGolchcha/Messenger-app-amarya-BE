import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse, internalServerErrorResponse } from "../../../utils/response.js"
import {create, userDetailQuery, insertTokenQuery, findAllUserDetailQuery, findUserByNameQuery, userDataQuery,fetchUserProfileQuery} from "../models/userQuery.js"
import { uploadMediaQuery } from "../models/mediaQuery.js";
import {fetchChatHistoryQuery, findMessageQuery, fetchNewMessagesForUserQuery, checkUserForGivenMessageQuery, updateDeleteStatusForUserQuery, 
    deleteMessageByIdQuery, updateDeleteStatusForAllMessagesInChatQuery, fetchConversationListQuery,
    fetchRemainingConversationListQuery} from "../models/messageQuery.js";
import { checkIfUserIsAdminQuery, deleteGroupChatCompleteQuery, deleteGroupMessageByIdQuery, fetchGroupConversationListQuery, findGroupByNameQuery, updateDeleteUserStatusForGroupQuery } from "../models/groupQuery.js";
import {generateDownloadLink} from '../../helpers/mediaDownloadableLink.js'
import { decryptMessages, encryptMessage } from "../../helpers/encryption.js";
dotenv.config();

export const userInput = async (req, res) => {
    try {
        // const userData = [
        //     {
        //       "username": "tamanna_02",
        //       "email": "tamanna.suhane@amaryaconsultancy.com",
        //       "password": "$2b$12$.86ATInYxDAMwIkrCnmpnONLKjF/FmHcJjV5BDlR2NFXCHsr2VjAy",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "Ujjwal_01",
        //       "email": "ujjwal.2000upadhyay@gmail.com",
        //       "password": "undefined",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "sanjana_jain01",
        //       "email": "sanjana.jain@amaryaconsultancy.com",
        //       "password": "$2b$12$SmLEZpUF11nGaCDnIzvBAewNT7xMySDgGQcZvTSsptOUvIv5vJnmG",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "shubham_01",
        //       "email": "shubham.sonii2019@gmail.com",
        //       "password": "$2a$12$YZn6kjdZDVoJz.9rTHq4suGUF1qH85503zaq3y/EKv6C61HCtTFIe",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "anuj.prajapati01",
        //       "email": "anuj.prajapati@amaryaconsultancy.com",
        //       "password": "$2b$12$rURec.L4YJ5RWzfUhqynPeoxgBuRhGdndBqF3pRl.wsasQLvkk.72",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "shubham_soni01",
        //       "email": "shubham.soni@amaryaconsultancy.com",
        //       "password": "$2a$12$PUst9Oa86vgLnRA0dQac1ecuh3NkZ2lPMK55OWTGHk0lQQoX5ZJf6",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "ankit_koshta01",
        //       "email": "ankit.koshta@amaryaconsultancy.com",
        //       "password": "$2b$12$F7f23L3pgrN7JFPGG3G2peUmd.e3fAn3JslUAr2p.DEv/M365ckOu",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "shubham_kushwaha01",
        //       "email": "shubham.kushwaha@amaryaconsultancy.com",
        //       "password": "$2a$12$DyrOvzCvNt/oIc8MFRJwg.xZ15xxgGem0lhm8LBZO90u2tQRqkEya",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "prashant_pandey01",
        //       "email": "prashant.pandey@amaryaconsultancy.com",
        //       "password": "$2a$12$8blJ9Q9OVElwFlTKmmASDOtGgPVgmtHhY4N/EK2HnV04jaAqBanY6",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "kishan_chaurasia01",
        //       "email": "kisanlal.chourasia@amaryaconsultancy.com",
        //       "password": "$2b$12$1OImzc06l8w4gn8kiBE1XeoydOQR2Vad3GBFpDDLSql/BsVWvvxCa",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "deepanshu_kushwaha01",
        //       "email": "deepanshu.kushwaha@amaryaconsultancy.com",
        //       "password": "$2b$12$bR.Zpu60ZKWXvPcgX/ev1uQPnLHDqjg9wzbbYhZd51sJx4fwoJzqq",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "ankit_soni01",
        //       "email": "ankit.soni@amaryaconsultancy.com",
        //       "password": "$2b$12$hjGKgrNBTbOexTEnnnYseu0qxr1kO8QD.xNbwkxNRbJOxQc.TgEOu",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "divij_sahu01",
        //       "email": "divij.sahu@amaryaconsultancy.com",
        //       "password": "$2b$12$RnFUO.alofR7O24n1bD4g.IPpgV.NDUaDxMxfA0Qq.sGMc.Jr2JYa",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "pujita_rao01",
        //       "email": "pujita.rao@amaryaconsultancy.com",
        //       "password": "$2b$12$OvBVFY1PocHS9N5V4bJOueXz1yKX2RpLoVo/JDLNEyQ8XITqUiWOW",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "surya_pratap01",
        //       "email": "suryapratap.dheemar@amaryaconsultancy.com",
        //       "password": "$2b$12$fbQGaSvMDhKozQB6CNuS5.R.3BXtGlmq8PBrm63tr8KuAg1wKQJqq",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "eish_nigam01",
        //       "email": "eish.nigam@amaryaconsultancy.com",
        //       "password": "$2b$12$4eXStVkzBrJ7Y2qItG6fEezENskwbGe3HrjxxbeUrtY.QmWyJtH4e",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "prabal_namdev01",
        //       "email": "prabal.namdev@amaryaconsultancy.com",
        //       "password": "$2b$12$PkKv07AIaB6LF8fC2BK1ZesaWUJXhJPoEU4zewaotmnS9m0o6BEjm",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "iteesh_dubey01",
        //       "email": "iteesh.dubey@amaryaconsultancy.com",
        //       "password": "$2b$12$DrLN3oQFAZ/Yu45X4SnCk.fDpQ.qIMAlhF9R7uGxWb.G4Qrk1eXmm",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "anmol_chauhan01",
        //       "email": "anmol.chauhan@amaryaconsultancy.com",
        //       "password": "$2b$12$7Xkld8Iy4YcABliyUdVMYOjYob7tLg1y1qGYFcnhO.8xwMDi3RHQ6",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "shubham.k_01",
        //       "email": "shubham.amarya7@gmail.com",
        //       "password": "$2b$12$c/ILAAHsrVTszedC54X.Q.srM7VgNTvnaCMy.j6Zc0cgbfSqzFUyS",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "sanjana_01",
        //       "email": "sanjanajain2223@gmail.com",
        //       "password": "$2b$12$1ffakkC54/Lx/Uv5Ev4bR.k8pmjaWlRAXH5IdANllvSFezcMQrGhy",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "tamanna_suhane01",
        //       "email": "suhanetamanna@gmail.com",
        //       "password": "$2b$12$XiveyXldQ2pzz975mBuc0ufFonyHxjZw4sbS.yXtIYn.mTiUL7JXy",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "golchcha_vinay",
        //       "email": "vinay.golchcha@gmail.com",
        //       "password": "$2b$12$7t1DxF1LeshAjzIq7FW6q.F6KuCRMwk0EhEBqDslrWtG/iL0r.l0C",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "test_user",
        //       "email": "test@gmail.com",
        //       "password": "$2b$12$GeS70wS68VeRpsuN2.TsW.Wz/5oO/8P2p4QPbZYu4bYvfPR0JPSjK",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "rashi_agarwal01",
        //       "email": "rashi.agarwal@amaryaconsultancy.com",
        //       "password": "$2b$12$aPA6mJLFIrxBAchL7ZEoFeyZcTJ3UQ1dWMkgJOkeW/ysHwQnRdg5i",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "madhur_garg01",
        //       "email": "madhur.garg@amaryaconsultancy.com",
        //       "password": "$2b$12$XJTxZmVdgCsfmZzuonv8IeftTYY713DMJuZ2zvidAVedeRRnjfXce",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "vinay_golchha01",
        //       "email": "vinay.golchha@amaryaconsultancy.com",
        //       "password": "$2b$12$BJM3b0WNmF3ZUdh2n9LUvuKE6XeKuWzJHwnG.vTmC3WAFr2AY2Ww6",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "lucky_soni01",
        //       "email": "lucky.soni@amaryaconsultancy.com",
        //       "password": "$2b$12$5tVqC1ISuldIkTlFPEnHFel1SSZHObeB.9PXj3cb7sCIX7.IC/Hca",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "pradyum_jaiswal01",
        //       "email": "pradyum.jaiswal@amaryaconsultancy.com",
        //       "password": "$2b$12$Fm9rDa8kZ4bCcV1M6COsRuMbKDppyviMiZEJB6wjdZYsO.nvFH0ey",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "vishwabhushan_dubey01",
        //       "email": "vishwabhushan.dubey@amaryaconsultancy.com",
        //       "password": "$2b$12$MnFr8Zzt/Y4005XFsoZcmenJe60nVrJnYeVZSZt.ZrOPUh4KASdeS",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "shivam_vishwakarma01",
        //       "email": "shivam.vishwakarma@amaryaconsultancy.com",
        //       "password": "$2b$12$jsVJxRnGv.Iibnq4sF3X7uwQDPmxWHTyhnYHCS7L58dsC6iozHS4y",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "devesh_gupta01",
        //       "email": "devesh.gupta@amaryaconsultancy.com",
        //       "password": "$2b$12$xgLP5mOOY0yZjrFNvMSNNObM2d3TtdshlkVOaKeq55ZhgYAXzGICO",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "aahana_sarkhel01",
        //       "email": "aahana.sarkhel@amaryaconsultancy.com",
        //       "password": "$2b$12$q9ho52YvV/cJeywRDnU9n.jTK9lMQDACI3.RxdbWDuXr7HdA9GgvG",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "himanshu_bachwani01",
        //       "email": "himanshu.bachwani@amaryaconsultancy.com",
        //       "password": "$2b$12$2EmZBrMVDzYuAiAx/C60Q.ODRgb2FVVgwy8DL6.SikNCok5eAexse",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "ankit_admin",
        //       "email": "ankitk2499@gmail.com",
        //       "password": "$2a$12$CqZ99iwJ4qKiy8QvLzI4Ru.zZY7uxCNG2JJR1EeEzqg287P6D360W",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "manish_patel01",
        //       "email": "manish.patel@amaryaconsultancy.com",
        //       "password": "$2b$12$f7LFTWNo8gtxfR0HcylM7.GnnCHZI2BcJ7qzKyCLF/C0dAStKBMt.",
        //       "is_registered": 1
        //     },
        //     {
        //       "username": "prashant_admin",
        //       "email": "prashant.pandey@amaryasonsultancy.com",
        //       "password": "$2a$12$EABbRS4eGOTxll8b270xEOK2jhgqvOcBtP8afCvb0jK/1xi0/qula",
        //       "is_registered": 1
        //     }
        //   ]
        for(let i = 0; i < userData.length; i++) {
            await create(userData[i])
        }
        return successResponse(res, '', `User In!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const userLogin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        let is_email_verified = true;
        const { email, password } = req.body;
        const user = await userDetailQuery(email);
        if (!user) {
            return errorResponse(res, '', 'User not found');
        }
        const currentUser = user;
        if (currentUser.is_email_verified===false) {
            is_email_verified = false;
            return errorResponse(res, {is_email_verified:is_email_verified}, 'Please verify your email first before proceeding.');
        }
        let message = '';
        let token = '';
        if (email && password) {
            const isPasswordValid = await bcrypt.compare(password, currentUser.password);
            if (isPasswordValid) {
                message = 'You are successfully logged in';
            } else {
                return unAuthorizedResponse(res, '', 'Password is not correct. Please try again.');
            }
        } else {
            return errorResponse(res, '', 'Input fields are incorrect!');
        }
        token = jwt.sign({ id: currentUser._id, name: currentUser.user_name }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME,
        });
        await insertTokenQuery(token, currentUser._id);
        res.cookie('token', token, {
            httpOnly: true, // Cookie is accessible only through HTTP(S) protocol
            sameSite: 'None', // Allow cross-site usage
            secure: true, // Ensures the cookie is only sent over HTTPS
            maxAge: 24 * 60 * 60 * 1000,
            path: '/', 
          });
        return successResponse(res, { user_id: currentUser._id, user_name: currentUser.username + " " , email: email, is_email_verified: is_email_verified, token: token, socket_id: currentUser.socket_id }, message);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
};

export const userLogout = async (req, res) => {
    try {
        const user_id = req.params.id;
        await insertTokenQuery("", user_id);
        if(user_id){
            res.clearCookie('token', {
                httpOnly: false,
                sameSite: 'None',
                secure: true,
                path: '/',
              });
        }
        return successResponse(res, '', `You have successfully logged out!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const uploadFiles = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const files = req.files;
        let file_type = req.body.file_type
        let user_id = req.body.user_id;
        let response = []
        user_id = new mongoose.Types.ObjectId(user_id)

        for (let file of files){
            const max_size = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > max_size) {
                return errorResponse(res, `File ${file.originalname} exceeds the 10MB limit.`, "");
            }

            try {
                const download_link = await generateDownloadLink(file.buffer, file_type, file.originalname);
                const file_data = {
                  file_type: file_type,
                  file_name: file.originalname,
                  download_link: download_link,
                  uploaded_by: user_id
                };
                
                const data = await uploadMediaQuery(file_data);
                response.push(data);
              } catch (error) {
                console.error(`Failed to process file ${file.originalname}: `, error);
              }
            }
        return successResponse(res, response, `File uploaded successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchAllContacts = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        const data = await findAllUserDetailQuery();
        return successResponse(res, data, `All contacts fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const searchInContacts = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {search_text} = req.body;
        search_text = search_text.toLowerCase();
        const user_data = await findUserByNameQuery(search_text);
        const group_data = await findGroupByNameQuery(search_text);
        let data = {
            user_list : user_data,
            group_list : group_data
        }
        return successResponse(res, data, `Contact fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

// export const searchInMessages = async (req, res) => {
//     try {
//         const errors = validationResult(req);

//         if (!errors.isEmpty()) {
//             return errorResponse(res, errors.array(), "")
//         }

//         let {user_id, recievers_id, search_text} = req.body;
//         user_id = new mongoose.Types.ObjectId(user_id)
//         recievers_id = new mongoose.Types.ObjectId(recievers_id)
//         search_text = search_text.toLowerCase();
//         const data = await findMessageQuery(user_id, recievers_id);
//         const decrypted_messages = decryptMessages(data);
//         return successResponse(res, data, `Messages fetched successfully!`);
//     } catch (error) {
//         console.error(error);
//         return internalServerErrorResponse(res, error)
//     }
// }

export const fetchChatHistory = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {user_id, recievers_id, skip, limit} = req.body;
        user_id = new mongoose.Types.ObjectId(user_id)
        recievers_id = new mongoose.Types.ObjectId(recievers_id)
        const data = await fetchChatHistoryQuery(user_id, recievers_id, skip, limit);
        const decrypted_messages = decryptMessages(data);
        if (decrypted_messages.length == 0){
            return successResponse(res, decrypted_messages, `No chats found in the given date range`)
        }
        return successResponse(res, decrypted_messages, `Messages fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

// export const fetchNewMessages = async (req, res) => {
//     try {
//         const errors = validationResult(req);

//         if (!errors.isEmpty()) {
//             return errorResponse(res, errors.array(), "")
//         }

//         let user_id = req.params.user_id;
//         user_id = new mongoose.Types.ObjectId(user_id)
//         const data = await fetchNewMessagesForUserQuery(user_id);
//         return successResponse(res, data, `Messages fetched successfully!`);
//     } catch (error) {
//         console.error(error);
//         return internalServerErrorResponse(res, error)
//     }
// }

export const deleteMessages = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let { type, action, message_ids, user_id, chat_to_be_deleted_id} = req.body
        let message;
        type = type.toLowerCase();
        const deleteForMe = async () => {
            user_id = new mongoose.Types.ObjectId(user_id)
            if (type =='private') {
                for (let i = 0; i < message_ids.length; i++) {
                    let message_id = new mongoose.Types.ObjectId(message_ids[i])
                    const is_user = await checkUserForGivenMessageQuery(user_id, message_id)
                    if (is_user) {
                        const is_user_sender = is_user.senders_id.toString() == user_id.toString() ? true : false;
                        await updateDeleteStatusForUserQuery(is_user_sender, message_id)
                        message = `Message(s) deleted successfully`
                    } else {
                        message = `No message with that id found`
                    }
                }
                return message
            }else if( type == 'group'){
                for (let i = 0; i < message_ids.length; i++) {
                    let message_id = new mongoose.Types.ObjectId(message_ids[i])
                    const message_deleted = await updateDeleteUserStatusForGroupQuery(message_id, user_id)
                    if (message_deleted) {
                        message = `Message(s) deleted successfully`
                    } else {
                        message = `No message with that id found`
                    }
                }
                return message
            }
        }

        const deleteForEveryone = async () => {
            if(type == 'private'){
                for (let i = 0; i < message_ids.length; i++) {
                    let message_id = new mongoose.Types.ObjectId(message_ids[i])
                    const is_deleted = await deleteMessageByIdQuery(message_id)
    
                    if (is_deleted.deletedCount > 0) {
                        message = `Message deleted successfully`
                    }else{
                        message = `No message with that id found`
                    }
                }
                return message
            }else if( type == 'group'){
                for (let i = 0; i < message_ids.length; i++) {
                    let message_id = new mongoose.Types.ObjectId(message_ids[i])
                    const is_deleted = await deleteGroupMessageByIdQuery(message_id)

                    if (is_deleted.deletedCount > 0) {
                        message = `Message deleted successfully`
                    }else{
                        message = `No message with that id found`
                    }
                }
                return message
            } 
        }

        const deleteChat = async () => {
            user_id = new mongoose.Types.ObjectId(user_id)
            if(type == 'private'){
                const reciever_id = new mongoose.Types.ObjectId(chat_to_be_deleted_id)
                const is_deleted = await updateDeleteStatusForAllMessagesInChatQuery(user_id, reciever_id)
    
                if (is_deleted.modifiedCount > 0) {
                    message = `Message deleted successfully`
                    return message
                }
                message = `No messages found`
                return message
            }else if(type == 'group'){
                const group_id = new mongoose.Types.ObjectId(chat_to_be_deleted_id)
                const check_admin = await checkIfUserIsAdminQuery(user_id)
                if(check_admin){
                    await deleteGroupChatCompleteQuery(group_id)
                    message = `Message deleted successfully`
                    return message
                }else{
                    message = `Only group admins have the authority to delete all chats in the group.`
                    return message
                }
            }
        }

        switch(action){
            case 'deleteForMe': 
                await deleteForMe()
                break;
            case 'deleteForEveryone': 
                await deleteForEveryone()
                break;
            case 'deleteChat': 
                await deleteChat();
                break;
        }

        return successResponse(res, '', message);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchConversationsList = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let user_id = req.params.user_id;
        user_id = new mongoose.Types.ObjectId(user_id)
        let private_data = await fetchConversationListQuery(user_id)
        const final_data = await fetchRemainingConversationListQuery(user_id)
        const merged_array = [...private_data, ...final_data];
        const sorted_array = merged_array.sort((a, b) => b.sent_at - a.sent_at);

        const latest_messages_map = new Map();

        sorted_array.forEach(message => {
            const key = message.senders_id.toString();
            if (!latest_messages_map.has(key) || latest_messages_map.get(key).sent_at < message.sent_at) {
                latest_messages_map.set(key, message);
            }
        });

        const unique_messages = Array.from(latest_messages_map.values());
        const decrypted_messages = decryptMessages(unique_messages);
        return successResponse(res, decrypted_messages, `Data fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchUserProfile = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let user_id = req.params.user_id;
        user_id = new mongoose.Types.ObjectId(user_id)
        const data = await fetchUserProfileQuery(user_id);
        if (data.length == 0){
            return notFoundResponse(res, '', `No Profile Found In Data `)
        }
        return successResponse(res, data, `Profile fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}
