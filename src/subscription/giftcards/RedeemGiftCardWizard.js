//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import type {WizardPageAttrs, WizardPageN} from "../../gui/base/WizardDialogN"
import {createWizardDialog, emitWizardEvent, WizardEventType, WizardPageWrapper} from "../../gui/base/WizardDialogN"
import {logins, SessionType} from "../../api/main/LoginController"
import type {NewAccountData} from "../UpgradeSubscriptionWizard"
import {loadUpgradePrices} from "../UpgradeSubscriptionWizard"
import {Dialog} from "../../gui/base/Dialog"
import {LoginForm} from "../../login/LoginForm"
import type {CredentialsSelectorAttrs} from "../../login/CredentialsSelector"
import {CredentialsSelector} from "../../login/CredentialsSelector"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {SignupFormAttrs} from "../SignupForm"
import {SignupForm} from "../SignupForm"
import {NotAuthorizedError} from "../../api/common/error/RestError"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import {locator} from "../../api/main/MainLocator"
import {AccountingInfoTypeRef} from "../../api/entities/sys/AccountingInfo"
import type {GiftCardRedeemGetReturn} from "../../api/entities/sys/GiftCardRedeemGetReturn"
import {redeemGiftCard, renderAcceptGiftCardTermsCheckbox, renderGiftCardSvg,} from "./GiftCardUtils"
import {CancelledError} from "../../api/common/error/CancelledError"
import {lang} from "../../misc/LanguageViewModel"
import {getLoginErrorMessage} from "../../misc/LoginUtils"
import {RecoverCodeField} from "../../settings/RecoverCodeDialog"
import {HabReminderImage} from "../../gui/base/icons/Icons"
import {getPaymentMethodType, PaymentMethodType} from "../../api/common/TutanotaConstants"
import type {SubscriptionData, SubscriptionPlanPrices} from "../SubscriptionUtils"
import {SubscriptionType, UpgradePriceType} from "../SubscriptionUtils"
import {formatPrice, getPaymentMethodName, getSubscriptionPrice} from "../PriceUtils"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {getByAbbreviation} from "../../api/common/CountryList"
import {isSameId} from "../../api/common/utils/EntityUtils"
import {ofClass} from "@tutao/tutanota-utils"
import type {CredentialsInfo} from "../../misc/credentials/CredentialsProvider"

type GetCredentialsMethod = "login" | "signup"

type RedeemGiftCardWizardData = {
	mailAddress: Stream<string>,
	giftCardInfo: GiftCardRedeemGetReturn,

	credentialsMethod: GetCredentialsMethod,
	newAccountData: Stream<?NewAccountData>,

	key: string,

	premiumPrice: number
}

type GiftCardRedeemAttrs = WizardPageAttrs<RedeemGiftCardWizardData>

/**
 * This page gives the user the option to either signup or login to an account with which to redeem their gift card.
 */
class GiftCardWelcomePage implements WizardPageN<RedeemGiftCardWizardData> {
	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const a = vnode.attrs

		const nextPage = (method: GetCredentialsMethod) => {
			logins.logout(false).then(() => {
				a.data.credentialsMethod = method
				emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
			})
		}

		let message = a.data.giftCardInfo.message

		return [
			m(".flex-center.full-width.pt-l",
				m("", {style: {width: "480px"}},
					m(".pt-l", renderGiftCardSvg(
						parseFloat(a.data.giftCardInfo.value),
						neverNull(getByAbbreviation(a.data.giftCardInfo.country)),
						/*link=*/null,
						message
					)),
				)
			),
			m(".flex-center.full-width.pt-l",
				m("", {style: {width: "260px"}},
					m(ButtonN, {
						label: "existingAccount_label",
						click: () => nextPage("login"),
						type: ButtonType.Login
					})
				)
			),
			m(".flex-center.full-width.pt-l.pb-m",
				m("", {style: {width: "260px"}},
					m(ButtonN, {
						label: "register_label",
						click: () => nextPage("signup"),
						type: ButtonType.Login
					})
				))
		]
	}
}


/**
 * This page will either show a signup or login form depending on how they choose to select their credentials
 * When they go to the next page the will be logged in.
 */
class GiftCardCredentialsPage implements WizardPageN<RedeemGiftCardWizardData> {
	_domElement: HTMLElement
	_loginFormHelpText: string
	+_password: Stream<string>
	_storedCredentials: Array<CredentialsInfo>

	constructor() {
		this._loginFormHelpText = lang.get("emptyString_msg")
		this._password = stream("")
		this._storedCredentials = []
		locator.credentialsProvider.getInternalCredentialsInfos().then((credentials) => {
			this._storedCredentials = credentials
			m.redraw()
		})
	}

