import { OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../../common/api/common/TutanotaConstants.js"
import { isOfflineStorageAvailable } from "../../common/api/common/Env.js"
import { assert } from "@tutao/tutanota-utils"
import { UserController } from "../../common/api/main/UserController"
import { DeviceConfig } from "../../common/misc/DeviceConfig"

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
	constructor(private readonly userController: UserController, private readonly deviceConfig: DeviceConfig) {}

	available(): boolean {
		return this._isInitialized && isOfflineStorageAvailable() && !!this.isEnabled
	}

	private assertAvailable() {
		assert(this.available(), "Not initialized or not available")
	}

	/**
	 * get stored time range, will error out if offlineStorage isn't available.
	 * if the user account is free, always returns the default time range and
	 * resets the stored value if it's different from the default.
	 */
	getTimeRange(): number {
		this.assertAvailable()
		if (this.userController.isFreeAccount() && this.timeRange !== OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS) {
			this.setTimeRange(OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS).catch((e) => console.log("error while resetting storage time range:", e))
			this.timeRange = OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS
			return OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS
		}
		return this.timeRange
	}

	async setTimeRange(days: number): Promise<void> {
		this.assertAvailable()
		await this.deviceConfig.setOfflineTimeRangeDays(this.userController.userId, days)
		this.timeRange = days
	}

	async init(): Promise<void> {
		this.isEnabled = isOfflineStorageAvailable()

		if (this.isEnabled) {
			const stored = this.deviceConfig.getOfflineTimeRangeDays(this.userController.userId)
			if (stored != null) {
				this.timeRange = stored
			}
		}

		this._isInitialized = true
	}
}
