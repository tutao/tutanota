import type { PushIdentifier } from "../../api/entities/sys/TypeRefs.js"
import { createPushIdentifier, PushIdentifierTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { PushServiceType } from "../../api/common/TutanotaConstants"
import { lang } from "../../misc/LanguageViewModel"
import { isAndroidApp, isDesktop, isIOSApp } from "../../api/common/Env"
import { LoginController } from "../../api/main/LoginController"
import { client } from "../../misc/ClientDetector"
import { DeviceConfig, deviceConfig } from "../../misc/DeviceConfig"
import { getElementId } from "../../api/common/utils/EntityUtils"
import { locator } from "../../api/main/MainLocator"
import { DeviceStorageUnavailableError } from "../../api/common/error/DeviceStorageUnavailableError"
import { NativePushFacade } from "../common/generatedipc/NativePushFacade.js"
import { CryptoFacade } from "../../api/worker/crypto/CryptoFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"

export class NativePushServiceApp {
	private _currentIdentifier: string | null = null

	constructor(
		private readonly nativePushFacade: NativePushFacade,
		private readonly logins: LoginController,
		private readonly cryptoFacade: CryptoFacade,
		private readonly entityClient: EntityClient,
		private readonly deviceConfig: DeviceConfig,
		private readonly calendarFacade: CalendarFacade,
	) {}

	async register(): Promise<void> {
		console.log("Registering for push notifications")
		if (isAndroidApp() || isDesktop()) {
			try {
				const identifier = (await this.loadPushIdentifierFromNative()) ?? (await locator.workerFacade.generateSsePushIdentifer())
				this._currentIdentifier = identifier
				const pushIdentifier = (await this.loadPushIdentifier(identifier)) ?? (await this.createPushIdentiferInstance(identifier, PushServiceType.SSE))
				await this.storePushIdentifierLocally(pushIdentifier)
				await this.scheduleAlarmsIfNeeded(pushIdentifier)
				await this.initPushNotifications()
			} catch (e) {
				if (e instanceof DeviceStorageUnavailableError) {
					console.warn("Device storage is unavailable, cannot register for push notifications", e)
				} else {
					throw e
				}
			}
		} else if (isIOSApp()) {
			const identifier = await this.loadPushIdentifierFromNative()

			if (identifier) {
				this._currentIdentifier = identifier
				const pushIdentifier = (await this.loadPushIdentifier(identifier)) ?? (await this.createPushIdentiferInstance(identifier, PushServiceType.IOS))

				if (pushIdentifier.language !== lang.code) {
					pushIdentifier.language = lang.code
					locator.entityClient.update(pushIdentifier)
				}

				await this.storePushIdentifierLocally(pushIdentifier)
				await this.scheduleAlarmsIfNeeded(pushIdentifier)
			} else {
				console.log("Push notifications were rejected by user")
			}
		}
	}

	async invalidateAlarms(): Promise<void> {
		console.log("invalidating alarms")
		deviceConfig.setNoAlarmsScheduled()

		if (this.logins.isUserLoggedIn()) {
			await this.logins.waitForFullLogin()
			return this.register()
		} else {
			return Promise.resolve()
		}
	}

	private loadPushIdentifierFromNative(): Promise<string | null> {
		return this.nativePushFacade.getPushIdentifier()
	}

	private async storePushIdentifierLocally(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = this.logins.getUserController().user._id

		const sk = assertNotNull(await this.cryptoFacade.resolveSessionKeyForInstanceBinary(pushIdentifier))
		const origin = assertNotNull(env.staticUrl)
		await this.nativePushFacade.storePushIdentifierLocally(pushIdentifier.identifier, userId, origin, getElementId(pushIdentifier), sk)
	}

	private async loadPushIdentifier(identifier: string): Promise<PushIdentifier | null> {
		const list = assertNotNull(this.logins.getUserController().user.pushIdentifierList)
		const identifiers = await this.entityClient.loadAll(PushIdentifierTypeRef, list.list)
		return identifiers.find((i) => i.identifier === identifier) ?? null
	}

	private async createPushIdentiferInstance(identifier: string, pushServiceType: PushServiceType): Promise<PushIdentifier> {
		const list = assertNotNull(this.logins.getUserController().user.pushIdentifierList?.list)
		const pushIdentifier = createPushIdentifier({
			_area: "0",
			_owner: this.logins.getUserController().userGroupInfo.group,
			_ownerGroup: this.logins.getUserController().userGroupInfo.group,
			displayName: client.getIdentifier(),
			pushServiceType: pushServiceType,
			identifier,
			language: lang.code,
		})
		const id = await this.entityClient.setup(list, pushIdentifier)
		return this.entityClient.load(PushIdentifierTypeRef, [list, id])
	}

	async closePushNotification(addresses: string[]) {
		await this.nativePushFacade.closePushNotifications(addresses)
	}

	getPushIdentifier(): string | null {
		return this._currentIdentifier
	}

	private initPushNotifications(): Promise<void> {
		return this.nativePushFacade.initPushNotifications()
	}

	private async scheduleAlarmsIfNeeded(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = this.logins.getUserController().user._id

		if (!this.deviceConfig.hasScheduledAlarmsForUser(userId)) {
			console.log("Alarms not scheduled for user, scheduling!")
			await this.calendarFacade.scheduleAlarmsForNewDevice(pushIdentifier)
			deviceConfig.setAlarmsScheduledForUser(userId, true)
		}
	}
}
