const mongoose = require("mongoose")
//schema for ladger
const ladgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "User ID is required"],
        index: true,
        immutable: true,
    },
    transcation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transcation",
        required: [true, "Transcation ID is required"],
        index: true,
        immutable: true,
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        immutable: true,
    },


    type: {
        type: String,
        enum: {
            values: ["credit", "debit"],
            message: "Invalid type",

        },
        required: [true, "Type is required"],
        immutable: true,
    }

}, { timestamps: true })

//this is for user to prevent ledger modification
function preventLedgerModification() {
    throw new Error("Ledger cannot be updated")
}
//this is for user to prevent ledger modification
ladgerSchema.pre("update", preventLedgerModification)
ladgerSchema.pre("delete", preventLedgerModification)
ladgerSchema.pre("remove", preventLedgerModification)
ladgerSchema.pre("deleteMany", preventLedgerModification)
ladgerSchema.pre("findOneAndUpdate", preventLedgerModification)
ladgerSchema.pre("findOneAndRemove", preventLedgerModification)
ladgerSchema.pre("findOneAndDelete", preventLedgerModification)
ladgerSchema.pre("findOneAndReplace", preventLedgerModification)
ladgerSchema.pre("deleteOne", preventLedgerModification)
ladgerSchema.pre("updateMany", preventLedgerModification)
ladgerSchema.pre("updateOne", preventLedgerModification)



const Ladger = mongoose.model("Ladger", ladgerSchema)

module.exports = Ladger