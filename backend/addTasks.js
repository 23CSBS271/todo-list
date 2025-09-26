require("dotenv").config();
const mongoose = require('mongoose');

// Set MONGO_URI
process.env.MONGO_URI = 'mongodb+srv://chinmayib209_db_user:chinmayib209_db_user@taskmanager.gbjhq30.mongodb.net/?retryWrites=true&w=majority&appName=taskManager';

const connectDB = require('./config/db');
const Task = require('./models/Task');
const User = require('./models/User');

async function addTasks() {
    await connectDB();

    const users = await User.find({});
    if (users.length === 0) {
        console.log('No users found. Please create users first.');
        process.exit(1);
    }

    const tasks = [];
    for (let i = 0; i < 3; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const dueDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // random due date within 30 days

        tasks.push({
            title: `Pending Task ${i + 1}`,
            description: `Description for pending task ${i + 1}`,
            priority: 'medium',
            status: 'pending',
            dueDate,
            assignedTo: [randomUser._id],
            createdBy: randomUser._id,
            todoChecklist: [
                { text: 'Step 1', completed: false },
                { text: 'Step 2', completed: false },
            ],
        });
    }

    await Task.insertMany(tasks);
    console.log('3 pending tasks added successfully.');
    process.exit(0);
}

addTasks().catch(console.error);
