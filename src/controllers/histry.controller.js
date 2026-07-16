const Transcation = require("../models/transiction.model");
const Account = require("../models/account.model");
const jwt = require("jsonwebtoken");

const getHistory = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const account = await Account.findOne({  userId: decoded.id });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        const transactions = await Transcation.find({
            $or: [
                { fromAccount: account._id },
                { toAccount: account._id }
            ]
        })
            .populate("fromAccount", "phone accountNumber")
            .populate("toAccount", "phone accountNumber")
            .sort({ createdAt: -1 });

        const history = transactions.map((tx) => ({
            id: tx._id,
            type:
                tx.fromAccount?._id.toString() === account._id.toString()
                    ? "debit"
                    : "credit",
            phone:
                tx.fromAccount?._id.toString() === account._id.toString()
                    ? tx.toAccount?.phone
                    : tx.fromAccount?.phone,
            amount: tx.amount,
            status: tx.status,
            date: tx.createdAt
        }));

        return res.status(200).json({
            success: true,
            history
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getHistory
};