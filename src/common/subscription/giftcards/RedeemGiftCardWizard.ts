import m, { Children, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { mapNullable, neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import type { WizardPageAttrs, WizardPageN } from "../../gui/base/WizardDialog.js"
import { createWizardDialog, emitWizardEvent, WizardEventType, wizardPageWrapper } from "../../gui/base/WizardDialog.js"
import { LoginController } from "../../api/main/LoginController"
import type { NewAccountData } from "../UpgradeSubscriptionWizard"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import { LoginForm } from "../../../common/login/LoginForm"
import { CredentialsSelector } from "../../../common/login/CredentialsSelector"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { SignupForm } from "../SignupForm"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import type { AccountingInfo, GiftCardRedeemGetReturn } from "../../api/entities/sys/TypeRefs.js"
import { AccountingInfoTypeRef, CustomerInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { locator } from "../../api/main/CommonLocator"
import { getTokenFromUrl, renderAcceptGiftCardTermsCheckbox, renderGiftCardSvg } from "./GiftCardUtils"
import { CancelledError } from "../../api/common/error/CancelledError"
import { lang } from "../../misc/LanguageViewModel"
import { getLoginErrorMessage, handleExpectedLoginError } from "../../misc/LoginUtils"
import { RecoverCodeField } from "../../settings/login/RecoverCodeDialog.js"
import { HabReminderImage } from "../../gui/base/icons/Icons"
import { PaymentMethodType, PlanType } from "../../api/common/TutanotaConstants"
import { formatPrice, getPaymentMethodName, PaymentInterval, PriceAndConfigProvider } from "../PriceUtils"
import { TextField } from "../../gui/base/TextField.js"
import { elementIdPart, isSameId } from "../../api/common/utils/EntityUtils"
import { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import { SessionType } from "../../api/common/SessionType.js"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError.js"
import { GiftCardFacade } from "../../api/worker/facades/lazy/GiftCardFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { Country, getByAbbreviation } from "../../api/common/CountryList.js"
import { renderCountryDropdown } from "../../gui/base/GuiUtils.js"
import { UpgradePriceType } from "../FeatureListProvider"
import { SecondFactorHandler } from "../../misc/2fa/SecondFactorHandler.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { CredentialsInfo } from "../../native/common/generatedipc/CredentialsInfo.js"

const enum GetCredentialsMethod {
	Login,
	Signup,
}

class RedeemGiftCardModel {
	mailAddress = ""
	newAccountData: NewAccountData | null = null
	credentialsMethod = GetCredentialsMethod.Signup

	// accountingInfo is loaded after the user logs in, before redeeming the gift card
	accountingInfo: AccountingInfo | null = null

	constructor(
		private readonly config: {
			giftCardInfo: GiftCardRedeemGetReturn
			key: string
			premiumPrice: number
			storedCredentials: ReadonlyArray<CredentialsInfo>
		},
		private readonly giftCardFacade: GiftCardFacade,
		private readonly credentialsProvider: CredentialsProvider,
		private readonly secondFactorHandler: SecondFactorHandler,
		private readonly logins: LoginController,
		private readonly entityClient: EntityClient,
	) {}

	get giftCardInfo(): GiftCardRedeemGetReturn {
		return this.config.giftCardInfo
	}

	get giftCardId(): Id {
		return elementIdPart(this.giftCardInfo.giftCard)
	}

	get key(): string {
		return this.config.key
	}

	get premiumPrice(): number {
		return this.config.premiumPrice
	}

	get message(): string {
		return this.config.giftCardInfo.message
	}

	get paymentMethod(): PaymentMethodType {
		return (this.accountingInfo?.paymentMethod as PaymentMethodType | null) ?? PaymentMethodType.AccountBalance
	}

	get storedCredentials(): ReadonlyArray<CredentialsInfo> {
		return this.config.storedCredentials
	}

	async loginWithStoredCredentials(encryptedCredentials: CredentialsInfo) {
		if (this.logins.isUserLoggedIn() && isSameId(this.logins.getUserController().user._id, encryptedCredentials.userId)) {
			// If the user is logged in already (because they selected credentials and then went back) we dont have to do
			// anything, so just move on
			await this.postLogin()
		} else {
			await this.logins.logout(false)
			const credentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(encryptedCredentials.userId)

			if (credentials) {
				await this.logins.resumeSession(credentials, null, null)
				await this.postLogin()
			}
		}
	}

	async loginWithFormCredentials(mailAddress: string, password: string) {
		this.mailAddress = mailAddress
		// If they try to login with a mail address that is stored, we want to swap out the old session with a new one
		await this.logins.logout(false)
		await this.logins.createSession(mailAddress, password, SessionType.Temporary)
		await this.postLogin()
	}

	async handleNewSignup(newAccountData: NewAccountData | null) {
		if (newAccountData || this.newAccountData) {
			// if there's an existing account it means the signup form was readonly
			// because we came back from the next page after having already signed up
			if (!this.newAccountData) {
				this.newAccountData = newAccountData
			}

			const { mailAddress, password } = neverNull(newAccountData || this.newAccountData)

			this.mailAddress = mailAddress

			await this.logins.createSession(mailAddress, password, SessionType.Temporary)
			await this.postLogin()
		}
	}

	async redeemGiftCard(country: Country | null): Promise<void> {
		if (country == null) {
			throw new UserError("invoiceCountryInfoBusiness_msg")
		}

		return this.giftCardFacade
			.redeemGiftCard(this.giftCardId, this.key, country?.a ?? null)
			.catch(
				ofClass(NotFoundError, () => {
					throw new UserError("invalidGiftCard_msg")
				}),
			)
			.catch(
				ofClass(NotAuthorizedError, (e) => {
					throw new UserError(() => e.message)
				}),
			)
	}

	private async postLogin(): Promise<void> {
		if (!this.logins.getUserController().isGlobalAdmin()) {
			throw new UserError("onlyAccountAdminFeature_msg")
		}

		await this.secondFactorHandler.closeWaitingForSecondFactorDialog()
		const customer = await this.logins.getUserController().loadCustomer()
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		this.accountingInfo = await this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)

		if (PaymentMethodType.AppStore === this.accountingInfo.paymentMethod) {
			throw new UserError("redeemGiftCardWithAppStoreSubscription_msg")
		}

		if (customer.businessUse) {
			throw new UserError("onlyPrivateAccountFeature_msg")
		}
	}
}

type GiftCardRedeemAttrs = WizardPageAttrs<RedeemGiftCardModel>

/**
 * This page gives the user the option to either signup or login to an account with which to redeem their gift card.
 */

class GiftCardWelcomePage implements WizardPageN<RedeemGiftCardModel> {
	private dom!: HTMLElement

	oncreate(vnodeDOM: VnodeDOM<GiftCardRedeemAttrs>) {
		this.dom = vnodeDOM.dom as HTMLElement
	}

	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const a = vnode.attrs

		const nextPage = (method: GetCredentialsMethod) => {
			locator.logins.logout(false).then(() => {
				a.data.credentialsMethod = method
				emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
			})
		}

		return [
			m(
				".flex-center.full-width.pt-l",
				m(
					"",
					{
						style: {
							width: "480px",
						},
					},
					m(".pt-l", renderGiftCardSvg(parseFloat(a.data.giftCardInfo.value), null, a.data.message)),
				),
			),
			m(
				".flex-center.full-width.pt-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "existingAccount_label",
						onclick: () => nextPage(GetCredentialsMethod.Login),
					}),
				),
			),
			m(
				".flex-center.full-width.pt-l.pb",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "register_label",
						onclick: () => nextPage(GetCredentialsMethod.Signup),
					}),
				),
			),
		]
	}
}

