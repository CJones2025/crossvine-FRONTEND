// Theme Management System

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem("crossvine_theme") || "light";
    this.applyTheme(this.currentTheme);
  }

  // Apply theme to document
  applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    this.currentTheme = theme;
    localStorage.setItem("crossvine_theme", theme);

    // Update checkbox if it exists
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.checked = theme === "dark";
    }
  }

  // Toggle between light and dark themes
  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
    return newTheme;
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Global theme manager instance
const themeManager = new ThemeManager();

// Initialize theme toggle functionality
function initializeThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle && !themeToggle.dataset.initialized) {
    themeToggle.addEventListener("change", (e) => {
      themeManager.toggleTheme();
    });
    themeToggle.dataset.initialized = "true";

    // Set initial checkbox state based on current theme
    themeToggle.checked = themeManager.getCurrentTheme() === "dark";
  }
}
