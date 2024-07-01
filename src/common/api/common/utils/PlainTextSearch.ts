type SearchMatch<T> = {
	entry: T
	// the input entry in which we searches
	completeMatch: number
	//the number of occurences of the entire queryString in the searched entry
	fullWordMatches: number
	//the number of occurences of any queryWord from the splitted queryString
	partialWordMatches: number
	// the number of occurences a queryWord is part of the searched entry
	matchedWords: Array<string> //all distinct queryWords that were found
}

/**
 * @param queryString List of query words separated by whitespace
 * @param entries Plain text entries to search in.
 * @param attributeNames The attributes that are searched within entries. The list should be sorted by priority
 * @param markHits If set to true the hits will be marked with html tag <mark>
 * @returns a list of entries, sorted by priority, that match the query string
 */
export function search<T extends Record<string, any>>(
	queryString: string,
	entries: ReadonlyArray<T>,
	attributeNames: string[],
	markHits: boolean = false,
): ReadonlyArray<T> {
	entries = entries.map((e) => Object.assign({}, e)) // create a copy in order to not override the original values

	if (queryString) {
		return _search<T>(queryString, entries, attributeNames, markHits)
			.filter((match) => match.matchedWords.length > 0) // a and be are two matches that refer to entries (e.g. faqs)
			.sort((a, b) => {
				if (a.completeMatch !== b.completeMatch) {
					return b.completeMatch - a.completeMatch
				}

				if (a.matchedWords.length !== b.matchedWords.length) {
					return b.matchedWords.length - a.matchedWords.length
				} else if (a.fullWordMatches !== b.fullWordMatches) {
					return b.fullWordMatches - a.fullWordMatches
				} else if (a.partialWordMatches !== b.partialWordMatches) {
					return b.partialWordMatches - a.partialWordMatches
				} else {
					return 0
				}
			})
			.map((match) => match.entry)
	} else {
		return entries
	}
}

function _findMatchInEntry<T>(
	nestedEntry: Record<string, any>,
	attributeName: string,
	queryString: string,
	queryWords: Array<string>,
	searchMatch: SearchMatch<T>,
	markHits: boolean,
) {
	const value = nestedEntry[attributeName]

	if (!value || typeof value !== "string") {
		return
	}

	const splittedValue = value.split(/(<[^>]+>)/gi) // we split the array into words that are html markup and non html markup words as we don't want to search in html tags

	// find all matches with the full and exact queryString
	const completeRegExp = new RegExp(escapeRegExp(queryString), "gi")
	searchMatch.completeMatch += _findMatches(splittedValue, completeRegExp, false).hits
	// create regualar expression to match whole words, case insensitive
	const fullWordRegExp = new RegExp(queryWords.map((queryWord) => "\\b" + escapeRegExp(queryWord) + "\\b").join("|"), "gi")
	searchMatch.fullWordMatches += _findMatches(splittedValue, fullWordRegExp, false).hits
	// regular expression for finding all matches (including partial matches)
	let regExp = new RegExp(queryWords.map((queryWord) => escapeRegExp(queryWord)).join("|"), "gi")

	let findResult = _findMatches(splittedValue, regExp, markHits)

	if (markHits && findResult.hits > 0) {
		nestedEntry[attributeName] = splittedValue.join("")
	}

	for (const queryWord of findResult.matchedQueryWords) {
		if (searchMatch.matchedWords.indexOf(queryWord) === -1) {
			searchMatch.matchedWords.push(queryWord)
		}
	}

	if (findResult.hits > 0) {
		searchMatch.partialWordMatches += findResult.hits
	}
}

//export only for testing
export function _search<T extends Record<string, any>>(
	queryString: string,
	entries: ReadonlyArray<T>,
	attributeNames: string[],
	markHits: boolean,
): SearchMatch<T>[] {
	let queryWords = queryString
		.toLocaleLowerCase()
		.split(" ")
		.map((word) => word.trim())
		.filter((word) => word.length > 0)
	return entries.map((entry) => {
		const searchMatch = {
			entry,
			completeMatch: 0,
			fullWordMatches: 0,
			partialWordMatches: 0,
			matchedWords: [],
		}
		for (const name of attributeNames) {
			const nestedAttributes = name.split(".")
			if (nestedAttributes.length === 1) {
				// no nesting regular value check
				_findMatchInEntry(entry, nestedAttributes[0], queryString, queryWords, searchMatch, markHits)
			} else if (nestedAttributes.length === 2) {
				// We only accept arrays that contain objects for now.
				const [nestedArrayName, nestedEntryAttributeName] = nestedAttributes
				// @ts-ignore
				const nestedArray: Array<Record<string, any>> = entry[nestedArrayName]

				if (Array.isArray(nestedArray)) {
					for (const nestedEntry of nestedArray) {
						_findMatchInEntry(nestedEntry, nestedEntryAttributeName, queryString, queryWords, searchMatch, markHits)
					}
				}
			}
		}
		return searchMatch
	})
}

type FindResult = {
	hits: number
	matchedQueryWords: string[]
}

//export for testing only
export function _findMatches(splittedValue: Array<string>, regExp: RegExp, markHits: boolean): FindResult {
	return splittedValue.reduce(
		(sum, value, index) => {
			if (value.trim().length === 0 || value.startsWith("<")) {
				return sum
			}

			splittedValue[index] = value.replace(regExp, (match) => {
				sum.hits++

				if (sum.matchedQueryWords.indexOf(match.toLowerCase()) === -1) {
					sum.matchedQueryWords.push(match.toLowerCase())
				}

				if (markHits && match.length > 2) {
					// only mark matches that are longer then two characters.
					// We could mark these small matches but we should check that the match is a whole word then.
					return `<mark>${match}</mark>`
				} else {
					return match
				}
			})
			return sum
		},
		{
			hits: 0,
			matchedQueryWords: [] as string[],
		},
	)
}

// see https://stackoverflow.com/a/6969486
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}
