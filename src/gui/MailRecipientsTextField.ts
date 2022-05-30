import m, {Children, ClassComponent, Vnode} from "mithril"
import {BubbleTextField} from "./base/BubbleTextField.js"
import {Recipient} from "../api/common/recipients/Recipient.js"
import {getDisplayText} from "../mail/model/MailUtils.js"
import {px} from "./size.js"
import {progressIcon} from "./base/Icon.js"
import {TranslationKey} from "../misc/LanguageViewModel.js"
import {stringToNameAndMailAddress} from "../misc/parsing/MailAddressParser.js"
import {DropdownChildAttrs} from "./base/DropdownN.js"
import {Contact} from "../api/entities/tutanota/TypeRefs.js"
import {RecipientsSearchDropDown} from "./RecipientsSearchDropDown.js"
import {RecipientsSearchModel} from "../misc/RecipientsSearchModel.js"
import {assertNotNull} from "@tutao/tutanota-utils"

export interface MailRecipientsTextFieldAttrs {
	label: TranslationKey,
	text: string,
	onTextChanged: (text: string) => void
	recipients: ReadonlyArray<Recipient>
	onRecipientAdded: (address: string, name: string | null, contact: Contact | null) => void
	onRecipientRemoved: (address: string) => void
	getRecipientClickedDropdownAttrs?: (address: string) => Promise<DropdownChildAttrs[]>
	injectionsRight?: Children | null
	disabled: boolean
	search: RecipientsSearchModel
	/** Limit the search dropdown to this number of suggestions before starting to scroll */
	maxSuggestionsToShow?: number
}

/**
 * A component for inputting a list of recipients
 * recipients are represented as bubbles, and a contact search dropdown is shown as the user types
 */
export class MailRecipientsTextField implements ClassComponent<MailRecipientsTextFieldAttrs> {
	private selectedSuggestionIdx = 0

	view({attrs}: Vnode<MailRecipientsTextFieldAttrs>): Children {
		return [
			this.renderTextField(attrs),
			this.renderSuggestions(attrs)
		]
	}

	private renderTextField(attrs: MailRecipientsTextFieldAttrs): Children {
		return m(BubbleTextField, {
			label: attrs.label,
			text: attrs.text,
			onInput: text => {
				attrs.search.search(text).then(() => m.redraw())

				// if the new text length is more than one character longer,
				// it means the user pasted the text in, so we want to try and resolve a list of contacts
				const {remainingText, newRecipients} = text.length - attrs.text.length > 1
					? parsePastedInput(text)
					: parseTypedInput(text)

				for (const {address, name} of newRecipients) {
					attrs.onRecipientAdded(address, name, null)
				}

				attrs.onTextChanged(remainingText)
			},
			items: attrs.recipients.map(recipient => recipient.address),
			renderBubbleText: (address: string) => {
				const name = attrs.recipients.find(recipient => recipient.address === address)?.name ?? null
				return getDisplayText(name, address, false)
			},
			getBubbleDropdownAttrs: async (address) => (await attrs.getRecipientClickedDropdownAttrs?.(address)) ?? [],
			onBackspace: () => {
				if (attrs.text === "" && attrs.recipients.length > 0) {
					const {address} = attrs.recipients.slice().pop()!
					attrs.onTextChanged(address)
					attrs.onRecipientRemoved(address)
					return false
				}
				return true

			},
			onEnterKey: () => {
				this.resolveInput(attrs)
				return true
			},
			onUpKey: () => {
				this.setSelectedSuggestionIdx(attrs, this.selectedSuggestionIdx + 1)
				return false
			},
			onDownKey: () => {
				this.setSelectedSuggestionIdx(attrs, this.selectedSuggestionIdx - 1)
				return false
			},
			onBlur: () => {
				this.resolveInput(attrs)
				return true
			},
			disabled: attrs.disabled,
			injectionsRight: [
				// Placeholder element for the suggestion progress icon with a fixed width and height to avoid flickering.
				// when reaching the end of the input line and when entering a text into the second line.
				m(
					".align-right.mr-s.button-height.flex.items-end.pb-s",
					{
						style: {
							width: px(20), // in case the progress icon is not shown we reserve the width of the progress icon
						},
					},
					attrs.search.isLoading() ? progressIcon() : null,
				),
				attrs.injectionsRight
			]
		})
	}

