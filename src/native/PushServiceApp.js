//@flow
import {setup, update, loadAll} from "../api/main/Entity"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {neverNull} from "../api/common/utils/Utils"
import type {PushServiceTypeEnum} from "../api/common/TutanotaConstants"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {isIOSApp, isAndroidApp, getHttpOrigin} from "../api/Env"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {logins} from "../api/main/LoginController"
import {worker} from "../api/main/WorkerClient"

class PushServiceApp {
	_pushNotification: ?Object;
	currentPushIdentifier: string;

	constructor() {
		this._pushNotification = null;
		this.currentPushIdentifier = "";
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
						.then(pushIdentifier => this._storePushIdentifierLocally(pushIdentifier.identifier, ))
				}
			}).then(() => nativeApp.invokeNative(new Request("initPushNotifications", [])))
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
			return identifiers.find(i => i.identifier == identifier)
		})
	}


	updatePushIdentifier(identifier: string) {
		let identifierType = isIOSApp() ? PushServiceType.IOS : PushServiceType.ANDROID
		let list = logins.getUserController().user.pushIdentifierList
		this.currentPushIdentifier = identifier;
		return loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
			let existingPushIdentfier = identifiers.find(i => i.identifier == identifier)
			if (existingPushIdentfier) {
				if (existingPushIdentfier.language != lang.code) {
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
}

export const pushServiceApp: PushServiceApp = new PushServiceApp()