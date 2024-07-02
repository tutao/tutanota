import m, { Children } from "mithril"
import { assertMainOrNode } from "../../../common/api/common/Env.js"
import { AccountMaintenanceSettings } from "../../../common/settings/AccountMaintenanceSettings.js"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { Type } from "cborg"
import undefined = Type.undefined
import { noOp } from "@tutao/tutanota-utils"

assertMainOrNode()

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	view(): Children {
		return m(AccountMaintenanceSettings)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		return new Promise(() => noOp())
	}
}
