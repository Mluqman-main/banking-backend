const express = require('express');
const app = express();
const dns = require('dns');
const cors = require('cors');
app.use(
  cors({
    origin: "https://frontend-banking-57jhjboqr-mluqman-mains-projects.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
dns.setServers(['8.8.8.8', '8.8.4.4']);
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./db/db');
connectDB();
const router = require('./routes/user.route');
const routerTran = require('./routes/transication.route');

app.use('/api/auth', router);
app.use('/api/transaction', routerTran);


module.exports = app