import type { Config, ConfigMigration } from "../ConfigCommon"
import { DesktopConfigKey } from "../ConfigKeys.js"

export const migrateClient: ConfigMigration = async function (oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 10,
		[DesktopConfigKey.scheduledAlarms]: [],
	})
}
export const migrateAdmin: ConfigMigration = async (oldConfig: Config) => {
	Object.assign(oldConfig, {
		desktopConfigVersion: 10,
	})
}
