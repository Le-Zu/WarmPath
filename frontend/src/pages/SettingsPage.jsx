import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useUser } from "@/context/UserContext";
import apiFetch from "@/services/client";
import { useToast } from "@/context/ToastContext";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

const normalizeHandshakeUrl = (input) => {
   const trimmed = (input || "").trim();
   if (!trimmed) return "";
   const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
   let url;
   try {
      url = new URL(withProtocol);
   } catch {
      throw new Error("Please enter a valid Handshake URL (e.g., app.joinhandshake.com/profiles/yourname).");
   }
   if (!/(^|\.)joinhandshake\.com$/i.test(url.hostname)) {
      throw new Error("Please enter a valid Handshake URL (e.g., app.joinhandshake.com/profiles/yourname).");
   }
   const path = url.pathname.replace(/\/$/, "");
   return `https://app.joinhandshake.com${path}`;
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
      <button onClick={onToggle} type="button" aria-label={label} style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", background: on ? "LightSalmon" : "#ccc", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
         <span style={{ position: "absolute", top: "2px", left: on ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
   );
}

function InfoTooltip({ text }) {
   const [open, setOpen] = useState(false);
   return (
      <span style={{ position: "relative", display: "inline-flex", marginLeft: "6px", verticalAlign: "middle" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
         <span style={{ cursor: "help", color: "#6a994e", fontSize: "0.75rem", border: "1px solid #6a994e", borderRadius: "50%", width: "14px", height: "14px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>i</span>
         {open && (
            <span style={{ position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)", zIndex: 10, width: "200px", padding: "8px", background: "#386641", color: "#fff", fontSize: "0.75rem", borderRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", pointerEvents: "none" }}>
               {text}
            </span>
         )}
      </span>
   );
}

export default function SettingsPage() {
   const { currentUser, refreshUser } = useUser();
   const navigate = useNavigate();
   const toast = useToast();
   const [activeTab, setActiveTab] = useState("account");
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteText, setDeleteText] = useState("");
   const [isSaving, setIsSaving] = useState(false);
   const [hoveredDeleteConfirm, setHoveredDeleteConfirm] = useState(false);
   
   const [form, setForm] = useState({
      firstName: "", lastName: "", bio: "", major: "", year: "",
      linkedinUrl: "", handshakeUrl: "", profilePictureUrl: "", bannerPictureUrl: "",
      selectedGoals: [], selectedFields: [], experiences: [],
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
         setForm({
            firstName: currentUser.first_name || "",
            lastName: currentUser.last_name || "",
            bio: currentUser.bio || "",
            major: currentUser.major || "",
            year: currentUser.year || "",
            linkedinUrl: currentUser.linkedin_url || "",
            handshakeUrl: currentUser.handshake_url || "",
            profilePictureUrl: currentUser.profile_picture_url || "",
            bannerPictureUrl: currentUser.banner_picture_url || "",
            selectedGoals: currentUser.interests?.filter(i => GOAL_TAGS.includes(i.label)).map(i => i.label) || [],
            selectedFields: currentUser.interests?.filter(i => FIELD_TAGS.includes(i.label)).map(i => i.label) || [],
            experiences: currentUser.experiences || [],
         });
         setPrivacyForm({
            who_can_request: currentUser.privacy_settings?.who_can_request || "connections_of_connections",
            discovery_mode: currentUser.privacy_settings?.discovery_mode || "full",
            allow_connector_prompts: currentUser.privacy_settings?.allow_connector_prompts ?? true,
         });
         setProfilePreview(currentUser.profile_picture_url || "");
         setBannerPreview(currentUser.banner_picture_url || "");
      }
   }, [currentUser]);

   const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
   const setPrivacy = (field) => (val) => setPrivacyForm((f) => ({ ...f, [field]: val }));

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

   const addExperience = () => setForm((f) => ({ ...f, experiences: [...f.experiences, { title: "", organization: "", description: "" }] }));
   const removeExperience = (index) => setForm((f) => ({ ...f, experiences: f.experiences.filter((_, i) => i !== index) }));

   const handleImageChange = (type) => (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
         if (type === 'profile') { setProfileFile(file); setProfilePreview(reader.result); }
         else { setBannerFile(file); setBannerPreview(reader.result); }
      };
      reader.readAsDataURL(file);
   };

   const handleRemoveImage = (type) => {
      if (type === 'profile') { setProfileFile(null); setProfilePreview(""); setForm(f => ({ ...f, profilePictureUrl: "" })); }
      else { setBannerFile(null); setBannerPreview(""); setForm(f => ({ ...f, bannerPictureUrl: "" })); }
   };

   const uploadImage = async (file) => {
      if (!file) return null;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      return data.secure_url;
   };

   const handleSave = async () => {
      if (isSaving) return;
      setIsSaving(true);
      try {
         if (activeTab === "account") {
            let linkedinUrl = normalizeLinkedinUrl(form.linkedinUrl);
            let handshakeUrl = normalizeHandshakeUrl(form.handshakeUrl);
            let profileUrl = profileFile ? await uploadImage(profileFile) : form.profilePictureUrl;
            let bannerUrl = bannerFile ? await uploadImage(bannerFile) : form.bannerPictureUrl;

            await apiFetch('/api/me', {
               method: 'PATCH',
               body: JSON.stringify({
                  first_name: form.firstName, last_name: form.lastName, bio: form.bio,
                  major: form.major, year: form.year, linkedin_url: linkedinUrl,
                  handshake_url: handshakeUrl, profile_picture_url: profileUrl, banner_picture_url: bannerUrl,
               }),
            });

            const interests = [
               ...form.selectedGoals.map(g => ({ category: INTENT_MAP[g], label: g })),
               ...form.selectedFields.map(f => ({ category: FIELD_MAP[f], label: f })),
            ];
            await apiFetch('/api/me/interests', { method: 'POST', body: JSON.stringify({ interests }) });

            const validExperiences = form.experiences.filter(e => e.title && e.organization);
            await apiFetch('/api/me/experiences', { method: 'POST', body: JSON.stringify({ experiences: validExperiences.map(e => ({ ...e, type: 'other' })) }) });
         } else {
            await apiFetch('/api/me/privacy', { method: 'PATCH', body: JSON.stringify(privacyForm) });
         }

         await refreshUser();
         window.dispatchEvent(new CustomEvent('dev-users-updated'));
         toast("Settings saved successfully!");
      } catch (err) {
         toast(err.message, "error");
      } finally {
         setIsSaving(false);
      }
   };

   const handleDeleteAccount = async () => {
      if (deleteText !== "DELETE") return;
      setIsSaving(true);
      try {
         await apiFetch("/api/me", { method: "DELETE" });
         await signOut(auth);
         navigate("/");
         toast("Account deleted successfully.");
      } catch (err) {
         toast("Failed to delete account: " + err.message, "error");
      } finally {
         setIsSaving(false);
      }
   };

   const inputStyle = { backgroundColor: "#f2e9e4", width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid #d88c9a", fontSize: "1rem" };
   const labelStyle = { display: "block", fontSize: "0.85rem", color: "#386641", marginBottom: "0.35rem", fontWeight: "500" };
   const tagStyle = (sel) => ({ padding: "0.45rem 1rem", fontSize: "0.85rem", borderRadius: "20px", cursor: "pointer", border: "1px solid", borderColor: sel ? "LightSalmon" : "#d88c9a", background: sel ? "LightSalmon" : "#fff", color: sel ? "#fff" : "#386641" });

   return (
      <div style={{ minHeight: "100vh", background: "#f2e9e4", padding: "2rem 20px" }}>
         <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "520px", maxWidth: "100%", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)", padding: "45px 25px", borderRadius: "10px", background: "#fff" }}>
               <h2 style={{ fontSize: "1.5rem" }}>Settings</h2>
               <div style={{ display: 'flex', borderBottom: '1px solid #d88c9a', margin: '1.5rem 0' }}>
                  {['account', 'privacy'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activeTab === tab ? '2px solid LightSalmon' : 'none', color: activeTab === tab ? 'LightSalmon' : '#386641', cursor: 'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal' }}>{tab}</button>
                  ))}
               </div>

               {activeTab === 'account' ? (
                  <>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>First Name</label><input style={inputStyle} type="text" value={form.firstName} onChange={set("firstName")} /></div>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>Last Name</label><input style={inputStyle} type="text" value={form.lastName} onChange={set("lastName")} /></div>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>Bio</label><textarea style={{...inputStyle, height: '80px'}} value={form.bio} onChange={set("bio")} /></div>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>Major</label><input style={inputStyle} type="text" value={form.major} onChange={set("major")} /></div>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>Year</label><select style={inputStyle} value={form.year} onChange={set("year")}><option value="">Select Year</option><option value="freshman">Freshman</option><option value="sophomore">Sophomore</option><option value="junior">Junior</option><option value="senior">Senior</option><option value="grad">Grad</option></select></div>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} type="url" value={form.linkedinUrl} onChange={set("linkedinUrl")} /></div>
                     <div style={{ marginBottom: "1rem" }}><label style={labelStyle}>Handshake URL</label><input style={inputStyle} type="url" value={form.handshakeUrl} onChange={set("handshakeUrl")} /></div>
                     
                     <h3 style={{ margin: "1.5rem 0 0.5rem" }}>Interests</h3>
                     <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {GOAL_TAGS.map(tag => <button key={tag} onClick={() => toggleTag("selectedGoals", tag)} style={tagStyle(form.selectedGoals.includes(tag))}>{tag}</button>)}
                     </div>
                  </>
               ) : (
                  <>
                     <div style={{ marginBottom: "1.5rem" }}>
                        <label style={labelStyle}>Discovery Mode <InfoTooltip text="Full, Anonymous, or Hidden." /></label>
                        <select style={inputStyle} value={privacyForm.discovery_mode} onChange={(e) => setPrivacy('discovery_mode')(e.target.value)}><option value="full">Full Profile</option><option value="anonymous">Anonymous</option><option value="hidden">Hidden</option></select>
                     </div>
                  </>
               )}

               <button disabled={isSaving} onClick={handleSave} style={{ marginTop: "2rem", width: "100%", padding: "1rem", borderRadius: "100px", background: "LightSalmon", color: "#fff", fontWeight: "bold", border: "none", cursor: "pointer" }}>{isSaving ? "Saving..." : "Save Changes"}</button>

               {activeTab === 'account' && (
                  <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid Tomato", borderRadius: "10px" }}>
                     <h3 style={{ color: "Tomato", marginBottom: "0.5rem" }}>Danger Zone</h3>
                     {!showDeleteConfirm ? <button onClick={() => setShowDeleteConfirm(true)} style={{ background: "Tomato", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "100px", cursor: "pointer" }}>Delete Account</button> : (
                        <div>
                           <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Type <strong>DELETE</strong> to confirm.</p>
                           <input style={{ ...inputStyle, padding: "0.6rem" }} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
                           <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                              <button onClick={handleDeleteAccount} disabled={deleteText !== "DELETE"} style={{ background: deleteText === "DELETE" ? "Tomato" : "#ccc", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>Permanently Delete</button>
                              <button onClick={() => setShowDeleteConfirm(false)} style={{ background: "none", border: "none", color: "#777", cursor: "pointer" }}>Cancel</button>
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
