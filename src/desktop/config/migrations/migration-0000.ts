import type { Config } from "../ConfigCommon"

async function migrate(oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 0,
	})
}

export const migrateClient = migrate
export const migrateAdmin = migrate
