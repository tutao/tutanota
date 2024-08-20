import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../common/misc/LanguageViewModel"
import { lang } from "../../common/misc/LanguageViewModel"
import { isMailAddress } from "../../common/misc/FormatValidator"
import { AccessDeactivatedError } from "../../common/api/common/error/RestError"
import { debounce, getFirstOrThrow } from "@tutao/tutanota-utils"
import { formatMailAddressFromParts } from "../../common/misc/Formatter"
import { Icon } from "../../common/gui/base/Icon"
import { BootIcons } from "../../common/gui/base/icons/BootIcons"
import { locator } from "../../common/api/main/CommonLocator"
import { assertMainOrNode } from "../../common/api/common/Env"
import { px, size } from "../../common/gui/size.js"
import { Autocomplete, inputLineHeight, TextField } from "../../common/gui/base/TextField.js"
import { attachDropdown, DropdownButtonAttrs } from "../../common/gui/base/Dropdown.js"
import { IconButton, IconButtonAttrs } from "../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"
import { MailAddressAvailability } from "../../common/api/entities/sys/TypeRefs.js"
import { SearchDropDown } from "../../common/gui/SearchDropDown.js"
import { isTutaMailAddress } from "../../common/mailFunctionality/SharedMailUtils.js"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export interface SelectMailAddressFormWithSuggestionsAttrs {
	availableDomains: Array<string>
	onValidationResult: (emailAddress: string, validationResult: ValidationResult) => unknown
	onBusyStateChanged: (isBusy: boolean) => unknown
	injectionsRightButtonAttrs?: IconButtonAttrs | null
	onDomainChanged?: (domain: string) => unknown
	displayUnavailableMailAddresses?: boolean
	maxSuggestionsToShow: number
}

export interface ValidationResult {
	isValid: boolean
	errorId: TranslationKey | null
}

export class SelectMailAddressFormWithSuggestions implements Component<SelectMailAddressFormWithSuggestionsAttrs> {
	private username: string
	private domain: string
	private domains: string[]
	private messageId: TranslationKey | null
	private checkAddressTimeout: TimeoutID | null
	private isVerificationBusy: boolean
	private focused = false
	private mailAvailabilities: MailAddressAvailability[] = []
	private selectedMailAddressSuggestionIndex = 0
	private suggestionsLoaded = false

	constructor({ attrs }: Vnode<SelectMailAddressFormWithSuggestionsAttrs>) {
		this.isVerificationBusy = false
		this.checkAddressTimeout = null
		this.domain = getFirstOrThrow(attrs.availableDomains)
		this.domains = attrs.availableDomains
		this.username = ""
		this.messageId = "mailAddressNeutral_msg"
	}

	view({ attrs }: Vnode<SelectMailAddressFormWithSuggestionsAttrs>): Children {
		// this is a semi-good hack to reset the username after the user pressed "ok"
		if (attrs.injectionsRightButtonAttrs?.click) {
			const originalCallback = attrs.injectionsRightButtonAttrs.click

			attrs.injectionsRightButtonAttrs.click = (event, dom) => {
				originalCallback(event, dom)
				this.username = ""
				this.messageId = "mailAddressNeutral_msg"
			}
		}

		return m("", [
			m(TextField, {
				label: "mailAddress_label",
				value: this.username,
				alignRight: true,
				helpLabel: () => this.addressHelpLabel(),
				autocompleteAs: Autocomplete.newPassword,
				fontSize: px(size.font_size_smaller),
				oninput: (value) => {
					this.username = value
					this.onBusyStateChanged(true, attrs.onBusyStateChanged)
					this.getEmailSuggestions(attrs)
				},
				onfocus: () => {
					this.focused = true
				},
				onblur: () => {
					this.focused = false
				},
				injectionsRight: () => [
					m(
						".flex.items-end.align-self-end",
						{
							style: {
								"padding-bottom": "1px",
								flex: "1 1 auto",
								fontSize: px(size.font_size_smaller),
								lineHeight: px(inputLineHeight),
							},
						},
						`@${this.domain}`,
					),
					attrs.availableDomains.length > 1
						? m(
								IconButton,
								attachDropdown({
									mainButtonAttrs: {
										title: "domain_label",
										icon: BootIcons.Expand,
										size: ButtonSize.Compact,
									},
									childAttrs: () => attrs.availableDomains.map((domain, index) => this.createDropdownItemAttrs(domain, index, attrs)),
									showDropdown: () => true,
									width: 250,
								}),
						  )
						: attrs.injectionsRightButtonAttrs
						? m(IconButton, attrs.injectionsRightButtonAttrs)
						: null,
				],
			}),
			this.displaySuggestions() ? this.renderSuggestions(attrs) : null,
		])
	}

	private displaySuggestions() {
		return this.focused && this.suggestionsLoaded
	}

	private renderSuggestions(attrs: SelectMailAddressFormWithSuggestionsAttrs): Children {
		return m(
			".rel",
			m(SearchDropDown, {
				suggestions: this.mailAvailabilities.map((availability) => {
					return {
						firstRow: lang.get(availability.available ? "available_label" : "unavailable_label"),
						secondRow: availability.mailAddress,
						display: attrs.displayUnavailableMailAddresses ? true : availability.available,
					}
				}),
				selectedSuggestionIndex: this.selectedMailAddressSuggestionIndex,
				onSuggestionSelected: (sel) => this.selectSuggestion(attrs, sel),
				maxHeight: Math.min(this.mailAvailabilities.filter((mailAvailability) => mailAvailability.available).length, attrs.maxSuggestionsToShow),
			}),
		)
	}

