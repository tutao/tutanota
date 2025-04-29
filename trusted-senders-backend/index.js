// index.js (FINAL updated version)

require("dotenv").config()
const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 3000

// --- CORS Config (Updated) ---
const allowedOrigins = [
  "http://3.88.180.154:9000", // <-- Your frontend IP
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // Allow tools like Postman
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true, // Allow cookies/session tokens
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
}

app.use(cors(corsOptions))
app.use(express.json()) // Middleware to parse JSON bodies

// --- Database Setup ---
const db = new sqlite3.Database("./trusted_senders.db", (err) => {
  if (err) {
    console.error("Database connection error:", err.message)
  } else {
    console.log("Connected to SQLite database.")
  }
})

// --- Database Migration ---
db.get("PRAGMA table_info(trusted_senders)", [], (err, rows) => {
  if (err) {
    console.error("Error checking table schema:", err.message)
  } else {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='trusted_senders'", [], (tableErr, tableRow) => {
      if (tableErr) {
        console.error("Error checking if table exists:", tableErr.message)
        return
      }
      if (tableRow) {
        db.all("PRAGMA table_info(trusted_senders)", [], (pragmaErr, columns) => {
          if (pragmaErr) {
            console.error("Error getting column info:", pragmaErr.message)
            return
          }
          const hasNameColumn = columns.some((col) => col.name === "trusted_name")
          if (!hasNameColumn) {
            console.log("Adding missing trusted_name column to existing table...")
            db.run("ALTER TABLE trusted_senders ADD COLUMN trusted_name TEXT DEFAULT ''", (alterErr) => {
              if (alterErr) {
                console.error("Error adding trusted_name column:", alterErr.message)
              } else {
                console.log("Successfully added trusted_name column to existing table")
              }
            })
          } else {
            console.log("trusted_name column already exists in the trusted_senders table")
          }
        })
      }
    })
  }
})

// --- Table Creation ---
db.run(`
  CREATE TABLE IF NOT EXISTS trusted_senders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    trusted_email TEXT NOT NULL,
    trusted_name TEXT DEFAULT '',
    UNIQUE(user_email, trusted_email)
  )
`, (err) => {
  if (err) {
    console.error("Error creating/checking trusted_senders table:", err.message)
  } else {
    console.log("Trusted senders table is ready.")
  }
})

db.run(`
  CREATE TABLE IF NOT EXISTS email_sender_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    email_id TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
      status IN ('confirmed', 'denied', 'added_to_trusted', 'removed_from_trusted', 'reported_phishing', 'trusted_once')
    ),
    UNIQUE(user_email, email_id)
  )
`, (err) => {
  if (err) {
    console.error("Error creating email sender status table:", err.message)
  } else {
    console.log("Email sender status table is ready.")
  }
})

// --- API Endpoints ---

// Add a trusted sender
app.post("/add-trusted", (req, res) => {
  const { user_email, trusted_email, trusted_name } = req.body
  if (!user_email || !trusted_email) {
    return res.status(400).json({ error: "Missing user_email or trusted_email" })
  }
  const nameToStore = trusted_name || ""

  const sql = `
    INSERT INTO trusted_senders (user_email, trusted_email, trusted_name)
    VALUES (?, ?, ?)
    ON CONFLICT(user_email, trusted_email) DO UPDATE SET
      trusted_name = excluded.trusted_name
  `
  db.run(sql, [user_email, trusted_email, nameToStore], function (err) {
    if (err) {
      console.error(`DB Error adding/updating trusted sender for '${user_email}':`, err.message)
      return res.status(500).json({ error: "Failed to add trusted sender." })
    }
    res.status(201).json({ message: "Trusted sender added or updated!", id: this.lastID })
  })
})

