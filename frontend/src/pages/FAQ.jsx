import React from 'react';

export default function FAQ() {
  const sections = [
    {
      title: "How It Works",
      questions: [
        {
          q: "What is a warm path?",
          a: "A warm path is a route to someone you want to meet, through a mutual connection. Instead of cold-emailing, you ask the mutual to make a warm introduction."
        },
        {
          q: "What's a connector?",
          a: "Your connector is the mutual contact in the middle of a warm path — the person you both know, who can forward your intro request."
        },
        {
          q: "What's a contact?",
          a: "Your contact is the person at the end of the path — the one you actually want to meet."
        },
        {
          q: "What does 'Friends of friends' mean?",
          a: "Anyone connected to one of your direct connections. Also called your 2nd-degree network."
        }
      ]
    },
    {
      title: "Warm Score",
      questions: [
        {
          q: "What is a Warm Score?",
          a: "Warm Score is our AI estimate of how relevant a path is to what you're looking for, based on your connector's relationship to your contact and the contact's background. More flames means a stronger predicted match."
        }
      ]
    },
    {
      title: "Privacy & Discovery",
      questions: [
        {
          q: "What's the difference between Visible, Anonymous, and Hidden?",
          a: "Visible: your full name and photo show in search and path discovery results. Anonymous: only your first name and the first letter of your last name show, and your photo is hidden until you approve an intro — this keeps people from bypassing WarmPath to find you on LinkedIn. Hidden: you're removed from search and path discovery entirely."
        },
        {
          q: "Who can request an intro from me?",
          a: "You control this in Settings. The default is Friends of friends — anyone within two degrees of you. You can also limit it to direct connections only, open it to anyone, or pause requests entirely."
        }
      ]
    },
    {
      title: "Etiquette",
      questions: [
        {
          q: "How should I write my intro request?",
          a: "Be brief and specific. Use the note to your connector to explain why you want the intro, and write a short message to your contact that the connector can easily forward. The easier you make it for the connector, the more likely they are to help."
        }
      ]
    }
  ];

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Frequently Asked Questions —</div>
      <h1 className="app-page-title">How WarmPath Works</h1>
      <p className="app-page-sub">Learn about our network philosophy and privacy controls.</p>

      {sections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--dark)', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            {section.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {section.questions.map((item, qIdx) => (
              <div key={qIdx}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                  {item.q}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#7a6f68', lineHeight: '1.6' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: '4rem', padding: '2rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '2px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--mid)' }}>
          Still have questions? Contact support at <strong>support@warmpath.com</strong>
        </p>
      </div>
    </div>
  );
}
