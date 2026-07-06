import m, { Children } from "mithril"
import { showAddImapImportWizard } from "./AddImapImportWizard.js"
import { assertMainOrNode, UpgradePromptType } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { ImapImportUiSession, ImapMailImportController } from "./ImapMailImportController.js"
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
import { getTranslationForImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapErrorCause } from "../../../common/api/common/error/ImapError"
import { ImapAccountSyncStatus } from "../../../../entities/tutanota/Utils"
import { AvailablePlanType, HighestTierPlans, isHighestTierPlan } from "../../../../entities/sys/Utils"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../../common/misc/SubscriptionDialogs"

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
				icon: Icons.DownloadFilled,
				title: lang.get("migration_title"),
				subTitle: lang.get("migrationInfo_msg"),
			}),
		])
	}

	private renderInfo(): Children {
		return m(InfoBanner, {
			message: "noActiveMigrations_msg",
			icon: Icons.InfoFilled,
			type: BannerType.SettingsInfo,
			buttons: [],
		})
	}

	private renderActiveSyncsTitle(): Children {
		return m(MenuTitle, { content: lang.getTranslationText("activeMigrations_label") })
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
						title: "pauseMigration_action",
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
						title: "resyncMigration_action",
						icon: Icons.Refresh,
						size: ButtonSize.Normal,
						disabled: this.imapImportController().shouldDisableButtons(),
						click: () => {
							if (session.imapAccountSyncStatus === ImapAccountSyncStatus.AUTH_ERROR) {
								//We already know how to handle auth state errors so we prommpt the user for the update on a resync
								this.imapImportController().promptUpdateImapCredentialsDialog(accountSyncStateId)
							} else {
								this.imapImportController()
									.continueImport(accountSyncStateId, true)
									.catch((e) => {
										//Auth failing errors do not need to bubble up as programming errors.
										if (e.data !== ImapErrorCause.AUTH_FAILED) {
											throw e
										}
									})
							}
						},
					}),
				)
			} else if (this.imapImportController().shouldRenderPlayButton(session)) {
				// Paused
				buttons.push(
					m(IconButton, {
						title: "resumeMigration_action",
						icon: Icons.PlayOutline,
						size: ButtonSize.Normal,
						disabled: this.imapImportController().shouldDisableButtons(),
						click: () => {
							this.imapImportController()
								.continueImport(accountSyncStateId)
								.catch((e) => {
									//Auth failing errors do not need to bubble up as programming errors.
									if (e.data !== ImapErrorCause.AUTH_FAILED) {
										throw e
									}
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
					disabled: this.imapImportController().shouldDisableButtons(),
					click: () => {
						return Dialog.confirm("migrationCancelConfirm_msg").then((confirmed) => {
							if (confirmed) {
								showProgressDialog("pleaseWait_msg", this.imapImportController().deleteImport(accountSyncStateId))
							}
						})
					},
				}),
			)

			let syncMessage = lang.getTranslation("migrationInProgressInfo_msg", {
				"{completed}": session.syncProgress?.completed.toString() ?? "-",
				"{total}": session.syncProgress?.total.toString() ?? "-",
				"{mailCount}": session.importedMailCount,
			})
			if (this.imapImportController().shouldRenderClockIcon(session)) {
				syncMessage = lang.getTranslation("migrationPostponed_msg", {
					"{provider}": lang.getTranslationText(getTranslationForImapProvider(session.provider)),
					"{postponedUntil}": session.postponedUntil.toLocaleString("en-GB", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					}),
				})
			} else if (this.imapImportController().shouldRenderErrorIcon(session)) {
				syncMessage = lang.getTranslation("migrationSyncFailure_msg")
			}

			const mailboxDetail = assertNotNull(this.imapImportController().getDestinationMailboxDetailForSession(session))
			const destinationTutaMailbox = getMailboxName(mailLocator.logins, mailboxDetail)
			const syncSourceAndDestinationMessage = lang.getTranslation("migrationInProgressAccounts_msg", {
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
							? Icons.FailureFilled
							: this.imapImportController().shouldRenderAuthErrorIcon(session)
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
							m(".text-preline.small", syncMessage.text),
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
		const canceledImapImportUiSessionsForMailGroup = this.imapImportController().canceledImapImportUiSessions.filter(
			(session) => session.mailGroupId === mailboxDetail.mailGroup._id,
		)
		if (canceledImapImportUiSessionsForMailGroup.length <= 0) {
			return null
		}
		return [
			m(".flex-space-between.items-center.mt-4.mb-4", [
				m(".h5", lang.getTranslation("migrationHistory_label").text + mailboxLabel),
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
				this.renderPastSyncSessionsForMailboxCancelledSessions(canceledImapImportUiSessionsForMailGroup),
			),
		]
	}

	private renderPastSyncSessionsForMailboxCancelledSessions(canceledImapImportUiSessionsForMailGroup: ImapImportUiSession[]): Children {
		return canceledImapImportUiSessionsForMailGroup.map((session) => {
			const statusIcon = Icons.Checkmark
			const statusIconParameters: Partial<IconAttrs> = {
				icon: statusIcon,
				class: "",
				style: {
					fill: theme.on_surface,
				},
			}
			const importedMailsMessage = lang.getTranslation("migrationHistoryTotalImportedMails_msg", {
				"{imported}": session.importedMailCount.toString(),
			})
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
						m(".pl-4.pr-32.items-base.flex-column", [
							m(".text-preline.text-ellipsis", session.sourceImapAddress),
							m(".text-preline.small", importedMailsMessage.text),
						]),
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
				label: "migrationStart_action",
				onclick: async () => {
					const userController = mailLocator.logins.getUserController()
					const isNewPaidPlan = await userController.isNewPaidPlan()
					if (!isNewPaidPlan) {
						await showUpgradeWizardOrSwitchSubscriptionDialog(UpgradePromptType.IMPORT, userController)
						return
					} else {
						showAddImapImportWizard(initialImapImportData).then(() => this.imapImportController().updateActiveUiSessions())
					}
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
