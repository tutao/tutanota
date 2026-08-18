import { ParserError } from "../../../common/misc/parsing/ParserCombinator"

export enum MailboxType {
	User = "user",
	Shared = "shared",
}

export interface MigrationMailboxRow {
	sourceEmail: string
	username: string
	mailboxType: MailboxType
	aliases: string[]
	tutaEmail: string
	members: string[]
}

export interface MigrationCsvParserConfig {
	primarySeparator?: string
	secondarySeparator?: string
	allowedDomains?: string[]
}

/**
 * Parses a CSV string according to the migration mailbox schema.
 * The CSV must have headers: sourceEmail, username, mailboxType, aliases, tutaEmail, members.
 * - aliases and members are semicolon-separated lists.
 * - mailboxType must be "user" or "shared".
 * - All email addresses are validated against allowedDomains if provided.
 *
 * Throws ParserError on invalid input.
 */
export class MigrationCsvParser {
	private readonly rows: string[][]
	private readonly headers: string[]
	private readonly headerMap: Map<string, number>
	private readonly allowedDomains: Set<string> | undefined
	private readonly primarySeparator: string
	private readonly secondarySeparator: string

	constructor(csvString: string, config: MigrationCsvParserConfig = {}) {
		this.primarySeparator = config.primarySeparator ?? ","
		this.secondarySeparator = config.secondarySeparator ?? ";"
		this.allowedDomains = config.allowedDomains ? new Set(config.allowedDomains) : undefined

		const parsed = this.parseCsvLines(csvString, this.primarySeparator)
		if (parsed.length === 0) {
			throw new ParserError("CSV is empty")
		}
		this.headers = parsed[0].map((h) => h.trim())
		// If all headers are empty, treat as empty CSV
		if (this.headers.every((h) => h === "")) {
			throw new ParserError("CSV is empty")
		}
		this.rows = parsed.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""))

		// Build case‑insensitive header map
		this.headerMap = new Map()
		for (let idx = 0; idx < this.headers.length; idx++) {
			const h = this.headers[idx]
			this.headerMap.set(h.toLowerCase(), idx)
		}

		this.validateHeaders()
	}

	parse(): MigrationMailboxRow[] {
		const results: MigrationMailboxRow[] = []
		const sourceEmailSet = new Set<string>()

		for (const row of this.rows) {
			const obj = this.rowToObject(row)
			if (!obj.sourceEmail) throw new ParserError("sourceEmail is required")
			if (!obj.mailboxType) throw new ParserError("mailboxType is required")
			if (!obj.tutaEmail) throw new ParserError("tutaEmail is required")

			if (obj.mailboxType !== MailboxType.User && obj.mailboxType !== MailboxType.Shared) {
				throw new ParserError(`Invalid mailboxType: ${obj.mailboxType}`)
			}

			this.validateEmail(obj.sourceEmail)
			this.validateEmail(obj.tutaEmail)
			for (const alias of obj.aliases) {
				this.validateEmail(alias)
			}
			for (const member of obj.members) {
				this.validateEmail(member)
			}

			if (sourceEmailSet.has(obj.sourceEmail)) {
				throw new ParserError(`Duplicate sourceEmail: ${obj.sourceEmail}`)
			}
			sourceEmailSet.add(obj.sourceEmail)

			results.push(obj)
		}

		const sourceEmails = new Set(results.map((r) => r.sourceEmail))
		for (const row of results) {
			for (const member of row.members) {
				if (!sourceEmails.has(member)) {
					throw new ParserError(`Member "${member}" references a non-existing sourceEmail`)
				}
			}
		}

		return results
	}

	private validateEmail(email: string): void {
		if (!this.allowedDomains) return
		const domain = email.split("@")[1]
		if (!domain || !this.allowedDomains.has(domain)) {
			throw new ParserError(
				`Email "${email}" uses a domain (${domain}) not in the allowed list ${Array.from(this.allowedDomains).map((domain) => domain)}`,
			)
		}
	}

	private rowToObject(row: string[]): MigrationMailboxRow {
		const get = (index: number): string => (row[index] || "").trim()
		const getArray = (index: number): string[] => {
			const value = get(index)
			if (!value) return []
			return value
				.split(this.secondarySeparator)
				.map((s) => s.trim())
				.filter(Boolean)
		}

		// Use the header map (case‑insensitive)
		const sourceEmail = get(this.headerMap.get("sourceemail") ?? -1)
		const username = get(this.headerMap.get("username") ?? -1)
		const mailboxType = get(this.headerMap.get("mailboxtype") ?? -1) as MailboxType
		const aliases = getArray(this.headerMap.get("aliases") ?? -1)
		const tutaEmail = get(this.headerMap.get("tutaemail") ?? -1)
		const members = getArray(this.headerMap.get("members") ?? -1)

		return {
			sourceEmail,
			username: username || "",
			mailboxType,
			aliases,
			tutaEmail,
			members,
		}
	}

	private parseCsvLines(csv: string, separator: string): string[][] {
		const lines: string[][] = []
		let currentRow: string[] = []
		let currentField = ""
		let insideQuotes = false
		let i = 0

		const flushField = () => {
			currentRow.push(currentField)
			currentField = ""
		}

		while (i < csv.length) {
			const char = csv[i]
			if (insideQuotes) {
				if (char === '"') {
					if (i + 1 < csv.length && csv[i + 1] === '"') {
						currentField += '"'
						i += 2
					} else {
						insideQuotes = false
						i++
					}
				} else {
					currentField += char
					i++
				}
			} else {
				if (char === '"') {
					insideQuotes = true
					i++
				} else if (char === separator) {
					flushField()
					i++
				} else if (char === "\r") {
					i++
				} else if (char === "\n") {
					flushField()
					lines.push(currentRow)
					currentRow = []
					i++
				} else {
					currentField += char
					i++
				}
			}
		}
		if (currentField || currentRow.length > 0) {
			flushField()
			lines.push(currentRow)
		}
		return lines
	}

	private validateHeaders(): void {
		const required = ["sourceemail", "mailboxtype", "tutaemail"]
		for (const req of required) {
			if (!this.headerMap.has(req)) {
				throw new ParserError(`Missing required header: ${req}`)
			}
		}
	}
}

/**
 * Convenience function to parse a migration CSV string.
 * @param csvString The CSV content.
 * @param config Optional configuration (separators, allowed domains).
 * @returns Array of MigrationMailboxRow.
 */
export function parseMigrationCsv(csvString: string, config: MigrationCsvParserConfig = {}): MigrationMailboxRow[] {
	return new MigrationCsvParser(csvString, config).parse()
}
