// Posts Management System

// Update character counter
function updateCharacterCount(textarea) {
  const charCounter = textarea
    .closest(".create-post-form")
    .querySelector(".char-counter");
  if (charCounter) {
    const currentLength = textarea.value.length;
    charCounter.textContent = `${currentLength}/500`;

    // Change color if approaching limit
    if (currentLength > 450) {
      charCounter.style.color = "#e74c3c";
    } else if (currentLength > 400) {
      charCounter.style.color = "#f39c12";
    } else {
      charCounter.style.color = "#7f8c8d";
    }
  }
}

// Create post function
function createPost(textareaElement, previewElement) {
  if (!textareaElement) {
    alert("Textarea element not found!");
    return;
  }

  const postContent = textareaElement.value.trim();

  if (!postContent) {
    return;
  }

  if (!userManager.isLoggedIn()) {
    return;
  }

  let currentUser = userManager.getCurrentUser();

  if (!currentUser || !currentUser.username) {
    alert("User data is invalid. Please log out and log back in.");
    return;
  }

  // Find the posts container (could be posts-section or posts-feed)
  let postsContainer = document.querySelector(".posts-section");
  if (!postsContainer) {
    postsContainer = document.querySelector(".posts-feed");
  }

  if (!postsContainer) {
    alert("Posts container not found!");
    return;
  }

  // Generate unique ID for the post
  const postId = Date.now();

  // Get media data before clearing preview
  const mediaData = getMediaData(previewElement);

  // Clear the form
  textareaElement.value = "";
  updateCharacterCount(textareaElement);

  // Clear media preview if it exists
  if (previewElement) {
    previewElement.innerHTML = "";
  }

  // Save post to user data and let loadSavedPosts() handle display
  if (currentUser) {
    if (!currentUser.posts) currentUser.posts = [];

    const newPost = {
      content: postContent,
      media: mediaData || [],
      timestamp: new Date().toISOString(),
      id: postId,
      authorId: currentUser.username,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    };

    try {
      // Initialize posts array if it doesn't exist
      if (!currentUser.posts) {
        currentUser.posts = [];
      }

      // Simple storage check - only fail if we really can't store anything
      try {
        const testStore = JSON.stringify(currentUser);
        if (testStore.length > 4000000) {
          // Try to cleanup old posts to free space
          const cleaned = cleanupOldPosts(currentUser);
          if (cleaned) {
            console.log("Cleaned up old posts to free storage space");
          }
        }
      } catch (storageError) {
        console.warn("Storage check failed, proceeding anyway:", storageError);
      }

      currentUser.posts.unshift(newPost);

      // Save directly to localStorage using username-based object structure
      const allUsers = JSON.parse(
        localStorage.getItem("crossvine_users") || "{}"
      );

      // If user doesn't exist in storage, add them
      if (!allUsers[currentUser.username]) {
        allUsers[currentUser.username] = { ...currentUser };
      }

      // Update the user's posts
      allUsers[currentUser.username].posts = currentUser.posts;

      // Also update the userManager instance
      userManager.users[currentUser.username] = allUsers[currentUser.username];
      userManager.currentUser = allUsers[currentUser.username];

      // Save to localStorage
      localStorage.setItem("crossvine_users", JSON.stringify(allUsers));

      // Clear the textarea
      textareaElement.value = "";

      // Clear preview if it exists
      if (previewElement) {
        previewElement.innerHTML = "";
      }

      // Refresh the posts display to show the new post from saved data
      loadSavedPosts();
      console.log("Posts reloaded - textarea cleared");
    } catch (error) {
      console.error("Error saving post:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      // Simple fallback - just save the post without complex checks
      try {
        console.log("Attempting simple save...");

        // Ensure user has posts array
        if (!currentUser.posts) {
          currentUser.posts = [];
        }

        // Save to localStorage directly
        const allUsers = JSON.parse(
          localStorage.getItem("crossvine_users") || "{}"
        );

        // If user doesn't exist in storage, add them
        if (!allUsers[currentUser.username]) {
          allUsers[currentUser.username] = { ...currentUser };
        }

        // Update the user's posts
        allUsers[currentUser.username].posts = currentUser.posts;

        // Also update the userManager instance
        userManager.users[currentUser.username] =
          allUsers[currentUser.username];
        userManager.currentUser = allUsers[currentUser.username];

        // Save to localStorage
        localStorage.setItem("crossvine_users", JSON.stringify(allUsers));

        // Clear form
        textareaElement.value = "";
        if (previewElement) {
          previewElement.innerHTML = "";
        }

        // Reload posts
        loadSavedPosts();
        // Post saved successfully
      } catch (retryError) {
        console.error("Simple save also failed:", retryError);
        alert(
          `Unable to save post. Error: ${retryError.message}. Please check the console for details.`
        );
      }
    }
  }
}

// Delete post function
function deletePost(element) {
  const post = element.parentElement;
  post.style.opacity = "0";

  setTimeout(() => {
    post.remove();

    // Remove from user data if this is a saved post
    if (userManager.isLoggedIn()) {
      const currentUser = userManager.getCurrentUser();
      if (currentUser.posts && currentUser.posts.length > 0) {
        // Try to find the post by content to remove it
        const postContent = post.querySelector(".post-content p");
        if (postContent) {
          const content = postContent.textContent;
          // Remove the username part if it exists
          const contentWithoutUsername = content.includes(":")
            ? content.split(":", 2)[1].trim()
            : content;

          // Find and remove matching post
          const originalLength = currentUser.posts.length;
          currentUser.posts = currentUser.posts.filter(
            (p) => p.content.trim() !== contentWithoutUsername
          );

          // Only update if we actually removed something
          if (currentUser.posts.length < originalLength) {
            userManager.updateUser({ posts: currentUser.posts });
            console.log("Post removed from storage");
          }
        }
      }
    }
  }, 300);
}

// Load and display saved posts
function loadSavedPosts() {
  try {
    // Get all users and their posts
    let allUsers = JSON.parse(localStorage.getItem("crossvine_users") || "{}");

    // Ensure allUsers is an object
    if (typeof allUsers !== "object" || Array.isArray(allUsers)) {
      console.error("Users data is corrupted, resetting...");
      allUsers = {};
      localStorage.setItem("crossvine_users", "{}");
    }

    let allPosts = [];

    // Check if we're on the profile page and get which user's profile to show
    const isProfilePage =
      window.location.pathname.includes("demoProfile1.html");
    let profileUserToShow = null;

    if (isProfilePage) {
      const currentUser = userManager.getCurrentUser();
      const viewingProfileUsername = getCurrentlyViewedProfile();

      if (viewingProfileUsername) {
        // Viewing someone else's profile
        profileUserToShow = allUsers[viewingProfileUsername];
        console.log(`Loading posts for ${viewingProfileUsername}'s profile`);
      } else if (currentUser) {
        // Viewing own profile
        profileUserToShow = allUsers[currentUser.username];
        console.log(`Loading posts for ${currentUser.username}'s own profile`);
      }
    }

    // Collect posts based on page type
    if (isProfilePage && profileUserToShow) {
      // Profile page: show only posts from the profile user
      if (
        profileUserToShow.posts &&
        Array.isArray(profileUserToShow.posts) &&
        profileUserToShow.posts.length > 0
      ) {
        profileUserToShow.posts.forEach((post) => {
          // Ensure post has proper like/dislike structure
          if (!post.hasOwnProperty("likes")) post.likes = 0;
          if (!post.hasOwnProperty("dislikes")) post.dislikes = 0;
          if (!post.likedBy) post.likedBy = [];
          if (!post.dislikedBy) post.dislikedBy = [];

          allPosts.push({
            ...post,
            authorName:
              profileUserToShow.fullname || profileUserToShow.username,
            authorUsername: profileUserToShow.username,
            authorId: profileUserToShow.username,
          });
        });
      }
    } else {
      // Main feed: show posts from all users
      Object.values(allUsers).forEach((user) => {
        if (user.posts && Array.isArray(user.posts) && user.posts.length > 0) {
          user.posts.forEach((post) => {
            // Ensure post has proper like/dislike structure
            if (!post.hasOwnProperty("likes")) post.likes = 0;
            if (!post.hasOwnProperty("dislikes")) post.dislikes = 0;
            if (!post.likedBy) post.likedBy = [];
            if (!post.dislikedBy) post.dislikedBy = [];

            allPosts.push({
              ...post,
              authorName: user.fullname || user.username,
              authorUsername: user.username,
              authorId: user.username,
            });
          });
        }
      });
    }

    // Find posts container
    let postsContainer = document.querySelector(".posts-section");
    if (!postsContainer) {
      postsContainer = document.querySelector(".posts-feed");
    }

    if (!postsContainer) return;

    const title = postsContainer.querySelector("h3");

    // Update posts section title based on what we're showing
    if (title && isProfilePage) {
      const currentUser = userManager.getCurrentUser();
      const viewingProfileUsername = getCurrentlyViewedProfile();

      if (
        viewingProfileUsername &&
        viewingProfileUsername !== currentUser?.username
      ) {
        // Viewing someone else's profile
        const profileUser = allUsers[viewingProfileUsername];
        const displayName = profileUser?.fullname || viewingProfileUsername;
        title.textContent = `${displayName}'s Posts`;
      } else {
        // Viewing own profile or default
        title.textContent = "My Posts";
      }
    } else if (title) {
      // Main feed or other pages
      title.textContent = "Recent Posts";
    }

    // Clear any existing posts (except sample ones)
    const existingPosts = postsContainer.querySelectorAll(".post.saved-post");
    existingPosts.forEach((post) => post.remove());

    // Handle empty posts case
    if (allPosts.length === 0) {
      if (isProfilePage) {
        const currentUser = userManager.getCurrentUser();
        const viewingProfileUsername = getCurrentlyViewedProfile();

        // Create a no posts message
        const noPostsDiv = document.createElement("div");
        noPostsDiv.className = "post saved-post no-posts-message";

        if (
          viewingProfileUsername &&
          viewingProfileUsername !== currentUser?.username
        ) {
          // Viewing someone else's profile with no posts
          const profileUser = allUsers[viewingProfileUsername];
          const displayName = profileUser?.fullname || viewingProfileUsername;
          noPostsDiv.innerHTML = `
            <div class="post-content">
              <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                ${displayName} hasn't posted anything yet.
              </p>
            </div>
          `;
        } else {
          // Own profile with no posts
          noPostsDiv.innerHTML = `
            <div class="post-content">
              <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                You haven't posted anything yet. Share your first post above!
              </p>
            </div>
          `;
        }

        postsContainer.appendChild(noPostsDiv);
      }
      return;
    }

    // Sort posts by date (newest first)
    const sortedPosts = allPosts.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Display all posts
    sortedPosts.forEach((postData) => {
      const newPost = document.createElement("div");
      newPost.className = "post saved-post";

      // Add data attributes for filtering
      newPost.dataset.postId = postData.id;
      newPost.dataset.timestamp = new Date(postData.timestamp).getTime();

      const timeAgo = getTimeAgo(new Date(postData.timestamp));

      let mediaHtml = "";
      let hasImages = false;
      let hasVideos = false;
      let hasAudio = false;

      if (postData.media && postData.media.length > 0) {
        mediaHtml = '<div class="post-media">';

        // Separate media by type for better filter detection
        const images = postData.media.filter((m) =>
          m.type.startsWith("image/")
        );
        const videos = postData.media.filter((m) =>
          m.type.startsWith("video/")
        );
        const audios = postData.media.filter((m) =>
          m.type.startsWith("audio/")
        );

        // Images container
        if (images.length > 0) {
          hasImages = true;
          mediaHtml += '<div class="post-images">';
          images.forEach((media) => {
            mediaHtml += `<img src="${media.data}" alt="${media.name}" class="post-image">`;
          });
          mediaHtml += "</div>";
        }

        // Videos container
        if (videos.length > 0) {
          hasVideos = true;
          mediaHtml += '<div class="post-videos">';
          videos.forEach((media) => {
            mediaHtml += `
            <div class="media-with-title">
              <div class="media-player-wrapper">
                <video src="${media.data}" controls class="post-video"></video>
              </div>
              <div class="media-title">🎥 ${media.name}</div>
            </div>`;
          });
          mediaHtml += "</div>";
        }

        // Audio container
        if (audios.length > 0) {
          hasAudio = true;
          mediaHtml += '<div class="post-audio">';
          audios.forEach((media) => {
            mediaHtml += `
            <div class="media-with-title">
              <div class="media-player-wrapper">
                <audio src="${media.data}" controls class="post-audio-player"></audio>
              </div>
              <div class="media-title">🎵 ${media.name}</div>
            </div>`;
          });
          mediaHtml += "</div>";
        }

        mediaHtml += "</div>";
      }

      // Add media type data attributes
      newPost.dataset.hasImages = hasImages;
      newPost.dataset.hasVideos = hasVideos;
      newPost.dataset.hasAudio = hasAudio;
      newPost.dataset.isTextOnly = !hasImages && !hasVideos && !hasAudio;

      const likes = postData.likes || 0;
      const dislikes = postData.dislikes || 0;
      const currentUser = userManager.getCurrentUser();
      const currentUserLiked =
        currentUser &&
        postData.likedBy &&
        postData.likedBy.includes(currentUser.username);
      const currentUserDisliked =
        currentUser &&
        postData.dislikedBy &&
        postData.dislikedBy.includes(currentUser.username);

      // Show delete button only for post owner
      const isOwner = currentUser && currentUser.username === postData.authorId;
      const deleteButton = isOwner
        ? `<button class="delete-post-btn" onclick="deleteSavedPost(this, '${postData.id}')">Delete</button>`
        : "";

      newPost.innerHTML = `
      <div class="post-content">
        <p><strong><a href="#" onclick="viewUserProfile('${
          postData.authorUsername
        }'); return false;" class="profile-link">${
        postData.authorUsername.startsWith("@")
          ? postData.authorUsername
          : "@" + postData.authorUsername
      }</a>:</strong> ${postData.content}</p>
        ${mediaHtml}
        <div class="post-actions">
          <div class="vote-buttons">
            <button class="like-btn ${
              currentUserLiked ? "liked" : ""
            }" onclick="likePost('${postData.id}')">
              👍 <span class="like-count">${likes}</span>
            </button>
            <button class="dislike-btn ${
              currentUserDisliked ? "disliked" : ""
            }" onclick="dislikePost('${postData.id}')">
              👎 <span class="dislike-count">${dislikes}</span>
            </button>
          </div>
          <small>${timeAgo}</small>
          ${deleteButton}
        </div>
      </div>
    `;

      title.insertAdjacentElement("afterend", newPost);
    });

    // Initialize post filters after posts are loaded
    setTimeout(() => {
      initializePostFilters();
      applyFilters(); // Apply default filters
    }, 100);

    // Posts loaded - no custom audio initialization needed
  } catch (error) {
    console.error("Error loading posts:", error);
    const postsContainer =
      document.querySelector(".posts-section") ||
      document.querySelector(".posts-feed");
    if (postsContainer) {
      const title = postsContainer.querySelector("h3");
      if (title) {
        title.insertAdjacentHTML(
          "afterend",
          "<p>Error loading posts. Please refresh the page.</p>"
        );
      }
    }
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// Delete saved post function
function deleteSavedPost(element, postId) {
  const post = element.parentElement;
  post.style.opacity = "0";

  setTimeout(() => {
    post.remove();

    // Remove from user data
    if (userManager.isLoggedIn()) {
      const currentUser = userManager.getCurrentUser();
      if (currentUser.posts) {
        // Convert postId to number for comparison
        const numericPostId = parseInt(postId);
        currentUser.posts = currentUser.posts.filter(
          (p) => p.id !== numericPostId
        );
        userManager.updateUser({ posts: currentUser.posts });
      }
    }
  }, 300);
}

// Like post function
window.likePost = function (postId) {
  console.log("likePost called with ID:", postId);

  if (!userManager.isLoggedIn()) {
    return;
  }

  const currentUser = userManager.getCurrentUser();
  console.log("Current user:", currentUser ? currentUser.username : "none");

  try {
    // Find all users and their posts to track likes across all posts
    let allUsers = JSON.parse(localStorage.getItem("crossvine_users") || "{}");

    // Ensure allUsers is an object
    if (typeof allUsers !== "object" || Array.isArray(allUsers)) {
      console.error("Users data is corrupted, resetting...");
      allUsers = {};
      localStorage.setItem("crossvine_users", "{}");
      return;
    }

    let post = null;
    let postOwner = null;

    // Find the post across all users
    // Convert postId to number for comparison since it comes from HTML as string
    const numericPostId = parseInt(postId);
    for (let user of Object.values(allUsers)) {
      if (user.posts) {
        const foundPost = user.posts.find((p) => p.id === numericPostId);
        if (foundPost) {
          post = foundPost;
          postOwner = user;
          break;
        }
      }
    }

    if (!post || !postOwner) {
      console.error(
        "Post not found with ID:",
        postId,
        "(converted to:",
        numericPostId,
        ")"
      );
      return;
    }

    // Initialize arrays if they don't exist
    if (!post.likedBy) post.likedBy = [];
    if (!post.dislikedBy) post.dislikedBy = [];

    const userLiked = post.likedBy.includes(currentUser.username);
    const userDisliked = post.dislikedBy.includes(currentUser.username);

    if (userLiked) {
      // Remove like
      post.likedBy = post.likedBy.filter((id) => id !== currentUser.username);
      post.likes = Math.max((post.likes || 0) - 1, 0);
      console.log("Removed like from post", numericPostId);
    } else {
      // Check if user already interacted to prevent spam
      if (post.likedBy.includes(currentUser.username)) {
        console.log("User already liked this post");
        return;
      }

      // Add like
      post.likedBy.push(currentUser.username);
      post.likes = (post.likes || 0) + 1;
      console.log("Added like to post", numericPostId);

      // Remove dislike if user had disliked
      if (userDisliked) {
        post.dislikedBy = post.dislikedBy.filter(
          (id) => id !== currentUser.username
        );
        post.dislikes = Math.max((post.dislikes || 0) - 1, 0);
        console.log("Removed previous dislike");
      }
    }

    // Update post owner's like/dislike ratio
    updateUserLikeDislikeRatio(postOwner);

    // Update all users data in localStorage
    localStorage.setItem("crossvine_users", JSON.stringify(allUsers));

    // Update userManager cache to keep it in sync
    if (userManager.users[postOwner.username]) {
      userManager.users[postOwner.username] = postOwner;
    }

    // If we're on a profile page, check if we're viewing the post owner's profile
    if (window.location.pathname.includes("demoProfile1.html")) {
      const viewingProfileUsername = getCurrentlyViewedProfile();
      const profileBeingViewed = viewingProfileUsername || currentUser.username;

      // Update engagement ratio if we're viewing the post owner's profile
      if (profileBeingViewed === postOwner.username) {
        updateEngagementRatio(postOwner);
        console.log(
          `Updated engagement ratio for ${postOwner.username}'s profile after like`
        );
      }
    }

    // Update just the button states and counts without reloading all posts
    updatePostButtons(postId, post);
  } catch (error) {
    console.error("Error in likePost:", error);
    alert("Error updating like. Please try again.");
  }
};

// Dislike post function
window.dislikePost = function (postId) {
  console.log("dislikePost called with ID:", postId);

  if (!userManager.isLoggedIn()) {
    return;
  }

  const currentUser = userManager.getCurrentUser();
  console.log("Current user:", currentUser ? currentUser.username : "none");

  try {
    // Find all users and their posts to track dislikes across all posts
    let allUsers = JSON.parse(localStorage.getItem("crossvine_users") || "{}");

    // Ensure allUsers is an object
    if (typeof allUsers !== "object" || Array.isArray(allUsers)) {
      console.error("Users data is corrupted, resetting...");
      allUsers = {};
      localStorage.setItem("crossvine_users", "{}");
      return;
    }

    let post = null;
    let postOwner = null;

    // Find the post across all users
    // Convert postId to number for comparison since it comes from HTML as string
    const numericPostId = parseInt(postId);
    for (let user of Object.values(allUsers)) {
      if (user.posts) {
        const foundPost = user.posts.find((p) => p.id === numericPostId);
        if (foundPost) {
          post = foundPost;
          postOwner = user;
          break;
        }
      }
    }

    if (!post || !postOwner) {
      console.error(
        "Post not found with ID:",
        postId,
        "(converted to:",
        numericPostId,
        ")"
      );
      return;
    }

    // Initialize arrays if they don't exist
    if (!post.likedBy) post.likedBy = [];
    if (!post.dislikedBy) post.dislikedBy = [];

    const userLiked = post.likedBy.includes(currentUser.username);
    const userDisliked = post.dislikedBy.includes(currentUser.username);

    if (userDisliked) {
      // Remove dislike
      post.dislikedBy = post.dislikedBy.filter(
        (id) => id !== currentUser.username
      );
      post.dislikes = Math.max((post.dislikes || 0) - 1, 0);
      console.log("Removed dislike from post", numericPostId);
    } else {
      // Check if user already interacted to prevent spam
      if (post.dislikedBy.includes(currentUser.username)) {
        console.log("User already disliked this post");
        return;
      }

      // Add dislike
      post.dislikedBy.push(currentUser.username);
      post.dislikes = (post.dislikes || 0) + 1;
      console.log("Added dislike to post", numericPostId);

      // Remove like if user had liked
      if (userLiked) {
        post.likedBy = post.likedBy.filter((id) => id !== currentUser.username);
        post.likes = Math.max((post.likes || 0) - 1, 0);
        console.log("Removed previous like");
      }
    }

    // Update post owner's like/dislike ratio
    updateUserLikeDislikeRatio(postOwner);

    // Update all users data in localStorage
    localStorage.setItem("crossvine_users", JSON.stringify(allUsers));

    // Update userManager cache to keep it in sync
    if (userManager.users[postOwner.username]) {
      userManager.users[postOwner.username] = postOwner;
    }

    // If we're on a profile page, check if we're viewing the post owner's profile
    if (window.location.pathname.includes("demoProfile1.html")) {
      const viewingProfileUsername = getCurrentlyViewedProfile();
      const profileBeingViewed = viewingProfileUsername || currentUser.username;

      // Update engagement ratio if we're viewing the post owner's profile
      if (profileBeingViewed === postOwner.username) {
        updateEngagementRatio(postOwner);
        console.log(
          `Updated engagement ratio for ${postOwner.username}'s profile after dislike`
        );
      }
    }

    // Update just the button states and counts without reloading all posts
    updatePostButtons(postId, post);
  } catch (error) {
    console.error("Error in dislikePost:", error);
    alert("Error updating dislike. Please try again.");
  }
};

// Update specific post buttons without reloading entire feed
function updatePostButtons(postId, postData) {
  const currentUser = userManager.getCurrentUser();
  if (!currentUser) return;

  // Find the post element in the DOM
  const postElements = document.querySelectorAll(
    '[data-post-id="' + postId + '"]'
  );

  postElements.forEach((postElement) => {
    // Find the like and dislike buttons within this post
    const likeBtn = postElement.querySelector(".like-btn");
    const dislikeBtn = postElement.querySelector(".dislike-btn");
    const likeCount = postElement.querySelector(".like-count");
    const dislikeCount = postElement.querySelector(".dislike-count");

    if (likeBtn && dislikeBtn && likeCount && dislikeCount) {
      // Check current user's like/dislike status
      const userLiked =
        postData.likedBy && postData.likedBy.includes(currentUser.username);
      const userDisliked =
        postData.dislikedBy &&
        postData.dislikedBy.includes(currentUser.username);

      // Update like button
      likeBtn.className = `like-btn ${userLiked ? "liked" : ""}`;
      likeCount.textContent = postData.likes || 0;

      // Update dislike button
      dislikeBtn.className = `dislike-btn ${userDisliked ? "disliked" : ""}`;
      dislikeCount.textContent = postData.dislikes || 0;
    }
  });
}

// Update user's like/dislike ratio based on their posts
function updateUserLikeDislikeRatio(user) {
  if (!user.posts) return;

  let totalLikes = 0;
  let totalDislikes = 0;

  user.posts.forEach((post) => {
    totalLikes += post.likes || 0;
    totalDislikes += post.dislikes || 0;
  });

  user.totalLikes = totalLikes;
  user.totalDislikes = totalDislikes;
  user.likeDislikeRatio =
    totalLikes + totalDislikes > 0
      ? ((totalLikes / (totalLikes + totalDislikes)) * 100).toFixed(1)
      : 0;
}

// Clean up any existing like/dislike data on first load
// NOTE: This function was causing issues by resetting all like/dislike data on every page load
// Commented out to preserve user interactions
/*
function cleanupLikeDislikeData() {
  const allUsers = JSON.parse(localStorage.getItem("crossvine_users") || "{}");
  let dataChanged = false;

  Object.values(allUsers).forEach((user) => {
    if (user.posts) {
      user.posts.forEach((post) => {
        // Reset all like/dislike data
        if (post.likes || post.dislikes || post.likedBy || post.dislikedBy) {
          post.likes = 0;
          post.dislikes = 0;
          post.likedBy = [];
          post.dislikedBy = [];
          dataChanged = true;
        }
      });
    }
  });

  if (dataChanged) {
    localStorage.setItem("crossvine_users", JSON.stringify(allUsers));
  }
}
*/

// ===== STORAGE MANAGEMENT FUNCTIONS =====

// Clean up old posts to free storage space
function cleanupOldPosts(user) {
  if (!user || !user.posts || user.posts.length === 0) {
    return false;
  }

  const originalCount = user.posts.length;

  // Remove posts older than 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  user.posts = user.posts.filter((post) => {
    const postDate = new Date(post.timestamp);
    return postDate > ninetyDaysAgo;
  });

  // If still too many posts, keep only the most recent 50
  if (user.posts.length > 50) {
    user.posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    user.posts = user.posts.slice(0, 50);
  }

  const cleanedCount = originalCount - user.posts.length;
  if (cleanedCount > 0) {
    console.log(
      `Cleaned up ${cleanedCount} old posts for user ${user.username}`
    );
    return true;
  }

  return false;
}

// Check localStorage usage and provide cleanup options
function checkStorageUsage() {
  try {
    const users = localStorage.getItem("crossvine_users") || "{}";
    const usageBytes = new Blob([users]).size;
    const usageMB = (usageBytes / (1024 * 1024)).toFixed(2);

    console.log(`Current storage usage: ${usageMB} MB`);

    // LocalStorage limit is typically 5-10MB
    if (usageBytes > 8 * 1024 * 1024) {
      // 8MB threshold
      return {
        critical: true,
        usage: usageMB,
        message: "Storage is critically full. Please clean up old posts.",
      };
    } else if (usageBytes > 5 * 1024 * 1024) {
      // 5MB warning
      return {
        warning: true,
        usage: usageMB,
        message: "Storage is getting full. Consider cleaning up old posts.",
      };
    }

    return {
      ok: true,
      usage: usageMB,
      message: `Storage usage: ${usageMB} MB`,
    };
  } catch (error) {
    console.error("Error checking storage:", error);
    return {
      error: true,
      message: "Could not check storage usage",
    };
  }
}

// Clean up all users' old posts globally
function globalStorageCleanup() {
  try {
    const allUsers = JSON.parse(
      localStorage.getItem("crossvine_users") || "{}"
    );
    let totalCleaned = 0;

    Object.values(allUsers).forEach((user) => {
      const cleaned = cleanupOldPosts(user);
      if (cleaned) totalCleaned++;
    });

    if (totalCleaned > 0) {
      localStorage.setItem("crossvine_users", JSON.stringify(allUsers));
      console.log(
        `Global cleanup completed. Cleaned ${totalCleaned} users' old posts.`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error during global cleanup:", error);
    return false;
  }
}

// Emergency storage reset (use with caution)
function emergencyStorageReset() {
  if (
    confirm(
      "WARNING: This will delete all posts but keep user accounts. Are you sure?"
    )
  ) {
    try {
      const allUsers = JSON.parse(
        localStorage.getItem("crossvine_users") || "{}"
      );

      // Keep user accounts but clear posts
      Object.values(allUsers).forEach((user) => {
        user.posts = [];
        user.savedHashtags = [];
      });

      localStorage.setItem("crossvine_users", JSON.stringify(allUsers));
      console.log(
        "Emergency storage reset completed. All posts deleted but accounts preserved."
      );
      console.log("Storage reset completed. Please refresh the page.");
      return true;
    } catch (error) {
      console.error("Error during emergency reset:", error);
      alert("Error during storage reset: " + error.message);
      return false;
    }
  }
  return false;
}

// Enhanced user manager with storage management
if (typeof userManager !== "undefined") {
  // Override the saveUsers method to handle storage quota
  const originalSaveUsers = userManager.saveUsers.bind(userManager);
  userManager.saveUsers = function () {
    try {
      originalSaveUsers();
    } catch (error) {
      if (error.message.includes("Storage quota exceeded")) {
        // Try cleanup first
        const cleaned = globalStorageCleanup();
        if (cleaned) {
          try {
            originalSaveUsers();
            console.log("Successfully saved after cleanup");
            return;
          } catch (secondError) {
            console.error("Still can't save after cleanup:", secondError);
          }
        }

        // If cleanup didn't help, offer emergency reset
        const reset = confirm(
          "Storage is full and cleanup didn't help. Reset all posts? (Keeps accounts)"
        );
        if (reset) {
          emergencyStorageReset();
        }
      }
      throw error;
    }
  };
}

// ===== PROFILE NAVIGATION FUNCTIONS =====

// Navigate to current user's own profile
function goToMyProfile() {
  // Clear any viewing profile state to ensure we go to own profile
  localStorage.removeItem("crossvine_viewing_profile");

  // Navigate to profile page
  window.location.href = "demoProfile1.html";
}

// Navigate to a user's profile
function viewUserProfile(username) {
  if (!username) {
    console.error("No username provided for profile view");
    return;
  }

  // Store the profile username in localStorage for the profile page to use
  localStorage.setItem("crossvine_viewing_profile", username);

  // Navigate to profile page
  window.location.href = "demoProfile1.html";
}

// Get the currently viewed profile (for profile page)
function getCurrentlyViewedProfile() {
  const viewingProfile = localStorage.getItem("crossvine_viewing_profile");
  const currentUser = userManager.getCurrentUser();

  // If viewing profile is set and it's different from current user, return that
  if (
    viewingProfile &&
    currentUser &&
    viewingProfile !== currentUser.username
  ) {
    return viewingProfile;
  }

  // Otherwise, clear the viewing profile and show current user's profile
  localStorage.removeItem("crossvine_viewing_profile");
  return null;
}

// Get user data for profile display
function getUserForProfile(username) {
  const allUsers = JSON.parse(localStorage.getItem("crossvine_users") || "{}");
  return allUsers[username] || null;
}

// Check if current user is viewing their own profile
function isViewingOwnProfile() {
  const currentUser = userManager.getCurrentUser();
  const viewingProfile = getCurrentlyViewedProfile();

  return (
    !viewingProfile || (currentUser && viewingProfile === currentUser.username)
  );
}

// ===== END PROFILE NAVIGATION =====

// ===== POST FILTERING SYSTEM =====

// Current filter state
let currentFilters = {
  sort: "recent",
  showImages: true,
  showVideos: true,
  showAudio: true,
  showText: true,
};

// Initialize post filters
function initializePostFilters() {
  const isProfilePage = window.location.pathname.includes("demoProfile1.html");
  const sortSelector = isProfilePage ? "#sortFilterProfile" : "#sortFilter";
  const imageSelector = isProfilePage ? "#showImagesProfile" : "#showImages";
  const videoSelector = isProfilePage ? "#showVideosProfile" : "#showVideos";
  const audioSelector = isProfilePage ? "#showAudioProfile" : "#showAudio";
  const textSelector = isProfilePage ? "#showTextProfile" : "#showText";
  const resetSelector = isProfilePage
    ? "#resetFiltersProfile"
    : "#resetFilters";

  // Sort filter
  const sortFilter = document.querySelector(sortSelector);
  if (sortFilter) {
    sortFilter.addEventListener("change", function () {
      currentFilters.sort = this.value;
      applyFilters();
    });
  }

  // Media type filters
  const imageFilter = document.querySelector(imageSelector);
  const videoFilter = document.querySelector(videoSelector);
  const audioFilter = document.querySelector(audioSelector);
  const textFilter = document.querySelector(textSelector);

  if (imageFilter) {
    imageFilter.addEventListener("change", function () {
      currentFilters.showImages = this.checked;
      applyFilters();
    });
  }

  if (videoFilter) {
    videoFilter.addEventListener("change", function () {
      currentFilters.showVideos = this.checked;
      applyFilters();
    });
  }

  if (audioFilter) {
    audioFilter.addEventListener("change", function () {
      currentFilters.showAudio = this.checked;
      applyFilters();
    });
  }

  if (textFilter) {
    textFilter.addEventListener("change", function () {
      currentFilters.showText = this.checked;
      applyFilters();
    });
  }

  // Reset filters button
  const resetButton = document.querySelector(resetSelector);
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      resetFilters();
    });
  }
}

