const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  otp: { type: String, required: true },
  ExpiryOTP: { type: Date, required: true },
  isVerified: { type: Boolean, required: true, default: false },
  systemUser: { type: Boolean, required: true, default: false, immutable: true  },
}, { timestamps: true });


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return ;
  this.password = await bcrypt.hash(this.password, 10);
});



const User = mongoose.model('User', userSchema);
module.exports = User;
