import { CommonSystemFacade } from "../native/common/generatedipc/CommonSystemFacade.js"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { Logger } from "../api/common/Logger.js"
import type { DesktopNetworkClient } from "./net/DesktopNetworkClient"

export class DesktopCommonSystemFacade implements CommonSystemFacade {
	private initDefer: DeferredObject<void> = defer()

	constructor(
		private readonly window: ApplicationWindow,
		private readonly logger: Logger,
		private readonly net: DesktopNetworkClient,
	) {}

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

	async executePostRequest(postUrl: string, body: string): Promise<boolean> {
		const url = new URL(postUrl)
		const deferredResponse: DeferredObject<boolean> = defer()
		const connection = this.net.request(url, { method: "POST" })
		connection.write(body)
		connection
			.on("response", (res) => {
				deferredResponse.resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300)
			})
			.on("error", (err) => {
				deferredResponse.resolve(false)
			})
			.end()

		return deferredResponse.promise
	}
}