	oncreate(vnode: Vnode<GiftCardRedeemAttrs>) {
		this._domElement = vnode.dom
	}

	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const data = vnode.attrs.data
		switch (data.credentialsMethod) {
			case "login":
				return this._renderLoginPage(data)
			case "signup":
				return this._renderSignupPage(data)
		}
	}

	onremove() {
		this._password("")
	}

	_renderLoginPage(data: RedeemGiftCardWizardData): Children {
		const loginFormAttrs = {
			onSubmit: (mailAddress, password) => {
				if (mailAddress === "" || password === "") {
					this._loginFormHelpText = lang.get("loginFailed_msg")
				} else {
					const loginPromise =
						logins.logout(false)
						      .then(() => logins.createSession(mailAddress, password, SessionType.Temporary))
						      .then(() => this._postLogin())
						      .catch(e => { this._loginFormHelpText = lang.getMaybeLazy(getLoginErrorMessage(e, false))})
					// If they try to login with a mail address that is stored, we want to swap out the old session with a new one
					showProgressDialog("pleaseWait_msg", loginPromise)
				}
			},
			mailAddress: data.mailAddress,
			password: this._password,
			helpText: this._loginFormHelpText
		}

		const onCredentialsSelected = encryptedCredentials => {
			// If the user is logged in already (because they selected credentials and then went back) we dont have to do
			// anything, so just move on
			if (logins.isUserLoggedIn() && isSameId(logins.getUserController().user._id, encryptedCredentials.userId)) {
				this._postLogin()
			} else {
				showProgressDialog("pleaseWait_msg",
					logins.logout(false)
					      .then(async () => {
						      const credentials = await locator.credentialsProvider.getCredentialsByUserId(encryptedCredentials.userId)
						      if (credentials) {
							      await logins.resumeSession(credentials)
						      }
					      })
					      .then(() => this._postLogin())
					      .catch(ofClass(NotAuthorizedError, e => {
						      Dialog.error("savedCredentialsError_msg")
					      }))
				)

			}
		}


		const credentialsSelectorAttrs: CredentialsSelectorAttrs = {
			credentials: this._storedCredentials,
			onCredentialsSelected,
		}

		return [
			m(".flex-grow.flex-center.scroll", m(".flex-grow-shrink-auto.max-width-s.pt.plr-l", [
					m(LoginForm, loginFormAttrs),
					this._storedCredentials.length > 0
						? m(CredentialsSelector, credentialsSelectorAttrs)
						: null
				])
			)
		]
	}

	_renderSignupPage(data: RedeemGiftCardWizardData): Children {
		const existingAccountData = data.newAccountData()
		const isReadOnly = existingAccountData != null
		const signupFormAttrs: SignupFormAttrs = {
			// After having an account created we log them in to be in the same state as if they had selected an existing account
			newSignupHandler: newAccountData => {
				if (newAccountData || existingAccountData) {
					// if there's an existing account it means the signup form was readonly
					// because we came back from the next page after having already signed up
					if (!existingAccountData) {
						data.newAccountData(newAccountData)
					}
					const {mailAddress, password, recoverCode} = neverNull(newAccountData || existingAccountData)
					this._password(password)
					data.mailAddress(mailAddress)
					logins.createSession(mailAddress, password, SessionType.Temporary)
					      .then(() => {
						      emitWizardEvent(this._domElement, WizardEventType.SHOWNEXTPAGE)
						      m.redraw()
					      })
					      .catch(e => {
						      // TODO when would login fail here and how does it get handled? can we attempt to login again?
						      Dialog.error("giftCardLoginError_msg")
						      m.route.set("/login", {noAutoLogin: true})
					      })
				}
			},
			readonly: isReadOnly,
			prefilledMailAddress: existingAccountData ? existingAccountData.mailAddress : "",
			isBusinessUse: () => false,
			isPaidSubscription: () => false,
			campaign: () => null
		}

		return m(SignupForm, signupFormAttrs)
	}

	_postLogin(): Promise<void> {
		return Promise.resolve()
		              .then(() => {
			              if (!logins.getUserController().isGlobalAdmin()) throw new UserError("onlyAccountAdminFeature_msg");
		              })
		              .then(() => logins.getUserController().loadCustomer())
		              .then(customer => {
			              return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			                            .then(customerInfo => locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			                            .then(accountingInfo => {
				                            if (customer.businessUse || accountingInfo.business) {
					                            throw new UserError("onlyPrivateAccountFeature_msg");
				                            }
			                            })
		              })
		              .then(() => {
			              emitWizardEvent(this._domElement, WizardEventType.SHOWNEXTPAGE)
		              })
		              .catch(ofClass(UserError, showUserError))
	}
}


class RedeemGiftCardPage implements WizardPageN<RedeemGiftCardWizardData> {
	isConfirmed: Stream<boolean>
	paymentMethod: string

	constructor() {
		this.isConfirmed = stream(false)

		this.paymentMethod = ""
		logins.getUserController().loadAccountingInfo().then(accountingInfo => {
			this.paymentMethod = accountingInfo.paymentMethod
				? getPaymentMethodName(getPaymentMethodType(accountingInfo))
				: getPaymentMethodName(PaymentMethodType.AccountBalance)
			m.redraw()
		})
	}

	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const data = vnode.attrs.data

