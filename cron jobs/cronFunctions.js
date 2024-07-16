import dotenv from "dotenv";
import { getAllUsersQuery } from "../v1/user/models/userQuery.js";
import { fetchNewMessagesForNotificationQuery } from "../v1/user/models/messageQuery.js";
import { createNotificationQuery, updateNotification } from "../v1/user/models/notificationQuery.js";
import { sendMail } from "../config/nodemailer.js";
dotenv.config();


export const sendNotifications = async () => {
    try {
        const data = await getAllUsersQuery();

        for(let i = 0; i<data.length; i++){
            const user_id = new mongoose.Types.ObjectId(data[i]._id)
            const new_messages = await fetchNewMessagesForNotificationQuery(user_id)
            
            for (let j = 0; j < new_messages.length; j++) {
                let content = `You have recieved ${(new_messages[j].messages).length} message(s) from ${new_messages[j].sender_name}`
                const notif_data = await createNotificationQuery(new_messages[j].senders_id, new_messages[j].reciever_email, content)
                await sendMail(new_messages[j].reciever_email, content, `New Notification From Messenger`)
                await updateNotification(notif_data._id)
            }
        }
        return `Notifications sent successfully!`;
    } catch (error) {
        console.error(error);
        throw error;
    }
}