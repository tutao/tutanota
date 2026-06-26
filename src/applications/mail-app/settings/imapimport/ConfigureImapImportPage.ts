import { assertMainOrNode } from "@tutao/app-env"
import m, { Children, Vnode } from "mithril"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { ImapImportData } from "./AddImapImportWizard"
import { ImapMailbox, ImapMailboxSpecialUse } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { createManageLabelServiceLabelData, MailSet } from "@tutao/entities/tutanota"
import { mailLocator } from "../../mailLocator"
import { assertNotNull } from "@tutao/utils"
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
import { getFolderName } from "../../mail/model/MailUtils"
import { getFolderIconByType } from "../../mail/view/MailGuiUtils"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import { elementIdPart, GENERATED_MIN_ID, getElementId } from "@tutao/meta"
import { showEditFolderDialog } from "../../mail/view/EditFolderDialog"
import { Card } from "../../../../ui/base/Card"
import { MailSetMapping } from "../../workerUtils/imapimport/ImapImporter"

assertMainOrNode()

class ConfigureImapImportPage implements WizardPageN<ImapImportData> {
	private shouldDisplayFolderTextField: boolean = true
	private shouldDisplayLabelField: boolean = false
	private imapMailboxes: ImapMailbox[] = []
	private imapMailboxesToTutaFolders: Map<string, MailSetMapping> | null = null
	private folderSystem: FolderSystem = new FolderSystem([])
	private titleSectionParams = {
		icon: Icons.GearWheelFilled,
		iconOptions: { color: theme.on_surface_variant, class: "icon-progress" },
		subTitle: lang.getTranslationText("imapSyncConfigInfo_msg"),
	}
	private shouldDisplayHover: boolean = false
	private successfullyLoadedMailboxes: boolean = false
	private hoverPosition: { left: number; top: number } = { left: 0, top: 0 }
	private hoverInfo: TranslationKey = "imapConfigurationLinkFoldersInfo_msg"

