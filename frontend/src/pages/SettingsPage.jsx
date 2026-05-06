import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useUser } from "@/context/UserContext";
import apiFetch from "@/services/client";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
import { useToast } from "@/context/ToastContext";

// Lenient LinkedIn URL validation:
// - empty string clears the field
// - accepts "linkedin.com/in/username", "www.linkedin.com/in/username", full URLs, etc.
// - normalizes to canonical "https://www.linkedin.com/<path>"
// - throws an Error with a user-friendly message if invalid
const normalizeLinkedinUrl = (input) => {
   const trimmed = (input || "").trim();
   if (!trimmed) return "";
   const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
   let url;
   try {
      url = new URL(withProtocol);
   } catch {
      throw new Error("Please enter a valid LinkedIn URL (e.g., linkedin.com/in/yourname).");
   }
   if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) {
      throw new Error("Please enter a valid LinkedIn URL (e.g., linkedin.com/in/yourname).");
   }
   const path = url.pathname.replace(/\/$/, "");
   return `https://www.linkedin.com${path}`;
};

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

function InfoTooltip({ text }) {
   const [open, setOpen] = useState(false);
   return (
      <span
         style={{ position: "relative", display: "inline-flex", marginLeft: "6px", verticalAlign: "middle" }}
         onMouseEnter={() => setOpen(true)}
         onMouseLeave={() => setOpen(false)}
      >
         <span
            style={{
               cursor: "help",
               color: "#6a994e",
               fontSize: "0.75rem",
               border: "1px solid #6a994e",
               borderRadius: "50%",
               width: "14px",
               height: "14px",
               display: "inline-flex",
               alignItems: "center",
               justifyContent: "center",
               fontWeight: "bold"
            }}
         >
            i
         </span>
         {open && (
            <span
               style={{
                  position: "absolute",
                  bottom: "120%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 100,
                  width: "200px",
                  padding: "8px",
                  background: "#386641",
                  color: "#fff",
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  pointerEvents: "none",
               }}
            >
               {text}
            </span>
         )}
      </span>
   );
}

