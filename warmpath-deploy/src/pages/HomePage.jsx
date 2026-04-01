import { useNavigate } from 'react-router-dom';
import { logoBase64 } from '../assets/logo.js';

export default function HomePage() {
  const nav = useNavigate();
  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--charcoal)", background: "var(--cream)" }}>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 2rem 4rem', display: 'flex', gap: '4rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: 40, height: 2, background: 'var(--warm)' }} />
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)', fontWeight: 500 }}>Warm Introductions, Not Cold Outreach</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.6rem,5vw,3.8rem)', fontWeight: 400, lineHeight: 1.1, color: 'var(--dark)', marginBottom: '1.5rem' }}>
            Every door opens<br />through a <em style={{ color: 'var(--warm)', fontStyle: 'italic' }}>warm</em><br />connection.
          </h1>
          <p style={{ fontSize: '1rem', color: '#7a6f68', lineHeight: 1.7, maxWidth: 480, marginBottom: '2.5rem', fontWeight: 300 }}>
            WarmPath maps the people you know, the people they know, and finds you a trusted path to whoever you're trying to reach — with context at every step.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.85rem 2rem' }} onClick={() => nav('/home')}>Start Your Path</button>
            <a href="#how-it-works" style={{ fontSize: '0.88rem', color: 'var(--dark)', textDecoration: 'none' }}>See how it works →</a>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 420 }}>
          <div className="app-card" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: '1.25rem' }}>Path Discovered · 2 Degrees Away</div>
            {[
              { dot: 'YOU', cls: 'you',       name: 'You',       sub: 'Looking for a software internship at a fintech startup', tag: 'Intent declared', tc: '#2e7d32', bg: '#e8f5e9' },
              { dot: 'MK',  cls: 'connector', name: 'Maya Kim',  sub: 'You know her from CS 499 group project, Fall 2023',      tag: 'Connector',      tc: '#1a56db', bg: '#e8f0fe' },
              { dot: 'JL',  cls: 'target',    name: 'James Liu', sub: "SWE Intern at Stripe · Maya's former roommate",          tag: 'Target',         tc: '#b05a00', bg: '#fff3e0' },
            ].map((n, i, arr) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className={"path-dot " + n.cls} style={{ flexShrink: 0 }}>{n.dot}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 2 }}>{n.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#7a6f68', marginBottom: 4 }}>{n.sub}</div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 500, padding: '2px 8px', borderRadius: 3, background: n.bg, color: n.tc }}>{n.tag}</span>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="path-connector-line" />}
              </div>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid #f0e8e4', margin: '1.25rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#7a6f68' }}>Warmth {'●●●●'}</span>
              <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={() => nav('/home')}>Request Intro</button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, textAlign: 'center', marginBottom: '0.5rem' }}>
          Built for <em style={{ color: 'var(--warm)', fontStyle: 'italic' }}>intentional</em> networking
        </h2>
        <p style={{ textAlign: 'center', color: '#7a6f68', fontSize: '0.9rem', marginBottom: '3rem' }}>No cold browsing. No spam. Every connection is contextual, every intro is earned.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--border)' }}>
          {[
            ['01','Intent-First Discovery',"Declare what you're looking for before you see anyone. No endless browsing — every path is tied to a purpose."],
            ['02','Contextual Connections','Every connection comes with relationship context — how you know them, why it matters. No mystery links.'],
            ['03','Path Discovery','See the exact chain from you to your target, with context at each hop and a warmth score for the path.'],
            ['04','Private Intro Requests',"Requests go only to your connector. The target never sees anything unless your connector approves it."],
            ['05','Connector Inbox','Connectors review, edit, or decline requests at their own pace. Full control, no pressure.'],
            ['06','Coffee Chats','A warm chat, a context pre-read, and a connector who makes the intro. Then the conversation is yours.'],
          ].map(([n,t,b],i) => (
            <div key={i} style={{ padding: '2rem', background: 'var(--white)', borderRight: i%3!==2?'1px solid var(--border)':'none', borderBottom: i<3?'1px solid var(--border)':'none' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--warm)', marginBottom: '0.75rem' }}>{n}</div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>{t}</div>
              <div style={{ fontSize: '0.82rem', color: '#7a6f68', lineHeight: 1.6 }}>{b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: 'var(--dark)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, textAlign: 'center', color: 'var(--cream)', marginBottom: '3rem' }}>
            How <em style={{ color: 'var(--warm-light)', fontStyle: 'italic' }}>WarmPath</em> works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              ['01','Declare your intent','Tell the platform what you need — internship, research, a club, a skill. No aimless browsing.'],
              ['02','Discover your path','WarmPath maps who you know and who they know, surfacing paths with full relationship context.'],
              ['03','Request an intro','Send a request to your connector. You craft the message — private until approved.'],
              ['04','Have the conversation','A warm chat, a context pre-read, and a connector who makes the intro. Then the conversation is yours.'],
            ].map(([n,t,b],i) => (
              <div key={i} style={{ padding: '0 2rem', borderRight: i<3?'1px solid rgba(255,255,255,0.1)':'none' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(242,233,228,0.4)', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>{n}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cream)', marginBottom: '0.5rem' }}>{t}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(242,233,228,0.6)', lineHeight: 1.6 }}>{b}</div>
                {i < 3 && <div style={{ fontSize: '1.2rem', color: 'var(--warm-light)', marginTop: '1rem' }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--dark)' }}>Your next</h2>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, fontStyle: 'italic', color: 'var(--warm)' }}>opportunity</h2>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--dark)', marginBottom: '1rem' }}>is one intro away.</h2>
        <p style={{ color: '#7a6f68', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Join WarmPath and start finding paths that actually lead somewhere.</p>
        <button className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }} onClick={() => nav('/home')}>Get Early Access</button>
        <div style={{ marginTop: '4rem', fontSize: '0.75rem', color: '#bbb' }}>© 2026 WarmPath. Built for real connections.</div>
      </section>
    </div>
  );
}
