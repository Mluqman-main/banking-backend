const express = require("express");
const routerTran = express.Router();
const transactionController = require("../controllers/transaction.controller");
const { verifyToken } = require("../middlewares/token.middleware");
const Balance = require("../controllers/getblance.controller");
const History = require("../controllers/histry.controller");

// /api/transaction/transfer
routerTran.post("/transfer", verifyToken, transactionController.transferMoney);

// /api/transaction/payouts
routerTran.post("/payouts",  transactionController.payouts);
// api/transaction/balance
 routerTran.get("/balance", verifyToken, Balance.getBalance);

 // /api/transaction/history
 routerTran.get("/history",  History.getHistory);

 module.exports= routerTran