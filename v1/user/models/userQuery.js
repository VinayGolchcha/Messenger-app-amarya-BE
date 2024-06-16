import mongoose from 'mongoose';
import {Usermodel} from './userModel.js';

export const create = async (UserData) => {
    return await Usermodel.create(UserData);
}

export const userDetailQuery = async (email) => {
    return await Usermodel.findOne({ 'email': email, 'is_registered': true })
    .lean();
}

export const insertTokenQuery = async (token, id) => {
    return await Usermodel.findOneAndUpdate({ _id: id, is_registered: true }, { $set: { "auth_token": token } }, { safe: true, upsert: false, new: false });
}

export const insertOtpQuery = async(email, otp) => {
    return await Usermodel.findOneAndUpdate({ email: email, is_registered: true }, { $set: { "otp": otp} }, { safe: true, upsert: false, new: false });
}

export const getOtpQuery = async(email) => {
    return await Usermodel.findOne({ 'email': email, 'is_registered': true })
    .select('otp')
    .lean()
}

export const updateUserPasswordQuery = async(email, password) => {
    return await Usermodel.findOneAndUpdate({ email: email, is_registered: true }, { $set: { "password": password} }, { safe: true, upsert: false, new: false });
}