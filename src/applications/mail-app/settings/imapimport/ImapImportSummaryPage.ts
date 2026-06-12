import { assertMainOrNode } from "@tutao/app-env"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { ImapImportController } from "./ImapImportController"
import { ImapImportData } from "./AddImapImportWizard"
import { mailLocator } from "../../mailLocator"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { assertNotNull, noOp } from "../../../../platform-kit/utils/Utils"
import { Card } from "../../../../ui/base/Card"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { IconButton } from "../../../../ui/base/IconButton"
import { Icons } from "../../../../ui/base/icons/Icons"
import { ImapMailbox } from "@tutao/native-bridge/generatedIpc/types"
import { createImapAccount, createManageLabelServiceLabelData, MailSet } from "@tutao/entities/tutanota"
import { TextField } from "../../../../ui/base/TextField"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { theme } from "../../../../ui/theme"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../ui/base/DropDownSelectorNew"
import { getFolderName } from "../../mail/model/MailUtils"
import { getFolderIconByType } from "../../mail/view/MailGuiUtils"
import { ImapAccountSyncStatus, MailSetKind } from "../../../../entities/tutanota/Utils"
import { elementIdPart, getElementId } from "@tutao/meta"
import { showEditFolderDialog } from "../../mail/view/EditFolderDialog"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { showImapEditLabelDialog } from "../../mail/view/EditLabelDialog"
import {
	DEFAULT_IMAP_IMPORT_MAX_QUOTA,
	tokenEndpointResponseToOAuthTokenEndpointResponse,
} from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImportResult, InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter"
import { ImapErrorCause } from "../../../common/api/common/error/ImapError"
import { Dialog } from "../../../../ui/base/Dialog"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { isValidCSSHexColor } from "../../../../ui/base/Color"
import { ColorOptionButton } from "../../../../ui/base/colorPicker/ColorOptionButton"

assertMainOrNode()

class ImapImportSummaryPage implements WizardPageN<ImapImportData> {
	private controller: ImapImportController | null = null
	private enableParentFolderEdit: boolean = false
	private enableFolderMappingEdit: boolean = false

	oncreate(vnode: VnodeDOM<WizardPageAttrs<ImapImportData>>) {}

	async oninit() {
		this.controller = await mailLocator.imapImportController()
		m.redraw()
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		const data = vnode.attrs.data

		return m(".mt-24", { style: { maxHeight: "65vh" } }, [
			this.renderExportInformation(data),
			this.renderImportInformation(data),
			data.matchImapMailboxesToTutaMailSets ? this.renderFolderMapping(data) : null,
			this.renderContinueButton(data),
		])
	}

	private renderContinueButton(data: ImapImportData) {
		const isLabelCorrectlySet =
			!data.addLabelToImportedMails ||
			(data.imapSyncLabelData !== null && data.imapSyncLabelData.name !== "" && isValidCSSHexColor(data.imapSyncLabelData.color))
		const isParentFolderCorrectlySet = data.rootImportMailFolderName !== "" || data.matchImapMailboxesToTutaMailSets
		const isInEditMode = this.enableParentFolderEdit || this.enableFolderMappingEdit
		const shouldAllowContinuing = isLabelCorrectlySet && isParentFolderCorrectlySet && !isInEditMode

		return m(
			".flex-end.full-width.pt-32.mb-32",
			m(
				"",
				{
					style: {
						width: "260px",
					},
				},
				m(PrimaryButton, {
					label: "startImapImport_action",
					class: "wizard-next-button",
					onclick: (_, dom) => {
						emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
					},
					disabled: !shouldAllowContinuing,
				}),
			),
		)
	}

