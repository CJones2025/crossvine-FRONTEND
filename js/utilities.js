// Utilities and Helper Functions

// Remove hashtag function
function removeHashtag(element) {
  const hashtag = element.parentElement;
  const hashtagText = hashtag.textContent.replace("×", "").trim();

  // Remove from user's saved hashtags
  removeHashtagFromSaved(hashtagText);
}

// Save hashtag for logged in user
// Debouncing object to prevent rapid duplicate calls
const hashtagSaveDebounce = {};

function saveHashtag(hashtagText) {
  // Debounce check - prevent rapid duplicate saves
  const now = Date.now();
  if (
    hashtagSaveDebounce[hashtagText] &&
    now - hashtagSaveDebounce[hashtagText] < 1000
  ) {
    console.log(`Ignoring duplicate save for ${hashtagText}`);
    return;
  }
  hashtagSaveDebounce[hashtagText] = now;

  if (!userManager.isLoggedIn()) {
    return;
  }

  const currentUser = userManager.getCurrentUser();
  if (!currentUser.savedHashtags) {
    currentUser.savedHashtags = [];
  }

  // Check if hashtag is already saved
  if (currentUser.savedHashtags.includes(hashtagText)) {
    return;
  }

  // Add hashtag to saved list
  currentUser.savedHashtags.push(hashtagText);

  // Update user in storage
  userManager.updateUser({ savedHashtags: currentUser.savedHashtags });

  // Refresh sidebar to show new hashtag
  updateSidebar();

  // Hashtag saved successfully
}

// Remove hashtag for logged in user
function removeHashtagFromSaved(hashtagText) {
  if (!userManager.isLoggedIn()) return;

  const currentUser = userManager.getCurrentUser();
  if (!currentUser.savedHashtags) return;

  // Remove hashtag from saved list
  const index = currentUser.savedHashtags.indexOf(hashtagText);
  if (index > -1) {
    currentUser.savedHashtags.splice(index, 1);

    // Update user in storage
    userManager.updateUser({ savedHashtags: currentUser.savedHashtags });

    // Refresh sidebar to reflect removal
    updateSidebar();
  }
}

// Initialize hashtag click handlers
function initializeHashtagHandlers() {
  // Add click handlers for trending hashtags (not removable ones)
  const trendingHashtags = document.querySelectorAll(".hashtag.trending");

  trendingHashtags.forEach((hashtag) => {
    // Remove any existing event listeners to prevent duplicates
    const newHashtag = hashtag.cloneNode(true);
    hashtag.parentNode.replaceChild(newHashtag, hashtag);

    // Add the click handler to the clean element
    newHashtag.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();

        const hashtagText = this.textContent.trim();

        // If logged in, save the hashtag
        if (userManager.isLoggedIn()) {
          saveHashtag(hashtagText);
        } else {
          // User not logged in
        }
      },
      { once: false }
    ); // Use once: false to allow multiple clicks but prevent duplicates
  });

  console.log(
    `Initialized hashtag handlers for ${trendingHashtags.length} hashtags`
  );
}

// Search functionality
function handleSearch() {
  const searchBar = document.querySelector(".search-bar");
  const searchType = document.getElementById("searchType");
  const searchTerm = searchBar.value.toLowerCase().trim();
  const searchMode = searchType ? searchType.value : "hashtag";

  if (searchTerm) {
    const allUsers = JSON.parse(
      localStorage.getItem("crossvine_users") || "{}"
    );
    let matchingResults = [];

    if (searchMode === "hashtag") {
      // Search for hashtags in posts
      const hashtagPattern = searchTerm.startsWith("#") ? searchTerm : `#${searchTerm}`;
      Object.values(allUsers).forEach((user) => {
        if (user.posts && Array.isArray(user.posts)) {
          user.posts.forEach((post) => {
            if (post.content.toLowerCase().includes(hashtagPattern.toLowerCase())) {
              matchingResults.push({
                ...post,
                authorName: user.fullname || user.username,
                authorUsername: user.username,
                type: 'post'
              });
            }
          });
        }
      });
    } else if (searchMode === "user") {
      // Search for users by username or display name
      const userPattern = searchTerm.startsWith("@") ? searchTerm.substring(1) : searchTerm;
      Object.values(allUsers).forEach((user) => {
        const username = (user.username || "").toLowerCase();
        const displayName = (user.displayName || user.fullname || "").toLowerCase();
        
        if (username.includes(userPattern) || displayName.includes(userPattern)) {
          matchingResults.push({
            username: user.username,
            displayName: user.displayName || user.fullname,
            type: 'user'
          });
          
          // Also include their posts
          if (user.posts && Array.isArray(user.posts)) {
            user.posts.forEach((post) => {
              matchingResults.push({
                ...post,
                authorName: user.fullname || user.username,
                authorUsername: user.username,
                type: 'post'
              });
            });
          }
        }
      });
    } else if (searchMode === "keywords") {
      // Search for keywords in post content
      Object.values(allUsers).forEach((user) => {
        if (user.posts && Array.isArray(user.posts)) {
          user.posts.forEach((post) => {
            if (post.content.toLowerCase().includes(searchTerm)) {
              matchingResults.push({
                ...post,
                authorName: user.fullname || user.username,
                authorUsername: user.username,
                type: 'post'
              });
            }
          });
        }
      });
    }

    // Display search results
    if (matchingResults.length > 0) {
      const postResults = matchingResults.filter(r => r.type === 'post');
      const userResults = matchingResults.filter(r => r.type === 'user');
      
      let resultMessage = `Found ${matchingResults.length} result(s)`;
      if (userResults.length > 0) resultMessage += ` (${userResults.length} user(s), ${postResults.length} post(s))`;
      
      console.log(`${resultMessage} for "${searchTerm}". Check the posts feed to see results highlighted.`);
      highlightSearchResults(searchTerm);
      
      // If user search, show user profiles
      if (searchMode === "user" && userResults.length > 0) {
        console.log("Found users:", userResults.map(u => `@${u.username} (${u.displayName})`));
      }
    } else {
      console.log(`No results found for "${searchTerm}" in ${searchMode} search.`);
    }
  }
}

