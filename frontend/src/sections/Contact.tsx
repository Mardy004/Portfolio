import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiGithub,
  FiLinkedin,
  FiSend,
} from "react-icons/fi";
import { api } from "../api/client";
import type { Profile } from "../api/types";
import "./Contact.css";

interface ContactResponse {
  success: boolean;
  message: string;
  emailed?: boolean;
  data?: unknown;
}

export default function Contact({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = useState("");
  const [autoReplyNote, setAutoReplyNote] = useState("");

  const socials = profile?.socials || {};
  const contactEmail = profile?.email || "ikuzwemariette@gmail.com";

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setFeedback("");
    setAutoReplyNote("");

    try {
      const res = await api.post<ContactResponse>("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus("sent");
      setFeedback(res.message || "Message sent successfully.");
      // setAutoReplyNote(
      //   res.emailed
      //     ? "A thank-you email was sent to " + form.email.trim() + "."
      //     : "Your message was saved — email delivery is unavailable right now."
      // );
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus("error");
      setFeedback((error as Error).message || "Failed to send message.");
    }
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Contact</span>
          <h2 className="section-title">
            Let's work <span className="gradient-text">together</span>
          </h2>
          <p className="section-text">
            Have a project or question? I would love to hear from you.
          </p>
        </div>

        <div className="contact__grid">
          <div className="contact__info reveal">
            <h3>Get in touch</h3>
            <p>
              I am open to discussing new projects, creative ideas or
              opportunities to be part of your vision.
            </p>

            <a
              className="contact__item"
              href={`mailto:${contactEmail}`}
            >
              <span className="contact__icon">
                <FiMail />
              </span>
              <span>
                <small>Email</small>
                <strong>{contactEmail}</strong>
              </span>
            </a>

            <div className="contact__item">
              <span className="contact__icon">
                <FiMapPin />
              </span>
              <span>
                <small>Location</small>
                <strong>{profile?.location || "Kigali, Rwanda"}</strong>
              </span>
            </div>

            <div className="contact__socials">
              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <FiGithub />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <FiLinkedin />
                </a>
              )}
              <a
                href={`mailto:${contactEmail}`}
                aria-label="Email"
              >
                <FiMail />
              </a>
            </div>
          </div>

          <form className="contact__form card reveal" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                className="input"
                name="name"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                className="input"
                name="email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                className="input"
                name="subject"
                type="text"
                placeholder="Project inquiry"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                className="textarea"
                name="message"
                placeholder="Tell me about your project..."
                value={form.message}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "sending"}
            >
              {status === "sending" ? (
                "Sending..."
              ) : (
                <>
                  Send message <FiSend />
                </>
              )}
            </button>

            {status === "sent" && (
              <>
                <p className="contact__feedback is-success">
                  <FiCheckCircle /> {feedback}
                </p>
                {autoReplyNote && (
                  <p className="contact__note">{autoReplyNote}</p>
                )}
              </>
            )}
            {status === "error" && (
              <p className="contact__feedback is-error">
                <FiAlertCircle /> {feedback}
              </p>
            )}
            <p className="contact__hint">
              Messages sent <strong>ikuzwemariette@gmail.com</strong> 
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}