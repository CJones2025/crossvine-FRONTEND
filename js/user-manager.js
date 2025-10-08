// User Management System

class UserManager {
  constructor() {
    this.currentUser = null;
    this.users = JSON.parse(localStorage.getItem("crossvine_users") || "{}");
    this.loadCurrentUser();
  }

  // Save users to localStorage
  saveUsers() {
    try {
      localStorage.setItem("crossvine_users", JSON.stringify(this.users));
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("Storage quota exceeded when saving users");

        // Check if cleanup functions are available and try cleanup
        if (typeof globalStorageCleanup === "function") {
          console.log("Attempting automatic cleanup...");
          const cleaned = globalStorageCleanup();

          if (cleaned) {
            try {
              localStorage.setItem(
                "crossvine_users",
                JSON.stringify(this.users)
              );
              console.log("Successfully saved after automatic cleanup");
              // Storage cleanup succeeded
              return;
            } catch (retryError) {
              console.error("Still failed after cleanup:", retryError);
            }
          }
        }

        // If cleanup didn't work, offer user options
        const userChoice = confirm(
          "Storage is full! Click OK to try emergency cleanup (removes old posts), or Cancel to continue with limited functionality."
        );

        if (userChoice && typeof emergencyStorageReset === "function") {
          emergencyStorageReset();
          return;
        }

        throw new Error(
          "Storage quota exceeded. Try refreshing the page or clear browser data for this site."
        );
      }
      throw error;
    }
  }

  // Save current user session
  saveCurrentUser() {
    try {
      if (this.currentUser) {
        localStorage.setItem(
          "crossvine_current_user",
          JSON.stringify(this.currentUser)
        );
      } else {
        localStorage.removeItem("crossvine_current_user");
      }
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("Storage quota exceeded when saving current user");
        throw new Error(
          "Storage quota exceeded. Please delete some posts to free up space."
        );
      }
      throw error;
    }
  }

  // Load current user session
  loadCurrentUser() {
    const savedUser = localStorage.getItem("crossvine_current_user");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  // Register new user
  register(userData) {
    const { username, fullname, password, bio, profileImage } = userData;

    // Check if user already exists
    if (this.users[username]) {
      throw new Error("Username already exists!");
    }

    // Create new user profile
    this.users[username] = {
      username,
      fullname,
      password, // In real app, this would be hashed
      bio: bio || "",
      profileImage: profileImage || "IMG/DemoUser.png",
      posts: [],
      savedHashtags: [],
      createdAt: new Date().toISOString(),
    };

    this.saveUsers();
    return this.users[username];
  }

  // Login user
  login(username, password) {
    const user = this.users[username];
    if (!user || user.password !== password) {
      throw new Error("Invalid username or password!");
    }

    this.currentUser = { ...user };
    this.saveCurrentUser();
    return this.currentUser;
  }

  // Logout user
  logout() {
    this.currentUser = null;
    this.saveCurrentUser();
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Update user profile
  updateUser(updates) {
    if (!this.currentUser) return false;

    // Update in users database
    Object.assign(this.users[this.currentUser.username], updates);

    // Update current user session
    Object.assign(this.currentUser, updates);

    this.saveUsers();
    this.saveCurrentUser();
    return true;
  }
}

// Global user manager instance
const userManager = new UserManager();
