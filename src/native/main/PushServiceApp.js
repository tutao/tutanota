//@flow
import {load, loadAll, setup, update} from "../../api/main/Entity"
import type {PushIdentifier} from "../../api/entities/sys/PushIdentifier"
import {_TypeModel as PushIdentifierModel, createPushIdentifier, PushIdentifierTypeRef} from "../../api/entities/sys/PushIdentifier"
import {neverNull} from "../../api/common/utils/Utils"
import type {PushServiceTypeEnum} from "../../api/common/TutanotaConstants"
import {PushServiceType} from "../../api/common/TutanotaConstants"
import {lang} from "../../misc/LanguageViewModel"
import {getHttpOrigin, isAndroidApp, isDesktop, isIOSApp} from "../../api/common/Env"
import {nativeApp} from "../common/NativeWrapper"
import {Request} from "../../api/common/WorkerProtocol"
import {logins} from "../../api/main/LoginController"
import {client} from "../../misc/ClientDetector.js"
import {deviceConfig} from "../../misc/DeviceConfig"
import {getElementId} from "../../api/common/utils/EntityUtils";
import {DeviceStorageUnavailableError} from "../../api/common/error/DeviceStorageUnavailableError"
import {ofClass} from "../../api/common/utils/PromiseUtils"
import {locator} from "../../api/main/MainLocator"

class PushServiceApp {
	_pushNotification: ?Object;
	_currentIdentifier: ?string;

	constructor() {
		this._pushNotification = null;
	}

	register(): Promise<void> {
		if (isAndroidApp() || isDesktop()) {
			return this._loadPushIdentifierFromNative()
			           .then(identifier => {
				           if (identifier) {
					           this._currentIdentifier = identifier
					           return this._loadPushIdentifier(identifier).then(pushIdentifier => {
						           if (!pushIdentifier) { // push identifier is  not associated with current user
							           return this._createPushIdentiferInstance(identifier, PushServiceType.SSE)
							                      .then(pushIdentifier =>
								                      this._storePushIdentifierLocally(pushIdentifier)
								                          .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier)))

						           } else {
							           return this._storePushIdentifierLocally(pushIdentifier)
							                      .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))

						           }
					           })
				           } else {
					           return locator.worker.generateSsePushIdentifer()
					                         .then(identifier => this._createPushIdentiferInstance(identifier, PushServiceType.SSE))
					                         .then(pushIdentifier => {
						                         this._currentIdentifier = pushIdentifier.identifier
						                         return this._storePushIdentifierLocally(pushIdentifier)
						                                    .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))
					                         })
				           }
			           })
			           .then(this._initPushNotifications)
			           .catch(ofClass(DeviceStorageUnavailableError, (e) => {
				           console.warn("Device storage is unavailable, cannot register for push notifications", e)
			           }))
		} else if (isIOSApp()) {
			return this._loadPushIdentifierFromNative()
			           .then(identifier => {
				           if (identifier) {
					           this._currentIdentifier = identifier
					           return this._loadPushIdentifier(identifier)
					                      .then(pushIdentifier => {
						                      if (pushIdentifier) {
							                      if (pushIdentifier.language !== lang.code) {
								                      pushIdentifier.language = lang.code
								                      update(pushIdentifier)
							                      }
							                      return this._storePushIdentifierLocally(pushIdentifier)
							                                 .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))
						                      } else {
							                      return this._createPushIdentiferInstance(identifier, PushServiceType.IOS)
							                                 .then(pushIdentifier => this._storePushIdentifierLocally(pushIdentifier)
							                                                             .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier)))
						                      }
					                      })
				           } else {
					           console.log("denied by user")
				           }
			           })
		} else {
			return Promise.resolve()
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

	_loadPushIdentifierFromNative(): Promise<?string> {
		return nativeApp.invokeNative(new Request("getPushIdentifier", [
			logins.getUserController().user._id, logins.getUserController().userGroupInfo.mailAddress
		]))
	}

	_storePushIdentifierLocally(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = logins.getUserController().user._id
		return locator.worker.resolveSessionKey(PushIdentifierModel, pushIdentifier).then(skB64 => {
			return nativeApp.invokeNative(new Request("storePushIdentifierLocally", [
				pushIdentifier.identifier, userId, getHttpOrigin(), getElementId(pushIdentifier), skB64
			]))
		})

	}


	_loadPushIdentifier(identifier: string): Promise<?PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		return loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
			return identifiers.find(i => i.identifier === identifier)
		})
	}

	// _unscheduleAlarms(): Promise<void> {
	// 	const userId = logins.getUserController().user._id
	// 	deviceConfig.setAlarmsScheduledForUser(userId, false)
	// 	return nativeApp.invokeNative(new Request('unscheduleAlarms', [userId]))
	// }

	_createPushIdentiferInstance(identifier: string, pushServiceType: PushServiceTypeEnum): Promise<PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		let pushIdentifier = createPushIdentifier()
		pushIdentifier.displayName = client.getIdentifier()
		pushIdentifier._owner = logins.getUserController().userGroupInfo.group // legacy
		pushIdentifier._ownerGroup = logins.getUserController().userGroupInfo.group
		pushIdentifier._area = "0"
		pushIdentifier.pushServiceType = pushServiceType
		pushIdentifier.identifier = identifier
		pushIdentifier.language = lang.code
		return setup(neverNull(list).list, pushIdentifier).then(id => {
			return [neverNull(list).list, id]
		}).then(id => load(PushIdentifierTypeRef, id))
	}


	updateBadge(newValue: number): void {
		if (this._pushNotification != null) {
			// not supported on all android devices.
			this._pushNotification.setApplicationIconBadgeNumber(() => {
				//success
			}, () => {
				//error
			}, newValue);
		}
	}

	closePushNotification(addresses: string[]) {
		nativeApp.invokeNative(new Request('closePushNotifications', [addresses]))
	}

	getPushIdentifier(): ?string {
		return this._currentIdentifier
	}

	_initPushNotifications(): Promise<void> {
		return nativeApp.invokeNative(new Request("initPushNotifications", []))
	}

	_scheduleAlarmsIfNeeded(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = logins.getUserController().user._id
		if (!deviceConfig.hasScheduledAlarmsForUser(userId)) {
			console.log("Alarms not scheduled for user, scheduling!")
			return locator.calendarFacade.scheduleAlarmsForNewDevice(pushIdentifier)
			              .then(() => deviceConfig.setAlarmsScheduledForUser(userId, true))
		} else {
			return Promise.resolve()
		}
	}
}

export const pushServiceApp: PushServiceApp = new PushServiceApp()
