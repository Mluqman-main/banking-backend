const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    cnic: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      enum: [1000, 10000, 20000],
      required: true,
    },

    duration: {
      type: Number,
      enum: [3, 6, 12],
      required: true,
    },

    purpose: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
const Loan = mongoose.model("Loan", loanSchema);
module.exports = Loan;
