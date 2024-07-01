import type { Config } from "../ConfigCommon"

async function migrateSpellcheckTrue(oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 4,
		spellcheck: true,
	})
}

async function migrateSpellcheckFalse(oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 4,
		spellcheck: false,
	})
}

export const migrateClient = migrateSpellcheckTrue
export const migrateAdmin = migrateSpellcheckFalse
