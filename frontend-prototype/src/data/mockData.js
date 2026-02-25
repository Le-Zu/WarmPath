// Mock Users
export const users = [
  { id: 1, name: "You (Jordan)", year: "Junior", major: "Computer Science" },
  { id: 2, name: "Alex Chen", year: "Senior", major: "Computer Science" },
  { id: 3, name: "Maya Rodriguez", year: "Junior", major: "Political Science" },
  { id: 4, name: "Sam Kim", year: "Senior", major: "Economics" },
  { id: 5, name: "Rachel Park", year: "PhD", major: "Biology" },
  { id: 6, name: "Tyler Johnson", year: "Sophomore", major: "Business" },
  { id: 7, name: "Emma Davis", year: "Senior", major: "Data Science" },
  { id: 8, name: "Chris Martinez", year: "Junior", major: "Finance" },
];

// Connections between users (bidirectional)
// userA knows userB with given context and warmth level
export const connections = [
  // Jordan's direct connections
  { userA: 1, userB: 2, context: "CS 201 study group", warmth: "Worked together" },
  { userA: 1, userB: 3, context: "Debate club", warmth: "Same org" },
  { userA: 1, userB: 6, context: "Dorm roommates freshman year", warmth: "Lived together" },

  // Alex's connections (Jordan's friend)
  { userA: 2, userB: 4, context: "Summer internship at same company", warmth: "Worked together" },
  { userA: 2, userB: 5, context: "Research lab", warmth: "Worked together" },

  // Maya's connections
  { userA: 3, userB: 5, context: "Met at career fair", warmth: "Met once" },
  { userA: 3, userB: 4, context: "Model UN together", warmth: "Same org" },

  // Sam's connections
  { userA: 4, userB: 6, context: "Business fraternity", warmth: "Same org" },

  // Tyler's connections
  { userA: 6, userB: 5, context: "Bio TA office hours regular", warmth: "Met a few times" },

  // Emma's connections
  { userA: 7, userB: 2, context: "ML research project", warmth: "Worked together" },
  { userA: 7, userB: 4, context: "Data analytics club", warmth: "Same org" },
  { userA: 7, userB: 1, context: "CS 201 lab partners", warmth: "Worked together" },

  // Chris's connections
  { userA: 8, userB: 4, context: "Investment club", warmth: "Same org" },
  { userA: 8, userB: 6, context: "Business fraternity", warmth: "Same org" },
  { userA: 8, userB: 3, context: "Econ study group", warmth: "Worked together" },
];

// Categories for intents
export const categories = [
  { id: "class", label: "Class / Professor", icon: "📚" },
  { id: "internship", label: "Internship / Career", icon: "💼" },
  { id: "research", label: "Research / Lab", icon: "🔬" },
  { id: "club", label: "Club / Leadership", icon: "🎯" },
  { id: "skill", label: "Skill / Project help", icon: "🛠️" },
];

// Sample intents (some from other users for connector prompts)
export const intents = [
  {
    id: 1,
    userId: 1,
    category: "internship",
    description: "Looking for advice on consulting recruiting",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    userId: 6,
    category: "research",
    description: "Want to join a biology research lab",
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    userId: 3,
    category: "skill",
    description: "Need help learning Python for data analysis",
    timestamp: new Date(Date.now() - 172800000).toISOString()
  },
];

// Intro requests
export let introRequests = [
  {
    id: 1,
    intentId: 2,
    requesterId: 6,
    connectorId: 1,
    targetId: 2,
    message: "Hi! Tyler here. I'm really interested in getting into biology research and heard Alex has experience in Prof. Kim's lab. Would you be able to introduce us? I'd love to learn about what working in a research lab is like.",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    contactShared: false
  },
  {
    id: 2,
    intentId: null,
    requesterId: 1,
    connectorId: 3,
    targetId: 4,
    message: "Hi Maya! I'm looking for advice on consulting recruiting and heard Sam has experience as a McKinsey summer analyst. Would you be able to introduce us? I'd really appreciate any insights they could share.",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    contactShared: false
  },
  {
    id: 3,
    intentId: null,
    requesterId: 1,
    connectorId: 2,
    targetId: 5,
    message: "Hey Alex! I'm interested in learning about research opportunities and heard Rachel has been in Prof. Kim's biology lab for 3 years. Could you connect us? I'd love to hear about her experience.",
    status: "declined",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    contactShared: false
  }
];

