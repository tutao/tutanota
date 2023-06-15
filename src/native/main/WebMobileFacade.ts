import m from "mithril"
import { assertMainOrNode } from "../../api/common/Env"
import { modal } from "../../gui/base/Modal"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, SEARCH_PREFIX, SETTINGS_PREFIX } from "../../misc/RouteChange"
import { last } from "@tutao/tutanota-utils"
import { CloseEventBusOption, MailFolderType, SECOND_MS } from "../../api/common/TutanotaConstants.js"
import { MobileFacade } from "../common/generatedipc/MobileFacade.js"
import { styles } from "../../gui/styles"
import { WebsocketConnectivityModel } from "../../misc/WebsocketConnectivityModel.js"
import { MailModel } from "../../mail/model/MailModel.js"
import { TopLevelView } from "../../TopLevelView.js"
import { assertSystemFolderOfType } from "../../api/common/mail/CommonMailUtils.js"

assertMainOrNode()

/**
 * Handles press of the android back button. Returns true if the action has been processed by the application.
 * False if the caller must handle the button press (quit the application)
 */
export class WebMobileFacade implements MobileFacade {
	private disconnectTimeoutId: TimeoutID | null

	constructor(private readonly connectivityModel: WebsocketConnectivityModel, private readonly mailModel: MailModel) {}

	async handleBackPress(): Promise<boolean> {
		await Promise.resolve()
		const lastModalComponent = last(modal.components)

		if (lastModalComponent) {
			// first check if any modal dialog is visible
			lastModalComponent.component.onClose()
			return true
		} else {
			// otherwise try to navigate back in the current view
			const viewSlider = window.tutao.currentView?.getViewSlider?.()

			const currentRoute = m.route.get()

			// If the sidebar is opened, close it
			if (viewSlider && viewSlider.isForegroundColumnFocused()) {
				viewSlider.focusNextColumn()
				return true
			} else if (this.handlesBackButtonViaCurrentView()) {
				return true
			} else if (
				viewSlider &&
				viewSlider.focusedColumn !== viewSlider.getMainColumn() &&
				styles.isSingleColumnLayout() &&
				viewSlider.isFocusPreviousPossible()
			) {
				// current view can navigate back, a region column is focused (not main) and is in singleColumnLayout
				viewSlider.focusPreviousColumn()
				return true
			} else if (
				currentRoute.startsWith(CONTACTS_PREFIX) ||
				currentRoute.startsWith(SETTINGS_PREFIX) ||
				currentRoute.startsWith(SEARCH_PREFIX) ||
				currentRoute.startsWith(CALENDAR_PREFIX)
			) {
				// go back to mail from other paths
				m.route.set(MAIL_PREFIX)
				return true
			} else if (viewSlider && viewSlider.isFirstBackgroundColumnFocused()) {
				// If the first background column is focused in mail view (showing a folder), move to inbox.
				// If in inbox already, quit
				if (m.route.get().startsWith(MAIL_PREFIX)) {
					const parts = m.route
						.get()
						.split("/")
						.filter((part) => part !== "")

					if (parts.length > 1) {
						const selectedMailListId = parts[1]
						const [mailboxDetail] = await this.mailModel.getMailboxDetails()
						const inboxMailListId = assertSystemFolderOfType(mailboxDetail.folders, MailFolderType.INBOX).mails

						if (inboxMailListId !== selectedMailListId) {
							m.route.set(MAIL_PREFIX + "/" + inboxMailListId)
							return true
						} else {
							return false
						}
					}
				}

				return false
			} else {
				return false
			}
		}
	}

	private handlesBackButtonViaCurrentView(): boolean {
		const currentView: TopLevelView | null = window.tutao.currentView
		return currentView?.handleBackButton != null && currentView.handleBackButton()
	}

	async visibilityChange(visibility: boolean): Promise<void> {
		console.log("native visibility change", visibility)

		if (visibility) {
			if (this.disconnectTimeoutId != null) {
				clearTimeout(this.disconnectTimeoutId)
				this.disconnectTimeoutId = null
			}

			return this.connectivityModel.tryReconnect(false, true)
		} else {
			this.disconnectTimeoutId = setTimeout(() => {
				this.connectivityModel.close(CloseEventBusOption.Pause)
			}, 30 * SECOND_MS)
		}
	}

	async keyboardSizeChanged(newSize: number): Promise<void> {
		const { windowFacade } = await import("../../misc/WindowFacade.js")
		return windowFacade.onKeyboardSizeChanged(newSize)
	}
}
