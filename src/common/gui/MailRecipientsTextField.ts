import m, { Children, ClassComponent, Vnode } from "mithril"
import { BubbleTextField } from "./base/BubbleTextField.js"
import { Recipient } from "../api/common/recipients/Recipient.js"
import { px, size } from "./size.js"
import { Icon, progressIcon } from "./base/Icon.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { stringToNameAndMailAddress } from "../misc/parsing/MailAddressParser.js"
import { DropdownChildAttrs } from "./base/Dropdown.js"
import { Contact } from "../api/entities/tutanota/TypeRefs.js"
import { RecipientsSearchModel } from "../misc/RecipientsSearchModel.js"
import { getFirstOrThrow, lazy } from "@tutao/tutanota-utils"
import { Dialog } from "./base/Dialog.js"
import { SearchDropDown } from "./SearchDropDown.js"
import { findRecipientWithAddress } from "../api/common/utils/CommonCalendarUtils.js"
import { Icons } from "./base/icons/Icons.js"
import { theme } from "./theme.js"
import { getMailAddressDisplayText } from "../mailFunctionality/SharedMailUtils.js"

export interface MailRecipientsTextFieldAttrs {
	label: TranslationKey
	text: string
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
	helpLabel?: lazy<Children> | null
}

/**
 * A component for inputting a list of recipients
 * recipients are represented as bubbles, and a contact search dropdown is shown as the user types
 */
export class MailRecipientsTextField implements ClassComponent<MailRecipientsTextFieldAttrs> {
	// don't access me directly, use getter and setter
	private selectedSuggestionIdx = 0
	private focused = false

	view({ attrs }: Vnode<MailRecipientsTextFieldAttrs>): Children {
		return [this.renderTextField(attrs), this.focused ? this.renderSuggestions(attrs) : null]
	}

	private renderTextField(attrs: MailRecipientsTextFieldAttrs): Children {
		return m(BubbleTextField, {
			label: attrs.label,
			text: attrs.text,
			helpLabel: attrs.helpLabel,
			onInput: (text) => {
				attrs.search.search(text).then(() => m.redraw())

				// if the new text length is more than one character longer,
				// it means the user pasted the text in, so we want to try and resolve a list of contacts
				const { remainingText, newRecipients, errors } = text.length - attrs.text.length > 1 ? parsePastedInput(text) : parseTypedInput(text)

				for (const { address, name } of newRecipients) {
					attrs.onRecipientAdded(address, name, null)
				}

				if (errors.length === 1 && newRecipients.length === 0) {
					// if there was a single recipient and it was invalid then just pretend nothing happened
					attrs.onTextChanged(getFirstOrThrow(errors))
				} else {
					if (errors.length > 0) {
						Dialog.message(() => `${lang.get("invalidPastedRecipients_msg")}\n\n${errors.join("\n")}`)
					}
					attrs.onTextChanged(remainingText)
				}
			},
			items: attrs.recipients.map((recipient) => recipient.address),
			renderBubbleText: (address: string) => {
				const name = findRecipientWithAddress(attrs.recipients, address)?.name ?? null
				return getMailAddressDisplayText(name, address, false)
			},
			getBubbleDropdownAttrs: async (address) => (await attrs.getRecipientClickedDropdownAttrs?.(address)) ?? [],
			onBackspace: () => {
				if (attrs.text === "" && attrs.recipients.length > 0) {
					const { address } = attrs.recipients.slice().pop()!
					attrs.onTextChanged(address)
					attrs.onRecipientRemoved(address)
					return false
				}
				return true
			},
			onEnterKey: () => {
				this.resolveInput(attrs, true)
				return true
			},
			onUpKey: () => {
				this.setSelectedSuggestionIdx(this.getSelectedSuggestionIdx(attrs) + 1)
				return false
			},
			onDownKey: () => {
				this.setSelectedSuggestionIdx(this.getSelectedSuggestionIdx(attrs) - 1)
				return false
			},
			onFocus: () => {
				this.focused = true
			},
			onBlur: () => {
				this.focused = false
				this.resolveInput(attrs, false)
				return true
			},
			disabled: attrs.disabled,
			injectionsRight: m(".flex.items-center", [
				// Placeholder element for the suggestion progress icon with a fixed width and height to avoid flickering.
				// when reaching the end of the input line and when entering a text into the second line.
				m(
					".flex.align-right.mr-s.flex.items-end.pb-s",
					{
						style: {
							width: px(20), // in case the progress icon is not shown we reserve the width of the progress icon
							height: px(size.button_height_compact),
						},
					},
					attrs.search.isLoading() ? progressIcon() : null,
				),
				attrs.injectionsRight,
			]),
		})
	}

