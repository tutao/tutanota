// @flow

import type {KnowledgeBaseEntry} from "../../api/entities/tutanota/KnowledgeBaseEntry"

export function knowledgeBaseSearch(input: string, allEntries: $ReadOnlyArray<KnowledgeBaseEntry>): Array<KnowledgeBaseEntry> {
	let matchedEntries = []
	let queryWords = input.toLowerCase().trim().split(" ")
	for (const queryString of queryWords) {
		if (queryString) {
			allEntries.forEach(entry => {
				let entryTitle = entry.title.toLowerCase()
				let entryKeywords = entry.keywords
				//search in title
				if (entryTitle.includes(queryString) && !matchedEntries.includes(entry)) {
					matchedEntries.push(entry)
				}
				//search in keywords
				entryKeywords.forEach(k => {
					let keyword = k.keyword.toLowerCase()
					if (keyword.includes(queryString) && !matchedEntries.includes(entry)) {
						matchedEntries.push(entry)
					}
				})
			})
		}
	}
	return matchedEntries
}




