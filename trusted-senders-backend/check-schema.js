const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("./trusted_senders.db", (err) => {
	if (err) {
		console.error("❌ Database connection error:", err.message)
		return
	}
	console.log("✅ Connected to SQLite database.")
})

console.log("\n🔍 CHECKING DATABASE SCHEMA\n")
console.log("=".repeat(60))

// Check what tables exist
console.log("\n📋 EXISTING TABLES:")
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
	if (err) {
		console.error("❌ Error fetching tables:", err.message)
		return
	}

	console.log(
		"Tables found:",
		tables.map((t) => t.name),
	)

	// Check schema for each table
	tables.forEach((table) => {
		console.log(`\n📊 Schema for table '${table.name}':]`)
		db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
			if (err) {
				console.error(`❌ Error getting schema for ${table.name}:`, err.message)
				return
			}

			console.log("Columns:")
			columns.forEach((col) => {
				console.log(`  - ${col.name} (${col.type}) ${col.notnull ? "NOT NULL" : ""} ${col.pk ? "PRIMARY KEY" : ""}`)
			})

			// For email_sender_status, check the CHECK constraint
			if (table.name === "email_sender_status") {
				db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='email_sender_status'`, [], (err, result) => {
					if (err) {
						console.error("❌ Error getting table definition:", err.message)
						return
					}
					console.log("\nTable Definition:")
					console.log(result ? result.sql : "Not found")

					// Check if there are any records
					db.all("SELECT DISTINCT status FROM email_sender_status", [], (err, statuses) => {
						if (err) {
							console.error("❌ Error checking statuses:", err.message)
							return
						}
						console.log(
							"\nExisting status values:",
							statuses.map((s) => s.status),
						)
					})
				})
			}
		})
	})
})

setTimeout(() => {
	db.close((err) => {
		if (err) {
			console.error("❌ Error closing database:", err.message)
		} else {
			console.log("\n✅ Database connection closed.")
		}
	})
}, 2000)
