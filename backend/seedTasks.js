require("dotenv").config();
const mongoose = require('mongoose');

// Set MONGO_URI
process.env.MONGO_URI = 'mongodb+srv://chinmayib209_db_user:chinmayib209_db_user@taskmanager.gbjhq30.mongodb.net/?retryWrites=true&w=majority&appName=taskManager';

const connectDB = require('./config/db');
const Task = require('./models/Task');
const User = require('./models/User');

async function seedTasks() {
    await connectDB();

    const users = await User.find({});
    if (users.length === 0) {
        console.log('No users found. Please create users first.');
        process.exit(1);
    }

    const priorities = ['low', 'medium', 'high'];
    const statuses = ['pending', 'In Progress', 'Completed'];

    const tasks = [];
    for (let i = 0; i < 50; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const dueDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // random due date within 30 days

        tasks.push({
            title: `Sample Task ${i + 1}`,
            description: `Description for sample task ${i + 1}`,
            priority,
            status,
            dueDate,
            assignedTo: [randomUser._id],
            createdBy: randomUser._id,
            todoChecklist: [
                { text: 'Step 1', completed: Math.random() > 0.5 },
                { text: 'Step 2', completed: Math.random() > 0.5 },
            ],
        });
    }

    await Task.insertMany(tasks);
    console.log('50 sample tasks created successfully.');
    process.exit(0);
}

seedTasks().catch(console.error);
