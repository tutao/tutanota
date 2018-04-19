// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {TextField} from "../gui/base/TextField"
import {Button, ButtonType} from "../gui/base/Button"
import {getPaymentMethodName} from "./PriceUtils"
import {HabReminderImage} from "../gui/base/icons/Icons"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import {Const, AccountType} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {serviceRequestVoid} from "../api/main/Entity"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {worker} from "../api/main/WorkerClient"
import {HttpMethod} from "../api/common/EntityFunctions"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import type {UpgradeAccountTypeData} from "./UpgradeAccountTypeWizard"


export class UpgradeConfirmPage implements WizardPage<UpgradeAccountTypeData> {

	view: Function;
	_pageActionHandler: WizardPageActionHandler<UpgradeAccountTypeData>;
	_upgradeData: UpgradeAccountTypeData;
	_orderField: TextField;
	_subscriptionField: TextField;
	_priceField: TextField;
	_paymentMethodField: TextField;

	constructor(data: UpgradeAccountTypeData) {
		this._orderField = new TextField("bookingOrder_label").setDisabled()
		this._subscriptionField = new TextField("subscription_label").setDisabled()
		this._priceField = new TextField("price_label").setDisabled()
		this._paymentMethodField = new TextField("paymentMethod_label").setDisabled()

		this.updateWizardData(data)


		let confirmButton = new Button("buy_action", () => {
			const serviceData = createSwitchAccountTypeData()
			serviceData.accountType = AccountType.PREMIUM
			// serviceData.proUpgrade = subscriptionOptions.proUpgrade
			serviceData.date = Const.CURRENT_DATE
			showProgressDialog("upgradeToPremium_action", serviceRequestVoid(SysService.SwitchAccountTypeService, HttpMethod.POST, serviceData).then(() => {
				return worker.switchFreeToPremiumGroup()
			})).then(() => {
				this._pageActionHandler.showNext(this._upgradeData)
			}).catch(PreconditionFailedError => {
				Dialog.error("paymentProviderTransactionFailedError_msg")
			}).catch(BadGatewayError => {
				Dialog.error("paymentProviderNotAvailableError_msg")
			})
		}).setType(ButtonType.Login)

		this.view = () => [
			m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			m(".flex-space-around.flex-wrap", [
				m(".flex-grow-shrink-half.plr-l", [
					m(this._orderField),
					m(this._subscriptionField),
					m(this._priceField),
					m(this._paymentMethodField),
				]),
				m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
					m("img[src=" + HabReminderImage + "].pt", {style: {width: "200px"}}))
			]),
			m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(confirmButton)))]
	}

	headerTitle(): string {
		return lang.get("bookingSummary_label")
	}

	nextAction(): Promise<?UpgradeAccountTypeData> {
		// next action not available for this page
		return Promise.resolve(null)
	}

	isNextAvailable() {
		return false
	}

	setPageActionHandler(handler: WizardPageActionHandler<UpgradeAccountTypeData>) {
		this._pageActionHandler = handler
	}

	updateWizardData(wizardData: UpgradeAccountTypeData) {
		this._upgradeData = wizardData
		this._orderField.setValue("Tutanota Premium" + (this._upgradeData.subscriptionOptions.proUpgrade ? " (Pro)" : ""))
		this._subscriptionField.setValue((this._upgradeData.subscriptionOptions.paymentInterval == 12 ? lang.get("yearly_label") : lang.get("monthly_label")) + ", " + lang.get("automaticRenewal_label"))
		const netOrGross = this._upgradeData.subscriptionOptions.businessUse ? lang.get("net_label") : lang.get("gross_label")
		this._priceField.setValue(this._upgradeData.price + " " + (this._upgradeData.subscriptionOptions.paymentInterval == 12 ? lang.get("perYear_label") : lang.get("perMonth_label")) + " (" + netOrGross + ")")
		this._paymentMethodField.setValue(getPaymentMethodName(this._upgradeData.paymentData.paymentMethod))
	}

	getUncheckedWizardData(): UpgradeAccountTypeData {
		return this._upgradeData
	}
}




