import type { HtmlSanitizer } from "./HtmlSanitizer.js"
import { noOp } from "@tutao/tutanota-utils"
import { convertTextToHtml } from "./Formatter.js"
import { prepareCalendarDescription } from "../api/common/utils/CommonCalendarUtils.js"

export class SanitizedTextViewModel {
	private sanitizedText: string | null = null

	constructor(private text: string, private readonly sanitizer: HtmlSanitizer, private readonly uiUpdateCallback: () => void = noOp) {}

	set content(v: string) {
		this.sanitizedText = null
		this.text = v
		this.uiUpdateCallback()
	}

	get content(): string {
		if (this.sanitizedText == null) {
			this.sanitizedText = prepareCalendarDescription(
				this.text,
				(s) =>
					this.sanitizer.sanitizeHTML(convertTextToHtml(s), {
						blockExternalContent: false,
					}).html,
			)
		}
		return this.sanitizedText
	}
}