/**
 * This page will either show a signup or login form depending on how they choose to select their credentials
 * When they go to the next page the will be logged in.
 */

class GiftCardCredentialsPage implements WizardPageN<RedeemGiftCardModel> {
	private domElement: HTMLElement | null = null
	private loginFormHelpText = lang.get("emptyString_msg")
	private mailAddress = stream<string>("")
	private password = stream<string>("")

	oncreate(vnode: VnodeDOM<GiftCardRedeemAttrs>) {
		this.domElement = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const data = vnode.attrs.data

		switch (data.credentialsMethod) {
			case GetCredentialsMethod.Login:
				return this.renderLoginPage(data)

			case GetCredentialsMethod.Signup:
				return this.renderSignupPage(data)
		}
	}

	onremove() {
		this.password("")
	}

	private renderLoginPage(model: RedeemGiftCardModel): Children {
		return [
			m(
				".flex-grow.flex-center.scroll",
				m(".flex-grow-shrink-auto.max-width-s.pt.plr-l", [this.renderLoginForm(model), this.renderCredentialsSelector(model)]),
			),
		]
	}

	private renderLoginForm(model: RedeemGiftCardModel): Children {
		return m(LoginForm, {
			onSubmit: async (mailAddress, password) => {
				if (mailAddress === "" || password === "") {
					this.loginFormHelpText = lang.get("loginFailed_msg")
				} else {
					try {
						// If they try to login with a mail address that is stored, we want to swap out the old session with a new one
						await showProgressDialog("pleaseWait_msg", model.loginWithFormCredentials(this.mailAddress(), this.password()))
						emitWizardEvent(this.domElement, WizardEventType.SHOW_NEXT_PAGE)
					} catch (e) {
						if (e instanceof UserError) {
							showUserError(e)
						} else {
							this.loginFormHelpText = lang.getMaybeLazy(getLoginErrorMessage(e, false))
						}
					}
				}
			},
			mailAddress: this.mailAddress,
			password: this.password,
			helpText: this.loginFormHelpText,
		})
	}

