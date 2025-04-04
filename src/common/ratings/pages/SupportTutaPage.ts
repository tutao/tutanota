import m, { Children, Component, VnodeDOM } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { ImageWithOptionsDialog } from "../../gui/dialogs/ImageWithOptionsDialog.js"
import { client } from "../../misc/ClientDetector.js"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { locator } from "../../api/main/CommonLocator.js"
import { LegacyPrivatePlans, PlanType } from "../../api/common/TutanotaConstants.js"
import { showUpgradeDialog } from "../../gui/nav/NavFunctions.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { progressIcon } from "../../gui/base/Icon.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { completeSupportTutaStage, SupportTutaButtonType } from "../UserSatisfactionUtils.js"
import { px } from "../../gui/size.js"
import { neverNull } from "@tutao/tutanota-utils"

interface SupportTutaPageAttrs {
	dialog: Dialog
}

export class SupportTutaPage implements Component<SupportTutaPageAttrs> {
	private currentPlan: PlanType | null = null
	private dialog: Dialog | null = null

	async oncreate(vnode: VnodeDOM<SupportTutaPageAttrs>) {
		this.currentPlan = await this.getCurrentPlan()
		this.dialog = vnode.attrs.dialog
		m.redraw()
	}

	view(): Children {
		if (!this.currentPlan) {
			return m(
				".full-width.full-height.flex.justify-center.items-center.flex-column",
				m(".flex-center", progressIcon()),
				m("p.m-0.mt-s.text-center", lang.getTranslationText("loading_msg")),
			)
		}

		return m(ImageWithOptionsDialog, {
			image: `${window.tutao.appState.prefixWithoutFile}/images/rating/support-tuta-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
			imageStyle: { maxWidth: px(320) },
			titleText: "ratingSupportTuta_title",
			messageText: "ratingSupportTuta_msg",
			mainActionText: this.getMainAction().langKey,
			mainActionClick: () => {
				const mainAction = this.getMainAction()
				completeSupportTutaStage(mainAction.buttonType, this.currentPlan!)
				mainAction.onClick()
			},
			subActionText: this.getSubAction()?.langKey ?? null,
			subActionClick: () => {
				const subAction = this.getSubAction()
				if (!subAction) return
				completeSupportTutaStage(subAction.buttonType, this.currentPlan!)
				subAction.onClick()
			},
		})
	}

	private getMainAction(): Action {
		if (this.currentPlan === PlanType.Free || LegacyPrivatePlans.includes(neverNull(this.currentPlan))) {
			return {
				buttonType: "Upgrade",
				langKey: "ratingUpgrade_label", // "Upgrade & Support Us"
				onClick: () => {
					this.dialog?.close()
					void showUpgradeDialog()
				},
			}
		} else if (this.currentPlan === PlanType.Revolutionary) {
			return {
				buttonType: "Upgrade",
				langKey: "ratingUpgradeFromRevo_label", // "Become a Legend"
				onClick: () => {
					this.dialog?.close()
					void showUpgradeDialog()
				},
			}
		} else if (this.currentPlan === PlanType.Legend) {
			return {
				buttonType: "Refer",
				langKey: "referralSettings_label",
				onClick: () => {
					this.dialog?.close()
					m.route.set("/settings/referral")
				},
			}
		}

		throw new Error("Unsupported plan type. Expected Free, Revolutionary, Legend or any personal legacy plan. Got " + this.currentPlan)
	}

	private getSubAction(): Action | undefined {
		if (this.currentPlan === PlanType.Legend) {
			return undefined
		} else if (this.currentPlan === PlanType.Free) {
			return {
				buttonType: "Donate",
				langKey: "donate_action",
				onClick: () => {
					this.dialog?.close()
					windowFacade.openLink(`${locator.domainConfigProvider().getCurrentDomainConfig().websiteBaseUrl}/community#donate`)
				},
			}
		} else if (this.currentPlan === PlanType.Revolutionary || LegacyPrivatePlans.includes(neverNull(this.currentPlan))) {
			return {
				buttonType: "Refer",
				langKey: "referralSettings_label",
				onClick: () => {
					this.dialog?.close()
					m.route.set("/settings/referral")
				},
			}
		}

		throw new Error("Unsupported plan type. Expected Free, Revolutionary, Legend or any personal legacy plan. Got " + this.currentPlan)
	}

	private async getCurrentPlan() {
		return await locator.logins.getUserController().getPlanType()
	}
}

type Action = { buttonType: SupportTutaButtonType; langKey: TranslationKeyType; onClick: VoidFunction }