// Apply current filters to posts
function applyFilters() {
  const posts = document.querySelectorAll(".post.saved-post");
  const postsArray = Array.from(posts);

  // Get posts data for sorting
  const postsData = postsArray.map((postElement) => {
    const postId = postElement.dataset.postId;
    const likes = parseInt(
      postElement.querySelector(".like-count")?.textContent || "0"
    );
    const dislikes = parseInt(
      postElement.querySelector(".dislike-count")?.textContent || "0"
    );
    const timestamp = parseInt(postElement.dataset.timestamp || "0");
    const hasImages = postElement.dataset.hasImages === "true";
    const hasVideos = postElement.dataset.hasVideos === "true";
    const hasAudio = postElement.dataset.hasAudio === "true";
    const isTextOnly = postElement.dataset.isTextOnly === "true";

    return {
      element: postElement,
      postId,
      likes,
      dislikes,
      timestamp,
      hasImages,
      hasVideos,
      hasAudio,
      isTextOnly,
    };
  });

  // Filter posts by media type
  const filteredPosts = postsData.filter((post) => {
    if (!currentFilters.showImages && post.hasImages) return false;
    if (!currentFilters.showVideos && post.hasVideos) return false;
    if (!currentFilters.showAudio && post.hasAudio) return false;
    if (!currentFilters.showText && post.isTextOnly) return false;
    return true;
  });

  // Sort posts
  filteredPosts.sort((a, b) => {
    switch (currentFilters.sort) {
      case "recent":
        return b.timestamp - a.timestamp;
      case "oldest":
        return a.timestamp - b.timestamp;
      case "most-likes":
        return b.likes - a.likes;
      case "least-likes":
        return a.likes - b.likes;
      case "most-dislikes":
        return b.dislikes - a.dislikes;
      case "least-dislikes":
        return a.dislikes - b.dislikes;
      default:
        return b.timestamp - a.timestamp;
    }
  });

  // Hide all posts first
  postsArray.forEach((post) => {
    post.style.display = "none";
  });

  // Show and reorder filtered posts
  const container =
    document.querySelector(".posts-feed") ||
    document.querySelector(".posts-section");
  if (container) {
    filteredPosts.forEach((post, index) => {
      post.element.style.display = "block";
      post.element.style.order = index;
      container.appendChild(post.element); // Move to end to reorder
    });
  }

  // Update posts count/title if needed
  updatePostsTitle(filteredPosts.length, postsArray.length);
}

