import type { Shortcut } from "../../misc/KeyManager"
import m, { Children } from "mithril"
import { px } from "../../gui/size"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { Icons } from "../../gui/base/icons/Icons"
import type { ModalComponent } from "../../gui/base/Modal"
import { modal } from "../../gui/base/Modal"
import { EventPreviewView } from "./EventPreviewView"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog"
import type { EventCreateResult } from "../date/CalendarEventViewModel"
import { CalendarEventViewModel } from "../date/CalendarEventViewModel"
import { UserError } from "../../api/main/UserError"
import { attachDropdown, DROPDOWN_MARGIN, PosRect, showDropdown } from "../../gui/base/Dropdown.js"
import { Keys } from "../../api/common/TutanotaConstants"
import type { HtmlSanitizer } from "../../misc/HtmlSanitizer"
import { calendarEventHasMoreThanOneOccurrencesLeft, prepareCalendarDescription } from "../date/CalendarUtils"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { IconButton } from "../../gui/base/IconButton.js"

export class CalendarEventPopup implements ModalComponent {
	private readonly _shortcuts: Shortcut[] = []
	private readonly sanitizedDescription: string

	private readonly isPersistentEvent: boolean
	private readonly isExternal: boolean

	constructor(
		private readonly calendarEvent: CalendarEvent,
		private readonly eventBubbleRect: PosRect,
		htmlSanitizer: HtmlSanitizer,
		private readonly onEditEvent: () => unknown = noOp,
		// null for external users
		private readonly viewModel: CalendarEventViewModel | null,
		private readonly firstOccurrence: CalendarEvent | null,
	) {
		const preparedDescription = prepareCalendarDescription(calendarEvent.description)
		// We receive the HtmlSanitizer from outside and do the sanitization inside, so that we don't have to just assume it was already done
		this.sanitizedDescription = preparedDescription
			? htmlSanitizer.sanitizeHTML(preparedDescription, {
					blockExternalContent: true,
			  }).html
			: ""
		this.isPersistentEvent = !!calendarEvent._ownerGroup
		this.isExternal = !this.viewModel
		this._shortcuts.push({
			key: Keys.ESC,
			exec: () => this.close(),
			help: "close_alt",
		})

		if (!this.isExternal) {
			this._shortcuts.push({
				key: Keys.E,
				exec: () => {
					this.onEditEvent()

					this.close()
				},
				help: "edit_action",
			})
		}

		if (this.isDeleteAvailable()) {
			this._shortcuts.push({
				key: Keys.DELETE,
				exec: () => {
					this.deleteEvent()
				},
				help: "delete_action",
			})
		}

		if (!!this.viewModel && this.viewModel.isForceUpdateAvailable()) {
			this._shortcuts.push({
				key: Keys.R,
				exec: () => {
					// noinspection JSIgnoredPromiseFromCall
					this.forceSendingUpdatesToAttendees()
				},
				help: "sendUpdates_label",
			})
		}

		this.view = this.view.bind(this)
	}

	view(): Children {
		return m(
			".abs.elevated-bg.plr.border-radius.dropdown-shadow.flex.flex-column",
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
					const dom = vnode.dom as HTMLElement
					// This is a hack to get "natural" view size but render it without opacity first and then show dropdown with inferred
					// size.
					setTimeout(() => showDropdown(this.eventBubbleRect, dom, dom.offsetHeight, 400), 24)
				},
			},
			[
				m(".flex.flex-end", [
					!!this.viewModel && this.viewModel.isForceUpdateAvailable()
						? m(Button, {
								label: "sendUpdates_label",
								click: () => this.forceSendingUpdatesToAttendees(),
								type: ButtonType.ActionLarge,
								icon: () => BootIcons.Mail,
								colors: ButtonColor.DrawerNav,
						  })
						: null,
					!this.isExternal
						? m(Button, {
								label: "edit_action",
								click: () => {
									this.onEditEvent()

									this.close()
								},
								type: ButtonType.ActionLarge,
								icon: () => Icons.Edit,
								colors: ButtonColor.DrawerNav,
						  })
						: null,
					this.renderDeleteButton(),
					m(Button, {
						label: "close_alt",
						click: () => this.close(),
						type: ButtonType.ActionLarge,
						icon: () => Icons.Cancel,
						colors: ButtonColor.DrawerNav,
					}),
				]),
				m(".flex-grow.scroll.visible-scrollbar", [
					m(EventPreviewView, {
						event: this.calendarEvent,
						sanitizedDescription: this.sanitizedDescription,
					}),
				]),
			],
		)
	}

	show() {
		if (!this.viewModel?.selectedCalendar) return
		modal.display(this, false)
	}

	private close() {
		modal.remove(this)
	}

	private renderDeleteButton(): Children {
		if (!this.isDeleteAvailable()) return null

		return m(
			IconButton,
			attachDropdown({
				mainButtonAttrs: {
					title: "delete_action",
					icon: Icons.Trash,
					colors: ButtonColor.DrawerNav,
				},
				childAttrs: () => [
					{
						label: "deleteSingleEventRecurrence_action",
						click: () => this.addExclusion(),
					},
					{
						label: "deleteAllEventRecurrence_action",
						click: () => this.deleteEvent(),
					},
				],
				showDropdown: () => {
					if (this.firstOccurrence && calendarEventHasMoreThanOneOccurrencesLeft(this.firstOccurrence)) {
						return true
					} else {
						this.deleteEvent()
						return false
					}
				},
				width: 300,
			}),
		)
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

	private isDeleteAvailable(): boolean {
		return this.isPersistentEvent && !!this.viewModel && !this.viewModel.isReadOnlyEvent()
	}

	private async forceSendingUpdatesToAttendees(): Promise<void> {
		const viewModel = this.viewModel

		if (viewModel) {
			// we handle askForUpdates here to avoid making a request if not necessary
			const confirmUpdate = await Dialog.confirm("sendUpdates_msg")

			if (confirmUpdate) {
				viewModel.isForceUpdates(true)
				const success: EventCreateResult = await viewModel
					.saveAndSend({
						askForUpdates: () => Promise.resolve("yes"),
						// will be overwritten anyway because updates are forced
						askInsecurePassword: async () => true,
						showProgress: noOp,
					})
					.finally(() => viewModel.isForceUpdates(false))

				if (success) {
					this.close()
				}
			}
		}
	}

	private async deleteEvent(): Promise<void> {
		const viewModel = this.viewModel

		if (viewModel) {
			const confirmed = await Dialog.confirm("deleteEventConfirmation_msg")

			if (confirmed) {
				await viewModel.deleteEvent().catch(ofClass(UserError, (e) => Dialog.message(() => e.message)))

				this.close()
			}
		}
	}

	/** add an exclusion for this event instance start time on the original event */
	private async addExclusion(): Promise<void> {
		const viewModel = this.viewModel
		if (viewModel == null) return
		this.close()
		return await viewModel.excludeThisOccurrence()
	}
}
