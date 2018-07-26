//@flow
import {getInboxFolder} from "../mail/MailUtils"
import m from "mithril"
import {mailModel} from "../mail/MailModel"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()
/**
 * Handles press of the android back button. Returns true if the action has been processed by the application.
 * False if the caller must handle the button press (quit the application)
 */
export function handleBackPress(): boolean {
	if (window.tutao.modal.components.length > 0) { // first check if any modal dialog is visible
		let activeComponent = window.tutao.modal.components[window.tutao.modal.components.length - 1]
		activeComponent.component.onClose()
		return true
	} else { // otherwise try to navigate back in the current view
		const viewSlider = window.tutao.header._getViewSlider()
		const currentRoute = m.route.get()
		if (viewSlider && viewSlider.isFocusPreviousPossible()) { // current view can navigate back
			viewSlider.focusPreviousColumn()
			return true
		} else if (currentRoute.startsWith("/contact") || currentRoute.startsWith("/settings") || currentRoute.startsWith("/search")) {
			m.route.set(window.tutao.header.mailNavButton._getUrl())
			return true
		} else if (m.route.get().startsWith("/mail/")) {
			const parts = m.route.get().split("/").filter(part => part !== "")
			if (parts.length > 1) {
				const selectedMailListId = parts[1]
				const inboxMailListId = getInboxFolder(mailModel.mailboxDetails()[0].folders).mails
				if (inboxMailListId !== selectedMailListId) {
					m.route.set("/mail/" + inboxMailListId)
					return true
				}
			}
			return false
		} else {
			return false
		}
	}
}

