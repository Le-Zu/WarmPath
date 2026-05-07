import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PathCard } from "@/features/paths";
import { usePaths } from "@/hooks/usePaths";
import apiFetch from "@/services/client";
import { useToast } from "@/context/ToastContext";
import LoadingScreen from "@/components/LoadingScreen";

// Human-readable label for each intent enum value
const INTENT_LABELS = ["Internship", "Research", "Class help", "Club", "Skill"];
const INTENT_MAP = {
   Internship: "internship",
   Research: "research",
   "Class help": "class",
   Club: "club",
   Skill: "skill",
};
const INTENT_DISPLAY = {
   internship: "internship",
   research: "research",
   class: "class help",
   club: "club",
   skill: "skill",
};

export default function Paths() {
   const [searchParams, setSearchParams] = useSearchParams();
   const navigate = useNavigate();
   const rawIntent = searchParams.get("intent");
   // Default to internship if missing or invalid
   const intent = rawIntent || "internship";

   const activeIntent =
      INTENT_LABELS.find((label) => INTENT_MAP[label] === intent) || "Internship";

   const { paths, loading, error, refresh } = usePaths(intent);
   const toast = useToast();

   const handleIntentClick = (label) => {
      // If clicking the already active one, do nothing (no unselecting)
      if (activeIntent === label) return;
      
      navigate("/paths?intent=" + INTENT_MAP[label]);
   };

   const [showAddForm, setShowAddForm] = useState(false);
   const [newConn, setNewConn] = useState({
      name: "",
      email: "",
      relationship: "",
   });
   const [savingConn, setSavingConn] = useState(false);

   const handleAddConnector = async (e) => {
      e.preventDefault();
      if (!newConn.email || !newConn.relationship) return;
      setSavingConn(true);
      try {
         await apiFetch("/api/connections", {
            method: "POST",
            body: JSON.stringify({
               email: newConn.email,
               context: newConn.relationship,
            }),
         });
         toast("Connector added! This will help discover more paths.");
         setShowAddForm(false);
         setNewConn({ name: "", email: "", relationship: "" });
         refresh();
      } catch (err) {
         toast("Failed to add connector: " + err.message, "error");
      } finally {
         setSavingConn(false);
      }
   };

   const intentLabel = intent ? (INTENT_DISPLAY[intent] ?? intent) : null;

   if (loading && paths.length === 0) return <LoadingScreen page="paths" />;

   return (
      <div className="app-page">
         <div className="app-eyebrow">— Warm paths —</div>
         <div className="app-page-title">
            {loading && paths.length === 0
               ? "Finding paths…"
               : paths.length > 0
               ? `Found ${paths.length} paths`
               : "No paths found"}
         </div>

         <div className="app-page-sub">
            {paths.length > 0 ? (
               <span
                  style={{
                     display: "inline-flex",
                     alignItems: "center",
                     gap: "0.4rem",
                  }}
               >
                  Ranked by connection strength. Request an intro to get
                  started.
                  <WarmScoreInfo />
               </span>
            ) : !loading && intentLabel ? (
               `No warm paths for ${intentLabel} yet. Try a different intent or check back as your network grows.`
            ) : !loading ? (
               "Paths appear when you have mutual connections with someone. Build your network and check back."
            ) : null}
         </div>

         <div
            style={{
               display: "flex",
               alignItems: "center",
               justifyContent: "space-between",
               margin: "1rem 0 1.75rem",
            }}
         >
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
               }}
            >
               <span
                  style={{
                     color: "#9b8880",
                     fontSize: "0.8rem",
                     fontFamily: "var(--font-sans)",
                     marginRight: "0.1rem",
                  }}
               >
                  Looking for:
               </span>
               {INTENT_LABELS.map((label) => {
                  const isActive = activeIntent === label;
                  return (
                     <button
                        key={label}
                        onClick={() => handleIntentClick(label)}
                        style={{
                           background: isActive ? "#e76f51" : "transparent",
                           color: isActive ? "#fff" : "#9b6a5a",
                           border: `1.5px solid ${isActive ? "#e76f51" : "rgba(155,106,90,0.35)"}`,
                           borderRadius: "999px",
                           padding: "0.28rem 0.9rem",
                           fontSize: "0.8rem",
                           fontFamily: "var(--font-sans)",
                           fontWeight: isActive ? 500 : 400,
                           cursor: "pointer",
                           transition: "all 0.15s",
                        }}
                     >
                        {label}
                     </button>
                  );
               })}
            </div>

            <button
               onClick={() => setShowAddForm((v) => !v)}
               style={btnSecondary}
            >
               + Add a Connector
            </button>
         </div>

         {showAddForm && (
            <div
               style={{
                  marginBottom: "1.5rem",
                  padding: "1.5rem",
                  background: "#fff",
                  border: "1px dashed #d88c9a",
                  borderRadius: "4px",
               }}
            >
               <h3
                  style={{
                     fontSize: "1rem",
                     marginBottom: "1rem",
                     color: "var(--dark)",
                  }}
               >
                  Add a Connector
               </h3>
               <form
                  onSubmit={handleAddConnector}
                  style={{ maxWidth: "360px", textAlign: "left" }}
               >
                  <div style={{ marginBottom: "1rem" }}>
                     <label style={labelStyle}>Name</label>
                     <input
                        type="text"
                        value={newConn.name}
                        onChange={(e) =>
                           setNewConn({ ...newConn, name: e.target.value })
                        }
                        placeholder="Alex Rivera"
                        style={inputStyle}
                     />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                     <label style={labelStyle}>Email *</label>
                     <input
                        type="email"
                        required
                        value={newConn.email}
                        onChange={(e) =>
                           setNewConn({ ...newConn, email: e.target.value })
                        }
                        placeholder="alex@example.com"
                        style={inputStyle}
                     />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                     <label style={labelStyle}>Relationship Context *</label>
                     <input
                        type="text"
                        required
                        value={newConn.relationship}
                        onChange={(e) =>
                           setNewConn({
                              ...newConn,
                              relationship: e.target.value,
                           })
                        }
                        placeholder="e.g. Worked together in CS 499"
                        style={inputStyle}
                     />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                     <button
                        type="submit"
                        disabled={savingConn}
                        style={btnPrimary}
                     >
                        {savingConn ? "Saving..." : "Add Connector"}
                     </button>
                     <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        style={btnSecondary}
                     >
                        Cancel
                     </button>
                  </div>
               </form>
            </div>
         )}

         {error && !loading ? (
            <div
               style={{
                  padding: "1.5rem 0",
                  color: "#7a6f68",
                  fontSize: "0.88rem",
               }}
            >
               Failed to load paths.{" "}
               <button
                  onClick={refresh}
                  style={{
                     background: "none",
                     border: "none",
                     color: "var(--warm)",
                     cursor: "pointer",
                     fontSize: "0.88rem",
                     padding: 0,
                     textDecoration: "underline",
                  }}
               >
                  Retry
               </button>
            </div>
         ) : loading && paths.length === 0 ? (
            <>
               <PathCardSkeleton />
               <PathCardSkeleton />
               <PathCardSkeleton />
            </>
         ) : paths.length === 0 ? (
            <div
               style={{
                  marginTop: "1rem",
                  padding: "2rem",
                  background: "#fff",
                  border: "1px dashed #d88c9a",
                  borderRadius: "4px",
                  textAlign: "center",
               }}
            >
               <h3
                  style={{
                     fontSize: "1.1rem",
                     marginBottom: "0.5rem",
                     color: "var(--dark)",
                  }}
               >
                  Expand your network
               </h3>
               <p
                  style={{
                     fontSize: "0.88rem",
                     color: "#7a6f68",
                     maxWidth: "400px",
                     margin: "0 auto",
                  }}
               >
                  Paths are discovered through your existing connections. Add a
                  connector you already know to help WarmPath find more paths
                  for you.
               </p>
            </div>
         ) : (
            <div
               style={{
                  opacity: loading ? 0.55 : 1,
                  transition: "opacity 0.2s",
               }}
            >
               {paths.map((p) => (
                  <PathCard key={p.id} path={p} score={p.warmScore} />
               ))}
            </div>
         )}
      </div>
   );
}

