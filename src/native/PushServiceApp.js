//@flow
import {loadAll, setup, update} from "../api/main/Entity"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {neverNull} from "../api/common/utils/Utils"
import type {PushServiceTypeEnum} from "../api/common/TutanotaConstants"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {getHttpOrigin, isAndroidApp, isApp, isIOSApp} from "../api/Env"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {logins} from "../api/main/LoginController"
import {worker} from "../api/main/WorkerClient"

class PushServiceApp {
	_pushNotification: ?Object;

	constructor() {
		this._pushNotification = null;
	}

	register(): Promise<void> {
		if (isAndroidApp()) {
			return nativeApp.invokeNative(new Request("getPushIdentifier", [])).then(identifier => {
				if (identifier) {
					return this._loadPushIdentifier(identifier).then(pushIdentifier => {
						if (!pushIdentifier) { // push identifier is  not associated with current user
							return this._createPushIdentiferInstance(identifier, PushServiceType.SSE)
							           .then(pushIdentifier => this._storePushIdentifierLocally(pushIdentifier.identifier))
						} else {
							return Promise.resolve()
						}
					})
				} else {
					return worker.generateSsePushIdentifer()
					             .then(identifier => this._createPushIdentiferInstance(identifier, PushServiceType.SSE))
					             .then(pushIdentifier => this._storePushIdentifierLocally(pushIdentifier.identifier,))
				}
			}).then(this._initPushNotifications)
		} else {
			return Promise.resolve()
		}

	}

	_storePushIdentifierLocally(identifier: string): Promise<void> {
		const userId = logins.getUserController().user._id
		return nativeApp.invokeNative(new Request("storePushIdentifierLocally", [identifier, userId, getHttpOrigin()]))
	}


	_loadPushIdentifier(identifier: string): Promise<?PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		return loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
			return identifiers.find(i => i.identifier === identifier)
		})
	}


	updatePushIdentifier(identifier: string) {
		let identifierType = isIOSApp() ? PushServiceType.IOS : PushServiceType.ANDROID
		let list = logins.getUserController().user.pushIdentifierList
		return loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
			let existingPushIdentfier = identifiers.find(i => i.identifier === identifier)
			if (existingPushIdentfier) {
				if (existingPushIdentfier.language !== lang.code) {
					existingPushIdentfier.language = lang.code
					update(existingPushIdentfier)
				}
			} else {
				this._createPushIdentiferInstance(identifier, identifierType)
			}
		})
	}


	_createPushIdentiferInstance(identifier: string, pushServiceType: PushServiceTypeEnum): Promise<PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		let pushIdentifier = createPushIdentifier()
		pushIdentifier._owner = logins.getUserController().userGroupInfo.group // legacy
		pushIdentifier._ownerGroup = logins.getUserController().userGroupInfo.group
		pushIdentifier._area = "0"
		pushIdentifier.pushServiceType = pushServiceType
		pushIdentifier.identifier = identifier
		pushIdentifier.language = lang.code
		return setup(neverNull(list).list, pushIdentifier).then(id => {
			pushIdentifier._id = [neverNull(list).list, id]
			return pushIdentifier
		})
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

	getPushIdentifier(): Promise<?string> {
		if (isApp()) {
			return nativeApp.invokeNative(new Request("getPushIdentifier", []))
		} else {
			return Promise.resolve(null)
		}
	}

	/*
	 enableNotifications(enable: boolean): Promise<void> {
	 let done
	 if (enable) {
	 done = this.getPushIdentifier()
	 .then(localIdentifier => localIdentifier || worker.generateSsePushIdentifer())
	 .then(localIdentifier => this._createPushIdentiferInstance(localIdentifier, PushServiceType.SSE))
	 .then(pushIdentifier => this._storePushIdentifierLocally(pushIdentifier.identifier))
	 } else {
	 done = this.getPushIdentifier()
	 .then(identifier => identifier && this._loadPushIdentifier(identifier))
	 .then(pushIdentifier => pushIdentifier && erase(pushIdentifier))
	 }
	 return done
	 .then(this._initPushNotifications)
	 .then(() => {
	 const credentials = neverNull(deviceConfig.getByUserId(logins.getUserController().user._id))
	 credentials.pushNotificationsEnabled = enable
	 deviceConfig.set(credentials)
	 })
	 }
	 */

	_initPushNotifications(): Promise<void> {
		return nativeApp.invokeNative(new Request("initPushNotifications", []))
	}
}

export const pushServiceApp: PushServiceApp = new PushServiceApp()