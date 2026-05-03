import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
   const navigate = useNavigate();
   const [hovered, setHovered] = useState(false);

   const handleLogout = async () => {
      try {
         await signOut(auth);
         navigate("/logintest");
      } catch (err) {
         console.error("Logout error:", err);
      }
   };

   return (
      <button
         type="button"
         onClick={handleLogout}
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
         style={{
            backgroundColor: hovered ? "#ecc6b5" : "#f2e9e4",
            padding: "1rem 1rem",
            borderRadius: "100px",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "1px solid",
            borderColor: "Tomato",
            color: "Tomato",
            cursor: "pointer",
            transition: "background-color 0.1s",
         }}
      >
         Sign out
      </button>
   );
}
