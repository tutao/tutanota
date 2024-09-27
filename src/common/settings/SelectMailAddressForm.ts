import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel.js"
import { lang } from "../misc/LanguageViewModel.js"
import { isMailAddress } from "../misc/FormatValidator.js"
import { AccessDeactivatedError } from "../api/common/error/RestError.js"
import { formatMailAddressFromParts } from "../misc/Formatter.js"
import { Icon } from "../gui/base/Icon.js"
import { locator } from "../api/main/CommonLocator.js"
import { assertMainOrNode } from "../api/common/Env.js"
import { px, size } from "../gui/size.js"
import { Autocomplete, inputLineHeight, TextField } from "../gui/base/TextField.js"
import { attachDropdown, DropdownButtonAttrs } from "../gui/base/Dropdown.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { EmailDomainData } from "./mailaddress/MailAddressesUtils.js"
import { BootIcons } from "../gui/base/icons/BootIcons.js"
import { isTutaMailAddress } from "../mailFunctionality/SharedMailUtils.js"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export interface SelectMailAddressFormAttrs {
	selectedDomain: EmailDomainData
	availableDomains: readonly EmailDomainData[]
	onValidationResult: (emailAddress: string, validationResult: ValidationResult) => unknown
	onBusyStateChanged: (isBusy: boolean) => unknown
	injectionsRightButtonAttrs?: IconButtonAttrs | null
	onDomainChanged: (domain: EmailDomainData) => unknown
	mailAddressNAError?: TranslationKey
}

export interface ValidationResult {
	isValid: boolean
	errorId: TranslationKey | null
}

export class SelectMailAddressForm implements Component<SelectMailAddressFormAttrs> {
	private username: string
	private messageId: TranslationKey | null
	private checkAddressTimeout: TimeoutID | null
	private isVerificationBusy: boolean
	private lastAttrs: SelectMailAddressFormAttrs

	constructor({ attrs }: Vnode<SelectMailAddressFormAttrs>) {
		this.lastAttrs = attrs
		this.isVerificationBusy = false
		this.checkAddressTimeout = null
		this.username = ""
		this.messageId = "mailAddressNeutral_msg"
	}

	onupdate(vnode: Vnode<SelectMailAddressFormAttrs>) {
		if (this.lastAttrs.selectedDomain.domain !== vnode.attrs.selectedDomain.domain) {
			this.verifyMailAddress(vnode.attrs)
		}
		this.lastAttrs = vnode.attrs
	}

	view({ attrs }: Vnode<SelectMailAddressFormAttrs>): Children {
		// this is a semi-good hack to reset the username after the user pressed "ok"
		// this behavior is not necessarily expected, e.g. if the user enters an invalid email address and presses "ok" we might not want to clear the
		// username field. we would need to find a way to clear the field from the outside to solve this.
		if (attrs.injectionsRightButtonAttrs?.click) {
			const originalCallback = attrs.injectionsRightButtonAttrs.click

			attrs.injectionsRightButtonAttrs.click = (event, dom) => {
				originalCallback(event, dom)
				this.username = ""
				this.messageId = "mailAddressNeutral_msg"
			}
		}

		return m(TextField, {
			label: "mailAddress_label",
			value: this.username,
			alignRight: true,
			autocompleteAs: Autocomplete.newPassword,
			helpLabel: () => this.addressHelpLabel(),
			fontSize: px(size.font_size_smaller),
			oninput: (value) => {
				this.username = value
				this.verifyMailAddress(attrs)
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
					`@${attrs.selectedDomain.domain}`,
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
								childAttrs: () => attrs.availableDomains.map((domain) => this.createDropdownItemAttrs(domain, attrs)),
								showDropdown: () => true,
								width: 250,
							}),
					  )
					: attrs.injectionsRightButtonAttrs
					? m(IconButton, attrs.injectionsRightButtonAttrs)
					: null,
			],
		})
	}

	private getCleanMailAddress(attrs: SelectMailAddressFormAttrs) {
		return formatMailAddressFromParts(this.username, attrs.selectedDomain.domain)
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

	private createDropdownItemAttrs(domainData: EmailDomainData, attrs: SelectMailAddressFormAttrs): DropdownButtonAttrs {
		return {
			label: () => domainData.domain,
			click: () => {
				attrs.onDomainChanged(domainData)
			},
			icon: domainData.isPaid ? BootIcons.Premium : undefined,
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
		onValidationResult: SelectMailAddressFormAttrs["onValidationResult"],
	): void {
		this.messageId = validationResult.errorId
		onValidationResult(email, validationResult)
	}

	private verifyMailAddress(attrs: SelectMailAddressFormAttrs) {
		const { onValidationResult, onBusyStateChanged } = attrs
		this.checkAddressTimeout && clearTimeout(this.checkAddressTimeout)

		const cleanMailAddress = this.getCleanMailAddress(attrs)
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

			return
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

			return
		}

		this.onBusyStateChanged(true, onBusyStateChanged)

		this.checkAddressTimeout = setTimeout(async () => {
			if (this.getCleanMailAddress(attrs) !== cleanMailAddress) return

			let result: ValidationResult
			try {
				const available = await locator.mailAddressFacade.isMailAddressAvailable(cleanMailAddress)
				result = available ? { isValid: true, errorId: null } : { isValid: false, errorId: attrs.mailAddressNAError ?? "mailAddressNA_msg" }
			} catch (e) {
				if (e instanceof AccessDeactivatedError) {
					result = { isValid: false, errorId: "mailAddressDelay_msg" }
				} else {
					throw e
				}
			} finally {
				if (this.getCleanMailAddress(attrs) === cleanMailAddress) {
					this.onBusyStateChanged(false, onBusyStateChanged)
				}
			}

			if (this.getCleanMailAddress(attrs) === cleanMailAddress) {
				this.onValidationFinished(cleanMailAddress, result, onValidationResult)
			}
		}, 500)
	}
}
