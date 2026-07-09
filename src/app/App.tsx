import { useState, useEffect, useMemo, CSSProperties, ReactNode } from "react";
import { auth, googleProvider, signInWithPopup, signOut } from "../firebase";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        "#09090b",
  bgAlt:     "#121212",
  card:      "#161618",
  cardHover: "#1f1f23",
  border:    "rgba(255,255,255,0.08)",
  borderHi:  "rgba(255,255,255,0.15)",
  primary:   "#06c8e8",
  primaryDim:"rgba(6,200,232,0.12)",
  violet:    "#7c3aed",
  violetDim: "rgba(124,58,237,0.15)",
  green:     "#10b981",
  greenDim:  "rgba(16,185,129,0.15)",
  amber:     "#f59e0b",
  amberDim:  "rgba(245,158,11,0.15)",
  red:       "#ef4444",
  text:      "#f4f4f5",
  textSub:   "#a1a1aa",
  textMuted: "#71717a",
  mono:      "'Geist Mono', monospace",
} as const;

const s = {
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 20,
    position: "relative",
  } as CSSProperties,
  mono: { fontFamily: C.mono } as CSSProperties,
  tag: (color: string): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: C.mono,
    background: `${color}18`,
    color: color,
    border: `1px solid ${color}28`,
  }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "login" | "register" | "dashboard";
type Tab  = "dashboard" | "github" | "leaderboard";

interface GithubContributor {
  login: string;
  id: number;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface Skill {
  name: string;
  level: number;
}

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface Developer {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  avatar: string;
  joinDate: string;
  streak: number;
  commits: number;
  prs: number;
  reviews: number;
  coursesCompleted: number;
  totalCourses: number;
  skills: Skill[];
  recentActivity: string;
  bio: string;
  topLanguage: string;
  followers: number;
  following: number;
  repos: number;
  checkIns: string[]; // YYYY-MM-DD strings
  todos: Todo[];
}

// ─── Ranking logic ────────────────────────────────────────────────────────────
// Score = (commits × 2) + (PRs × 5) + (reviews × 3) +
//         (streak × 4) + (avgSkill × 1.5) + (coursesCompleted × 10)
function calcScore(d: Developer): number {
  const avgSkill = d.skills && d.skills.length > 0 
    ? d.skills.reduce((a, b) => a + b.level, 0) / d.skills.length 
    : 0;
  return Math.round(
    d.commits * 2 +
    d.prs * 5 +
    d.reviews * 3 +
    d.streak * 4 +
    avgSkill * 1.5 +
    d.coursesCompleted * 10
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_DEVS: Developer[] = [
  {
    id: 1,
    name: "SUPRIYO",
    username: "GT-AM-A-PROGRAMMER",
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
    recentActivity: "PUSH GT-AM-A-PROGRAMMER/USC-Codesprint-3",
    bio: "# add a bio in profile settings",
    topLanguage: "React",
    followers: 1,
    following: 3,
    repos: 12,
    checkIns: [new Date().toISOString().split('T')[0]], // checked in today
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
  },
  {
    id: 7, name: "Aisha Okonkwo", username: "aisha-ok", email: "aisha@devpulse.io",
    role: "ML Intern", joinDate: "Feb 2025", streak: 12, commits: 178, prs: 8, reviews: 6,
    coursesCompleted: 9, totalCourses: 12, topLanguage: "Python", bio: "Training models and chasing accuracy. NLP is my current obsession.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format",
    recentActivity: "add: sentiment analysis pipeline",
    skills: [{ name:"Python",level:90},{ name:"PyTorch",level:72},{ name:"SQL",level:65},{ name:"Jupyter",level:85}],
    followers: 14, following: 15, repos: 11,
    checkIns: [],
    todos: []
  },
  {
    id: 8, name: "Dev Patel", username: "dev-patel", email: "dev@devpulse.io",
    role: "Frontend Intern", joinDate: "Mar 2025", streak: 5, commits: 98, prs: 6, reviews: 4,
    coursesCompleted: 4, totalCourses: 12, topLanguage: "Vue.js", bio: "Fresh grad, learning fast. Excited about web components and the platform.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
    recentActivity: "add: tooltip component",
    skills: [{ name:"Vue.js",level:52},{ name:"JavaScript",level:60},{ name:"CSS",level:55},{ name:"Git",level:48}],
    followers: 1, following: 4, repos: 6,
    checkIns: [],
    todos: []
  },
  {
    id: 9, name: "Yuki Tanaka", username: "yuki-t", email: "yuki@devpulse.io",
    role: "Backend Intern", joinDate: "Feb 2025", streak: 19, commits: 268, prs: 20, reviews: 13,
    coursesCompleted: 9, totalCourses: 12, topLanguage: "Rust", bio: "Memory safety advocate. Rewriting everything in Rust (with permission).",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format",
    recentActivity: "feat: WASM build pipeline integration",
    skills: [{ name:"Rust",level:78},{ name:"C++",level:65},{ name:"Linux",level:80},{ name:"Postgres",level:60}],
    followers: 7, following: 6, repos: 21,
    checkIns: [],
    todos: []
  },
];

// Helper to generate last 30 days
const getLast30Days = () => {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40 }: { src: string; name: string; size?: number }) {
  return (
    <img
      src={src}
      alt={name}
      style={{
        width: size, height: size,
        borderRadius: size * 0.25,
        objectFit: "cover",
        border: `1px solid ${C.border}`,
        flexShrink: 0,
        background: C.bgAlt,
      }}
    />
  );
}

function Pill({ children, color = C.primary }: { children: ReactNode; color?: string }) {
  return <span style={s.tag(color)}>{children}</span>;
}

// ─── SVG icons (minimal inline) ──────────────────────────────────────────────
const Icon = {
  Zap: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Mail: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  Github: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Bell: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  Settings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Star: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Flame: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Git: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/>
    </svg>
  ),
  PR: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  ),
  Review: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Book: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Circle: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  Trend: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  External: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>
  ),
  Medal1: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>
    </svg>
  ),
  Google: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  Grid: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Pencil: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