// Reset all filters to default
function resetFilters() {
  currentFilters = {
    sort: "recent",
    showImages: true,
    showVideos: true,
    showAudio: true,
    showText: true,
  };

  // Reset UI elements
  const isProfilePage = window.location.pathname.includes("demoProfile1.html");
  const sortSelector = isProfilePage ? "#sortFilterProfile" : "#sortFilter";
  const imageSelector = isProfilePage ? "#showImagesProfile" : "#showImages";
  const videoSelector = isProfilePage ? "#showVideosProfile" : "#showVideos";
  const audioSelector = isProfilePage ? "#showAudioProfile" : "#showAudio";
  const textSelector = isProfilePage ? "#showTextProfile" : "#showText";

  const sortFilter = document.querySelector(sortSelector);
  const imageFilter = document.querySelector(imageSelector);
  const videoFilter = document.querySelector(videoSelector);
  const audioFilter = document.querySelector(audioSelector);
  const textFilter = document.querySelector(textSelector);

  if (sortFilter) sortFilter.value = "recent";
  if (imageFilter) imageFilter.checked = true;
  if (videoFilter) videoFilter.checked = true;
  if (audioFilter) audioFilter.checked = true;
  if (textFilter) textFilter.checked = true;

  applyFilters();
}

// Update posts title to show filter results
function updatePostsTitle(filteredCount, totalCount) {
  const titleElement =
    document.querySelector(".posts-feed h3") ||
    document.querySelector(".posts-section h3");
  if (titleElement) {
    const isProfilePage =
      window.location.pathname.includes("demoProfile1.html");
    const viewingProfile = getCurrentlyViewedProfile();
    const currentUser = userManager.getCurrentUser();

    let baseTitle;
    if (isProfilePage) {
      if (viewingProfile) {
        baseTitle = `${viewingProfile}'s Posts`;
      } else {
        baseTitle = "My Posts";
      }
    } else {
      baseTitle = "Recent Posts";
    }

    if (filteredCount === totalCount) {
      titleElement.textContent = baseTitle;
    } else {
      titleElement.textContent = `${baseTitle} (${filteredCount} of ${totalCount})`;
    }
  }
}

// Detect media type from post element
function getPostMediaType(postElement) {
  const hasImages =
    postElement.querySelector(".post-images") &&
    postElement.querySelector(".post-images").children.length > 0;
  const hasVideos =
    postElement.querySelector(".post-videos") &&
    postElement.querySelector(".post-videos").children.length > 0;
  const hasAudio =
    postElement.querySelector(".post-audio") &&
    postElement.querySelector(".post-audio").children.length > 0;

  const types = [];
  if (hasImages) types.push("images");
  if (hasVideos) types.push("videos");
  if (hasAudio) types.push("audio");
  if (types.length === 0) types.push("text");

  return types;
}

// ===== END POST FILTERING SYSTEM =====

// ===== END STORAGE MANAGEMENT =====
