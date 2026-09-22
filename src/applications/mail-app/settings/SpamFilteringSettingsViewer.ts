import { EnvProvider } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import { mailLocator } from "../mailLocator"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import m, { Children } from "mithril"
import type { MailboxDetail, MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { MenuTitle } from "../../../ui/titles/MenuTitle"
import { Card } from "../../../ui/base/Card"
import { ExpanderButton, ExpanderPanel } from "../../../ui/base/Expander"
import { Switch } from "../../../ui/base/Switch"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { MailboxProperties, MailboxPropertiesTypeRef } from "@tutao/entities/tutanota"
import { px, size } from "../../../ui/size"
import { showRetrainSpamFilterDialog } from "./RetrainSpamFilterDialog"
import { getMailboxName, isUserMailbox } from "../../common/mailFunctionality/SharedMailUtils"
import { elementIdToId, idToElementId, isSameId } from "@tutao/meta"
import { formatDateTime } from "../../../ui/utils/Formatter"
import { SpamFilterBehavior } from "../mail/model/SpamClassificationHandler"
import { pMap } from "@tutao/utils"

EnvProvider.assertMainOrNode()

type MailboxSpamSettings = {
	mailboxDetail: MailboxDetail
	mailboxProperties: MailboxProperties
	expanded: boolean
}

export class SpamFilteringSettingsViewer implements UpdatableSettingsViewer {
	private mailboxSpamSettings: MailboxSpamSettings[] = []
	private lastFullTrainingTime: number | null = null

	constructor(
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
	) {
		this.init().then(() => m.redraw())
	}

	private async init(): Promise<void> {
		const mailboxDetails = await this.mailboxModel.getMailboxDetails()
		const mailboxSpamSettings = await pMap(mailboxDetails, async (mailboxDetail) => ({
			mailboxDetail,
			mailboxProperties: await this.mailboxModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot),
			expanded: true,
		}))
		// the user's own mailbox first, shared mailboxSpamSettings below
		this.mailboxSpamSettings = [
			...mailboxSpamSettings.filter((mailbox) => isUserMailbox(mailbox.mailboxDetail)),
			...mailboxSpamSettings.filter((mailbox) => !isUserMailbox(mailbox.mailboxDetail)),
		]

		await this.loadLastTrainedTime()
	}

	private async loadLastTrainedTime(): Promise<void> {
		// We only display the training date of the user mailbox.
		const { mailGroup } = await this.mailboxModel.getUserMailboxDetails()
		this.lastFullTrainingTime = await mailLocator.spamClassifier.getLastTrainedFromScratchTime(elementIdToId(mailGroup._id))
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, idToElementId(update.instanceId))
				const mailboxSpamSettingsEntry = this.mailboxSpamSettings.find((mailbox) => isSameId(mailbox.mailboxProperties._id, mailboxProperties._id))
				if (mailboxSpamSettingsEntry) {
					mailboxSpamSettingsEntry.mailboxProperties = mailboxProperties
				}
			}
		}
		m.redraw()
	}

	view(): Children {
		const isSingleMailbox = this.mailboxSpamSettings.length <= 1
		return m("", [
			m(
				".fill-absolute.plr-24.pb-48.overflow-y-scroll-inbox-rules.scrollbar-gutter-stable-or-fallback",
				{
					style: {
						backgroundColor: theme.surface_container,
					},
				},
				[
					m(TitleSection, {
						icon: Icons.BugOutline,
						title: lang.getTranslationText("spamFiltering_label"),
						subTitle: m.trust(lang.getTranslationText("spamFilteringSettingsInfo_msg")),
					}),
					this.mailboxSpamSettings.map((mailbox) => this.renderMailboxSection(mailbox, isSingleMailbox)),
					this.renderRetrainSpamFilterButton(),
				],
			),
		])
	}

	private renderRetrainSpamFilterButton() {
		return m(".mt-32", [
			m(
				".flex.justify-end",
				m(PrimaryButton, {
					label: "retrainSpamFilter_action",
					width: "flex",
					onclick: () => this.confirmRetrainSpamFilter(),
				}),
			),
			this.lastFullTrainingTime != null
				? m(
						".small.mt-12.right",
						lang.getTranslationText("spamFilterLastRetrained_msg").replace("{date}", formatDateTime(new Date(this.lastFullTrainingTime))),
					)
				: null,
		])
	}

	private async confirmRetrainSpamFilter(): Promise<void> {
		const choice = await showRetrainSpamFilterDialog()
		if (choice === "retrain") {
			await showProgressDialog("retrainingSpamFilter_msg", mailLocator.spamClassifier.retrainAllModels())
			await this.loadLastTrainedTime()
			m.redraw()
		}
	}

	private renderMailboxSection(mailbox: MailboxSpamSettings, isSingleMailbox: boolean) {
		const mailboxLabel = isSingleMailbox ? "" : " · " + getMailboxName(mailLocator.logins, mailbox.mailboxDetail)
		return [
			m(".flex-space-between.items-center.mt-24", [
				m(MenuTitle, { content: lang.getTranslationText("strictSpamFiltering_label") + mailboxLabel }),
				isSingleMailbox
					? null
					: m(ExpanderButton, {
							label: "show_action",
							style: { paddingTop: "0" }, // top padding 0 to align with title
							expanded: mailbox.expanded,
							onExpandedChange: (expanded) => (mailbox.expanded = expanded),
						}),
			]),
			m(ExpanderPanel, { expanded: isSingleMailbox || mailbox.expanded }, this.renderStrictModeSwitch(mailbox)),
		]
	}

	private renderStrictModeSwitch({ mailboxProperties }: MailboxSpamSettings) {
		return m(
			Card,
			{
				style: {
					marginTop: px(size.spacing_16),
					display: "flex",
					flexDirection: "column",
					alignItems: "stretch",
					paddingLeft: px(size.spacing_16),
					paddingRight: px(size.spacing_16),
				},
			},
			[
				m(".flex.row.gap-24.items-center.justify-between", [
					m("label.text-ellipsis.noselect.z1.pr-4", lang.getTranslationText("toggleSpamStrictMode_label")),
					m(Switch, {
						ariaLabel: lang.getTranslationText("toggleSpamStrictMode_label"),
						checked: mailboxProperties.spamFilterBehavior === SpamFilterBehavior.STRICT,
						onclick: async (checked: boolean) => {
							mailboxProperties.spamFilterBehavior = checked ? SpamFilterBehavior.STRICT : SpamFilterBehavior.DEFAULT
							await this.entityClient.update(mailboxProperties)
							m.redraw()
						},
					}),
				]),
				m(
					"small.mt-12",
					lang.getTranslation("toggleSpamStrictMode_msg", {
						"{mailAuthMissing}": lang.getTranslationText("mailAuthMissing_label"),
					}).text,
				),
			],
		)
	}
}
