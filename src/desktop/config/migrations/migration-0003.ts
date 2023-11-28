import { DesktopNativeCryptoFacade } from "../../DesktopNativeCryptoFacade"
import type { Config } from "../ConfigCommon"
import { downcast } from "@tutao/tutanota-utils"
import type { DesktopKeyStoreFacade } from "../../DesktopKeyStoreFacade.js"
import { log } from "../../DesktopLog"

async function migrate(oldConfig: Config, crypto: DesktopNativeCryptoFacade, keyStoreFacade: DesktopKeyStoreFacade): Promise<void> {
	Object.assign(oldConfig, {
		desktopConfigVersion: 3,
	})

	if (oldConfig.pushIdentifier) {
		try {
			const deviceKey = await keyStoreFacade.getDeviceKey()
			Object.assign(oldConfig, {
				sseInfo: crypto.aesEncryptObject(deviceKey, downcast(oldConfig.pushIdentifier)),
			})
		} catch (e) {
			// cannot read device key, just remove sseInfo from old config
			log.warn("migration003: could not read device key, will not save sseInfo", e)
		}

		delete oldConfig.pushIdentifier
	}
}

export const migrateClient = migrate
export const migrateAdmin = migrate
