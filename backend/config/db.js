const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drone-system';

  // First, try connecting to the configured MongoDB URI
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected:', conn.connection.host);
    return conn;
  } catch (error) {
    console.warn('Could not connect to MongoDB at:', uri);
    console.warn('Reason:', error.message);
  }

  // Fallback: use in-memory MongoDB (zero install required)
  try {
    console.log('Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log('In-memory MongoDB connected successfully!');
    console.log('NOTE: Data will be lost when the server stops.');
    console.log('      Install MongoDB locally for persistent data.');
    return conn;
  } catch (memError) {
    console.error('Failed to start in-memory MongoDB:', memError.message);
    console.error('\nTo fix this, either:');
    console.error('  1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.error('  2. Or run: npm install mongodb-memory-server');
    process.exit(1);
  }
};

module.exports = connectDB;
