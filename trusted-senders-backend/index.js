// index.js (Complete Updated File)

require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// --- Database Setup ---
const db = new sqlite3.Database("./trusted_senders.db", (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// --- Table Creation ---

// Modified trusted_senders table to include 'trusted_name'
db.run(
  `
  CREATE TABLE IF NOT EXISTS trusted_senders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    trusted_email TEXT NOT NULL,
    trusted_name TEXT DEFAULT '',  -- Added column for sender name
    UNIQUE(user_email, trusted_email) -- Added UNIQUE constraint to prevent duplicates
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating/checking trusted_senders table:", err.message);
    } else {
      console.log("Trusted senders table is ready.");
    }
  }
);

// email_sender_status table remains the same structure
db.run(
  `
  CREATE TABLE IF NOT EXISTS email_sender_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    email_id TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
      status IN (
        'confirmed',
        'denied',
        'added_to_trusted',
        'removed_from_trusted',
        'reported_phishing',
        'trusted_once'
      )
    ),
    UNIQUE(user_email, email_id)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating email sender status table:", err.message);
    } else {
      console.log("Email sender status table is ready.");
    }
  }
);


// --- API Endpoints ---

/**
 * @route POST /add-trusted
 * @description Adds a sender email and optionally their name to the trusted list for a user.
 * @body { user_email: string, trusted_email: string, trusted_name?: string }
 */
app.post("/add-trusted", (req, res) => {
  const { user_email, trusted_email, trusted_name } = req.body;

  if (!user_email || !trusted_email) {
    return res.status(400).json({ error: "Missing user_email or trusted_email" });
  }

  const nameToStore = trusted_name || '';
  console.log(`Attempting to add trusted sender: User='${user_email}', Email='${trusted_email}', Name='${nameToStore}'`);

  const sql = `
    INSERT INTO trusted_senders (user_email, trusted_email, trusted_name)
    VALUES (?, ?, ?)
    ON CONFLICT(user_email, trusted_email) DO UPDATE SET
      trusted_name = excluded.trusted_name
    `;

  db.run(sql, [user_email, trusted_email, nameToStore], function (err) {
    if (err) {
      console.error(`DB Error adding/updating trusted sender for '${user_email}':`, err.message);
      return res.status(500).json({ error: "Failed to add trusted sender." });
    }
    if (this.changes > 0) {
        console.log(`Trusted sender added/updated for '${user_email}'. ID: ${this.lastID}, Changes: ${this.changes}`);
        res.status(201).json({ message: "Trusted sender added or updated!", id: this.lastID });
    } else {
        console.log(`Trusted sender '${trusted_email}' already exists for '${user_email}'. No change made.`);
        res.status(200).json({ message: "Trusted sender already exists."});
    }
  });
});

/**
 * @route POST /remove-trusted
 * @description Removes a sender email from the trusted list for a user.
 * @body { user_email: string, trusted_email: string }
 */
app.post("/remove-trusted", (req, res) => {
  const { user_email, trusted_email } = req.body;
  if (!user_email || !trusted_email) {
    return res.status(400).json({ error: "Missing user_email or trusted_email" });
  }
  console.log(`Attempting to remove trusted sender: User='${user_email}', Email='${trusted_email}'`);

  const sql = `DELETE FROM trusted_senders WHERE user_email = ? AND trusted_email = ?`;

  db.run(sql, [user_email, trusted_email], function (err) {
    if (err) {
       console.error(`DB Error removing trusted sender for '${user_email}':`, err.message);
      return res.status(500).json({ error: "Failed to remove trusted sender." });
    }
    if (this.changes === 0) {
      console.log(`Trusted sender '${trusted_email}' not found for '${user_email}' during removal.`);
      return res.status(404).json({ message: "Trusted sender not found." });
    }
    console.log(`Trusted sender removed for '${user_email}'. Changes: ${this.changes}`);
    res.json({ message: "Trusted sender removed!" });
  });
});

/**
 * @route GET /trusted-senders/:user_email
 * @description Retrieves the list of trusted senders (name and address) for a user.
 * @param {string} user_email - The email address of the user.
 * @returns { trusted_senders: Array<{ name: string, address: string }> }
 */
