//@flow
import type {Shortcut} from "../../misc/KeyManager"
import m from "mithril"
import {px} from "../../gui/size"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Icons} from "../../gui/base/icons/Icons"
import type {ModalComponent} from "../../gui/base/Modal"
import {modal} from "../../gui/base/Modal"
import {EventPreviewView} from "./EventPreviewView"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {Dialog} from "../../gui/base/Dialog"
import type {EventCreateResult} from "../date/CalendarEventViewModel"
import {CalendarEventViewModel} from "../date/CalendarEventViewModel"
import {UserError} from "../../api/main/UserError"
import {DROPDOWN_MARGIN, showDropdown} from "../../gui/base/DropdownN"
import {Keys} from "../../api/common/TutanotaConstants"
import type {HtmlSanitizer} from "../../misc/HtmlSanitizer"
import {prepareCalendarDescription} from "../date/CalendarUtils"
import {ofClass} from "@tutao/tutanota-utils"
import {noOp} from "@tutao/tutanota-utils"
import type {PosRect} from "../../gui/base/Dropdown"
import {BootIcons} from "../../gui/base/icons/BootIcons"

export class CalendarEventPopup implements ModalComponent {
	_calendarEvent: CalendarEvent
	_eventBubbleRect: PosRect
	_shortcuts: Shortcut[]
	_sanitizedDescription: string
	_onEditEvent: () => mixed
	_viewModel: ?CalendarEventViewModel // null for external users
	_isPersistentEvent: boolean
	_isExternal: boolean

	view: (Vnode<mixed>) => Children

	constructor(calendarEvent: CalendarEvent,
	            eventBubbleRect: PosRect,
	            htmlSanitizer: HtmlSanitizer,
	            onEditEvent: ?() => mixed,
	            viewModel: ?CalendarEventViewModel,
	) {
		this._calendarEvent = calendarEvent
		this._eventBubbleRect = eventBubbleRect
		this._onEditEvent = onEditEvent || noOp
		this._viewModel = viewModel

		const preparedDescription = prepareCalendarDescription(calendarEvent.description)
		// We receive the HtmlSanitizer from outside and do the sanitization inside, so that we don't have to just assume it was already done
		this._sanitizedDescription = preparedDescription
			? htmlSanitizer.sanitize(preparedDescription, {blockExternalContent: true}).text
			: ""
		this._isPersistentEvent = !!calendarEvent._ownerGroup
		this._isExternal = !this._viewModel

		this._shortcuts = [
			{
				key: Keys.ESC,
				exec: () => this._close(),
				help: "close_alt"
			}
		]

		if (!this._isExternal) {
			this._shortcuts.push(
				{
					key: Keys.E,
					exec: () => {
						this._onEditEvent()
						this._close()
					},
					help: "edit_action"
				})
		}
		if (this._isDeleteAvailable()) {
			this._shortcuts.push({
				key: Keys.DELETE,
				exec: () => {
					this._deleteEvent()
				},
				help: "delete_action"
			})
		}
		if (!!this._viewModel && this._viewModel.isForceUpdateAvailable()) {
			this._shortcuts.push({
				key: Keys.R,
				exec: () => {
					this._forceSendingUpdatesToAttendees()
				},
				help: "sendUpdates_label"
			})
		}

		this.view = (vnode: Vnode<any>) => {
			return m(".abs.elevated-bg.plr.border-radius.dropdown-shadow.flex.flex-column", {
					style: {
						width: px(Math.min(window.innerWidth - DROPDOWN_MARGIN * 2, 400)), // minus margin, need to apply it now to not overflow later
						opacity: "0", // see hack description below
						margin: "1px" // because calendar event bubbles have 1px border, we want to align
					},
					oncreate: ({dom}) => {
						// This is a hack to get "natural" view size but render it without opacity first and then show dropdown with inferred
						// size.
						setTimeout(() => showDropdown(this._eventBubbleRect, dom, dom.offsetHeight, 400), 24)
					},
				},
				[
					m(".flex.flex-end", [
						!!this._viewModel && this._viewModel.isForceUpdateAvailable()
							? m(ButtonN, {
								label: "sendUpdates_label",
								click: () => this._forceSendingUpdatesToAttendees(),
								type: ButtonType.ActionLarge,
								icon: () => BootIcons.Mail,
								colors: ButtonColors.DrawerNav,
							})
							: null,
						!this._isExternal
							? m(ButtonN, {
								label: "edit_action",
								click: () => {
									this._onEditEvent()
									this._close()
								},
								type: ButtonType.ActionLarge,
								icon: () => Icons.Edit,
								colors: ButtonColors.DrawerNav,
							})
							: null,
						this._isDeleteAvailable()
							? m(ButtonN, {
								label: "delete_action",
								click: () => this._deleteEvent(),
								type: ButtonType.ActionLarge,
								icon: () => Icons.Trash,
								colors: ButtonColors.DrawerNav,
							})
							: null,
						m(ButtonN, {
							label: "close_alt",
							click: () => this._close(),
							type: ButtonType.ActionLarge,
							icon: () => Icons.Cancel,
							colors: ButtonColors.DrawerNav,
						}),
					]),
					m(".flex-grow.scroll.visible-scrollbar", m(EventPreviewView, {
						event: this._calendarEvent,
						sanitizedDescription: this._sanitizedDescription
					})),
				],
			)
		}
	}

	show() {
		modal.displayUnique(this, false)
	}

	_close() {
		modal.remove(this)
	}

	backgroundClick(e: MouseEvent): void {
		modal.remove(this)
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	onClose(): void {
	}

	shortcuts(): Shortcut[] {
		return this._shortcuts
	}

	popState(e: Event): boolean {
		return true
	}


	_isDeleteAvailable(): boolean {
		return this._isPersistentEvent && !!this._viewModel && !this._viewModel.isReadOnlyEvent()
	}

	async _forceSendingUpdatesToAttendees(): Promise<void> {
		const viewModel = this._viewModel
		if (viewModel) {
			// we handle askForUpdates here to avoid making a request if not necessary
			const confirmUpdate = await Dialog.confirm("sendUpdates_msg")
			if (confirmUpdate) {
				viewModel.isForceUpdates(true)
				const success: EventCreateResult = await viewModel.saveAndSend({
					askForUpdates: () => Promise.resolve("yes"), // will be overwritten anyway because updates are forced
					askInsecurePassword: async () => true,
					showProgress: noOp
				}).finally(() => viewModel.isForceUpdates(false))
				if (success) {
					this._close()
				}
			}
		}
	}

	async _deleteEvent(): Promise<void> {
		const viewModel = this._viewModel
		if (viewModel) {
			const confirmed = await Dialog.confirm("deleteEventConfirmation_msg")
			if (confirmed) {
				await viewModel.deleteEvent().catch(ofClass(UserError, (e) => Dialog.error(() => e.message)))
				this._close()
			}
		}
	}
}

