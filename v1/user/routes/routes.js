import express, { Router } from 'express';
const app = express()
const router = Router();

import multer from 'multer';
import {authenticateToken} from '../../../middlewares/auth.js';
import {userLogin, userLogout, userInput, uploadFiles, fetchAllContacts, searchInContacts, searchInMessages, fetchChatHistory, fetchNewMessages} from '../controllers/userController.js';
import {createGroup} from '../controllers/groupController.js';
import {login } from '../../../utils/validation.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//auth APIs
app.post('/login', login, userLogin);
app.post('/user-input', userInput);
app.get('/logout/:user_id', authenticateToken, userLogout);

//group APIs
app.post('/create-group', createGroup);

//message APIS
app.post('/upload-file', upload.single('file'), authenticateToken, uploadFiles);
app.get('/fetch-all-contacts/:user_id', authenticateToken, fetchAllContacts);
app.post('/search-in-contacts/:user_id', authenticateToken, searchInContacts);
app.post('/search-in-messages', authenticateToken, searchInMessages);
app.post('/fetch-chat-history', authenticateToken, fetchChatHistory);
app.get('/fetch-new-messages/:user_id', authenticateToken, fetchNewMessages);

app.use("/", router);

export default app;