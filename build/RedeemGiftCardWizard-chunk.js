import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { mapNullable, neverNull, noOp, ofClass } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { PaymentMethodType, PlanType } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import { elementIdPart, isSameId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import { AccountingInfoTypeRef, CustomerInfoTypeRef } from "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import { NotAuthorizedError, NotFoundError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import "./EntityRestClient-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import { SessionType } from "./SessionType-chunk.js";
import "./Services-chunk.js";
import "./EntityClient-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import "./MailChecks-chunk.js";
import "./Button-chunk.js";
import { HabReminderImage } from "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import { getByAbbreviation } from "./CountryList-chunk.js";
import { Dialog, DialogType, TextField, renderCountryDropdown } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import "./InAppRatingDialog-chunk.js";
import "./RouteChange-chunk.js";
import "./CustomerUtils-chunk.js";
import "./mailLocator-chunk.js";
import "./LoginScreenHeader-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import "./InfoIcon-chunk.js";
import "./Table-chunk.js";
import "./HtmlEditor-chunk.js";
import "./HtmlSanitizer-chunk.js";
import { CredentialsSelector, LoginForm, getLoginErrorMessage, handleExpectedLoginError } from "./LoginUtils-chunk.js";
import "./UsageTestModel-chunk.js";
import "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import "./CommonFormatter-chunk.js";
import "./PasswordForm-chunk.js";
import "./MoreInfoLink-chunk.js";
import { WizardEventType, createWizardDialog, emitWizardEvent, wizardPageWrapper } from "./WizardDialog-chunk.js";
import "./SegmentControl-chunk.js";
import "./SubscriptionUtils-chunk.js";
import { RecoverCodeField } from "./RecoverCodeDialog-chunk.js";
import "./MailAddressesUtils-chunk.js";
import { PaymentInterval, PriceAndConfigProvider, UpgradePriceType, formatPrice, getPaymentMethodName } from "./PriceUtils-chunk.js";
import { getTokenFromUrl, renderAcceptGiftCardTermsCheckbox, renderGiftCardSvg } from "./PurchaseGiftCardDialog-chunk.js";
import { SignupForm } from "./SwitchSubscriptionDialog-chunk.js";
import "./MessageBox-chunk.js";
import "./LeavingUserSurveyWizard-chunk.js";

//#region src/common/subscription/giftcards/RedeemGiftCardWizard.ts
var import_stream = __toESM(require_stream(), 1);
var GetCredentialsMethod = function(GetCredentialsMethod$1) {
	GetCredentialsMethod$1[GetCredentialsMethod$1["Login"] = 0] = "Login";
	GetCredentialsMethod$1[GetCredentialsMethod$1["Signup"] = 1] = "Signup";
	return GetCredentialsMethod$1;
}(GetCredentialsMethod || {});
var RedeemGiftCardModel = class {
	mailAddress = "";
	newAccountData = null;
	credentialsMethod = GetCredentialsMethod.Signup;
	accountingInfo = null;
	constructor(config, giftCardFacade, credentialsProvider, secondFactorHandler, logins, entityClient) {
		this.config = config;
		this.giftCardFacade = giftCardFacade;
		this.credentialsProvider = credentialsProvider;
		this.secondFactorHandler = secondFactorHandler;
		this.logins = logins;
		this.entityClient = entityClient;
	}
	get giftCardInfo() {
		return this.config.giftCardInfo;
	}
	get giftCardId() {
		return elementIdPart(this.giftCardInfo.giftCard);
	}
	get key() {
		return this.config.key;
	}
	get premiumPrice() {
		return this.config.premiumPrice;
	}
	get message() {
		return this.config.giftCardInfo.message;
	}
	get paymentMethod() {
		return this.accountingInfo?.paymentMethod ?? PaymentMethodType.AccountBalance;
	}
	get storedCredentials() {
		return this.config.storedCredentials;
	}
	async loginWithStoredCredentials(encryptedCredentials) {
		if (this.logins.isUserLoggedIn() && isSameId(this.logins.getUserController().user._id, encryptedCredentials.userId)) await this.postLogin();
else {
			await this.logins.logout(false);
			const credentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(encryptedCredentials.userId);
			if (credentials) {
				await this.logins.resumeSession(credentials, null, null);
				await this.postLogin();
			}
		}
	}
	async loginWithFormCredentials(mailAddress, password) {
		this.mailAddress = mailAddress;
		await this.logins.logout(false);
		await this.logins.createSession(mailAddress, password, SessionType.Temporary);
		await this.postLogin();
	}
	async handleNewSignup(newAccountData) {
		if (newAccountData || this.newAccountData) {
			if (!this.newAccountData) this.newAccountData = newAccountData;
			const { mailAddress, password } = neverNull(newAccountData || this.newAccountData);
			this.mailAddress = mailAddress;
			await this.logins.createSession(mailAddress, password, SessionType.Temporary);
			await this.postLogin();
		}
	}
	async redeemGiftCard(country) {
		if (country == null) throw new UserError("invoiceCountryInfoBusiness_msg");
		return this.giftCardFacade.redeemGiftCard(this.giftCardId, this.key, country?.a ?? null).catch(ofClass(NotFoundError, () => {
			throw new UserError("invalidGiftCard_msg");
		})).catch(ofClass(NotAuthorizedError, (e) => {
			throw new UserError(lang.makeTranslation("error_msg", e.message));
		}));
	}
	async postLogin() {
		if (!this.logins.getUserController().isGlobalAdmin()) throw new UserError("onlyAccountAdminFeature_msg");
		await this.secondFactorHandler.closeWaitingForSecondFactorDialog();
		const customer = await this.logins.getUserController().loadCustomer();
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo);
		this.accountingInfo = await this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo);
		if (PaymentMethodType.AppStore === this.accountingInfo.paymentMethod) throw new UserError("redeemGiftCardWithAppStoreSubscription_msg");
		if (customer.businessUse) throw new UserError("onlyPrivateAccountFeature_msg");
	}
};
var GiftCardWelcomePage = class {
	dom;
	oncreate(vnodeDOM) {
		this.dom = vnodeDOM.dom;
	}
	view(vnode) {
		const a = vnode.attrs;
		const nextPage = (method) => {
			locator.logins.logout(false).then(() => {
				a.data.credentialsMethod = method;
				emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE);
			});
		};
		return [
			mithril_default(".flex-center.full-width.pt-l", mithril_default(".pt-l", { style: { width: "480px" } }, renderGiftCardSvg(parseFloat(a.data.giftCardInfo.value), null, a.data.message))),
			mithril_default(".flex-center.full-width.pt-l", mithril_default(LoginButton, {
				label: "existingAccount_label",
				class: "small-login-button",
				onclick: () => nextPage(GetCredentialsMethod.Login)
			})),
			mithril_default(".flex-center.full-width.pt-l.pb", mithril_default(LoginButton, {
				label: "register_label",
				class: "small-login-button",
				onclick: () => nextPage(GetCredentialsMethod.Signup)
			}))
		];
	}
};
var GiftCardCredentialsPage = class {
	domElement = null;
	loginFormHelpText = lang.get("emptyString_msg");
	mailAddress = (0, import_stream.default)("");
	password = (0, import_stream.default)("");
	oncreate(vnode) {
		this.domElement = vnode.dom;
	}
	view(vnode) {
		const data = vnode.attrs.data;
		switch (data.credentialsMethod) {
			case GetCredentialsMethod.Login: return this.renderLoginPage(data);
			case GetCredentialsMethod.Signup: return this.renderSignupPage(data);
		}
	}
	onremove() {
		this.password("");
	}
	renderLoginPage(model) {
		return [mithril_default(".flex-grow.flex-center.scroll", mithril_default(".flex-grow-shrink-auto.max-width-s.pt.plr-l", [this.renderLoginForm(model), this.renderCredentialsSelector(model)]))];
	}
	renderLoginForm(model) {
		return mithril_default(LoginForm, {
			onSubmit: async (mailAddress, password) => {
				if (mailAddress === "" || password === "") this.loginFormHelpText = lang.get("loginFailed_msg");
else try {
					await showProgressDialog("pleaseWait_msg", model.loginWithFormCredentials(this.mailAddress(), this.password()));
					emitWizardEvent(this.domElement, WizardEventType.SHOW_NEXT_PAGE);
				} catch (e) {
					if (e instanceof UserError) showUserError(e);
else this.loginFormHelpText = lang.getTranslationText(getLoginErrorMessage(e, false));
				}
			},
			mailAddress: this.mailAddress,
			password: this.password,
			helpText: this.loginFormHelpText
		});
	}
	renderCredentialsSelector(model) {
		if (model.storedCredentials.length === 0) return null;
		return mithril_default(CredentialsSelector, {
			credentials: model.storedCredentials,
			onCredentialsSelected: async (encryptedCredentials) => {
				try {
					await showProgressDialog("pleaseWait_msg", model.loginWithStoredCredentials(encryptedCredentials));
					emitWizardEvent(this.domElement, WizardEventType.SHOW_NEXT_PAGE);
				} catch (e) {
					if (e instanceof UserError) showUserError(e);
else {
						this.loginFormHelpText = lang.getTranslationText(getLoginErrorMessage(e, false));
						handleExpectedLoginError(e, noOp);
					}
				}
			}
		});
	}
	renderSignupPage(model) {
		return mithril_default(SignupForm, {
			onComplete: (newAccountData) => {
				showProgressDialog("pleaseWait_msg", model.handleNewSignup(newAccountData).then(() => {
					emitWizardEvent(this.domElement, WizardEventType.SHOW_NEXT_PAGE);
					mithril_default.redraw();
				}).catch((e) => {
					Dialog.message("giftCardLoginError_msg");
					mithril_default.route.set("/login", { noAutoLogin: true });
				}));
			},
			onChangePlan: () => {
				emitWizardEvent(this.domElement, WizardEventType.SHOW_PREVIOUS_PAGE);
			},
			readonly: model.newAccountData != null,
			prefilledMailAddress: model.newAccountData ? model.newAccountData.mailAddress : "",
			isBusinessUse: () => false,
			isPaidSubscription: () => true,
			campaign: () => null
		});
	}
};
var RedeemGiftCardPage = class {
	confirmed = false;
	showCountryDropdown;
	country;
	dom;
	constructor({ attrs }) {
		this.country = mapNullable(attrs.data.accountingInfo?.invoiceCountry, getByAbbreviation);
		this.showCountryDropdown = this.country == null;
	}
	oncreate(vnodeDOM) {
		this.dom = vnodeDOM.dom;
	}
	view(vnode) {
		const model = vnode.attrs.data;
		const isFree = locator.logins.getUserController().isFreeAccount();
		return mithril_default("", [
			mapNullable(model.newAccountData?.recoverCode, (code) => mithril_default(".pt-l.plr-l", mithril_default(RecoverCodeField, {
				showMessage: true,
				recoverCode: code
			}))),
			isFree ? this.renderInfoForFreeAccounts(model) : this.renderInfoForPaidAccounts(model),
			mithril_default(".flex-center.full-width.pt-l", mithril_default("", { style: { maxWidth: "620px" } }, [this.showCountryDropdown ? renderCountryDropdown({
				selectedCountry: this.country,
				onSelectionChanged: (country) => this.country = country,
				helpLabel: () => lang.get("invoiceCountryInfoConsumer_msg")
			}) : null, renderAcceptGiftCardTermsCheckbox(this.confirmed, (confirmed) => this.confirmed = confirmed)])),
			mithril_default(".flex-center.full-width.pt-s.pb", mithril_default(LoginButton, {
				label: "redeem_label",
				class: "small-login-button",
				onclick: () => {
					if (!this.confirmed) {
						Dialog.message("termsAcceptedNeutral_msg");
						return;
					}
					model.redeemGiftCard(this.country).then(() => emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG)).catch(ofClass(UserError, showUserError)).catch(ofClass(CancelledError, noOp));
				}
			}))
		]);
	}
	getCreditOrDebitMessage(model) {
		const remainingAmount = Number(model.giftCardInfo.value) - model.premiumPrice;
		if (remainingAmount > 0) return `${lang.get("giftCardUpgradeNotifyCredit_msg", {
			"{price}": formatPrice(model.premiumPrice, true),
			"{amount}": formatPrice(remainingAmount, true)
		})} ${lang.get("creditUsageOptions_msg")}`;
else if (remainingAmount < 0) return lang.get("giftCardUpgradeNotifyDebit_msg", {
			"{price}": formatPrice(model.premiumPrice, true),
			"{amount}": formatPrice(remainingAmount * -1, true)
		});
else return "";
	}
	renderInfoForFreeAccounts(model) {
		return [
			mithril_default(".pt-l.plr-l", `${lang.get("giftCardUpgradeNotifyRevolutionary_msg")} ${this.getCreditOrDebitMessage(model)}`),
			mithril_default(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			mithril_default(".flex-space-around.flex-wrap", [mithril_default(".flex-grow-shrink-half.plr-l", [
				mithril_default(TextField, {
					label: "subscription_label",
					value: "Revolutionary",
					isReadOnly: true
				}),
				mithril_default(TextField, {
					label: "paymentInterval_label",
					value: lang.get("pricing.yearly_label"),
					isReadOnly: true
				}),
				mithril_default(TextField, {
					label: "price_label",
					value: formatPrice(Number(model.premiumPrice), true) + " " + lang.get("pricing.perYear_label"),
					isReadOnly: true
				}),
				mithril_default(TextField, {
					label: "paymentMethod_label",
					value: getPaymentMethodName(model.paymentMethod),
					isReadOnly: true
				})
			]), mithril_default(".flex-grow-shrink-half.plr-l.flex-center.items-end", mithril_default("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", { style: { width: "200px" } }))])
		];
	}
	renderInfoForPaidAccounts(model) {
		return [mithril_default(".pt-l.plr-l.flex-center", `${lang.get("giftCardCreditNotify_msg", { "{credit}": formatPrice(Number(model.giftCardInfo.value), true) })} ${lang.get("creditUsageOptions_msg")}`), mithril_default(".flex-grow-shrink-half.plr-l.flex-center.items-end", mithril_default("img[src=" + HabReminderImage + "].pt.bg-white.border-radius", { style: { width: "200px" } }))];
	}
};
async function loadRedeemGiftCardWizard(hashFromUrl) {
	const model = await loadModel(hashFromUrl);
	const wizardPages = [
		wizardPageWrapper(GiftCardWelcomePage, {
			data: model,
			headerTitle: () => "giftCard_label",
			nextAction: async () => true,
			isSkipAvailable: () => false,
			isEnabled: () => true
		}),
		wizardPageWrapper(GiftCardCredentialsPage, {
			data: model,
			headerTitle: () => model.credentialsMethod === GetCredentialsMethod.Signup ? "register_label" : "login_label",
			nextAction: async () => true,
			isSkipAvailable: () => false,
			isEnabled: () => true
		}),
		wizardPageWrapper(RedeemGiftCardPage, {
			data: model,
			headerTitle: () => "redeem_label",
			nextAction: async () => true,
			isSkipAvailable: () => false,
			isEnabled: () => true
		})
	];
	return createWizardDialog(model, wizardPages, async () => {
		const urlParams = model.mailAddress ? {
			loginWith: model.mailAddress,
			noAutoLogin: true
		} : {};
		mithril_default.route.set("/login", urlParams);
	}, DialogType.EditLarge).dialog;
}
async function loadModel(hashFromUrl) {
	const { id, key } = await getTokenFromUrl(hashFromUrl);
	const giftCardInfo = await locator.giftCardFacade.getGiftCardInfo(id, key);
	const storedCredentials = await locator.credentialsProvider.getInternalCredentialsInfos();
	const pricesDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null);
	return new RedeemGiftCardModel({
		giftCardInfo,
		key,
		premiumPrice: pricesDataProvider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanActualPrice),
		storedCredentials
	}, locator.giftCardFacade, locator.credentialsProvider, locator.secondFactorHandler, locator.logins, locator.entityClient);
}

