import React, { useState } from 'react';
import Icon from './Icon';
import { Button } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';

const SECURITY_QUESTIONS = [
    'What was the name of your first pet?',
    'What city were you born in?',
    'What was your childhood nickname?',
    'What is your favorite movie?',
    'What was the make of your first car?',
    'What is your favorite food?',
];

function Field({ label, type, ...props }) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (show ? 'text' : 'password') : type;
    return (
        <label className="auth-field">
            <span className="auth-field__label">{label}</span>
            {isPassword ? (
                <div className="auth-field__wrap">
                    <input className="auth-field__input" type={inputType} {...props} />
                    <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                    >
                        <Icon name={show ? 'visibility_off' : 'visibility'} />
                    </button>
                </div>
            ) : (
                <input className="auth-field__input" type={type} {...props} />
            )}
        </label>
    );
}

function AuthScreen({ setView, onAuthed }) {
    const { login, register } = useAuth();
    const toast = useToast();
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
    const [busy, setBusy] = useState(false);

    // shared
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // register
    const [q1, setQ1] = useState(SECURITY_QUESTIONS[0]);
    const [a1, setA1] = useState('');
    const [q2, setQ2] = useState(SECURITY_QUESTIONS[1]);
    const [a2, setA2] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState(null);

    // forgot
    const [forgotStep, setForgotStep] = useState('username'); // username | verify | reset
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [useCode, setUseCode] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');
    const [resetToken, setResetToken] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    const finishAuthed = async () => {
        await onAuthed?.();
        setView('menu');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await login(username.trim(), password);
            toast.success('Welcome back!');
            await finishAuthed();
        } catch (err) {
            toast.danger(err.message || 'Login failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (q1 === q2) {
            toast.danger('Please choose two different security questions.');
            return;
        }
        setBusy(true);
        try {
            const { recoveryCodes: codes } = await register({
                username: username.trim(),
                password,
                securityQuestions: [
                    { question: q1, answer: a1 },
                    { question: q2, answer: a2 },
                ],
            });
            setRecoveryCodes(codes);
        } catch (err) {
            toast.danger(err.message || 'Could not create account.');
        } finally {
            setBusy(false);
        }
    };

    const handleForgotLookup = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { questions: qs } = await api.post('/auth/forgot/lookup', { username: username.trim() });
            setQuestions(qs);
            setForgotStep('verify');
        } catch (err) {
            toast.danger(err.message || 'Could not find that account.');
        } finally {
            setBusy(false);
        }
    };

    const handleForgotVerify = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = useCode
                ? { username: username.trim(), recoveryCode }
                : { username: username.trim(), answers: questions.map((q) => ({ id: q.id, answer: answers[q.id] || '' })) };
            const { resetToken: rt } = await api.post('/auth/forgot/verify', payload);
            setResetToken(rt);
            setForgotStep('reset');
        } catch (err) {
            toast.danger(err.message || 'Verification failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post('/auth/reset', { resetToken, newPassword });
            toast.success('Password updated. Please log in.');
            setPassword('');
            setMode('login');
            setForgotStep('username');
        } catch (err) {
            toast.danger(err.message || 'Could not reset password.');
        } finally {
            setBusy(false);
        }
    };

    // One-time recovery codes screen after registering.
    if (recoveryCodes) {
        return (
            <div className="auth-box">
                <h2 className="text-center">Save your recovery codes</h2>
                <p className="auth-hint">
                    If you forget your password and your security answers, these one-time codes are the only
                    other way back into your account. Store them somewhere safe — they won't be shown again.
                </p>
                <div className="recovery-codes">
                    {recoveryCodes.map((c) => (
                        <code key={c} className="recovery-code">{c}</code>
                    ))}
                </div>
                <Button
                    variant="primary"
                    fullWidth
                    icon="check"
                    onClick={() => { navigator.clipboard?.writeText(recoveryCodes.join('\n')); toast.success('Copied to clipboard'); }}
                >
                    Copy codes
                </Button>
                <Button variant="success" fullWidth icon="rocket_launch" onClick={finishAuthed}>
                    I've saved them — continue
                </Button>
            </div>
        );
    }

    return (
        <div className="auth-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            {mode !== 'forgot' && (
                <div className="auth-tabs" role="tablist">
                    <button
                        role="tab"
                        className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
                        onClick={() => setMode('login')}
                    >
                        Log in
                    </button>
                    <button
                        role="tab"
                        className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
                        onClick={() => setMode('register')}
                    >
                        Sign up
                    </button>
                </div>
            )}

            {mode === 'login' && (
                <form className="auth-form" onSubmit={handleLogin}>
                    <Field label="Username" value={username} autoComplete="username"
                        onChange={(e) => setUsername(e.target.value)} required />
                    <Field label="Password" type="password" value={password} autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" variant="primary" fullWidth disabled={busy} icon="login">
                        {busy ? 'Logging in…' : 'Log in'}
                    </Button>
                    <button type="button" className="auth-link" onClick={() => { setMode('forgot'); setForgotStep('username'); }}>
                        Forgot password?
                    </button>
                </form>
            )}

            {mode === 'register' && (
                <form className="auth-form" onSubmit={handleRegister}>
                    <Field label="Username (3-20 letters, numbers, _)" value={username} autoComplete="username"
                        onChange={(e) => setUsername(e.target.value)} required />
                    <Field label="Password (min 6 characters)" type="password" value={password} autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)} required />

                    <p className="auth-hint">Pick two security questions — they let you recover your account without email.</p>

                    <label className="auth-field">
                        <span className="auth-field__label">Security question 1</span>
                        <select className="auth-field__input" value={q1} onChange={(e) => setQ1(e.target.value)}>
                            {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </label>
                    <Field label="Answer 1" value={a1} onChange={(e) => setA1(e.target.value)} required />

                    <label className="auth-field">
                        <span className="auth-field__label">Security question 2</span>
                        <select className="auth-field__input" value={q2} onChange={(e) => setQ2(e.target.value)}>
                            {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </label>
                    <Field label="Answer 2" value={a2} onChange={(e) => setA2(e.target.value)} required />

                    <Button type="submit" variant="success" fullWidth disabled={busy} icon="person_add">
                        {busy ? 'Creating…' : 'Create account'}
                    </Button>
                </form>
            )}

            {mode === 'forgot' && (
                <div className="auth-form">
                    <h2 className="text-center">Recover account</h2>

                    {forgotStep === 'username' && (
                        <form className="auth-form" onSubmit={handleForgotLookup}>
                            <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <Button type="submit" variant="primary" fullWidth disabled={busy} icon="search">
                                {busy ? 'Looking…' : 'Continue'}
                            </Button>
                            <button type="button" className="auth-link" onClick={() => setMode('login')}>Back to log in</button>
                        </form>
                    )}

                    {forgotStep === 'verify' && (
                        <form className="auth-form" onSubmit={handleForgotVerify}>
                            {!useCode ? (
                                <>
                                    {questions.map((q) => (
                                        <Field
                                            key={q.id}
                                            label={q.question}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                            required
                                        />
                                    ))}
                                    <button type="button" className="auth-link" onClick={() => setUseCode(true)}>
                                        Use a recovery code instead
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Field label="Recovery code (e.g. A1B2-C3D4)" value={recoveryCode}
                                        onChange={(e) => setRecoveryCode(e.target.value)} required />
                                    <button type="button" className="auth-link" onClick={() => setUseCode(false)}>
                                        Answer security questions instead
                                    </button>
                                </>
                            )}
                            <Button type="submit" variant="primary" fullWidth disabled={busy} icon="key">
                                {busy ? 'Verifying…' : 'Verify'}
                            </Button>
                        </form>
                    )}

                    {forgotStep === 'reset' && (
                        <form className="auth-form" onSubmit={handleReset}>
                            <Field label="New password (min 6 characters)" type="password" value={newPassword}
                                autoComplete="new-password" onChange={(e) => setNewPassword(e.target.value)} required />
                            <Button type="submit" variant="success" fullWidth disabled={busy} icon="lock_reset">
                                {busy ? 'Saving…' : 'Set new password'}
                            </Button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

export default AuthScreen;
