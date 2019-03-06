// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import {SubscriptionSelector} from "./SubscriptionSelector"
import {isApp, isTutanotaDomain} from "../api/Env"
import {client} from "../misc/ClientDetector"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {SubscriptionTypeEnum} from "./SubscriptionUtils"
import {getUpgradePrice, SubscriptionType, UpgradePriceType} from "./SubscriptionUtils"
import {Dialog} from "../gui/base/Dialog"

export class UpgradeSubscriptionPage implements WizardPage<UpgradeSubscriptionData> {
	view: Function;
	_pageActionHandler: WizardPageActionHandler<UpgradeSubscriptionData>;
	_upgradeData: UpgradeSubscriptionData;

	constructor(upgradeData: UpgradeSubscriptionData, currentSubscription: ?SubscriptionTypeEnum) {
		this._upgradeData = upgradeData
		this.view = () => m("#upgrade-account-dialog.pt", [
				m(SubscriptionSelector, {
					options: this._upgradeData.options,
					campaignInfoTextId: upgradeData.campaignInfoTextId,
					boxWidth: 230,
					boxHeight: 250,
					highlightPremium: true,
					premiumPrices: upgradeData.premiumPrices,
					proPrices: upgradeData.proPrices,
					isInitialUpgrade: upgradeData.isInitialUpgrade,
					currentlyActive: currentSubscription,
					freeActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									Dialog.confirm("signupOneFreeAccountConfirm_msg").then(confirmed => {
										if (confirmed) {
											this._upgradeData.type = SubscriptionType.Free
											this._upgradeData.price = "0"
											this._upgradeData.priceNextYear = "0"
											this._pageActionHandler.showNext(this._upgradeData)
										}
									})
								},
								type: ButtonType.Login,
							})
						}
					},
					premiumActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									this._upgradeData.type = SubscriptionType.Premium
									this._upgradeData.price = String(getUpgradePrice(upgradeData, true, UpgradePriceType.PlanActualPrice))
									let nextYear = String(getUpgradePrice(upgradeData, true, UpgradePriceType.PlanNextYearsPrice))
									this._upgradeData.priceNextYear = (this._upgradeData.price !== nextYear) ? nextYear : null
									this._pageActionHandler.showNext(this._upgradeData)
								},
								type: ButtonType.Login,
							})
						}
					},
					proActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									this._upgradeData.type = SubscriptionType.Pro
									this._upgradeData.price = String(getUpgradePrice(upgradeData, false, UpgradePriceType.PlanActualPrice))
									let nextYear = String(getUpgradePrice(upgradeData, false, UpgradePriceType.PlanNextYearsPrice))
									this._upgradeData.priceNextYear = (this._upgradeData.price !== nextYear) ? nextYear : null
									this._pageActionHandler.showNext(this._upgradeData)
								},
								type: ButtonType.Login,
							})
						}
					}
				})
			]
		)
	}


	headerTitle(): string {
		return lang.get("subscription_label")
	}

	nextAction(): Promise<?UpgradeSubscriptionData> {
		// next action not available for this page
		return Promise.resolve(null)
	}

	isNextAvailable() {
		return false
	}

	setPageActionHandler(handler: WizardPageActionHandler<UpgradeSubscriptionData>) {
		this._pageActionHandler = handler
	}

	updateWizardData(wizardData: UpgradeSubscriptionData) {
		this._upgradeData = wizardData
	}

	getUncheckedWizardData(): UpgradeSubscriptionData {
		return this._upgradeData
	}

	isEnabled(data: UpgradeSubscriptionData) {
		return isTutanotaDomain() && !(isApp() && client.isIos())
	}

}