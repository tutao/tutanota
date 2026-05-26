import m, { Children } from "mithril"
import { assertMainOrNode } from "../../../platform-kits/app-env"
import { formatDateWithMonth } from "../../../ui/utils/Formatter.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { LegacyTextField } from "../../../ui/base/LegacyTextField.js"
import { UpdatableSettingsDetailsViewer } from "../settings/Interfaces.js"
import { getDisplayNameOfPlanType } from "../subscription/FeatureListProvider"
import { Button, ButtonType } from "../../../ui/base/Button"
import { CustomerInfo } from "@tutao/entities/sys"
import { PlanType } from "../../../entities/sys/Utils"
import { EntityUpdateData } from "../../../platform-kits/instance-pipeline/utils/EntityUpdateUtils"

assertMainOrNode()

export class ManagedCustomerViewer implements UpdatableSettingsDetailsViewer {
	constructor(public customerInfo: CustomerInfo) {
		this.customerInfo = customerInfo
	}

	private getDisplayValueForPlan({ plan }: CustomerInfo) {
		return getDisplayNameOfPlanType(plan as PlanType)
	}

	renderView(): Children {
		return m("#user-viewer.fill-absolute.scroll.plr-24.pb-floating", [
			m(".h4.mt-32", lang.get("adminManagedCustomer_label")),
			m("", [
				m(LegacyTextField, {
					label: "mailAddress_label",
					value: this.customerInfo.registrationMailAddress ?? "",
					isReadOnly: true,
				}),
				m(LegacyTextField, {
					label: "created_label",
					value: formatDateWithMonth(this.customerInfo.creationTime),
					isReadOnly: true,
				}),
				m(LegacyTextField, {
					label: "company_label",
					value: this.customerInfo.company ?? "",
					isReadOnly: true,
				}),
				m(LegacyTextField, {
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

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {}
}
