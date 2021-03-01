// @flow
import type {Config} from "../ConfigCommon"

function migrate(oldConfig: Config): void {
	Object.assign(oldConfig, {"desktopConfigVersion": 2, "mailExportMode": "eml"})
}

export const migrateClient = migrate
export const migrateAdmin = migrate