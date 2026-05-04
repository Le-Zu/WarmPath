import { useNavigate } from 'react-router-dom';
import { logoBase64 } from '../assets/logo.js';
import { useState } from 'react';

const intents = ['Internship', 'Research', 'Class Help', 'Club', 'Skill'];

export default function HomePage() {
  const nav = useNavigate();
  const [activeIntent, setActiveIntent] = useState('Internship');

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>

      {/* Top nav */}
      <header className="nav-cream">
        <a href="/" className="nav-logo">
          <img src={logoBase64} alt="WarmPath" />
        </a>
        <div className="nav-links">
          <a href="#features" className="nav-link">FEATURES</a>
          <a href="#how"      className="nav-link">HOW IT WORKS</a>
        </div>
        <button className="nav-cta" onClick={() => nav('/home')}>GET STARTED</button>
      </header>

      {/* Intent bar */}
      <div className="intent-bar">
        <span className="intent-bar-label">What are you looking for?</span>
        {intents.map(intent => (
          <button
            key={intent}
            className={'intent-pill' + (activeIntent === intent ? ' active' : '')}
            onClick={() => setActiveIntent(intent)}
          >
            {intent}
          </button>
        ))}
      </div>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-left">
          <div className="landing-eyebrow">
            <div className="landing-eyebrow-line" />
            <span className="landing-eyebrow-text">WARM INTRODUCTIONS, NOT COLD OUTREACH</span>
          </div>
          <h1 className="landing-h1">
            Every door opens<br />through a <em>warm</em><br />connection.
          </h1>
          <p className="landing-p">
            WarmPath maps the people you know, the people they know, and finds you a trusted
            path to whoever you're trying to reach — with context at every step.
          </p>
          <div className="landing-cta">
            <button className="btn-primary" onClick={() => nav('/home')}>Start Your Path</button>
            <a href="#how" className="landing-cta-link">See how it works →</a>
          </div>
        </div>

        {/* Demo card */}
        <div className="landing-hero-right">
          <div className="demo-card">
            <div className="demo-label">PATH DISCOVERED · 2 DEGREES AWAY</div>
            {[
              { init: 'You', color: '#e76f51', name: 'You',        desc: 'Looking for a software internship at a fintech startup', tag: 'Intent declared', tagBg: '#fde8e4', tagColor: '#e76f51' },
              { init: 'MK',  color: '#386641', name: 'Maya Kim',   desc: 'You know her from CS 499 group project, Fall 2023',       tag: 'Connector',       tagBg: '#e8f5e9', tagColor: '#386641' },
              { init: 'JL',  color: '#f4a261', name: 'James Liu',  desc: "SWE Intern at Stripe · Maya's former roommate",           tag: 'Target',          tagBg: '#f5f5f5', tagColor: '#888'    },
            ].map((node, i, arr) => (
              <div key={i}>
                <div className="demo-node">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="demo-dot" style={{ background: node.color }}>{node.init}</div>
                    {i < arr.length - 1 && <div className="demo-line" />}
                  </div>
                  <div style={{ paddingTop: '0.25rem' }}>
                    <div className="demo-name">{node.name}</div>
                    <div className="demo-desc">{node.desc}</div>
                    <span className="demo-tag" style={{ background: node.tagBg, color: node.tagColor }}>{node.tag}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="demo-footer">
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Warmth <span style={{ color: '#e76f51' }}>●●●●</span>
              </div>
              <button className="btn-primary btn-sm" onClick={() => nav('/paths')}>Request Intro</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <h2 className="features-h2">Built for <em>intentional</em> networking</h2>
        <p className="features-sub">No cold browsing. No spam. Every connection is contextual, every intro is earned.</p>
        <div className="features-grid">
          {[
            { n: '01', title: 'Intent-First Discovery',   desc: "Declare what you're looking for before you see anyone. No endless browsing — every path is tied to a purpose." },
            { n: '02', title: 'Contextual Connections',   desc: "Every connection comes with relationship context — how you know them, why it matters. No mystery links."         },
            { n: '03', title: 'Path Discovery',           desc: "See the exact chain from you to your target, with context at each hop and a warmth score for the path."         },
            { n: '04', title: 'Private Intro Requests',   desc: "Requests go only to your connector. The target never sees anything unless your connector approves it."           },
            { n: '05', title: 'Connector Inbox',          desc: "Connectors review, edit, or decline requests at their own pace. Full control, no pressure."                      },
            { n: '06', title: 'Coffee Chats',             desc: "A warm chat, a context pre-read, and a connector who makes the intro. Then the conversation is yours."           },
          ].map((f, i) => (
            <div key={i} className="feature-cell" style={{
              borderRight:  i % 3 !== 2 ? '1px solid var(--faint)' : 'none',
              borderBottom: i < 3       ? '1px solid var(--faint)' : 'none',
            }}>
              <div className="feature-num">{f.n}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="how-section">
        <div className="how-inner">
          <h2 className="how-h2">How <em>WarmPath</em> works</h2>
          <div className="how-grid">
            {[
              { n: '01', title: 'Declare your intent',   desc: "Tell the platform what you need — internship, research, a club, a skill. No aimless browsing."                          },
              { n: '02', title: 'Discover your path',    desc: "WarmPath maps who you know and who they know, surfacing paths with full relationship context."                          },
              { n: '03', title: 'Request an intro',      desc: "Send a request to your connector. You draft the message — you edit it. Private until approved."                        },
              { n: '04', title: 'Have the conversation', desc: "A warm chat, a context pre-read, and a connector who makes the intro. Then the conversation is yours."                 },
            ].map((s, i) => (
              <div key={i} className="how-step">
                <div>
                  <div className="how-num">{s.n}</div>
                  <div className="how-title">{s.title}</div>
                  <div className="how-desc">{s.desc}</div>
                </div>
                {i < 3 && <div className="how-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-h2">Your next<br /><em>opportunity</em><br />is one intro away.</h2>
        <p className="cta-sub">Join WarmPath and start finding paths that actually lead somewhere.</p>
        <button className="btn-primary" onClick={() => nav('/home')}>Get Early Access</button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="footer-copy">© 2026 WarmPath. Built for real connections.</span>
        <img src={logoBase64} alt="WarmPath" style={{ height: '24px', opacity: 0.5 }} />
      </footer>
    </div>
  );
}
