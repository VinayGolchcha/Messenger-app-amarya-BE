import express, { Router } from 'express';
const app = express()
const router = Router();

import multer from 'multer';
import {authenticateToken} from '../../../middlewares/auth.js';
import {userLogin, userLogout, userInput, uploadFiles, fetchAllContacts, searchInContacts, searchInMessages, fetchChatHistory, fetchNewMessages, deleteMessages} from '../controllers/userController.js';
import {createGroup} from '../controllers/groupController.js';
import {loginVal, createGroupVal, uploadFileVal, searchVal, searchInChatVal, fetchChatVal, newMessageVal, deleteChatVal } from '../../../utils/validation.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//auth APIs
app.post('/login', loginVal, userLogin);
app.post('/user-input', userInput);
app.get('/logout/:user_id', authenticateToken, userLogout);

//group APIs
app.post('/create-group', authenticateToken, createGroupVal, createGroup);

//message APIS
app.post('/upload-file', upload.single('file'), authenticateToken, uploadFileVal, uploadFiles);
app.get('/fetch-all-contacts/:user_id', authenticateToken, fetchAllContacts);
app.post('/search-in-contacts/:user_id', authenticateToken, searchVal,  searchInContacts);
app.post('/search-in-messages', authenticateToken, searchInChatVal, searchInMessages);
app.post('/fetch-chat-history', authenticateToken, fetchChatVal, fetchChatHistory);
app.get('/fetch-new-messages/:user_id', authenticateToken, newMessageVal, fetchNewMessages);
app.post('/delete-message', authenticateToken, deleteChatVal, deleteMessages);

app.use("/", router);

export default app;