export default function SettingsPage() {
   const { currentUser, refreshUser } = useUser();
   const toast = useToast();
   const [activeTab, setActiveTab] = useState("account");
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
      linkedinUrl: "",
      profilePictureUrl: "",
      bannerPictureUrl: "",
      selectedGoals: [],
      selectedFields: [],
      experiences: [],
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
   });

   const [privacyForm, setPrivacyForm] = useState({
      who_can_request: "connections_of_connections",
      discovery_mode: "full",
      allow_connector_prompts: true,
   });

   const [profileFile, setProfileFile] = useState(null);
   const [bannerFile, setBannerFile] = useState(null);
   const [profilePreview, setProfilePreview] = useState("");
   const [bannerPreview, setBannerPreview] = useState("");

   useEffect(() => {
      if (currentUser) {
         setForm(f => ({
            ...f,
            firstName: currentUser.first_name || "",
            lastName: currentUser.last_name || "",
            bio: currentUser.bio || "",
            major: currentUser.major || "",
            year: currentUser.year || "",
            linkedinUrl: currentUser.linkedin_url || "",
            profilePictureUrl: currentUser.profile_picture_url || "",
            bannerPictureUrl: currentUser.banner_picture_url || "",
            selectedGoals: currentUser.interests?.filter(i => GOAL_TAGS.includes(i.label)).map(i => i.label) || [],
            selectedFields: currentUser.interests?.filter(i => FIELD_TAGS.includes(i.label)).map(i => i.label) || [],
            experiences: currentUser.experiences || [],
         }));
         setPrivacyForm({
            who_can_request: currentUser.privacy_settings?.who_can_request || "connections_of_connections",
            discovery_mode: currentUser.privacy_settings?.discovery_mode || "full",
            allow_connector_prompts: currentUser.privacy_settings?.allow_connector_prompts ?? true,
         });
         setProfilePreview(currentUser.profile_picture_url || "");
         setBannerPreview(currentUser.banner_picture_url || "");
      }
   }, [currentUser]);

   const set = (field) => (e) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
   
   const setPrivacy = (field) => (val) =>
      setPrivacyForm((f) => ({ ...f, [field]: val }));

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

   const passwordsMatch =
      form.newPassword === form.confirmPassword && form.newPassword.length >= 8;

   const handleImageChange = (type) => (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
         if (type === 'profile') {
            setProfileFile(file);
            setProfilePreview(reader.result);
         } else {
            setBannerFile(file);
            setBannerPreview(reader.result);
         }
      };
      reader.readAsDataURL(file);
   };

   const handleRemoveImage = (type) => {
      if (type === 'profile') {
         setProfileFile(null);
         setProfilePreview("");
         setForm(f => ({ ...f, profilePictureUrl: "" }));
      } else {
         setBannerFile(null);
         setBannerPreview("");
         setForm(f => ({ ...f, bannerPictureUrl: "" }));
      }
   };

   const uploadImage = async (file) => {
      if (!file) return null;
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
         method: "POST",
         body: formData,
      });

      if (!res.ok) {
         const error = await res.json();
         throw new Error(error.message || "Failed to upload image to Cloudinary");
      }

      const data = await res.json();
      return data.secure_url; // This is the optimized URL
   };

   const canSave =
      !isSaving &&
      (activeTab === "account" ? (
         form.firstName.trim() &&
         form.lastName.trim() &&
         (!showPasswordFields || (form.currentPassword && passwordsMatch))
      ) : true);

   const handleSave = async () => {
      if (!canSave) return;
      setIsSaving(true);
      try {
         if (activeTab === "account") {
            // Validate LinkedIn URL before any uploads so we fail fast.
            let linkedinUrl;
            try {
               linkedinUrl = normalizeLinkedinUrl(form.linkedinUrl);
            } catch (err) {
               toast(err.message);
               setIsSaving(false);
               return;
            }

            let profileUrl = form.profilePictureUrl;
            let bannerUrl = form.bannerPictureUrl;

            if (profileFile) {
               profileUrl = await uploadImage(profileFile);
            }
            if (bannerFile) {
               bannerUrl = await uploadImage(bannerFile);
            }

            // 1. Basic Info
            await apiFetch('/api/me', {
               method: 'PATCH',
               body: JSON.stringify({
                  first_name: form.firstName,
                  last_name: form.lastName,
                  bio: form.bio,
                  major: form.major,
                  year: form.year,
                  linkedin_url: linkedinUrl,
                  profile_picture_url: profileUrl,
                  banner_picture_url: bannerUrl,
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

            setShowPasswordFields(false);
            setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
         } else {
            await apiFetch('/api/me/privacy', {
               method: 'PATCH',
               body: JSON.stringify(privacyForm),
            });
         }

         await refreshUser();
         toast("Settings saved successfully!");
      } catch (err) {
         console.error("Failed to save settings:", err);
         toast("Failed to save settings: " + err.message, "error");
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
               <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Settings</h2>
               <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                  Manage your account and privacy preferences.
               </p>

               {/* Tab Navigation */}
               <div style={{ display: 'flex', borderBottom: '1px solid #d88c9a', marginBottom: '2rem' }}>
                  {['account', 'privacy'].map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                           padding: '10px 20px',
                           border: 'none',
                           background: 'none',
                           borderBottom: activeTab === tab ? '2px solid LightSalmon' : 'none',
                           color: activeTab === tab ? 'LightSalmon' : '#386641',
                           cursor: 'pointer',
                           fontWeight: activeTab === tab ? 'bold' : 'normal',
                           textTransform: 'capitalize'
                        }}
                     >
                        {tab}
                     </button>
                  ))}
               </div>

               {activeTab === 'account' ? (
                  <>
                     {/* Profile Images */}
                     <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.35rem' }}>
                           <label style={{ ...labelStyle, marginBottom: 0 }}>Profile Banner</label>
                           {bannerPreview && (
                              <button 
                                 onClick={() => handleRemoveImage('banner')}
                                 style={{ background: 'none', border: 'none', color: 'Tomato', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                              >
                                 Remove
                              </button>
                           )}
                        </div>
                        <div 
                           style={{ 
                              width: "100%", 
                              height: "120px", 
                              backgroundColor: "#eee", 
                              borderRadius: "8px", 
                              backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              position: 'relative',
                              border: "1px solid #d88c9a"
                           }}
                           onClick={() => document.getElementById('banner-input').click()}
                        >
                           {!bannerPreview && <span style={{ fontSize: '0.8rem', color: '#888' }}>Click to upload banner</span>}
                           <div style={{
                              position: 'absolute',
                              bottom: 0,
                              width: '100%',
                              background: 'rgba(0,0,0,0.3)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              textAlign: 'center',
                              padding: '4px 0'
                           }}>{bannerPreview ? "Change Banner" : "Upload Banner"}</div>
                        </div>
                        <input id="banner-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange('banner')} />
                     </div>

                     <div style={{ marginBottom: "1.5rem", display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div 
                           style={{ 
                              width: "80px", 
                              height: "80px", 
                              borderRadius: "50%", 
                              backgroundColor: "#eee", 
                              backgroundImage: profilePreview ? `url(${profilePreview})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: "1px solid #d88c9a",
                              overflow: 'hidden',
                              position: 'relative'
                           }}
                           onClick={() => document.getElementById('profile-input').click()}
                        >
                           {!profilePreview && <User size={28} strokeWidth={1.5} color="#7a6f68" />}
                           <div style={{
                              position: 'absolute',
                              bottom: 0,
                              width: '100%',
                              background: 'rgba(0,0,0,0.3)',
                              color: '#fff',
                              fontSize: '0.6rem',
                              textAlign: 'center',
                              padding: '2px 0'
                           }}>{profilePreview ? "Edit" : "Add"}</div>
                        </div>
                        <div>
                           <label style={labelStyle}>Profile Picture</label>
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                 onClick={() => document.getElementById('profile-input').click()}
                                 style={{ ...tagStyle(false), padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                              >
                                 {profilePreview ? "Change Picture" : "Choose Picture"}
                              </button>
                              {profilePreview && (
                                 <button 
                                    onClick={() => handleRemoveImage('profile')}
                                    style={{ ...tagStyle(false), padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'Tomato', color: 'Tomato' }}
                                 >
                                    Remove
                                 </button>
                              )}
                           </div>
                           <input id="profile-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange('profile')} />
                        </div>
                     </div>

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

                     <div style={{ marginBottom: "1rem" }}>
                        <label style={labelStyle}>LinkedIn URL</label>
                        <input
                           style={inputStyle}
                           type="url"
                           value={form.linkedinUrl}
                           onChange={set("linkedinUrl")}
                           placeholder="linkedin.com/in/yourname"
                        />
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
                  </>
               ) : (
                  <>
                     <h3 style={sectionHeadingStyle}>Privacy Settings</h3>
                     <p style={{ fontSize: '0.9rem', color: '#6a994e', marginBottom: '1.5rem' }}>
                        Control how you appear to others and who can interact with you.
                     </p>

                     <div style={{ marginBottom: "1.5rem" }}>
                        <label style={labelStyle}>
                           Discovery Mode
                           <InfoTooltip text="'Full' shows your full name/photo. 'Anonymous' hides your last name/photo to prevent LinkedIn bypass. 'Hidden' removes you from discovery." />
                        </label>
                        <select 
                           style={inputStyle} 
                           value={privacyForm.discovery_mode} 
                           onChange={(e) => setPrivacy('discovery_mode')(e.target.value)}
                        >
                           <option value="full">Full Profile</option>
                           <option value="anonymous">Anonymous (Blind Profile)</option>
                           <option value="hidden">Hidden</option>
                        </select>
                        <p style={helperStyle}>How you appear in warm path discovery results.</p>
                     </div>

                     <div style={toggleRowStyle}>
                        <div>
                           <label style={{ ...labelStyle, marginBottom: 0 }}>
                              Allow Connector Prompts
                              <InfoTooltip text="Let mutual connections suggest you as a target for people looking for introductions." />
                           </label>
                           <p style={{ ...helperStyle, marginTop: 0 }}>Allow connectors to suggest you for introductions.</p>
                        </div>
                        <Toggle 
                           on={privacyForm.allow_connector_prompts} 
                           onToggle={() => setPrivacy('allow_connector_prompts')(!privacyForm.allow_connector_prompts)} 
                        />
                     </div>

                     <div style={{ marginBottom: "1.5rem" }}>
                        <label style={labelStyle}>
                           Who can request introductions?
                           <InfoTooltip text="'Connections of Connections' (2nd degree) is the default. 'Nobody' acts as a Do Not Disturb mode." />
                        </label>
                        <select 
                           style={inputStyle} 
                           value={privacyForm.who_can_request} 
                           onChange={(e) => setPrivacy('who_can_request')(e.target.value)}
                        >
                           <option value="anyone">Anyone</option>
                           <option value="connections">Direct Connections Only</option>
                           <option value="connections_of_connections">Connections of Connections</option>
                           <option value="nobody">Nobody (DND)</option>
                        </select>
                        <p style={helperStyle}>Choose the maximum distance for intro requests.</p>
                     </div>
                  </>
               )}

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
               {activeTab === 'account' && (
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
               )}
            </div>
         </div>
      </div>
   );
}