	private renderFolderMapping(data: ImapImportData) {
		const imapMailboxToTutaFolderRows = data.imapMailboxes.map((imapMailbox) => {
			const tutaMailSetElementId = assertNotNull(data.imapMailboxesToTutaMailSets?.get(imapMailbox.path))
			const tutaMailSet = assertNotNull(data.folderSystem.getFolderById(tutaMailSetElementId))
			return { imapMailbox, tutaMailSet }
		})

		return m(Card, { classes: this.enableFolderMappingEdit ? ["mt-16", "alternate-background"] : ["mt-16", "surface-background"] }, [
			m(".flex.justify-between.items-center", [
				m(MenuTitle, { content: lang.getTranslationText("imapSyncFolderMapping_title") }),
				this.enableFolderMappingEdit
					? m(
							"",
							{
								style: {
									minWidth: "100px",
								},
							},
							m(PrimaryButton, {
								label: "imapSyncFolderMappingEditConfirmButton_label",
								onclick: () => {
									this.enableFolderMappingEdit = false
								},
							}),
						)
					: m(IconButton, {
							title: "imapSyncFolderMapping_title",
							icon: Icons.PenFilled,
							click: () => {
								this.enableFolderMappingEdit = !this.enableFolderMappingEdit
							},
						}),
			]),
			this.enableFolderMappingEdit
				? this.renderFolderMappingEditMode(imapMailboxToTutaFolderRows, data)
				: this.renderFolderMappingReadonlyMode(imapMailboxToTutaFolderRows),
		])
	}

