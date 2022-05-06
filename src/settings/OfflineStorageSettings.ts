import {OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS} from "../api/common/TutanotaConstants.js";
import {isOfflineStorageAvailable} from "../api/common/Env.js";
import {assert, lazy} from "@tutao/tutanota-utils";
import {IUserController} from "../api/main/UserController"
import {NativeSystemApp} from "../native/common/NativeSystemApp"
import {DesktopConfigKey} from "../desktop/config/ConfigKeys"
import {DeviceConfig} from "../misc/DeviceConfig"

/**
 * A model for handling offline storage configuration
 * Accessing setters and getters will throw if you are not in a context where an offline database is available
 * Some logic is duplicated from OfflineStorage
 */
export class OfflineStorageSettingsModel {

	private _isInitialized = false
	private isEnabled: boolean | null = null

	// the default value will never actually be used
	private timeRange = OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS

	// Native interfaces are lazy to allow us to unconditionally construct the SettingsModel
	// If we are not in a native context, then they should never be accessed
	constructor(
		private readonly systemApp: lazy<NativeSystemApp>,
		private readonly userController: IUserController,
		private readonly deviceConfig: DeviceConfig,
	) {
	}

	available(): boolean {
		return this._isInitialized && isOfflineStorageAvailable() && !!this.isEnabled
	}

	private assertAvailable() {
		assert(this.available(), "Not initialized or not available")
	}

	/**
	 * get stored time range, will error out if offlineStorage isn't available
	 */
	getTimeRange(): number {
		this.assertAvailable()
		return this.timeRange
	}

	async setTimeRange(days: number): Promise<void> {
		this.assertAvailable()
		await this.deviceConfig.setOfflineTimeRangeDays(days)
		this.timeRange = days
	}

	async init(): Promise<void> {
		if (isOfflineStorageAvailable()) {
			this.isEnabled = await this.systemApp().getConfigValue(DesktopConfigKey.offlineStorageEnabled)

			if (this.isEnabled) {
				const stored = this.deviceConfig.getOfflineTimeRangeDays()
				if (stored != null) {
					this.timeRange = stored
				}
			}
		}

		this._isInitialized = true
	}
}

