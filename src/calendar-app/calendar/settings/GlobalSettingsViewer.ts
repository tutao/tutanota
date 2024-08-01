import m, { Children } from "mithril"
import { assertMainOrNode } from "../../../common/api/common/Env.js"
import { AccountMaintenanceSettings, AccountMaintenanceUpdateNotifier } from "../../../common/settings/AccountMaintenanceSettings.js"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { LazyLoaded, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils"
import {
	CustomerPropertiesTypeRef,
	CustomerServerProperties,
	CustomerServerPropertiesTypeRef,
	CustomerTypeRef,
} from "../../../common/api/entities/sys/TypeRefs.js"
import { OperationType } from "../../../common/api/common/TutanotaConstants.js"
import stream from "mithril/stream"
import { calendarLocator } from "../../calendarLocator.js"

assertMainOrNode()

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	private readonly props = stream<Readonly<CustomerServerProperties>>()
	private accountMaintenanceUpdateNotifier: AccountMaintenanceUpdateNotifier | null = null

	private readonly customerProperties = new LazyLoaded(() =>
		calendarLocator.entityClient
			.load(CustomerTypeRef, neverNull(calendarLocator.logins.getUserController().user.customer))
			.then((customer) => calendarLocator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties))),
	)

	constructor() {
		this.customerProperties.getAsync().then(m.redraw)
		this.updateCustomerServerProperties()
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m("#global-settings.fill-absolute.scroll.plr-l", [
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

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		this.accountMaintenanceUpdateNotifier?.(updates)

		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this.updateCustomerServerProperties()
			}
		}).then(noOp)
	}
}
