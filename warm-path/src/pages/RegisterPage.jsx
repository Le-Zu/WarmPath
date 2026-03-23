import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RegisterPage() {
   const navigate = useNavigate();
   const [form, setForm] = useState({ email: "", password: "", confirm: "" });
   const [backendMessage, setbackendMessage] = useState("");
   const [hovered, setHovered] = useState(false);
   const [hovered2, setHovered2] = useState(false);

   const handleChange = (e) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const handleRegister = async (e) => {
      e.preventDefault();
      setbackendMessage("");

      if (form.password !== form.confirm) {
         setbackendMessage("Passwords don't match.");
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
         //navigate("/profile"); //For later
      } catch (err) {
         console.error("Register error", err);
         setbackendMessage(`Register failed: ${err.message}`);
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
                     onClick={() => navigate("/logintest")}
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
