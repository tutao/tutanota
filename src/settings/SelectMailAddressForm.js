// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {isTutanotaMailAddress} from "../api/common/RecipientInfo"
import {isMailAddress} from "../misc/FormatValidator"
import {worker} from "../api/main/WorkerClient"
import {Icons} from "../gui/base/icons/Icons"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {attachDropdown} from "../gui/base/DropdownN"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {neverNull, noOp} from "../api/common/utils/Utils.js"
import {firstThrow} from "../api/common/utils/ArrayUtils"
import {formatMailAddressFromParts} from "../misc/Formatter"
import {Icon} from "../gui/base/Icon"
import {BootIcons} from "../gui/base/icons/BootIcons"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export type SelectMailAddressFormAttrs = {
	availableDomains: Array<string>,
	onEmailChanged: (string, ValidationResult) => mixed,
	onBusyStateChanged: (boolean) => mixed,
	injectionsRightButtonAttrs?: ?ButtonAttrs,
	onDomainChanged?: (string) => mixed,
}

export type ValidationResult = {isValid: boolean, errorId?: null} | {isValid: boolean, errorId: TranslationKey}

export class SelectMailAddressForm implements MComponent<SelectMailAddressFormAttrs> {
	cleanMailAddress: Stream<string>;
	_username: Stream<string>;
	_domain: Stream<string>;
	_messageId: Stream<?TranslationKey>;
	_checkAddressTimeout: ?TimeoutID;
	_isVerficationBusy: boolean

	constructor({attrs}: Vnode<SelectMailAddressFormAttrs>) {
		this._isVerficationBusy = false
		this._messageId = stream("mailAddressNeutral_msg")
		this._checkAddressTimeout = null
		const preSelectedDomain = firstThrow(attrs.availableDomains)
		this._domain = stream(preSelectedDomain)
		this._username = stream("")
		this.cleanMailAddress = stream.merge([this._username, this._domain])
		                              .map(([name, domain]) => formatMailAddressFromParts(name, domain))
	}

	view({attrs}: Vnode<SelectMailAddressFormAttrs>): Children {

		const validate = () => this._verifyMailAddress(
			(result) => attrs.onEmailChanged(this.cleanMailAddress(), result),
			attrs.onBusyStateChanged
		)
		const domainChooserAttrs: ButtonAttrs = attachDropdown({
				label: "domain_label",
				icon: () => Icons.More,
				noBubble: true,
			},
			() => attrs.availableDomains.map(domain =>
				this._createDropdownItemAttrs(domain, validate, attrs.onDomainChanged || noOp)),
			() => true,
			250
		)

		// this is a semi-good hack to reset the username after the user pressed "ok"
		if (attrs.injectionsRightButtonAttrs && attrs.injectionsRightButtonAttrs.click) {
			const originalCallback = attrs.injectionsRightButtonAttrs.click
			attrs.injectionsRightButtonAttrs.click = (event, dom) => {
				originalCallback(event, dom)
				this._username = stream("")
			}
		}

		const userNameAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._username,
			alignRight: true,
			helpLabel: () => this._addressHelpLabel(),
			oncreate: validate,
			oninput: validate,
			injectionsRight: () => [
				m(".flex.items-end.mr-s", {style: {"padding-bottom": '1px', "flex": "1 1 auto"}}, `@${this._domain()}`),
				attrs.availableDomains.length > 1
					? m(ButtonN, domainChooserAttrs)
					: (attrs.injectionsRightButtonAttrs ? m(ButtonN, attrs.injectionsRightButtonAttrs) : null)
			]
		}
		return m(TextFieldN, userNameAttrs)
	}

	_addressHelpLabel(): Children {
		return this._isVerficationBusy ?
			m(".flex.items-center.mt-s", [this._progressIcon(), lang.get("mailAddressBusy_msg")])
			: m(".mt-s", lang.get(this._messageId() || VALID_MESSAGE_ID))
	}

	_progressIcon(): Children {
		return m(Icon, {
			icon: BootIcons.Progress,
			class: 'icon-progress mr-s'
		})
	}

	_createDropdownItemAttrs(domain: string, validate: () => mixed, onDomainSelected: (string) => mixed): ButtonAttrs {
		return {
			label: () => domain,
			click: () => {
				onDomainSelected(domain)
				this._domain(domain)
				validate()
			},
			type: ButtonType.Dropdown
		}
	}

	_onBusyStateChanged(isBusy: boolean, onBusyStateChanged: (boolean) => mixed): void {
		this._isVerficationBusy = isBusy
		onBusyStateChanged(isBusy)
		m.redraw()
	}

	_onValidationFinished(email: string, validationResult: ValidationResult, onValidationResult: (ValidationResult) => mixed): void {
		this._messageId(validationResult.errorId)
		onValidationResult(validationResult)
	}

	_verifyMailAddress(onValidationResult: (ValidationResult) => mixed, onBusyStateChanged: (boolean) => mixed) {
		clearTimeout(neverNull(this._checkAddressTimeout))
		let cleanMailAddress = this.cleanMailAddress()
		let cleanUsername = this._username().trim().toLowerCase()
		if (cleanUsername === "") {
			this._onValidationFinished(cleanMailAddress, {isValid: false, errorId: "mailAddressNeutral_msg"}, onValidationResult)
			return
		} else if (!isMailAddress(cleanMailAddress, true)
			|| (isTutanotaMailAddress(cleanMailAddress) && cleanUsername.length < 3)
		) {
			this._onValidationFinished(cleanMailAddress, {isValid: false, errorId: "mailAddressInvalid_msg"}, onValidationResult)
			return
		}
		this._onBusyStateChanged(true, onBusyStateChanged)
		this._checkAddressTimeout = setTimeout(() => {
			if (this.cleanMailAddress() !== cleanMailAddress) return
			worker.initialized.then(() => worker.isMailAddressAvailable(cleanMailAddress))
			      .then(available => {
				      if (this.cleanMailAddress() === cleanMailAddress) {
					      if (available) {
						      this._onValidationFinished(cleanMailAddress, {isValid: true}, onValidationResult)
					      } else {
						      this._onValidationFinished(
							      cleanMailAddress,
							      {isValid: false, errorId: "mailAddressNA_msg"},
							      onValidationResult
						      )
					      }
				      }
			      })
			      .catch(AccessDeactivatedError, () => {
				      this._onValidationFinished(
					      cleanMailAddress,
					      {isValid: false, errorId: "mailAddressDelay_msg"},
					      onValidationResult
				      )
			      })
			      .finally(() => {
				      this._onBusyStateChanged(false, onBusyStateChanged)
			      })
		}, 500)
	}
}

