import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
  password: { type: String, default: "" }, // hashed password (optional for Google Auth)
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
    const salt = await bcrypt.genSalt(10);
    const hashedDefaultPassword = await bcrypt.hash("password123", salt);

    if (count === 0) {
      console.log("Database is empty. Seeding initial developer profiles...");
      const devsToSeed = INITIAL_DEVS.map(dev => ({
        ...dev,
        password: hashedDefaultPassword
      }));
      await Developer.insertMany(devsToSeed);
      console.log("Database seeded successfully!");
    } else {
      console.log(`Database already has ${count} records. Skipping seeding.`);
      // Run migration to add default password for existing seeded profiles if missing
      const updateResult = await Developer.updateMany(
        { $or: [{ password: "" }, { password: { $exists: false } }] },
        { $set: { password: hashedDefaultPassword } }
      );
      if (updateResult.modifiedCount > 0) {
        console.log(`Migration: Updated ${updateResult.modifiedCount} profiles with default passwords.`);
      }
    }
  } catch (err) {
    console.error("Error seeding/migrating database:", err);
  }
}

// ─── JWT Authentication Middleware ─────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "default_devpulse_jwt_secret";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access token is invalid or expired" });
    }
    req.user = user;
    next();
  });
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

// 1. Authentication Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, name, username, password } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Name and Email are required." });
    }

    const existingUser = await Developer.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const lastDev = await Developer.findOne({}).sort({ id: -1 });
    const id = lastDev ? lastDev.id + 1 : 1;

    let hashedPassword = "";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newDev = new Developer({
      id,
      name,
      email: email.toLowerCase(),
      username: username || name.toLowerCase().replace(/\s+/g, '-'),
      password: hashedPassword,
      role: "Developer Intern",
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      streak: 1,
      commits: 0,
      prs: 0,
      reviews: 0,
      coursesCompleted: 0,
      totalCourses: 10,
      skills: [],
      recentActivity: `Joined DevPulse dashboard!`,
      bio: "# add a bio in profile settings",
      topLanguage: "JavaScript",
      followers: 0,
      following: 0,
      repos: 0,
      checkIns: [new Date().toISOString().split('T')[0]],
      todos: []
    });

    await newDev.save();

    const token = jwt.sign({ id: newDev.id, email: newDev.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, developer: newDev });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const developer = await Developer.findOne({ email: email.toLowerCase() });
    if (!developer) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    if (!developer.password) {
      return res.status(400).json({ error: "Please log in using your Google account." });
    }

    const isMatch = await bcrypt.compare(password, developer.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ id: developer.id, email: developer.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, developer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    let developer = await Developer.findOne({ email: email.toLowerCase() });
    
    if (!developer) {
      // Auto-register
      const lastDev = await Developer.findOne({}).sort({ id: -1 });
      const id = lastDev ? lastDev.id + 1 : 1;

      developer = new Developer({
        id,
        name,
        email: email.toLowerCase(),
        avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
        username: "", // empty username triggers forced Edit Profile Modal
        role: "Developer Intern",
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        streak: 1,
        commits: 0,
        prs: 0,
        reviews: 0,
        coursesCompleted: 0,
        totalCourses: 10,
        skills: [],
        recentActivity: `Joined DevPulse via Google Auth!`,
        bio: "# add a bio in profile settings",
        topLanguage: "JavaScript",
        followers: 0,
        following: 0,
        repos: 0,
        checkIns: [new Date().toISOString().split('T')[0]],
        todos: []
      });
      await developer.save();
    }

    const token = jwt.sign({ id: developer.id, email: developer.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, developer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all developers
app.get("/api/developers", async (req, res) => {
  try {
    const devs = await Developer.find({}).sort({ id: 1 });
    res.json(devs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create new developer (Used for Firebase Google Auto-Register)
app.post("/api/developers", async (req, res) => {
  try {
    const newDevData = req.body;
    
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

// 4. Update developer profile (Protected: User can only update their own profile)
app.put("/api/developers/:id", authenticateToken, async (req, res) => {
  try {
    const devId = Number(req.params.id);
    if (req.user.id !== devId) {
      return res.status(403).json({ error: "You are not authorized to update this profile." });
    }

    const updatedData = req.body;
    delete updatedData.password; // Do not allow password modification through profile updates

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

// 5. Delete developer profile (Optional, Protected)
app.delete("/api/developers/:id", authenticateToken, async (req, res) => {
  try {
    const devId = Number(req.params.id);
    if (req.user.id !== devId) {
      return res.status(403).json({ error: "You are not authorized to delete this profile." });
    }

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
