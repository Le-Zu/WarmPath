import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { logoBase64 } from "../assets/logo.js";
import NotificationBell from "./NotificationBell.jsx";
import UserSwitcher from "./UserSwitcher.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

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
   const { currentUser } = useAuth();
   const isDevAccount = currentUser?.email?.endsWith(DEV_EMAIL_DOMAIN) ?? false;
   const isTestAccount =
      currentUser?.email?.endsWith(TEST_EMAIL_DOMAIN) ?? false;

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
   const menuRef = useRef(null);
   useEffect(() => {
      if (!menuOpen) return;
      const onClick = (e) => {
         if (menuRef.current && !menuRef.current.contains(e.target))
            setMenuOpen(false);
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
   }, [menuOpen]);

   const handleLogout = async () => {
      setMenuOpen(false);
      await signOut(auth);
      navigate("/login");
   };

   const initials = (() => {
      const name = currentUser?.displayName?.trim();
      if (name) {
         const parts = name.split(/\s+/);
         return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
      }
      return currentUser?.email?.[0]?.toUpperCase() ?? "?";
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

            <div
               style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2rem",
               }}
            >
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
                     }}
                  >
                     {initials}
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
                           zIndex: 50,
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
