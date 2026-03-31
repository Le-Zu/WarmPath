import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const GOAL_TAGS = ["Internship", "Research", "Study Group", "Club", "Mentorship", "Side Project"];
const FIELD_TAGS = [
   "Computer Science", "Business", "Engineering", "Design",
   "Pre-Med", "Biology", "Mathematics", "Economics",
   "Psychology", "Communications",
];

function Toggle({ on, onToggle, label }) {
   return (
      <button
         onClick={onToggle}
         aria-label={label}
         style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            border: "none",
            background: on ? "LightSalmon" : "#ccc",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s",
            flexShrink: 0,
         }}
      >
         <span
            style={{
               position: "absolute",
               top: "2px",
               left: on ? "22px" : "2px",
               width: "20px",
               height: "20px",
               borderRadius: "50%",
               background: "#fff",
               transition: "left 0.2s",
               boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
         />
      </button>
   );
}

export default function SettingsPage() {
   const [dropdownOpen, setDropdownOpen] = useState(false);
   const [showPasswordFields, setShowPasswordFields] = useState(false);
   const [copied, setCopied] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteText, setDeleteText] = useState("");
   const [hoveredSave, setHoveredSave] = useState(false);
   const [hoveredDelete, setHoveredDelete] = useState(false);
   const [hoveredDeleteConfirm, setHoveredDeleteConfirm] = useState(false);
   const dropdownRef = useRef(null);

   const [form, setForm] = useState({
      firstName: "Jane",
      lastName: "Doe",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
   });

   const [saved, setSaved] = useState({ firstName: "Jane", lastName: "Doe" });
   const [openToConnections, setOpenToConnections] = useState(true);
   const [selectedGoals, setSelectedGoals] = useState(["Internship", "Research"]);
   const [selectedFields, setSelectedFields] = useState(["Computer Science"]);
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
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
   };

   const handleCopy = () => {
      navigator.clipboard.writeText("https://warmpath.io/invite/jane-doe-a1b2c3");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   useEffect(() => {
      const handler = (e) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setDropdownOpen(false);
         }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
   }, []);

   const initials = `${saved.firstName[0]}${saved.lastName[0]}`;

   const inputStyle = {
      backgroundColor: "#f2e9e4",
      width: "100%",
      padding: "1rem",
      borderRadius: "8px",
      border: "1px solid",
      fontSize: "1rem",
      boxSizing: "border-box",
   };

   const readonlyInputStyle = {
      ...inputStyle,
      opacity: 0.6,
      cursor: "not-allowed",
   };

   const labelStyle = {
      display: "block",
      fontSize: "0.85rem",
      color: "#386641",
      marginBottom: "0.35rem",
      fontWeight: "500",
   };

   const sectionHeadingStyle = {
      fontSize: "1.1rem",
      marginBottom: "0.75rem",
   };

   const dividerStyle = {
      border: "none",
      borderTop: "1px solid #d88c9a",
      margin: "1.5rem 0",
   };

   const helperStyle = {
      fontSize: "0.8rem",
      color: "#6a994e",
      marginTop: "0.25rem",
   };

   const tagStyle = (selected) => ({
      padding: "0.45rem 1rem",
      fontSize: "0.85rem",
      borderRadius: "20px",
      cursor: "pointer",
      border: "1px solid",
      borderColor: selected ? "LightSalmon" : "#d88c9a",
      background: selected ? "LightSalmon" : "#fff",
      color: selected ? "#fff" : "#386641",
      transition: "all 0.15s",
   });

   const toggleRowStyle = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
   };

   return (
      <div
         style={{
            minHeight: "100vh",
            background: "#f2e9e4",
            fontFamily: "sans-serif",
            color: "#386641",
         }}
      >
         {/* Top nav */}
         <nav
            style={{
               background: "#fff",
               borderBottom: "1px solid #d88c9a",
               padding: "0.75rem 2rem",
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
            }}
         >
            <Link to="/" style={{ textDecoration: "none" }}>
               <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ height: "40px", display: "block" }}
               />
            </Link>

            <div ref={dropdownRef} style={{ position: "relative" }}>
               <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  style={{
                     width: "40px",
                     height: "40px",
                     borderRadius: "50%",
                     background: "LightSalmon",
                     color: "#fff",
                     border: "none",
                     fontSize: "0.9rem",
                     fontWeight: "bold",
                     cursor: "pointer",
                  }}
               >
                  {initials}
               </button>

               {dropdownOpen && (
                  <div
                     style={{
                        position: "absolute",
                        right: 0,
                        top: "48px",
                        background: "#fff",
                        borderRadius: "8px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        padding: "0.75rem 0",
                        minWidth: "180px",
                        zIndex: 10,
                     }}
                  >
                     <div style={{ padding: "0.5rem 1rem", fontWeight: "bold" }}>
                        {saved.firstName} {saved.lastName}
                     </div>
                     <div style={{ padding: "0 1rem 0.5rem", fontSize: "0.8rem", color: "#6a994e" }}>
                        jane@university.edu
                     </div>
                     <hr style={dividerStyle} />
                     <button
                        style={{
                           display: "block",
                           width: "100%",
                           textAlign: "left",
                           padding: "0.5rem 1rem",
                           border: "none",
                           background: "none",
                           cursor: "pointer",
                           fontSize: "0.9rem",
                           color: "LightSalmon",
                           fontWeight: "bold",
                        }}
                     >
                        Settings
                     </button>
                     <button
                        style={{
                           display: "block",
                           width: "100%",
                           textAlign: "left",
                           padding: "0.5rem 1rem",
                           border: "none",
                           background: "none",
                           cursor: "pointer",
                           fontSize: "0.9rem",
                           color: "#386641",
                        }}
                     >
                        Log Out
                     </button>
                  </div>
               )}
            </div>
         </nav>

         {/* Settings card */}
         <div
            style={{
               display: "flex",
               justifyContent: "center",
               padding: "2rem 20px",
            }}
         >
            <div
               style={{
                  width: "520px",
                  maxWidth: "100%",
                  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
                  padding: "45px 25px",
                  borderRadius: "10px",
                  background: "#fff",
               }}
            >
               <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Account Settings</h2>
               <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                  Manage your account information.
               </p>

               {/* Account fields */}
               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} type="text" value={form.firstName} onChange={set("firstName")} />
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} type="text" value={form.lastName} onChange={set("lastName")} />
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Email</label>
                  <input style={readonlyInputStyle} type="email" value="jane@university.edu" readOnly />
                  <p style={helperStyle}>Contact support to change your email</p>
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>University</label>
                  <input style={readonlyInputStyle} type="text" value="New York University" readOnly />
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Password</label>
                  {!showPasswordFields ? (
                     <button
                        onClick={() => setShowPasswordFields(true)}
                        style={{
                           background: "none",
                           border: "none",
                           color: "LightSalmon",
                           cursor: "pointer",
                           fontSize: "0.9rem",
                           fontWeight: "bold",
                           padding: 0,
                        }}
                     >
                        Change password
                     </button>
                  ) : (
                     <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input
                           style={inputStyle}
                           type="password"
                           value={form.currentPassword}
                           onChange={set("currentPassword")}
                           placeholder="Current password"
                        />
                        <input
                           style={inputStyle}
                           type="password"
                           value={form.newPassword}
                           onChange={set("newPassword")}
                           placeholder="New password"
                        />
                        <input
                           style={inputStyle}
                           type="password"
                           value={form.confirmPassword}
                           onChange={set("confirmPassword")}
                           placeholder="Confirm new password"
                        />
                        {form.confirmPassword && !passwordsMatch && (
                           <p style={{ color: "Tomato", fontSize: "0.875rem" }}>
                              {form.newPassword !== form.confirmPassword
                                 ? "Passwords do not match"
                                 : "Password must be at least 8 characters"}
                           </p>
                        )}
                        <button
                           onClick={() => {
                              setShowPasswordFields(false);
                              setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
                           }}
                           style={{
                              background: "none",
                              border: "none",
                              color: "Tomato",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              padding: 0,
                              textAlign: "left",
                           }}
                        >
                           Cancel
                        </button>
                     </div>
                  )}
               </div>

               {/* Connection Status */}
               <hr style={dividerStyle} />
               <h3 style={sectionHeadingStyle}>Connection Status</h3>
               <div style={toggleRowStyle}>
                  <div>
                     <span style={{ fontWeight: "500" }}>
                        {openToConnections ? "Open to Connections" : "Paused"}
                     </span>
                     {!openToConnections && (
                        <p style={helperStyle}>Your profile won't appear in searches while paused</p>
                     )}
                  </div>
                  <Toggle on={openToConnections} onToggle={() => setOpenToConnections((v) => !v)} label="Toggle connection status" />
               </div>

               {/* Interests */}
               <hr style={dividerStyle} />
               <h3 style={sectionHeadingStyle}>Your Interests</h3>

               <p style={{ ...labelStyle, marginBottom: "0.5rem" }}>What are you looking for?</p>
               <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
                  {GOAL_TAGS.map((tag) => (
                     <button
                        key={tag}
                        onClick={() => toggleTag(selectedGoals, setSelectedGoals, tag)}
                        style={tagStyle(selectedGoals.includes(tag))}
                     >
                        {tag}
                     </button>
                  ))}
               </div>

               <p style={{ ...labelStyle, marginBottom: "0.5rem" }}>What's your field?</p>
               <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1rem" }}>
                  {FIELD_TAGS.map((tag) => (
                     <button
                        key={tag}
                        onClick={() => toggleTag(selectedFields, setSelectedFields, tag)}
                        style={tagStyle(selectedFields.includes(tag))}
                     >
                        {tag}
                     </button>
                  ))}
               </div>

               {/* Notifications */}
               <hr style={dividerStyle} />
               <h3 style={sectionHeadingStyle}>Notifications</h3>

               <div style={toggleRowStyle}>
                  <div>
                     <span style={{ fontWeight: "500" }}>Intro requests</span>
                     <p style={helperStyle}>When someone requests an intro through you</p>
                  </div>
                  <Toggle on={notifications.introRequests} onToggle={() => toggleNotification("introRequests")} label="Toggle intro request notifications" />
               </div>

               <div style={toggleRowStyle}>
                  <div>
                     <span style={{ fontWeight: "500" }}>Connection updates</span>
                     <p style={helperStyle}>When a connector approves or forwards your request</p>
                  </div>
                  <Toggle on={notifications.connectionUpdates} onToggle={() => toggleNotification("connectionUpdates")} label="Toggle connection update notifications" />
               </div>

               <div style={toggleRowStyle}>
                  <div>
                     <span style={{ fontWeight: "500" }}>Messages</span>
                     <p style={helperStyle}>New messages in coffee chats</p>
                  </div>
                  <Toggle on={notifications.messages} onToggle={() => toggleNotification("messages")} label="Toggle message notifications" />
               </div>

               {/* Invite Friends */}
               <hr style={dividerStyle} />
               <h3 style={sectionHeadingStyle}>Invite Friends</h3>
               <p style={{ ...helperStyle, marginBottom: "0.75rem" }}>
                  Invite classmates to join WarmPath
               </p>
               <div style={{ display: "flex", gap: "8px" }}>
                  <input
                     style={{ ...readonlyInputStyle, flex: 1 }}
                     type="text"
                     value="warmpath.io/invite/jane-doe-a1b2c3"
                     readOnly
                  />
                  <button
                     onClick={handleCopy}
                     style={{
                        backgroundColor: "LightSalmon",
                        padding: "0.75rem 1.25rem",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: "#fff",
                        whiteSpace: "nowrap",
                     }}
                  >
                     {copied ? "Copied!" : "Copy Link"}
                  </button>
               </div>

               {/* Save */}
               <hr style={dividerStyle} />
               <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                     disabled={!canSave}
                     onClick={handleSave}
                     onMouseEnter={() => setHoveredSave(true)}
                     onMouseLeave={() => setHoveredSave(false)}
                     style={{
                        backgroundColor: !canSave ? "#ccc" : hoveredSave ? "#e8825a" : "LightSalmon",
                        padding: "1rem 2rem",
                        borderRadius: "100px",
                        border: "1px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        cursor: canSave ? "pointer" : "not-allowed",
                        transition: "background-color 0.1s",
                        color: "#fff",
                     }}
                  >
                     Save Changes
                  </button>
               </div>

               {/* Danger Zone */}
               <div
                  style={{
                     marginTop: "2rem",
                     padding: "1.25rem",
                     border: "1px solid Tomato",
                     borderRadius: "10px",
                  }}
               >
                  <h3 style={{ fontSize: "1.1rem", color: "Tomato", marginBottom: "0.75rem" }}>
                     Danger Zone
                  </h3>
                  {!showDeleteConfirm ? (
                     <button
                        onClick={() => setShowDeleteConfirm(true)}
                        onMouseEnter={() => setHoveredDelete(true)}
                        onMouseLeave={() => setHoveredDelete(false)}
                        style={{
                           backgroundColor: hoveredDelete ? "#c0392b" : "Tomato",
                           padding: "0.75rem 1.5rem",
                           borderRadius: "100px",
                           border: "none",
                           fontSize: "0.9rem",
                           fontWeight: "bold",
                           cursor: "pointer",
                           color: "#fff",
                           transition: "background-color 0.1s",
                        }}
                     >
                        Delete Account
                     </button>
                  ) : (
                     <div>
                        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                           This will permanently delete your account and all your data.
                           Type <strong>DELETE</strong> to confirm.
                        </p>
                        <input
                           style={{ ...inputStyle, marginBottom: "0.75rem" }}
                           type="text"
                           value={deleteText}
                           onChange={(e) => setDeleteText(e.target.value)}
                           placeholder="Type DELETE"
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                           <button
                              disabled={deleteText !== "DELETE"}
                              onMouseEnter={() => setHoveredDeleteConfirm(true)}
                              onMouseLeave={() => setHoveredDeleteConfirm(false)}
                              style={{
                                 backgroundColor: deleteText !== "DELETE" ? "#ccc" : hoveredDeleteConfirm ? "#c0392b" : "Tomato",
                                 padding: "0.75rem 1.5rem",
                                 borderRadius: "100px",
                                 border: "none",
                                 fontSize: "0.9rem",
                                 fontWeight: "bold",
                                 cursor: deleteText === "DELETE" ? "pointer" : "not-allowed",
                                 color: "#fff",
                                 transition: "background-color 0.1s",
                              }}
                           >
                              Permanently Delete
                           </button>
                           <button
                              onClick={() => {
                                 setShowDeleteConfirm(false);
                                 setDeleteText("");
                              }}
                              style={{
                                 background: "none",
                                 border: "none",
                                 color: "Tomato",
                                 cursor: "pointer",
                                 fontSize: "0.85rem",
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