function PathCardSkeleton() {
   return (
      <div
         className="app-card"
         style={{
            display: "flex",
            gap: "2.5rem",
            alignItems: "flex-start",
            marginBottom: "1rem",
         }}
      >
         <div className="path-chain" style={{ width: "320px", flexShrink: 0 }}>
            <div className="path-node">
               <div className="path-dot you">YOU</div>
               <div className="path-node-label">You</div>
            </div>
            <div className="path-connector-line" style={{ height: "40px" }} />
            <div className="path-node">
               <div className="path-dot connector">CON</div>
               <div
                  style={{
                     width: 90,
                     height: 13,
                     borderRadius: 2,
                     background: "#e0d8d4",
                  }}
               />
            </div>
            <div className="path-connector-line" style={{ height: "40px" }} />
            <div className="path-node">
               <div className="path-dot target">TGT</div>
               <div
                  style={{
                     width: 110,
                     height: 13,
                     borderRadius: 2,
                     background: "#e0d8d4",
                  }}
               />
            </div>
         </div>

         <div
            style={{
               flex: 1,
               borderLeft: "1px solid #f0e8e4",
               paddingLeft: "2.5rem",
            }}
         >
            <div
               style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#e0d8d4",
                  marginBottom: "0.6rem",
               }}
            />
            <div
               style={{
                  width: 130,
                  height: 18,
                  borderRadius: 2,
                  background: "#e0d8d4",
                  marginBottom: "0.4rem",
               }}
            />
            <div
               style={{
                  width: 90,
                  height: 13,
                  borderRadius: 2,
                  background: "#e0d8d4",
                  marginBottom: "1.4rem",
               }}
            />
            <div
               style={{
                  width: 70,
                  height: 13,
                  borderRadius: 2,
                  background: "#e0d8d4",
               }}
            />
         </div>
      </div>
   );
}

