-- Database Schema per la Gestione Eventi e Password Config

-- 1. Tabella delle impostazioni di sistema (Opzione Raccomandata)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
);

-- Inserimento o aggiornamento della password di eliminazione evento (Seed: opera2019)
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('event_delete_password', 'opera2019')
ON CONFLICT(setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- 2. Tabella Eventi
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    delete_password VARCHAR(255) DEFAULT 'opera2019'
);

-- Inserimento evento di prova
INSERT INTO events (id, title, date, delete_password)
VALUES ('evt-001', 'Opera 2019 Event', '2019-10-15', 'opera2019')
ON CONFLICT(id) DO NOTHING;

-- 3. Tabella Log Partite
CREATE TABLE IF NOT EXISTS event_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id VARCHAR(50) NOT NULL,
    log_type VARCHAR(20) NOT NULL, -- '(inizio)' o '(fine)'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
