import { NativePushServiceApp } from "./NativePushServiceApp"
import { DeviceConfig } from "../misc/DeviceConfig"
import { PostLoginAction } from "../api/main/LoginController"
import { LoggedInEvent } from "../../native-bridge/common/PostLoginAction"

export class RegisterPushServicePostLoginAction implements PostLoginAction {
	constructor(
		private readonly deviceConfig: DeviceConfig,
		private readonly pushService: NativePushServiceApp,
	) {}

	async onPartialLoginSuccess(_: LoggedInEvent): Promise<void> {}
	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {
		// Do not try to register for notifications while the setup dialog
		// is being shown because we might not have a permission yet and
		// we don't want to ask for it while dialog is shown, we will ask in
		// the dialog anyway.
		// After dialog is finished or dismissed the setup is "complete".
		if (this.deviceConfig.getIsSetupComplete()) {
			// Await the push service registration so `storePushIdentifierLocally()` can set the extended notification mode on Android
			// before `loadNewsIds()` runs the `isShown()` check of the `RichNotificationsNews` news item
			await this.pushService.register()
		} else {
			console.log("Skipping registering for notifications while setup dialog is shown")
		}
	}
}
