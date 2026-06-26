import m, { Children } from "mithril"
import { showAddImapImportWizard } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { ImapMailImportController } from "./ImapMailImportController.js"
import { mailLocator } from "../../mailLocator.js"
import { theme } from "../../../../ui/theme"
import { TitleSection } from "../../../../ui/TitleSection.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ImapAccountSyncStateTypeRef, ImapFolderSyncStateTypeRef } from "@tutao/entities/tutanota"
import { Icon, IconAttrs, IconSize } from "../../../../ui/base/Icon"
import { Card } from "../../../../ui/base/Card"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { assertNotNull, lazy } from "@tutao/utils"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { Dialog } from "../../../../ui/base/Dialog"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { IconButton } from "../../../../ui/base/IconButton"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { BannerType, InfoBanner } from "../../../../ui/base/InfoBanner"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { ExpanderButton, ExpanderPanel } from "../../../../ui/base/Expander"

assertMainOrNode()

class ImapImportSettingsViewer implements UpdatableSettingsViewer {
	private mailboxIdToImportHistoryExpanded: Map<Id, boolean> = new Map<Id, boolean>()

	constructor(private readonly imapImportController: lazy<ImapMailImportController>) {}

	async oninit() {
		await this.imapImportController().init()
		const mailboxDetails = this.imapImportController().mailboxDetails
		if (mailboxDetails) {
			const isSingleMailbox = mailboxDetails.length === 1
			for (const detail of mailboxDetails) {
				this.mailboxIdToImportHistoryExpanded.set(detail.mailbox._id, isSingleMailbox)
			}
		}
	}

	view(): Children {
		const hasActiveSync = this.imapImportController().hasActiveSync()
		const hasCanceledSync = this.imapImportController().hasCanceledSync()
		return m(
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
				hasActiveSync ? this.renderActiveSyncsTitle() : this.renderInfo(),
				this.renderSyncProgressForActiveSyncSessions(),
				this.renderButton(),
				hasCanceledSync ? this.renderImapImportHistories() : null,
			],
		)
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

	private renderActiveSyncsTitle(): Children {
		return m(MenuTitle, { content: lang.getTranslationText("imapImportActiveSyncs_label") })
	}

