import { idToElementId, OperationType } from "@tutao/meta"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { CustomerPropertiesTypeRef, CustomerServerProperties, CustomerServerPropertiesTypeRef, CustomerTypeRef } from "@tutao/entities/sys"
import m, { Children } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { AccountMaintenanceSettings, AccountMaintenanceUpdateNotifier } from "./AccountMaintenanceSettings.js"
import { UpdatableSettingsViewer } from "./Interfaces.js"
import { LazyLoaded, neverNull, noOp, promiseMap } from "@tutao/utils"
import stream from "mithril/stream"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { LoginController } from "../api/main/LoginController"
import { CustomerFacade } from "../api/worker/facades/lazy/CustomerFacade"

assertMainOrNode()

export class MobileGlobalSettingsViewer implements UpdatableSettingsViewer {
	private readonly props = stream<Readonly<CustomerServerProperties>>()
	private accountMaintenanceUpdateNotifier: AccountMaintenanceUpdateNotifier | null = null

	private readonly customerProperties = new LazyLoaded(() =>
		this.entityClient
			.load(CustomerTypeRef, idToElementId(neverNull(this.logins.getUserController().user.customer)))
			.then((customer) => this.entityClient.load(CustomerPropertiesTypeRef, idToElementId(neverNull(customer.properties)))),
	)

	constructor(
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
		private readonly customerFacade: CustomerFacade,
	) {
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
		return this.customerFacade.loadCustomerServerProperties().then((props) => {
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
