import type {EmailTemplate} from "../../api/entities/tutanota/TypeRefs.js"
import {TEMPLATE_SHORTCUT_PREFIX} from "./TemplatePopupModel"
import {search} from "../../api/common/utils/PlainTextSearch"

export function searchInTemplates(input: string, allTemplates: ReadonlyArray<EmailTemplate>): ReadonlyArray<EmailTemplate> {
	if (input.startsWith(TEMPLATE_SHORTCUT_PREFIX)) {
		// search in tag only
		const newQueryString = input.substring(TEMPLATE_SHORTCUT_PREFIX.length)
		return search(newQueryString, allTemplates, ["tag"], false)
	} else {
		return search(input, allTemplates, ["tag", "title", "contents.text"], false)
	}
}