const labelStyle = {
   fontSize: "0.75rem",
   fontWeight: "bold",
   display: "block",
   marginBottom: "0.3rem",
};

const inputStyle = {
   width: "100%",
   padding: "0.6rem 0.8rem",
   borderRadius: "4px",
   border: "1px solid var(--border)",
   fontSize: "0.9rem",
   boxSizing: "border-box",
};

const btnPrimary = {
   backgroundColor: "LightSalmon",
   padding: "0.6rem 1.2rem",
   borderRadius: "100px",
   border: "none",
   color: "#fff",
   fontWeight: "bold",
   cursor: "pointer",
};

const btnSecondary = {
   backgroundColor: "transparent",
   padding: "0.6rem 1.2rem",
   borderRadius: "100px",
   border: "1px solid #7a6f68",
   color: "#7a6f68",
   fontWeight: "bold",
   cursor: "pointer",
};

// Small "ⓘ" icon next to the page subtitle that explains the warm score on hover/focus.
function WarmScoreInfo() {
   const [open, setOpen] = useState(false);

   return (
      <span
         style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
         }}
         onMouseEnter={() => setOpen(true)}
         onMouseLeave={() => setOpen(false)}
      >
         <button
            type="button"
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onClick={() => setOpen((prev) => !prev)}
            aria-label="What is the warm score?"
            aria-describedby="warm-score-tooltip"
            style={infoIconBtn}
         >
            <svg
               width="16"
               height="16"
               viewBox="0 0 16 16"
               xmlns="http://www.w3.org/2000/svg"
               aria-hidden="true"
            >
               <circle
                  cx="8"
                  cy="8"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
               />
               <circle cx="8" cy="4.5" r="0.9" fill="currentColor" />
               <path
                  d="M8 7v5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
               />
            </svg>
         </button>
         {open && (
            <span id="warm-score-tooltip" role="tooltip" style={tooltipStyle}>
               <strong style={{ display: "block", marginBottom: 4 }}>
                  More flames = stronger relevance.
               </strong>
               We use AI to estimate how well each connection's interests,
               experience, and background match what you're looking for.
            </span>
         )}
      </span>
   );
}

const infoIconBtn = {
   display: "inline-flex",
   alignItems: "center",
   justifyContent: "center",
   width: 18,
   height: 18,
   padding: 0,
   border: "none",
   background: "transparent",
   color: "#7a6f68",
   cursor: "pointer",
   borderRadius: "50%",
};

const tooltipStyle = {
   position: "absolute",
   top: "50%",
   left: "calc(100% + 10px)",
   transform: "translateY(-50%)",
   zIndex: 10,
   width: 280,
   padding: "0.7rem 0.85rem",
   background: "var(--dark)",
   color: "var(--cream)",
   fontSize: "0.78rem",
   lineHeight: 1.45,
   borderRadius: 6,
   boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
   fontWeight: 400,
   pointerEvents: "none",
};