	private renderSyncProgressForActiveSyncSessions(): Children {
		const activeImapImportUiSessions = this.imapImportController().activeImapImportUiSessions
		return activeImapImportUiSessions.map((session) => {
			const buttons: Children[] = []

			const accountSyncStateId = session.imapAccountSyncStateId
			if (this.imapImportController().shouldRenderPauseButton(session)) {
				// Running
				buttons.push(
					m(IconButton, {
						title: "pauseImapImport_action",
						icon: Icons.PauseOutline,
						size: ButtonSize.Normal,
						disabled: this.imapImportController().shouldDisableButtons(),
						click: () => {
							this.imapImportController().pauseImport(accountSyncStateId)
						},
					}),
				)
			} else if (this.imapImportController().shouldRenderResyncButton(session)) {
				// Finished or Postponed
				buttons.push(
					m(IconButton, {
						title: "resyncImapImport_action",
						icon: Icons.Refresh,
						size: ButtonSize.Normal,
						disabled: this.imapImportController().shouldDisableButtons(),
						click: () => {
							this.imapImportController().continueImport(accountSyncStateId)
						},
					}),
				)
			} else if (this.imapImportController().shouldRenderPlayButton(session)) {
				// Paused
				buttons.push(
					m(IconButton, {
						title: "resumeImapImport_action",
						icon: Icons.PlayOutline,
						size: ButtonSize.Normal,
						disabled: this.imapImportController().shouldDisableButtons(),
						click: () => {
							this.imapImportController().continueImport(accountSyncStateId)
						},
					}),
				)
			}
			buttons.push(
				m(IconButton, {
					title: "cancel_action",
					icon: Icons.X,
					size: ButtonSize.Normal,
					disabled: this.imapImportController().shouldDisableButtons(),
					click: () => {
						return Dialog.confirm("imapImportCancelConfirm_msg").then((confirmed) => {
							if (confirmed) {
								showProgressDialog("pleaseWait_msg", this.imapImportController().deleteImport(accountSyncStateId))
							}
						})
					},
				}),
			)

			let syncMessage = lang.getTranslation("imapSyncInProgressInfo_msg", {
				"{completed}": session.syncProgress?.completed.toString() ?? "-",
				"{total}": session.syncProgress?.total.toString() ?? "-",
			})
			if (this.imapImportController().shouldRenderClockIcon(session)) {
				syncMessage = lang.getTranslation("imapSyncPostponed_msg", {
					"{postponedUntil}": session.postponedUntil.toLocaleTimeString(),
				})
			} else if (this.imapImportController().shouldRenderErrorIcon(session)) {
				syncMessage = lang.getTranslation("imapSyncFailure_msg")
			}

			const mailboxDetail = assertNotNull(this.imapImportController().getDestinationMailboxDetailForSession(session))
			const destinationTutaMailbox = getMailboxName(mailLocator.logins, mailboxDetail)
			const syncSourceAndDestinationMessage = lang.getTranslation("imapSyncInProgressAccounts_msg", {
				"{sourceAddress}": session.sourceImapAddress,
				"{tutaMailbox}": destinationTutaMailbox,
			})

			const statusIcon = this.imapImportController().shouldRenderPauseIcon(session)
				? Icons.PauseOutline
				: this.imapImportController().shouldRenderClockIcon(session)
					? Icons.ClockOutlines
					: this.imapImportController().shouldRenderCheckmarkIcon(session)
						? Icons.Checkmark
						: this.imapImportController().shouldRenderErrorIcon(session)
							? Icons.SyncProblem
							: Icons.Sync
			const iconFill =
				statusIcon === Icons.Checkmark
					? theme.success
					: statusIcon === Icons.PauseOutline
						? theme.warning
						: statusIcon === Icons.SyncProblem
							? theme.error
							: theme.on_surface
			const statusIconParameters: Partial<IconAttrs> = {
				icon: statusIcon,
				class: statusIcon === Icons.Sync ? "icon-progress" : "",
				style: {
					fill: iconFill,
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

	private renderImapImportHistories() {
		const mailboxDetails = this.imapImportController().mailboxDetails
		if (mailboxDetails) {
			return m(
				"mt-16.mb-16",
				mailboxDetails.map((details) => this.renderImapImportHistory(details, mailboxDetails.length <= 1)),
			)
		}
		return null
	}

	private renderImapImportHistory(mailboxDetail: MailboxDetail, isSingleMailbox: boolean) {
		const mailboxLabel = isSingleMailbox ? "" : " · " + getMailboxName(mailLocator.logins, mailboxDetail)
		const mailboxId = mailboxDetail.mailbox._id
		return [
			m(".flex-space-between.items-center.mt-4.mb-4", [
				m(".h5", lang.getTranslation("imapImportHistory_label").text + mailboxLabel),
				m(ExpanderButton, {
					label: "show_action",
					expanded: this.mailboxIdToImportHistoryExpanded.get(mailboxId) || false,
					onExpandedChange: () => {
						this.mailboxIdToImportHistoryExpanded.set(mailboxId, !this.mailboxIdToImportHistoryExpanded.get(mailboxId))
					},
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this.mailboxIdToImportHistoryExpanded.get(mailboxId) || false,
				},
				this.renderPastSyncSessionsForMailbox(mailboxDetail),
			),
		]
	}

	private renderPastSyncSessionsForMailbox(mailboxDetail: MailboxDetail): Children {
		const canceledImapImportUiSessionsForMailGroup = this.imapImportController().canceledImapImportUiSessions.filter(
			(session) => session.mailGroupId === mailboxDetail.mailGroup._id,
		)
		return canceledImapImportUiSessionsForMailGroup.map((session) => {
			const statusIcon = Icons.Checkmark
			const statusIconParameters: Partial<IconAttrs> = {
				icon: statusIcon,
				class: "",
				style: {
					fill: theme.on_surface,
				},
			}

			return m(
				Card,
				{
					classes: ["mb-16"],
				},
				m(".flex.items-center.justify-between", [
					m(".flex.items-center.gap-16", [
						m(Icon, {
							...statusIconParameters,
							size: IconSize.PX32,
						} as IconAttrs),
						m(".pl-4.pr-32.items-base.flex-column", [m(".text-preline.text-ellipsis", session.sourceImapAddress)]),
					]),
				]),
			)
		})
	}

	private renderButton(): Children {
		const initialImapImportData = this.imapImportController().getInitialImapImportData()
		return m(
			".flex-end.mt-8",
			m(PrimaryButton, {
				width: "flex",
				label: "imapSyncStart_action",
				onclick: () => {
					showAddImapImportWizard(initialImapImportData).then(() => this.imapImportController().updateActiveUiSessions())
				},
			}),
		)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImapAccountSyncStateTypeRef, update) || isUpdateForTypeRef(ImapFolderSyncStateTypeRef, update)) {
				await this.imapImportController().updateActiveUiSessions()
			}
		}
	}
}

export default ImapImportSettingsViewer
