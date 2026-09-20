import { useEffect } from "react";

/**
 * Adds the `is-visible` class to every `.reveal` element as it scrolls
 * into view. Re-runs whenever `deps` change (e.g. after content loads).
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal")
    );

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}