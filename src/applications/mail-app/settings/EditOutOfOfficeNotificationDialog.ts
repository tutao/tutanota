import m, { Children, Component, Vnode } from "mithril"
import Stream from "mithril/stream"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { FeatureType, UpgradePromptType } from "../../../platform-kit/app-env"
import { font_size, px, size } from "../../../ui/size"
import { getDefaultNotificationLabel, loadOutOfOfficeNotification } from "../../common/misc/OutOfOfficeNotificationUtils"
import { showPlanUpgradeRequiredDialog } from "../../common/misc/SubscriptionDialogs"
import { showUserError } from "../../common/misc/ErrorHandlerImpl"
import { locator } from "../../common/api/main/CommonLocator"
import { EditOutOfOfficeNotificationDialogModel, RecipientMessageType } from "./EditOutOfOfficeNotificationDialogModel"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor"
import { UserError } from "../../common/api/main/UserError"
import { DatePicker } from "../../calendar-app/calendar/gui/pickers/DatePicker"
import { lazy } from "../../../platform-kit/utils"
import { UpgradeRequiredError } from "../../common/api/main/UpgradeRequiredError.js"
import { getStartOfTheWeekOffsetForUser } from "../../common/misc/weekOffset"
import { OUT_OF_OFFICE_SUBJECT_PREFIX } from "../../../entities/tutanota/Utils"
import { getHtmlSanitizer } from "../../common/misc/HtmlSanitizer"
import {
	EmailSignature,
	getDefaultEmailSignature,
	getSelectedEmailSignatureName,
	isCompanyEmailSignature,
	loadCustomEmailSignatures,
	replaceEmailSignature,
} from "../mail/signature/Signature"
import { attachDropdown } from "../../../ui/base/Dropdown"
import { elementIdToId } from "@tutao/meta"
import { mailLocator } from "../mailLocator"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { isUserMailbox } from "../../common/mailFunctionality/SharedMailUtils"
import { DropDownSelectorNew } from "../../../ui/base/DropDownSelectorNew"
import { TextField } from "../../../ui/base/TextField"
import { Card } from "../../../ui/base/Card"
import { Switch } from "../../../ui/base/Switch"
import { IconButton } from "../../../ui/base/IconButton"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"
import { Keys } from "../../../ui/utils/KeyboardKeys"

export async function showEditOutOfOfficeNotificationDialog(mailGroupId: Id) {
	const userController = locator.logins.getUserController()
	let mailboxDetail = await mailLocator.mailboxModel.getMailboxDetailsForMailGroup(mailGroupId)
	const customEmailSignatures = await loadCustomEmailSignatures(locator.entityClient, userController)
	const defaultSignature: EmailSignature[] = !locator.logins.isEnabled(FeatureType.DisableDefaultSignature) ? [getDefaultEmailSignature()] : []
	const availableSignatures = customEmailSignatures
		.filter(isCompanyEmailSignature)
		.concat(defaultSignature)
		.concat(customEmailSignatures.filter((signature) => !isCompanyEmailSignature(signature)))

	let state: DialogState | null = null
	let isSaving = false

	const selectMailbox = async (detail: MailboxDetail) => {
		const mailGroupId = elementIdToId(detail.mailGroup._id)
		const notification = await loadOutOfOfficeNotification(mailGroupId)
		const userMailbox = isUserMailbox(detail)
		const model = new EditOutOfOfficeNotificationDialogModel(
			notification,
			locator.entityClient,
			userController,
			lang,
			locator.serviceExecutor,
			customEmailSignatures,
			mailGroupId,
			userMailbox,
		)
		mailboxDetail = detail
		state = {
			model,
			organizationMessageEditor: createMessageEditor(model.organizationMessage(), userMailbox ? availableSignatures : []),
			defaultMessageEditor: createMessageEditor(model.defaultMessage(), userMailbox ? availableSignatures : []),
		}
		m.redraw()
	}
	await selectMailbox(mailboxDetail)

	const save = async () => {
		if (state == null || isSaving) return
		const { model, organizationMessageEditor, defaultMessageEditor } = state
		model.organizationMessage(organizationMessageEditor.getValue())
		model.defaultMessage(defaultMessageEditor.getValue())
		isSaving = true
		try {
			await model.saveOutOfOfficeNotification()
			dialog.close()
		} catch (e) {
			if (e instanceof UserError) {
				await showUserError(e)
			} else if (e instanceof UpgradeRequiredError) {
				await showPlanUpgradeRequiredDialog(UpgradePromptType.OUT_OF_OFFICE_NOTIFICATIONS, e.plans)
			} else {
				throw e
			}
		} finally {
			isSaving = false
		}
	}

	const dialog = Dialog.showActionDialog({
		title: "outOfOfficeNotification_title",
		type: DialogType.Popup_L,
		child: {
			view: () =>
				state == null
					? null
					: [
							m(EditOutOfOfficeNotificationDialog, state),
							m(".flex-end.wrap.mt-24.gap-16", m(PrimaryButton, { width: "flex", label: "save_action", onclick: save, disabled: isSaving })),
						],
		},
		okAction: null,
	})
	dialog.addShortcut({
		key: Keys.S,
		ctrlOrCmd: true,
		exec: () => void save(),
		help: "save_action",
	})
}

