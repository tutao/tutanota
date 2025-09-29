// fields containing newlines, double quotes or the separator need to be escaped
// by wrapping the whole field in double quotes, and then duplicating any double quotes in the field
const escapeColumn = (column: string, separator: string): string => {
	if (!column.includes(separator) && !column.includes("\n") && !column.includes('"')) {
		return column
	}
	return `"${column.replaceAll('"', '""')}"`
}

export function renderCsv(header: Array<string>, rows: Array<Array<string>>, separator: string = ";"): string {
	return renderCsvHeader(header, separator).concat("\n", renderCsvBody(rows, separator))
}

export function renderCsvHeader(header: Array<string>, separator: string = ";"): string {
	return header.map((col) => escapeColumn(col, separator)).join(separator)
}

export function renderCsvBody(rows: Array<Array<string>>, separator: string = ";"): string {
	return rows.map((row) => row.map((col) => escapeColumn(col, separator)).join(separator)).join("\n")
}
