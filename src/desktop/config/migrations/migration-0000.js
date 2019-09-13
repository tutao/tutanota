// @flow
import type {Config} from "../ConfigCommon"

function migrate(oldConfig: Config): void {
	Object.assign(oldConfig, {"desktopConfigVersion": 0})
}

export const migrateClient = migrate
export const migrateAdmin = migrate