	async oninit(vnode: Vnode<WizardPageAttrs<ImapImportData>>) {
		const imapCredentials = {
			host: vnode.attrs.data.imapAccountHost,
			port: vnode.attrs.data.imapAccountPort,
			username: vnode.attrs.data.imapAccountUsername,
			password: vnode.attrs.data.imapAccountPassword,
			tokenEndpointResponse: vnode.attrs.data.imapAccountOAuthToken,
		}
		this.shouldDisplayFolderTextField = !vnode.attrs.data.matchImapMailboxesToTutaMailSets
		this.shouldDisplayLabelField = vnode.attrs.data.addLabelToImportedMails

		const imapImportController = mailLocator.getImapImportController()
		const imapGetMailboxResult = await imapImportController.getImapMailboxesFromServer(imapCredentials)

		this.folderSystem = await imapImportController.getFolderSystemForSelectedMailbox()

		if (imapGetMailboxResult.result) {
			this.imapMailboxes.push(...imapGetMailboxResult.result)
			this.imapMailboxesToTutaFolders = await imapImportController.constructImapMailboxesToTutaFoldersMap(imapGetMailboxResult.result)
			this.successfullyLoadedMailboxes = true
			this.titleSectionParams.iconOptions.class = ""
			m.redraw()
		} else if (imapGetMailboxResult.error) {
			this.titleSectionParams = {
				icon: Icons.FailureFilled,
				iconOptions: { color: theme.error, class: "" },
				subTitle: lang.getTranslation("imapImportMailBoxListFailure_msg", {
					"{error}": imapGetMailboxResult.error.message,
				}).text,
			}
		}
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		const obj = this
		const data = vnode.attrs.data
		data.imapMailboxesToTutaMailSets = this.imapMailboxesToTutaFolders ?? undefined
		data.imapMailboxes = this.imapMailboxes
		data.folderSystem = this.folderSystem

		const isFolderMappingCompleted =
			data.rootImportMailFolderName !== "" ||
			(data.matchImapMailboxesToTutaMailSets && obj.imapMailboxes.length === data.imapMailboxesToTutaMailSets?.size)
		const isLabelCorrectlySet =
			!data.addLabelToImportedMails ||
			(data.imapSyncLabelData !== null && data.imapSyncLabelData.name !== "" && isValidCSSHexColor(data.imapSyncLabelData.color))
		const shouldAllowContinuing = isFolderMappingCompleted && isLabelCorrectlySet && this.successfullyLoadedMailboxes

		return m(".mt-24", { style: { maxHeight: "65vh" } }, [
			this.shouldDisplayHover ? this.renderHoverInfo(this.hoverPosition.left, this.hoverPosition.top, lang.getTranslation(this.hoverInfo).text) : null,
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
			m(".tutaui-switch.mt-16", [
				m(Switch, {
					ariaLabel: "imapAddLabelToImportedMails_label",
					checked: data.addLabelToImportedMails,
					onclick(checked: boolean) {
						obj.shouldDisplayLabelField = checked
						data.addLabelToImportedMails = checked
						if (!checked) {
							data.imapSyncLabelData = null
						}
					},
				}),
				m("", lang.getTranslationText("imapAddLabelToImportedMails_label")),
				m(IconButton, {
					icon: Icons.QuestionmarkFilled,
					title: "imapAddLabelToImportedMails_label",
					click: this.updateHoverMessage("imapConfigurationAddLabelInfo_msg"),
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
								data.imapSyncLabelData = createManageLabelServiceLabelData({ name: value, color: theme.primary })
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
										data.imapSyncLabelData = createManageLabelServiceLabelData({ name: "", color: "" })
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
						helpLabel: () => lang.getTranslationText("imapLabelInput_helpLabel"),
					})
				: null,
			m(".tutaui-switch.mt-16", [
				m(Switch, {
					ariaLabel: "matchImapMailboxesToTutaMailSets_label",
					checked: data.matchImapMailboxesToTutaMailSets,
					onclick: (checked: boolean) => {
						obj.shouldDisplayFolderTextField = !checked
						data.matchImapMailboxesToTutaMailSets = checked
						if (checked) {
							data.rootImportMailFolderName = ""
						}
						m.redraw()
					},
				}),
				m("", lang.getTranslationText("matchImapMailboxesToTutaMailSets_label")),
				m(IconButton, {
					icon: Icons.QuestionmarkFilled,
					title: "imapSyncFolderMapping_title",
					click: this.updateHoverMessage("imapConfigurationLinkFoldersInfo_msg"),
				}),
			]),
			this.shouldDisplayFolderTextField
				? m(TextField, {
						label: "imapImportRootMailFolderName_label",
						value: data.rootImportMailFolderName,
						oninput: (value) => (data.rootImportMailFolderName = value),
						helpLabel: () => lang.getTranslationText("imapImportRootMailFolderName_helpLabel"),
						leadingIcon: {
							icon: Icons.FolderFilled,
							color: theme.on_surface_variant,
						},
					})
				: null,
			!this.shouldDisplayFolderTextField ? this.renderFolderMapping(data) : null,
			m(
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
						disabled: !shouldAllowContinuing,
					}),
				),
			),
		])
	}

	private updateHoverMessage(textMessage: TranslationKey) {
		return (event: MouseEvent) => {
			const isDisplayingHoverForPressedButton = this.shouldDisplayHover && this.hoverInfo === textMessage
			if (isDisplayingHoverForPressedButton) {
				this.shouldDisplayHover = false
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

				this.shouldDisplayHover = true
			}
		}
	}

	private renderFolderMapping(data: ImapImportData) {
		const imapMailboxToTutaFolderRows = this.imapMailboxes.map((imapMailbox) => {
			const mailSetMapping = data.imapMailboxesToTutaMailSets?.get(imapMailbox.path)
			let tutaMailSet: MailSet | null = null
			if (mailSetMapping?.mailSetElementId) {
				tutaMailSet = this.folderSystem.getFolderById(mailSetMapping.mailSetElementId)
			}
			return { imapMailbox, tutaMailSet, shouldSync: mailSetMapping?.shouldSync ?? true }
		})
		const obj = this
		return m(
			"",
			imapMailboxToTutaFolderRows.map((mailboxToRow) => {
				const isHamFolder = mailboxToRow.imapMailbox.specialUse !== ImapMailboxSpecialUse.JUNK
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
							//"background-color": "initial",
							//minHeight: px(bubbleButtonHeight()),
						},
					}),
					m(DropDownSelectorNew, {
						selectedValue: mailboxToRow.tutaMailSet,
						selectedValueDisplay: mailboxToRow.shouldSync
							? mailboxToRow.tutaMailSet
								? getFolderName(mailboxToRow.tutaMailSet)
								: lang.getTranslationText("imapChooseFolder_msg")
							: lang.getTranslationText("imapNoSyncFolderName_msg"),
						items: obj.folderSystem
							.getIndentedList(null)
							.map((indentedFolder) => ({ name: getFolderName(indentedFolder.folder), value: indentedFolder.folder })),
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
					isHamFolder
						? m(IconButton, {
								icon: Icons.Plus,
								title: "imapCreateFolder_action",
								click: async () => {
									let newFolderElementId: Id | null = null
									await showEditFolderDialog(
										assertNotNull(mailLocator.getImapImportController().selectedMailBoxDetail),
										null,
										null,
										mailboxToRow.imapMailbox.name,
										async (folderId) => {
											newFolderElementId = elementIdPart(folderId)
											obj.folderSystem = await mailLocator.getImapImportController().getFolderSystemForSelectedMailbox()
											if (newFolderElementId !== null) {
												data.imapMailboxesToTutaMailSets?.set(mailboxToRow.imapMailbox.path, {
													mailSetElementId: newFolderElementId,
													shouldSync: true,
												})
											}
										},
									)
								},
								disabled: !mailboxToRow.shouldSync,
							})
						: m(IconButton, {
								icon: Icons.InfoFilled,
								title: "imapCannotMapSpamFolder_label",
								click: this.updateHoverMessage("imapCannotMapSpamFolder_msg"),
							}),
					mailboxToRow.shouldSync
						? m(IconButton, {
								icon: Icons.X,
								title: "disableImapSyncForFolder_action",
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
								icon: Icons.Checkmark,
								title: "enableImapSyncForFolder_action",
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
				])
			}),
		)
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
}

export default ConfigureImapImportPage

export class ImapImportConfigurePageAttrs implements WizardPageAttrs<ImapImportData> {
	data: ImapImportData

	constructor(imapImportData: ImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): TranslationKey {
		return "imapImportSetup_title"
	}

	stepTitle = "imapSyncConfig_title" as TranslationKey

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
