require("dotenv").config();
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const Task = require('./models/Task');
const User = require('./models/User');

async function addCompletedTask() {
    await connectDB();

    const users = await User.find({});
    if (users.length === 0) {
        console.log('No users found. Please create users first.');
        process.exit(1);
    }

    const randomUser = users[Math.floor(Math.random() * users.length)];

    const task = {
        title: `Completed Sample Task`,
        description: `Description for completed sample task`,
        priority: 'high',
        status: 'Completed',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        assignedTo: [randomUser._id],
        createdBy: randomUser._id,
        todoChecklist: [
            { text: 'Step 1', completed: true },
            { text: 'Step 2', completed: true },
            { text: 'Step 3', completed: true },
        ],
        progress: 100,
    };

    await Task.create(task);
    console.log('Completed task added successfully.');
    process.exit(0);
}

addCompletedTask().catch(console.error);
