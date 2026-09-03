document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("menu-toggle");
  const navigation = document.getElementById("site-nav");
  const themeButton = document.getElementById("landing-theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    document.body.classList.toggle("dark-theme", theme === "dark");
    themeButton.checked = theme === "dark";
    themeColor?.setAttribute("content", theme === "dark" ? "#0d0c16" : "#ffffff");
  };

  applyTheme(localStorage.getItem("theme") || "light");

  themeButton.addEventListener("change", () => {
    const theme = themeButton.checked ? "dark" : "light";
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  });

  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menuButton.querySelector("i")?.classList.toggle("fa-bars", !open);
    menuButton.querySelector("i")?.classList.toggle("fa-xmark", open);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      menuButton.querySelector("i")?.classList.add("fa-bars");
      menuButton.querySelector("i")?.classList.remove("fa-xmark");
    }
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();

  const localDevelopment = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (localDevelopment) {
    const routeToType = {
      "/text": "text", "/vcard": "vcard", "/wifi": "wifi", "/event": "event",
      "/social": "social", "/app-store": "appstore", "/email": "email", "/sms": "sms",
      "/location": "location", "/payment": "payment", "/phone": "phone",
      "/whatsapp": "whatsapp", "/google-review": "review",
    };
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const path = new URL(link.href, location.href).pathname;
      if (path === "/create" || routeToType[path]) {
        event.preventDefault();
        location.href = routeToType[path]
          ? `/generator.html?type=${routeToType[path]}`
          : "/generator.html";
      }
    });
  }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("/service-worker.js").catch(console.error)
    );
  }
});
