document.addEventListener("DOMContentLoaded", () => {
  const setViewportHeight = () =>
    document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  window.addEventListener("resize", setViewportHeight);
  setViewportHeight();

  const app = window.QRFusionApp;
  if (!app) return;

  const byId = (id) => document.getElementById(id);
  const controls = {
    foreground: byId("color-fg"),
    background: byId("color-bg"),
    transparent: byId("transparent-bg"),
    gradient: byId("gradient-enabled"),
    gradientColor: byId("gradient-color"),
    gradientRotation: byId("gradient-rotation"),
    logoSize: byId("logo-size"),
    logoMargin: byId("logo-margin"),
    shape: byId("shape-style"),
    frame: byId("border-style"),
    eye: byId("center-style"),
    size: byId("size-input"),
    preset: byId("preset-select"),
  };

  const presets = {
    classic: { foreground: "#000000", background: "#ffffff", gradient: false, shape: "square", frame: "square", eye: "square" },
    ocean: { foreground: "#075985", background: "#ecfeff", gradient: true, gradientColor: "#0369a1", rotation: 45, shape: "dots", frame: "extra-rounded", eye: "dot" },
    sunset: { foreground: "#7c2d12", background: "#fff7ed", gradient: true, gradientColor: "#be123c", rotation: 90, shape: "extra-rounded", frame: "extra-rounded", eye: "dot" },
    forest: { foreground: "#14532d", background: "#f0fdf4", gradient: true, gradientColor: "#15803d", rotation: 135, shape: "dots", frame: "extra-rounded", eye: "dot" },
    midnight: { foreground: "#e0e7ff", background: "#111827", gradient: true, gradientColor: "#a855f7", rotation: 45, shape: "extra-rounded", frame: "extra-rounded", eye: "dot" },
  };

  const setValue = (element, value) => {
    if (!element || value === undefined) return;
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value;
  };

  const refreshControlUI = () => {
    const showGradient = controls.gradient.checked;
    byId("gradient-controls").style.display = showGradient ? "flex" : "none";
    byId("gradient-rotation-control").style.display = showGradient ? "flex" : "none";
    controls.background.disabled = controls.transparent.checked;
    byId("qr-code-container").classList.toggle(
      "transparent-preview",
      controls.transparent.checked
    );
    byId("gradient-rotation-value").textContent = `${controls.gradientRotation.value}°`;
    byId("logo-size-value").textContent = `${controls.logoSize.value}%`;
    byId("logo-margin-value").textContent = `${controls.logoMargin.value}px`;
  };

  const applyPreset = (name) => {
    const preset = presets[name];
    if (!preset) return;
    setValue(controls.foreground, preset.foreground);
    setValue(controls.background, preset.background);
    setValue(controls.gradient, preset.gradient);
    setValue(controls.gradientColor, preset.gradientColor);
    setValue(controls.gradientRotation, preset.rotation);
    setValue(controls.shape, preset.shape);
    setValue(controls.frame, preset.frame);
    setValue(controls.eye, preset.eye);
    setValue(controls.transparent, false);
    refreshControlUI();
    app.refresh();
    saveDraft();
  };

  controls.preset.addEventListener("change", () => applyPreset(controls.preset.value));
  [controls.transparent, controls.gradient, controls.gradientColor, controls.gradientRotation, controls.logoSize, controls.logoMargin].forEach((control) => {
    control?.addEventListener("input", () => {
      if (control !== controls.preset) controls.preset.value = "custom";
      refreshControlUI();
      app.refresh();
      scheduleQualityUpdate();
    });
  });

  const hexToRgb = (hex) => {
    const value = hex.replace("#", "");
    return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  };
  const luminance = (hex) => {
    const channels = hexToRgb(hex).map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const contrast = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };
  const updateQuality = () => {
    const container = byId("scan-quality");
    const output = byId("scan-quality-text");
    const data = app.getData();
    container.className = "quality-indicator";
    if (!data) {
      output.textContent = "Add valid content to check scan quality";
      return;
    }
    const ratios = [contrast(controls.foreground.value, controls.background.value)];
    if (controls.gradient.checked) ratios.push(contrast(controls.gradientColor.value, controls.background.value));
    const ratio = Math.min(...ratios);
    const logoRisk = Number(controls.logoSize.value) > 40;
    const dense = data.length > 900;
    let level = "excellent";
    let message = `Excellent scan quality · contrast ${ratio.toFixed(1)}:1`;
    if (controls.transparent.checked) {
      level = "warning";
      message = "Background-dependent · test QR on its final surface";
    } else if (ratio < 3 || logoRisk || dense) {
      level = "danger";
      message = "High scan risk · increase contrast, reduce logo size, or shorten content";
    } else if (ratio < 4.5 || data.length > 500) {
      level = "warning";
      message = `Good, but test before use · contrast ${ratio.toFixed(1)}:1`;
    }
    container.classList.add(level);
    output.textContent = message;
  };
  let qualityTimer;
  const scheduleQualityUpdate = () => {
    clearTimeout(qualityTimer);
    qualityTimer = setTimeout(updateQuality, 180);
  };

  const sensitiveIds = new Set([
    "wifi-password", "payment-pa", "payment-pn", "payment-am", "payment-tn",
    "bank-holder-name", "bank-ac-number", "bank-ac-confirm", "bank-name", "bank-branch", "bank-ifsc",
  ]);
  const draftKey = "qr-fusion-draft-v1";
  const collectDraft = () => {
    const fields = {};
    document.querySelectorAll("#form-container-wrapper input, #form-container-wrapper textarea, #form-container-wrapper select").forEach((field) => {
      if (!field.id || sensitiveIds.has(field.id) || field.type === "file" || field.type === "password") return;
      fields[field.id] = field.type === "checkbox" || field.type === "radio" ? field.checked : field.value;
    });
    return { fields, settings: collectSettings() };
  };
  let draftTimer;
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => localStorage.setItem(draftKey, JSON.stringify(collectDraft())), 250);
  }
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey));
      if (!draft) return;
      Object.entries(draft.fields || {}).forEach(([id, value]) => setValue(byId(id), value));
      applySettings(draft.settings || {}, false);
    } catch {
      localStorage.removeItem(draftKey);
    }
  };

  function collectSettings() {
    return {
      version: 1,
      size: controls.size.value,
      foreground: controls.foreground.value,
      background: controls.background.value,
      transparent: controls.transparent.checked,
      gradient: controls.gradient.checked,
      gradientColor: controls.gradientColor.value,
      gradientRotation: controls.gradientRotation.value,
      logoSize: controls.logoSize.value,
      logoMargin: controls.logoMargin.value,
      shape: controls.shape.value,
      frame: controls.frame.value,
      eye: controls.eye.value,
    };
  }
  function applySettings(settings, refresh = true) {
    setValue(controls.size, settings.size);
    setValue(controls.foreground, settings.foreground);
    setValue(controls.background, settings.background);
    setValue(controls.transparent, settings.transparent);
    setValue(controls.gradient, settings.gradient);
    setValue(controls.gradientColor, settings.gradientColor);
    setValue(controls.gradientRotation, settings.gradientRotation);
    setValue(controls.logoSize, settings.logoSize);
    setValue(controls.logoMargin, settings.logoMargin);
    setValue(controls.shape, settings.shape);
    setValue(controls.frame, settings.frame);
    setValue(controls.eye, settings.eye);
    controls.preset.value = "custom";
    refreshControlUI();
    if (refresh) app.refresh();
  }

  byId("export-settings-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(collectSettings(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-fusion-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  });
  byId("import-settings-input").addEventListener("change", async (event) => {
    try {
      const file = event.target.files[0];
      if (!file || file.size > 100000) throw new Error("Invalid settings file");
      const settings = JSON.parse(await file.text());
      if (settings.version !== 1) throw new Error("Unsupported settings version");
      applySettings(settings);
      saveDraft();
    } catch (error) {
      alert(error.message || "Could not import settings.");
    } finally {
      event.target.value = "";
    }
  });

  const seoContent = {
    text: ["Text & URL QR Code Generator", "Turn any website link or plain text into a customizable QR code.", "Use a complete HTTPS URL", "Keep important text concise", "Test the final design before publishing"],
    vcard: ["vCard QR Code Generator", "Share contact and business details with one quick scan.", "Add a recognizable full name", "Verify phone and email details", "Keep the logo small for reliable scanning"],
    wifi: ["Wi-Fi QR Code Generator", "Let guests join your Wi-Fi network without typing credentials.", "Choose the correct encryption type", "Network credentials stay in your browser", "Test on both Android and iPhone"],
    event: ["Event QR Code Generator", "Create a calendar-ready QR code with date, time, location, and notes.", "Check start and end times", "Use a clear location", "Scan-test with your preferred calendar app"],
    social: ["Social Media QR Code Generator", "Link directly to your social profile from print or digital media.", "Enter the correct username", "Choose the matching platform", "Use high contrast for posters"],
    appstore: ["App Store QR Code Generator", "Help users reach your app listing with a single scan.", "Use the full store URL", "Verify the destination", "Add your app logo carefully"],
    email: ["Email QR Code Generator", "Pre-fill a recipient, subject, and email message.", "Validate the recipient email", "Keep the subject concise", "Avoid putting sensitive data in QR codes"],
    sms: ["SMS QR Code Generator", "Open a ready-to-send text message after scanning.", "Include the country code", "Keep the message concise", "Test across mobile platforms"],
    location: ["Location QR Code Generator", "Share an address or direct map destination through a QR code.", "Prefer a verified map link", "Check address spelling", "Test navigation before printing"],
    payment: ["Payment QR Code Generator", "Create UPI or readable bank-detail QR codes locally in your browser.", "Verify every payment detail", "Test using the intended payment app", "Never publish private banking data accidentally"],
    phone: ["Phone Call QR Code Generator", "Let people open their dialer with your number pre-filled.", "Include the country code", "Use digits and an optional leading plus", "Test on a mobile device"],
    whatsapp: ["WhatsApp QR Code Generator", "Start a WhatsApp conversation with an optional pre-filled message.", "Enter the country code without plus", "Keep the greeting short", "Test the link before sharing"],
    review: ["Google Review QR Code Generator", "Send customers directly to your Google Business review screen.", "Use the direct HTTPS review link", "Test while signed out", "Place the QR where customers can scan easily"],
  };
  const seoSection = document.createElement("section");
  seoSection.className = "info-section slug-seo-section";
  seoSection.innerHTML = '<div class="info-content"><h2 id="slug-seo-title"></h2><p id="slug-seo-description"></p><ul id="slug-seo-tips"></ul></div>';
  byId("about-section").prepend(seoSection);
  const updateSeoContent = () => {
    const content = seoContent[app.getCurrentTab()] || seoContent.text;
    byId("slug-seo-title").textContent = content[0];
    byId("slug-seo-description").textContent = content[1];
    byId("slug-seo-tips").replaceChildren(...content.slice(2).map((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      return item;
    }));
  };

  document.querySelector(".tabs-container")?.addEventListener("click", () => setTimeout(() => {
    updateSeoContent();
    scheduleQualityUpdate();
  }));
  window.addEventListener("popstate", () => setTimeout(updateSeoContent));
  byId("form-container-wrapper").addEventListener("input", () => {
    saveDraft();
    scheduleQualityUpdate();
  });
  byId("customization-controls").addEventListener("input", saveDraft);

  const validateNewForms = () => {
    const phone = byId("phone-number").value.replace(/[\s()-]/g, "");
    byId("phone-status").textContent = phone && !/^\+?\d{7,15}$/.test(phone) ? "Enter a valid phone number." : "";
    const whatsapp = byId("whatsapp-number").value.replace(/\D/g, "");
    byId("whatsapp-status").textContent = whatsapp && (whatsapp.length < 7 || whatsapp.length > 15) ? "Enter a valid number with country code." : "";
    const review = byId("review-url").value.trim();
    byId("review-status").textContent = review && !/^https:\/\//i.test(review) ? "Use a complete HTTPS Google review link." : "";
  };
  ["phone-number", "whatsapp-number", "review-url"].forEach((id) => byId(id).addEventListener("input", validateNewForms));

  const mobilePreview = document.createElement("button");
  mobilePreview.type = "button";
  mobilePreview.className = "mobile-preview-dock";
  mobilePreview.setAttribute("aria-label", "Expand live QR preview");
  mobilePreview.innerHTML = '<span class="mobile-preview-dock-header"><span>Live preview</span><b>Expand</b></span><span class="mobile-preview-content"></span>';
  document.body.appendChild(mobilePreview);
  const previewSource = byId("qr-code-container");
  const previewCopy = mobilePreview.querySelector(".mobile-preview-content");
  const previewAction = mobilePreview.querySelector("b");
  let previewFrame;
  const syncMobilePreview = () => {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => {
      const visible = previewSource.style.display !== "none" && previewSource.children.length > 0;
      mobilePreview.classList.toggle("visible", visible);
      if (visible) previewCopy.innerHTML = previewSource.innerHTML;
    });
  };
  new MutationObserver(syncMobilePreview).observe(previewSource, {
    attributes: true,
    childList: true,
    subtree: true,
  });
  mobilePreview.addEventListener("click", () => {
    const expanded = mobilePreview.classList.toggle("expanded");
    previewAction.textContent = expanded ? "Minimize" : "Expand";
    mobilePreview.setAttribute("aria-label", `${expanded ? "Minimize" : "Expand"} live QR preview`);
  });

  const typeMeta = {
    text: ["Text & URL QR Code", "fa-solid fa-link"],
    vcard: ["vCard QR Code", "fa-solid fa-address-card"],
    wifi: ["Wi-Fi QR Code", "fa-solid fa-wifi"],
    event: ["Event QR Code", "fa-solid fa-calendar-days"],
    social: ["Social Media QR Code", "fa-solid fa-share-nodes"],
    appstore: ["App Store QR Code", "fa-brands fa-app-store-ios"],
    email: ["Email QR Code", "fa-solid fa-envelope"],
    sms: ["SMS QR Code", "fa-solid fa-comment-sms"],
    location: ["Location QR Code", "fa-solid fa-location-dot"],
    payment: ["Payment QR Code", "fa-solid fa-indian-rupee-sign"],
    phone: ["Phone Call QR Code", "fa-solid fa-phone"],
    whatsapp: ["WhatsApp QR Code", "fa-brands fa-whatsapp"],
    review: ["Google Review QR Code", "fa-solid fa-star"],
  };
  const activeType = typeMeta[app.getCurrentTab()] || typeMeta.text;
  byId("selected-type-name").textContent = activeType[0];
  byId("selected-type-icon").className = activeType[1];

  const flowSteps = [...document.querySelectorAll(".flow-progress span")];
  const inputHeading = document.querySelector(".left-column > .flow-heading");
  const inputActions = document.querySelector(".input-actions");
  const customization = document.querySelector(".customization-section");
  const rightColumn = document.querySelector(".right-column");
  const exportControls = document.querySelector(".export-controls");
  const exportHeading = document.querySelector(".export-step");
  let wizardStep = 1;

  const updateContinueState = () => {
    byId("to-customize-btn").disabled = !app.getData();
  };
  const showWizardStep = (step) => {
    wizardStep = step;
    document.body.dataset.wizardStep = String(step);
    flowSteps.forEach((item, index) => item.classList.toggle("active", index === step - 1));

    document.querySelector(".selected-type-card").classList.toggle("wizard-panel-hidden", step !== 1);
    inputHeading.classList.toggle("wizard-panel-hidden", step !== 1);
    byId("form-container-wrapper").classList.toggle("wizard-panel-hidden", step !== 1);
    inputActions.classList.toggle("wizard-panel-hidden", step !== 1);
    customization.classList.toggle("wizard-panel-hidden", step !== 2);
    document.querySelector(".left-column").classList.toggle("wizard-panel-hidden", step === 3);
    rightColumn.classList.toggle("wizard-panel-hidden", step === 1);
    exportControls.classList.toggle("wizard-panel-hidden", step !== 3);
    exportHeading.classList.toggle("wizard-panel-hidden", step !== 3);
    document.querySelector(".main-content").classList.toggle("export-only", step === 3);

    window.scrollTo({ top: document.querySelector(".main-container").offsetTop - 75, behavior: "smooth" });
    if (step === 2 || step === 3) syncMobilePreview();
  };

  byId("to-customize-btn").addEventListener("click", () => {
    if (app.getData()) showWizardStep(2);
  });
  byId("back-to-input-btn").addEventListener("click", () => showWizardStep(1));
  byId("to-export-btn").addEventListener("click", () => showWizardStep(3));
  byId("back-to-customize-btn").addEventListener("click", () => showWizardStep(2));
  byId("form-container-wrapper").addEventListener("input", () => setTimeout(updateContinueState, 180));

  restoreDraft();
  refreshControlUI();
  app.refresh();
  updateSeoContent();
  updateQuality();
  syncMobilePreview();
  updateContinueState();
  showWizardStep(1);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(console.error));
  }
});
