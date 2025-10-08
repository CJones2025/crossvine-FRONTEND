// UI Initialization and Management

// Update navigation      loginBox.classList.toggle("active");sed on login status
function updateNavigation() {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;

  if (userManager.isLoggedIn()) {
    const user = userManager.getCurrentUser();
    // Logged in navigation
    navLinks.innerHTML = `
      <a href="demo1.html" class="nav-link">Home</a>
      <a href="#" class="nav-link" onclick="goToMyProfile()">Profile</a>
      <a href="#" class="nav-link" onclick="logout()">Logout</a>
    `;
  } else {
    // Not logged in navigation
    const isHomePage =
      window.location.pathname.includes("demo1.html") ||
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("/");

    if (isHomePage) {
      navLinks.innerHTML = `
        <div class="login-dropdown">
          <a href="#" class="nav-link" id="loginToggle">Login</a>
          <div class="login-box" id="loginBox">
            <form class="login-form" onsubmit="handleLogin(event)">
              <div class="login-field">
                <input type="text" id="loginUsername" placeholder="Username" required>
              </div>
              <div class="login-field">
                <input type="password" id="loginPassword" placeholder="Password" required>
              </div>
              <button type="submit" class="login-submit-btn">Sign In</button>
            </form>
          </div>
        </div>
        <a href="demoRegister1.html" class="nav-link">Register</a>
      `;
    } else {
      navLinks.innerHTML = `
        <a href="demo1.html" class="nav-link">Home</a>
        <div class="login-dropdown">
          <a href="#" class="nav-link" id="loginToggle">Login</a>
          <div class="login-box" id="loginBox">
            <form class="login-form" onsubmit="handleLogin(event)">
              <div class="login-field">
                <input type="text" id="loginUsername" placeholder="Username" required>
              </div>
              <div class="login-field">
                <input type="password" id="loginPassword" placeholder="Password" required>
              </div>
              <button type="submit" class="login-submit-btn">Sign In</button>
            </form>
          </div>
        </div>
        <a href="demoRegister1.html" class="nav-link">Register</a>
      `;
    }
  }

  // Re-initialize login dropdown if present (with slight delay for DOM update)
  setTimeout(() => {
    initializeLoginDropdown();
  }, 10);

  // Update sidebar to show/hide saved hashtags based on login status
  updateSidebar();

  // Reinitialize hashtag handlers after sidebar update
  initializeHashtagHandlers();

  // Update create post visibility based on login status
  updateCreatePostVisibility();

  // Reinitialize create post form after navigation update
  setTimeout(() => {
    initializeCreatePostForm();
    loadSavedPosts();
  }, 50);
}

// Initialize login dropdown functionality
function initializeLoginDropdown() {
  const loginToggle = document.getElementById("loginToggle");
  const loginBox = document.getElementById("loginBox");

  if (loginToggle && loginBox) {
    // Clear any existing event listeners
    loginToggle.onclick = null;

    loginToggle.addEventListener("click", function (e) {
      e.preventDefault();

      loginBox.classList.toggle("show");
      console.log("Login box classes:", loginBox.className);
    });

    // Close login box when clicking outside (only add once)
    if (!document.hasLoginDropdownListener) {
      document.addEventListener("click", function (e) {
        const loginToggle = document.getElementById("loginToggle");
        const loginBox = document.getElementById("loginBox");
        if (
          loginToggle &&
          loginBox &&
          !loginToggle.contains(e.target) &&
          !loginBox.contains(e.target)
        ) {
          loginBox.classList.remove("show");
        }
      });
      document.hasLoginDropdownListener = true;
    }
  } else {
    console.log("Login dropdown elements not found");
  }
}

// Logout function
function logout() {
  userManager.logout();
  updateNavigation();
  window.location.href = "demo1.html";
}

// Initialize create post form functionality
function initializeCreatePostForm() {
  const textareas = document.querySelectorAll(".post-textarea");
  const submitButtons = document.querySelectorAll(".submit-post-btn");

  // Set up media upload event listeners
  const imageInputs = document.querySelectorAll(
    "#imageUpload, #imageUploadMain"
  );
  const videoInputs = document.querySelectorAll(
    "#videoUpload, #videoUploadMain"
  );
  const audioInputs = document.querySelectorAll(
    "#audioUpload, #audioUploadMain"
  );

  [...imageInputs, ...videoInputs, ...audioInputs].forEach((input) => {
    if (input.dataset.initialized === "true") return;
    input.dataset.initialized = "true";

    input.addEventListener("change", function () {
      const form = this.closest(".create-post-form");
      const previewContainer = form
        ? form.querySelector(".media-preview")
        : null;

      if (previewContainer && this.files.length > 0) {
        handleMediaUpload(this, previewContainer);
      }
    });
  });

  textareas.forEach((textarea, index) => {
    // Skip if already initialized
    if (textarea.dataset.initialized === "true") {
      return;
    }
    textarea.dataset.initialized = "true";

    // Add character counter functionality
    textarea.addEventListener("input", function () {
      updateCharacterCount(this);
    });

    // Initialize character count
    updateCharacterCount(textarea);
  });

  submitButtons.forEach((button, index) => {
    // Skip if already initialized
    if (button.dataset.initialized === "true") {
      return;
    }
    button.dataset.initialized = "true";

    button.addEventListener("click", function (e) {
      e.preventDefault();

      // Prevent multiple rapid clicks
      if (this.dataset.processing === "true") {
        return;
      }
      this.dataset.processing = "true";

      const form = this.closest(".create-post-form");

      let textarea = form ? form.querySelector(".post-textarea") : null;

      // Fallback: try to find textarea in the same section
      if (!textarea) {
        const section = this.closest(".create-post-section");
        textarea = section ? section.querySelector(".post-textarea") : null;
      }

      // Another fallback: find any textarea near the button
      if (!textarea) {
        textarea = document.querySelector(".post-textarea");
      }

      const mediaPreview = form ? form.querySelector(".media-preview") : null;

      if (textarea) {
        createPost(textarea, mediaPreview);
      } else {
        alert("Could not find textarea in form!");
      }

      // Reset processing flag after a short delay
      setTimeout(() => {
        this.dataset.processing = "false";
      }, 1000);
    });
  });
}

