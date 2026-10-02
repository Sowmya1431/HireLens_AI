const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields (name, email, password) are required.",
                message: "All fields (name, email, password) are required."
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanName = String(name).trim();

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long.",
                message: "Password must be at least 6 characters long."
            });
        }

        const exist = await User.findOne({ email: cleanEmail });
        if (exist) {
            return res.status(400).json({
                error: "An account with this email already exists. Please log in instead.",
                message: "An account with this email already exists. Please log in instead."
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            password: hash
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(400).json({
            error: err.message || "Registration failed.",
            message: err.message || "Registration failed."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required.",
                message: "Email and password are required."
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(400).json({
                error: "No account found with this email. Please register first.",
                message: "No account found with this email. Please register first."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                error: "Invalid email or password.",
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { email: user.email, id: user._id },
            process.env.JWT_SECRET || "default_jwt_secret",
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({
            error: err.message || "Login failed.",
            message: err.message || "Login failed."
        });
    }
};

module.exports = { register, login };