app.get("/trusted-senders/:user_email", (req, res) => {
  const user_email = req.params.user_email;
  const sql = `SELECT trusted_email, trusted_name FROM trusted_senders WHERE user_email = ? ORDER BY trusted_name, trusted_email`;
  console.log(`Fetching trusted senders for: ${user_email}`);

  db.all(sql, [user_email], (err, rows) => {
    if (err) {
      console.error(`DB Error fetching trusted senders for ${user_email}:`, err.message);
      return res.status(500).json({ error: "Failed to retrieve trusted senders." });
    }
    const trustedSendersList = rows.map((row) => ({
      name: row.trusted_name || '',
      address: row.trusted_email
    }));
    console.log(`Returning ${trustedSendersList.length} trusted senders for ${user_email}`);
    res.json({ trusted_senders: trustedSendersList });
  });
});

/**
 * @route GET /email-status/:user_email/:email_id
 * @description Retrieves the status recorded for a specific email for a user.
 * @param {string} user_email - The email address of the user.
 * @param {string} email_id - The unique ID of the email.
 * @returns { sender_email: string, status: string } or { status: null } if not found
 */
app.get("/email-status/:user_email/:email_id", (req, res) => {
  const { user_email, email_id } = req.params;
  const sql = `SELECT sender_email, status FROM email_sender_status WHERE user_email = ? AND email_id = ?`;

  db.get(sql, [user_email, email_id], (err, row) => {
    if (err) {
      console.error(`DB Error fetching email status for user '${user_email}', email '${email_id}':`, err.message);
      return res.status(500).json({ error: "Failed to retrieve email status." });
    }
    res.json(row || { status: null });
  });
});

/**
 * @route POST /update-email-status
 * @description Adds or updates the status for a specific email for a user.
 * @body { user_email: string, email_id: string, sender_email: string, status: string }
 */
app.post("/update-email-status", (req, res) => {
  const { user_email, email_id, sender_email, status } = req.body;
  if (!user_email || !email_id || !sender_email || !status) {
    return res.status(400).json({ error: "Missing required fields (user_email, email_id, sender_email, status)." });
  }

  const validStatuses = ['confirmed', 'denied', 'added_to_trusted', 'removed_from_trusted', 'reported_phishing', 'trusted_once'];
  if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`});
  }

  console.log(`Updating email status: User='${user_email}', EmailID='${email_id}', Sender='${sender_email}', Status='${status}'`);

  const sql = `
    INSERT INTO email_sender_status (user_email, email_id, sender_email, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_email, email_id) DO UPDATE SET
      status = excluded.status,
      sender_email = excluded.sender_email
  `;

  db.run(sql, [user_email, email_id, sender_email, status], function (err) {
    if (err) {
      console.error(`DB Error updating email status for user '${user_email}', email '${email_id}':`, err.message);
      return res.status(500).json({ error: "Failed to update email status." });
    }
    console.log(`Email status updated for user '${user_email}', email '${email_id}'. Changes: ${this.changes}`);
    res.json({ message: "Email sender status updated!" });
  });
});

// *** NEW ENDPOINT ***
/**
 * @route DELETE /reset-single-email-status
 * @description Deletes the status entry for a specific email for a user.
 * @body { user_email: string, email_id: string }
 */
app.delete("/reset-single-email-status", (req, res) => {
    // Use DELETE method, data typically sent in body for DELETE with body, or query params
    // Let's assume body for consistency with other POSTs, though DELETE usually uses params
    const { user_email, email_id } = req.body;

    if (!user_email || !email_id) {
        return res.status(400).json({ error: "Missing user_email or email_id" });
    }
    console.log(`Attempting to reset status for: User='${user_email}', EmailID='${email_id}'`);

    const sql = `DELETE FROM email_sender_status WHERE user_email = ? AND email_id = ?`;

    db.run(sql, [user_email, email_id], function (err) {
        if (err) {
            console.error(`DB Error resetting status for User='${user_email}', EmailID='${email_id}':`, err.message);
            return res.status(500).json({ error: "Failed to reset email status." });
        }
        // this.changes will be 1 if a row was deleted, 0 if no matching row found
        console.log(`Reset status for User='${user_email}', EmailID='${email_id}'. Rows affected: ${this.changes}`);
        // Send success regardless of whether a row was actually deleted (idempotent)
        res.json({ message: "Email status reset successfully.", count: this.changes });
    });
});
// *** END NEW ENDPOINT ***


// --- Root Route and Server Start ---
app.get("/", (req, res) => {
  res.send("Trusted Senders Backend is Running...");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});