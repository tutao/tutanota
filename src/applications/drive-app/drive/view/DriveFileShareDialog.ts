import m, { Children, Component } from "mithril"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { ButtonType } from "../../../../ui/base/Button"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { FileFolderItem, normalizeShareExpirationDate } from "./DriveUtils"
import { TextField } from "../../../../ui/base/TextField"
import { assertNotNull, isNotNull, isNull } from "@tutao/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { px, size } from "../../../../ui/size"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showInfoSnackbar, showSnackBar } from "../../../../ui/base/SnackBar"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { theme } from "../../../../ui/theme"
import { PrimaryButton, SecondaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Switch } from "../../../../ui/base/Switch"
import { PasswordFieldNew } from "../../../common/misc/passwords/PasswordFieldNew"
import { DatePicker, DatePickerAttrs } from "../../../calendar-app/calendar/gui/pickers/DatePicker"
import { DriveFile } from "@tutao/entities/drive"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { DriveFileSharingFacade, DriveShareInfo } from "../../../common/api/worker/facades/lazy/DriveFileSharingFacade"
import { Styles } from "../../../../ui/styles"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import { LoginController } from "../../../common/api/main/LoginController"
import { ClickHandler, keyboardEventFrom } from "../../../../ui/base/GuiUtils"
import { LazyComponent } from "../../../common/gui/LazyComponent"
import { CacheMode } from "../../../../platform-kit/instance-pipeline/RestClientOptions"
import { pureComponent } from "../../../../ui/base/PureComponent"
import { UserError } from "../../../common/api/main/UserError"

/**
 * Dialog for sharing files via link
 */
export class DriveFileShareDialog {
	constructor(
		private readonly driveFileSharingFacade: DriveFileSharingFacade,
		private readonly logins: LoginController,
	) {}

	async show(item: FileFolderItem) {
		let file = item.file
		let shareInfo: DriveShareInfo
		if (isNull(file.share)) {
			const createdShare = await showProgressDialog(
				lang.getTranslation("creatingShare_msg"),
				this.driveFileSharingFacade.createShareLink(file, null, null),
			)
			;({ file, shareInfo } = createdShare)
		} else {
			shareInfo = await showProgressDialog("loading_msg", this.driveFileSharingFacade.getShareInfoForManagement(file))
		}

		showFileShareDialog(this.driveFileSharingFacade, this.logins, file, shareInfo)
	}
}

async function showFileShareDialog(driveFileSharingFacade: DriveFileSharingFacade, logins: LoginController, file: DriveFile, shareInfo: DriveShareInfo) {
	// reload file in case we just created the share
	const dialog = new Dialog(
		DialogType.EditMedium,
		class DriveFileShareDialog implements Component {
			private doPassword: boolean = isNotNull(shareInfo.password)
			private doExpiry: boolean = isNotNull(shareInfo.share.expirationDate)
			private passwordValue: string = shareInfo.password ?? ""
			private expirationDate: Date | null = shareInfo.share.expirationDate ?? null

			async reloadShare() {
				shareInfo = await driveFileSharingFacade.getShareInfoForManagement(file, CacheMode.WriteOnly)
				m.redraw()
			}
			async updateShareAndReload(password: string | null, expirationDate: Date | null): Promise<void> {
				await driveFileSharingFacade.updateShare(shareInfo.share, password, expirationDate)
				await this.reloadShare()
			}
			async deleteAction() {
				dialog.close()
				await showProgressDialog("progressDeleting_msg", driveFileSharingFacade.deleteShareLink(file))
				const message = lang.getTranslation("shareDeleted_msg", { "{fileName}": file.name })
				showSnackBar({ message })
			}
			updateAction() {
				if (this.doPassword && this.passwordValue.trim() === "") {
					throw new UserError(lang.getTranslation("invalidPassword_msg"))
				}
				if (this.doExpiry && isNull(this.expirationDate)) {
					throw new UserError(lang.getTranslation("expirationDateEmpty_msg"))
				}
				if (this.doExpiry && assertNotNull(this.expirationDate).getTime() < new Date().getTime()) {
					throw new UserError(lang.getTranslation("expirationDateInPast_msg"))
				}

				showProgressDialog(
					lang.getTranslation("updatingShare_msg"),
					this.updateShareAndReload(this.doPassword ? this.passwordValue : null, this.doExpiry ? this.expirationDate : null),
				)
			}

			view(): Children {
				return m(".flex.col.height-100p", [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => dialog.close(), type: ButtonType.Secondary }],
						middle: "share_action",
					}),
					// min-height-0 so that it can shrink to its parent's size and not just overflow it
					m(".flex.col.mlr-16.mt-16.mb-16.min-height-0", [
						// the content between the header and the buttons scrolls
						m(".flex.col.overflow-y-scroll", [
							m(".flex.gap-12", [
								m(Icon, {
									icon: Icons.PersonAddFilled,
									size: IconSize.PX24,
									style: {
										fill: theme.on_surface_variant,
									},
								}),
								m(".b.uppercase.text-ellipsis", { "data-testid": "test:fileShareDetailsLabel" }, file.name),
							]),
							m(".flex.col.gap-16", [
								m(".flex.gap-8.items-center", [
									m(TextField, {
										label: lang.getTranslation("shareALink_label"),
										value: shareInfo.publicLink,
										onfocus: (_, input) => {
											input.select()
										},
									}),
									m(IconButton, {
										// compensate for label spacing on text field
										style: { marginTop: px(size.spacing_12) },
										icon: Icons.CopyOutline,
										label: "copy_action",
										click: async () => {
											await copyToClipboard(shareInfo.publicLink)
											showInfoSnackbar("copied_msg")
										},
									}),
								]),
								m(
									".flex.col.gap-8",
									m(
										Switch,
										{
											checked: this.doPassword,
											ariaLabel: lang.getTranslationText("secureWithPassword_label"),
											onclick: (toggled) => {
												this.doPassword = toggled
											},
											togglePillPosition: "left",
										},
										lang.getTranslationText("secureWithPassword_label"),
									),
									m(PasswordFieldNew, {
										class: inputFieldClasses(this.doPassword).join(" "),
										value: this.passwordValue,
										disabled: !this.doPassword,
										oninput: (passwordValue) => (this.passwordValue = passwordValue),
									}),
								),

								m(
									".flex.col.gap-8",
									m(
										Switch,
										{
											checked: this.doExpiry,
											ariaLabel: lang.getTranslationText("setExpirationDate_label"),
											onclick: (toggled) => (this.doExpiry = toggled),
											togglePillPosition: "left",
										},
										lang.getTranslationText("setExpirationDate_label"),
									),
									m(ExpirationDatePicker, {
										enabled: this.doExpiry,
										startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot),
										expirationDate: this.expirationDate,
										onDateSelected: (date) => {
											this.expirationDate = normalizeShareExpirationDate(date)
										},
									}),
								),
							]),
						]),
						m(ButtonRow, {
							deleteAction: () => this.deleteAction(),
							updateAction: () => this.updateAction(),
						}),
					]),
				])
			}
		},
	)
	dialog.show()
}

