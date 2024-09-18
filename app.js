import { connectToDatabase } from './config/db_mongo.js';
import express, { json } from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import https from 'https';
import http from 'http'; 
import fs from 'fs';
import routes from './v1/user/routes/routes.js';
import { runCronJobs } from './cron jobs/scheduler.js';
import { socketConnection } from './socket.js';
import { monitorMessages } from './v1/helpers/messageMonitor.js'

const app = express();
config();
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS setup
const corsOptions = {
  origin: ['http://localhost:3000','https://messenger-app-amarya-fe.vercel.app'], // replace with your client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

const isProduction = process.env.NODE_ENV === 'production';
let server;

if (isProduction) {
  server = http.createServer(app);
} else {
  let sslOptions = {};
  try {
    sslOptions = {
      key: fs.readFileSync('./private.key'), 
      cert: fs.readFileSync('./certificate.crt')
    };
  } catch (error) {
    console.warn("SSL certificate files not found or cannot be read:", error);
  }
  server = https.createServer(sslOptions, app);
}

try {
  await socketConnection(server);
  console.log("Socket connected successfully");
} catch (error) {
  console.error("Socket connection failed:", error);
}
// monitorMessages()
runCronJobs()

const port = process.env.PORT || 6060;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});