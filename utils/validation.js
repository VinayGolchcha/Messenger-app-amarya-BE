import { body, query, check, param } from 'express-validator';


const passwordValidation = (value) => {
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(value)) {
        throw new Error('Password must contain at least one lowercase letter, one uppercase letter, and one special character.');
    }
    return true;
};

export const loginVal = [
    body('email').isEmail().withMessage('Invalid email input.').notEmpty().withMessage('Email cannot be empty.'),
    body('password').notEmpty().withMessage('Password cannot be empty.').custom(passwordValidation)
]

export const createGroupVal = [
    body('group_name').isString().withMessage('Group name must be a string').notEmpty().withMessage('Group name cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.'),
    body('members').isArray().withMessage('Members must be a array').notEmpty().withMessage('Members cannot be empty.')
]

export const uploadFileVal = [
    body('file_type').isString().withMessage('File type must be a string').notEmpty().withMessage('File type cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.')
]

export const searchVal = [
    body('search_text').isString().withMessage('Search text must be a string').notEmpty().withMessage('Search text cannot be empty.')
]

export const searchInChatVal = [
    body('search_text').isString().withMessage('Search text must be a string').notEmpty().withMessage('Search text cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.'),
    body('recievers_id').isString().withMessage('Receiver id must be string').notEmpty().withMessage('Receiver id cannot be empty.')
]

export const fetchChatVal = [
    body('date').isString().withMessage('Date must be a string').notEmpty().withMessage('Date cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.'),
    body('recievers_id').isString().withMessage('Receiver id must be string').notEmpty().withMessage('Receiver id cannot be empty.')
]

export const deleteChatVal = [
    body('action').isString().withMessage('Action must be a string').notEmpty().withMessage('Action cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.')
]

export const newMessageVal = [
    param('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.')
]

export const fetchGrpChatVal = [
    body('date').isString().withMessage('Date must be a string').notEmpty().withMessage('Date cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.'),
    body('group_id').isString().withMessage('Group id must be string').notEmpty().withMessage('Group id cannot be empty.')
]

export const updateGrpVal = [
    body('group_name').isString().withMessage('Group name must be a string').notEmpty().withMessage('Group name cannot be empty.'),
    body('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.'),
    body('members').isArray().withMessage('Members must be a array').notEmpty().withMessage('Members cannot be empty.'),
    body('group_id').isString().withMessage('Group id must be string').notEmpty().withMessage('Group id cannot be empty.')
]
export const fetchUserProfileVal=[
    param('user_id').isString().withMessage('User id must be a string').notEmpty().withMessage('User id cannot be empty.')
]
export const fetchGroupDetailVal=[
    param('group_id').isString().withMessage('group id must be a string').notEmpty().withMessage('group id cannot be empty.')
]