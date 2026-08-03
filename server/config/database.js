const mongoose = require("mongoose");
require("dotenv").config();

const SERVER_SELECTION_TIMEOUT_MS = 10000;
const CONNECT_TIMEOUT_MS = 10000;

exports.connect = async () => {
	if (mongoose.connection.readyState === 1) return mongoose.connection;

	const mongodbUrl = (process.env.MONGODB_URL || "").trim();
	if (!mongodbUrl) {
		const environment = process.env.NODE_ENV === "production" ? "production" : "this environment";
		throw new Error(`MONGODB_URL is required in ${environment}.`);
	}

	try {
		await mongoose.connect(mongodbUrl, {
			serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
			connectTimeoutMS: CONNECT_TIMEOUT_MS,
			maxPoolSize: 10,
		});
		console.log("Database connection established");
		return mongoose.connection;
	} catch (_error) {
		throw new Error("Database connection failed within the configured timeout.");
	}
};

exports.CONNECT_TIMEOUT_MS = CONNECT_TIMEOUT_MS;
exports.SERVER_SELECTION_TIMEOUT_MS = SERVER_SELECTION_TIMEOUT_MS;
