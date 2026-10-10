import { Context } from "hono";
import { CONSTANTS } from "../constants";
import utils from "../utils";

const DB_INIT_QUERIES = `
CREATE TABLE IF NOT EXISTS raw_mails (
    id INTEGER PRIMARY KEY,
    message_id TEXT,
    source TEXT,
    address TEXT,
    raw TEXT,
    raw_blob BLOB,
    metadata TEXT,
    is_unread INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_mails_address ON raw_mails(address);

CREATE INDEX IF NOT EXISTS idx_raw_mails_created_at ON raw_mails(created_at);

CREATE INDEX IF NOT EXISTS idx_raw_mails_message_id ON raw_mails(message_id);

CREATE TABLE IF NOT EXISTS address (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    password TEXT,
    source_meta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_address_name ON address(name);

CREATE INDEX IF NOT EXISTS idx_address_created_at ON address(created_at);

CREATE INDEX IF NOT EXISTS idx_address_updated_at ON address(updated_at);

CREATE INDEX IF NOT EXISTS idx_address_source_meta ON address(source_meta);

CREATE TABLE IF NOT EXISTS auto_reply_mails (
    id INTEGER PRIMARY KEY,
    source_prefix TEXT,
    name TEXT,
    address TEXT UNIQUE,
    subject TEXT,
    message TEXT,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_reply_mails_address ON auto_reply_mails(address);

CREATE TABLE IF NOT EXISTS address_sender (
    id INTEGER PRIMARY KEY,
    address TEXT UNIQUE,
    balance INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_address_sender_address ON address_sender(address);

CREATE TABLE IF NOT EXISTS sendbox (
    id INTEGER PRIMARY KEY,
    address TEXT,
    raw TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sendbox_address ON sendbox(address);
CREATE INDEX IF NOT EXISTS idx_sendbox_created_at ON sendbox(created_at);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    user_email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_email ON users(user_email);

CREATE TABLE IF NOT EXISTS users_address (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    address_id INTEGER UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_address_user_id ON users_address(user_id);

CREATE INDEX IF NOT EXISTS idx_users_address_address_id ON users_address(address_id);

CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    role_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

CREATE TABLE IF NOT EXISTS user_passkeys (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    passkey_name TEXT NOT NULL,
    passkey_id TEXT NOT NULL,
    passkey TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON user_passkeys(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_passkeys_user_id_passkey_id ON user_passkeys(user_id, passkey_id);

CREATE TABLE IF NOT EXISTS redeem_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    redeem_type TEXT NOT NULL,
    value TEXT NOT NULL,
    result TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    redeemed INTEGER NOT NULL DEFAULT 0 CHECK (redeemed IN (0, 1)),
    expires_at DATETIME NOT NULL,
    redeemed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redeem_codes_type ON redeem_codes(redeem_type);
`

const ensureSchema = async (c: Context<HonoCustomType>) => {
    const statements = DB_INIT_QUERIES.split(';').map(sql => sql.trim()).filter(Boolean);
    // Existing installations may have been imported without a version marker.
    // Create missing tables, then add historical columns before creating their indexes.
    await c.env.DB.batch(statements.filter(sql => sql.startsWith('CREATE TABLE'))
        .map(sql => c.env.DB.prepare(sql)));
    const additions: Record<string, Record<string, string>> = {
        address: { password: 'TEXT', source_meta: 'TEXT' },
        raw_mails: { metadata: 'TEXT', raw_blob: 'BLOB', is_unread: 'INTEGER' },
    };
    for (const [table, columns] of Object.entries(additions)) {
        const info = await c.env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
        const existing = new Set(info.results.map(column => column.name));
        for (const [column, type] of Object.entries(columns)) {
            if (!existing.has(column)) {
                await c.env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
            }
        }
    }
    await c.env.DB.batch(statements.filter(sql => !sql.startsWith('CREATE TABLE'))
        .map(sql => c.env.DB.prepare(sql)));
    // Write the marker only after every schema operation succeeded.
    await utils.saveSetting(c, CONSTANTS.DB_VERSION_KEY, CONSTANTS.DB_VERSION);
};

export default {
    initialize: async (c: Context<HonoCustomType>) => {
        await ensureSchema(c);
        return c.json({ success: true, message: "Database initialized" });
    },
    migrate: async (c: Context<HonoCustomType>) => {
        await ensureSchema(c);
        return c.json({ success: true, message: "Database migrated" });
    },
    getVersion: async (c: Context<HonoCustomType>) => {
        const tables = await c.env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('settings', 'address', 'raw_mails', 'users')"
        ).all<{ name: string }>();
        const version = tables.results.some(table => table.name === 'settings')
            ? await utils.getSetting(c, CONSTANTS.DB_VERSION_KEY) : null;
        const sizeResult = await c.env.DB.prepare("SELECT 1").run();
        return c.json({
            need_initialization: tables.results.length === 0,
            need_migration: tables.results.length > 0 && version !== CONSTANTS.DB_VERSION,
            current_db_version: version,
            code_db_version: CONSTANTS.DB_VERSION,
            database_size: sizeResult.meta.size_after ?? null
        });
    },
}
