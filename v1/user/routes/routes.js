import express, { Router } from 'express';
const app = express()
const router = Router();

import multer from 'multer';
import {authenticateToken} from '../../../middlewares/auth.js';
import {userLogin, userLogout, userInput, uploadFiles, fetchAllContacts, searchInContacts, searchInMessages, fetchChatHistory, fetchNewMessages, deleteMessages, fetchConversationsList,fetchUserProfile} from '../controllers/userController.js';
import {createGroup, fetchGroupChatHistory, fetchGroupDataForUser, searchMessageInGroup, updateGroup,fetchGroupDetail} from '../controllers/groupController.js';
import {loginVal, createGroupVal, uploadFileVal, searchVal, searchInChatVal, fetchChatVal, newMessageVal, deleteChatVal, fetchGrpChatVal, updateGrpVal } from '../../../utils/validation.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//auth APIs
app.post('/login', loginVal, userLogin);
app.post('/user-input', userInput);
app.get('/logout/:user_id', authenticateToken, userLogout);

//group APIs
app.post('/create-group', authenticateToken, createGroupVal, createGroup);
app.post('/fetch-group-chat-history', authenticateToken, fetchGrpChatVal, fetchGroupChatHistory);
app.get('/fetch-all-groups-data-for-user/:user_id', authenticateToken, newMessageVal, fetchGroupDataForUser);
app.post('/update-group', authenticateToken, updateGrpVal, updateGroup);
app.post('/search-message-in-group', searchMessageInGroup);

//user APIS
app.get('/fetch-conversations/:user_id', fetchConversationsList);
app.post('/upload-file', upload.single('file'), authenticateToken, uploadFileVal, uploadFiles);
app.get('/fetch-all-contacts/:user_id', authenticateToken, fetchAllContacts);
app.post('/search-in-contacts/:user_id', authenticateToken, searchVal,  searchInContacts);
app.post('/search-in-messages', authenticateToken, searchInChatVal, searchInMessages);
app.post('/fetch-chat-history', authenticateToken, fetchChatVal, fetchChatHistory);
app.get('/fetch-new-messages/:user_id', authenticateToken, newMessageVal, fetchNewMessages);
app.post('/delete-message', authenticateToken, deleteChatVal, deleteMessages);

app.get('fetch-user-profile/:user_id',authenticateToken,fetchUserProfile);
app.get('fetch-group-data/:group_id',authenticateToken,fetchGroupDetail);
 
app.use("/", router);

export default app;