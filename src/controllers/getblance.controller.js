const Account = require("../models/account.model");

const getBalance = async (req, res) => {
    try {
        const account = await Account.findOne({
            userId: req.user.id,
            status: "active"
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            success: true,
            data: {
                accountNumber: account.accountNumber,
                currency: account.currency,
                balance
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getBalance
};