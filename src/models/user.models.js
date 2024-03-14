import mongooose from 'mongoose'
import jwt from 'jsonwebtoken'
import brcypt from 'bcrypt'

const userSchema = new mongooose.Schema({
    watchHistory: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'Video'
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,

    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = brcypt.hash(this.password, 10)
    }
    next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await brcypt.compare(password, this.password)
}

userSchema.methods.generateAccessToke = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });

}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

}
export const User = mongooose.model('User', userSchema) 