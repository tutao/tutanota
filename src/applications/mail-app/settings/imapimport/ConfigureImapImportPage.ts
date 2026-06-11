import { assertMainOrNode } from "@tutao/app-env"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { ImapImportData } from "./AddImapImportWizard"
import { ImapCredentials } from "../../../common/api/common/utils/imapImportUtils/ImapSyncState"
import { ImapImportController } from "./ImapImportController"
import { ImapMailbox } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import {
	imapAccountToImapCredentials,
	tokenEndpointResponseToOAuthTokenEndpointResponse,
} from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { createImapAccount, createManageLabelServiceLabelData, MailSet } from "@tutao/entities/tutanota"
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
import { elementIdPart, getElementId } from "@tutao/meta"
import { showEditFolderDialog } from "../../mail/view/EditFolderDialog"
import { Card } from "../../../../ui/base/Card"

assertMainOrNode()

class ConfigureImapImportPage implements WizardPageN<ImapImportData> {
	private shouldDisplayFolderTextField: boolean = true
	private shouldDisplayLabelField: boolean = false
	private imapAccount: ImapCredentials | null = null
	private controller: ImapImportController | null = null
	private imapMailboxes: ImapMailbox[] = []
	private imapMailboxesToTutaFolders: Map<string, Id> | null = null
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

	oncreate(vnode: VnodeDOM<WizardPageAttrs<ImapImportData>>) {
		this.shouldDisplayFolderTextField = !vnode.attrs.data.matchImapMailboxesToTutaMailSets
		this.shouldDisplayLabelField = vnode.attrs.data.addLabelToImportedMails
		const imapAccountOAuthToken = vnode.attrs.data.imapAccountOAuthToken
		this.imapAccount = imapAccountToImapCredentials(
			createImapAccount({
				host: vnode.attrs.data.imapAccountHost,
				port: vnode.attrs.data.imapAccountPort.toString(),
				username: vnode.attrs.data.imapAccountUsername,
				password: vnode.attrs.data.imapAccountPassword,
				oAuthTokenEndpointResponse:
					imapAccountOAuthToken !== undefined ? tokenEndpointResponseToOAuthTokenEndpointResponse(imapAccountOAuthToken) : null,
			}),
		)
	}

	async oninit() {
		this.controller = await mailLocator.imapImportController()
		const imapMailboxResult = await this.controller.getImapMailboxesFromServer(assertNotNull(this.imapAccount))
		this.folderSystem = await this.controller.getFolderSystemForSelectedMailbox()
		if (imapMailboxResult.result) {
			this.imapMailboxes.push(...imapMailboxResult.result)
			this.imapMailboxesToTutaFolders = await this.controller.constructImapMailboxesToTutaFoldersMap(imapMailboxResult.result)
			this.successfullyLoadedMailboxes = true
			this.titleSectionParams.iconOptions.class = ""
			m.redraw()
		} else if (imapMailboxResult.error) {
			this.titleSectionParams = {
				icon: Icons.FailureFilled,
				iconOptions: { color: theme.error, class: "" },
				subTitle: lang.getTranslation("imapImportMailBoxListFailure_msg", {
					"{error}": imapMailboxResult.error.error,
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
								data.imapSyncLabelData = createManageLabelServiceLabelData({ name: value, color: "" })
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
			!this.shouldDisplayFolderTextField && this.controller ? this.renderFolderMapping(data) : null,
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
			const tutaMailSetElementId = data.imapMailboxesToTutaMailSets?.get(imapMailbox.path)
			let tutaMailSet: MailSet | null = null
			if (tutaMailSetElementId) {
				tutaMailSet = this.folderSystem.getFolderById(tutaMailSetElementId)
			}
			return { imapMailbox, tutaMailSet }
		})
		const obj = this
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
							//"background-color": "initial",
							//minHeight: px(bubbleButtonHeight()),
						},
					}),
					m(DropDownSelectorNew, {
						selectedValue: mailboxToRow.tutaMailSet,
						selectedValueDisplay: mailboxToRow.tutaMailSet
							? getFolderName(mailboxToRow.tutaMailSet)
							: lang.getTranslationText("imapChooseFolder_msg"),
						items: obj.folderSystem
							.getIndentedList(null)
							.map((indentedFolder) => ({ name: getFolderName(indentedFolder.folder), value: indentedFolder.folder })),
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
							this.imapMailboxesToTutaFolders?.set(mailboxToRow.imapMailbox.path, getElementId(selectedMailSet))
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
										obj.folderSystem = await assertNotNull(this.controller).getFolderSystemForSelectedMailbox()
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
