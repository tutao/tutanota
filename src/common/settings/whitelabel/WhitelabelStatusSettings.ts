import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs"
import { Icons } from "../../gui/base/icons/Icons"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { TextField } from "../../gui/base/TextField.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { getAvailablePlansWithWhitelabel } from "../../subscription/SubscriptionUtils.js"

export type WhitelabelStatusSettingsAttrs = {
	isWhitelabelActive: boolean
}

export class WhitelabelStatusSettings implements Component<WhitelabelStatusSettingsAttrs> {
	view({ attrs }: Vnode<WhitelabelStatusSettingsAttrs>): Children {
		const { isWhitelabelActive } = attrs
		return m(TextField, {
			label: "state_label",
			value: isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label"),
			isReadOnly: true,
			injectionsRight: () => (isWhitelabelActive ? null : this.renderEnable()),
		})
	}

	private renderEnable(): Children {
		return m(IconButton, {
			title: "whitelabelDomain_label",
			click: async () => {
				const plansWithWhitelabel = await getAvailablePlansWithWhitelabel()
				showPlanUpgradeRequiredDialog(plansWithWhitelabel)
			},
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}
}