// Highlight search results in the posts feed
function highlightSearchResults(searchTerm) {
  const posts = document.querySelectorAll(".post");
  posts.forEach((post) => {
    const content = post.querySelector(".post-content p");
    if (
      content &&
      content.textContent.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      post.style.backgroundColor = "#e8f5e9";
      post.style.border = "3px solid #4caf50";

      // Remove highlight after 3 seconds
      setTimeout(() => {
        post.style.backgroundColor = "";
        post.style.border = "";
      }, 3000);
    }
  });
}

// Update search placeholder based on search type
function updateSearchPlaceholder() {
  const searchType = document.getElementById("searchType");
  const searchBar = document.querySelector(".search-bar");
  
  if (searchType && searchBar) {
    const placeholders = {
      hashtag: "Search hashtags...",
      user: "Search users...", 
      keywords: "Search keywords..."
    };
    
    const selectedType = searchType.value;
    const newPlaceholder = placeholders[selectedType] || "Search...";
    
    // Update the placeholder text
    searchBar.placeholder = newPlaceholder;
    searchBar.setAttribute('placeholder', newPlaceholder);
    
    console.log(`Search placeholder updated to: "${newPlaceholder}"`);
  }
}

// Initialize search functionality
function initializeSearchFunctionality() {
  const searchBar = document.querySelector(".search-bar");
  const searchType = document.getElementById("searchType");
  
  console.log('Initializing search functionality...', { 
    searchBar: !!searchBar, 
    searchType: !!searchType 
  });
  
  if (searchBar) {
    // Remove any existing listeners to avoid duplicates
    searchBar.removeEventListener("keypress", handleSearchKeypress);
    searchBar.addEventListener("keypress", handleSearchKeypress);
  }
  
  if (searchType) {
    // Set initial placeholder
    updateSearchPlaceholder();
    
    // Remove any existing listeners to avoid duplicates
    searchType.removeEventListener("change", handleSearchTypeChange);
    searchType.addEventListener("change", handleSearchTypeChange);
    
    console.log('Search functionality initialized successfully');
  } else {
    console.log('Search type dropdown not found, retrying in 100ms...');
    setTimeout(initializeSearchFunctionality, 100);
  }
}

// Helper functions for event handling
function handleSearchKeypress(e) {
  if (e.key === "Enter") {
    handleSearch();
  }
}

function handleSearchTypeChange(e) {
  console.log('Search type changed to:', e.target.value);
  updateSearchPlaceholder();
}

// Make updateSearchPlaceholder globally accessible for debugging
window.updateSearchPlaceholder = updateSearchPlaceholder;

// Initialize search functionality when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Add hashtag click functionality to existing posts
  addHashtagClickListeners();

  // Initialize search functionality
  initializeSearchFunctionality();
});

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
  // DOM is still loading, DOMContentLoaded will fire
} else {
  // DOM is already loaded, initialize immediately
  setTimeout(() => {
    addHashtagClickListeners();
    initializeSearchFunctionality();
  }, 0);
}

// Function to update engagement ratio display
function updateEngagementRatio(user) {
  // Calculate real likes/dislikes from user's posts
  let totalLikes = 0;
  let totalDislikes = 0;

  if (user.posts && user.posts.length > 0) {
    user.posts.forEach((post) => {
      totalLikes += post.likes || 0;
      totalDislikes += post.dislikes || 0;
    });
  }

  const total = totalLikes + totalDislikes;
  const likedPercentage = total > 0 ? (totalLikes / total) * 100 : 0;
  const dislikedPercentage = total > 0 ? (totalDislikes / total) * 100 : 0;

  // Update the ratio bar
  const ratioLikes = document.getElementById("ratioLikes");
  const ratioDislikes = document.getElementById("ratioDislikes");

  if (ratioLikes) {
    ratioLikes.style.width = `${likedPercentage}%`;
  }

  if (ratioDislikes) {
    ratioDislikes.style.width = `${dislikedPercentage}%`;
  }

  // Update the counts
  const likesCount = document.getElementById("likesCount");
  const dislikesCount = document.getElementById("dislikesCount");

  if (likesCount) {
    likesCount.textContent = totalLikes;
  }

  if (dislikesCount) {
    dislikesCount.textContent = totalDislikes;
  }

  // Update overall ratio percentage
  const ratioPercent = document.querySelector(".ratio-percent");
  if (ratioPercent && total > 0) {
    ratioPercent.textContent = `${likedPercentage.toFixed(1)}% liked`;
  } else if (ratioPercent) {
    ratioPercent.textContent = "No ratings yet";
  }
}
