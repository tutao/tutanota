import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../common/gui/base/Dialog"
import { getStartOfTheWeekOffsetForUser } from "../../common/calendar/date/CalendarUtils"
import type { OutOfOfficeNotification } from "../../common/api/entities/tutanota/TypeRefs.js"
import { TextField } from "../../common/gui/base/TextField.js"
import { lang } from "../../common/misc/LanguageViewModel"
import { Keys, OUT_OF_OFFICE_SUBJECT_PREFIX } from "../../common/api/common/TutanotaConstants"
import { Checkbox } from "../../common/gui/base/Checkbox.js"
import { px } from "../../common/gui/size"
import { ButtonType } from "../../common/gui/base/Button.js"
import { getDefaultNotificationLabel } from "../../common/misc/OutOfOfficeNotificationUtils"
import { showPlanUpgradeRequiredDialog } from "../../common/misc/SubscriptionDialogs"
import { DropDownSelector } from "../../common/gui/base/DropDownSelector.js"
import { showUserError } from "../../common/misc/ErrorHandlerImpl"
import { locator } from "../../common/api/main/CommonLocator"
import { EditOutOfOfficeNotificationDialogModel, RecipientMessageType } from "./EditOutOfOfficeNotificationDialogModel"
import { HtmlEditor } from "../../common/gui/editor/HtmlEditor"
import { UserError } from "../../common/api/main/UserError"
import { DatePicker } from "../../calendar-app/calendar/gui/pickers/DatePicker"
import type { lazy } from "@tutao/tutanota-utils"
import { ofClass } from "@tutao/tutanota-utils"
import { DialogHeaderBarAttrs } from "../../common/gui/base/DialogHeaderBar"
import { UpgradeRequiredError } from "../../common/api/main/UpgradeRequiredError.js"

export function showEditOutOfOfficeNotificationDialog(outOfOfficeNotification: OutOfOfficeNotification | null) {
	const dialogModel = new EditOutOfOfficeNotificationDialogModel(
		outOfOfficeNotification,
		locator.entityClient,
		locator.logins.getUserController(),
		lang,
		locator.serviceExecutor,
	)
	const organizationMessageEditor = new HtmlEditor("message_label")
		.setMinHeight(100)
		.showBorders()
		.setValue(dialogModel.organizationMessage())
		.enableToolbar()
	const defaultMessageEditor = new HtmlEditor("message_label").setMinHeight(100).showBorders().setValue(dialogModel.defaultMessage()).enableToolbar()

	const saveOutOfOfficeNotification = () => {
		dialogModel.organizationMessage(organizationMessageEditor.getValue())
		dialogModel.defaultMessage(defaultMessageEditor.getValue())
		dialogModel
			.saveOutOfOfficeNotification()
			.then(() => cancel())
			.catch(ofClass(UserError, (e) => showUserError(e)))
			.catch(
				ofClass(UpgradeRequiredError, (e) => {
					showPlanUpgradeRequiredDialog(e.plans)
				}),
			)
	}

	function cancel() {
		dialog.close()
	}

	const dialogHeaderAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: cancel,
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "save_action",
				click: saveOutOfOfficeNotification,
				type: ButtonType.Primary,
			},
		],
		middle: () => lang.get("outOfOfficeNotification_title"),
	}
	const dialog = Dialog.editDialog(dialogHeaderAttrs, EditOutOfOfficeNotificationDialog, {
		model: dialogModel,
		organizationMessageEditor,
		defaultMessageEditor,
	})
		.addShortcut({
			key: Keys.ESC,
			exec: cancel,
			help: "close_alt",
		})
		.addShortcut({
			key: Keys.S,
			ctrlOrCmd: true,
			exec: saveOutOfOfficeNotification,
			help: "save_action",
		})
	dialog.show()
}

type EditOutOfOfficeNotificationDialogAttrs = {
	model: EditOutOfOfficeNotificationDialogModel
	defaultMessageEditor: HtmlEditor
	organizationMessageEditor: HtmlEditor
}

