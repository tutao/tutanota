// @flow
import type {Config} from "../ConfigCommon"

function migrate(oldConfig: Config): void {
	Object.assign(oldConfig, {"desktopConfigVersion": 1, "showAutoUpdateOption": true})
}

export const migrateClient = migrate
export const migrateAdmin = migrate