	private renderFolderMappingEditMode(
		imapMailboxToTutaFolderRows: {
			imapMailbox: ImapMailbox
			tutaMailSet: MailSet | null
		}[],
		data: ImapImportData,
	) {
		return m(
			"",
			imapMailboxToTutaFolderRows.map((mailboxToRow) => {
				return m(".flex.gap-8.items-center.mt-8", [
					m(TextField, {
						class: "m-0",
						value: mailboxToRow.imapMailbox.name ?? "",
						isReadOnly: true,
					}),
					m(Icon, {
						icon: Icons.SimpleArrowRight,
						size: IconSize.PX24,
						class: "pr-4 flex items-center",
						style: {
							fill: theme.on_surface,
						},
					}),
					m(DropDownSelectorNew, {
						selectedValue: mailboxToRow.tutaMailSet,
						selectedValueDisplay: mailboxToRow.tutaMailSet
							? getFolderName(mailboxToRow.tutaMailSet)
							: lang.getTranslationText("imapChooseFolder_msg"),
						items: data.folderSystem.getIndentedList(null).map((indentedFolder) => ({
							name: getFolderName(indentedFolder.folder),
							value: indentedFolder.folder,
						})),
						style: mailboxToRow.tutaMailSet
							? {}
							: {
									background: theme.warning_container,
									color: theme.on_warning_container,
								},
						icon: {
							icon: !mailboxToRow.tutaMailSet ? Icons.FolderFilled : getFolderIconByType(mailboxToRow.tutaMailSet.folderType as MailSetKind),
							color: theme.on_surface_variant,
						},
						selectionChangedHandler: (selectedMailSet) => {
							data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, getElementId(selectedMailSet))
						},
					} satisfies DropDownSelectorNewAttrs<MailSet>),
					m(IconButton, {
						icon: Icons.Plus,
						title: "selectMultiple_action",
						click: async () => {
							if (this.controller) {
								let newFolderElementId: Id | null = null
								await showEditFolderDialog(
									assertNotNull(this.controller.selectedMailBoxDetail),
									null,
									null,
									mailboxToRow.imapMailbox.name,
									async (folderId) => {
										newFolderElementId = elementIdPart(folderId)
										data.folderSystem = await assertNotNull(this.controller).getFolderSystemForSelectedMailbox()
										if (newFolderElementId !== null) {
											data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, newFolderElementId)
										}
									},
								)
							}
						},
					}),
				])
			}),
		)
	}

	private renderFolderMappingReadonlyMode(
		imapMailboxToTutaFolderRows: {
			imapMailbox: ImapMailbox
			tutaMailSet: MailSet
		}[],
	) {
		return m(
			"",
			imapMailboxToTutaFolderRows.map((mailboxToRow) => {
				return m(".flex.gap-8.items-center.mt-8", [
					m(TextField, {
						class: "surface-background",
						value: mailboxToRow.imapMailbox.name ?? "",
						isReadOnly: true,
					}),
					m(Icon, {
						icon: Icons.SimpleArrowRight,
						size: IconSize.PX24,
						class: "pr-4 flex items-center",
						style: {
							fill: theme.on_surface,
						},
					}),
					m(TextField, {
						value: getFolderName(mailboxToRow.tutaMailSet),
						isReadOnly: true,
						class: "surface-background",
						leadingIcon: {
							icon: getFolderIconByType(mailboxToRow.tutaMailSet.folderType as MailSetKind),
							color: theme.on_surface_variant,
						},
					}),
				])
			}),
		)
	}

	private renderExportInformation(data: ImapImportData) {
		return m(Card, { classes: ["mt-16"] }, [
			m(MenuTitle, { content: lang.getTranslationText("imapImportSummaryExportInformation_label") }),
			m(TextField, {
				label: "imapImportSummaryAccount_label",
				value: data.imapAccountUsername,
				isReadOnly: true,
				class: "surface-background mt-16",
				leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
			}),
			m(".flex", [
				m(TextField, {
					label: "imapImportSummaryHost_label",
					value: data.imapAccountHost,
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.ServerFilled, color: theme.on_surface_variant },
				}),
				m(TextField, {
					label: "imapAccountPort_label",
					value: data.imapAccountPort.toString(),
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.KeyFilled, color: theme.on_surface_variant },
				}),
			]),
		])
	}

	private renderImportInformation(data: ImapImportData) {
		return this.controller && this.controller.selectedMailBoxDetail
			? m(Card, { classes: ["mt-16"] }, [
					m(MenuTitle, { content: lang.getTranslationText("imapImportSummaryImportInformation_label") }),

					data.matchImapMailboxesToTutaMailSets
						? m(".flex.mt-16", [this.renderMailboxSummary(), this.renderLabel(data)])
						: m(".mt-16", [this.renderMailboxSummary(), m(".flex", [this.renderParentFolderSummary(data), this.renderLabel(data)])]),
				])
			: null
	}
	private renderMailboxSummary() {
		return this.controller && this.controller.selectedMailBoxDetail
			? m(TextField, {
					label: "mailbox_label",
					value: getMailboxName(mailLocator.logins, this.controller.selectedMailBoxDetail),
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
				})
			: null
	}

	private renderParentFolderSummary(data: ImapImportData) {
		return this.controller && this.controller.selectedMailBoxDetail
			? m(TextField, {
					label: "imapImportSummaryParentFolder_label",
					value: data.rootImportMailFolderName,
					isReadOnly: !this.enableParentFolderEdit,
					oninput: (value) => (data.rootImportMailFolderName = value),
					class: this.enableParentFolderEdit ? "" : "surface-background",
					leadingIcon: { icon: Icons.FolderFilled, color: theme.on_surface_variant },
					injectionsRight: () => {
						return m(IconButton, {
							title: "editFolder_action",
							icon: Icons.PenFilled,
							click: () => {
								this.enableParentFolderEdit = !this.enableParentFolderEdit
							},
						})
					},
				})
			: null
	}

	private renderLabel(data: ImapImportData) {
		return m(TextField, {
			label: "label_label",
			value: data.imapSyncLabelData?.name ?? "-",
			isReadOnly: true,
			class: "surface-background",
			leadingIcon: { icon: Icons.LabelFilled, color: theme.on_surface_variant },
			injectionsRight: () => {
				return m(".flex.items-center", [
					data.imapSyncLabelData
						? m(ColorOptionButton, {
								color: data.imapSyncLabelData.color,
								onClick: noOp,
							})
						: null,
					data.imapSyncLabelData
						? m(IconButton, {
								title: "delete_action",
								icon: Icons.TrashFilled,
								click: () => {
									data.imapSyncLabelData = null
								},
							})
						: null,
					m(IconButton, {
						title: "editLabel_action",
						icon: Icons.PenFilled,
						click: () => {
							if (!data.imapSyncLabelData) {
								data.imapSyncLabelData = createManageLabelServiceLabelData({ name: "", color: "" })
								data.addLabelToImportedMails = true
							}
							const labelData = data.imapSyncLabelData
							showImapEditLabelDialog(
								labelData,
								(value) => {
									if (labelData) {
										labelData.name = value
									} else {
										data.imapSyncLabelData = createManageLabelServiceLabelData({
											name: value,
											color: "",
										})
									}
								},
								(newColor: string) => {
									labelData.color = newColor
								},
							)
						},
					}),
				])
			},
		})
	}
}

