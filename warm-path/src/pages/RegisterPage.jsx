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

      if (form.password !== form.confirm) {
         setbackendMessage("Passwords don't match.");
         return;
      }

      setbackendMessage("Creating account...");
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
         if (!res.ok) throw new Error("Failed to create user profile.");
         navigate("/profile");
      } catch (err) {
         console.error("Register error", err);
         setbackendMessage(`Register failed: ${err.message}`);
      }
   };

   return (
      <div>
         <form onSubmit={handleRegister}>
            <label>Email</label>
            <input
               name="email"
               type="email"
               value={form.email}
               placeholder="you@example.com"
               required
               autoComplete="email"
               onChange={handleChange}
            />

            <label>Password</label>
            <input
               name="password"
               type="password"
               value={form.password}
               placeholder="At least 6 characters"
               required
               autoComplete="new-password"
               onChange={handleChange}
            />

            <label> Confirm Password</label>
            <input
               name="confirm"
               type="password"
               value={form.confirm}
               placeholder="Repeat your password"
               required
               autoComplete="new-password"
               onChange={handleChange}
            />

            <button type="submit">Create account</button>
         </form>
      </div>
   );
}
