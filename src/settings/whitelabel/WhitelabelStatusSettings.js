// @flow

import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs"
import {showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import m from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"

export type WhitelabelStatusSettingsAttrs = {
	isWhitelabelActive: boolean
}

export class WhitelabelStatusSettings implements MComponent<WhitelabelStatusSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelStatusSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelStatusSettingsAttrs>): Children {
		const {isWhitelabelActive} = vnode.attrs

		return this._renderWhitelabelStatusSettings(isWhitelabelActive)
	}

	_renderWhitelabelStatusSettings(isWhitelabelActive: boolean): Children {
		const enableWhiteLabelAction = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(true),
				() => logins.getUserController().isPremiumAccount()),
			icon: () => Icons.Edit,
		}

		const disableWhiteLabelAction = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(false),
				() => logins.getUserController().isPremiumAccount()),
			icon: () => Icons.Cancel,
		}

		const value = isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label")
		const textFieldAttrs = {
			label: "state_label",
			value: stream(value),
			disabled: true,
			injectionsRight: () => isWhitelabelActive ? m(ButtonN, disableWhiteLabelAction) : m(ButtonN, enableWhiteLabelAction),
		}

		return m(TextFieldN, textFieldAttrs)
	}
}