import { Server } from "socket.io"
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import {userDetailQuery, updateSocketId, userGroupDetailQuery, findUserDetailQuery, 
  updateNotificationStatusForGroupQuery, updateNotificationStatusQuery,
  addMuteDataQuery,
  addGroupMuteDataQuery, findUserAndUpdateInCallStatusQuery,
  userDataQuery} from "./v1/user/models/userQuery.js"
import {addEntryForDeleteChatQuery, addMessageQuery, addRepliedGroupMessageDetailQuery, addRepliedMessageDetailQuery, markAsReadQuery, repliedGroupMessageDetailQuery, repliedMessageDetailQuery} from "./v1/user/models/messageQuery.js"
import { addGroupMessageQuery, findGroupDataQuery, getGroupDataQuery, getIsReadStatusQuery, markAllUnreadMessagesAsReadQuery, updateReadByStatusQuery } from "./v1/user/models/groupQuery.js"
import { logCallQuery,updateCallStatusQuery,updateCallEndQuery,findCallById, updateCallAnswerQuery, updateMissedCallStatusQuery} from "./v1/user/models/voiceQuery.js";
import { fetchMediaDetailsQuery } from "./v1/user/models/mediaQuery.js";
import { decryptMessages, encryptMessage } from "./v1/helpers/encryption.js";
import { sendMail } from "./config/nodemailer.js";

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

        socket.on("privateMessage", async({ message, sender_id, reciever_id, message_type, media_id, unique_message_key }) => {
          const missingFields = [];
          if (!sender_id) missingFields.push('sender_id');
          if (!reciever_id) missingFields.push('reciever_id');
          if (!message_type) missingFields.push('message_type');
          if (!unique_message_key) missingFields.push('unique_message_key');
      
          if (missingFields.length > 0) {
            socket.emit("error", { error: `Missing required fields: ${missingFields.join(', ')}` });
            return;
          }
          const istTime = moment.tz('Asia/Kolkata');
          const utcTime = istTime.utc().toDate();
          const [sender_data, reciever_data] = await Promise.all([userDataQuery(sender_id), userDataQuery(reciever_id)]);
          const recipient_socket = io.sockets.sockets.get(reciever_data.socket_id);
          const encrypted_content = encryptMessage(message);
          const message_data = {
            senders_id: sender_data._id,
            recievers_id: reciever_data._id,
            message_type: message_type,
            unique_message_key: unique_message_key,
            content: encrypted_content,
            sent_at: utcTime,
            media_id: media_id ? media_id : null
          }
          const data = await addMessageQuery(message_data)

          if (sender_id === reciever_id) {
            const message_data = await markAsReadQuery(data._id)
            socket.emit("markAsReadStatus", buildMsgExs(message_data._id, message_data.is_read, message_data.unique_message_key));
          }

          if (recipient_socket){
            if(media_id){
              const media_detail = await fetchMediaDetailsQuery(media_id);
              socket.to(reciever_data.socket_id).emit("message", buildMsgWithMedia(sender_data._id, sender_data.username, message, data._id, unique_message_key, media_id, media_detail.file_type, media_detail.file_name, media_detail.download_link ));
              }else{
              socket.to(reciever_data.socket_id).emit("message", buildMsgWithMedia(sender_data._id, sender_data.username, message, data._id, unique_message_key));
              }
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

        socket.on("replyMessage", async({ message, sender_id, reciever_id, message_type, media_id, replied_message_id, unique_message_key }) => {
          const missingFields = [];
          if (!sender_id) missingFields.push('sender_id');
          if (!reciever_id) missingFields.push('reciever_id');
          if (!message_type) missingFields.push('message_type');
          if (!replied_message_id) missingFields.push('replied_message_id');
          if (!unique_message_key) missingFields.push('unique_message_key');
      
          if (missingFields.length > 0) {
            socket.emit("error", { error: `Missing required fields: ${missingFields.join(', ')}` });
            return;
          }
          const istTime = moment.tz('Asia/Kolkata');
          const utcTime = istTime.utc().toDate();
          const [sender_data, reciever_data] = await Promise.all([userDataQuery(sender_id), userDataQuery(reciever_id)]);
          const recipient_socket = io.sockets.sockets.get(reciever_data.socket_id);
          const encrypted_content = encryptMessage(message);
          const message_data = {
            senders_id: sender_data._id,
            recievers_id: reciever_data._id,
            message_type: message_type,
            unique_message_key: unique_message_key,
            content: encrypted_content,
            sent_at: utcTime,
            media_id: media_id ? media_id : null
          }
          const data = await addMessageQuery(message_data)

          const reply_message = await addRepliedMessageDetailQuery(replied_message_id, data._id)
          let reply_message_data = await repliedMessageDetailQuery(reply_message.replied_message_id)
          reply_message_data = decryptMessages(reply_message_data);

          if (sender_id === reciever_id) {
            const message_data = await markAsReadQuery(data._id)
            socket.emit("markAsReadStatus", buildMsgExs(message_data._id, message_data.is_read, message_data.unique_message_key));
          }

          if (recipient_socket){
            if(media_id){
              const media_detail = await fetchMediaDetailsQuery(media_id);
              socket.to(reciever_data.socket_id).emit("message", buildMsgWithMedia(sender_data._id, sender_data.username, message, data._id, unique_message_key, media_id, media_detail.file_type, media_detail.file_name, media_detail.download_link, reply_message_data[0].content, reply_message_data[0].sender_name ));
            }else{
              socket.to(reciever_data.socket_id).emit("message", buildMsgWithMedia(sender_data._id, sender_data.username, message, data._id, unique_message_key, '' , '', '' , '',reply_message_data[0].content, reply_message_data[0].sender_name));
            }
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

        socket.on("markAsRead", async ({ message_id, user_id }) => {
          if (!message_id || !user_id) {
            socket.emit("error", { error: "Missing required fields in payload" });
            return;
          }
      
          const [data, group_data] = await Promise.all([markAsReadQuery(message_id),
            updateReadByStatusQuery(message_id, user_id)])
            if(data != null){
              const user_data = await userDataQuery(data.senders_id)
              socket.to(user_data.socket_id).emit("markAsReadStatus", buildMsgExs(message_id, data.is_read, data.unique_message_key));
            }else if (group_data != null){
              socket.emit("markAsReadStatus", buildMsgExs(message_id, group_data.is_read, group_data.unique_message_key));
           }
        });

        socket.on("muteUnmuteNotifications", async ({ recievers_id, mute_status, group_id }) => {
          if (!mute_status) {
            socket.emit("error", { error: "Missing required fields in payload" });
            return;
          }
          const user = await findUserDetailQuery(socket.id)
          recievers_id && recievers_id.trim() !== '' ? 
            await updateNotificationStatusQuery(user._id, recievers_id, mute_status) : ''
          group_id && group_id.trim() !== '' ? 
            await updateNotificationStatusForGroupQuery(user._id, group_id, mute_status) : ''
        });

        socket.on('groupMessage', async({group_name, sender_id, message, message_type, media_id, unique_message_key}) => {
          if (!sender_id || !group_name || !message_type || !unique_message_key) {
            socket.emit("error", { error: "Missing required fields in payload" });
            return;
          }
          const istTime = moment.tz('Asia/Kolkata');
          const utcTime = istTime.utc().toDate();
          const [user, group_id] = await Promise.all([userDataQuery(sender_id), getGroupDataQuery(group_name)])
          const encrypted_content = encryptMessage(message);
          const message_data = {
            group_id: group_id._id,
            senders_id: user._id,
            message_type: message_type,
            unique_message_key: unique_message_key,
            content: encrypted_content,
            sent_at: utcTime,
            media_id: media_id ? media_id : null
          }
          const message_cr = await addGroupMessageQuery(message_data)
          await updateReadByStatusQuery(message_cr._id, user._id)
          if(media_id){
            const media_detail = await fetchMediaDetailsQuery(media_id);
            socket.broadcast.to(group_name).emit('message', buildMsgWithMedia(user._id, user.username, message, message_cr._id, unique_message_key, media_id, media_detail.file_type, media_detail.file_name, media_detail.download_link,'' , '', group_id._id))
          }else{
            socket.broadcast.to(group_name).emit('message', buildMsgWithMedia(user._id, user.username, message, message_cr._id, unique_message_key, '' , '','' , '','' , '', group_id._id))
          }

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

        socket.on('groupReplyMessage', async({group_name, sender_id, message, message_type, media_id, replied_message_id, unique_message_key}) => {
          if (!sender_id || !group_name || !message_type || !replied_message_id || !unique_message_key) {
            socket.emit("error", { error: "Missing required fields in payload" });
            return;
          }
          const istTime = moment.tz('Asia/Kolkata');
          const utcTime = istTime.utc().toDate();
          const [user, group_id] = await Promise.all([userDataQuery(sender_id), getGroupDataQuery(group_name)])
          const encrypted_content = encryptMessage(message);
          const message_data = {
            group_id: group_id._id,
            senders_id: user._id,
            message_type: message_type,
            unique_message_key: unique_message_key,
            content: encrypted_content,
            sent_at: utcTime,
            media_id: media_id ? media_id : null 
          }
          const message_cr = await addGroupMessageQuery(message_data)
          await updateReadByStatusQuery(message_cr._id, user._id)

          const id = new mongoose.Types.ObjectId(group_id._id)
          const reply_message = await addRepliedGroupMessageDetailQuery(replied_message_id, message_cr._id)
          let reply_message_data = await repliedGroupMessageDetailQuery(reply_message.replied_message_id)
          reply_message_data = decryptMessages(reply_message_data);

          if(media_id){
            const media_detail = await fetchMediaDetailsQuery(media_id);
            socket.broadcast.to(group_name).emit('message', buildMsgWithMedia(user._id, user.username, message, message_cr._id, unique_message_key, media_id, media_detail.file_type, media_detail.file_name, media_detail.download_link, reply_message_data[0].content, reply_message_data[0].sender_name, group_id._id))
          }else{
            socket.broadcast.to(group_name).emit('message', buildMsgWithMedia(user._id, user.username, message, message_cr._id,unique_message_key, '' , '','' , '', reply_message_data[0].content, reply_message_data[0].sender_name, group_id._id))
          }
         
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
          if (!user_id || !group_name) {
            socket.emit("error", { error: "Missing required fields in payload" });
            return;
          }
          const user = await findGroupDataQuery(user_id, group_name)
          if (user) {
            socket.join(user.group_name)
            await markAllUnreadMessagesAsReadQuery(user_id, group_name)
          } else {
            socket.emit('error', { error: `You have not been able to join due to some error`})
          }
        });

        socket.on('leaveGroup', async ({ user_id, group_name }) => {
          if (!user_id || !group_name) {
            socket.emit("error", { error: "Missing required fields in payload" });
            return;
          }
          const user = await findGroupDataQuery(user_id, group_name)
          if (user) {
            socket.leave(user.group_name)
          } else {
            socket.emit('error', { error:`You have not been able to leave due to some error`})
          }
        })

/////////////////////////////////VOICE CALLING////////////////////////////////////////////////////
          socket.on("preInitiateCall", async ({ caller_id, callee_id }) => {
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
        
                const [call, callee_data, caller_data] = await Promise.all([logCallQuery(call_data), userDataQuery(callee_id), userDataQuery(caller_id)]) 
                const callee_socket = io.sockets.sockets.get(callee_data.socket_id);
               
                if (callee_data.in_call_status == true){
                    socket.emit("busyInCall", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username,  `The person you are trying to reach is busy at the moment`));
                    return;
                  }

                if (callee_socket) {
                    const [callee_status, caller_status] = await Promise.all([findUserAndUpdateInCallStatusQuery(callee_id, true), findUserAndUpdateInCallStatusQuery(caller_id, true)])
                    socket.emit("preInitiate:onn", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username,  `Call Initiated!`));
                    socket.to(callee_data.socket_id).emit("preInitiate:onn", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username,  `Incoming call!`));
                    socket.to(callee_data.socket_id).emit("preInitiateCall", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username,  `Incoming call!`));
                
                    const callTimeout = setTimeout(async () => {
                      const [call_data, callee_status, caller_status] = await Promise.all([updateMissedCallStatusQuery(call._id), findUserAndUpdateInCallStatusQuery(callee_id, false), findUserAndUpdateInCallStatusQuery(caller_id, false)])
                      socket.emit("initiateMissed", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username, `The call was missed.`));
                      socket.to(callee_data.socket_id).emit("initiateMissed", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username, `The call was missed.`));
                    }, 60000);

                    socket.on("endCall", ({ call_id }) => {
                      clearTimeout(callTimeout);
                      socket.emit("endCall", { call_id });
                    });
        
                    socket.on("calleePickedUp", () => {
                        clearTimeout(callTimeout);
                    });
                }else{
                  await updateMissedCallStatusQuery(call._id)
                  await sendMail(callee_data.email, `Incoming call from ${caller_data.username} at ${call_initiated_time}. Unfortunately, the call was not attended to as you were offline at the time.`, `Missed Call from Messenger app`)
                  socket.emit("preInitiate:onn", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username, `The person you are trying to reach, is currently unavailable!`))
                }
                
            } catch (error) {
                console.error("Error initiating call:", error);
                socket.emit("callError", { message: "Error initiating call" });
            }
          });

          socket.on("initiateCall", async ({ call_id, caller_id, callee_id, offer }) => {
            try {
                caller_id = new mongoose.Types.ObjectId(caller_id);
                callee_id = new mongoose.Types.ObjectId(callee_id);
        
                const [call, callee_data, caller_data] = await Promise.all([findCallById(call_id), userDataQuery(callee_id), userDataQuery(caller_id)]) 
                const callee_socket = io.sockets.sockets.get(callee_data.socket_id);
        
                if (callee_socket) {
                    socket.to(callee_data.socket_id).emit("callInitiated", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username,  `Incoming call!`, offer));
                }else{
                  socket.emit("callInitiated", buildMsgForCall(call._id, caller_id, caller_data.username, callee_id, callee_data.username, `The person you are trying to reach, is currently unavailable!`, offer))
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
                const call = await findCallById(call_id)
        
                const [ callee_socket, caller_socket] = await Promise.all([userDataQuery(call.callee_id), userDataQuery(caller_id)]) 
                socket.to(caller_socket.socket_id).emit("callAnswered", buildMsgForAnsCall(call_id, caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is answered!`, ans));
            } catch (error) {
                socket.emit("callError", { message: "Error answering call" });
            }
        });

        // Handle call rejection
        socket.on("rejectCall", async ({ call_id, caller_id }) => {
            const call = await findCallById(call_id);
            await updateCallStatusQuery(call_id, 'rejected')
            const [ callee_socket, caller_socket, callee_status, caller_status] = await Promise.all([userDataQuery(call.callee_id), userDataQuery(caller_id), findUserAndUpdateInCallStatusQuery(new mongoose.Types.ObjectId(call.callee_id), false), findUserAndUpdateInCallStatusQuery(new mongoose.Types.ObjectId(caller_id), false)]) 
            socket.to(caller_socket.socket_id).emit("callRejected", buildMsgForCall(call_id, caller_id, caller_socket.username, call.callee_id, callee_socket.username, `The person you are trying to reach, is currently unavailable!`));
        });

        // Handle call ending
        socket.on("endCall", async ({ call_id }) => {
            const istTime = moment.tz('Asia/Kolkata');
            const utcTime = istTime.utc().toDate();
            let end_time = utcTime;
        
            const call = await findCallById(call_id);

            if(call.start_time == null){
              await updateCallStatusQuery(call_id, 'canceled')
              const [callee_socket, caller_socket, callee_status, caller_status] = await Promise.all([userDataQuery(call.callee_id), userDataQuery(call.caller_id), findUserAndUpdateInCallStatusQuery(new mongoose.Types.ObjectId(call.callee_id), false), findUserAndUpdateInCallStatusQuery(new mongoose.Types.ObjectId(call.caller_id), false)]) 
              socket.emit("endCall:off", buildMsgForCallEnd(call_id, call.caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is ended`, 0));
              socket.to(caller_socket.socket_id).emit("endCall:off", buildMsgForCallEnd(call_id, call.caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is ended`, 0));
              socket.to(callee_socket.socket_id).emit("endCall:off", buildMsgForCallEnd(call_id, call.caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is ended`, 0));
            }else{
              const duration = (end_time - call.start_time) / 1000;
              await updateCallEndQuery(call_id, end_time, duration);
              const [callee_socket, caller_socket, callee_status, caller_status] = await Promise.all([userDataQuery(call.callee_id), userDataQuery(call.caller_id), findUserAndUpdateInCallStatusQuery(new mongoose.Types.ObjectId(call.callee_id), false), findUserAndUpdateInCallStatusQuery(new mongoose.Types.ObjectId(call.caller_id), false)]) 
              socket.emit("callEnded", buildMsgForCallEnd(call_id, call.caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is ended`, duration));
              socket.to(caller_socket.socket_id).emit("callEnded", buildMsgForCallEnd(call_id, call.caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is ended`, duration));
              socket.to(callee_socket.socket_id).emit("callEnded", buildMsgForCallEnd(call_id, call.caller_id, caller_socket.username, call.callee_id, callee_socket.username, `Call is ended`, duration));
            }
        });

        // Handle ICE Candidates
        socket.on('iceCandidate', (candidate) => {
          console.log('Received candidate:', candidate);
            socket.broadcast.emit('iceCandidate', candidate);
        });

        // Handle audio detection
        socket.on('audioDetected', ({ callee_id }) => {
          socket.broadcast.to(callee_id).emit('audioDetected', { message: 'Audio is coming through' });
        });

        socket.on("peer:nego:needed", async ({ caller_id, callee_id, offer }) => {
          const callee_socket = await userDataQuery(callee_id);
          socket.to(callee_socket.socket_id).emit("peer:nego:needed", { caller_id, callee_id, offer });
        });
      
        socket.on("peer:nego:done", async ({ caller_id, callee_id, ans }) => {
          const caller_socket = await userDataQuery(caller_id);
          socket.to(caller_socket.socket_id).emit("peer:nego:final", { caller_id, callee_id, ans });
        });

        socket.on("peer:call:stream", async ({ caller_id, callee_id, can_accept }) => {
          const callee_socket = await userDataQuery(callee_id);
          socket.to(callee_socket.socket_id).emit("peer:call:stream", { caller_id, callee_id, can_accept });
        });

        socket.on('disconnect', () => {
          console.log(`user disconnected, ${socket.id}`);
        });
      });
    }

