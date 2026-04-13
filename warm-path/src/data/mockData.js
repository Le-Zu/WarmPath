export const mockUsers = [
  { id: 'u1', name: 'Alex Chen', major: 'CS', year: 'Junior', avatar: '🎓' },
  { id: 'u2', name: 'Jordan Lee', major: 'Business', year: 'Senior', avatar: '💼' },
  { id: 'u3', name: 'Sam Rivera', major: 'Biology', year: 'Sophomore', avatar: '🔬' },
];
export const mockPaths = [
  { id: 'p1', target: { name: 'Sarah Kim', role: 'SWE Intern @ Google', avatar: '👩‍💻' }, connector: { name: 'Jordan Lee', relation: 'CS Study Group' }, intent: 'internship', strength: 92 },
  { id: 'p2', target: { name: 'Prof. Marcus Wu', role: 'ML Research Lab', avatar: '🧑‍🔬' }, connector: { name: 'Sam Rivera', relation: 'Lab Partner' }, intent: 'research', strength: 87 },
  { id: 'p3', target: { name: 'Priya Patel', role: 'Product @ Meta', avatar: '👩‍💼' }, connector: { name: 'Alex Chen', relation: 'Roommate' }, intent: 'internship', strength: 79 },
  { id: 'p4', target: { name: 'Dr. Elena Ross', role: 'Stanford Bioinformatics', avatar: '👩‍🏫' }, connector: { name: 'Jordan Lee', relation: 'Classmate' }, intent: 'research', strength: 74 },
];
export const mockRequests = [
  { id: 'r1', from: { name: 'Alex Chen', major: 'CS' }, to: { name: 'Sarah Kim' }, message: "Hi Jordan, I'd love an intro to Sarah — I'm applying for SWE internships and her experience at Google would be invaluable.", status: 'pending', intent: 'internship' },
  { id: 'r2', from: { name: 'Sam Rivera', major: 'Biology' }, to: { name: 'Prof. Marcus Wu' }, message: "Hey Jordan, could you connect me with Prof. Wu? I'm really interested in joining a research lab this semester.", status: 'pending', intent: 'research' },
];
export const mockMyRequests = [
  { id: 'mr1', target: { name: 'Sarah Kim', role: 'SWE Intern @ Google' }, connector: { name: 'Jordan Lee' }, status: 'approved', intent: 'internship', sentAt: '2 days ago' },
  { id: 'mr2', target: { name: 'Prof. Marcus Wu', role: 'ML Research Lab' }, connector: { name: 'Sam Rivera' }, status: 'pending', intent: 'research', sentAt: '5 hours ago' },
  { id: 'mr3', target: { name: 'Priya Patel', role: 'Product @ Meta' }, connector: { name: 'Alex Chen' }, status: 'declined', intent: 'internship', sentAt: '1 week ago' },
];
