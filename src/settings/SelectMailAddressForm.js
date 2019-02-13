// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {lang} from "../misc/LanguageViewModel"
import {isTutanotaMailAddress} from "../api/common/RecipientInfo"
import {isMailAddress} from "../misc/FormatValidator"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {Icons} from "../gui/base/icons/Icons"
import type {TranslationKey} from "../misc/LanguageViewModel"

assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export class SelectMailAddressForm {
	view: Function;
	_username: TextField;
	_domain: string;
	_messageId: TranslationKey;

	constructor(availableDomains: string[]) {
		this._messageId = "mailAddressNeutral_msg"
		this._domain = availableDomains[0]
		this._username = new TextField("mailAddress_label", () => lang.get(this._messageId)).alignRight()
		let domainChooser = createDropDownButton("domain_label", () => Icons.More, () => availableDomains.map(domain => new Button(() => domain, () => {
			this._domain = domain
			this._verifyMailAddress()
		}).setType(ButtonType.Dropdown))).disableBubbling()
		this._username._injectionsRight = () => [
			m(".flex.items-end.mr-s", {style: {"padding-bottom": '1px'}}, `@${this._domain}`),
			m(domainChooser)
		]
		// TODO this._username.focus()

		this.view = () => {
			return m(this._username)
		}

		this._username.onUpdate(newValue => this._verifyMailAddress())
	}

	_verifyMailAddress() {
		let cleanMailAddress = this.getCleanMailAddress()
		let cleanUsername = this._username.value().trim().toLowerCase()
		if (cleanUsername === "") {
			this._messageId = "mailAddressNeutral_msg"
			m.redraw()
			return
		} else if (!isMailAddress(cleanMailAddress, true) || (isTutanotaMailAddress(cleanMailAddress)
			&& cleanUsername.length < 3)) {
			this._messageId = "mailAddressInvalid_msg"
			m.redraw()
			return
		}
		this._messageId = "mailAddressBusy_msg"
		m.redraw()
		setTimeout(() => {
			if (this.getCleanMailAddress() === cleanMailAddress) {
				worker.initialized.then(() => {
					worker.isMailAddressAvailable(cleanMailAddress).then(available => {
						if (this.getCleanMailAddress() === cleanMailAddress) {
							if (available) {
								this._messageId = VALID_MESSAGE_ID
							} else {
								this._messageId = "mailAddressNA_msg"
							}
							m.redraw()
						}
					}).catch(AccessDeactivatedError, () => {
						this._messageId = "mailAddressDelay_msg"
						m.redraw()
					});
				})
			}
		}, 500);
	}

	getCleanMailAddress(): string {
		return (this._username.value() + "@" + this._domain).trim().toLowerCase()
	}

	/**
	 * @return null if the entered email address is valid, the corresponding error message otherwise
	 */
	getErrorMessageId(): ?TranslationKey {
		return (this._messageId === VALID_MESSAGE_ID) ? null : this._messageId
	}
}

