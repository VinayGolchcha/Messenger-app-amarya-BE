import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_STRING || 'mongodb://127.0.0.1:27017/your-database-name');
    console.log('----DB----CONNECTION-SUCCESS---------------');
  } catch (err) {
    console.error('MongoDB Connection Error: ' + err);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Connection Error: ' + err);
});
