import { useState } from 'react';
import './OnboardingFlow.css';

const TOTAL_STEPS = 4;

function StepDots({ current }) {
  return (
    <div className="ob-dots">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className={`ob-dot${i === current ? ' active' : ''}`} />
      ))}
    </div>
  );
}

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    linkedin: '',
    connectors: [{ name: '', relationship: '' }],
    interests: '',
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setConnector = (index, field) => (e) =>
    setForm((f) => {
      const connectors = [...f.connectors];
      connectors[index] = { ...connectors[index], [field]: e.target.value };
      return { ...f, connectors };
    });

  const addConnector = () =>
    setForm((f) => ({
      ...f,
      connectors: [...f.connectors, { name: '', relationship: '' }],
    }));

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const canProceedFromStep0 =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && passwordValid;

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="ob-wrapper">
      <div className="ob-card">
        <StepDots current={step} />

        {step === 0 && (
          <>
            <h1 className="ob-heading">Create Your Account</h1>
            <p className="ob-subtext">
              Tell us a bit about yourself to get started.
            </p>

            <div className="ob-field">
              <label className="ob-label">First Name</label>
              <input
                className="ob-input"
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                placeholder="Jane"
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">Last Name</label>
              <input
                className="ob-input"
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                placeholder="Doe"
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">Email</label>
              <input
                className="ob-input"
                type="text"
                value={form.email}
                onChange={set('email')}
                placeholder="jane@example.com"
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">Password</label>
              <input
                className="ob-input"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
              {form.password.length > 0 && (
                <ul className="ob-pw-rules">
                  <li className={passwordChecks.length ? 'pass' : ''}>At least 8 characters</li>
                  <li className={passwordChecks.upper ? 'pass' : ''}>One uppercase letter</li>
                  <li className={passwordChecks.lower ? 'pass' : ''}>One lowercase letter</li>
                  <li className={passwordChecks.number ? 'pass' : ''}>One number</li>
                  <li className={passwordChecks.special ? 'pass' : ''}>One special character</li>
                </ul>
              )}
            </div>

            <div className="ob-actions">
              <button
                className="ob-btn-primary"
                onClick={next}
                disabled={!canProceedFromStep0}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="ob-heading">LinkedIn Profile</h1>
            <p className="ob-subtext">
              Optionally link your LinkedIn so we can help you connect faster.
            </p>

            <div className="ob-field">
              <label className="ob-label">LinkedIn Profile URL</label>
              <input
                className="ob-input"
                type="text"
                value={form.linkedin}
                onChange={set('linkedin')}
                placeholder="https://linkedin.com/in/janedoe"
              />
              <p className="ob-helper">This is optional — you can skip it.</p>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ob-btn-primary" onClick={next}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="ob-heading">Connectors &amp; Interests</h1>
            <p className="ob-subtext">
              Add people you'd like to connect through and share your interests.
            </p>

            <h2 className="ob-section-label">Connectors</h2>
            {form.connectors.map((c, i) => (
              <div className="ob-connector-group" key={i}>
                <div className="ob-field">
                  <label className="ob-label">Connector Name</label>
                  <input
                    className="ob-input"
                    type="text"
                    value={c.name}
                    onChange={setConnector(i, 'name')}
                    placeholder="Alex Rivera"
                  />
                </div>
                <div className="ob-field">
                  <label className="ob-label">Relationship Context</label>
                  <input
                    className="ob-input"
                    type="text"
                    value={c.relationship}
                    onChange={setConnector(i, 'relationship')}
                    placeholder="Worked together in CS 499"
                  />
                </div>
              </div>
            ))}
            <button className="ob-add-btn" onClick={addConnector}>
              + Add another connector
            </button>

            <h2 className="ob-section-label">Interests &amp; Experience</h2>
            <div className="ob-field">
              <label className="ob-label">
                Tell us about your interests and experience
              </label>
              <textarea
                className="ob-textarea"
                value={form.interests}
                onChange={set('interests')}
                placeholder="I'm interested in machine learning, startups, and mentoring..."
              />
            </div>

            <div className="ob-actions">
              <button className="ob-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ob-btn-primary" onClick={next}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="ob-complete">
            <h1 className="ob-heading">Onboarding Complete</h1>
            <p className="ob-subtext">
              You're all set! Your warm path awaits.
            </p>
            <button className="ob-btn-primary">Get Started</button>
          </div>
        )}
      </div>
    </div>
  );
}
