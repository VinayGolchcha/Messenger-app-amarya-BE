import { connectToDatabase } from './config/db_mongo.js';
import express, { json } from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import https from 'https'; // Import the 'https' module
import fs from 'fs'; // Import the 'fs' module
import routes from './v1/user/routes/routes.js';


const app = express();
config();
app.use(json());
app.use(cors());

// Import & Define API versions
app.use('/api/v1', routes);

app.use('/', (req, res) => {
  res.send("Hey, I'm online now!!");
});

// // Connect to the database
await connectToDatabase();

// SSL/TLS Certificate options
const sslOptions = {
  key: fs.readFileSync('private.key'), // Read the private key
  cert: fs.readFileSync('certificate.crt') // Read the certificate
};

// Create an HTTPS server with SSL/TLS
// const port = process.env.PORT || 6060;
// https.createServer(sslOptions, app).listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

const port = process.env.PORT || 6060;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
