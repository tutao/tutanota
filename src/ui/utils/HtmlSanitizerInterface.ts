import { SearchToken } from "./QueryTokenUtils"
import { Config } from "dompurify"

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

export type SanitizeConfig = SanitizeConfigExtra & Config

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

export interface HtmlSanitizerInterface {
	sanitizeHTML(html: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizedHTML
	sanitizeFragment(html: string, configExtra?: Partial<SanitizeConfigExtra>): SanitizedFragment
}

export type SanitizeConfigExtra = {
	blockExternalContent: boolean
	allowRelativeLinks: boolean
	usePlaceholderForInlineImages: boolean
	highlightedStrings: readonly SearchToken[]
}
