// const userTable = `
// CREATE TABLE IF NOT EXISTS user (
//     id int NOT NULL AUTO_INCREMENT,
//     username varchar(255) NOT NULL,
//     email varchar(255) NOT NULL,
//     password varchar(255) NOT NULL,
//     otp int DEFAULT NULL,
//     is_registered tinyint(1) NOT NULL,
//     is_email_verified boolean DEFAULT false,
//     auth_token varchar(255) DEFAULT NULL,
//     system_number varchar(255) DEFAULT NULL,
//     token varchar(255) DEFAULT NULL,
//     created_at datetime NOT NULL,
//     updated_at datetime NOT NULL,
//     PRIMARY KEY (id),
//     UNIQUE KEY email (email)
// ) AUTO_INCREMENT = 1111 `;

// export default userTable;

import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const UserSchema = new mongoose.Schema({
    username: { type: String, default: "" , trim: true },
    email: { type: String, default: "", trim: true },
    password: { type: String, default: "" },
    otp: { type: Number, default: 0 },
    is_registered: { type: Boolean, default: true },
    is_email_verified: { type: Boolean, default: false },
    auth_token: { type: String, default: null },
    system_number: { type: String, default: null },
    token: {type: String, default: null}
});

UserSchema.plugin(timestamps);

export const Usermodel = mongoose.model("User", UserSchema);
