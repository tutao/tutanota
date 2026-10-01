import { EnvProvider } from "@tutao/app-env"
import m, { Children, Vnode } from "mithril"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { MailboxMigrationController } from "./MailboxMigrationController"
import { MigrationData } from "./AddMigrationWizard"
import { mailLocator } from "../../mailLocator"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { assertNotNull, noOp } from "../../../../platform-kit/utils/Utils"
import { Card } from "../../../../ui/base/Card"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { IconButton } from "../../../../ui/base/IconButton"
import { Icons } from "../../../../ui/base/icons/Icons"
import { createMailboxMigrationImapConfiguration, createManageLabelServiceLabelData, MailSet, MailSetTypeRef } from "@tutao/entities/tutanota"
import { TextField } from "../../../../ui/base/TextField"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { theme } from "../../../../ui/theme"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../ui/base/DropDownSelectorNew"
import { getMailSetName } from "../../mail/model/MailUtils"
import { getFolderIconByType } from "../../mail/view/MailGuiUtils"
import { MailboxMigrationSyncStatus, MailSetKind } from "../../../../entities/tutanota/Utils"
import { elementIdPart, elementIdToId, GENERATED_MIN_ID, getElementId } from "@tutao/meta"
import { showEditFolderDialog } from "../../mail/view/EditFolderDialog"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { showMigrationEditLabelDialog } from "../../mail/view/EditLabelDialog"
import { ImportResult, InitializeMigrationParams } from "../../workerUtils/migration/MailboxImporter"
import { MigrationErrorCause } from "../../../common/api/common/error/MigrationError"
import { Dialog } from "../../../../ui/base/Dialog"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { isValidCSSHexColor } from "../../../../ui/base/Color"
import { ColorOptionButton } from "../../../../ui/base/colorPicker/ColorOptionButton"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { getTranslationForMigrationProvider, MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { UserMigrationCredentialParams } from "@tutao/entities/sys"
import { tokenEndpointResponseToOAuthToken } from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"

EnvProvider.assertMainOrNode()

class MigrationSummaryPage implements WizardPageN<MigrationData> {
	private enableParentFolderEdit: boolean = false
	private enableFolderMappingEdit: boolean = false

	view(vnode: Vnode<WizardPageAttrs<MigrationData>>): Children {
		const data = vnode.attrs.data
		const isGmail = data.mailboxMigrationProvider === MailboxMigrationProvider.Gmail

		return m(".mt-24", { style: { maxHeight: "65vh" } }, [
			this.renderExportInformation(data),
			this.renderImportInformation(data),
			!isGmail && data.matchMigrationMailboxesToTutaMailSets ? this.renderFolderMapping(data) : null,
			this.renderContinueButton(data),
		])
	}

	private renderContinueButton(data: MigrationData) {
		const isLabelCorrectlySet =
			!data.addLabelToImportedMails ||
			(data.migrationSyncLabelData !== null && data.migrationSyncLabelData.name !== "" && isValidCSSHexColor(data.migrationSyncLabelData.color))
		const isParentFolderCorrectlySet = data.rootImportMailSetName !== "" || data.matchMigrationMailboxesToTutaMailSets
		const isInEditMode = this.enableParentFolderEdit || this.enableFolderMappingEdit
		const isGmail = data.mailboxMigrationProvider === MailboxMigrationProvider.Gmail
		const shouldAllowContinuing = (isGmail || isLabelCorrectlySet) && isParentFolderCorrectlySet && !isInEditMode

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

	private renderFolderMapping(data: MigrationData) {
		const migrationMailboxToTutaFolderRows = data.migrationMailboxes.map((migrationMailbox) => {
			const mailSetMapping = assertNotNull(data.migrationMailboxesToTutaMailSets?.get(migrationMailbox.path))
			const tutaMailSet = data.folderSystem.getFolderById(mailSetMapping.mailSetElementId)
			return { migrationMailbox, tutaMailSet, shouldSync: mailSetMapping.shouldSync }
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
							label: "migrationFolderMapping_title",
							icon: Icons.PenFilled,
							click: () => {
								this.enableFolderMappingEdit = !this.enableFolderMappingEdit
							},
						}),
			]),
			this.enableFolderMappingEdit
				? this.renderFolderMappingEditMode(migrationMailboxToTutaFolderRows, data)
				: this.renderFolderMappingReadonlyMode(migrationMailboxToTutaFolderRows),
		])
	}

	private renderFolderMappingEditMode(
		migrationMailboxToTutaFolderRows: {
			migrationMailbox: MigrationMailbox
			tutaMailSet: MailSet | null
			shouldSync: boolean
		}[],
		data: MigrationData,
	) {
		return m(
			"",
			migrationMailboxToTutaFolderRows.map((mailboxToRow) => {
				const isHamFolder = mailboxToRow.migrationMailbox.specialUse !== MigrationMailboxSpecialUse.JUNK
				return m(".flex.gap-8.items-center.mt-8", [
					mailboxToRow.shouldSync
						? m(IconButton, {
								icon: Icons.CheckboxChecked,
								label: "disableMigrationSyncForFolder_action",
								click: async () => {
									const mappedMailSet = data.migrationMailboxesToTutaMailSets?.get(mailboxToRow.migrationMailbox.path)
									if (mappedMailSet) {
										mappedMailSet.shouldSync = false
									} else {
										data.migrationMailboxesToTutaMailSets?.set(mailboxToRow.migrationMailbox.path, {
											mailSetElementId: GENERATED_MIN_ID,
											shouldSync: false,
											specialUse: mailboxToRow.migrationMailbox.specialUse ?? null,
										})
									}
								},
							})
						: m(IconButton, {
								icon: Icons.CheckboxEmpty,
								label: "enableMigrationSyncForFolder_action",
								click: async () => {
									const mappedMailSet = assertNotNull(data.migrationMailboxesToTutaMailSets?.get(mailboxToRow.migrationMailbox.path))
									mappedMailSet.shouldSync = true
								},
							}),
					m(TextField, {
						class: "m-0",
						value: mailboxToRow.migrationMailbox.name ?? "",
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
								? getMailSetName(mailboxToRow.tutaMailSet)
								: lang.getTranslationText("migrationChooseFolder_msg")
							: lang.getTranslationText("migrationNotImportedFolderName_msg"),
						items: data.folderSystem.getIndentedList(null).map((indentedFolder) => ({
							name: getMailSetName(indentedFolder.mailSet),
							value: indentedFolder.mailSet,
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
							const shouldSync = data.migrationMailboxesToTutaMailSets?.get(mailboxToRow.migrationMailbox.path)?.shouldSync ?? true
							data.migrationMailboxesToTutaMailSets?.set(mailboxToRow.migrationMailbox.path, {
								mailSetElementId: getElementId(selectedMailSet),
								shouldSync,
								specialUse: mailboxToRow.migrationMailbox.specialUse ?? null,
							})
						},
						disabled: !mailboxToRow.shouldSync || !isHamFolder,
					} satisfies DropDownSelectorNewAttrs<MailSet>),
					m(IconButton, {
						icon: Icons.Plus,
						label: "migrationCreateFolder_action",
						click: async () => {
							let newFolderElementId: Id | null = null
							await showEditFolderDialog(
								assertNotNull(mailLocator.getMailboxMigrationController().selectedMailBoxDetail),
								null,
								null,
								mailboxToRow.migrationMailbox.name,
								async (folderId) => {
									newFolderElementId = elementIdPart(folderId)
									const newFolder = await mailLocator.entityClient.load(MailSetTypeRef, folderId)
									data.newlyCreatedFolders.add(newFolder)
									const mailSets = await mailLocator.entityClient.loadAll(
										MailSetTypeRef,
										assertNotNull(mailLocator.getMailboxMigrationController().selectedMailBoxDetail).mailbox.mailSets.mailSets,
									)
									data.folderSystem = new FolderSystem(mailSets)
									if (newFolderElementId !== null) {
										data.migrationMailboxesToTutaMailSets?.set(mailboxToRow.migrationMailbox.path, {
											mailSetElementId: newFolderElementId,
											shouldSync: true,
											specialUse: mailboxToRow.migrationMailbox.specialUse ?? null,
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
		migrationMailboxToTutaFolderRows: {
			migrationMailbox: MigrationMailbox
			tutaMailSet: MailSet | null
			shouldSync: boolean
		}[],
	) {
		return m(
			"",
			migrationMailboxToTutaFolderRows.map((mailboxToRow) => {
				return m(".flex.gap-8.items-center.mt-8", [
					m(TextField, {
						class: "surface-background",
						value: mailboxToRow.migrationMailbox.name ?? "",
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
								? getMailSetName(mailboxToRow.tutaMailSet)
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

	private renderExportInformation(data: MigrationData) {
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

	private renderImportInformation(data: MigrationData) {
		return mailLocator.getMailboxMigrationController().selectedMailBoxDetail
			? m(Card, { classes: ["mt-16"] }, [
					m(MenuTitle, { content: lang.getTranslationText("migrationSummaryImportInformation_label") }),

					data.matchMigrationMailboxesToTutaMailSets
						? m(".flex.mt-16", [this.renderMailboxSummary(), this.renderLabel(data)])
						: m(".mt-16", [this.renderMailboxSummary(), m(".flex", [this.renderParentFolderSummary(data), this.renderLabel(data)])]),
				])
			: null
	}
	private renderMailboxSummary() {
		const selectedMailboxDetail = mailLocator.getMailboxMigrationController().selectedMailBoxDetail
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

	private renderParentFolderSummary(data: MigrationData) {
		return mailLocator.getMailboxMigrationController().selectedMailBoxDetail
			? m(TextField, {
					label: "migrationRootMailFolderName_label",
					value: data.rootImportMailSetName,
					isReadOnly: !this.enableParentFolderEdit,
					oninput: (value) => (data.rootImportMailSetName = value),
					class: this.enableParentFolderEdit ? "" : "surface-background",
					leadingIcon: { icon: Icons.FolderFilled, color: theme.on_surface_variant },
					injectionsRight: () => {
						return m(IconButton, {
							label: "editFolder_action",
							icon: Icons.PenFilled,
							click: () => {
								this.enableParentFolderEdit = !this.enableParentFolderEdit
							},
						})
					},
				})
			: null
	}

	private renderLabel(data: MigrationData) {
		return data.mailboxMigrationProvider !== MailboxMigrationProvider.Gmail
			? m(TextField, {
					label: "label_label",
					value: data.migrationSyncLabelData?.name ?? "-",
					isReadOnly: true,
					class: "surface-background",
					leadingIcon: { icon: Icons.LabelFilled, color: theme.on_surface_variant },
					injectionsRight: () => {
						return m(".flex.items-center", [
							data.migrationSyncLabelData
								? m(ColorOptionButton, {
										color: data.migrationSyncLabelData.color,
										onClick: noOp,
									})
								: null,
							data.migrationSyncLabelData
								? m(IconButton, {
										label: "delete_action",
										icon: Icons.TrashFilled,
										click: () => {
											data.migrationSyncLabelData = null
											data.addLabelToImportedMails = false
										},
									})
								: null,
							m(IconButton, {
								label: "editLabel_action",
								icon: Icons.PenFilled,
								click: () => {
									if (!data.migrationSyncLabelData) {
										data.migrationSyncLabelData = createManageLabelServiceLabelData({ name: "", color: "", parentLabel: null })
										data.addLabelToImportedMails = true
									}
									const labelData = data.migrationSyncLabelData
									showMigrationEditLabelDialog(
										labelData,
										(value) => {
											if (labelData) {
												labelData.name = value
											} else {
												data.migrationSyncLabelData = createManageLabelServiceLabelData({
													name: value,
													color: "",
													parentLabel: null,
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
			: null
	}
}

export default MigrationSummaryPage

export class MigrationSummaryPageAttrs implements WizardPageAttrs<MigrationData> {
	data: MigrationData

	constructor(migrationData: MigrationData) {
		this.data = migrationData
	}

	headerTitle(): TranslationKey {
		return "migrationSetup_title"
	}

	hideAllPagingButtons = true
	hidePagingButtonForPage = true

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		if (this.data.folderSystem.getFolderByName(this.data.rootImportMailSetName) !== null) {
			Dialog.message("migrationRootMailFolderNameAlreadyExists_helpLabel")
			return Promise.resolve(false)
		}
		const mailboxMigrationController = mailLocator.getMailboxMigrationController()
		const mailboxMigrationImapConfiguration = createMailboxMigrationImapConfiguration({
			host: this.data.imapAccountHost,
			port: this.data.imapAccountPort.toString(),
			sharedUsername: null,
			sharedPassword: null,
			sharedOauthToken: null,
			customCertificateData: this.data.customCertificateData,
			ignoreCertificateErrors: this.data.ignoreCertificateErrors,
			useSSL: this.data.useSSL,
		})

		const userMigrationParams: UserMigrationCredentialParams = {
			username: this.data.imapAccountUsername,
			password: this.data.imapAccountPassword ?? null,
			oAuthToken: this.data.migrationAccountOAuthToken ? tokenEndpointResponseToOAuthToken(this.data.migrationAccountOAuthToken) : null,
		}

		const commonMigrationParams = {
			mailGroupId: elementIdToId(mailboxMigrationController.selectedMailBoxDetail!.mailGroup._id),
			migrationSyncLabelData: this.data.migrationSyncLabelData,
			provider: this.data.mailboxMigrationProvider,
		}
		const initializeMigrationParams: InitializeMigrationParams = this.data.matchMigrationMailboxesToTutaMailSets
			? {
					imapConfiguration: mailboxMigrationImapConfiguration,
					credential: userMigrationParams,
					...commonMigrationParams,

					matchMigrationMailboxesToTutaMailSets: true,
					migrationMailboxesToTutaMailSets: assertNotNull(this.data.migrationMailboxesToTutaMailSets),
				}
			: {
					imapConfiguration: mailboxMigrationImapConfiguration,
					credential: userMigrationParams,
					...commonMigrationParams,
					matchMigrationMailboxesToTutaMailSets: false,
					rootImportMailSetName: this.data.rootImportMailSetName,
					spamFolderMigrationInformation: this.data.spamFolderMigrationInformation,
				}

		try {
			const initializeResult = await initializeAndContinueMigration(mailboxMigrationController, initializeMigrationParams)

			this.data.mailboxMigrationSyncStatus = initializeResult.state.status

			if (this.data.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.POSTPONED) {
				let postponedErrorMsg = "migrationStartedPostponed_msg" as TranslationKey
				const postponedErrorMessageReplaced = lang.getTranslation(postponedErrorMsg, {
					"{provider}": lang.getTranslationText(getTranslationForMigrationProvider(this.data.mailboxMigrationProvider)),
				})
				return showErrorDialog ? Dialog.message(postponedErrorMessageReplaced).then(() => true) : Promise.resolve(true)
			}
		} catch (e) {
			if (e.data?.cause === MigrationErrorCause.AUTH_FAILED) {
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

async function initializeAndContinueMigration(
	mailboxMigrationController: MailboxMigrationController,
	initializeImportParams: InitializeMigrationParams,
): Promise<ImportResult> {
	return await showProgressDialog(
		"startingMigration_msg",
		mailboxMigrationController
			.initializeImport(initializeImportParams)
			.then(async (session) => await mailboxMigrationController.continueImport(assertNotNull(session.mailboxMigrationSyncState._id))),
	)
}
