// Datová vrstva - localStorage. Schéma položky je navržené tak, aby šlo
// 1:1 poslat do KESTON OS task manageru (viz README.md v této složce).

const STORAGE_KEY = 'keston-planner:items:v1';

function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function loadItems() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const Store = {
    items: loadItems(),
    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    notify() {
        this.listeners.forEach((fn) => fn(this.items));
    },

    save() {
        persistItems(this.items);
        this.notify();
    },

    all() {
        return this.items;
    },

    add(partial) {
        const now = new Date().toISOString();
        const item = {
            id: uid(),
            type: 'task', // 'task' | 'idea'
            title: '',
            notes: '',
            status: 'todo', // task: todo|in_progress|done | idea: new|considering|promoted|archived
            priority: 'medium', // low|medium|high
            tags: [],
            dueDate: null,
            project: '',
            createdAt: now,
            updatedAt: now,
            synced: false,
            ...partial,
        };
        this.items.unshift(item);
        this.save();
        return item;
    },

    update(id, patch) {
        const idx = this.items.findIndex((i) => i.id === id);
        if (idx === -1) return null;
        this.items[idx] = {
            ...this.items[idx],
            ...patch,
            updatedAt: new Date().toISOString(),
            synced: false,
        };
        this.save();
        return this.items[idx];
    },

    remove(id) {
        this.items = this.items.filter((i) => i.id !== id);
        this.save();
    },

    replaceAll(items) {
        this.items = items;
        this.save();
    },

    markSynced(ids) {
        const set = new Set(ids);
        this.items = this.items.map((i) => (set.has(i.id) ? { ...i, synced: true } : i));
        this.save();
    },
};