// ─── Input Field ──────────────────────────────────────────────────────────────
function InputField({
  label, type = "text", placeholder, value, onChange, icon, right,
}: {
  label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  icon?: ReactNode; right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: C.mono }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && (
          <span style={{ position: "absolute", left: 12, color: C.textMuted, display: "flex" }}>{icon}</span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            background: "#161618",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: `10px ${right ? "40px" : "12px"} 10px ${icon ? "38px" : "12px"}`,
            fontSize: 13,
            color: C.text,
            outline: "none",
            transition: "border-color 0.15s",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${C.primary}60`)}
          onBlur={(e)  => (e.target.style.borderColor = C.border)}
        />
        {right && (
          <span style={{ position: "absolute", right: 12, color: C.textMuted, display: "flex", cursor: "pointer" }}>{right}</span>
        )}
      </div>
    </div>
  );
}

// ─── Score breakdown tooltip ──────────────────────────────────────────────────
function ScoreBreakdown({ dev }: { dev: Developer }) {
  const avgSkill = dev.skills && dev.skills.length > 0
    ? dev.skills.reduce((a, b) => a + b.level, 0) / dev.skills.length
    : 0;
  const rows = [
    { label: "Commits", formula: `${dev.commits} × 2`, value: dev.commits * 2, color: C.primary },
    { label: "Pull requests", formula: `${dev.prs} × 5`, value: dev.prs * 5, color: C.violet },
    { label: "Code reviews", formula: `${dev.reviews} × 3`, value: dev.reviews * 3, color: C.green },
    { label: "Streak days", formula: `${dev.streak} × 4`, value: dev.streak * 4, color: C.amber },
    { label: "Avg skill level", formula: `${avgSkill.toFixed(0)} × 1.5`, value: Math.round(avgSkill * 1.5), color: "#a78bfa" },
    { label: "Courses done", formula: `${dev.coursesCompleted} × 10`, value: dev.coursesCompleted * 10, color: "#34d399" },
  ];
  return (
    <div style={{
      background: "#121212",
      border: `1px solid ${C.borderHi}`,
      borderRadius: 12, padding: "12px 14px",
      minWidth: 220,
    }}>
      <p style={{ fontSize: 10, fontFamily: C.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        Score breakdown
      </p>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <div>
            <span style={{ fontSize: 11, color: C.textSub }}>{r.label} </span>
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>({r.formula})</span>
          </div>
          <span style={{ fontSize: 12, fontFamily: C.mono, color: r.color, fontWeight: 600 }}>+{r.value}</span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Total</span>
        <span style={{ fontSize: 13, fontFamily: C.mono, color: C.primary, fontWeight: 700 }}>{calcScore(dev)}</span>
      </div>
    </div>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const configs: Record<number, { bg: string; color: string; label: string }> = {
    1: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "🥇" },
    2: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", label: "🥈" },
  };
  const labelText = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  const colorText = rank === 1 ? "#f59e0b" : rank === 2 ? "#94a3b8" : rank === 3 ? "#cd7f32" : C.textMuted;
  const bgText = rank === 1 ? "rgba(245,158,11,0.15)" : rank === 2 ? "rgba(148,163,184,0.15)" : rank === 3 ? "rgba(205,127,50,0.15)" : "rgba(255,255,255,0.04)";

  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: bgText, color: colorText,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: rank <= 3 ? 16 : 12,
      fontWeight: 700, fontFamily: C.mono,
      flexShrink: 0,
    }}>
      {labelText}
    </div>
  );
}

// ─── Mock Events ──────────────────────────────────────────────────────────────
const EVENTS_POOL = [
  { id: 1, type: "push", repo: "GT-AM-A-PROGRAMMER/USC-Codesprint-3", msg: "PUSH GT-AM-A-PROGRAMMER/USC-Codesprint-3", detail: "------ pushed", time: "2h ago", branch: "main", commits: 2 },
  { id: 2, type: "push", repo: "GT-AM-A-PROGRAMMER/USC-Codesprint-3", msg: "PUSH GT-AM-A-PROGRAMMER/USC-Codesprint-3", detail: "------ pushed", time: "1d ago", branch: "main", commits: 1 },
  { id: 3, type: "pr", repo: "GT-AM-A-PROGRAMMER/USC-Codesprint-3", msg: "PR MERGED: GT-AM-A-PROGRAMMER/USC-Codesprint-3", detail: "------ merged", time: "3d ago", branch: "feature/auth", status: "merged" },
  { id: 4, type: "push", repo: "arjun-dev/devpulse-ui", msg: "feat: add skill progress visualization", detail: "------ pushed", time: "2h ago", branch: "feature/skill-cards", commits: 3 },
  { id: 5, type: "pr", repo: "internship-org/platform", msg: "fix: auth token refresh race condition", detail: "------ merged", time: "5h ago", branch: "fix/auth-refresh", status: "merged" },
  { id: 6, type: "star", repo: "vercel/next.js", msg: "Starred repository: vercel/next.js", detail: "------ starred", time: "1d ago", branch: "" },
  { id: 7, type: "push", repo: "arjun-dev/algo-practice", msg: "add: binary search tree implementation", detail: "------ pushed", time: "1d ago", branch: "main", commits: 1 },
  { id: 8, type: "review", repo: "internship-org/platform", msg: "Reviewed PR: update user profile schema", detail: "------ approved", time: "2d ago", branch: "", status: "approved" },
  { id: 9, type: "fork", repo: "shadcn-ui/ui", msg: "Forked repository: shadcn-ui/ui", detail: "------ forked", time: "3d ago", branch: "" },
];

const REPOS_LIST = [
  { name: "usc-codesprint-3", stars: 4, forks: 1, openPRs: 0, lang: "TypeScript" },
  { name: "devpulse", stars: 12, forks: 3, openPRs: 1, lang: "TypeScript" },
  { name: "algo-practice", stars: 1, forks: 0, openPRs: 0, lang: "Python" },
  { name: "web-starter", stars: 8, forks: 2, openPRs: 1, lang: "JavaScript" },
];

// ─── Root Application ─────────────────────────────────────────────────────────
export default function App() {
  // Load developers from localStorage, or initialize with mock data
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    const saved = localStorage.getItem("devpulse_developers");
    return saved ? JSON.parse(saved) : INITIAL_DEVS;
  });

  // Current logged in user (id)
  const [currentUserId, setCurrentUserId] = useState<number>(() => {
    const saved = localStorage.getItem("devpulse_current_user_id");
    return saved ? Number(saved) : 1;
  });

  // Viewing developer on the dashboard (can be different from current user)
  const [viewingDeveloperId, setViewingDeveloperId] = useState<number>(() => {
    return currentUserId;
  });

  // Page navigation state
  const [page, setPage] = useState<Page>("login");
  // Sub-tabs on Dashboard
  const [tab, setTab] = useState<Tab>("dashboard");

  // State to hold forms and modals
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [contributors, setContributors] = useState<GithubContributor[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerGithub, setRegisterGithub] = useState("");
  const [registerPass, setRegisterPass] = useState("");
  const [registerConf, setRegisterConf] = useState("");

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editGithub, setEditGithub] = useState("");

  // Persist developers list in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("devpulse_developers", JSON.stringify(developers));
  }, [developers]);

  // Persist current logged in user in localStorage
  useEffect(() => {
    localStorage.setItem("devpulse_current_user_id", String(currentUserId));
  }, [currentUserId]);

  // Fetch contributors from GitHub API when leaderboard tab is active
  useEffect(() => {
    if (tab === "leaderboard") {
      setLoadingLeaderboard(true);
      setLeaderboardError(null);
      fetch("https://api.github.com/repos/I-AM-A-PROGRAMER/DevPulse/contributors")
        .then(res => {
          if (!res.ok) {
            throw new Error("Failed to fetch contributors from GitHub API");
          }
          return res.json();
        })
        .then(data => {
          const sorted = data.sort((a: any, b: any) => b.contributions - a.contributions);
          setContributors(sorted);
          setLoadingLeaderboard(false);
        })
        .catch(err => {
          console.error(err);
          setLeaderboardError(err.message || "Failed to load leaderboard");
          setLoadingLeaderboard(false);
        });
    }
  }, [tab]);

  // Resolve current active developer instances
  const currentUser = useMemo(() => {
    return developers.find(d => d.id === currentUserId) || developers[0];
  }, [developers, currentUserId]);

  const viewingDeveloper = useMemo(() => {
    return developers.find(d => d.id === viewingDeveloperId) || currentUser;
  }, [developers, viewingDeveloperId, currentUser]);

  // Helper check for read-only view
  const isReadOnly = viewingDeveloper.id !== currentUser.id;

  // Handle checking in (streaks)
  const handleCheckIn = () => {
    if (isReadOnly) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    if (viewingDeveloper.checkIns.includes(todayStr)) return;

    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        const newCheckIns = [...dev.checkIns, todayStr];
        
        // Calculate new streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = dev.streak;
        if (dev.checkIns.includes(yesterdayStr) || dev.streak === 0) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        return {
          ...dev,
          streak: newStreak,
          commits: dev.commits + 1, // gamification commit + 1
          checkIns: newCheckIns,
          recentActivity: `streak.start() - Checked in for day ${newStreak}`
        };
      }
      return dev;
    }));
  };

  // Add new skill
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newSkillName.trim()) return;

    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        // If skill already exists, overwrite. Otherwise add new.
        const existingIdx = dev.skills.findIndex(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
        let updatedSkills = [...dev.skills];
        if (existingIdx >= 0) {
          updatedSkills[existingIdx] = { name: newSkillName.trim(), level: newSkillLevel };
        } else {
          updatedSkills.push({ name: newSkillName.trim(), level: newSkillLevel });
        }
        return {
          ...dev,
          skills: updatedSkills
        };
      }
      return dev;
    }));

    setNewSkillName("");
    setNewSkillLevel(50);
    setShowSkillModal(false);
  };

  // Delete skill
  const handleDeleteSkill = (skillName: string) => {
    if (isReadOnly) return;
    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        return {
          ...dev,
          skills: dev.skills.filter(s => s.name !== skillName)
        };
      }
      return dev;
    }));
  };

  // Add new goal/todo
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newGoalText.trim()) return;

    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        const newGoal = {
          id: Date.now(),
          text: newGoalText.trim(),
          done: false
        };
        return {
          ...dev,
          todos: [...dev.todos, newGoal]
        };
      }
      return dev;
    }));

    setNewGoalText("");
    setShowGoalModal(false);
  };

  // Toggle goal/todo completion
  const handleToggleGoal = (goalId: number) => {
    if (isReadOnly) return;
    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        const updatedTodos = dev.todos.map(t => {
          if (t.id === goalId) {
            return { ...t, done: !t.done };
          }
          return t;
        });

        // Trigger course count updates optionally
        const doneCount = updatedTodos.filter(t => t.done).length;

        return {
          ...dev,
          todos: updatedTodos,
          coursesCompleted: doneCount <= dev.totalCourses ? doneCount : dev.coursesCompleted
        };
      }
      return dev;
    }));
  };

  // Delete goal/todo
  const handleDeleteGoal = (goalId: number) => {
    if (isReadOnly) return;
    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        return {
          ...dev,
          todos: dev.todos.filter(t => t.id !== goalId)
        };
      }
      return dev;
    }));
  };

  // Handle edit profile modal open & save
  const handleOpenEditProfile = () => {
    if (isReadOnly) return;
    setEditName(currentUser.name);
    setEditBio(currentUser.bio);
    setEditRole(currentUser.role);
    setEditGithub(currentUser.username);
    setShowProfileModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setDevelopers(prev => prev.map(dev => {
      if (dev.id === currentUser.id) {
        return {
          ...dev,
          name: editName.trim() || dev.name,
          bio: editBio.trim() || dev.bio,
          role: editRole.trim() || dev.role,
          username: editGithub.trim() || dev.username
        };
      }
      return dev;
    }));

    setShowProfileModal(false);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const email = loginEmail.trim();
    if (!email) return;

    // Search for existing dev
    const matched = developers.find(d => d.email.toLowerCase() === email.toLowerCase());

    if (matched) {
      setCurrentUserId(matched.id);
      setViewingDeveloperId(matched.id);
      setPage("dashboard");
      setTab("dashboard");
      setLoginEmail("");
      setLoginPass("");
    } else {
      setLoginError("Account does not exist. Please register first.");
    }
  };

  // Register handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = registerEmail.trim();
    const name = registerName.trim();
    const github = registerGithub.trim();
    if (!email || !name) return;

    // Create new profile
    const newDev: Developer = {
      id: Date.now(),
      name: name,
      username: github || name.toLowerCase().replace(/\s+/g, '-'),
      email: email,
      role: "Developer Intern",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
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
    };

    setDevelopers(prev => [...prev, newDev]);
    setCurrentUserId(newDev.id);
    setViewingDeveloperId(newDev.id);
    setPage("dashboard");
    setTab("dashboard");

    setRegisterEmail("");
    setRegisterName("");
    setRegisterGithub("");
    setRegisterPass("");
    setRegisterConf("");
  };

  // Google Login / Signup via Firebase
  const handleGoogleAuth = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email) {
        setLoginError("Google login failed. No user email returned.");
        return;
      }
      
      const email = user.email.toLowerCase();
      const matched = developers.find(d => d.email.toLowerCase() === email);

      if (matched) {
        setCurrentUserId(matched.id);
        setViewingDeveloperId(matched.id);
        setPage("dashboard");
        setTab("dashboard");
      } else {
        // Sign out since the account doesn't exist
        await signOut(auth);
        setLoginError(`Access denied. Google account (${user.email}) is not registered.`);
      }
    } catch (err: any) {
      console.error("Firebase auth error:", err);
      setLoginError(err.message || "Failed to authenticate with Google.");
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase sign out error:", err);
    }
    setPage("login");
    setViewingDeveloperId(currentUserId);
  };

  // Activity events linked to viewing developer
  const devEvents = useMemo(() => {
    // If it's Supriyo, show some custom events or standard pool
    return EVENTS_POOL.filter(e => {
      if (viewingDeveloper.username === "GT-AM-A-PROGRAMMER") {
        return e.repo.includes("GT-AM-A-PROGRAMMER") || e.type === "star" || e.type === "fork";
      }
      return true; // show pool for others
    }).slice(0, 10);
  }, [viewingDeveloper]);

  // Leaderboard Sorting and Filtering State
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<"score" | "commits" | "streak" | "prs">("score");

  const sortedLeaderboard = useMemo(() => {
    const sorters: Record<string, (d: Developer) => number> = {
      score:   (d) => calcScore(d),
      commits: (d) => d.commits,
      streak:  (d) => d.streak,
      prs:     (d) => d.prs,
    };
    return [...developers].sort((a, b) => sorters[leaderboardSortBy](b) - sorters[leaderboardSortBy](a));
  }, [developers, leaderboardSortBy]);

  const filteredLeaderboard = useMemo(() => {
    const q = leaderboardSearch.toLowerCase();
    return sortedLeaderboard.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.role.toLowerCase().includes(q) ||
        d.topLanguage.toLowerCase().includes(q)
    );
  }, [sortedLeaderboard, leaderboardSearch]);

  const podium = useMemo(() => {
    const top3 = sortedLeaderboard.slice(0, 3);
    // Order: [2nd, 1st, 3rd]
    const ordered = [];
    if (top3[1]) ordered.push(top3[1]);
    if (top3[0]) ordered.push(top3[0]);
    if (top3[2]) ordered.push(top3[2]);
    return ordered;
  }, [sortedLeaderboard]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = viewingDeveloper.checkIns.includes(todayStr);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Figtree', sans-serif" }}>
      
      {/* ─── 1. LOGIN PAGE ─── */}
      {page === "login" && (
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "row", flexWrap: "wrap" }}>
          {/* Left Panel */}
          <div style={{
            flex: "1 1 48%",
            backgroundImage: `linear-gradient(rgba(8, 12, 24, 0.78), rgba(8, 12, 24, 0.88)), url('https://images.unsplash.com/photo-1542903660-eedba2cda473?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "500px",
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#080c18" }}>
                <Icon.Zap />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: C.mono, color: C.text }}>devpulse</span>
            </div>

            {/* Syntax Code block */}
            <div style={{ position: "relative", margin: "40px 0" }}>
              <h1 style={{ fontSize: "2.3rem", fontWeight: 800, lineHeight: 1.2, fontFamily: C.mono, color: C.text, wordBreak: "break-word" }}>
                <span style={{ color: C.violet }}>const</span> <span style={{ color: C.primary }}>you</span> = <span style={{ color: C.amber }}>"developer"</span>;
              </h1>
            </div>

            {/* Subtext and terminal lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, maxWidth: 380 }}>
                Track skills. Live GitHub feed. Real-time pulse of your craft.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: C.mono, fontSize: 12 }}>
                <div><span style={{ color: C.green }}>$</span> <span style={{ color: C.textMuted }}>measure_learning --daily</span></div>
                <div><span style={{ color: C.green }}>$</span> <span style={{ color: C.textMuted }}>sync_github --realtime</span></div>
                <div><span style={{ color: C.green }}>$</span> <span style={{ color: C.textMuted }}>streak.start()</span></div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: "1 1 52%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: C.bgAlt }}>
            <div style={{ width: "100%", maxWidth: 380 }}>
              {/* Card Container */}
              <div style={{ ...s.card, background: C.card, padding: "24px 28px" }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 28 }}>
                  <button onClick={() => setPage("login")} style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 600, color: C.primary, borderBottom: `2px solid ${C.primary}`, paddingBottom: 8 }}>
                    login.sh
                  </button>
                  <button onClick={() => setPage("register")} style={{ fontFamily: C.mono, fontSize: 13, color: C.textMuted, paddingBottom: 8 }}>
                    register.sh
                  </button>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: C.mono, marginBottom: 4, letterSpacing: "-0.5px" }}>welcome back</h2>
                <p style={{ fontSize: 12, color: C.textMuted, fontFamily: C.mono, marginBottom: 24 }}>enter your credentials to access devpulse</p>

                <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {loginError && (
                    <div style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: C.red,
                      fontSize: 12,
                      fontFamily: C.mono,
                      lineHeight: 1.4,
                    }}>
                      {loginError}
                    </div>
                  )}
                  <InputField
                    label="Email"
                    placeholder="you@devpulse.dev"
                    value={loginEmail}
                    onChange={setLoginEmail}
                    icon={<Icon.Mail />}
                  />
                  <InputField
                    label="Password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={setLoginPass}
                    icon={<Icon.Lock />}
                    right={<span onClick={() => setShowPass(!showPass)}>{showPass ? <Icon.EyeOff /> : <Icon.Eye />}</span>}
                  />

                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      background: "#5b8bf7",
                      color: "#080c18",
                      fontFamily: C.mono,
                      border: "none",
                      cursor: "pointer",
                      marginTop: 8,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    $ ./login
                  </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.mono }}>or</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <button
                  onClick={handleGoogleAuth}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    cursor: "pointer",
                    fontFamily: C.mono,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                >
                  <Icon.Google /> continue with google
                </button>

                <p style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: C.mono, marginTop: 24 }}>
                  new to devpulse?{" "}
                  <button onClick={() => setPage("register")} style={{ color: C.primary, fontWeight: 600, cursor: "pointer" }}>
                    create an account →
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. REGISTER PAGE ─── */}
      {page === "register" && (
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "row", flexWrap: "wrap" }}>
          {/* Left Panel */}
          <div style={{
            flex: "1 1 48%",
            backgroundImage: `linear-gradient(rgba(8, 12, 24, 0.78), rgba(8, 12, 24, 0.88)), url('https://images.unsplash.com/photo-1542903660-eedba2cda473?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "500px",
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#080c18" }}>
                <Icon.Zap />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: C.mono, color: C.text }}>devpulse</span>
            </div>

            {/* Syntax Code block for Register */}
            <div style={{ position: "relative", margin: "40px 0", fontFamily: C.mono, fontSize: "1.45rem", lineHeight: 1.5, wordBreak: "break-word" }}>
              <div style={{ color: C.violet }}>function <span style={{ color: C.primary }}>growth</span>() &#123;</div>
              <div style={{ paddingLeft: 24 }}><span style={{ color: C.green }}>return</span> <span style={{ color: C.amber }}>commits</span>;</div>
              <div style={{ color: C.violet }}>&#125;</div>
            </div>

            {/* Subtext */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, maxWidth: 380 }}>
                Join the dev who measure. Ship more, learn faster.
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: "1 1 52%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: C.bgAlt }}>
            <div style={{ width: "100%", maxWidth: 380 }}>
              {/* Card Container */}
              <div style={{ ...s.card, background: C.card, padding: "24px 28px" }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 28 }}>
                  <button onClick={() => setPage("login")} style={{ fontFamily: C.mono, fontSize: 13, color: C.textMuted, paddingBottom: 8 }}>
                    login.sh
                  </button>
                  <button onClick={() => setPage("register")} style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 600, color: C.primary, borderBottom: `2px solid ${C.primary}`, paddingBottom: 8 }}>
                    register.sh
                  </button>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: C.mono, marginBottom: 4, letterSpacing: "-0.5px" }}>create account</h2>
                <p style={{ fontSize: 12, color: C.textMuted, fontFamily: C.mono, marginBottom: 24 }}>init your devpulse profile in seconds</p>

                <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <InputField
                    label="Display Name"
                    placeholder="Ada Lovelace"
                    value={registerName}
                    onChange={setRegisterName}
                    icon={<Icon.User />}
                  />
                  <InputField
                    label="Email"
                    placeholder="you@devpulse.dev"
                    value={registerEmail}
                    onChange={setRegisterEmail}
                    icon={<Icon.Mail />}
                  />
                  <InputField
                    label="Github Username"
                    placeholder="ada-dev"
                    value={registerGithub}
                    onChange={setRegisterGithub}
                    icon={<Icon.Github />}
                  />
                  <InputField
                    label="Password (min 6)"
                    type="password"
                    placeholder="••••••••"
                    value={registerPass}
                    onChange={setRegisterPass}
                    icon={<Icon.Lock />}
                  />

                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      background: "#5b8bf7",
                      color: "#080c18",
                      fontFamily: C.mono,
                      border: "none",
                      cursor: "pointer",
                      marginTop: 8,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    $ ./create_account
                  </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.mono }}>or</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <button
                  onClick={handleGoogleAuth}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    cursor: "pointer",
                    fontFamily: C.mono,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                >
                  <Icon.Google /> continue with google
                </button>

                <p style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: C.mono, marginTop: 24 }}>
                  already have an account?{" "}
                  <button onClick={() => setPage("login")} style={{ color: C.primary, fontWeight: 600, cursor: "pointer" }}>
                    login →
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. DASHBOARD MAIN VIEW ─── */}
      {page === "dashboard" && (
        <div style={{ minHeight: "100vh", background: C.bg }}>
          {/* Header Navigation bar */}
          <nav style={{
            height: 56,
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${C.border}`,
            position: "sticky",
            top: 0,
            zIndex: 30,
            backdropFilter: "blur(12px)",
            background: "rgba(8,12,24,0.85)",
          }}>
            {/* Logo and Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: C.mono, color: C.text }}>
                  &gt;_ devpulse
                </span>
                <span style={{ color: C.textMuted, fontFamily: C.mono }}>::</span>
                
                {/* User email pill */}
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.border}`,
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontFamily: C.mono,
                  color: C.textSub,
                }}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[
                { id: "dashboard", label: "dashboard", icon: <Icon.Grid /> },
                { id: "github", label: "github", icon: <Icon.Github /> },
                { id: "leaderboard", label: "leaderboard", icon: <Icon.Trophy /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id as Tab);
                    // Reset viewed developer to current user if returning to dashboard
                    if (t.id === "dashboard") {
                      setViewingDeveloperId(currentUser.id);
                    }
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: C.mono,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s",
                    color: tab === t.id && !isReadOnly ? C.text : C.textMuted,
                    background: tab === t.id && !isReadOnly ? "rgba(255,255,255,0.06)" : "transparent",
                    border: "none",
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}

              <div style={{ width: 1, height: 18, background: C.border, margin: "0 10px" }} />

              {/* View Self Profile Link */}
              <button
                onClick={() => {
                  setViewingDeveloperId(currentUser.id);
                  setTab("dashboard");
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: C.mono,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: !isReadOnly && tab === "dashboard" ? C.primary : C.textSub,
                }}
              >
                <Icon.User />
                profile
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.textMuted,
                  cursor: "pointer",
                  marginLeft: 4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.red;
                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.textMuted;
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <Icon.Logout />
              </button>
            </div>
          </nav>

          {/* Page Body Container */}
          <main style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 24px" }}>
            
            {/* ─── Read-Only Viewer Warning Banner ─── */}
            {isReadOnly && tab === "dashboard" && (
              <div style={{
                background: "rgba(6, 200, 232, 0.08)",
                border: `1px solid rgba(6, 200, 232, 0.2)`,
                borderRadius: 12,
                padding: "12px 18px",
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                animation: "fadeIn 0.3s ease both"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.primary, fontSize: 16 }}>👁️</span>
                  <span style={{ fontSize: 13, color: C.textSub, fontFamily: C.mono }}>
                    viewer mode :: viewing <strong>{viewingDeveloper.name}</strong>'s dashboard (read-only)
                  </span>
                </div>
                <button
                  onClick={() => setViewingDeveloperId(currentUser.id)}
                  style={{
                    background: C.primaryDim,
                    color: C.primary,
                    border: `1px solid ${C.primary}30`,
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: C.mono,
                  }}
                >
                  $ exit_viewer
                </button>
              </div>
            )}

            {/* ─── SUB-TAB: DASHBOARD ─── */}
            {tab === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* 1. Profile Header Card */}
                <div style={{
                  ...s.card,
                  background: "linear-gradient(135deg, rgba(6,200,232,0.03) 0%, rgba(124,58,237,0.04) 100%)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, right: 0, width: 320, height: 180,
                    background: "radial-gradient(ellipse, rgba(6,200,232,0.05) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", position: "relative", zIndex: 2 }}>
                    
                    {/* Avatar with Status */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div style={{ position: "relative" }}>
                        <Avatar src={viewingDeveloper.avatar} name={viewingDeveloper.name} size={64} />
                        <span style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: 14, height: 14, borderRadius: "50%",
                          background: C.green, border: `2px solid ${C.bg}`,
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: C.green, fontFamily: C.mono, fontWeight: 700 }}>online</span>
                    </div>

                    {/* Meta Details */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>
                          {viewingDeveloper.name}
                        </h2>
                        <span style={s.tag(C.primary)}>USER::USER</span>
                        <span style={s.tag(C.green)}>OAUTH::GOOGLE</span>
                        <span style={s.tag(C.violet)}>{viewingDeveloper.username}</span>
                      </div>

                      <p style={{ fontSize: 13, color: C.textSub, fontFamily: C.mono, marginBottom: 6 }}>
                        {viewingDeveloper.email}
                      </p>
                      
                      <p style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginBottom: 12 }}>
                        {viewingDeveloper.bio}
                      </p>

                      <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: C.mono, color: C.textMuted }}>
                        <span>{viewingDeveloper.repos} repos</span>
                        <span>{viewingDeveloper.followers} followers</span>
                        <span>{viewingDeveloper.following} following</span>
                      </div>
                    </div>

                    {/* Edit Profile Button (Hidden if Read-Only) */}
                    {!isReadOnly && (
                      <button
                        onClick={handleOpenEditProfile}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${C.border}`,
                          color: C.textSub,
                          padding: "8px 16px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      >
                        <Icon.Pencil /> edit profile
                      </button>
                    )}

                  </div>
                </div>

                {/* 2. Grid Dashboard Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, flexWrap: "wrap" }}>
                  
                  {/* LEFT COLUMN: Skills Card & Git Log */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    
                    {/* Skills json card (Replaces Graph Card) */}
                    <div style={s.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: 13, fontFamily: C.mono, fontWeight: 700, color: C.primary }}>
                            // skills.json
                          </h3>
                          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            track learning progress · {viewingDeveloper.skills.length} tracked
                          </p>
                        </div>

                        {!isReadOnly && (
                          <button
                            onClick={() => setShowSkillModal(true)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              background: C.primaryDim,
                              color: C.primary,
                              border: `1px solid ${C.primary}30`,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: C.mono,
                              cursor: "pointer",
                            }}
                          >
                            <Icon.Plus /> new skill
                          </button>
                        )}
                      </div>

                      {/* Skills List */}
                      {viewingDeveloper.skills.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted, fontFamily: C.mono, fontSize: 12 }}>
                          // no skills yet - click 'new skill' to start tracking
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                          {viewingDeveloper.skills.map((sk) => (
                            <div key={sk.name} style={{
                              background: "rgba(255,255,255,0.02)",
                              border: `1px solid ${C.border}`,
                              borderRadius: 12,
                              padding: "12px 14px",
                              position: "relative",
                            }} className="skill-card-item">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{sk.name}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, fontFamily: C.mono, color: C.primary }}>{sk.level}%</span>
                                  {!isReadOnly && (
                                    <button
                                      onClick={() => handleDeleteSkill(sk.name)}
                                      style={{
                                        color: C.textMuted,
                                        cursor: "pointer",
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        display: "inline-flex",
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = C.red}
                                      onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
                                    >
                                      <Icon.Trash />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${sk.level}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.violet})`, borderRadius: 4 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Git Log Card (Shows Top 3 Updates) */}
                    <div style={s.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div>
                          <h3 style={{ fontSize: 13, fontFamily: C.mono, fontWeight: 700, color: C.primary }}>
                            git.log --live
                          </h3>
                          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {viewingDeveloper.username} - real-time activity
                          </p>
                        </div>
                        <button
                          onClick={() => setTab("github")}
                          style={{
                            fontSize: 11,
                            color: C.primary,
                            fontFamily: C.mono,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          view all →
                        </button>
                      </div>

                      {/* Log feed */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {devEvents.slice(0, 3).map((ev) => (
                          <div key={ev.id} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            padding: "10px 14px",
                            background: "rgba(255,255,255,0.01)",
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                          }}>
                            <div style={{ display: "flex", gap: 12 }}>
                              <div style={{
                                width: 22, height: 22, borderRadius: 6,
                                background: "rgba(255,255,255,0.04)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: ev.type === "push" ? C.primary : ev.type === "pr" ? C.violet : C.amber,
                                marginTop: 2,
                              }}>
                                {ev.type === "push" ? <Icon.Git /> : ev.type === "pr" ? <Icon.PR /> : <Icon.Star />}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: C.mono }}>
                                  {ev.msg}
                                </div>
                                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: C.mono, marginTop: 4 }}>
                                  {ev.detail}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>{ev.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Streak Card & Todos */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    
                    {/* Streak Card */}
                    <div style={s.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: C.amber, display: "flex" }}><Icon.Flame /></span>
                            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: C.mono, color: C.amber }}>
                              {viewingDeveloper.streak}
                            </span>
                            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 6 }}>
                              day streak
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: C.mono, marginTop: 2 }}>
                            {viewingDeveloper.checkIns.length} total check-ins
                          </p>
                        </div>

                        <button
                          onClick={handleCheckIn}
                          disabled={isReadOnly || isCheckedInToday}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isCheckedInToday ? C.greenDim : "rgba(255,255,255,0.04)",
                            color: isCheckedInToday ? C.green : C.textSub,
                            border: `1px solid ${isCheckedInToday ? `${C.green}40` : C.border}`,
                            fontFamily: C.mono,
                            cursor: isReadOnly || isCheckedInToday ? "default" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {isCheckedInToday ? "✓ checked in" : "check in"}
                        </button>
                      </div>

                      {/* Contribution calendar grid */}
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: 4 }}>
                          {getLast30Days().map(dateStr => {
                            const isChecked = viewingDeveloper.checkIns.includes(dateStr);
                            return (
                              <div
                                key={dateStr}
                                title={dateStr + (isChecked ? " (Checked in)" : "")}
                                style={{
                                  aspectRatio: "1/1",
                                  borderRadius: 2,
                                  background: isChecked ? C.green : "rgba(255,255,255,0.04)",
                                  border: `1px solid ${isChecked ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)"}`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Todo goals list */}
                    <div style={s.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div>
                          <h3 style={{ fontSize: 13, fontFamily: C.mono, fontWeight: 700, color: C.primary }}>
                            @ todo.list
                          </h3>
                          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {viewingDeveloper.todos.filter(t => t.done).length}/{viewingDeveloper.todos.length} done · learning goals
                          </p>
                        </div>

                        {!isReadOnly && (
                          <button
                            onClick={() => setShowGoalModal(true)}
                            style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: "rgba(255,255,255,0.03)",
                              border: `1px solid ${C.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: C.textSub, cursor: "pointer",
                            }}
                          >
                            <Icon.Plus />
                          </button>
                        )}
                      </div>

                      {/* Todo List */}
                      {viewingDeveloper.todos.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted, fontFamily: C.mono, fontSize: 12 }}>
                          // no goals defined
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {viewingDeveloper.todos.map((todo) => (
                            <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }} className="todo-item-row">
                              <input
                                type="checkbox"
                                checked={todo.done}
                                disabled={isReadOnly}
                                onChange={() => handleToggleGoal(todo.id)}
                                style={{
                                  accentColor: C.primary,
                                  width: 14, height: 14,
                                  cursor: isReadOnly ? "default" : "pointer",
                                }}
                              />
                              <span style={{
                                fontSize: 12,
                                color: todo.done ? C.textMuted : C.textSub,
                                textDecoration: todo.done ? "line-through" : "none",
                                flex: 1,
                              }}>
                                {todo.text}
                              </span>
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleDeleteGoal(todo.id)}
                                  style={{
                                    color: C.textMuted,
                                    cursor: "pointer",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    display: "inline-flex",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = C.red}
                                  onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
                                >
                                  <Icon.Trash />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ─── SUB-TAB: GITHUB ─── */}
            {tab === "github" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease both" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>GitHub Activity Feed</h3>
                    <p style={{ fontSize: 12, color: C.textMuted, fontFamily: C.mono, marginTop: 2 }}>
                      showing synced data for @{viewingDeveloper.username}
                    </p>
                  </div>

                  <a
                    href={`https://github.com/${viewingDeveloper.username}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 14px", borderRadius: 10, fontSize: 12, fontFamily: C.mono,
                      background: "rgba(255,255,255,0.03)", color: C.textSub, border: `1px solid ${C.border}`,
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    }}
                  >
                    <Icon.External /> Open GitHub
                  </a>
                </div>

                {/* Event list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {devEvents.map((ev) => (
                    <div key={ev.id} style={{
                      ...s.card, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start",
                      background: C.card,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: ev.type === "push" ? C.primary : ev.type === "pr" ? C.violet : C.amber,
                        flexShrink: 0,
                      }}>
                        {ev.type === "push" ? <Icon.Git /> : ev.type === "pr" ? <Icon.PR /> : <Icon.Star />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ev.msg}</p>
                          {ev.status && <span style={s.tag(ev.status === "merged" ? C.violet : C.green)}>{ev.status}</span>}
                          {ev.commits && <span style={s.tag(C.primary)}>{ev.commits} commits</span>}
                        </div>
                        
                        <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: C.mono, color: C.textMuted }}>
                          <span>{ev.repo}</span>
                          {ev.branch && <span>branch: {ev.branch}</span>}
                          <span>{ev.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Repository stats */}
                <div style={s.card}>
                  <p style={{ fontSize: 13, fontFamily: C.mono, fontWeight: 700, color: C.primary, marginBottom: 16 }}>
                    Repository Stats (Local Sync)
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    {REPOS_LIST.map((repo) => (
                      <div key={repo.name} style={{
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        padding: "14px 16px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: C.mono }}>{repo.name}</span>
                          <span style={s.tag(C.primary)}>{repo.lang}</span>
                        </div>

                        <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: C.mono, color: C.textMuted }}>
                          <span>⭐ {repo.stars} stars</span>
                          <span>🍴 {repo.forks} forks</span>
                          <span>PRs: {repo.openPRs} open</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB: LEADERBOARD ─── */}
            {tab === "leaderboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease both" }}>
                
                {/* Loader / Error states */}
                {loadingLeaderboard && (
                  <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13, fontFamily: C.mono }}>
                    // fetching contributor logs from GitHub API...
                  </div>
                )}

                {leaderboardError && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    color: C.red,
                    fontSize: 13,
                    fontFamily: C.mono,
                  }}>
                    Error: {leaderboardError}
                  </div>
                )}

                {!loadingLeaderboard && !leaderboardError && (
                  <>
                    {/* Leaderboard Podium (GitHub Contributors) */}
                    <div style={{
                      ...s.card,
                      background: "linear-gradient(135deg, rgba(6,200,232,0.02) 0%, rgba(124,58,237,0.04) 100%)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                        <Icon.Trophy />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: C.mono }}>
                          GitHub Contributor Podium
                        </h3>
                        <span style={s.tag(C.primary)}>LIVE</span>
                      </div>

                      {contributors.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px 0", color: C.textMuted, fontFamily: C.mono, fontSize: 12 }}>
                          // no commits pushed to GitHub yet
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, padding: "20px 0 10px", overflowX: "auto" }}>
                          {/* We slice top 3 and order: 2nd, 1st, 3rd */}
                          {[
                            contributors[1], // 2nd
                            contributors[0], // 1st
                            contributors[2], // 3rd
                          ].filter(Boolean).map((dev, idx) => {
                            const actualRank = contributors.findIndex(d => d.id === dev.id) + 1;
                            const commits = dev.contributions;
                            const isFirst = actualRank === 1;
                            const isSecond = actualRank === 2;
                            
                            const height = isFirst ? 110 : isSecond ? 85 : 65;
                            const ribbon = isFirst ? "👑" : isSecond ? "🥈" : "🥉";

                            const borderCol = isFirst ? "rgba(245,158,11,0.3)" : isSecond ? "rgba(148,163,184,0.2)" : "rgba(205,127,50,0.2)";
                            const grad = isFirst 
                              ? "linear-gradient(180deg, rgba(245,158,11,0.22), rgba(245,158,11,0.05))" 
                              : isSecond 
                              ? "linear-gradient(180deg, rgba(148,163,184,0.15), rgba(148,163,184,0.03))"
                              : "linear-gradient(180deg, rgba(205,127,50,0.15), rgba(205,127,50,0.03))";

                            return (
                              <div
                                key={dev.id}
                                onClick={() => window.open(dev.html_url, "_blank")}
                                style={{
                                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                  cursor: "pointer", flex: 1, minWidth: 100, maxWidth: 130,
                                  transition: "transform 0.2s",
                                }}
                                className="podium-item"
                              >
                                <div style={{ position: "relative" }}>
                                  {isFirst && <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 16 }}>👑</div>}
                                  <Avatar src={dev.avatar_url} name={dev.login} size={isFirst ? 52 : 42} />
                                </div>

                                <div style={{ textAlign: "center" }}>
                                  <p style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: C.mono }}>@{dev.login}</p>
                                  <p style={{ fontSize: 10, fontFamily: C.mono, color: C.primary }}>{commits} commits</p>
                                </div>

                                <div style={{
                                  width: "100%",
                                  height: height,
                                  background: grad,
                                  border: `1px solid ${borderCol}`,
                                  borderRadius: "8px 8px 0 0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 18,
                                  fontWeight: 800,
                                }}>
                                  {ribbon}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Leaderboard Table List (GitHub contributors only) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {contributors.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13, fontFamily: C.mono }}>
                          // no contributors logs in GitHub API
                        </div>
                      ) : (
                        contributors.map((dev, index) => {
                          const rank = index + 1;
                          const commits = dev.contributions;
                          const maxCommits = contributors[0]?.contributions || 1;
                          const matchedLocalDev = developers.find(
                            (d) => d.username.toLowerCase() === dev.login.toLowerCase()
                          );
                          const isMe = matchedLocalDev?.id === currentUser.id;

                          return (
                            <div
                              key={dev.id}
                              style={{
                                background: isMe ? "rgba(6,200,232,0.04)" : C.card,
                                border: `1px solid ${isMe ? `${C.primary}30` : C.border}`,
                                borderRadius: 12,
                                padding: "12px 16px",
                                transition: "all 0.15s",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = C.borderHi;
                                e.currentTarget.style.background = isMe ? "rgba(6,200,232,0.06)" : C.cardHover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isMe ? `${C.primary}30` : C.border;
                                e.currentTarget.style.background = isMe ? "rgba(6,200,232,0.04)" : C.card;
                              }}
                              onClick={() => {
                                if (matchedLocalDev) {
                                  setViewingDeveloperId(matchedLocalDev.id);
                                  setTab("dashboard");
                                } else {
                                  window.open(dev.html_url, "_blank");
                                }
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <RankBadge rank={rank} />
                                
                                <Avatar src={dev.avatar_url} name={dev.login} size={36} />
                                
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                      {matchedLocalDev ? matchedLocalDev.name : dev.login}
                                    </span>
                                    {isMe && <Pill color={C.primary}>You</Pill>}
                                    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.mono }}>@{dev.login}</span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
                                    <span style={{ color: C.textSub }}>
                                      {matchedLocalDev ? matchedLocalDev.role : "GitHub Contributor"}
                                    </span>
                                  </div>

                                  {/* Progress bar based on commits */}
                                  <div style={{ marginTop: 8, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{
                                      height: "100%",
                                      width: `${(commits / maxCommits) * 100}%`,
                                      background: `linear-gradient(90deg, ${C.primary}, ${C.violet})`,
                                      borderRadius: 2,
                                    }} />
                                  </div>
                                </div>

                                {/* Commits count info */}
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <p style={{ fontSize: 16, fontWeight: 800, fontFamily: C.mono, color: C.primary }}>{commits}</p>
                                  <p style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>commits</p>
                                </div>

                                {/* View Action */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (matchedLocalDev) {
                                      setViewingDeveloperId(matchedLocalDev.id);
                                      setTab("dashboard");
                                    } else {
                                      window.open(dev.html_url, "_blank");
                                    }
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: C.primaryDim,
                                    color: C.primary,
                                    border: `1px solid ${C.primary}30`,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontFamily: C.mono,
                                  }}
                                >
                                  <Icon.External /> view
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </main>
        </div>
      )}

      {/* ─── MODAL: ADD SKILL ─── */}
      {showSkillModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(8,12,24,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setShowSkillModal(false)}>
          <div style={{
            background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 20,
            width: "100%", maxWidth: 400, padding: 24, animation: "fadeIn 0.2s ease both"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: C.mono }}>$ add_skill</h3>
              <button onClick={() => setShowSkillModal(false)} style={{ color: C.textMuted, cursor: "pointer" }}><Icon.Close /></button>
            </div>

            <form onSubmit={handleAddSkill} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField
                label="Skill Name"
                placeholder="e.g. TypeScript"
                value={newSkillName}
                onChange={setNewSkillName}
              />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: C.mono }}>
                    Proficiency ({newSkillLevel}%)
                  </label>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                  style={{ accentColor: C.primary, cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.textSub,
                    fontFamily: C.mono, cursor: "pointer"
                  }}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: C.primary, color: "#080c18", border: "none",
                    fontFamily: C.mono, cursor: "pointer"
                  }}
                >
                  save_skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD GOAL ─── */}
      {showGoalModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(8,12,24,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setShowGoalModal(false)}>
          <div style={{
            background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 20,
            width: "100%", maxWidth: 400, padding: 24, animation: "fadeIn 0.2s ease both"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: C.mono }}>$ add_goal</h3>
              <button onClick={() => setShowGoalModal(false)} style={{ color: C.textMuted, cursor: "pointer" }}><Icon.Close /></button>
            </div>

            <form onSubmit={handleAddGoal} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField
                label="Goal Description"
                placeholder="e.g. Study React Router"
                value={newGoalText}
                onChange={setNewGoalText}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.textSub,
                    fontFamily: C.mono, cursor: "pointer"
                  }}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: C.primary, color: "#080c18", border: "none",
                    fontFamily: C.mono, cursor: "pointer"
                  }}
                >
                  add_goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT PROFILE ─── */}
      {showProfileModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(8,12,24,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setShowProfileModal(false)}>
          <div style={{
            background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 20,
            width: "100%", maxWidth: 440, padding: 24, animation: "fadeIn 0.2s ease both"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: C.mono }}>$ edit_profile</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ color: C.textMuted, cursor: "pointer" }}><Icon.Close /></button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <InputField
                label="Full Name"
                placeholder="SUPRIYO"
                value={editName}
                onChange={setEditName}
              />
              <InputField
                label="Role"
                placeholder="Full-Stack Intern"
                value={editRole}
                onChange={setEditRole}
              />
              <InputField
                label="GitHub Username"
                placeholder="GT-AM-A-PROGRAMMER"
                value={editGithub}
                onChange={setEditGithub}
              />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: C.mono }}>
                  Bio (Markdown supported)
                </label>
                <textarea
                  placeholder="# add a bio..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    background: "#161618",
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 13,
                    color: C.text,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.textSub,
                    fontFamily: C.mono, cursor: "pointer"
                  }}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: C.primary, color: "#080c18", border: "none",
                    fontFamily: C.mono, cursor: "pointer"
                  }}
                >
                  save_profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
