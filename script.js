(() => {
  "use strict";

  const doc = document;

  const qs = (selector, scope = doc) => scope.querySelector(selector);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const slider = qs("#baSlider");
  const afterPanel = qs(".ba-after", slider || doc);
  const handle = qs("#baHandle");
  const range = qs("#baRange");

  if (slider && afterPanel && handle && range) {
    const updateSlider = (value) => {
      const percent = clamp(Number(value) || 0, 0, 100);
      afterPanel.style.width = `${percent}%`;
      handle.style.left = `${percent}%`;
      range.value = String(percent);
      range.setAttribute("aria-valuenow", String(percent));
    };

    const updateFromPointer = (clientX) => {
      const rect = slider.getBoundingClientRect();
      if (!rect.width) return;
      const percent = ((clientX - rect.left) / rect.width) * 100;
      updateSlider(percent);
    };

    let isDragging = false;

    const startDrag = (event) => {
      isDragging = true;
      if (event.cancelable) event.preventDefault();
    };

    const stopDrag = () => {
      isDragging = false;
    };

    const onPointerMove = (event) => {
      if (!isDragging) return;
      const point = event.touches ? event.touches[0] : event;
      if (!point) return;
      updateFromPointer(point.clientX);
    };

    range.addEventListener("input", (event) => {
      updateSlider(event.target.value);
    });

    slider.addEventListener("click", (event) => {
      if (event.target === range) return;
      updateFromPointer(event.clientX);
    });

    handle.addEventListener("mousedown", startDrag);
    handle.addEventListener("touchstart", startDrag, { passive: false });

    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });

    updateSlider(50);
  }

  const menuToggle = qs(".menu-toggle");
  const nav = qs(".nav");

  if (menuToggle && nav) {
    const closeMenu = () => {
      nav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    };

    const openMenu = () => {
      nav.classList.add("is-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close navigation");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) closeMenu();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      const clickInsideNav = nav.contains(event.target);
      const clickToggle = menuToggle.contains(event.target);
      if (!clickInsideNav && !clickToggle) closeMenu();
    });
  }

  const form = qs("#quoteForm");
  const formStatus = qs("#formStatus");

  if (form && formStatus) {
    const fields = {
      name: {
        input: qs("#name"),
        error: qs("#nameError"),
        validate: (value) => {
          const cleaned = value.trim().replace(/\s+/g, " ");
          if (cleaned.length < 2) return "Please enter your full name.";
          if (!/^[a-zA-Z0-9 .,'-]+$/.test(cleaned)) return "Name contains invalid characters.";
          return "";
        },
        normalize: (value) => value.trim().replace(/\s+/g, " ")
      },
      phone: {
        input: qs("#phone"),
        error: qs("#phoneError"),
        validate: (value) => {
          const digits = value.replace(/\D/g, "");
          if (digits.length < 10 || digits.length > 15) return "Please enter a valid phone number.";
          return "";
        },
        normalize: (value) => value.trim()
      },
      email: {
        input: qs("#email"),
        error: qs("#emailError"),
        validate: (value) => {
          const email = value.trim();
          if (!email) return "";
          if (email.length > 120) return "Email is too long.";
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(email)) return "Please enter a valid email address.";
          return "";
        },
        normalize: (value) => value.trim().toLowerCase()
      },
      service: {
        input: qs("#service"),
        error: qs("#serviceError"),
        validate: (value) => {
          if (!value.trim()) return "Please select a service.";
          return "";
        },
        normalize: (value) => value.trim()
      },
      details: {
        input: qs("#details"),
        error: qs("#detailsError"),
        validate: (value) => {
          const cleaned = value.trim();
          if (cleaned.length < 10) return "Please add a few details about the job.";
          if (cleaned.length > 1200) return "Details are too long.";
          return "";
        },
        normalize: (value) => value.trim().replace(/\r\n/g, "\n")
      }
    };

    const honeypot = qs("#website");

    const setError = (fieldName, message) => {
      const field = fields[fieldName];
      if (!field) return;
      field.error.textContent = message;
      field.input.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const validateField = (fieldName) => {
      const field = fields[fieldName];
      if (!field) return true;
      const normalized = field.normalize(field.input.value);
      field.input.value = normalized;
      const message = field.validate(normalized);
      setError(fieldName, message);
      return !message;
    };

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      field.input.addEventListener("blur", () => validateField(fieldName));
      field.input.addEventListener("input", () => {
        if (field.input.getAttribute("aria-invalid") === "true") {
          validateField(fieldName);
        }
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      formStatus.textContent = "";
      let isValid = true;

      if (honeypot && honeypot.value.trim() !== "") {
        formStatus.textContent = "Request blocked.";
        return;
      }

      Object.keys(fields).forEach((fieldName) => {
        if (!validateField(fieldName)) isValid = false;
      });

      if (!isValid) {
        formStatus.textContent = "Please fix the highlighted fields and try again.";
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const payload = Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [key, field.input.value])
      );

      console.log("Validated quote request payload:", payload);

      formStatus.textContent = "Quote request captured locally. Connect this form to a secure backend endpoint for production.";
      form.reset();

      Object.keys(fields).forEach((fieldName) => setError(fieldName, ""));
      Object.values(fields).forEach((field) => field.input.setAttribute("aria-invalid", "false"));
    });
  }
})();
/* ── QUOTE FORM HANDLER ── */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quoteForm');
  if (!form) return;

  // Replace the green "captured locally" message with a live status area
  const oldMsg = form.parentElement.querySelector('p[style*="color"], .form-note, .local-capture-msg');
  if (oldMsg) oldMsg.remove();

  let statusDiv = document.getElementById('formStatus');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'formStatus';
    statusDiv.style.marginTop = '14px';
    statusDiv.style.fontSize = '14px';
    statusDiv.style.fontWeight = '500';
    statusDiv.style.minHeight = '22px';
    form.appendChild(statusDiv);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusDiv.textContent = '';
    statusDiv.style.color = '';

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const payload = {
      name: (form.querySelector('[name="name"]')?.value || '').trim(),
      phone: (form.querySelector('[name="phone"]')?.value || '').trim(),
      email: (form.querySelector('[name="email"]')?.value || '').trim(),
      service: (form.querySelector('[name="service"]')?.value || '').trim(),
      details: (form.querySelector('[name="details"]')?.value || '').trim(),
      website: (form.querySelector('[name="website"]')?.value || '') // honeypot
    };

    if (payload.name.length < 2) {
      statusDiv.textContent = 'Please enter your full name.';
      statusDiv.style.color = '#ff6b6b';
      btn.disabled = false; btn.textContent = originalText; return;
    }
    if (payload.phone.length < 7) {
      statusDiv.textContent = 'Please enter a valid phone number.';
      statusDiv.style.color = '#ff6b6b';
      btn.disabled = false; btn.textContent = originalText; return;
    }

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        statusDiv.textContent = '✅ Quote sent! We\'ll contact you soon.';
        statusDiv.style.color = '#4ade80';
        form.reset();
      } else {
        statusDiv.textContent = data.error || 'Something went wrong. Try again.';
        statusDiv.style.color = '#ff6b6b';
      }
    } catch (err) {
      statusDiv.textContent = 'Network error. Check connection and retry.';
      statusDiv.style.color = '#ff6b6b';
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
