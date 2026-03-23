import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

export default function LoginTest() {
   const navigate = useNavigate();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [backendMessage, setbackendMessage] = useState("");
   const [hovered, setHovered] = useState(false);
   const [hovered2, setHovered2] = useState(false);

   const handleLoginAndFetch = async (e) => {
      e.preventDefault();
      setbackendMessage("Logging in...");
      try {
         // log the user into Firebase
         const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
         );
         const user = userCredential.user;
         setbackendMessage(`Logged in as ${user.email}`);

         // Request the secure ID token for this specific user
         //Calling this method automatically refreshes the token if it has expired
         const token = await user.getIdToken();
         setbackendMessage("Login successful. Sending token to backend...");

         // Dynamically sets the API URL based on the environment
         const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

         // Send the request to Express server
         const response = await fetch(`${apiUrl}/api/test-auth`, {
            method: "GET",
            headers: {
               Authorization: `Bearer ${token}`,
               "Content-Type": "application/json",
            },
         });

         // Read the backend's response
         const data = await response.json();
         setbackendMessage(`Backend says: ${JSON.stringify(data)}`);
      } catch (error) {
         console.error("Login error during auth or fetch:", error);
         setbackendMessage(`Login failed: ${error.message}`);
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
               <h2
                  style={{
                     fontSize: "1.5rem",
                  }}
               >
                  Sign in
               </h2>
               <form
                  onSubmit={handleLoginAndFetch}
                  style={{
                     display: "flex",
                     flexDirection: "column",
                     gap: "10px",
                  }}
               >
                  <input
                     type="email"
                     placeholder="Email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
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
                     type="password"
                     placeholder="Password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
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
                  <button
                     type="submit"
                     onMouseEnter={() => setHovered(true)}
                     onMouseLeave={() => setHovered(false)}
                     style={{
                        backgroundColor: hovered ? "#e8825a" : "LightSalmon",
                        width: "100%",
                        padding: "1rem 1rem",
                        borderRadius: "100px",
                        border: "1px  ",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginTop: ".8rem",
                        cursor: "pointer",
                        transition: "background-color 0.1s",
                     }}
                  >
                     Sign in
                  </button>
                  <button
                     type="button"
                     onClick={() => navigate("/register")}
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
                     Create new account
                  </button>
               </form>
               <div
                  style={{
                     marginTop: "20px",
                     padding: "10px",
                     backgroundColor: "#f0f0f0",
                     color: "#333",
                  }}
               >
                  <strong>Status:</strong> {backendMessage}
               </div>
            </div>
         </div>
      </div>
   );
}
