import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import apiFetch from "@/services/client";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { splitFullName } from "@/utils/formatters";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const formatBytes = (bytes) => {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TOTAL_STEPS = 6;

const INTENT_MAP = {
   'Internship': 'internship',
   'Research':   'research',
   'Class Help': 'class',
   'Club':       'club',
   'Skill':      'skill',
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

function StepDots({ current }) {
   return (
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1.5rem" }}>
         {Array.from({ length: TOTAL_STEPS + 1 }, (_, i) => (
            <div
               key={i}
               style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: i === current ? "LightSalmon" : "#d88c9a",
                  transition: "background-color 0.2s",
               }}
            />
         ))}
      </div>
   );
}

export default function OnboardingFlow() {
   const navigate = useNavigate();
   const { refreshUser } = useUser();
   const toast = useToast();
   const [step, setStep] = useState(0);
   const [isSaving, setIsSaving] = useState(false);
   const [form, setForm] = useState({
      firstName: "",
      lastName: "",
      major: "",
      year: "",
      bio: "",
      profilePictureUrl: "",
      bannerPictureUrl: "",
      selectedGoals: [],
      selectedFields: [],
      experiences: [{ title: "", organization: "", description: "" }],
      connectors: [{ name: "", email: "", relationship: "" }],
   });

   const [profileFile, setProfileFile] = useState(null);
   const [bannerFile, setBannerFile] = useState(null);
   const [profilePreview, setProfilePreview] = useState("");
   const [bannerPreview, setBannerPreview] = useState("");

   const handleImageChange = (type) => (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;

      const label = type === 'profile' ? 'Profile picture' : 'Banner image';

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
         toast(`${label} must be a JPG, PNG, WebP, or GIF image.`, "error");
         return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
         toast(`${label} is ${formatBytes(file.size)} — max size is 10 MB.`, "error");
         return;
      }

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
      reader.onerror = () => {
         toast(`Could not read ${label.toLowerCase()}. Please try a different file.`, "error");
      };
      reader.readAsDataURL(file);
   };

   const uploadImage = async (file, label) => {
      if (!file) return null;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      let res;
      try {
         res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData,
         });
      } catch (networkErr) {
         const err = new Error(`${label} upload failed — check your connection and try again.`);
         err.isUpload = true;
         throw err;
      }

      if (!res.ok) {
         const body = await res.json().catch(() => ({}));
         const detail = body?.error?.message || body?.message;
         const err = new Error(detail ? `${label} upload failed: ${detail}` : `${label} upload failed.`);
         err.isUpload = true;
         throw err;
      }

      const data = await res.json();
      return data.secure_url;
   };

   const [hoveredNext, setHoveredNext] = useState(false);
   const [hoveredBack, setHoveredBack] = useState(false);
   const [hoveredSkip, setHoveredSkip] = useState(false);
   const [hoveredStart, setHoveredStart] = useState(false);
   const [hoveredAdd, setHoveredAdd] = useState(false);

   const set = (field) => (e) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

   const toggleTag = (field, tag) =>
      setForm((f) => {
         const current = f[field];
         const next = current.includes(tag)
            ? current.filter((t) => t !== tag)
            : [...current, tag];
         return { ...f, [field]: next };
      });

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

   const setConnector = (index, field) => (e) =>
      setForm((f) => {
         const connectors = [...f.connectors];
         connectors[index] = { ...connectors[index], [field]: e.target.value };
         return { ...f, connectors };
      });

   const addConnector = () =>
      setForm((f) => ({
         ...f,
         connectors: [...f.connectors, { name: "", email: "", relationship: "" }],
      }));

   const handleGetStarted = async () => {
      setIsSaving(true);
      try {
         // 0. Upload Images if any
         let profileUrl = "";
         let bannerUrl = "";

         // We need a user ID for the storage path. 
         // Since we might not have it yet (if registration is being synced), 
         // we'll use a temporary path or fetch the user first.
         // Actually, apiFetch('/api/me') should work to get the current user object.
         const { user: me } = await apiFetch('/api/me');
         
         if (profileFile) {
            profileUrl = await uploadImage(profileFile, "Profile picture");
         }
         if (bannerFile) {
            bannerUrl = await uploadImage(bannerFile, "Banner image");
         }

         // 1. Profile Update
         await apiFetch('/api/me', {
            method: 'PATCH',
            body: JSON.stringify({ 
               first_name: form.firstName,
               last_name: form.lastName,
               major: form.major,
               year: form.year,
               bio: form.bio,
               profile_complete: true,
               ...(profileUrl && { profile_picture_url: profileUrl }),
               ...(bannerUrl && { banner_picture_url: bannerUrl }),
            }),
         });

         // 2. Save Interests (tags)
         const interests = [
            ...form.selectedGoals.map(g => ({ category: INTENT_MAP[g], label: g })),
            ...form.selectedFields.map(f => ({ category: FIELD_MAP[f], label: f })),
         ];
         if (interests.length > 0) {
            await apiFetch('/api/me/interests', {
               method: 'POST',
               body: JSON.stringify({ interests }),
            });
         }

         // 3. Save Experiences
         const validExperiences = form.experiences.filter(e => e.title && e.organization);
         if (validExperiences.length > 0) {
            await apiFetch('/api/me/experiences', {
               method: 'POST',
               body: JSON.stringify({ experiences: validExperiences.map(e => ({ ...e, type: 'other' })) }),
            });
         }

         // 4. Save Intent (using first selected goal)
         if (form.selectedGoals.length > 0 || form.selectedFields.length > 0) {
            const category = INTENT_MAP[form.selectedGoals[0]] || FIELD_MAP[form.selectedFields[0]] || 'other';
            const description = [
               form.selectedGoals.length > 0 ? `Looking for: ${form.selectedGoals.join(', ')}` : '',
               form.selectedFields.length > 0 ? `Fields of interest: ${form.selectedFields.join(', ')}` : '',
            ].filter(Boolean).join('. ');

            await apiFetch('/api/intents', {
               method: 'POST',
               body: JSON.stringify({ category, description }),
            });
         }

         // 5. Add Connectors — pass any name the user provided so ghost profiles
         //    show a real label instead of falling back to email. Track which
         //    connectors weren't on WarmPath yet so we can nudge about invites.
         const ghostInvites = [];
         for (const conn of form.connectors) {
            if (conn.email && conn.relationship) {
               const { first_name, last_name } = splitFullName(conn.name);
               try {
                  const result = await apiFetch('/api/connections', {
                     method: 'POST',
                     body: JSON.stringify({
                        email: conn.email,
                        context: conn.relationship,
                        first_name,
                        last_name,
                     }),
                  });
                  if (result?.was_created) {
                     ghostInvites.push(conn.name?.trim() || conn.email);
                  }
               } catch (err) {
                  console.error("Failed to add connector:", conn.email, err);
               }
            }
         }

         await refreshUser();
         if (ghostInvites.length > 0) {
            const names = ghostInvites.slice(0, 2).join(", ");
            const more = ghostInvites.length > 2 ? ` and ${ghostInvites.length - 2} more` : "";
            toast(`${names}${more} aren't on WarmPath yet — share invite links from your Profile.`);
         }
         navigate("/home");
      } catch (err) {
         console.error("Failed to save onboarding data:", err);
         const msg = err.isUpload ? err.message : `Failed to save your profile: ${err.message || "unknown error"}`;
         toast(msg, "error");
      } finally {
         setIsSaving(false);
      }
   };

   const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
   const back = () => setStep((s) => Math.max(s - 1, 0));

   const isStep0Valid = form.firstName.trim() && form.lastName.trim();
   const isInterestsValid = form.selectedGoals.length > 0 || form.selectedFields.length > 0;

   return (
      <div
         style={{
            minHeight: "100vh",
            background: "#f2e9e4",
            padding: "20px",
            fontFamily: "sans-serif",
            color: "#386641",
            display: "flex",
            flexDirection: "column",
         }}
      >
         <Link to="/">
            <img
               src="/logo.png"
               alt="Logo"
               style={{
                  height: "62px",
                  display: "block",
                  marginBottom: "2rem",
                  padding: "0.08rem 2rem",
                  marginTop: "-0.55rem",
                  marginLeft: "-0.24rem",
               }}
            />
         </Link>

         <div
            style={{
               display: "flex",
               justifyContent: "center",
               alignItems: "center",
               flex: 1,
            }}
         >
            <div
               style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "520px",
                  maxWidth: "100%",
                  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
                  padding: "45px 25px",
                  borderRadius: "10px",
                  background: "#fff"
               }}
            >
               <StepDots current={step} />

               {/* Step 0: Identity */}
               {step === 0 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Who are you?</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                        How should people refer to you?
                     </p>

                     <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="onboarding-first-name" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>First Name</label>
                        <input
                           id="onboarding-first-name"
                           type="text"
                           value={form.firstName}
                           onChange={set("firstName")}
                           placeholder="Jane"
                           style={inputStyle}
                        />
                     </div>
                     <div style={{ marginBottom: "1.5rem" }}>
                        <label htmlFor="onboarding-last-name" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Last Name</label>
                        <input
                           id="onboarding-last-name"
                           type="text"
                           value={form.lastName}
                           onChange={set("lastName")}
                           placeholder="Doe"
                           style={inputStyle}
                        />
                     </div>

                     <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                           onClick={next}
                           disabled={!isStep0Valid}
                           style={{
                              ...btnPrimary,
                              backgroundColor: !isStep0Valid ? "#ccc" : "LightSalmon",
                              cursor: !isStep0Valid ? "not-allowed" : "pointer"
                           }}
                        >
                           Next
                        </button>
                     </div>
                  </>
               )}

               {/* Step 1: Academic & Bio */}
               {step === 1 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>What are you studying?</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                        What are you studying and how far along are you?
                     </p>

                     <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="onboarding-major" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Major</label>
                        <input
                           id="onboarding-major"
                           type="text"
                           value={form.major}
                           onChange={set("major")}
                           placeholder="Computer Science"
                           style={inputStyle}
                        />
                     </div>
                     <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="onboarding-year" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Year</label>
                        <select id="onboarding-year" value={form.year} onChange={set("year")} style={inputStyle}>
                           <option value="">Select Year</option>
                           <option value="freshman">Freshman</option>
                           <option value="sophomore">Sophomore</option>
                           <option value="junior">Junior</option>
                           <option value="senior">Senior</option>
                           <option value="grad">Grad Student</option>
                           <option value="other">Other</option>
                        </select>
                     </div>
                     <div style={{ marginBottom: "1.5rem" }}>
                        <label htmlFor="onboarding-bio" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Short Bio</label>
                        <textarea
                           id="onboarding-bio"
                           value={form.bio}
                           onChange={set("bio")}
                           placeholder="Tell us a bit about yourself..."
                           rows={3}
                           style={inputStyle}
                        />
                     </div>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button onClick={back} style={btnSecondary}>Back</button>
                        <button onClick={next} style={btnPrimary}>Next</button>
                     </div>
                  </>
               )}

               {/* Step 2: Profile Customization */}
               {step === 2 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Customize Your Profile</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                        Add a photo and a banner to help people recognize you.
                     </p>

                     <div style={{ marginBottom: "1.5rem" }}>
                        <label htmlFor="banner-input" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Profile Banner</label>
                        <div 
                           role="button"
                           tabIndex={0}
                           aria-label="Choose profile banner image"
                           style={{ 
                              width: "100%", 
                              height: "100px", 
                              backgroundColor: "#f2e9e4", 
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
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                 e.preventDefault();
                                 document.getElementById('banner-input').click();
                              }
                           }}
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
                           }}>Change Banner</div>
                        </div>
                        <input id="banner-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange('banner')} />
                     </div>

                     <div style={{ marginBottom: "2rem", display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div 
                           role="button"
                           tabIndex={0}
                           aria-label="Choose profile picture image"
                           style={{ 
                              width: "80px", 
                              height: "80px", 
                              borderRadius: "50%", 
                              backgroundColor: "#f2e9e4", 
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
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                 e.preventDefault();
                                 document.getElementById('profile-input').click();
                              }
                           }}
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
                           }}>Edit</div>
                        </div>
                        <div>
                           <label htmlFor="profile-input" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Profile Picture</label>
                           <button 
                              type="button"
                              onClick={() => document.getElementById('profile-input').click()}
                              style={{ ...tagStyle, padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                           >
                              Choose Picture
                           </button>
                           <input id="profile-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange('profile')} />
                        </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button onClick={back} style={btnSecondary}>Back</button>
                        <button 
                           onClick={next} 
                           onMouseEnter={() => setHoveredSkip(true)}
                           onMouseLeave={() => setHoveredSkip(false)}
                           style={{ 
                              ...btnSecondary, 
                              border: "1px solid #6a994e", 
                              color: "#6a994e",
                              background: hoveredSkip ? "#f7fcf8" : "transparent"
                           }}
                        >
                           Skip for now
                        </button>
                        <button onClick={next} style={btnPrimary}>Next</button>
                     </div>
                  </>
               )}

               {/* Step 3: Interests */}
               {step === 3 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Your Interests</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1rem" }}>
                        Help us understand what you're looking for.
                     </p>

                     <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>What are you looking for?</h3>
                     <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
                        {GOAL_TAGS.map((tag) => (
                           <button
                              key={tag}
                              onClick={() => toggleTag("selectedGoals", tag)}
                              style={{
                                 ...tagStyle,
                                 borderColor: form.selectedGoals.includes(tag) ? "LightSalmon" : "#d88c9a",
                                 background: form.selectedGoals.includes(tag) ? "LightSalmon" : "#fff",
                                 color: form.selectedGoals.includes(tag) ? "#fff" : "#386641",
                              }}
                           >
                              {tag}
                           </button>
                        ))}
                     </div>

                     <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>What's your field?</h3>
                     <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
                        {FIELD_TAGS.map((tag) => (
                           <button
                              key={tag}
                              onClick={() => toggleTag("selectedFields", tag)}
                              style={{
                                 ...tagStyle,
                                 borderColor: form.selectedFields.includes(tag) ? "LightSalmon" : "#d88c9a",
                                 background: form.selectedFields.includes(tag) ? "LightSalmon" : "#fff",
                                 color: form.selectedFields.includes(tag) ? "#fff" : "#386641",
                              }}
                           >
                              {tag}
                           </button>
                        ))}
                     </div>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                        <button onClick={back} style={btnSecondary}>Back</button>
                        <button
                           onClick={next}
                           disabled={!isInterestsValid}
                           style={{
                              ...btnPrimary,
                              backgroundColor: !isInterestsValid ? "#ccc" : "LightSalmon",
                              cursor: !isInterestsValid ? "not-allowed" : "pointer"
                           }}
                        >
                           Next
                        </button>
                     </div>
                  </>
               )}

               {/* Step 4: Experience */}
               {step === 4 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Experience</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1rem" }}>
                        Anything you've worked on so far? Add it here.
                     </p>

                     {form.experiences.map((exp, i) => (
                        <div key={i} style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: i < form.experiences.length - 1 ? "1px solid #eee" : "none" }}>
                           <input
                              type="text"
                              value={exp.title}
                              onChange={setExperience(i, "title")}
                              placeholder="Role (e.g. Software Intern)"
                              style={{ ...inputStyle, marginBottom: "0.5rem" }}
                           />
                           <input
                              type="text"
                              value={exp.organization}
                              onChange={setExperience(i, "organization")}
                              placeholder="Organization (e.g. Google)"
                              style={inputStyle}
                           />
                        </div>
                     ))}

                     <button onClick={addExperience} style={linkBtn}>+ Add Experience</button>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                        <button onClick={back} style={btnSecondary}>Back</button>
                        <button onClick={next} style={btnPrimary}>Next</button>
                     </div>
                  </>
               )}

               {/* Step 5: Connectors */}
               {step === 5 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Add Connectors</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1rem" }}>
                        Who do you already know? We'll use their email to link your networks.
                     </p>

                     {form.connectors.map((c, i) => (
                        <div key={i} style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: i < form.connectors.length - 1 ? "1px solid #eee" : "none" }}>
                           <input
                              type="text"
                              value={c.name}
                              onChange={setConnector(i, "name")}
                              placeholder="Name"
                              style={{ ...inputStyle, marginBottom: "0.5rem" }}
                           />
                           <input
                              type="email"
                              value={c.email}
                              onChange={setConnector(i, "email")}
                              placeholder="Email address"
                              style={{ ...inputStyle, marginBottom: "0.5rem" }}
                           />
                           <input
                              type="text"
                              value={c.relationship}
                              onChange={setConnector(i, "relationship")}
                              placeholder="How do you know them? (e.g. CS 499 Group)"
                              style={inputStyle}
                           />
                        </div>
                     ))}

                     <button onClick={addConnector} style={linkBtn}>+ Add Connector</button>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                        <button onClick={back} style={btnSecondary}>Back</button>
                        <button onClick={next} style={btnPrimary}>Next</button>
                     </div>
                  </>
               )}

               {/* Step 6: Welcome */}
               {step === 6 && (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                     <h2 style={{ fontSize: "1.5rem" }}>You're All Set!</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                        Welcome to WarmPath, {form.firstName}.
                     </p>
                     <button
                        onClick={handleGetStarted}
                        disabled={isSaving}
                        style={{
                           ...btnPrimary,
                           backgroundColor: isSaving ? "#ccc" : "LightSalmon",
                           cursor: isSaving ? "not-allowed" : "pointer",
                           width: "100%",
                           padding: "1rem"
                        }}
                     >
                        {isSaving ? "Saving…" : "Enter WarmPath"}
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

const inputStyle = {
   backgroundColor: "#f2e9e4",
   width: "100%",
   padding: "0.8rem 1rem",
   borderRadius: "8px",
   border: "1px solid #d88c9a",
   fontSize: "1rem",
   fontFamily: "sans-serif",
   boxSizing: "border-box",
};

const btnPrimary = {
   backgroundColor: "LightSalmon",
   padding: "0.8rem 2rem",
   borderRadius: "100px",
   border: "none",
   fontSize: "1rem",
   fontWeight: "bold",
   color: "#fff",
   cursor: "pointer",
   transition: "background-color 0.1s",
};

const btnSecondary = {
   backgroundColor: "#f2e9e4",
   padding: "0.8rem 1.5rem",
   borderRadius: "100px",
   border: "1px solid Tomato",
   color: "Tomato",
   fontSize: "1rem",
   fontWeight: "bold",
   cursor: "pointer",
};

const tagStyle = {
   padding: "0.45rem 1rem",
   fontSize: "0.85rem",
   borderRadius: "20px",
   cursor: "pointer",
   border: "1px solid",
   transition: "all 0.15s",
};

const linkBtn = {
   background: "none",
   border: "none",
   color: "LightSalmon",
   cursor: "pointer",
   fontSize: "0.9rem",
   fontWeight: "bold",
   padding: "0.5rem 0",
   textAlign: "left",
};
