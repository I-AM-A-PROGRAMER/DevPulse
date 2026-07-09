import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/devpulse";

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas / Local
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Schema definition
const DeveloperSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "Developer Intern" },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format" },
  joinDate: { type: String, default: "" },
  streak: { type: Number, default: 0 },
  commits: { type: Number, default: 0 },
  prs: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  coursesCompleted: { type: Number, default: 0 },
  totalCourses: { type: Number, default: 10 },
  skills: [{
    name: String,
    level: Number
  }],
  recentActivity: { type: String, default: "Joined DevPulse!" },
  bio: { type: String, default: "# add a bio in profile settings" },
  topLanguage: { type: String, default: "JavaScript" },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  repos: { type: Number, default: 0 },
  checkIns: [String],
  todos: [{
    id: Number,
    text: String,
    done: Boolean
  }]
});

const Developer = mongoose.model("Developer", DeveloperSchema);

// Initial mock data to seed if DB is empty
const INITIAL_DEVS = [
  {
    id: 1,
    name: "SUPRIYO",
    username: "I-AM-A-PROGRAMER",
    email: "supriyo3606@gmail.com",
    role: "Full-Stack Intern",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
    joinDate: "Jan 2025",
    streak: 1,
    commits: 39,
    prs: 5,
    reviews: 3,
    coursesCompleted: 3,
    totalCourses: 10,
    skills: [],
    recentActivity: "PUSH I-AM-A-PROGRAMER/USC-Codesprint-3",
    bio: "# add a bio in profile settings",
    topLanguage: "React",
    followers: 1,
    following: 3,
    repos: 12,
    checkIns: [new Date().toISOString().split('T')[0]],
    todos: []
  },
  {
    id: 2, name: "Arjun Sharma", username: "arjun-dev", email: "arjun@devpulse.io",
    role: "Full-Stack Intern", joinDate: "Jan 2025", streak: 14, commits: 247, prs: 18, reviews: 9,
    coursesCompleted: 7, totalCourses: 12, topLanguage: "TypeScript", bio: "Building the future, one commit at a time. Obsessed with clean APIs and great UX.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
    recentActivity: "feat: skill progress visualization",
    skills: [{ name:"React",level:72},{ name:"TypeScript",level:65},{ name:"Node.js",level:58},{ name:"Git",level:88}],
    followers: 4, following: 8, repos: 18,
    checkIns: [],
    todos: [
      { id: 1, text: "Implement skill progress UI", done: true },
      { id: 2, text: "Fix responsive navbar breakpoints", done: true },
      { id: 3, text: "Connect GitHub feed integration", done: false }
    ]
  },
  {
    id: 3, name: "Priya Nair", username: "priya-n", email: "priya@devpulse.io",
    role: "Frontend Intern", joinDate: "Feb 2025", streak: 21, commits: 312, prs: 24, reviews: 15,
    coursesCompleted: 10, totalCourses: 12, topLanguage: "React", bio: "Pixel-perfect interfaces are my thing. I love accessibility and motion design.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    recentActivity: "fix: responsive nav breakpoints",
    skills: [{ name:"React",level:91},{ name:"CSS",level:88},{ name:"TypeScript",level:74},{ name:"Figma",level:80}],
    followers: 12, following: 5, repos: 22,
    checkIns: [],
    todos: [
      { id: 1, text: "Refactor grid system to CSS Grid", done: true },
      { id: 2, text: "Polish landing page animations", done: false }
    ]
  },
  {
    id: 4, name: "Marcus Chen", username: "mchen-code", email: "marcus@devpulse.io",
    role: "Backend Intern", joinDate: "Jan 2025", streak: 9, commits: 189, prs: 12, reviews: 22,
    coursesCompleted: 8, totalCourses: 12, topLanguage: "Python", bio: "Data pipelines, APIs, and distributed systems. I make the backend invisible.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format",
    recentActivity: "refactor: auth middleware cleanup",
    skills: [{ name:"Python",level:85},{ name:"PostgreSQL",level:78},{ name:"Docker",level:62},{ name:"FastAPI",level:70}],
    followers: 6, following: 2, repos: 15,
    checkIns: [],
    todos: []
  },
  {
    id: 5, name: "Sofia Reyes", username: "sofiareyes", email: "sofia@devpulse.io",
    role: "DevOps Intern", joinDate: "Mar 2025", streak: 17, commits: 143, prs: 9, reviews: 11,
    coursesCompleted: 6, totalCourses: 12, topLanguage: "Bash", bio: "CI/CD enthusiast. I bridge the gap between dev and production.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format",
    recentActivity: "chore: update GitHub Actions workflow",
    skills: [{ name:"Docker",level:82},{ name:"Kubernetes",level:55},{ name:"Terraform",level:48},{ name:"Linux",level:76}],
    followers: 3, following: 10, repos: 9,
    checkIns: [],
    todos: []
  },
  {
    id: 6, name: "Karan Mehta", username: "karan-m", email: "karan@devpulse.io",
    role: "Full-Stack Intern", joinDate: "Jan 2025", streak: 30, commits: 401, prs: 31, reviews: 18,
    coursesCompleted: 11, totalCourses: 12, topLanguage: "Go", bio: "High throughput, low latency. I write Go in my sleep.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format",
    recentActivity: "perf: optimize DB query latency 40%",
    skills: [{ name:"Go",level:88},{ name:"React",level:71},{ name:"PostgreSQL",level:82},{ name:"Redis",level:65}],
    followers: 8, following: 9, repos: 29,
    checkIns: [],
    todos: []
  }
];

async function seedDatabase() {
  try {
    const count = await Developer.countDocuments();
    if (count === 0) {
      console.log("Database is empty. Seeding initial developer profiles...");
      await Developer.insertMany(INITIAL_DEVS);
      console.log("Database seeded successfully!");
    } else {
      console.log(`Database already has ${count} records. Skipping seeding.`);
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

// 1. Get all developers
app.get("/api/developers", async (req, res) => {
  try {
    const devs = await Developer.find({}).sort({ id: 1 });
    res.json(devs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create new developer
app.post("/api/developers", async (req, res) => {
  try {
    const newDevData = req.body;
    
    // Ensure unique numeric ID if not provided
    if (!newDevData.id) {
      const lastDev = await Developer.findOne({}).sort({ id: -1 });
      newDevData.id = lastDev ? lastDev.id + 1 : 1;
    }

    const developer = new Developer(newDevData);
    await developer.save();
    res.status(201).json(developer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Update developer profile
app.put("/api/developers/:id", async (req, res) => {
  try {
    const devId = Number(req.params.id);
    const updatedData = req.body;

    const developer = await Developer.findOneAndUpdate(
      { id: devId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!developer) {
      return res.status(404).json({ error: "Developer not found" });
    }

    res.json(developer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Delete developer profile (Optional)
app.delete("/api/developers/:id", async (req, res) => {
  try {
    const devId = Number(req.params.id);
    const developer = await Developer.findOneAndDelete({ id: devId });

    if (!developer) {
      return res.status(404).json({ error: "Developer not found" });
    }

    res.json({ message: "Developer profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
