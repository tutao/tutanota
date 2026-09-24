import { assertNotNull, isNotNull, Nullable } from "@tutao/utils"
import { HostApiPermissionDenied } from "../../sdk/PluginError"
import { isNull } from "../../../platform-kit/utils/Utils"
import { PluginManifest } from "../../sdk/PluginManifest"
import { WindowHostApi } from "../../sdk/hostApi/WindowHostApi"

export class WindowHost implements WindowHostApi {
	private nextWindowId = 0
	private readonly openedWindows: Map<number, Window> = new Map()

	constructor(private readonly manifest: PluginManifest) {}

	async openWindow(url: string): Promise<Nullable<number>> {
		const targetUrl = new URL(url)
		if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
			throw new HostApiPermissionDenied(`Only https url are supported. Found: ${targetUrl.protocol}`)
		}

		if (this.manifest.permissions.windowOpen.allowedDomains.includes(targetUrl.host)) {
			throw new HostApiPermissionDenied(`Hostname: ${targetUrl.host} is not included in manifest permissions.windowOpen.allowedDomains`)
		}

		const win = window.open(url)
		if (isNull(win)) {
			return null
		}
		const windowId = this.nextWindowId++
		if (isNotNull(win)) {
			this.openedWindows.set(windowId, win)
		}
		return windowId
	}

	async closeWindow(windowId: number): Promise<void> {
		const win = assertNotNull(this.openedWindows.get(windowId), `WindowId ${windowId} does not exist`)
		win.close()
	}

	async isWindowOpen(windowId: number): Promise<boolean> {
		const win = assertNotNull(this.openedWindows.get(windowId), `WindowId ${windowId} does not exist`)
		return win && !win.closed
	}
	async getHost(): Promise<string> {
		if (!this.manifest.permissions.getHost) {
			throw new HostApiPermissionDenied("permissions.getHost is not declared true in manifest file")
		}

		return new URL(window.origin).hostname
	}
}
