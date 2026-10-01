import m, { Children } from "mithril"
import { showAddMigrationWizard } from "./AddMigrationWizard.js"
import { EnvProvider, UpgradePromptType } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { MailboxMigrationUiSession, MailboxMigrationController } from "./MailboxMigrationController.js"
import { mailLocator } from "../../mailLocator.js"
import { theme } from "../../../../ui/theme"
import { TitleSection } from "../../../../ui/TitleSection.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { MailboxMigrationSyncStateTypeRef, MailboxMigrationFolderSyncStateTypeRef } from "@tutao/entities/tutanota"
import { Icon, IconAttrs, IconSize } from "../../../../ui/base/Icon"
import { Card } from "../../../../ui/base/Card"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { lazy } from "@tutao/utils"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { Dialog } from "../../../../ui/base/Dialog"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { IconButton } from "../../../../ui/base/IconButton"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { BannerType, InfoBanner } from "../../../../ui/base/InfoBanner"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { ExpanderButton, ExpanderPanel } from "../../../../ui/base/Expander"
import { getTranslationForMigrationProvider, MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { MigrationErrorCause } from "../../../common/api/common/error/MigrationError"
import { MailboxMigrationSyncStatus } from "../../../../entities/tutanota/Utils"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../../common/misc/SubscriptionDialogs"
import { elementIdToId, isSameSingleId } from "@tutao/meta"

EnvProvider.assertMainOrNode()

class MigrationSettingsViewer implements UpdatableSettingsViewer {
	private mailboxIdToImportHistoryExpanded: Map<Id, boolean> = new Map<Id, boolean>()

	constructor(private readonly mailboxMigrationController: lazy<MailboxMigrationController>) {}

	async oninit() {
		await this.mailboxMigrationController().initUiSessions()

		const mailboxDetails = this.mailboxMigrationController().mailboxDetails
		if (mailboxDetails) {
			const isSingleMailbox = mailboxDetails.length === 1
			for (const detail of mailboxDetails) {
				this.mailboxIdToImportHistoryExpanded.set(elementIdToId(detail.mailbox._id), isSingleMailbox)
			}
		}
	}

	view(): Children {
		const hasActiveSync = this.mailboxMigrationController().hasActiveSync()
		const hasCanceledSync = this.mailboxMigrationController().hasCanceledSync()
		return m(
			".fill-absolute.scroll.plr-24.pb-48.scrollbar-gutter-stable-or-fallback",
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
				hasCanceledSync ? this.renderMigrationImportHistories() : null,
			],
		)
	}

	private renderTitleSection(): Children {
		return m("", [
			m(TitleSection, {
				icon: Icons.DownloadFilled,
				title: lang.getTranslationText("migration_title"),
				subTitle: lang.getTranslationText("migrationInfo_msg"),
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
		const activeMigrationUiSessions = this.mailboxMigrationController().activeMigrationUiSessions
		return activeMigrationUiSessions.map((session) => {
			const buttons: Children[] = []

			const accountSyncStateId = session.mailboxMigrationSyncStateId
			if (this.mailboxMigrationController().shouldRenderPauseButton(session)) {
				// Running
				buttons.push(
					m(IconButton, {
						label: "pauseMigration_action",
						icon: Icons.PauseOutline,
						size: ButtonSize.Normal,
						disabled: this.mailboxMigrationController().shouldDisableButtons(),
						click: () => {
							this.mailboxMigrationController().pauseImport(accountSyncStateId)
						},
					}),
				)
			} else if (this.mailboxMigrationController().shouldRenderResyncButton(session)) {
				// Finished or Postponed
				buttons.push(
					m(IconButton, {
						label: "resyncMigration_action",
						icon: Icons.Refresh,
						size: ButtonSize.Normal,
						disabled: this.mailboxMigrationController().shouldDisableButtons(),
						click: () => {
							if (session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.AUTH_ERROR) {
								//We already know how to handle auth state errors so we prommpt the user for the update on a resync
								this.mailboxMigrationController().promptUpdateMigrationCredentialsDialog(accountSyncStateId)
							} else {
								this.mailboxMigrationController()
									.continueImport(accountSyncStateId, true)
									.catch((e) => {
										// Auth failing errors do not need to bubble up as programming errors.
										if (e.data?.cause !== MigrationErrorCause.AUTH_FAILED) {
											throw e
										}
									})
							}
						},
					}),
				)
			} else if (this.mailboxMigrationController().shouldRenderPlayButton(session)) {
				// Paused
				buttons.push(
					m(IconButton, {
						label: "resumeMigration_action",
						icon: Icons.PlayOutline,
						size: ButtonSize.Normal,
						disabled: this.mailboxMigrationController().shouldDisableButtons(),
						click: () => {
							this.mailboxMigrationController()
								.continueImport(accountSyncStateId)
								.catch((e) => {
									// Auth failing errors do not need to bubble up as programming errors.
									if (e.data?.cause !== MigrationErrorCause.AUTH_FAILED) {
										throw e
									}
								})
						},
					}),
				)
			}
			buttons.push(
				m(IconButton, {
					label: "cancel_action",
					icon: Icons.X,
					size: ButtonSize.Normal,
					disabled: this.mailboxMigrationController().shouldDisableButtons(),
					click: () => {
						return Dialog.confirm("migrationCancelConfirm_msg").then((confirmed) => {
							if (confirmed) {
								showProgressDialog("pleaseWait_msg", this.mailboxMigrationController().deleteImport(accountSyncStateId))
							}
						})
					},
				}),
			)

			let syncMessage = lang.getTranslation(
				session.provider === MailboxMigrationProvider.Gmail ? "migrationInProgressInfoGmail_msg" : "migrationInProgressInfo_msg",
				{
					"{completed}": session.syncProgress?.completed.toString() ?? "-",
					"{total}": session.syncProgress?.total.toString() ?? "-",
					"{mailCount}": session.importedMailCount,
				},
			)

			if (this.mailboxMigrationController().shouldRenderPlayButton(session)) {
				syncMessage = lang.getTranslation("migrationPausedProgressInfo_msg", { "{mailCount}": session.importedMailCount })
			} else if (this.mailboxMigrationController().shouldRenderClockIcon(session)) {
				syncMessage = lang.getTranslation("migrationPostponed_msg", {
					"{provider}": lang.getTranslationText(getTranslationForMigrationProvider(session.provider)),
					"{postponedUntil}": session.postponedUntil.toLocaleString("en-GB", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					}),
				})
			} else if (this.mailboxMigrationController().shouldRenderErrorIcon(session)) {
				syncMessage = this.mailboxMigrationController().shouldRenderGmailAllMailsIMAPDisabledErrorMessage(session)
					? lang.getTranslation("migrationSyncStateGmailAllMailsDisabledImapError_msg")
					: lang.getTranslation("migrationSyncFailure_msg")
			}

			const mailboxDetail = this.mailboxMigrationController().getDestinationMailboxDetailForSession(session)
			const destinationTutaMailbox = mailboxDetail ? getMailboxName(mailLocator.logins, mailboxDetail) : ""
			const syncSourceAndDestinationMessage = lang.getTranslation("migrationInProgressAccounts_msg", {
				"{sourceAddress}": session.username,
				"{tutaMailbox}": destinationTutaMailbox,
			})

			const statusIcon = this.mailboxMigrationController().shouldRenderPauseIcon(session)
				? Icons.PauseOutline
				: this.mailboxMigrationController().shouldRenderClockIcon(session)
					? Icons.ClockOutlines
					: this.mailboxMigrationController().shouldRenderCheckmarkIcon(session)
						? Icons.Checkmark
						: this.mailboxMigrationController().shouldRenderErrorIcon(session)
							? Icons.FailureFilled
							: this.mailboxMigrationController().shouldRenderAuthErrorIcon(session)
								? Icons.SyncProblem
								: Icons.Sync
			const iconFill =
				statusIcon === Icons.Checkmark
					? theme.success
					: statusIcon === Icons.PauseOutline
						? theme.warning
						: statusIcon === Icons.SyncProblem || statusIcon === Icons.FailureFilled
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
						m(".items-base.flex-column", [m(".text-preline", syncSourceAndDestinationMessage.text), m(".text-preline.small", syncMessage.text)]),
					]),
					m(".flex.ml-16.items-center", buttons),
				]),
			)
		})
	}

	private renderMigrationImportHistories() {
		const mailboxDetails = this.mailboxMigrationController().mailboxDetails
		if (mailboxDetails) {
			return m(
				"mt-16.mb-16",
				mailboxDetails.map((details) => this.renderMigrationHistory(details, mailboxDetails.length <= 1)),
			)
		}
		return null
	}

	private renderMigrationHistory(mailboxDetail: MailboxDetail, isSingleMailbox: boolean) {
		const mailboxLabel = isSingleMailbox ? "" : " · " + getMailboxName(mailLocator.logins, mailboxDetail)
		const mailboxId = elementIdToId(mailboxDetail.mailbox._id)
		const canceledMigrationUiSessionsForMailGroup = this.mailboxMigrationController().canceledMigrationUiSessions.filter((session) =>
			isSameSingleId(session.mailGroupId, elementIdToId(mailboxDetail.mailGroup._id)),
		)
		if (canceledMigrationUiSessionsForMailGroup.length <= 0) {
			return null
		}
		return [
			m(".flex-space-between.items-center.mt-4.mb-4", [
				m(MenuTitle, { content: lang.getTranslation("migrationHistory_label").text + mailboxLabel }),
				m(ExpanderButton, {
					label: "show_action",
					style: { "padding-top": "0px" },
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
				this.renderPastSyncSessionsForMailboxCancelledSessions(canceledMigrationUiSessionsForMailGroup),
			),
		]
	}

	private renderPastSyncSessionsForMailboxCancelledSessions(canceledMigrationUiSessionsForMailGroup: MailboxMigrationUiSession[]): Children {
		return canceledMigrationUiSessionsForMailGroup.map((session) => {
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
							m(".text-preline.text-ellipsis", session.username),
							m(".text-preline.small", importedMailsMessage.text),
						]),
					]),
				]),
			)
		})
	}

	private renderButton(): Children {
		const initialMigrationData = this.mailboxMigrationController().getInitialMigrationData()
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
						showAddMigrationWizard(initialMigrationData).then(() => this.mailboxMigrationController().updateActiveUiSessions())
					}
				},
			}),
		)
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxMigrationSyncStateTypeRef, update) || isUpdateForTypeRef(MailboxMigrationFolderSyncStateTypeRef, update)) {
				await this.mailboxMigrationController().updateActiveUiSessions()
			}
		}
	}
}

export default MigrationSettingsViewer
