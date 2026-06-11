import m, { Children } from "mithril"
import { ImapImportData, showAddImapImportWizard } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { ImapImportController } from "./ImapImportController.js"
import { ImapImportSession } from "../../workerUtils/imapimport/ImapImportSession"
import { mailLocator } from "../../mailLocator.js"
import { theme } from "../../../../ui/theme"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { TitleSection } from "../../../../ui/TitleSection.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ImapAccountSyncStateTypeRef, ImapFolderSyncStateTypeRef } from "@tutao/entities/tutanota"
import { Icon, IconAttrs, IconSize } from "../../../../ui/base/Icon"
import { Card } from "../../../../ui/base/Card"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { assertNotNull } from "@tutao/utils"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { Dialog } from "../../../../ui/base/Dialog"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { IconButton } from "../../../../ui/base/IconButton"
import { ImapErrorCause } from "../../../common/api/common/utils/imapImportUtils/ImapError"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { BannerType, InfoBanner } from "../../../../ui/base/InfoBanner"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { ImapAccountSyncStatus } from "../../../../entities/tutanota/Utils"

assertMainOrNode()

class ImapImportSettingsViewer implements UpdatableSettingsViewer {
	private imapImportController: ImapImportController | null = null
	private sessions: ImapImportSession[] = []
	private disableButtons: boolean = false
	constructor() {}

	async oninit() {
		this.imapImportController = await mailLocator.imapImportController()
		await this.imapImportController.init()
		await this.updateUiState()
	}

	view(): Children {
		const hasActiveSync = this.imapImportController !== null && this.imapImportController.getActiveImapImportSessions().size > 0
		return this.imapImportController !== null
			? [
					m(
						".fill-absolute.scroll.plr-24.pb-48",
						{
							style: {
								backgroundColor: theme.surface_container,
								gap: "16px",
								display: "flex",
								flexDirection: "column",
							},
						},
						[
							this.renderTitleSection(),
							hasActiveSync ? this.renderActiveSyncTitle() : this.renderInfo(),
							this.renderSyncProgress(this.imapImportController),
							this.renderButton(this.getImapImportData()),
						],
					),
				]
			: []
	}

	private getImapImportData() {
		const imapImportData: ImapImportData = {
			imapAccountHost: "",
			imapAccountPort: 993,
			imapAccountUsername: "",
			imapAccountPassword: "",
			rootImportMailFolderName: "",
			imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED,
			matchImapMailboxesToTutaMailSets: false,
			isImapServerSupportingOAuth: false,
			revealImapAccountPassword: false,
			addLabelToImportedMails: false,
			imapSyncLabelData: null,
			imapMailboxes: [],
			folderSystem: new FolderSystem([]),
			imapProvider: ImapProvider.Other,
		}

		if (!env.dist) {
			// for test, we initialize with default values
			imapImportData.imapAccountHost = "localhost"
			imapImportData.imapAccountPort = 143
			imapImportData.imapAccountUsername = "user@test.com"
			imapImportData.imapAccountPassword = "password"
			imapImportData.rootImportMailFolderName = "root"
		}

		return imapImportData
	}

	private renderTitleSection(): Children {
		return m("", [
			m(TitleSection, {
				icon: Icons.DownloadOutline,
				title: lang.get("imapSync_title"),
				subTitle: lang.get("imapSyncInfo_msg"),
			}),
		])
	}

	private renderInfo(): Children {
		return m(InfoBanner, {
			message: "imapNoSyncActive_msg",
			icon: Icons.InfoFilled,
			type: BannerType.SettingsInfo,
			buttons: [],
		})
	}

	private renderActiveSyncTitle(): Children {
		return m(MenuTitle, { content: lang.getTranslationText("imapImportActiveSync_label") })
	}

