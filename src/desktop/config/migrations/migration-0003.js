// @flow

import {DesktopCryptoFacade} from "../../DesktopCryptoFacade"
import type {Config} from "../ConfigCommon"
import {downcast} from "../../../api/common/utils/Utils"
import type {DeviceKeyProvider} from "../../DeviceKeyProviderImpl"

async function migrate(oldConfig: Config, crypto: DesktopCryptoFacade, deviceKeyProvider: DeviceKeyProvider): Promise<void> {
	Object.assign(oldConfig, {
		"desktopConfigVersion": 3,
	})

	if (oldConfig.pushIdentifier) {
		const deviceKey = await deviceKeyProvider.getDeviceKey()

		Object.assign(oldConfig, {"sseInfo": crypto.aesEncryptObject(deviceKey, downcast(oldConfig.pushIdentifier))})
		delete oldConfig.pushIdentifier
	}

}

export const migrateClient = migrate
export const migrateAdmin = migrate

