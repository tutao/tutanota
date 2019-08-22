// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
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
import {neverNull} from "../api/common/utils/Utils.js"


assertMainOrNode()

const VALID_MESSAGE_ID = "mailAddressAvailable_msg"

export class SelectMailAddressForm {
	view: Function;
	cleanMailAddress: Stream<string>;
	_username: Stream<string>;
	domain: Stream<string>;
	_messageId: Stream<TranslationKey>;
	_checkAddressTimeout: ?TimeoutID;
	_availableDomains: string[];
	injectionsRightButtonAttrs: ?ButtonAttrs;

	constructor(availableDomains: string[], injectionsRightButtonAttrs: ?ButtonAttrs = null) {
		this.injectionsRightButtonAttrs = injectionsRightButtonAttrs
		this._messageId = stream("mailAddressNeutral_msg")
		this._availableDomains = availableDomains
		this._checkAddressTimeout = null
		this.domain = stream(availableDomains[0])
		this._username = stream("")
		this.cleanMailAddress = stream.merge([this._username, this.domain])
		                              .map(vals => (vals[0] + "@" + vals[1]).trim().toLowerCase())
		this.cleanMailAddress.map(() => this._verifyMailAddress())
		stream.merge([this._messageId, this.cleanMailAddress]).map(m.redraw)
	}

	view(): Children {
		const domainChooserAttrs: ButtonAttrs = attachDropdown({
			label: "domain_label",
			icon: () => Icons.More,
			noBubble: true
		}, () => this._availableDomains.map(domain => {
			return {
				label: () => domain,
				click: () => this.domain(domain),
				type: ButtonType.Dropdown
			}
		}), () => true, 250)

		const userNameAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._username,
			alignRight: true,
			helpLabel: () => lang.get(this._messageId()),
			injectionsRight: () => [
				m(".flex.items-end.mr-s", {style: {"padding-bottom": '1px', "flex": "1 1 auto"}}, `@${this.domain()}`),
				this._availableDomains.length > 1
					? m(ButtonN, domainChooserAttrs)
					: (this.injectionsRightButtonAttrs ? m(ButtonN, this.injectionsRightButtonAttrs) : null)
			]
		}
		return m(TextFieldN, userNameAttrs)
	}

	_verifyMailAddress() {
		clearTimeout(neverNull(this._checkAddressTimeout))
		let cleanMailAddress = this.cleanMailAddress()
		let cleanUsername = this._username().trim().toLowerCase()
		if (cleanUsername === "") {
			this._messageId("mailAddressNeutral_msg")
			return
		} else if (!isMailAddress(cleanMailAddress, true)
			|| (isTutanotaMailAddress(cleanMailAddress) && cleanUsername.length < 3)
		) {
			this._messageId("mailAddressInvalid_msg")
			return
		}
		this._messageId("mailAddressBusy_msg")
		this._checkAddressTimeout = setTimeout(() => {
			if (this.cleanMailAddress() !== cleanMailAddress) return
			worker.initialized.then(() => worker.isMailAddressAvailable(cleanMailAddress))
			      .then(available => {
				      if (this.cleanMailAddress() === cleanMailAddress) {
					      this._messageId(available ? VALID_MESSAGE_ID : "mailAddressNA_msg")
				      }
			      })
			      .catch(AccessDeactivatedError, () => this._messageId("mailAddressDelay_msg"))
		}, 500)
	}

	getCleanMailAddress(): string {
		return this.cleanMailAddress()
	}

	/**
	 * @return null if the entered email address is valid, the corresponding error message otherwise
	 */
	getErrorMessageId(): ?TranslationKey {
		return (this._messageId() === VALID_MESSAGE_ID) ? null : this._messageId()
	}
}

