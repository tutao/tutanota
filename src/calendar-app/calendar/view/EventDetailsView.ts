import m, { Children, Component, Vnode } from "mithril"
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { Button, ButtonColor, ButtonType } from "../../../common/gui/base/Button.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { EventPreviewView } from "../gui/eventpopup/EventPreviewView.js"
import { createAsyncDropdown } from "../../../common/gui/base/Dropdown.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { CalendarEventPreviewViewModel } from "../gui/eventpopup/CalendarEventPreviewViewModel.js"
import { styles } from "../../../common/gui/styles.js"

export interface EventDetailsViewAttrs {
	eventPreviewModel: CalendarEventPreviewViewModel
}

export class EventDetailsView implements Component<EventDetailsViewAttrs> {
	private model: CalendarEventPreviewViewModel | null = null

	view({ attrs }: Vnode<EventDetailsViewAttrs>) {
		this.model = attrs.eventPreviewModel

		return m(".content-bg.border-radius-big.pl-l.pb-s.flex.pr", [
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
		if (this.model == null || !this.model.canEdit || styles.isSingleColumnLayout()) return null
		return m(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: (event, dom) => handleEventEditButtonClick(this.model, event, dom),
		})
	}

	private renderDeleteButton(): Children {
		if (this.model == null || !this.model.canDelete || styles.isSingleColumnLayout()) return null
		return m(IconButton, {
			title: "delete_action",
			icon: Icons.Trash,
			click: (event, dom) => handleEventDeleteButtonClick(this.model, event, dom),
		})
	}

	private renderSendUpdateButton(): Children {
		if (this.model == null || !this.model.canSendUpdates || styles.isSingleColumnLayout()) return null
		return m(IconButton, {
			title: "sendUpdates_label",
			click: () => handleSendUpdatesClick(this.model),
			icon: BootIcons.Mail,
		})
	}

	private async confirmDeleteClose(): Promise<void> {
		if (!(await Dialog.confirm("deleteEventConfirmation_msg"))) return
		await this.model?.deleteAll()
	}
}

export async function handleSendUpdatesClick(previewModel: CalendarEventPreviewViewModel | null) {
	const confirmed = await Dialog.confirm("sendUpdates_msg")
	if (confirmed) await previewModel?.sendUpdates()
}

export function handleEventEditButtonClick(previewModel: CalendarEventPreviewViewModel | null, ev: MouseEvent, receiver: HTMLElement) {
	if (previewModel?.isRepeatingForEditing) {
		createAsyncDropdown({
			lazyButtons: () =>
				Promise.resolve([
					{
						label: "updateOneCalendarEvent_action",
						click: () => {
							// noinspection JSIgnoredPromiseFromCall
							previewModel?.editSingle()
						},
					},
					{
						label: "updateAllCalendarEvents_action",
						click: () => {
							// noinspection JSIgnoredPromiseFromCall
							previewModel?.editAll()
						},
					},
				]),
			width: 300,
		})(ev, receiver)
	} else {
		// noinspection JSIgnoredPromiseFromCall
		previewModel?.editAll()
	}
}

export async function handleEventDeleteButtonClick(previewModel: CalendarEventPreviewViewModel | null, ev: MouseEvent, receiver: HTMLElement) {
	if (await previewModel?.isRepeatingForDeleting()) {
		createAsyncDropdown({
			lazyButtons: () =>
				Promise.resolve([
					{
						label: "deleteSingleEventRecurrence_action",
						click: async () => {
							await previewModel?.deleteSingle()
						},
					},
					{
						label: "deleteAllEventRecurrence_action",
						click: () => confirmDeleteClose(previewModel),
					},
				]),
			width: 300,
		})(ev, receiver)
	} else {
		// noinspection JSIgnoredPromiseFromCall, ES6MissingAwait
		confirmDeleteClose(previewModel)
	}
}

async function confirmDeleteClose(previewModel: CalendarEventPreviewViewModel | null): Promise<void> {
	if (!(await Dialog.confirm("deleteEventConfirmation_msg"))) return
	await previewModel?.deleteAll()
}
