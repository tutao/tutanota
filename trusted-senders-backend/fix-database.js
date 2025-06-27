const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("./trusted_senders.db", (err) => {
	if (err) {
		console.error("❌ Database connection error:", err.message)
		return
	}
	console.log("✅ Connected to SQLite database.")
})

console.log("\n🔧 FIXING DATABASE SCHEMA FOR PHISHING REPORTS\n")
console.log("=".repeat(70))

// Function to handle errors
function handleError(action) {
	return (err) => {
		if (err) {
			console.error(`❌ Error ${action}:`, err.message)
		} else {
			console.log(`✅ ${action} - SUCCESS`)
		}
	}
}

db.serialize(() => {
	// First, check if email_sender_status table exists
	db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='email_sender_status'", [], (err, table) => {
		if (err) {
			console.error("❌ Error checking for email_sender_status table:", err.message)
			return
		}

		if (!table) {
			console.log("📝 Creating email_sender_status table...")
			// Create the table with phishing support
			db.run(
				`
				CREATE TABLE email_sender_status (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_email TEXT NOT NULL,
					email_id TEXT NOT NULL,
					sender_email TEXT NOT NULL,
					status TEXT NOT NULL CHECK (
						status IN ('confirmed', 'denied', 'added_to_trusted', 'removed_from_trusted', 'reported_phishing', 'trusted_once')
					),
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					UNIQUE(user_email, email_id)
				)
			`,
				handleError("creating email_sender_status table"),
			)
		} else {
			console.log("📝 Table exists, checking if it supports phishing reports...")

			// Check current table definition
			db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='email_sender_status'", [], (err, result) => {
				if (err) {
					console.error("❌ Error getting table definition:", err.message)
					return
				}

				const tableSql = result ? result.sql : ""
				console.log("Current table definition:")
				console.log(tableSql)

				// Check if 'reported_phishing' is in the CHECK constraint
				if (!tableSql.includes("reported_phishing")) {
					console.log("\n🔄 Table needs updating to support phishing reports...")
					console.log("   Backing up existing data...")

					// Step 1: Create backup table
					db.run(
						`
						CREATE TABLE email_sender_status_backup AS 
						SELECT * FROM email_sender_status
					`,
						(err) => {
							if (err) {
								console.error("❌ Error creating backup:", err.message)
								return
							}
							console.log("✅ Backup created successfully")

							// Step 2: Drop old table
							db.run("DROP TABLE email_sender_status", (err) => {
								if (err) {
									console.error("❌ Error dropping old table:", err.message)
									return
								}
								console.log("✅ Old table dropped")

								// Step 3: Create new table with phishing support
								db.run(
									`
								CREATE TABLE email_sender_status (
									id INTEGER PRIMARY KEY AUTOINCREMENT,
									user_email TEXT NOT NULL,
									email_id TEXT NOT NULL,
									sender_email TEXT NOT NULL,
									status TEXT NOT NULL CHECK (
										status IN ('confirmed', 'denied', 'added_to_trusted', 'removed_from_trusted', 'reported_phishing', 'trusted_once')
									),
									created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
									UNIQUE(user_email, email_id)
								)
							`,
									(err) => {
										if (err) {
											console.error("❌ Error creating new table:", err.message)
											return
										}
										console.log("✅ New table created with phishing support")

										// Step 4: Restore data from backup
										db.run(
											`
									INSERT INTO email_sender_status (user_email, email_id, sender_email, status)
									SELECT user_email, email_id, sender_email, status 
									FROM email_sender_status_backup
								`,
											(err) => {
												if (err) {
													console.error("❌ Error restoring data:", err.message)
													return
												}
												console.log("✅ Data restored from backup")

												// Step 5: Drop backup table
												db.run("DROP TABLE email_sender_status_backup", (err) => {
													if (err) {
														console.error("❌ Error dropping backup table:", err.message)
													} else {
														console.log("✅ Backup table cleaned up")
													}

													// Step 6: Verify the fix
													verifyFix()
												})
											},
										)
									},
								)
							})
						},
					)
				} else {
					console.log("✅ Table already supports phishing reports!")
					verifyFix()
				}
			})
		}
	})

	// Also ensure trusted_senders table exists with proper schema
	console.log("\n📝 Ensuring trusted_senders table exists...")
	db.run(
		`
		CREATE TABLE IF NOT EXISTS trusted_senders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_email TEXT NOT NULL,
			trusted_email TEXT NOT NULL,
			trusted_name TEXT DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_email, trusted_email)
		)
	`,
		handleError("creating/updating trusted_senders table"),
	)
})

function verifyFix() {
	console.log("\n🔍 VERIFYING THE FIX...")
	console.log("-".repeat(40))

	// Test inserting a phishing report
	const testData = {
		user_email: "test@example.com",
		email_id: "test-email-123",
		sender_email: "phisher@bad.com",
		status: "reported_phishing",
	}

	db.run(
		`
		INSERT OR REPLACE INTO email_sender_status (user_email, email_id, sender_email, status)
		VALUES (?, ?, ?, ?)
	`,
		[testData.user_email, testData.email_id, testData.sender_email, testData.status],
		function (err) {
			if (err) {
				console.error("❌ Test insert failed:", err.message)
			} else {
				console.log("✅ Test phishing report inserted successfully!")
				console.log(`   ID: ${this.lastID}`)

				// Verify the data was inserted
				db.get("SELECT * FROM email_sender_status WHERE status = 'reported_phishing' AND id = ?", [this.lastID], (err, row) => {
					if (err) {
						console.error("❌ Error verifying test data:", err.message)
					} else if (row) {
						console.log("✅ Phishing report verified in database:")
						console.log(`   User: ${row.user_email}`)
						console.log(`   Email ID: ${row.email_id}`)
						console.log(`   Sender: ${row.sender_email}`)
						console.log(`   Status: ${row.status}`)
						console.log(`   Created: ${row.created_at}`)
					} else {
						console.log("❌ Test data not found")
					}

					// Clean up test data
					db.run("DELETE FROM email_sender_status WHERE user_email = 'test@example.com'", (err) => {
						if (err) {
							console.error("❌ Error cleaning up test data:", err.message)
						} else {
							console.log("✅ Test data cleaned up")
						}

						console.log("\n🎉 DATABASE FIX COMPLETE!")
						console.log("The database now supports phishing reports.")
						console.log("You can now use the Report button in the MobyPhish header.")

						// Close database
						setTimeout(() => {
							db.close((err) => {
								if (err) {
									console.error("❌ Error closing database:", err.message)
								} else {
									console.log("\n✅ Database connection closed.")
								}
							})
						}, 500)
					})
				})
			}
		},
	)
}
