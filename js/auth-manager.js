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
    window.location.href = "demoProfile1.html";
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
    window.location.href = "demoProfile1.html";
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

// Toggle between login and register forms (placeholder function for registration page)
function toggleLoginRegister(event) {
  event.preventDefault();
  // Redirect to main page for login
  window.location.href = "demo1.html";
}
