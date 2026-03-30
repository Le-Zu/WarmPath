import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";

export default function ProfilePage() {
   const [user, setUser] = useState(null);

   useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
         setUser(firebaseUser || null);
      });
      return () => unsubscribe();
   }, []);

   return (
      <div
         style={{
            background: "#f2e9e4",
            padding: "20px",
            color: "#386641",
            fontFamily: "sans-serif",
            minHeight: "100vh",
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

         <div>
            <div>
               <h2>Profile</h2>
               <p>
                  Logged in as <strong>{user?.email}</strong>
               </p>
               <LogoutButton />
            </div>
         </div>
      </div>
   );
}
