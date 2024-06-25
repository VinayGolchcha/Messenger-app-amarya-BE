import { Server } from 'socket.io';

export const socketConnection = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust as necessary for security
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    // Example event listener
    socket.on('exampleEvent', (data) => {
      console.log('exampleEvent received with data:', data);
      socket.emit('exampleResponse', { message: 'Hello from server' });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};
