import m, { Children } from "mithril"
import { SearchToken, splitTextForHighlighting } from "../api/common/utils/QueryTokenUtils"

/**
 * Process {@param text} highlighting {@param query} occurrences.
 */
export function highlightTextInQueryAsChildren(text: string, query: readonly SearchToken[]): Children {
	return splitTextForHighlighting(text, query).map((t) => {
		if (t.highlighted) {
			return m("mark.search-highlight", t.text)
		} else {
			return t.text
		}
	})
}
