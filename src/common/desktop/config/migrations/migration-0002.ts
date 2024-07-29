import type { Config } from "../ConfigCommon"

async function migrate(oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 2,
		mailExportMode: process.platform === "win32" ? "msg" : "eml",
	})
}

export const migrateClient = migrate
export const migrateAdmin = migrate