	private renderSyncProgress(imapImportController: ImapImportController): Children {
		return Array.from(this.sessions).map((session) => {
			// TODO fix folder count not updating
			// console.log(session)
			const accountSyncStateId = session.imapAccountSyncState._id
			const isSyncComplete = session.syncProgress && session.syncProgress.completed === session.syncProgress.total
			// console.log(
			// 	session.imapAccountSyncState.imapAccount.username,
			// 	session.imapFolderSyncStates.map((fss) => fss.status),
			// 	session.syncProgress?.completed,
			// 	session.syncProgress?.total,
			// 	isSyncComplete,
			// )
			const buttons: Children[] = []
			if (imapImportController.shouldRenderPauseButton(session)) {
				if (isSyncComplete || session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED) {
					buttons.push(
						m(IconButton, {
							title: "resumeMailImport_action",
							icon: Icons.Refresh,
							size: ButtonSize.Normal,
							disabled: this.disableButtons,
							click: () => {
								this.disableButtons = true
								imapImportController.continueImport(accountSyncStateId).then(async () => {
									await this.updateUiState()
									this.disableButtons = false
								})
							},
						}),
					)
				} else {
					buttons.push(
						m(IconButton, {
							title: "pauseImapImport_action",
							icon: Icons.PauseOutline,
							size: ButtonSize.Normal,
							disabled: this.disableButtons,
							click: () => {
								this.disableButtons = true
								imapImportController.pauseImport(accountSyncStateId).then(async () => {
									await this.updateUiState()
									this.disableButtons = false
								})
							},
						}),
					)
				}
			}
			if (imapImportController.shouldRenderResyncButton(session)) {
				buttons.push(
					m(IconButton, {
						title: "resumeMailImport_action",
						icon: imapImportController.shouldRenderPauseIcon(session) ? Icons.PlayOutline : Icons.Refresh,
						size: ButtonSize.Normal,
						disabled: this.disableButtons,
						click: () => {
							this.disableButtons = true
							imapImportController.continueImport(accountSyncStateId).then(async (result) => {
								if (result.error?.cause === ImapErrorCause.AUTH_FAILED_REFRESH_TOKEN) {
									// fixme add dialog
								}
								await this.updateUiState()
								this.disableButtons = false
							})
						},
					}),
				)
			}
			buttons.push(
				m(IconButton, {
					title: "cancel_action",
					icon: Icons.X,
					size: ButtonSize.Normal,
					disabled: this.disableButtons,
					click: () => {
						this.disableButtons = true
						return Dialog.confirm("imapImportCancelConfirm_msg").then((confirmed) => {
							if (confirmed) {
								showProgressDialog(
									"pleaseWait_msg",
									imapImportController.deleteImport(accountSyncStateId).then(async () => {
										await this.updateUiState()
									}),
								)
							}
							this.disableButtons = false
						})
					},
				}),
			)

			let syncMessage = lang.getTranslation("imapSyncInProgressInfo_msg", {
				"{completed}": session.syncProgress?.completed.toString() ?? "-",
				"{total}": session.syncProgress?.total.toString() ?? "-",
			})
			if (session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED) {
				syncMessage = lang.getTranslation("imapSyncPostponed_msg", {
					"{postponedUntil}": new Date(parseInt(session.imapAccountSyncState.postponedUntil)).toLocaleTimeString(),
				})
			}
			const mailboxDetail = assertNotNull(this.imapImportController?.getDestinationMailboxDetailForSession(session))
			const destinationTutaMailbox = getMailboxName(mailLocator.logins, mailboxDetail)
			const syncSourceAndDestinationMessage = lang.getTranslation("imapSyncInProgressAccounts_msg", {
				"{sourceAddress}": session.imapAccountSyncState.imapAccount.username,
				"{tutaMailbox}": destinationTutaMailbox,
			})

			const statusIcon = imapImportController.shouldRenderPauseIcon(session)
				? Icons.PauseOutline
				: imapImportController.shouldRenderClockIcon(session)
					? Icons.ClockOutlines
					: isSyncComplete
						? Icons.Checkmark
						: Icons.Sync
			const statusIconParameters: Partial<IconAttrs> = {
				icon: statusIcon,
				class: statusIcon === Icons.Sync ? "icon-progress" : "",
				style: {
					fill: statusIcon === Icons.Checkmark ? theme.success : statusIcon === Icons.PauseOutline ? theme.warning : theme.on_surface,
				},
			}
			return m(
				Card,
				m(".flex.items-center.justify-between", [
					m(".flex.items-center.gap-16", [
						m(Icon, {
							...statusIconParameters,
							size: IconSize.PX32,
						} as IconAttrs),
						m(".pl-4.pr-32.items-base.flex-column", [
							m(".text-preline.text-ellipsis", syncSourceAndDestinationMessage.text),
							m(".small", syncMessage.text),
						]),
					]),
					m(".flex-column.items-center", buttons),
				]),
			)
		})
	}

	private renderButton(imapImportData: ImapImportData): Children {
		return m(
			".flex-end.mt-8",
			m(PrimaryButton, {
				width: "flex",
				label: "imapSyncStart_action",
				onclick: () => showAddImapImportWizard(imapImportData).then(() => this.updateUiState()),
			}),
		)
	}

	private async updateUiState() {
		if (this.imapImportController) {
			await this.imapImportController.updateActiveSessions()
			this.sessions = Array.from(this.imapImportController.getActiveImapImportSessions().values())
		}
		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImapAccountSyncStateTypeRef, update) || isUpdateForTypeRef(ImapFolderSyncStateTypeRef, update)) {
				this.updateUiState()
			}
		}
	}
}

export default ImapImportSettingsViewer
