
import cron from "node-cron";
import { checkAndUpdateIsReadStatus, sendNotifications } from "./cronFunctions.js";


export const runCronJobs = () => {

    // cron.schedule('*/5 * * * *', async () => {
    //     try {
    //         await sendNotifications()
    //     } catch (error) {
    //         console.error('Error executing cron sendNotifications:', error);
    //     }
    // });

    // cron.schedule('* * * * *', async () => {
    //     try {
    //         await checkAndUpdateIsReadStatus()
    //     } catch (error) {
    //         console.error('Error executing cron checkAndUpdateIsReadStatus:', error);
    //     }
    // });
}