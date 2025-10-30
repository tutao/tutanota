import type { Shortcut } from "../../../../common/misc/KeyManager.js"
import m, { Children } from "mithril"
import { px } from "../../../../common/gui/size.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import type { ModalComponent } from "../../../../common/gui/base/Modal.js"
import { modal } from "../../../../common/gui/base/Modal.js"
import { DROPDOWN_MARGIN, PosRect, showDropdown } from "../../../../common/gui/base/Dropdown.js"
import { Keys } from "../../../../common/api/common/TutanotaConstants.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { CalendarContactPreviewViewModel } from "./CalendarContactPreviewViewModel.js"
import { ContactPreviewView } from "./ContactPreviewView.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { ContactEditor } from "../../../../mail-app/contacts/ContactEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { listIdPart } from "../../../../common/api/common/utils/EntityUtils.js"
import { stringToBase64 } from "@tutao/tutanota-utils"
import { calendarLocator } from "../../../calendarLocator.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"

/**
 * small modal displaying all relevant information about a contact in a compact fashion. offers limited editing capabilities to participants in the
 * form with quick action buttons such as edit contact.
 */
export class ContactEventPopup implements ModalComponent {
	private readonly _shortcuts: Shortcut[] = []
	private dom: HTMLElement | null = null
	private focusedBeforeShown: HTMLElement | null = null

	/**
	 * @param model
	 * @param eventBubbleRect the rect where the event bubble was displayed that was clicked (if any)
	 */
	constructor(
		private readonly model: CalendarContactPreviewViewModel,
		private readonly eventBubbleRect: PosRect,
	) {
		this.setupShortcuts()
		this.view = this.view.bind(this)
	}

	private readonly handleEditButtonClick: (ev: MouseEvent, receiver: HTMLElement) => void = async (ev: MouseEvent, receiver: HTMLElement) => {
		if (client.isCalendarApp()) {
			if (!(await Dialog.confirm("openMailApp_msg", "yes_label"))) return

			const query = `contactId=${stringToBase64(this.model.contact._id.join("/"))}`
			calendarLocator.systemFacade.openMailApp(stringToBase64(query))
			return
		}
		new ContactEditor(locator.entityClient, this.model.contact, listIdPart(this.model.contact._id), m.redraw).show()
	}

	view(): Children {
		return m(
			".abs.elevated-bg.plr-12.pb-16.border-radius.dropdown-shadow.flex.flex-column",
			{
				style: {
					// minus margin, need to apply it now to not overflow later
					width: px(Math.min(window.innerWidth - DROPDOWN_MARGIN * 2, 400)),
					// see hack description below
					opacity: "0",
					// because calendar event bubbles have 1px border, we want to align
					margin: "1px",
				},
				oncreate: (vnode) => {
					this.dom = vnode.dom as HTMLElement
					// This is a hack to get "natural" view size but render it without opacity first and then show dropdown with inferred
					// size.
					setTimeout(() => {
						showDropdown(this.eventBubbleRect, this.dom!, this.dom!.offsetHeight, 400)
						// Move the keyboard focus into the popup's buttons when it is shown
						const firstButton = vnode.dom.firstElementChild?.firstElementChild as HTMLInputElement | null
						firstButton?.focus()
					}, 24)
				},
			},
			[
				m(".flex.flex-end", [this.renderEditButton(), this.renderCloseButton()]),
				m(".flex-grow", [
					m(ContactPreviewView, {
						event: this.model.event,
						contact: this.model.contact,
					}),
				]),
			],
		)
	}

	private renderEditButton(): Children {
		if (!this.model.canEdit) return null
		return m(IconButton, { title: "edit_action", icon: Icons.ManageContact, click: this.handleEditButtonClick })
	}

	private renderCloseButton(): Children {
		return m(IconButton, {
			title: "close_alt",
			click: () => this.close(),
			icon: Icons.Cancel,
		})
	}

	show() {
		this.focusedBeforeShown = document.activeElement as HTMLElement
		modal.display(this, false)
	}

	private close() {
		modal.remove(this)
	}

	backgroundClick(e: MouseEvent): void {
		modal.remove(this)
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	onClose(): void {
		this.close()
	}

	shortcuts(): Shortcut[] {
		return this._shortcuts
	}

	popState(e: Event): boolean {
		modal.remove(this)
		return false
	}

	callingElement(): HTMLElement | null {
		return this.focusedBeforeShown
	}

	private setupShortcuts() {
		const close: Shortcut = {
			key: Keys.ESC,
			exec: () => this.close(),
			help: "close_alt",
		}
		const edit: Shortcut = {
			key: Keys.E,
			exec: () => this.handleEditButtonClick(new MouseEvent("click", {}), this.dom!),
			help: "edit_action",
		}

		this._shortcuts.push(close)

		if (this.model.canEdit) {
			this._shortcuts.push(edit)
		}
	}
}
