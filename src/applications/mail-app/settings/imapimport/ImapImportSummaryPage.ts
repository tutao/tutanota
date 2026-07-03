import { assertMainOrNode } from "@tutao/app-env"
import m, { Children, Vnode } from "mithril"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { ImapMailImportController } from "./ImapMailImportController"
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
import { elementIdPart, GENERATED_MIN_ID, getElementId } from "@tutao/meta"
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
import { ImapMailboxSpecialUse } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { getTranslationForImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"

assertMainOrNode()

class ImapImportSummaryPage implements WizardPageN<ImapImportData> {
	private enableParentFolderEdit: boolean = false
	private enableFolderMappingEdit: boolean = false

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
					label: "startMigration_action",
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
			const mailSetMapping = assertNotNull(data.imapMailboxesToTutaMailSets?.get(imapMailbox.path))
			const tutaMailSet = data.folderSystem.getFolderById(mailSetMapping.mailSetElementId)
			return { imapMailbox, tutaMailSet, shouldSync: mailSetMapping.shouldSync }
		})

		return m(Card, { classes: this.enableFolderMappingEdit ? ["mt-16", "alternate-background"] : ["mt-16", "surface-background"] }, [
			m(".flex.justify-between.items-center", [
				m(MenuTitle, { content: lang.getTranslationText("migrationFolderMapping_title") }),
				this.enableFolderMappingEdit
					? m(
							"",
							{
								style: {
									minWidth: "100px",
								},
							},
							m(PrimaryButton, {
								label: "migrationFolderMappingEditConfirmButton_label",
								onclick: () => {
									this.enableFolderMappingEdit = false
								},
							}),
						)
					: m(IconButton, {
							title: "migrationFolderMapping_title",
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
			shouldSync: boolean
		}[],
		data: ImapImportData,
	) {
		return m(
			"",
			imapMailboxToTutaFolderRows.map((mailboxToRow) => {
				const isHamFolder = mailboxToRow.imapMailbox.specialUse !== ImapMailboxSpecialUse.JUNK
				return m(".flex.gap-8.items-center.mt-8", [
					mailboxToRow.shouldSync
						? m(IconButton, {
								icon: Icons.CheckboxChecked,
								title: "disableMigrationSyncForFolder_action",
								click: async () => {
									const mappedMailSet = data.imapMailboxesToTutaMailSets?.get(mailboxToRow.imapMailbox.path)
									if (mappedMailSet) {
										mappedMailSet.shouldSync = false
									} else {
										data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, {
											mailSetElementId: GENERATED_MIN_ID,
											shouldSync: false,
										})
									}
								},
							})
						: m(IconButton, {
								icon: Icons.CheckboxEmpty,
								title: "enableMigrationSyncForFolder_action",
								click: async () => {
									const mappedMailSet = assertNotNull(data.imapMailboxesToTutaMailSets?.get(mailboxToRow.imapMailbox.path))
									mappedMailSet.shouldSync = true
								},
							}),
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
						selectedValueDisplay: mailboxToRow.shouldSync
							? mailboxToRow.tutaMailSet
								? getFolderName(mailboxToRow.tutaMailSet)
								: lang.getTranslationText("migrationChooseFolder_msg")
							: lang.getTranslationText("migrationNotImportedFolderName_msg"),
						items: data.folderSystem.getIndentedList(null).map((indentedFolder) => ({
							name: getFolderName(indentedFolder.folder),
							value: indentedFolder.folder,
						})),
						style:
							mailboxToRow.tutaMailSet || !mailboxToRow.shouldSync
								? {}
								: {
										background: theme.warning_container,
										color: theme.on_warning_container,
									},
						icon: {
							icon:
								!mailboxToRow.tutaMailSet || !mailboxToRow.shouldSync
									? Icons.FolderFilled
									: getFolderIconByType(mailboxToRow.tutaMailSet.folderType as MailSetKind),
							color: theme.on_surface_variant,
						},
						selectionChangedHandler: (selectedMailSet) => {
							const shouldSync = data.imapMailboxesToTutaMailSets?.get(mailboxToRow.imapMailbox.path)?.shouldSync ?? true
							data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, {
								mailSetElementId: getElementId(selectedMailSet),
								shouldSync,
							})
						},
						disabled: !mailboxToRow.shouldSync || !isHamFolder,
					} satisfies DropDownSelectorNewAttrs<MailSet>),
					m(IconButton, {
						icon: Icons.Plus,
						title: "migrationCreateFolder_action",
						click: async () => {
							let newFolderElementId: Id | null = null
							await showEditFolderDialog(
								assertNotNull(mailLocator.getImapImportController().selectedMailBoxDetail),
								null,
								null,
								mailboxToRow.imapMailbox.name,
								async (folderId) => {
									newFolderElementId = elementIdPart(folderId)
									data.folderSystem = await assertNotNull(mailLocator.getImapImportController()).getFolderSystemForSelectedMailbox()
									if (newFolderElementId !== null) {
										data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, {
											mailSetElementId: newFolderElementId,
											shouldSync: true,
										})
									}
								},
							)
						},
						disabled: !mailboxToRow.shouldSync || !isHamFolder,
					}),
				])
			}),
		)
	}

	private renderFolderMappingReadonlyMode(
		imapMailboxToTutaFolderRows: {
			imapMailbox: ImapMailbox
			tutaMailSet: MailSet | null
			shouldSync: boolean
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
						value:
							mailboxToRow.shouldSync && mailboxToRow.tutaMailSet
								? getFolderName(mailboxToRow.tutaMailSet)
								: lang.getTranslationText("migrationNotImportedFolderName_msg"),
						isReadOnly: true,
						class: "surface-background",
						leadingIcon: {
							icon: mailboxToRow.shouldSync
								? getFolderIconByType(assertNotNull(mailboxToRow.tutaMailSet).folderType as MailSetKind)
								: Icons.FolderFilled,
							color: theme.on_surface_variant,
						},
					}),
				])
			}),
		)
	}

	private renderExportInformation(data: ImapImportData) {
		return m(Card, { classes: ["mt-16"] }, [
			m(MenuTitle, { content: lang.getTranslationText("migrationSummarySourceInformation_label") }),
			m(TextField, {
				label: "migrationSummaryAccount_label",
				value: data.imapAccountUsername,
				isReadOnly: true,
				class: "surface-background mt-16",
				leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
			}),
			m(".flex", [
				m(TextField, {
					label: "migrationSummaryImapAccountHost_label",
					value: data.imapAccountHost,
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.ServerFilled, color: theme.on_surface_variant },
				}),
				m(TextField, {
					label: "migrationImapAccountPort_label",
					value: data.imapAccountPort.toString(),
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.KeyFilled, color: theme.on_surface_variant },
				}),
			]),
		])
	}

	private renderImportInformation(data: ImapImportData) {
		return mailLocator.getImapImportController().selectedMailBoxDetail
			? m(Card, { classes: ["mt-16"] }, [
					m(MenuTitle, { content: lang.getTranslationText("migrationSummaryImportInformation_label") }),

					data.matchImapMailboxesToTutaMailSets
						? m(".flex.mt-16", [this.renderMailboxSummary(), this.renderLabel(data)])
						: m(".mt-16", [this.renderMailboxSummary(), m(".flex", [this.renderParentFolderSummary(data), this.renderLabel(data)])]),
				])
			: null
	}
	private renderMailboxSummary() {
		const selectedMailboxDetail = mailLocator.getImapImportController().selectedMailBoxDetail
		return selectedMailboxDetail
			? m(TextField, {
					label: "mailbox_label",
					value: getMailboxName(mailLocator.logins, selectedMailboxDetail),
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
				})
			: null
	}

	private renderParentFolderSummary(data: ImapImportData) {
		return mailLocator.getImapImportController().selectedMailBoxDetail
			? m(TextField, {
					label: "migrationRootMailFolderName_label",
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
									data.addLabelToImportedMails = false
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
		return "migrationSetup_title"
	}

	hideAllPagingButtons = true
	hidePagingButtonForPage = true

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		if (this.data.folderSystem.getFolderByName(this.data.rootImportMailFolderName) !== null) {
			Dialog.message("migrationRootMailFolderNameAlreadyExists_helpLabel")
			return Promise.resolve(false)
		}
		const imapImportController = mailLocator.getImapImportController()
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
					spamFolderMigrationInformation: this.data.spamFolderMigrationInformation,
				}

		try {
			const initializeResult = await initializeAndContinueImapImport(imapImportController, initializeImapImportParams)

			this.data.imapAccountSyncStatus = initializeResult.state.status

			if (this.data.imapAccountSyncStatus === ImapAccountSyncStatus.POSTPONED) {
				let postponedErrorMsg = "migrationStartedPostponed_msg" as TranslationKey
				const postponedErrorMessageReplaced = lang.getTranslation(postponedErrorMsg, {
					"{provider}": lang.getTranslationText(getTranslationForImapProvider(this.data.imapProvider)),
				})
				return showErrorDialog ? Dialog.message(postponedErrorMessageReplaced).then(() => true) : Promise.resolve(true)
			}
		} catch (e) {
			if (e.data === ImapErrorCause.AUTH_FAILED) {
				Dialog.message("migrationAuthFailed_msg" as TranslationKey).then(() => false)
				return Promise.resolve(false)
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
	imapImportController: ImapMailImportController,
	initializeImportParams: InitializeImapImportParams,
): Promise<ImportResult> {
	return await showProgressDialog(
		"startingMigration_msg",
		imapImportController
			.initializeImport(initializeImportParams)
			.then(async (session) => await imapImportController.continueImport(assertNotNull(session.imapAccountSyncState._id))),
	)
}