type DialogState = EditOutOfOfficeNotificationDialogAttrs

function createMessageEditor(value: string, signatures: ReadonlyArray<EmailSignature>): HtmlEditor {
	const editor: HtmlEditor = new HtmlEditor(getHtmlSanitizer()).setMinHeight(100).showBorders().setValue(value).enableToolbar().setBackgroundClass("nav-bg")
	const applySignature = (signature: EmailSignature | null) => editor.setValue(replaceEmailSignature(editor.getValue(), signature))
	const signatureButton =
		signatures.length > 0
			? attachDropdown({
					mainButtonAttrs: {
						label: "selectSignature_action",
						icon: Icons.PenFilled,
						size: ButtonSize.Compact,
					},
					childAttrs: async () => {
						const appliedName = getSelectedEmailSignatureName(editor.getValue())
						return signatures
							.map((signature) => ({
								label: lang.makeTranslation("signature", signature.name),
								click: () => applySignature(signature),
								icon: appliedName === signature.name ? Icons.Checkmark : undefined,
							}))
							.concat({
								label: lang.getTranslation("comboBoxSelectionNone_msg"),
								click: () => applySignature(null),
								icon: appliedName === null ? Icons.Checkmark : undefined,
							})
					},
				})
			: null
	return editor.setToolbarOptions({ isNonElevatedBackground: true, leadingButtonAttrs: signatureButton ? [signatureButton] : [] })
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
			m(".mt-16", this.renderRecipientsAndTimeRange(model, startOfTheWeekOffset)),
			organizationEnabled
				? this.renderMessageCard(
						model.enabled(),
						lang.getTranslationText("outOfOfficeInternal_msg"),
						model.organizationSubject,
						organizationMessageEditor.setEnabled(model.enabled()),
					)
				: null,
			defaultEnabled
				? this.renderMessageCard(
						model.enabled(),
						getDefaultNotificationLabel(organizationEnabled),
						model.defaultSubject,
						defaultMessageEditor.setEnabled(model.enabled()),
					)
				: null,
		]
	}

	private renderEnabled(model: EditOutOfOfficeNotificationDialogModel): Children {
		const label = model.enabled() ? lang.getTranslationText("activated_label") : lang.getTranslationText("deactivated_label")
		return m(
			Card,
			{ classes: ["mt-16"], style: { padding: px(size.spacing_16) } },
			m(Switch, { checked: model.enabled(), onclick: model.enabled, ariaLabel: label, togglePillPosition: "right", variant: "expanded" }, label),
		)
	}

	private renderMessageCard(enabled: boolean, title: string, subject: Stream<string>, editor: HtmlEditor): Children {
		return m(Card, { classes: ["mt-16"], style: { padding: px(size.spacing_16) } }, [
			m(".b.mb-8", title),
			m(TextField, {
				label: "subject_label",
				value: subject(),
				oninput: subject,
				disabled: !enabled,
				// mirrors the vertical positioning of the input inside TextField so the prefix lines up with the typed text
				injectionsLeft: () =>
					m(
						".flex-no-grow-no-shrink-auto.noselect",
						{
							style: {
								"padding-left": px(size.spacing_16),
								"margin-right": px(-size.spacing_12),
								"line-height": px(font_size.line_height_input),
								position: "relative",
								bottom: px(size.spacing_4),
							},
						},
						OUT_OF_OFFICE_SUBJECT_PREFIX,
					),
			}),
			m(editor),
		])
	}

	private renderRecipients(model: EditOutOfOfficeNotificationDialogModel): Children {
		const recipientItems = [
			{ name: lang.getTranslationText("everyone_label"), value: RecipientMessageType.EXTERNAL_TO_EVERYONE },
			{ name: lang.getTranslationText("insideOutside_label"), value: RecipientMessageType.INTERNAL_AND_EXTERNAL },
			{ name: lang.getTranslationText("insideOnly_label"), value: RecipientMessageType.INTERNAL_ONLY },
		]
		const recipientHelpLabel: lazy<string> = () => {
			switch (model.recipientMessageTypes()) {
				case RecipientMessageType.EXTERNAL_TO_EVERYONE:
					return lang.getTranslationText("outOfOfficeRecipientsEveryoneHelp_label")

				case RecipientMessageType.INTERNAL_AND_EXTERNAL:
					return lang.getTranslationText("outOfOfficeRecipientsInternalExternalHelp_label")

				case RecipientMessageType.INTERNAL_ONLY:
					return lang.getTranslationText("outOfOfficeRecipientsInternalOnlyHelp_label")

				default:
					return ""
			}
		}

		return m(
			".mt-8",
			m(DropDownSelectorNew<RecipientMessageType>, {
				label: "outOfOfficeRecipients_label",
				items: recipientItems,
				disabled: !model.enabled(),
				selectedValue: model.recipientMessageTypes(),
				selectionChangedHandler: model.recipientMessageTypes,
				helpLabel: recipientHelpLabel,
			}),
		)
	}

	private renderRecipientsAndTimeRange(model: EditOutOfOfficeNotificationDialogModel, startOfTheWeekOffset: number): Children {
		const outOfOfficeTimeRangeMsg = lang.getTranslationText("outOfOfficeTimeRange_msg")
		return m(
			Card,
			{
				style: {
					padding: px(size.spacing_16),
				},
			},
			[
				m(".flex.col.gap-16", [
					this.renderRecipients(model),
					m(
						Switch,
						{
							checked: model.timeRangeEnabled(),
							onclick: model.timeRangeEnabled,
							disabled: !model.enabled(),
							ariaLabel: outOfOfficeTimeRangeMsg,
							togglePillPosition: "right",
							variant: "expanded",
						},
						outOfOfficeTimeRangeMsg,
					),
				]),
				model.timeRangeEnabled()
					? m(".flex.gap-16.mt-8", [
							m(
								".flex-grow",
								m(DatePicker, {
									date: model.startDate(),
									onDateSelected: model.startDate,
									disabled: !model.enabled(),
									label: lang.getTranslation("dateFrom_label"),
									nullSelectionText: "emptyString_msg",
									startOfTheWeekOffset,
								}),
							),
							m(".flex-grow.flex.items-center", [
								m(
									".flex-grow",
									m(DatePicker, {
										// no date means the end is unlimited
										date: model.indefiniteTimeRange() ? null : model.endDate(),
										onDateSelected: (date) => {
											model.endDate(date)
											model.indefiniteTimeRange(false)
										},
										label: lang.getTranslation("dateTo_label"),
										disabled: !model.enabled(),
										nullSelectionText: "unlimited_label",
										startOfTheWeekOffset,
									}),
								),
								!model.indefiniteTimeRange()
									? m(IconButton, {
											label: "unlimited_label",
											icon: Icons.X,
											click: () => model.indefiniteTimeRange(true),
											disabled: !model.enabled(),
											size: ButtonSize.Compact,
										})
									: null,
							]),
						])
					: null,
			],
		)
	}
}
