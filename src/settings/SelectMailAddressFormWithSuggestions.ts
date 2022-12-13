import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {isMailAddress} from "../misc/FormatValidator"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {debounce, firstThrow} from "@tutao/tutanota-utils"
import {formatMailAddressFromParts} from "../misc/Formatter"
import {Icon} from "../gui/base/Icon"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import {isTutanotaMailAddress} from "../mail/model/MailUtils.js";
import {px, size} from "../gui/size.js"
import {inputLineHeight, TextField} from "../gui/base/TextField.js"
import {attachDropdown, DropdownButtonAttrs} from "../gui/base/Dropdown.js"
import {IconButton, IconButtonAttrs} from "../gui/base/IconButton.js"
import {ButtonSize} from "../gui/base/ButtonSize.js"
import {MailAddressAvailability} from "../api/entities/sys/TypeRefs.js"
import {MailAddressAvailabilityDropDown} from "../gui/MailAddressAvailabilityDropDown.js"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export interface SelectMailAddressFormAttrs {
	availableDomains: Array<string>
	onValidationResult: (emailAddress: string, validationResult: ValidationResult) => unknown
	onBusyStateChanged: (isBusy: boolean) => unknown
	injectionsRightButtonAttrs?: IconButtonAttrs | null
	onDomainChanged?: (domain: string) => unknown
}

export interface ValidationResult {
	isValid: boolean,
	errorId: TranslationKey | null
}

export class SelectMailAddressFormWithSuggestions implements Component<SelectMailAddressFormAttrs> {
	private username: string
	private domain: string
	private domains: string[]
	private messageId: TranslationKey | null
	private checkAddressTimeout: TimeoutID | null
	private isVerificationBusy: boolean
	private focused = false
	private mailAvailabilities: MailAddressAvailability[] = []
	private selectedMailAddressSuggestionIndex = 0

	constructor({attrs}: Vnode<SelectMailAddressFormAttrs>) {
		this.isVerificationBusy = false
		this.checkAddressTimeout = null
		this.domain = firstThrow(attrs.availableDomains)
		this.domains = attrs.availableDomains
		this.username = ""
		this.messageId = "mailAddressNeutral_msg"
	}

	view({attrs}: Vnode<SelectMailAddressFormAttrs>): Children {
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
						? m(IconButton, attachDropdown(
							{
								mainButtonAttrs: {
									title: "domain_label",
									icon: BootIcons.Expand,
									size: ButtonSize.Compact,
								},
								childAttrs: () => attrs.availableDomains.map((domain, index) => this.createDropdownItemAttrs(domain, index, attrs)),
								showDropdown: () => true,
								width: 250,
							},
						))
						: attrs.injectionsRightButtonAttrs
							? m(IconButton, attrs.injectionsRightButtonAttrs)
							: null,
				],
			}), this.focused && !this.isVerificationBusy && this.performClientSideEmailValidation(attrs).valid ? this.renderSuggestions(attrs) : null
		])
	}

	private renderSuggestions(attrs: SelectMailAddressFormAttrs): Children {
		return m(".rel", m(MailAddressAvailabilityDropDown, {
			availabilities: this.mailAvailabilities,
			selectedSuggestionIndex: this.selectedMailAddressSuggestionIndex,
			onSuggestionSelected: sel => this.selectSuggestion(attrs, sel),
			maxHeight: 5,
		}))
	}

	private selectSuggestion(attrs: SelectMailAddressFormAttrs, selection: number) {
		const selectedMail = this.mailAvailabilities[selection]

		if (!selectedMail.available) {
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

	private setDomain(attrs: SelectMailAddressFormAttrs, domainIndex: number) {
		this.selectedMailAddressSuggestionIndex = domainIndex
		this.domain = this.domains[domainIndex]
		attrs.onDomainChanged?.(this.domain)
	}

	private getCleanMailAddress() {
		return formatMailAddressFromParts(this.username, this.domain)
	}

	private getCleanMailAddresses() {
		return this.domains.map(domain => formatMailAddressFromParts(this.username, domain))
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

	private createDropdownItemAttrs(domain: string, index: number, attrs: SelectMailAddressFormAttrs): DropdownButtonAttrs {
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

	private onValidationFinished(email: string, validationResult: ValidationResult, onValidationResult: SelectMailAddressFormAttrs["onValidationResult"]): void {
		this.messageId = validationResult.errorId
		onValidationResult(email, validationResult)
	}

	private getEmailSuggestions = debounce(1000,
		async (attrs: SelectMailAddressFormAttrs) => {
			const {onBusyStateChanged} = attrs

			const {valid} = this.performClientSideEmailValidation(attrs)

			if (!valid) {
				return
			}

			let availabilities: MailAddressAvailability[] = []
			let firstAvailableIndex = 0

			try {
				availabilities = await locator.mailAddressFacade.areMailAddressesAvailable(this.getCleanMailAddresses())
				this.mailAvailabilities = availabilities
				firstAvailableIndex = availabilities.findIndex(el => el.available)
			} finally {
				this.onBusyStateChanged(false, onBusyStateChanged)
				this.selectSuggestion(attrs, firstAvailableIndex === -1 ? 0 : firstAvailableIndex)

				m.redraw()
			}
		}
	)

	private performClientSideEmailValidation({onValidationResult, onBusyStateChanged}: SelectMailAddressFormAttrs) {
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

			return {valid: false}
		} else if (!isMailAddress(cleanMailAddress, true) || (isTutanotaMailAddress(cleanMailAddress) && cleanUsername.length < 3)) {
			this.onValidationFinished(
				cleanMailAddress,
				{
					isValid: false,
					errorId: "mailAddressInvalid_msg",
				},
				onValidationResult,
			)
			this.onBusyStateChanged(false, onBusyStateChanged)

			return {valid: false}
		}

		return {valid: true, cleanMailAddress, cleanUsername}
	}

	private verifyMailAddress(attrs: SelectMailAddressFormAttrs) {
		const {onValidationResult, onBusyStateChanged} = attrs

		this.checkAddressTimeout && clearTimeout(this.checkAddressTimeout)

		const {cleanMailAddress, valid} = this.performClientSideEmailValidation(attrs)

		if (!valid) {
			return
		}

		this.onBusyStateChanged(true, onBusyStateChanged)

		this.checkAddressTimeout = setTimeout(async () => {
			if (this.getCleanMailAddress() !== cleanMailAddress) return

			let result: ValidationResult
			try {
				const available = await locator.mailAddressFacade.isMailAddressAvailable(cleanMailAddress)
				result = available ? {isValid: true, errorId: null} : {isValid: false, errorId: "mailAddressNA_msg"}
			} catch (e) {
				if (e instanceof AccessDeactivatedError) {
					result = {isValid: false, errorId: "mailAddressDelay_msg"}
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