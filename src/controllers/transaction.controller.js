 const Transiction = require("../models/transiction.model")
 const Account = require("../models/account.model")
const Ladger = require("../models/ladger.model")
const mongoose = require("mongoose")
const User = require("../models/user.model")
 const emailService = require("../services/email.service")
 const dotenv = require("dotenv")
dotenv.config()

//this is only for user to transfer money 
const transferMoney = async (req, res) => {
    try {
        const user = req.user
        const { toAccount, amount, idempotencyKey } = req.body
        //checking datals is correct 
        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({ message: "All fields are required" })
        }
        const fromAccount = await Account.findOne({
            userId: user._id,
        })
        const totalDebit = await fromAccount.getTotalDebit();

if (totalDebit + Number(amount) > fromAccount.accountLimit) {
    return res.status(400).json({
        success: false,
        message: `Transfer limit exceeded. Remaining limit: Rs. ${
            fromAccount.accountLimit - totalDebit
        }`,
    });
}
       
        const toAccountUser = await Account.findOne({
            phone: toAccount,
        })
        if (fromAccount.phone ==toAccountUser.phone) {
            return res.status(404).json({ message: "this is your account plz check your account number" })
        }
        const toAccountUserDetails = await User.findOne({
            phone: toAccount,
        })
        


        if (!toAccountUser) {
            return res.status(404).json({ message: "Account ditals is not found" })
        }
        // idempotency check
        const existingTranscation = await Transiction.findOne({
            idempotencyKey: idempotencyKey,
        })
        if (existingTranscation) {
            if (existingTranscation.status == "success") {
                return res.status(200).json({ message: "transcation already done" })
            }
            if (existingTranscation.status == "pendding") {
                return res.status(200).json({ message: "transcation is pendding wait for process" })
            }
            if (existingTranscation.status == "failed") {
                return res.status(500).json({ message: "transcation processing is failed" })
            }
            if (existingTranscation.status == "reversed") {
                return res.status(500).json({ message: "transcation is reversed" })
            }

        }



        const balance = await fromAccount.getBalance();
        if (balance < amount) {
            return res.status(400).json(`{ message: "Insufficient balance. current balance is ${balance} and transfer amount is ${amount}" }`)
        }

        if (!toAccountUser) {
            return res.status(404).json({ message: "Account ditals is not found" })
        }

        if (toAccountUser.status !== "active") {
            return res.status(400).json({ message: "toAccount is not active" })
        }

        const session = await mongoose.startSession()
        session.startTransaction()
        const transcation = new Transiction({
            fromAccount,
            toAccount: toAccountUser._id,
            amount,
            idempotencyKey,
            status: "pending"
        },)

        const debitLedgerEntry = await Ladger.create(
            [{
                account: fromAccount,
                amount,
                type: "debit",
                transcation: transcation._id
            }], { session }
        )
        const creditLedgerEntry = await Ladger.create(
            [{
                account: toAccountUser,
                type: "credit",
                amount,
                transcation: transcation._id
            }], { session }
        )
        transcation.status = "success"
        await transcation.save({ session })

        await session.commitTransaction()
        session.endSession()

        await emailService.sendTransactionDebit(
            toAccountUserDetails.email,
           toAccountUserDetails.name,
            amount,
            "credit"
        );



        return res.status(200).json({ message: "Transfer successful", transcation })


    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}
//this is for admin to add money to account
 const payouts = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { toAccount,amount, idempotencyKey } = req.body;

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                success: false,
                message: "Amount and idempotencyKey are required."
            });
        }
        
        // Only the system user can access this endpoint
        if (toAccount !== "mluqmakhan@gmail.com") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only the system account can perform payouts."
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero."
            });
        }

        // System account
        const systemUser = await User.findOne({
            email: process.env.SYSTEM_EMAIL
        });

        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: "System user not found."
            });
        }

        const toAccountuser = await Account.findOne({
            userId: systemUser._id
        });

        if (!toAccountuser) {
            return res.status(404).json({
                success: false,
                message: "System account not found."
            });
        }

        // Prevent duplicate requests
        const existing = await Transiction.findOne({
            idempotencyKey
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Duplicate request."
            });
        }

       await session.startTransaction();

toAccountuser.balance += Number(amount);
await toAccountuser.save({ session });

const transaction = await Transiction.create(
    [{
        toAccount: toAccountuser._id,
        toAccountemail: systemUser.email,
        amount,
        type: "deposit",
        status: "success",
        idempotencyKey
    }],
    { session }
);

await Ladger.create(
    [{
        account: toAccountuser._id,
        amount,
        type: "credit",
        transcation: transaction[0]._id
    }],
    { session }
);

await session.commitTransaction();

await emailService. sendTransactionCredit(
    systemUser.email,
    systemUser.name,
    
    "credit"
);


        return res.status(200).json({
            success: true,
            message: "Funds added successfully.",
            transaction: transaction[0]
        });

    } catch (error) {
       
    if (session.inTransaction()) {
        await session.abortTransaction();
    }

    return res.status(500).json({
        success: false,
        message: error.message
    });


    } finally {
        session.endSession();
    }
};


module.exports = {
    payouts,
    transferMoney
}