//@flow
import type {Shortcut} from "../misc/KeyManager"
import m from "mithril"
import {px} from "../gui/size"
import {getEventStart, getTimeZone} from "./CalendarUtils"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {Icons} from "../gui/base/icons/Icons"
import type {ModalComponent} from "../gui/base/Modal"
import {modal} from "../gui/base/Modal"
import {EventPreviewView} from "./EventPreviewView"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {Dialog} from "../gui/base/Dialog"
import type {CalendarInfo} from "./CalendarView"
import {CalendarEventViewModel, createCalendarEventViewModel} from "./CalendarEventViewModel"
import type {MailboxDetail} from "../mail/MailModel"
import {UserError} from "../api/common/error/UserError"
import {DROPDOWN_MARGIN, showDropdown} from "../gui/base/DropdownN"

export class CalendarEventPopup implements ModalComponent {
	_calendarEvent: CalendarEvent;
	_rect: ClientRect;
	_viewModel: CalendarEventViewModel;
	_onEditEvent: () => mixed;

	constructor(calendarEvent: CalendarEvent, calendars: Map<Id, CalendarInfo>, mailboxDetail: MailboxDetail, rect: ClientRect,
	            onEditEvent: () => mixed
	) {
		this._calendarEvent = calendarEvent
		this._rect = rect
		this._onEditEvent = onEditEvent
		if (calendarEvent._ownerGroup == null) {
			throw new Error("Tried to open popup with non-persistent calendar event")
		}
		const calendarInfo = calendars.get(calendarEvent._ownerGroup)
		if (calendarInfo == null) {
			throw new Error("Passed event from unknown calendar")
		}
		this._viewModel = createCalendarEventViewModel(getEventStart(calendarEvent, getTimeZone()), calendars, mailboxDetail,
			calendarEvent, null, true)
	}

	show() {
		modal.displayUnique(this, false)
	}

	view(vnode: Vnode<any>): Children {
		return m(".abs.elevated-bg.plr.border-radius.dropdown-shadow", {
				style: {
					width: px(Math.min(window.innerWidth - DROPDOWN_MARGIN * 2, 400)), // minus margin, need to apply it now to not overflow later
					opacity: "0", // see hack description below
					margin: "1px" // because calendar event bubles have 1px border, we want to align
				},
				oncreate: ({dom}) => {
					// This is a hack to get "natural" view size but render it without apacity first and then show dropdown with inferred
					// size.
					setTimeout(() => showDropdown(this._rect, dom, dom.offsetHeight, 400), 24)
				},
			},
			[
				m(".flex.flex-end", [
					m(ButtonN, {
						label: "edit_action",
						click: () => {
							this._onEditEvent()
							this._close()
						},
						type: ButtonType.ActionLarge,
						icon: () => Icons.Edit,
						colors: ButtonColors.DrawerNav,
					}),
					!this._viewModel.isReadOnlyEvent()
						? m(ButtonN, {
							label: "delete_action",
							click: () => deleteEvent(this._viewModel).then((confirmed) => {
								if (confirmed) this._close()
							}),
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
				m(EventPreviewView, {event: this._calendarEvent, limitDescriptionHeight: true}),
			],
		)
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
		return []
	}

	popState(e: Event): boolean {
		return true
	}
}

function deleteEvent(viewModel: CalendarEventViewModel): Promise<boolean> {
	return Dialog.confirm("deleteEventConfirmation_msg").then((confirmed) => {
		if (confirmed) {
			viewModel.deleteEvent().catch(UserError, (e) => Dialog.error(() => e.message))
		}
		return confirmed
	})
}