import { createNotAvailableForFreeClickHandler, showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs"
import { Icons } from "../../gui/base/icons/Icons"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { TextField } from "../../gui/base/TextField.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { LoginController } from "../../api/main/LoginController.js"
import { PlanType } from "../../api/common/TutanotaConstants.js"

export type WhitelabelStatusSettingsAttrs = {
	isWhitelabelActive: boolean
	logins: LoginController
}

export class WhitelabelStatusSettings implements Component<WhitelabelStatusSettingsAttrs> {
	view({ attrs }: Vnode<WhitelabelStatusSettingsAttrs>): Children {
		const { isWhitelabelActive, logins } = attrs
		return m(TextField, {
			label: "state_label",
			value: isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label"),
			disabled: true,
			injectionsRight: () => (isWhitelabelActive ? null : this.renderEnable(logins)),
		})
	}

	private renderEnable(logins: LoginController): Children {
		return m(IconButton, {
			title: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(
				[PlanType.Unlimited],
				() => showPlanUpgradeRequiredDialog([PlanType.Unlimited]),
				() => logins.getUserController().isPremiumAccount(),
			),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}
}