		const wasFree = logins.getUserController().isFreeAccount()
		const confirmButtonAttrs = {
			label: "redeem_label",
			click: () => {
				if (!this.isConfirmed()) {
					Dialog.error("termsAcceptedNeutral_msg")
					return
				}
				redeemGiftCard(data.giftCardInfo.giftCard, data.key, data.giftCardInfo.country, Dialog.confirm)
					.then(() => emitWizardEvent(vnode.dom, WizardEventType.CLOSEDIALOG))
					.catch(ofClass(UserError, showUserError))
					.catch(ofClass(CancelledError, noOp))
			},
			type: ButtonType.Login
		}

		return m("", [
			data.newAccountData()
				? m(".pt-l.plr-l",
					m(RecoverCodeField, {showMessage: true, recoverCode: neverNull(data.newAccountData()).recoverCode}))
				: null,
			wasFree ? [
					m(".pt-l.plr-l",
						`${lang.get("giftCardUpgradeNotify_msg", {
							"{price}": formatPrice(data.premiumPrice, true),
							"{credit}": formatPrice(Number(data.giftCardInfo.value) - data.premiumPrice, true)
						})} ${lang.get("creditUsageOptions_msg")}`
					),
					m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
					m(".flex-space-around.flex-wrap", [
						m(".flex-grow-shrink-half.plr-l", [
							m(TextFieldN, {label: "subscription_label", value: () => "Premium", disabled: true}),
							m(TextFieldN, {
								label: "subscriptionPeriod_label",
								value: () => `${lang.get("pricing.yearly_label")}, ${lang.get("automaticRenewal_label")}`,
								disabled: true
							}),
							m(TextFieldN, {
								label: "price_label",
								value: () => formatPrice(Number(data.premiumPrice), true) + " " + lang.get("pricing.perYear_label"),
								disabled: true
							}),
							m(TextFieldN, {label: "paymentMethod_label", value: () => this.paymentMethod, disabled: true})
						]),
						m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
							m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {style: {width: "200px"}}))
					])
				]
				: [
					m(".pt-l.plr-l.flex-center",
						`${lang.get("giftCardCreditNotify_msg", {"{credit}": formatPrice(Number(data.giftCardInfo.value), true)})} ${lang.get("creditUsageOptions_msg")}`
					),
					m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
						m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {style: {width: "200px"}}))
				],
			m(".flex-center.full-width.pt-l", m("", {style: {maxWidth: "620px"}}, renderAcceptGiftCardTermsCheckbox(this.isConfirmed))),
			m(".flex-center.full-width.pt-s.pb", m("", {style: {width: "260px"}}, m(ButtonN, confirmButtonAttrs)))
		])
	}


}


export function loadRedeemGiftCardWizard(giftCardInfo: GiftCardRedeemGetReturn, key: string): Promise<Dialog> {
	return loadUpgradePrices().then(prices => {

		const priceData: SubscriptionPlanPrices = {
			Premium: prices.premiumPrices,
			PremiumBusiness: prices.premiumBusinessPrices,
			Teams: prices.teamsPrices,
			TeamsBusiness: prices.teamsBusinessPrices,
			Pro: prices.proPrices
		}
		const subscriptionData: SubscriptionData = {
			options: {
				businessUse: () => false,
				paymentInterval: () => 12
			},
			planPrices: priceData
		}

		const giftCardRedeemData: RedeemGiftCardWizardData = {
			newAccountData: stream(null),
			mailAddress: stream(""),
			credentialsMethod: "signup",
			giftCardInfo: giftCardInfo,
			credentials: stream(null),
			key,
			premiumPrice: getSubscriptionPrice(subscriptionData, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)
		}

		const wizardPages = [
			new WizardPageWrapper(GiftCardWelcomePage, {
				data: giftCardRedeemData,
				headerTitle: () => lang.get("giftCard_label"),
				nextAction: (_) => Promise.resolve(true),
				isSkipAvailable: () => false,
				isEnabled: () => true
			}),
			new WizardPageWrapper(GiftCardCredentialsPage, {
				data: giftCardRedeemData,
				headerTitle: () => lang.get(giftCardRedeemData.credentialsMethod === "signup" ? "register_label" : "login_label"),
				nextAction: (showErrorDialog: boolean) => Promise.resolve(true),
				isSkipAvailable: () => false,
				isEnabled: () => true
			}),
			new WizardPageWrapper(RedeemGiftCardPage, {
				data: giftCardRedeemData,
				headerTitle: () => lang.get("redeem_label"),
				nextAction: (_) => Promise.resolve(true),
				isSkipAvailable: () => false,
				isEnabled: () => true
			}),
		]
		return createWizardDialog(giftCardRedeemData, wizardPages,
			() => {
				const urlParams = giftCardRedeemData.credentialsMethod === "signup"
					? {loginWith: giftCardRedeemData.mailAddress()}
					: {}
				return Promise.resolve(m.route.set("/login", urlParams))
			}).dialog
	})
}
