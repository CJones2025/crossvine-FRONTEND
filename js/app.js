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

  // Initialize Nuke Button functionality
  const nukeBtn = document.getElementById("nukeBtn");
  if (nukeBtn) {
    nukeBtn.addEventListener("click", handleNuke);
  }
});

// Nuke All Users and Posts functionality
function handleNuke() {
  const nukeBtn = document.getElementById("nukeBtn");
  
  // Show confirmation dialog
  const confirmed = confirm("⚠️ WARNING: This will permanently delete ALL users and posts!\n\nAre you sure you want to proceed?");
  
  if (confirmed) {
    // Add nuking animation
    nukeBtn.classList.add("nuking");
    nukeBtn.textContent = "💀";
    nukeBtn.title = "Nuking in progress...";
    
    // Show nuke feedback
    showNukeFeedback();
    
    // Start the nuke sequence
    setTimeout(() => {
      executeNuke();
      
      // Reset button after nuke is complete
      setTimeout(() => {
        nukeBtn.classList.remove("nuking");
        nukeBtn.textContent = "💥";
        nukeBtn.title = "Delete All Users & Posts";
        showNukeComplete();
      }, 2000);
    }, 1000);
  }
}

function executeNuke() {
  let deletedCount = 0;
  
  // Nuke all posts from the DOM
  const posts = document.querySelectorAll('.post');
  posts.forEach(post => {
    post.style.animation = 'nukeDisappear 0.5s ease-out forwards';
    setTimeout(() => {
      if (post.parentNode) {
        post.parentNode.removeChild(post);
      }
    }, 500);
    deletedCount++;
  });
  
  // Nuke all user-related elements
  const userElements = document.querySelectorAll('.username, .user-link, .profile-link');
  userElements.forEach(element => {
    element.style.animation = 'nukeDisappear 0.5s ease-out forwards';
    setTimeout(() => {
      element.textContent = '[DELETED]';
      element.style.color = '#e74c3c';
      element.style.textDecoration = 'line-through';
    }, 250);
    deletedCount++;
  });
  
  // Clear all stored data (if using storage manager)
  try {
    if (typeof localStorage !== 'undefined') {
      // Clear posts from localStorage
      localStorage.removeItem('savedPosts');
      localStorage.removeItem('users');
      localStorage.removeItem('currentUser');
    }
  } catch (error) {
    console.log('Storage clearing not available:', error);
  }
  
  // Clear demo data if available
  try {
    if (typeof window.demoUsers !== 'undefined') {
      window.demoUsers = [];
    }
    if (typeof window.demoPosts !== 'undefined') {
      window.demoPosts = [];
    }
  } catch (error) {
    console.log('Demo data clearing not available:', error);
  }
  
  return deletedCount;
}

function showNukeFeedback() {
  // Create nuke feedback overlay
  const overlay = document.createElement('div');
  overlay.id = 'nukeOverlay';
  overlay.className = 'nuke-overlay';
  overlay.innerHTML = `
    <div class="nuke-message">
      <h2>🚨 INITIATING NUKE SEQUENCE 🚨</h2>
      <p>Deleting all users and posts...</p>
      <div class="nuke-progress"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Remove overlay after animation
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 3000);
}

function showNukeComplete() {
  // Create completion message
  const message = document.createElement('div');
  message.id = 'nukeComplete';
  message.className = 'nuke-complete';
  message.innerHTML = `
    <div class="completion-message">
      <h3>💀 NUKE COMPLETE 💀</h3>
      <p>All users and posts have been eliminated!</p>
    </div>
  `;
  document.body.appendChild(message);
  
  // Remove message after 3 seconds
  setTimeout(() => {
    if (message.parentNode) {
      message.parentNode.removeChild(message);
    }
  }, 3000);
}
