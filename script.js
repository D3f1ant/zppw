(() => {
  "use strict";

  const form = document.getElementById("quoteForm");
  const status = document.getElementById("formStatus");
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove("active");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
    };

    menuButton.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("active");

      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    });

    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  if (!form || !status) return;

  const submitButton = form.querySelector('button[type="submit"]');

  const setStatus = (message, type = "info") => {
    status.textContent = message;
    status.dataset.state = type;
  };

  const normalize = (value) =>
    typeof value === "string"
      ? value.replace(/\s+/g, " ").trim()
      : "";

  const getValue = (name) => {
    const element = form.elements.namedItem(name);
    return element ? normalize(element.value) : "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: getValue("name"),
      phone: getValue("phone"),
      email: getValue("email").toLowerCase(),
      service: getValue("service"),
      details: getValue("details"),
      website: getValue("website")
    };

    if (payload.name.length < 2) {
      setStatus("Please enter your full name.", "error");
      form.elements.namedItem("name")?.focus();
      return;
    }

    const phoneDigits = payload.phone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setStatus("Please enter a valid phone number.", "error");
      form.elements.namedItem("phone")?.focus();
      return;
    }

    if (!payload.service) {
      setStatus("Please select a service.", "error");
      form.elements.namedItem("service")?.focus();
      return;
    }

    if (
      payload.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    ) {
      setStatus("Please enter a valid email address.", "error");
      form.elements.namedItem("email")?.focus();
      return;
    }

    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus("Sending your request…", "info");

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "We could not send your request right now."
        );
      }

      form.reset();
      setStatus(
        "Quote request received. Zion Precision Pressure Wash will contact you soon.",
        "success"
      );
    } catch (error) {
      console.error("Quote form submission failed:", error);

      setStatus(
        error.message ||
          "Unable to send your request. Please call (435) 525-0736.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
})();