	private renderSuggestions(attrs: MailRecipientsTextFieldAttrs): Children {
		return m(
			".rel",
			m(SearchDropDown, {
				suggestions: attrs.search.results().map((suggestion) => {
					if (suggestion.type === "recipient") {
						return {
							firstRow: suggestion.value.name,
							secondRow: suggestion.value.address,
						}
					} else {
						return {
							firstRow: m(Icon, {
								icon: Icons.People,
								style: {
									fill: theme.content_fg,
									"aria-describedby": lang.get("contactListName_label"),
								},
							}),
							secondRow: suggestion.value.name,
						}
					}
				}),
				selectedSuggestionIndex: this.getSelectedSuggestionIdx(attrs),
				onSuggestionSelected: (idx) => this.selectSuggestion(attrs, idx),
				maxHeight: attrs.maxSuggestionsToShow ?? null,
			}),
		)
	}

	/**
	 * Resolves a typed in mail address or one of the suggested ones.
	 * @param selectSuggestion boolean value indicating whether a suggestion should be selected or not. Should be true if a suggestion is explicitly selected by
	 * for example hitting the enter key and false e.g. if the dialog is closed
	 */
	private resolveInput(attrs: MailRecipientsTextFieldAttrs, selectSuggestion: boolean) {
		const suggestions = attrs.search.results()
		if (suggestions.length > 0 && selectSuggestion) {
			this.selectSuggestion(attrs, this.getSelectedSuggestionIdx(attrs))
		} else {
			const parsed = parseMailAddress(attrs.text)
			if (parsed != null) {
				attrs.onRecipientAdded(parsed.address, parsed.name, null)
				attrs.onTextChanged("")
			}
		}
	}

	private async selectSuggestion(attrs: MailRecipientsTextFieldAttrs, index: number) {
		const selection = attrs.search.results()[index]
		if (selection == null) {
			return
		}

		if (selection.type === "recipient") {
			const { address, name, contact } = selection.value
			attrs.onRecipientAdded(address, name, contact)
			attrs.search.clear()
			attrs.onTextChanged("")
		} else {
			attrs.search.clear()
			attrs.onTextChanged("")
			const recipients = await attrs.search.resolveContactList(selection.value)
			for (const { address, name, contact } of recipients) {
				attrs.onRecipientAdded(address, name, contact)
			}
			m.redraw()
		}
	}

	private getSelectedSuggestionIdx(attrs: MailRecipientsTextFieldAttrs): number {
		return Math.min(Math.max(this.selectedSuggestionIdx, 0), attrs.search.results().length - 1)
	}

	private setSelectedSuggestionIdx(idx: number) {
		this.selectedSuggestionIdx = idx
	}
}

interface ParsedInput {
	remainingText: string
	newRecipients: Array<{ address: string; name: string | null }>
	errors: Array<string>
}

/**
 * Parse a list of valid mail addresses separated by either a semicolon or a comma.
 * Invalid addresses will be returned as a separate list
 */
function parsePastedInput(text: string): ParsedInput {
	const separator = text.indexOf(";") !== -1 ? ";" : ","
	const textParts = text.split(separator).map((part) => part.trim())

	const result: ParsedInput = {
		remainingText: "",
		newRecipients: [],
		errors: [],
	}

	for (let part of textParts) {
		part = part.trim()

		if (part.length !== 0) {
			const parsed = parseMailAddress(part)

			if (!parsed) {
				result.errors.push(part)
			} else {
				result.newRecipients.push(parsed)
			}
		}
	}

	return result
}

/**
 * Parse text when it is typed by the user
 * When the final character is an expected delimiter (';', ',', ' '),
 * then we attempt to parse the preceding text. If it is a valid mail address,
 * it is successfully parsed
 * invalid input gets returned in `remainingText`, `errors` is always empty
 * @param text
 */
function parseTypedInput(text: string): ParsedInput {
	const lastCharacter = text.slice(-1)

	// on semicolon, comman or space we want to try to resolve the input text
	if (lastCharacter === ";" || lastCharacter === "," || lastCharacter === " ") {
		const textMinusLast = text.slice(0, -1)

		const result = parseMailAddress(textMinusLast)
		const remainingText = result != null ? "" : textMinusLast

		return {
			remainingText,
			newRecipients: result ? [result] : [],
			errors: [],
		}
	} else {
		return {
			remainingText: text,
			newRecipients: [],
			errors: [],
		}
	}
}

export function parseMailAddress(text: string): { address: string; name: string | null } | null {
	text = text.trim()

	if (text === "") return null

	const nameAndMailAddress = stringToNameAndMailAddress(text)

	if (nameAndMailAddress) {
		const name = nameAndMailAddress.name ? nameAndMailAddress.name : null

		return { name, address: nameAndMailAddress.mailAddress }
	} else {
		return null
	}
}
