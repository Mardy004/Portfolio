import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../sections/Hero";
import About from "../sections/About";
import Skills from "../sections/Skills";
import Projects from "../sections/Projects";
import Experience from "../sections/Experience";
import Contact from "../sections/Contact";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useReveal";

export default function Home() {
  const { profile, projects, skills, experience, loading, error } =
    useContent();

  // Re-run the reveal observer once content has loaded.
  useReveal([loading, projects.length, skills.length, experience.length]);

  return (
    <>
      <Navbar />

      <main>
        {error && (
          <div className="container" style={{ paddingTop: "6rem" }}>
            <p className="contact__feedback is-error">
              Could not load content: {error}
            </p>
          </div>
        )}

        <Hero profile={profile} />
        <About profile={profile} />
        <Skills skills={skills} />
        <Projects projects={projects} />
        <Experience experience={experience} />
        <Contact profile={profile} />
      </main>

      <Footer profile={profile} />
    </>
  );
}