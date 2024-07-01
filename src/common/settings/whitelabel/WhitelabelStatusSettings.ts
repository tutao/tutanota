import { showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
<<<<<<<< HEAD:src/common/settings/whitelabel/WhitelabelStatusSettings.ts
import { TextField } from "../../gui/base/TextField.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { getAvailablePlansWithWhitelabel } from "../../subscription/SubscriptionUtils.js"
========
import { TextField } from "../../../common/gui/base/TextField.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { getAvailablePlansWithWhitelabel } from "../../../common/subscription/SubscriptionUtils.js"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/settings/whitelabel/WhitelabelStatusSettings.ts

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
