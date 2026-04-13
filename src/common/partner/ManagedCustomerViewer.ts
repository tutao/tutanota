import m, { Children } from "mithril"
import { assertMainOrNode, PlanType } from "@tutao/appEnv"
import { formatDateWithMonth } from "../misc/Formatter.js"
import { lang } from "../misc/LanguageViewModel.js"
import { TextField } from "../gui/base/TextField.js"
import { UpdatableSettingsDetailsViewer } from "../settings/Interfaces.js"
import { getDisplayNameOfPlanType } from "../subscription/FeatureListProvider"
import { Button, ButtonType } from "../gui/base/Button"
import { entityUpdateUtils, sysTypeRefs } from "@tutao/typeRefs"

assertMainOrNode()

export class ManagedCustomerViewer implements UpdatableSettingsDetailsViewer {
	constructor(public customerInfo: sysTypeRefs.CustomerInfo) {
		this.customerInfo = customerInfo
	}

	private getDisplayValueForPlan({ plan }: sysTypeRefs.CustomerInfo) {
		return getDisplayNameOfPlanType(plan as PlanType)
	}

	renderView(): Children {
		return m("#user-viewer.fill-absolute.scroll.plr-24.pb-floating", [
			m(".h4.mt-32", lang.get("adminManagedCustomer_label")),
			m("", [
				m(TextField, {
					label: "mailAddress_label",
					value: this.customerInfo.registrationMailAddress ?? "",
					isReadOnly: true,
				}),
				m(TextField, {
					label: "created_label",
					value: formatDateWithMonth(this.customerInfo.creationTime),
					isReadOnly: true,
				}),
				m(TextField, {
					label: "company_label",
					value: this.customerInfo.company ?? "",
					isReadOnly: true,
				}),
				m(TextField, {
					label: "subscription_label",
					value: this.getDisplayValueForPlan(this.customerInfo),
					isReadOnly: true,
				}),
				m(Button, {
					label: "openLoginNewWindow_action",
					type: ButtonType.Primary,
					click: () => window.open("/login?noAutoLogin=true"),
				}),
			]),
		])
	}

	async entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>) {}
}
