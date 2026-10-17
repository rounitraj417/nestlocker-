const express = require("express");
const router = express.Router();

const razorpay = require("../config/razorpay");

router.post("/create-order", async (req, res) => {

  try {

    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json(order);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Order creation failed"
    });

  }

});

module.exports = router;

// const express = require("express");
// const router = express.Router();

// const razorpay = require("../config/razorpay");

// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount } = req.body;

//     if (!amount || Number(amount) <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid amount is required",
//       });
//     }

//     const options = {
//       amount: Math.round(Number(amount) * 100),
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     return res.status(200).json({
//       success: true,
//       order,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (error) {
//     console.error("Razorpay order creation error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Order creation failed",
//     });
//   }
// });

// module.exports = router;