export default ImapImportSummaryPage

export class ImapImportSummaryPageAttrs implements WizardPageAttrs<ImapImportData> {
	data: ImapImportData

	constructor(imapImportData: ImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): TranslationKey {
		return "imapImportSetup_title"
	}

	hideAllPagingButtons = true
	hidePagingButtonForPage = true

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		const imapImportController = await mailLocator.imapImportController()
		const imapAccount = createImapAccount({
			host: this.data.imapAccountHost,
			port: this.data.imapAccountPort.toString(),
			username: this.data.imapAccountUsername,
			password: this.data.imapAccountPassword,
			oAuthTokenEndpointResponse:
				this.data.imapAccountOAuthToken !== undefined ? tokenEndpointResponseToOAuthTokenEndpointResponse(this.data.imapAccountOAuthToken) : null,
		})
		const commonImapImportParams = {
			maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
			mailGroupId: imapImportController.selectedMailBoxDetail!.mailGroup._id,
			imapSyncLabelData: this.data.imapSyncLabelData,
			provider: this.data.imapProvider,
		}
		const initializeImapImportParams: InitializeImapImportParams = this.data.matchImapMailboxesToTutaMailSets
			? {
					imapAccount,
					...commonImapImportParams,

					matchImapMailboxesToTutaMailSets: true,
					imapMailboxesToTutaMailSets: assertNotNull(this.data.imapMailboxesToTutaMailSets),
				}
			: {
					imapAccount,
					...commonImapImportParams,

					matchImapMailboxesToTutaMailSets: false,
					rootImportMailFolderName: this.data.rootImportMailFolderName,
				}

		const initializeResult = await initializeAndContinueImapImport(imapImportController, initializeImapImportParams)
		if (initializeResult.error) {
			if (initializeResult.error.cause === ImapErrorCause.AUTH_FAILED_REFRESH_TOKEN) {
				Dialog.message("imapImportAuthFailed_msg" as TranslationKey).then(() => false)
				return Promise.resolve(false)
			}

			return showErrorDialog ? Dialog.message("imapImportAuthFailed_msg" as TranslationKey).then(() => false) : Promise.resolve(false)
		} else if (initializeResult.ok) {
			this.data.imapAccountSyncStatus = initializeResult.ok.state.status

			if (this.data.imapAccountSyncStatus === ImapAccountSyncStatus.POSTPONED) {
				let postponedErrorMsg = "imapImportStartedPostponed_msg" as TranslationKey
				return showErrorDialog ? Dialog.message(postponedErrorMsg).then(() => true) : Promise.resolve(true)
			}
		}

		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}

async function initializeAndContinueImapImport(
	imapImportController: ImapImportController,
	initializeImportParams: InitializeImapImportParams,
): Promise<ImportResult> {
	return await showProgressDialog(
		"startingImapImport_msg",
		imapImportController
			.initializeImport(initializeImportParams)
			.then(async (session) => await imapImportController.continueImport(assertNotNull(session.imapAccountSyncState._id))),
	)
}
