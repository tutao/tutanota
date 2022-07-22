import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {isMailAddress} from "../misc/FormatValidator"
import {Icons} from "../gui/base/icons/Icons"
import type {ButtonAttrs} from "../gui/base/Button.js"
import {Button, ButtonType} from "../gui/base/Button.js"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {firstThrow} from "@tutao/tutanota-utils"
import {formatMailAddressFromParts} from "../misc/Formatter"
import {Icon} from "../gui/base/Icon"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import {isTutanotaMailAddress} from "../mail/model/MailUtils.js";
import {px, size} from "../gui/size.js"
import {TextField} from "../gui/base/TextField.js"
import {attachDropdown} from "../gui/base/Dropdown.js"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export interface SelectMailAddressFormAttrs {
	availableDomains: Array<string>
	onValidationResult: (emailAddress: string, validationResult: ValidationResult) => unknown
	onBusyStateChanged: (isBusy: boolean) => unknown
	injectionsRightButtonAttrs?: ButtonAttrs | null
	onDomainChanged?: (domain: string) => unknown
}

export interface ValidationResult {
	isValid: boolean,
	errorId: TranslationKey | null
}

export class SelectMailAddressForm implements Component<SelectMailAddressFormAttrs> {
	private username: string
	private domain: string
	private messageId: TranslationKey | null
	private checkAddressTimeout: TimeoutID | null
	private isVerificationBusy: boolean

	constructor({attrs}: Vnode<SelectMailAddressFormAttrs>) {
		this.isVerificationBusy = false
		this.checkAddressTimeout = null
		this.domain = firstThrow(attrs.availableDomains)
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

		return m(TextField, {
			label: "mailAddress_label",
			value: this.username,
			alignRight: true,
			helpLabel: () => this.addressHelpLabel(),
			fontSize: px(size.font_size_smaller),
			oninput: (value) => {
				this.username = value
				this.verifyMailAddress(attrs)
			},
			injectionsRight: () => [
				m(
					".flex.items-end.mr-s",
					{
						style: {
							"padding-bottom": "1px",
							flex: "1 1 auto",
							fontSize: px(size.font_size_smaller)
						},
					},
					`@${this.domain}`,
				),
				attrs.availableDomains.length > 1
					? m(Button, attachDropdown(
						{
							mainButtonAttrs: {
								label: "domain_label",
								icon: () => Icons.More,
								noBubble: true,
							},
							childAttrs: () => attrs.availableDomains.map(domain => this.createDropdownItemAttrs(domain, attrs)),
							showDropdown: () => true,
							width: 250
						},
					))
					: attrs.injectionsRightButtonAttrs
						? m(Button, attrs.injectionsRightButtonAttrs)
						: null,
			],
		})
	}

	private getCleanMailAddress() {
		return formatMailAddressFromParts(this.username, this.domain)
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

	private createDropdownItemAttrs(domain: string, attrs: SelectMailAddressFormAttrs): ButtonAttrs {
		return {
			label: () => domain,
			click: () => {
				attrs.onDomainChanged?.(domain)
				this.domain = domain
				this.verifyMailAddress(attrs)
			},
			type: ButtonType.Dropdown,
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

	private verifyMailAddress({onValidationResult, onBusyStateChanged}: SelectMailAddressFormAttrs) {
		this.checkAddressTimeout && clearTimeout(this.checkAddressTimeout)

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

			return
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