export function plainTextToHtml(plainText: string): string {
	let result = ""
	const lines = plainText.split(/\r?\n/)
	let previousQuoteLevel = 0

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineQuoteLevel = getLineQuoteLevel(line)

		if (i > 0 && previousQuoteLevel === lineQuoteLevel) {
			// explicit line break if the quote level is the same
			result += "<br>"
		}

		// close blockquotes if level decreased
		if (previousQuoteLevel > lineQuoteLevel) {
			result += "</blockquote>".repeat(previousQuoteLevel - lineQuoteLevel)
		}

		// open blockquotes if level increased
		if (lineQuoteLevel > previousQuoteLevel) {
			result += "<blockquote>".repeat(lineQuoteLevel - previousQuoteLevel)
		}

		if (lineQuoteLevel > 0) {
			if (line.length > lineQuoteLevel) {
				const startIndex = lineQuoteLevel + 1 // skip "> "
				const indentedLine = line.substring(startIndex)
				result += escapePlainTextLine(indentedLine)
			}
		} else {
			result += escapePlainTextLine(line)
		}

		previousQuoteLevel = lineQuoteLevel
	}

	// close remaining open blockquotes
	if (previousQuoteLevel > 0) {
		result += "</blockquote>".repeat(previousQuoteLevel)
	}

	return result
}

function escapePlainTextLine(line: string): string {
	return line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function getLineQuoteLevel(line: string): number {
	let level = 0

	for (const char of line) {
		if (char === ">") {
			level++
		} else if (char === " ") {
			break
		} else {
			level = 0
			break
		}
	}

	return level
}
