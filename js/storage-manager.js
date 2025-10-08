// Storage Management Utilities

// Check localStorage size and clean up if needed
function checkStorageSpace() {
  try {
    // First validate that storage isn't corrupted
    if (!validateAndFixStorage()) {
      return true; // After clearing corrupted data, we have space
    }

    const currentSize = JSON.stringify(localStorage).length;
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    console.log(`Storage used: ${(currentSize / 1024 / 1024).toFixed(2)}MB`);

    if (currentSize > maxSize * 0.8) {
      // 80% of limit
      console.warn("Storage approaching limit, cleaning up old posts...");
      cleanupOldPosts();

      // Check again after cleanup
      const newSize = JSON.stringify(localStorage).length;
      if (newSize > maxSize * 0.9) {
        console.warn(
          "Storage still full after cleanup, consider clearing all data"
        );
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error("Storage check failed:", e);
    // If there's still an error, clear everything
    clearAllStorage();
    return true;
  }
}

// Clean up old posts to free space
function cleanupOldPosts() {
  const allUsers = JSON.parse(localStorage.getItem("crossvine_users") || "{}");
  let dataChanged = false;

  Object.values(allUsers).forEach((user) => {
    if (user.posts && user.posts.length > 10) {
      // Keep only the 10 most recent posts per user
      user.posts = user.posts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      dataChanged = true;
    }
  });

  if (dataChanged) {
    localStorage.setItem("crossvine_users", JSON.stringify(allUsers));
    console.log("Cleaned up old posts across all users");
  }
}

// Clear all storage data (emergency reset)
function clearAllStorage() {
  try {
    // Remove all Crossvine related data
    localStorage.removeItem("crossvine_users");
    localStorage.removeItem("crossvine_currentUser");
    localStorage.removeItem("crossvine_theme");

    // Clear any other potential storage items
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (
        key.includes("crossvine") ||
        key.includes("demo") ||
        key.includes("post")
      ) {
        localStorage.removeItem(key);
      }
    });

    console.log("All storage cleared successfully");
    return true;
  } catch (e) {
    console.error("Failed to clear storage:", e);
    return false;
  }
}

// Check if storage is corrupted and fix it
function validateAndFixStorage() {
  try {
    // Test if we can read/write to localStorage
    const testKey = "crossvine_test";
    localStorage.setItem(testKey, "test");
    localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    // Validate users data
    const usersData = localStorage.getItem("crossvine_users");
    if (usersData) {
      JSON.parse(usersData); // This will throw if corrupted
    }

    return true;
  } catch (e) {
    console.error("Storage validation failed:", e);
    // Clear corrupted data
    clearAllStorage();
    return false;
  }
}
