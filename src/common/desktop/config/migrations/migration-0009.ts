import type { Config, ConfigMigration } from "../ConfigCommon"
import { DesktopConfigKey } from "../ConfigKeys.js"

export const migrateClient: ConfigMigration = async function (oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 9,
		[DesktopConfigKey.mailboxExportState]: {},
	})
}
export const migrateAdmin: ConfigMigration = async (oldConfig: Config) => {
	Object.assign(oldConfig, {
		desktopConfigVersion: 9,
	})
}
