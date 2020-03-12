// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {TextField} from "../gui/base/TextField"
import {getPaymentMethodName} from "./PriceUtils"
import {HabReminderImage} from "../gui/base/icons/Icons"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import type {PaidSubscriptionTypeEnum} from "../api/common/TutanotaConstants"
import {AccountType, Const, PaidSubscriptionType} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {serviceRequestVoid} from "../api/main/Entity"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {worker} from "../api/main/WorkerClient"
import {HttpMethod} from "../api/common/EntityFunctions"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {deleteCampaign} from "./UpgradeSubscriptionWizard"
import {BadGatewayError, PreconditionFailedError} from "../api/common/error/RestError"
import {RecoverCodeField} from "../settings/RecoverCodeDialog"
import {logins} from "../api/main/LoginController"
import type {SubscriptionTypeEnum} from "./SubscriptionUtils"
import {formatPrice, getPreconditionFailedPaymentMsg, SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"

export class UpgradeConfirmPage implements WizardPageN<UpgradeSubscriptionData> {
	_orderField: TextField;
	_subscriptionField: TextField;
	_priceField: TextField;
	_priceNextYearField: TextField;
	_paymentMethodField: TextField;

	constructor() {
		this._orderField = new TextField("subscription_label").setDisabled()
		this._subscriptionField = new TextField("subscriptionPeriod_label").setDisabled()
		this._priceField = new TextField(() => lang.get("priceFirstYear_label")).setDisabled()
		this._priceNextYearField = new TextField("priceForNextYear_label").setDisabled()
		this._paymentMethodField = new TextField("paymentMethod_label").setDisabled()
	}

	oncreate(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>) {
		const data = vnode.attrs.data
		this._orderField.setValue(data.type)
		this._subscriptionField.setValue((data.options.paymentInterval() === 12
			? lang.get("pricing.yearly_label")
			: lang.get("pricing.monthly_label")) + ", " + lang.get("automaticRenewal_label"))
		const netOrGross = data.options.businessUse()
			? lang.get("net_label")
			: lang.get("gross_label")
		if (!data.priceNextYear) this._priceField = new TextField(() => lang.get("price_label")).setDisabled()
		this._priceField.setValue(formatPrice(Number(data.price), true) + " "
			+ (data.options.paymentInterval() === 12
				? lang.get("pricing.perYear_label")
				: lang.get("pricing.perMonth_label")) + " (" + netOrGross + ")")
		if (data.priceNextYear) {
			this._priceNextYearField.setValue(formatPrice(Number(data.priceNextYear), true) + " " +
				(data.options.paymentInterval() === 12
					? lang.get("pricing.perYear_label")
					: lang.get("pricing.perMonth_label")) + " (" + netOrGross + ")")
		}

		this._paymentMethodField.setValue(getPaymentMethodName(data.paymentData.paymentMethod))
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>) {
		const a = vnode.attrs
		const newAccountData = a.data.newAccountData

		const upgrade = () => {
			const serviceData = createSwitchAccountTypeData()
			serviceData.accountType = AccountType.PREMIUM
			serviceData.subscriptionType = this._subscriptionTypeToPaidSubscriptionType(a.data.type)
			serviceData.date = Const.CURRENT_DATE
			serviceData.campaign = a.data.campaign
			showProgressDialog("pleaseWait_msg", serviceRequestVoid(SysService.SwitchAccountTypeService, HttpMethod.POST, serviceData)
				.then(() => {
					return worker.switchFreeToPremiumGroup()
				}))
				.then(() => {
					deleteCampaign()
					return this.close(a.data, vnode.dom)
				})
				.catch(PreconditionFailedError, e => {
					Dialog.error(() => lang.get(getPreconditionFailedPaymentMsg(e))
						+ ((a.data.upgradeType === UpgradeType.Signup) ? " "
							+ lang.get("accountWasStillCreated_msg") : ""))
				})
				.catch(BadGatewayError, e => {
					Dialog.error(() => lang.get("paymentProviderNotAvailableError_msg") + ((a.data.upgradeType === UpgradeType.Signup) ? " "
						+ lang.get("accountWasStillCreated_msg") : ""))
				})
		}

		return [
			newAccountData
				? m(".plr-l", [
					m(".center.h4.pt", lang.get("recoveryCode_label")),
					m(RecoverCodeField, {showMessage: true, recoverCode: newAccountData.recoverCode})
				])
				: null,
			a.data.type === SubscriptionType.Free
				? [
					m(".flex-space-around.flex-wrap", [
						m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
							m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {style: {width: "200px"}})),
					]),
					m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(ButtonN, {
						label: "ok_action",
						click: () => this.close(a.data, vnode.dom),
						type: ButtonType.Login,
					})))
				]
				: [
					m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
					m(".flex-space-around.flex-wrap", [
						m(".flex-grow-shrink-half.plr-l", [
							m(this._orderField),
							m(this._subscriptionField),
							m(this._priceField),
							a.data.priceNextYear ? m(this._priceNextYearField) : null,
							m(this._paymentMethodField),
						]),
						m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
							m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {style: {width: "200px"}}))
					]),
					m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(ButtonN, {
						label: "buy_action",
						click: upgrade,
						type: ButtonType.Login,
					})))
				]
		]
	}

	_subscriptionTypeToPaidSubscriptionType(subscriptionType: SubscriptionTypeEnum): PaidSubscriptionTypeEnum {
		if (subscriptionType === SubscriptionType.Premium) {
			return PaidSubscriptionType.Premium
		} else if (subscriptionType === SubscriptionType.Teams) {
			return PaidSubscriptionType.Teams
		} else if (subscriptionType === SubscriptionType.Pro) {
			return PaidSubscriptionType.Pro
		} else {
			throw new Error("not a valid Premium subscription type: " + subscriptionType)
		}
	}

	close(data: UpgradeSubscriptionData, dom: HTMLElement) {
		let promise = Promise.resolve()
		if (data.newAccountData && logins.isUserLoggedIn()) {
			promise = logins.logout(false)
		}
		promise.then(() => {
			emitWizardEvent(dom, WizardEventType.SHOWNEXTPAGE)
		})
	}
}

export class UpgradeConfirmPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {

	data: UpgradeSubscriptionData

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.data = upgradeData
	}

	headerTitle(): string {
		return lang.get("summary_label")
	}

	nextAction(showDialogs: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable() {
		return false
	}

	isEnabled() {
		return true
	}
}




