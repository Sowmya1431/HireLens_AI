const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeroutes');
const atsRoutes = require('./routes/atsroutes');
const contactRoutes = require("./routes/contactRoutes");
const optimizeRoutes = require("./routes/optimizeRoutes"); // NEW
const chatbotRoutes = require("./routes/chatbot");

const authmiddleware = require('./middleware/authmiddleware');

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// IMPORTANT: upload route BEFORE express.json
app.use('/api/resume', resumeRoutes);


// NEW optimize route (because it also uses file upload)
app.use('/api/optimize', optimizeRoutes);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ats', atsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.get('/api/protected', authmiddleware, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

module.exports = app;