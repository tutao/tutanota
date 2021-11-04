// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {formatPriceWithInfo, getPaymentMethodName, isYearlyPayment} from "./PriceUtils"
import {HabReminderImage} from "../gui/base/icons/Icons"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import type {PaidSubscriptionTypeEnum} from "../api/common/TutanotaConstants"
import {AccountType, Const, PaidSubscriptionType} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {serviceRequestVoid} from "../api/main/Entity"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {HttpMethod} from "../api/common/EntityFunctions"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {deleteCampaign} from "./UpgradeSubscriptionWizard"
import {BadGatewayError, PreconditionFailedError} from "../api/common/error/RestError"
import {RecoverCodeField} from "../settings/RecoverCodeDialog"
import {logins} from "../api/main/LoginController"
import type {SubscriptionOptions, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {getDisplayNameOfSubscriptionType, getPreconditionFailedPaymentMsg, SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ofClass} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"

export class UpgradeConfirmPage implements WizardPageN<UpgradeSubscriptionData> {
	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const attrs = vnode.attrs
		const isYearly = isYearlyPayment(attrs.data.options.paymentInterval())
		const newAccountData = attrs.data.newAccountData

		const orderFieldAttrs = {
			label: "subscription_label",
			value: stream(getDisplayNameOfSubscriptionType(attrs.data.type)),
			disabled: true,
		}

		const subscription = (isYearly
			? lang.get("pricing.yearly_label")
			: lang.get("pricing.monthly_label")) + ", " + lang.get("automaticRenewal_label")
		const subscriptionFieldAttrs = {
			label: "subscriptionPeriod_label",
			value: stream(subscription),
			disabled: true,
		}

		const priceFieldAttrs = {
			label: isYearly ? "priceFirstYear_label" : "price_label",
			value: stream(buildPriceString(attrs.data.price, attrs.data.options)),
			disabled: true,
		}

		const paymentMethodFieldAttrs = {
			label: "paymentMethod_label",
			value: stream(getPaymentMethodName(attrs.data.paymentData.paymentMethod)),
			disabled: true,
		}

		const upgrade = () => {
			const serviceData = createSwitchAccountTypeData()
			serviceData.accountType = AccountType.PREMIUM
			serviceData.subscriptionType = this._subscriptionTypeToPaidSubscriptionType(attrs.data.type)
			serviceData.date = Const.CURRENT_DATE
			serviceData.campaign = attrs.data.campaign
			showProgressDialog("pleaseWait_msg", serviceRequestVoid(SysService.SwitchAccountTypeService, HttpMethod.POST, serviceData)
				.then(() => {
					return locator.customerFacade.switchFreeToPremiumGroup()
				}))
				.then(() => {
					deleteCampaign()
					return this.close(attrs.data, vnode.dom)
				})
				.catch(ofClass(PreconditionFailedError, e => {
					Dialog.error(() => lang.get(getPreconditionFailedPaymentMsg(e.data))
						+ ((attrs.data.upgradeType === UpgradeType.Signup) ? " "
							+ lang.get("accountWasStillCreated_msg") : ""))
				}))
				.catch(ofClass(BadGatewayError, e => {
					Dialog.error(() =>
						lang.get("paymentProviderNotAvailableError_msg") +
						((attrs.data.upgradeType === UpgradeType.Signup) ? " " + lang.get("accountWasStillCreated_msg") : "")
					)
				}))
		}

		return [
			newAccountData
				? m(".plr-l", [
					m(".center.h4.pt", lang.get("recoveryCode_label")),
					m(RecoverCodeField, {showMessage: true, recoverCode: newAccountData.recoverCode})
				])
				: null,
			attrs.data.type === SubscriptionType.Free
				? [
					m(".flex-space-around.flex-wrap", [
						m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
							m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {style: {width: "200px"}})),
					]),
					m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(ButtonN, {
						label: "ok_action",
						click: () => this.close(attrs.data, vnode.dom),
						type: ButtonType.Login,
					})))
				]
				: [
					m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
					m(".flex-space-around.flex-wrap", [
						m(".flex-grow-shrink-half.plr-l", [
							m(TextFieldN, orderFieldAttrs),
							m(TextFieldN, subscriptionFieldAttrs),
							m(TextFieldN, priceFieldAttrs),
							attrs.data.priceNextYear ? m(TextFieldN, this._createPriceNextYearFieldAttrs(attrs.data.priceNextYear, attrs.data.options)) : null,
							m(TextFieldN, paymentMethodFieldAttrs),
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
		} else if (subscriptionType === SubscriptionType.PremiumBusiness) {
			return PaidSubscriptionType.Premium_Business
		} else if (subscriptionType === SubscriptionType.Teams) {
			return PaidSubscriptionType.Teams
		} else if (subscriptionType === SubscriptionType.TeamsBusiness) {
			return PaidSubscriptionType.Teams_Business
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

	_createPriceNextYearFieldAttrs(price: NumberString, options: SubscriptionOptions): TextFieldAttrs {
		return {
			label: "priceForNextYear_label",
			value: stream(buildPriceString(price, options)),
			disabled: true,
		}
	}
}

function buildPriceString(price: NumberString, options: SubscriptionOptions): string {
	return formatPriceWithInfo(Number(price), options.paymentInterval(), !options.businessUse())
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

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}




