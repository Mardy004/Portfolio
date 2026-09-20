export interface Profile {
  id?: string;
  name: string;
  role: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  phone?: string;
  availability?: string;
  resumeUrl?: string;
  avatar?: string;
  socials?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  stats?: { label: string; value: string }[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  category: string;
  link: string;
  image?: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Skill {
  id: string;
  name: string;
  /** 0–100 value mapped onto the four named levels (see utils/skillLevel). */
  level: number;
  category: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string;
  highlights?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read?: boolean;
  emailed?: boolean;
  mailError?: string | null;
  createdAt?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt?: string;
}

export interface AdminUser {
  username: string;
  name: string;
  role: string;
}