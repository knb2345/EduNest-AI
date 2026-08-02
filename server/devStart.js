const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// Demo mode may use an explicitly configured server-side AI key, but never
// supplies one of its own.
require("dotenv").config({ path: path.join(__dirname, ".env") });

const DEMO_PASSWORD = "Demo123!";
const DEMO_USERS = [
  {
    firstName: "Demo",
    lastName: "Instructor",
    email: "instructor@edunest.demo",
    accountType: "Instructor",
    about: "Development-only EduNest instructor",
  },
  {
    firstName: "Demo",
    lastName: "Student",
    email: "student@edunest.demo",
    accountType: "Student",
    about: "Development-only enrolled student",
  },
  {
    firstName: "Demo",
    lastName: "Outsider",
    email: "outsider@edunest.demo",
    accountType: "Student",
    about: "Development-only non-enrolled student",
  },
];

async function createSamplePdf() {
  const PDFDocument = require("pdfkit");
  const sampleDir = path.join(__dirname, "../sample");
  fs.mkdirSync(sampleDir, { recursive: true });

  const samplePath = path.join(sampleDir, "edunest_sample.pdf");
  const document = new PDFDocument();
  const stream = fs.createWriteStream(samplePath);
  document.pipe(stream);
  document.fontSize(12).text("EduNest AI was launched in 2025.");
  document.moveDown();
  document.text("The demo course contains six learning modules.");
  document.moveDown();
  document.text("The final assessment requires a score of 70 percent.");
  document.end();

  await new Promise((resolve, reject) => {
    stream.on("close", resolve);
    stream.on("error", reject);
  });
}

async function seedDemoData() {
  const Profile = require("./models/Profile");
  const User = require("./models/User");
  const Course = require("./models/Course");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = [];
  for (const demoUser of DEMO_USERS) {
    const profile = await Profile.create({ about: demoUser.about });
    users.push(
      await User.create({
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        email: demoUser.email,
        password: hashedPassword,
        accountType: demoUser.accountType,
        approved: true,
        additionalDetails: profile._id,
        image: "",
      })
    );
  }

  const [instructor, student] = users;
  const courseOne = await Course.create({
    courseName: "EduNest AI Demo Course",
    courseDescription: "Course-grounded AI Tutor demonstration",
    whatYouWillLearn: "Upload the included sample PDF and ask grounded questions.",
    instructor: instructor._id,
    price: 0,
    thumbnail: "",
    tag: ["demo", "ai-tutor"],
    studentsEnroled: [student._id],
    instructions: ["Use only the uploaded course document as evidence."],
    status: "Published",
  });
  const courseTwo = await Course.create({
    courseName: "Course Isolation Demo",
    courseDescription: "Separate course for verifying retrieval isolation",
    whatYouWillLearn: "Course-scoped retrieval keeps documents isolated.",
    instructor: instructor._id,
    price: 0,
    thumbnail: "",
    tag: ["demo", "isolation"],
    studentsEnroled: [],
    instructions: ["Keep this course separate from the first demo course."],
    status: "Published",
  });

  instructor.courses = [courseOne._id, courseTwo._id];
  student.courses = [courseOne._id];
  await Promise.all([instructor.save(), student.save()]);

  console.log("");
  console.log("Development-only demo credentials");
  for (const demoUser of DEMO_USERS) {
    console.log(`${demoUser.email} / ${DEMO_PASSWORD}`);
  }
  console.log(`EduNest AI Demo Course ID: ${courseOne._id}`);
  console.log(`Course Isolation Demo ID: ${courseTwo._id}`);
}

async function startDemo() {
  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URL = mongod.getUri();
    process.env.JWT_SECRET = "edunest-development-demo-secret";
    process.env.PORT = "4000";

    await createSamplePdf();

    mongoose.connection.once("open", () => {
      seedDemoData().catch((error) => {
        console.error("Demo seed failed:", error.message);
        process.exitCode = 1;
      });
    });

    require("./index.js");

    const shutdown = async () => {
      await mongoose.disconnect();
      await mongod.stop();
      process.exit(0);
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Demo startup failed:", error.message);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

startDemo();
