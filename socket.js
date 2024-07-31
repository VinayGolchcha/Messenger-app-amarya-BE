import { Server } from "socket.io"
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import {userDetailQuery, updateSocketId, userGroupDetailQuery, findUserDetailQuery, 
  updateNotificationStatusForGroupQuery, updateNotificationStatusQuery,
  addMuteDataQuery,
  addGroupMuteDataQuery,
  userDataQuery} from "./v1/user/models/userQuery.js"
import {addEntryForDeleteChatQuery, addMessageQuery, addRepliedGroupMessageDetailQuery, addRepliedMessageDetailQuery, markAsReadQuery, repliedGroupMessageDetailQuery, repliedMessageDetailQuery} from "./v1/user/models/messageQuery.js"
import { addGroupMessageQuery, getGroupDataQuery, getIsReadStatusQuery, markAllUnreadMessagesAsReadQuery, updateReadByStatusQuery } from "./v1/user/models/groupQuery.js"

import { logCallQuery,updateCallStatusQuery,updateCallEndQuery,findCallById, updateCallAnswerQuery} from "./v1/user/models/voiceQuery.js";
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
 
          const id = new new mongoose.Types.ObjectId(reciever_data._id)
          if (sender_data.mute_notifications != null && sender_data.mute_notifications.direct_messages != null){
              const exists = sender_data.mute_notifications.direct_messages.some(obj => obj.userId.equals(id) )
              if(exists === false){
                await addMuteDataQuery(sender_data._id, reciever_data._id)
              }
          }else{
            await addMuteDataQuery(sender_data._id, reciever_data._id)
          }
        });

        socket.on("replyMessage", async({ message, reciever_id, message_type, media_id, replied_message_id }) => {
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

          const reply_message = await addRepliedMessageDetailQuery(replied_message_id, data._id)
          const reply_message_data = await repliedMessageDetailQuery(reply_message.replied_message_id)

          if (recipient_socket){
            socket.to(reciever_data.socket_id).emit("message", buildMsg(sender_data._id, sender_data.username, message, data._id, reply_message_data[0].content));
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

        socket.on("markAsReadStatus", async ({ message_id }) => {
          const [data, group_data] = await Promise.all([markAsReadQuery(message_id), getIsReadStatusQuery(message_id)])

          if(data != null){
            socket.emit("message", buildMsgExs(message_id, data.content, data.is_read));
          }else if (group_data != null){
          socket.emit("message", buildMsgExs(message_id, group_data.content, group_data.is_read));
         }
        });

        socket.on("muteUnmuteNotifications", async ({ recievers_id, mute_status, group_id }) => {
          const user = await findUserDetailQuery(socket.id)
          recievers_id && recievers_id.trim() !== '' ? 
            await updateNotificationStatusQuery(user._id, recievers_id, mute_status) : ''
          group_id && group_id.trim() !== '' ? 
            await updateNotificationStatusForGroupQuery(user._id, group_id, mute_status) : ''
        });

        socket.on('groupMessage', async({group_name, message, message_type, media_id}) => {
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

          socket.broadcast.to(group_name).emit('message', buildMsg(user._id, user.username, message, message_cr._id))

          const id = new new mongoose.Types.ObjectId(group_id._id)
          if (user.mute_notifications != null && user.mute_notifications.groups != null){
              const exists = user.mute_notifications.groups.some(obj => obj.group_id.equals(id))
              if (exists === false) {
                await addGroupMuteDataQuery(user._id, id)
              }
          }else{
            await addGroupMuteDataQuery(user._id, id)
          }
        });

        socket.on('groupReplyMessage', async({group_name, message, message_type, media_id, replied_message_id}) => {
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

          const id = new mongoose.Types.ObjectId(group_id._id)
          const reply_message = await addRepliedGroupMessageDetailQuery(replied_message_id, message_cr._id)
          const reply_message_data = await repliedGroupMessageDetailQuery(reply_message.replied_message_id)

          socket.broadcast.to(group_name).emit('message', buildMsg(user._id, user.username, message, message_cr._id, reply_message_data[0].content))

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
          // join room
          if (user.length > 0) {
            socket.join(user[0].group_name)
            // socket.emit('message', buildMsg(user._id,user[0].username, `You have joined the ${user[0].group_name} chat room`))
            // socket.broadcast.to(user[0].group_name).emit('message', buildMsg('', user[0].username, `${user[0].username} has joined the room`))
            await markAllUnreadMessagesAsReadQuery(user_id, group_name)
          } else {
            socket.emit('message', buildMsg(`You have not been able to join due to some error`))
          }
        });

        socket.on('leaveGroup', async ({ user_id, group_name }) => {
          const user = await userGroupDetailQuery(socket.id, user_id, group_name)
          // leave room
          if (user.length > 0) {
            socket.leave(user[0].group_name)
            // socket.emit('message', buildMsg(user[0]._id, user[0].username, `You have left the ${user[0].group_name} chat room`))
            // socket.broadcast.to(user[0].group_name).emit('message', buildMsg('',user[0].username, `${user[0].username} has left the room`))
          } else {
            socket.emit('message', buildMsg(`You have not been able to leave due to some error`))
          }
        })

/////////////////////////////////VOICE CALLING////////////////////////////////////////////////////
          socket.on("initiateCall", async ({ caller_id, callee_id, offer }) => {
            try {
                const istTime = moment.tz('Asia/Kolkata');
                const utcTime = istTime.utc().toDate();
                let status = "initiated";
                let call_initiated_time = utcTime;
                caller_id = new mongoose.Types.ObjectId(caller_id);
                callee_id = new mongoose.Types.ObjectId(callee_id);
        
                const call_data = {
                    caller_id,
                    callee_id,
                    status,
                    call_initiated_time
                };
        
                const call = await logCallQuery(call_data);
                const callee_data = await userDataQuery(callee_id);
                const callee_socket = io.sockets.sockets.get(callee_data.socket_id);
        
                if (callee_socket) {
                    socket.broadcast.to(callee_data.socket_id).emit("callInitiated", buildMsgForCall(call._id, caller_id, callee_id,  `Incoming call!`, offer));
                }else{
                  socket.emit("callInitiated", buildMsgForCall(call._id, caller_id, callee_id, `The person you are trying to reach, is currently unavailable!`, offer))
                }
            } catch (error) {
                console.error("Error initiating call:", error);
        socket.emit("callError", { message: "Error initiating call" });
            }
        });
        
        // Handle call answering
        socket.on("answerCall", async ({ call_id, caller_id, ans }) => {
            try {
                const istTime = moment.tz('Asia/Kolkata');
                const utcTime = istTime.utc().toDate();
                let start_time = utcTime;
                await updateCallAnswerQuery(call_id, start_time);
        
                const call = await findCallById(call_id);
                const caller_socket = await userDataQuery(call.caller_id);
                // const callee_socket = await userDataQuery(call.callee_id);
        
                // if (caller_socket) {
                    socket.to(caller_socket.socket_id).emit("callAnswered", buildMsgForAnsCall(call_id, call.caller_id, call.callee_id, `Call is answered!`, ans));
                // }else{
                //   socket.to(caller_socket.socket_id).emit("message", buildMsgForCall(call_id, '', `The person you are trying to reach, is currently unavailable!`));
                // }
            } catch (error) {
                socket.emit("callError", { message: "Error answering call" });
            }
        });

        // Handle call rejection
        socket.on("rejectCall", async ({ call_id }) => {
            await updateCallStatusQuery(call_id, "rejected");
            const call = await findCallById(call_id);
            const caller_socket = await userDataQuery(call.caller_id);
            socket.to(caller_socket.socket_id).emit("callRejected", buildMsgForCall(call_id, '', `The person you are trying to reach, is currently unavailable!`));
        });

        // Handle call ending
        socket.on("endCall", async ({ call_id }) => {
            const istTime = moment.tz('Asia/Kolkata');
            const utcTime = istTime.utc().toDate();
            let end_time = utcTime;
            await updateCallEndQuery(call_id, end_time);
        
            const call = await findCallById(call_id);
            const duration = (end_time - call.start_time) / 1000;
        
            await updateCallEndQuery(call_id, end_time, duration);
        
            const callee_socket = await userDataQuery(call.callee_id);
            socket.emit("callEnded", buildMsgForCallEnd(call_id, call.caller_id, `Call is ended`, duration));
            socket.to(callee_socket.socket_id).emit("callEnded", buildMsgForCallEnd(call_id, call.caller_id, `Call is ended`, duration));
        });

        // Handle SDP Offer from Caller
        // socket.on('callInitiated', ({call_id, caller_id }) => {
        //   console.log('Received offer:', call_id);
        //     io.to(callee_id).emit('callInitiated',  buildMsgForCall(call_id, caller_id, `Incoming call!`));
        // });

        // Handle SDP Answer from Callee
        // socket.on('callAnswered', ({ answer, caller_Id }) => {
        //   console.log('Received answer:', )
        //     io.to(caller_Id).emit('callAnswered', { answer });
        // });

        // Handle ICE Candidates
        socket.on('iceCandidate', (candidate) => {
          console.log('Received candidate:', candidate);
            socket.broadcast.emit('iceCandidate', candidate);
        });

        // Handle audio detection
        socket.on('audioDetected', ({ callee_id }) => {
          socket.broadcast.to(callee_id).emit('audioDetected', { message: 'Audio is coming through' });
        });

        socket.on('disconnect', () => {
          console.log(`user disconnected, ${socket.id}`);
        });
      });
    }

function buildMsg(id, name, text, message_id, reply_content) {
  return {
      id,
      name,
      text,
      message_id,
      reply_content,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata'
      }).format(new Date())
  }
}

function buildMsgExs(message_id, content, is_read) {
  return {
      message_id,
      content,
      is_read
  }
}

function buildMsgForCall(call_id, caller_id, callee_id, text, offer) {
  return {
      call_id,
      caller_id,
      callee_id,
      text,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata'
      }).format(new Date()),
      offer
  }
}

function buildMsgForAnsCall(call_id, caller_id, callee_id, text, ans) {
  return {
      call_id,
      caller_id,
      callee_id,
      text,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata'
      }).format(new Date()),
      ans
  }
}

function buildMsgForCallEnd(call_id, caller_id, text, duration) {
  return {
      call_id,
      caller_id,
      text,
      duration
  }
}