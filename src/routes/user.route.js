 const express = require('express');
 const router = express.Router();
 const { verifyOTP } = require('../controllers/user.controller');
 const { register } = require('../controllers/user.controller');
 const { ResentOTP } = require('../controllers/user.controller');
 const { login } = require('../controllers/user.controller');
 const { getme } = require('../controllers/user.controller');
 const { verifyToken } = require('../middlewares/token.middleware');
 const { logout } = require('../controllers/user.controller');
 const { PasswordReset } = require('../controllers/user.controller'); // Password reset
 const { updatePassword } = require('../controllers/user.controller');
 const { getTransferLimit } = require('../controllers/user.controller');
 const {requestLimitIncrease} = require('../controllers/user.controller');
 const { verifyrsetOTP } = require('../controllers/user.controller');
const { createLoan } = require('../controllers/user.controller');
 //const { register, login, logout, getUser } = require('../controllers/user.controller');

// /api/auth/register - Register a new user
 router.post('/register', register);
 // /api/auth/verifyOTP - Verify OTP
 router.post('/verifyOTP', verifyOTP);
 // /api/auth/ResentOTP - Resend OTP
 router.post('/ResentOTP', ResentOTP);
 // /api/auth/login - Login
 router.post('/login', login);
 // /api/auth/me - Get user information
 router.get('/me', verifyToken, getme);
 // /api/auth/logout - Logout
 router.post('/logout', verifyToken, logout);
 // /api/auth/resetPassword - Reset password
 router.post('/resetPassword', verifyToken, PasswordReset);
 // /api/auth/updatePassword - Update password
 router.post('/updatePassword', verifyToken, updatePassword);
// /api/auth/getTransferLimit - Get transfer limit
 router.get('/getTransferLimit', verifyToken, getTransferLimit);
 // /api/auth/requestLimitIncrease - Request limit increase
 router.post('/requestLimitIncrease', verifyToken, requestLimitIncrease);
 // /api/auth/verifyresetOTP - Verify reset OTP
 router.post('/verifyresetOTP', verifyrsetOTP);
 // /api/auth/createLoan - Create a loan
 router.post('/createLoan', verifyToken, createLoan);

 module.exports=router