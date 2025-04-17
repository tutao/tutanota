import { escapeRegExp } from "./PlainTextSearch"
import { isEmpty } from "@tutao/tutanota-utils"

/**
 * A token that was found in {@link splitQuery}
 */
export interface SearchToken {
	token: string
	exact: boolean
}

/**
 * Split query into search tokens
 *
 * Words and phrases in quotes are matched exactly, where words that are not in quotes are matched partially (i.e. as a
 * prefix).
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
 * Result of {@link highlightTextInQuery}
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
export function highlightTextInQuery(text: string, query: readonly SearchToken[]): HighlightSubstring[] {
	// Start with an initial substring which is just the entire string.
	//
	// If, for some reason, none of the tokens are found, then this is all we'll return.
	let substrings: HighlightSubstring[] = [{ text, highlighted: false }]

	// Go through each search token and find instances of it in our substrings.
	for (const token of query) {
		const newStrings: HighlightSubstring[] = []
		for (const substring of substrings) {
			// This substring is already to be marked/highlighted; do not search inside of it.
			if (substring.highlighted) {
				newStrings.push(substring)
				continue
			}

			// Continue going through the text until we either run out of text or the token is not found anymore.
			let text = substring.text
			while (text.length !== 0) {
				// Start with a word boundary since, in neither case, can we match non-suffixes.
				let prefix = "\\b"

				if (!isEmpty(newStrings)) {
					// Avoid matching the start of a string if we've already split the string.
					//
					// For example, if we search for "cat" and "dog" and the text is "catdog dog", we want to match
					// "cat" and the second "dog", but avoid matching the first "dog" since it isn't actually the start
					// of a word (as the actual start of the word - "cat" - is now in a different substring).
					//
					// To do this, we prepend a negative lookbehind that negates "^" (the start of the string).
					prefix = `(?<!^)${prefix}`
				}

				// In case the user enters special characters, we want to avoid using those literally in the regexp.
				const escapedToken = escapeRegExp(token.token)

				// For exact search, also append a word boundary; otherwise we will just match start of a word boundary
				// (partial word search)
				const suffix = token.exact ? "\\b" : ""

				// Combine to form the regex
				const search = new RegExp(`${prefix}${escapedToken}${suffix}`, "gi")

				let found = text.search(search)
				if (found < 0) {
					// not found
					break
				}

				// Get all text before the search result
				const beforeFound = text.slice(0, found)

				// ...and all text after the search result
				const afterFoundIndex = found + token.token.length
				const afterFound = text.slice(afterFoundIndex)

				// ...and lastly the search result itself
				const foundString = text.slice(found, afterFoundIndex)

				if (beforeFound !== "") {
					// if we have any text found before the search result, we want to add it
					//
					// due to the above negative lookbehind, this can only happen if this is the first substring
					newStrings.push({
						text: beforeFound,
						highlighted: false,
					})
				}

				// Push our actual search result; we can't just push token.token as we want to preserve capitalization
				newStrings.push({
					text: foundString,
					highlighted: true,
				})

				text = afterFound
			}

			// If we have any text left, re-insert it so it can be searched again with the next token
			if (text.length !== 0) {
				newStrings.push({
					text,
					highlighted: false,
				})
			}
		}
		substrings = newStrings
	}

	return substrings
}