// Remove a trusted sender
app.post("/remove-trusted", (req, res) => {
  const { user_email, trusted_email } = req.body
  if (!user_email || !trusted_email) {
    return res.status(400).json({ error: "Missing user_email or trusted_email" })
  }

  const deleteTrustedSql = `DELETE FROM trusted_senders WHERE user_email = ? AND trusted_email = ?`
  const deleteStatusesSql = `DELETE FROM email_sender_status WHERE user_email = ? AND sender_email = ?`

  db.serialize(() => {
    db.run(deleteTrustedSql, [user_email, trusted_email], function (err) {
      if (err) {
        console.error(`DB Error removing trusted sender:`, err.message)
        return res.status(500).json({ error: "Failed to remove trusted sender." })
      }
      db.run(deleteStatusesSql, [user_email, trusted_email], function (statusErr) {
        if (statusErr) {
          console.error(`DB Error removing statuses:`, statusErr.message)
          return res.status(500).json({ error: "Failed to remove email statuses." })
        }
        res.json({ message: "Trusted sender and statuses removed." })
      })
    })
  })
})

// Fetch trusted senders for a user
app.get("/trusted-senders/:user_email", (req, res) => {
  const { user_email } = req.params
  const sql = `SELECT trusted_email, trusted_name FROM trusted_senders WHERE user_email = ? ORDER BY trusted_name, trusted_email`

  db.all(sql, [user_email], (err, rows) => {
    if (err) {
      console.error("DB Error fetching trusted senders:", err.message)
      return res.status(500).json({ error: "Failed to retrieve trusted senders." })
    }
    const trustedSendersList = rows.map(row => ({
      name: row.trusted_name || "",
      address: row.trusted_email,
    }))
    res.json({ trusted_senders: trustedSendersList })
  })
})

// Fetch email status
app.get("/email-status/:user_email/:email_id", (req, res) => {
  const { user_email, email_id } = req.params
  const sql = `SELECT sender_email, status FROM email_sender_status WHERE user_email = ? AND email_id = ?`

  db.get(sql, [user_email, email_id], (err, row) => {
    if (err) {
      console.error("DB Error fetching email status:", err.message)
      return res.status(500).json({ error: "Failed to retrieve email status." })
    }
    res.json(row || { status: null })
  })
})

// Update email status
app.post("/update-email-status", (req, res) => {
  const { user_email, email_id, sender_email, status } = req.body
  if (!user_email || !email_id || !sender_email || !status) {
    return res.status(400).json({ error: "Missing fields" })
  }
  const validStatuses = ["confirmed", "denied", "added_to_trusted", "removed_from_trusted", "reported_phishing", "trusted_once"]
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status value.` })
  }

  const sql = `
    INSERT INTO email_sender_status (user_email, email_id, sender_email, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_email, email_id) DO UPDATE SET
      status = excluded.status,
      sender_email = excluded.sender_email
  `
  db.run(sql, [user_email, email_id, sender_email, status], function (err) {
    if (err) {
      console.error("DB Error updating email status:", err.message)
      return res.status(500).json({ error: "Failed to update email status." })
    }
    res.json({ message: "Email status updated." })
  })
})

// Reset single email status
app.delete("/reset-single-email-status", (req, res) => {
  const { user_email, email_id } = req.body
  if (!user_email || !email_id) {
    return res.status(400).json({ error: "Missing user_email or email_id" })
  }

  const sql = `DELETE FROM email_sender_status WHERE user_email = ? AND email_id = ?`
  db.run(sql, [user_email, email_id], function (err) {
    if (err) {
      console.error("DB Error resetting status:", err.message)
      return res.status(500).json({ error: "Failed to reset email status." })
    }
    res.json({ message: "Email status reset successfully.", count: this.changes })
  })
})

// --- Root Route ---
app.get("/", (req, res) => {
  res.send("Trusted Senders Backend is Running...")
})

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// --- Graceful Shutdown ---
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database", err.message)
    } else {
      console.log("Database connection closed.")
    }
    process.exit(0)
  })
})
