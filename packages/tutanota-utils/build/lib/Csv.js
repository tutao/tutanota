export function renderCsv(header, rows, separator = ";") {
    // fields containing newlines, double quotes or the separator need to be escaped
    // by wrapping the whole field in double quotes, and then duplicating any double quotes in the field
    const escapeColumn = (column) => {
        if (!column.includes(separator) && !column.includes("\n") && !column.includes('"')) {
            return column;
        }
        return `"${column.replaceAll('"', '""')}"`;
    };
    return [header]
        .concat(rows)
        .map((row) => row.map(escapeColumn).join(separator))
        .join("\n");
}
