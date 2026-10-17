const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Locker = require("../models/Locker");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");

// Book a locker
router.post("/", authMiddleware, upload.single("idImage"), async (req, res) => {
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature, lockerId, durationHours ,idType,idNumber} =
//       req.body;
//   if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
//     return res.status(400).json({
//       message: "Payment details missing",
//     });
//   }

//   const order = await razorpay.orders.fetch(razorpay_order_id);

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(`${order.id}|${razorpay_payment_id}`)
//     .digest("hex");

//   const expected = Buffer.from(expectedSignature, "hex");
//   const received = Buffer.from(razorpay_signature, "hex");

//   const signatureValid =
//     expected.length === received.length &&
//     crypto.timingSafeEqual(expected, received);

//   if (!signatureValid) {
//     return res.status(400).json({
//       message: "Payment verification failed",
//     });
//   }

//   const payment = await razorpay.payments.fetch(razorpay_payment_id);

//   if (payment.order_id !== order.id || payment.status !== "captured") {
//     return res.status(400).json({
//       message: "Payment not captured",
//     });
//   }


    try {
        // const { lockerId, durationHours ,idType,idNumber} = req.body;
            const {
              razorpay_payment_id,
              razorpay_order_id,
              razorpay_signature,
              lockerId,
              durationHours,
              idType,
              idNumber,
            } = req.body;
            if (
              !razorpay_payment_id ||
              !razorpay_order_id ||
              !razorpay_signature
            ) {
              return res.status(400).json({
                message: "Payment details missing",
              });
            }

            const order = await razorpay.orders.fetch(razorpay_order_id);

            const expectedSignature = crypto
              .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
              .update(`${order.id}|${razorpay_payment_id}`)
              .digest("hex");

            const expected = Buffer.from(expectedSignature, "hex");
            const received = Buffer.from(razorpay_signature, "hex");

            const signatureValid =
              expected.length === received.length &&
              crypto.timingSafeEqual(expected, received);

            if (!signatureValid) {
              return res.status(400).json({
                message: "Payment verification failed",
              });
            }

            const payment = await razorpay.payments.fetch(razorpay_payment_id);

            if (
              payment.order_id !== order.id ||
              payment.status !== "captured"
            ) {
              return res.status(400).json({
                message: "Payment not captured",
              });
            }

        // Find locker
        const locker = await Locker.findOneAndUpdate(
        { _id: lockerId, status: "available" },
        { status: "booked" },
        { new: true }
        );

        if (!locker) {
        return res.status(400).json({ message: "Locker not available or already booked" });
        }

        // Generate 6 digit access code
        const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        const idImagePath = req.file ? req.file.path : null;

        // Create booking
        const booking = new Booking({
            user: req.user.id,
            locker: locker._id,
            startTime,
            endTime,
            accessCode,
            idType,
            idNumber,
            idImage: idImagePath
        });

        await booking.save();

        // Update locker
        locker.status = "booked";
        locker.currentBooking = booking._id;
        await locker.save();

        res.status(201).json({
            message: "Locker booked successfully",
            accessCode,
            booking
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get user's bookings
router.get("/my-bookings", authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("locker", "lockerNumber")
            .sort({ createdAt: -1 });

        res.json(bookings);

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Verify locker access code
router.post("/verify-access", async (req, res) => {
    try {
        const { lockerNumber, accessCode } = req.body;

        const booking = await Booking.findOne({
            accessCode: accessCode,
            status: "active"
        }).populate("locker");

        if (!booking) {
            return res.status(400).json({
                message: "Invalid access code or booking expired"
            });
        }

        if (booking.locker.lockerNumber !== lockerNumber) {
            return res.status(400).json({
                message: "Access code does not match this locker"
            });
        }

        res.json({
            message: "Locker opened successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;