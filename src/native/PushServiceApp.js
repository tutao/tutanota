//@flow
import {setup, update, loadAll} from "../api/main/Entity"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {neverNull} from "../api/common/utils/Utils"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {isIOSApp} from "../api/Env"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {logins} from "../api/main/LoginController"

class PushServiceApp {
	_pushNotification: ?Object;
	currentPushIdentifier: string;

	constructor() {
		this._pushNotification = null;
		this.currentPushIdentifier = "";
	}

	register(): void {
		nativeApp.invokeNative(new Request("initPushNotifications", []))
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
				//console.log("<<<", identifier, identifierType)
				let pushIdentifier = createPushIdentifier()
				pushIdentifier._owner = logins.getUserController().userGroupInfo.group // legacy
				pushIdentifier._ownerGroup = logins.getUserController().userGroupInfo.group
				pushIdentifier._area = "0"
				pushIdentifier.pushServiceType = identifierType
				pushIdentifier.identifier = identifier
				pushIdentifier.language = lang.code
				setup(neverNull(list).list, pushIdentifier)
			}
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
}

export const pushServiceApp: PushServiceApp = new PushServiceApp()