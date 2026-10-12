import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            color: isOnline ? '#10b981' : '#60a5fa',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
            userSelect: 'none',
        }}>
            {isOnline ? <Wifi size={12} color="#10b981" /> : <WifiOff size={12} color="#60a5fa" />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>
    );
}
