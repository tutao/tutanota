import type {Config} from "../ConfigCommon"

async function migrate(oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 6,
		offlineStorage: false,
	})
}

export const migrateClient = migrate
export const migrateAdmin = migrate
