import express, { Router } from 'express';
const app = express()
const router = Router();

import multer from 'multer';
import authenticateToken from '../../../middlewares/auth.js';
import {userLogin, userLogout, userInput, uploadFiles} from '../controllers/userController.js';
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

//message APIS
app.post('/upload-file', upload.single('file'), uploadFiles)

app.use("/", router);

export default app;