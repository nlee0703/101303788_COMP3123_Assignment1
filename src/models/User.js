const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'username is required'],
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'email must be a valid email address']
        },
        password: {
            type: String,
            required: [true, 'password is required'],
            // Never returned by queries unless explicitly asked for with .select('+password')
            select: false
        }
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Hash the password before it is saved, so plain text never reaches the database
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Safety net: strip the hash if a user document is ever turned into JSON
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);
