require("dotenv").config();
const mongoose = require('mongoose');

// Set MONGO_URI
process.env.MONGO_URI = 'mongodb+srv://chinmayib209_db_user:chinmayib209_db_user@taskmanager.gbjhq30.mongodb.net/?retryWrites=true&w=majority&appName=taskManager';

const connectDB = require('./config/db');
const Board = require('./models/Board');
const User = require('./models/User');

async function seedBoards() {
    await connectDB();

    const users = await User.find({});
    if (users.length === 0) {
        console.log('No users found. Please create users first.');
        process.exit(1);
    }

    const boards = [];
    for (let i = 0; i < 5; i++) {
        const owner = users[Math.floor(Math.random() * users.length)];
        const members = users.filter(u => u._id !== owner._id).slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 members

        boards.push({
            name: `Sample Board ${i + 1}`,
            description: `Description for sample board ${i + 1}`,
            owner: owner._id,
            members: members.map(u => u._id),
        });
    }

    await Board.insertMany(boards);
    console.log('5 sample boards created successfully.');
    process.exit(0);
}

seedBoards().catch(console.error);
