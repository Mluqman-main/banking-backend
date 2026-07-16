const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/email.service');
const bcrypt = require('bcrypt');
const Account = require('../models/account.model');
const Loan = require('../models/lon.model');
const mongoose = require('mongoose');
const Ledger = require('../models/ladger.model');
const Transaction = require('../models/transiction.model');

const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
     const isSystemUser = email.toLowerCase() === process.env.SYSTEM_EMAIL.toLowerCase();

        const OTP = Math.floor(100000 + Math.random() * 900000);
       const ExpiryOTP = Date.now() + 5 * 60 * 1000;
        await sendEmail.sendVerificationOtp(email, OTP, name);
        const user = await User.create({
            name,
            email,
            password,
            phone,
            otp: OTP,
            ExpiryOTP,
            systemUser: isSystemUser,

        });





        res.status(201).json({ message: ' OTP sent on your email please check your email and verify your email ', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                error: "Invalid OTP"
            });
        }
       

        if (user.ExpiryOTP < Date.now()) {
            return res.status(400).json({
                error: "OTP has expired"
            });
        }
        user.isVerified = true;
        await user.save();
        const account = await Account.create({
            userId: user._id,  
            phone:user.phone
        });


        const token = jwt.sign({ id: user._id ,
            account: account._id
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ message: 'OTP verified successfully', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const ResentOTP = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.isVerified) {
            return res.status(400).json({ error: 'User already verified' });
        }
        const OTP = Math.floor(100000 + Math.random() * 900000);
        const ExpiryOTP = Date.now() + 5 * 60 * 1000;
        await sendEmail.sendVerificationOtp(email, OTP, user.name);
        user.otp = OTP;
        user.ExpiryOTP = ExpiryOTP;
        await user.save();
        res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
 const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Include password if it's select: false
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    } 
    const ismatch = await bcrypt.compare(password, user.password);

    if (!ismatch) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    }
    const account = await Account.findOne({ userId: user._id });
          
    if (!account) {
      return res.status(400).json({
        error: "Account not found",
      });
    }

 
    const token = jwt.sign({ id: user._id,
      account: account._id
     }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server Error",
    });
  }
};
const getme = async (req, res) => {
  try {
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    res.status(200).json({
      message: "User found",
      user:{
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        systemUser: user.systemUser
      },
   
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server Error",
    });
  }
};
const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "Logout successful",
  });
};
const PasswordReset = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          error: "Email is required",
        });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }
    const OTP = Math.floor(100000 + Math.random() * 900000);
       const ExpiryOTP = Date.now() + 5 * 60 * 1000;
      await sendEmail.sendVerificationOtp(email, OTP, user.name);
      user.otp = OTP;
      user.ExpiryOTP = ExpiryOTP;
      await user.save();
      res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                error: "New password is required",
            });
        }

        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        // Password will be hashed by the pre-save hook
        user.password = newPassword;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
        });
    }
};
const getTransferLimit = async (req, res) => {
    try {
        const user = req.user;

        const account = await Account.findOne({
            userId: user._id,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        // Total debit used
        const totalDebit = await account.getTotalDebit();

        const accountLimit = account.accountLimit;
        const remainingLimit = Math.max(accountLimit - totalDebit, 0);

        return res.status(200).json({
            success: true,
            data: {
                accountLimit,
                usedLimit: totalDebit,
                remainingLimit,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const requestLimitIncrease = async (req, res) => {
    try {
        const { newLimit } = req.body;

        if (!newLimit) {
            return res.status(400).json({
                success: false,
                message: "New limit is required",
            });
        }

        const account = await Account.findOne({
            userId: req.user._id,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (newLimit <= account.accountLimit) {
            return res.status(400).json({
                success: false,
                message: "Requested limit must be greater than current limit.",
            });
        }

        account.limitRequest = {
            requestedLimit: newLimit,
            status: "pending",
            requestedAt: new Date(),
        };
        account.accountLimit = Number(newLimit);
        await account.save();

   

        res.status(200).json({
            success: true,
            message: "Limit increase request submitted successfully.",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const verifyrsetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                error: "User not found",
            });
        }

        if (String(user.otp) !== String(otp)) {
            return res.status(400).json({
                error: "Invalid OTP",
            });
        }

        if (user.ExpiryOTP < Date.now()) {
            return res.status(400).json({
                error: "OTP has expired",
            });
        }

        // ✅ Clear OTP after successful verification
 

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token,
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
        });
    }
};
const createLoan = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const user = req.user;
        const { cnic, amount, duration, purpose, idempotencyKey } = req.body;

        if (!cnic || !amount || !duration || !purpose || !idempotencyKey) {
            throw new Error("All fields are required.");
        }

        // Allowed loan amounts
        const allowedAmounts = [1000, 10000, 20000];

        if (!allowedAmounts.includes(Number(amount))) {
            throw new Error("Invalid loan amount.");
        }

        // User
        const userData = await User.findById(user._id).session(session);

        if (!userData) {
            throw new Error("User not found.");
        }

        // Verify CNIC
    

        // Customer Account
        const customerAccount = await Account.findOne({
            userId: user._id,
            status: "active",
        }).session(session);

        if (!customerAccount) {
            throw new Error("Customer account not found.");
        }

        // System Account (Bank)
        const systemUser= await User.findOne({
            email:process.env.SYSTEM_EMAIL
        })
        const systemAccount = await Account.findOne({
            userId: systemUser._id,
            status: "active",
        }).session(session);

        if (!systemAccount) {
            throw new Error("System account not found.");
        }

        // Duplicate Transaction
        const existing = await Transaction.findOne({
            idempotencyKey,
        }).session(session);

        if (existing) {
            throw new Error("Loan request already processed.");
        }

        // Create Loan
        const loan = await Loan.create(
            [{
                userId: userData._id,
                accountId: customerAccount._id,
                fullName: userData.name,
                cnic: cnic,
                phone: userData.phone,
                amount,
                duration,
                purpose,
                status: "approved",
            }],
            { session }
        );

        // Create Transaction
        const transaction = new Transaction({
            fromAccount: systemAccount._id,
            toAccount: customerAccount._id,
            amount,
            status: "pending",
            idempotencyKey,
            type: "loan",
        });

        await transaction.save({ session });

        // Debit Bank
        await Ledger.create(
            [{
                account: systemAccount._id,
                amount,
                type: "debit",
                transcation: transaction._id,
            }],
            { session }
        );

        // Credit Customer
        await Ledger.create(
            [{
                account: customerAccount._id,
                amount,
                type: "credit",
                transcation: transaction._id,
            }],
            { session }
        );

        transaction.status = "success";
        await transaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "Loan approved successfully.",
            loan: loan[0],
            transaction,
        });

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    } finally {
        await session.endSession();
    }
};
   

module.exports = { register, verifyOTP, ResentOTP ,verifyrsetOTP ,login , getme ,PasswordReset ,logout, updatePassword,getTransferLimit,requestLimitIncrease, createLoan}; 
