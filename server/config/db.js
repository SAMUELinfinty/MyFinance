import mongoose from 'mongoose';

/**
 * Establish connection to MongoDB database
 */
export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myfinance';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n===============================================================`);
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.error(`To fix this:`);
    console.error(`1. Make sure local MongoDB is running (e.g. net start MongoDB), OR`);
    console.error(`2. Provide a MongoDB Atlas connection string in server/.env:`);
    console.error(`   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/myfinance`);
    console.error(`===============================================================\n`);
    // Do not call process.exit(1) so server can stay alive and return helpful HTTP errors
  }
};
