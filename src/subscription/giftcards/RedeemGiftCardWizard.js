//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {neverNull, noOp} from "../../api/common/utils/Utils"
import type {WizardPageAttrs, WizardPageN} from "../../gui/base/WizardDialogN"
import {createWizardDialog, emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {logins} from "../../api/main/LoginController"
import type {NewAccountData} from "../UpgradeSubscriptionWizard"
import {loadUpgradePrices} from "../UpgradeSubscriptionWizard"
import {Dialog} from "../../gui/base/Dialog"
import {LoginForm} from "../../login/LoginForm"
import type {CredentialsSelectorAttrs} from "../../login/CredentialsSelector"
import {CredentialsSelector} from "../../login/CredentialsSelector"
import {deviceConfig} from "../../misc/DeviceConfig"
import {showProgressDialog} from "../../gui/base/ProgressDialog"
import {worker} from "../../api/main/WorkerClient"
import {client} from "../../misc/ClientDetector"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {SignupFormAttrs} from "../../api/main/SignupForm"
import {SignupForm} from "../../api/main/SignupForm"
import {NotAuthorizedError} from "../../api/common/error/RestError"
import {isSameId} from "../../api/common/EntityFunctions"
import {UserError} from "../../api/common/error/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import {locator} from "../../api/main/MainLocator"
import {AccountingInfoTypeRef} from "../../api/entities/sys/AccountingInfo"
import type {GiftCardRedeemGetReturn} from "../../api/entities/sys/GiftCardRedeemGetReturn"
import {
	redeemGiftCard,
	renderAcceptGiftCardTermsCheckbox, renderGiftCardSvg,
} from "./GiftCardUtils"
import {CancelledError} from "../../api/common/error/CancelledError"
import {lang} from "../../misc/LanguageViewModel"
import {getLoginErrorMessage} from "../../misc/LoginUtils"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {RecoverCodeField} from "../../settings/RecoverCodeDialog"
import {HabReminderImage} from "../../gui/base/icons/Icons"
import {BookingItemFeatureType} from "../../api/common/TutanotaConstants"
import {formatPrice} from "../SubscriptionUtils"

type GetCredentialsMethod = "login" | "signup"

type RedeemGiftCardWizardData = {
	mailAddress: Stream<string>,
	password: Stream<string>,
	giftCardInfo: GiftCardRedeemGetReturn,

	credentialsMethod: GetCredentialsMethod,
	credentials: Stream<?Credentials>,
	newAccountData: Stream<?NewAccountData>
}

type GiftCardRedeemAttrs = WizardPageAttrs<RedeemGiftCardWizardData>

// This page gives the user the option to either signup or login to an account with which to redeem their gift card
class GiftCardWelcomePage implements WizardPageN<RedeemGiftCardWizardData> {

	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const a = vnode.attrs

		const nextPage = (method: GetCredentialsMethod) => {
			logins.logout(false).then(() => {
				a.data.credentialsMethod = method
				emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
			})
		}

		return [
			m(".flex-center.full-width.pt-l",
				m("", {style: {width: "480px"}},
					[
						m(".flex-center.full-width.pt-l.editor-border.noprint",
							m(".pt-s.pb-s", {style: {width: "260px"}},
								m.trust(htmlSanitizer.sanitize(a.data.giftCardInfo.message, true).text),
							),
						),
						m(".pt-l", renderGiftCardSvg(parseFloat(a.data.giftCardInfo.value), null)),
					])
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

// This page will either show a signup or login form depending on how they choose to select their credentials
// When they go to the next page the will be logged in
class GiftCardCredentialsPage implements WizardPageN<RedeemGiftCardWizardData> {

	_domElement: HTMLElement
	_loginFormHelpText: string

	oninit() {
		this._loginFormHelpText = lang.get("emptyString_msg")
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

	_renderLoginPage(data: RedeemGiftCardWizardData): Children {
		const loginFormAttrs = {
			onSubmit: (mailAddress, password) => {
				if (mailAddress === "" || password === "") {
					this._loginFormHelpText = lang.get("loginFailed_msg")
				} else {
					const loginPromise =
						logins.logout(false)
						      .then(() => logins.createSession(mailAddress, password, client.getIdentifier(), false, false))
						      .then(credentials => this._postLogin(data, credentials))
						      .catch(e => { this._loginFormHelpText = lang.get(getLoginErrorMessage(e))})
					// If they try to login with a mail address that is stored, we want to swap out the old session with a new one
					showProgressDialog("pleaseWait_msg", loginPromise)
				}
			},
			mailAddress: data.mailAddress,
			password: data.password,
			helpText: () => this._loginFormHelpText
		}

		const onCredentialsSelected = credentials => {

			// If the user is loggedin already (because they selected credentials and then went back) we dont have to do
			// anthing, so just move on
			if (logins.isUserLoggedIn() && isSameId(logins.getUserController().user._id, credentials.userId)) {
				this._postLogin(data, credentials)
			} else {
				showProgressDialog("pleaseWait_msg", worker.initialized.then(() => {
					logins.logout(false)
					      .then(() => logins.resumeSession(credentials))
					      .then(() => this._postLogin(data, credentials))
					      .catch(NotAuthorizedError, e => {
						      Dialog.error("savedCredentialsError_msg")
					      })
				}))

			}
		}

		const credentials = deviceConfig.getAllInternal()
		const credentialsSelectorAttrs: CredentialsSelectorAttrs = {
			credentials: () => credentials,
			isDeleteCredentials: stream(false),
			onCredentialsSelected,
			onCredentialsDelete: noOp
		}

		return [
			m(".flex-grow.flex-center.scroll", m(".flex-grow-shrink-auto.max-width-s.pt.plr-l",
				m(LoginForm, loginFormAttrs),
				credentials.length > 0
					? m(CredentialsSelector, credentialsSelectorAttrs)
					: null
				)
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
					data.password(password)
					data.mailAddress(mailAddress)
					logins.createSession(mailAddress, password, client.getIdentifier(), false, false)
					      .then(credentials => {
						      data.credentials(credentials)
						      emitWizardEvent(this._domElement, WizardEventType.SHOWNEXTPAGE)
						      m.redraw()
					      })
					      .catch(e => {
						      // TODO when would login fail here and how does it get handled? can we attempt to login again?
						      throw e
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

	_postLogin(data: RedeemGiftCardWizardData, credentials: Credentials): Promise<void> {
		data.credentials(credentials)
		return Promise.resolve()
		              .then(() => {
			              if (!logins.getUserController().isGlobalAdmin()) throw new UserError("onlyAccountAdminFeature_msg");
		              })
		              .then(() => logins.getUserController().loadCustomer())
		              .then(customer => {
			              return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			                            .then(customerInfo => locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			                            .then(accountingInfo => {
				                            if (customer.businessUse
					                            || accountingInfo.business) {
					                            throw new UserError("onlyPrivateAccountFeature_msg");
				                            }
			                            })
		              })
		              .then(() => {
			              emitWizardEvent(this._domElement, WizardEventType.SHOWNEXTPAGE)
		              })
		              .catch(UserError, showUserError)
	}
}


class RedeemGiftCardPage implements WizardPageN<RedeemGiftCardWizardData> {
	isConfirmed: Stream<boolean>
	premiumPrice: number

	constructor() {
		this.isConfirmed = stream(false)
		worker.getPrice(BookingItemFeatureType.Users, 1, false).then(price => {
			this.premiumPrice = price.currentPriceThisPeriod ? parseFloat(price.currentPriceThisPeriod.price) : 0
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
				redeemGiftCard(data.giftCardInfo.giftCard, data.giftCardInfo.country, Dialog.confirm)
					.then(() => Dialog.error("success_label", lang.get("giftCardRedeemed_msg") + (wasFree ? "\n"
						+ lang.get("redeemedToPremium_msg") : "")))
					.then(() => emitWizardEvent(vnode.dom, WizardEventType.CLOSEDIALOG))
					.catch(UserError, showUserError)
					.catch(CancelledError, noOp)
			},
			type: ButtonType.Login
		}

		return m("", [
			data.newAccountData()
				? m(RecoverCodeField, {showMessage: true, recoverCode: neverNull(data.newAccountData()).recoverCode})
				: null,
			m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
				m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {style: {width: "200px"}})),
			data.newAccountData() || wasFree
				? m("div", "You will automatically be upgraded up to a Premium account yearly subscription."
				+ ` The cost of the first year of (${formatPrice(this.premiumPrice, true)}) will be payed for with your gift card and the remaining value will be credited to your account.`)
				: null,
			m(".flex-center.full-width.pt-l",
				m("flex-v-center", [
					renderAcceptGiftCardTermsCheckbox(this.isConfirmed),
					m(".pt-l", {style: {width: "260px"}}, m(ButtonN, confirmButtonAttrs))
				]))
		])
	}
}


export function loadRedeemGiftCardWizard(giftCardInfo: GiftCardRedeemGetReturn): Promise<Dialog> {
	return loadUpgradePrices().then(prices => {

		const giftCardRedeemData: RedeemGiftCardWizardData = {
			newAccountData: stream(null),
			mailAddress: stream(""),
			password: stream(""),
			credentialsMethod: "signup",
			giftCardInfo: giftCardInfo,
			credentials: stream(null),
		}


		const wizardPages = [
			{
				attrs: {
					data: giftCardRedeemData,
					headerTitle: () => lang.get("giftCard_label"),
					nextAction: (_) => Promise.resolve(true),
					isSkipAvailable: () => false,
					isEnabled: () => true
				},
				componentClass: GiftCardWelcomePage
			},
			{
				attrs: {
					data: giftCardRedeemData,
					headerTitle: () => lang.get(giftCardRedeemData.credentialsMethod === "signup" ? "register_label" : "login_label"),
					nextAction: (showErrorDialog: boolean) => Promise.resolve(true),
					isSkipAvailable: () => false,
					isEnabled: () => true
				},
				componentClass: GiftCardCredentialsPage
			},
			{
				attrs: {
					data: giftCardRedeemData,
					headerTitle: () => lang.get("redeem_label"),
					nextAction: (_) => Promise.resolve(true),
					isSkipAvailable: () => false,
					isEnabled: () => true
				},
				componentClass: RedeemGiftCardPage
			}
		]
		return createWizardDialog(giftCardRedeemData, wizardPages, () => Promise.resolve(m.route.set("/login"))).dialog
	})
}
