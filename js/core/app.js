const { jsPDF } = window.jspdf;

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const themeToggle = document.getElementById("theme-toggle");
  const tabs = document.querySelectorAll(".tab");
  const formWrapper = document.getElementById("form-container-wrapper");
  const formsTemplate = document.getElementById("forms-template");

  if (formsTemplate) {
    formWrapper.appendChild(formsTemplate.content.cloneNode(true));
  }

  const qrCodeContainer = document.getElementById("qr-code-container");
  const qrPlaceholder = document.getElementById("qr-code-placeholder");

  const downloadPngBtn = document.getElementById("download-png-btn");
  const downloadJpegBtn = document.getElementById("download-jpeg-btn");
  const downloadPdfBtn = document.getElementById("download-pdf-btn");
  const downloadAllBtn = document.getElementById("download-all-btn");

  const paymentTypeRadios = document.querySelectorAll(
    'input[name="payment-type"]'
  );
  const upiFields = document.getElementById("upi-fields");
  const bankFields = document.getElementById("bank-fields");

  const bankAcNumberInput = document.getElementById("bank-ac-number");
  const bankAcConfirmInput = document.getElementById("bank-ac-confirm");
  const bankAcStatus = document.getElementById("bank-ac-status");

  // Customization inputs
  const sizeInput = document.getElementById("size-input");
  const fgColorInput = document.getElementById("color-fg");
  const bgColorInput = document.getElementById("color-bg");
  const shapeStyleSelect = document.getElementById("shape-style");
  const borderStyleSelect = document.getElementById("border-style");
  const centerStyleSelect = document.getElementById("center-style");
  const logoInput = document.getElementById("logo-upload");
  const removeLogoBtn = document.getElementById("remove-logo-btn");
  const resetCustomizationBtn = document.getElementById(
    "reset-customization-btn"
  );

  const wifiPasswordInput = document.getElementById("wifi-password");
  const toggleWifiPasswordBtn = document.getElementById("toggle-wifi-password");

  // --- Configuration & State ---
  const CONFIG = {
    pincodeApiUrl: "https://api.postalpincode.in/pincode/",
    websiteUrl: "qrfusion.netlify.app",
    placeholderData: "https://qrfusion.netlify.app",
  };

  const PAGE_CONFIG = {
    text: {
      path: "/text",
      title: "Free Text & URL QR Code Generator | QR Fusion",
      description: "Create a free custom QR code for any text or URL. Customize colors, shapes, size, and logo, then download it instantly.",
    },
    vcard: {
      path: "/vcard",
      title: "Free vCard QR Code Generator | QR Fusion",
      description: "Create a customizable vCard QR code for contact details, phone numbers, email, address, and business information.",
    },
    wifi: {
      path: "/wifi",
      title: "Free Wi-Fi QR Code Generator | QR Fusion",
      description: "Create a Wi-Fi QR code so guests can securely join your network by scanning instead of typing the password.",
    },
    event: {
      path: "/event",
      title: "Free Event QR Code Generator | QR Fusion",
      description: "Create an event QR code with title, date, time, location, and description for quick calendar access.",
    },
    social: {
      path: "/social",
      title: "Free Social Media QR Code Generator | QR Fusion",
      description: "Create a custom QR code for Instagram, Facebook, LinkedIn, YouTube, TikTok, X, or Pinterest profiles.",
    },
    youtube: {
      path: "/youtube",
      title: "Free YouTube QR Code Generator | QR Fusion",
      description: "Create a custom QR code that opens a YouTube video, Short, playlist, or channel instantly.",
    },
    appstore: {
      path: "/app-store",
      title: "Free App Store QR Code Generator | QR Fusion",
      description: "Create a QR code for an Apple App Store or Google Play link and help users reach your app instantly.",
    },
    email: {
      path: "/email",
      title: "Free Email QR Code Generator | QR Fusion",
      description: "Create an email QR code with a recipient, subject, and message body for quick email composition.",
    },
    sms: {
      path: "/sms",
      title: "Free SMS QR Code Generator | QR Fusion",
      description: "Create a customizable SMS QR code with a phone number and pre-filled text message.",
    },
    location: {
      path: "/location",
      title: "Free Location QR Code Generator | QR Fusion",
      description: "Create a location QR code from an address or Google Maps link for fast and convenient navigation.",
    },
    payment: {
      path: "/payment",
      title: "Free Payment QR Code Generator | QR Fusion",
      description: "Create a QR code for UPI payment details or bank account information with custom styling.",
    },
    phone: {
      path: "/phone",
      title: "Free Phone Call QR Code Generator | QR Fusion",
      description: "Create a phone call QR code that opens the dialer with your number ready to call.",
    },
    login: {
      path: "/login-qr",
      title: "Login QR and Passkey Link Generator | QR Fusion",
      description: "Create a QR code for a secure passwordless sign-in or passkey URL.",
    },
    whatsapp: {
      path: "/whatsapp",
      title: "Free WhatsApp QR Code Generator | QR Fusion",
      description: "Create a WhatsApp QR code with a phone number and optional pre-filled message.",
    },
    review: {
      path: "/google-review",
      title: "Free Google Review QR Code Generator | QR Fusion",
      description: "Create a Google Review QR code that takes customers directly to your business review page.",
    },
  };

  const HOME_PAGE = {
    path: "/",
    title: "QR Fusion - Free & Advanced QR Code Generator",
    description:
      "Create free custom QR codes for URLs, contacts, Wi-Fi, events, social profiles, email, SMS, locations, and payments.",
  };
  const GENERATOR_PAGE = {
    path: "/create",
    title: "Create a Custom QR Code | QR Fusion",
    description:
      "Choose a QR type, enter your content, customize the design, then copy, share or download your QR code.",
  };

  const normalizePath = (path) =>
    path.length > 1 ? path.replace(/\/+$/, "").toLowerCase() : path;
  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(
    window.location.hostname
  );
  const getTabFromPath = () => {
    const localTab = new URLSearchParams(window.location.search).get("type");
    if (localTab && PAGE_CONFIG[localTab]) return localTab;

    const path = normalizePath(window.location.pathname);
    if (path === "/") return "text";
    return (
      Object.entries(PAGE_CONFIG).find(([, page]) => page.path === path)?.[0] ||
      "text"
    );
  };
  const updatePageMetadata = (tabName) => {
    const isHomepage =
      normalizePath(window.location.pathname) === "/" &&
      !new URLSearchParams(window.location.search).has("type");
    const normalizedPath = normalizePath(window.location.pathname);
    const isGeneratorHome =
      !new URLSearchParams(window.location.search).has("type") &&
      ["/create", "/generator.html"].includes(normalizedPath);
    const page =
      isHomepage ? HOME_PAGE : isGeneratorHome ? GENERATOR_PAGE : PAGE_CONFIG[tabName];
    if (!page) return;
    document.title = page.title;
    document.getElementById("page-description")?.setAttribute("content", page.description);
    document
      .getElementById("canonical-url")
      ?.setAttribute("href", `https://${CONFIG.websiteUrl}${page.path}`);
  };

  if (wifiPasswordInput && toggleWifiPasswordBtn) {
    toggleWifiPasswordBtn.addEventListener("click", () => {
      const isPassword = wifiPasswordInput.type === "password";
      wifiPasswordInput.type = isPassword ? "text" : "password";
      toggleWifiPasswordBtn.textContent = isPassword ? "Hide" : "Show";
    });
  }

  let currentTab = getTabFromPath();
  let logoImage = null;
  let emailValidationTimeout;
  const PREVIEW_SIZE = 240;
  const getQuietZone = (size) => Math.max(8, Math.round(size / 12));
  const PREVIEW_MARGIN = getQuietZone(PREVIEW_SIZE);

  const qrCodeInstance = new QRCodeStyling({
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    margin: PREVIEW_MARGIN,
    type: "svg",
    data: CONFIG.placeholderData,
    imageOptions: { crossOrigin: "anonymous", margin: 10 },
  });

  if (qrCodeContainer) qrCodeInstance.append(qrCodeContainer);
  const setPreviewSvgViewport = (size = PREVIEW_SIZE) => {
    const svg = qrCodeContainer?.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  };
  requestAnimationFrame(() => setPreviewSvgViewport());

  fgColorInput.value = "#000000";
  bgColorInput.value = "#ffffff";

  // --- THEME ---
  const applyTheme = (theme) => {
    document.body.classList.toggle("dark-theme", theme === "dark");
  };

  // Always start in light theme unless user toggles manually
  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    savedTheme = "light";
    localStorage.setItem("theme", "light");
  }

  applyTheme(savedTheme);
  if (themeToggle) {
    themeToggle.checked = savedTheme === "dark";
    themeToggle.addEventListener("change", () => {
      const newTheme = themeToggle.checked ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    });
  }

  // --- Helpers ---
  const getInputValue = (id) => document.getElementById(id)?.value.trim() || "";

  const setInputValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  };

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const escapeVCard = (value) =>
    value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
  const escapeWifi = (value) => value.replace(/([\\;,:"])/g, "\\$1");
  const escapeICS = (value) =>
    value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
  const isValidHttpUrl = (value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  };

  const fetchAddressFromPincode = async (pincode, prefix) => {
    const statusEl = document.getElementById(`${prefix}-address-status`);
    statusEl.textContent = "";
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) return;

    statusEl.textContent = "Retrieving address details…";
    statusEl.className = "status-text info";

    try {
      const response = await fetch(`${CONFIG.pincodeApiUrl}${pincode}`);
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();

      if (Array.isArray(data) && data[0]?.Status === "Success") {
        const po = data[0].PostOffice[0];

        setInputValue(`${prefix}-area`, po.Name);
        setInputValue(`${prefix}-city`, po.District);
        setInputValue(`${prefix}-state`, po.State);
        setInputValue(`${prefix}-country`, po.Country);

        statusEl.textContent = "Address details retrieved successfully.";
        statusEl.className = "status-text success";
        updateQRCode();
      } else {
        statusEl.textContent =
          data[0]?.Message || "Invalid PIN code. Please verify and try again.";
        statusEl.className = "status-text warning"; // Changed to warning for invalid input
      }
    } catch (error) {
      statusEl.textContent =
        "Unable to fetch address details. Please try later.";
      statusEl.className = "status-text error";
    } finally {
      setTimeout(() => {
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.className = "status-text";
        }
      }, 5000);
    }
  };

  const showQRCode = (isGenerated) => {
    qrPlaceholder.style.display = isGenerated ? "none" : "flex";
    qrCodeContainer.style.display = isGenerated ? "block" : "none";
    downloadPngBtn.disabled = !isGenerated;
    downloadJpegBtn.disabled = !isGenerated;
    downloadPdfBtn.disabled = !isGenerated;
    downloadAllBtn.disabled = !isGenerated;
    ["download-svg-btn", "copy-qr-btn", "share-qr-btn"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.disabled = !isGenerated;
    });
  };
  const hideAllForms = () =>
    document
      .querySelectorAll(".form-container")
      .forEach((c) => (c.style.display = "none"));
  const showForm = (tabName) => {
    hideAllForms();
    const form = document.getElementById(`${tabName}-form`);
    if (form)
      form.style.display = form.classList.contains("grid-form")
        ? "grid"
        : "block";
  };
  const updateRemoveButtonState = () => {
    if (logoInput && removeLogoBtn)
      removeLogoBtn.disabled = logoInput.files.length === 0;
  };

  // --- QR Data Generator with required field checks ---
  const generateQRData = () => {
    switch (currentTab) {
      case "text": {
        const text = getInputValue("text-input");
        return text ? text : "";
      }
      case "vcard": {
        const name = getInputValue("vcard-name");
        if (!name) return "";
        return `BEGIN:VCARD
VERSION:3.0
FN:${escapeVCard(name)}
ORG:${escapeVCard(getInputValue("vcard-org"))}
TITLE:${escapeVCard(getInputValue("vcard-title"))}
TEL:${escapeVCard(getInputValue("vcard-tel"))}
EMAIL:${escapeVCard(getInputValue("vcard-email"))}
ADR:;;${escapeVCard([getInputValue("vcard-house"), getInputValue("vcard-building"), getInputValue("vcard-street"), getInputValue("vcard-area")].filter(Boolean).join(", "))};${escapeVCard(getInputValue(
          "vcard-city"
        ))};${escapeVCard(getInputValue("vcard-state"))};${escapeVCard(getInputValue(
          "vcard-postal"
        ))};${escapeVCard(getInputValue("vcard-country"))}
URL:${escapeVCard(getInputValue("vcard-url"))}
NOTE:${escapeVCard([getInputValue("vcard-note"), getInputValue("vcard-map")].filter(Boolean).join(" | "))}
END:VCARD`;
      }
      case "wifi": {
        const ssid = getInputValue("wifi-ssid");
        if (!ssid) return "";
        return `WIFI:T:${escapeWifi(getInputValue(
          "wifi-encryption"
        ))};S:${escapeWifi(ssid)};P:${escapeWifi(getInputValue("wifi-password"))};;`;
      }
      case "event": {
        const title = getInputValue("event-title");
        const start = getInputValue("event-start");
        if (!title || !start) return "";

        const end = getInputValue("event-end");
        if (end && new Date(end) <= new Date(start)) return "";
        const location = getInputValue("event-location");
        const description = getInputValue("event-description");

        // Convert datetime-local → ICS format (local time, no Z)
        function toICSLocal(dt) {
          if (!dt) return "";
          const date = new Date(dt);
          const pad = (n) => String(n).padStart(2, "0");
          return (
            date.getFullYear() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            "T" +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds())
          );
        }

        return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${escapeICS(title)}
DTSTART:${toICSLocal(start)}
${end ? `DTEND:${toICSLocal(end)}` : ""}
${location ? `LOCATION:${escapeICS(location)}` : ""}
${description ? `DESCRIPTION:${escapeICS(description)}` : ""}
END:VEVENT
END:VCALENDAR`;
      }

      case "social": {
        let handle = getInputValue("social-handle");
        if (!handle) return "";
        const platform = getInputValue("social-platform");

        // Remove the '@' if the user types it, to prevent duplicates
        if (handle.startsWith("@")) {
          handle = handle.substring(1);
        }

        const urls = {
          twitter: `https://twitter.com/${encodeURIComponent(handle)}`,
          instagram: `https://instagram.com/${encodeURIComponent(handle)}`,
          facebook: `https://facebook.com/${encodeURIComponent(handle)}`,
          linkedin: `https://linkedin.com/in/${encodeURIComponent(handle)}`,
          tiktok: `https://tiktok.com/@${encodeURIComponent(handle)}`,
          youtube: `https://youtube.com/@${encodeURIComponent(handle)}`,
          pinterest: `https://pinterest.com/${encodeURIComponent(handle)}`,
        };
        return urls[platform] || "";
      }
      case "youtube": {
        const url = getInputValue("youtube-url");
        if (!isValidHttpUrl(url)) return "";
        try {
          const hostname = new URL(url).hostname.toLowerCase();
          const isYouTubeUrl = hostname === "youtu.be" || hostname === "youtube.com" || hostname.endsWith(".youtube.com");
          return isYouTubeUrl ? url : "";
        } catch {
          return "";
        }
      }
      case "appstore": {
        const platform = document.querySelector('input[name="appstore-platform"]:checked')?.value || "google";
        const url = getInputValue(platform === "apple" ? "appstore-apple-url" : "appstore-google-url");
        if (!isValidHttpUrl(url)) return "";
        try {
          const hostname = new URL(url).hostname.toLowerCase();
          const isMatchingStore = platform === "apple"
            ? hostname === "apps.apple.com" || hostname.endsWith(".apps.apple.com")
            : hostname === "play.google.com" || hostname.endsWith(".play.google.com");
          return isMatchingStore ? url : "";
        } catch {
          return "";
        }
      }
      case "email": {
        const to = getInputValue("email-to");
        // If the email is not empty AND it's invalid, return nothing.
        if (to && !isValidEmail(to)) {
          return "";
        }
        if (!to) return "";
        return `mailto:${to}?subject=${encodeURIComponent(
          getInputValue("email-subject")
        )}&body=${encodeURIComponent(getInputValue("email-body"))}`;
      }
      case "sms": {
        const to = getInputValue("sms-to");
        if (!to) return "";
        return `SMSTO:${to.replace(/:/g, "")}:${getInputValue("sms-body").replace(/:/g, "\\:")}`;
      }
      case "phone": {
        const phone = getInputValue("phone-number").replace(/[\s()-]/g, "");
        return /^\+?\d{7,15}$/.test(phone) ? `tel:${phone}` : "";
      }
      case "login": {
        const url = getInputValue("login-url");
        try {
          const parsed = new URL(url);
          return parsed.protocol === "https:" ? parsed.href : "";
        } catch {
          return "";
        }
      }
      case "whatsapp": {
        const phone = getInputValue("whatsapp-number").replace(/\D/g, "");
        if (phone.length < 7 || phone.length > 15) return "";
        const message = getInputValue("whatsapp-message");
        return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
      }
      case "review": {
        const url = getInputValue("review-url");
        try {
          const parsed = new URL(url);
          return parsed.protocol === "https:" ? parsed.href : "";
        } catch {
          return "";
        }
      }
      case "location": {
        const mapLink = getInputValue("loc-map");
        if (mapLink) return isValidHttpUrl(mapLink) ? mapLink : "";

        // Combine all the new address fields into a single search query
        const addressParts = [
          getInputValue("loc-house"),
          getInputValue("loc-building"),
          getInputValue("loc-street"),
          getInputValue("loc-area"),
          getInputValue("loc-city"),
          getInputValue("loc-state"),
          getInputValue("loc-country"),
          getInputValue("loc-postal"),
          getInputValue("loc-additional-info"), // Added the new field
        ];

        const fullAddress = addressParts.filter((part) => part).join(", ");

        if (!fullAddress) return "";

        // Use the combined address in the geo URI
        return `geo:0,0?q=${encodeURIComponent(fullAddress)}`;
      }
      case "payment": {
        const paymentType = document.querySelector(
          'input[name="payment-type"]:checked'
        )?.value;
        if (paymentType === "upi") {
          const upi = getInputValue("payment-pa");
          if (!upi) return "";
          if (!/^[\w.-]+@[\w.-]+$/.test(upi)) return "";
          const params = new URLSearchParams({ pa: upi });
          const payee = getInputValue("payment-pn");
          const amount = getInputValue("payment-am");
          const note = getInputValue("payment-tn");
          if (payee) params.set("pn", payee);
          if (amount) params.set("am", amount);
          if (note) params.set("tn", note);
          return `upi://pay?${params.toString()}`;
        } else {
          const account = getInputValue("bank-ac-number");
          const confirmAcc = getInputValue("bank-ac-confirm");
          if (!account || !confirmAcc || !checkBankAccountMatch()) return "";

          return `Account Holder: ${getInputValue("bank-holder-name")}
Account Number: ${account}
Bank: ${getInputValue("bank-name")}
Branch: ${getInputValue("bank-branch")}
IFSC/SWIFT: ${getInputValue("bank-ifsc")}`;
        }
      }
    }
    return "";
  };

  // --- Bank account number match check ---
  const checkBankAccountMatch = () => {
    const accNum = bankAcNumberInput.value.trim();
    const accConfirm = bankAcConfirmInput.value.trim();

    if (accNum && accConfirm && accNum !== accConfirm) {
      bankAcStatus.textContent = "Account numbers do not match!";
      bankAcStatus.className = "status-text error";
      return false;
    } else if (accNum && accConfirm && accNum === accConfirm) {
      bankAcStatus.textContent = "Account numbers match";
      bankAcStatus.className = "status-text success";
      return true;
    } else {
      bankAcStatus.textContent = "";
      bankAcStatus.className = "status-text";
      return false;
    }
  };

  bankAcNumberInput.addEventListener("input", () => {
    checkBankAccountMatch();
    scheduleUpdate();
  });
  bankAcConfirmInput.addEventListener("input", () => {
    checkBankAccountMatch();
    scheduleUpdate();
  });

  // --- QR Update ---
  const updateQRCode = () => {
    clearTimeout(emailValidationTimeout);

    if (currentTab === "email" || currentTab === "vcard") {
      const isVCardTab = currentTab === "vcard";
      const emailInputId = isVCardTab ? "vcard-email" : "email-to";
      const emailErrorId = isVCardTab
        ? "vcard-email-status"
        : "email-error-message";

      const emailInput = document.getElementById(emailInputId);
      const emailError = document.getElementById(emailErrorId);

      if (emailInput && emailError) {
        const emailValue = emailInput.value.trim();

        if (emailValue && !isValidEmail(emailValue)) {
          // Set the error message, but DO NOT start a timer
          emailError.textContent = "Please enter a valid email address.";
          emailError.className = "error-message";
        } else if (emailValue && isValidEmail(emailValue)) {
          // Set the success message
          emailError.textContent = "Email format is valid.";
          emailError.className = "status-text success";

          // ONLY start the auto-hide timer on success
          emailValidationTimeout = setTimeout(() => {
            emailError.textContent = "";
            emailError.className = "error-message";
          }, 5000);
        } else {
          // Clear any message if the input is empty
          emailError.textContent = "";
        }
      }
    }
    // --- END OF NEW CODE ---

    const qrData = generateQRData();
    const hasData = !!qrData.trim();
    showQRCode(hasData);

    const dotsOptions = {
      type: shapeStyleSelect.value,
      color: fgColorInput.value,
      gradient: null,
    };
    if (document.getElementById("gradient-enabled")?.checked) {
      dotsOptions.gradient = {
        type: "linear",
        rotation:
          (Number(document.getElementById("gradient-rotation")?.value || 45) *
            Math.PI) /
          180,
        colorStops: [
          { offset: 0, color: fgColorInput.value },
          { offset: 1, color: document.getElementById("gradient-color")?.value || "#db2777" },
        ],
      };
      delete dotsOptions.color;
    }
    const transparentBackground = document.getElementById("transparent-bg")?.checked;
    qrCodeInstance.update({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      margin: PREVIEW_MARGIN,
      data: hasData ? qrData : CONFIG.placeholderData,
      image: logoImage,
      dotsOptions,
      backgroundOptions: {
        color: transparentBackground ? "rgba(0,0,0,0)" : bgColorInput.value,
      },
      cornersSquareOptions: { type: borderStyleSelect.value },
      cornersDotOptions: { type: centerStyleSelect.value },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: Number(document.getElementById("logo-margin")?.value || 10),
        imageSize: Number(document.getElementById("logo-size")?.value || 35) / 100,
      },
    });
    requestAnimationFrame(() => setPreviewSvgViewport());
  };

  let updateTimeout;
  const scheduleUpdate = () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateQRCode, 150);
  };

  // --- PDF Download ---
  const blobToDataURL = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const getExportSize = () =>
    Math.min(1000, Math.max(100, Number(sizeInput.value) || 300));

  const getRawDataAtExportSize = async (extension) => {
    const exportSize = getExportSize();
    qrCodeInstance.update({
      width: exportSize,
      height: exportSize,
      margin: getQuietZone(exportSize),
    });
    setPreviewSvgViewport(exportSize);
    try {
      return await qrCodeInstance.getRawData(extension);
    } finally {
      qrCodeInstance.update({
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        margin: PREVIEW_MARGIN,
      });
      setPreviewSvgViewport(PREVIEW_SIZE);
    }
  };

  const downloadBlob = (blob, filename) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // This NEW function contains all of your PDF styling.
  // It's the same as your old download function, but returns data instead of saving.
  const generatePDFBlob = async () => {
    try {
      const blob = await getRawDataAtExportSize("png");
      if (!blob) return null;
      const dataUrl = await blobToDataURL(blob);
      const doc = new jsPDF();

      const isDarkMode = document.body.classList.contains("dark-theme");
      const pageBgImage = isDarkMode ? darkPageBg : lightPageBg;
      const headerTextColor = isDarkMode ? "#e8eaed" : "#202124";
      const taglineTextColor = isDarkMode ? "#bdc1c6" : "#5f6368";
      const footerTextColor = isDarkMode ? "#9aa0a6" : "#5f6368";

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.addImage(pageBgImage, "PNG", 0, 0, pageWidth, pageHeight);

      const margin = 10;
      const logoSize = 30;
      const textX = margin + logoSize; // CORRECTED: Added +5 for spacing
      const logoY = margin - 3;
      const logoCenterY = logoY + logoSize / 2;

      doc.addImage(logoBase64, "PNG", margin, logoY, logoSize, logoSize);

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(headerTextColor);
      doc.text("QR Fusion", textX, logoCenterY - 2);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(taglineTextColor);
      doc.text("Quick. Simple. Powerful.", textX, logoCenterY + 5);

      const qrTitle = `Scan to get ${
        currentTab.charAt(0).toUpperCase() + currentTab.slice(1)
      } Details`;
      doc.setFontSize(16);
      doc.setTextColor(taglineTextColor);
      doc.text(qrTitle, pageWidth / 2, pageHeight / 2 - 50, {
        align: "center",
      });

      const qrSizeMM = 80;
      const qrX = (pageWidth - qrSizeMM) / 2;
      const qrY = (pageHeight - qrSizeMM) / 2;
      doc.setFillColor("#ffffff");
      doc.roundedRect(
        qrX - 5,
        qrY - 5,
        qrSizeMM + 10,
        qrSizeMM + 10,
        5,
        5,
        "F"
      );
      doc.addImage(dataUrl, "PNG", qrX, qrY, qrSizeMM, qrSizeMM);

      doc.setFontSize(11);
      doc.setTextColor(footerTextColor);
      const plainText = "Powered by QR Fusion – Create yours at ";
      const linkText = CONFIG.websiteUrl;
      const fullUrl = `https://${CONFIG.websiteUrl}`;
      const textWidth =
        (doc.getStringUnitWidth(plainText + linkText) * doc.getFontSize()) /
        doc.internal.scaleFactor;
      const textXFooter = (pageWidth - textWidth) / 2;
      const textYFooter = pageHeight - 15;
      doc.text(plainText, textXFooter, textYFooter);
      doc.textWithLink(
        linkText,
        textXFooter +
          (doc.getStringUnitWidth(plainText) * doc.getFontSize()) /
            doc.internal.scaleFactor,
        textYFooter,
        { url: fullUrl }
      );

      return doc.output("blob");
    } catch (error) {
      console.error("Failed to create PDF blob:", error);
      alert("Sorry, there was an error creating the PDF file.");
      return null;
    }
  };

  const downloadAsPDF = async () => {
    const blob = await generatePDFBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-fusion-code.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadAllFormatsAsZip = async () => {
    try {
      const pngBlob = await getRawDataAtExportSize("png");
      const jpegBlob = await getRawDataAtExportSize("jpeg");
      const svgBlob = await getRawDataAtExportSize("svg");
      const pdfBlob = await generatePDFBlob();

      const zip = new JSZip();
      if (pngBlob) zip.file("qr-fusion.png", pngBlob);
      if (jpegBlob) zip.file("qr-fusion.jpeg", jpegBlob);
      if (svgBlob) zip.file("qr-fusion.svg", svgBlob);
      if (pdfBlob) zip.file("qr-fusion.pdf", pdfBlob);

      const zipBlob = await zip.generateAsync({ type: "blob" });

      setTimeout(() => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = "qr-fusion-files.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
    } catch (error) {
      console.error("Failed to create zip file:", error);
      alert("Sorry, there was an error creating the final .zip file.");
    }
  };

  // --- Listeners ---
  [
    sizeInput,
    fgColorInput,
    bgColorInput,
    shapeStyleSelect,
    borderStyleSelect,
    centerStyleSelect,
  ].forEach((control) => {
    if (control) control.addEventListener("input", scheduleUpdate);
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      tabs.forEach((t) => t.classList.remove("tab-active"));
      tab.classList.add("tab-active");
      currentTab = tab.dataset.tab;
      const page = PAGE_CONFIG[currentTab];
      const destination = isLocalDevelopment
        ? `/generator.html?type=${currentTab}`
        : page?.path;
      if (destination && `${window.location.pathname}${window.location.search}` !== destination) {
        window.history.pushState({ tab: currentTab }, "", destination);
      }
      updatePageMetadata(currentTab);
      showForm(currentTab);
      scheduleUpdate();
    });
  });

  window.addEventListener("popstate", () => {
    currentTab = getTabFromPath();
    tabs.forEach((tab) =>
      tab.classList.toggle("tab-active", tab.dataset.tab === currentTab)
    );
    updatePageMetadata(currentTab);
    showForm(currentTab);
    scheduleUpdate();
  });

  formWrapper.addEventListener("input", (e) => {
    if (e.target.matches("input, textarea, select")) {
      scheduleUpdate();
    }
  });

  if (logoInput) {
    logoInput.addEventListener("change", () => {
      if (logoImage?.startsWith("blob:")) URL.revokeObjectURL(logoImage);
      logoImage = logoInput.files[0]
        ? URL.createObjectURL(logoInput.files[0])
        : null;
      scheduleUpdate();
      updateRemoveButtonState();
    });
  }
  if (removeLogoBtn) {
    removeLogoBtn.addEventListener("click", () => {
      if (logoImage?.startsWith("blob:")) URL.revokeObjectURL(logoImage);
      logoInput.value = "";
      logoImage = null;
      scheduleUpdate();
      updateRemoveButtonState();
    });
  }
  if (resetCustomizationBtn) {
    resetCustomizationBtn.addEventListener("click", () => {
      sizeInput.value = "300";
      fgColorInput.value = "#000000";
      bgColorInput.value = "#ffffff";
      shapeStyleSelect.value = "square";
      borderStyleSelect.value = "square";
      centerStyleSelect.value = "square";
      const optionalDefaults = {
        "transparent-bg": false,
        "gradient-enabled": false,
        "gradient-color": "#db2777",
        "gradient-rotation": "45",
        "logo-size": "35",
        "logo-margin": "10",
        "preset-select": "custom",
      };
      Object.entries(optionalDefaults).forEach(([id, value]) => {
        const control = document.getElementById(id);
        if (!control) return;
        if (control.type === "checkbox") control.checked = value;
        else control.value = value;
        control.dispatchEvent(new Event("input", { bubbles: true }));
      });
      if (logoImage?.startsWith("blob:")) URL.revokeObjectURL(logoImage);
      logoInput.value = "";
      logoImage = null;
      scheduleUpdate();
      updateRemoveButtonState();
    });
  }

  downloadPngBtn.addEventListener("click", async () =>
    downloadBlob(await getRawDataAtExportSize("png"), "qr-fusion-code.png")
  );
  downloadJpegBtn.addEventListener("click", async () =>
    downloadBlob(await getRawDataAtExportSize("jpeg"), "qr-fusion-code.jpeg")
  );
  downloadPdfBtn.addEventListener("click", downloadAsPDF);
  downloadAllBtn.addEventListener("click", downloadAllFormatsAsZip);

  const downloadSvgBtn = document.getElementById("download-svg-btn");
  const copyQrBtn = document.getElementById("copy-qr-btn");
  const shareQrBtn = document.getElementById("share-qr-btn");
  downloadSvgBtn?.addEventListener("click", async () =>
    downloadBlob(await getRawDataAtExportSize("svg"), "qr-fusion-code.svg")
  );
  copyQrBtn?.addEventListener("click", async () => {
    try {
      const originalMarkup = copyQrBtn.innerHTML;
      const blob = await getRawDataAtExportSize("png");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      copyQrBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => (copyQrBtn.innerHTML = originalMarkup), 1800);
    } catch {
      alert("Image copy is not supported in this browser or context.");
    }
  });
  shareQrBtn?.addEventListener("click", async () => {
    try {
      const blob = await getRawDataAtExportSize("png");
      const file = new File([blob], "qr-fusion-code.png", { type: "image/png" });
      if (!navigator.canShare?.({ files: [file] })) throw new Error("unsupported");
      await navigator.share({ title: "QR Fusion Code", files: [file] });
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Native sharing is not supported in this browser.");
      }
    }
  });

  // --- Payment type switch ---
  paymentTypeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "upi") {
        upiFields.style.display = "grid";
        bankFields.style.display = "none";
      } else if (radio.value === "bank") {
        upiFields.style.display = "none";
        bankFields.style.display = "grid";
      }
      scheduleUpdate();
    });
  });

  // Set default payment form display
  if (
    document.querySelector('input[name="payment-type"]:checked')?.value ===
    "upi"
  ) {
    upiFields.style.display = "grid";
    bankFields.style.display = "none";
  } else {
    upiFields.style.display = "none";
    bankFields.style.display = "grid";
  }

  // PIN code auto-fetch listeners
  const vcardPostal = document.getElementById("vcard-postal");
  if (vcardPostal) {
    vcardPostal.addEventListener("input", () => {
      fetchAddressFromPincode(vcardPostal.value.trim(), "vcard");
    });
  }

  const locPostal = document.getElementById("loc-postal");
  if (locPostal) {
    locPostal.addEventListener("input", () => {
      fetchAddressFromPincode(locPostal.value.trim(), "loc");
    });
  }

  // --- Init ---

  tabs.forEach((tab) =>
    tab.classList.toggle("tab-active", tab.dataset.tab === currentTab)
  );
  updatePageMetadata(currentTab);
  showForm(currentTab);
  updateQRCode();
  updateRemoveButtonState();

  window.QRFusionApp = {
    refresh: updateQRCode,
    getData: generateQRData,
    getCurrentTab: () => currentTab,
    getRawDataAtExportSize,
  };
});