// Update sidebar based on login status
function updateSidebar() {
  const savedHashtagsContainer = document.querySelector(".saved-hashtags");
  if (!savedHashtagsContainer) return;

  if (userManager.isLoggedIn()) {
    const currentUser = userManager.getCurrentUser();
    const savedHashtags = currentUser.savedHashtags || [];

    if (savedHashtags.length > 0) {
      // Show user's saved hashtags
      savedHashtagsContainer.innerHTML = savedHashtags
        .map(
          (hashtag) => `
          <span class="hashtag removable">
            ${hashtag} <button class="remove-tag" onclick="removeHashtag(this)">×</button>
          </span>
        `
        )
        .join("");
    } else {
      // User has no saved hashtags yet
      savedHashtagsContainer.innerHTML =
        '<p class="no-hashtags">No saved hashtags yet. Click on trending hashtags to save them!</p>';
    }
  } else {
    // Not logged in - show sign up message
    savedHashtagsContainer.innerHTML =
      '<p class="no-hashtags">Sign up to save hashtags!</p>';
  }
}

// Update create post box visibility based on login status
function updateCreatePostVisibility() {
  const createPostSection = document.querySelector(".create-post-section");
  if (!createPostSection) return;

  // Check if we're on the home page
  const isHomePage =
    window.location.pathname.includes("demo1.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/");

  if (isHomePage) {
    // Only show create post on home page if user is logged in
    if (userManager.isLoggedIn()) {
      createPostSection.style.display = "block";
    } else {
      createPostSection.style.display = "none";
    }
  }
  // On other pages (like profile), always show if the section exists
}

// Initialize profile page with user data
function initializeProfilePage() {
  // Check if we're on the profile page
  if (!window.location.pathname.includes("demoProfile1.html")) {
    return;
  }

  const currentUser = userManager.getCurrentUser();
  if (!currentUser) {
    // Redirect to home if not logged in
    window.location.href = "demo1.html";
    return;
  }

  // Check if viewing another user's profile
  const viewingProfileUsername = getCurrentlyViewedProfile();
  let profileUser = currentUser;

  if (viewingProfileUsername) {
    // Get the other user's data
    const otherUser = getUserForProfile(viewingProfileUsername);
    if (otherUser) {
      profileUser = otherUser;
      console.log(`Viewing ${viewingProfileUsername}'s profile`);
    } else {
      console.error(`User ${viewingProfileUsername} not found`);
      // Clear the viewing profile and show current user instead
      localStorage.removeItem("crossvine_viewing_profile");
    }
  }

  // Update profile elements with user data
  const profilePicture = document.getElementById("profilePicture");
  const profileUsername = document.getElementById("profileUsername");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileBio = document.getElementById("profileBio");

  if (profilePicture)
    profilePicture.src = profileUser.profileImage || "IMG/DemoUser.png";
  if (profileUsername) {
    profileUsername.textContent = `@${profileUser.username}`;
  }
  if (profileDisplayName)
    profileDisplayName.textContent =
      profileUser.fullname || profileUser.username;
  if (profileBio)
    profileBio.textContent = profileUser.bio || "No bio added yet.";

  // Update post count
  const postCount = document.getElementById("postCount");
  if (postCount) {
    const userPosts = profileUser.posts || [];
    postCount.textContent = userPosts.length;
  }

  // Hide/show create post section based on whose profile we're viewing
  const createPostSection = document.querySelector(".create-post-section");
  if (createPostSection) {
    if (viewingProfileUsername) {
      // Viewing someone else's profile - hide create post section
      createPostSection.style.display = "none";
      console.log(
        `Hidden create post section when viewing ${viewingProfileUsername}'s profile`
      );
    } else {
      // Viewing own profile - show create post section
      createPostSection.style.display = "block";
      console.log("Showing create post section on own profile");
    }
  }

  // Update page title to show whose profile we're viewing
  if (viewingProfileUsername) {
    document.title = `${
      profileUser.fullname || profileUser.username
    } - Profile`;
  } else {
    document.title = "My Profile";
  }
}