class EditOutOfOfficeNotificationDialog implements Component<EditOutOfOfficeNotificationDialogAttrs> {
	view(vnode: Vnode<EditOutOfOfficeNotificationDialogAttrs>): Children {
		const { model, defaultMessageEditor, organizationMessageEditor } = vnode.attrs
		const defaultEnabled = model.isDefaultMessageEnabled()
		const organizationEnabled = model.isOrganizationMessageEnabled()
		const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot)
		return [
			this.renderEnabled(model),
			this.renderRecipients(model),
			m(
				".mt.flex-start",
				m(Checkbox, {
					label: () => lang.get("outOfOfficeTimeRange_msg"),
					checked: model.timeRangeEnabled(),
					onChecked: model.timeRangeEnabled,
					helpLabel: () => lang.get("outOfOfficeTimeRangeHelp_msg"),
				}),
			),
			model.timeRangeEnabled() ? this.renderTimeRangeSelector(model, startOfTheWeekOffset) : null,
			m(".mt-l", lang.get("outOfOfficeUnencrypted_msg")),
			organizationEnabled ? this.renderOrganizations(model, organizationMessageEditor) : null,
			defaultEnabled ? this.renderDefault(organizationEnabled, model, defaultMessageEditor) : null,
			m(".pb", ""),
		]
	}

	private renderEnabled(model: EditOutOfOfficeNotificationDialogModel) {
		const statusItems = [
			{ name: lang.get("deactivated_label"), value: false },
			{ name: lang.get("activated_label"), value: true },
		]
		return m(DropDownSelector, {
			label: "state_label",
			items: statusItems,
			selectedValue: model.enabled(),
			selectionChangedHandler: model.enabled,
		})
	}

	private renderDefault(organizationEnabled: boolean, model: EditOutOfOfficeNotificationDialogModel, defaultMessageEditor: HtmlEditor) {
		return [
			m(".h4.text-center.mt-l", getDefaultNotificationLabel(organizationEnabled)),
			m(TextField, {
				label: "subject_label",
				value: model.defaultSubject(),
				oninput: model.defaultSubject,
				injectionsLeft: () =>
					m(
						".flex-no-grow-no-shrink-auto.pr-s",
						{
							style: {
								"line-height": px(24),
								opacity: "1",
							},
						},
						OUT_OF_OFFICE_SUBJECT_PREFIX,
					),
			}),
			m(defaultMessageEditor),
		]
	}

	private renderOrganizations(model: EditOutOfOfficeNotificationDialogModel, organizationMessageEditor: HtmlEditor) {
		return [
			m(".h4.text-center.mt-l", lang.get("outOfOfficeInternal_msg")),
			m(TextField, {
				label: "subject_label",
				value: model.organizationSubject(),
				oninput: model.organizationSubject,
				injectionsLeft: () =>
					m(
						".flex-no-grow-no-shrink-auto.pr-s",
						{
							style: {
								"line-height": px(24),
								opacity: "1",
							},
						},
						OUT_OF_OFFICE_SUBJECT_PREFIX,
					),
			}),
			m(organizationMessageEditor),
		]
	}

	private renderRecipients(model: EditOutOfOfficeNotificationDialogModel) {
		const recipientItems = [
			{ name: lang.get("everyone_label"), value: RecipientMessageType.EXTERNAL_TO_EVERYONE },
			{ name: lang.get("insideOutside_label"), value: RecipientMessageType.INTERNAL_AND_EXTERNAL },
			{ name: lang.get("insideOnly_label"), value: RecipientMessageType.INTERNAL_ONLY },
		]
		const recipientHelpLabel: lazy<string> = () => {
			switch (model.recipientMessageTypes()) {
				case RecipientMessageType.EXTERNAL_TO_EVERYONE:
					return lang.get("outOfOfficeRecipientsEveryoneHelp_label")

				case RecipientMessageType.INTERNAL_AND_EXTERNAL:
					return lang.get("outOfOfficeRecipientsInternalExternalHelp_label")

				case RecipientMessageType.INTERNAL_ONLY:
					return lang.get("outOfOfficeRecipientsInternalOnlyHelp_label")

				default:
					return ""
			}
		}

		return m(DropDownSelector, {
			label: "outOfOfficeRecipients_label",
			items: recipientItems,
			selectedValue: model.recipientMessageTypes(),
			selectionChangedHandler: model.recipientMessageTypes,
			helpLabel: recipientHelpLabel,
		})
	}

	private renderTimeRangeSelector(model: EditOutOfOfficeNotificationDialogModel, startOfTheWeekOffset: number): Children {
		return m(".flex.col", [
			m(DatePicker, {
				date: model.startDate(),
				onDateSelected: model.startDate,
				label: "dateFrom_label",
				nullSelectionText: "emptyString_msg",
				startOfTheWeekOffset,
			}),
			m(Checkbox, {
				label: () => lang.get("unlimited_label"),
				checked: model.indefiniteTimeRange(),
				onChecked: model.indefiniteTimeRange,
			}),
			!model.indefiniteTimeRange()
				? m(DatePicker, {
						date: model.endDate(),
						onDateSelected: model.endDate,
						label: "dateTo_label",
						nullSelectionText: "emptyString_msg",
						startOfTheWeekOffset,
				  })
				: null,
		])
	}
}
