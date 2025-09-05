import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { ImageWithOptionsDialog } from "../../gui/dialogs/ImageWithOptionsDialog.js"
import { client } from "../../misc/ClientDetector.js"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { locator } from "../../api/main/CommonLocator.js"
import { LegacyPrivatePlans, NewPaidPlans, PlanType } from "../../api/common/TutanotaConstants.js"
import { showUpgradeDialog } from "../../gui/nav/NavFunctions.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { progressIcon } from "../../gui/base/Icon.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { completeSupportTutaStage, SupportTutaButtonType } from "../UserSatisfactionUtils.js"
import { px } from "../../gui/size.js"
import { assertNotNull, last, neverNull } from "@tutao/tutanota-utils"
import { BookingTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { GENERATED_MAX_ID } from "../../api/common/utils/EntityUtils.js"
import { getReferralLink, ReferralLinkViewer } from "../../misc/news/items/ReferralLinkViewer"

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

	view(vnode: Vnode<SupportTutaPageAttrs>): Children {
		if (!this.currentPlan) {
			return m(
				".full-width.full-height.flex.justify-center.items-center.flex-column",
				m(".flex-center", progressIcon()),
				m("p.m-0.mt-8.text-center", lang.getTranslationText("loading_msg")),
			)
		}

		return m(ImageWithOptionsDialog, {
			image: `${window.tutao.appState.prefixWithoutFile}/images/rating/support-tuta-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
			imageStyle: { maxWidth: px(320) },
			titleText: "ratingSupportTuta_title",
			messageText: "ratingSupportTuta_msg",
			mainActionText: this.getMainAction(vnode.attrs).langKey,
			mainActionClick: () => {
				const mainAction = this.getMainAction(vnode.attrs)
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

	private getMainAction(attrs: SupportTutaPageAttrs): Action {
		if (this.currentPlan === PlanType.Free || LegacyPrivatePlans.includes(neverNull(this.currentPlan))) {
			return {
				buttonType: "Upgrade",
				langKey: "ratingUpgrade_label", // "Upgrade & Support Us"
				onClick: () => {
					this.dialog?.close()

					if (LegacyPrivatePlans.includes(neverNull(this.currentPlan))) {
						void this.showSwitchDialog()
					} else {
						void showUpgradeDialog(true)
					}
				},
			}
		} else if (this.currentPlan === PlanType.Revolutionary) {
			return {
				buttonType: "Upgrade",
				langKey: "ratingUpgradeFromRevo_label", // "Become a Legend"
				onClick: () => {
					this.dialog?.close()
					void this.showSwitchDialog()
				},
			}
		} else if (this.currentPlan === PlanType.Legend) {
			return {
				buttonType: "Refer",
				langKey: "referralSettings_label",
				onClick: () => {
					this.dialog?.close()
					void this.showReferralLinkDialog()
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
					void this.showReferralLinkDialog()
				},
			}
		}

		throw new Error("Unsupported plan type. Expected Free, Revolutionary, Legend or any personal legacy plan. Got " + this.currentPlan)
	}

	private async getCurrentPlan() {
		return await locator.logins.getUserController().getPlanType()
	}

	/**
	 * Open the paid-to-paid subscription switch dialog.
	 * This function calls the showSwitchDialog function from the SwitchSubscriptionDialog, passing the current customer and accounting info.
	 */
	private async showSwitchDialog(): Promise<void> {
		const userController = locator.logins.getUserController()
		const customerInfo = await userController.loadCustomerInfo()
		const customer = await userController.loadCustomer()
		const accountingInfo = await userController.loadAccountingInfo()
		const bookings = await locator.entityClient.loadRange(BookingTypeRef, assertNotNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
		const lastBooking = last(bookings)

		const { showSwitchDialog } = await import("../../subscription/SwitchSubscriptionDialog.js")
		await showSwitchDialog({ customer, accountingInfo, lastBooking: assertNotNull(lastBooking), acceptedPlans: NewPaidPlans, reason: null })
	}

	private async showReferralLinkDialog(): Promise<void> {
		const userController = locator.logins.getUserController()
		const referralLink = await getReferralLink(userController, true)

		Dialog.showActionDialog({
			title: "referralSettings_label",
			type: DialogType.EditMedium,
			child: () => m(".pt-16", m(ReferralLinkViewer, { referralLink })),
			allowOkWithReturn: false,
			okAction: (dialog: Dialog) => {
				dialog.close()
			},
			okActionTextId: "done_action",
			allowCancel: false,
		})
	}
}

type Action = { buttonType: SupportTutaButtonType; langKey: TranslationKeyType; onClick: VoidFunction }
