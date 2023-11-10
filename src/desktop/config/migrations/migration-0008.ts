import type { Config } from "../ConfigCommon"
import { DesktopConfigKey } from "../ConfigKeys.js"
import { WindowBounds } from "../../DesktopWindowManager.js"
import { DesktopConfig } from "../DesktopConfig.js"

/** add the appPin default value to the config */
async function migrate(oldConfig: Config): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 8,
		[DesktopConfigKey.appPinSalt]: null,
	})
}

export const migrateClient = migrate
export const migrateAdmin = migrate
