import { connectToDatabase } from './config/db_mongo.js';
import express, { json } from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import https from 'https';
import {createServer} from 'http'; 
import fs from 'fs';
import routes from './v1/user/routes/routes.js';
import { socketConnection } from './socket.js';


const app = express();
config();
app.use(express.json());
app.use(cookieParser());
// app.use(cors());
app.use(express.urlencoded({ extended: true }));
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
// const server = https.createServer(sslOptions, app);
const server = createServer(app);

// Create an HTTPS server with SSL/TLS
// const port = process.env.PORT || 6060;
// const expressServer = https.createServer(sslOptions, app).listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


try {
  await socketConnection(server);
  console.log("Socket connected successfully");
} catch (error) {
  console.error("Socket connection failed:", error);
}

const port = process.env.PORT || 6060;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});