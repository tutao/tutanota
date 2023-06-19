import { getAvailableMatchingPlans, showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs"
import { Icons } from "../../gui/base/icons/Icons"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { TextField } from "../../gui/base/TextField.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { IServiceExecutor } from "../../api/common/ServiceRequest.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

export type WhitelabelStatusSettingsAttrs = {
	isWhitelabelActive: boolean
	serviceExecutor: IServiceExecutor
}

export class WhitelabelStatusSettings implements Component<WhitelabelStatusSettingsAttrs> {
	view({ attrs }: Vnode<WhitelabelStatusSettingsAttrs>): Children {
		const { isWhitelabelActive, serviceExecutor } = attrs
		return m(TextField, {
			label: "state_label",
			value: isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label"),
			disabled: true,
			injectionsRight: () => (isWhitelabelActive ? null : this.renderEnable(serviceExecutor)),
		})
	}

	private renderEnable(serviceExecutor: IServiceExecutor): Children {
		return m(IconButton, {
			title: "whitelabelDomain_label",
			click: async () => {
				const plansWithWhitelabel = await getAvailableMatchingPlans(serviceExecutor, (config) => config.whitelabel)
				if (plansWithWhitelabel.length <= 0) {
					throw new ProgrammingError("no plans to upgrade to")
				}
				showPlanUpgradeRequiredDialog(plansWithWhitelabel)
			},
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}
}
