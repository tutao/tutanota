import { isNotNull, Nullable } from "@tutao/utils"
import { HostApiPermissionDenied } from "../../sdk/PluginError"
import { isNull } from "../../../platform-kit/utils/Utils"
import { PluginManifest } from "../../sdk/PluginManifest"
import { WindowHostApi } from "../../sdk/hostApi/WindowHostApi"

export class WindowHost implements WindowHostApi {
	private nextWindowId = 0
	private readonly openedWindows: Map<number, Nullable<Window>> = new Map()

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
		const windowId = this.nextWindowId++
		if (isNull(win)) {
			this.openedWindows.set(windowId, null)
			return windowId
		}
		if (isNotNull(win)) {
			this.openedWindows.set(windowId, win)
		}
		return windowId
	}

	async closeWindow(windowId: number): Promise<void> {
		const win = this.openedWindows.get(windowId)

		if (!this.openedWindows.has(windowId)) {
			throw Error(`WindowId ${windowId} does not exist`)
		}

		if (isNotNull(win)) {
			win.close()
		}
	}

	async isWindowOpen(windowId: number): Promise<boolean> {
		const win = this.openedWindows.get(windowId)

		if (!this.openedWindows.has(windowId)) {
			throw Error(`WindowId ${windowId} does not exist`)
		}

		return (isNotNull(win) && !win.closed) || isNull(win)
	}
	async getHost(): Promise<string> {
		if (!this.manifest.permissions.getHost) {
			throw new HostApiPermissionDenied("permissions.getHost is not declared true in manifest file")
		}

		return new URL(window.origin).hostname
	}
}