	private selectSuggestion(attrs: SelectMailAddressFormWithSuggestionsAttrs, selection: number) {
		if (selection === -1) {
			// The email address (local part) is not available on any domains
			this.onValidationFinished(
				"",
				{
					isValid: false,
					errorId: "mailAddressNA_msg",
				},
				attrs.onValidationResult,
			)

			return
		}

		const selectedMail = this.mailAvailabilities[selection]

		if (!selectedMail.available) {
			// This should never happen as unavailable emails are not clickable
			return
		}

		this.setDomain(attrs, selection)
		this.onValidationFinished(
			selectedMail.mailAddress,
			{
				isValid: true,
				errorId: null,
			},
			attrs.onValidationResult,
		)
	}

	private setDomain(attrs: SelectMailAddressFormWithSuggestionsAttrs, domainIndex: number) {
		this.selectedMailAddressSuggestionIndex = domainIndex
		this.domain = this.domains[domainIndex]
		attrs.onDomainChanged?.(this.domain)
	}

	private getCleanMailAddress() {
		return formatMailAddressFromParts(this.username, this.domain)
	}

	private getCleanMailAddresses() {
		return this.domains.map((domain) => formatMailAddressFromParts(this.username, domain))
	}

	private addressHelpLabel(): Children {
		return this.isVerificationBusy
			? m(".flex.items-center.mt-s", [this.progressIcon(), lang.get("mailAddressBusy_msg")])
			: m(".mt-s", lang.get(this.messageId ?? VALID_MESSAGE_ID))
	}

	private progressIcon(): Children {
		return m(Icon, {
			icon: BootIcons.Progress,
			class: "icon-progress mr-s",
		})
	}

	private createDropdownItemAttrs(domain: string, index: number, attrs: SelectMailAddressFormWithSuggestionsAttrs): DropdownButtonAttrs {
		return {
			label: () => domain,
			click: () => {
				this.setDomain(attrs, index)
				this.verifyMailAddress(attrs)
			},
		}
	}

	private onBusyStateChanged(isBusy: boolean, onBusyStateChanged: (arg0: boolean) => unknown): void {
		this.isVerificationBusy = isBusy
		onBusyStateChanged(isBusy)
		m.redraw()
	}

	private onValidationFinished(
		email: string,
		validationResult: ValidationResult,
		onValidationResult: SelectMailAddressFormWithSuggestionsAttrs["onValidationResult"],
	): void {
		this.messageId = validationResult.errorId
		onValidationResult(email, validationResult)
	}

	private getEmailSuggestions = debounce(1000, async (attrs: SelectMailAddressFormWithSuggestionsAttrs) => {
		const { onBusyStateChanged } = attrs

		const { valid } = this.performClientSideEmailValidation(attrs)

		if (!valid) {
			this.suggestionsLoaded = false
			return
		}

		let availabilities: MailAddressAvailability[] = []
		let firstAvailableIndex = 0

		try {
			availabilities = await locator.mailAddressFacade.areMailAddressesAvailable(this.getCleanMailAddresses())
			this.mailAvailabilities = availabilities
			firstAvailableIndex = availabilities.findIndex((el) => el.available)
		} finally {
			this.onBusyStateChanged(false, onBusyStateChanged)
			this.suggestionsLoaded = true
			this.selectSuggestion(attrs, firstAvailableIndex)

			m.redraw()
		}
	})

	private performClientSideEmailValidation({ onValidationResult, onBusyStateChanged }: SelectMailAddressFormWithSuggestionsAttrs) {
		const cleanMailAddress = this.getCleanMailAddress()
		const cleanUsername = this.username.trim().toLowerCase()

		if (cleanUsername === "") {
			this.onValidationFinished(
				cleanMailAddress,
				{
					isValid: false,
					errorId: "mailAddressNeutral_msg",
				},
				onValidationResult,
			)
			this.onBusyStateChanged(false, onBusyStateChanged)

			return { valid: false }
		} else if (!isMailAddress(cleanMailAddress, true) || (isTutaMailAddress(cleanMailAddress) && cleanUsername.length < 3)) {
			this.onValidationFinished(
				cleanMailAddress,
				{
					isValid: false,
					errorId: "mailAddressInvalid_msg",
				},
				onValidationResult,
			)
			this.onBusyStateChanged(false, onBusyStateChanged)

			return { valid: false }
		}

		return { valid: true, cleanMailAddress, cleanUsername }
	}

	private verifyMailAddress(attrs: SelectMailAddressFormWithSuggestionsAttrs) {
		const { onValidationResult, onBusyStateChanged } = attrs

		this.checkAddressTimeout && clearTimeout(this.checkAddressTimeout)

		const { cleanMailAddress, valid } = this.performClientSideEmailValidation(attrs)

		if (!valid) {
			return
		}

		this.onBusyStateChanged(true, onBusyStateChanged)

		this.checkAddressTimeout = setTimeout(async () => {
			if (this.getCleanMailAddress() !== cleanMailAddress) return

			let result: ValidationResult
			try {
				const available = await locator.mailAddressFacade.isMailAddressAvailable(cleanMailAddress)
				result = available ? { isValid: true, errorId: null } : { isValid: false, errorId: "mailAddressNA_msg" }
			} catch (e) {
				if (e instanceof AccessDeactivatedError) {
					result = { isValid: false, errorId: "mailAddressDelay_msg" }
				} else {
					throw e
				}
			} finally {
				if (this.getCleanMailAddress() === cleanMailAddress) {
					this.onBusyStateChanged(false, onBusyStateChanged)
				}
			}

			if (this.getCleanMailAddress() === cleanMailAddress) {
				this.onValidationFinished(cleanMailAddress, result, onValidationResult)
			}
		}, 500)
	}
}
