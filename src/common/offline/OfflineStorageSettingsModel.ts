import { assert, daysToMillis, getDayShifted, getStartOfDay } from "@tutao/tutanota-utils"
import { OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../api/common/TutanotaConstants"
import { UserController } from "../api/main/UserController"
import { DeviceConfig } from "../misc/DeviceConfig"
import { isOfflineStorageAvailable } from "../api/common/Env"
import { getStartOfTheWeekOffsetForUser } from "../misc/weekOffset"

function getStartOfDayShiftedBy(number: number) {
	return undefined
}

/**
 * A model for handling offline storage configuration
 * Accessing setters and getters will throw if you are not in a context where an offline database is available
 * Some logic is duplicated from OfflineStorage
 */
export class OfflineStorageSettingsModel {
	private _isInitialized = false
	private isEnabled: boolean | null = null

	// the default value will never actually be used
	private defaultTimeRange: Date = getStartOfDay(getDayShifted(new Date(), -OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS))
	private timeRange: Date = new Date(this.defaultTimeRange.getTime())

	// Native interfaces are lazy to allow us to unconditionally construct the SettingsModel
	// If we are not in a native context, then they should never be accessed
	constructor(private readonly userController: UserController, private readonly deviceConfig: DeviceConfig) {}

	available(): boolean {
		return this._isInitialized && isOfflineStorageAvailable() && !!this.isEnabled
	}

	private assertAvailable() {
		assert(this.available(), "Not initialized or not available")
	}

	isValidDate(newDate: Date): boolean {
		// FIXME: also check that it is not way too many days ~3650 should be enough
		// the date should not be in the future, it makes no sense
		return newDate.getTime() < new Date().getTime()
	}

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.userController.userSettingsGroupRoot)
	}

	/**
	 * get stored time range, will error out if offlineStorage isn't available.
	 * if the user account is free, always returns the default time range and
	 * resets the stored value if it's different from the default.
	 */
	getTimeRange(): Date {
		this.assertAvailable()
		if (this.userController.isFreeAccount() && this.timeRange !== this.defaultTimeRange) {
			this.setTimeRange(this.defaultTimeRange).catch((e) => console.log("error while resetting storage time range:", e))
			this.timeRange = this.defaultTimeRange
		}
		return this.timeRange
	}

	async setTimeRange(date: Date): Promise<void> {
		this.assertAvailable()
		await this.deviceConfig.setOfflineTimeRangeDate(this.userController.userId, date)
		this.timeRange = date
	}

	async init(): Promise<void> {
		this.isEnabled = isOfflineStorageAvailable()

		if (this.isEnabled) {
			const stored = this.deviceConfig.getOfflineTimeRangeDate(this.userController.userId)
			if (stored != null) {
				this.timeRange = stored
			}
		}

		this._isInitialized = true
	}
}
