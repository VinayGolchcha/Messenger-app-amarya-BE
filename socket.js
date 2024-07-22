import { Server } from "socket.io"
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import {userDetailQuery, updateSocketId, userGroupDetailQuery, findUserDetailQuery, 
  updateNotificationStatusForGroupQuery, updateNotificationStatusQuery,
  addMuteDataQuery,
  addGroupMuteDataQuery,
  userDataQuery} from "./v1/user/models/userQuery.js"
import {addEntryForDeleteChatQuery, addMessageQuery, markAsReadQuery} from "./v1/user/models/messageQuery.js"
import { addGroupMessageQuery, getGroupDataQuery, markAllUnreadMessagesAsReadQuery, updateReadByStatusQuery } from "./v1/user/models/groupQuery.js"


export const socketConnection = async(server)=>{
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.use(async(socket, next) => {
      const user_email = socket.handshake.query.user_email;
      if (user_email) {
          const exist_email = await userDetailQuery(user_email)
          if (exist_email){
            socket.user_email = user_email;
            return next();
          }
      }
      return next(new Error('authentication error'));
    });

    io.on('connection', async(socket) => {
        console.log('a user connected', socket.id);
        console.log('a user connected', socket.user_email);
        await updateSocketId(socket.user_email, socket.id)
        
        socket.emit('session', { socketId: socket.id });

        socket.onAny((event, ...args) => {
          console.log(event, args);
        });

        socket.on("privateMessage", async({ message, reciever_id, message_type, media_id }) => {
          const istTime = moment.tz('Asia/Kolkata');
          const utcTime = istTime.utc().toDate();
          const [sender_data, reciever_data] = await Promise.all([findUserDetailQuery(socket.id), userDataQuery(reciever_id)]);
          const recipient_socket = io.sockets.sockets.get(reciever_data.socket_id);
          const message_data = {
            senders_id: sender_data._id,
            recievers_id: reciever_data._id,
            message_type: message_type,
            content: message,
            sent_at: utcTime,
            media_id: media_id ? media_id : null 
          }
          const data = await addMessageQuery(message_data)

          if (recipient_socket){
            socket.to(reciever_data.socket_id).emit("message", buildMsg(sender_data._id, sender_data.username, message, data._id));
          }

          await addEntryForDeleteChatQuery(data._id, sender_data._id, reciever_data._id)
 
          const id = new mongoose.Types.ObjectId(reciever_data._id)
          if (sender_data.mute_notifications != null && sender_data.mute_notifications.direct_messages != null){
              const exists = sender_data.mute_notifications.direct_messages.some(obj => obj.userId.equals(id) )
              if(exists === false){
                await addMuteDataQuery(sender_data._id, reciever_data._id)
              }
          }else{
            await addMuteDataQuery(sender_data._id, reciever_data._id)
          }
        });


        socket.on("markAsRead", async ({ message_id }) => {
          const user = await findUserDetailQuery(socket.id)
          await Promise.all([markAsReadQuery(message_id),
            updateReadByStatusQuery(message_id, user._id)])
        });

        socket.on("muteUnmuteNotifications", async ({ recievers_id, mute_status, group_id }) => {
          const user = await findUserDetailQuery(socket.id)
          // await Promise.all([updateNotificationStatusQuery(user._id, recievers_id, mute_status), 
          //   updateNotificationStatusForGroupQuery(user._id, group_id, mute_status)
          // ])
          recievers_id && recievers_id.trim() !== '' ? 
            await updateNotificationStatusQuery(user._id, recievers_id, mute_status) : ''
          group_id && group_id.trim() !== '' ? 
            await updateNotificationStatusForGroupQuery(user._id, group_id, mute_status) : ''
        });

        socket.on('groupMessage', async({group_name, message, message_type, media_id}) => {
          console.log('message received: ', message);
          const istTime = moment.tz('Asia/Kolkata');
          const utcTime = istTime.utc().toDate();
          const [user, group_id] = await Promise.all([findUserDetailQuery(socket.id), getGroupDataQuery(group_name)])
          const message_data = {
            group_id: group_id._id,
            senders_id: user._id,
            message_type: message_type,
            content: message,
            sent_at: utcTime,
            media_id: media_id ? media_id : null 
          }
          const message_cr = await addGroupMessageQuery(message_data)
          await updateReadByStatusQuery(message_cr._id, user._id)

          io.to(group_name).emit('message', buildMsg(user._id, user.username, message, message_cr._id))

          const id = new mongoose.Types.ObjectId(group_id._id)
          if (user.mute_notifications != null && user.mute_notifications.groups != null){
              const exists = user.mute_notifications.groups.some(obj => obj.group_id.equals(id))
              if (exists === false) {
                await addGroupMuteDataQuery(user._id, id)
              }
          }else{
            await addGroupMuteDataQuery(user._id, id)
          }
        });

        socket.on('enterGroup', async ({ user_id, group_name }) => {
          const user = await userGroupDetailQuery(socket.id, user_id, group_name)
          console.log(user)
          // join room
          if (user.length > 0) {
            socket.join(user[0].group_name)
            socket.emit('message', buildMsg(user._id,user[0].username, `You have joined the ${user[0].group_name} chat room`))
            socket.broadcast.to(user[0].group_name).emit('message', buildMsg('', user[0].username, `${user[0].username} has joined the room`))
            await markAllUnreadMessagesAsReadQuery(user_id, group_name)
          } else {
            socket.emit('message', buildMsg(`You have not been able to join due to some error`))
          }
        });

        socket.on('leaveGroup', async ({ user_id, group_name }) => {
          const user = await userGroupDetailQuery(socket.id, user_id, group_name)
          console.log(user)
          // leave room
          if (user.length > 0) {
            socket.leave(user[0].group_name)
            socket.emit('message', buildMsg(user[0]._id, user[0].username, `You have left the ${user[0].group_name} chat room`))
            socket.broadcast.to(user[0].group_name).emit('message', buildMsg('',user[0].username, `${user[0].username} has left the room`))
          } else {
            socket.emit('message', buildMsg(`You have not been able to leave due to some error`))
          }
        })
      
        socket.on('disconnect', () => {
          console.log(`user disconnected, ${socket.id}`);
        });
      });
}


function buildMsg(id, name, text, message_id) {
  return {
      id,
      name,
      text,
      message_id,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata'
      }).format(new Date())
  }
}