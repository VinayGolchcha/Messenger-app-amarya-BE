import { connectToDatabase } from './config/db_mongo.js';
import express, { json } from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import fs from 'fs';
import routes from './v1/user/routes/routes.js';
import { socketConnection } from './socket.js';

const app = express();
config();
app.use(json());
app.use(cors());

// Import & Define API versions
app.use('/api/v1', routes);

app.use('/', (req, res) => {
  res.send("Hey, I'm online now!!");
});

// Connect to the database
try {
  await connectToDatabase();
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection failed:", error);
}

// SSL/TLS Certificate options
let sslOptions = {};
try {
  sslOptions = {
    key: fs.readFileSync('private.key'), 
    cert: fs.readFileSync('certificate.crt')
  };
} catch (error) {
  console.warn("SSL certificate files not found or cannot be read:", error);
}

// Create HTTP or HTTPS server
const server = createServer(app);

// Initialize Socket.IO
try {
  socketConnection(server);  // Make sure this function doesn't need to be awaited
  console.log("Socket connected successfully");
} catch (error) {
  console.error("Socket connection failed:", error);
}

const port = process.env.PORT || 6061;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
