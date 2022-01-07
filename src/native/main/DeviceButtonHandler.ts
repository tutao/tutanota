import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {header} from "../../gui/base/Header"
import {modal} from "../../gui/base/Modal"
import {CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, navButtonRoutes, SEARCH_PREFIX, SETTINGS_PREFIX} from "../../misc/RouteChange"
import {locator} from "../../api/main/MainLocator"
import {getInboxFolder} from "../../mail/model/MailUtils"
import {last} from "@tutao/tutanota-utils"

assertMainOrNode()

/**
 * Handles press of the android back button. Returns true if the action has been processed by the application.
 * False if the caller must handle the button press (quit the application)
 */
export function handleBackPress(): Promise<boolean> {
	return Promise.resolve().then(() => {
		const lastModalComponent = last(modal.components)

		if (lastModalComponent) {
			// first check if any modal dialog is visible
			lastModalComponent.component.onClose()
			return true
		} else {
			// otherwise try to navigate back in the current view
			const viewSlider = header._getViewSlider()

			const currentRoute = m.route.get()

			// If the sidebar is opened, close it
			if (viewSlider && viewSlider.isForegroundColumnFocused()) {
				viewSlider.focusNextColumn()
				return true
			} else if (window.tutao.currentView && window.tutao.currentView.handleBackButton && window.tutao.currentView.handleBackButton()) {
				return true
			} else if (
				currentRoute.startsWith(CONTACTS_PREFIX) ||
				currentRoute.startsWith(SETTINGS_PREFIX) ||
				currentRoute.startsWith(SEARCH_PREFIX) ||
				currentRoute.startsWith(CALENDAR_PREFIX)
			) {
				// go back to mail from other paths
				m.route.set(navButtonRoutes.mailUrl)
				return true
			} else if (viewSlider && viewSlider.isFirstBackgroundColumnFocused()) {
				// If the first background column is focused in mail view (showing a folder), move to inbox.
				// If in inbox already, quit
				if (m.route.get().startsWith(MAIL_PREFIX)) {
					const parts = m.route
								   .get()
								   .split("/")
								   .filter(part => part !== "")

					if (parts.length > 1) {
						const selectedMailListId = parts[1]
						return locator.mailModel.getMailboxDetails().then(mailboxDetails => {
							const inboxMailListId = getInboxFolder(mailboxDetails[0].folders).mails

							if (inboxMailListId !== selectedMailListId) {
								m.route.set(MAIL_PREFIX + "/" + inboxMailListId)
								return true
							} else {
								return false
							}
						})
					}
				}

				return false
			} else if (viewSlider && viewSlider.isFocusPreviousPossible()) {
				// current view can navigate back
				viewSlider.focusPreviousColumn()
				return true
			} else {
				return false
			}
		}
	})
}