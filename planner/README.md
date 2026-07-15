# Plánovač & nápady

To-do plánovač a zapisovač nápadů pro business. Statická PWA (žádný build krok,
žádný backend) - běží čistě v prohlížeči a data ukládá do `localStorage`.
Navržená tak, aby ji šlo později:

- nainstalovat na plochu / do dolní lišty telefonu (PWA, funguje offline),
- zabalit do iOS/Android appky (např. přes Capacitor - stačí obalit tuto
  statickou složku),
- napojit na task manager v **KESTON OS**.

## Spuštění lokálně

Je to čistě statický obsah, stačí ho servírovat přes libovolný HTTP server
(kvůli ES modulům a service workeru nejde otevřít přímo přes `file://`):

```bash
cd planner
python3 -m http.server 8080
# otevřít http://localhost:8080
```

## Datové schéma položky

Jedna položka (úkol i nápad sdílí stejný tvar) vypadá takto:

```json
{
  "id": "uuid",
  "type": "task | idea",
  "title": "string",
  "notes": "string",
  "status": "todo | in_progress | done  (úkoly)  /  new | considering | promoted | archived  (nápady)",
  "priority": "low | medium | high",
  "tags": ["string"],
  "dueDate": "YYYY-MM-DD | null",
  "project": "string",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime",
  "synced": true
}
```

Nápad, který uživatel "přemění na úkol", vytvoří novou položku typu `task`
a původní nápad dostane `status: "promoted"` (zůstává v historii).

## Napojení na KESTON OS

Nastavení → *Napojení na KESTON OS* umožňuje zadat:

- **endpoint** - URL vašeho KESTON OS API,
- **API klíč** - posílá se jako `Authorization: Bearer <klíč>`.

Tlačítko *Synchronizovat nyní* pošle `POST` na endpoint s tělem:

```json
{
  "source": "keston-planner",
  "items": [ /* pole položek dle schématu výše */ ]
}
```

Očekávaná odpověď (volitelně) - pokud KESTON OS vrátí seznam přijatých ID,
appka si je označí jako `synced: true`:

```json
{ "acceptedIds": ["uuid1", "uuid2"] }
```

Pokud endpoint zatím neexistuje, appka funguje dál čistě lokálně -
synchronizace jen zobrazí chybu a nic nerozbije.

Dokud KESTON OS API není hotové, lze data přenést i ručně přes
Nastavení → *Export/Import JSON* (tlačítko stáhne/nahraje soubor se stejným
schématem jako výše, jen zabalený v `{ "items": [...] }`).

## Struktura souborů

- `index.html` - rozložení (záložky Úkoly / Nápady / Nastavení)
- `style.css` - vzhled, mobile-first
- `storage.js` - ukládání do `localStorage`
- `sync.js` - nastavení a odesílání do KESTON OS
- `app.js` - vykreslování a interakce
- `manifest.webmanifest`, `sw.js`, `icons/` - PWA (instalovatelnost, offline)
