import { useState } from "react";
import {
   createUserWithEmailAndPassword,
   signInWithPopup,
   GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import apiUrl from "../apiConfig";

export default function RegisterPage() {
   const navigate = useNavigate();
   const [form, setForm] = useState({ email: "", password: "", confirm: "" });
   const [backendMessage, setbackendMessage] = useState("");
   const [hovered, setHovered] = useState(false);
   const [hovered2, setHovered2] = useState(false);
   const [hovered3, setHovered3] = useState(false);

   const handleChange = (e) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const handleGoogleSignIn = async () => {
      setbackendMessage("");
      try {
         const provider = new GoogleAuthProvider();
         const userCredential = await signInWithPopup(auth, provider);
         const token = await userCredential.user.getIdToken();

         const res = await fetch(`${apiUrl}/api/users`, {
            method: "POST",
            headers: {
               Authorization: `Bearer ${token}`,
               "Content-Type": "application/json",
            },
         });

         if (res.ok) {
            setbackendMessage("Registration successful! Redirecting...");
            setTimeout(() => navigate("/onboarding"), 1500);
         } else {
            const errorData = await res.json();
            setbackendMessage(
               `Backend sync failed: ${errorData.message || res.statusText}`,
            );
         }
      } catch (err) {
         console.error("Google sign-in error", err);
         setbackendMessage(`Google sign-in failed: ${err.message}`);
      }
   };

   const handleRegister = async (e) => {
      e.preventDefault();
      setbackendMessage("");

      if (form.password !== form.confirm) {
         setbackendMessage("Passwords don't match.");
         return;
      }

      if (
         form.email.endsWith("@dev.warmpath.com") ||
         form.email.endsWith("@warmpath.com") ||
         form.email.endsWith("@test.warmpath.com") ||
         form.email.endsWith("@localhost") ||
         form.email.endsWith("@warmpath.io") ||
         form.email.endsWith("@warmpath.org") ||
         form.email.endsWith("@warmpath.net") ||
         form.email.endsWith("@warmpath.tech")
      ) {
         // add more email domains here if needed
         console.log("This email domain is not available for registration.");
         setbackendMessage(
            "This email domain is not available for registration.",
         );
         return;
      }

      try {
         const userCredential = await createUserWithEmailAndPassword(
            auth,
            form.email,
            form.password,
         );
         const user = userCredential.user;
         const token = await user.getIdToken();

         const res = await fetch(`${apiUrl}/api/users`, {
            method: "POST",
            headers: {
               Authorization: `Bearer ${token}`,
               "Content-Type": "application/json",
            },
         });

         if (res.ok) {
            setbackendMessage("Registration successful! Redirecting...");
            setTimeout(() => navigate("/onboarding"), 1500);
         } else {
            const errorData = await res.json();
            setbackendMessage(
               `Backend sync failed: ${errorData.message || res.statusText}`,
            );
         }
      } catch (err) {
         console.error("Register error", err);
         let message = `Register failed: ${err.message}`;
         if (err.code === "auth/email-already-in-use")
            message = "This email is already registered.";
         if (err.code === "auth/weak-password")
            message = "Password should be at least 6 characters.";
         setbackendMessage(message);
      }
   };

   return (
      <div
         style={{
            background: "#f2e9e4",
            padding: "20px",
            color: "#386641",
            fontFamily: "sans-serif",
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
               minHeight: "calc(100vh - 110px)",
            }}
         >
            <div
               style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "360px",
                  gap: "10px",
                  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
                  padding: "45px 25px",
                  borderRadius: "10px",
               }}
            >
               <h2 style={{ fontSize: "1.5rem" }}>Create account</h2>
               <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  onMouseEnter={() => setHovered3(true)}
                  onMouseLeave={() => setHovered3(false)}
                  style={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     gap: "10px",
                     backgroundColor: hovered3 ? "lightgray" : "#f2e9e4",
                     width: "100%",
                     padding: ".8rem 1rem",
                     borderRadius: "100px",
                     border: "1px solid",
                     fontSize: "1rem",
                     fontWeight: "bold",
                     marginTop: ".8rem",
                     cursor: "pointer",
                     transition: "background-color 0.1s",
                  }}
               >
                  <img
                     src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                     alt="Google"
                     style={{ height: "20px" }}
                  />
                  Continue with Google
               </button>

               <div
                  style={{
                     display: "flex",
                     alignItems: "center",
                     gap: "10px",
                     margin: "8px",
                  }}
               >
                  <hr style={{ flex: 1, borderColor: "lightgray" }} />
                  <span style={{ fontSize: "0.9rem", color: "#386641" }}>or</span>
                  <hr style={{ flex: 1, borderColor: "lightgray" }} />
               </div>

               <form
                  onSubmit={handleRegister}
                  style={{
                     display: "flex",
                     flexDirection: "column",
                     gap: "10px",
                  }}
               >
                  <input
                     name="email"
                     type="email"
                     placeholder="Email"
                     value={form.email}
                     onChange={handleChange}
                     required
                     autoComplete="email"
                     style={{
                        backgroundColor: "#f2e9e4",
                        width: "100%",
                        marginTop: "10px",
                        padding: "1rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid",
                        fontSize: "1rem",
                     }}
                  />

                  <input
                     name="password"
                     type="password"
                     placeholder="Password (at least 6 characters)"
                     value={form.password}
                     onChange={handleChange}
                     required
                     autoComplete="new-password"
                     style={{
                        backgroundColor: "#f2e9e4",
                        width: "100%",
                        marginTop: "10px",
                        padding: "1rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid",
                        fontSize: "1rem",
                     }}
                  />

                  <input
                     name="confirm"
                     type="password"
                     placeholder="Confirm password"
                     value={form.confirm}
                     onChange={handleChange}
                     required
                     autoComplete="new-password"
                     style={{
                        backgroundColor: "#f2e9e4",
                        width: "100%",
                        marginTop: "10px",
                        padding: "1rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid",
                        fontSize: "1rem",
                     }}
                  />

                  {backendMessage && (
                     <p
                        style={{
                           color: "Tomato",
                           fontSize: "0.875rem",
                           marginTop: "4px",
                        }}
                     >
                        {backendMessage}
                     </p>
                  )}

                  <button
                     type="submit"
                     onMouseEnter={() => setHovered(true)}
                     onMouseLeave={() => setHovered(false)}
                     style={{
                        backgroundColor: hovered ? "#e8825a" : "LightSalmon",
                        width: "100%",
                        padding: "1rem 1rem",
                        borderRadius: "100px",
                        border: "1px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginTop: ".8rem",
                        cursor: "pointer",
                        transition: "background-color 0.1s",
                     }}
                  >
                     Create account
                  </button>

                  <button
                     type="button"
                     onClick={() => navigate("/login")}
                     onMouseEnter={() => setHovered2(true)}
                     onMouseLeave={() => setHovered2(false)}
                     style={{
                        backgroundColor: hovered2 ? "#ecc6b5" : "#f2e9e4",
                        width: "100%",
                        padding: "1rem 1rem",
                        borderRadius: "100px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginTop: ".8rem",
                        border: "1px solid",
                        borderColor: "Tomato",
                        color: "Tomato",
                        cursor: "pointer",
                        transition: "background-color 0.1s",
                     }}
                  >
                     Sign in instead
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}
