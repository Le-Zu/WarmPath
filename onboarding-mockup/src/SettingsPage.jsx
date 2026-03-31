import { useState, useEffect, useRef } from 'react';
import './SettingsPage.css';

const GOAL_TAGS = ['Internship', 'Research', 'Study Group', 'Club', 'Mentorship', 'Side Project'];
const FIELD_TAGS = [
  'Computer Science', 'Business', 'Engineering', 'Design',
  'Pre-Med', 'Biology', 'Mathematics', 'Economics',
  'Psychology', 'Communications',
];

export default function SettingsPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    firstName: 'Jane',
    lastName: 'Doe',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saved, setSaved] = useState({ firstName: 'Jane', lastName: 'Doe' });

  const [openToConnections, setOpenToConnections] = useState(true);

  const [selectedGoals, setSelectedGoals] = useState(['Internship', 'Research']);
  const [selectedFields, setSelectedFields] = useState(['Computer Science']);

  const [notifications, setNotifications] = useState({
    introRequests: true,
    connectionUpdates: true,
    messages: true,
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleTag = (list, setList, tag) => {
    setList((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleNotification = (key) =>
    setNotifications((n) => ({ ...n, [key]: !n[key] }));

  const hasChanges =
    form.firstName !== saved.firstName ||
    form.lastName !== saved.lastName ||
    (showPasswordFields && form.newPassword.length > 0);

  const passwordsMatch =
    form.newPassword === form.confirmPassword && form.newPassword.length >= 8;

  const canSave =
    hasChanges &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    (!showPasswordFields || (form.currentPassword && passwordsMatch));

  const handleSave = () => {
    setSaved({ firstName: form.firstName, lastName: form.lastName });
    setShowPasswordFields(false);
    setForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://warmpath.io/invite/jane-doe-a1b2c3');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = `${saved.firstName[0]}${saved.lastName[0]}`;

  return (
    <div className={`st-page${darkMode ? ' dark' : ''}`}>
      {/* Top nav */}
      <nav className="st-nav">
        <div className="st-nav-inner">
          <span className="st-logo">WarmPath</span>

          <div className="st-user-menu" ref={dropdownRef}>
            <button
              className="st-avatar"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div className="st-dropdown">
                <div className="st-dropdown-name">
                  {saved.firstName} {saved.lastName}
                </div>
                <div className="st-dropdown-email">jane@university.edu</div>
                <div className="st-dropdown-divider" />
                <button className="st-dropdown-item active">Settings</button>
                <button className="st-dropdown-item">Log Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Settings card */}
      <div className="st-content">
        <div className="st-card">
          <h1 className="st-heading">Account Settings</h1>
          <p className="st-subtext">Manage your account information.</p>

          {/* Account fields */}
          <div className="st-field">
            <label className="st-label">First Name</label>
            <input
              className="st-input"
              type="text"
              value={form.firstName}
              onChange={set('firstName')}
            />
          </div>

          <div className="st-field">
            <label className="st-label">Last Name</label>
            <input
              className="st-input"
              type="text"
              value={form.lastName}
              onChange={set('lastName')}
            />
          </div>

          <div className="st-field">
            <label className="st-label">Email</label>
            <input
              className="st-input st-input-readonly"
              type="email"
              value="jane@university.edu"
              readOnly
            />
            <p className="st-helper">Contact support to change your email</p>
          </div>

          <div className="st-field">
            <label className="st-label">University</label>
            <input
              className="st-input st-input-readonly"
              type="text"
              value="New York University"
              readOnly
            />
          </div>

          <div className="st-field">
            <label className="st-label">Password</label>
            {!showPasswordFields ? (
              <button
                className="st-change-pw"
                onClick={() => setShowPasswordFields(true)}
              >
                Change password
              </button>
            ) : (
              <div className="st-pw-fields">
                <input
                  className="st-input"
                  type="password"
                  value={form.currentPassword}
                  onChange={set('currentPassword')}
                  placeholder="Current password"
                />
                <input
                  className="st-input"
                  type="password"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                  placeholder="New password"
                />
                <input
                  className={`st-input${
                    form.confirmPassword && !passwordsMatch ? ' st-input-error' : ''
                  }`}
                  type="password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Confirm new password"
                />
                {form.confirmPassword && !passwordsMatch && (
                  <p className="st-error">
                    {form.newPassword !== form.confirmPassword
                      ? 'Passwords do not match'
                      : 'Password must be at least 8 characters'}
                  </p>
                )}
                <button
                  className="st-cancel-pw"
                  onClick={() => {
                    setShowPasswordFields(false);
                    setForm((f) => ({
                      ...f,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    }));
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="st-divider" />
          <div className="st-section">
            <h2 className="st-section-heading">Connection Status</h2>
            <div className="st-toggle-row">
              <div>
                <span className="st-toggle-label">
                  {openToConnections ? 'Open to Connections' : 'Paused'}
                </span>
                {!openToConnections && (
                  <p className="st-helper">
                    Your profile won't appear in searches while paused
                  </p>
                )}
              </div>
              <button
                className={`st-toggle${openToConnections ? ' on' : ''}`}
                onClick={() => setOpenToConnections((v) => !v)}
                aria-label="Toggle connection status"
              >
                <span className="st-toggle-knob" />
              </button>
            </div>
          </div>

          {/* Interests */}
          <div className="st-divider" />
          <div className="st-section">
            <h2 className="st-section-heading">Your Interests</h2>

            <p className="st-label" style={{ marginBottom: '0.5rem' }}>What are you looking for?</p>
            <div className="st-tag-grid">
              {GOAL_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`st-tag${selectedGoals.includes(tag) ? ' selected' : ''}`}
                  onClick={() => toggleTag(selectedGoals, setSelectedGoals, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <p className="st-label" style={{ margin: '1rem 0 0.5rem' }}>What's your field?</p>
            <div className="st-tag-grid">
              {FIELD_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`st-tag${selectedFields.includes(tag) ? ' selected' : ''}`}
                  onClick={() => toggleTag(selectedFields, setSelectedFields, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="st-divider" />
          <div className="st-section">
            <h2 className="st-section-heading">Notifications</h2>

            <div className="st-toggle-row">
              <div>
                <span className="st-toggle-label">Intro requests</span>
                <p className="st-helper">When someone requests an intro through you</p>
              </div>
              <button
                className={`st-toggle${notifications.introRequests ? ' on' : ''}`}
                onClick={() => toggleNotification('introRequests')}
                aria-label="Toggle intro request notifications"
              >
                <span className="st-toggle-knob" />
              </button>
            </div>

            <div className="st-toggle-row">
              <div>
                <span className="st-toggle-label">Connection updates</span>
                <p className="st-helper">When a connector approves or forwards your request</p>
              </div>
              <button
                className={`st-toggle${notifications.connectionUpdates ? ' on' : ''}`}
                onClick={() => toggleNotification('connectionUpdates')}
                aria-label="Toggle connection update notifications"
              >
                <span className="st-toggle-knob" />
              </button>
            </div>

            <div className="st-toggle-row">
              <div>
                <span className="st-toggle-label">Messages</span>
                <p className="st-helper">New messages in coffee chats</p>
              </div>
              <button
                className={`st-toggle${notifications.messages ? ' on' : ''}`}
                onClick={() => toggleNotification('messages')}
                aria-label="Toggle message notifications"
              >
                <span className="st-toggle-knob" />
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="st-divider" />
          <div className="st-section">
            <h2 className="st-section-heading">Appearance</h2>
            <div className="st-toggle-row">
              <span className="st-toggle-label">Dark mode</span>
              <button
                className={`st-toggle${darkMode ? ' on' : ''}`}
                onClick={() => setDarkMode((v) => !v)}
                aria-label="Toggle dark mode"
              >
                <span className="st-toggle-knob" />
              </button>
            </div>
          </div>

          {/* Invite Friends */}
          <div className="st-divider" />
          <div className="st-section">
            <h2 className="st-section-heading">Invite Friends</h2>
            <p className="st-helper" style={{ marginBottom: '0.75rem' }}>
              Invite classmates to join WarmPath
            </p>
            <div className="st-invite-row">
              <input
                className="st-input st-input-readonly st-invite-input"
                type="text"
                value="warmpath.io/invite/jane-doe-a1b2c3"
                readOnly
              />
              <button className="st-btn-copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="st-divider" />
          <div className="st-save-row">
            <button
              className="st-btn-primary"
              disabled={!canSave}
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          <div className="st-danger-zone">
            <h2 className="st-danger-heading">Danger Zone</h2>
            {!showDeleteConfirm ? (
              <button
                className="st-btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            ) : (
              <div className="st-delete-confirm">
                <p className="st-delete-warning">
                  This will permanently delete your account and all your data.
                  Type <strong>DELETE</strong> to confirm.
                </p>
                <input
                  className="st-input st-delete-input"
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="Type DELETE"
                />
                <div className="st-delete-actions">
                  <button
                    className="st-btn-danger-confirm"
                    disabled={deleteText !== 'DELETE'}
                  >
                    Permanently Delete
                  </button>
                  <button
                    className="st-cancel-pw"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteText('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
