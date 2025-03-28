import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { EventPreviewView } from "../gui/eventpopup/EventPreviewView.js"
import { createAsyncDropdown } from "../../../common/gui/base/Dropdown.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { CalendarEventPreviewViewModel } from "../gui/eventpopup/CalendarEventPreviewViewModel.js"
import { styles } from "../../../common/gui/styles.js"

export interface EventDetailsViewAttrs {
	eventPreviewModel: CalendarEventPreviewViewModel
	deleteCallback?: () => void
	editCallback?: () => void
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
					calendarEventPreviewModel: this.model,
				}),
			),
			m(".flex.mt-xs", [this.renderSendUpdateButton(), this.renderEditButton(attrs.editCallback), this.renderDeleteButton(attrs.deleteCallback)]),
		])
	}

	private renderEditButton(callback?: () => void): Children {
		if (this.model == null || !this.model.canEdit || styles.isSingleColumnLayout()) return null
		return m(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: (event, dom) => handleEventEditButtonClick(this.model, event, dom, callback),
		})
	}

	private renderDeleteButton(callback?: () => void): Children {
		if (this.model == null || !this.model.canDelete || styles.isSingleColumnLayout()) return null
		return m(IconButton, {
			title: "delete_action",
			icon: Icons.Trash,
			click: (event, dom) => handleEventDeleteButtonClick(this.model, event, dom, callback),
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

export function handleEventEditButtonClick(previewModel: CalendarEventPreviewViewModel | null, ev: MouseEvent, receiver: HTMLElement, cb?: () => unknown) {
	const handleCallback = () => {
		if (cb) {
			cb()
		}
	}

	if (previewModel?.isRepeatingForEditing) {
		createAsyncDropdown({
			lazyButtons: () =>
				Promise.resolve([
					{
						label: "updateOneCalendarEvent_action",
						click: () => {
							// noinspection JSIgnoredPromiseFromCall
							previewModel?.editSingle()
							handleCallback()
						},
					},
					{
						label: "updateAllCalendarEvents_action",
						click: () => {
							// noinspection JSIgnoredPromiseFromCall
							previewModel?.editAll()
							handleCallback()
						},
					},
				]),
			width: 300,
		})(ev, receiver)
	} else {
		// noinspection JSIgnoredPromiseFromCall
		previewModel?.editAll()
		handleCallback()
	}
}

export async function handleEventDeleteButtonClick(
	previewModel: CalendarEventPreviewViewModel | null,
	ev: MouseEvent,
	receiver: HTMLElement,
	cb?: () => unknown,
): Promise<void> {
	const handleCallback = () => {
		if (cb) {
			cb()
		}
	}

	if (await previewModel?.isRepeatingForDeleting()) {
		createAsyncDropdown({
			lazyButtons: () =>
				Promise.resolve([
					{
						label: "deleteSingleEventRecurrence_action",
						click: async () => {
							await previewModel?.deleteSingle()
							handleCallback()
						},
					},
					{
						label: "deleteAllEventRecurrence_action",
						click: async () => {
							if (await confirmDeleteClose(previewModel)) {
								handleCallback()
							}
						},
					},
				]),
			width: 300,
		})(ev, receiver)
	} else {
		if (await confirmDeleteClose(previewModel)) {
			handleCallback()
		}
	}
}

async function confirmDeleteClose(previewModel: CalendarEventPreviewViewModel | null): Promise<boolean> {
	if (!(await Dialog.confirm("deleteEventConfirmation_msg"))) return false
	await previewModel?.deleteAll()
	return true
}
