// Main Application Initialization

// Initialize page functionality
document.addEventListener("DOMContentLoaded", function () {
  // Update navigation based on login status
  updateNavigation();

  // Initialize theme toggle
  initializeThemeToggle();

  // Initialize profile page if applicable
  initializeProfilePage();

  // Update sidebar based on login status
  updateSidebar();

  // Note: Hashtag handlers are initialized in ui-manager.js updateSidebar()

  // Update create post visibility
  updateCreatePostVisibility();

  // Initialize create post form functionality
  try {
    initializeCreatePostForm();
  } catch (error) {
    console.error("Error initializing create post form:", error);
  }

  // Load saved posts
  try {
    loadSavedPosts();
  } catch (error) {
    console.error("Error loading saved posts:", error);
  }

  // Default audio players - no custom initialization needed

  // Add remove functionality to saved hashtags
  const removeButtons = document.querySelectorAll(".remove-tag");
  removeButtons.forEach((button) => {
    // Skip if already has listener
    if (button.dataset.listenerAdded === "true") return;
    button.dataset.listenerAdded = "true";

    button.addEventListener("click", function (e) {
      e.stopPropagation();
      removeHashtag(this);
    });
  });

  // Initialize search functionality
  const searchBar = document.querySelector(".search-bar");
  if (searchBar && !searchBar.dataset.listenerAdded) {
    searchBar.dataset.listenerAdded = "true";
    searchBar.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }

  // Add image preview functionality for registration
  const profileImageInput = document.getElementById("profileImage");
  if (profileImageInput) {
    profileImageInput.addEventListener("change", handleImagePreview);
  }

  // Username formatting helper for registration
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    usernameInput.addEventListener("input", function (e) {
      let value = e.target.value;
      if (value && !value.startsWith("@")) {
        e.target.value = "@" + value;
      }
    });
  }

  // Update engagement ratio if on profile page
  if (window.location.pathname.includes("demoProfile1.html")) {
    const currentUser = userManager.getCurrentUser();
    if (currentUser) {
      // Check if viewing another user's profile
      const viewingProfileUsername = getCurrentlyViewedProfile();

      if (viewingProfileUsername) {
        // Display engagement for the viewed user
        const viewedUser = getUserForProfile(viewingProfileUsername);
        if (viewedUser) {
          updateEngagementRatio(viewedUser);
        }
      } else {
        // Display engagement for current user
        updateEngagementRatio(currentUser);
      }
    }
  }
});
