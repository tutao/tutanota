import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs"
import {showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream"
import m, {Children, Component, Vnode} from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"

export type WhitelabelStatusSettingsAttrs = {
	isWhitelabelActive: boolean
}

export class WhitelabelStatusSettings implements Component<WhitelabelStatusSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelStatusSettingsAttrs>) {
	}

	view(vnode: Vnode<WhitelabelStatusSettingsAttrs>): Children {
		const {isWhitelabelActive} = vnode.attrs
		return this._renderWhitelabelStatusSettings(isWhitelabelActive)
	}

	_renderWhitelabelStatusSettings(isWhitelabelActive: boolean): Children {
		const enableWhiteLabelAction = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(
				false,
				() => showWhitelabelBuyDialog(true),
				() => logins.getUserController().isPremiumAccount(),
			),
			icon: () => Icons.Edit,
		} as const
		const disableWhiteLabelAction = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(
				false,
				() => showWhitelabelBuyDialog(false),
				() => logins.getUserController().isPremiumAccount(),
			),
			icon: () => Icons.Cancel,
		} as const
		const value = isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label")
		const textFieldAttrs = {
			label: "state_label",
			value: value,
			disabled: true,
			injectionsRight: () => (isWhitelabelActive ? m(ButtonN, disableWhiteLabelAction) : m(ButtonN, enableWhiteLabelAction)),
		} as const
		return m(TextFieldN, textFieldAttrs)
	}
}