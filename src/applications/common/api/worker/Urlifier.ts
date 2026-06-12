import linkifyHtml from "linkify-html"

/**
 * Replaces plain text links in the given text by html links. Already existing html links are not changed.
 * @param html The text to be checked for links.
 * @returns {string} The text with html links.
 */
export function urlify(html: string): string {
	const docTypeDeclaration = "DOCTYPE html PUBLIC"
	const indexOfDoctypeDeclaration = html.indexOf(docTypeDeclaration)
	if (indexOfDoctypeDeclaration > -1) {
		const isFollowedBySpace = html.at(indexOfDoctypeDeclaration + docTypeDeclaration.length) === " "
		if (!isFollowedBySpace) {
			// Add a space to prevent dead loops from happening;
			// See: (https://github.com/nfrasser/linkifyjs/issues/429#event-25462649063)
			html = html.replace(docTypeDeclaration, docTypeDeclaration + " ")
		}
	}
	return linkifyHtml(html, {
		defaultProtocol: "https",
		attributes: {
			rel: "noopener noreferrer",
		},
		target: "_blank",
	})
}
