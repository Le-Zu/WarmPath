import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { UserContext } from "@/context/UserContext.jsx";
import { getConnections, respondToConnection } from "@/services/connections";
import { useToast } from "@/context/ToastContext";

export default function Profile() {
   const navigate = useNavigate();
   const { currentUser, loading, error } = useContext(UserContext);
   const toast = useToast();
   const [connections, setConnections] = useState([]);
   const [loadingConns, setLoadingConns] = useState(false);
   const [acceptingId, setAcceptingId] = useState(null);

   useEffect(() => {
      if (currentUser) {
         setLoadingConns(true);
         getConnections()
            .then((data) => setConnections(data.connections || []))
            .catch((err) => console.error("Failed to fetch connections:", err))
            .finally(() => setLoadingConns(false));
      }
   }, [currentUser]);

   const handleAcceptConnection = async (connectionId) => {
      setAcceptingId(connectionId);
      try {
         await respondToConnection(connectionId, "accepted");
         // Refresh connections list
         const data = await getConnections();
         setConnections(data.connections || []);
         toast("Connection accepted!");
      } catch (err) {
         toast("Failed to accept connection: " + err.message, "error");
      } finally {
         setAcceptingId(null);
      }
   };

   if (loading) return <div className="app-page">Loading profile...</div>;
   if (error) return <div className="app-page">Failed to load profile.</div>;
   if (!currentUser) return null;

   const fullName =
      [currentUser.first_name, currentUser.last_name]
         .filter(Boolean)
         .join(" ") || currentUser.email;

   const handleCopyInvite = (email) => {
      const inviteUrl = `${window.location.origin}/register?email=${encodeURIComponent(email)}`;
      navigator.clipboard.writeText(inviteUrl);
      toast(`Invite link copied for ${email}!`);
   };

   return (
      <div className="app-page">
         <div
            style={{
               background: currentUser.banner_picture_url ? `url(${currentUser.banner_picture_url})` : "var(--dark)",
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               borderRadius: 8,
               height: "200px",
               marginBottom: "1.5rem",
               position: "relative",
               display: "flex",
               alignItems: "flex-end",
               overflow: "hidden"
            }}
         >
            {/* Gradient overlay for readability */}
            <div style={{
               position: 'absolute',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
               zIndex: 1
            }} />

            <div style={{
               padding: "1.5rem 2rem",
               color: "var(--cream)",
               zIndex: 2,
               display: "flex",
               alignItems: "center",
               gap: "1.5rem",
               width: "100%"
            }}>
               <div style={{ 
                  width: "80px", 
                  height: "80px", 
                  borderRadius: "50%", 
                  overflow: "hidden", 
                  border: "3px solid var(--cream)",
                  backgroundColor: "var(--cream)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
               }}>
                  {currentUser.profile_picture_url ? (
                     <img
                        src={currentUser.profile_picture_url}
                        alt="Profile"
                        style={{
                           width: "100%",
                           height: "100%",
                           objectFit: "cover"
                        }}
                     />
                  ) : (
                     <User size={40} strokeWidth={1.5} color="#7a6f68" />
                  )}
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                     <div>
                        <div
                           style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "2rem",
                              lineHeight: 1.2,
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                           }}
                        >
                           {fullName}
                        </div>
                        <div
                           style={{ fontSize: "0.9rem", color: "rgba(242,233,228,0.9)", textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                        >
                           {[currentUser.major, currentUser.year]
                              .filter(Boolean)
                              .join(" · ") || "New Member"}
                        </div>
                     </div>
                     <button
                        onClick={() => navigate("/settings")}
                        style={{
                           background: "rgba(255,255,255,0.2)",
                           border: "1px solid rgba(255,255,255,0.4)",
                           borderRadius: "100px",
                           color: "#fff",
                           padding: "0.4rem 1rem",
                           fontSize: "0.75rem",
                           fontWeight: 600,
                           cursor: "pointer",
                           transition: "background 0.2s",
                           backdropFilter: "blur(4px)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                     >
                        Edit Profile
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <div
            style={{
               display: "grid",
               gridTemplateColumns: "1fr 1fr",
               gap: "1.5rem",
            }}
         >
            <div>
               <div className="app-card" style={{ marginBottom: "1.5rem" }}>
                  <div
                     className="app-eyebrow"
                     style={{ marginBottom: "0.75rem" }}
                  >
                     About
                  </div>
                  {currentUser.bio ? (
                     <p
                        style={{
                           fontSize: "0.88rem",
                           color: "#5a5550",
                           lineHeight: 1.6,
                        }}
                     >
                        {currentUser.bio}
                     </p>
                  ) : (
                     <p
                        style={{
                           fontSize: "0.85rem",
                           color: "#888",
                           fontStyle: "italic",
                        }}
                     >
                        No bio added yet.
                     </p>
                  )}
               </div>

               <div className="app-card" style={{ marginBottom: "1.5rem" }}>
                  <div
                     className="app-eyebrow"
                     style={{ marginBottom: "0.75rem" }}
                  >
                     Interests
                  </div>
                  {currentUser.interests?.length > 0 ? (
                     <div
                        style={{
                           display: "flex",
                           flexWrap: "wrap",
                           gap: "0.5rem",
                        }}
                     >
                        {currentUser.interests.map((i) => (
                           <span
                              key={i.interest_id}
                              className="tag tag-approved"
                              style={{ fontSize: "0.75rem" }}
                           >
                              {i.label}
                           </span>
                        ))}
                     </div>
                  ) : (
                     <p
                        style={{
                           fontSize: "0.85rem",
                           color: "#888",
                           fontStyle: "italic",
                        }}
                     >
                        No interests added yet.
                     </p>
                  )}
               </div>

               <div className="app-card">
                  <div
                     className="app-eyebrow"
                     style={{ marginBottom: "0.75rem" }}
                  >
                     Experience
                  </div>
                  {currentUser.experiences?.length > 0 ? (
                     <div
                        style={{
                           display: "flex",
                           flexDirection: "column",
                           gap: "1rem",
                        }}
                     >
                        {currentUser.experiences.map((e) => (
                           <div key={e.experience_id}>
                              <div
                                 style={{
                                    fontSize: "0.9rem",
                                    fontWeight: 500,
                                    color: "var(--charcoal)",
                                 }}
                              >
                                 {e.title}
                              </div>
                              <div
                                 style={{
                                    fontSize: "0.8rem",
                                    color: "#7a6f68",
                                 }}
                              >
                                 {e.organization}
                              </div>
                              {e.description && (
                                 <p
                                    style={{
                                       fontSize: "0.8rem",
                                       color: "#5a5550",
                                       marginTop: "0.25rem",
                                    }}
                                 >
                                    {e.description}
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                  ) : (
                     <p
                        style={{
                           fontSize: "0.85rem",
                           color: "#888",
                           fontStyle: "italic",
                        }}
                     >
                        No experience added yet.
                     </p>
                  )}
               </div>
            </div>

            <div>
               <div className="app-card" style={{ marginBottom: "1.5rem" }}>
                  <div
                     className="app-eyebrow"
                     style={{ marginBottom: "0.75rem" }}
                  >
                     My Network
                  </div>
                  {loadingConns ? (
                     <div style={{ fontSize: "0.85rem", color: "#888" }}>
                        Loading network...
                     </div>
                  ) : connections.length === 0 ? (
                     <div style={{ fontSize: "0.85rem", color: "#888" }}>
                        You haven't added any connections yet.
                     </div>
                  ) : (
                     <div
                        style={{
                           display: "flex",
                           flexDirection: "column",
                           gap: "1rem",
                        }}
                     >
                        {connections.map((c) => {
                           const isIncomingRequest =
                              c.status === "pending" &&
                              c.initiator_id !== currentUser.user_id;
                           const isOutgoingRequest =
                              c.status === "pending" &&
                              c.initiator_id === currentUser.user_id;

                           return (
                              <div
                                 key={c.connection_id}
                                 style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    justifyContent: "space-between",
                                 }}
                              >
                                 <div
                                    style={{
                                       display: "flex",
                                       alignItems: "center",
                                       gap: "0.75rem",
                                    }}
                                 >
                                    <div
                                       style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          background: "var(--cream)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifySelf: "center",
                                          justifyContent: "center",
                                          fontSize: "0.8rem",
                                       }}
                                    >
                                       <User size={18} strokeWidth={1.75} color="#7a6f68" />
                                    </div>
                                    <div>
                                       <div
                                          style={{
                                             fontSize: "0.88rem",
                                             fontWeight: 500,
                                          }}
                                       >
                                          {[c.peer.first_name, c.peer.last_name]
                                             .filter(Boolean)
                                             .join(" ") || c.peer.email}
                                          {c.status === "pending" && (
                                             <span
                                                style={{
                                                   marginLeft: "0.5rem",
                                                   fontSize: "0.7rem",
                                                   color: "LightSalmon",
                                                   textTransform: "uppercase",
                                                }}
                                             >
                                                (Pending)
                                             </span>
                                          )}
                                       </div>
                                       <div
                                          style={{
                                             fontSize: "0.75rem",
                                             color: "#7a6f68",
                                          }}
                                       >
                                          {c.context}
                                       </div>
                                    </div>
                                 </div>

                                 {isIncomingRequest && (
                                    <button
                                       onClick={() =>
                                          handleAcceptConnection(
                                             c.connection_id,
                                          )
                                       }
                                       disabled={
                                          acceptingId === c.connection_id
                                       }
                                       style={{
                                          fontSize: "0.75rem",
                                          padding: "0.4rem 0.8rem",
                                          borderRadius: "100px",
                                          border: "none",
                                          background: "LightSalmon",
                                          color: "#fff",
                                          fontWeight: "bold",
                                          cursor:
                                             acceptingId === c.connection_id
                                                ? "not-allowed"
                                                : "pointer",
                                          opacity:
                                             acceptingId === c.connection_id
                                                ? 0.6
                                                : 1,
                                       }}
                                    >
                                       {acceptingId === c.connection_id
                                          ? "Accepting..."
                                          : "Accept"}
                                    </button>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>

               {/* TODO: When "view other user profile" page is built, hide this card if
                   the viewed user's privacy_settings.discovery_mode is "hidden" or "anonymous". */}
               <div className="app-card">
                  <div
                     className="app-eyebrow"
                     style={{ marginBottom: "0.75rem" }}
                  >
                     LinkedIn
                  </div>
                  {currentUser.linkedin_url ? (
                     <a
                        href={currentUser.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: "0.75rem",
                           textDecoration: "none",
                           color: "inherit",
                           fontSize: "0.88rem",
                           fontWeight: 500,
                        }}
                     >
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           viewBox="0 0 24 24"
                           width="24"
                           height="24"
                           fill="#0A66C2"
                           aria-label="LinkedIn"
                        >
                           <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>
                           {[currentUser.first_name, currentUser.last_name]
                              .filter(Boolean)
                              .join(" ") || "View"}{" "}
                           on LinkedIn
                        </span>
                     </a>
                  ) : (
                     <p
                        style={{
                           fontSize: "0.85rem",
                           color: "#888",
                           fontStyle: "italic",
                        }}
                     >
                        No LinkedIn added yet.
                     </p>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
