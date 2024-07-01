import { CommonSystemFacade } from "../native/common/generatedipc/CommonSystemFacade.js"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { Logger } from "../api/common/Logger.js"

export class DesktopCommonSystemFacade implements CommonSystemFacade {
	private initDefer: DeferredObject<void> = defer()

	constructor(private readonly window: ApplicationWindow, private readonly logger: Logger) {}

	async initializeRemoteBridge(): Promise<void> {
		this.initDefer.resolve()
	}

	async reload(query: Record<string, string>): Promise<void> {
		this.initDefer = defer()
		this.window.reload(query)
	}

	async awaitForInit() {
		await this.initDefer.promise
	}

	async getLog(): Promise<string> {
		return this.logger.getEntries().join("\n")
	}
}
