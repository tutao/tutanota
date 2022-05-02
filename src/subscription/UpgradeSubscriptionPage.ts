import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import stream from "mithril/stream"
import {lang} from "../misc/LanguageViewModel"
import type {SubscriptionParameters, UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {SubscriptionTypeParameter} from "./UpgradeSubscriptionWizard"
import {SubscriptionSelector} from "./SubscriptionSelector"
import {isApp, isTutanotaDomain} from "../api/common/Env"
import {client} from "../misc/ClientDetector"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {SubscriptionActionButtons} from "./SubscriptionUtils"
import {SubscriptionType, UpgradePriceType, UpgradeType} from "./SubscriptionUtils"
import {Dialog, DialogType} from "../gui/base/Dialog"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {Keys} from "../api/common/TutanotaConstants"
import {CheckboxN} from "../gui/base/CheckboxN"
import {getSubscriptionPrice} from "./PriceUtils"

export class UpgradeSubscriptionPage implements WizardPageN<UpgradeSubscriptionData> {
	private _dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>): void {
		this._dom = vnode.dom as HTMLElement
		const subscriptionParameters = vnode.attrs.data.subscriptionParameters

		if (subscriptionParameters && (subscriptionParameters.interval === "12" || subscriptionParameters.interval === "1")) {
			// We automatically route to the next page; when we want to go back from the second page, we do not want to keep calling nextPage
			vnode.attrs.data.subscriptionParameters = null
			vnode.attrs.data.options.paymentInterval = stream(Number(subscriptionParameters.interval))
			this.goToNextPageWithPreselectedSubscription(subscriptionParameters, vnode.attrs.data)
		}
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const data = vnode.attrs.data
		const subscriptionActionButtons: SubscriptionActionButtons = {
			Free: {
				view: () => {
					return m(ButtonN, {
						label: "pricing.select_action",
						click: () => this.selectFree(data),
						type: ButtonType.Login,
					})
				},
			},
			Premium: this.createUpgradeButton(data, SubscriptionType.Premium),
			PremiumBusiness: this.createUpgradeButton(data, SubscriptionType.PremiumBusiness),
			Teams: this.createUpgradeButton(data, SubscriptionType.Teams),
			TeamsBusiness: this.createUpgradeButton(data, SubscriptionType.TeamsBusiness),
			Pro: this.createUpgradeButton(data, SubscriptionType.Pro),
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
				actionButtons: subscriptionActionButtons,
			}),
		])
	}

	selectFree(data: UpgradeSubscriptionData) {
		confirmFreeSubscription().then(confirmed => {
			if (confirmed) {
				data.type = SubscriptionType.Free
				data.price = "0"
				data.priceNextYear = "0"
				this.showNextPage()
			}
		})
	}

	showNextPage(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.SHOWNEXTPAGE)
		}
	}

	goToNextPageWithPreselectedSubscription(subscriptionParameters: SubscriptionParameters, data: UpgradeSubscriptionData): void {
		if (subscriptionParameters.type === "private") {
			// we have to individually change the data so that when returning we show the chose subscription type (private/business) | false = private, true = business
			data.options.businessUse(false)

			switch (subscriptionParameters.subscription) {
				case SubscriptionTypeParameter.FREE:
					this.selectFree(data)
					break

				case SubscriptionTypeParameter.PREMIUM:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.Premium)
					break

				case SubscriptionTypeParameter.TEAMS:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.Teams)
					break

				default:
					console.log("Unknown subscription passed: ", subscriptionParameters)
					break
			}
		} else if (subscriptionParameters.type === "business") {
			data.options.businessUse(true)

			switch (subscriptionParameters.subscription) {
				case SubscriptionTypeParameter.PREMIUM:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.PremiumBusiness)
					break

				case SubscriptionTypeParameter.TEAMS:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.TeamsBusiness)
					break

				case SubscriptionTypeParameter.PRO:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.Pro)
					break

				default:
					console.log("Unknown subscription passed: ", subscriptionParameters)
					break
			}
		} else {
			console.log("Unknown subscription type passed: ", subscriptionParameters)
		}
	}

	setNonFreeDataAndGoToNextPage(data: UpgradeSubscriptionData, subscriptionType: SubscriptionType): void {
		data.type = subscriptionType
		data.price = String(getSubscriptionPrice(data, data.type, UpgradePriceType.PlanActualPrice))
		let nextYear = String(getSubscriptionPrice(data, data.type, UpgradePriceType.PlanNextYearsPrice))
		data.priceNextYear = data.price !== nextYear ? nextYear : null
		this.showNextPage()
	}

	createUpgradeButton(data: UpgradeSubscriptionData, subscriptionType: SubscriptionType): Component {
		return {
			view: () => {
				return m(ButtonN, {
					label: "pricing.select_action",
					click: () => this.setNonFreeDataAndGoToNextPage(data, subscriptionType),
					type: ButtonType.Login,
				})
			},
		}
	}
}

function confirmFreeSubscription(): Promise<boolean> {
	return new Promise(resolve => {
		let oneAccountValue = stream(false)
		let privateUseValue = stream(false)
		const buttons: Array<ButtonAttrs> = [
			{
				label: "cancel_action",
				click: () => closeAction(false),
				type: ButtonType.Secondary,
			},
			{
				label: "ok_action",
				click: () => {
					if (oneAccountValue() && privateUseValue()) {
						closeAction(true)
					}
				},
				type: ButtonType.Primary,
			},
		]
		let dialog: Dialog

		const closeAction = (confirmed: boolean) => {
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
						checked: oneAccountValue(),
						onChecked: oneAccountValue,
					}),
					m(CheckboxN, {
						label: () => lang.get("confirmPrivateUse_msg"),
						checked: privateUseValue(),
						onChecked: privateUseValue,
					}),
				]),
				m(
					".flex-center.dialog-buttons",
					buttons.map(a => m(ButtonN, a)),
				),
			],
		})
			.setCloseHandler(() => closeAction(false))
			.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: () => closeAction(false),
				help: "cancel_action",
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
	subscriptionType: string | null = null

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