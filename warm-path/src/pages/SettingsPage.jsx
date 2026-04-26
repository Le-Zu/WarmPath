import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import apiFetch from "../api/client";

const INTENT_MAP = {
   'Internship': 'internship',
   'Research':   'research',
   'Study Group': 'class',
   'Club':       'club',
   'Mentorship': 'skill',
   'Side Project': 'project',
};

const FIELD_MAP = {
   "Computer Science": "skill",
   "Business": "skill",
   "Engineering": "skill",
   "Design": "skill",
   "Pre-Med": "research",
   "Biology": "research",
   "Mathematics": "class",
   "Economics": "class",
   "Psychology": "other",
   "Communications": "other",
};

const GOAL_TAGS = Object.keys(INTENT_MAP);
const FIELD_TAGS = Object.keys(FIELD_MAP);

function Toggle({ on, onToggle, label }) {
   return (
      <button
         onClick={onToggle}
         type="button"
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
   const { currentUser, refreshUser } = useUser();
   const [showPasswordFields, setShowPasswordFields] = useState(false);
   const [copied, setCopied] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteText, setDeleteText] = useState("");
   const [hoveredSave, setHoveredSave] = useState(false);
   const [hoveredDelete, setHoveredDelete] = useState(false);
   const [hoveredDeleteConfirm, setHoveredDeleteConfirm] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   
   const [form, setForm] = useState({
      firstName: "",
      lastName: "",
      bio: "",
      major: "",
      year: "",
      selectedGoals: [],
      selectedFields: [],
      experiences: [],
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
   });

   useEffect(() => {
      if (currentUser) {
         setForm(f => ({
            ...f,
            firstName: currentUser.first_name || "",
            lastName: currentUser.last_name || "",
            bio: currentUser.bio || "",
            major: currentUser.major || "",
            year: currentUser.year || "",
            selectedGoals: currentUser.interests?.filter(i => GOAL_TAGS.includes(i.label)).map(i => i.label) || [],
            selectedFields: currentUser.interests?.filter(i => FIELD_TAGS.includes(i.label)).map(i => i.label) || [],
            experiences: currentUser.experiences || [],
         }));
      }
   }, [currentUser]);

   const [openToConnections, setOpenToConnections] = useState(true);
   const [notifications, setNotifications] = useState({
      introRequests: true,
      connectionUpdates: true,
      messages: true,
   });

   const set = (field) => (e) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

   const toggleTag = (field, tag) => {
      setForm((f) => {
         const current = f[field];
         const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
         return { ...f, [field]: next };
      });
   };

   const setExperience = (index, field) => (e) =>
      setForm((f) => {
         const experiences = [...f.experiences];
         experiences[index] = { ...experiences[index], [field]: e.target.value };
         return { ...f, experiences };
      });

   const addExperience = () =>
      setForm((f) => ({
         ...f,
         experiences: [...f.experiences, { title: "", organization: "", description: "" }],
      }));

   const removeExperience = (index) =>
      setForm((f) => ({
         ...f,
         experiences: f.experiences.filter((_, i) => i !== index),
      }));

   const toggleNotification = (key) =>
      setNotifications((n) => ({ ...n, [key]: !n[key] }));

   const hasChanges = true; // For simplicity, always allow save or do deep compare

   const passwordsMatch =
      form.newPassword === form.confirmPassword && form.newPassword.length >= 8;

   const canSave =
      !isSaving &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      (!showPasswordFields || (form.currentPassword && passwordsMatch));

   const handleSave = async () => {
      if (!canSave) return;
      setIsSaving(true);
      try {
         // 1. Basic Info
         await apiFetch('/api/me', {
            method: 'PATCH',
            body: JSON.stringify({
               first_name: form.firstName,
               last_name: form.lastName,
               bio: form.bio,
               major: form.major,
               year: form.year,
            }),
         });

         // 2. Interests
         const interests = [
            ...form.selectedGoals.map(g => ({ category: INTENT_MAP[g], label: g })),
            ...form.selectedFields.map(f => ({ category: FIELD_MAP[f], label: f })),
         ];
         await apiFetch('/api/me/interests', {
            method: 'POST',
            body: JSON.stringify({ interests }),
         });

         // 3. Experiences
         const validExperiences = form.experiences.filter(e => e.title && e.organization);
         await apiFetch('/api/me/experiences', {
            method: 'POST',
            body: JSON.stringify({ experiences: validExperiences.map(e => ({ ...e, type: 'other' })) }),
         });

         await refreshUser();
         setShowPasswordFields(false);
         setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
         alert("Settings saved successfully!");
      } catch (err) {
         console.error("Failed to save settings:", err);
         alert("Failed to save settings: " + err.message);
      } finally {
         setIsSaving(false);
      }
   };

   const handleCopy = () => {
      const inviteUrl = `${window.location.origin}/register?referrer=${currentUser?.user_id}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };


   const inputStyle = {
      backgroundColor: "#f2e9e4",
      width: "100%",
      padding: "1rem",
      borderRadius: "8px",
      border: "1px solid #d88c9a",
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
                  <label style={labelStyle}>Bio</label>
                  <textarea 
                     style={{...inputStyle, height: '100px'}} 
                     value={form.bio} 
                     onChange={set("bio")}
                     placeholder="Tell us about yourself..."
                  />
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Email</label>
                  <input style={readonlyInputStyle} type="email" value={currentUser?.email || ""} readOnly />
                  <p style={helperStyle}>Contact support to change your email</p>
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Major</label>
                  <input style={inputStyle} type="text" value={form.major} onChange={set("major")} placeholder="Computer Science" />
               </div>

               <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Year</label>
                  <select style={inputStyle} value={form.year} onChange={set("year")}>
                     <option value="">Select Year</option>
                     <option value="freshman">Freshman</option>
                     <option value="sophomore">Sophomore</option>
                     <option value="junior">Junior</option>
                     <option value="senior">Senior</option>
                     <option value="grad">Grad Student</option>
                     <option value="other">Other</option>
                  </select>
               </div>

               {/* Experiences */}
               <hr style={dividerStyle} />
               <h3 style={sectionHeadingStyle}>Experience</h3>
               {form.experiences.map((exp, i) => (
                  <div key={i} style={{ marginBottom: "1.5rem", padding: "10px", border: "1px solid #eee", borderRadius: "8px" }}>
                     <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={() => removeExperience(i)} style={{ color: "Tomato", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>Remove</button>
                     </div>
                     <input
                        style={{ ...inputStyle, marginBottom: "0.5rem" }}
                        type="text"
                        value={exp.title}
                        onChange={setExperience(i, "title")}
                        placeholder="Title"
                     />
                     <input
                        style={{ ...inputStyle, marginBottom: "0.5rem" }}
                        type="text"
                        value={exp.organization}
                        onChange={setExperience(i, "organization")}
                        placeholder="Organization"
                     />
                     <textarea
                        style={{ ...inputStyle, height: "60px" }}
                        value={exp.description || ""}
                        onChange={setExperience(i, "description")}
                        placeholder="Description (optional)"
                     />
                  </div>
               ))}
               <button onClick={addExperience} style={{ ...tagStyle(false), width: "100%", marginBottom: "1rem" }}>+ Add Experience</button>

               {/* Interests */}
               <hr style={dividerStyle} />
               <h3 style={sectionHeadingStyle}>Your Interests</h3>

               <p style={{ ...labelStyle, marginBottom: "0.5rem" }}>What are you looking for?</p>
               <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
                  {GOAL_TAGS.map((tag) => (
                     <button
                        key={tag}
                        onClick={() => toggleTag("selectedGoals", tag)}
                        style={tagStyle(form.selectedGoals.includes(tag))}
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
                        onClick={() => toggleTag("selectedFields", tag)}
                        style={tagStyle(form.selectedFields.includes(tag))}
                     >
                        {tag}
                     </button>
                  ))}
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
                     {isSaving ? "Saving..." : "Save Changes"}
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
