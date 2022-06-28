import DOMPurify, {Config, DOMPurifyI, HookEvent} from "dompurify"
import {ReplacementImage} from "../gui/base/icons/Icons"
import {client} from "./ClientDetector"
import {downcast, stringToUtf8Uint8Array, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import {DataFile} from "../api/common/DataFile"
// the svg data string must contain ' instead of " to avoid display errors in Edge
// '#' character is reserved in URL and FF won't display SVG otherwise
export const PREVENT_EXTERNAL_IMAGE_LOADING_ICON: string = "data:image/svg+xml;utf8," + ReplacementImage.replace(/"/g, "'").replace(/#/g, "%23")
const EXTERNAL_CONTENT_ATTRS = ["src", "poster", "srcset", "background"] // background attribute is deprecated but still used in common browsers

type SanitizeConfigExtra = {
	blockExternalContent: boolean
	allowRelativeLinks: boolean
	usePlaceholderForInlineImages: boolean
}
const DEFAULT_CONFIG_EXTRA: SanitizeConfigExtra = {
	blockExternalContent: true,
	allowRelativeLinks: false,
	usePlaceholderForInlineImages: true,
}

export type SanitizeResult = {
	text: string
	externalContent: Array<string>
	inlineImageCids: Array<string>
	links: Array<HTMLElement>
}
type SanitizeConfig = SanitizeConfigExtra & DOMPurify.Config

export type Link = HTMLElement

export type SanitizedHTML = {
	html: DocumentFragment
	externalContent: Array<string>
	inlineImageCids: Array<string>
	links: Array<Link>
}


// for target = _blank, controls for audio element, cid for embedded images to allow our own cid attribute
const ADD_ATTR = ["target", "controls", "cid"] as const
// poster for video element.
const ADD_URI_SAFE_ATTR = ["poster"] as const
// prevent loading of external fonts,
const FORBID_TAGS = ["style"] as const

const HTML_CONFIG: DOMPurify.Config & {RETURN_DOM_FRAGMENT?: undefined, RETURN_DOM?: undefined} = {
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
} as const

const SVG_CONFIG: DOMPurify.Config & {RETURN_DOM_FRAGMENT?: undefined, RETURN_DOM?: undefined} = {
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	NAMESPACE: "http://www.w3.org/2000/svg"
} as const

const FRAGMENT_CONFIG: DOMPurify.Config & {RETURN_DOM_FRAGMENT: true} = {
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	RETURN_DOM_FRAGMENT: true,
	ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|tutatemplate):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
} as const

type BaseConfig = typeof HTML_CONFIG | typeof SVG_CONFIG | typeof FRAGMENT_CONFIG

export class HtmlSanitizer {
	private externalContent!: Array<string>
	private inlineImageCids!: Array<string>
	private links!: Array<Link>
	private purifier!: DOMPurifyI

	constructor() {
		if (DOMPurify.isSupported) {
			this.purifier = DOMPurify
			// Do changes in afterSanitizeAttributes and not afterSanitizeElements so that images are not removed again because of the SVGs.
			this.purifier.addHook("afterSanitizeAttributes", this.afterSanitizeAttributes.bind(this))
		}
	}

	/**
	 * Sanitizes the given html. Returns as HTML
	 */
	sanitizeHTML(html: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizeResult {
		const config = this.init(HTML_CONFIG, configExtra ?? {})
		const cleanHtml = this.purifier.sanitize(html, config)
		return {
			text: cleanHtml,
			externalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links,
		}
	}

	/**
	 * Sanitizes the given SVG. Returns as SVG
	 */
	sanitizeSVG(svg: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizeResult {
		const config = this.init(SVG_CONFIG, configExtra ?? {})
		const cleanSvg = this.purifier.sanitize(svg, config)
		return {
			text: cleanSvg,
			externalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links,
		}
	}

	/**
	 * inline images are attachments that are rendered as part of an <img> tag with a blob URL in the
	 * mail body when it's displayed
	 *
	 * svg images can contain malicious code, so we need to sanitize them before we display them.
	 * DOMPurify can do that, but can't handle the xml declaration at the start of well-formed svg documents.
	 *
	 * 1. parse the document as xml
	 * 2. strip the declaration
	 * 3. sanitize
	 * 4. add the declaration back on
	 *
	 * NOTE: currently, we only allow UTF-8 inline SVG.
	 * NOTE: SVG with incompatible encodings will be replaced with an empty file.
	 *
	 * @param dirtyFile the svg DataFile as received in the mail
	 * @returns clean a sanitized svg document as a DataFile
	 */
	sanitizeInlineAttachment(dirtyFile: DataFile): DataFile {
		if (dirtyFile.mimeType === "image/svg+xml") {
			let cleanedData = Uint8Array.from([])
			try {
				const dirtySVG = utf8Uint8ArrayToString(dirtyFile.data)
				const parser = new DOMParser()
				const dirtyTree = parser.parseFromString(dirtySVG, "image/svg+xml")
				const errs = dirtyTree.getElementsByTagName("parsererror")
				if (errs.length === 0) {
					const svgElement = dirtyTree.getElementsByTagName("svg")[0]
					if (svgElement != null) {
						const config = this.init(SVG_CONFIG, {})
						const cleanText = this.purifier.sanitize(svgElement.outerHTML, config)
						cleanedData = stringToUtf8Uint8Array('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + cleanText)
					}
				} else {
					console.log("svg sanitization failed, possibly due to wrong input encoding.")
				}
			} catch (e) {
				console.log("svg sanitization failed")
			}
			dirtyFile.data = cleanedData
		}
		return dirtyFile
	}

	/**
	 * Sanitizes given HTML. Returns a DocumentFragment instead of an HTML string
	 */
	sanitizeFragment(html: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizedHTML {
		const config = this.init(FRAGMENT_CONFIG, configExtra ?? {})
		const cleanFragment = this.purifier.sanitize(html, config)
		return {
			html: cleanFragment,
			externalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links,
		}
	}

	private init<T extends BaseConfig>(config: T, configExtra: Partial<SanitizeConfigExtra>): SanitizeConfigExtra & T {
		this.externalContent = []
		this.inlineImageCids = []
		this.links = []
		return Object.assign({}, config, DEFAULT_CONFIG_EXTRA, configExtra)
	}

	private afterSanitizeAttributes(currentNode: Element, data: HookEvent, config: Config) {
		const typedConfig = config as SanitizeConfig
		// remove custom css classes as we do not allow style definitions. custom css classes can be in conflict to our self defined classes.
		// just allow our own "tutanota_quote" class and MsoListParagraph classes for compatibility with Outlook 2010/2013 emails. see main-styles.js
		let allowedClasses = ["tutanota_quote", "MsoListParagraph", "MsoListParagraphCxSpFirst", "MsoListParagraphCxSpMiddle", "MsoListParagraphCxSpLast"]

		if (currentNode.classList) {
			let cl = currentNode.classList

			for (let i = cl.length - 1; i >= 0; i--) {
				const item = cl.item(i)

				if (item && allowedClasses.indexOf(item) === -1) {
					cl.remove(item)
				}
			}
		}

		this.replaceAttributes(currentNode as HTMLElement, typedConfig)

		this.processLink(currentNode as HTMLElement, typedConfig)

		return currentNode

	}

	private replaceAttributes(htmlNode: HTMLElement, config: SanitizeConfig) {
		if (htmlNode.attributes) {
			this.replaceAttributeValue(htmlNode, config)
		}

		if (htmlNode.style) {
			if (config.blockExternalContent) {
				if (htmlNode.style.backgroundImage) {
					//console.log(htmlNode.style.backgroundImage)
					this.replaceStyleImage(htmlNode, "backgroundImage", false)

					htmlNode.style.backgroundRepeat = "no-repeat"
				}

				if (htmlNode.style.listStyleImage) {
					this.replaceStyleImage(htmlNode, "listStyleImage", true)
				}

				if (htmlNode.style.content) {
					this.replaceStyleImage(htmlNode, "content", true)
				}

				if (htmlNode.style.cursor) {
					this.removeStyleImage(htmlNode, "cursor")
				}

				if (htmlNode.style.filter) {
					this.removeStyleImage(htmlNode, "filter")
				}
			}

			// Disallow position because you can do bad things with it and it also messes up layout
			// Do this unconditionally, independent from the external content blocking.
			if (htmlNode.style.position) {
				htmlNode.style.removeProperty("position")
			}
		}
	}

	private replaceAttributeValue(htmlNode: HTMLElement, config: SanitizeConfig) {
		EXTERNAL_CONTENT_ATTRS.forEach(attrName => {
			let attribute = htmlNode.attributes.getNamedItem(attrName)

			if (attribute) {
				if (config.usePlaceholderForInlineImages && attribute.value.startsWith("cid:")) {
					// replace embedded image with local image until the embedded image is loaded and ready to be shown.
					const cid = attribute.value.substring(4)

					this.inlineImageCids.push(cid)

					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON
					htmlNode.setAttribute("cid", cid)
					htmlNode.classList.add("tutanota-placeholder")
				} else if (config.blockExternalContent && attribute.name === "srcset") {
					this.externalContent.push(attribute.value)

					htmlNode.removeAttribute("srcset")
					htmlNode.setAttribute("src", PREVENT_EXTERNAL_IMAGE_LOADING_ICON)
					htmlNode.style.maxWidth = "100px"
				} else if (config.blockExternalContent && !attribute.value.startsWith("data:") && !attribute.value.startsWith("cid:")) {
					this.externalContent.push(attribute.value)

					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON
					htmlNode.attributes.setNamedItem(attribute)
					htmlNode.style.maxWidth = "100px"
				}
			}
		})
	}

	private removeStyleImage(htmlNode: HTMLElement, styleAttributeName: string) {
		let value = (htmlNode.style as any)[styleAttributeName]

		if (value.match(/url\(/)) {
			this.externalContent.push(value)

			htmlNode.style.removeProperty(styleAttributeName)
		}
	}

	private replaceStyleImage(htmlNode: HTMLElement, styleAttributeName: string, limitWidth: boolean) {
		let value = (htmlNode.style as any)[styleAttributeName]

		if (value.match(/^url\(/) && !value.match(/^url\(["']?data:/)) {
			// remove surrounding url definition. url(<link>)
			value = value.replace(/^url\("*/, "")
			value = value.replace(/"*\)$/, "")

			this.externalContent.push(value)

			;(htmlNode.style as any)[styleAttributeName] = 'url("' + PREVENT_EXTERNAL_IMAGE_LOADING_ICON + '")'

			if (limitWidth) {
				htmlNode.style.maxWidth = "100px"
			}
		}
	}

	private processLink(currentNode: HTMLElement, config: SanitizeConfig) {
		// set target="_blank" for all links
		// collect them
		if (
			currentNode.tagName &&
			(currentNode.tagName.toLowerCase() === "a" || currentNode.tagName.toLowerCase() === "area" || currentNode.tagName.toLowerCase() === "form")
		) {
			const href = currentNode.getAttribute("href")
			href && this.links.push(currentNode)

			if (config.allowRelativeLinks || !href || isAllowedLink(href)) {
				currentNode.setAttribute("rel", "noopener noreferrer")
				currentNode.setAttribute("target", "_blank")
			} else if (href.trim() === "{link}") {
				// notification mail template
				downcast(currentNode).href = "{link}"
				currentNode.setAttribute("rel", "noopener noreferrer")
				currentNode.setAttribute("target", "_blank")
			} else {
				console.log("Relative/invalid URL", currentNode, href)
				downcast(currentNode).href = "javascript:void(0)"
			}
		}
	}
}

function isAllowedLink(link: string): boolean {
	if (client.isIE()) {
		// No support for creating URLs in IE11
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