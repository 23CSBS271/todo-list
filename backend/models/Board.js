const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isPublic: { type: Boolean, default: false },
        color: { type: String, default: '#007bff' },
    },
    { timestamps: true }
);

// Indexes for efficient queries
BoardSchema.index({ owner: 1 });
BoardSchema.index({ members: 1 });

module.exports = mongoose.model('Board', BoardSchema);
