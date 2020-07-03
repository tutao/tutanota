// @flow

type SearchMatch = {
	entry: any;
	fullMatches: number;
	matchedWords: Array<string>;
	attributePriority: number;
}

/**
 * @param queryString
 * @param entries
 * @param attributeNames The attributes that are searched within entries. The list should be sorted by priority
 * @returns a list of entries, sorted by priority, that match the query string
 */
export function search<T>(queryString: string, entries: T[], attributeNames: string[], markHits: boolean = false): T[] {
	let start = new Date().getTime()
	entries = entries.map(e => Object.assign({}, e)) // create a copy in order to not override the original values
	if (queryString) {
		let matchingEntries = _search(queryString, entries, attributeNames, markHits)
		matchingEntries = matchingEntries.filter(match => match.matchedWords.length > 0)
		                                 // a and be are two matches that refer to entries (e.g. faqs)
		                                 .sort((a, b) => {
			                                 if (a.fullMatches != b.fullMatches) {
				                                 return b.fullMatches - a.fullMatches
			                                 } else if (a.matchedWords.length != b.matchedWords.length) {
				                                 return b.matchedWords.length - a.matchedWords.length
			                                 } else {
				                                 return a.attributePriority - b.attributePriority
			                                 }
		                                 })
		                                 .map(match => match.entry)
		// console.log("search time", new Date().getTime() - start)
		return matchingEntries
	} else {
		return entries
	}
}

export function _search(queryString: string, entries: any[], attributeNames: string[], markHits: boolean): SearchMatch[] {
	let queryWords = queryString.split(" ")
	return entries.map(entry => {
		let fullMatches = 0
		const matchedWords = []
		let attributePriority = 99
		attributeNames.forEach((name, index) => {
			let value = entry[name]
			let splittedValue = value.split(/(<[^>]+>)/gi) // we split the array into words that are html markup and non html markup words as we don't want to search in html tags
			let fullRegExp = new RegExp(queryWords.map(queryWord => "[\\s\\.\\,?!]" + escapeRegExp(queryWord)
				+ "[\\s\\.\\,?!]").join("|"), "gi")
			fullMatches += _findMatches(splittedValue, fullRegExp, false).hits

			let regExp = new RegExp(queryWords.map(queryWord => escapeRegExp(queryWord)).join("|"), "gi")
			let findResult = _findMatches(splittedValue, regExp, markHits)

			if (markHits && findResult.hits > 0) {
				entry[name] = splittedValue.join("")
			}
			findResult.matchedQueryWords.forEach(queryWord => {
				if (matchedWords.indexOf(queryWord) == -1) {
					matchedWords.push(queryWord)
				}
			})
			if (findResult.hits > 0 && index < attributePriority) {
				attributePriority = index
			}
		})

		return {
			entry,
			fullMatches: fullMatches,
			matchedWords: matchedWords,
			attributePriority
		}
	})
}

type FindResult = {
	hits: number;
	matchedQueryWords: string[];
}

export function _findMatches(splittedValue: Array<string>, regExp: RegExp, markHits: boolean): FindResult {
	return splittedValue.reduce((sum, current, index) => {
		if (current.trim().length === 0 || current.startsWith("<")) {
			return sum
		}
		splittedValue[index] = current.replace(regExp, (one) => {
			sum.hits++
			if (sum.matchedQueryWords.indexOf(one.toLowerCase()) == -1) {
				sum.matchedQueryWords.push(one.toLowerCase())
			}
			if (markHits) {
				return `<mark>${one}</mark>`
			} else {
				return one
			}
		})
		return sum
	}, {hits: 0, matchedQueryWords: []})
}

// see https://stackoverflow.com/a/6969486
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}