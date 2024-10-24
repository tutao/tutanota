import { client } from "./ClientDetector.js"

export class AppStorePaymentPicker {
	async shouldEnableAppStorePayment(): Promise<boolean> {
		// AppStore payments are disabled for the first Tuta Calendar release
		return !client.isCalendarApp()
	}
}
