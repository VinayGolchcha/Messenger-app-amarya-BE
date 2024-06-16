import express, { Router } from 'express';
const app = express()
const router = Router();

import authenticateToken from '../../../middlewares/auth.js';
import {userLogin, updateUserPassword, userLogout, sendOtpApi, verifyOtpApi, checkEmailVerification, userInput} from '../controllers/userController.js';
import {login, updatePassword, sendOtp, verifyOtp} from '../../../utils/validation.js';


app.post('/login', login, userLogin);
app.post('/user-input', userInput);
app.post('/update-password', updatePassword, updateUserPassword);
app.post('/send-otp', sendOtp, sendOtpApi)
app.post('/verify-otp', verifyOtp, verifyOtpApi)
app.post('/check-email-verification', sendOtp, checkEmailVerification)
app.get('/logout/:id', userLogout);

app.use("/", router);

export default app;