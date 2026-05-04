import React from 'react';

export default function FAQ() {
  const sections = [
    {
      title: "Network & Degrees",
      questions: [
        {
          q: "What is a 'Warm Path'?",
          a: "A warm path is a connection to a target person through a mutual contact (the Connector). Instead of cold-emailing, you leverage your existing network to get a warm introduction."
        },
        {
          q: "What does 'Connections of Connections' mean?",
          a: "This refers to your 2nd-degree network. It includes anyone who is directly connected to one of your existing connections."
        }
      ]
    },
    {
      title: "Privacy & Discovery",
      questions: [
        {
          q: "How does Anonymous Discovery work?",
          a: "If you set your Discovery Mode to 'Anonymous', other users will only see your first name and the first letter of your last name. Your profile picture will also be hidden until you or a connector approves an introduction. This prevents people from bypassing WarmPath to find you on LinkedIn."
        },
        {
          q: "Can I hide myself completely?",
          a: "Yes. Setting your Discovery Mode to 'Hidden' will remove you from all search results and path discovery."
        }
      ]
    },
    {
      title: "Platform Etiquette",
      questions: [
        {
          q: "How should I write my intro request?",
          a: "Be brief and specific. Use the 'Note to Connector' to explain why you want the intro, and write a professional 'Message for Target' that the connector can easily forward. The easier you make it for the connector, the more likely they are to help."
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
