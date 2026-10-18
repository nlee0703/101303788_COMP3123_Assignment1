const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        first_name: { type: String, required: true, trim: true, maxlength: 50 },
        last_name: { type: String, required: true, trim: true, maxlength: 50 },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'email must be a valid email address']
        },
        position: { type: String, required: true, trim: true, maxlength: 100 },
        salary: { type: Number, required: true, min: [0.01, 'salary must be positive'] },
        date_of_joining: { type: Date, required: true },
        department: { type: String, required: true, trim: true, maxlength: 100 },
        // The owner: the user who created this employee. Set from the JWT, never from the request body.
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

employeeSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Employee', employeeSchema);
