import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs"
import {showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import m, {Children, Component, Vnode} from "mithril"
import {TextField} from "../../gui/base/TextField.js"
import {IconButton} from "../../gui/base/IconButton.js"
import {ButtonSize} from "../../gui/base/ButtonSize.js";

export type WhitelabelStatusSettingsAttrs = {
	isWhitelabelActive: boolean
}

export class WhitelabelStatusSettings implements Component<WhitelabelStatusSettingsAttrs> {
	view({attrs}: Vnode<WhitelabelStatusSettingsAttrs>): Children {
		const {isWhitelabelActive} = attrs
		return m(TextField, {
			label: "state_label",
			value: isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label"),
			disabled: true,
			injectionsRight: () => (isWhitelabelActive ? this.renderDisable() : this.renderEnable()),
		})
	}

	private renderEnable(): Children {
		return m(IconButton, {
			title: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(
				false,
				() => showWhitelabelBuyDialog(true),
				() => logins.getUserController().isPremiumAccount(),
			),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}

	private renderDisable(): Children {
		return m(IconButton, {
			title: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(
				false,
				() => showWhitelabelBuyDialog(false),
				() => logins.getUserController().isPremiumAccount(),
			),
			icon: Icons.Cancel,
			size: ButtonSize.Compact,
		})
	}
}