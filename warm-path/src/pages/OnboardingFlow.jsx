import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiFetch from "../api/client";
import { useUser } from "../contexts/UserContext";

const TOTAL_STEPS = 3;

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

function StepDots({ current }) {
   return (
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1.5rem" }}>
         {Array.from({ length: TOTAL_STEPS }, (_, i) => (
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
   const [step, setStep] = useState(0);
   const [isSaving, setIsSaving] = useState(false);
   const [form, setForm] = useState({
      selectedGoals: [],
      selectedFields: [],
      otherInfo: "",
      connectors: [{ name: "", relationship: "" }],
   });

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

   const setConnector = (index, field) => (e) =>
      setForm((f) => {
         const connectors = [...f.connectors];
         connectors[index] = { ...connectors[index], [field]: e.target.value };
         return { ...f, connectors };
      });

   const addConnector = () =>
      setForm((f) => ({
         ...f,
         connectors: [...f.connectors, { name: "", relationship: "" }],
      }));

   const hasInterests = form.selectedGoals.length > 0 || form.selectedFields.length > 0;

   const handleGetStarted = async () => {
      setIsSaving(true);
      try {
         // 1. Save Intent
         const category = INTENT_MAP[form.selectedGoals[0]] || FIELD_MAP[form.selectedFields[0]] || 'other';
         const description = [
            form.selectedGoals.length > 0 ? `Looking for: ${form.selectedGoals.join(', ')}` : '',
            form.selectedFields.length > 0 ? `Fields of interest: ${form.selectedFields.join(', ')}` : '',
            form.otherInfo
         ].filter(Boolean).join('. ');

         await apiFetch('/api/intents', {
            method: 'POST',
            body: JSON.stringify({ category, description }),
         });

         // 2. Profile Sync
         await apiFetch('/api/me', {
            method: 'PATCH',
            body: JSON.stringify({ 
               // We don't have name inputs in onboarding yet, so just marking flow as complete
               // is implied by the successful intent creation for now.
            }),
         });

         await refreshUser();
         navigate("/home");
      } catch (err) {
         console.error("Failed to save onboarding data:", err);
         alert("Failed to save your profile: " + err.message);
      } finally {
         setIsSaving(false);
      }
   };

   const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
   const back = () => setStep((s) => Math.max(s - 1, 0));

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

               {/* Step 0: Interests */}
               {step === 0 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Your Interests</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1rem" }}>
                        Help us understand what you're looking for so we can find the right connections.
                     </p>

                     <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>What are you looking for?</h3>
                     <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
                        {GOAL_TAGS.map((tag) => (
                           <button
                              key={tag}
                              onClick={() => toggleTag("selectedGoals", tag)}
                              style={{
                                 padding: "0.45rem 1rem",
                                 fontSize: "0.85rem",
                                 borderRadius: "20px",
                                 cursor: "pointer",
                                 border: "1px solid",
                                 borderColor: form.selectedGoals.includes(tag) ? "LightSalmon" : "#d88c9a",
                                 background: form.selectedGoals.includes(tag) ? "LightSalmon" : "#fff",
                                 color: form.selectedGoals.includes(tag) ? "#fff" : "#386641",
                                 transition: "all 0.15s",
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
                                 padding: "0.45rem 1rem",
                                 fontSize: "0.85rem",
                                 borderRadius: "20px",
                                 cursor: "pointer",
                                 border: "1px solid",
                                 borderColor: form.selectedFields.includes(tag) ? "LightSalmon" : "#d88c9a",
                                 background: form.selectedFields.includes(tag) ? "LightSalmon" : "#fff",
                                 color: form.selectedFields.includes(tag) ? "#fff" : "#386641",
                                 transition: "all 0.15s",
                              }}
                           >
                              {tag}
                           </button>
                        ))}
                     </div>

                     <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                           Anything else you'd like us to know?
                        </label>
                        <textarea
                           value={form.otherInfo}
                           onChange={set("otherInfo")}
                           placeholder="Optional — tell us more about yourself..."
                           rows={3}
                           style={{
                              backgroundColor: "#f2e9e4",
                              width: "100%",
                              padding: "1rem",
                              borderRadius: "8px",
                              border: "1px solid",
                              fontSize: "1rem",
                              fontFamily: "sans-serif",
                              resize: "vertical",
                              boxSizing: "border-box",
                           }}
                        />
                     </div>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                        <button
                           onClick={next}
                           disabled={!hasInterests}
                           onMouseEnter={() => setHoveredNext(true)}
                           onMouseLeave={() => setHoveredNext(false)}
                           style={{
                              backgroundColor: !hasInterests ? "#ccc" : hoveredNext ? "#e8825a" : "LightSalmon",
                              padding: "1rem 2rem",
                              borderRadius: "100px",
                              border: "1px",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              cursor: hasInterests ? "pointer" : "not-allowed",
                              transition: "background-color 0.1s",
                              color: "#fff",
                           }}
                        >
                           Next
                        </button>
                     </div>
                  </>
               )}

               {/* Step 1: Connectors (skippable) */}
               {step === 1 && (
                  <>
                     <h2 style={{ fontSize: "1.5rem" }}>Add Connectors</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1rem" }}>
                        Connectors are people you already know who can introduce you to others.
                        You can always add connectors later from your profile.
                     </p>

                     {form.connectors.map((c, i) => (
                        <div key={i} style={{ marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: i < form.connectors.length - 1 ? "1px solid #d88c9a" : "none" }}>
                           <div style={{ marginBottom: "0.5rem" }}>
                              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                 Connector Name
                              </label>
                              <input
                                 type="text"
                                 value={c.name}
                                 onChange={setConnector(i, "name")}
                                 placeholder="Alex Rivera"
                                 style={{
                                    backgroundColor: "#f2e9e4",
                                    width: "100%",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    fontSize: "1rem",
                                    boxSizing: "border-box",
                                 }}
                              />
                           </div>
                           <div>
                              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                 Relationship Context
                              </label>
                              <input
                                 type="text"
                                 value={c.relationship}
                                 onChange={setConnector(i, "relationship")}
                                 placeholder="Worked together in CS 499"
                                 style={{
                                    backgroundColor: "#f2e9e4",
                                    width: "100%",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    fontSize: "1rem",
                                    boxSizing: "border-box",
                                 }}
                              />
                           </div>
                        </div>
                     ))}

                     <button
                        onClick={addConnector}
                        onMouseEnter={() => setHoveredAdd(true)}
                        onMouseLeave={() => setHoveredAdd(false)}
                        style={{
                           background: "none",
                           border: "none",
                           color: hoveredAdd ? "#e8825a" : "LightSalmon",
                           cursor: "pointer",
                           fontSize: "0.9rem",
                           fontWeight: "bold",
                           padding: "0.5rem 0",
                           marginBottom: "1rem",
                           textAlign: "left",
                        }}
                     >
                        + Add another connector
                     </button>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                        <button
                           onClick={back}
                           onMouseEnter={() => setHoveredBack(true)}
                           onMouseLeave={() => setHoveredBack(false)}
                           style={{
                              backgroundColor: hoveredBack ? "#ecc6b5" : "#f2e9e4",
                              padding: "1rem 1.5rem",
                              borderRadius: "100px",
                              border: "1px solid",
                              borderColor: "Tomato",
                              color: "Tomato",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "background-color 0.1s",
                           }}
                        >
                           Back
                        </button>
                        <button
                           onClick={next}
                           onMouseEnter={() => setHoveredSkip(true)}
                           onMouseLeave={() => setHoveredSkip(false)}
                           style={{
                              backgroundColor: hoveredSkip ? "#ecc6b5" : "#f2e9e4",
                              padding: "1rem 1.5rem",
                              borderRadius: "100px",
                              border: "1px solid",
                              borderColor: "Tomato",
                              color: "Tomato",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "background-color 0.1s",
                           }}
                        >
                           Skip for now
                        </button>
                        <button
                           onClick={next}
                           onMouseEnter={() => setHoveredNext(true)}
                           onMouseLeave={() => setHoveredNext(false)}
                           style={{
                              backgroundColor: hoveredNext ? "#e8825a" : "LightSalmon",
                              padding: "1rem 2rem",
                              borderRadius: "100px",
                              border: "1px",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "background-color 0.1s",
                              color: "#fff",
                           }}
                        >
                           Next
                        </button>
                     </div>
                  </>
               )}

               {/* Step 2: Welcome */}
               {step === 2 && (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                     <h2 style={{ fontSize: "1.5rem" }}>You're All Set!</h2>
                     <p style={{ fontSize: "0.95rem", color: "#6a994e", marginBottom: "1.5rem" }}>
                        Your first warm path is one connection away.
                     </p>
                     <button
                        onClick={handleGetStarted}
                        disabled={isSaving}
                        onMouseEnter={() => setHoveredStart(true)}
                        onMouseLeave={() => setHoveredStart(false)}
                        style={{
                           backgroundColor: isSaving ? "#ccc" : hoveredStart ? "#e8825a" : "LightSalmon",
                           padding: "1rem 2rem",
                           borderRadius: "100px",
                           border: "1px",
                           fontSize: "1rem",
                           fontWeight: "bold",
                           cursor: isSaving ? "not-allowed" : "pointer",
                           transition: "background-color 0.1s",
                           color: "#fff",
                        }}
                     >
                        {isSaving ? "Saving..." : "Get Started"}
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
