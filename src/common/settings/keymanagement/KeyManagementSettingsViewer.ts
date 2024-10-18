import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import { Children } from "mithril"

export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return Promise.resolve()
	}

	view(): Children {
		return null
	}
}
