import { assertMainOrNode } from "@tutao/app-env"
import m, { Children, Vnode } from "mithril"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { ImapImportData } from "./AddImapImportWizard"
import { ImapMailboxSpecialUse } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { createManageLabelServiceLabelData, MailSet, MailSetTypeRef } from "@tutao/entities/tutanota"
import { mailLocator } from "../../mailLocator"
import { assertNotNull, promiseMap } from "@tutao/utils"
import { isValidCSSHexColor } from "../../../../ui/base/Color"
import { TitleSection } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { Switch } from "../../../../ui/base/Switch"
import { IconButton } from "../../../../ui/base/IconButton"
import { TextField } from "../../../../ui/base/TextField"
import { ColorOptionButton } from "../../../../ui/base/colorPicker/ColorOptionButton"
import { showImapEditLabelDialog } from "../../mail/view/EditLabelDialog"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../ui/base/DropDownSelectorNew"
import { getMailSetName } from "../../mail/model/MailUtils"
import { getFolderIconByType } from "../../mail/view/MailGuiUtils"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import { elementIdPart, elementIdToId, GENERATED_MIN_ID, getElementId } from "@tutao/meta"
import { showEditFolderDialog } from "../../mail/view/EditFolderDialog"
import { Card } from "../../../../ui/base/Card"
import { Dialog } from "../../../../ui/base/Dialog"
import { getTranslationForImapProvider, ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { Checkbox } from "../../../../ui/base/Checkbox"
import { ImapCredentials } from "../../../common/api/common/utils/imapImportUtils/ImapSyncContext"

assertMainOrNode()

class ConfigureImapImportPage implements WizardPageN<ImapImportData> {
	private isGmail: boolean = false

	private shouldDisplayRootImportMailSetTextField: boolean = false
	private shouldDisplayLabelField: boolean = false
	private shouldDisplayInfoHover: boolean = false
	private hoverPosition: { left: number; top: number } = { left: 0, top: 0 }
	private hoverInfo: TranslationKey = "migrationConfigurationLinkFoldersInfo_msg"

	private titleSectionParams = {
		icon: Icons.GearWheelFilled,
		iconOptions: { color: theme.on_surface_variant, class: "icon-progress" },
		subTitle: lang.getTranslationText("migrationConfigInfo_msg"),
	}
	private successfullyLoadedMailboxes: boolean = false

	async oninit(vnode: Vnode<WizardPageAttrs<ImapImportData>>) {
		const imapImportData = vnode.attrs.data

		this.isGmail = imapImportData.imapProvider === ImapProvider.Gmail
		this.titleSectionParams.subTitle = lang.getTranslation("migrationConfigLoading_msg", {
			"{provider}": lang.getTranslationText(getTranslationForImapProvider(vnode.attrs.data.imapProvider)),
		}).text
		this.shouldDisplayRootImportMailSetTextField = !vnode.attrs.data.matchImapMailboxesToTutaMailSets
		this.shouldDisplayLabelField = vnode.attrs.data.addLabelToImportedMails

		const imapImportController = mailLocator.getImapMailImportController()
		const imapCredentials = this.getImapCredentials(imapImportData)

		imapImportData.folderSystem = await imapImportController.getFolderSystemForSelectedMailbox()
		const imapImportUiGetMailboxResult = await imapImportController.doInitialConnectAndGetImapMailboxes(imapCredentials)

		if (imapImportUiGetMailboxResult.result) {
			this.successfullyLoadedMailboxes = true
			this.titleSectionParams.iconOptions.class = ""
			this.titleSectionParams.subTitle = lang.getTranslationText(this.isGmail ? "migrationConfigInfoGmail_msg" : "migrationConfigInfo_msg")

			const imapMailboxes = imapImportUiGetMailboxResult.result.imapMailboxes
			imapImportData.imapMailboxes = imapMailboxes
			if (!this.isGmail) {
				imapImportData.imapMailboxesToTutaMailSets = await imapImportController.constructImapMailboxesToTutaFoldersMap(imapMailboxes)
			}
			this.updateImapCredentials(imapImportData, imapImportUiGetMailboxResult.result.imapCredentials)
		} else if (imapImportUiGetMailboxResult.error) {
			this.titleSectionParams = {
				icon: Icons.FailureFilled,
				iconOptions: { color: theme.error, class: "" },
				subTitle: imapImportUiGetMailboxResult.error.errorMessage,
			}
		}
		m.redraw()
	}

	private updateImapCredentials(imapImportData: ImapImportData, imapCredentials: ImapCredentials) {
		imapImportData.imapAccountHost = imapCredentials.host
		imapImportData.imapAccountPort = imapCredentials.port
		imapImportData.imapAccountUsername = imapCredentials.username
		imapImportData.imapAccountPassword = imapCredentials.password
		imapImportData.imapAccountOAuthToken = imapCredentials.tokenEndpointResponse
		imapImportData.customCertificateData = imapCredentials.customCertificateData
		imapImportData.ignoreCertificateErrors = imapCredentials.ignoreCertificateErrors
	}

	private getImapCredentials(imapImportData: ImapImportData) {
		const imapCredentials: ImapCredentials = {
			host: imapImportData.imapAccountHost,
			port: imapImportData.imapAccountPort,
			username: imapImportData.imapAccountUsername,
			password: imapImportData.imapAccountPassword,
			tokenEndpointResponse: imapImportData.imapAccountOAuthToken,
			customCertificateData: imapImportData.customCertificateData,
			ignoreCertificateErrors: imapImportData.ignoreCertificateErrors,
		}
		return imapCredentials
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		const imapImportData = vnode.attrs.data

		return m(".mt-24", { style: { maxHeight: "65vh" } }, [
			this.shouldDisplayInfoHover
				? this.renderHoverInfo(this.hoverPosition.left, this.hoverPosition.top, lang.getTranslation(this.hoverInfo).text)
				: null,
			m(
				".mt-16",
				m(TitleSection, {
					...this.titleSectionParams,
					title: "",
					style: {
						borderRadius: px(size.radius_16),
					},
				}),
			),
			this.isGmail ? this.renderGmailConfigureContent(imapImportData) : this.renderNonGmailConfigureContent(imapImportData),
			this.renderContinueButton(imapImportData),
		])
	}

	private renderContinueButton(data: ImapImportData) {
		return m(
			".flex-center.full-width.justify-end.pt-32.mb-32",
			m(
				"",
				{
					style: {
						width: "260px",
					},
				},
				m(PrimaryButton, {
					label: "continue_action",
					class: "wizard-next-button",
					onclick: (_, dom) => {
						emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
					},
					disabled: !this.shouldAllowContinuing(data),
				}),
			),
		)
	}

	private isFolderMappingCompleted(data: ImapImportData) {
		return (
			(this.shouldDisplayRootImportMailSetTextField && data.rootImportMailSetName !== "") ||
			(data.matchImapMailboxesToTutaMailSets && data.imapMailboxes.length === data.imapMailboxesToTutaMailSets?.size)
		)
	}

	private isLabelCorrectlySet(data: ImapImportData) {
		return (
			!data.addLabelToImportedMails ||
			(data.imapSyncLabelData !== null && data.imapSyncLabelData.name !== "" && isValidCSSHexColor(data.imapSyncLabelData.color))
		)
	}

	private shouldAllowContinuing(data: ImapImportData) {
		return (this.isGmail || (this.isFolderMappingCompleted(data) && this.isLabelCorrectlySet(data))) && this.successfullyLoadedMailboxes
	}

	private renderGmailConfigureContent(data: ImapImportData) {
		return m(TextField, {
			label: "migrationRootMailFolderName_label",
			value: data.rootImportMailSetName,
			oninput: (value) => (data.rootImportMailSetName = value),
			helpLabel: () => lang.getTranslationText("migrationMailFolderNameGmail_helpLabel"),
			leadingIcon: {
				icon: Icons.FolderFilled,
				color: theme.on_surface_variant,
			},
		})
	}

	private renderNonGmailConfigureContent(data: ImapImportData) {
		const obj = this
		return [
			m(".tutaui-switch.mt-16", [
				m(Switch, {
					ariaLabel: "migrationAddLabelToImportedMails_label",
					checked: data.addLabelToImportedMails,
					onclick(checked: boolean) {
						obj.shouldDisplayLabelField = checked
						data.addLabelToImportedMails = checked
						if (!checked) {
							data.imapSyncLabelData = null
						}
					},
				}),
				m("", lang.getTranslationText("migrationAddLabelToImportedMails_label")),
				m(IconButton, {
					icon: Icons.QuestionmarkFilled,
					title: "migrationAddLabelToImportedMails_label",
					click: this.updateHoverMessage("migrationConfigurationAddLabelInfo_msg"),
				}),
			]),
			this.shouldDisplayLabelField
				? m(TextField, {
						label: "labelInput_label",
						value: data.imapSyncLabelData?.name ?? "",
						oninput: (value) => {
							if (data.imapSyncLabelData) {
								data.imapSyncLabelData.name = value
							} else {
								data.imapSyncLabelData = createManageLabelServiceLabelData({ name: value, color: theme.primary, parentLabel: null })
								m.redraw() //possibly doing nothing
							}
						},
						leadingIcon: {
							icon: Icons.LabelFilled,
							color: theme.on_surface_variant,
						},
						injectionsRight: () => {
							return m(ColorOptionButton, {
								color: data.imapSyncLabelData?.color ?? "",
								onClick: () => {
									if (!data.imapSyncLabelData) {
										data.imapSyncLabelData = createManageLabelServiceLabelData({ name: "", color: "", parentLabel: null })
									}
									const labelData = data.imapSyncLabelData
									showImapEditLabelDialog(
										labelData,
										(value) => {
											if (data.imapSyncLabelData) {
												data.imapSyncLabelData.name = value
											} else {
												data.imapSyncLabelData = createManageLabelServiceLabelData({
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
							})
						},
						helpLabel: () => lang.getTranslationText("migrationLabelInput_helpLabel"),
					})
				: null,
			m(".tutaui-switch.mt-16", [
				m(Switch, {
					ariaLabel: "matchMigrationFoldersToTutaMailSets_label",
					checked: data.matchImapMailboxesToTutaMailSets,
					onclick: (checked: boolean) => {
						obj.shouldDisplayRootImportMailSetTextField = !checked
						data.matchImapMailboxesToTutaMailSets = checked
						if (checked) {
							data.rootImportMailSetName = ""
						}
						m.redraw()
					},
				}),
				m("", lang.getTranslationText("matchMigrationFoldersToTutaMailSets_label")),
				m(IconButton, {
					icon: Icons.QuestionmarkFilled,
					title: "migrationFolderMapping_title",
					click: this.updateHoverMessage("migrationConfigurationLinkFoldersInfo_msg"),
				}),
				!this.shouldDisplayRootImportMailSetTextField && this.successfullyLoadedMailboxes && !this.isFolderMappingCompleted(data)
					? m(
							"",
							{
								style: {
									minWidth: "100px",
									marginLeft: "auto",
								},
							},
							this.renderCreateAllMissingFoldersButton(data),
						)
					: null,
			]),
			this.shouldDisplayRootImportMailSetTextField
				? m(TextField, {
						label: "migrationRootMailFolderName_label",
						value: data.rootImportMailSetName,
						oninput: (value) => (data.rootImportMailSetName = value),
						helpLabel: () => lang.getTranslationText("migrationRootMailFolderName_helpLabel"),
						leadingIcon: {
							icon: Icons.FolderFilled,
							color: theme.on_surface_variant,
						},
					})
				: null,
			!this.shouldDisplayRootImportMailSetTextField ? this.renderFolderMapping(data) : null,
			this.shouldDisplayRootImportMailSetTextField
				? m(".tutaui-switch", [
						m(Checkbox, {
							label: () => lang.getTranslationText("migrationMigrateSpamFolder_label"),
							checked: data.spamFolderMigrationInformation?.shouldMigrateSpamFolder ?? false,
							onChecked: (value: boolean) =>
								(data.spamFolderMigrationInformation = {
									shouldMigrateSpamFolder: value,
									spamMailbox: data.imapMailboxes.find((imapMailbox) => imapMailbox.specialUse === ImapMailboxSpecialUse.JUNK) ?? null,
								}),
						}),
						m(IconButton, {
							icon: Icons.InfoFilled,
							title: "migrationCannotMapSpamFolder_label",
							click: this.updateHoverMessage("migrationCannotMapSpamFolder_msg"),
						}),
					])
				: null,
		]
	}

	private renderFolderMapping(data: ImapImportData) {
		const imapMailboxToTutaFolderRows = data.imapMailboxes.map((imapMailbox) => {
			const mailSetMapping = data.imapMailboxesToTutaMailSets?.get(imapMailbox.path)
			let tutaMailSet: MailSet | null = null
			if (mailSetMapping?.mailSetElementId) {
				tutaMailSet = data.folderSystem.getFolderById(mailSetMapping.mailSetElementId)
			}
			return { imapMailbox, tutaMailSet, shouldSync: mailSetMapping?.shouldSync ?? true }
		})
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
											specialUse: mailboxToRow.imapMailbox.specialUse ?? null,
										})
									}
								},
							})
						: m(IconButton, {
								icon: Icons.CheckboxEmpty,
								title: "enableMigrationSyncForFolder_action",
								click: async () => {
									const mappedMailSet = data.imapMailboxesToTutaMailSets?.get(mailboxToRow.imapMailbox.path)
									if (mappedMailSet) {
										if (mappedMailSet.mailSetElementId === GENERATED_MIN_ID) {
											data.imapMailboxesToTutaMailSets?.delete(mailboxToRow.imapMailbox.path)
										} else {
											mappedMailSet.shouldSync = true
										}
									}
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
							//"background-color": "initial",
							//minHeight: px(bubbleButtonHeight()),
						},
					}),
					m(DropDownSelectorNew, {
						selectedValue: mailboxToRow.tutaMailSet,
						selectedValueDisplay: mailboxToRow.shouldSync
							? mailboxToRow.tutaMailSet
								? getMailSetName(mailboxToRow.tutaMailSet)
								: lang.getTranslationText("migrationChooseFolder_msg")
							: lang.getTranslationText("migrationNotImportedFolderName_msg"),
						items: data.folderSystem
							.getIndentedList(null)
							.map((indentedFolder) => ({ name: getMailSetName(indentedFolder.mailSet), value: indentedFolder.mailSet })),
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
								specialUse: mailboxToRow.imapMailbox.specialUse ?? null,
							})
						},
						disabled: !mailboxToRow.shouldSync || !isHamFolder,
					} satisfies DropDownSelectorNewAttrs<MailSet>),
					isHamFolder
						? m(IconButton, {
								icon: Icons.Plus,
								title: "migrationCreateFolder_action",
								click: async () => {
									let newFolderElementId: Id | null = null
									await showEditFolderDialog(
										assertNotNull(mailLocator.getImapMailImportController().selectedMailBoxDetail),
										null,
										null,
										mailboxToRow.imapMailbox.name,
										async (folderId) => {
											newFolderElementId = elementIdPart(folderId)
											data.folderSystem = await mailLocator.getImapMailImportController().getFolderSystemForSelectedMailbox()
											if (newFolderElementId !== null) {
												data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, {
													mailSetElementId: newFolderElementId,
													shouldSync: true,
													specialUse: mailboxToRow.imapMailbox.specialUse ?? null,
												})
											}
										},
									)
								},
								disabled: !mailboxToRow.shouldSync,
							})
						: m(IconButton, {
								icon: Icons.InfoFilled,
								title: "migrationCannotMapSpamFolder_label",
								click: this.updateHoverMessage("migrationCannotMapSpamFolder_msg"),
							}),
				])
			}),
		)
	}

	private updateHoverMessage(textMessage: TranslationKey) {
		return (event: MouseEvent) => {
			const isDisplayingHoverForPressedButton = this.shouldDisplayInfoHover && this.hoverInfo === textMessage
			if (isDisplayingHoverForPressedButton) {
				this.shouldDisplayInfoHover = false
				return
			}
			const target = event.target as Element
			const button = target.closest(".icon-button")
			const dialogWindow = target.closest('[role="dialog"]')

			if (button && dialogWindow) {
				const targetRect = button.getBoundingClientRect()
				const dialogRect = dialogWindow.getBoundingClientRect()

				const shiftDistance = 45
				// When calculating the left distance, it is being considered against the actual left side of screen
				const hoverWindowLeft = targetRect.left + shiftDistance
				//This top, however, is considering the dialog rect as it's start, then we need to do the calculation
				const hoverWindowTop = targetRect.top - dialogRect.top - shiftDistance
				this.hoverInfo = textMessage
				this.hoverPosition = {
					left: hoverWindowLeft,
					top: hoverWindowTop,
				}

				this.shouldDisplayInfoHover = true
			}
		}
	}

	private renderHoverInfo(left: number, top: number, message: string): Children {
		return m(
			".hover-panel.border.border-radius",
			{
				style: {
					left: px(left),
					top: px(top),
				},
			},
			[
				m(Card, {}, [
					m(
						".flex.items-center.justify-center",
						m(Icon, {
							icon: Icons.InfoFilled,
							size: IconSize.PX32,
							style: {
								fill: theme.on_surface_variant,
							},
						}),
					),
					m("", message),
				]),
			],
		)
	}

	private renderCreateAllMissingFoldersButton(data: ImapImportData) {
		return m(PrimaryButton, {
			label: "migrationCreateMissingFolders_label",
			onclick: () => {
				showProgressDialog(
					"migrationCreatingMissingFolders_msg",
					promiseMap(data.imapMailboxes, async (imapMailbox) => {
						if (!data.imapMailboxesToTutaMailSets?.has(imapMailbox.path)) {
							const ownerGroupId = assertNotNull(mailLocator.getImapMailImportController().selectedMailBoxDetail).mailGroup._id
							const newFolderId = await mailLocator.mailFacade.createMailFolder(imapMailbox.name ?? "", null, elementIdToId(ownerGroupId))
							// loading here to populate the cache so that the folder system will have it
							const newFolder = await mailLocator.entityClient.load(MailSetTypeRef, newFolderId)
							data.imapMailboxesToTutaMailSets?.set(imapMailbox.path, {
								mailSetElementId: elementIdPart(newFolder._id),
								shouldSync: true,
								specialUse: imapMailbox.specialUse ?? null,
							})
						}
					}).then(async () => {
						data.folderSystem = await mailLocator.getImapMailImportController().getFolderSystemForSelectedMailbox()
					}),
				)
			},
		})
	}
}

export default ConfigureImapImportPage

export class ImapImportConfigurePageAttrs implements WizardPageAttrs<ImapImportData> {
	data: ImapImportData

	constructor(imapImportData: ImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): TranslationKey {
		return "migrationSetup_title"
	}

	stepTitle = "migrationConfig_title" as TranslationKey

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		if (this.data.folderSystem.getFolderByName(this.data.rootImportMailSetName) !== null) {
			Dialog.message("migrationRootMailFolderNameAlreadyExists_helpLabel")
			return Promise.resolve(false)
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
