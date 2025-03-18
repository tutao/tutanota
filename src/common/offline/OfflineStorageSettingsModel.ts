import { assert, DAY_IN_MILLIS, daysToMillis, getDayShifted, getStartOfDay } from "@tutao/tutanota-utils"
import { OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../api/common/TutanotaConstants"
import { UserController } from "../api/main/UserController"
import { DeviceConfig } from "../misc/DeviceConfig"
import { isOfflineStorageAvailable } from "../api/common/Env"
import { getStartOfTheWeekOffsetForUser } from "../misc/weekOffset"

/**
 * A model for handling offline storage configuration
 * Accessing setters and getters will throw if you are not in a context where an offline database is available
 * Some logic is duplicated from OfflineStorage
 */
export class OfflineStorageSettingsModel {
	private isInitialized = false
	private isEnabled: boolean | null = null

	// the default value will never actually be used
	private defaultTimeRange: Date = getStartOfDay(getDayShifted(new Date(), -OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS))
	private timeRange: Date = new Date(this.defaultTimeRange.getTime())

	// Native interfaces are lazy to allow us to unconditionally construct the SettingsModel
	// If we are not in a native context, then they should never be accessed
	constructor(private readonly userController: UserController, private readonly deviceConfig: DeviceConfig) {}

	async init(): Promise<void> {
		this.isEnabled = isOfflineStorageAvailable()

		if (this.isEnabled) {
			const stored = this.deviceConfig.getOfflineTimeRangeDate(this.userController.userId)
			if (stored != null) {
				this.timeRange = stored
			}
		}

		this.isInitialized = true
	}

	available(): boolean {
		return this.isInitialized && isOfflineStorageAvailable() && !!this.isEnabled
	}

	private assertAvailable() {
		assert(this.available(), "Not initialized or not available")
	}

	isValidDate(newDate: Date): boolean {
		// The choice of 7500 days (a bit over 20 years) is a bit arbitrary.
		// The theoretical maximum is the number of days between Epoch and May 15th 2109, exceeding that will
		// lead to an overflow in our 42 bit timestamp in the id.
		const now = new Date().getTime()
		return newDate.getTime() < now && now - newDate.getTime() < 7500 * DAY_IN_MILLIS
	}

	isFixedDays(): boolean {
		// Free users only have the last OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS (31) days
		return this.userController.isFreeAccount()
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
			this.setTimeRange(this.defaultTimeRange)
			this.timeRange = this.defaultTimeRange
		}
		return this.timeRange
	}

	setTimeRange(date: Date): void {
		this.assertAvailable()
		this.deviceConfig.setOfflineTimeRangeDate(this.userController.userId, date)
		this.timeRange = date
	}
}
