// ====================================================
// DevDrill Auto-Updater Service
// Seamless, instant differential updates for Desktop & Web
// ====================================================

export const CURRENT_VERSION = '1.0.0';

// Configurable manifest endpoint pointing to your GitHub repository
export const DEFAULT_MANIFEST_URL = 'https://raw.githubusercontent.com/che4goud/offcode/master/releases/version.json';

/**
 * Compare two semver strings (e.g. '1.0.1' vs '1.0.0')
 * Returns true if candidate > current
 */
export function isNewerVersion(current, candidate) {
    if (!candidate) return false;
    const cleanCur = String(current).replace(/^v/, '').split('.').map(Number);
    const cleanCand = String(candidate).replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const c = cleanCur[i] || 0;
        const n = cleanCand[i] || 0;
        if (n > c) return true;
        if (n < c) return false;
    }
    return false;
}

/**
 * Check if a new version is available.
 * Silently handles offline state.
 */
export async function checkForUpdate(customUrl = null) {
    const url = customUrl || localStorage.getItem('devdrill_update_url') || DEFAULT_MANIFEST_URL;

    try {
        // 1. Check via Neutralino native updater if in Desktop mode
        if (typeof window !== 'undefined' && window.Neutralino?.updater) {
            try {
                const updateInfo = await window.Neutralino.updater.checkForUpdates(url);
                if (updateInfo && updateInfo.version) {
                    const hasUpdate = isNewerVersion(CURRENT_VERSION, updateInfo.version);
                    return {
                        hasUpdate,
                        currentVersion: CURRENT_VERSION,
                        latestVersion: updateInfo.version,
                        releaseNotes: updateInfo.data?.notes || 'Performance enhancements and problem updates.',
                        resourcesURL: updateInfo.resourcesURL || '',
                        isDesktop: true,
                    };
                }
            } catch (neuErr) {
                // If neutralino native updater encounters CORS or network error, fallback to standard fetch
                console.debug('[Updater] Neutralino updater check fallback:', neuErr);
            }
        }

        // 2. Standard HTTP check (works for both Desktop WebView2 and Browser Web)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return { hasUpdate: false, currentVersion: CURRENT_VERSION };
        }

        const data = await response.json();
        const latestVersion = data.version || data.tag_name || '1.0.0';
        const hasUpdate = isNewerVersion(CURRENT_VERSION, latestVersion);

        return {
            hasUpdate,
            currentVersion: CURRENT_VERSION,
            latestVersion,
            releaseNotes: data.notes || data.body || 'Latest algorithmic features and optimizations.',
            resourcesURL: data.resourcesURL || '',
            isDesktop: typeof window !== 'undefined' && Boolean(window.NL_PORT),
        };
    } catch {
        // Device is offline or endpoint unreachable - fail silently
        return {
            hasUpdate: false,
            currentVersion: CURRENT_VERSION,
            isOffline: true,
        };
    }
}

/**
 * Perform one-click installation and restart.
 */
export async function installUpdate(updateInfo, onProgress = null) {
    if (typeof window !== 'undefined' && window.Neutralino?.updater) {
        if (onProgress) onProgress('Downloading update package (resources.neu)...');
        await window.Neutralino.updater.install();
        
        if (onProgress) onProgress('Finalizing and restarting DevDrill...');
        setTimeout(async () => {
            await window.Neutralino.app.restartProcess();
        }, 800);
        return true;
    } else {
        // In Web/PWA mode: trigger cache reload
        if (onProgress) onProgress('Reloading application cache...');
        setTimeout(() => {
            window.location.reload();
        }, 500);
        return true;
    }
}
