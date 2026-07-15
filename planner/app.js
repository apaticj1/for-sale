import { Store } from './storage.js';
import { loadSettings, saveSettings, syncToKeston } from './sync.js';

const $ = (sel) => document.querySelector(sel);

let activeTaskFilter = 'all';

// --- Tab navigation -------------------------------------------------------

function switchView(name) {
    document.querySelectorAll('.view').forEach((v) => {
        v.hidden = v.dataset.view !== name;
    });
    document.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.view === name);
    });
}

document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
});

// --- Toast ------------------------------------------------------------

let toastTimer = null;
function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2500);
}

// --- Task form --------------------------------------------------------

$('#taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#taskTitle').value.trim();
    if (!title) return;
    Store.add({
        type: 'task',
        title,
        priority: $('#taskPriority').value,
        dueDate: $('#taskDue').value || null,
        project: $('#taskProject').value.trim(),
        status: 'todo',
    });
    e.target.reset();
    $('#taskPriority').value = 'medium';
});

$('#taskFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    activeTaskFilter = btn.dataset.filter;
    document.querySelectorAll('#taskFilters .filter-chip').forEach((c) => {
        c.classList.toggle('active', c === btn);
    });
    renderTasks();
});

// --- Idea form --------------------------------------------------------

$('#ideaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#ideaTitle').value.trim();
    if (!title) return;
    const tags = $('#ideaTags').value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    Store.add({
        type: 'idea',
        title,
        tags,
        status: 'new',
    });
    e.target.reset();
});

// --- Rendering: tasks ---------------------------------------------------

const PRIORITY_LABEL = { low: 'Nízká', medium: 'Střední', high: 'Vysoká' };
const TASK_STATUS_LABEL = { todo: 'K udělání', in_progress: 'Probíhá', done: 'Hotovo' };

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ');
}

function renderTasks() {
    const tasks = Store.all().filter((i) => i.type === 'task');
    const filtered = activeTaskFilter === 'all'
        ? tasks
        : tasks.filter((t) => t.status === activeTaskFilter);

    const list = $('#taskList');
    list.innerHTML = '';
    $('#taskEmpty').hidden = filtered.length > 0;

    filtered.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'item' + (task.status === 'done' ? ' done' : '');

        const check = document.createElement('button');
        check.className = 'item-checkbox' + (task.status === 'done' ? ' checked' : '');
        check.type = 'button';
        check.innerHTML = task.status === 'done' ? '✓' : '';
        check.title = 'Označit jako hotovo';
        check.addEventListener('click', () => {
            const next = task.status === 'done' ? 'todo' : 'done';
            Store.update(task.id, { status: next });
        });

        const body = document.createElement('div');
        body.className = 'item-body';

        const title = document.createElement('div');
        title.className = 'item-title';
        title.textContent = task.title;

        const meta = document.createElement('div');
        meta.className = 'item-meta';
        meta.appendChild(badge(TASK_STATUS_LABEL[task.status] || task.status));
        meta.appendChild(badge(PRIORITY_LABEL[task.priority] || task.priority, `priority-${task.priority}`));
        if (task.dueDate) meta.appendChild(badge('Do ' + formatDate(task.dueDate)));
        if (task.project) meta.appendChild(badge(task.project));
        if (!task.synced) meta.appendChild(badge('nesynchronizováno', 'unsynced'));

        body.append(title, meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const cycleBtn = iconButton('⟳', 'Přepnout stav', () => {
            const order = ['todo', 'in_progress', 'done'];
            const next = order[(order.indexOf(task.status) + 1) % order.length];
            Store.update(task.id, { status: next });
        });

        const delBtn = iconButton('🗑', 'Smazat', () => {
            Store.remove(task.id);
        }, true);

        actions.append(cycleBtn, delBtn);
        li.append(check, body, actions);
        list.appendChild(li);
    });
}

// --- Rendering: ideas ---------------------------------------------------

