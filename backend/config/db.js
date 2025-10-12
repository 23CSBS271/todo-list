const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://chinmayib209_db_user:chinmayi@todo.xu3q89a.mongodb.net/?retryWrites=true&w=majority&appName=Todo';
        await mongoose.connect(mongoUri, {});
        console.log('MongoDB connected');
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
        process.exit(1);
    }
};

module.exports = connectDB;
