// Authentication System

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  // Basic validation
  if (!username || !password) {
    return;
  }

  try {
    // Login user
    const user = userManager.login(username, password);

    // Redirect to profile page
    updateNavigation();
    window.location.href = "profile.html";
  } catch (error) {
    alert(error.message);
  }
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const username = formData.get("username");
  const fullname = formData.get("fullname");
  const password = formData.get("password");
  const bio = formData.get("bio");
  const profileImage = formData.get("profileImage");

  // Basic validation
  if (!username || !fullname || !password) {
    return;
  }

  if (password.length < 6) {
    return;
  }

  if (!username.startsWith("@")) {
    return;
  }

  try {
    // Handle profile image
    let profileImagePath = "IMG/DemoUser.png"; // Default image
    if (profileImage && profileImage.size > 0) {
      // For demo purposes, we'll read the uploaded image as base64
      // In a real app, you'd upload the image to a server
      const reader = new FileReader();
      const imageData = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(profileImage);
      });
      profileImagePath = imageData;
    }

    // Register user
    const newUser = userManager.register({
      username,
      fullname,
      password,
      bio,
      profileImage: profileImagePath,
    });

    // Auto-login the new user
    userManager.login(username, password);

    // Registration successful - redirect to profile
    // Update navigation and redirect to profile
    updateNavigation();
    window.location.href = "profile.html";
  } catch (error) {
    alert(error.message);
  }
}

// Handle image preview
function handleImagePreview(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("imagePreview");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Profile Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
}

// Toggle between login and register forms
function toggleLoginRegister(event) {
  event.preventDefault();

  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");
  const registerForm = document.getElementById("registerForm");
  const fullnameGroup = document.getElementById("fullnameGroup");
  const profileImageGroup = document.getElementById("profileImageGroup");
  const bioGroup = document.getElementById("bioGroup");
  const passwordHelp = document.getElementById("passwordHelp");
  const submitBtn = document.getElementById("submitBtn");
  const toggleLink = document.getElementById("toggleLink");

  // Check if currently showing register form
  const isRegisterMode = formTitle.textContent === "Join Crossvine";

  if (isRegisterMode) {
    // Switch to login mode
    formTitle.textContent = "Welcome Back";
    formSubtitle.textContent = "Sign in to your Crossvine account";

    // Hide registration-only fields
    fullnameGroup.style.display = "none";
    profileImageGroup.style.display = "none";
    bioGroup.style.display = "none";

    // Update password help text
    passwordHelp.textContent = "Enter your password";

    // Update submit button - keep original styling
    submitBtn.textContent = "Sign In";

    // Update toggle link
    toggleLink.innerHTML = `
      <p>
        Don't have an account?
        <a href="#" onclick="toggleLoginRegister(event)">Register here</a>
      </p>
    `;

    // Change form submission handler
    registerForm.setAttribute("onsubmit", "handleLoginFromRegisterPage(event)");
  } else {
    // Switch to register mode
    formTitle.textContent = "Join Crossvine";
    formSubtitle.textContent =
      "Create your account to start sharing and saving hashtags";

    // Show registration fields - restore original styling
    fullnameGroup.style.display = "";
    profileImageGroup.style.display = "";
    bioGroup.style.display = "";

    // Update password help text
    passwordHelp.textContent = "Must be at least 6 characters long";

    // Update submit button - restore original class
    submitBtn.textContent = "Create Account";
    submitBtn.className = "register-btn";

    // Update toggle link
    toggleLink.innerHTML = `
      <p>
        Already have an account?
        <a href="#" onclick="toggleLoginRegister(event)">Sign in here</a>
      </p>
    `;

    // Change form submission handler back to register
    registerForm.setAttribute("onsubmit", "handleRegister(event)");
  }
}

// Handle login from the register page when toggled
function handleLoginFromRegisterPage(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Basic validation
  if (!username || !password) {
    alert("Please fill in all fields");
    return;
  }

  try {
    // Login user
    const user = userManager.login(username, password);

    // Update navigation and redirect to profile
    updateNavigation();
    window.location.href = "profile.html";
  } catch (error) {
    alert(error.message);
  }
}
