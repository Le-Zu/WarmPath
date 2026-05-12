import { useState, useEffect, useRef } from "react";
import "../index.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const intents = ["Internship", "Research", "Class Help", "Club", "Skill", "Coffee Chat"];

const features = [
   {
      num: "01",
      title: "Intent-First Discovery",
      desc: "Declare what you're looking for before you see anyone. No aimless browsing — every path is tied to a purpose.",
   },
   {
      num: "02",
      title: "Contextual Connections",
      desc: "Every connection comes with relationship context — how you know them, why it matters. No mystery links.",
   },
   {
      num: "03",
      title: "Path Discovery",
      desc: "See the exact chain from you to your target, with context at each hop and a warmth score for the path.",
   },
   {
      num: "04",
      title: "Private Intro Requests",
      desc: "Requests go only to your connector. The target never sees anything unless your connector approves it.",
   },
   {
      num: "05",
      title: "Connector Inbox",
      desc: "Connectors review, edit, or decline requests at their own pace. Full control, no pressure.",
   },
   {
      num: "06",
      title: "Coffee Chats",
      desc: "A warm group chat with you, your connector, and your contact. The connector breaks the ice, then steps back.",
   },
];

const steps = [
   {
      num: "01",
      title: "Declare your intent",
      desc: "Tell the platform what you need — internship, research, a club, a skill. No intent, no browsing.",
      img: "/visuals/step-01-visual.png",
   },
   {
      num: "02",
      title: "Discover your path",
      desc: "WarmPath maps who you know and who they know, surfacing paths with full relationship context.",
      img: "/visuals/step-02-visual.png",
   },
   {
      num: "03",
      title: "Request an intro",
      desc: "Send a request to your connector. We draft the message — you edit it. Private until approved.",
      img: "/visuals/step-03-visual.png",
   },
   {
      num: "04",
      title: "Have the conversation",
      desc: "A warm chat, a context pre-read, and a connector who makes the intro. Then the conversation is yours.",
      img: "/visuals/step-04-visual.png",
   },
];

