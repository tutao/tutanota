//@flow
import linkifyHtml from "linkify/html"

/**
 * Replaces plain text links in the given text by html links. Already existing html links are not changed.
 * @param html The text to be checked for links.
 * @returns {string} The text with html links.
 */

export function urlify(html: string): string {
	return linkifyHtml(html, {
		attributes: {
			rel: "noopener noreferrer"
		},
		target: "_blank",
	})
}


