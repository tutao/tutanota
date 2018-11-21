// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../misc/LanguageViewModel"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import {SubscriptionSelector} from "./SubscriptionSelector"
import {AccountType} from "../api/common/TutanotaConstants"


export class UpgradeSubscriptionPage implements WizardPage<UpgradeSubscriptionData> {
	view: Function;
	_businessUse: Stream<SegmentControlItem<boolean>>;
	_pageActionHandler: WizardPageActionHandler<UpgradeSubscriptionData>;
	_upgradeData: UpgradeSubscriptionData;
	_selector: SubscriptionSelector;


	constructor(upgradeData: UpgradeSubscriptionData) {
		this._upgradeData = upgradeData

		const freeHandler = () => this._pageActionHandler.cancel()
		const createPremiumProHandler = (proUpgrade: boolean) => {
			return () => {
				let upgradeBox = proUpgrade ? this._selector._proUpgradeBox : this._selector._premiumUpgradeBox
				this._upgradeData.subscriptionOptions = {
					businessUse: this._businessUse().value,
					paymentInterval: upgradeBox.paymentInterval().value
				}
				this._upgradeData.proUpgrade = proUpgrade
				this._upgradeData.price = upgradeBox.buyOptionBox.price()
				this._upgradeData.originalPrice = upgradeBox.buyOptionBox.originalPrice()
				this._pageActionHandler.showNext(this._upgradeData)
			}
		}

		let businessUseItems = [
			{name: lang.get("privateUse_label"), value: false},
			{name: lang.get("businessUse_label"), value: true}
		]
		this._businessUse = stream(businessUseItems[0])
		this._selector = new SubscriptionSelector(AccountType.FREE, freeHandler, createPremiumProHandler(false), createPremiumProHandler(true), this._businessUse.map(business => business.value ? true : false))

		let privateBusinesUseControl = new SegmentControl(businessUseItems, this._businessUse).setSelectionChangedHandler(businessUseItem => {
			this._businessUse(businessUseItem)
		})

		this.view = () => m("#upgrade-account-dialog.pt", [
				m(privateBusinesUseControl),
				m(this._selector)
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

}