// User details with additional info for context pre-reads
export const userDetails = {
  1: {
    experiences: ["CS 201 TA", "Debate club treasurer", "Hackathon winner 2024"],
    interests: ["Machine learning", "Public speaking", "Startups"],
    contactEmail: "jordan.lee@stanford.edu"
  },
  2: {
    experiences: ["Google SWE intern", "Prof. Kim's ML lab", "CS tutor"],
    interests: ["Distributed systems", "AI research", "Rock climbing"],
    contactEmail: "alex.chen@stanford.edu"
  },
  3: {
    experiences: ["Model UN president", "Policy research intern", "Campus tour guide"],
    interests: ["International relations", "Public policy", "Data journalism"],
    contactEmail: "maya.rodriguez@stanford.edu"
  },
  4: {
    experiences: ["McKinsey summer analyst", "Economics TA", "Investment club lead"],
    interests: ["Consulting", "Fintech", "Case competitions"],
    contactEmail: "sam.kim@stanford.edu"
  },
  5: {
    experiences: ["Prof. Kim's biology lab (3 years)", "Published researcher", "Bio 101 TA"],
    interests: ["Genetics", "CRISPR research", "Science communication"],
    contactEmail: "rachel.park@stanford.edu"
  },
  6: {
    experiences: ["Business fraternity member", "Startup weekend participant"],
    interests: ["Entrepreneurship", "Biology", "Product management"],
    contactEmail: "tyler.johnson@stanford.edu"
  },
  7: {
    experiences: ["Data science intern at Meta", "ML research assistant", "Kaggle competitions"],
    interests: ["Machine learning", "Data visualization", "Statistics"],
    contactEmail: "emma.davis@stanford.edu"
  },
  8: {
    experiences: ["Goldman Sachs summer intern", "Finance club treasurer", "Equity research"],
    interests: ["Investment banking", "Private equity", "Financial modeling"],
    contactEmail: "chris.martinez@stanford.edu"
  }
};

// Helper function to get user by ID
export function getUserById(id) {
  return users.find(u => u.id === id);
}

// Helper function to get connections for a user
export function getConnectionsForUser(userId) {
  return connections.filter(c => c.userA === userId || c.userB === userId);
}

// Helper function to find paths from one user to targets matching a category
export function findPaths(fromUserId, category) {
  const directConnections = getConnectionsForUser(fromUserId);
  const paths = [];

  directConnections.forEach(conn => {
    const connectorId = conn.userA === fromUserId ? conn.userB : conn.userA;
    const connectorConnections = getConnectionsForUser(connectorId);

    connectorConnections.forEach(conn2 => {
      const targetId = conn2.userA === connectorId ? conn2.userB : conn2.userA;

      // Don't include paths back to self
      if (targetId === fromUserId) return;

      // Check if target has relevant experience for the category
      const targetDetails = userDetails[targetId];
      if (!targetDetails) return;

      const isRelevant = checkRelevance(targetDetails, category);
      if (!isRelevant) return;

      paths.push({
        connector: {
          user: getUserById(connectorId),
          context: conn.context,
          warmth: conn.warmth,
          openToIntros: true // All connectors open for MVP
        },
        target: {
          user: getUserById(targetId),
          context: conn2.context,
          warmth: conn2.warmth
        }
      });
    });
  });

  return paths;
}

// Check if a user's details are relevant to a category
function checkRelevance(details, category) {
  const keywords = {
    class: ["TA", "tutor", "professor", "class"],
    internship: ["intern", "analyst", "SWE", "consulting", "career"],
    research: ["lab", "research", "published", "PhD"],
    club: ["club", "president", "lead", "organization", "fraternity"],
    skill: ["tutor", "TA", "hackathon", "project"]
  };

  const relevantKeywords = keywords[category] || [];
  const allText = [...details.experiences, ...details.interests].join(" ").toLowerCase();

  return relevantKeywords.some(kw => allText.includes(kw.toLowerCase()));
}

