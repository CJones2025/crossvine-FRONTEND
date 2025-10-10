// Authentication System

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();

  console.log("Login attempt started"); // Debug log

  const usernameInput =
    document.getElementById("loginUsername") ||
    document.getElementById("username");
  const passwordInput =
    document.getElementById("loginPassword") ||
    document.getElementById("password");

  if (!usernameInput || !passwordInput) {
    alert("Error: Login form elements not found.");
    console.error("Form elements not found:", {
      usernameInput: !!usernameInput,
      passwordInput: !!passwordInput,
    });
    return;
  }

  const username = usernameInput.value;
  const password = passwordInput.value;

  // Basic validation
  if (!username || !password) {
    alert("Please fill in both username and password.");
    return;
  }

  try {
    console.log("Attempting login for username:", username); // Debug log

    // Login user
    const user = userManager.login(username, password);

    if (user) {
      console.log("Login successful"); // Debug log
      // Redirect to home page
      updateNavigation();
      window.location.href = "index.html";
    } else {
      console.log("Login failed - no user returned"); // Debug log
      alert("Login failed. Please check your credentials.");
    }
  } catch (error) {
    console.error("Login error:", error); // Debug log
    alert(error.message || "Login failed. Please try again.");
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

    // Registration successful - redirect to home page
    // Update navigation and redirect to home page
    updateNavigation();
    window.location.href = "index.html";
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

  console.log("Toggle login/register called"); // Debug log

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
    console.log("Switching to login mode"); // Debug log
    // Switch to login mode
    formTitle.textContent = "Welcome Back";
    formSubtitle.textContent = "Sign in to your Crossvine account";

    // Hide registration-only fields
    fullnameGroup.style.display = "none";
    profileImageGroup.style.display = "none";
    bioGroup.style.display = "none";

    // Update password help text
    passwordHelp.textContent = "Enter your password";

    // Update submit button styling
    submitBtn.textContent = "Sign In";
    submitBtn.className = "login-submit-btn";

    // Clear the form and set up login fields
    const form = document.getElementById("registerForm");
    form.innerHTML = `
      <div class="login-field">
        <input type="text" id="loginUsername" placeholder="Enter your username" required />
      </div>
      <div class="login-field">
        <input type="password" id="loginPassword" placeholder="Enter your password" required />
      </div>
      <button type="submit" class="login-submit-btn">Sign In</button>
    `;

    // Set up form submission
    form.onsubmit = function (e) {
      e.preventDefault();
      console.log("Login form submitted"); // Debug log
      handleLogin(e);
    };

    // Update toggle link
    toggleLink.innerHTML = `
      <p>
        Don't have an account?
        <a href="#" onclick="toggleLoginRegister(event)">Register here</a>
      </p>
    `;
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

    // Restore input fields to registration IDs
    const usernameInput = document.getElementById("loginUsername");
    if (usernameInput) {
      usernameInput.setAttribute("id", "username");
      usernameInput.setAttribute(
        "placeholder",
        "Enter username (e.g., @username)"
      );
    }

    const passwordInput = document.getElementById("loginPassword");
    if (passwordInput) {
      passwordInput.setAttribute("id", "password");
      passwordInput.setAttribute("placeholder", "Enter a secure password");
    }

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

  // Use the same fields from the registration form, as they're reused for login
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  if (!usernameInput || !passwordInput) {
    alert("Error: Login form elements not found");
    return;
  }

  const username = usernameInput.value;
  const password = passwordInput.value;

  // Basic validation
  if (!username || !password) {
    alert("Please fill in all fields");
    return;
  }

  try {
    // Login user
    const user = userManager.login(username, password);

    if (user) {
      // Update navigation and redirect to home page
      updateNavigation();
      window.location.href = "index.html";
    } else {
      alert("Invalid username or password");
    }
  } catch (error) {
    alert(error.message || "Login failed. Please try again.");
  }
}
