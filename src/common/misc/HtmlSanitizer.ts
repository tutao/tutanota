import { ReplacementImage } from "../gui/base/icons/Icons"
import { isEmpty, isNotNull, memoized, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { DataFile } from "../api/common/DataFile"
import DOMPurify, { Config } from "dompurify"
import { SearchToken, splitTextForHighlighting } from "../api/common/utils/QueryTokenUtils"
import {
	combineParsers,
	makeCharacterParser,
	makeDiscardingParser,
	makeEitherParser,
	makeEscapedStringParser,
	makeOneOfCharactersParser,
	makeSeparatedByParser,
	makeZeroOrMoreParser,
	mapParser,
	maybeParse,
	numberParser,
	Parser,
	ParserError,
	StringIterator,
	stringParser,
} from "./parsing/ParserCombinator"

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
] as const)

const DRAFT_ATTRIBUTES = ["draft-src", "draft-srcset", "draft-xlink:href", "draft-href"] satisfies readonly `draft-${string}`[]

type SanitizeConfigExtra = {
	blockExternalContent: boolean
	allowRelativeLinks: boolean
	usePlaceholderForInlineImages: boolean
	highlightedStrings: readonly SearchToken[]
}

const DEFAULT_CONFIG_EXTRA: SanitizeConfigExtra = Object.freeze({
	blockExternalContent: true,
	allowRelativeLinks: false,
	usePlaceholderForInlineImages: true,
	highlightedStrings: [],
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

type SanitizeConfig = SanitizeConfigExtra & Config

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

/** Completely disallow some HTML tags. */
const FORBID_TAGS = Object.freeze([
	// prevent loading of external stylesheets and fonts by blocking the whole <style> tag
	"style",
] as const)

/** restricts the allowed protocols to some standard ones + our tutatemplate protocol that allows the knowledge base to link to email templates. */
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|tutatemplate):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i

const HTML_CONFIG: Config & { RETURN_DOM_FRAGMENT?: undefined; RETURN_DOM?: undefined } = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	ALLOWED_URI_REGEXP,
} as const)
const SVG_CONFIG: Config & { RETURN_DOM_FRAGMENT?: undefined; RETURN_DOM?: undefined } = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	NAMESPACE: "http://www.w3.org/2000/svg",
} as const)
const FRAGMENT_CONFIG: Config & { RETURN_DOM_FRAGMENT: true } = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	RETURN_DOM_FRAGMENT: true,
	ALLOWED_URI_REGEXP,
} as const)

type BaseConfig = typeof HTML_CONFIG | typeof SVG_CONFIG | typeof FRAGMENT_CONFIG

const enum RuleResult {
	NotHandled,
	Handled,
}

interface Rule {
	// Rule only applies for specified attributes
	attributes?: string[]
	// Rule only applies for specified tags
	tags?: string[]
	handler: (element: HTMLElement, attributeName: string, attributeValue: string, config: SanitizeConfig) => RuleResult
}

/** Class to pre-process HTML/SVG content. */
export class HtmlSanitizer {
	private externalContent!: number
	private inlineImageCids!: Array<string>
	private links!: Array<Link>
	private purifier!: typeof DOMPurify

