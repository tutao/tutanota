import { escapeRegExp } from "./PlainTextSearch"
import { assertNotNull, isEmpty } from "@tutao/tutanota-utils"

/**
 * A token that was found in {@link splitQuery}
 */
export interface SearchToken {
	token: string
	exact: boolean
}

/**
 * Split query into simple search tokens
 *
 * Words and phrases in quotes are matched exactly, where words that are not in quotes are matched partially (i.e. as a
 * prefix).
 *
 * Note that this will not split CJK tokens, thus non-exact tokens can still be split further by a smarter tokenizer.
 *
 * @param query query to split
 */
export function splitQuery(query: string): SearchToken[] {
	const tokens: SearchToken[] = []

	let quoted = false
	for (const block of query.split('"')) {
		if (quoted) {
			// in quotes; match an exact token or phrase (e.g. "free" will not match "freedom")
			const trimmed = block.trim()
			if (trimmed !== "") {
				tokens.push({
					token: trimmed,
					exact: true,
				})
			}
		} else {
			// split into words and, for each word, match the start of a token (e.g. "free"* will match "freedom")
			for (const word of block.split(/\s+/)) {
				if (word !== "") {
					tokens.push({
						token: word,
						exact: false,
					})
				}
			}
		}
		quoted = !quoted
	}

	return tokens
}

/**
 * Result of {@link splitTextForHighlighting}
 */
export interface HighlightSubstring {
	text: string
	highlighted: boolean
}

/**
 * Split text into substrings based on search tokens.
 *
 * When joined, these substrings can be used to re-create the text, but with highlighting inlined.
 *
 * For example, if the query is 'tuta' (non-exact) and the text is 'Tutanota is now Tuta', you will get:
 *
 * <pre>
 * [
 *     { text: "Tuta", highlighted: true },
 *     { text: "nota is now ", highlighted: false },
 *     { text: "Tuta", highlighted: true },
 * ]
 * </pre>
 *
 * @param text  text to match against
 * @param query tokens to search with (see {@link splitQuery})
 */
export function splitTextForHighlighting(text: string, query: readonly SearchToken[]): HighlightSubstring[] {
	// Re-return the text if there is nothing to highlight to avoid searching for literal nothingness.
	if (isEmpty(query)) {
		return [{ text, highlighted: false }]
	}

	// Build it into a regex with an or (|) expression.
	const querySorted = query.map(({ token }) => escapeRegExp(token)).join("|")
	const search = new RegExp(`(${querySorted})`, "gi")

	// Next, use matchAll to find all results
	const found = text.matchAll(search)

	// Go through all search results and build our substrings
	const substrings: HighlightSubstring[] = []
	let offset = 0
	for (const foundString of found) {
		// Get all text before the search result (foundString.index should never be null from string.prototype.matchAll)
		const beforeFound = text.slice(offset, assertNotNull(foundString.index))
		const found = foundString[0] // refers to the string that was found

		if (beforeFound !== "") {
			// if we have any text found before the search result, we want to add it
			substrings.push({
				text: beforeFound,
				highlighted: false,
			})
		}

		// Push our actual search result
		substrings.push({
			text: found,
			highlighted: true,
		})

		offset += found.length + beforeFound.length
	}

	// Any remaining text can be reinserted
	if (offset < text.length) {
		substrings.push({
			text: text.slice(offset),
			highlighted: false,
		})
	}

	return substrings
}
