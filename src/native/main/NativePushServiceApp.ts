import type {PushIdentifier} from "../../api/entities/sys/TypeRefs.js"
import {createPushIdentifier, PushIdentifierTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {assertNotNull, neverNull, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {PushServiceType} from "../../api/common/TutanotaConstants"
import {lang} from "../../misc/LanguageViewModel"
import {getHttpOrigin, isAndroidApp, isDesktop, isIOSApp} from "../../api/common/Env"
import {Request} from "../../api/common/MessageDispatcher"
import {logins} from "../../api/main/LoginController"
import {client} from "../../misc/ClientDetector"
import {deviceConfig} from "../../misc/DeviceConfig"
import {getElementId} from "../../api/common/utils/EntityUtils"
import {locator} from "../../api/main/MainLocator"
import type {NativeInterface} from "../common/NativeInterface"
import {DeviceStorageUnavailableError} from "../../api/common/error/DeviceStorageUnavailableError"

export class NativePushServiceApp {
	private _pushNotification: Record<string, any> | null
	private _currentIdentifier: string | null = null
	private _native: NativeInterface

	constructor(nativeInterface: NativeInterface) {
		this._pushNotification = null
		this._native = nativeInterface
	}

	async register(): Promise<void> {
		if (isAndroidApp() || isDesktop()) {
			try {
				const identifier = (await this._loadPushIdentifierFromNative()) ?? (await locator.worker.generateSsePushIdentifer())
				this._currentIdentifier = identifier
				const pushIdentifier =
					(await this._loadPushIdentifier(identifier)) ?? (await this._createPushIdentiferInstance(identifier, PushServiceType.SSE))
				await this._storePushIdentifierLocally(pushIdentifier)
				await this._scheduleAlarmsIfNeeded(pushIdentifier)
				await this._initPushNotifications()
			} catch (e) {
				if (e instanceof DeviceStorageUnavailableError) {
					console.warn("Device storage is unavailable, cannot register for push notifications", e)
				} else {
					throw e
				}
			}
		} else if (isIOSApp()) {
			const identifier = await this._loadPushIdentifierFromNative()

			if (identifier) {
				this._currentIdentifier = identifier
				const pushIdentifier =
					(await this._loadPushIdentifier(identifier)) ?? (await this._createPushIdentiferInstance(identifier, PushServiceType.IOS))

				if (pushIdentifier.language !== lang.code) {
					pushIdentifier.language = lang.code
					locator.entityClient.update(pushIdentifier)
				}

				await this._storePushIdentifierLocally(pushIdentifier)
				await this._scheduleAlarmsIfNeeded(pushIdentifier)
			} else {
				console.log("Push notifications were rejected by user")
			}
		}
	}

	invalidateAlarms(): Promise<void> {
		console.log("invalidating alarms")
		deviceConfig.setNoAlarmsScheduled()

		if (logins.isUserLoggedIn()) {
			return this.register()
		} else {
			return Promise.resolve()
		}
	}

	_loadPushIdentifierFromNative(): Promise<string | null> {
		return this._native.invokeNative(
			new Request("getPushIdentifier", [logins.getUserController().user._id, logins.getUserController().userGroupInfo.mailAddress]),
		)
	}

	_storePushIdentifierLocally(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = logins.getUserController().user._id

		return locator.cryptoFacade.resolveSessionKeyForInstanceBinary(pushIdentifier).then(sk => {
			const skB64 = uint8ArrayToBase64(assertNotNull(sk))
			return this._native.invokeNative(
				new Request("storePushIdentifierLocally", [pushIdentifier.identifier, userId, getHttpOrigin(), getElementId(pushIdentifier), skB64]),
			)
		})
	}

	_loadPushIdentifier(identifier: string): Promise<PushIdentifier | null> {
		let list = logins.getUserController().user.pushIdentifierList
		return locator.entityClient.loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
			return identifiers.find(i => i.identifier === identifier) ?? null
		})
	}

	_createPushIdentiferInstance(identifier: string, pushServiceType: PushServiceType): Promise<PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		let pushIdentifier = createPushIdentifier()
		pushIdentifier.displayName = client.getIdentifier()
		pushIdentifier._owner = logins.getUserController().userGroupInfo.group // legacy

		pushIdentifier._ownerGroup = logins.getUserController().userGroupInfo.group
		pushIdentifier._area = "0"
		pushIdentifier.pushServiceType = pushServiceType
		pushIdentifier.identifier = identifier
		pushIdentifier.language = lang.code
		return locator.entityClient
					  .setup(neverNull(list).list, pushIdentifier)
					  .then(id => locator.entityClient.load(PushIdentifierTypeRef, [neverNull(list).list, id]))
	}

	updateBadge(newValue: number): void {
		if (this._pushNotification != null) {
			// not supported on all android devices.
			this._pushNotification.setApplicationIconBadgeNumber(
				() => {
					//success
				},
				() => {
					//error
				},
				newValue,
			)
		}
	}

	closePushNotification(addresses: string[]) {
		this._native.invokeNative(new Request("closePushNotifications", [addresses]))
	}

	getPushIdentifier(): string | null {
		return this._currentIdentifier
	}

	_initPushNotifications(): Promise<void> {
		return this._native.invokeNative(new Request("initPushNotifications", []))
	}

	_scheduleAlarmsIfNeeded(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = logins.getUserController().user._id

		if (!deviceConfig.hasScheduledAlarmsForUser(userId)) {
			console.log("Alarms not scheduled for user, scheduling!")
			return locator.calendarFacade.scheduleAlarmsForNewDevice(pushIdentifier).then(() => deviceConfig.setAlarmsScheduledForUser(userId, true))
		} else {
			return Promise.resolve()
		}
	}
}