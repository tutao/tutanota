import { InterWindowEventFacade } from "../common/generatedipc/InterWindowEventFacade.js"
import { LoginController } from "../../api/main/LoginController.js"
import { WindowFacade } from "../../misc/WindowFacade.js"
import { DeviceConfig } from "../../misc/DeviceConfig.js"

/**
 * receiving side of the InterWindowEventBus
 */
export class WebInterWindowEventFacade implements InterWindowEventFacade {
	constructor(private readonly logins: LoginController, private readonly windowFacade: WindowFacade, private readonly deviceConfig: DeviceConfig) {}

	async localUserDataInvalidated(userId: string): Promise<void> {
		if (this.logins.isUserLoggedIn() && userId === this.logins.getUserController().userId) {
			await this.logins.logout(false)
			// we don't want to reload before returning because
			// someone is waiting for our response.
			Promise.resolve().then(() => this.windowFacade.reload({ noAutoLogin: true }))
		}
	}

	async reloadDeviceConfig(): Promise<void> {
		this.deviceConfig.init()
	}
}
