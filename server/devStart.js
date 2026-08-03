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
  {
    firstName: "Demo",
    lastName: "Reviewer One",
    email: "reviewer.one@edunest.demo",
    accountType: "Student",
    about: "Development-only catalog reviewer",
  },
  {
    firstName: "Demo",
    lastName: "Reviewer Two",
    email: "reviewer.two@edunest.demo",
    accountType: "Student",
    about: "Development-only catalog reviewer",
  },
];

function demoThumbnail(label, startColor, endColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#${startColor}"/><stop offset="1" stop-color="#${endColor}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><text x="400" y="225" fill="white" font-family="Arial" font-size="42" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
  const Category = require("./models/Category");
  const CourseProgress = require("./models/CourseProgress");
  const RatingAndReview = require("./models/RatingandReview");
  const Section = require("./models/Section");
  const SubSection = require("./models/Subsection");
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

  const [instructor, student, outsider, reviewerOne, reviewerTwo] = users;
  const categories = await Category.create([
    {
      name: "Data Science",
      description: "Data analysis, statistics, machine learning, Python, and SQL",
    },
    {
      name: "Web Development",
      description: "Frontend and backend application development",
    },
    {
      name: "Product Design",
      description: "User research, interaction design, and product thinking",
    },
    {
      name: "Business",
      description: "Marketing, strategy, and business fundamentals",
    },
  ]);
  const [dataScience, webDevelopment, productDesign, business] = categories;

  const demoLessons = await SubSection.create([
    {
      title: "Working with course evidence",
      timeDuration: "480",
      description: "Understand grounded course retrieval.",
      videoUrl: "",
    },
    {
      title: "Checking citations",
      timeDuration: "420",
      description: "Trace answers back to source material.",
      videoUrl: "",
    },
  ]);
  const demoSection = await Section.create({
    sectionName: "Grounded learning workflow",
    subSection: demoLessons.map((lesson) => lesson._id),
  });

  const courseOne = await Course.create({
    courseName: "EduNest AI Demo Course",
    courseDescription:
      "Use data-science examples to explore a course-grounded AI Tutor and evidence retrieval.",
    whatYouWillLearn:
      "Upload the included sample PDF, ask grounded questions, and evaluate citations.",
    instructor: instructor._id,
    price: 0,
    thumbnail: demoThumbnail("AI Tutor + Data", "2563eb", "312e81"),
    tag: ["data science", "ai", "python", "ai tutor"],
    category: dataScience._id,
    courseContent: [demoSection._id],
    studentsEnroled: [student._id],
    instructions: ["Use only the uploaded course document as evidence."],
    status: "Published",
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
  });
  const courseTwo = await Course.create({
    courseName: "Course Isolation Demo",
    courseDescription: "Separate course for verifying retrieval isolation",
    whatYouWillLearn: "Course-scoped retrieval keeps documents isolated.",
    instructor: instructor._id,
    price: 0,
    thumbnail: demoThumbnail("Course Isolation", "334155", "0f172a"),
    tag: ["demo", "isolation"],
    category: webDevelopment._id,
    studentsEnroled: [],
    instructions: ["Keep this course separate from the first demo course."],
    status: "Published",
    createdAt: new Date("2025-09-15T00:00:00.000Z"),
  });

  const additionalCourses = await Course.create([
    {
      courseName: "Practical Machine Learning",
      courseDescription:
        "Build interpretable machine-learning workflows with Python, features, and evaluation.",
      whatYouWillLearn: "Train and evaluate practical classification models.",
      instructor: instructor._id,
      price: 1499,
      thumbnail: demoThumbnail("Machine Learning", "7c3aed", "1d4ed8"),
      tag: ["data science", "python", "machine learning"],
      category: dataScience._id,
      studentsEnroled: [reviewerOne._id, reviewerTwo._id],
      instructions: ["Basic Python familiarity is useful."],
      status: "Published",
      createdAt: new Date("2026-05-20T00:00:00.000Z"),
    },
    {
      courseName: "Python for Data Analysis",
      courseDescription:
        "Clean, explore, and summarize datasets with Python and reproducible notebooks.",
      whatYouWillLearn: "Use Python for practical exploratory data analysis.",
      instructor: instructor._id,
      price: 999,
      thumbnail: demoThumbnail("Python Data Analysis", "0f766e", "155e75"),
      tag: ["data science", "python", "analytics"],
      category: dataScience._id,
      studentsEnroled: [reviewerOne._id],
      instructions: ["No prior data-analysis experience required."],
      status: "Published",
      createdAt: new Date("2026-04-02T00:00:00.000Z"),
    },
    {
      courseName: "SQL Analytics Fundamentals",
      courseDescription:
        "Query relational datasets and communicate reliable business insights with SQL.",
      whatYouWillLearn: "Write joins, aggregations, and analytical queries.",
      instructor: instructor._id,
      price: 799,
      thumbnail: demoThumbnail("SQL Analytics", "0369a1", "164e63"),
      tag: ["data science", "sql", "analytics"],
      category: dataScience._id,
      studentsEnroled: [reviewerOne._id, reviewerTwo._id],
      instructions: ["A laptop with a SQL client is recommended."],
      status: "Published",
      createdAt: new Date("2026-03-12T00:00:00.000Z"),
    },
    {
      courseName: "Modern React Interfaces",
      courseDescription: "Build accessible component-based frontend applications with React.",
      whatYouWillLearn: "Compose responsive interfaces and manage client state.",
      instructor: instructor._id,
      price: 1299,
      thumbnail: demoThumbnail("Modern React", "0891b2", "4338ca"),
      tag: ["react", "javascript", "frontend"],
      category: webDevelopment._id,
      studentsEnroled: [reviewerOne._id, reviewerTwo._id],
      instructions: ["JavaScript fundamentals are required."],
      status: "Published",
      createdAt: new Date("2026-06-15T00:00:00.000Z"),
    },
    {
      courseName: "UX Research Essentials",
      courseDescription: "Plan interviews, synthesize evidence, and validate product decisions.",
      whatYouWillLearn: "Run a focused user-research study.",
      instructor: instructor._id,
      price: 899,
      thumbnail: demoThumbnail("UX Research", "be185d", "7e22ce"),
      tag: ["ux", "research", "product design"],
      category: productDesign._id,
      studentsEnroled: [reviewerTwo._id],
      instructions: ["Bring a product question to investigate."],
      status: "Published",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    },
    {
      courseName: "Digital Marketing Foundations",
      courseDescription: "Plan measurable campaigns across content and acquisition channels.",
      whatYouWillLearn: "Define audiences, channels, and campaign objectives.",
      instructor: instructor._id,
      price: 699,
      thumbnail: demoThumbnail("Digital Marketing", "c2410c", "a21caf"),
      tag: ["marketing", "strategy", "business"],
      category: business._id,
      studentsEnroled: [],
      instructions: ["No marketing experience required."],
      status: "Published",
      createdAt: new Date("2026-02-18T00:00:00.000Z"),
    },
  ]);

  const [machineLearning, pythonData, sqlAnalytics, modernReact, uxResearch] =
    additionalCourses;

  const reviews = await RatingAndReview.create([
    {
      user: reviewerOne._id,
      course: machineLearning._id,
      rating: 5,
      review: "Clear development-only demo review.",
    },
    {
      user: reviewerTwo._id,
      course: machineLearning._id,
      rating: 4,
      review: "Useful development-only demo examples.",
    },
    {
      user: reviewerOne._id,
      course: pythonData._id,
      rating: 5,
      review: "Practical development-only demo exercises.",
    },
    {
      user: reviewerTwo._id,
      course: sqlAnalytics._id,
      rating: 5,
      review: "Focused development-only demo curriculum.",
    },
    {
      user: reviewerOne._id,
      course: modernReact._id,
      rating: 4,
      review: "Solid development-only demo course.",
    },
    {
      user: reviewerTwo._id,
      course: uxResearch._id,
      rating: 4,
      review: "Helpful development-only demo framework.",
    },
  ]);

  machineLearning.ratingAndReviews = [reviews[0]._id, reviews[1]._id];
  pythonData.ratingAndReviews = [reviews[2]._id];
  sqlAnalytics.ratingAndReviews = [reviews[3]._id];
  modernReact.ratingAndReviews = [reviews[4]._id];
  uxResearch.ratingAndReviews = [reviews[5]._id];
  await Promise.all([
    machineLearning.save(),
    pythonData.save(),
    sqlAnalytics.save(),
    modernReact.save(),
    uxResearch.save(),
  ]);

  await CourseProgress.create({
    courseID: courseOne._id,
    userId: student._id,
    completedVideos: [demoLessons[0]._id],
  });

  const allCourses = [courseOne, courseTwo, ...additionalCourses];
  instructor.courses = allCourses.map((course) => course._id);
  student.courses = [courseOne._id];
  outsider.courses = [];
  reviewerOne.courses = [
    machineLearning._id,
    pythonData._id,
    modernReact._id,
  ];
  reviewerTwo.courses = [
    machineLearning._id,
    sqlAnalytics._id,
    modernReact._id,
    uxResearch._id,
  ];
  for (const category of categories) {
    category.courses = allCourses
      .filter((course) => String(course.category) === String(category._id))
      .map((course) => course._id);
  }
  await Promise.all([
    instructor.save(),
    student.save(),
    outsider.save(),
    reviewerOne.save(),
    reviewerTwo.save(),
    ...categories.map((category) => category.save()),
  ]);

  console.log("");
  console.log("Development-only demo credentials");
  for (const demoUser of DEMO_USERS) {
    console.log(`${demoUser.email} / ${DEMO_PASSWORD}`);
  }
  console.log(`EduNest AI Demo Course ID: ${courseOne._id}`);
  console.log(`Course Isolation Demo ID: ${courseTwo._id}`);
  console.log(`Recommendation catalog courses: ${allCourses.length}`);
}

async function startDemo() {
  let mongod;
  let server;
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Development demo seeding is disabled in production");
    }

    process.env.NODE_ENV = "development";
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URL = mongod.getUri();
    process.env.JWT_SECRET = "edunest-development-demo-secret";
    process.env.PORT = process.env.DEMO_API_PORT || "4000";

    await createSamplePdf();

    const { startServer } = require("./index.js");
    server = await startServer();
    await seedDemoData();

    const shutdown = async () => {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
      await mongoose.disconnect();
      await mongod.stop();
      process.exit(0);
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Demo startup failed:", error.message);
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect().catch(() => undefined);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

startDemo();
