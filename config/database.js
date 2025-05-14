const mongoose = require('mongoose');

exports.connect = async () => {  // Add 'async' here
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database connected successfully");
    } catch (err) {
        console.log("DB connection failed");
        console.log(err);
        process.exit(1);
    }
};
