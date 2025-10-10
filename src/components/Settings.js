import React from 'react';
import './Settings.css';

function Settings({ theme, setTheme, strictSpelling, setStrictSpelling, onResetStats, setView }) {
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="settings-box">
            <button className="back-button" onClick={() => setView('menu')}>←</button>
            <h2>Settings</h2>
            <div className="settings-options">
                <div className="setting-item">
                    <label htmlFor="theme-toggle">Dark Mode</label>
                    <label className="switch">
                        <input
                            id="theme-toggle"
                            type="checkbox"
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div className="setting-item">
                    <label htmlFor="spelling-toggle">Strict Spelling</label>
                    <label className="switch">
                        <input
                            id="spelling-toggle"
                            type="checkbox"
                            checked={strictSpelling}
                            onChange={() => setStrictSpelling(prev => !prev)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
            <button onClick={onResetStats} className="reset-button">
                Reset All Progress
            </button>
        </div>
    );
}

export default Settings;