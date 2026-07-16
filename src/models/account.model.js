 const mongoose = require('mongoose');
 const Ledger = require('./ladger.model');

 const accountSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  accountLimit: { type: Number, enum: [50000, 150000, 2020000], default: 50000 },
  status: { type: String, enum: [ 'active', 'inactive' ], default: 'active' },
  phone: { type: Number, required: true, unique: true },
 },{ timestamps: true });

//this is for user to get all accounts
accountSchema.index({ userId: 1, status: 1 });
//this is for user to get balance of account
accountSchema.methods.getBalance = async function () {
    const balanceData = await Ledger.aggregate([
        { $match: { account: this._id } },
        { $group: { _id: null, totaldebit: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } }, totalcredit: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } } } },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalcredit", "$totaldebit"] }
            }
        }
       
    ]);
  
    if (balanceData.length == 0) {
        return 0;
    }
    return balanceData[0].balance;
}
accountSchema.methods.canTransfer = async function (amount) {
    const result = await Ledger.aggregate([
        {
            $match: {
                account: this._id,
                type: "debit",
            },
        },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    const totalDebit = result.length ? result[0].totalDebit : 0;

    return {
        allowed: totalDebit + amount <= this.accountLimit,
        used: totalDebit,
        remaining: this.accountLimit - totalDebit,
    };
};
accountSchema.methods.getTotalDebit = async function () {
    const result = await Ledger.aggregate([
        {
            $match: {
                account: this._id,
                type: "debit",
            },
        },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    return result.length ? result[0].totalDebit : 0;
};
accountSchema.methods.getTotalCredit = async function () {
    const result = await Ledger.aggregate([
        {
            $match: {
                account: this._id,
                type: "credit",
            },
        },
        {
            $group: {
                _id: null,  
                totalCredit: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    return result.length ? result[0].totalCredit : 0;
};

 const Account = mongoose.model('Account', accountSchema);

  module.exports = Account;
