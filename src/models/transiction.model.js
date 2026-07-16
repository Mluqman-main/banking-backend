const mongoose = require("mongoose")
//schema for transcation
const transcationSchema = new mongoose.Schema({

    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        default: null
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        default: null
    },
    status: {
        type: String,
        enum: {
            values: ["pending", "success", "failed", "reversed"],
            message: "Invalid transaction status",
        },
        default: "pending",
    },

    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Minimum amount is 0"],
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required"],
        index: true,
        unique: true,
    }

}, { timestamps: true })

const Transcation = mongoose.model("Transcation", transcationSchema)
module.exports = Transcation