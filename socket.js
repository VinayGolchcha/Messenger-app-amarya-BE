import { Server } from "socket.io"
import {userDetailQuery, updateSocketId, userGroupDetailQuery, findUserDetailQuery} from "./v1/user/models/userQuery.js"
import {addMessageQuery, markAsReadQuery} from "./v1/user/models/messageQuery.js"


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
        
        socket.onAny((event, ...args) => {
          console.log(event, args);
        });

        socket.on("privateMessage", async({ message, reciever_socket_id, message_type, media_id }) => {
          const sender_data = await findUserDetailQuery(socket.id)
          const reciever_data = await findUserDetailQuery(reciever_socket_id)
          socket.to(reciever_socket_id).emit("message", buildMsg(sender_data._id, sender_data.username, message));
          const message_data = {
            senders_id: sender_data._id,
            recievers_id: reciever_data._id,
            message_type: message_type,
            content: message,
            media_id: media_id ? media_id : null 
          }
          await addMessageQuery(message_data)
        });

        socket.on("markAsRead", async ({ message_id }) => {
          await markAsReadQuery(message_id);
        });

        socket.on('groupMessage', async({group_name, message}) => {
          console.log('message received: ', message);
          const user = await findUserDetailQuery(socket.id)
          io.to(group_name).emit('message', buildMsg(user._id, user.username, message))
        });

        socket.on('enterGroup', async ({ user_id, group_name }) => {
          const user = await userGroupDetailQuery(socket.id, user_id, group_name)
          console.log(user)
          // join room
          if (user) {
            socket.join(user[0].group_name)
            socket.emit('message', buildMsg(user._id,user[0].username, `You have joined the ${user[0].group_name} chat room`))
            socket.broadcast.to(user[0].group_name).emit('message', buildMsg('', user[0].username, `${user[0].username} has joined the room`)) //broadcast to everyone in the room
          } else {
            socket.emit('message', buildMsg(`You have not been able to join due to some error`))
          }
        });

        socket.on('leaveGroup', async ({ user_id, group_name }) => {
          const user = await userGroupDetailQuery(socket.id, user_id, group_name)
          console.log(user)
          // leave room
          if (user) {
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


function buildMsg(id, name, text) {
  return {
      id,
      name,
      text,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric'
      }).format(new Date())
  }
}