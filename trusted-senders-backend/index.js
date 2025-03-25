require("dotenv").config()
const express = require("express")
const sqlite3 = require("sqlite3").verbose()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Connect to SQLite Database
const db = new sqlite3.Database("./trusted_senders.db", (err) => {
	if (err) {
		console.error("Database connection error:", err.message)
	} else {
		console.log(" Connected to SQLite database.")
	}
})

// Create the trusted_senders table if it doesn't exist
db.run(
	`
    CREATE TABLE IF NOT EXISTS trusted_senders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        trusted_email TEXT NOT NULL
    )
`,
	(err) => {
		if (err) {
			console.error(" Error creating table:", err.message)
		} else {
			console.log(" Trusted senders table is ready.")
		}
	},
)

// Create the email-specific sender status table if it doesn't exist
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
        interaction_type TEXT CHECK (interaction_type IN ('interacted', 'no_interaction')),
        UNIQUE(user_email, email_id)
    )
`,
	(err) => {
		if (err) {
			console.error("Error creating email sender status table:", err.message)
		} else {
			console.log("Email sender status table is ready.")
		}
	},
)

// Add a trusted sender
app.post("/add-trusted", (req, res) => {
	const { user_email, trusted_email } = req.body
	if (!user_email || !trusted_email) {
		return res.status(400).json({ error: "Missing user_email or trusted_email" })
	}

	const sql = `INSERT INTO trusted_senders (user_email, trusted_email) VALUES (?, ?)`
	db.run(sql, [user_email, trusted_email], function (err) {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.json({ message: "Trusted sender added!", id: this.lastID })
	})
})

// Remove a trusted sender
app.post("/remove-trusted", (req, res) => {
	const { user_email, trusted_email } = req.body
	if (!user_email || !trusted_email) {
		return res.status(400).json({ error: "Missing user_email or trusted_email" })
	}

	const sql = `DELETE FROM trusted_senders WHERE user_email = ? AND trusted_email = ?`
	db.run(sql, [user_email, trusted_email], function (err) {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.json({ message: "Trusted sender removed!" })
	})
})

// Get trusted senders for a user
app.get("/trusted-senders/:user_email", (req, res) => {
	const user_email = req.params.user_email

	const sql = `SELECT trusted_email FROM trusted_senders WHERE user_email = ?`
	db.all(sql, [user_email], (err, rows) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.json({ trusted_senders: rows.map((row) => row.trusted_email) })
	})
})

// Get sender status for a specific email
app.get("/email-status/:user_email/:email_id", (req, res) => {
	const { user_email, email_id } = req.params

	const sql = `SELECT sender_email, status, interaction_type FROM email_sender_status WHERE user_email = ? AND email_id = ?`
	db.get(sql, [user_email, email_id], (err, row) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.json(row || { message: "No status found for this email." })
	})
})

// Update sender status for an email
app.post("/update-email-status", (req, res) => {
	const { user_email, email_id, sender_email, status, interaction_type } = req.body

	if (!user_email || !email_id || !sender_email || !status || !interaction_type) {
		return res.status(400).json({ error: "Missing required fields." })
	}

	const sql = `
        INSERT INTO email_sender_status (user_email, email_id, sender_email, status, interaction_type)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_email, email_id) DO UPDATE 
        SET status = excluded.status, interaction_type = excluded.interaction_type
    `

	db.run(sql, [user_email, email_id, sender_email, status, interaction_type], function (err) {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.json({ message: "Email sender status updated!" })
	})
})

// Default Route
app.get("/", (req, res) => {
	res.send("Trusted Senders Backend is Running...")
})

// Start Server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`)
})
