import o, { assertThrows } from "@tutao/otest"
import {
	MailboxType,
	MigrationCsvParser,
	MigrationMailboxRow,
	parseMigrationCsv,
} from "../../../../src/applications/mail-app/settings/migration/MigrationCsvParser.js"
import { ParserError } from "../../../../src/applications/common/misc/parsing/ParserCombinator"

o.spec("MigrationCsvParser", function () {
	o.spec("parseCsvLines", function () {
		o("throws on empty CSV", async function () {
			const err1 = await assertThrows(ParserError, async () => new MigrationCsvParser(""))
			o(err1.message).equals("CSV is empty")
			const err2 = await assertThrows(ParserError, async () => new MigrationCsvParser(","))
			o(err2.message).equals("CSV is empty")
		})

		o("throws on missing required headers", async function () {
			const csv = "username,mailboxType,aliases,tutaEmail,members\nAlice,user,,alice@example.com,"
			const err = await assertThrows(ParserError, async () => new MigrationCsvParser(csv))
			o(err.message).equals("Missing required header: sourceemail")
		})

		o("parses valid CSV with all fields", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				'alice@example.com,Alice Smith,user,"a.smith@example.com;alice.s@example.org",alice@example.com,\n' +
				"bob@example.com,Bob Jones,user,,bob@example.com,\n" +
				'support@example.com,Support,shared,,support@example.com,"alice@example.com;bob@example.com"'

			const expected: MigrationMailboxRow[] = [
				{
					sourceEmail: "alice@example.com",
					username: "Alice Smith",
					mailboxType: MailboxType.User,
					aliases: ["a.smith@example.com", "alice.s@example.org"],
					tutaEmail: "alice@example.com",
					members: [],
				},
				{
					sourceEmail: "bob@example.com",
					username: "Bob Jones",
					mailboxType: MailboxType.User,
					aliases: [],
					tutaEmail: "bob@example.com",
					members: [],
				},
				{
					sourceEmail: "support@example.com",
					username: "Support",
					mailboxType: MailboxType.Shared,
					aliases: [],
					tutaEmail: "support@example.com",
					members: ["alice@example.com", "bob@example.com"],
				},
			]

			const parser = new MigrationCsvParser(csv)
			const result = parser.parse()
			o(result).deepEquals(expected)
		})

		o("handles header case-insensitivity", function () {
			const csv = "SOURCEEMAIL,USERNAME,MAILBOXTYPE,ALIASES,TUTAEMAIL,MEMBERS\n" + "alice@example.com,Alice,user,,alice@example.com,"

			const parser = new MigrationCsvParser(csv)
			const result = parser.parse()
			o(result.length).equals(1)
			o(result[0].sourceEmail).equals("alice@example.com")
		})

		o("handles quoted fields with escaped quotes", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + '"alice@example.com","Alice ""Smith""",user,"alias1;alias2",alice@example.com,'

			const result = new MigrationCsvParser(csv).parse()
			o(result[0].username).equals('Alice "Smith"')
			o(result[0].aliases).deepEquals(["alias1", "alias2"])
		})

		o("handles empty rows and whitespace", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"  alice@example.com  , Alice Smith , user ,  , alice@example.com ,  \n" +
				"\n" +
				"  bob@example.com,Bob Jones,user,,bob@example.com,\n" +
				""

			const result = new MigrationCsvParser(csv).parse()
			o(result.length).equals(2)
			o(result[0].sourceEmail).equals("alice@example.com")
			o(result[0].username).equals("Alice Smith")
			o(result[1].sourceEmail).equals("bob@example.com")
		})
	})

	o.spec("parse validation", function () {
		o("throws on missing sourceEmail", async function () {
			const csv = "sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + ",Alice,user,,alice@example.com,"
			const parser = new MigrationCsvParser(csv)
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals("sourceEmail is required")
		})

		o("throws on missing mailboxType", async function () {
			const csv = "sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + "alice@example.com,Alice,,,alice@example.com,"
			const parser = new MigrationCsvParser(csv)
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals("mailboxType is required")
		})

		o("throws on missing tutaEmail", async function () {
			const csv = "sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + "alice@example.com,Alice,user,,,"
			const parser = new MigrationCsvParser(csv)
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals("tutaEmail is required")
		})

		o("throws on invalid mailboxType", async function () {
			const csv = "sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + "alice@example.com,Alice,invalid,,alice@example.com,"
			const parser = new MigrationCsvParser(csv)
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals("Invalid mailboxType: invalid")
		})

		o("throws on duplicate sourceEmail", async function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" +
				"alice@example.com,Bob,user,,bob@example.com,"
			const parser = new MigrationCsvParser(csv)
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals("Duplicate sourceEmail: alice@example.com")
		})

		o("throws on member referencing non-existing sourceEmail", async function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" +
				'support@example.com,Support,shared,,support@example.com,"alice@example.com;bob@example.com"'
			const parser = new MigrationCsvParser(csv)
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals('Member "bob@example.com" references a non-existing sourceEmail')
		})
	})

	o.spec("domain validation", function () {
		o("allows emails from allowed domains", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" +
				'admin@example.org,Admin,user,"admin@example.org",admin@example.org,'

			const parser = new MigrationCsvParser(csv, { allowedDomains: ["example.com", "example.org"] })
			const result = parser.parse()
			o(result.length).equals(2)
		})

		o("throws on email with disallowed domain", async function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" +
				"bob@other.com,Bob,user,,bob@other.com,"
			const parser = new MigrationCsvParser(csv, { allowedDomains: ["example.com"] })
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals('Email "bob@other.com" uses a domain not in the allowed list')
		})

		o("throws on alias with disallowed domain", async function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				'alice@example.com,Alice,user,"a.smith@example.com;alice@other.org",alice@example.com,'
			const parser = new MigrationCsvParser(csv, { allowedDomains: ["example.com"] })
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals('Email "alice@other.org" uses a domain not in the allowed list')
		})

		o("throws on member with disallowed domain", async function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" +
				'support@example.com,Support,shared,,support@example.com,"alice@example.com;bob@other.com"'
			const parser = new MigrationCsvParser(csv, { allowedDomains: ["example.com"] })
			const err = await assertThrows(ParserError, async () => parser.parse())
			o(err.message).equals('Email "bob@other.com" uses a domain not in the allowed list')
		})

		o("skips domain validation if no allowed domains provided", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" +
				"bob@other.com,Bob,user,,bob@other.com,"
			const parser = new MigrationCsvParser(csv)
			const result = parser.parse()
			o(result.length).equals(2)
		})
	})

	o.spec("parseMigrationCsv convenience function", function () {
		o("parses CSV correctly", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice Smith,user,,alice@example.com,\n" +
				'support@example.com,Support,shared,,support@example.com,"alice@example.com"'

			const result = parseMigrationCsv(csv)
			o(result.length).equals(2)
			o(result[0].sourceEmail).equals("alice@example.com")
			o(result[1].mailboxType).equals(MailboxType.Shared)
			o(result[1].members).deepEquals(["alice@example.com"])
		})

		o("accepts config with separators and allowed domains", function () {
			const csv =
				"sourceEmail|username|mailboxType|aliases|tutaEmail|members\n" +
				'alice@example.com|Alice Smith|user|"a.smith@example.com,alice.s@example.org"|alice@example.com|'

			const result = parseMigrationCsv(csv, {
				primarySeparator: "|",
				secondarySeparator: ",",
				allowedDomains: ["example.com", "example.org"],
			})
			o(result.length).equals(1)
			o(result[0].aliases).deepEquals(["a.smith@example.com", "alice.s@example.org"])
		})

		o("throws error on invalid CSV", async function () {
			const csv = "sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + "alice@example.com,Alice,invalid,,alice@example.com,"
			const err = await assertThrows(ParserError, async () => parseMigrationCsv(csv))
			o(err.message).equals("Invalid mailboxType: invalid")
		})
	})

	o.spec("Edge cases", function () {
		o("handles missing optional fields (members, aliases)", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				"alice@example.com,Alice,user,,alice@example.com,\n" + // aliases and members empty
				"bob@example.com,Bob,user,,bob@example.com,\n" +
				"support@example.com,Support,shared,,support@example.com," // members empty

			const result = new MigrationCsvParser(csv).parse()
			o(result[0].aliases).deepEquals([])
			o(result[0].members).deepEquals([])
			o(result[2].members).deepEquals([])
		})

		o("handles extra whitespace in secondary separator values", function () {
			const csv =
				"sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" +
				'alice@example.com,Alice,user," a.smith@example.com ; alice.s@example.org ",alice@example.com,\n' +
				"bob@example.com,Bob,user,,bob@example.com,\n" + // Added Bob row
				'support@example.com,Support,shared,,support@example.com," alice@example.com ; bob@example.com "'

			const result = new MigrationCsvParser(csv).parse()
			o(result[0].aliases).deepEquals(["a.smith@example.com", "alice.s@example.org"])
			o(result[2].members).deepEquals(["alice@example.com", "bob@example.com"])
		})

		o("handles semicolons inside quoted fields (escaped)", function () {
			const csv = "sourceEmail,username,mailboxType,aliases,tutaEmail,members\n" + '"alice@example.com","Alice; Smith",user,,"alice@example.com",'

			const result = new MigrationCsvParser(csv).parse()
			o(result[0].username).equals("Alice; Smith")
		})

		o("handles large number of rows", function () {
			const rows: string[] = ["sourceEmail,username,mailboxType,aliases,tutaEmail,members"]
			for (let i = 0; i < 100; i++) {
				rows.push(`user${i}@example.com,User${i},user,,user${i}@example.com,`)
			}
			const csv = rows.join("\n")
			const result = new MigrationCsvParser(csv).parse()
			o(result.length).equals(100)
		})
	})
})
