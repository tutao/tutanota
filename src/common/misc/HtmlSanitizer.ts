import DOMPurify, { Config, DOMPurifyI, HookEvent } from "dompurify"
import { ReplacementImage } from "../gui/base/icons/Icons"
import { downcast, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { DataFile } from "../api/common/DataFile"
import { encodeSVG } from "../gui/base/GuiUtils.js"

/** Data url for an SVG image that will be shown in place of external content. */
export const PREVENT_EXTERNAL_IMAGE_LOADING_ICON: string = encodeSVG(ReplacementImage)

// background attribute is deprecated but still used in common browsers
const EXTERNAL_CONTENT_ATTRS = Object.freeze([
	"src",
	"poster",
	"srcset",
	"background",
	"draft-src",
	"draft-srcset",
	"draft-xlink:href",
	"draft-href",
	"xlink:href",
	"href",
])

const DRAFT_ATTRIBUTES = ["draft-src", "draft-srcset", "draft-xlink:href", "draft-href"]

type SanitizeConfigExtra = {
	blockExternalContent: boolean
	allowRelativeLinks: boolean
	usePlaceholderForInlineImages: boolean
}

const DEFAULT_CONFIG_EXTRA: SanitizeConfigExtra = Object.freeze({
	blockExternalContent: true,
	allowRelativeLinks: false,
	usePlaceholderForInlineImages: true,
})

/** Result of sanitization operation with result in a string form */
export type SanitizedHTML = {
	/** Clean HTML text */
	html: string
	/** Number of blocked external content that was encountered */
	blockedExternalContent: number
	/** Collected cid: URLs, normally used for inline content */
	inlineImageCids: Array<string>
	/** Collected href link elements */
	links: Array<HTMLElement>
}

type SanitizeConfig = SanitizeConfigExtra & DOMPurify.Config

export type Link = HTMLElement

/** Result of sanitization operation with result in a form of a DocumentFragment */
export type SanitizedFragment = {
	/** Clean HTML fragment */
	fragment: DocumentFragment
	/** Number of blocked external content that was encountered */
	blockedExternalContent: number
	/** Collected cid: URLs, normally used for inline content */
	inlineImageCids: Array<string>
	/** Collected href link elements */
	links: Array<Link>
}

/** Allowing additional HTML attributes */
const ADD_ATTR = Object.freeze([
	// for target=_blank
	"target",
	// for audio element
	"controls",
	// for embedded images
	"cid",
	// to persist not loaded images
	"draft-src",
	"draft-srcset",
] as const)

/** These must be safe for URI-like values */
const ADD_URI_SAFE_ATTR = Object.freeze([
	// for video element
	"poster",
] as const)

/** Complete disallow some HTML tags. */
const FORBID_TAGS = Object.freeze([
	// prevent loading of external stylesheets and fonts by blocking the whole <style> tag
	"style",
] as const)

/** restricts the allowed protocols to some standard ones + our tutatemplate protocol that allows the knowledge base to link to email templates. */
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|tutatemplate):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i

const HTML_CONFIG: DOMPurify.Config & { RETURN_DOM_FRAGMENT?: undefined; RETURN_DOM?: undefined } = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	ALLOWED_URI_REGEXP,
} as const)
const SVG_CONFIG: DOMPurify.Config & { RETURN_DOM_FRAGMENT?: undefined; RETURN_DOM?: undefined } = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	NAMESPACE: "http://www.w3.org/2000/svg",
} as const)
const FRAGMENT_CONFIG: DOMPurify.Config & { RETURN_DOM_FRAGMENT: true } = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	RETURN_DOM_FRAGMENT: true,
	ALLOWED_URI_REGEXP,
} as const)

type BaseConfig = typeof HTML_CONFIG | typeof SVG_CONFIG | typeof FRAGMENT_CONFIG

