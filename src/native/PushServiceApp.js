//@flow
import {loadAll, setup, update} from "../api/main/Entity"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {neverNull} from "../api/common/utils/Utils"
import type {PushServiceTypeEnum} from "../api/common/TutanotaConstants"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {getHttpOrigin, isAndroidApp, isIOSApp} from "../api/Env"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {logins} from "../api/main/LoginController"
import {worker} from "../api/main/WorkerClient"

class PushServiceApp {
	_pushNotification: ?Object;
	_currentIdentifier: ?string;

	constructor() {
		this._pushNotification = null;
	}

	register(): Promise<void> {
		if (isAndroidApp()) {
			return nativeApp.invokeNative(new Request("getPushIdentifier", [])).then(identifier => {
				if (identifier) {
					this._currentIdentifier = identifier
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
					             .then(pushIdentifier => {
						             this._currentIdentifier = pushIdentifier.identifier
						             return this._storePushIdentifierLocally(pushIdentifier.identifier)
					             })
				}
			}).then(this._initPushNotifications)
		} else if (isIOSApp()) {
			return nativeApp.invokeNative(new Request("getPushIdentifier", [])).then(identifier => {
				if (identifier) {
					this._currentIdentifier = identifier
					return this._loadPushIdentifier(identifier).then(pushIdentifier => {
						if (pushIdentifier) {
							if (pushIdentifier.language !== lang.code) {
								pushIdentifier.language = lang.code
								update(pushIdentifier)
							}
						} else {
							this._createPushIdentiferInstance(identifier, PushServiceType.IOS)
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

	getPushIdentifier(): ?string {
		return this._currentIdentifier
	}

	_initPushNotifications(): Promise<void> {
		return nativeApp.invokeNative(new Request("initPushNotifications", []))
	}
}

export const pushServiceApp: PushServiceApp = new PushServiceApp()