function buildMsg(id, username, text, message_id, reply_content, reply_sender, group_id) {
  return {
      id,
      username,
      text,
      message_id,
      reply_content,
      reply_sender,
      group_id,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata'
      }).format(new Date())
  }
}

function buildMsgWithMedia(id, username, text, message_id, unique_message_key, media_id, file_type, file_name, download_link, reply_content, reply_sender, group_id) {
  return {
      id,
      username,
      text,
      message_id,
      unique_message_key,
      media_id,
      file_type,
      file_name,
      download_link,
      reply_content,
      reply_sender,
      group_id,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata'
      }).format(new Date())
  }
}

function buildMsgExs(message_id, is_read, unique_message_key) {
  return {
      message_id,
      is_read,
      unique_message_key
  }
}

function buildMsgForCall(call_id, caller_id, caller_name, callee_id, callee_name, text, offer) {
  return {
      call_id,
      caller_id,
      caller_name,
      callee_id,
      callee_name,
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

function buildMsgForAnsCall(call_id, caller_id, caller_name, callee_id, callee_name, text, ans) {
  return {
      call_id,
      caller_id,
      caller_name,
      callee_id,
      callee_name,
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

function buildMsgForCallEnd(call_id, caller_id, caller_name, callee_id, callee_name, text, duration) {
  return {
      call_id,
      caller_id,
      caller_name,
      callee_id,
      callee_name,
      text,
      duration
  }
}