// @flow
import DOMPurify from "dompurify"
import {ReplacementImage} from "../gui/base/icons/Icons"
import {client} from "./ClientDetector"
import {downcast} from "@tutao/tutanota-utils"

// the svg data string must contain ' instead of " to avoid display errors in Edge
// '#' character is reserved in URL and FF won't display SVG otherwise
export const PREVENT_EXTERNAL_IMAGE_LOADING_ICON: string = 'data:image/svg+xml;utf8,'
	+ ReplacementImage.replace(/"/g, "'").replace(/#/g, "%23")

const EXTERNAL_CONTENT_ATTRS = ['src', 'poster', 'srcset', 'background'] // background attribute is deprecated but still used in common browsers

type SanitizeConfigExtra = {
	blockExternalContent: boolean,
	allowRelativeLinks: boolean,
	usePlaceholderForInlineImages: boolean
}
const DEFAULT_CONFIG_EXTRA: SanitizeConfigExtra = {
	blockExternalContent: true,
	allowRelativeLinks: false,
	usePlaceholderForInlineImages: true
}

export type SanitizeResult = {
	text: string,
	externalContent: Array<string>,
	inlineImageCids: Array<string>,
	links: Array<HTMLElement>,
}

type SanitizeConfig = SanitizeConfigExtra & SanitizeConfigBase

export type Link = HTMLElement
export type SanitizedHTML = {
	html: DocumentFragment,
	externalContent: Array<string>,
	inlineImageCids: Array<string>,
	links: Array<Link>
}


export class HtmlSanitizer {

	_externalContent: string[]
	_inlineImageCids: Array<string>
	_links: Array<Link>
	purifier: IDOMPurify

	constructor() {
		if (DOMPurify.isSupported) {
			this.purifier = DOMPurify
		} else {
			return
		}
		// Do changes in afterSanitizeAttributes and not afterSanitizeElements so that images are not removed again because of the SVGs.
		this.purifier.addHook('afterSanitizeAttributes', (currentNode, data, config: SanitizeConfig) => {
				// remove custom css classes as we do not allow style definitions. custom css classes can be in conflict to our self defined classes.
				// just allow our own "tutanota_quote" class and MsoListParagraph classes for compatibility with Outlook 2010/2013 emails. see main-styles.js
				let allowedClasses = [
					"tutanota_quote", "MsoListParagraph", "MsoListParagraphCxSpFirst", "MsoListParagraphCxSpMiddle", "MsoListParagraphCxSpLast"
				]
				if (currentNode.classList) {
					let cl = currentNode.classList;
					for (let i = cl.length - 1; i >= 0; i--) {
						const item = cl.item(i)
						if (allowedClasses.indexOf(item) === -1) {
							cl.remove(item);
						}
					}
				}

				this._replaceAttributes(currentNode, config)
				this._processLink(currentNode, config)

				return currentNode;
			}
		)
	}

	/**
	 * Sanitizes the given html.
	 * @param  html The html content to sanitize.
	 * @param _config
	 */
	sanitize(html: string, _config?: $Shape<SanitizeConfigExtra>): SanitizeResult {
		const config = this._prepareSanitize(html, _config || {})

		let cleanHtml = this.purifier.sanitize(html, config)
		return {
			text: cleanHtml,
			externalContent: this._externalContent,
			inlineImageCids: this._inlineImageCids,
			links: this._links
		}
	}

	/**
	 * Sanitizes given HTML. Returns DocumentFragment instead of string.
	 * @param html {string} HTML to sanitize
	 * @param _config
	 * @returns {{html: (DocumentFragment|HTMLElement|string), externalContent: string[]}}
	 */
	sanitizeFragment(html: string, _config?: $Shape<SanitizeConfigExtra>): SanitizedHTML {

		const base = this._prepareSanitize(html, _config || {})
		const config: SanitizeConfigBase & {RETURN_DOM_FRAGMENT: true} =
			Object.assign({}, base, {
				RETURN_DOM_FRAGMENT: true,
				ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|tutatemplate):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
			})

		return {
			html: this.purifier.sanitize(html, config),
			externalContent: this._externalContent,
			inlineImageCids: this._inlineImageCids,
			links: this._links
		}
	}

	_prepareSanitize(html: string, _config: $Shape<SanitizeConfigExtra>): SanitizeConfig {
		// must be set for use in dompurify hook
		this._externalContent = []
		this._inlineImageCids = []
		this._links = []

		const configBase: SanitizeConfigBase = {
			ADD_ATTR: ['target', 'controls', 'cid'], // for target = _blank, controls for audio element, cid for embedded images to allow our own cid attribute
			ADD_URI_SAFE_ATTR: ['poster'], // poster for video element.
			FORBID_TAGS: ['style'], // prevent loading of external fonts,
		}

		const configExtra = Object.assign({}, DEFAULT_CONFIG_EXTRA, _config)

		return Object.assign({}, configBase, configExtra)
	}

	_replaceAttributes(htmlNode: HTMLElement, config: SanitizeConfig) {
		if (htmlNode.attributes) {
			this._replaceAttributeValue(htmlNode, config);
		}
		if (htmlNode.style) {
			if (config.blockExternalContent) {
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
			// Disallow position because you can do bad things with it and it also messes up layout
			// Do this unconditionally, independent from the external content blocking.
			if (htmlNode.style.position) {
				htmlNode.style.removeProperty("position")
			}
		}
	}


	_replaceAttributeValue(htmlNode: HTMLElement, config: SanitizeConfig) {
		EXTERNAL_CONTENT_ATTRS.forEach((attrName) => {
			let attribute = htmlNode.attributes.getNamedItem(attrName)
			if (attribute) {
				if (config.usePlaceholderForInlineImages && attribute.value.startsWith("cid:")) {
					// replace embedded image with local image until the embedded image is loaded and ready to be shown.
					const cid = attribute.value.substring(4)
					this._inlineImageCids.push(cid)
					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON
					htmlNode.setAttribute("cid", cid)
					htmlNode.classList.add("tutanota-placeholder")
				} else if (config.blockExternalContent && attribute.name === "srcset") {
					this._externalContent.push(attribute.value)
					htmlNode.removeAttribute("srcset")
					htmlNode.setAttribute("src", PREVENT_EXTERNAL_IMAGE_LOADING_ICON)
					htmlNode.style.maxWidth = "100px"
				} else if (config.blockExternalContent && !attribute.value.startsWith("data:") && !attribute.value.startsWith("cid:")) {
					this._externalContent.push(attribute.value)
					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON
					htmlNode.attributes.setNamedItem(attribute)
					htmlNode.style.maxWidth = "100px"
				}
			}
		})

	}

	_removeStyleImage(htmlNode: HTMLElement, styleAttributeName: string) {
		let value = (htmlNode.style: any)[styleAttributeName]
		if (value.match(/url\(/)) {
			this._externalContent.push(value)
			htmlNode.style.removeProperty(styleAttributeName)
		}
	}

	_replaceStyleImage(htmlNode: HTMLElement, styleAttributeName: string, limitWidth: boolean) {
		let value = (htmlNode.style: any)[styleAttributeName]
		if (value.match(/^url\(/) && !value.match(/^url\(["']?data:/)) {
			// remove surrounding url definition. url(<link>)
			value = value.replace(/^url\("*/, "");
			value = value.replace(/"*\)$/, "");
			this._externalContent.push(value)
			;(htmlNode.style: any)[styleAttributeName] = 'url("' + PREVENT_EXTERNAL_IMAGE_LOADING_ICON + '")';
			if (limitWidth) {
				htmlNode.style.maxWidth = "100px"
			}
		}
	}

	_processLink(currentNode: HTMLElement, config: SanitizeConfig) {
		// set target="_blank" for all links
		// collect them
		if (currentNode.tagName && (
			currentNode.tagName.toLowerCase() === "a"
			|| currentNode.tagName.toLowerCase() === "area"
			|| currentNode.tagName.toLowerCase() === "form")
		) {
			const href = currentNode.getAttribute("href")
			href && this._links.push(currentNode)

			if (config.allowRelativeLinks || !href || isAllowedLink(href)) {
				currentNode.setAttribute('rel', 'noopener noreferrer')
				currentNode.setAttribute('target', '_blank')
			} else if (href.trim() === '{link}') {
				// notification mail template
				downcast(currentNode).href = '{link}'
				currentNode.setAttribute('rel', 'noopener noreferrer')
				currentNode.setAttribute('target', '_blank')
			} else {
				console.log("Relative/invalid URL", currentNode, href)
				downcast(currentNode).href = "javascript:void(0)"
			}
		}
	}
}

function isAllowedLink(link: string): boolean {
	if (client.isIE()) { // No support for creating URLs in IE11
		return true
	}
	try {
		// We create URL without explicit base (second argument). It is an error for relative links
		return new URL(link).protocol !== "file"
	} catch (e) {
		return false
	}
}

export const htmlSanitizer: HtmlSanitizer = new HtmlSanitizer()
