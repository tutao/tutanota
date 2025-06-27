const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("./trusted_senders.db", (err) => {
	if (err) {
		console.error("❌ Database connection error:", err.message)
		return
	}
	console.log("✅ Connected to SQLite database.")
})

console.log("\n📊 DATABASE CONTENTS\n")
console.log("=".repeat(80))

// View all trusted senders
console.log("\n🔒 TRUSTED SENDERS:")
console.log("-".repeat(50))
db.all("SELECT * FROM trusted_senders ORDER BY user_email, trusted_email", [], (err, rows) => {
	if (err) {
		console.error("❌ Error fetching trusted senders:", err.message)
		return
	}

	if (rows.length === 0) {
		console.log("   No trusted senders found.")
	} else {
		console.log("   ID | User Email                    | Trusted Email                 | Name")
		console.log("   " + "-".repeat(75))
		rows.forEach((row) => {
			console.log(`   ${row.id.toString().padEnd(2)} | ${row.user_email.padEnd(29)} | ${row.trusted_email.padEnd(29)} | ${row.trusted_name || "(empty)"}`)
		})
	}

	console.log(`\n   Total: ${rows.length} trusted senders`)
})

// View all email statuses (especially phishing reports)
console.log("\n📧 EMAIL STATUSES (Including Phishing Reports):")
console.log("-".repeat(60))
db.all("SELECT * FROM email_sender_status ORDER BY id DESC", [], (err, rows) => {
	if (err) {
		console.error("❌ Error fetching email statuses:", err.message)
		return
	}

	if (rows.length === 0) {
		console.log("   No email statuses found.")
	} else {
		console.log("   ID | User Email           | Email ID     | Sender Email          | Status")
		console.log("   " + "-".repeat(85))
		rows.forEach((row) => {
			const statusColor =
				row.status === "reported_phishing"
					? "🚨"
					: row.status === "trusted_once"
					? "⚠️"
					: row.status === "confirmed"
					? "✅"
					: row.status === "denied"
					? "❌"
					: "🔸"
			console.log(
				`   ${row.id.toString().padEnd(2)} | ${row.user_email.padEnd(20)} | ${row.email_id.padEnd(12)} | ${row.sender_email.padEnd(
					21,
				)} | ${statusColor} ${row.status}`,
			)
		})
	}

	console.log(`\n   Total: ${rows.length} email statuses`)

	// Count phishing reports specifically
	const phishingReports = rows.filter((row) => row.status === "reported_phishing")
	console.log(`   🚨 Phishing Reports: ${phishingReports.length}`)

	if (phishingReports.length > 0) {
		console.log("\n🚨 PHISHING REPORTS DETAILS:")
		console.log("-".repeat(40))
		phishingReports.forEach((report) => {
			console.log(`   • User: ${report.user_email}`)
			console.log(`     Email ID: ${report.email_id}`)
			console.log(`     Reported Sender: ${report.sender_email}`)
			console.log(`     Status: ${report.status}`)
			console.log("")
		})
	}
})

// Close database after a short delay to allow queries to complete
setTimeout(() => {
	db.close((err) => {
		if (err) {
			console.error("❌ Error closing database:", err.message)
		} else {
			console.log("\n✅ Database connection closed.")
		}
	})
}, 1000)
