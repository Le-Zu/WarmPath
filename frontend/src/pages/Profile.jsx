import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { UserContext } from "@/context/UserContext.jsx";
import { getConnections, respondToConnection } from "@/services/connections";
import { useToast } from "@/context/ToastContext";
import apiFetch from "@/services/client";
import handshakeIcon from "@/assets/handshake-icon.png";
import { splitFullName } from "@/utils/formatters";
import LoadingScreen from "@/components/LoadingScreen";
import InfoTooltip from "@/components/InfoTooltip";
import InviteConnectorPanel from "@/components/InviteConnectorPanel";

export default function Profile() {
   const navigate = useNavigate();
   const { currentUser, loading, error } = useContext(UserContext);
   const toast = useToast();
   const [connections, setConnections] = useState([]);
   const [loadingConns, setLoadingConns] = useState(false);
   const [acceptingId, setAcceptingId] = useState(null);

   const [showAddForm, setShowAddForm] = useState(false);
   const [newConn, setNewConn] = useState({
      name: "",
      email: "",
      relationship: "",
   });
   const [savingConn, setSavingConn] = useState(false);
   const [invitePeer, setInvitePeer] = useState(null);

   const handleAddConnector = async (e) => {
      e.preventDefault();
      if (!newConn.email || !newConn.relationship) return;
      setSavingConn(true);
      try {
         const { first_name, last_name } = splitFullName(newConn.name);
         const result = await apiFetch("/api/connections", {
            method: "POST",
            body: JSON.stringify({
               email: newConn.email,
               context: newConn.relationship,
               first_name,
               last_name,
            }),
         });
         setNewConn({ name: "", email: "", relationship: "" });
         if (result?.was_created && result.peer) {
            setInvitePeer(result.peer);
         } else {
            toast("Connector added! This will help discover more paths.");
            setShowAddForm(false);
         }
         // Refresh connections list
         const data = await getConnections();
         setConnections(data.connections || []);
      } catch (err) {
         let msg;
         if (err.status === 409) msg = "You are already connected with this person.";
         else if (err.status === 429) msg = err.message;
         else if (err.status === 400) msg = "Please fill in all required fields.";
         else msg = "Could not add connector. Please try again.";
         toast(msg, "error");
      } finally {
         setSavingConn(false);
      }
   };

   const dismissInvite = () => {
      setInvitePeer(null);
      setShowAddForm(false);
   };

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

   if (loading) return <LoadingScreen page="profile" />;
   if (error) return <div className="app-page">Failed to load profile.</div>;
   if (!currentUser) return null;

   const fullName =
      [currentUser.first_name, currentUser.last_name]
         .filter(Boolean)
         .join(" ") || currentUser.email;

   const handleCopyInvite = async (peer) => {
      const inviteUrl = `${window.location.origin}/register?email=${encodeURIComponent(peer.email)}`;
      const displayName =
         [peer.first_name, peer.last_name].filter(Boolean).join(" ") || peer.email;
      try {
         await navigator.clipboard.writeText(inviteUrl);
         toast(`Invite link copied for ${displayName}.`);
      } catch {
         toast("Could not copy link. Please copy it manually.", "error");
      }
   };

   const awaitingReply = connections.filter(c => c.status === "pending");
   const newConnections = connections.filter(c => c.status === "accepted" && c.context?.startsWith("Introduced by"));
   const connectors = connections.filter(c => c.status === "accepted" && !c.context?.startsWith("Introduced by"));

   const renderConnectionList = (list, emptyMsg) => {
      if (list.length === 0) {
         return <div style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic", marginBottom: "1rem" }}>{emptyMsg}</div>;
      }
      return (
         <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            {list.map((c) => {
               const isIncomingRequest =
                  c.status === "pending" &&
                  c.initiator_id !== currentUser.user_id;
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
                              justifyContent: "center",
                              fontSize: "0.8rem",
                              overflow: 'hidden'
                           }}
                        >
                           {c.peer.profile_picture_url ? (
                              <img 
                                 src={c.peer.profile_picture_url} 
                                 alt="" 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                           ) : (
                              <User size={18} strokeWidth={1.75} color="#7a6f68" />
                           )}
                        </div>
                        <div>
                           <div style={{ fontSize: "0.88rem", fontWeight: 500 }}>
                              {[c.peer.first_name, c.peer.last_name].filter(Boolean).join(" ") || c.peer.email}
                              {c.status === "pending" && !isIncomingRequest && (
                                 <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "LightSalmon", textTransform: "uppercase" }}>
                                    (Awaiting reply)
                                 </span>
                              )}
                              {!c.peer.is_active && (
                                 <button
                                    type="button"
                                    onClick={() => handleCopyInvite(c.peer)}
                                    style={{
                                       marginLeft: "0.5rem",
                                       fontSize: "0.7rem",
                                       background: "transparent",
                                       border: "none",
                                       color: "var(--warm)",
                                       cursor: "pointer",
                                       padding: 0,
                                       textDecoration: "underline",
                                       fontWeight: 500,
                                    }}
                                 >
                                    Copy invite
                                 </button>
                              )}
                           </div>
                           <div style={{ fontSize: "0.75rem", color: "#7a6f68" }}>{c.context}</div>
                           {c.peer.intent_status && (
                              <div style={{ 
                                 fontSize: "0.7rem", 
                                 color: "var(--dark)", 
                                 background: "rgba(231, 111, 81, 0.05)",
                                 padding: "0.2rem 0.4rem",
                                 borderRadius: "4px",
                                 marginTop: "0.2rem",
                                 display: "inline-block"
                              }}>
                                 📍 {c.peer.intent_status}
                              </div>
                           )}
                           <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem' }}>
                              {c.peer.linkedin_url && (
                                 <a 
                                    href={c.peer.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="LinkedIn"
                                    style={{ 
                                       display: 'inline-flex', 
                                       alignItems: 'center', 
                                       color: '#0077b5', 
                                       textDecoration: 'none',
                                    }}
                                 >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                       <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                 </a>
                              )}
                              {c.peer.handshake_url && (
                                 <a 
                                    href={c.peer.handshake_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="Handshake"
                                    style={{ 
                                       display: 'inline-flex', 
                                       alignItems: 'center', 
                                       color: '#ff3b30', 
                                       textDecoration: 'none',
                                    }}
                                 >
                                    <img
                                       src={handshakeIcon}
                                       alt="Handshake"
                                       style={{
                                          width: '16px',
                                          height: '16px',
                                          borderRadius: '2px',
                                          display: 'block',
                                          objectFit: 'cover',
                                       }}
                                    />
                                 </a>
                              )}
                           </div>
                        </div>
                     </div>
                     {isIncomingRequest && (
                        <button
                           onClick={() => handleAcceptConnection(c.connection_id)}
                           disabled={acceptingId === c.connection_id}
                           style={{
                              fontSize: "0.75rem",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "100px",
                              border: "none",
                              background: "LightSalmon",
                              color: "#fff",
                              fontWeight: "bold",
                              cursor: acceptingId === c.connection_id ? "not-allowed" : "pointer",
                              opacity: acceptingId === c.connection_id ? 0.6 : 1,
                           }}
                        >
                           {acceptingId === c.connection_id ? "Accepting..." : "Accept"}
                        </button>
                     )}
                  </div>
               );
            })}
         </div>
      );
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
                              .join(" · ") || "Just getting started"}
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
                        Edit in Settings
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {currentUser.intent_status && (
            <div
               style={{
                  margin: "0 0 1.5rem",
                  padding: "0.85rem 1rem",
                  background: "rgba(231, 111, 81, 0.08)",
                  border: "1px solid rgba(231, 111, 81, 0.3)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontSize: "0.9rem",
                  color: "var(--dark)",
                  lineHeight: 1.4,
               }}
            >
               <span style={{ fontSize: "1rem", lineHeight: 1 }}>📍</span>
               <span style={{ flex: 1 }}>{currentUser.intent_status}</span>
            </div>
         )}

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
                  <div className="app-eyebrow" style={{ marginBottom: "0.75rem" }}>
                     My Network
                  </div>
                  {loadingConns ? (
                     <div style={{ fontSize: "0.85rem", color: "#888" }}>
                        Loading network...
                     </div>
                  ) : (
                     <>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                           <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#7a6f68" }}>
                              Awaiting Reply
                           </div>
                           <InfoTooltip
                              label="Awaiting Reply"
                              text="Requests you have sent that are waiting for the other person to accept."
                              width={220}
                           />
                        </div>
                        {renderConnectionList(awaitingReply, "No pending requests.")}

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", marginTop: "1rem" }}>
                           <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#7a6f68" }}>
                              Connectors
                           </div>
                           <InfoTooltip
                              label="Connectors"
                              text="People you know who can introduce you to their network. The more connectors you add, the more paths you'll find."
                              width={240}
                           />
                        </div>
                        {renderConnectionList(connectors, "You haven't added any connectors yet.")}

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", marginTop: "1rem" }}>
                           <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#7a6f68" }}>
                              New Connections
                           </div>
                           <InfoTooltip
                              label="New Connections"
                              text="People you have recently connected with, either directly or through an intro from a connector."
                              width={220}
                           />
                        </div>
                        {renderConnectionList(newConnections, "No intros completed yet.")}

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", marginBottom: showAddForm ? "1.5rem" : 0 }}>
                           <button
                              onClick={() => setShowAddForm(v => !v)}
                              style={{
                                 flex: 1,
                                 padding: "0.75rem",
                                 borderRadius: "8px",
                                 border: "1.5px dashed var(--border)",
                                 background: "rgba(216, 140, 154, 0.05)",
                                 color: "var(--warm)",
                                 fontSize: "0.85rem",
                                 fontWeight: 600,
                                 cursor: "pointer",
                                 transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.background = "rgba(216, 140, 154, 0.1)";
                                 e.currentTarget.style.borderColor = "var(--warm)";
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.background = "rgba(216, 140, 154, 0.05)";
                                 e.currentTarget.style.borderColor = "var(--border)";
                              }}
                           >
                              {showAddForm ? "Cancel" : "+ Add Connector"}
                           </button>
                           <InfoTooltip
                              label="What is a Connector?"
                              text="A Connector is someone you already know who can vouch for you and introduce you to a contact in their network. The more Connectors, the more warm paths WarmPath can find."
                              width={240}
                           />
                        </div>

                        {showAddForm && invitePeer && (
                           <div style={{ marginTop: "0.5rem" }}>
                              <InviteConnectorPanel peer={invitePeer} onDone={dismissInvite} />
                           </div>
                        )}

                        {showAddForm && !invitePeer && (
                           <div
                              style={{
                                 marginTop: "0.5rem",
                                 padding: "1.25rem",
                                 background: "#fff",
                                 border: "1px solid #e8ddd8",
                                 borderRadius: "8px",
                                 boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                              }}
                           >
                              <form onSubmit={handleAddConnector}>
                                 <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '0.3rem' }}>
                                       Name
                                    </label>
                                    <input
                                       type="text"
                                       value={newConn.name}
                                       onChange={(e) => setNewConn({ ...newConn, name: e.target.value })}
                                       placeholder="Alex Rivera"
                                       style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #d88c9a', background: '#f2e9e4', fontSize: '0.9rem' }}
                                    />
                                 </div>
                                 <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '0.3rem' }}>
                                       Email *
                                    </label>
                                    <input
                                       type="email"
                                       required
                                       value={newConn.email}
                                       onChange={(e) => setNewConn({ ...newConn, email: e.target.value })}
                                       placeholder="alex@example.com"
                                       style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #d88c9a', background: '#f2e9e4', fontSize: '0.9rem' }}
                                    />
                                 </div>
                                 <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '0.3rem' }}>
                                       Relationship Context *
                                       <InfoTooltip
                                          label="What goes in Relationship Context?"
                                          text="A short note on how you know this person — class, internship, club, mutual friend. We use it so the Connector remembers you when an intro request comes through."
                                          width={230}
                                       />
                                    </label>
                                    <input
                                       type="text"
                                       required
                                       value={newConn.relationship}
                                       onChange={(e) => setNewConn({ ...newConn, relationship: e.target.value })}
                                       placeholder="e.g. Worked together in CS 499"
                                       style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #d88c9a', background: '#f2e9e4', fontSize: '0.9rem' }}
                                    />
                                 </div>
                                 <button
                                    type="submit"
                                    disabled={savingConn}
                                    style={{
                                       width: '100%',
                                       padding: '0.7rem',
                                       borderRadius: '6px',
                                       border: 'none',
                                       background: 'var(--warm)',
                                       color: '#fff',
                                       fontWeight: 'bold',
                                       cursor: savingConn ? 'not-allowed' : 'pointer',
                                       opacity: savingConn ? 0.7 : 1
                                    }}
                                 >
                                    {savingConn ? "Saving..." : "Save Connector"}
                                 </button>
                              </form>
                           </div>
                        )}
                     </>
                  )}
               </div>

               {/* TODO: When "view other user profile" page is built, hide this card if
                   the viewed user's privacy_settings.discovery_mode is "hidden" or "anonymous". */}
               <div className="app-card">
                  <div
                     className="app-eyebrow"
                     style={{ marginBottom: "0.75rem" }}
                  >
                     Socials
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                     ) : null}

                     {currentUser.handshake_url ? (
                        <a
                           href={currentUser.handshake_url}
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
                           <img
                              src={handshakeIcon}
                              alt="Handshake"
                              style={{
                                 width: '24px',
                                 height: '24px',
                                 borderRadius: '4px',
                                 display: 'block',
                                 objectFit: 'cover',
                              }}
                           />
                           <span>
                              {[currentUser.first_name, currentUser.last_name]
                                 .filter(Boolean)
                                 .join(" ") || "View"}{" "}
                              on Handshake
                           </span>
                        </a>
                     ) : null}

                     {!currentUser.linkedin_url && !currentUser.handshake_url && (
                        <div>
                           <p
                              style={{
                                 fontSize: "0.85rem",
                                 color: "#7a6f68",
                                 fontStyle: "italic",
                                 marginBottom: "0.5rem"
                              }}
                           >
                              Boost your profile visibility by adding your professional socials!
                           </p>
                           <button
                              onClick={() => navigate("/settings")}
                              style={{
                                 background: "none",
                                 border: "none",
                                 color: "var(--warm)",
                                 fontSize: "0.82rem",
                                 fontWeight: 600,
                                 padding: 0,
                                 cursor: "pointer",
                                 textDecoration: "underline"
                              }}
                           >
                              Add Socials in Settings →
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
