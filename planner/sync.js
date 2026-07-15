// Napojení na KESTON OS task manager. Dokud KESTON OS API neexistuje,
// appka funguje čistě lokálně - toto je jen tenká vrstva navíc.

const SETTINGS_KEY = 'keston-planner:settings:v1';

const DEFAULT_SETTINGS = {
    endpoint: '',
    apiKey: '',
    lastSyncAt: null,
    lastSyncOk: null,
};

export function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Odešle položky do KESTON OS. Očekává se JSON endpoint, který přijme
// { source, items } a vrátí seznam id úspěšně přijatých položek, viz README.md.
export async function syncToKeston(items, settings) {
    if (!settings.endpoint) {
        throw new Error('Není nastavená adresa KESTON OS API.');
    }

    const res = await fetch(settings.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
        },
        body: JSON.stringify({ source: 'keston-planner', items }),
    });

    if (!res.ok) {
        throw new Error(`Synchronizace selhala (HTTP ${res.status}).`);
    }

    return res.json().catch(() => ({}));
}
