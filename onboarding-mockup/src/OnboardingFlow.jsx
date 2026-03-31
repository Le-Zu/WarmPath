import { useState } from 'react';
import './OnboardingFlow.css';

const TOTAL_STEPS = 5;

const UNIVERSITY_MAP = {
  'nyu.edu': 'New York University',
  'columbia.edu': 'Columbia University',
  'cornell.edu': 'Cornell University',
  'harvard.edu': 'Harvard University',
  'mit.edu': 'MIT',
  'stanford.edu': 'Stanford University',
  'yale.edu': 'Yale University',
  'princeton.edu': 'Princeton University',
  'upenn.edu': 'University of Pennsylvania',
  'brown.edu': 'Brown University',
  'dartmouth.edu': 'Dartmouth College',
  'cuny.edu': 'CUNY',
  'macaulay.cuny.edu': 'Macaulay Honors College, CUNY',
  'myhunter.cuny.edu': 'Hunter College, CUNY',
  'baruch.cuny.edu': 'Baruch College, CUNY',
  'rutgers.edu': 'Rutgers University',
  'stonybrook.edu': 'Stony Brook University',
  'bu.edu': 'Boston University',
  'umich.edu': 'University of Michigan',
  'berkeley.edu': 'UC Berkeley',
  'ucla.edu': 'UCLA',
  'gatech.edu': 'Georgia Tech',
  'cmu.edu': 'Carnegie Mellon University',
};

const GOAL_TAGS = ['Internship', 'Research', 'Study Group', 'Club', 'Mentorship', 'Side Project'];
const FIELD_TAGS = [
  'Computer Science', 'Business', 'Engineering', 'Design',
  'Pre-Med', 'Biology', 'Mathematics', 'Economics',
  'Psychology', 'Communications',
];

function getUniversityName(email) {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return null;
  const domain = email.slice(atIndex + 1).toLowerCase().trim();
  if (!domain.endsWith('.edu')) return null;

  // Try full domain first, then progressively shorter
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (UNIVERSITY_MAP[candidate]) return UNIVERSITY_MAP[candidate];
  }

  // Fallback: capitalize the first part of the domain
  const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return name;
}

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
    verificationCode: '',
    selectedGoals: [],
    selectedFields: [],
    otherInfo: '',
    connectors: [{ name: '', relationship: '' }],
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleTag = (field, tag) =>
    setForm((f) => {
      const current = f[field];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...f, [field]: next };
    });

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

  const emailIsEdu =
    form.email.trim() !== '' && /\.edu$/i.test(form.email.trim());

  const universityName = emailIsEdu ? getUniversityName(form.email.trim()) : null;

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const canProceedFromStep0 =
    form.firstName.trim() && form.lastName.trim() && emailIsEdu && passwordValid;

  const codeCorrect = form.verificationCode === '123456';
  const codeAttempted = form.verificationCode.length === 6 && !codeCorrect;

  const hasInterests = form.selectedGoals.length > 0 || form.selectedFields.length > 0;

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="ob-wrapper">
      <div className="ob-card">
        <StepDots current={step} />

        {/* Step 0: Create Account */}
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
              <label className="ob-label">College / University Email</label>
              <input
                className={`ob-input${form.email.trim() && !emailIsEdu ? ' ob-input-error' : ''}`}
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jane@university.edu"
              />
              {form.email.trim() && !emailIsEdu && (
                <p className="ob-error">Please enter a valid .edu email address</p>
              )}
              {universityName && (
                <p className="ob-university-detect">
                  It looks like you're at <strong>{universityName}</strong>
                </p>
              )}
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

        {/* Step 1: Email Verification */}
        {step === 1 && (
          <>
            <h1 className="ob-heading">Verify Your Email</h1>
            <p className="ob-subtext">
              We sent a 6-digit verification code to{' '}
              <strong>{form.email}</strong>. Enter it below to continue.
            </p>

            <div className="ob-field">
              <label className="ob-label">Verification Code</label>
              <input
                className={`ob-input ob-code-input${codeAttempted ? ' ob-input-error' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.verificationCode}
                onChange={set('verificationCode')}
                placeholder="123456"
              />
              {codeAttempted && (
                <p className="ob-error">Incorrect code. Please try again.</p>
              )}
              {codeCorrect && (
                <p className="ob-success">Email verified!</p>
              )}
            </div>

            <div className="ob-actions">
              <button className="ob-btn-ghost" onClick={back}>
                Back
              </button>
              <button
                className="ob-btn-primary"
                onClick={next}
                disabled={!codeCorrect}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <>
            <h1 className="ob-heading">Your Interests</h1>
            <p className="ob-subtext">
              Help us understand what you're looking for so we can find the right connections.
            </p>

            <h2 className="ob-section-label">What are you looking for?</h2>
            <div className="ob-tag-grid">
              {GOAL_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`ob-tag${form.selectedGoals.includes(tag) ? ' selected' : ''}`}
                  onClick={() => toggleTag('selectedGoals', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <h2 className="ob-section-label">What's your field?</h2>
            <div className="ob-tag-grid">
              {FIELD_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`ob-tag${form.selectedFields.includes(tag) ? ' selected' : ''}`}
                  onClick={() => toggleTag('selectedFields', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="ob-field" style={{ marginTop: '1.25rem' }}>
              <label className="ob-label">Anything else you'd like us to know?</label>
              <textarea
                className="ob-textarea"
                value={form.otherInfo}
                onChange={set('otherInfo')}
                placeholder="Optional — tell us more about yourself..."
                rows={3}
              />
            </div>

            <div className="ob-actions">
              <button className="ob-btn-ghost" onClick={back}>
                Back
              </button>
              <button
                className="ob-btn-primary"
                onClick={next}
                disabled={!hasInterests}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 3: Connectors (skippable) */}
        {step === 3 && (
          <>
            <h1 className="ob-heading">Add Connectors</h1>
            <p className="ob-subtext">
              Connectors are people you already know who can introduce you to others.
              You can always add connectors later from your profile.
            </p>

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

            <div className="ob-actions">
              <button className="ob-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ob-btn-ghost" onClick={next}>
                Skip for now
              </button>
              <button className="ob-btn-primary" onClick={next}>
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 4: Welcome */}
        {step === 4 && (
          <div className="ob-complete">
            <h1 className="ob-heading">You're All Set!</h1>
            <p className="ob-subtext">
              Your first warm path is one connection away.
            </p>
            <button className="ob-btn-primary">Get Started</button>
          </div>
        )}
      </div>
    </div>
  );
}
