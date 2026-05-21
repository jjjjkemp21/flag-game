import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AudioProvider } from './audio/AudioProvider';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './auth/AuthProvider';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <AudioProvider>
            <ToastProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ToastProvider>
        </AudioProvider>
    </React.StrictMode>
);