//#endregion
export { loadRedeemGiftCardWizard };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVkZWVtR2lmdENhcmRXaXphcmQtY2h1bmsuanMiLCJuYW1lcyI6WyJjb25maWc6IHtcblx0XHRcdGdpZnRDYXJkSW5mbzogR2lmdENhcmRSZWRlZW1HZXRSZXR1cm5cblx0XHRcdGtleTogc3RyaW5nXG5cdFx0XHRwcmVtaXVtUHJpY2U6IG51bWJlclxuXHRcdFx0c3RvcmVkQ3JlZGVudGlhbHM6IFJlYWRvbmx5QXJyYXk8Q3JlZGVudGlhbHNJbmZvPlxuXHRcdH0iLCJnaWZ0Q2FyZEZhY2FkZTogR2lmdENhcmRGYWNhZGUiLCJjcmVkZW50aWFsc1Byb3ZpZGVyOiBDcmVkZW50aWFsc1Byb3ZpZGVyIiwic2Vjb25kRmFjdG9ySGFuZGxlcjogU2Vjb25kRmFjdG9ySGFuZGxlciIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJlbmNyeXB0ZWRDcmVkZW50aWFsczogQ3JlZGVudGlhbHNJbmZvIiwibWFpbEFkZHJlc3M6IHN0cmluZyIsInBhc3N3b3JkOiBzdHJpbmciLCJuZXdBY2NvdW50RGF0YTogTmV3QWNjb3VudERhdGEgfCBudWxsIiwiY291bnRyeTogQ291bnRyeSB8IG51bGwiLCJ2bm9kZURPTTogVm5vZGVET008R2lmdENhcmRSZWRlZW1BdHRycz4iLCJ2bm9kZTogVm5vZGU8R2lmdENhcmRSZWRlZW1BdHRycz4iLCJtZXRob2Q6IEdldENyZWRlbnRpYWxzTWV0aG9kIiwidm5vZGU6IFZub2RlRE9NPEdpZnRDYXJkUmVkZWVtQXR0cnM+IiwibW9kZWw6IFJlZGVlbUdpZnRDYXJkTW9kZWwiLCJoYXNoRnJvbVVybDogc3RyaW5nIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vZ2lmdGNhcmRzL1JlZGVlbUdpZnRDYXJkV2l6YXJkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtLCB7IENoaWxkcmVuLCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBtYXBOdWxsYWJsZSwgbmV2ZXJOdWxsLCBub09wLCBvZkNsYXNzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IFdpemFyZFBhZ2VBdHRycywgV2l6YXJkUGFnZU4gfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvV2l6YXJkRGlhbG9nLmpzXCJcbmltcG9ydCB7IGNyZWF0ZVdpemFyZERpYWxvZywgZW1pdFdpemFyZEV2ZW50LCBXaXphcmRFdmVudFR5cGUsIHdpemFyZFBhZ2VXcmFwcGVyIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL1dpemFyZERpYWxvZy5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyXCJcbmltcG9ydCB0eXBlIHsgTmV3QWNjb3VudERhdGEgfSBmcm9tIFwiLi4vVXBncmFkZVN1YnNjcmlwdGlvbldpemFyZFwiXG5pbXBvcnQgeyBEaWFsb2csIERpYWxvZ1R5cGUgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IExvZ2luRm9ybSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbG9naW4vTG9naW5Gb3JtXCJcbmltcG9ydCB7IENyZWRlbnRpYWxzU2VsZWN0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2xvZ2luL0NyZWRlbnRpYWxzU2VsZWN0b3JcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IFNpZ251cEZvcm0gfSBmcm9tIFwiLi4vU2lnbnVwRm9ybVwiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vbWlzYy9FcnJvckhhbmRsZXJJbXBsXCJcbmltcG9ydCB0eXBlIHsgQWNjb3VudGluZ0luZm8sIEdpZnRDYXJkUmVkZWVtR2V0UmV0dXJuIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQWNjb3VudGluZ0luZm9UeXBlUmVmLCBDdXN0b21lckluZm9UeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IGdldFRva2VuRnJvbVVybCwgcmVuZGVyQWNjZXB0R2lmdENhcmRUZXJtc0NoZWNrYm94LCByZW5kZXJHaWZ0Q2FyZFN2ZyB9IGZyb20gXCIuL0dpZnRDYXJkVXRpbHNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9DYW5jZWxsZWRFcnJvclwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgZ2V0TG9naW5FcnJvck1lc3NhZ2UsIGhhbmRsZUV4cGVjdGVkTG9naW5FcnJvciB9IGZyb20gXCIuLi8uLi9taXNjL0xvZ2luVXRpbHNcIlxuaW1wb3J0IHsgUmVjb3ZlckNvZGVGaWVsZCB9IGZyb20gXCIuLi8uLi9zZXR0aW5ncy9sb2dpbi9SZWNvdmVyQ29kZURpYWxvZy5qc1wiXG5pbXBvcnQgeyBIYWJSZW1pbmRlckltYWdlIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB7IFBheW1lbnRNZXRob2RUeXBlLCBQbGFuVHlwZSB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGZvcm1hdFByaWNlLCBnZXRQYXltZW50TWV0aG9kTmFtZSwgUGF5bWVudEludGVydmFsLCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4uL1ByaWNlVXRpbHNcIlxuaW1wb3J0IHsgVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBlbGVtZW50SWRQYXJ0LCBpc1NhbWVJZCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxzUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vbWlzYy9jcmVkZW50aWFscy9DcmVkZW50aWFsc1Byb3ZpZGVyLmpzXCJcbmltcG9ydCB7IFNlc3Npb25UeXBlIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vU2Vzc2lvblR5cGUuanNcIlxuaW1wb3J0IHsgTm90QXV0aG9yaXplZEVycm9yLCBOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IEdpZnRDYXJkRmFjYWRlIH0gZnJvbSBcIi4uLy4uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dpZnRDYXJkRmFjYWRlLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBDb3VudHJ5LCBnZXRCeUFiYnJldmlhdGlvbiB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0NvdW50cnlMaXN0LmpzXCJcbmltcG9ydCB7IHJlbmRlckNvdW50cnlEcm9wZG93biB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBVcGdyYWRlUHJpY2VUeXBlIH0gZnJvbSBcIi4uL0ZlYXR1cmVMaXN0UHJvdmlkZXJcIlxuaW1wb3J0IHsgU2Vjb25kRmFjdG9ySGFuZGxlciB9IGZyb20gXCIuLi8uLi9taXNjLzJmYS9TZWNvbmRGYWN0b3JIYW5kbGVyLmpzXCJcbmltcG9ydCB7IExvZ2luQnV0dG9uIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL2J1dHRvbnMvTG9naW5CdXR0b24uanNcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbHNJbmZvIH0gZnJvbSBcIi4uLy4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0NyZWRlbnRpYWxzSW5mby5qc1wiXG5cbmNvbnN0IGVudW0gR2V0Q3JlZGVudGlhbHNNZXRob2Qge1xuXHRMb2dpbixcblx0U2lnbnVwLFxufVxuXG5jbGFzcyBSZWRlZW1HaWZ0Q2FyZE1vZGVsIHtcblx0bWFpbEFkZHJlc3MgPSBcIlwiXG5cdG5ld0FjY291bnREYXRhOiBOZXdBY2NvdW50RGF0YSB8IG51bGwgPSBudWxsXG5cdGNyZWRlbnRpYWxzTWV0aG9kID0gR2V0Q3JlZGVudGlhbHNNZXRob2QuU2lnbnVwXG5cblx0Ly8gYWNjb3VudGluZ0luZm8gaXMgbG9hZGVkIGFmdGVyIHRoZSB1c2VyIGxvZ3MgaW4sIGJlZm9yZSByZWRlZW1pbmcgdGhlIGdpZnQgY2FyZFxuXHRhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8gfCBudWxsID0gbnVsbFxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29uZmlnOiB7XG5cdFx0XHRnaWZ0Q2FyZEluZm86IEdpZnRDYXJkUmVkZWVtR2V0UmV0dXJuXG5cdFx0XHRrZXk6IHN0cmluZ1xuXHRcdFx0cHJlbWl1bVByaWNlOiBudW1iZXJcblx0XHRcdHN0b3JlZENyZWRlbnRpYWxzOiBSZWFkb25seUFycmF5PENyZWRlbnRpYWxzSW5mbz5cblx0XHR9LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZ2lmdENhcmRGYWNhZGU6IEdpZnRDYXJkRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY3JlZGVudGlhbHNQcm92aWRlcjogQ3JlZGVudGlhbHNQcm92aWRlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHNlY29uZEZhY3RvckhhbmRsZXI6IFNlY29uZEZhY3RvckhhbmRsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBsb2dpbnM6IExvZ2luQ29udHJvbGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHQpIHt9XG5cblx0Z2V0IGdpZnRDYXJkSW5mbygpOiBHaWZ0Q2FyZFJlZGVlbUdldFJldHVybiB7XG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnLmdpZnRDYXJkSW5mb1xuXHR9XG5cblx0Z2V0IGdpZnRDYXJkSWQoKTogSWQge1xuXHRcdHJldHVybiBlbGVtZW50SWRQYXJ0KHRoaXMuZ2lmdENhcmRJbmZvLmdpZnRDYXJkKVxuXHR9XG5cblx0Z2V0IGtleSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLmNvbmZpZy5rZXlcblx0fVxuXG5cdGdldCBwcmVtaXVtUHJpY2UoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5jb25maWcucHJlbWl1bVByaWNlXG5cdH1cblxuXHRnZXQgbWVzc2FnZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLmNvbmZpZy5naWZ0Q2FyZEluZm8ubWVzc2FnZVxuXHR9XG5cblx0Z2V0IHBheW1lbnRNZXRob2QoKTogUGF5bWVudE1ldGhvZFR5cGUge1xuXHRcdHJldHVybiAodGhpcy5hY2NvdW50aW5nSW5mbz8ucGF5bWVudE1ldGhvZCBhcyBQYXltZW50TWV0aG9kVHlwZSB8IG51bGwpID8/IFBheW1lbnRNZXRob2RUeXBlLkFjY291bnRCYWxhbmNlXG5cdH1cblxuXHRnZXQgc3RvcmVkQ3JlZGVudGlhbHMoKTogUmVhZG9ubHlBcnJheTxDcmVkZW50aWFsc0luZm8+IHtcblx0XHRyZXR1cm4gdGhpcy5jb25maWcuc3RvcmVkQ3JlZGVudGlhbHNcblx0fVxuXG5cdGFzeW5jIGxvZ2luV2l0aFN0b3JlZENyZWRlbnRpYWxzKGVuY3J5cHRlZENyZWRlbnRpYWxzOiBDcmVkZW50aWFsc0luZm8pIHtcblx0XHRpZiAodGhpcy5sb2dpbnMuaXNVc2VyTG9nZ2VkSW4oKSAmJiBpc1NhbWVJZCh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIuX2lkLCBlbmNyeXB0ZWRDcmVkZW50aWFscy51c2VySWQpKSB7XG5cdFx0XHQvLyBJZiB0aGUgdXNlciBpcyBsb2dnZWQgaW4gYWxyZWFkeSAoYmVjYXVzZSB0aGV5IHNlbGVjdGVkIGNyZWRlbnRpYWxzIGFuZCB0aGVuIHdlbnQgYmFjaykgd2UgZG9udCBoYXZlIHRvIGRvXG5cdFx0XHQvLyBhbnl0aGluZywgc28ganVzdCBtb3ZlIG9uXG5cdFx0XHRhd2FpdCB0aGlzLnBvc3RMb2dpbigpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGF3YWl0IHRoaXMubG9naW5zLmxvZ291dChmYWxzZSlcblx0XHRcdGNvbnN0IGNyZWRlbnRpYWxzID0gYXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmdldERlY3J5cHRlZENyZWRlbnRpYWxzQnlVc2VySWQoZW5jcnlwdGVkQ3JlZGVudGlhbHMudXNlcklkKVxuXG5cdFx0XHRpZiAoY3JlZGVudGlhbHMpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2dpbnMucmVzdW1lU2Vzc2lvbihjcmVkZW50aWFscywgbnVsbCwgbnVsbClcblx0XHRcdFx0YXdhaXQgdGhpcy5wb3N0TG9naW4oKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGxvZ2luV2l0aEZvcm1DcmVkZW50aWFscyhtYWlsQWRkcmVzczogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKSB7XG5cdFx0dGhpcy5tYWlsQWRkcmVzcyA9IG1haWxBZGRyZXNzXG5cdFx0Ly8gSWYgdGhleSB0cnkgdG8gbG9naW4gd2l0aCBhIG1haWwgYWRkcmVzcyB0aGF0IGlzIHN0b3JlZCwgd2Ugd2FudCB0byBzd2FwIG91dCB0aGUgb2xkIHNlc3Npb24gd2l0aCBhIG5ldyBvbmVcblx0XHRhd2FpdCB0aGlzLmxvZ2lucy5sb2dvdXQoZmFsc2UpXG5cdFx0YXdhaXQgdGhpcy5sb2dpbnMuY3JlYXRlU2Vzc2lvbihtYWlsQWRkcmVzcywgcGFzc3dvcmQsIFNlc3Npb25UeXBlLlRlbXBvcmFyeSlcblx0XHRhd2FpdCB0aGlzLnBvc3RMb2dpbigpXG5cdH1cblxuXHRhc3luYyBoYW5kbGVOZXdTaWdudXAobmV3QWNjb3VudERhdGE6IE5ld0FjY291bnREYXRhIHwgbnVsbCkge1xuXHRcdGlmIChuZXdBY2NvdW50RGF0YSB8fCB0aGlzLm5ld0FjY291bnREYXRhKSB7XG5cdFx0XHQvLyBpZiB0aGVyZSdzIGFuIGV4aXN0aW5nIGFjY291bnQgaXQgbWVhbnMgdGhlIHNpZ251cCBmb3JtIHdhcyByZWFkb25seVxuXHRcdFx0Ly8gYmVjYXVzZSB3ZSBjYW1lIGJhY2sgZnJvbSB0aGUgbmV4dCBwYWdlIGFmdGVyIGhhdmluZyBhbHJlYWR5IHNpZ25lZCB1cFxuXHRcdFx0aWYgKCF0aGlzLm5ld0FjY291bnREYXRhKSB7XG5cdFx0XHRcdHRoaXMubmV3QWNjb3VudERhdGEgPSBuZXdBY2NvdW50RGF0YVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB7IG1haWxBZGRyZXNzLCBwYXNzd29yZCB9ID0gbmV2ZXJOdWxsKG5ld0FjY291bnREYXRhIHx8IHRoaXMubmV3QWNjb3VudERhdGEpXG5cblx0XHRcdHRoaXMubWFpbEFkZHJlc3MgPSBtYWlsQWRkcmVzc1xuXG5cdFx0XHRhd2FpdCB0aGlzLmxvZ2lucy5jcmVhdGVTZXNzaW9uKG1haWxBZGRyZXNzLCBwYXNzd29yZCwgU2Vzc2lvblR5cGUuVGVtcG9yYXJ5KVxuXHRcdFx0YXdhaXQgdGhpcy5wb3N0TG9naW4oKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHJlZGVlbUdpZnRDYXJkKGNvdW50cnk6IENvdW50cnkgfCBudWxsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKGNvdW50cnkgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcImludm9pY2VDb3VudHJ5SW5mb0J1c2luZXNzX21zZ1wiKVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmdpZnRDYXJkRmFjYWRlXG5cdFx0XHQucmVkZWVtR2lmdENhcmQodGhpcy5naWZ0Q2FyZElkLCB0aGlzLmtleSwgY291bnRyeT8uYSA/PyBudWxsKVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKE5vdEZvdW5kRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwiaW52YWxpZEdpZnRDYXJkX21zZ1wiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhOb3RBdXRob3JpemVkRXJyb3IsIChlKSA9PiB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihsYW5nLm1ha2VUcmFuc2xhdGlvbihcImVycm9yX21zZ1wiLCBlLm1lc3NhZ2UpKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcG9zdExvZ2luKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0dsb2JhbEFkbWluKCkpIHtcblx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJvbmx5QWNjb3VudEFkbWluRmVhdHVyZV9tc2dcIilcblx0XHR9XG5cblx0XHRhd2FpdCB0aGlzLnNlY29uZEZhY3RvckhhbmRsZXIuY2xvc2VXYWl0aW5nRm9yU2Vjb25kRmFjdG9yRGlhbG9nKClcblx0XHRjb25zdCBjdXN0b21lciA9IGF3YWl0IHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkubG9hZEN1c3RvbWVyKClcblx0XHRjb25zdCBjdXN0b21lckluZm8gPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEN1c3RvbWVySW5mb1R5cGVSZWYsIGN1c3RvbWVyLmN1c3RvbWVySW5mbylcblx0XHR0aGlzLmFjY291bnRpbmdJbmZvID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChBY2NvdW50aW5nSW5mb1R5cGVSZWYsIGN1c3RvbWVySW5mby5hY2NvdW50aW5nSW5mbylcblxuXHRcdGlmIChQYXltZW50TWV0aG9kVHlwZS5BcHBTdG9yZSA9PT0gdGhpcy5hY2NvdW50aW5nSW5mby5wYXltZW50TWV0aG9kKSB7XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwicmVkZWVtR2lmdENhcmRXaXRoQXBwU3RvcmVTdWJzY3JpcHRpb25fbXNnXCIpXG5cdFx0fVxuXG5cdFx0aWYgKGN1c3RvbWVyLmJ1c2luZXNzVXNlKSB7XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwib25seVByaXZhdGVBY2NvdW50RmVhdHVyZV9tc2dcIilcblx0XHR9XG5cdH1cbn1cblxudHlwZSBHaWZ0Q2FyZFJlZGVlbUF0dHJzID0gV2l6YXJkUGFnZUF0dHJzPFJlZGVlbUdpZnRDYXJkTW9kZWw+XG5cbi8qKlxuICogVGhpcyBwYWdlIGdpdmVzIHRoZSB1c2VyIHRoZSBvcHRpb24gdG8gZWl0aGVyIHNpZ251cCBvciBsb2dpbiB0byBhbiBhY2NvdW50IHdpdGggd2hpY2ggdG8gcmVkZWVtIHRoZWlyIGdpZnQgY2FyZC5cbiAqL1xuXG5jbGFzcyBHaWZ0Q2FyZFdlbGNvbWVQYWdlIGltcGxlbWVudHMgV2l6YXJkUGFnZU48UmVkZWVtR2lmdENhcmRNb2RlbD4ge1xuXHRwcml2YXRlIGRvbSE6IEhUTUxFbGVtZW50XG5cblx0b25jcmVhdGUodm5vZGVET006IFZub2RlRE9NPEdpZnRDYXJkUmVkZWVtQXR0cnM+KSB7XG5cdFx0dGhpcy5kb20gPSB2bm9kZURPTS5kb20gYXMgSFRNTEVsZW1lbnRcblx0fVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPEdpZnRDYXJkUmVkZWVtQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGEgPSB2bm9kZS5hdHRyc1xuXG5cdFx0Y29uc3QgbmV4dFBhZ2UgPSAobWV0aG9kOiBHZXRDcmVkZW50aWFsc01ldGhvZCkgPT4ge1xuXHRcdFx0bG9jYXRvci5sb2dpbnMubG9nb3V0KGZhbHNlKS50aGVuKCgpID0+IHtcblx0XHRcdFx0YS5kYXRhLmNyZWRlbnRpYWxzTWV0aG9kID0gbWV0aG9kXG5cdFx0XHRcdGVtaXRXaXphcmRFdmVudCh0aGlzLmRvbSwgV2l6YXJkRXZlbnRUeXBlLlNIT1dfTkVYVF9QQUdFKVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1jZW50ZXIuZnVsbC13aWR0aC5wdC1sXCIsXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIucHQtbFwiLCAvLyBOZWVkZWQgdG8gY2VudGVyIFNWR1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdHdpZHRoOiBcIjQ4MHB4XCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVuZGVyR2lmdENhcmRTdmcocGFyc2VGbG9hdChhLmRhdGEuZ2lmdENhcmRJbmZvLnZhbHVlKSwgbnVsbCwgYS5kYXRhLm1lc3NhZ2UpLFxuXHRcdFx0XHQpLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmZsZXgtY2VudGVyLmZ1bGwtd2lkdGgucHQtbFwiLFxuXHRcdFx0XHRtKExvZ2luQnV0dG9uLCB7XG5cdFx0XHRcdFx0bGFiZWw6IFwiZXhpc3RpbmdBY2NvdW50X2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xhc3M6IFwic21hbGwtbG9naW4tYnV0dG9uXCIsXG5cdFx0XHRcdFx0b25jbGljazogKCkgPT4gbmV4dFBhZ2UoR2V0Q3JlZGVudGlhbHNNZXRob2QuTG9naW4pLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LWNlbnRlci5mdWxsLXdpZHRoLnB0LWwucGJcIixcblx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGxhYmVsOiBcInJlZ2lzdGVyX2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xhc3M6IFwic21hbGwtbG9naW4tYnV0dG9uXCIsXG5cdFx0XHRcdFx0b25jbGljazogKCkgPT4gbmV4dFBhZ2UoR2V0Q3JlZGVudGlhbHNNZXRob2QuU2lnbnVwKSxcblx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxufVxuXG4vKipcbiAqIFRoaXMgcGFnZSB3aWxsIGVpdGhlciBzaG93IGEgc2lnbnVwIG9yIGxvZ2luIGZvcm0gZGVwZW5kaW5nIG9uIGhvdyB0aGV5IGNob29zZSB0byBzZWxlY3QgdGhlaXIgY3JlZGVudGlhbHNcbiAqIFdoZW4gdGhleSBnbyB0byB0aGUgbmV4dCBwYWdlIHRoZSB3aWxsIGJlIGxvZ2dlZCBpbi5cbiAqL1xuXG5jbGFzcyBHaWZ0Q2FyZENyZWRlbnRpYWxzUGFnZSBpbXBsZW1lbnRzIFdpemFyZFBhZ2VOPFJlZGVlbUdpZnRDYXJkTW9kZWw+IHtcblx0cHJpdmF0ZSBkb21FbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgbG9naW5Gb3JtSGVscFRleHQgPSBsYW5nLmdldChcImVtcHR5U3RyaW5nX21zZ1wiKVxuXHRwcml2YXRlIG1haWxBZGRyZXNzID0gc3RyZWFtPHN0cmluZz4oXCJcIilcblx0cHJpdmF0ZSBwYXNzd29yZCA9IHN0cmVhbTxzdHJpbmc+KFwiXCIpXG5cblx0b25jcmVhdGUodm5vZGU6IFZub2RlRE9NPEdpZnRDYXJkUmVkZWVtQXR0cnM+KSB7XG5cdFx0dGhpcy5kb21FbGVtZW50ID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxHaWZ0Q2FyZFJlZGVlbUF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBkYXRhID0gdm5vZGUuYXR0cnMuZGF0YVxuXG5cdFx0c3dpdGNoIChkYXRhLmNyZWRlbnRpYWxzTWV0aG9kKSB7XG5cdFx0XHRjYXNlIEdldENyZWRlbnRpYWxzTWV0aG9kLkxvZ2luOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJMb2dpblBhZ2UoZGF0YSlcblxuXHRcdFx0Y2FzZSBHZXRDcmVkZW50aWFsc01ldGhvZC5TaWdudXA6XG5cdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlclNpZ251cFBhZ2UoZGF0YSlcblx0XHR9XG5cdH1cblxuXHRvbnJlbW92ZSgpIHtcblx0XHR0aGlzLnBhc3N3b3JkKFwiXCIpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckxvZ2luUGFnZShtb2RlbDogUmVkZWVtR2lmdENhcmRNb2RlbCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1ncm93LmZsZXgtY2VudGVyLnNjcm9sbFwiLFxuXHRcdFx0XHRtKFwiLmZsZXgtZ3Jvdy1zaHJpbmstYXV0by5tYXgtd2lkdGgtcy5wdC5wbHItbFwiLCBbdGhpcy5yZW5kZXJMb2dpbkZvcm0obW9kZWwpLCB0aGlzLnJlbmRlckNyZWRlbnRpYWxzU2VsZWN0b3IobW9kZWwpXSksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTG9naW5Gb3JtKG1vZGVsOiBSZWRlZW1HaWZ0Q2FyZE1vZGVsKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKExvZ2luRm9ybSwge1xuXHRcdFx0b25TdWJtaXQ6IGFzeW5jIChtYWlsQWRkcmVzcywgcGFzc3dvcmQpID0+IHtcblx0XHRcdFx0aWYgKG1haWxBZGRyZXNzID09PSBcIlwiIHx8IHBhc3N3b3JkID09PSBcIlwiKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dpbkZvcm1IZWxwVGV4dCA9IGxhbmcuZ2V0KFwibG9naW5GYWlsZWRfbXNnXCIpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdC8vIElmIHRoZXkgdHJ5IHRvIGxvZ2luIHdpdGggYSBtYWlsIGFkZHJlc3MgdGhhdCBpcyBzdG9yZWQsIHdlIHdhbnQgdG8gc3dhcCBvdXQgdGhlIG9sZCBzZXNzaW9uIHdpdGggYSBuZXcgb25lXG5cdFx0XHRcdFx0XHRhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCBtb2RlbC5sb2dpbldpdGhGb3JtQ3JlZGVudGlhbHModGhpcy5tYWlsQWRkcmVzcygpLCB0aGlzLnBhc3N3b3JkKCkpKVxuXHRcdFx0XHRcdFx0ZW1pdFdpemFyZEV2ZW50KHRoaXMuZG9tRWxlbWVudCwgV2l6YXJkRXZlbnRUeXBlLlNIT1dfTkVYVF9QQUdFKVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgVXNlckVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdHNob3dVc2VyRXJyb3IoZSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMubG9naW5Gb3JtSGVscFRleHQgPSBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChnZXRMb2dpbkVycm9yTWVzc2FnZShlLCBmYWxzZSkpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWFpbEFkZHJlc3M6IHRoaXMubWFpbEFkZHJlc3MsXG5cdFx0XHRwYXNzd29yZDogdGhpcy5wYXNzd29yZCxcblx0XHRcdGhlbHBUZXh0OiB0aGlzLmxvZ2luRm9ybUhlbHBUZXh0LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNyZWRlbnRpYWxzU2VsZWN0b3IobW9kZWw6IFJlZGVlbUdpZnRDYXJkTW9kZWwpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKG1vZGVsLnN0b3JlZENyZWRlbnRpYWxzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRyZXR1cm4gbShDcmVkZW50aWFsc1NlbGVjdG9yLCB7XG5cdFx0XHRjcmVkZW50aWFsczogbW9kZWwuc3RvcmVkQ3JlZGVudGlhbHMsXG5cdFx0XHRvbkNyZWRlbnRpYWxzU2VsZWN0ZWQ6IGFzeW5jIChlbmNyeXB0ZWRDcmVkZW50aWFscykgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhcInBsZWFzZVdhaXRfbXNnXCIsIG1vZGVsLmxvZ2luV2l0aFN0b3JlZENyZWRlbnRpYWxzKGVuY3J5cHRlZENyZWRlbnRpYWxzKSlcblx0XHRcdFx0XHRlbWl0V2l6YXJkRXZlbnQodGhpcy5kb21FbGVtZW50LCBXaXphcmRFdmVudFR5cGUuU0hPV19ORVhUX1BBR0UpXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFVzZXJFcnJvcikge1xuXHRcdFx0XHRcdFx0c2hvd1VzZXJFcnJvcihlKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmxvZ2luRm9ybUhlbHBUZXh0ID0gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoZ2V0TG9naW5FcnJvck1lc3NhZ2UoZSwgZmFsc2UpKVxuXHRcdFx0XHRcdFx0aGFuZGxlRXhwZWN0ZWRMb2dpbkVycm9yKGUsIG5vT3ApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclNpZ251cFBhZ2UobW9kZWw6IFJlZGVlbUdpZnRDYXJkTW9kZWwpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oU2lnbnVwRm9ybSwge1xuXHRcdFx0Ly8gQWZ0ZXIgaGF2aW5nIGFuIGFjY291bnQgY3JlYXRlZCB3ZSBsb2cgdGhlbSBpbiB0byBiZSBpbiB0aGUgc2FtZSBzdGF0ZSBhcyBpZiB0aGV5IGhhZCBzZWxlY3RlZCBhbiBleGlzdGluZyBhY2NvdW50XG5cdFx0XHRvbkNvbXBsZXRlOiAobmV3QWNjb3VudERhdGEpID0+IHtcblx0XHRcdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XHRcdFwicGxlYXNlV2FpdF9tc2dcIixcblx0XHRcdFx0XHRtb2RlbFxuXHRcdFx0XHRcdFx0LmhhbmRsZU5ld1NpZ251cChuZXdBY2NvdW50RGF0YSlcblx0XHRcdFx0XHRcdC50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0ZW1pdFdpemFyZEV2ZW50KHRoaXMuZG9tRWxlbWVudCwgV2l6YXJkRXZlbnRUeXBlLlNIT1dfTkVYVF9QQUdFKVxuXHRcdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdC8vIFRPRE8gd2hlbiB3b3VsZCBsb2dpbiBmYWlsIGhlcmUgYW5kIGhvdyBkb2VzIGl0IGdldCBoYW5kbGVkPyBjYW4gd2UgYXR0ZW1wdCB0byBsb2dpbiBhZ2Fpbj9cblx0XHRcdFx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJnaWZ0Q2FyZExvZ2luRXJyb3JfbXNnXCIpXG5cdFx0XHRcdFx0XHRcdG0ucm91dGUuc2V0KFwiL2xvZ2luXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRub0F1dG9Mb2dpbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHR9LFxuXHRcdFx0b25DaGFuZ2VQbGFuOiAoKSA9PiB7XG5cdFx0XHRcdGVtaXRXaXphcmRFdmVudCh0aGlzLmRvbUVsZW1lbnQsIFdpemFyZEV2ZW50VHlwZS5TSE9XX1BSRVZJT1VTX1BBR0UpXG5cdFx0XHR9LFxuXHRcdFx0cmVhZG9ubHk6IG1vZGVsLm5ld0FjY291bnREYXRhICE9IG51bGwsXG5cdFx0XHRwcmVmaWxsZWRNYWlsQWRkcmVzczogbW9kZWwubmV3QWNjb3VudERhdGEgPyBtb2RlbC5uZXdBY2NvdW50RGF0YS5tYWlsQWRkcmVzcyA6IFwiXCIsXG5cdFx0XHRpc0J1c2luZXNzVXNlOiAoKSA9PiBmYWxzZSxcblx0XHRcdGlzUGFpZFN1YnNjcmlwdGlvbjogKCkgPT4gdHJ1ZSxcblx0XHRcdGNhbXBhaWduOiAoKSA9PiBudWxsLFxuXHRcdH0pXG5cdH1cbn1cblxuY2xhc3MgUmVkZWVtR2lmdENhcmRQYWdlIGltcGxlbWVudHMgV2l6YXJkUGFnZU48UmVkZWVtR2lmdENhcmRNb2RlbD4ge1xuXHRwcml2YXRlIGNvbmZpcm1lZCA9IGZhbHNlXG5cdHByaXZhdGUgc2hvd0NvdW50cnlEcm9wZG93bjogYm9vbGVhblxuXHRwcml2YXRlIGNvdW50cnk6IENvdW50cnkgfCBudWxsXG5cdHByaXZhdGUgZG9tITogSFRNTEVsZW1lbnRcblxuXHRjb25zdHJ1Y3Rvcih7IGF0dHJzIH06IFZub2RlPEdpZnRDYXJkUmVkZWVtQXR0cnM+KSB7XG5cdFx0Ly8gd2UgZXhwZWN0IHRoYXQgdGhlIGFjY291bnRpbmcgaW5mbyBpcyBhY3R1YWxseSBhdmFpbGFibGUgYnkgbm93LFxuXHRcdC8vIGJ1dCB3ZSBvcHRpb25hbCBjaGFpbiBiZWNhdXNlIGludm9pY2VDb3VudHJ5IGlzIG51bGxhYmxlIGFueXdheVxuXHRcdHRoaXMuY291bnRyeSA9IG1hcE51bGxhYmxlKGF0dHJzLmRhdGEuYWNjb3VudGluZ0luZm8/Lmludm9pY2VDb3VudHJ5LCBnZXRCeUFiYnJldmlhdGlvbilcblxuXHRcdC8vIGlmIGEgY291bnRyeSBpcyBhbHJlYWR5IHNldCwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGFzayBmb3Igb25lXG5cdFx0dGhpcy5zaG93Q291bnRyeURyb3Bkb3duID0gdGhpcy5jb3VudHJ5ID09IG51bGxcblx0fVxuXG5cdG9uY3JlYXRlKHZub2RlRE9NOiBWbm9kZURPTTxHaWZ0Q2FyZFJlZGVlbUF0dHJzPikge1xuXHRcdHRoaXMuZG9tID0gdm5vZGVET00uZG9tIGFzIEhUTUxFbGVtZW50XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxHaWZ0Q2FyZFJlZGVlbUF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBtb2RlbCA9IHZub2RlLmF0dHJzLmRhdGFcblx0XHRjb25zdCBpc0ZyZWUgPSBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzRnJlZUFjY291bnQoKVxuXG5cdFx0cmV0dXJuIG0oXCJcIiwgW1xuXHRcdFx0bWFwTnVsbGFibGUobW9kZWwubmV3QWNjb3VudERhdGE/LnJlY292ZXJDb2RlLCAoY29kZSkgPT5cblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5wdC1sLnBsci1sXCIsXG5cdFx0XHRcdFx0bShSZWNvdmVyQ29kZUZpZWxkLCB7XG5cdFx0XHRcdFx0XHRzaG93TWVzc2FnZTogdHJ1ZSxcblx0XHRcdFx0XHRcdHJlY292ZXJDb2RlOiBjb2RlLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0KSxcblx0XHRcdGlzRnJlZSA/IHRoaXMucmVuZGVySW5mb0ZvckZyZWVBY2NvdW50cyhtb2RlbCkgOiB0aGlzLnJlbmRlckluZm9Gb3JQYWlkQWNjb3VudHMobW9kZWwpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1jZW50ZXIuZnVsbC13aWR0aC5wdC1sXCIsXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRtYXhXaWR0aDogXCI2MjBweFwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdHRoaXMuc2hvd0NvdW50cnlEcm9wZG93blxuXHRcdFx0XHRcdFx0XHQ/IHJlbmRlckNvdW50cnlEcm9wZG93bih7XG5cdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3RlZENvdW50cnk6IHRoaXMuY291bnRyeSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uU2VsZWN0aW9uQ2hhbmdlZDogKGNvdW50cnkpID0+ICh0aGlzLmNvdW50cnkgPSBjb3VudHJ5KSxcblx0XHRcdFx0XHRcdFx0XHRcdGhlbHBMYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJpbnZvaWNlQ291bnRyeUluZm9Db25zdW1lcl9tc2dcIiksXG5cdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0cmVuZGVyQWNjZXB0R2lmdENhcmRUZXJtc0NoZWNrYm94KHRoaXMuY29uZmlybWVkLCAoY29uZmlybWVkKSA9PiAodGhpcy5jb25maXJtZWQgPSBjb25maXJtZWQpKSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmZsZXgtY2VudGVyLmZ1bGwtd2lkdGgucHQtcy5wYlwiLFxuXHRcdFx0XHRtKExvZ2luQnV0dG9uLCB7XG5cdFx0XHRcdFx0bGFiZWw6IFwicmVkZWVtX2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xhc3M6IFwic21hbGwtbG9naW4tYnV0dG9uXCIsXG5cdFx0XHRcdFx0b25jbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNvbmZpcm1lZCkge1xuXHRcdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcInRlcm1zQWNjZXB0ZWROZXV0cmFsX21zZ1wiKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bW9kZWxcblx0XHRcdFx0XHRcdFx0LnJlZGVlbUdpZnRDYXJkKHRoaXMuY291bnRyeSlcblx0XHRcdFx0XHRcdFx0LnRoZW4oKCkgPT4gZW1pdFdpemFyZEV2ZW50KHRoaXMuZG9tLCBXaXphcmRFdmVudFR5cGUuQ0xPU0VfRElBTE9HKSlcblx0XHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoVXNlckVycm9yLCBzaG93VXNlckVycm9yKSlcblx0XHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoQ2FuY2VsbGVkRXJyb3IsIG5vT3ApKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRDcmVkaXRPckRlYml0TWVzc2FnZShtb2RlbDogUmVkZWVtR2lmdENhcmRNb2RlbCk6IHN0cmluZyB7XG5cdFx0Y29uc3QgcmVtYWluaW5nQW1vdW50ID0gTnVtYmVyKG1vZGVsLmdpZnRDYXJkSW5mby52YWx1ZSkgLSBtb2RlbC5wcmVtaXVtUHJpY2Vcblx0XHRpZiAocmVtYWluaW5nQW1vdW50ID4gMCkge1xuXHRcdFx0cmV0dXJuIGAke2xhbmcuZ2V0KFwiZ2lmdENhcmRVcGdyYWRlTm90aWZ5Q3JlZGl0X21zZ1wiLCB7XG5cdFx0XHRcdFwie3ByaWNlfVwiOiBmb3JtYXRQcmljZShtb2RlbC5wcmVtaXVtUHJpY2UsIHRydWUpLFxuXHRcdFx0XHRcInthbW91bnR9XCI6IGZvcm1hdFByaWNlKHJlbWFpbmluZ0Ftb3VudCwgdHJ1ZSksXG5cdFx0XHR9KX0gJHtsYW5nLmdldChcImNyZWRpdFVzYWdlT3B0aW9uc19tc2dcIil9YFxuXHRcdH0gZWxzZSBpZiAocmVtYWluaW5nQW1vdW50IDwgMCkge1xuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0KFwiZ2lmdENhcmRVcGdyYWRlTm90aWZ5RGViaXRfbXNnXCIsIHtcblx0XHRcdFx0XCJ7cHJpY2V9XCI6IGZvcm1hdFByaWNlKG1vZGVsLnByZW1pdW1QcmljZSwgdHJ1ZSksXG5cdFx0XHRcdFwie2Ftb3VudH1cIjogZm9ybWF0UHJpY2UocmVtYWluaW5nQW1vdW50ICogLTEsIHRydWUpLFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiXCJcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckluZm9Gb3JGcmVlQWNjb3VudHMobW9kZWw6IFJlZGVlbUdpZnRDYXJkTW9kZWwpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIFtcblx0XHRcdG0oXCIucHQtbC5wbHItbFwiLCBgJHtsYW5nLmdldChcImdpZnRDYXJkVXBncmFkZU5vdGlmeVJldm9sdXRpb25hcnlfbXNnXCIpfSAke3RoaXMuZ2V0Q3JlZGl0T3JEZWJpdE1lc3NhZ2UobW9kZWwpfWApLFxuXHRcdFx0bShcIi5jZW50ZXIuaDQucHRcIiwgbGFuZy5nZXQoXCJ1cGdyYWRlQ29uZmlybV9tc2dcIikpLFxuXHRcdFx0bShcIi5mbGV4LXNwYWNlLWFyb3VuZC5mbGV4LXdyYXBcIiwgW1xuXHRcdFx0XHRtKFwiLmZsZXgtZ3Jvdy1zaHJpbmstaGFsZi5wbHItbFwiLCBbXG5cdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInN1YnNjcmlwdGlvbl9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0dmFsdWU6IFwiUmV2b2x1dGlvbmFyeVwiLFxuXHRcdFx0XHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwicGF5bWVudEludGVydmFsX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHR2YWx1ZTogbGFuZy5nZXQoXCJwcmljaW5nLnllYXJseV9sYWJlbFwiKSxcblx0XHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInByaWNlX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHR2YWx1ZTogZm9ybWF0UHJpY2UoTnVtYmVyKG1vZGVsLnByZW1pdW1QcmljZSksIHRydWUpICsgXCIgXCIgKyBsYW5nLmdldChcInByaWNpbmcucGVyWWVhcl9sYWJlbFwiKSxcblx0XHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInBheW1lbnRNZXRob2RfbGFiZWxcIixcblx0XHRcdFx0XHRcdHZhbHVlOiBnZXRQYXltZW50TWV0aG9kTmFtZShtb2RlbC5wYXltZW50TWV0aG9kKSxcblx0XHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXgtZ3Jvdy1zaHJpbmstaGFsZi5wbHItbC5mbGV4LWNlbnRlci5pdGVtcy1lbmRcIixcblx0XHRcdFx0XHRtKFwiaW1nW3NyYz1cIiArIEhhYlJlbWluZGVySW1hZ2UgKyBcIl0ucHQuYmctd2hpdGUuYm9yZGVyLXJhZGl1c1wiLCB7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHR3aWR0aDogXCIyMDBweFwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdF0pLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySW5mb0ZvclBhaWRBY2NvdW50cyhtb2RlbDogUmVkZWVtR2lmdENhcmRNb2RlbCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIucHQtbC5wbHItbC5mbGV4LWNlbnRlclwiLFxuXHRcdFx0XHRgJHtsYW5nLmdldChcImdpZnRDYXJkQ3JlZGl0Tm90aWZ5X21zZ1wiLCB7XG5cdFx0XHRcdFx0XCJ7Y3JlZGl0fVwiOiBmb3JtYXRQcmljZShOdW1iZXIobW9kZWwuZ2lmdENhcmRJbmZvLnZhbHVlKSwgdHJ1ZSksXG5cdFx0XHRcdH0pfSAke2xhbmcuZ2V0KFwiY3JlZGl0VXNhZ2VPcHRpb25zX21zZ1wiKX1gLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmZsZXgtZ3Jvdy1zaHJpbmstaGFsZi5wbHItbC5mbGV4LWNlbnRlci5pdGVtcy1lbmRcIixcblx0XHRcdFx0bShcImltZ1tzcmM9XCIgKyBIYWJSZW1pbmRlckltYWdlICsgXCJdLnB0LmJnLXdoaXRlLmJvcmRlci1yYWRpdXNcIiwge1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHR3aWR0aDogXCIyMDBweFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRdXG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRSZWRlZW1HaWZ0Q2FyZFdpemFyZChoYXNoRnJvbVVybDogc3RyaW5nKTogUHJvbWlzZTxEaWFsb2c+IHtcblx0Y29uc3QgbW9kZWwgPSBhd2FpdCBsb2FkTW9kZWwoaGFzaEZyb21VcmwpXG5cblx0Y29uc3Qgd2l6YXJkUGFnZXMgPSBbXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoR2lmdENhcmRXZWxjb21lUGFnZSwge1xuXHRcdFx0ZGF0YTogbW9kZWwsXG5cdFx0XHRoZWFkZXJUaXRsZTogKCkgPT4gXCJnaWZ0Q2FyZF9sYWJlbFwiLFxuXHRcdFx0bmV4dEFjdGlvbjogYXN5bmMgKCkgPT4gdHJ1ZSxcblx0XHRcdGlzU2tpcEF2YWlsYWJsZTogKCkgPT4gZmFsc2UsXG5cdFx0XHRpc0VuYWJsZWQ6ICgpID0+IHRydWUsXG5cdFx0fSksXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoR2lmdENhcmRDcmVkZW50aWFsc1BhZ2UsIHtcblx0XHRcdGRhdGE6IG1vZGVsLFxuXHRcdFx0aGVhZGVyVGl0bGU6ICgpID0+IChtb2RlbC5jcmVkZW50aWFsc01ldGhvZCA9PT0gR2V0Q3JlZGVudGlhbHNNZXRob2QuU2lnbnVwID8gXCJyZWdpc3Rlcl9sYWJlbFwiIDogXCJsb2dpbl9sYWJlbFwiKSxcblx0XHRcdG5leHRBY3Rpb246IGFzeW5jICgpID0+IHRydWUsXG5cdFx0XHRpc1NraXBBdmFpbGFibGU6ICgpID0+IGZhbHNlLFxuXHRcdFx0aXNFbmFibGVkOiAoKSA9PiB0cnVlLFxuXHRcdH0pLFxuXHRcdHdpemFyZFBhZ2VXcmFwcGVyKFJlZGVlbUdpZnRDYXJkUGFnZSwge1xuXHRcdFx0ZGF0YTogbW9kZWwsXG5cdFx0XHRoZWFkZXJUaXRsZTogKCkgPT4gXCJyZWRlZW1fbGFiZWxcIixcblx0XHRcdG5leHRBY3Rpb246IGFzeW5jICgpID0+IHRydWUsXG5cdFx0XHRpc1NraXBBdmFpbGFibGU6ICgpID0+IGZhbHNlLFxuXHRcdFx0aXNFbmFibGVkOiAoKSA9PiB0cnVlLFxuXHRcdH0pLFxuXHRdXG5cdHJldHVybiBjcmVhdGVXaXphcmREaWFsb2coXG5cdFx0bW9kZWwsXG5cdFx0d2l6YXJkUGFnZXMsXG5cdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgdXJsUGFyYW1zID0gbW9kZWwubWFpbEFkZHJlc3MgPyB7IGxvZ2luV2l0aDogbW9kZWwubWFpbEFkZHJlc3MsIG5vQXV0b0xvZ2luOiB0cnVlIH0gOiB7fVxuXHRcdFx0bS5yb3V0ZS5zZXQoXCIvbG9naW5cIiwgdXJsUGFyYW1zKVxuXHRcdH0sXG5cdFx0RGlhbG9nVHlwZS5FZGl0TGFyZ2UsXG5cdCkuZGlhbG9nXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRNb2RlbChoYXNoRnJvbVVybDogc3RyaW5nKTogUHJvbWlzZTxSZWRlZW1HaWZ0Q2FyZE1vZGVsPiB7XG5cdGNvbnN0IHsgaWQsIGtleSB9ID0gYXdhaXQgZ2V0VG9rZW5Gcm9tVXJsKGhhc2hGcm9tVXJsKVxuXHRjb25zdCBnaWZ0Q2FyZEluZm8gPSBhd2FpdCBsb2NhdG9yLmdpZnRDYXJkRmFjYWRlLmdldEdpZnRDYXJkSW5mbyhpZCwga2V5KVxuXG5cdGNvbnN0IHN0b3JlZENyZWRlbnRpYWxzID0gYXdhaXQgbG9jYXRvci5jcmVkZW50aWFsc1Byb3ZpZGVyLmdldEludGVybmFsQ3JlZGVudGlhbHNJbmZvcygpXG5cdGNvbnN0IHByaWNlc0RhdGFQcm92aWRlciA9IGF3YWl0IFByaWNlQW5kQ29uZmlnUHJvdmlkZXIuZ2V0SW5pdGlhbGl6ZWRJbnN0YW5jZShudWxsLCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvciwgbnVsbClcblxuXHRyZXR1cm4gbmV3IFJlZGVlbUdpZnRDYXJkTW9kZWwoXG5cdFx0e1xuXHRcdFx0Z2lmdENhcmRJbmZvLFxuXHRcdFx0a2V5LFxuXHRcdFx0cHJlbWl1bVByaWNlOiBwcmljZXNEYXRhUHJvdmlkZXIuZ2V0U3Vic2NyaXB0aW9uUHJpY2UoUGF5bWVudEludGVydmFsLlllYXJseSwgUGxhblR5cGUuUmV2b2x1dGlvbmFyeSwgVXBncmFkZVByaWNlVHlwZS5QbGFuQWN0dWFsUHJpY2UpLFxuXHRcdFx0c3RvcmVkQ3JlZGVudGlhbHMsXG5cdFx0fSxcblx0XHRsb2NhdG9yLmdpZnRDYXJkRmFjYWRlLFxuXHRcdGxvY2F0b3IuY3JlZGVudGlhbHNQcm92aWRlcixcblx0XHRsb2NhdG9yLnNlY29uZEZhY3RvckhhbmRsZXIsXG5cdFx0bG9jYXRvci5sb2dpbnMsXG5cdFx0bG9jYXRvci5lbnRpdHlDbGllbnQsXG5cdClcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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