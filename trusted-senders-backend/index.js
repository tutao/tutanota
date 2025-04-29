// index.js (FINAL corrected version)

require("dotenv").config()
const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'; // Listen on all interfaces

// --- Corrected CORS Setup ---
const allowedOrigins = [
  "http://3.88.180.154:9000", 
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // Allow tools like Postman
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"], // Add this to avoid future minor errors
}

app.use(cors(corsOptions))
app.use(express.json())

// --- Database Setup ---
const db = new sqlite3.Database("./trusted_senders.db", (err) => {
  if (err) {
    console.error("Database connection error:", err.message)
  } else {
    console.log("Connected to SQLite database.")
  }
})

// --- Database Migration ---
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='trusted_senders'", (tableErr, tableRow) => {
  if (tableErr) {
    console.error("Error checking if trusted_senders table exists:", tableErr.message)
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
        console.log("Adding missing trusted_name column...")
        db.run("ALTER TABLE trusted_senders ADD COLUMN trusted_name TEXT DEFAULT ''", (alterErr) => {
          if (alterErr) {
            console.error("Error adding trusted_name column:", alterErr.message)
          } else {
            console.log("Successfully added trusted_name column.")
          }
        })
      } else {
        console.log("trusted_name column already exists.")
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
`, handleError("creating trusted_senders table"))

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
`, handleError("creating email_sender_status table"))

// --- Helper for error logging ---
function handleError(action) {
  return (err) => {
    if (err) console.error(`Error ${action}:`, err.message)
    else console.log(`${action} - OK`)
  }
}

// --- API Endpoints ---

app.post("/add-trusted", (req, res) => {
  const { user_email, trusted_email, trusted_name = "" } = req.body
  if (!user_email || !trusted_email) {
    return res.status(400).json({ error: "Missing user_email or trusted_email" })
  }
  const sql = `
    INSERT INTO trusted_senders (user_email, trusted_email, trusted_name)
    VALUES (?, ?, ?)
    ON CONFLICT(user_email, trusted_email) DO UPDATE SET
      trusted_name = excluded.trusted_name
  `
  db.run(sql, [user_email, trusted_email, trusted_name], function (err) {
    if (err) {
      console.error("DB Error adding/updating trusted sender:", err.message)
      return res.status(500).json({ error: "Failed to add trusted sender." })
    }
    res.status(201).json({ message: "Trusted sender added/updated.", id: this.lastID })
  })
})

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
        console.error("DB Error removing trusted sender:", err.message)
        return res.status(500).json({ error: "Failed to remove trusted sender." })
      }
      db.run(deleteStatusesSql, [user_email, trusted_email], function (statusErr) {
        if (statusErr) {
          console.error("DB Error removing statuses:", statusErr.message)
          return res.status(500).json({ error: "Failed to remove email statuses." })
        }
        res.json({ message: "Trusted sender and statuses removed." })
      })
    })
  })
})

app.get("/trusted-senders/:user_email", (req, res) => {
  const { user_email } = req.params
  db.all(
    "SELECT trusted_email, trusted_name FROM trusted_senders WHERE user_email = ? ORDER BY trusted_name, trusted_email",
    [user_email],
    (err, rows) => {
      if (err) {
        console.error("DB Error fetching trusted senders:", err.message)
        return res.status(500).json({ error: "Failed to retrieve trusted senders." })
      }
      const trustedSendersList = rows.map(row => ({
        name: row.trusted_name || "",
        address: row.trusted_email,
      }))
      res.json({ trusted_senders: trustedSendersList })
    }
  )
})

app.get("/email-status/:user_email/:email_id", (req, res) => {
  const { user_email, email_id } = req.params
  db.get(
    "SELECT sender_email, status FROM email_sender_status WHERE user_email = ? AND email_id = ?",
    [user_email, email_id],
    (err, row) => {
      if (err) {
        console.error("DB Error fetching email status:", err.message)
        return res.status(500).json({ error: "Failed to retrieve email status." })
      }
      res.json(row || { status: null })
    }
  )
})

app.post("/update-email-status", (req, res) => {
  const { user_email, email_id, sender_email, status } = req.body
  if (!user_email || !email_id || !sender_email || !status) {
    return res.status(400).json({ error: "Missing fields." })
  }
  const validStatuses = ["confirmed", "denied", "added_to_trusted", "removed_from_trusted", "reported_phishing", "trusted_once"]
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value." })
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

app.delete("/reset-single-email-status", (req, res) => {
  const { user_email, email_id } = req.body
  if (!user_email || !email_id) {
    return res.status(400).json({ error: "Missing user_email or email_id" })
  }

  db.run("DELETE FROM email_sender_status WHERE user_email = ? AND email_id = ?", [user_email, email_id], function (err) {
    if (err) {
      console.error("DB Error resetting status:", err.message)
      return res.status(500).json({ error: "Failed to reset email status." })
    }
    res.json({ message: "Email status reset.", count: this.changes })
  })
})

app.get("/", (req, res) => {
  res.send("Trusted Senders Backend is Running...")
})

app.listen(PORT, HOST, () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
});

process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message)
    } else {
      console.log("Database connection closed.")
    }
    process.exit(0)
  })
})
