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

  if (wifiPasswordInput && toggleWifiPasswordBtn) {
    toggleWifiPasswordBtn.addEventListener("click", () => {
      const isPassword = wifiPasswordInput.type === "password";
      wifiPasswordInput.type = isPassword ? "text" : "password";
      toggleWifiPasswordBtn.textContent = isPassword ? "Hide" : "Show";
    });
  }

  let currentTab = "text";
  let logoImage = null;
  let emailValidationTimeout;
  const PREVIEW_SIZE = 240;

  const qrCodeInstance = new QRCodeStyling({
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    type: "svg",
    data: CONFIG.placeholderData,
    imageOptions: { crossOrigin: "anonymous", margin: 10 },
  });

  if (qrCodeContainer) qrCodeInstance.append(qrCodeContainer);

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
  themeToggle.checked = savedTheme === "dark";

  themeToggle.addEventListener("change", () => {
    const newTheme = themeToggle.checked ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });

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
FN:${name}
ORG:${getInputValue("vcard-org")}
TITLE:${getInputValue("vcard-title")}
TEL:${getInputValue("vcard-tel")}
EMAIL:${getInputValue("vcard-email")}
ADR:;;${getInputValue("vcard-street")};${getInputValue(
          "vcard-city"
        )};${getInputValue("vcard-state")};${getInputValue(
          "vcard-postal"
        )};${getInputValue("vcard-country")}
URL:${getInputValue("vcard-url")}
NOTE:${getInputValue("vcard-note")}
END:VCARD`;
      }
      case "wifi": {
        const ssid = getInputValue("wifi-ssid");
        if (!ssid) return "";
        return `WIFI:T:${getInputValue(
          "wifi-encryption"
        )};S:${ssid};P:${getInputValue("wifi-password")};;`;
      }
      case "event": {
        const title = getInputValue("event-title");
        const start = getInputValue("event-start");
        if (!title || !start) return "";

        const end = getInputValue("event-end");
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
SUMMARY:${title}
DTSTART:${toICSLocal(start)}
${end ? `DTEND:${toICSLocal(end)}` : ""}
${location ? `LOCATION:${location}` : ""}
${description ? `DESCRIPTION:${description}` : ""}
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
          twitter: `https://twitter.com/${handle}`,
          instagram: `https://instagram.com/${handle}`,
          facebook: `https://facebook.com/${handle}`,
          linkedin: `https://linkedin.com/in/${handle}`,
          tiktok: `https://tiktok.com/@${handle}`,
          youtube: `https://youtube.com/@${handle}`,
          pinterest: `https://pinterest.com/${handle}`,
        };
        return urls[platform] || "";
      }
      case "appstore": {
        const url = getInputValue("appstore-url");
        return url ? url : "";
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
        return `SMSTO:${to}:${getInputValue("sms-body")}`;
      }
      case "location": {
        const mapLink = getInputValue("loc-map");
        if (mapLink) return mapLink;

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
          return `upi://pay?pa=${upi}&pn=${getInputValue(
            "payment-pn"
          )}&am=${getInputValue("payment-am")}&tn=${getInputValue(
            "payment-tn"
          )}`;
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
    };
    qrCodeInstance.update({
      data: hasData ? qrData : CONFIG.placeholderData,
      image: logoImage,
      dotsOptions,
      backgroundOptions: { color: bgColorInput.value },
      cornersSquareOptions: { type: borderStyleSelect.value },
      cornersDotOptions: { type: centerStyleSelect.value },
    });
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

  // This NEW function contains all of your PDF styling.
  // It's the same as your old download function, but returns data instead of saving.
  const generatePDFBlob = async () => {
    try {
      const blob = await qrCodeInstance.getRawData("png");
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
      const [pngBlob, jpegBlob, pdfBlob] = await Promise.all([
        qrCodeInstance.getRawData("png"),
        qrCodeInstance.getRawData("jpeg"),
        generatePDFBlob(),
      ]);

      const zip = new JSZip();
      if (pngBlob) zip.file("qr-fusion.png", pngBlob);
      if (jpegBlob) zip.file("qr-fusion.jpeg", jpegBlob);
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
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("tab-active"));
      tab.classList.add("tab-active");
      currentTab = tab.dataset.tab;
      showForm(currentTab);
      scheduleUpdate();
    });
  });

  formWrapper.addEventListener("input", (e) => {
    if (e.target.matches("input, textarea, select")) {
      scheduleUpdate();
    }
  });

  if (logoInput) {
    logoInput.addEventListener("change", () => {
      logoImage = logoInput.files[0]
        ? URL.createObjectURL(logoInput.files[0])
        : null;
      scheduleUpdate();
      updateRemoveButtonState();
    });
  }
  if (removeLogoBtn) {
    removeLogoBtn.addEventListener("click", () => {
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
      logoInput.value = "";
      logoImage = null;
      scheduleUpdate();
      updateRemoveButtonState();
    });
  }

  downloadPngBtn.addEventListener("click", () =>
    qrCodeInstance.download({ name: "qr-fusion-code", extension: "png" })
  );
  downloadJpegBtn.addEventListener("click", () =>
    qrCodeInstance.download({ name: "qr-fusion-code", extension: "jpeg" })
  );
  downloadPdfBtn.addEventListener("click", downloadAsPDF);
  downloadAllBtn.addEventListener("click", downloadAllFormatsAsZip);

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

  showForm(currentTab);
  updateQRCode();
  updateRemoveButtonState();
});
