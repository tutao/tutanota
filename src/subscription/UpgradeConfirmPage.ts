import m, {Children, Vnode, VnodeDOM} from "mithril"
import stream from "mithril/stream"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {formatPriceWithInfo, getPaymentMethodName, isYearlyPayment} from "./PriceUtils"
import {HabReminderImage} from "../gui/base/icons/Icons"
import {createSwitchAccountTypeData} from "../api/entities/sys/TypeRefs.js"
import {AccountType, Const, PaidSubscriptionType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {HttpMethod} from "../api/common/EntityFunctions"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {BadGatewayError, PreconditionFailedError} from "../api/common/error/RestError"
import {RecoverCodeField} from "../settings/RecoverCodeDialog"
import {logins} from "../api/main/LoginController"
import type {SubscriptionOptions} from "./SubscriptionUtils"
import {getDisplayNameOfSubscriptionType, getPreconditionFailedPaymentMsg, SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ofClass} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"
import {deleteCampaign} from "../misc/LoginUtils"
import {SwitchAccountTypeService} from "../api/entities/sys/Services"

export class UpgradeConfirmPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view({attrs}: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const {newAccountData} = attrs.data

		return [
			newAccountData
				? m(".plr-l", [
					m(".center.h4.pt", lang.get("recoveryCode_label")),
					m(RecoverCodeField, {
						showMessage: true,
						recoverCode: newAccountData.recoverCode,
					}),
				])
				: null,
			attrs.data.type === SubscriptionType.Free
				? this.renderFree(attrs)
				: this.renderPaid(attrs),
		]
	}

	private upgrade(data: UpgradeSubscriptionData) {
		const serviceData = createSwitchAccountTypeData({
			accountType: AccountType.PREMIUM,
			subscriptionType: this.subscriptionTypeToPaidSubscriptionType(data.type),
			date: Const.CURRENT_DATE,
			campaign: data.campaign,
		})
		showProgressDialog(
			"pleaseWait_msg",
			locator.serviceExecutor.post(SwitchAccountTypeService, serviceData).then(() => {
				return locator.customerFacade.switchFreeToPremiumGroup()
			}),
		)
			.then(() => {
				deleteCampaign()
				return this.close(data, this.dom)
			})
			.catch(ofClass(PreconditionFailedError, e => {
					Dialog.message(
						() =>
							lang.get(getPreconditionFailedPaymentMsg(e.data)) +
							(data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
					)
				}),
			)
			.catch(ofClass(BadGatewayError, e => {
					Dialog.message(
						() =>
							lang.get("paymentProviderNotAvailableError_msg") +
							(data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
					)
				}),
			)
	}

	private renderPaid(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		const isYearly = isYearlyPayment(attrs.data.options.paymentInterval())
		const subscription = (isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label"))

		return [
			m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			m(".flex-space-around.flex-wrap", [
				m(".flex-grow-shrink-half.plr-l", [
					m(TextFieldN, {
						label: "subscription_label",
						value: getDisplayNameOfSubscriptionType(attrs.data.type),
						disabled: true,
					}),
					m(TextFieldN, {
						label: "paymentInterval_label",
						value: subscription,
						disabled: true,
					}),
					m(TextFieldN, {
						label: isYearly ? "priceFirstYear_label" : "price_label",
						value: buildPriceString(attrs.data.price, attrs.data.options),
						disabled: true,
					}),
					this.renderPriceNextYear(attrs),
					m(TextFieldN, {
						label: "paymentMethod_label",
						value: getPaymentMethodName(attrs.data.paymentData.paymentMethod),
						disabled: true,
					}),
				]),
				m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
					m("img.pt.bg-white.border-radius", {
						src: HabReminderImage,
						style: {
							width: "200px",
						},
					}),
				),
			]),
			m(".smaller.center.pt-l",
				attrs.data.options.businessUse()
					? lang.get("subscriptionPeriodInfoBusiness_msg")
					: lang.get("subscriptionPeriodInfoPrivate_msg")
			),
			m(".flex-center.full-width.pt-l",
				m("", {
						style: {
							width: "260px",
						},
					},
					m(ButtonN, {
						label: "buy_action",
						click: () => this.upgrade(attrs.data),
						type: ButtonType.Login,
					}),
				),
			),
		]
	}

	private renderPriceNextYear(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		return attrs.data.priceNextYear
			? m(TextFieldN, {
				label: "priceForNextYear_label",
				value: buildPriceString(attrs.data.priceNextYear, attrs.data.options),
				disabled: true,
			})
			: null
	}

	private renderFree(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		return [
			m(".flex-space-around.flex-wrap", [
				m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
					m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {
						style: {
							width: "200px",
						},
					}),
				),
			]),
			m(".flex-center.full-width.pt-l",
				m("", {
						style: {
							width: "260px",
						},
					},
					m(ButtonN, {
						label: "ok_action",
						click: () => this.close(attrs.data, this.dom),
						type: ButtonType.Login,
					}),
				),
			),
		]
	}

	private subscriptionTypeToPaidSubscriptionType(subscriptionType: SubscriptionType): PaidSubscriptionType {
		switch (subscriptionType) {
			case SubscriptionType.Premium:
				return PaidSubscriptionType.Premium
			case SubscriptionType.PremiumBusiness:
				return PaidSubscriptionType.Premium_Business
			case SubscriptionType.Teams:
				return PaidSubscriptionType.Teams
			case SubscriptionType.TeamsBusiness:
				return PaidSubscriptionType.Teams_Business
			case SubscriptionType.Pro:
				return PaidSubscriptionType.Pro
			default:
				throw new Error("not a valid Premium subscription type: " + subscriptionType)
		}
	}

	private close(data: UpgradeSubscriptionData, dom: HTMLElement) {
		let promise = Promise.resolve()

		if (data.newAccountData && logins.isUserLoggedIn()) {
			promise = logins.logout(false)
		}

		promise.then(() => {
			emitWizardEvent(dom, WizardEventType.SHOWNEXTPAGE)
		})
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