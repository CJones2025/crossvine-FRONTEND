// Demo Data Initialization

// Create demo users and posts for testing
function initializeDemoData() {
  // Check if demo data already exists
  const existingUsers = JSON.parse(
    localStorage.getItem("crossvine_users") || "{}"
  );

  if (Object.keys(existingUsers).length > 0) {
    console.log("Demo data already exists, skipping initialization");
    return;
  }

  // Create demo users
  const demoUsers = {
    "@demo": {
      username: "@demo",
      fullname: "Demo User",
      password: "demo123",
      bio: "This is a demo account for testing purposes!",
      profileImage: "IMG/DemoUser.png",
      posts: [
        {
          content:
            "Welcome to Crossvine! This is my first post. 🎉 #welcome #firstpost",
          media: [],
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          id: Date.now() - 100000,
          authorId: "@demo",
          likes: 5,
          dislikes: 0,
          likedBy: ["@user1", "@user2"],
          dislikedBy: [],
        },
        {
          content: "Just testing the hashtag system! #testing #hashtags #demo",
          media: [],
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          id: Date.now() - 50000,
          authorId: "@demo",
          likes: 3,
          dislikes: 1,
          likedBy: ["@user1"],
          dislikedBy: ["@user2"],
        },
        {
          content:
            "This platform is looking great! Can't wait to see more features. #excited #social",
          media: [],
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          id: Date.now() - 25000,
          authorId: "@demo",
          likes: 2,
          dislikes: 0,
          likedBy: ["@user2"],
          dislikedBy: [],
        },
      ],
      savedHashtags: ["#welcome", "#testing", "#demo"],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      totalLikes: 10,
      totalDislikes: 1,
      likeDislikeRatio: 90.9,
    },
    "@john": {
      username: "@john",
      fullname: "John Smith",
      password: "john123",
      bio: "Tech enthusiast and coffee lover ☕",
      profileImage: "IMG/DemoUser.png",
      posts: [
        {
          content:
            "Good morning everyone! Starting the day with some coffee. ☕ #morning #coffee",
          media: [],
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          id: Date.now() - 120000,
          authorId: "@john",
          likes: 4,
          dislikes: 0,
          likedBy: ["@demo", "@sarah"],
          dislikedBy: [],
        },
        {
          content:
            "Working on some exciting projects today! #coding #development #tech",
          media: [],
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          id: Date.now() - 30000,
          authorId: "@john",
          likes: 6,
          dislikes: 0,
          likedBy: ["@demo", "@sarah", "@mike"],
          dislikedBy: [],
        },
      ],
      savedHashtags: ["#coffee", "#tech", "#coding"],
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      totalLikes: 10,
      totalDislikes: 0,
      likeDislikeRatio: 100,
    },
    "@sarah": {
      username: "@sarah",
      fullname: "Sarah Johnson",
      password: "sarah123",
      bio: "Designer | Artist | Nature lover 🌿",
      profileImage: "IMG/DemoUser.png",
      posts: [
        {
          content:
            "Beautiful sunset today! Nature never fails to amaze me. 🌅 #sunset #nature #beautiful",
          media: [],
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          id: Date.now() - 150000,
          authorId: "@sarah",
          likes: 8,
          dislikes: 0,
          likedBy: ["@demo", "@john", "@mike"],
          dislikedBy: [],
        },
      ],
      savedHashtags: ["#nature", "#art", "#design"],
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
      totalLikes: 8,
      totalDislikes: 0,
      likeDislikeRatio: 100,
    },
  };

  // Save demo data to localStorage
  localStorage.setItem("crossvine_users", JSON.stringify(demoUsers));
  console.log("Demo data initialized successfully!");
  console.log("Available demo accounts:");
  console.log("- Username: @demo, Password: demo123");
  console.log("- Username: @john, Password: john123");
  console.log("- Username: @sarah, Password: sarah123");
}

// Auto-initialize demo data when this script loads
document.addEventListener("DOMContentLoaded", function () {
  initializeDemoData();
});