export default function HomePage() {
   const navigate = useNavigate();

   useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
         if (user) {
            navigate("/home", { replace: true });
         }
      });

      return () => unsubscribe();
   }, [navigate]);

   const [activeIntent, setActiveIntent] = useState("Internship");

   return (
      <>
         <div className="hp-body">
            {/* NAV */}
            <nav className="hp-nav">
               <div className="hp-nav-logo">
                  <img src="/logo.png" alt="WarmPath" />
               </div>
               <ul>
                  <li>
                     <a href="#features">Features</a>
                  </li>
                  <li>
                     <a href="#how">How It Works</a>
                  </li>
                  <li>
                     <Link to="/register" className="hp-nav-cta">
                        Get Started
                     </Link>
                  </li>
               </ul>
            </nav>

            {/* INTENT BANNER */}
            <div className="hp-banner">
               <strong>What are you looking for?</strong>
               <div className="hp-pills">
                  {intents.map((intent) => (
                     <button
                        key={intent}
                        className={`hp-pill${activeIntent === intent ? " active" : ""}`}
                        onClick={() => setActiveIntent(intent)}
                     >
                        {intent}
                     </button>
                  ))}
               </div>
               <span style={{ fontSize: '0.78rem', color: '#7a6f68', fontStyle: 'italic' }}>
                  Sign up to start finding paths.
               </span>
            </div>

            {/* HERO */}
            <section className="hp-hero">
               <div className="hp-hero-left">
                  <p className="hp-eyebrow">
                     Warm Introductions, Not Cold Outreach
                  </p>
                  <h1 className="hp-h1">
                     Every door opens
                     <br />
                     through a <em>warm</em>
                     <br />
                     connection.
                  </h1>
                  <p className="hp-sub">
                     WarmPath maps the people you know, the people they know,
                     and finds you a trusted path to whoever you're trying to
                     reach — with context at every step.
                  </p>
                  <div className="hp-actions">
                     <Link to="/register" className="hp-btn-primary">
                        Start Your Path
                     </Link>
                     <button
                        className="hp-btn-ghost"
                        onClick={() =>
                           document
                              .getElementById("how")
                              .scrollIntoView({ behavior: "smooth" })
                        }
                     >
                        See how it works →
                     </button>
                  </div>
               </div>
               <div className="hp-hero-right">
                  <div className="hp-hero-bg" />
                  <div className="hp-path-card">
                     <p className="hp-path-label">
                        Path discovered · 2 degrees away
                     </p>
                     {[
                        {
                           dot: "You",
                           cls: "",
                           name: "You",
                           ctx: "Looking for a software internship at a fintech startup",
                           tag: "Intent declared",
                        },
                        {
                           dot: "MK",
                           cls: "connector",
                           name: "Maya Kim",
                           ctx: "You know her from CS 499 group project, Fall 2023",
                           tag: "Connector",
                        },
                        {
                           dot: "JL",
                           cls: "target",
                           name: "James Liu",
                           ctx: "SWE Intern at Stripe · Maya's former roommate",
                           tag: "Contact",
                        },
                     ].map((node, i) => (
                        <div key={i} className="hp-node">
                           <div className={`hp-node-dot ${node.cls}`}>
                              {node.dot}
                           </div>
                           <div className="hp-node-info">
                              <div className="hp-node-name">{node.name}</div>
                              <div className="hp-node-ctx">{node.ctx}</div>
                              <span className="hp-node-tag">{node.tag}</span>
                           </div>
                        </div>
                     ))}
                     <div className="hp-path-action">
                        <div className="hp-warmth">
                           <span>Warm Score</span>
                           <div className="hp-warmth-dots">
                              {[1, 2, 3, 4].map((dot) => (
                                 <span
                                    key={dot}
                                    className={dot <= 3 ? "active" : ""}
                                 />
                              ))}
                           </div>
                        </div>
                        <button className="hp-req-btn">Request Intro</button>
                     </div>
                  </div>
               </div>
            </section>

            {/* FEATURES */}
            <section className="hp-features" id="features">
               <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div className="hp-sec-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                     <h2>
                        Built for <em>intentional</em> networking
                     </h2>
                     <p style={{ margin: '0' }}>
                        No cold browsing. No spam. Every connection is contextual,
                        every intro is earned.
                     </p>
                  </div>

                  <div className="hp-features-grid">
                     {features.map((f, i) => (
                        <div key={i} className="hp-feature-item">
                           <div className="hp-feature-num">{f.num}</div>
                           <div className="hp-feature-title">{f.title}</div>
                           <p className="hp-feature-desc">{f.desc}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="hp-how" id="how">
               <div className="hp-how-inner">
                  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                     <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        How <em>WarmPath</em> works
                     </h2>
                     <div className="hp-steps">
                        {steps.map((s, i) => (
                           <div key={i} className="hp-step">
                              <div className="hp-step-img-wrap">
                                 <img src={s.img} alt={`Step ${s.num}`} className="hp-step-img" />
                              </div>
                              <div className="hp-step-num">{s.num}</div>
                              <div className="hp-step-title">{s.title}</div>
                              <p className="hp-step-desc">{s.desc}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* CTA */}
            <section className="hp-cta">
               <div className="hp-cta-decor hp-cta-decor-1" />
               <div className="hp-cta-decor hp-cta-decor-2" />
               <div className="hp-cta-decor hp-cta-decor-3" />
               
               <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <h2>
                     Your next
                     <br />
                     <em>opportunity</em>
                     <br />
                     is one intro away.
                  </h2>
                  <p style={{ marginBottom: '2rem' }}>
                     Join WarmPath and start finding paths that actually lead
                     somewhere.
                  </p>
                  <Link
                     to="/register"
                     className="hp-btn-primary"
                     style={{ fontSize: "1rem", padding: "1rem 2.5rem" }}
                  >
                     Get Early Access
                  </Link>
               </div>
            </section>

            {/* FOOTER */}
            <footer className="hp-footer">
               <img src="/logo.png" alt="WarmPath" />
               <span>© 2026 WarmPath. Built for real connections.</span>
            </footer>
         </div>
      </>
   );
}