// Generate an intro message
export function generateIntroMessage(requester, connector, target, intent) {
  const templates = [
    `Hi! I'm ${requester.name}, a ${requester.year} studying ${requester.major}. I'm currently ${intent.description.toLowerCase()} and heard that ${target.name} might have relevant experience. Would you be willing to make an introduction? I'd really appreciate any insights they could share.`,
    `Hey! ${requester.name} here. I noticed through our connection that ${target.name} has experience that could help me—I'm ${intent.description.toLowerCase()}. If you think it'd be a good fit, I'd love an intro. No pressure if not!`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate context pre-read for an intro
export function generateContextPreRead(user1, user2) {
  const details1 = userDetails[user1.id];
  const details2 = userDetails[user2.id];

  return {
    person1: {
      name: user1.name,
      bullets: [
        `${user1.year} in ${user1.major}`,
        details1?.experiences[0] || "Active student",
        `Interested in: ${details1?.interests.slice(0, 2).join(", ") || "various topics"}`
      ]
    },
    person2: {
      name: user2.name,
      bullets: [
        `${user2.year} in ${user2.major}`,
        details2?.experiences[0] || "Active student",
        `Interested in: ${details2?.interests.slice(0, 2).join(", ") || "various topics"}`
      ]
    }
  };
}

// Add a new intro request
export function addIntroRequest(request) {
  const newRequest = {
    ...request,
    id: introRequests.length + 1,
    createdAt: new Date().toISOString()
  };
  introRequests = [...introRequests, newRequest];
  return newRequest;
}

// Update intro request status
export function updateIntroRequestStatus(requestId, status) {
  introRequests = introRequests.map(r =>
    r.id === requestId ? { ...r, status } : r
  );
}

// Get pending requests for a connector
export function getPendingRequestsForConnector(connectorId) {
  return introRequests.filter(r => r.connectorId === connectorId && r.status === "pending");
}

// Get intents from network (for connector prompts)
export function getNetworkIntents(userId) {
  const myConnections = getConnectionsForUser(userId);
  const connectedUserIds = myConnections.map(c => c.userA === userId ? c.userB : c.userA);

  return intents.filter(i => connectedUserIds.includes(i.userId) && i.userId !== userId);
}

// Notifications
export let notifications = [
  {
    id: 1,
    userId: 1,
    type: "intro_approved",
    message: "Maya approved your intro request to Sam!",
    relatedRequestId: 2,
    read: false,
    createdAt: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 2,
    userId: 1,
    type: "intro_declined",
    message: "Your intro request to Rachel wasn't approved this time.",
    relatedRequestId: 3,
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    userId: 1,
    type: "intro_request",
    message: "Tyler is asking you to introduce them to Alex",
    relatedRequestId: 1,
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// Get requests by requester (outgoing requests)
export function getRequestsByRequester(userId) {
  return introRequests.filter(r => r.requesterId === userId);
}

// Get notifications for a user
export function getNotificationsForUser(userId) {
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get unread notification count
export function getUnreadNotificationCount(userId) {
  return notifications.filter(n => n.userId === userId && !n.read).length;
}

// Mark notification as read
export function markNotificationRead(notificationId) {
  notifications = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
}

// Mark all notifications as read for a user
export function markAllNotificationsRead(userId) {
  notifications = notifications.map(n =>
    n.userId === userId ? { ...n, read: true } : n
  );
}

// Add a new notification
export function addNotification(notification) {
  const newNotification = {
    ...notification,
    id: notifications.length + 1,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications = [newNotification, ...notifications];
  return newNotification;
}

// Update intro request status (with updatedAt)
export function updateIntroRequestStatusWithTimestamp(requestId, status) {
  introRequests = introRequests.map(r =>
    r.id === requestId ? { ...r, status, updatedAt: new Date().toISOString() } : r
  );
}

// Mark contact as shared for a request
export function markContactShared(requestId) {
  introRequests = introRequests.map(r =>
    r.id === requestId ? { ...r, contactShared: true } : r
  );
}

// Get intro request by ID
export function getIntroRequestById(requestId) {
  return introRequests.find(r => r.id === requestId);
}

// Get direct connections count for a user
export function getDirectConnectionsCount(userId) {
  return connections.filter(c => c.userA === userId || c.userB === userId).length;
}
