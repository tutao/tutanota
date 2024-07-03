import type { Shortcut } from "../../../../common/misc/KeyManager.js"
import m, { Children } from "mithril"
import { px } from "../../../../common/gui/size.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import type { ModalComponent } from "../../../../common/gui/base/Modal.js"
import { modal } from "../../../../common/gui/base/Modal.js"
import { EventPreviewView, EventPreviewViewAttrs } from "./EventPreviewView.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { createAsyncDropdown, DROPDOWN_MARGIN, PosRect, showDropdown } from "../../../../common/gui/base/Dropdown.js"
import { Keys } from "../../../../common/api/common/TutanotaConstants.js"
import type { HtmlSanitizer } from "../../../../common/misc/HtmlSanitizer.js"
import { prepareCalendarDescription } from "../../../../common/calendar/date/CalendarUtils.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { convertTextToHtml } from "../../../../common/misc/Formatter.js"
import { CalendarEventPreviewViewModel } from "./CalendarEventPreviewViewModel.js"
import { showDeletePopup } from "../CalendarGuiUtils.js"

/**
 * small modal displaying all relevant information about an event in a compact fashion. offers limited editing capabilities to participants in the
 * form of quick response buttons to set attendance and adding exclusions.
 *
 * It is the first line of defense against invalid edit operations since it's the only way to open a
 * calendar editor for an event that's not brand new or to delete an event/parts of it.
 *
 * it is also responsible for divining the users intent before starting any operations so we can make sure we have the right
 * information available, like when editing all event occurrences or only some.
 */
export class CalendarEventPopup implements ModalComponent {
	private readonly _shortcuts: Shortcut[] = []
	private readonly sanitizedDescription: string
	private dom: HTMLElement | null = null
	private focusedBeforeShown: HTMLElement | null = null

	/**
	 * @param model
	 * @param eventBubbleRect the rect where the event bubble was displayed that was clicked (if any)
	 * @param htmlSanitizer
	 */
	constructor(private readonly model: CalendarEventPreviewViewModel, private readonly eventBubbleRect: PosRect, htmlSanitizer: HtmlSanitizer) {
		// We receive the HtmlSanitizer from outside and do the sanitization inside, so that we don't have to just assume it was already done
		this.sanitizedDescription = prepareCalendarDescription(
			model.calendarEvent.description,
			(s) =>
				htmlSanitizer.sanitizeHTML(convertTextToHtml(s), {
					blockExternalContent: true,
				}).html,
		)

		this.setupShortcuts()
		this.view = this.view.bind(this)
	}

	private readonly handleDeleteButtonClick: (ev: MouseEvent, receiver: HTMLElement) => void = async (ev: MouseEvent, receiver: HTMLElement) => {
		showDeletePopup(this.model, ev, receiver, () => this.close())
	}

	private readonly handleEditButtonClick: (ev: MouseEvent, receiver: HTMLElement) => void = (ev: MouseEvent, receiver: HTMLElement) => {
		if (this.model.isRepeatingForEditing) {
			createAsyncDropdown({
				lazyButtons: () =>
					Promise.resolve([
						{
							label: "updateOneCalendarEvent_action",
							click: () => {
								// noinspection JSIgnoredPromiseFromCall
								this.model.editSingle()
								this.close()
							},
						},
						{
							label: "updateAllCalendarEvents_action",
							click: () => {
								// noinspection JSIgnoredPromiseFromCall
								this.model.editAll()
								this.close()
							},
						},
					]),
				width: 300,
			})(ev, receiver)
		} else {
			// noinspection JSIgnoredPromiseFromCall
			this.model.editAll()
			this.close()
		}
	}

	// we handle askForUpdates here to avoid making a request if not necessary
	private readonly handleSendUpdatesClick: () => void = async () => {
		const confirmed = await Dialog.confirm("sendUpdates_msg")
		if (confirmed) await this.model.sendUpdates()
		this.close()
	}

	view(): Children {
		return m(
			".abs.elevated-bg.plr.pb.border-radius.dropdown-shadow.flex.flex-column",
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
				m(".flex.flex-end", [this.renderSendUpdateButton(), this.renderEditButton(), this.renderDeleteButton(), this.renderCloseButton()]),
				m(".flex-grow.scroll.visible-scrollbar", [
					m(EventPreviewView, {
						event: this.model.calendarEvent,
						sanitizedDescription: this.sanitizedDescription,
						// closing this since repeated edit operations from the popup would always
						// use the version of the event the popup was opened with, which means the next
						// click uses an outdated version.
						participation: this.model.getParticipationSetterAndThen(() => this.close()),
					} satisfies EventPreviewViewAttrs),
				]),
			],
		)
	}

	private renderEditButton(): Children {
		if (!this.model.canEdit) return null
		return m(IconButton, { title: "edit_action", icon: Icons.Edit, click: this.handleEditButtonClick })
	}

	private renderDeleteButton(): Children {
		if (!this.model.canDelete) return null
		return m(IconButton, { title: "delete_action", icon: Icons.Trash, click: this.handleDeleteButtonClick })
	}

	private renderSendUpdateButton(): Children {
		if (!this.model.canSendUpdates) return null
		return m(IconButton, {
			title: "sendUpdates_label",
			click: () => this.handleSendUpdatesClick(),
			icon: BootIcons.Mail,
		})
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
		const sendUpdates: Shortcut = {
			key: Keys.R,
			exec: this.handleSendUpdatesClick,
			help: "sendUpdates_label",
		}
		const remove: Shortcut = {
			key: Keys.DELETE,
			exec: () => this.handleDeleteButtonClick(new MouseEvent("click", {}), this.dom!),
			help: "delete_action",
		}

		this._shortcuts.push(close)

		if (this.model.canSendUpdates) {
			this._shortcuts.push(sendUpdates)
		}

		if (this.model.canEdit) {
			this._shortcuts.push(edit)
		}

		if (this.model.canDelete) {
			this._shortcuts.push(remove)
		}
	}
}
