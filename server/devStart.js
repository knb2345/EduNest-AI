const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

(async () => {
  try {
    console.log("Starting in-memory MongoDB for dev...");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URL = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
    console.log("MONGODB_URL set to in-memory server.");

    // create sample PDF
    const PDFDocument = require("pdfkit");
    const sampleDir = path.join(__dirname, "../sample");
    if (!fs.existsSync(sampleDir)) fs.mkdirSync(sampleDir);
    const samplePath = path.join(sampleDir, "edunest_sample.pdf");
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(samplePath);
    doc.pipe(stream);
    doc.fontSize(12).text("EduNest was launched in 2025.", { align: "left" });
    doc.moveDown();
    doc.text("The course contains six modules.");
    doc.moveDown();
    doc.text("The final assessment requires a score of 70 percent.");
    doc.end();
    await new Promise((r) => stream.on("close", r));
    console.log("Sample PDF written to:", samplePath);

    // start the app
    require("./index.js");

    // wait for mongoose connection
    mongoose.connection.on("connected", async () => {
      console.log("Mongoose connected to in-memory server.");
      // seed minimal data
      try {
        const Profile = require("./models/Profile");
        const User = require("./models/User");
        const Course = require("./models/Course");
        const jwt = require("jsonwebtoken");

        // create profiles
        const p1 = await Profile.create({ about: "Instructor profile" });
        const p2 = await Profile.create({ about: "Enrolled student" });
        const p3 = await Profile.create({ about: "Non-enrolled student" });

        // create users
        const instr = await User.create({
          firstName: "Dev",
          lastName: "Instructor",
          email: "instructor@dev.local",
          password: "password",
          accountType: "Instructor",
          additionalDetails: p1._id,
        });
        const student = await User.create({
          firstName: "Enrolled",
          lastName: "Student",
          email: "student@dev.local",
          password: "password",
          accountType: "Student",
          additionalDetails: p2._id,
        });
        const nonStudent = await User.create({
          firstName: "Non",
          lastName: "Student",
          email: "nonstudent@dev.local",
          password: "password",
          accountType: "Student",
          additionalDetails: p3._id,
        });

        const course1 = await Course.create({
          courseName: "Sample Course A",
          courseDescription: "A sample course",
          instructor: instr._id,
          tag: ["dev"],
          studentsEnroled: [student._id],
          status: "Published",
        });

        const course2 = await Course.create({
          courseName: "Sample Course B",
          courseDescription: "Another course",
          instructor: instr._id,
          tag: ["dev"],
          studentsEnroled: [],
          status: "Published",
        });

        const jwtSecret = process.env.JWT_SECRET;
        const instrToken = jwt.sign({ id: instr._id, email: instr.email }, jwtSecret);
        const studentToken = jwt.sign({ id: student._id, email: student.email }, jwtSecret);
        const nonStudentToken = jwt.sign({ id: nonStudent._id, email: nonStudent.email }, jwtSecret);

        const out = {
          samplePdf: samplePath,
          instructor: { email: instr.email, token: instrToken },
          student: { email: student.email, token: studentToken },
          nonStudent: { email: nonStudent.email, token: nonStudentToken },
          courses: { course1: course1._id.toString(), course2: course2._id.toString() },
        };
        const outPath = path.join(__dirname, "ai_test_info.json");
        fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
        console.log("Seeded dev data written to:", outPath);
        console.log(JSON.stringify(out, null, 2));
      } catch (err) {
        console.error("Seeding error:", err);
      }
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
