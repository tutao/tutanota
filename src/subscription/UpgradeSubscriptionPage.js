// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {SubscriptionSelector} from "./SubscriptionSelector"
import {isApp, isTutanotaDomain} from "../api/common/Env"
import {client} from "../misc/ClientDetector"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {SubscriptionActionButtons, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {SubscriptionType, UpgradePriceType, UpgradeType} from "./SubscriptionUtils"
import {Dialog, DialogType} from "../gui/base/Dialog"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {Keys} from "../api/common/TutanotaConstants"
import {CheckboxN} from "../gui/base/CheckboxN"
import {getSubscriptionPrice} from "./PriceUtils"

export class UpgradeSubscriptionPage implements WizardPageN<UpgradeSubscriptionData> {

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const data = vnode.attrs.data
		const showNextPage = () => {
			emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
		}
		const subscriptionActionButtons: SubscriptionActionButtons = {
			Free: {
				view: () => {
					return m(ButtonN, {
						label: "pricing.select_action",
						click: () => {
							confirmFreeSubscription().then(confirmed => {
								if (confirmed) {
									data.type = SubscriptionType.Free
									data.price = "0"
									data.priceNextYear = "0"
									showNextPage()
								}
							})
						},
						type: ButtonType.Login,
					})
				}
			},
			Premium: createUpgradeButton(data, showNextPage, SubscriptionType.Premium),
			PremiumBusiness: createUpgradeButton(data, showNextPage, SubscriptionType.PremiumBusiness),
			Teams: createUpgradeButton(data, showNextPage, SubscriptionType.Teams),
			TeamsBusiness: createUpgradeButton(data, showNextPage, SubscriptionType.TeamsBusiness),
			Pro: createUpgradeButton(data, showNextPage, SubscriptionType.Pro)
		}
		return m("#upgrade-account-dialog.pt", [
				m(SubscriptionSelector, {
					options: data.options,
					campaignInfoTextId: data.campaignInfoTextId,
					boxWidth: 230,
					boxHeight: 270,
					planPrices: data.planPrices,
					isInitialUpgrade: data.upgradeType !== UpgradeType.Switch,
					currentSubscriptionType: data.currentSubscription,
					currentlySharingOrdered: false,
					currentlyBusinessOrdered: false,
					currentlyWhitelabelOrdered: false,
					orderedContactForms: 0,
					actionButtons: subscriptionActionButtons
				})
			]
		)
	}
}


function createUpgradeButton(data: UpgradeSubscriptionData, showNextPage: () => void, subscriptionType: SubscriptionTypeEnum): MComponent<void> {
	return {
		view: () => {
			return m(ButtonN, {
				label: "pricing.select_action",
				click: () => {
					data.type = subscriptionType
					data.price = String(getSubscriptionPrice(data, subscriptionType, UpgradePriceType.PlanActualPrice))
					let nextYear = String(getSubscriptionPrice(data, subscriptionType, UpgradePriceType.PlanNextYearsPrice))
					data.priceNextYear = (data.price !== nextYear) ? nextYear : null
					showNextPage()
				},
				type: ButtonType.Login,
			})
		}
	}
}

function confirmFreeSubscription(): Promise<boolean> {
	return new Promise(resolve => {
		let oneAccountValue = stream(false)
		let privateUseValue = stream(false)

		const buttons: Array<ButtonAttrs> = [
			{label: "cancel_action", click: () => closeAction(false), type: ButtonType.Secondary},
			{
				label: "ok_action", click: () => {
					if (oneAccountValue() && privateUseValue()) {
						closeAction(true)
					}
				}, type: ButtonType.Primary
			},
		]
		let dialog: Dialog
		const closeAction = confirmed => {
			dialog.close()
			setTimeout(() => resolve(confirmed), DefaultAnimationTime)
		}

		dialog = new Dialog(DialogType.Alert, {
			view: () => [
				// m(".h2.pb", lang.get("confirmFreeAccount_label")),
				m("#dialog-message.dialog-contentButtonsBottom.text-break.text-prewrap.selectable", lang.getMaybeLazy("freeAccountInfo_msg")),
				m(".dialog-contentButtonsBottom", [
					m(CheckboxN, {
						label: () => lang.get("confirmNoOtherFreeAccount_msg"),
						checked: oneAccountValue
					}),
					m(CheckboxN, {
						label: () => lang.get("confirmPrivateUse_msg"),
						checked: privateUseValue
					}),
				]),
				m(".flex-center.dialog-buttons", buttons.map(a => m(ButtonN, a)))
			]
		}).setCloseHandler(() => closeAction(false))
		  .addShortcut({
			  key: Keys.ESC,
			  shift: false,
			  exec: () => closeAction(false),
			  help: "cancel_action"
		  })
		  .addShortcut({
			  key: Keys.RETURN,
			  shift: false,
			  exec: () => closeAction(true),
			  help: "ok_action",
		  })
		  .show()
	})
}

export class UpgradeSubscriptionPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {

	data: UpgradeSubscriptionData

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.data = upgradeData
	}

	headerTitle(): string {
		return lang.get("subscription_label")
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return isTutanotaDomain() && !(isApp() && client.isIos())
	}

}
