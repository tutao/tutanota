import type { Config } from "../ConfigCommon"
import type { ElectronExports } from "./DesktopConfigMigrator"

async function migrateSpellcheck(oldConfig: Config, electron: ElectronExports): Promise<void> {
	const currentLang = electron.session.defaultSession.getSpellCheckerLanguages()[0]
	const spellcheckActivated = oldConfig.spellcheck === true
	Object.assign(oldConfig, {
		desktopConfigVersion: 5,
		spellcheck: spellcheckActivated && currentLang ? currentLang : "",
	})
}

export const migrateClient = migrateSpellcheck
export const migrateAdmin = migrateSpellcheck
