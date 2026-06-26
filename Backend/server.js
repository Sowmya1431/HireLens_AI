const dotenv = require('dotenv');
const { initGridfs } = require("./config/gridfs");
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    initGridfs();

    app.listen(PORT, () => {
        console.log("Server running");
    });
});