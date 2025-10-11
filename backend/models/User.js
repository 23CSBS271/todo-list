const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        // Name: must be alphabetic only (no numbers)
        name:  { type: String, required: true, trim: true, match: [/^[A-Za-z ]+$/, 'Name can only contain letters and spaces']},
        email: {type: String, required: true, unique: true, lowercase: true, trim: true},
        password: { type: String, required: true},
        profileImageUrl : { type: String,default:null },
        // Roles: admin | user
        role : { type: String, enum: ['admin', 'user'], default: 'user' },
        settings: { type: Object, default: { notifications: { email: true, inApp: true }, theme: 'light' } },
        boards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Board' }],
        },
        { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);