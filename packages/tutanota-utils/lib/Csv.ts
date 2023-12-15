export function renderCsv(header: Array<string>, rows: Array<Array<string>>, separator: string = ";"): string {
	// fields containing newlines, double quotes or the separator need to be escaped
	// by wrapping the whole field in double quotes, and then duplicating any double quotes in the field
	const escapeColumn = (column: string): string => {
		if (!column.includes(separator) && !column.includes("\n") && !column.includes('"')) {
			return column
		}

		return `"${column.replaceAll('"', '""')}"`
	}

	return [header]
		.concat(rows)
		.map((row) => row.map(escapeColumn).join(separator))
		.join("\n")
}