	private renderCredentialsSelector(model: RedeemGiftCardModel): Children {
		if (model.storedCredentials.length === 0) {
			return null
		}

		return m(CredentialsSelector, {
			credentials: model.storedCredentials,
			onCredentialsSelected: async (encryptedCredentials) => {
				try {
					await showProgressDialog("pleaseWait_msg", model.loginWithStoredCredentials(encryptedCredentials))
					emitWizardEvent(this.domElement, WizardEventType.SHOW_NEXT_PAGE)
				} catch (e) {
					if (e instanceof UserError) {
						showUserError(e)
					} else {
						this.loginFormHelpText = lang.getMaybeLazy(getLoginErrorMessage(e, false))
						handleExpectedLoginError(e, noOp)
					}
				}
			},
		})
	}

	private renderSignupPage(model: RedeemGiftCardModel): Children {
		return m(SignupForm, {
			// After having an account created we log them in to be in the same state as if they had selected an existing account
			onComplete: (newAccountData) => {
				showProgressDialog(
					"pleaseWait_msg",
					model
						.handleNewSignup(newAccountData)
						.then(() => {
							emitWizardEvent(this.domElement, WizardEventType.SHOW_NEXT_PAGE)
							m.redraw()
						})
						.catch((e) => {
							// TODO when would login fail here and how does it get handled? can we attempt to login again?
							Dialog.message("giftCardLoginError_msg")
							m.route.set("/login", {
								noAutoLogin: true,
							})
						}),
				)
			},
			onChangePlan: () => {
				emitWizardEvent(this.domElement, WizardEventType.SHOW_PREVIOUS_PAGE)
			},
			readonly: model.newAccountData != null,
			prefilledMailAddress: model.newAccountData ? model.newAccountData.mailAddress : "",
			isBusinessUse: () => false,
			isPaidSubscription: () => false,
			campaign: () => null,
		})
	}
}

class RedeemGiftCardPage implements WizardPageN<RedeemGiftCardModel> {
	private confirmed = false
	private showCountryDropdown: boolean
	private country: Country | null
	private dom!: HTMLElement

	constructor({ attrs }: Vnode<GiftCardRedeemAttrs>) {
		// we expect that the accounting info is actually available by now,
		// but we optional chain because invoiceCountry is nullable anyway
		this.country = mapNullable(attrs.data.accountingInfo?.invoiceCountry, getByAbbreviation)

		// if a country is already set, then we don't need to ask for one
		this.showCountryDropdown = this.country == null
	}

	oncreate(vnodeDOM: VnodeDOM<GiftCardRedeemAttrs>) {
		this.dom = vnodeDOM.dom as HTMLElement
	}

