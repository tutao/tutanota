// @flow
import DOMPurify from "dompurify"
import {ReplacementImage} from "../gui/base/icons/Icons"

// the svg data string must contain ' instead of " to avoid display errors in Edge
// '#' character is reserved in URL and FF won't display SVG otherwise
export const PREVENT_EXTERNAL_IMAGE_LOADING_ICON = 'data:image/svg+xml;utf8,' + ReplacementImage.replace(/"/g, "'").replace(/#/g, "%23")

const EXTERNAL_CONTENT_ATTRS = ['src', 'poster', 'srcset', 'background'] // background attribute is deprecated but still used in common browsers

class HtmlSanitizer {

	_blockExternalContent: boolean
	_externalContent: string[]
	_inlineImageCids: Array<string>
	purifier: IDOMPurify

	constructor() {
		this._blockExternalContent = false
		if (DOMPurify.isSupported) {
			this.purifier = DOMPurify
		} else {
			return
		}
		this.purifier.addHook('afterSanitizeElements', (currentNode, data, config) => {
				// Do something with the current node and return it
				//console.log("afterSanitizeElements", currentNode.constructor, currentNode, data, config, "prevent: ", this._blockExternalContent, "style", currentNode.style)
				if (this._blockExternalContent) {
					this._preventExternalImageLoading(currentNode)
				}

				// remove custom css classes as we do not allow style definitions. custom css classes can be in conflict to our self defined classes.
				// just allow our own "tutanota_quote" class and MsoListParagraph classes for compatibility with Outlook 2010/2013 emails. see main-styles.js
				let allowedClasses = ["tutanota_quote", "MsoListParagraph", "MsoListParagraphCxSpFirst", "MsoListParagraphCxSpMiddle", "MsoListParagraphCxSpLast"]
				if (currentNode.classList) {
					let cl = currentNode.classList;
					for (let i = cl.length; i > 0; i--) {
						if (allowedClasses.indexOf(cl[0]) === -1) {
							cl.remove(cl[0]);
						}
					}
				}
				// set target="_blank" for all links
				if (currentNode.tagName && (
					currentNode.tagName.toLowerCase() === "a"
					|| currentNode.tagName.toLowerCase() === "area"
					|| currentNode.tagName.toLowerCase() === "form")) {
					currentNode.setAttribute('rel', 'noopener noreferrer')
					currentNode.setAttribute('target', '_blank')
				}

				return currentNode;
			}
		)
	}

	/**
	 * Sanitizes the given html.
	 * @param  html The html content to sanitize.
	 * @param  blockExternalContent True if external content should be blocked
	 */
	sanitize(html: string, blockExternalContent: boolean): SanitizeResult {
		const config = this._prepareSanitize(html, blockExternalContent)

		let cleanHtml = this.purifier.sanitize(html, config)
		return {"text": cleanHtml, "externalContent": this._externalContent, "inlineImageCids": this._inlineImageCids}
	}

	/**
	 * Sanitizes given HTML. Returns DocumentFragment instead of string.
	 * @param html {string} HTML to sanitize
	 * @param blockExternalContent
	 * @returns {{html: (DocumentFragment|HTMLElement|string), externalContent: string[]}}
	 */
	sanitizeFragment(html: string, blockExternalContent: boolean): {html: DocumentFragment, externalContent: Array<string>, inlineImageCids: Array<string>} {
		const config: SanitizeConfigBase & {RETURN_DOM_FRAGMENT: true} =
			Object.assign({}, this._prepareSanitize(html, blockExternalContent), {RETURN_DOM_FRAGMENT: true, ADD_ATTR: ['cid']}) // allow our own cid attribute
		return {html: this.purifier.sanitize(html, config), externalContent: this._externalContent, inlineImageCids: this._inlineImageCids}
	}

	_prepareSanitize(html: string, blockExternalContent: boolean): SanitizeConfigBase {
		// must be set for use in dompurify hook
		this._blockExternalContent = blockExternalContent;
		this._externalContent = []
		this._inlineImageCids = []

		return {
			ADD_ATTR: ['target', 'controls'], // for target = _blank, controls for audio element
			ADD_URI_SAFE_ATTR: ['poster'], // for video element
			FORBID_TAGS: ['style'] // prevent loading of external fonts
		}
	}

	_preventExternalImageLoading(htmlNode) {
		if (htmlNode.attributes) {
			this._replaceAttributeValue(htmlNode);
		}
		if (htmlNode.style) {
			if (htmlNode.style.backgroundImage) {
				//console.log(htmlNode.style.backgroundImage)
				this._replaceStyleImage(htmlNode, "backgroundImage", false)
				htmlNode.style.backgroundRepeat = "no-repeat"
			}
			if (htmlNode.style.listStyleImage) {
				this._replaceStyleImage(htmlNode, "listStyleImage", true)
			}
			if (htmlNode.style.content) {
				this._replaceStyleImage(htmlNode, "content", true)
			}
			if (htmlNode.style.cursor) {
				this._removeStyleImage(htmlNode, "cursor")
			}
			if (htmlNode.style.filter) {
				this._removeStyleImage(htmlNode, "filter")
			}
		}
	}


	_replaceAttributeValue(htmlNode) {
		EXTERNAL_CONTENT_ATTRS.forEach((attrName) => {
			let attribute = htmlNode.attributes.getNamedItem(attrName)
			if (attribute) {
				if (attribute.value.startsWith("cid:")) {
					this._inlineImageCids.push(attribute.value.substring(4))
				} else if (!attribute.value.startsWith("data:")) {
					this._externalContent.push(attribute.value)
					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON
					htmlNode.attributes.setNamedItem(attribute)
					htmlNode.style["max-width"] = "100px"
				}
			}
		})
	}

	_removeStyleImage(htmlNode, styleAttributeName: string) {
		let value = htmlNode.style[styleAttributeName]
		if (value.match(/url\(/)) {
			this._externalContent.push(value)
			htmlNode.style.removeProperty(styleAttributeName)
		}
	}

	_replaceStyleImage(htmlNode, styleAttributeName: string, limitWidth: boolean) {
		let value = htmlNode.style[styleAttributeName]
		if (value.match(/^url\(/)) {
			// remove surrounding url definition. url(<link>)
			value = value.replace(/^url\("*/, "");
			value = value.replace(/"*\)$/, "");
			this._externalContent.push(value)
			let newImage = 'url("' + PREVENT_EXTERNAL_IMAGE_LOADING_ICON + '")'
			htmlNode.style[styleAttributeName] = newImage;
			if (limitWidth) {
				htmlNode.style["max-width"] = "100px"
			}
		}
	}
}


export function stringifyFragment(fragment: DocumentFragment): string {
	let div = document.createElement("div")
	div.appendChild(fragment)
	return div.innerHTML
}

export const htmlSanitizer: HtmlSanitizer = new HtmlSanitizer()