	private renderSuggestions(attrs: MailRecipientsTextFieldAttrs): Children {
		return m(RecipientsSearchDropDown, {
			suggestions: attrs.search.results(),
			selectedSuggestionIndex: this.selectedSuggestionIdx,
			onSuggestionSelected: idx => this.selectSuggestion(attrs, idx),
			maxHeight: attrs.maxSuggestionsToShow ?? null
		})
	}

	private resolveInput(attrs: MailRecipientsTextFieldAttrs) {
		const suggestions = attrs.search.results()
		if (suggestions.length > 0) {
			this.selectSuggestion(attrs, this.selectedSuggestionIdx)
		} else {
			const parsed = parseMailAddress(attrs.text)
			if (parsed != null) {
				attrs.onRecipientAdded(parsed.address, parsed.name, null)
				attrs.onTextChanged("")
			}
		}
	}

	private selectSuggestion(attrs: MailRecipientsTextFieldAttrs, index: number) {
		const {address, name, contact} = assertNotNull(attrs.search.results()[index])
		attrs.onRecipientAdded(address, name, contact)
		attrs.search.clear()
		attrs.onTextChanged("")
	}

	private setSelectedSuggestionIdx(attrs: MailRecipientsTextFieldAttrs, idx: number) {
		this.selectedSuggestionIdx = Math.min(Math.max(idx, 0), attrs.search.results().length - 1)
	}
}

interface ParsedInput {
	remainingText: string,
	newRecipients: Array<{address: string, name: string | null}>
}

/**
 * Parse a list of valid mail addresses separated by either a semicolon or a comma.
 * If any of the mail addresses are invalid, then no new recipients will be returned,
 * and the text will remain untouched
 */
function parsePastedInput(text: string): ParsedInput {
	const separator = text.indexOf(";") !== -1 ? ";" : ","
	const textParts = text.split(separator).map(part => part.trim())

	const result: ParsedInput["newRecipients"] = []

	for (let part of textParts) {
		part = part.trim()

		if (part.length !== 0) {
			const parsed = parseMailAddress(part)

			if (!parsed) {
				// give up early
				return {
					remainingText: text,
					newRecipients: []
				}
			} else {
				result.push(parsed)
			}
		}
	}

	return {
		remainingText: "",
		newRecipients: result
	}
}

/**
 * Parse text when it is typed by the user
 * When the final character is an expected delimiter (';', ',', ' '),
 * then we attempt to parse the preceding text. If it is a valid mail address,
 * it is successfully parsed
 * @param text
 */
function parseTypedInput(text: string): ParsedInput {

	const lastCharacter = text.slice(-1)

	// on semicolon, comman or space we want to try to resolve the input text
	if (lastCharacter === ";" || lastCharacter === "," || lastCharacter === " ") {
		const textMinusLast = text.slice(0, -1)

		const result = parseMailAddress(textMinusLast)
		const remainingText = result != null
			? ""
			: textMinusLast

		return {
			remainingText,
			newRecipients: result ? [result] : []
		}
	}

	return {
		remainingText: text,
		newRecipients: []
	}
}

function parseMailAddress(text: string): {address: string, name: string | null} | null {
	text = text.trim()

	if (text === "") return null

	const nameAndMailAddress = stringToNameAndMailAddress(text)

	if (nameAndMailAddress) {
		const name = nameAndMailAddress.name
			? nameAndMailAddress.name
			: null

		return {name, address: nameAndMailAddress.mailAddress}
	} else {
		return null
	}
}