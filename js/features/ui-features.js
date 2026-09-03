document.addEventListener("DOMContentLoaded", () => {
  const generatorYear = document.getElementById("generator-current-year");
  if (generatorYear) generatorYear.textContent = new Date().getFullYear();
  const generatorMenuToggle = document.getElementById("generator-menu-toggle");
  const generatorSiteNav = document.getElementById("generator-site-nav");
  generatorMenuToggle?.addEventListener("click", () => {
    const isOpen = generatorSiteNav.classList.toggle("open");
    generatorMenuToggle.setAttribute("aria-expanded", String(isOpen));
    generatorMenuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    generatorMenuToggle.querySelector("i")?.classList.toggle("fa-bars", !isOpen);
    generatorMenuToggle.querySelector("i")?.classList.toggle("fa-xmark", isOpen);
  });
  generatorSiteNav?.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      generatorSiteNav.classList.remove("open");
      generatorMenuToggle?.setAttribute("aria-expanded", "false");
      generatorMenuToggle?.setAttribute("aria-label", "Open navigation");
      generatorMenuToggle?.querySelector("i")?.classList.add("fa-bars");
      generatorMenuToggle?.querySelector("i")?.classList.remove("fa-xmark");
    })
  );

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

  const formatDateEntry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };
  const formatTimeEntry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };
  const parseDisplayDate = (value) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
    return { day, month, year };
  };
  const parseDisplayTime = (value) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
    return { hour: match[1], minute: match[2] };
  };
  document.querySelectorAll(".date-picker-wrapper").forEach((wrapper) => {
    const dateInput = wrapper.querySelector(".event-date-display");
    const timeInput = wrapper.querySelector(".event-time-display");
    const nativeDateInput = wrapper.querySelector(".event-native-date");
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const error = wrapper.querySelector(".event-datetime-error");
    if (!dateInput || !timeInput || !nativeDateInput || !hiddenInput) return;
    const syncDateTime = () => {
      const date = parseDisplayDate(dateInput.value);
      const time = parseDisplayTime(timeInput.value);
      const hasPartialValue = Boolean(dateInput.value || timeInput.value);
      const valid = Boolean(date && time);
      hiddenInput.value = valid ? `${date.year}-${date.month}-${date.day}T${time.hour}:${time.minute}` : "";
      wrapper.querySelector(".event-datetime-control").classList.toggle("is-invalid", hasPartialValue && !valid);
      error.hidden = !hasPartialValue || valid;
      hiddenInput.dispatchEvent(new Event("input", { bubbles: true }));
    };
    dateInput.addEventListener("input", () => {
      dateInput.value = formatDateEntry(dateInput.value);
      syncDateTime();
    });
    timeInput.addEventListener("input", () => {
      timeInput.value = formatTimeEntry(timeInput.value);
      syncDateTime();
    });
    nativeDateInput.addEventListener("change", () => {
      if (!nativeDateInput.value) return;
      const [year, month, day] = nativeDateInput.value.split("-");
      dateInput.value = `${day}/${month}/${year}`;
      syncDateTime();
      timeInput.focus();
    });
  });

  const presets = {
    classic: { foreground: "#000000", background: "#ffffff", gradient: false, shape: "square", frame: "square", eye: "square" },
    ocean: { foreground: "#075985", background: "#ecfeff", gradient: true, gradientColor: "#0369a1", rotation: 45, shape: "square", frame: "square", eye: "square" },
    sunset: { foreground: "#7c2d12", background: "#fff7ed", gradient: true, gradientColor: "#be123c", rotation: 90, shape: "square", frame: "square", eye: "square" },
    forest: { foreground: "#14532d", background: "#f0fdf4", gradient: true, gradientColor: "#15803d", rotation: 135, shape: "square", frame: "square", eye: "square" },
    midnight: { foreground: "#e0e7ff", background: "#111827", gradient: true, gradientColor: "#a855f7", rotation: 45, shape: "square", frame: "square", eye: "square" },
    fusion: { foreground: "#4f2de4", background: "#faf7ff", gradient: true, gradientColor: "#e94b9a", rotation: 110, shape: "square", frame: "square", eye: "square" },
    berry: { foreground: "#701a75", background: "#fdf4ff", gradient: true, gradientColor: "#db2777", rotation: 45, shape: "square", frame: "square", eye: "square" },
  };

  const pickerSwatches = {
    custom: ["#5637df", "#e94b9a"], classic: ["#000000", "#ffffff"],
    ocean: ["#075985", "#67e8f9"], sunset: ["#7c2d12", "#fb7185"],
    forest: ["#14532d", "#4ade80"], midnight: ["#111827", "#a855f7"],
    fusion: ["#4f2de4", "#e94b9a"], berry: ["#701a75", "#db2777"],
  };

  const visualPickers = [...document.querySelectorAll(".visual-option-picker")];
  const popularPresets = new Set(["classic", "ocean", "sunset", "forest", "fusion"]);
  const syncVisualPickers = () => {
    visualPickers.forEach((picker) => {
      const select = byId(picker.dataset.select);
      picker.querySelectorAll(".visual-option").forEach((button) => {
        const selected = button.dataset.value === select.value;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    });
  };
  visualPickers.forEach((picker) => {
    const select = byId(picker.dataset.select);
    [...select.options].forEach((option) => {
      if (select === controls.preset && option.value === "custom") return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `visual-option ${select === controls.preset ? "preset-option" : ""}`;
      if (select === controls.preset && !popularPresets.has(option.value)) {
        button.classList.add("extra-preset");
      }
      button.dataset.value = option.value;
      if (select === controls.preset) {
        const colors = pickerSwatches[option.value];
        button.innerHTML = `<span class="preset-swatch" style="--swatch-a:${colors[0]};--swatch-b:${colors[1]}"></span><span>${option.text}</span>`;
      } else {
        button.innerHTML = `<span class="style-glyph ${option.value}" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${option.text}</span>`;
      }
      button.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        syncVisualPickers();
      });
      picker.appendChild(button);
    });
  });

  const presetPicker = document.querySelector('.preset-picker[data-select="preset-select"]');
  const morePresetsButton = byId("more-presets-btn");
  morePresetsButton.addEventListener("click", () => {
    const expanded = presetPicker.classList.toggle("show-more");
    morePresetsButton.setAttribute("aria-expanded", String(expanded));
    morePresetsButton.querySelector("span").textContent = expanded ? "Less" : "More";
  });

  const setValue = (element, value) => {
    if (!element || value === undefined) return;
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value;
  };

  const refreshControlUI = () => {
    const showGradient = controls.gradient.checked;
    byId("gradient-options").hidden = !showGradient;
    controls.background.disabled = controls.transparent.checked;
    controls.background.closest(".color-control-card").classList.toggle("control-disabled", controls.transparent.checked);
    byId("qr-code-container").classList.toggle(
      "transparent-preview",
      controls.transparent.checked
    );
    byId("color-fg-value").textContent = controls.foreground.value.toUpperCase();
    byId("color-bg-value").textContent = controls.background.value.toUpperCase();
    byId("gradient-color-value").textContent = controls.gradientColor.value.toUpperCase();
    byId("gradient-rotation-value").textContent = `${controls.gradientRotation.value}°`;
    byId("logo-size-value").textContent = `${controls.logoSize.value}%`;
    byId("logo-margin-value").textContent = `${controls.logoMargin.value}px`;
    [controls.gradientRotation, controls.logoSize, controls.logoMargin].forEach((control) => {
      const min = Number(control.min || 0);
      const max = Number(control.max || 100);
      const progress = ((Number(control.value) - min) / (max - min)) * 100;
      control.style.setProperty("--range-progress", `${progress}%`);
    });
    byId("custom-design-status").hidden = controls.preset.value !== "custom";
    syncVisualPickers();
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
  [controls.foreground, controls.background, controls.shape, controls.frame, controls.eye].forEach((control) => {
    control.addEventListener("input", () => {
      controls.preset.value = "custom";
      refreshControlUI();
    });
  });
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

  byId("form-container-wrapper").addEventListener("input", () => {
    saveDraft();
    scheduleQualityUpdate();
  });
  byId("customization-controls").addEventListener("input", saveDraft);

  const logoInput = byId("logo-upload");
  const logoUploadTitle = byId("logo-upload-title");
  const logoFileName = byId("logo-file-name");
  const logoUploadIcon = document.querySelector(".logo-upload-icon i");
  const logoControls = byId("logo-controls");
  const removeLogoButton = byId("remove-logo-btn");
  const updateLogoUploadUI = () => {
    const file = logoInput.files[0];
    logoUploadTitle.textContent = file ? "Logo selected" : "Choose a logo";
    logoFileName.textContent = file ? file.name : "PNG, JPG, WebP or SVG";
    document.querySelector(".logo-upload-card").classList.toggle("has-file", Boolean(file));
    logoUploadIcon.className = file ? "fa-solid fa-circle-check" : "fa-solid fa-cloud-arrow-up";
    removeLogoButton.hidden = !file;
    logoControls.hidden = !file;
  };
  logoInput.addEventListener("change", updateLogoUploadUI);
  removeLogoButton.addEventListener("click", () => requestAnimationFrame(updateLogoUploadUI));
  byId("reset-customization-btn").addEventListener("click", () => requestAnimationFrame(updateLogoUploadUI));
  updateLogoUploadUI();

  const validateNewForms = () => {
    const phone = byId("phone-number").value.replace(/[\s()-]/g, "");
    byId("phone-status").textContent = phone && !/^\+?\d{7,15}$/.test(phone) ? "Enter a valid phone number." : "";
    const whatsapp = byId("whatsapp-number").value.replace(/\D/g, "");
    byId("whatsapp-status").textContent = whatsapp && (whatsapp.length < 7 || whatsapp.length > 15) ? "Enter a valid number with country code." : "";
    const review = byId("review-url").value.trim();
    byId("review-status").textContent = review && !/^https:\/\//i.test(review) ? "Use a complete HTTPS Google review link." : "";
  };
  ["phone-number", "whatsapp-number", "review-url"].forEach((id) => byId(id).addEventListener("input", validateNewForms));

  const mobilePreview = document.createElement("div");
  mobilePreview.className = "mobile-preview-dock";
  mobilePreview.setAttribute("role", "group");
  mobilePreview.setAttribute("aria-label", "Movable live QR preview");
  mobilePreview.title = "Drag to move · Tap to expand";
  mobilePreview.innerHTML = `
    <div class="mobile-preview-dock-header">
      <span>Live preview</span>
      <button type="button" class="mobile-preview-toggle" aria-label="Expand live QR preview">Expand</button>
    </div>
    <div class="mobile-preview-content"></div>
    <div class="mobile-preview-guide-rail">
      <button type="button" class="mobile-preview-info" aria-label="Show preview movement help" aria-expanded="false" title="How to move the preview"><i class="fa-solid fa-info" aria-hidden="true"></i></button>
      <span class="mobile-preview-guide-message" role="status">You can drag your QR anywhere.</span>
    </div>`;
  document.body.appendChild(mobilePreview);
  const previewSource = byId("qr-code-container");
  const previewCopy = mobilePreview.querySelector(".mobile-preview-content");
  const previewAction = mobilePreview.querySelector(".mobile-preview-toggle");
  const previewInfo = mobilePreview.querySelector(".mobile-preview-info");
  const previewGuide = mobilePreview.querySelector(".mobile-preview-guide-rail");
  const mobilePreviewQuery = window.matchMedia("(max-width: 900px)");
  let previewFrame;
  let previewGuideTimer;
  let previewAutoMoveTimer;
  let previewOnboardingShown = false;
  const syncMobilePreview = () => {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => {
      const visible = previewSource.style.display !== "none" && previewSource.children.length > 0;
      const prepareOnboarding = visible && !previewOnboardingShown && mobilePreviewQuery.matches && document.body.dataset.wizardStep === "2";
      mobilePreview.classList.toggle("preparing", prepareOnboarding);
      mobilePreview.classList.toggle("visible", visible);
      if (visible) {
        previewCopy.innerHTML = previewSource.innerHTML;
        requestAnimationFrame(() => {
          if (prepareOnboarding) startPreviewOnboarding();
          else keepPreviewInViewport();
        });
      }
    });
  };
  new MutationObserver(syncMobilePreview).observe(previewSource, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  const previewPositionKey = "qr-fusion-mobile-preview-position";
  const previewEdgeGap = 8;
  const setPreviewPosition = (left, top) => {
    mobilePreview.style.left = `${left}px`;
    mobilePreview.style.top = `${top}px`;
    mobilePreview.style.right = "auto";
    mobilePreview.style.bottom = "auto";
  };
  const updatePreviewGuideSide = () => {
    const rect = mobilePreview.getBoundingClientRect();
    const requiredWidth = previewGuide.classList.contains("show-guide") ? 220 : 44;
    previewGuide.classList.toggle("guide-left", window.innerWidth - rect.right < requiredWidth && rect.left >= requiredWidth);
  };
  const keepPreviewInViewport = () => {
    if (!mobilePreviewQuery.matches || !mobilePreview.classList.contains("visible")) return;
    const rect = mobilePreview.getBoundingClientRect();
    const maxLeft = Math.max(previewEdgeGap, window.innerWidth - rect.width - previewEdgeGap);
    const maxTop = Math.max(previewEdgeGap, window.innerHeight - rect.height - previewEdgeGap);
    const left = Math.min(maxLeft, Math.max(previewEdgeGap, rect.left));
    const top = Math.min(maxTop, Math.max(previewEdgeGap, rect.top));
    setPreviewPosition(left, top);
    updatePreviewGuideSide();
  };
  const showPreviewGuide = () => {
    clearTimeout(previewGuideTimer);
    previewGuide.classList.add("show-guide");
    previewInfo.setAttribute("aria-expanded", "true");
    updatePreviewGuideSide();
    previewGuideTimer = setTimeout(() => {
      previewGuide.classList.remove("show-guide");
      previewInfo.setAttribute("aria-expanded", "false");
      updatePreviewGuideSide();
    }, 5000);
  };
  const placePreviewInCenter = () => {
    const rect = mobilePreview.getBoundingClientRect();
    setPreviewPosition(previewEdgeGap, (window.innerHeight - rect.height) / 2);
    keepPreviewInViewport();
  };
  const movePreviewToSuggestedPosition = () => {
    const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom || 66;
    setPreviewPosition(previewEdgeGap, headerBottom + previewEdgeGap);
    keepPreviewInViewport();
    localStorage.setItem(previewPositionKey, JSON.stringify({
      left: parseFloat(mobilePreview.style.left),
      top: parseFloat(mobilePreview.style.top),
    }));
  };
  const startPreviewOnboarding = () => {
    if (previewOnboardingShown || !mobilePreviewQuery.matches || document.body.dataset.wizardStep !== "2") return;
    previewOnboardingShown = true;
    placePreviewInCenter();
    mobilePreview.getBoundingClientRect();
    mobilePreview.classList.remove("preparing");
    showPreviewGuide();
    clearTimeout(previewAutoMoveTimer);
    previewAutoMoveTimer = setTimeout(movePreviewToSuggestedPosition, 5000);
  };
  const restorePreviewPosition = () => {
    try {
      const savedPosition = JSON.parse(localStorage.getItem(previewPositionKey));
      if (!Number.isFinite(savedPosition?.left) || !Number.isFinite(savedPosition?.top)) return;
      setPreviewPosition(savedPosition.left, savedPosition.top);
    } catch {
      localStorage.removeItem(previewPositionKey);
    }
  };
  restorePreviewPosition();

  let previewDrag = null;
  let suppressPreviewClick = false;
  mobilePreview.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest(".mobile-preview-info, .mobile-preview-toggle")) return;
    clearTimeout(previewAutoMoveTimer);
    const rect = mobilePreview.getBoundingClientRect();
    previewDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      moved: false,
    };
    setPreviewPosition(rect.left, rect.top);
    mobilePreview.setPointerCapture(event.pointerId);
  });
  mobilePreview.addEventListener("pointermove", (event) => {
    if (!previewDrag || event.pointerId !== previewDrag.pointerId) return;
    const deltaX = event.clientX - previewDrag.startX;
    const deltaY = event.clientY - previewDrag.startY;
    if (!previewDrag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    previewDrag.moved = true;
    suppressPreviewClick = true;
    mobilePreview.classList.add("dragging");
    const rect = mobilePreview.getBoundingClientRect();
    const maxLeft = Math.max(previewEdgeGap, window.innerWidth - rect.width - previewEdgeGap);
    const maxTop = Math.max(previewEdgeGap, window.innerHeight - rect.height - previewEdgeGap);
    mobilePreview.style.left = `${Math.min(maxLeft, Math.max(previewEdgeGap, previewDrag.startLeft + deltaX))}px`;
    mobilePreview.style.top = `${Math.min(maxTop, Math.max(previewEdgeGap, previewDrag.startTop + deltaY))}px`;
    updatePreviewGuideSide();
    event.preventDefault();
  });
  const finishPreviewDrag = (event) => {
    if (!previewDrag || event.pointerId !== previewDrag.pointerId) return;
    if (mobilePreview.hasPointerCapture(event.pointerId)) mobilePreview.releasePointerCapture(event.pointerId);
    if (previewDrag.moved) {
      localStorage.setItem(previewPositionKey, JSON.stringify({
        left: parseFloat(mobilePreview.style.left),
        top: parseFloat(mobilePreview.style.top),
      }));
    }
    previewDrag = null;
    mobilePreview.classList.remove("dragging");
    setTimeout(() => { suppressPreviewClick = false; }, 0);
  };
  mobilePreview.addEventListener("pointerup", finishPreviewDrag);
  mobilePreview.addEventListener("pointercancel", finishPreviewDrag);
  window.addEventListener("resize", keepPreviewInViewport);

  const toggleMobilePreview = () => {
    if (suppressPreviewClick) return;
    const expanded = mobilePreview.classList.toggle("expanded");
    previewAction.textContent = expanded ? "Minimize" : "Expand";
    previewAction.setAttribute("aria-label", `${expanded ? "Minimize" : "Expand"} live QR preview`);
    requestAnimationFrame(keepPreviewInViewport);
  };
  previewAction.addEventListener("click", toggleMobilePreview);
  previewCopy.addEventListener("click", toggleMobilePreview);
  previewInfo.addEventListener("click", (event) => {
    event.stopPropagation();
    showPreviewGuide();
  });

  const flowSteps = [...document.querySelectorAll(".flow-progress span")];
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
  const textInput = byId("text-input");
  const textCharacterCount = byId("text-character-count");
  const textInputError = byId("text-input-error");
  const clearTextButton = byId("clear-text-btn");
  const pasteTextButton = byId("paste-text-btn");

  const getTextContentSummary = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "";

    let contentType = "Plain text";
    try {
      const parsedUrl = new URL(trimmedValue);
      if (["http:", "https:"].includes(parsedUrl.protocol)) contentType = "Website URL";
    } catch {
      if (trimmedValue.includes("\n") || trimmedValue.length > 80) contentType = "Message";
    }

    const density = trimmedValue.length <= 120
      ? "Short content"
      : trimmedValue.length <= 500
        ? "Medium density"
        : "Dense QR";
    return `${contentType} · ${density}`;
  };

  const resizeTextInput = () => {
    const maximumHeight = 280;
    textInput.style.height = "auto";
    textInput.style.height = `${Math.min(Math.max(textInput.scrollHeight, 160), maximumHeight)}px`;
    textInput.style.overflowY = textInput.scrollHeight > maximumHeight ? "auto" : "hidden";
  };

  const updateTextInputUX = (showEmptyError = false) => {
    const value = textInput.value;
    const isEmpty = !value.trim();
    const contentSummary = getTextContentSummary(value);
    textCharacterCount.textContent = `${value.length} ${value.length === 1 ? "character" : "characters"}${contentSummary ? ` · ${contentSummary}` : ""}`;
    clearTextButton.disabled = value.length === 0;
    if (showEmptyError && isEmpty) {
      textInputError.textContent = "Please enter something to generate your QR code.";
    }
    textInputError.hidden = !(showEmptyError && isEmpty);
    textInput.setAttribute("aria-invalid", String(showEmptyError && isEmpty));
    resizeTextInput();
    updateContinueState();
  };

  textInput.addEventListener("input", () => updateTextInputUX(false));
  textInput.addEventListener("blur", () => updateTextInputUX(true));
  clearTextButton.addEventListener("click", () => {
    textInput.value = "";
    textInput.dispatchEvent(new Event("input", { bubbles: true }));
    textInput.focus();
  });
  pasteTextButton.addEventListener("click", async () => {
    try {
      textInput.value = await navigator.clipboard.readText();
      textInput.dispatchEvent(new Event("input", { bubbles: true }));
      textInput.focus();
    } catch {
      textInputError.textContent = "Clipboard access is unavailable. Please paste manually.";
      textInputError.hidden = false;
      textInput.focus();
    }
  });
  byId("form-container-wrapper").addEventListener("input", updateContinueState);

  restoreDraft();
  if (app.getCurrentTab() === "text") textInput.value = "";
  refreshControlUI();
  app.refresh();
  updateQuality();
  syncMobilePreview();
  updateContinueState();
  updateTextInputUX(false);
  showWizardStep(1);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(console.error));
  }
});
