import m, {Children, Component, Vnode} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {isTutanotaMailAddress} from "../api/common/RecipientInfo"
import {isMailAddress} from "../misc/FormatValidator"
import {Icons} from "../gui/base/icons/Icons"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {attachDropdown} from "../gui/base/DropdownN"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {firstThrow, neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import {formatMailAddressFromParts} from "../misc/Formatter"
import {Icon} from "../gui/base/Icon"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()
const VALID_MESSAGE_ID = "mailAddressAvailable_msg"
export type SelectMailAddressFormAttrs = {
	availableDomains: Array<string>
	onEmailChanged: (arg0: string, arg1: ValidationResult) => unknown
	onBusyStateChanged: (arg0: boolean) => unknown
	injectionsRightButtonAttrs?: ButtonAttrs | null
	onDomainChanged?: (arg0: string) => unknown
}

export type ValidationResult = {isValid: boolean, errorId: TranslationKey | null}

export class SelectMailAddressForm implements Component<SelectMailAddressFormAttrs> {
	cleanMailAddress: Stream<string>
	_username: Stream<string>
	_domain: Stream<string>
	_messageId: Stream<TranslationKey | null>
	_checkAddressTimeout: TimeoutID | null
	_isVerficationBusy: boolean

	constructor({attrs}: Vnode<SelectMailAddressFormAttrs>) {
		this._isVerficationBusy = false
		this._checkAddressTimeout = null
		const preSelectedDomain = firstThrow(attrs.availableDomains)
		this._domain = stream(preSelectedDomain)
		this._username = stream("")
		this._messageId = stream<TranslationKey | null>("mailAddressNeutral_msg")
		this.cleanMailAddress = this._createCleanMailAddressStream()
	}

	view({attrs}: Vnode<SelectMailAddressFormAttrs>): Children {
		const validate = () => this._verifyMailAddress(result => attrs.onEmailChanged(this.cleanMailAddress(), result), attrs.onBusyStateChanged)

		const domainChooserAttrs: ButtonAttrs = attachDropdown(
			{
                mainButtonAttrs: {
                    label: "domain_label",
                    icon: () => Icons.More,
                    noBubble: true,
                },
                childAttrs: () => attrs.availableDomains.map(domain => this._createDropdownItemAttrs(domain, validate, attrs.onDomainChanged || noOp)),
                showDropdown: () => true,
                width: 250
            },
		)

		// this is a semi-good hack to reset the username after the user pressed "ok"
		if (attrs.injectionsRightButtonAttrs && attrs.injectionsRightButtonAttrs.click) {
			const originalCallback = attrs.injectionsRightButtonAttrs.click

			attrs.injectionsRightButtonAttrs.click = (event, dom) => {
				originalCallback(event, dom)
				// We can't just do this._username(""), because that will trigger email validation,
				// which does a whole bunch of stuff that we don't want it to do
				this.cleanMailAddress.end(true)
				this._username = stream("")

				this._messageId("mailAddressNeutral_msg")

				this.cleanMailAddress = this._createCleanMailAddressStream()
			}
		}

		const userNameAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._username(),
			alignRight: true,
			helpLabel: () => this._addressHelpLabel(),
			oninput: (value) => {
				this._username(value)
				validate()
			},
			injectionsRight: () => [
				m(
					".flex.items-end.mr-s",
					{
						style: {
							"padding-bottom": "1px",
							flex: "1 1 auto",
						},
					},
					`@${this._domain()}`,
				),
				attrs.availableDomains.length > 1
					? m(ButtonN, domainChooserAttrs)
					: attrs.injectionsRightButtonAttrs
						? m(ButtonN, attrs.injectionsRightButtonAttrs)
						: null,
			],
		}
		return m(TextFieldN, userNameAttrs)
	}

	_createCleanMailAddressStream(): Stream<string> {
		return stream.merge([this._username, this._domain]).map(([name, domain]) => formatMailAddressFromParts(name, domain))
	}

	_addressHelpLabel(): Children {
		return this._isVerficationBusy
			? m(".flex.items-center.mt-s", [this._progressIcon(), lang.get("mailAddressBusy_msg")])
			: m(".mt-s", lang.get(this._messageId() || VALID_MESSAGE_ID))
	}

	_progressIcon(): Children {
		return m(Icon, {
			icon: BootIcons.Progress,
			class: "icon-progress mr-s",
		})
	}

	_createDropdownItemAttrs(domain: string, validate: () => unknown, onDomainSelected: (arg0: string) => unknown): ButtonAttrs {
		return {
			label: () => domain,
			click: () => {
				onDomainSelected(domain)

				this._domain(domain)

				validate()
			},
			type: ButtonType.Dropdown,
		}
	}

	_onBusyStateChanged(isBusy: boolean, onBusyStateChanged: (arg0: boolean) => unknown): void {
		this._isVerficationBusy = isBusy
		onBusyStateChanged(isBusy)
		m.redraw()
	}

	_onValidationFinished(email: string, validationResult: ValidationResult, onValidationResult: (arg0: ValidationResult) => unknown): void {
		this._messageId(validationResult.errorId)

		onValidationResult(validationResult)
	}

	_verifyMailAddress(onValidationResult: (arg0: ValidationResult) => unknown, onBusyStateChanged: (arg0: boolean) => unknown) {
		clearTimeout(neverNull(this._checkAddressTimeout))
		let cleanMailAddress = this.cleanMailAddress()

		let cleanUsername = this._username().trim().toLowerCase()

		if (cleanUsername === "") {
			this._onValidationFinished(
				cleanMailAddress,
				{
					isValid: false,
					errorId: "mailAddressNeutral_msg",
				},
				onValidationResult,
			)

			return
		} else if (!isMailAddress(cleanMailAddress, true) || (isTutanotaMailAddress(cleanMailAddress) && cleanUsername.length < 3)) {
			this._onValidationFinished(
				cleanMailAddress,
				{
					isValid: false,
					errorId: "mailAddressInvalid_msg",
				},
				onValidationResult,
			)

			return
		}

		this._onBusyStateChanged(true, onBusyStateChanged)

		this._checkAddressTimeout = setTimeout(() => {
			if (this.cleanMailAddress() !== cleanMailAddress) return
			locator.mailAddressFacade
				   .isMailAddressAvailable(cleanMailAddress)
				   .then(available => {
					   if (this.cleanMailAddress() === cleanMailAddress) {
						   if (available) {
							   this._onValidationFinished(
								   cleanMailAddress,
								   {
									   isValid: true,
									   errorId: null,
								   },
								   onValidationResult,
							   )
						   } else {
							   this._onValidationFinished(
								   cleanMailAddress,
								   {
									   isValid: false,
									   errorId: "mailAddressNA_msg",
								   },
								   onValidationResult,
							   )
						   }
					   }
				   })
				   .catch(
					   ofClass(AccessDeactivatedError, () => {
						   this._onValidationFinished(
							   cleanMailAddress,
							   {
								   isValid: false,
								   errorId: "mailAddressDelay_msg",
							   },
							   onValidationResult,
						   )
					   }),
				   )
				   .finally(() => {
					   this._onBusyStateChanged(false, onBusyStateChanged)
				   })
		}, 500)
	}
}