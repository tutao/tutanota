//@flow
import type {EmailTemplate} from "../../api/entities/tutanota/EmailTemplate"
import {TEMPLATE_SHORTCUT_PREFIX} from "./TemplatePopupModel"


export function searchInTemplates(input: string, allTemplates: $ReadOnlyArray<EmailTemplate>): $ReadOnlyArray<EmailTemplate> {
	// filter out whitespaces and prepare case insensitive search.
	let allQueryWords = input.toLowerCase().trim().split(" ").filter(word => word.trim().length > 0)
	if (allQueryWords.length === 0) {
		return allTemplates
	}
	const firstWord = allQueryWords[0];
	if (firstWord.startsWith(TEMPLATE_SHORTCUT_PREFIX)) { // search in tag only
		const newQueryString = firstWord.substring(TEMPLATE_SHORTCUT_PREFIX.length)
		return allTemplates.filter(template => template.tag.toLowerCase().startsWith(newQueryString))
	} else {
		// full text search in all other attributes
		// all words must match in either title, tag or text of content
		return allTemplates.filter(template => {
			return findMatch(allQueryWords, template.title) //search in title
				|| findMatch(allQueryWords, template.tag) //search in tag
				|| template.contents.some(content => findMatch(allQueryWords, content.text)) //search in contents
		})
	}
}

/**
 * Checks if all given words are included in the given content and returns true in this case. Returns false otherwise.
 */
function findMatch(queryWords: Array<string>, content: string): boolean {
	return queryWords.every(queryWord => content.toLowerCase().includes(queryWord))
}
