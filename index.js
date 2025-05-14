const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
const user = require('./routes/user');
const PORT = process.env.PORT || 4000;

require('./config/database').connect();

app.use('/api/v1', user);

app.listen(PORT, () => {
    console.log(`Server live at ${PORT}`);
})