const ButtonRow = pureComponent(({ deleteAction, updateAction }: { deleteAction: ClickHandler; updateAction: ClickHandler }) =>
	m(
		".flex.gap-16.justify-between.flex-grow.pt-16",
		{
			class: Styles.get().isMobileLayout() ? "col" : "row",
		},
		[
			m(SecondaryButton, {
				width: "flex",
				label: lang.getTranslation("deleteLink_action"),
				onclick: (e, dom) => deleteAction(e, dom),
			}),
			m(PrimaryButton, {
				class: Styles.get().isMobileLayout() ? "" : "align-self-end",
				width: "flex",
				label: lang.getTranslation("updateLink_action"),
				onclick: (e, dom) => updateAction(e, dom),
			}),
		],
	),
)
const ExpirationDatePicker = pureComponent(
	({
		expirationDate,
		onDateSelected,
		startOfTheWeekOffset,
		enabled,
	}: {
		expirationDate: Date | null
		enabled: boolean
		startOfTheWeekOffset: number
		onDateSelected: (date: Date) => unknown
	}) =>
		m(LazyComponent<DatePickerAttrs, DatePicker>, {
			loader: async () => (await import("../../../calendar-app/calendar/gui/pickers/DatePicker")).DatePicker,
			attrs: {
				classes: inputFieldClasses(enabled),
				date: expirationDate,
				label: lang.getTranslation("selectExpiryDate_label"),
				onDateSelected: (selectedDate) => {
					onDateSelected(selectedDate)
				},
				startOfTheWeekOffset: startOfTheWeekOffset,
				disabled: !enabled,
				// so that we don't get NBSP with floating label above if there's no date
				nullSelectionText: lang.makeTranslation("", ""),
				renderCustomTextField: ({ disabled, focused, onblur, oncreateTextField, onfocus, oninput, onkeydown, value, label }) =>
					m(TextField, {
						class: "",
						disabled,
						onblur,
						oninput() {
							oninput({} as InputEvent)
						},
						onfocus() {
							onfocus({} as FocusEvent)
						},
						keyHandler: (key) => {
							onkeydown(keyboardEventFrom(key))
							return true
						},
						value,
						label,
						onDomInputCreated: (_, vnode) => {
							oncreateTextField(vnode)
						},
						leadingIcon: {
							icon: Icons.CalendarFilled,
							color: theme.on_surface_variant,
						},
					}),
			},
		}),
)

function inputFieldClasses(fieldIsActive: boolean): string[] {
	const classes: string[] = []
	if (!fieldIsActive) classes.push("translucent")
	classes.push(Styles.get().isMobileLayout() ? "full-width" : "three-quarter-width")
	return classes
}
