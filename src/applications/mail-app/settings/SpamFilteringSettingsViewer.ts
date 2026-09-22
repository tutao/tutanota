import { EnvProvider } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import { mailLocator } from "../mailLocator"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import m, { Children } from "mithril"
import type { MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { MenuTitle } from "../../../ui/titles/MenuTitle"
import { Card } from "../../../ui/base/Card"
import { Switch } from "../../../ui/base/Switch"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { MailboxPropertiesTypeRef } from "@tutao/entities/tutanota"
import { px, size } from "../../../ui/size"
import { showRetrainSpamFilterDialog } from "./RetrainSpamFilterDialog"
import { SpamFilterBehavior } from "../mail/model/SpamClassificationHandler"

EnvProvider.assertMainOrNode()

export class SpamFilteringSettingsViewer implements UpdatableSettingsViewer {
	private spamFilterBehavior: string = SpamFilterBehavior.DEFAULT

	constructor(
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
	) {
		this.init().then(() => m.redraw())
	}

	private async init(): Promise<void> {
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxGroupRoot)
		this.spamFilterBehavior = mailboxProperties.spamFilterBehavior || SpamFilterBehavior.DEFAULT
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, [null, update.instanceId])
				this.spamFilterBehavior = mailboxProperties.spamFilterBehavior || SpamFilterBehavior.DEFAULT
			}
		}
		m.redraw()
	}

	view(): Children {
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
						subTitle: "",
					}),
					m(".mt-24", m(MenuTitle, { content: lang.get("spamFiltering_label") })),
					this.renderStrictModeSwitch(),
					this.renderRetrainSpamFilterButton(),
				],
			),
		])
	}

	private renderRetrainSpamFilterButton() {
		return m("", [
			m(
				".mt-16.flex.justify-end",
				m(PrimaryButton, {
					label: "retrainSpamFilter_action",
					width: "flex",
					onclick: () => this.confirmRetrainSpamFilter(),
				}),
			),
			m("small.mt-12", lang.getTranslationText("retrainSpamFilter_msg")),
		])
	}

	private async confirmRetrainSpamFilter(): Promise<void> {
		const choice = await showRetrainSpamFilterDialog()
		if (choice === "retrain") {
			await showProgressDialog("retrainingSpamFilter_msg", mailLocator.spamClassifier.retrainAllModels())
		}
	}

	private renderStrictModeSwitch() {
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
						ariaLabel: "toggleSpamStrictMode_label",
						checked: this.spamFilterBehavior === SpamFilterBehavior.STRICT,
						onclick: async (checked: boolean) => {
							await this.updateSpamFilterBehavior(checked ? SpamFilterBehavior.STRICT : SpamFilterBehavior.DEFAULT)
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

	private async updateSpamFilterBehavior(newBehavior: SpamFilterBehavior): Promise<void> {
		this.spamFilterBehavior = newBehavior
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxGroupRoot)

		mailboxProperties.spamFilterBehavior = newBehavior
		await this.entityClient.update(mailboxProperties)
	}
}
