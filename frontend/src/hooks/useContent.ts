import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Experience, Profile, Project, Skill } from "../api/types";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export interface ContentState {
  profile: Profile | null;
  projects: Project[];
  skills: Skill[];
  experience: Experience[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads every public collection in parallel for the portfolio page.
 */
export function useContent(): ContentState {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /* Refresh when the tab regains focus so anything saved in the admin portal
     shows up on the public site without a manual page reload. */
  useEffect(() => {
    function refresh() {
      if (document.visibilityState === "visible") setNonce((n) => n + 1);
    }
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<ItemResponse<Profile>>("/profile"),
      api.get<ListResponse<Project>>("/projects"),
      api.get<ListResponse<Skill>>("/skills"),
      api.get<ListResponse<Experience>>("/experience"),
    ])
      .then(([profileRes, projectsRes, skillsRes, experienceRes]) => {
        if (!active) return;
        setProfile(profileRes.data);
        setProjects(projectsRes.data || []);
        setSkills(skillsRes.data || []);
        setExperience(experienceRes.data || []);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [nonce]);

  return {
    profile,
    projects,
    skills,
    experience,
    loading,
    error,
    reload,
  };
}