function renderIdeas() {
    const ideas = Store.all().filter((i) => i.type === 'idea' && i.status !== 'archived');
    const list = $('#ideaList');
    list.innerHTML = '';
    $('#ideaEmpty').hidden = ideas.length > 0;

    ideas.forEach((idea) => {
        const li = document.createElement('li');
        li.className = 'item';

        const body = document.createElement('div');
        body.className = 'item-body';

        const title = document.createElement('div');
        title.className = 'item-title';
        title.textContent = idea.title;

        const meta = document.createElement('div');
        meta.className = 'item-meta';
        meta.appendChild(badge(formatDate(idea.createdAt)));
        (idea.tags || []).forEach((t) => meta.appendChild(badge('#' + t)));
        if (idea.status === 'promoted') meta.appendChild(badge('přeměněno na úkol', 'unsynced'));
        if (!idea.synced) meta.appendChild(badge('nesynchronizováno', 'unsynced'));

        body.append(title, meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        if (idea.status !== 'promoted') {
            const promoteBtn = iconButton('→✓', 'Přeměnit na úkol', () => {
                Store.add({
                    type: 'task',
                    title: idea.title,
                    tags: idea.tags,
                    status: 'todo',
                    notes: `Vzniklo z nápadu (${formatDate(idea.createdAt)}).`,
                });
                Store.update(idea.id, { status: 'promoted' });
                toast('Nápad přeměněn na úkol.');
                switchView('tasks');
            });
            actions.appendChild(promoteBtn);
        }

        const delBtn = iconButton('🗑', 'Smazat', () => {
            Store.remove(idea.id);
        }, true);

        actions.appendChild(delBtn);
        li.append(body, actions);
        list.appendChild(li);
    });
}

function badge(text, extraClass) {
    const span = document.createElement('span');
    span.className = 'badge' + (extraClass ? ' ' + extraClass : '');
    span.textContent = text;
    return span;
}

function iconButton(symbol, label, onClick, danger) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn' + (danger ? ' delete' : '');
    btn.title = label;
    btn.textContent = symbol;
    btn.addEventListener('click', onClick);
    return btn;
}

// --- Settings / sync ------------------------------------------------

function renderSettings() {
    const s = loadSettings();
    $('#settingsEndpoint').value = s.endpoint || '';
    $('#settingsApiKey').value = s.apiKey || '';
    updateSyncStatus(s);
}

function updateSyncStatus(s) {
    const dot = $('#syncDot');
    const status = $('#syncStatus');
    dot.classList.remove('ok', 'error');
    if (!s.lastSyncAt) {
        status.textContent = 'Zatím nesynchronizováno.';
        return;
    }
    const when = new Date(s.lastSyncAt).toLocaleString('cs-CZ');
    if (s.lastSyncOk) {
        dot.classList.add('ok');
        status.textContent = `Naposledy synchronizováno: ${when}`;
    } else {
        dot.classList.add('error');
        status.textContent = `Poslední synchronizace selhala: ${when}`;
    }
}

$('#settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = loadSettings();
    s.endpoint = $('#settingsEndpoint').value.trim();
    s.apiKey = $('#settingsApiKey').value.trim();
    saveSettings(s);
    toast('Nastavení uloženo.');
});

$('#syncNowBtn').addEventListener('click', async () => {
    const s = loadSettings();
    const items = Store.all();
    try {
        const result = await syncToKeston(items, s);
        const syncedIds = Array.isArray(result?.acceptedIds) ? result.acceptedIds : items.map((i) => i.id);
        Store.markSynced(syncedIds);
        s.lastSyncAt = new Date().toISOString();
        s.lastSyncOk = true;
        saveSettings(s);
        toast('Synchronizace proběhla úspěšně.');
    } catch (err) {
        s.lastSyncAt = new Date().toISOString();
        s.lastSyncOk = false;
        saveSettings(s);
        toast(err.message || 'Synchronizace selhala.');
    }
    updateSyncStatus(s);
});

// --- Export / Import / Clear -----------------------------------------

$('#exportBtn').addEventListener('click', () => {
    const data = JSON.stringify({ exportedAt: new Date().toISOString(), items: Store.all() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keston-planner-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

$('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : parsed.items;
        if (!Array.isArray(items)) throw new Error('Neplatný formát souboru.');
        Store.replaceAll(items);
        toast(`Importováno ${items.length} položek.`);
    } catch (err) {
        toast('Import se nezdařil: ' + err.message);
    } finally {
        e.target.value = '';
    }
});

$('#clearAllBtn').addEventListener('click', () => {
    if (!confirm('Opravdu smazat všechna data z tohoto zařízení? Tuto akci nelze vrátit zpět.')) return;
    Store.replaceAll([]);
    toast('Všechna data smazána.');
});

// --- Boot ---------------------------------------------------------------

Store.subscribe(() => {
    renderTasks();
    renderIdeas();
});

renderTasks();
renderIdeas();
renderSettings();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
