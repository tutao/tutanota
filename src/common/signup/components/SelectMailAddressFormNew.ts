import m, { Children, Component, Vnode } from "mithril"
import { LoginTextField } from "../../gui/base/LoginTextField"
import { Autocapitalize, Autocomplete } from "../../gui/base/TextField"
import { assertMainOrNode } from "../../api/common/Env"
import { EmailDomainData } from "../../settings/mailaddress/MailAddressesUtils"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { font_size, px } from "../../gui/size"
import { attachDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { formatMailAddressFromParts } from "../../misc/Formatter"
import { Icon } from "../../gui/base/Icon"
import { isMailAddress } from "../../misc/FormatValidator"
import { isTutaMailAddress } from "../../mailFunctionality/SharedMailUtils"
import { locator } from "../../api/main/CommonLocator"
import { AccessDeactivatedError } from "../../api/common/error/RestError"
import { theme } from "../../gui/theme"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"
const CHECK_ADDRESS_DEBOUNCE_MS = 500

export interface SelectMailAddressFormAttrs {
	selectedDomain: EmailDomainData
	availableDomains: readonly EmailDomainData[]
	onValidationResult: (emailAddress: string, validationResult: ValidationResult) => unknown
	onBusyStateChanged: (isBusy: boolean) => unknown
	injectionsRightButtonAttrs?: IconButtonAttrs | null
	onDomainChanged: (domain: EmailDomainData) => unknown
	mailAddressNAError?: TranslationKey
	messageIdOverride?: TranslationKey | null
	signupToken?: string
	username?: string
}

export interface ValidationResult {
	isValid: boolean
	errorId: TranslationKey | null
}

export class SelectMailAddressFormNew implements Component<SelectMailAddressFormAttrs> {
	private username: string
	private messageId: TranslationKey | null
	private checkAddressTimeout: TimeoutID | null
	private isVerificationBusy: boolean
	private lastAttrs: SelectMailAddressFormAttrs

	constructor({ attrs }: Vnode<SelectMailAddressFormAttrs>) {
		this.lastAttrs = attrs
		this.isVerificationBusy = false
		this.checkAddressTimeout = null
		this.username = attrs.username ?? ""
		this.messageId = "mailAddressNeutral_msg"
	}

	onupdate(vnode: Vnode<SelectMailAddressFormAttrs>) {
		if (this.lastAttrs.selectedDomain.domain !== vnode.attrs.selectedDomain.domain) {
			this.verifyMailAddress(vnode.attrs)
		}
		this.lastAttrs = vnode.attrs
	}

	oncreate({ attrs }: Vnode<SelectMailAddressFormAttrs>) {
		this.verifyMailAddress(attrs)
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

		return m(LoginTextField, {
			class: "",
			label: "username_label",
			value: this.username,
			leadingIcon: {
				icon: BootIcons.Mail,
				color: theme.on_surface_variant,
			},
			autocompleteAs: Autocomplete.newPassword,
			autocapitalize: Autocapitalize.none,
			helpLabel: () => this.addressHelpLabel(attrs.messageIdOverride),
			fontSize: px(font_size.smaller),
			oninput: (value) => {
				this.username = value
				this.verifyMailAddress(attrs)
			},
			injectionsRight: () => [
				m(
					".flex.items-center",
					{
						style: {
							"padding-bottom": "1px",
							flex: "1 1 auto",
							fontSize: px(font_size.smaller),
							lineHeight: px(font_size.line_height_input),
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

	private addressHelpLabel(messageIdOverride?: TranslationKey | null): Children {
		const messageId = messageIdOverride ?? this.messageId
		return this.isVerificationBusy
			? m(".flex.items-center.mt-8", [this.progressIcon(), lang.get("mailAddressBusy_msg")])
			: m(".mt-8", lang.get(messageId ?? VALID_MESSAGE_ID))
	}

	private progressIcon(): Children {
		return m(Icon, {
			icon: BootIcons.Progress,
			class: "icon-progress mr-8",
		})
	}

	private createDropdownItemAttrs(domainData: EmailDomainData, attrs: SelectMailAddressFormAttrs): DropdownButtonAttrs {
		return {
			label: lang.makeTranslation("domain", domainData.domain),
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
		if (this.checkAddressTimeout) clearTimeout(this.checkAddressTimeout)

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
				const available = await locator.mailAddressFacade.isMailAddressAvailable(cleanMailAddress, attrs.signupToken)
				result = available
					? { isValid: true, errorId: null }
					: {
							isValid: false,
							errorId: attrs.mailAddressNAError ?? "mailAddressNA_msg",
						}
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
		}, CHECK_ADDRESS_DEBOUNCE_MS)
	}
}
