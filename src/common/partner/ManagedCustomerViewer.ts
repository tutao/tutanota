import m, { Children } from "mithril"
import { assertMainOrNode } from "../api/common/Env.js"
import { formatDateWithMonth } from "../misc/Formatter.js"
import { lang } from "../misc/LanguageViewModel.js"
import { CustomerInfo } from "../api/entities/sys/TypeRefs.js"
import { TextField } from "../gui/base/TextField.js"
import { EntityUpdateData } from "../api/common/utils/EntityUpdateUtils.js"
import { UpdatableSettingsDetailsViewer } from "../settings/Interfaces.js"
import { PlanType } from "../api/common/TutanotaConstants"
import { getDisplayNameOfPlanType } from "../subscription/FeatureListProvider"

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
			]),
		])
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update
			//we might need the same as for the list
		}
		m.redraw()
	}
}
