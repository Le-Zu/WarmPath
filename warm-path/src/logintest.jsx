import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export default function LoginTest() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [backendMessage, setbackendMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setbackendMessage('Logging in...');
        try {
            // log the user into Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            setbackendMessage(`Logged in as ${user.email}`);

            // Request the secure ID token for this specific user
            //Calling this method automatically refreshes the token if it has expired
            const token = await user.getIdToken();
            setbackendMessage('Login successful. Sending token to backend...');

            // Send the request to Express server
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
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
        <div style = {{pading: '20px', fontFamily: 'Arial'}}>
            <h2>Login Test</h2>
            <form onSubmit={handleLoginAndFetchn} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit"> Log in & fetch data</button>
            </form>
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', color: '#333' }}>
                <strong>Status:</strong> {backendMessage}
            </div>
        </div>
    );
}
