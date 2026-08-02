const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY;
const keySecret = process.env.RAZORPAY_SECRET;

exports.instance = keyId && keySecret
	? new Razorpay({ key_id: keyId, key_secret: keySecret })
	: null;
