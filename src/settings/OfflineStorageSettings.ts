import {OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS} from "../api/common/TutanotaConstants.js";
import {isOfflineStorageAvailable} from "../api/common/Env.js";
import {OfflineDbFacade} from "../desktop/db/OfflineDbFacade.js";
import {assert, lazy} from "@tutao/tutanota-utils";
import * as cborg from "cborg"
import {IUserController} from "../api/main/UserController"
import {NativeSystemApp} from "../native/common/NativeSystemApp"
import {DesktopConfigKey} from "../desktop/config/ConfigKeys"

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
		private readonly offlineDbFacade: lazy<OfflineDbFacade>,
		private readonly systemApp: lazy<NativeSystemApp>,
		private readonly userController: IUserController,
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
		const encoded = cborg.encode(days)
		await this.offlineDbFacade().putMetadata(this.userController.userId, "timeRangeDays", encoded)
		this.timeRange = days
	}

	async init(): Promise<void> {
		if (isOfflineStorageAvailable()) {
			this.isEnabled =
				await this.systemApp().getConfigValue(DesktopConfigKey.offlineStorageEnabled) &&
				// If the user has only just enabled offline storage during this session, then a database will not yet have been created.
				// Offline database initialization is tightly coupled with login and credentials generation and such,
				// so we won't actually initialize offline mode until the next login
				await this.offlineDbFacade().isDatabaseOpen(this.userController.userId)

			if (this.isEnabled) {
				const stored = (await this.offlineDbFacade().getMetadata(this.userController.userId, "timeRangeDays"))
				if (stored != null) {
					this.timeRange = cborg.decode(stored)
				}
			}
		}

		this._isInitialized = true
	}
}

