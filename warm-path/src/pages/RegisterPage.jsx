import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RegisterPage() {
   const navigate = useNavigate();
   const [form, setForm] = useState({ email: "", password: "", confirm: "" });
}
