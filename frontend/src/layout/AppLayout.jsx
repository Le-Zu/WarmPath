import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { logoBase64 } from "@/assets/logo";
import NotificationBell from "@/layout/NotificationBell";
import UserSwitcher from "@/layout/UserSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";

const DEV_EMAIL_DOMAIN = "@dev.warmpath.com";
const TEST_EMAIL_DOMAIN = "@test.warmpath.com";

// Maps display labels to the DB enum values used by the paths API
const INTENT_MAP = {
   Internship: "internship",
   Research: "research",
   "Class Help": "class",
   Club: "club",
   Skill: "skill",
};
const INTENT_LABELS = Object.keys(INTENT_MAP);

export default function AppLayout() {
   const navigate = useNavigate();
   const location = useLocation();
   const { currentUser: authUser } = useAuth();
   const { currentUser: dbUser } = useUser();
   const isDevAccount = authUser?.email?.endsWith(DEV_EMAIL_DOMAIN) ?? false;
   const isTestAccount =
      authUser?.email?.endsWith(TEST_EMAIL_DOMAIN) ?? false;

   // Derive the active intent from the URL so the filter bar stays in sync on
   // direct navigation (e.g. clicking the "Find Paths" nav link).
   // Only highlight a pill when actually on the paths page.
   const onPathsPage = location.pathname === "/paths";
   const currentIntentParam = new URLSearchParams(location.search).get(
      "intent",
   );
   const activeIntent = onPathsPage
      ? (INTENT_LABELS.find((l) => INTENT_MAP[l] === currentIntentParam) ??
        "Internship")
      : null;

   const [menuOpen, setMenuOpen] = useState(false);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const menuRef = useRef(null);
   const mobileMenuRef = useRef(null);

   useEffect(() => {
      if (!menuOpen) return;
      const onClick = (e) => {
         if (menuRef.current && !menuRef.current.contains(e.target))
            setMenuOpen(false);
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
   }, [menuOpen]);

   useEffect(() => {
      if (!mobileMenuOpen) return;
      const onClick = (e) => {
         const btn = document.getElementById("hamburger-button");
         if (btn && btn.contains(e.target)) return;
         if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
            setMobileMenuOpen(false);
         }
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
   }, [mobileMenuOpen]);

   const handleLogout = async () => {
      setMenuOpen(false);
      await signOut(auth);
      navigate("/login");
   };

   const initials = (() => {
      const user = dbUser || authUser;
      if (!user) return "?";
      
      const firstName = dbUser?.first_name || "";
      const lastName = dbUser?.last_name || "";
      const displayName = authUser?.displayName || "";

      if (firstName || lastName) {
         return ((firstName[0] || "") + (lastName[0] || "")).toUpperCase();
      }
      if (displayName) {
         const parts = displayName.trim().split(/\s+/);
         return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
      }
      return user.email?.[0]?.toUpperCase() ?? "?";
   })();

   const HIDE_INTENT_ROUTES = [
      "/chat",
      "/conversations",
      "/requests",
      "/my-requests",
   ];

   const hideIntentBar = HIDE_INTENT_ROUTES.some((route) =>
      location.pathname.startsWith(route),
   );

   return (
      <>
         {/* Cream top navbar */}
         <nav
            style={{
               position: "relative",
               background: "#f2e9e4",
               display: "flex",
               alignItems: "center",
               justifyContent: "space-between",
               padding: "0 2rem",
               height: "68px",
               borderBottom: "1px solid #e8ddd8",
               zIndex: 100,
            }}
         >
            <NavLink
               to="/home"
               style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
               }}
            >
               <img
                  src={logoBase64}
                  alt="WarmPath"
                  style={{ height: "46px", width: "auto" }}
               />
            </NavLink>

            <div className="app-nav-center-links">
               {[
                  ["Find Paths", "/paths"],
                  ["Inbox", "/requests"],
                  ["My Requests", "/my-requests"],
                  ["Chats", "/conversations"],
               ].map(([label, to]) => (
                  <NavLink
                     key={to}
                     to={to}
                     style={({ isActive }) => ({
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.85rem",
                        fontWeight: 400,
                        color: isActive ? "#e76f51" : "#5a5550",
                        textDecoration: "none",
                        letterSpacing: "0.01em",
                        transition: "color 0.15s",
                     })}
                  >
                     {label}
                  </NavLink>
               ))}
            </div>

            <div
               style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
               <NotificationBell light />
               {(isDevAccount || isTestAccount || import.meta.env.DEV) && (
                  <UserSwitcher light />
               )}
               <button
                  id="hamburger-button"
                  className="app-nav-hamburger"
                  onClick={() => setMobileMenuOpen((o) => !o)}
                  aria-label="Navigation menu"
                  aria-expanded={mobileMenuOpen}
               >
                  {mobileMenuOpen ? "✕" : "☰"}
               </button>
               <div ref={menuRef} style={{ position: "relative" }}>
                  <button
                     onClick={() => setMenuOpen((o) => !o)}
                     aria-label="Account menu"
                     aria-haspopup="menu"
                     aria-expanded={menuOpen}
                     style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#e76f51",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                        overflow: "hidden",
                        padding: 0
                     }}
                  >
                     {dbUser?.profile_picture_url ? (
                        <img 
                           src={dbUser.profile_picture_url} 
                           alt="Avatar" 
                           style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                     ) : (
                        initials
                     )}
                  </button>
                  {menuOpen && (
                     <div
                        role="menu"
                        style={{
                           position: "absolute",
                           right: 0,
                           top: "calc(100% + 8px)",
                           minWidth: "160px",
                           background: "#fff",
                           border: "1px solid #e8ddd8",
                           borderRadius: "6px",
                           boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                           padding: "0.35rem 0",
                           zIndex: 150,
                        }}
                     >
                        {[
                           [
                              "Profile",
                              () => {
                                 setMenuOpen(false);
                                 navigate("/profile");
                              },
                           ],
                           [
                              "Settings",
                              () => {
                                 setMenuOpen(false);
                                 navigate("/settings");
                              },
                           ],
                           [
                              "Help",
                              () => {
                                 setMenuOpen(false);
                                 navigate("/faq");
                              },
                           ],
                           ["Log Out", handleLogout],
                        ].map(([label, onClick]) => (
                           <button
                              key={label}
                              role="menuitem"
                              onClick={onClick}
                              style={{
                                 display: "block",
                                 width: "100%",
                                 textAlign: "left",
                                 padding: "0.55rem 1rem",
                                 background: "transparent",
                                 border: "none",
                                 cursor: "pointer",
                                 fontFamily: "var(--font-sans)",
                                 fontSize: "0.85rem",
                                 color: "#5a5550",
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.background = "#f7f1ee";
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.background =
                                    "transparent";
                              }}
                           >
                              {label}
                           </button>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </nav>
         {mobileMenuOpen && (
            <div className="app-nav-mobile-menu" ref={mobileMenuRef}>
               {[
                  ["Find Paths", "/paths"],
                  ["Inbox", "/requests"],
                  ["My Requests", "/my-requests"],
                  ["Chats", "/conversations"],
               ].map(([label, to]) => (
                  <NavLink
                     key={to}
                     to={to}
                     className={({ isActive }) =>
                        "app-nav-mobile-link" + (isActive ? " active" : "")
                     }
                     onClick={() => setMobileMenuOpen(false)}
                  >
                     {label}
                  </NavLink>
               ))}
            </div>
         )}
         {/* {!hideIntentBar && (
            <div
               style={{
                  background: "#386641",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  padding: "0 2rem",
                  height: "48px",
               }}
            >
               <span
                  style={{
                     color: "rgba(242,233,228,0.75)",
                     fontSize: "0.82rem",
                     fontFamily: "var(--font-sans)",
                     marginRight: "0.5rem",
                  }}
               >
                  What are you looking for?
               </span>
               {INTENT_LABELS.map((intent) => (
                  <button
                     key={intent}
                     onClick={() =>
                        navigate("/paths?intent=" + INTENT_MAP[intent])
                     }
                     style={{
                        background:
                           activeIntent === intent ? "#e76f51" : "transparent",
                        color:
                           activeIntent === intent
                              ? "#fff"
                              : "rgba(242,233,228,0.8)",
                        border: `1.5px solid ${activeIntent === intent ? "#e76f51" : "rgba(242,233,228,0.35)"}`,
                        borderRadius: "999px",
                        padding: "0.25rem 0.9rem",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-sans)",
                        fontWeight: activeIntent === intent ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                     }}
                  >
                     {intent}
                  </button>
               ))}
            </div>
         )} */}
         <Outlet />
      </>
   );
}
