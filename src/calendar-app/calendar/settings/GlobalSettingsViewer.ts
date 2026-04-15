import m, { Children } from "mithril"
import { assertMainOrNode, OperationType } from "@tutao/app-env"
import { AccountMaintenanceSettings, AccountMaintenanceUpdateNotifier } from "../../../common/settings/AccountMaintenanceSettings.js"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { LazyLoaded, neverNull, noOp, promiseMap } from "@tutao/utils"
import stream from "mithril/stream"
import { calendarLocator } from "../../calendarLocator.js"
import { entityUpdateUtils, sysTypeRefs } from "@tutao/typerefs"

assertMainOrNode()

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	private readonly props = stream<Readonly<sysTypeRefs.CustomerServerProperties>>()
	private accountMaintenanceUpdateNotifier: AccountMaintenanceUpdateNotifier | null = null

	private readonly customerProperties = new LazyLoaded(() =>
		calendarLocator.entityClient
			.load(sysTypeRefs.CustomerTypeRef, neverNull(calendarLocator.logins.getUserController().user.customer))
			.then((customer) => calendarLocator.entityClient.load(sysTypeRefs.CustomerPropertiesTypeRef, neverNull(customer.properties))),
	)

	constructor() {
		this.customerProperties.getAsync().then(m.redraw)
		this.updateCustomerServerProperties()
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m("#global-settings.fill-absolute.scroll.plr-24", [
			m(AccountMaintenanceSettings, {
				customerServerProperties: this.props,
				setOnUpdateHandler: (fn: AccountMaintenanceUpdateNotifier) => {
					this.accountMaintenanceUpdateNotifier = fn
				},
			}),
		])
	}

	private updateCustomerServerProperties(): Promise<void> {
		return calendarLocator.customerFacade.loadCustomerServerProperties().then((props) => {
			this.props(props)
			m.redraw()
		})
	}

	entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>): Promise<void> {
		this.accountMaintenanceUpdateNotifier?.(updates)

		return promiseMap(updates, (update) => {
			if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this.updateCustomerServerProperties()
			}
		}).then(noOp)
	}
}
