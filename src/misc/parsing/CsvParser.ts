import type { Parser } from "./ParserCombinator"
import {
	combineParsers,
	makeCharacterParser,
	makeEitherParser,
	makeNotOneOfCharactersParser,
	makeOneOrMoreParser,
	makeSeparatedByParser,
	makeZeroOrMoreParser,
	mapParser,
	ParserError,
	StringIterator,
} from "./ParserCombinator"

type ParsedCsv = {
	rows: Array<Array<string>>
}
type CsvParseOptions = {
	delimiter: Delimiter
}
type Delimiter = "," | "|" | ":" | ";"
const DEFAULT_CSV_PARSE_OPTIONS = {
	delimiter: ",",
}

export function parseCsv(input: string, options?: Partial<CsvParseOptions>): ParsedCsv {
	const { delimiter } = Object.assign({}, DEFAULT_CSV_PARSE_OPTIONS, options)
	const lineDelimiterParser = makeOneOrMoreParser(makeCharacterParser("\n"))
	const parser = makeSeparatedByParser(lineDelimiterParser, makeRowParser(delimiter))
	const rows = parser(new StringIterator(input.replace(/\r\n/g, "\n")))
	return {
		rows: rows,
	}
}

function makeRowParser(delimiter: Delimiter): Parser<Array<string>> {
	return makeSeparatedByParser(makeCharacterParser(delimiter), makeColumnParser(delimiter))
}

function makeColumnParser(delimiter: Delimiter): Parser<string> {
	return makeEitherParser(quotedColumnParser, makeUnquotedColumnParser(delimiter))
}

const quotedColumnParser: Parser<string> = mapParser(
	combineParsers(makeZeroOrMoreParser(makeCharacterParser(" ")), parseQuotedColumn, makeZeroOrMoreParser(makeCharacterParser(" "))),
	(result) => result[1],
)

/**
 * Parse a column that is nonempty, doesn't contain any quotes, newlines, or delimiters
 * @param delimiter
 * @returns {Parser<*>}
 */
function makeUnquotedColumnParser(delimiter: string): Parser<string> {
	// We don't use trim spaces parser because it won't remove trailing spaces in this case
	return mapParser(makeZeroOrMoreParser(makeNotOneOfCharactersParser(['"', "\n", delimiter])), (arr) => arr.join(""))
}

/**
 * Parse the inside of a double-quote quoted string, returning the string without the outer double-quotes
 * @param iterator
 */
function parseQuotedColumn(iterator: StringIterator): string {
	const initial = iterator.next()

	if (initial.done || initial.value !== '"') {
		throw new ParserError("expected quote")
	}

	let result = ""

	while (true) {
		const token = iterator.next()

		if (token.done) {
			throw new ParserError("unexpected end of input")
		}

		if (token.value === '"') {
			// We will either be at an escaped quote, or at the end of the string
			if (iterator.peek() === '"') {
				// It's escaped, append only a single quote to the result
				iterator.next()
				result += '"'
			} else {
				// it's not escaped, so it's the final delimiter
				break
			}
		} else {
			result += token.value
		}
	}

	return result
}
