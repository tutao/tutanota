import { noOp } from "@tutao/tutanota-utils"

/**
 * Text view model suitable for data entry that isn't rendered as HTML
 */
export class SimpleTextViewModel {
	constructor(private text: string, private readonly uiUpdateCallback: () => void = noOp) {}

	set content(text: string) {
		this.text = text
		this.uiUpdateCallback()
	}

	get content(): string {
		return this.text
	}
}