	view(vnode: Vnode<GiftCardRedeemAttrs>): Children {
		const model = vnode.attrs.data
		const isFree = locator.logins.getUserController().isFreeAccount()

		return m("", [
			mapNullable(model.newAccountData?.recoverCode, (code) =>
				m(
					".pt-l.plr-l",
					m(RecoverCodeField, {
						showMessage: true,
						recoverCode: code,
					}),
				),
			),
			isFree ? this.renderInfoForFreeAccounts(model) : this.renderInfoForPaidAccounts(model),
			m(
				".flex-center.full-width.pt-l",
				m(
					"",
					{
						style: {
							maxWidth: "620px",
						},
					},
					[
						this.showCountryDropdown
							? renderCountryDropdown({
									selectedCountry: this.country,
									onSelectionChanged: (country) => (this.country = country),
									helpLabel: () => lang.get("invoiceCountryInfoConsumer_msg"),
							  })
							: null,
						renderAcceptGiftCardTermsCheckbox(this.confirmed, (confirmed) => (this.confirmed = confirmed)),
					],
				),
			),
			m(
				".flex-center.full-width.pt-s.pb",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "redeem_label",
						onclick: () => {
							if (!this.confirmed) {
								Dialog.message("termsAcceptedNeutral_msg")
								return
							}

							model
								.redeemGiftCard(this.country)
								.then(() => emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG))
								.catch(ofClass(UserError, showUserError))
								.catch(ofClass(CancelledError, noOp))
						},
					}),
				),
			),
		])
	}

	private getCreditOrDebitMessage(model: RedeemGiftCardModel): string {
		const remainingAmount = Number(model.giftCardInfo.value) - model.premiumPrice
		if (remainingAmount > 0) {
			return `${lang.get("giftCardUpgradeNotifyCredit_msg", {
				"{price}": formatPrice(model.premiumPrice, true),
				"{amount}": formatPrice(remainingAmount, true),
			})} ${lang.get("creditUsageOptions_msg")}`
		} else if (remainingAmount < 0) {
			return lang.get("giftCardUpgradeNotifyDebit_msg", {
				"{price}": formatPrice(model.premiumPrice, true),
				"{amount}": formatPrice(remainingAmount * -1, true),
			})
		} else {
			return ""
		}
	}

	private renderInfoForFreeAccounts(model: RedeemGiftCardModel): Children {
		return [
			m(".pt-l.plr-l", `${lang.get("giftCardUpgradeNotifyRevolutionary_msg")} ${this.getCreditOrDebitMessage(model)}`),
			m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			m(".flex-space-around.flex-wrap", [
				m(".flex-grow-shrink-half.plr-l", [
					m(TextField, {
						label: "subscription_label",
						value: "Revolutionary",
						isReadOnly: true,
					}),
					m(TextField, {
						label: "paymentInterval_label",
						value: lang.get("pricing.yearly_label"),
						isReadOnly: true,
					}),
					m(TextField, {
						label: "price_label",
						value: formatPrice(Number(model.premiumPrice), true) + " " + lang.get("pricing.perYear_label"),
						isReadOnly: true,
					}),
					m(TextField, {
						label: "paymentMethod_label",
						value: getPaymentMethodName(model.paymentMethod),
						isReadOnly: true,
					}),
				]),
				m(
					".flex-grow-shrink-half.plr-l.flex-center.items-end",
					m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {
						style: {
							width: "200px",
						},
					}),
				),
			]),
		]
	}

	private renderInfoForPaidAccounts(model: RedeemGiftCardModel): Children {
		return [
			m(
				".pt-l.plr-l.flex-center",
				`${lang.get("giftCardCreditNotify_msg", {
					"{credit}": formatPrice(Number(model.giftCardInfo.value), true),
				})} ${lang.get("creditUsageOptions_msg")}`,
			),
			m(
				".flex-grow-shrink-half.plr-l.flex-center.items-end",
				m("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", {
					style: {
						width: "200px",
					},
				}),
			),
		]
	}
}

export async function loadRedeemGiftCardWizard(hashFromUrl: string): Promise<Dialog> {
	const model = await loadModel(hashFromUrl)

	const wizardPages = [
		wizardPageWrapper(GiftCardWelcomePage, {
			data: model,
			headerTitle: () => lang.get("giftCard_label"),
			nextAction: async () => true,
			isSkipAvailable: () => false,
			isEnabled: () => true,
		}),
		wizardPageWrapper(GiftCardCredentialsPage, {
			data: model,
			headerTitle: () => lang.get(model.credentialsMethod === GetCredentialsMethod.Signup ? "register_label" : "login_label"),
			nextAction: async () => true,
			isSkipAvailable: () => false,
			isEnabled: () => true,
		}),
		wizardPageWrapper(RedeemGiftCardPage, {
			data: model,
			headerTitle: () => lang.get("redeem_label"),
			nextAction: async () => true,
			isSkipAvailable: () => false,
			isEnabled: () => true,
		}),
	]
	return createWizardDialog(
		model,
		wizardPages,
		async () => {
			const urlParams = model.mailAddress ? { loginWith: model.mailAddress, noAutoLogin: true } : {}
			m.route.set("/login", urlParams)
		},
		DialogType.EditLarge,
	).dialog
}

async function loadModel(hashFromUrl: string): Promise<RedeemGiftCardModel> {
	const { id, key } = await getTokenFromUrl(hashFromUrl)
	const giftCardInfo = await locator.giftCardFacade.getGiftCardInfo(id, key)

	const storedCredentials = await locator.credentialsProvider.getInternalCredentialsInfos()
	const pricesDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)

	return new RedeemGiftCardModel(
		{
			giftCardInfo,
			key,
			premiumPrice: pricesDataProvider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanActualPrice),
			storedCredentials,
		},
		locator.giftCardFacade,
		locator.credentialsProvider,
		locator.secondFactorHandler,
		locator.logins,
		locator.entityClient,
	)
}
