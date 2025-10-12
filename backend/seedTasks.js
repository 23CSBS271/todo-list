require("dotenv").config();
const mongoose = require('mongoose');

// Set MONGO_URI
process.env.MONGO_URI = 'mongodb+srv://chinmayib209_db_user:chinmayib209_db_user@taskmanager.gbjhq30.mongodb.net/?retryWrites=true&w=majority&appName=taskManager';

const connectDB = require('./config/db');
const Task = require('./models/Task');
const Board = require('./models/Board');
const User = require('./models/User');

async function seedTasks() {
    await connectDB();

    const boards = await Board.find({});
    if (boards.length === 0) {
        console.log('No boards found. Please create boards first.');
        process.exit(1);
    }

    const users = await User.find({});
    if (users.length === 0) {
        console.log('No users found. Please create users first.');
        process.exit(1);
    }

    const tasks = [];
    const priorities = ['low', 'medium', 'high'];
    const categories = ['Work', 'Personal', 'Other'];
    const statuses = ['pending', 'In Progress', 'Completed'];
    const columns = ['todo', 'in-progress', 'done'];

    for (let i = 0; i < 10; i++) {
        const board = boards[Math.floor(Math.random() * boards.length)];
        const createdBy = users[Math.floor(Math.random() * users.length)];
        const assignedTo = users.filter(u => u._id !== createdBy._id).slice(0, Math.floor(Math.random() * 3) + 1);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 days from now

        const reminderDate = new Date(dueDate);
        reminderDate.setHours(reminderDate.getHours() - Math.floor(Math.random() * 24) + 1); // 1-24 hours before due

        const statusIndex = Math.floor(Math.random() * statuses.length);
        const status = statuses[statusIndex];
        const column = columns[statusIndex];

        tasks.push({
            title: `Sample Task ${i + 1}`,
            description: `Description for sample task ${i + 1}`,
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            status: status,
            dueDate: dueDate,
            category: categories[Math.floor(Math.random() * categories.length)],
            assignedTo: assignedTo.map(u => u._id),
            createdBy: createdBy._id,
            boardId: board._id,
            column: column,
            reminderDate: reminderDate,
        });
    }

    await Task.insertMany(tasks);
    console.log('10 sample tasks created successfully.');
    process.exit(0);
}

seedTasks().catch(console.error);
