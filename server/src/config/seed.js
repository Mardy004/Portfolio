import { ensureDoc, list, create } from "./store.js";
import { hashPassword } from "../utils/auth.js";

/**
 * Seed default content on first boot so the portfolio is never empty.
 * Existing documents are never overwritten.
 */
export async function seedDatabase() {
  await seedAdmin();
  await seedProfile();
  await seedSkills();
  await seedExperience();
  await seedProjects();
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "mariette250";
  const password = process.env.ADMIN_PASSWORD || "PortoMariettte2026";

  await ensureDoc("admins", "primary", {
    username,
    passwordHash: hashPassword(password),
    displayName: "Mariette Ikuzwe",
    role: "admin",
  });

  console.log(`[seed] Admin account ready (username: ${username}).`);
}

async function seedProfile() {
  await ensureDoc("profile", "main", {
    name: "Mariette Ikuzwe",
    role: "Frontend Developer",
    tagline: "I build clean, modern and responsive web experiences.",
    bio:
      "I am a frontend developer passionate about crafting accessible, " +
      "performant interfaces with React and modern tooling. I enjoy turning " +
      "complex problems into simple, elegant user experiences.",
    location: "Kigali, Rwanda",
    email: "ikuzwemariette@gmail.com",
    phone: "0791352255",
    availability: "Open to opportunities",
    resumeUrl: "",
    avatar: "",
    socials: {
      github: "https://github.com/Mardy004",
      linkedin: "https://www.linkedin.com/in/ikuzwe-mariette-884b78308",
      twitter: "",
      website: "",
    },
    stats: [
      { label: "Years of experience", value: "3+" },
      { label: "Projects delivered", value: "20+" },
      { label: "Technologies", value: "15+" },
    ],
  });
}

async function seedSkills() {
  const existing = await list("skills");
  if (existing.length > 0) return;

  const skills = [
    { name: "React", level: 92, category: "Frontend", icon: "react" },
    { name: "TypeScript", level: 88, category: "Frontend", icon: "typescript" },
    { name: "JavaScript", level: 93, category: "Frontend", icon: "javascript" },
    { name: "HTML5", level: 95, category: "Frontend", icon: "html" },
    { name: "CSS3", level: 92, category: "Frontend", icon: "css" },
    { name: "Node.js", level: 80, category: "Backend", icon: "node" },
    { name: "Express", level: 78, category: "Backend", icon: "express" },
    { name: "Firebase", level: 82, category: "Backend", icon: "firebase" },
    { name: "Git & GitHub", level: 88, category: "Tools", icon: "git" },
    { name: "Figma", level: 75, category: "Design", icon: "figma" },
  ];

  for (const skill of skills) {
    await create("skills", skill);
  }
  console.log("[seed] Skills created.");
}

async function seedExperience() {
  const existing = await list("experience");
  if (existing.length > 0) return;

  const experience = [
    {
      role: "Frontend Developer",
      company: "Freelance",
      location: "Remote",
      startDate: "2023",
      endDate: "Present",
      description:
        "Designing and building responsive web applications for clients " +
        "using React, TypeScript and Firebase.",
      highlights: [
        "Delivered 15+ responsive client projects",
        "Improved average Lighthouse performance to 95+",
      ],
    },
    {
      role: "Junior Web Developer",
      company: "Tech Studio",
      location: "Kigali, Rwanda",
      startDate: "2022",
      endDate: "2023",
      description:
        "Collaborated with designers and backend engineers to ship " +
        "customer-facing features.",
      highlights: [
        "Built reusable component library",
        "Reduced page load time by 40%",
      ],
    },
  ];

  for (const item of experience) {
    await create("experience", item);
  }
  console.log("[seed] Experience created.");
}

async function seedProjects() {
  const existing = await list("projects");
  if (existing.length > 0) return;

  const projects = [
    {
      title: "Portfolio Website",
      description:
        "A modern, fully responsive developer portfolio with a protected " +
        "admin dashboard for managing content.",
      technologies: ["React", "TypeScript", "Firebase", "Express"],
      category: "Web App",
      link: "https://github.com/Mardy004",
      image: "",
      featured: true,
    },
    {
      title: "Task Manager",
      description:
        "A productivity app with drag-and-drop boards, real-time sync and " +
        "offline support.",
      technologies: ["React", "Firebase", "CSS"],
      category: "Web App",
      link: "https://github.com/Mardy004",
      image: "",
      featured: true,
    },
    {
      title: "E-commerce UI",
      description:
        "A clean storefront interface with cart, filters and checkout flow.",
      technologies: ["React", "TypeScript", "Stripe"],
      category: "UI/UX",
      link: "https://github.com/Mardy004",
      image: "",
      featured: false,
    },
  ];

  for (const project of projects) {
    await create("projects", project);
  }
  console.log("[seed] Projects created.");
}