/** Class to pre-process HTML/SVG content. */
export class HtmlSanitizer {
	private externalContent!: number
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
	sanitizeHTML(html: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizedHTML {
		const config = this.init(HTML_CONFIG, configExtra ?? {})
		const cleanHtml = this.purifier.sanitize(html, config)
		return {
			html: cleanHtml,
			blockedExternalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links,
		}
	}

	/**
	 * Sanitizes the given SVG. Returns as SVG
	 */
	sanitizeSVG(svg: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizedHTML {
		const config = this.init(SVG_CONFIG, configExtra ?? {})
		const cleanSvg = this.purifier.sanitize(svg, config)
		return {
			html: cleanSvg,
			blockedExternalContent: this.externalContent,
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
	sanitizeFragment(html: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizedFragment {
		const config = this.init(FRAGMENT_CONFIG, configExtra ?? {})
		const cleanFragment = this.purifier.sanitize(html, config)
		return {
			fragment: cleanFragment,
			blockedExternalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links,
		}
	}

	private init<T extends BaseConfig>(config: T, configExtra: Partial<SanitizeConfigExtra>): SanitizeConfigExtra & T {
		this.externalContent = 0
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
		// Don't allow inline images to have a bigger width than the email itself
		// Otherwise this would lead to weird rendering with very large images and pinch zoom
		// The order of the replacement should not be changed since maxWidth=100% is replaced with 100px in case of
		// placeholder images further below in the code
		if (htmlNode.tagName === "IMG") {
			htmlNode.style.maxWidth = "100%"
		}

		if (htmlNode.attributes) {
			this.replaceAttributeValue(htmlNode, config)
		}

		if (htmlNode.style) {
			if (config.blockExternalContent) {
				// for a decent table of where <image> CSS type can occur see https://developer.mozilla.org/en-US/docs/Web/CSS/image
				if (htmlNode.style.backgroundImage) {
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

				if (htmlNode.style.borderImageSource) {
					this.removeStyleImage(htmlNode, "border-image-source")
				}

				if (htmlNode.style.maskImage || htmlNode.style.webkitMaskImage) {
					this.removeStyleImage(htmlNode, "mask-image")
					this.removeStyleImage(htmlNode, "-webkit-mask-image")
				}

				if (htmlNode.style.shapeOutside) {
					this.removeStyleImage(htmlNode, "shape-outside")
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
		const nodeName = htmlNode.tagName.toLowerCase()

		for (const attrName of EXTERNAL_CONTENT_ATTRS) {
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
					this.externalContent++

					htmlNode.setAttribute("draft-srcset", attribute.value)
					htmlNode.removeAttribute("srcset")
					htmlNode.setAttribute("src", PREVENT_EXTERNAL_IMAGE_LOADING_ICON)
					htmlNode.style.maxWidth = "100px"
				} else if (
					config.blockExternalContent &&
					!attribute.value.startsWith("data:") &&
					!attribute.value.startsWith("cid:") &&
					!attribute.name.startsWith("draft-") &&
					!(nodeName === "a") &&
					!(nodeName === "area") &&
					!(nodeName === "base") &&
					!(nodeName === "link")
				) {
					// Since we are blocking href now we need to check if the attr isn't
					// being used by a valid tag (a, area, base, link)
					this.externalContent++

					htmlNode.setAttribute("draft-" + attribute.name, attribute.value)
					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON
					htmlNode.attributes.setNamedItem(attribute)
					htmlNode.style.maxWidth = "100px"
				} else if (!config.blockExternalContent && DRAFT_ATTRIBUTES.includes(attribute.name)) {
					if (attribute.name === "draft-src") {
						htmlNode.setAttribute("src", attribute.value)
						htmlNode.removeAttribute(attribute.name)
					} else if (attribute.name === "draft-href" || attribute.name === "draft-xlink:href") {
						const hrefTag = attribute.name === "draft-href" ? "href" : "xlink:href"
						htmlNode.setAttribute(hrefTag, attribute.value)
						htmlNode.removeAttribute(attribute.name)
					} else {
						htmlNode.setAttribute("srcset", attribute.value)
						htmlNode.removeAttribute(attribute.name)
					}
				}
			}
		}
	}

	/** NB! {@param cssStyleAttributeName} is a *CSS* name ("border-image-source" as opposed to "borderImageSource"). */
	private removeStyleImage(htmlNode: HTMLElement, cssStyleAttributeName: string) {
		let value = htmlNode.style.getPropertyValue(cssStyleAttributeName)

		if (value.match(/url\(/)) {
			this.externalContent++

			htmlNode.style.removeProperty(cssStyleAttributeName)
		}
	}

	/** {@param styleAttributeName} is a JS name for the style */
	private replaceStyleImage(htmlNode: HTMLElement, styleAttributeName: string, limitWidth: boolean) {
		let value: string = (htmlNode.style as any)[styleAttributeName]

		// if there's a `url(` anywhere in the value and if *the whole* value is not just data URL then replace the whole value with replacement URL
		// see tests for treacherous example but also
		//
		// ```css
		// background-image: linear-gradient(
		//     to bottom,
		//     rgba(255, 255, 0, 0.5),
		//     rgba(0, 0, 255, 0.5)
		//   ), url("catfront.png");
		// ```
		// in this case background-image can have multiple values but it's safe to just block the whole thing
		//
		// some examples where it can be inside a single <image> value:
		//
		// cross-fade(20% url(twenty.png), url(eighty.png))
		// image-set('test.jpg' 1x, 'test-2x.jpg' 2x)
		if (value.includes("url(") && value.match(/url\(/g)?.length !== value.match(/url\(["']?data:/g)?.length) {
			this.externalContent++
			;(htmlNode.style as any)[styleAttributeName] = `url("${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}")`

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
	try {
		// We create URL without explicit base (second argument). It is an error for relative links
		return new URL(link).protocol !== "file:"
	} catch (e) {
		return false
	}
}

export const htmlSanitizer: HtmlSanitizer = new HtmlSanitizer()
