import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();
import { noAccessResponse, notFoundResponse, unAuthorizedResponse } from '../utils/response.js';

export const authenticateToken = async (req, res, next) => {
    let token = req.cookies.token
    let user_id = req.body.user_id || req.params.user_id

    if (isBrowserRequest(req)) {
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
    } else {
        return noAccessResponse(res, '', 'Request cannot be processed at this time.' );
    }
};

const isBrowserRequest = (req) => {
    const userAgent = req.headers['user-agent'];

    const br_01 = process.env.BROWSER_USER_AGENT_01;
    const br_02 = process.env.BROWSER_USER_AGENT_02;
    const br_03 = process.env.BROWSER_USER_AGENT_03;
    const br_04 = process.env.BROWSER_USER_AGENT_04;
    const br_05 = process.env.BROWSER_USER_AGENT_05;

    if (userAgent && userAgent.includes(br_01) || 
        userAgent.includes(br_02) || 
        userAgent.includes(br_03) || 
        userAgent.includes(br_04) || 
        userAgent.includes(br_05)) {
        return true;
    }
    return false;
};