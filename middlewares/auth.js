import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();
import { notFoundResponse, unAuthorizedResponse } from '../utils/response.js';

export const authenticateToken = async (req, res, next) => {
    let token = req.cookies.token
    let user_id = req.body.user_id || req.params.user_id
    if (!token) {
        return unAuthorizedResponse(res, "", "Token not found in cookies");
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return notFoundResponse(res, err, `JWT verification failed`);
            } else {
                // Check the expiration time (exp claim) of the JWT
                const currentTimeInSeconds = Math.floor(Date.now() / 1000);
                if (decoded.exp && currentTimeInSeconds > decoded.exp) {
                    return notFoundResponse(res, err, `JWT has expired`);;
                } else {
                    req.decoded = decoded;
                    if (decoded.id === user_id){
                        next();
                    }else{
                        return unAuthorizedResponse(res, '', `The provided token does not match the given user id.`)
                    }
                }
            }
        });
    } catch (error) {
        next(error);
    }
};