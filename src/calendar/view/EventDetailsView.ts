import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../gui/base/IconButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { EventPreviewView } from "./eventpopup/EventPreviewView.js"
import { createAsyncDropdown } from "../../gui/base/Dropdown.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { CalendarEventPreviewViewModel } from "./eventpopup/CalendarEventPreviewViewModel.js"

export interface EventDetailsViewAttrs {
	eventPreviewModel: CalendarEventPreviewViewModel
}

export class EventDetailsView implements Component<EventDetailsViewAttrs> {
	private model: CalendarEventPreviewViewModel | null = null

	view({ attrs }: Vnode<EventDetailsViewAttrs>) {
		this.model = attrs.eventPreviewModel

		return m(".pl-l.pb-s.flex.pr", [
			m(
				".flex-grow",
				{
					style: {
						// align text to the buttons on the right
						paddingTop: "6px",
					},
				},
				m(EventPreviewView, {
					event: this.model.calendarEvent,
					sanitizedDescription: this.model.getSanitizedDescription(),
					participation: this.model.getParticipationSetterAndThen(() => null),
				}),
			),
			m(".flex.mt-xs", [this.renderSendUpdateButton(), this.renderEditButton(), this.renderDeleteButton()]),
		])
	}

	private renderEditButton(): Children {
		if (this.model == null || !this.model.canEdit) return null
		return m(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			colors: ButtonColor.DrawerNav,
			click: (event, dom) => this.handleEditButtonClick(event, dom),
		})
	}

	private renderDeleteButton(): Children {
		if (this.model == null || !this.model.canDelete) return null
		return m(IconButton, {
			title: "delete_action",
			icon: Icons.Trash,
			colors: ButtonColor.DrawerNav,
			click: (event, dom) => this.handleDeleteButtonClick(event, dom),
		})
	}

	private renderSendUpdateButton(): Children {
		if (this.model == null || !this.model.canSendUpdates) return null
		return m(Button, {
			label: "sendUpdates_label",
			click: (event, dom) => this.handleSendUpdatesClick(),
			type: ButtonType.ActionLarge,
			icon: () => BootIcons.Mail,
			colors: ButtonColor.DrawerNav,
		})
	}

	private async handleDeleteButtonClick(ev: MouseEvent, receiver: HTMLElement) {
		if (await this.model?.isRepeatingForDeleting()) {
			createAsyncDropdown({
				lazyButtons: () =>
					Promise.resolve([
						{
							label: "deleteSingleEventRecurrence_action",
							click: async () => {
								await this.model?.deleteSingle()
							},
						},
						{
							label: "deleteAllEventRecurrence_action",
							click: () => this.confirmDeleteClose(),
						},
					]),
				width: 300,
			})(ev, receiver)
		} else {
			// noinspection JSIgnoredPromiseFromCall
			this.confirmDeleteClose()
		}
	}

	private handleEditButtonClick(ev: MouseEvent, receiver: HTMLElement) {
		if (this.model?.isRepeatingForEditing) {
			createAsyncDropdown({
				lazyButtons: () =>
					Promise.resolve([
						{
							label: "updateOneCalendarEvent_action",
							click: () => {
								// noinspection JSIgnoredPromiseFromCall
								this.model?.editSingle()
							},
						},
						{
							label: "updateAllCalendarEvents_action",
							click: () => {
								// noinspection JSIgnoredPromiseFromCall
								this.model?.editAll()
							},
						},
					]),
				width: 300,
			})(ev, receiver)
		} else {
			// noinspection JSIgnoredPromiseFromCall
			this.model?.editAll()
		}
	}

	private async handleSendUpdatesClick() {
		const confirmed = await Dialog.confirm("sendUpdates_msg")
		if (confirmed) await this.model?.sendUpdates()
	}

	private async confirmDeleteClose(): Promise<void> {
		if (!(await Dialog.confirm("deleteEventConfirmation_msg"))) return
		await this.model?.deleteAll()
	}
}
