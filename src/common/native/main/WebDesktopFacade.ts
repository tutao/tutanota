import { DesktopFacade } from "../common/generatedipc/DesktopFacade"
import { showSpellcheckLanguageDialog } from "../../gui/dialogs/SpellcheckLanguageDialog"
import { ElectronResult } from "../common/generatedipc/ElectronResult.js"
import { ErrorInfo } from "../common/generatedipc/ErrorInfo.js"
import { NativeShortcut } from "../common/generatedipc/NativeShortcut.js"
import { Shortcut } from "../../misc/KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { LoginController } from "../../api/main/LoginController.js"
import { lazyAsync } from "@tutao/tutanota-utils"
import { NativeInterfaceMain } from "./NativeInterfaceMain.js"

export class WebDesktopFacade implements DesktopFacade {
	constructor(private logins: LoginController, private nativeInterface: lazyAsync<NativeInterfaceMain>) {}

	print(): Promise<void> {
		window.print()
		return Promise.resolve()
	}

	async showSpellcheckDropdown(): Promise<void> {
		await showSpellcheckLanguageDialog()
	}

	async applySearchResultToOverlay(result: ElectronResult | null): Promise<void> {
		const { searchInPageOverlay } = await import("../../gui/SearchInPageOverlay.js")
		searchInPageOverlay.applyNextResult(result)
		return Promise.resolve()
	}

	async openFindInPage(): Promise<void> {
		const { searchInPageOverlay } = await import("../../gui/SearchInPageOverlay.js")
		searchInPageOverlay.open()
		return Promise.resolve()
	}

	async reportError(errorInfo: ErrorInfo): Promise<void> {
		const { showErrorNotification } = await import("../../misc/ErrorReporter.js")
		await this.logins.waitForPartialLogin()
		await showErrorNotification(errorInfo)
	}

	/**
	 * Updates the link-reveal on hover when the main thread detects that
	 * the hovered url changed. Will _not_ update if hovering a in link app (starts with 2nd argument)
	 */
	async updateTargetUrl(url: string, appPath: string): Promise<void> {
		let linkToolTip = document.getElementById("link-tt")

		if (!linkToolTip) {
			linkToolTip = document.createElement("DIV")
			linkToolTip.id = "link-tt"
			;(document.body as any).appendChild(linkToolTip)
		}

		if (url === "" || url.startsWith(appPath)) {
			linkToolTip.className = ""
		} else {
			linkToolTip.innerText = url
			linkToolTip.className = "reveal"
		}

		return Promise.resolve()
	}

	/**
	 * this is only used in the admin client to sync the DB view with the inbox
	 */
	async openCustomer(mailAddress: string | null): Promise<void> {
		const m = await import("mithril")

		if (typeof mailAddress === "string" && m.route.get().startsWith("/customer")) {
			m.route.set(`/customer?query=${encodeURIComponent(mailAddress)}`)
			console.log("switching to customer", mailAddress)
		}
	}

	async addShortcuts(shortcuts: Array<NativeShortcut>): Promise<void> {
		const baseShortcut: Shortcut = {
			exec: () => true,
			ctrlOrCmd: false,
			alt: false,
			meta: false,
			help: "emptyString_msg",
			key: Keys.F,
		}
		const fixedShortcuts: Array<Shortcut> = shortcuts.map((nsc) => Object.assign({}, baseShortcut, nsc))
		const { keyManager } = await import("../../misc/KeyManager.js")
		keyManager.registerDesktopShortcuts(fixedShortcuts)
	}

	async appUpdateDownloaded(): Promise<void> {
		const native = await this.nativeInterface()
		native.handleUpdateDownload()
	}
}
