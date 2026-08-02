// Load backend environment variables before importing routes and providers.
// When started from the server directory, dotenv reads server/.env.
require("dotenv").config();

// Importing necessary modules and packages
const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/Course");
const paymentRoutes = require("./routes/Payments");
const contactUsRoute = require("./routes/Contact");
const aiRoutes = require("./routes/aiTutor");
const recommendationRoutes = require("./routes/recommendations");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");

// Setting up port number
const PORT = process.env.PORT || 4000;



// Connecting to database
database.connect();
 
// Middlewares
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
app.use(
	cors({
		origin(origin, callback) {
			if (!origin || origin === CLIENT_URL) return callback(null, true);
			return callback(new Error("Origin is not allowed by CORS"));
		},
		credentials: true,
	})
);
app.use(
	fileUpload({
			useTempFiles: false,
			// keep uploads in memory for dev; use temp files in production if needed
			limits: { fileSize: parseInt(process.env.AI_MAX_UPLOAD_BYTES || `${10 * 1024 * 1024}`) },
		})
);

// Connecting to cloudinary
cloudinaryConnect();

// Setting up routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

// End of code.
