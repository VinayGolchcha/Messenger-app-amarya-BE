import express, { Router } from 'express';
const app = express()
const router = Router();

import multer from 'multer';
import authenticateToken from '../../../middlewares/auth.js';
import {userLogin, userLogout, userInput, uploadFiles, fetchAllContacts, searchInContacts, searchInMessages,deleteChats,deleteRoom,fetchGroupData,fetchSelectedGroupData,createNotification,getNotifications,muteNotifications,unmuteNotifications,isMuted} from '../controllers/userController.js';
import {createGroup} from '../controllers/groupController.js';
import {login, updatePassword, sendOtp, verifyOtp} from '../../../utils/validation.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//auth APIs
app.post('/login', login, userLogin);
app.post('/user-input', userInput);
app.get('/logout/:id', userLogout);

//group APIs
app.post('/create-group', createGroup);
app.get("/fetchGroupData",fetchGroupData);
app.get("/fetchSelectedGroupData",fetchSelectedGroupData)
//message APIS
app.post('/upload-file', upload.single('file'), uploadFiles);
app.get('/fetch-all-contacts', fetchAllContacts);
app.post('/search-in-contacts', searchInContacts);
app.post('/search-in-messages', searchInMessages);
app.post('/createNotification', createNotification);
app.get('/getNotifications',getNotifications);

app.use("/", router);
app.post('/deleteChats',deleteChats);
app.post("/deleteRoom",deleteRoom);

//Notifications api
app.post('/mute', muteNotifications);
app.post('/unmute', unmuteNotifications);
export default app;
