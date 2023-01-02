import type { Config } from "../ConfigCommon"
import { DesktopConfigKey } from "../ConfigKeys.js"
import { WindowBounds } from "../../DesktopWindowManager.js"

const newDefault = {
	rect: {
		x: 200,
		y: 200,
		width: 1200,
		height: 700,
	},
	fullscreen: false,
	scale: 1,
}

async function migrate(oldConfig: Config): Promise<void> {
	// only migrate those that
	// * have the old default size
	// * don't have a value set (first run)
	let oldBounds = oldConfig[DesktopConfigKey.lastBounds] as WindowBounds
	if (oldBounds == null) {
		oldBounds = newDefault
	} else if (oldBounds.rect.width === 800 && oldBounds.rect.height === 600) {
		oldBounds.rect.width = newDefault.rect.width
		oldBounds.rect.height = newDefault.rect.height
	}
	Object.assign(oldConfig, {
		lastBounds: oldBounds,
		desktopConfigVersion: 7,
	})
}

export const migrateClient = migrate
export const migrateAdmin = migrate