	constructor(private readonly replacementImageUrl: string) {
		if (DOMPurify.isSupported) {
			this.purifier = DOMPurify()
			// Do changes in afterSanitizeAttributes and not afterSanitizeElements so that images are not removed again because of the SVGs.
			this.purifier.addHook("afterSanitizeAttributes", this.afterSanitizeAttributes.bind(this))
			this.purifier.addHook("beforeSanitizeElements", this.beforeSanitizeElements.bind(this))
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

	private beforeSanitizeElements(currentNode: Element, data: null, config: Config) {
		this.highlightText(currentNode as HTMLElement, config as SanitizeConfig)
	}

	private afterSanitizeAttributes(currentNode: Element, data: null, config: Config) {
		const typedConfig = config as SanitizeConfig
		// remove custom css classes as we do not allow style definitions. custom css classes can be in conflict to our self defined classes.
		// just allow our own "tutanota_quote" class and MsoListParagraph classes for compatibility with Outlook 2010/2013 emails. see main-styles.js
		let allowedClasses = [
			"tutanota_indented",
			"tutanota_quote",
			"MsoListParagraph",
			"MsoListParagraphCxSpFirst",
			"MsoListParagraphCxSpMiddle",
			"MsoListParagraphCxSpLast",
			"search-highlight",
		]

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

		return currentNode
	}

	private cssValueUnconditionallyDisallowed(value: string): boolean {
		// image-set can have plain URLs, without `url(`
		// `src` can reference vars and can also interpret vars. no browser support it anyway as of now
		// `var` can reference URLs defined elsewhere and there isn't really a way to resolve them without parsing
		// `element` can reference arbitrary HTML element on the page… just no.
		// `image` can have plain URLs
		return (
			value.includes("image-set(") ||
			value.includes("src(") ||
			value.includes("var(") ||
			value.includes("element(") ||
			value.includes("image(") ||
			this.containsDisallowedCssUrls(value)
		)
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
			// For a decent table of where <image> CSS type can occur see https://developer.mozilla.org/en-US/docs/Web/CSS/image
			// Note that we are replacing some properties and outright remove some other ones

			if (this.replaceCssValueIfNeeded(htmlNode, "background-image", config)) {
				htmlNode.style.backgroundRepeat = "no-repeat"
			}

			if (this.replaceCssValueIfNeeded(htmlNode, "content", config)) {
				htmlNode.style.maxWidth = "100px"
			}

			this.removeCssValueIfNeeded(htmlNode, "list-style-image", config)
			this.removeCssValueIfNeeded(htmlNode, "cursor", config)
			this.removeCssValueIfNeeded(htmlNode, "filter", config)
			this.removeCssValueIfNeeded(htmlNode, "border-image-source", config)
			this.removeCssValueIfNeeded(htmlNode, "mask-image", config)
			this.removeCssValueIfNeeded(htmlNode, "-webkit-mask-image", config)
			this.removeCssValueIfNeeded(htmlNode, "shape-outside", config)

			// Disallow position because you can do bad things with it and it also messes up layout
			// Do this unconditionally, independent from the external content blocking.
			htmlNode.style.removeProperty("position")
		}
	}

	private replaceCssValueIfNeeded(htmlElement: HTMLElement, cssStyleAttributeName: string, config: SanitizeConfig): boolean {
		if (htmlElement.style.getPropertyValue(cssStyleAttributeName)) {
			return (
				this.replaceCssValueIfDisallowed(htmlElement, cssStyleAttributeName) ||
				this.replaceCssValueIfExternal(htmlElement, cssStyleAttributeName, config)
			)
		} else {
			return false
		}
	}

	private removeCssValueIfNeeded(htmlElement: HTMLElement, cssStyleAttributeName: string, config: SanitizeConfig): boolean {
		if (htmlElement.style.getPropertyValue(cssStyleAttributeName)) {
			return (
				this.removeCssValueIfDisallowed(htmlElement, cssStyleAttributeName) || this.removeCssValueIfExternal(htmlElement, cssStyleAttributeName, config)
			)
		} else {
			return false
		}
	}

	private containsDisallowedCssUrls(backgroundImage: string): boolean {
		// small optimization to not start parsing if there are no URLs
		if (!backgroundImage.includes("url")) {
			return false
		}
		for (const url of getCssValueUrls(backgroundImage)) {
			if (!isAllowedLink(url)) {
				console.log("relative link in CSS!", url)
				return true
			}
		}
		return false
	}

	private replaceAttributeValue(htmlNode: HTMLElement, config: SanitizeConfig) {
		const rules: readonly Rule[] = [
			this.linkPlaceholderRule,
			this.clickableHrefRule,
			this.srcsetRule,
			this.usePlaceholderForInlineImagesRule,
			this.removeRelativeAttributeValuesRule,
			this.replaceDraftAttrsWithValuesRule,
			this.replaceExternalAttributesRule,
		]

		for (const attrName of EXTERNAL_CONTENT_ATTRS) {
			rulesLoop: for (const rule of rules) {
				if (rule.tags != null && !rule.tags.includes(htmlNode.tagName.toLowerCase())) {
					continue rulesLoop
				}
				if (rule.attributes != null && !rule.attributes.includes(attrName)) {
					continue rulesLoop
				}

				const attributeValue = htmlNode.getAttribute(attrName)
				if (attributeValue) {
					if (rule.handler(htmlNode, attrName, attributeValue, config) === RuleResult.Handled) {
						break rulesLoop
					}
				}
			}
		}
	}

	/** NB! {@param cssStyleAttributeName} is a *CSS* name ("border-image-source" as opposed to "borderImageSource"). */
	private replaceCssValueIfDisallowed(htmlNode: HTMLElement, cssStyleAttributeName: string): boolean {
		const value = htmlNode.style.getPropertyValue(cssStyleAttributeName)
		if (this.cssValueUnconditionallyDisallowed(value)) {
			this.replaceStyleAttribute(htmlNode, cssStyleAttributeName)
			return true
		} else {
			return false
		}
	}

	/** NB! {@param cssStyleAttributeName} is a *CSS* name ("border-image-source" as opposed to "borderImageSource"). */
	private replaceCssValueIfExternal(htmlNode: HTMLElement, cssStyleAttributeName: string, config: SanitizeConfig): boolean {
		const value: string = htmlNode.style.getPropertyValue(cssStyleAttributeName)

		if (config.blockExternalContent && this.cssValueDisallowedAsExternal(value)) {
			this.externalContent++
			this.replaceStyleAttribute(htmlNode, cssStyleAttributeName)
			return true
		} else {
			return false
		}
	}

	private cssValueDisallowedAsExternal(value: string): boolean {
		// If there are `url(` in the value and not all of them are data: URLs then it could be external.
		// We will replace the whole value.

		// see tests for treacherous example but also
		//
		// ```css
		// background-image: linear-gradient(
		//     to bottom,
		//     rgba(255, 255, 0, 0.5),
		//     rgba(0, 0, 255, 0.5)
		//   ), url("https://exmaple.com/catfront.png");
		// ```
		//
		// ```css
		// background-image: url("data:123"), url("https://exmaple.com/catfront.png");
		// ```
		// some examples where it can be inside a single <image> value:
		//
		// background-image: cross-fade(20% url(twenty.png), url(eighty.png))

		// length of all URLs === length of data: URLs ==> all URLs are data: URLs
		return value.includes("url(") && value.match(/url\(/g)?.length !== value.match(/url\("data:/g)?.length
	}

	/** NB! {@param cssStyleAttributeName} is a *CSS* name ("border-image-source" as opposed to "borderImageSource"). */
	private replaceStyleAttribute(htmlNode: HTMLElement, styleAttributeName: string) {
		htmlNode.style.setProperty(styleAttributeName, `url("${this.replacementImageUrl}")`)
	}

	private removeCssValueIfDisallowed(htmlNode: HTMLElement, cssStyleAttributeName: string): boolean {
		if (this.cssValueUnconditionallyDisallowed(htmlNode.style.getPropertyValue(cssStyleAttributeName))) {
			htmlNode.style.removeProperty(cssStyleAttributeName)
			return true
		} else {
			return false
		}
	}

	private removeCssValueIfExternal(htmlNode: HTMLElement, cssStyleAttributeName: string, config: SanitizeConfig): boolean {
		if (config.blockExternalContent && this.cssValueDisallowedAsExternal(htmlNode.style.getPropertyValue(cssStyleAttributeName))) {
			this.externalContent++
			htmlNode.style.removeProperty(cssStyleAttributeName)
			return true
		} else {
			return false
		}
	}

	private highlightText(currentNode: Node, config: SanitizeConfig) {
		if (isEmpty(config.highlightedStrings) || !currentNode.hasChildNodes()) {
			return
		}

		// don't match already highlighted text
		if (currentNode instanceof HTMLElement && currentNode.getAttribute("class") === "search-highlight") {
			return
		}

		for (let i = 0; i < currentNode.childNodes.length; i++) {
			const node = currentNode.childNodes.item(i)

			if (isTextElement(node)) {
				const dataBefore = node.data
				const substrings = splitTextForHighlighting(dataBefore, config.highlightedStrings)

				// First, check if we even have anything that needs highlighted
				if (isEmpty(substrings) || (substrings.length === 1 && !substrings[0].highlighted)) {
					continue
				}

				// If so, go through and create nodes
				for (const substring of substrings) {
					if (substring.highlighted) {
						// highlighted text that should be placed inside a <mark> element
						const markNode = document.createElement("mark")
						markNode.innerText = substring.text
						markNode.className = "search-highlight"
						currentNode.insertBefore(markNode, node)
					} else {
						// un-highlighted text that can be reinserted as-is
						const textNode = document.createTextNode(substring.text)
						currentNode.insertBefore(textNode, node)
					}
				}

				// Remove the original node
				currentNode.removeChild(node)
			} else {
				this.highlightText(node, config)
			}
		}
	}

	/**
	 * Preserve href that is literally `{link}` on specified elements.
	 * Add element to {@link this.links}.
	 */
	private readonly linkPlaceholderRule: Rule = {
		attributes: ["href"],
		tags: ["a", "area", "form"],
		handler: (element, _attributeName, attributeValue, _config) => {
			// TODO: would be good to maybe depend on config
			if (attributeValue === "{link}") {
				element.setAttribute("rel", "noopener noreferrer")
				element.setAttribute("target", "_blank")
				this.links.push(element)
				return RuleResult.Handled
			}
			return RuleResult.NotHandled
		},
	}

	/**
	 * For elements where `href` defines destination (as opposed to resource) check and replace any URLs that
	 * might be relative or resource URLs.
	 * Add element to {@link this.links}.
	 */
	private readonly clickableHrefRule: Rule = {
		attributes: ["href"],
		tags: ["a", "area", "form"],
		handler: (element, attributeName, attributeValue, config) => {
			if (!config.allowRelativeLinks && !isAllowedLink(attributeValue)) {
				element.setAttribute(attributeName, "javascript:void(0)")
			} else {
				element.setAttribute("rel", "noopener noreferrer")
				element.setAttribute("target", "_blank")
			}
			this.links.push(element)
			return RuleResult.Handled
		},
	}

	/**
	 * Parse and replace `srcset` attributes that have relative or external URLs.
	 * It is a separate rule because `srcset` has a special syntax.
	 */
	private readonly srcsetRule: Rule = {
		attributes: ["srcset"],
		handler: (element, _attributeName, attributeValue, _config) => {
			let urls: string[]
			try {
				urls = parseSrcsetUrls(attributeValue)
			} catch (e) {
				if (e instanceof ParserError) {
					// if we can't parse it, it's likely invalid
					element.setAttribute("srcset", this.replacementImageUrl)
					return RuleResult.Handled
				} else {
					throw e
				}
			}

			for (const url of urls) {
				if (!isAllowedLink(url)) {
					element.setAttribute("srcset", this.replacementImageUrl)
					break
				} else if (isExternalUrl(url)) {
					this.externalContent++
					element.setAttribute("srcset", this.replacementImageUrl)
					element.setAttribute("draft-srcset", attributeValue)
					break
				}
			}

			return RuleResult.Handled
		},
	}

	private readonly usePlaceholderForInlineImagesRule: Rule = {
		handler: (element, attributeName, attributeValue, config) => {
			if (config.usePlaceholderForInlineImages && attributeValue.startsWith("cid:")) {
				// replace embedded image with local image until the embedded image is loaded and ready to be shown.
				const cid = attributeValue.substring(4)

				this.inlineImageCids.push(cid)

				element.setAttribute(attributeName, this.replacementImageUrl)
				element.setAttribute("cid", cid)
				element.classList.add("tutanota-placeholder")
				return RuleResult.Handled
			}
			return RuleResult.NotHandled
		},
	}

	private readonly removeRelativeAttributeValuesRule: Rule = {
		handler: (element, attributeName, attributeValue, config) => {
			if (!isAllowedLink(attributeValue)) {
				element.setAttribute(attributeName, this.replacementImageUrl)
				return RuleResult.Handled
			} else {
				return RuleResult.NotHandled
			}
		},
	}

	private readonly replaceDraftAttrsWithValuesRule: Rule = {
		attributes: DRAFT_ATTRIBUTES,
		handler: (element, attributeName, attributeValue, config) => {
			if (!config.blockExternalContent) {
				const nonDraftAttrName = attributeName.substring("draft-".length)
				element.setAttribute(nonDraftAttrName, attributeValue)
				element.removeAttribute(attributeName)
				return RuleResult.Handled
			} else {
				return RuleResult.NotHandled
			}
		},
	}

	private readonly replaceExternalAttributesRule: Rule = {
		handler: (element, attributeName, attributeValue, config) => {
			if (config.blockExternalContent && isExternalUrl(attributeValue) && !attributeName.startsWith("draft-")) {
				this.externalContent++

				element.setAttribute("draft-" + attributeName, attributeValue)
				element.setAttribute(attributeName, this.replacementImageUrl)
				element.style.maxWidth = "100px"
				return RuleResult.Handled
			} else {
				return RuleResult.NotHandled
			}
		},
	}
}

function isExternalUrl(url: string) {
	return !url.startsWith("data:") && !url.startsWith("cid:")
}

function isAllowedLink(link: string): boolean {
	try {
		// We create URL without explicit base (second argument). It is an error for relative links
		const parsedUrl = new URL(link)
		return parsedUrl.protocol !== "file:" && parsedUrl.protocol !== "asset:" && parsedUrl.protocol !== "api:"
	} catch (e) {
		return false
	}
}

// We cannot directly use instanceof here, nor can we use nodeType, since the Text and Node types may not be available,
// so we check the node name
function isTextElement(node: Node): node is Text {
	// The node name of text elements is "#text"
	// see https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeName
	return node.nodeName === "#text"
}

/**
 * Extract URLs from CSS **normalized** property value.
 * e.g. for `url("hello.jpg"), linear-gradient(red, black), url("bye.jpg")`
 * it would return ["hello.jpg", "bye.jpg"]
 *
 * "Normalized" means that it has been processed by "Serializing CSS values" algorithm:
 * https://drafts.csswg.org/cssom/#serializing-css-values
 *
 * Which is what browsers normally return with CSSOM.
 */
export function getCssValueUrls(cssValue: string): string[] {
	const singleUrlParser = mapParser(combineParsers(stringParser("url("), makeEscapedStringParser(), makeCharacterParser(`)`)), ([, url]) => url)
	const parser: Parser<string[]> = mapParser(
		makeSeparatedByParser(combineParsers(makeCharacterParser(","), makeCharacterParser(" ")), makeDiscardingParser(singleUrlParser)),
		(values) => values.filter(isNotNull),
	)
	return parser(new StringIterator(cssValue))
}

export function parseSrcsetUrls(value: string): string[] {
	/*
	 *  > If present, its value must consist of one or more image candidate strings, each separated from the next by a U+002C COMMA character (,). If an image candidate string contains no descriptors and no ASCII whitespace after the URL, the following image candidate string, if there is one, must begin with one or more ASCII whitespace.
	 *  > An image candidate string consists of the following components, in order, with the further restrictions described below this list:
	 *  >   1. Zero or more ASCII whitespace.
	 *  >   2. A valid non-empty URL that does not start or end with a U+002C COMMA character (,), referencing a non-interactive, optionally animated, image resource that is neither paged nor scripted.
	 *  >   3. Zero or more ASCII whitespace.
	 *  >   4. Zero or one of the following:
	 *  >      * A width descriptor, consisting of: ASCII whitespace, a valid non-negative integer giving a number greater than zero representing the width descriptor value, and a U+0077 LATIN SMALL LETTER W character.
	 *  >      * A pixel density descriptor, consisting of: ASCII whitespace, a valid floating-point number giving a number greater than zero representing the pixel density descriptor value, and a U+0078 LATIN SMALL LETTER X character.
	 *  >   5. Zero or more ASCII whitespace.
	 *
	 * One could imagine ABNF like this:
	 *
	 *   srcset             = candidate *(comma *whitespace candidate)
	 *   comma              = #x2C
	 *   whitespace         = WSP / LF / CR / FF  ; ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, or U+0020 SPACE.
	 *   FF                 = #x0C
	 *   candidate          = *whitespace url [cond-descriptor] *whitespace ; URL is any valid URL expect it can't start or end with a comma
	 *   cond-descriptor    = width-descriptor / density-descriptor
	 *   width-descriptor   = WSP integer "w"
	 *   density-descriptor = WSP float "x"
	 *   integer            = 1*DIGIT
	 *   float              = 1*DIGIT "." 1*DIGIT [e / E [- / +] 1*DIGIT]
	 */

	const trimmed = value.trim()
	if (trimmed === "") {
		return []
	}

	const whitespcaes = ["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"] as readonly string[]
	const whitespaceParser = makeOneOfCharactersParser(whitespcaes)
	const urlParser: Parser<string> = (iterator) => {
		let result = ""
		do {
			const nextChar: string | null = iterator.peek()
			if (nextChar == null || whitespcaes.includes(nextChar)) {
				break
			} else if (nextChar === ",") {
				const afterComma = iterator.iteratee[iterator.position + 2]
				if (whitespcaes.includes(afterComma)) {
					break
				} else if (afterComma == null) {
					throw new ParserError("Not a valid URL: string ends with comma")
				} else {
					result += nextChar
				}
			} else {
				result += nextChar
			}
		} while (!iterator.next().done)

		if (result === "") {
			throw new ParserError("Empty URL")
		} else {
			return result
		}
	}
	const widthDescriptorParser = combineParsers(whitespaceParser, numberParser, makeCharacterParser("w"))
	const densityDescriptorParser = combineParsers(
		whitespaceParser,
		numberParser,
		maybeParse(combineParsers(makeCharacterParser("."), numberParser)),
		maybeParse(combineParsers(makeOneOfCharactersParser(["e", "E"]), maybeParse(makeOneOfCharactersParser(["+", "-"])), numberParser)),
		makeCharacterParser("x"),
	)
	const descriptorParser = makeEitherParser(widthDescriptorParser, densityDescriptorParser)
	const candidateParser: Parser<string> = mapParser(
		combineParsers(makeZeroOrMoreParser(whitespaceParser), urlParser, maybeParse(descriptorParser), makeZeroOrMoreParser(whitespaceParser)),
		([_, url]) => url,
	)
	const srcsetParser = makeSeparatedByParser(makeCharacterParser(","), candidateParser)

	const valueWithoutTrailingComma = trimmed.at(-1) === "," ? trimmed.slice(0, -1) : trimmed
	return srcsetParser(new StringIterator(valueWithoutTrailingComma))
}

export const getHtmlSanitizer = memoized(() => {
	// Create a blob URL for the replacement image instead of inlining SVG as data URL.
	// This way we sidestep serialization/escaping problems plus DOM is smaller.
	// It is never revoked and should only be run in browser context so we lazily instantiate
	// it once.
	const blob = new Blob([ReplacementImage], {
		type: "image/svg+xml",
	})

	return new HtmlSanitizer(URL.createObjectURL(blob))
})
