require("dotenv").config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

async function seedUsers() {
    await connectDB();

    // Check if users exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
        console.log('Users already exist. Skipping seeding.');
        process.exit(0);
    }

    const sampleUsers = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            password: await bcrypt.hash('password123', 12),
            role: 'admin',
            profileImageUrl: '/uploads/default-admin.jpg'
        },
        {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            password: await bcrypt.hash('password123', 12),
            role: 'member',
            profileImageUrl: '/uploads/1758497319567-profile2.jpg'
        },
        {
            name: 'Bob Smith',
            email: 'bob@example.com',
            password: await bcrypt.hash('password123', 12),
            role: 'member',
            profileImageUrl: '/uploads/1758498058381-profile3.jpg'
        },
        {
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            password: await bcrypt.hash('password123', 12),
            role: 'member',
            profileImageUrl: null
        }
    ];

    await User.insertMany(sampleUsers);
    console.log('4 sample users created successfully.');
    process.exit(0);
}

seedUsers().catch(console.error);
