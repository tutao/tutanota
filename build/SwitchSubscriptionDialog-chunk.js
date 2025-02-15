import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode, isApp, isIOSApp } from "./Env-chunk.js";
import { AppType, DeviceType, client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { NBSP, TypeRef, assertNotNull, base64ExtToBase64, base64ToUint8Array, defer, delay, downcast, getFirstOrThrow, incrementDate, last, neverNull, noOp, ofClass, pMap, stringToBase64, typedValues, uint8ArrayToBase64 } from "./dist2-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime } from "./styles-chunk.js";
import { getColorLuminance, isMonochrome, theme } from "./theme-chunk.js";
import { AccountType, AccountTypeNames, ApprovalStatus, AvailablePlans, BookingFailureReason, BookingItemFeatureType, Const, DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN, DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN, FeatureType, HighlightedPlans, Keys, LegacyPlans, NewBusinessPlans, NewPaidPlans, NewPersonalPlans, OperationType, PaymentDataResultType, PaymentMethodType, PaymentMethodTypeToName, PlanType, PlanTypeToName, PostingType, SubscriptionType, TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS, UnsubscribeFailureReason, getClientType, getDefaultPaymentMethod, getPaymentMethodType } from "./TutanotaConstants-chunk.js";
import { px, size } from "./size-chunk.js";
import { GENERATED_MAX_ID, elementIdPart, getEtId } from "./EntityUtils-chunk.js";
import { AccountingInfoTypeRef, BookingTypeRef, CustomerInfoTypeRef, CustomerTypeRef, GiftCardTypeRef, GroupInfoTypeRef, InvoiceInfoTypeRef, OrderProcessingAgreementTypeRef, UserTypeRef, createAppStoreSubscriptionGetIn, createCreditCard, createDebitServicePutData, createRegistrationCaptchaServiceData, createRegistrationCaptchaServiceGetData, createSignOrderProcessingAgreementData, createSurveyData, createSwitchAccountTypePostIn } from "./TypeRefs2-chunk.js";
import { isMailAddress, isValidCreditCardNumber } from "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { deviceConfig } from "./DeviceConfig-chunk.js";
import { MobilePaymentError } from "./ErrorUtils-chunk.js";
import { AccessDeactivatedError, AccessExpiredError, BadGatewayError, BadRequestError, InvalidDataError, LockedError, NotFoundError, PreconditionFailedError, TooManyRequestsError } from "./RestError-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { SessionType } from "./SessionType-chunk.js";
import { AppStoreSubscriptionService, DebitService, LocationService, RegistrationCaptchaService, SignOrderProcessingAgreementService, SwitchAccountTypeService } from "./Services-chunk.js";
import { BaseButton, Button, ButtonType } from "./Button-chunk.js";
import { Icons, PayPalLogo, VisSignupImage } from "./Icons-chunk.js";
import { DialogHeaderBar } from "./DialogHeaderBar-chunk.js";
import { Countries, CountryType, getByAbbreviation } from "./CountryList-chunk.js";
import { Autocapitalize, Autocomplete, Dialog, DialogType, DropDownSelector, TextField, attachDropdown, createDropdown, ifAllowedTutaLinks, inputLineHeight$1 as inputLineHeight, renderCountryDropdown } from "./Dialog-chunk.js";
import { BootIcons, Icon } from "./Icon-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { formatDate, formatMailAddressFromParts, formatStorageSize } from "./Formatter-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { getMailAddressDisplayText, isTutaMailAddress } from "./SharedMailUtils-chunk.js";
import { createNotAvailableForFreeClickHandler } from "./SubscriptionDialogs-chunk.js";
import { ExternalLink } from "./ExternalLink-chunk.js";
import { Checkbox } from "./Checkbox-chunk.js";
import { ExpanderButton, ExpanderPanel } from "./Expander-chunk.js";
import { RatingCheckResult, getRatingAllowed, showAppRatingDialog } from "./InAppRatingDialog-chunk.js";
import { isCustomizationEnabledForCustomer } from "./CustomerUtils-chunk.js";
import { mailLocator } from "./mailLocator-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import { ColumnWidth, Table } from "./Table-chunk.js";
import { HtmlEditor, HtmlEditorMode } from "./HtmlEditor-chunk.js";
import { getWhitelabelRegistrationDomains, stringToSubscriptionType } from "./LoginUtils-chunk.js";
import { StorageBehavior } from "./UsageTestModel-chunk.js";
import { formatNameAndAddress } from "./CommonFormatter-chunk.js";
import { PasswordForm, PasswordModel } from "./PasswordForm-chunk.js";
import { WizardEventType, createWizardDialog, emitWizardEvent, wizardPageWrapper } from "./WizardDialog-chunk.js";
import { SegmentControl } from "./SegmentControl-chunk.js";
import { UpgradeType, appStorePlanName, getCurrentCount, getLazyLoadedPayPalUrl, getPreconditionFailedPaymentMsg, getTotalStorageCapacityPerCustomer, hasRunningAppStoreSubscription, isAutoResponderActive, isEventInvitesActive, isSharingActive, isWhitelabelActive, queryAppStoreSubscriptionOwnership } from "./SubscriptionUtils-chunk.js";
import { RecoverCodeField } from "./RecoverCodeDialog-chunk.js";
import { isPaidPlanDomain } from "./MailAddressesUtils-chunk.js";
import { FeatureListProvider, PaymentInterval, PriceAndConfigProvider, UpgradePriceType, asPaymentInterval, formatMonthlyPrice, formatPrice, formatPriceDataWithInfo, formatPriceWithInfo, getDisplayNameOfPlanType, getPaymentMethodInfoText, getPaymentMethodName, isReferenceDateWithinCyberMondayCampaign } from "./PriceUtils-chunk.js";
import { BOX_MARGIN, BuyOptionBox, BuyOptionDetails, CURRENT_GIFT_CARD_TERMS_VERSION, CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, GiftCardMessageEditorField, GiftCardStatus, TermsSection, getActiveSubscriptionActionButtonReplacement, loadGiftCards, renderTermsAndConditionsButton, showGiftCardToShare, showPurchaseGiftCardDialog } from "./PurchaseGiftCardDialog-chunk.js";
import { MessageBox } from "./MessageBox-chunk.js";
import { SURVEY_VERSION_NUMBER, showLeavingUserSurveyWizard } from "./LeavingUserSurveyWizard-chunk.js";

//#region src/common/subscription/SubscriptionSelector.ts
const BusinessUseItems = [{
	name: lang.get("pricing.privateUse_label"),
	value: false
}, {
	name: lang.get("pricing.businessUse_label"),
	value: true
}];
function getActionButtonBySubscription(actionButtons, subscription) {
	const ret = actionButtons[subscription];
	if (ret == null) throw new ProgrammingError("Plan is not valid");
	return () => mithril_default(LoginButton, ret());
}
var SubscriptionSelector = class {
	containerDOM = null;
	featuresExpanded = {
		[PlanType.Free]: false,
		[PlanType.Revolutionary]: false,
		[PlanType.Legend]: false,
		[PlanType.Essential]: false,
		[PlanType.Advanced]: false,
		[PlanType.Unlimited]: false,
		All: false
	};
	oninit(vnode) {
		const acceptedPlans = vnode.attrs.acceptedPlans;
		const onlyBusinessPlansAccepted = acceptedPlans.every((plan) => NewBusinessPlans.includes(plan));
		if (onlyBusinessPlansAccepted) vnode.attrs.options.businessUse(true);
	}
	renderHeadline(msg, currentPlanType, priceInfoTextId, isBusiness, isCyberMonday) {
		const wrapInDiv = (text, style) => {
			return mithril_default(".b.center", { style }, text);
		};
		if (msg) return wrapInDiv(lang.getTranslationText(msg));
else if (currentPlanType != null && LegacyPlans.includes(currentPlanType)) return wrapInDiv(lang.get("currentPlanDiscontinued_msg"));
		if (priceInfoTextId && lang.exists(priceInfoTextId)) return wrapInDiv(lang.get(priceInfoTextId));
		if (isCyberMonday && !isBusiness) return wrapInDiv(lang.get("pricing.cyber_monday_msg"), {
			width: "230px",
			margin: "1em auto 0 auto"
		});
	}
	view(vnode) {
		const { acceptedPlans, priceInfoTextId, msg, featureListProvider, currentPlanType, options, boxWidth } = vnode.attrs;
		const columnWidth = boxWidth + BOX_MARGIN * 2;
		const inMobileView = (this.containerDOM && this.containerDOM.clientWidth < columnWidth * 2) == true;
		const featureExpander = this.renderFeatureExpanders(inMobileView, featureListProvider);
		let additionalInfo;
		let plans;
		const currentPlan = currentPlanType;
		const signup$1 = currentPlan == null;
		const onlyBusinessPlansAccepted = acceptedPlans.every((plan) => NewBusinessPlans.includes(plan));
		const onlyPersonalPlansAccepted = acceptedPlans.every((plan) => NewPersonalPlans.includes(plan));
		const showBusinessSelector = !onlyBusinessPlansAccepted && !onlyPersonalPlansAccepted && !isIOSApp();
		const isCyberMonday = isReferenceDateWithinCyberMondayCampaign(Const.CURRENT_DATE ?? new Date());
		let subscriptionPeriodInfoMsg = !signup$1 && currentPlan !== PlanType.Free ? lang.get("switchSubscriptionInfo_msg") + " " : "";
		if (options.businessUse()) {
			plans = [
				PlanType.Essential,
				PlanType.Advanced,
				PlanType.Unlimited
			];
			subscriptionPeriodInfoMsg += lang.get("pricing.subscriptionPeriodInfoBusiness_msg");
		} else {
			if (inMobileView) if (isCyberMonday) plans = [
				PlanType.Legend,
				PlanType.Revolutionary,
				PlanType.Free
			];
else plans = [
				PlanType.Revolutionary,
				PlanType.Legend,
				PlanType.Free
			];
else if (isCyberMonday) plans = [
				PlanType.Free,
				PlanType.Legend,
				PlanType.Revolutionary
			];
else plans = [
				PlanType.Free,
				PlanType.Revolutionary,
				PlanType.Legend
			];
			subscriptionPeriodInfoMsg += lang.get("pricing.subscriptionPeriodInfoPrivate_msg");
		}
		const shouldShowFirstYearDiscountNotice = !isIOSApp() && isCyberMonday && !options.businessUse() && options.paymentInterval() === PaymentInterval.Yearly;
		additionalInfo = mithril_default(".flex.flex-column.items-center", [
			featureExpander.All,
			mithril_default(".smaller.mb.center", subscriptionPeriodInfoMsg),
			shouldShowFirstYearDiscountNotice && mithril_default(".smaller.mb.center", `* ${lang.get("pricing.legendAsterisk_msg")}`)
		]);
		const buyBoxesViewPlacement = plans.filter((plan) => acceptedPlans.includes(plan) || currentPlanType === plan).map((personalPlan, i) => {
			return [this.renderBuyOptionBox(vnode.attrs, inMobileView, personalPlan, isCyberMonday), this.renderBuyOptionDetails(vnode.attrs, i === 0, personalPlan, featureExpander, isCyberMonday)];
		});
		return mithril_default("", { lang: lang.code }, [
			showBusinessSelector ? mithril_default(SegmentControl, {
				selectedValue: options.businessUse(),
				onValueSelected: options.businessUse,
				items: BusinessUseItems
			}) : null,
			this.renderHeadline(msg, currentPlanType, priceInfoTextId, options.businessUse(), isCyberMonday),
			mithril_default(".flex.center-horizontally.wrap", {
				"data-testid": "dialog:select-subscription",
				oncreate: (vnode$1) => {
					this.containerDOM = vnode$1.dom;
					mithril_default.redraw();
				},
				style: { "column-gap": px(BOX_MARGIN) }
			}, mithril_default(".plans-grid", buyBoxesViewPlacement.flat()), additionalInfo)
		]);
	}
	renderBuyOptionBox(attrs, inMobileView, planType, isCyberMonday) {
		return mithril_default("", { style: { width: attrs.boxWidth ? px(attrs.boxWidth) : px(230) } }, mithril_default(BuyOptionBox, this.createBuyOptionBoxAttr(attrs, planType, inMobileView, isCyberMonday)));
	}
	renderBuyOptionDetails(attrs, renderCategoryTitle, planType, featureExpander, isCyberMonday) {
		return mithril_default("", { style: { width: attrs.boxWidth ? px(attrs.boxWidth) : px(230) } }, mithril_default(BuyOptionDetails, this.createBuyOptionBoxDetailsAttr(attrs, planType, renderCategoryTitle, isCyberMonday)), featureExpander[planType]);
	}
	createBuyOptionBoxAttr(selectorAttrs, targetSubscription, mobile, isCyberMonday) {
		const { priceAndConfigProvider } = selectorAttrs;
		const interval = selectorAttrs.options.paymentInterval();
		const upgradingToPaidAccount = !selectorAttrs.currentPlanType || selectorAttrs.currentPlanType === PlanType.Free;
		const isHighlighted = (() => {
			if (isCyberMonday) return targetSubscription === PlanType.Legend;
			return upgradingToPaidAccount && HighlightedPlans.includes(targetSubscription);
		})();
		const multiuser = NewBusinessPlans.includes(targetSubscription) || LegacyPlans.includes(targetSubscription) || selectorAttrs.multipleUsersAllowed;
		const subscriptionPrice = priceAndConfigProvider.getSubscriptionPrice(interval, targetSubscription, UpgradePriceType.PlanActualPrice);
		let priceStr;
		let referencePriceStr = undefined;
		if (isIOSApp()) {
			const prices = priceAndConfigProvider.getMobilePrices().get(PlanTypeToName[targetSubscription].toLowerCase());
			if (prices != null) if (isCyberMonday && targetSubscription === PlanType.Legend && interval == PaymentInterval.Yearly) {
				const revolutionaryPrice = priceAndConfigProvider.getMobilePrices().get(PlanTypeToName[PlanType.Revolutionary].toLowerCase());
				priceStr = revolutionaryPrice?.displayYearlyPerMonth ?? NBSP;
				referencePriceStr = prices?.displayYearlyPerMonth;
			} else switch (interval) {
				case PaymentInterval.Monthly:
					priceStr = prices.displayMonthlyPerMonth;
					break;
				case PaymentInterval.Yearly:
					priceStr = prices.displayYearlyPerYear;
					break;
			}
else {
				priceStr = NBSP;
				referencePriceStr = NBSP;
			}
		} else {
			const referencePrice = priceAndConfigProvider.getSubscriptionPrice(interval, targetSubscription, UpgradePriceType.PlanReferencePrice);
			priceStr = formatMonthlyPrice(subscriptionPrice, interval);
			if (referencePrice > subscriptionPrice) referencePriceStr = formatMonthlyPrice(referencePrice, interval);
else if (interval == PaymentInterval.Yearly && subscriptionPrice !== 0 && !isCyberMonday) {
				const monthlyReferencePrice = priceAndConfigProvider.getSubscriptionPrice(PaymentInterval.Monthly, targetSubscription, UpgradePriceType.PlanActualPrice);
				referencePriceStr = formatMonthlyPrice(monthlyReferencePrice, PaymentInterval.Monthly);
			}
		}
		const asteriskOrEmptyString = !isIOSApp() && isCyberMonday && targetSubscription === PlanType.Legend && interval === PaymentInterval.Yearly ? "*" : "";
		return {
			heading: getDisplayNameOfPlanType(targetSubscription),
			actionButton: selectorAttrs.currentPlanType === targetSubscription ? getActiveSubscriptionActionButtonReplacement() : getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price: priceStr,
			referencePrice: referencePriceStr,
			priceHint: lang.makeTranslation("price_hint", `${getPriceHint(subscriptionPrice, interval, multiuser)}${asteriskOrEmptyString}`),
			helpLabel: getHelpLabel(targetSubscription, selectorAttrs.options.businessUse()),
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			selectedPaymentInterval: selectorAttrs.allowSwitchingPaymentInterval && targetSubscription !== PlanType.Free ? selectorAttrs.options.paymentInterval : null,
			accountPaymentInterval: interval,
			highlighted: isHighlighted,
			mobile,
			bonusMonths: targetSubscription !== PlanType.Free && interval === PaymentInterval.Yearly ? Number(selectorAttrs.priceAndConfigProvider.getRawPricingData().bonusMonthsForYearlyPlan) : 0,
			targetSubscription
		};
	}
	createBuyOptionBoxDetailsAttr(selectorAttrs, targetSubscription, renderCategoryTitle, isCyberMonday) {
		const { featureListProvider } = selectorAttrs;
		const subscriptionFeatures = featureListProvider.getFeatureList(targetSubscription);
		const categoriesToShow = subscriptionFeatures.categories.map((fc) => {
			return localizeFeatureCategory(fc, targetSubscription, selectorAttrs);
		}).filter((fc) => fc != null);
		const isLegend = targetSubscription === PlanType.Legend;
		const isYearly = selectorAttrs.options.paymentInterval() === PaymentInterval.Yearly;
		return {
			categories: categoriesToShow,
			featuresExpanded: this.featuresExpanded[targetSubscription] || this.featuresExpanded.All,
			renderCategoryTitle,
			iconStyle: isCyberMonday && isYearly && isLegend ? { fill: theme.content_accent_cyber_monday } : undefined
		};
	}
	/**
	* Renders the feature expanders depending on whether currently displaying the feature list in single-column layout or in multi-column layout.
	* If a specific expander is not needed and thus should not be renderer, null | undefined is returned
	*/
	renderFeatureExpanders(inMobileView, featureListProvider) {
		if (!featureListProvider.featureLoadingDone()) return {
			[PlanType.Free]: null,
			[PlanType.Revolutionary]: null,
			[PlanType.Legend]: null,
			[PlanType.Essential]: null,
			[PlanType.Advanced]: null,
			[PlanType.Unlimited]: null,
			All: null
		};
		if (inMobileView) {
			if (this.featuresExpanded.All) for (const k in this.featuresExpanded) this.featuresExpanded[k] = true;
			return {
				[PlanType.Free]: this.renderExpander(PlanType.Free),
				[PlanType.Revolutionary]: this.renderExpander(PlanType.Revolutionary),
				[PlanType.Legend]: this.renderExpander(PlanType.Legend),
				[PlanType.Advanced]: this.renderExpander(PlanType.Advanced),
				[PlanType.Essential]: this.renderExpander(PlanType.Essential),
				[PlanType.Unlimited]: this.renderExpander(PlanType.Unlimited),
				All: null
			};
		} else {
			for (const k in this.featuresExpanded) this.featuresExpanded[k] = this.featuresExpanded.All;
			return Object.assign({}, { All: this.renderExpander("All") });
		}
	}
	/**
	* Renders a single feature expander.
	* @param subType The current expander that should be rendered
	* @private
	*/
	renderExpander(subType) {
		return this.featuresExpanded[subType] ? null : mithril_default(Button, {
			label: "pricing.showAllFeatures",
			type: ButtonType.Secondary,
			click: (event) => {
				this.featuresExpanded[subType] = !this.featuresExpanded[subType];
				event.stopPropagation();
			}
		});
	}
};
function localizeFeatureListItem(item, targetSubscription, attrs) {
	const text = tryGetTranslation(item.text, getReplacement(item.replacements, targetSubscription, attrs));
	if (text == null) return null;
	if (!item.toolTip) return {
		text,
		key: item.text,
		antiFeature: item.antiFeature,
		omit: item.omit,
		heart: !!item.heart
	};
else {
		const toolTipText = tryGetTranslation(item.toolTip);
		if (toolTipText === null) return null;
		const toolTip = item.toolTip.endsWith("_markdown") ? mithril_default.trust(toolTipText) : toolTipText;
		return {
			text,
			toolTip,
			key: item.text,
			antiFeature: item.antiFeature,
			omit: item.omit,
			heart: !!item.heart
		};
	}
}
function localizeFeatureCategory(category, targetSubscription, attrs) {
	const title = tryGetTranslation(category.title);
	const features = downcast(category.features.map((f) => localizeFeatureListItem(f, targetSubscription, attrs)).filter((it) => it != null));
	return {
		title,
		key: category.title,
		features,
		featureCount: category.featureCount
	};
}
function tryGetTranslation(key, replacements) {
	try {
		return lang.get(key, replacements);
	} catch (e) {
		console.log("could not translate feature text for key", key, "hiding feature item");
		return null;
	}
}
function getReplacement(key, subscription, attrs) {
	const { priceAndConfigProvider } = attrs;
	switch (key) {
		case "customDomains": return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).customDomains };
		case "mailAddressAliases": return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).includedAliases };
		case "storage": return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).includedStorage };
	}
}
function getHelpLabel(planType, businessUse) {
	if (planType === PlanType.Free) return "pricing.upgradeLater_msg";
	return businessUse ? "pricing.excludesTaxes_msg" : "pricing.includesTaxes_msg";
}
function getPriceHint(subscriptionPrice, paymentInterval, multiuser) {
	if (subscriptionPrice > 0) if (multiuser) return lang.get(paymentInterval === PaymentInterval.Yearly ? "pricing.perUserMonthPaidYearly_label" : "pricing.perUserMonth_label");
else return lang.get(paymentInterval === PaymentInterval.Yearly ? "pricing.perMonthPaidYearly_label" : "pricing.perMonth_label");
	return "";
}

//#endregion
//#region src/common/subscription/SwitchSubscriptionDialogModel.ts
var SwitchSubscriptionDialogModel = class {
	currentPlanInfo;
	constructor(customer, accountingInfo, planType, lastBooking) {
		this.customer = customer;
		this.accountingInfo = accountingInfo;
		this.planType = planType;
		this.lastBooking = lastBooking;
		this.currentPlanInfo = this._initCurrentPlanInfo();
	}
	_initCurrentPlanInfo() {
		const paymentInterval = asPaymentInterval(this.accountingInfo.paymentInterval);
		return {
			businessUse: this.customer.businessUse,
			planType: this.planType,
			paymentInterval
		};
	}
	/**
	* Check if the user's current plan has multiple users due to a legacy agreement and will continue to do so if the user switches plans.
	*
	* @return true if multiple users are supported due to legacy, false if not; note that returning false does not mean that the current plan does not actually support multiple users
	*/
	multipleUsersStillSupportedLegacy() {
		if (isCustomizationEnabledForCustomer(this.customer, FeatureType.MultipleUsers)) return true;
		if (LegacyPlans.includes(this.planType)) {
			const userItem = this.lastBooking.items.find((item) => item.featureType === BookingItemFeatureType.LegacyUsers);
			const sharedMailItem = this.lastBooking.items.find((item) => item.featureType === BookingItemFeatureType.SharedMailGroup);
			const localAdminItem = this.lastBooking.items.find((item) => item.featureType === BookingItemFeatureType.LocalAdminGroup);
			const userCount = Number(userItem?.currentCount);
			const sharedMailCount = sharedMailItem ? Number(sharedMailItem.currentCount) : 0;
			const localAdminCount = localAdminItem ? Number(localAdminItem.currentCount) : 0;
			return userCount + sharedMailCount + localAdminCount > 1;
		}
		return false;
	}
};

//#endregion
//#region src/common/subscription/InvoiceDataInput.ts
var import_stream$7 = __toESM(require_stream(), 1);
let InvoiceDataInputLocation = function(InvoiceDataInputLocation$1) {
	InvoiceDataInputLocation$1[InvoiceDataInputLocation$1["InWizard"] = 0] = "InWizard";
	InvoiceDataInputLocation$1[InvoiceDataInputLocation$1["Other"] = 1] = "Other";
	return InvoiceDataInputLocation$1;
}({});
var InvoiceDataInput = class {
	invoiceAddressComponent;
	selectedCountry;
	vatNumber = "";
	__paymentPaypalTest;
	constructor(businessUse, invoiceData, location = InvoiceDataInputLocation.Other) {
		this.businessUse = businessUse;
		this.location = location;
		this.__paymentPaypalTest = locator.usageTestController.getTest("payment.paypal");
		this.invoiceAddressComponent = new HtmlEditor().setStaticNumberOfLines(5).showBorders().setPlaceholderId("invoiceAddress_label").setMode(HtmlEditorMode.HTML).setHtmlMonospace(false).setValue(invoiceData.invoiceAddress);
		this.selectedCountry = (0, import_stream$7.default)(invoiceData.country);
		this.view = this.view.bind(this);
		this.oncreate = this.oncreate.bind(this);
	}
	view() {
		return [
			this.businessUse || this.location !== InvoiceDataInputLocation.InWizard ? mithril_default("", [mithril_default(".pt", mithril_default(this.invoiceAddressComponent)), mithril_default(".small", lang.get(this.businessUse ? "invoiceAddressInfoBusiness_msg" : "invoiceAddressInfoPrivate_msg"))]) : null,
			renderCountryDropdown({
				selectedCountry: this.selectedCountry(),
				onSelectionChanged: this.selectedCountry,
				helpLabel: () => lang.get("invoiceCountryInfoConsumer_msg")
			}),
			this.isVatIdFieldVisible() ? mithril_default(TextField, {
				label: "invoiceVatIdNo_label",
				value: this.vatNumber,
				oninput: (value) => this.vatNumber = value,
				helpLabel: () => lang.get("invoiceVatIdNoInfoBusiness_msg")
			}) : null
		];
	}
	oncreate() {
		locator.serviceExecutor.get(LocationService, null).then((location) => {
			if (!this.selectedCountry()) {
				const country = Countries.find((c) => c.a === location.country);
				if (country) {
					this.selectedCountry(country);
					mithril_default.redraw();
				}
			}
		});
	}
	validateInvoiceData() {
		const address = this.getAddress();
		const countrySelected = this.selectedCountry() != null;
		if (this.businessUse) {
			if (address.trim() === "" || address.split("\n").length > 5) return "invoiceAddressInfoBusiness_msg";
else if (!countrySelected) return "invoiceCountryInfoBusiness_msg";
		} else if (!countrySelected) return "invoiceCountryInfoBusiness_msg";
else if (address.split("\n").length > 4) return "invoiceAddressInfoBusiness_msg";
		this.__paymentPaypalTest?.getStage(3).complete();
		return null;
	}
	getInvoiceData() {
		const address = this.getAddress();
		const selectedCountry = this.selectedCountry();
		return {
			invoiceAddress: address,
			country: selectedCountry,
			vatNumber: selectedCountry?.t === CountryType.EU && this.businessUse ? this.vatNumber : ""
		};
	}
	isVatIdFieldVisible() {
		const selectedCountry = this.selectedCountry();
		return this.businessUse && selectedCountry != null && selectedCountry.t === CountryType.EU;
	}
	getAddress() {
		return this.invoiceAddressComponent.getValue().split("\n").filter((line) => line.trim().length > 0).join("\n");
	}
};

//#endregion
//#region src/common/subscription/SimplifiedCreditCardInput.ts
function restoreSelection(domInput) {
	const { selectionStart, selectionEnd, selectionDirection } = domInput;
	const isAtEnd = domInput.value.length === selectionStart;
	setTimeout(() => {
		const currentLength = domInput.value.length;
		domInput.setSelectionRange(isAtEnd ? currentLength : selectionStart, isAtEnd ? currentLength : selectionEnd, selectionDirection ?? undefined);
	}, 0);
}
var SimplifiedCreditCardInput = class {
	dateFieldLeft = false;
	numberFieldLeft = false;
	cvvFieldLeft = false;
	ccNumberDom = null;
	expDateDom = null;
	view(vnode) {
		let { viewModel } = vnode.attrs;
		return [
			mithril_default(TextField, {
				label: "creditCardNumber_label",
				helpLabel: () => this.renderCcNumberHelpLabel(viewModel),
				value: viewModel.creditCardNumber,
				oninput: (newValue) => {
					viewModel.creditCardNumber = newValue;
					restoreSelection(this.ccNumberDom);
				},
				onblur: () => this.numberFieldLeft = true,
				autocompleteAs: Autocomplete.ccNumber,
				onDomInputCreated: (dom) => this.ccNumberDom = dom
			}),
			mithril_default(TextField, {
				label: "creditCardExpirationDateWithFormat_label",
				value: viewModel.expirationDate,
				helpLabel: () => this.dateFieldLeft ? lang.get(viewModel.getExpirationDateErrorHint() ?? "emptyString_msg") : lang.get("emptyString_msg"),
				onblur: () => this.dateFieldLeft = true,
				oninput: (newValue) => {
					viewModel.expirationDate = newValue;
					restoreSelection(this.expDateDom);
				},
				onDomInputCreated: (dom) => this.expDateDom = dom,
				autocompleteAs: Autocomplete.ccExp
			}),
			mithril_default(TextField, {
				label: lang.makeTranslation("cvv", viewModel.getCvvLabel()),
				value: viewModel.cvv,
				helpLabel: () => this.renderCvvNumberHelpLabel(viewModel),
				oninput: (newValue) => viewModel.cvv = newValue,
				onblur: () => this.cvvFieldLeft = true,
				autocompleteAs: Autocomplete.ccCsc
			})
		];
	}
	renderCcNumberHelpLabel(model) {
		const hint = model.getCreditCardNumberHint();
		const error = model.getCreditCardNumberErrorHint();
		if (this.numberFieldLeft) if (hint) return error ? lang.get("creditCardHintWithError_msg", {
			"{hint}": hint,
			"{errorText}": error
		}) : hint;
else return error ? error : lang.get("emptyString_msg");
else return hint ?? lang.get("emptyString_msg");
	}
	renderCvvNumberHelpLabel(model) {
		const cvvHint = model.getCvvHint();
		const cvvError = model.getCvvErrorHint();
		if (this.cvvFieldLeft) if (cvvHint) return cvvError ? lang.get("creditCardHintWithError_msg", {
			"{hint}": cvvHint,
			"{errorText}": cvvError
		}) : cvvHint;
else return cvvError ? cvvError : lang.get("emptyString_msg");
else return cvvHint ?? lang.get("emptyString_msg");
	}
};

//#endregion
//#region src/common/subscription/SimplifiedCreditCardInputModel.ts
let CardType = function(CardType$1) {
	CardType$1["Amex"] = "Amex";
	CardType$1["Visa"] = "Visa";
	CardType$1["Mastercard"] = "Mastercard";
	CardType$1["Maestro"] = "Maestro";
	CardType$1["Discover"] = "Discover";
	CardType$1["Other"] = "Other";
	return CardType$1;
}({});
function getCardTypeRange(cc) {
	for (let cardType of typedValues(CardType)) {
		if (cardType === CardType.Other) continue;
		for (let range of CardPrefixRanges[cardType]) {
			const lowestRange = range[0].padEnd(8, "0");
			const highestRange = range[1].padEnd(8, "9");
			const lowestCC = cc.slice(0, 8).padEnd(8, "0");
			const highestCC = cc.slice(0, 8).padEnd(8, "9");
			if (lowestRange <= lowestCC && highestCC <= highestRange) return cardType;
		}
	}
	return CardType.Other;
}
const CardSpecs = Object.freeze({
	[CardType.Visa]: {
		cvvLength: 3,
		cvvName: "CVV",
		name: "Visa"
	},
	[CardType.Mastercard]: {
		cvvLength: 3,
		cvvName: "CVC",
		name: "Mastercard"
	},
	[CardType.Maestro]: {
		cvvLength: 3,
		cvvName: "CVV",
		name: "Maestro"
	},
	[CardType.Amex]: {
		cvvLength: 4,
		cvvName: "CSC",
		name: "American Express"
	},
	[CardType.Discover]: {
		cvvLength: 3,
		cvvName: "CVD",
		name: "Discover"
	},
	[CardType.Other]: {
		cvvLength: null,
		cvvName: "CVV",
		name: null
	}
});
const CardPrefixRanges = Object.freeze({
	[CardType.Visa]: [["4", "4"]],
	[CardType.Mastercard]: [["51", "55"], ["2221", "2720"]],
	[CardType.Maestro]: [
		["6759", "6759"],
		["676770", "676770"],
		["676774", "676774"],
		["5018", "5018"],
		["5020", "5020"],
		["5038", "5038"],
		["5893", "5893"],
		["6304", "6304"],
		["6759", "6759"],
		["6761", "6763"]
	],
	[CardType.Amex]: [["34", "34"], ["37", "37"]],
	[CardType.Discover]: [
		["6011", "6011"],
		["644", "649"],
		["65", "65"],
		["622126", "622925"]
	],
	[CardType.Other]: [[]]
});
const allDigits = [
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9"
];
const definiteMonthDigits = [
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9"
];
const secondMonthDigits = [
	"0",
	"1",
	"2"
];
const separator = "/";
const niceSeparator = ` ${separator} `;
/**
* completely strip all whitespace from a string
* @param s the string to clean up
*/
function stripWhitespace(s) {
	return s.replace(/\s/g, "");
}
function stripNonDigits(s) {
	return s.replace(/\D/g, "");
}
function isDigitString(s) {
	if (s.length === 0) return false;
	const matches = s.match(/\d/g);
	return matches != null && matches.length === s.length;
}
/**
* take a function that corrects whitespace on input that does not contain whitespace
* and return one that does the same on input that contains arbitrary whitespace.
* @param fn a function that does not deal with whitespace-containing or empty input
*/
function normalizeInput(fn) {
	return (v, ov = "") => {
		v = stripWhitespace(v);
		if (v === "") return v;
		ov = stripWhitespace(ov);
		return fn(v, ov);
	};
}
function nomDigitsUntilLength(rest, ret, length) {
	while (rest.length > 0 && ret.length < length) {
		const next = rest[0];
		rest = rest.slice(1);
		if (allDigits.includes(next)) ret += next;
else {
			rest = "";
			break;
		}
	}
	return {
		rest,
		ret
	};
}
const inferExpirationDate = normalizeInput(inferNormalizedExpirationDate);
/**
*
* @param value non-empty string without whitespace specifying a (potentially partial) date as a sequence of 0 to 6 digits.
* @param oldDate previous value
*/
function inferNormalizedExpirationDate(value, oldDate) {
	if (oldDate.startsWith(value) && value.endsWith(separator)) return value.slice(0, -1);
	if (!allDigits.includes(value[0])) return "";
	let rest = value;
	let ret = "";
	if (definiteMonthDigits.includes(rest[0])) {
		ret = "0" + rest[0];
		rest = rest.slice(1);
	} else if (rest[0] === "0") {
		ret = "0";
		rest = rest.slice(1);
		if (rest[0] === "0") return "0";
else if (allDigits.includes(rest[0])) {
			ret = "0" + rest[0];
			rest = rest.slice(1);
		} else return "0";
	} else if (value.length > 1) {
		rest = rest.slice(1);
		if (secondMonthDigits.includes(rest[0])) {
			ret = "1" + rest[0];
			rest = rest.slice(1);
		} else if (allDigits.includes(rest[0])) ret = "01";
else if (rest[0] === separator) ret = "01";
else return "1";
	} else return "1";
	let hadSlash = false;
	while (rest.startsWith(separator)) {
		hadSlash = true;
		rest = rest.slice(1);
	}
	if (ret.length === 2 && rest.length > 0 || hadSlash || value.length > oldDate.length) ret += separator;
	({rest, ret} = nomDigitsUntilLength(rest, ret, "xx/xx".length));
	if (!ret.endsWith("/20")) return ret.replace(separator, niceSeparator);
	({ret} = nomDigitsUntilLength(rest, ret, "xx/xxxx".length));
	return ret.replace(separator, niceSeparator);
}
/**
* take a sequence of digits and other characters, strip non-digits and group the rest into space-separated groups.
* @param value non-empty string without whitespace specifying a (potentially partial) credit card number
* @param groups most credit card number digits are grouped in groups of 4, but there are exceptions
*/
function groupCreditCardNumber(value, groups = [
	4,
	4,
	4,
	4,
	4
]) {
	value = stripNonDigits(value);
	value = value.slice(0, 20);
	let ret = value.slice(0, groups[0]);
	value = value.slice(groups[0]);
	for (let i = 1; i < groups.length && value.length > 0; i++) {
		ret += " ";
		ret += value.slice(0, groups[i]);
		value = value.slice(groups[i]);
	}
	return ret;
}
function getExpirationMonthAndYear(expirationDate) {
	if (expirationDate.length < "xx / xx".length || !expirationDate.includes(" / ")) return null;
	const [monthString, yearString] = expirationDate.split(" / ").map((p) => p.trim());
	if (!isDigitString(monthString) || !isDigitString(yearString)) return null;
	const monthNumber = Number(monthString);
	if (monthNumber < 1 || monthNumber > 12) return null;
	const yearNumber = Number(yearString);
	if (yearString.length === 4 && yearString.startsWith("20")) return {
		year: Math.floor(yearNumber) - 2e3,
		month: Math.floor(monthNumber)
	};
else if (yearString.length === 2) return {
		year: Math.floor(yearNumber),
		month: Math.floor(monthNumber)
	};
else return null;
}
var SimplifiedCreditCardViewModel = class {
	_cardHolderName = "";
	_creditCardNumber = "";
	_cvv = "";
	_expirationDate = "";
	creditCardType = CardType.Other;
	constructor(lang$1) {
		this.lang = lang$1;
	}
	get expirationDate() {
		return this._expirationDate;
	}
	set expirationDate(value) {
		this._expirationDate = inferExpirationDate(value, this._expirationDate);
	}
	get cvv() {
		return this._cvv;
	}
	set cvv(value) {
		const correctedCvv = stripWhitespace(stripNonDigits(value));
		this._cvv = correctedCvv.slice(0, 4);
	}
	get creditCardNumber() {
		return this._creditCardNumber;
	}
	set creditCardNumber(value) {
		let cleanedNumber = stripNonDigits(stripWhitespace(value));
		this.creditCardType = getCardTypeRange(cleanedNumber);
		this._creditCardNumber = this.creditCardType === CardType.Amex ? groupCreditCardNumber(cleanedNumber, [
			4,
			6,
			5,
			5
		]) : groupCreditCardNumber(cleanedNumber);
	}
	get cardHolderName() {
		return this._cardHolderName;
	}
	set cardHolderName(value) {}
	validateCreditCardPaymentData() {
		const cc = this.getCreditCardData();
		const invalidNumber = this.validateCreditCardNumber(cc.number);
		if (invalidNumber) return invalidNumber;
		const invalidCVV = this.validateCVV(cc.cvv);
		if (invalidCVV) return invalidCVV;
		const invalidExpirationDate = this.getExpirationDateErrorHint();
		if (invalidExpirationDate) return invalidExpirationDate;
		return null;
	}
	validateCreditCardNumber(number) {
		if (number === "") return "creditCardNumberFormat_msg";
else if (!isValidCreditCardNumber(number)) return "creditCardNumberInvalid_msg";
		return null;
	}
	validateCVV(cvv) {
		if (cvv.length < 3 || cvv.length > 4) return "creditCardCVVFormat_label";
		return null;
	}
	getCreditCardNumberHint() {
		const spec = CardSpecs[this.creditCardType];
		if (this.creditCardType === CardType.Other) return null;
		return spec.name;
	}
	getCreditCardNumberErrorHint() {
		return this.validateCreditCardNumber(this._creditCardNumber) ? this.lang.get("creditCardNumberInvalid_msg") : null;
	}
	/**
	* return a translation string detailing what's wrong with the
	* contents of the expiration date field, if any.
	*/
	getExpirationDateErrorHint() {
		const expiration = getExpirationMonthAndYear(this._expirationDate);
		if (expiration == null) return "creditCardExprationDateInvalid_msg";
		const today = new Date();
		const currentYear = today.getFullYear() - 2e3;
		const currentMonth = today.getMonth() + 1;
		const { year, month } = expiration;
		if (year > currentYear || year === currentYear && month >= currentMonth) return null;
		return "creditCardExpired_msg";
	}
	getCvvHint() {
		if (this.creditCardType === CardType.Other) return null;
else {
			const spec = CardSpecs[this.creditCardType];
			return this.lang.get("creditCardCvvHint_msg", {
				"{currentDigits}": this.cvv.length,
				"{totalDigits}": spec.cvvLength
			});
		}
	}
	getCvvErrorHint() {
		const spec = CardSpecs[this.creditCardType];
		return this.validateCVV(this.cvv) ? this.lang.get("creditCardSpecificCVVInvalid_msg", { "{securityCode}": spec.cvvName }) : null;
	}
	getCvvLabel() {
		if (this.creditCardType === CardType.Other) return this.lang.get("creditCardCvvLabelLong_label", { "{cvvName}": CardSpecs[CardType.Other].cvvName });
else {
			const spec = CardSpecs[this.creditCardType];
			return this.lang.get("creditCardCvvLabelLong_label", { "{cvvName}": spec.cvvName });
		}
	}
	getCreditCardData() {
		const expiration = getExpirationMonthAndYear(this._expirationDate);
		let cc = createCreditCard({
			number: stripWhitespace(this._creditCardNumber),
			cardHolderName: this._cardHolderName,
			cvv: this._cvv,
			expirationMonth: expiration ? String(expiration.month) : "",
			expirationYear: expiration ? String(expiration.year) : ""
		});
		return cc;
	}
	setCreditCardData(data) {
		if (data) {
			this.creditCardNumber = data.number;
			this.cvv = data.cvv;
			if (data.expirationMonth && data.expirationYear) this.expirationDate = data.expirationMonth + " / " + data.expirationYear;
		} else {
			this._creditCardNumber = "";
			this._cvv = "";
			this._expirationDate = "";
		}
	}
};

//#endregion
//#region src/common/subscription/PaymentMethodInput.ts
var PaymentMethodInput = class {
	ccViewModel;
	_payPalAttrs;
	_selectedCountry;
	_selectedPaymentMethod;
	_subscriptionOptions;
	_accountingInfo;
	_entityEventListener;
	__paymentPaypalTest;
	constructor(subscriptionOptions, selectedCountry, accountingInfo, payPalRequestUrl, defaultPaymentMethod) {
		this._selectedCountry = selectedCountry;
		this._subscriptionOptions = subscriptionOptions;
		this.ccViewModel = new SimplifiedCreditCardViewModel(lang);
		this._accountingInfo = accountingInfo;
		this._payPalAttrs = {
			payPalRequestUrl,
			accountingInfo: this._accountingInfo
		};
		this.__paymentPaypalTest = locator.usageTestController.getTest("payment.paypal");
		this._entityEventListener = (updates) => {
			return pMap(updates, (update) => {
				if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) return locator.entityClient.load(AccountingInfoTypeRef, update.instanceId).then((accountingInfo$1) => {
					this.__paymentPaypalTest?.getStage(2).complete();
					this._accountingInfo = accountingInfo$1;
					this._payPalAttrs.accountingInfo = accountingInfo$1;
					mithril_default.redraw();
				});
			}).then(noOp);
		};
		this._selectedPaymentMethod = defaultPaymentMethod;
	}
	oncreate() {
		locator.eventController.addEntityListener(this._entityEventListener);
	}
	onremove() {
		locator.eventController.removeEntityListener(this._entityEventListener);
	}
	view() {
		switch (this._selectedPaymentMethod) {
			case PaymentMethodType.Invoice: return mithril_default(".flex-center", mithril_default(MessageBox, { style: { marginTop: px(16) } }, this.isOnAccountAllowed() ? lang.get("paymentMethodOnAccount_msg") + " " + lang.get("paymentProcessingTime_msg") : lang.get("paymentMethodNotAvailable_msg")));
			case PaymentMethodType.AccountBalance: return mithril_default(".flex-center", mithril_default(MessageBox, { style: { marginTop: px(16) } }, lang.get("paymentMethodAccountBalance_msg")));
			case PaymentMethodType.Paypal: return mithril_default(PaypalInput, this._payPalAttrs);
			default: return mithril_default(SimplifiedCreditCardInput, { viewModel: this.ccViewModel });
		}
	}
	isOnAccountAllowed() {
		const country = this._selectedCountry();
		if (!country) return false;
else if (this._accountingInfo.paymentMethod === PaymentMethodType.Invoice) return true;
else if (this._subscriptionOptions.businessUse() && country.t !== CountryType.OTHER) return true;
else return false;
	}
	isPaypalAssigned() {
		return isPaypalAssigned(this._accountingInfo);
	}
	validatePaymentData() {
		if (!this._selectedPaymentMethod) return "invoicePaymentMethodInfo_msg";
else if (this._selectedPaymentMethod === PaymentMethodType.Invoice) if (!this.isOnAccountAllowed()) return "paymentMethodNotAvailable_msg";
else return null;
else if (this._selectedPaymentMethod === PaymentMethodType.Paypal) return isPaypalAssigned(this._accountingInfo) ? null : "paymentDataPayPalLogin_msg";
else if (this._selectedPaymentMethod === PaymentMethodType.CreditCard) return this.ccViewModel.validateCreditCardPaymentData();
else return null;
	}
	updatePaymentMethod(value, paymentData) {
		this._selectedPaymentMethod = value;
		if (value === PaymentMethodType.CreditCard) {
			if (paymentData) this.ccViewModel.setCreditCardData(paymentData.creditCardData);
			if (this.__paymentPaypalTest) this.__paymentPaypalTest.active = false;
		} else if (value === PaymentMethodType.Paypal) {
			this._payPalAttrs.payPalRequestUrl.getAsync().then(() => mithril_default.redraw());
			if (this.__paymentPaypalTest) this.__paymentPaypalTest.active = true;
			this.__paymentPaypalTest?.getStage(0).complete();
		}
		mithril_default.redraw();
	}
	getPaymentData() {
		return {
			paymentMethod: this._selectedPaymentMethod,
			creditCardData: this._selectedPaymentMethod === PaymentMethodType.CreditCard ? this.ccViewModel.getCreditCardData() : null
		};
	}
	getVisiblePaymentMethods() {
		const availablePaymentMethods = [{
			name: lang.get("paymentMethodCreditCard_label"),
			value: PaymentMethodType.CreditCard
		}, {
			name: "PayPal",
			value: PaymentMethodType.Paypal
		}];
		if (this._subscriptionOptions.businessUse() || this._accountingInfo.paymentMethod === PaymentMethodType.Invoice) availablePaymentMethods.push({
			name: lang.get("paymentMethodOnAccount_label"),
			value: PaymentMethodType.Invoice
		});
		if (this._accountingInfo.paymentMethod === PaymentMethodType.AccountBalance) availablePaymentMethods.push({
			name: lang.get("paymentMethodAccountBalance_label"),
			value: PaymentMethodType.AccountBalance
		});
		return availablePaymentMethods;
	}
};
var PaypalInput = class {
	__paymentPaypalTest;
	constructor() {
		this.__paymentPaypalTest = locator.usageTestController.getTest("payment.paypal");
	}
	view(vnode) {
		let attrs = vnode.attrs;
		return [mithril_default(".flex-center", { style: { "margin-top": "50px" } }, mithril_default(BaseButton, {
			label: lang.makeTranslation("PayPal", "PayPal"),
			icon: mithril_default(".payment-logo.flex", mithril_default.trust(PayPalLogo)),
			class: "border border-radius bg-white button-height plr",
			onclick: () => {
				this.__paymentPaypalTest?.getStage(1).complete();
				if (attrs.payPalRequestUrl.isLoaded()) window.open(attrs.payPalRequestUrl.getLoaded());
else showProgressDialog("payPalRedirect_msg", attrs.payPalRequestUrl.getAsync()).then((url) => window.open(url));
			}
		})), mithril_default(".small.pt.center", isPaypalAssigned(attrs.accountingInfo) ? lang.get("paymentDataPayPalFinished_msg", { "{accountAddress}": attrs.accountingInfo.paymentMethodInfo ?? "" }) : lang.get("paymentDataPayPalLogin_msg"))];
	}
};
function isPaypalAssigned(accountingInfo) {
	return accountingInfo.paypalBillingAgreement != null;
}

//#endregion
//#region src/common/subscription/InvoiceAndPaymentDataPage.ts
var import_stream$6 = __toESM(require_stream(), 1);
var InvoiceAndPaymentDataPage = class {
	_paymentMethodInput = null;
	_invoiceDataInput = null;
	_availablePaymentMethods = null;
	_selectedPaymentMethod;
	dom;
	__signupPaidTest;
	__paymentPaypalTest;
	constructor() {
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid");
		this.__paymentPaypalTest = locator.usageTestController.getTest("payment.paypal");
		this._selectedPaymentMethod = (0, import_stream$6.default)();
		this._selectedPaymentMethod.map((method) => neverNull(this._paymentMethodInput).updatePaymentMethod(method));
	}
	onremove(vnode) {
		const data = vnode.attrs.data;
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData();
			data.paymentData = this._paymentMethodInput.getPaymentData();
		}
	}
	oncreate(vnode) {
		this.dom = vnode.dom;
		const data = vnode.attrs.data;
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData();
			data.paymentData = this._paymentMethodInput.getPaymentData();
		}
		let login = Promise.resolve(null);
		if (!locator.logins.isUserLoggedIn()) login = locator.logins.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary).then((newSessionData) => newSessionData.credentials);
		login.then(() => {
			if (!data.accountingInfo || !data.customer) return locator.logins.getUserController().loadCustomer().then((customer) => {
				data.customer = customer;
				return locator.logins.getUserController().loadCustomerInfo();
			}).then((customerInfo) => locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then((accountingInfo) => {
				data.accountingInfo = accountingInfo;
			}));
		}).then(() => getDefaultPaymentMethod()).then((defaultPaymentMethod) => {
			this._invoiceDataInput = new InvoiceDataInput(data.options.businessUse(), data.invoiceData, InvoiceDataInputLocation.InWizard);
			let payPalRequestUrl = getLazyLoadedPayPalUrl();
			if (locator.logins.isUserLoggedIn()) locator.logins.waitForFullLogin().then(() => payPalRequestUrl.getAsync());
			this._paymentMethodInput = new PaymentMethodInput(data.options, this._invoiceDataInput.selectedCountry, neverNull(data.accountingInfo), payPalRequestUrl, defaultPaymentMethod);
			this._availablePaymentMethods = this._paymentMethodInput.getVisiblePaymentMethods();
			this._selectedPaymentMethod(data.paymentData.paymentMethod);
			this._paymentMethodInput.updatePaymentMethod(data.paymentData.paymentMethod, data.paymentData);
		});
	}
	view(vnode) {
		const a = vnode.attrs;
		const onNextClick = () => {
			const invoiceDataInput = assertNotNull(this._invoiceDataInput);
			const paymentMethodInput = assertNotNull(this._paymentMethodInput);
			let error = invoiceDataInput.validateInvoiceData() || paymentMethodInput.validatePaymentData();
			if (error) return Dialog.message(error).then(() => null);
else {
				a.data.invoiceData = invoiceDataInput.getInvoiceData();
				a.data.paymentData = paymentMethodInput.getPaymentData();
				return showProgressDialog("updatePaymentDataBusy_msg", Promise.resolve().then(() => {
					let customer = neverNull(a.data.customer);
					if (customer.businessUse !== a.data.options.businessUse()) {
						customer.businessUse = a.data.options.businessUse();
						return locator.entityClient.update(customer);
					}
				}).then(() => updatePaymentData(a.data.options.paymentInterval(), a.data.invoiceData, a.data.paymentData, null, a.data.upgradeType === UpgradeType.Signup, neverNull(a.data.price?.rawPrice), neverNull(a.data.accountingInfo)).then((success) => {
					if (success) {
						const paymentMethodConfirmationStage = this.__signupPaidTest?.getStage(4);
						paymentMethodConfirmationStage?.setMetric({
							name: "paymentMethod",
							value: PaymentMethodTypeToName[a.data.paymentData.paymentMethod]
						});
						paymentMethodConfirmationStage?.complete();
						emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE);
					}
				})));
			}
		};
		return mithril_default(".pt", this._availablePaymentMethods ? [
			mithril_default(SegmentControl, {
				items: this._availablePaymentMethods,
				selectedValue: this._selectedPaymentMethod(),
				onValueSelected: this._selectedPaymentMethod
			}),
			mithril_default(".flex-space-around.flex-wrap.pt", [mithril_default(".flex-grow-shrink-half.plr-l", { style: { minWidth: "260px" } }, mithril_default(neverNull(this._invoiceDataInput))), mithril_default(".flex-grow-shrink-half.plr-l", { style: { minWidth: "260px" } }, mithril_default(neverNull(this._paymentMethodInput)))]),
			mithril_default(".flex-center.full-width.pt-l", mithril_default(LoginButton, {
				label: "next_action",
				class: "small-login-button",
				onclick: onNextClick
			}))
		] : null);
	}
};
var InvoiceAndPaymentDataPageAttrs = class {
	data;
	_enabled = () => true;
	constructor(upgradeData) {
		this.data = upgradeData;
	}
	nextAction(showErrorDialog) {
		return Promise.resolve(true);
	}
	headerTitle() {
		return "adminPayment_action";
	}
	isSkipAvailable() {
		return false;
	}
	isEnabled() {
		return this._enabled();
	}
	/**
	* Set the enabled function for isEnabled
	* @param enabled
	*/
	setEnabledFunction(enabled) {
		this._enabled = enabled;
	}
};
async function updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry, isSignup, price, accountingInfo) {
	const paymentResult = await locator.customerFacade.updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry);
	const statusCode = paymentResult.result;
	if (statusCode === PaymentDataResultType.OK) {
		let braintree3ds = paymentResult.braintree3dsRequest;
		if (braintree3ds) return verifyCreditCard(accountingInfo, braintree3ds, price);
else return true;
	} else if (statusCode === PaymentDataResultType.COUNTRY_MISMATCH) {
		const countryName = invoiceData.country ? invoiceData.country.n : "";
		const confirmMessage = lang.getTranslation("confirmCountry_msg", { "{1}": countryName });
		const confirmed = await Dialog.confirm(confirmMessage);
		if (confirmed) return updatePaymentData(paymentInterval, invoiceData, paymentData, invoiceData.country, isSignup, price, accountingInfo);
else return false;
	} else if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) await Dialog.message(lang.makeTranslation("invalidVatIdNumber_msg", lang.get("invalidVatIdNumber_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) await Dialog.message(lang.makeTranslation("creditCardDeclined_msg", lang.get("creditCardDeclined_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) await Dialog.message("creditCardCVVInvalid_msg");
else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) await Dialog.message(lang.makeTranslation("paymentProviderNotAvailableError_msg", lang.get("paymentProviderNotAvailableError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) await Dialog.message(lang.makeTranslation("paymentAccountRejected_msg", lang.get("paymentAccountRejected_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) await Dialog.message("creditCardExprationDateInvalid_msg");
else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) await Dialog.message(lang.makeTranslation("creditCardNumberInvalid_msg", lang.get("creditCardNumberInvalid_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) await Dialog.message(lang.makeTranslation("invalidVatIdValidationFailed_msg", lang.get("invalidVatIdValidationFailed_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else if (statusCode === PaymentDataResultType.CREDIT_CARD_VERIFICATION_LIMIT_REACHED) await Dialog.message(lang.makeTranslation("creditCardVerificationLimitReached_msg", lang.get("creditCardVerificationLimitReached_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
else await Dialog.message(lang.makeTranslation("otherPaymentProviderError_msg", lang.get("otherPaymentProviderError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")));
	return false;
}
/**
* Displays a progress dialog that allows to cancel the verification and opens a new window to do the actual verification with the bank.
*/
function verifyCreditCard(accountingInfo, braintree3ds, price) {
	return locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo)).then((invoiceInfo) => {
		let invoiceInfoWrapper = { invoiceInfo };
		let resolve;
		let progressDialogPromise = new Promise((res) => resolve = res);
		let progressDialog;
		const closeAction = () => {
			progressDialog.close();
			setTimeout(() => resolve(false), DefaultAnimationTime);
		};
		progressDialog = new Dialog(DialogType.Alert, { view: () => [mithril_default(".dialog-contentButtonsBottom.text-break.selectable", lang.get("creditCardPendingVerification_msg")), mithril_default(".flex-center.dialog-buttons", mithril_default(Button, {
			label: "cancel_action",
			click: closeAction,
			type: ButtonType.Primary
		}))] }).setCloseHandler(closeAction).addShortcut({
			key: Keys.RETURN,
			shift: false,
			exec: closeAction,
			help: "close_alt"
		}).addShortcut({
			key: Keys.ESC,
			shift: false,
			exec: closeAction,
			help: "close_alt"
		});
		let entityEventListener = (updates, eventOwnerGroupId) => {
			return pMap(updates, (update) => {
				if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) return locator.entityClient.load(InvoiceInfoTypeRef, update.instanceId).then((invoiceInfo$1) => {
					invoiceInfoWrapper.invoiceInfo = invoiceInfo$1;
					if (!invoiceInfo$1.paymentErrorInfo) {
						progressDialog.close();
						resolve(true);
					} else if (invoiceInfo$1.paymentErrorInfo && invoiceInfo$1.paymentErrorInfo.errorCode === "card.3ds2_pending") {} else if (invoiceInfo$1.paymentErrorInfo && invoiceInfo$1.paymentErrorInfo.errorCode !== null) {
						let error = "3dsFailedOther";
						switch (invoiceInfo$1.paymentErrorInfo.errorCode) {
							case "card.cvv_invalid":
								error = "cvvInvalid";
								break;
							case "card.number_invalid":
								error = "ccNumberInvalid";
								break;
							case "card.date_invalid":
								error = "expirationDate";
								break;
							case "card.insufficient_funds":
								error = "insufficientFunds";
								break;
							case "card.expired_card":
								error = "cardExpired";
								break;
							case "card.3ds2_failed":
								error = "3dsFailed";
								break;
						}
						Dialog.message(getPreconditionFailedPaymentMsg(invoiceInfo$1.paymentErrorInfo.errorCode));
						resolve(false);
						progressDialog.close();
					}
					mithril_default.redraw();
				});
			}).then(noOp);
		};
		locator.eventController.addEntityListener(entityEventListener);
		const app = client.isCalendarApp() ? "calendar" : "mail";
		let params = `clientToken=${encodeURIComponent(braintree3ds.clientToken)}&nonce=${encodeURIComponent(braintree3ds.nonce)}&bin=${encodeURIComponent(braintree3ds.bin)}&price=${encodeURIComponent(price)}&message=${encodeURIComponent(lang.get("creditCardVerification_msg"))}&clientType=${getClientType()}&app=${app}`;
		Dialog.message("creditCardVerificationNeededPopup_msg").then(() => {
			const paymentUrlString = locator.domainConfigProvider().getCurrentDomainConfig().paymentUrl;
			const paymentUrl = new URL(paymentUrlString);
			paymentUrl.hash += params;
			window.open(paymentUrl);
			progressDialog.show();
		});
		return progressDialogPromise.finally(() => locator.eventController.removeEntityListener(entityEventListener));
	});
}

//#endregion
//#region src/common/subscription/SwitchToBusinessInvoiceDataDialog.ts
function showSwitchToBusinessInvoiceDataDialog(customer, invoiceData, accountingInfo) {
	if (customer.businessUse) throw new ProgrammingError("cannot show invoice data dialog if the customer is already a business customer");
	const invoiceDataInput = new InvoiceDataInput(true, invoiceData, InvoiceDataInputLocation.InWizard);
	const result = defer();
	const confirmAction = async () => {
		let error = invoiceDataInput.validateInvoiceData();
		if (error) Dialog.message(error);
else {
			showProgressDialog("pleaseWait_msg", result.promise);
			const success = await updatePaymentData(asPaymentInterval(accountingInfo.paymentInterval), invoiceDataInput.getInvoiceData(), null, null, false, "0", accountingInfo).catch(ofClass(BadRequestError, () => {
				Dialog.message("paymentMethodNotAvailable_msg");
				return false;
			})).catch((e) => {
				result.reject(e);
			});
			if (success) {
				dialog.close();
				result.resolve(true);
			} else result.resolve(false);
		}
	};
	const cancelAction = () => result.resolve(false);
	const dialog = Dialog.showActionDialog({
		title: "invoiceData_msg",
		child: { view: () => mithril_default("#changeInvoiceDataDialog", [mithril_default(invoiceDataInput)]) },
		okAction: confirmAction,
		cancelAction,
		allowCancel: true,
		okActionTextId: "save_action"
	});
	return result.promise;
}

//#endregion
//#region src/common/native/common/generatedipc/MobilePaymentSubscriptionOwnership.ts
let MobilePaymentSubscriptionOwnership = function(MobilePaymentSubscriptionOwnership$1) {
	MobilePaymentSubscriptionOwnership$1["Owner"] = "0";
	MobilePaymentSubscriptionOwnership$1["NotOwner"] = "1";
	MobilePaymentSubscriptionOwnership$1["NoSubscription"] = "2";
	return MobilePaymentSubscriptionOwnership$1;
}({});

//#endregion
//#region src/common/subscription/InvoiceDataDialog.ts
function show$1(businessUse, invoiceData, accountingInfo, headingId, infoMessageId) {
	const invoiceDataInput = new InvoiceDataInput(businessUse, invoiceData);
	const confirmAction = () => {
		let error = invoiceDataInput.validateInvoiceData();
		if (error) Dialog.message(error);
else updatePaymentData(asPaymentInterval(accountingInfo.paymentInterval), invoiceDataInput.getInvoiceData(), null, null, false, "0", accountingInfo).then((success) => {
			if (success) dialog.close();
		}).catch(ofClass(BadRequestError, (e) => {
			Dialog.message("paymentMethodNotAvailable_msg");
		}));
	};
	const dialog = Dialog.showActionDialog({
		title: headingId ? headingId : "invoiceData_msg",
		child: { view: () => mithril_default("#changeInvoiceDataDialog", [infoMessageId ? mithril_default(".pt", lang.get(infoMessageId)) : null, mithril_default(invoiceDataInput)]) },
		okAction: confirmAction,
		allowCancel: true,
		okActionTextId: "save_action"
	});
	return dialog;
}

//#endregion
//#region src/common/subscription/PaymentDataDialog.ts
var import_stream$5 = __toESM(require_stream(), 1);
async function show(customer, accountingInfo, price, defaultPaymentMethod) {
	const payPalRequestUrl = getLazyLoadedPayPalUrl();
	const invoiceData = {
		invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
		country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
		vatNumber: accountingInfo.invoiceVatIdNo
	};
	const subscriptionOptions = {
		businessUse: (0, import_stream$5.default)(assertNotNull(customer.businessUse)),
		paymentInterval: (0, import_stream$5.default)(asPaymentInterval(accountingInfo.paymentInterval))
	};
	const paymentMethodInput = new PaymentMethodInput(subscriptionOptions, (0, import_stream$5.default)(invoiceData.country), neverNull(accountingInfo), payPalRequestUrl, defaultPaymentMethod);
	const availablePaymentMethods = paymentMethodInput.getVisiblePaymentMethods();
	let selectedPaymentMethod = accountingInfo.paymentMethod;
	paymentMethodInput.updatePaymentMethod(selectedPaymentMethod);
	const selectedPaymentMethodChangedHandler = async (value) => {
		if (value === PaymentMethodType.Paypal && !payPalRequestUrl.isLoaded()) await showProgressDialog("pleaseWait_msg", payPalRequestUrl.getAsync());
		selectedPaymentMethod = value;
		paymentMethodInput.updatePaymentMethod(value);
	};
	const didLinkPaypal = () => selectedPaymentMethod === PaymentMethodType.Paypal && paymentMethodInput.isPaypalAssigned();
	return new Promise((resolve) => {
		const confirmAction = () => {
			let error = paymentMethodInput.validatePaymentData();
			if (error) Dialog.message(error);
else {
				const finish = (success) => {
					if (success) {
						dialog.close();
						resolve(true);
					}
				};
				if (didLinkPaypal()) finish(true);
else showProgressDialog("updatePaymentDataBusy_msg", updatePaymentData(subscriptionOptions.paymentInterval(), invoiceData, paymentMethodInput.getPaymentData(), invoiceData.country, false, price + "", accountingInfo)).then(finish);
			}
		};
		const dialog = Dialog.showActionDialog({
			title: "adminPayment_action",
			child: { view: () => mithril_default("#changePaymentDataDialog", { style: { minHeight: px(310) } }, [mithril_default(DropDownSelector, {
				label: "paymentMethod_label",
				items: availablePaymentMethods,
				selectedValue: selectedPaymentMethod,
				selectionChangedHandler: selectedPaymentMethodChangedHandler,
				dropdownWidth: 250
			}), mithril_default(paymentMethodInput)]) },
			okAction: confirmAction,
			allowCancel: () => !didLinkPaypal(),
			okActionTextId: didLinkPaypal() ? "close_alt" : "save_action",
			cancelAction: () => resolve(false)
		});
	});
}

//#endregion
//#region src/common/api/entities/accounting/TypeRefs.ts
const CustomerAccountPostingTypeRef = new TypeRef("accounting", "CustomerAccountPosting");
const CustomerAccountReturnTypeRef = new TypeRef("accounting", "CustomerAccountReturn");

//#endregion
//#region src/common/api/entities/accounting/Services.ts
const CustomerAccountService = Object.freeze({
	app: "accounting",
	name: "CustomerAccountService",
	get: {
		data: null,
		return: CustomerAccountReturnTypeRef
	},
	post: null,
	put: null,
	delete: null
});

//#endregion
//#region src/common/subscription/PaymentViewer.ts
assertMainOrNode();
var PaymentViewer = class {
	invoiceAddressField;
	customer = null;
	accountingInfo = null;
	postings = [];
	outstandingBookingsPrice = null;
	balance = 0;
	invoiceInfo = null;
	postingsExpanded = false;
	constructor() {
		this.invoiceAddressField = new HtmlEditor().setMinHeight(140).showBorders().setMode(HtmlEditorMode.HTML).setHtmlMonospace(false).setReadOnly(true).setPlaceholderId("invoiceAddress_label");
		this.loadData();
		this.view = this.view.bind(this);
	}
	view() {
		return mithril_default("#invoicing-settings.fill-absolute.scroll.plr-l", { role: "group" }, [
			this.renderInvoiceData(),
			this.renderPaymentMethod(),
			this.renderPostings()
		]);
	}
	async loadData() {
		this.customer = await locator.logins.getUserController().loadCustomer();
		const customerInfo = await locator.logins.getUserController().loadCustomerInfo();
		const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo);
		this.updateAccountingInfoData(accountingInfo);
		this.invoiceInfo = await locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo));
		mithril_default.redraw();
		await this.loadPostings();
	}
	renderPaymentMethod() {
		const paymentMethodHelpLabel = () => {
			if (this.accountingInfo && getPaymentMethodType(this.accountingInfo) === PaymentMethodType.Invoice) return lang.get("paymentProcessingTime_msg");
			return "";
		};
		const paymentMethod = this.accountingInfo ? getPaymentMethodName(getPaymentMethodType(neverNull(this.accountingInfo))) + " " + getPaymentMethodInfoText(neverNull(this.accountingInfo)) : lang.get("loading_msg");
		return mithril_default(TextField, {
			label: "paymentMethod_label",
			value: paymentMethod,
			helpLabel: paymentMethodHelpLabel,
			isReadOnly: true,
			injectionsRight: () => mithril_default(IconButton, {
				title: "paymentMethod_label",
				click: (e, dom) => this.handlePaymentMethodClick(e, dom),
				icon: Icons.Edit,
				size: ButtonSize.Compact
			})
		});
	}
	async handlePaymentMethodClick(e, dom) {
		if (this.accountingInfo == null) return;
		const currentPaymentMethod = getPaymentMethodType(this.accountingInfo);
		if (isIOSApp()) {
			if (currentPaymentMethod !== PaymentMethodType.AppStore && this.customer?.type === AccountType.PAID) return Dialog.message(lang.getTranslation("storePaymentMethodChange_msg", { "{AppStorePaymentChange}": InfoLink.AppStorePaymentChange }));
			return locator.mobilePaymentsFacade.showSubscriptionConfigView();
		} else if (hasRunningAppStoreSubscription(this.accountingInfo)) return showManageThroughAppStoreDialog();
else if (currentPaymentMethod == PaymentMethodType.AppStore && this.customer?.type === AccountType.PAID) {
			const isResubscribe = await Dialog.choice(lang.getTranslation("storeDowngradeOrResubscribe_msg", { "{AppStoreDowngrade}": InfoLink.AppStoreDowngrade }), [{
				text: "changePlan_action",
				value: false
			}, {
				text: "resubscribe_action",
				value: true
			}]);
			if (isResubscribe) return showManageThroughAppStoreDialog();
else {
				const customerInfo = await locator.logins.getUserController().loadCustomerInfo();
				const bookings = await locator.entityClient.loadRange(BookingTypeRef, assertNotNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true);
				const lastBooking = last(bookings);
				if (lastBooking == null) {
					console.warn("No booking but payment method is AppStore?");
					return;
				}
				return showSwitchDialog(this.customer, customerInfo, this.accountingInfo, lastBooking, AvailablePlans, null);
			}
		} else {
			const showPaymentMethodDialog = createNotAvailableForFreeClickHandler(
				NewPaidPlans,
				() => this.accountingInfo && this.changePaymentMethod(),
				// iOS app is checked above
				() => locator.logins.getUserController().isPremiumAccount()
);
			showPaymentMethodDialog(e, dom);
		}
	}
	changeInvoiceData() {
		if (this.accountingInfo) {
			const accountingInfo = neverNull(this.accountingInfo);
			const invoiceCountry = accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null;
			show$1(neverNull(neverNull(this.customer).businessUse), {
				invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
				country: invoiceCountry,
				vatNumber: accountingInfo.invoiceVatIdNo
			}, accountingInfo);
		}
	}
	changePaymentMethod() {
		if (this.accountingInfo && hasRunningAppStoreSubscription(this.accountingInfo)) throw new ProgrammingError("Active AppStore subscription");
		let nextPayment = this.amountOwed() * -1;
		showProgressDialog("pleaseWait_msg", locator.bookingFacade.getCurrentPrice().then((priceServiceReturn) => {
			return Math.max(nextPayment, Number(neverNull(priceServiceReturn.currentPriceThisPeriod).price), Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price));
		})).then((price) => getDefaultPaymentMethod().then((paymentMethod) => {
			return {
				price,
				paymentMethod
			};
		})).then(({ price, paymentMethod }) => {
			return show(neverNull(this.customer), neverNull(this.accountingInfo), price, paymentMethod).then((success) => {
				if (success) {
					if (this.isPayButtonVisible()) return this.showPayDialog(this.amountOwed());
				}
			});
		});
	}
	renderPostings() {
		if (!this.postings || this.postings.length === 0) return null;
else {
			const balance = this.balance;
			return [
				mithril_default(".h4.mt-l", lang.get("currentBalance_label")),
				mithril_default(".flex.center-horizontally.center-vertically.col", [
					mithril_default("div.h4.pt.pb" + (this.isAmountOwed() ? ".content-accent-fg" : ""), formatPrice(balance, true) + (this.accountBalance() !== balance ? ` (${formatPrice(this.accountBalance(), true)})` : "")),
					this.accountBalance() !== balance ? mithril_default(".small" + (this.accountBalance() < 0 ? ".content-accent-fg" : ""), lang.get("unprocessedBookings_msg", { "{amount}": formatPrice(assertNotNull(this.outstandingBookingsPrice), true) })) : null,
					this.isPayButtonVisible() ? mithril_default(".pb", { style: { width: "200px" } }, mithril_default(LoginButton, {
						label: "invoicePay_action",
						onclick: () => this.showPayDialog(this.amountOwed())
					})) : null
				]),
				this.accountingInfo && this.accountingInfo.paymentMethod !== PaymentMethodType.Invoice && (this.isAmountOwed() || this.invoiceInfo && this.invoiceInfo.paymentErrorInfo) ? this.invoiceInfo && this.invoiceInfo.paymentErrorInfo ? mithril_default(".small.underline.b", lang.get(getPreconditionFailedPaymentMsg(this.invoiceInfo.paymentErrorInfo.errorCode))) : mithril_default(".small.underline.b", lang.get("failedDebitAttempt_msg")) : null,
				mithril_default(".flex-space-between.items-center.mt-l.mb-s", [mithril_default(".h4", lang.get("postings_label")), mithril_default(ExpanderButton, {
					label: "show_action",
					expanded: this.postingsExpanded,
					onExpandedChange: (expanded) => this.postingsExpanded = expanded
				})]),
				mithril_default(ExpanderPanel, { expanded: this.postingsExpanded }, mithril_default(Table, {
					columnHeading: ["type_label", "amount_label"],
					columnWidths: [
						ColumnWidth.Largest,
						ColumnWidth.Small,
						ColumnWidth.Small
					],
					columnAlignments: [
						false,
						true,
						false
					],
					showActionButtonColumn: true,
					lines: this.postings.map((posting) => this.postingLineAttrs(posting))
				})),
				mithril_default(".small", lang.get("invoiceSettingDescription_msg") + " " + lang.get("laterInvoicingInfo_msg"))
			];
		}
	}
	postingLineAttrs(posting) {
		return {
			cells: () => [{
				main: getPostingTypeText(posting),
				info: [formatDate(posting.valueDate)]
			}, { main: formatPrice(Number(posting.amount), true) }],
			actionButtonAttrs: posting.type === PostingType.UsageFee || posting.type === PostingType.Credit || posting.type === PostingType.SalesCommission ? {
				title: "download_action",
				icon: Icons.Download,
				size: ButtonSize.Compact,
				click: (e, dom) => {
					if (this.customer?.businessUse) createDropdown({
						width: 300,
						lazyButtons: () => [{
							label: "downloadInvoicePdf_action",
							click: () => this.doPdfInvoiceDownload(posting)
						}, {
							label: "downloadInvoiceXml_action",
							click: () => this.doXrechnungInvoiceDownload(posting)
						}]
					})(e, dom);
else this.doPdfInvoiceDownload(posting);
				}
			} : null
		};
	}
	async doPdfInvoiceDownload(posting) {
		if (client.compressionStreamSupported()) return showProgressDialog("pleaseWait_msg", locator.customerFacade.generatePdfInvoice(neverNull(posting.invoiceNumber))).then((pdfInvoice) => locator.fileController.saveDataFile(pdfInvoice));
else if (client.device == DeviceType.ANDROID) return Dialog.message("invoiceFailedWebview_msg", () => mithril_default("div", mithril_default("a", {
			href: InfoLink.Webview,
			target: "_blank"
		}, InfoLink.Webview)));
else if (client.isIos()) return Dialog.message("invoiceFailedIOS_msg");
else return Dialog.message("invoiceFailedBrowser_msg");
	}
	async doXrechnungInvoiceDownload(posting) {
		return showProgressDialog("pleaseWait_msg", locator.customerFacade.generateXRechnungInvoice(neverNull(posting.invoiceNumber)).then((xInvoice) => locator.fileController.saveDataFile(xInvoice)));
	}
	updateAccountingInfoData(accountingInfo) {
		this.accountingInfo = accountingInfo;
		this.invoiceAddressField.setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry ?? undefined));
		mithril_default.redraw();
	}
	accountBalance() {
		return this.balance - assertNotNull(this.outstandingBookingsPrice);
	}
	amountOwed() {
		if (this.balance != null) {
			let balance = this.balance;
			if (balance < 0) return balance;
		}
		return 0;
	}
	isAmountOwed() {
		return this.amountOwed() < 0;
	}
	loadPostings() {
		return locator.serviceExecutor.get(CustomerAccountService, null).then((result) => {
			this.postings = result.postings;
			this.outstandingBookingsPrice = Number(result.outstandingBookingsPrice);
			this.balance = Number(result.balance);
			mithril_default.redraw();
		});
	}
	async entityEventsReceived(updates) {
		for (const update of updates) await this.processEntityUpdate(update);
	}
	async processEntityUpdate(update) {
		const { instanceId } = update;
		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, instanceId);
			this.updateAccountingInfoData(accountingInfo);
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			this.customer = await locator.logins.getUserController().loadCustomer();
			mithril_default.redraw();
		} else if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
			this.invoiceInfo = await locator.entityClient.load(InvoiceInfoTypeRef, instanceId);
			mithril_default.redraw();
		}
	}
	isPayButtonVisible() {
		return this.accountingInfo != null && (this.accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this.accountingInfo.paymentMethod === PaymentMethodType.Paypal) && this.isAmountOwed();
	}
	showPayDialog(openBalance) {
		return showPayConfirmDialog(openBalance).then((confirmed) => {
			if (confirmed) return showProgressDialog("pleaseWait_msg", locator.serviceExecutor.put(DebitService, createDebitServicePutData({ invoice: null })).catch(ofClass(LockedError, () => "operationStillActive_msg")).catch(ofClass(PreconditionFailedError, (error) => getPreconditionFailedPaymentMsg(error.data))).catch(ofClass(BadGatewayError, () => "paymentProviderNotAvailableError_msg")).catch(ofClass(TooManyRequestsError, () => "tooManyAttempts_msg")));
		}).then((errorId) => {
			if (errorId) return Dialog.message(errorId);
else return this.loadPostings();
		});
	}
	renderInvoiceData() {
		return [
			mithril_default(".flex-space-between.items-center.mt-l.mb-s", [mithril_default(".h4", lang.get("invoiceData_msg")), mithril_default(IconButton, {
				title: "invoiceData_msg",
				click: createNotAvailableForFreeClickHandler(NewPaidPlans, () => this.changeInvoiceData(), () => locator.logins.getUserController().isPremiumAccount()),
				icon: Icons.Edit,
				size: ButtonSize.Compact
			})]),
			mithril_default(this.invoiceAddressField),
			this.accountingInfo && this.accountingInfo.invoiceVatIdNo.trim().length > 0 ? mithril_default(TextField, {
				label: "invoiceVatIdNo_label",
				value: this.accountingInfo ? this.accountingInfo.invoiceVatIdNo : lang.get("loading_msg"),
				isReadOnly: true
			}) : null
		];
	}
};
function showPayConfirmDialog(price) {
	return new Promise((resolve) => {
		let dialog;
		const doAction = (res) => {
			dialog.close();
			resolve(res);
		};
		const actionBarAttrs = {
			left: [{
				label: "cancel_action",
				click: () => doAction(false),
				type: ButtonType.Secondary
			}],
			right: [{
				label: "invoicePay_action",
				click: () => doAction(true),
				type: ButtonType.Primary
			}],
			middle: "adminPayment_action"
		};
		dialog = new Dialog(DialogType.EditSmall, { view: () => [mithril_default(DialogHeaderBar, actionBarAttrs), mithril_default(".plr-l.pb", mithril_default("", [mithril_default(".pt", lang.get("invoicePayConfirm_msg")), mithril_default(TextField, {
			label: "price_label",
			value: formatPrice(-price, true),
			isReadOnly: true
		})]))] }).setCloseHandler(() => doAction(false)).show();
	});
}
function getPostingTypeText(posting) {
	switch (posting.type) {
		case PostingType.UsageFee: return lang.get("invoice_label");
		case PostingType.Credit: return lang.get("credit_label");
		case PostingType.Payment: return lang.get("adminPayment_action");
		case PostingType.Refund: return lang.get("refund_label");
		case PostingType.GiftCard: return Number(posting.amount) < 0 ? lang.get("boughtGiftCardPosting_label") : lang.get("redeemedGiftCardPosting_label");
		case PostingType.SalesCommission: return Number(posting.amount) < 0 ? lang.get("cancelledReferralCreditPosting_label") : lang.get("referralCreditPosting_label");
		default: return "";
	}
}
async function showManageThroughAppStoreDialog() {
	const confirmed = await Dialog.confirm(lang.getTranslation("storeSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }));
	if (confirmed) window.open("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer");
}

//#endregion
//#region src/common/subscription/UpgradeSubscriptionPage.ts
var import_stream$4 = __toESM(require_stream(), 1);
const PlanTypeParameter = Object.freeze({
	FREE: "free",
	REVOLUTIONARY: "revolutionary",
	LEGEND: "legend",
	ESSENTIAL: "essential",
	ADVANCED: "advanced",
	UNLIMITED: "unlimited"
});
var UpgradeSubscriptionPage = class {
	_dom = null;
	__signupFreeTest;
	__signupPaidTest;
	upgradeType = null;
	oncreate(vnode) {
		this._dom = vnode.dom;
		const subscriptionParameters = vnode.attrs.data.subscriptionParameters;
		this.upgradeType = vnode.attrs.data.upgradeType;
		this.__signupFreeTest = locator.usageTestController.getTest("signup.free");
		this.__signupFreeTest.active = false;
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid");
		this.__signupPaidTest.active = false;
		if (subscriptionParameters) {
			const paymentInterval = subscriptionParameters.interval ? asPaymentInterval(subscriptionParameters.interval) : PaymentInterval.Yearly;
			vnode.attrs.data.subscriptionParameters = null;
			vnode.attrs.data.options.paymentInterval = (0, import_stream$4.default)(paymentInterval);
			this.goToNextPageWithPreselectedSubscription(subscriptionParameters, vnode.attrs.data);
		}
	}
	view(vnode) {
		const data = vnode.attrs.data;
		let availablePlans = vnode.attrs.data.acceptedPlans;
		if (!!data.newAccountData && data.newAccountData.mailAddress.includes("tuta.com") && availablePlans.includes(PlanType.Free)) availablePlans = availablePlans.filter((plan) => plan != PlanType.Free);
		const isYearly = data.options.paymentInterval() === PaymentInterval.Yearly;
		const isCyberMonday = isReferenceDateWithinCyberMondayCampaign(Const.CURRENT_DATE ?? new Date());
		const shouldApplyCyberMonday = isYearly && isCyberMonday;
		const subscriptionActionButtons = {
			[PlanType.Free]: () => {
				return {
					label: "pricing.select_action",
					onclick: () => this.selectFree(data)
				};
			},
			[PlanType.Revolutionary]: this.createUpgradeButton(data, PlanType.Revolutionary),
			[PlanType.Legend]: () => ({
				label: shouldApplyCyberMonday ? "pricing.cyber_monday_select_action" : "pricing.select_action",
				class: shouldApplyCyberMonday ? "accent-bg-cyber-monday" : undefined,
				onclick: () => this.setNonFreeDataAndGoToNextPage(data, PlanType.Legend)
			}),
			[PlanType.Essential]: this.createUpgradeButton(data, PlanType.Essential),
			[PlanType.Advanced]: this.createUpgradeButton(data, PlanType.Advanced),
			[PlanType.Unlimited]: this.createUpgradeButton(data, PlanType.Unlimited)
		};
		return mithril_default(".pt", [mithril_default(SubscriptionSelector, {
			options: data.options,
			priceInfoTextId: data.priceInfoTextId,
			boxWidth: 230,
			boxHeight: 270,
			acceptedPlans: availablePlans,
			allowSwitchingPaymentInterval: data.upgradeType !== UpgradeType.Switch,
			currentPlanType: data.currentPlan,
			actionButtons: subscriptionActionButtons,
			featureListProvider: vnode.attrs.data.featureListProvider,
			priceAndConfigProvider: vnode.attrs.data.planPrices,
			multipleUsersAllowed: vnode.attrs.data.multipleUsersAllowed,
			msg: data.msg
		})]);
	}
	selectFree(data) {
		if (this.__signupPaidTest) this.__signupPaidTest.active = false;
		if (this.__signupFreeTest && this.upgradeType == UpgradeType.Signup) {
			this.__signupFreeTest.active = true;
			this.__signupFreeTest.getStage(0).complete();
		}
		confirmFreeSubscription().then((confirmed) => {
			if (confirmed) {
				this.__signupFreeTest?.getStage(1).complete();
				data.type = PlanType.Free;
				data.price = null;
				data.nextYearPrice = null;
				this.showNextPage();
			}
		});
	}
	showNextPage() {
		if (this._dom) emitWizardEvent(this._dom, WizardEventType.SHOW_NEXT_PAGE);
	}
	goToNextPageWithPreselectedSubscription(subscriptionParameters, data) {
		let subscriptionType;
		try {
			subscriptionType = subscriptionParameters.type == null ? null : stringToSubscriptionType(subscriptionParameters.type);
		} catch (e) {
			subscriptionType = null;
		}
		if (subscriptionType === SubscriptionType.Personal || subscriptionType === SubscriptionType.PaidPersonal) {
			data.options.businessUse(false);
			switch (subscriptionParameters.subscription) {
				case PlanTypeParameter.FREE:
					this.selectFree(data);
					break;
				case PlanTypeParameter.REVOLUTIONARY:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Revolutionary);
					break;
				case PlanTypeParameter.LEGEND:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Legend);
					break;
				default:
					console.log("Unknown subscription passed: ", subscriptionParameters);
					break;
			}
		} else if (subscriptionType === SubscriptionType.Business) {
			data.options.businessUse(true);
			switch (subscriptionParameters.subscription) {
				case PlanTypeParameter.ESSENTIAL:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Essential);
					break;
				case PlanTypeParameter.ADVANCED:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Advanced);
					break;
				case PlanTypeParameter.UNLIMITED:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Unlimited);
					break;
				default:
					console.log("Unknown subscription passed: ", subscriptionParameters);
					break;
			}
		} else console.log("Unknown subscription type passed: ", subscriptionParameters);
	}
	setNonFreeDataAndGoToNextPage(data, planType) {
		if (this.__signupFreeTest) this.__signupFreeTest.active = false;
		if (this.__signupPaidTest && this.upgradeType == UpgradeType.Signup) {
			this.__signupPaidTest.active = true;
			this.__signupPaidTest.getStage(0).complete();
		}
		data.type = planType;
		const { planPrices, options } = data;
		try {
			data.price = planPrices.getSubscriptionPriceWithCurrency(options.paymentInterval(), data.type, UpgradePriceType.PlanActualPrice);
			const nextYear = planPrices.getSubscriptionPriceWithCurrency(options.paymentInterval(), data.type, UpgradePriceType.PlanNextYearsPrice);
			data.nextYearPrice = data.price.rawPrice !== nextYear.rawPrice ? nextYear : null;
		} catch (e) {
			console.error(e);
			Dialog.message("appStoreNotAvailable_msg");
			return;
		}
		this.showNextPage();
	}
	createUpgradeButton(data, planType) {
		return () => ({
			label: "pricing.select_action",
			onclick: () => this.setNonFreeDataAndGoToNextPage(data, planType)
		});
	}
};
function confirmFreeSubscription() {
	return new Promise((resolve) => {
		let oneAccountValue = (0, import_stream$4.default)(false);
		let privateUseValue = (0, import_stream$4.default)(false);
		let dialog;
		const closeAction = (confirmed) => {
			dialog.close();
			setTimeout(() => resolve(confirmed), DefaultAnimationTime);
		};
		const isFormValid = () => oneAccountValue() && privateUseValue();
		dialog = new Dialog(DialogType.Alert, { view: () => [
			mithril_default("#dialog-message.dialog-contentButtonsBottom.text-break.text-prewrap.selectable", lang.getTranslationText("freeAccountInfo_msg")),
			mithril_default(".dialog-contentButtonsBottom", [mithril_default(Checkbox, {
				label: () => lang.get("confirmNoOtherFreeAccount_msg"),
				checked: oneAccountValue(),
				onChecked: oneAccountValue
			}), mithril_default(Checkbox, {
				label: () => lang.get("confirmPrivateUse_msg"),
				checked: privateUseValue(),
				onChecked: privateUseValue
			})]),
			mithril_default(".flex-center.dialog-buttons", [mithril_default(Button, {
				label: "cancel_action",
				click: () => closeAction(false),
				type: ButtonType.Secondary
			}), mithril_default(Button, {
				label: "ok_action",
				click: () => {
					if (isFormValid()) closeAction(true);
				},
				type: ButtonType.Primary
			})])
		] }).setCloseHandler(() => closeAction(false)).addShortcut({
			key: Keys.ESC,
			shift: false,
			exec: () => closeAction(false),
			help: "cancel_action"
		}).addShortcut({
			key: Keys.RETURN,
			shift: false,
			exec: () => {
				if (isFormValid()) closeAction(true);
			},
			help: "ok_action"
		}).show();
	});
}
var UpgradeSubscriptionPageAttrs = class {
	data;
	constructor(upgradeData) {
		this.data = upgradeData;
	}
	headerTitle() {
		return "subscription_label";
	}
	nextAction(showErrorDialog) {
		return Promise.resolve(true);
	}
	isSkipAvailable() {
		return false;
	}
	isEnabled() {
		return true;
	}
};

//#endregion
//#region src/common/subscription/UpgradeCongratulationsPage.ts
var UpgradeCongratulationsPage = class {
	dom;
	__signupPaidTest;
	__signupFreeTest;
	oncreate(vnode) {
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid");
		this.__signupFreeTest = locator.usageTestController.getTest("signup.free");
		this.dom = vnode.dom;
	}
	view({ attrs }) {
		const { newAccountData } = attrs.data;
		return [
			mithril_default(".center.h4.pt", lang.get("accountCreationCongratulation_msg")),
			newAccountData ? mithril_default(".plr-l", [mithril_default(RecoverCodeField, {
				showMessage: true,
				recoverCode: newAccountData.recoverCode,
				image: {
					src: VisSignupImage,
					alt: "vitor_alt"
				}
			})]) : null,
			mithril_default(".flex-center.full-width.pt-l", mithril_default(LoginButton, {
				label: "ok_action",
				class: "small-login-button",
				onclick: () => {
					if (attrs.data.type === PlanType.Free) {
						const recoveryConfirmationStageFree = this.__signupFreeTest?.getStage(5);
						recoveryConfirmationStageFree?.setMetric({
							name: "switchedFromPaid",
							value: (this.__signupPaidTest?.isStarted() ?? false).toString()
						});
						recoveryConfirmationStageFree?.complete();
					}
					this.close(attrs.data, this.dom);
				}
			}))
		];
	}
	close(data, dom) {
		let promise = Promise.resolve();
		if (data.newAccountData && locator.logins.isUserLoggedIn()) promise = locator.logins.logout(false);
		promise.then(() => {
			emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE);
		});
	}
};
var UpgradeCongratulationsPageAttrs = class {
	data;
	preventGoBack = true;
	hidePagingButtonForPage = true;
	constructor(upgradeData) {
		this.data = upgradeData;
	}
	headerTitle() {
		return "accountCongratulations_msg";
	}
	nextAction(showDialogs) {
		return Promise.resolve(true);
	}
	isSkipAvailable() {
		return false;
	}
	isEnabled() {
		return true;
	}
};

//#endregion
//#region src/common/settings/SelectMailAddressForm.ts
assertMainOrNode();
const VALID_MESSAGE_ID = "mailAddressAvailable_msg";
var SelectMailAddressForm = class {
	username;
	messageId;
	checkAddressTimeout;
	isVerificationBusy;
	lastAttrs;
	constructor({ attrs }) {
		this.lastAttrs = attrs;
		this.isVerificationBusy = false;
		this.checkAddressTimeout = null;
		this.username = "";
		this.messageId = "mailAddressNeutral_msg";
	}
	onupdate(vnode) {
		if (this.lastAttrs.selectedDomain.domain !== vnode.attrs.selectedDomain.domain) this.verifyMailAddress(vnode.attrs);
		this.lastAttrs = vnode.attrs;
	}
	view({ attrs }) {
		if (attrs.injectionsRightButtonAttrs?.click) {
			const originalCallback = attrs.injectionsRightButtonAttrs.click;
			attrs.injectionsRightButtonAttrs.click = (event, dom) => {
				originalCallback(event, dom);
				this.username = "";
				this.messageId = "mailAddressNeutral_msg";
			};
		}
		return mithril_default(TextField, {
			label: "mailAddress_label",
			value: this.username,
			alignRight: true,
			autocompleteAs: Autocomplete.newPassword,
			autocapitalize: Autocapitalize.none,
			helpLabel: () => this.addressHelpLabel(),
			fontSize: px(size.font_size_smaller),
			oninput: (value) => {
				this.username = value;
				this.verifyMailAddress(attrs);
			},
			injectionsRight: () => [mithril_default(".flex.items-end.align-self-end", { style: {
				"padding-bottom": "1px",
				flex: "1 1 auto",
				fontSize: px(size.font_size_smaller),
				lineHeight: px(inputLineHeight)
			} }, `@${attrs.selectedDomain.domain}`), attrs.availableDomains.length > 1 ? mithril_default(IconButton, attachDropdown({
				mainButtonAttrs: {
					title: "domain_label",
					icon: BootIcons.Expand,
					size: ButtonSize.Compact
				},
				childAttrs: () => attrs.availableDomains.map((domain) => this.createDropdownItemAttrs(domain, attrs)),
				showDropdown: () => true,
				width: 250
			})) : attrs.injectionsRightButtonAttrs ? mithril_default(IconButton, attrs.injectionsRightButtonAttrs) : null]
		});
	}
	getCleanMailAddress(attrs) {
		return formatMailAddressFromParts(this.username, attrs.selectedDomain.domain);
	}
	addressHelpLabel() {
		return this.isVerificationBusy ? mithril_default(".flex.items-center.mt-s", [this.progressIcon(), lang.get("mailAddressBusy_msg")]) : mithril_default(".mt-s", lang.get(this.messageId ?? VALID_MESSAGE_ID));
	}
	progressIcon() {
		return mithril_default(Icon, {
			icon: BootIcons.Progress,
			class: "icon-progress mr-s"
		});
	}
	createDropdownItemAttrs(domainData, attrs) {
		return {
			label: lang.makeTranslation("domain", domainData.domain),
			click: () => {
				attrs.onDomainChanged(domainData);
			},
			icon: domainData.isPaid ? BootIcons.Premium : undefined
		};
	}
	onBusyStateChanged(isBusy, onBusyStateChanged) {
		this.isVerificationBusy = isBusy;
		onBusyStateChanged(isBusy);
		mithril_default.redraw();
	}
	onValidationFinished(email, validationResult, onValidationResult) {
		this.messageId = validationResult.errorId;
		onValidationResult(email, validationResult);
	}
	verifyMailAddress(attrs) {
		const { onValidationResult, onBusyStateChanged } = attrs;
		if (this.checkAddressTimeout) clearTimeout(this.checkAddressTimeout);
		const cleanMailAddress = this.getCleanMailAddress(attrs);
		const cleanUsername = this.username.trim().toLowerCase();
		if (cleanUsername === "") {
			this.onValidationFinished(cleanMailAddress, {
				isValid: false,
				errorId: "mailAddressNeutral_msg"
			}, onValidationResult);
			this.onBusyStateChanged(false, onBusyStateChanged);
			return;
		} else if (!isMailAddress(cleanMailAddress, true) || isTutaMailAddress(cleanMailAddress) && cleanUsername.length < 3) {
			this.onValidationFinished(cleanMailAddress, {
				isValid: false,
				errorId: "mailAddressInvalid_msg"
			}, onValidationResult);
			this.onBusyStateChanged(false, onBusyStateChanged);
			return;
		}
		this.onBusyStateChanged(true, onBusyStateChanged);
		this.checkAddressTimeout = setTimeout(async () => {
			if (this.getCleanMailAddress(attrs) !== cleanMailAddress) return;
			let result;
			try {
				const available = await locator.mailAddressFacade.isMailAddressAvailable(cleanMailAddress);
				result = available ? {
					isValid: true,
					errorId: null
				} : {
					isValid: false,
					errorId: attrs.mailAddressNAError ?? "mailAddressNA_msg"
				};
			} catch (e) {
				if (e instanceof AccessDeactivatedError) result = {
					isValid: false,
					errorId: "mailAddressDelay_msg"
				};
else throw e;
			} finally {
				if (this.getCleanMailAddress(attrs) === cleanMailAddress) this.onBusyStateChanged(false, onBusyStateChanged);
			}
			if (this.getCleanMailAddress(attrs) === cleanMailAddress) this.onValidationFinished(cleanMailAddress, result, onValidationResult);
		}, 500);
	}
};

//#endregion
//#region src/common/subscription/Captcha.ts
function parseCaptchaInput(captchaInput) {
	if (captchaInput.match(/^[0-2]?[0-9]:[0-5]?[0-9]$/)) {
		let [h, m] = captchaInput.trim().split(":").map((t) => Number(t));
		if (h > 24) return null;
		return [h % 12, m].map((a) => String(a).padStart(2, "0")).join(":");
	} else return null;
}
async function runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaignToken) {
	try {
		const captchaReturn = await locator.serviceExecutor.get(RegistrationCaptchaService, createRegistrationCaptchaServiceGetData({
			token: campaignToken,
			mailAddress,
			signupToken: deviceConfig.getSignupToken(),
			businessUseSelected: isBusinessUse,
			paidSubscriptionSelected: isPaidSubscription
		}));
		if (captchaReturn.challenge) try {
			return await showCaptchaDialog(captchaReturn.challenge, captchaReturn.token);
		} catch (e) {
			if (e instanceof InvalidDataError) {
				await Dialog.message("createAccountInvalidCaptcha_msg");
				return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaignToken);
			} else if (e instanceof AccessExpiredError) {
				await Dialog.message("createAccountAccessDeactivated_msg");
				return null;
			} else throw e;
		}
else return captchaReturn.token;
	} catch (e) {
		if (e instanceof AccessDeactivatedError) {
			await Dialog.message("createAccountAccessDeactivated_msg");
			return null;
		} else throw e;
	}
}
function showCaptchaDialog(challenge, token) {
	return new Promise((resolve, reject) => {
		let dialog;
		let captchaInput = "";
		const cancelAction = () => {
			dialog.close();
			resolve(null);
		};
		const okAction = () => {
			let parsedInput = parseCaptchaInput(captchaInput);
			if (parsedInput == null) {
				Dialog.message("captchaEnter_msg");
				return;
			}
			const minuteOnesPlace = parsedInput[parsedInput.length - 1];
			if (minuteOnesPlace !== "0" && minuteOnesPlace !== "5") {
				Dialog.message("createAccountInvalidCaptcha_msg");
				return;
			}
			dialog.close();
			locator.serviceExecutor.post(RegistrationCaptchaService, createRegistrationCaptchaServiceData({
				token,
				response: parsedInput
			})).then(() => {
				resolve(token);
			}).catch((e) => {
				reject(e);
			});
		};
		let actionBarAttrs = {
			left: [{
				label: "cancel_action",
				click: cancelAction,
				type: ButtonType.Secondary
			}],
			right: [{
				label: "ok_action",
				click: okAction,
				type: ButtonType.Primary
			}],
			middle: "captchaDisplay_label"
		};
		const imageData = `data:image/png;base64,${uint8ArrayToBase64(challenge)}`;
		dialog = new Dialog(DialogType.EditSmall, { view: () => {
			let captchaFilter = {};
			if (theme.elevated_bg != null && isMonochrome(theme.elevated_bg)) captchaFilter = { filter: `invert(${1 - getColorLuminance(theme.elevated_bg)}` };
			return [mithril_default(DialogHeaderBar, actionBarAttrs), mithril_default(".plr-l.pb", [mithril_default("img.pt-ml.center-h.block", {
				src: imageData,
				alt: lang.get("captchaDisplay_label"),
				style: captchaFilter
			}), mithril_default(TextField, {
				label: lang.makeTranslation("captcha_input", lang.get("captchaInput_label") + " (hh:mm)"),
				helpLabel: () => lang.get("captchaInfo_msg"),
				value: captchaInput,
				oninput: (value) => captchaInput = value
			})])];
		} }).setCloseHandler(cancelAction).show();
	});
}

//#endregion
//#region src/common/subscription/SignupForm.ts
var import_stream$3 = __toESM(require_stream(), 1);
var SignupForm = class {
	passwordModel;
	_confirmTerms;
	_confirmAge;
	_code;
	selectedDomain;
	_mailAddressFormErrorId = null;
	_mailAddress;
	_isMailVerificationBusy;
	__mailValid;
	__lastMailValidationError;
	__signupFreeTest;
	__signupPaidTest;
	availableDomains = (locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain ? TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS : getWhitelabelRegistrationDomains()).map((domain) => ({
		domain,
		isPaid: isPaidPlanDomain(domain)
	}));
	constructor(vnode) {
		this.selectedDomain = getFirstOrThrow(this.availableDomains);
		if (vnode.attrs.isPaidSubscription()) this.selectedDomain = this.availableDomains.find((domain) => domain.domain === DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN) ?? this.selectedDomain;
else this.selectedDomain = this.availableDomains.find((domain) => domain.domain === DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN) ?? this.selectedDomain;
		this.__mailValid = (0, import_stream$3.default)(false);
		this.__lastMailValidationError = (0, import_stream$3.default)(null);
		this.passwordModel = new PasswordModel(locator.usageTestController, locator.logins, {
			checkOldPassword: false,
			enforceStrength: true,
			reservedStrings: () => this._mailAddress ? [this._mailAddress.split("@")[0]] : []
		}, this.__mailValid);
		this.__signupFreeTest = locator.usageTestController.getTest("signup.free");
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid");
		this._confirmTerms = (0, import_stream$3.default)(false);
		this._confirmAge = (0, import_stream$3.default)(false);
		this._code = (0, import_stream$3.default)("");
		this._isMailVerificationBusy = false;
		this._mailAddressFormErrorId = "mailAddressNeutral_msg";
	}
	view(vnode) {
		const a = vnode.attrs;
		const mailAddressFormAttrs = {
			selectedDomain: this.selectedDomain,
			onDomainChanged: (domain) => {
				if (!domain.isPaid || a.isPaidSubscription()) this.selectedDomain = domain;
else Dialog.confirm(lang.makeTranslation("confirm_msg", `${lang.get("paidEmailDomainSignup_msg")}\n${lang.get("changePaidPlan_msg")}`)).then((confirmed) => {
					if (confirmed) vnode.attrs.onChangePlan();
				});
			},
			availableDomains: this.availableDomains,
			onValidationResult: (email, validationResult) => {
				this.__mailValid(validationResult.isValid);
				if (validationResult.isValid) {
					this._mailAddress = email;
					this.passwordModel.recalculatePasswordStrength();
					this._mailAddressFormErrorId = null;
				} else this._mailAddressFormErrorId = validationResult.errorId;
			},
			onBusyStateChanged: (isBusy) => {
				this._isMailVerificationBusy = isBusy;
			}
		};
		const confirmTermsCheckBoxAttrs = {
			label: renderTermsLabel,
			checked: this._confirmTerms(),
			onChecked: this._confirmTerms
		};
		const confirmAgeCheckBoxAttrs = {
			label: () => lang.get("ageConfirmation_msg"),
			checked: this._confirmAge(),
			onChecked: this._confirmAge
		};
		const submit = () => {
			if (this._isMailVerificationBusy) return;
			if (a.readonly) {
				this.__completePreviousStages();
				return a.onComplete(null);
			}
			const errorMessage = this._mailAddressFormErrorId || this.passwordModel.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null);
			if (errorMessage) {
				Dialog.message(errorMessage);
				return;
			}
			const ageConfirmPromise = this._confirmAge() ? Promise.resolve(true) : Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action");
			ageConfirmPromise.then((confirmed) => {
				if (confirmed) {
					this.__completePreviousStages();
					return signup(this._mailAddress, this.passwordModel.getNewPassword(), this._code(), a.isBusinessUse(), a.isPaidSubscription(), a.campaign()).then((newAccountData) => {
						a.onComplete(newAccountData ? newAccountData : null);
					});
				}
			});
		};
		return mithril_default("#signup-account-dialog.flex-center", mithril_default(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [a.readonly ? mithril_default(TextField, {
			label: "mailAddress_label",
			value: a.prefilledMailAddress ?? "",
			autocompleteAs: Autocomplete.newPassword,
			isReadOnly: true
		}) : [
			mithril_default(SelectMailAddressForm, mailAddressFormAttrs),
			a.isPaidSubscription() ? mithril_default(".small.mt-s", lang.get("configureCustomDomainAfterSignup_msg"), [mithril_default(ExternalLink, {
				href: InfoLink.DomainInfo,
				isCompanySite: true
			})]) : null,
			mithril_default(PasswordForm, {
				model: this.passwordModel,
				passwordInfoKey: "passwordImportance_msg"
			}),
			getWhitelabelRegistrationDomains().length > 0 ? mithril_default(TextField, {
				value: this._code(),
				oninput: this._code,
				label: "whitelabelRegistrationCode_label"
			}) : null,
			mithril_default(Checkbox, confirmTermsCheckBoxAttrs),
			mithril_default("div", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
			mithril_default("div", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
			mithril_default(Checkbox, confirmAgeCheckBoxAttrs)
		], mithril_default(".mt-l.mb-l", mithril_default(LoginButton, {
			label: "next_action",
			onclick: submit
		}))]));
	}
	async __completePreviousStages() {
		if (this.__signupFreeTest) {
			await this.__signupFreeTest.getStage(2).complete();
			await this.__signupFreeTest.getStage(3).complete();
			await this.__signupFreeTest.getStage(4).complete();
		}
		if (this.__signupPaidTest) {
			await this.__signupPaidTest.getStage(1).complete();
			await this.__signupPaidTest.getStage(2).complete();
			await this.__signupPaidTest.getStage(3).complete();
		}
	}
};
function renderTermsLabel() {
	return lang.get("termsAndConditions_label");
}
/**
* @return Signs the user up, if no captcha is needed or it has been solved correctly
*/
function signup(mailAddress, pw, registrationCode, isBusinessUse, isPaidSubscription, campaign) {
	const { customerFacade } = locator;
	const operation = locator.operationProgressTracker.startNewOperation();
	return showProgressDialog("createAccountRunning_msg", customerFacade.generateSignupKeys(operation.id).then((keyPairs) => {
		return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaign).then(async (regDataId) => {
			if (regDataId) {
				const app = client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail;
				return customerFacade.signup(keyPairs, AccountType.FREE, regDataId, mailAddress, pw, registrationCode, lang.code, app).then((recoverCode) => {
					return {
						mailAddress,
						password: pw,
						recoverCode
					};
				});
			}
		});
	}), operation.progress).catch(ofClass(InvalidDataError, () => {
		Dialog.message("invalidRegistrationCode_msg");
	})).finally(() => operation.done());
}

//#endregion
//#region src/common/subscription/SignupPage.ts
var SignupPage = class {
	dom;
	oncreate(vnode) {
		this.dom = vnode.dom;
	}
	view(vnode) {
		const data = vnode.attrs.data;
		const newAccountData = data.newAccountData;
		let mailAddress = undefined;
		if (newAccountData) mailAddress = newAccountData.mailAddress;
		return mithril_default(SignupForm, {
			onComplete: (newAccountData$1) => {
				if (newAccountData$1) data.newAccountData = newAccountData$1;
				emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE);
			},
			onChangePlan: () => {
				emitWizardEvent(this.dom, WizardEventType.SHOW_PREVIOUS_PAGE);
			},
			isBusinessUse: data.options.businessUse,
			isPaidSubscription: () => data.type !== PlanType.Free,
			campaign: () => data.registrationDataId,
			prefilledMailAddress: mailAddress,
			readonly: !!newAccountData
		});
	}
};
var SignupPageAttrs = class {
	data;
	constructor(signupData) {
		this.data = signupData;
	}
	headerTitle() {
		const title = getDisplayNameOfPlanType(this.data.type);
		if (this.data.type === PlanType.Essential || this.data.type === PlanType.Advanced) return lang.makeTranslation("signup_business", title + " Business");
else return lang.makeTranslation("signup_title", title);
	}
	nextAction(showErrorDialog) {
		return Promise.resolve(true);
	}
	isSkipAvailable() {
		return false;
	}
	isEnabled() {
		return true;
	}
};

//#endregion
//#region src/common/native/common/generatedipc/MobilePaymentResultType.ts
let MobilePaymentResultType = function(MobilePaymentResultType$1) {
	MobilePaymentResultType$1["Success"] = "0";
	MobilePaymentResultType$1["Cancelled"] = "1";
	MobilePaymentResultType$1["Pending"] = "2";
	return MobilePaymentResultType$1;
}({});

//#endregion
//#region src/common/subscription/UpgradeConfirmSubscriptionPage.ts
var UpgradeConfirmSubscriptionPage = class {
	dom;
	__signupPaidTest;
	__signupFreeTest;
	oncreate(vnode) {
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid");
		this.__signupFreeTest = locator.usageTestController.getTest("signup.free");
		this.dom = vnode.dom;
	}
	view({ attrs }) {
		return this.renderConfirmSubscription(attrs);
	}
	async upgrade(data) {
		if (data.paymentData.paymentMethod === PaymentMethodType.AppStore) {
			const success = await this.handleAppStorePayment(data);
			if (!success) return;
		}
		const serviceData = createSwitchAccountTypePostIn({
			accountType: AccountType.PAID,
			customer: null,
			plan: data.type,
			date: Const.CURRENT_DATE,
			referralCode: data.referralCode,
			specialPriceUserSingle: null,
			surveyData: null,
			app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail
		});
		showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SwitchAccountTypeService, serviceData).then(() => {
			return locator.customerFacade.switchFreeToPremiumGroup();
		})).then(() => {
			const orderConfirmationStage = this.__signupPaidTest?.getStage(5);
			orderConfirmationStage?.setMetric({
				name: "paymentMethod",
				value: PaymentMethodTypeToName[data.paymentData.paymentMethod]
			});
			orderConfirmationStage?.setMetric({
				name: "switchedFromFree",
				value: (this.__signupFreeTest?.isStarted() ?? false).toString()
			});
			orderConfirmationStage?.complete();
			return this.close(data, this.dom);
		}).then(async () => {
			const ratingCheckResult = await getRatingAllowed(new Date(), deviceConfig, isIOSApp());
			if (ratingCheckResult === RatingCheckResult.RATING_ALLOWED) setTimeout(async () => {
				void showAppRatingDialog();
			}, 2e3);
		}).catch(ofClass(PreconditionFailedError, (e) => {
			Dialog.message(lang.makeTranslation("precondition_failed", lang.get(getPreconditionFailedPaymentMsg(e.data)) + (data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : "")));
		})).catch(ofClass(BadGatewayError, (e) => {
			Dialog.message(lang.makeTranslation("payment_failed", lang.get("paymentProviderNotAvailableError_msg") + (data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : "")));
		}));
	}
	/** @return whether subscribed successfully */
	async handleAppStorePayment(data) {
		if (!locator.logins.isUserLoggedIn()) await locator.logins.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary);
		const customerId = locator.logins.getUserController().user.customer;
		const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId));
		try {
			const result = await showProgressDialog("pleaseWait_msg", locator.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(data.type), data.options.paymentInterval(), customerIdBytes));
			if (result.result !== MobilePaymentResultType.Success) return false;
		} catch (e) {
			if (e instanceof MobilePaymentError) {
				console.error("AppStore subscription failed", e);
				Dialog.message("appStoreSubscriptionError_msg", e.message);
				return false;
			} else throw e;
		}
		return await updatePaymentData(data.options.paymentInterval(), data.invoiceData, data.paymentData, null, data.newAccountData != null, null, data.accountingInfo);
	}
	renderConfirmSubscription(attrs) {
		const isYearly = attrs.data.options.paymentInterval() === PaymentInterval.Yearly;
		const subscription = isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label");
		return [
			mithril_default(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			mithril_default(".pt.pb.plr-l", [
				mithril_default(TextField, {
					label: "subscription_label",
					value: getDisplayNameOfPlanType(attrs.data.type),
					isReadOnly: true
				}),
				mithril_default(TextField, {
					label: "paymentInterval_label",
					value: subscription,
					isReadOnly: true
				}),
				mithril_default(TextField, {
					label: isYearly && attrs.data.nextYearPrice ? "priceFirstYear_label" : "price_label",
					value: buildPriceString(attrs.data.price?.displayPrice ?? "0", attrs.data.options),
					isReadOnly: true
				}),
				this.renderPriceNextYear(attrs),
				mithril_default(TextField, {
					label: "paymentMethod_label",
					value: getPaymentMethodName(attrs.data.paymentData.paymentMethod),
					isReadOnly: true
				})
			]),
			mithril_default(".smaller.center.pt-l", attrs.data.options.businessUse() ? lang.get("pricing.subscriptionPeriodInfoBusiness_msg") : lang.get("pricing.subscriptionPeriodInfoPrivate_msg")),
			mithril_default(".flex-center.full-width.pt-l", mithril_default(LoginButton, {
				label: "buy_action",
				class: "small-login-button",
				onclick: () => this.upgrade(attrs.data)
			}))
		];
	}
	renderPriceNextYear(attrs) {
		return attrs.data.nextYearPrice ? mithril_default(TextField, {
			label: "priceForNextYear_label",
			value: buildPriceString(attrs.data.nextYearPrice.displayPrice, attrs.data.options),
			isReadOnly: true
		}) : null;
	}
	close(data, dom) {
		emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE);
	}
};
function buildPriceString(price, options) {
	return formatPriceWithInfo(price, options.paymentInterval(), !options.businessUse());
}

//#endregion
//#region src/common/subscription/UpgradeSubscriptionWizard.ts
var import_stream$2 = __toESM(require_stream(), 1);
assertMainOrNode();
async function showUpgradeWizard(logins, acceptedPlans = NewPaidPlans, msg) {
	const [customer, accountingInfo] = await Promise.all([logins.getUserController().loadCustomer(), logins.getUserController().loadAccountingInfo()]);
	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null);
	const prices = priceDataProvider.getRawPricingData();
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig();
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig);
	const upgradeData = {
		options: {
			businessUse: (0, import_stream$2.default)(prices.business),
			paymentInterval: (0, import_stream$2.default)(asPaymentInterval(accountingInfo.paymentInterval))
		},
		invoiceData: {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo
		},
		paymentData: {
			paymentMethod: getPaymentMethodType(accountingInfo) || await getDefaultPaymentMethod(),
			creditCardData: null
		},
		price: null,
		type: PlanType.Revolutionary,
		nextYearPrice: null,
		accountingInfo,
		customer,
		newAccountData: null,
		registrationDataId: null,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Initial,
		currentPlan: logins.getUserController().isFreeAccount() ? PlanType.Free : null,
		subscriptionParameters: null,
		planPrices: priceDataProvider,
		featureListProvider,
		referralCode: null,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: msg != null ? msg : null
	};
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, new InvoiceAndPaymentDataPageAttrs(upgradeData))
	];
	if (isIOSApp()) wizardPages.splice(1, 1);
	const deferred = defer();
	const wizardBuilder = createWizardDialog(upgradeData, wizardPages, async () => {
		deferred.resolve();
	}, DialogType.EditLarge);
	wizardBuilder.dialog.show();
	return deferred.promise;
}
async function loadSignupWizard(subscriptionParameters, registrationDataId, referralCode, acceptedPlans = AvailablePlans) {
	const usageTestModel = locator.usageTestModel;
	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral);
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests());
	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(registrationDataId, locator.serviceExecutor, referralCode);
	const prices = priceDataProvider.getRawPricingData();
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig();
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig);
	let message;
	if (isIOSApp()) {
		const appstoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null);
		if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) acceptedPlans = acceptedPlans.filter((plan) => plan === PlanType.Free);
		message = appstoreSubscriptionOwnership != MobilePaymentSubscriptionOwnership.NoSubscription ? lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }) : null;
	} else message = null;
	const signupData = {
		options: {
			businessUse: (0, import_stream$2.default)(prices.business),
			paymentInterval: (0, import_stream$2.default)(PaymentInterval.Yearly)
		},
		invoiceData: {
			invoiceAddress: "",
			country: null,
			vatNumber: ""
		},
		paymentData: {
			paymentMethod: await getDefaultPaymentMethod(),
			creditCardData: null
		},
		price: null,
		nextYearPrice: null,
		type: PlanType.Free,
		accountingInfo: null,
		customer: null,
		newAccountData: null,
		registrationDataId,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Signup,
		planPrices: priceDataProvider,
		currentPlan: null,
		subscriptionParameters,
		featureListProvider,
		referralCode,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: message
	};
	const invoiceAttrs = new InvoiceAndPaymentDataPageAttrs(signupData);
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(signupData)),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, invoiceAttrs),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, invoiceAttrs),
		wizardPageWrapper(UpgradeCongratulationsPage, new UpgradeCongratulationsPageAttrs(signupData))
	];
	if (isIOSApp()) wizardPages.splice(2, 1);
	const wizardBuilder = createWizardDialog(signupData, wizardPages, async () => {
		if (locator.logins.isUserLoggedIn()) await locator.logins.logout(false);
		if (signupData.newAccountData) mithril_default.route.set("/login", {
			noAutoLogin: true,
			loginWith: signupData.newAccountData.mailAddress
		});
else mithril_default.route.set("/login", { noAutoLogin: true });
	}, DialogType.EditLarge);
	invoiceAttrs.setEnabledFunction(() => signupData.type !== PlanType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0]);
	wizardBuilder.dialog.show();
}

//#endregion
//#region src/common/subscription/SignOrderProcessingAgreementDialog.ts
assertMainOrNode();
const PRINT_DIV_ID = "print-div";
const agreementTexts = {
	"1_en": {
		heading: "<div class=\"papertext\"><h3 style=\"text-align: center;\" id=\"Orderprocessingagreement-Orderprocessingagreement\">Order processing agreement</h3><p style=\"text-align: center;\">between</p>",
		content: "<p style=\"text-align: center;\">-&nbsp;controller -<br>hereinafter referred to as the Client</p><p style=\"text-align: center;\">and</p><p style=\"text-align: center;\">Tutao GmbH, Deisterstr. 17a, 30449 Hannover, Germany</p><p style=\"text-align: center;\">-&nbsp;processor -<br>hereinafter referred to as the Supplier</p><p style=\"text-align: center;\">&nbsp;</p><h4 id=\"Orderprocessingagreement-1.Subjectmatteranddurationoftheagreement\">1.&nbsp;Subject matter and duration of the agreement</h4><p>The Subject matter of the agreement results from the Terms and Conditions of Tutao GmbH in its current version, see <span class=\"nolink\">https://tuta.com/terms</span>, which is referred to here (hereinafter referred to as Service Agreement). The Supplier processes personal data for the Client according to Art. 4 no. 2 and Art. 28 GDPR based on this agreement.</p><p>The duration of this Agreement corresponds to the selected term of policy in the selected tariff.</p><h4 id=\"Orderprocessingagreement-2.Purpose,TypeofDataandCategoriesofDataSubjects\">2. Purpose, Type of Data and Categories of Data Subjects</h4><p>For the initiation of a contractual relationship and for service provision</p><ul><li>the newly registered email address</li></ul><p>is collected as inventory data.</p><p>For invoicing and determining the VAT</p><ul><li>the domicile of the customer (country)</li><li>the invoicing address</li><li>the VAT identification number (only for business customers of some countries)</li></ul><p>is collected as inventory data.</p><p>For the transaction of payments the following payment data (inventory data) is collected depending on the chosen payment method:</p><ul><li>Banking details (account number and sort code and IBAN/BIC, if necessary bank name, account holder),</li><li>credit card data,</li><li>PayPal user name.</li></ul><p>For the execution of direct debiting, the banking details are shared with the authorized credit institution. For the execution of PayPal payments, the PayPal data is shared with PayPal (Europe). For the execution of credit card payments, the credit card data is shared with the payment service provider&nbsp;Braintree&nbsp;for subprocessing. This includes the transfer of personal data into a third country (USA). An agreement entered into with Braintree defines appropriate safeguards and demands that the data is only processed in compliance with the GDPR and only for the purpose of execution of payments. This agreement can be examined here:&nbsp;<span class=\"nolink\">https://www.braintreepayments.com/assets/Braintree-PSA-Model-Clauses-March2018.pdf</span></p><p>Tutanota provides services for saving, editing, presentation and electronic transmission of data, such as email service, contact management and data storage. Within the context of this content data, personal data of the Client may be processed. All textual content is encrypted for the user and its communication partners in a way that even Tutao GmbH has no access to the data.&nbsp;</p><p>In order to maintain email server operations, for error diagnosis and for prevention of abuse, mail server logs are stored max. 30 days. These logs contain sender and recipient email addresses and time of connection, but no customer IP addresses.&nbsp;</p><p>In order to maintain operations, for prevention of abuse and and for visitors analysis, IP addresses of users are processed. Storage only takes place for IP addresses made anonymous which are therefore not personal data any more.</p><p>With the exception of payment data, the personal data including the email address is not disclosed to third parties. However, Tutao GmbH can be legally bound to provide content data (in case of a valid German court order) and inventory data to prosecution services. There will be no sale of data.</p><p>The undertaking of the contractually agreed Processing of Data shall be carried out exclusively within a Member State of the European Union (EU) or within a Member State of the European Economic Area (EEA). Each and every Transfer of Data to a State which is not a Member State of either the EU or the EEA requires the prior agreement of the Client and shall only occur if the specific Conditions of Article 44 et seq. GDPR have been fulfilled.</p><p>The Categories of Data Subjects comprise the users set up in Tutanota by the Client and these users' communication partners.</p><h4 id=\"Orderprocessingagreement-3.TechnicalandOrganizationalMeasures\">3. Technical and Organizational Measures</h4><p>(1) Before the commencement of processing, the Supplier shall document the execution of the necessary Technical and Organizational Measures, set out in advance of the awarding of the Agreement, specifically with regard to the detailed execution of the Agreement, and shall present these documented measures to the Client for inspection. Upon acceptance by the Client, the documented measures become the foundation of the Agreement. Insofar as the inspection/audit by the Client shows the need for amendments, such amendments shall be implemented by mutual agreement.</p><p>(2) The Supplier shall establish the security in accordance with Article 28 Paragraph 3 Point c, and Article 32 GDPR in particular in conjunction with Article 5 Paragraph 1, and Paragraph 2 GDPR. The measures to be taken are measures of data security and measures that guarantee a protection level appropriate to the risk concerning confidentiality, integrity, availability and resilience of the systems. The state of the art, implementation costs, the nature, scope and purposes of processing as well as the probability of occurrence and the severity of the risk to the rights and freedoms of natural persons within the meaning of Article 32 Paragraph 1 GDPR must be taken into account. [Details in Appendix 1]</p><p>(3) The Technical and Organizational Measures are subject to technical progress and further development. In this respect, it is permissible for the Supplier to implement alternative adequate measures. In so doing, the security level of the defined measures must not be reduced. Substantial changes must be documented.</p><h4 id=\"Orderprocessingagreement-4.Rectification,restrictionanderasureofdata\"><span>4. Rectification, restriction and erasure of data</span></h4><p>(1) The Supplier may not on its own authority rectify, erase or restrict the processing of data that is being processed on behalf of the Client, but only on documented instructions from the Client. <br>Insofar as a Data Subject contacts the Supplier directly concerning a rectification, erasure, or restriction of processing, the Supplier will immediately forward the Data Subject’s request to the Client.</p><p>(2) Insofar as it is included in the scope of services, the erasure policy, ‘right to be forgotten’, rectification, data portability and access shall be ensured by the Supplier in accordance with documented instructions from the Client without undue delay.</p><h4 id=\"Orderprocessingagreement-5.QualityassuranceandotherdutiesoftheSupplier\">5. Quality assurance and other duties of the Supplier&nbsp;</h4><p align=\"justify\">In addition to complying with the rules set out in this Agreement, the Supplier shall comply with the statutory requirements referred to in Articles 28 to 33 GDPR; accordingly, the Supplier ensures, in particular, compliance with the following requirements:</p><ol><li><p align=\"justify\">The Supplier is not obliged to appoint a Data Protection Officer. Mr. Arne Moehle, phone: +49 511 202801-11, arne.moehle@tutao.de, is designated as the Contact Person on behalf of the Supplier.</p></li><li><p align=\"justify\">Confidentiality in accordance with Article 28 Paragraph 3 Sentence 2 Point b, Articles 29 and 32 Paragraph 4 GDPR. The Supplier entrusts only such employees with the data processing outlined in this Agreement who have been bound to confidentiality and have previously been familiarized with the data protection provisions relevant to their work. The Supplier and any person acting under its authority who has access to personal data, shall not process that data unless on instructions from the Client, which includes the powers granted in this Agreement, unless required to do so by law.</p></li><li><p align=\"justify\">Implementation of and compliance with all Technical and Organizational Measures necessary for this Agreement in accordance with Article 28 Paragraph 3 Sentence 2 Point c, Article 32 GDPR [details in Appendix 1].</p></li><li><p align=\"justify\">The Client and the Supplier shall cooperate, on request, with the supervisory authority in performance of its tasks.</p></li><li><p align=\"justify\">The Client shall be informed immediately of any inspections and measures conducted by the supervisory authority, insofar as they relate to this Agreement. This also applies insofar as the Supplier is under investigation or is party to an investigation by a competent authority in connection with infringements to any Civil or Criminal Law, or Administrative Rule or Regulation regarding the processing of personal data in connection with the processing of this Agreement.</p></li><li><p align=\"justify\">Insofar as the Client is subject to an inspection by the supervisory authority, an administrative or summary offense or criminal procedure, a liability claim by a Data Subject or by a third party or any other claim in connection with the Agreement data processing by the Supplier, the Supplier shall make every effort to support the Client.</p></li><li><p align=\"justify\">The Supplier shall periodically monitor the internal processes and the Technical and Organizational Measures to ensure that processing within his area of responsibility is in accordance with the requirements of applicable data protection law and the protection of the rights of the data subject.</p></li><li><p align=\"justify\">Verifiability of the Technical and Organizational Measures conducted by the Client as part of the Client’s supervisory powers referred to in item 7 of this Agreement.</p></li></ol><h4 id=\"Orderprocessingagreement-6.Subcontracting\">6. Subcontracting</h4><p align=\"justify\">(1) Subcontracting for the purpose of this Agreement is to be understood as meaning services which relate directly to the provision of the principal service. This does not include ancillary services, such as telecommunication services, postal / transport services, maintenance and user support services or the disposal of data carriers, as well as other measures to ensure the confidentiality, availability, integrity and resilience of the hardware and software of data processing equipment. The Supplier shall, however, be obliged to make appropriate and legally binding contractual arrangements and take appropriate inspection measures to ensure the data protection and the data security of the Client's data, even in the case of outsourced ancillary services.</p><p align=\"justify\">(2) The Supplier may commission subcontractors (additional contract processors) only after prior explicit written or documented consent from the Client.&nbsp;</p><p align=\"justify\">(3) Outsourcing to subcontractors or changing the existing subcontractor are permissible when:</p><ul><li>The Supplier submits such an outsourcing to a subcontractor to the Client in writing or in text form with appropriate advance notice; and</li><li>The Client has not objected to the planned outsourcing in writing or in text form by the date of handing over the data to the Supplier; and</li><li>The subcontracting is based on a contractual agreement in accordance with Article 28 paragraphs 2-4 GDPR.</li></ul><p align=\"justify\">(4) The transfer of personal data from the Client to the subcontractor and the subcontractors commencement of the data processing shall only be undertaken after compliance with all requirements has been achieved.</p><p align=\"justify\">(5) If the subcontractor provides the agreed service outside the EU/EEA, the Supplier shall ensure compliance with EU Data Protection Regulations by appropriate measures. The same applies if service providers are to be used within the meaning of Paragraph 1 Sentence 2.</p><p align=\"justify\">(6) Further outsourcing by the subcontractor requires the express consent of the main Client (at the minimum in text form);</p><p align=\"justify\">(7) All contractual provisions in the contract chain shall be communicated to and agreed with each and every additional subcontractor.</p><h4 class=\"western\" id=\"Orderprocessingagreement-7.SupervisorypowersoftheClient\">7. Supervisory powers of the Client</h4><p align=\"justify\">(1) The Client has the right, after consultation with the Supplier, to carry out inspections or to have them carried out by an auditor to be designated in each individual case. It has the right to convince itself of the compliance with this agreement by the Supplier in his business operations by means of random checks, which are ordinarily to be announced in good time.</p><p align=\"justify\">(2) The Supplier shall ensure that the Client is able to verify compliance with the obligations of the Supplier in accordance with Article 28 GDPR. The Supplier undertakes to give the Client the necessary information on request and, in particular, to demonstrate the execution of the Technical and Organizational Measures.</p><p align=\"justify\">(3) Evidence of such measures, which concern not only the specific Agreement, may be provided by</p><ul><li>Compliance with approved Codes of Conduct pursuant to Article 40 GDPR;</li><li>Certification according to an approved certification procedure in accordance with Article 42 GDPR;</li><li>Current auditor’s certificates, reports or excerpts from reports provided by independent bodies (e.g. auditor, Data Protection Officer, IT security department, data privacy auditor, quality auditor)</li><li>A suitable certification by IT security or data protection auditing (e.g. according to BSI-Grundschutz (IT Baseline Protection certification developed by the German&nbsp; Federal Office for Security in Information Technology (BSI)) or ISO/IEC 27001).</li></ul><p align=\"justify\">(4) The Supplier may claim remuneration for enabling Client inspections.&nbsp;</p><h4 class=\"western\" id=\"Orderprocessingagreement-8.CommunicationinthecaseofinfringementsbytheSupplier\">8. Communication in the case of infringements by the Supplier</h4><p align=\"justify\">(1) The Supplier shall assist the Client in complying with the obligations concerning the security of personal data, reporting requirements for data breaches, data protection impact assessments and prior consultations, referred to in Articles 32 to 36 of the GDPR. These include:</p><ol><li>Ensuring an appropriate level of protection through Technical and Organizational Measures that take into account the circumstances and purposes of the processing as well as the projected probability and severity of a possible infringement of the law as a result of security vulnerabilities and that enable an immediate detection of relevant infringement events.</li><li>The obligation to report a personal data breach immediately to the Client</li><li>The duty to assist the Client with regard to the Client’s obligation to provide information to the Data Subject concerned and to immediately provide the Client with all relevant information in this regard.</li><li>Supporting the Client with its data protection impact assessment</li><li>Supporting the Client with regard to prior consultation of the supervisory authority</li></ol><p align=\"justify\">(2) The Supplier may claim compensation for support services which are not included in the description of the services and which are not attributable to failures on the part of the Supplier.</p><h4 class=\"western\" id=\"Orderprocessingagreement-9.AuthorityoftheClienttoissueinstructions\">9. Authority of the Client to issue instructions</h4><p>(1) The Client shall immediately confirm oral instructions (at the minimum in text form).</p><p>(2) The Supplier shall inform the Client immediately if he considers that an instruction violates Data Protection Regulations. The Supplier shall then be entitled to suspend the execution of the relevant instructions until the Client confirms or changes them.</p><h4 class=\"western\" id=\"Orderprocessingagreement-10.Deletionandreturnofpersonaldata\">10. Deletion and return of personal data</h4><p>(1) Copies or duplicates of the data shall never be created without the knowledge of the Client, with the exception of back-up copies as far as they are necessary to ensure orderly data processing, as well as data required to meet regulatory requirements to retain data.</p><p>(2) After conclusion of the contracted work, or earlier upon request by the Client, at the latest upon termination of the Service Agreement, the Supplier shall hand over to the Client or – subject to prior consent – destroy all documents, processing and utilization results, and data sets related to the Agreement that have come into its possession, in a data-protection compliant manner. The same applies to any and all connected test, waste, redundant and discarded material. The log of the destruction or deletion shall be provided on request.</p><p>(3) Documentation which is used to demonstrate orderly data processing in accordance with the Agreement shall be stored beyond the contract duration by the Supplier in accordance with the respective retention periods. It may hand such documentation over to the Client at the end of the contract duration to relieve the Supplier of this contractual obligation.</p><h4 id=\"Orderprocessingagreement-11.Finalprovisions\">11. Final provisions</h4><p align=\"justify\">(1) This agreement shall be governed by and construed in accordance with German law. Place of jurisdiction shall be Hanover, Germany.</p><p align=\"justify\">(2) Any changes of or amendments to this Agreement must be in writing to become effective. This includes any alteration of this written form clause.</p><p align=\"justify\" class=\"western\">(3) Should any provision of this Agreement be or become legally invalid or if there is any void that needs to be filled, the validity of the remainder of the agreement shall not be affected thereby. Invalid provisions shall be replaced by common consent with such provisions which come as close as possible to the intended result of the invalid provision. In the event of gaps such provision shall come into force by common consent which comes as close as possible to the intended result of the agreement, should the matter have been considered in advance.</p><p align=\"justify\">&nbsp;</p>",
		appendix: "<div class=\"pagebreak\" style=\"break-before:always;\"><p></p><h4 id=\"Orderprocessingagreement-Appendix1-TechnicalandOrganizationalMeasures\">Appendix 1 - Technical and Organizational Measures&nbsp;</h4><p>System administrators are hereinafter referred to as \"DevOps\". The following Technical and Organizational Measures have been implemented:</p><ol><li>Entrance control: All systems are located in ISO 27001 certified&nbsp;data centers in Germany. Only DevOps are granted access to the physical systems.</li><li>Authentication access control: User access is secured with strong password protection according to the internal Password Policy or public key access control as well as second factor authentication (e.g. YubiKey).&nbsp;User access is managed by DevOps.</li><li>Authorization access control: Data records are secured with role based permissions. Permissions are managed by DevOps.</li><li>Data medium control: All hard discs containing personal data are encrypted. File permissions are allocated to DevOps users/roles as well as application users/roles to make sure no unauthorized access to files is allowed from logged in users and processes.</li><li>Transfer control: Transfer of personal data to other parties is being logged.&nbsp;Logs include the user/process that initiated the input, the type of personal data and the timestamp. The logs are kept for 6 months.</li><li>Input control: Input of new and updated as well as deletion of personal data is logged. Logs include the user/process that initiated the input, the type of personal data and the timestamp. The logs are kept for 6 months.</li><li>Transport control: Transport of personal data from and to the system are secured with strong SSL and/or end-to-end encryption.</li><li>Confidentiality: Personal data is stored end-to-end encrypted wherever possible.</li><li>Restoration control: All systems have a second network interface with access for DevOps only. This interface allows access even if the main interface is blocked. Components of the system can be restarted in case of error conditions. A DDOS mitigation service is automatically activated if a DDOS attack occurs that makes the system inaccessible.</li><li>Reliability:&nbsp;&nbsp;DevOps monitor all systems and are notified if any component of the system fails to be able to bring it up again immediately.</li><li>Data integrity: Automatic error correction on data mediums and also on database level make sure that data integrity is guaranteed. Additionally the integrity of end-to-end encrypted personal data is guaranteed through MACs during encryption and decryption.</li><li>Instruction control: All employees are aware of the purposes of processing and regularly complete&nbsp;an internal security awareness program. (Sub)processors are instructed by written contracts.</li><li>Availability control: All systems are located in ISO 27001 certified&nbsp;data centers in Germany which guarantee the physical availability and connection of the systems. All long-term data is stored as three replicas on different servers or in a RAID system. Backups are created prior to updating critical parts of the system.</li><li>Separability: Separate processing for personal data is set up as required.</li><li>Resilience: All systems use highly scalable components that are designed for much higher load than actually needed. All systems are expandable very quickly to continuously allow processing higher loads.</li></ol></div>\n</div>"
	},
	"1_de": {
		heading: "<div class=\"papertext\"><h2 style=\"text-align: center;\" id=\"VertragzurAuftragsverarbeitung-VertragzurAuftragsverarbeitung\">Vertrag zur Auftragsverarbeitung</h2><p style=\"text-align: center;\">zwischen</p>",
		content: "<p style=\"text-align: center;\">-&nbsp;Verantwortlicher -<br>nachstehend Auftraggeber genannt&nbsp;</p><p style=\"text-align: center;\">und</p><p style=\"text-align: center;\">Tutao GmbH, Deisterstr. 17a, 30449 Hannover</p><p style=\"text-align: center;\">-&nbsp;Auftragsverarbeiter -<br>nachstehend&nbsp;Auftragnehmer genannt</p><p style=\"text-align: center;\">&nbsp;</p><h2 id=\"VertragzurAuftragsverarbeitung-1.GegenstandundDauer\">1.&nbsp;Gegenstand und Dauer</h2><p>Der Gegenstand des Auftrags ergibt sich aus den AGB der Tutao GmbH in der jeweils gültigen Version, siehe <span class=\"nolink\">https://tuta.com/terms</span>, auf die hier verwiesen wird (im Folgenden Leistungsvereinbarung). Der&nbsp;Auftragnehmer verarbeitet dabei personenbezogene Daten für den Auftraggeber&nbsp;im Sinne von Art. 4 Nr. 2 und Art. 28 DS-GVO auf Grundlage dieses Vertrages.</p><p>Die Dauer dieses Auftrags entspricht der im jeweiligen Tarif gewählten Vertragslaufzeit.</p><h2 id=\"VertragzurAuftragsverarbeitung-2.Zweck,DatenkategorienundbetroffenePersonen\">2. Zweck, Datenkategorien und betroffene Personen</h2><p>Zur Begründung eines Vertragsverhältnisses, und zur Leistungserbringung wird</p><ul><li>die neu registrierte E-Mail-Adresse</li></ul><p>als Bestandsdatum erfasst.</p><p>Für die Rechnungsstellung und Bestimmung der Umsatzsteuer&nbsp;werden</p><ul><li>der Sitz des Kunden (Land)</li><li>die Rechnungsadresse</li><li>die&nbsp;USt-IdNr. (nur für Geschäftskunden bestimmter Länder)</li></ul><p>als Bestandsdaten erfasst.</p><p>Zur Abwicklung von Zahlungen werden, je nach gewählter Zahlungsart, die folgenden Zahlungsdaten (Bestandsdaten) erfasst:</p><ul><li>Bankverbindung (Kontonummer und BLZ bzw. IBAN/BIC, ggf. Bankname, Kontoinhaber),</li><li>Kreditkartendaten,</li><li>der PayPal-Nutzername.</li></ul><p>Zur Abwicklung von Lastschriften wird die Bankverbindung an das beauftragte Kreditinstitut weitergegeben. <span>Zur Abwicklung von PayPal-Zahlungen werden die PayPal-Zahlungsdaten an PayPal (Europe) weitergegeben. </span>Zur Abwicklung von&nbsp;Kreditkartenzahlungen werden die Kreditkartendaten zur Auftragsverarbeitung an den Zahlungsdienstleister&nbsp;Braintree&nbsp;weitergegeben. Hierbei handelt es sich um eine Übermittlung von personenbezogenen Daten an ein Drittland. Ein mit Braintree geschlossener Vertrag sieht geeignete Garantien vor und stellt sicher, dass die weitergegebenen Daten nur im Einklang mit der DSGVO und lediglich zur Abwicklung von Zahlungen verwendet werden. Dieser Vertrag kann&nbsp;hier eingesehen werden:&nbsp;<span class=\"nolink\">https://www.braintreepayments.com/assets/Braintree-PSA-Model-Clauses-March2018.pdf</span></p><p>Tutanota stellt Dienste zur Speicherung, Bearbeitung, Darstellung und elektronischem Versand von Daten bereit, wie z.B. E-Mail-Service, Kontaktverwaltung und Datenablage. Im Rahmen dieser Inhaltsdaten können personenbezogene Daten des Auftraggebers verarbeitet werden. Alle textuellen Inhalte werden verschlüsselt für den Nutzer und dessen Kommunikationspartner gespeichert, so dass die Tutao GmbH selbst keinen Zugriff auf diese Daten hat.</p><p>Zur Aufrechterhaltung des&nbsp;Mailserver-Betriebs, zur Fehlerdiagnose und zur Verhinderung von Missbrauch werden Mail-Server-Logs maximal 30 Tage gespeichert. Diese enthalten Sender- und Empfänger-E-Mail-Adressen sowie den Zeitpunkt der Verbindung, jedoch keine IP-Adressen der Benutzer.</p><p>Zur Sicherstellung des Betriebs, zur&nbsp;Verhinderung von Missbrauch und zur&nbsp;Besucherauswertung werden IP-Adressen der Benutzer verarbeitet. <span>Eine Speicherung erfolgt nur für anonymisierte und damit nicht mehr </span><span>personenbezogene </span><span>IP-Adressen.</span></p><p>Mit Ausnahme der Zahlungsdaten werden die personenbezogenen Daten inklusive der E-Mail-Adresse nicht an Dritte weitergegeben. Jedoch kann Tutao GmbH rechtlich verpflichtet werden Inhaltsdaten (bei Vorlage eines gültigen deutschen Gerichtsbeschlusses) sowie&nbsp;Bestandsdaten an Strafverfolgungsbehörden auszuliefern. Es erfolgt kein Verkauf von Daten.</p><p>Die Erbringung der vertraglich vereinbarten Datenverarbeitung findet ausschließlich in einem Mitgliedsstaat der Europäischen Union oder in einem anderen Vertragsstaat des Abkommens über den Europäischen Wirtschaftsraum statt.&nbsp;Jede Verlagerung in ein Drittland bedarf der vorherigen Zustimmung des Auftraggebers und darf nur erfolgen, wenn die besonderen Voraussetzungen der Art. 44 ff. DS-GVO erfüllt sind.&nbsp;</p><p>Die Kategorien der durch die Verarbeitung betroffenen Personen umfassen die durch den Auftraggeber in Tutanota eingerichtete Nutzer und deren Kommunikationspartner.</p><h2 id=\"VertragzurAuftragsverarbeitung-3.Technisch-organisatorischeMaßnahmen\">3. Technisch-organisatorische Maßnahmen</h2><p>(1) Der&nbsp;Auftragnehmer hat die Umsetzung der im Vorfeld der Auftragsvergabe dargelegten und erforderlichen technischen und organisatorischen Maßnahmen vor Beginn der Verarbeitung, insbesondere hinsichtlich der konkreten Auftragsdurchführung zu dokumentieren und dem&nbsp;Auftraggeber zur Prüfung zu übergeben. Bei Akzeptanz durch den&nbsp;Auftraggeber&nbsp;werden die dokumentierten Maßnahmen Grundlage des Auftrags. Soweit die Prüfung des&nbsp;Auftraggebers einen Anpassungsbedarf ergibt, ist dieser einvernehmlich umzusetzen</p><p align=\"justify\">(2) Der Auftragnehmer hat die Sicherheit gem. Art. 28 Abs. 3 lit. c, 32 DS-GVO insbesondere in Verbindung mit Art. 5 Abs. 1, Abs. 2 DS-GVO herzustellen. Insgesamt handelt es sich bei den zu treffenden Maßnahmen um Maßnahmen der Datensicherheit und zur Gewährleistung eines dem Risiko angemessenen Schutzniveaus hinsichtlich der Vertraulichkeit, der Integrität, der Verfügbarkeit sowie der Belastbarkeit der Systeme. Dabei sind der Stand der Technik, die Implementierungskosten und die Art, der Umfang und die Zwecke der Verarbeitung sowie die unterschiedliche Eintrittswahrscheinlichkeit und Schwere des Risikos für die Rechte und Freiheiten natürlicher Personen im Sinne von Art. 32 Abs. 1 DS-GVO zu berücksichtigen [Einzelheiten in Anlage 1].</p><p align=\"justify\">(3) Die technischen und organisatorischen Maßnahmen unterliegen dem technischen Fortschritt und der Weiterentwicklung. Insoweit ist es dem Auftragnehmer gestattet, alternative adäquate Maßnahmen umzusetzen. Dabei darf das Sicherheitsniveau der festgelegten Maßnahmen nicht unterschritten werden. Wesentliche Änderungen sind zu dokumentieren.</p><h2 id=\"VertragzurAuftragsverarbeitung-4.Berichtigung,EinschränkungundLöschungvonDaten\">4. Berichtigung, Einschränkung und Löschung von Daten</h2><p align=\"justify\">(1) Der Auftragnehmer darf die Daten, die im Auftrag verarbeitet werden, nicht eigenmächtig sondern nur nach dokumentierter Weisung des Auftraggebers berichtigen, löschen oder deren Verarbeitung einschränken. Soweit eine betroffene Person sich diesbezüglich unmittelbar an den Auftragnehmer wendet, wird der Auftragnehmer dieses Ersuchen unverzüglich an den Auftraggeber weiterleiten.</p><p align=\"justify\">(2) Soweit vom Leistungsumfang umfasst, sind Löschkonzept, Recht auf Vergessenwerden, Berichtigung, Datenportabilität und Auskunft nach dokumentierter Weisung des Auftraggebers unmittelbar durch den Auftragnehmer sicherzustellen.</p><h2 id=\"VertragzurAuftragsverarbeitung-5.QualitätssicherungundsonstigePflichtendesAuftragnehmers\">5. Qualitätssicherung und sonstige Pflichten des Auftragnehmers</h2><p align=\"justify\">Der Auftragnehmer hat zusätzlich zu der Einhaltung der Regelungen dieses Auftrags gesetzliche Pflichten gemäß Art. 28 bis 33 DS-GVO; insofern gewährleistet er insbesondere die Einhaltung folgender Vorgaben:</p><ol><li><p align=\"justify\">Der Auftragnehmer ist nicht zur Bestellung eines Datenschutzbeauftragten verpflichtet. Als Ansprechpartner beim Auftragnehmer wird Herr Arne Möhle, Telefon: 0511 202801-11, arne.moehle@tutao.de, benannt.</p></li><li><p align=\"justify\">Die Wahrung der Vertraulichkeit gemäß Art. 28 Abs. 3 S. 2 lit. b, 29, 32 Abs. 4 DS-GVO. Der Auftragnehmer setzt bei der Durchführung der Arbeiten nur Beschäftigte ein, die auf die Vertraulichkeit verpflichtet und zuvor mit den für sie relevanten Bestimmungen zum Datenschutz vertraut gemacht wurden. Der Auftragnehmer und jede dem Auftragnehmer unterstellte Person, die Zugang zu personenbezogenen Daten hat, dürfen diese Daten ausschließlich entsprechend der Weisung des Auftraggebers verarbeiten einschließlich der in diesem Vertrag eingeräumten Befugnisse, es sei denn, dass sie gesetzlich zur Verarbeitung verpflichtet sind.</p></li><li><p align=\"justify\">Die Umsetzung und Einhaltung aller für diesen Auftrag erforderlichen technischen und organisatorischen Maßnahmen gemäß Art. 28 Abs. 3 S. 2 lit. c, 32 DS-GVO [Einzelheiten in Anlage 1].</p></li><li><p align=\"justify\">Der Auftraggeber und der Auftragnehmer arbeiten auf Anfrage mit der Aufsichtsbehörde bei der Erfüllung ihrer Aufgaben zusammen.</p></li><li><p align=\"justify\">Die unverzügliche Information des Auftragnehmers über Kontrollhandlungen und Maßnahmen der Aufsichtsbehörde, soweit sie sich auf diesen Auftrag beziehen. Dies gilt auch, soweit eine zuständige Behörde im Rahmen eines Ordnungswidrigkeits- oder Strafverfahrens in Bezug auf die Verarbeitung personenbezogener Daten bei der Auftragsverarbeitung beim Auftragnehmer ermittelt.</p></li><li><p align=\"justify\">Soweit der Auftraggeber seinerseits einer Kontrolle der Aufsichtsbehörde, einem Ordnungswidrigkeits- oder Strafverfahren, dem Haftungsanspruch einer betroffenen Person oder eines Dritten oder einem anderen Anspruch im Zusammenhang mit der Auftragsverarbeitung beim Auftragnehmer ausgesetzt ist, hat ihn der Auftragnehmer nach besten Kräften zu unterstützen.</p></li><li><p align=\"justify\">Der Auftragnehmer kontrolliert regelmäßig die internen Prozesse sowie die technischen und organisatorischen Maßnahmen, um zu gewährleisten, dass die Verarbeitung in seinem Verantwortungsbereich im Einklang mit den Anforderungen des geltenden Datenschutzrechts erfolgt und der Schutz der Rechte der betroffenen Person gewährleistet wird.</p></li><li><p align=\"justify\">Nachweisbarkeit der getroffenen technischen und organisatorischen Maßnahmen gegenüber dem Auftraggeber im Rahmen seiner Kontrollbefugnisse nach Ziffer 7 dieses Vertrages.</p></li></ol><h2 id=\"VertragzurAuftragsverarbeitung-6.Unterauftragsverhältnisse\">6. Unterauftragsverhältnisse</h2><p align=\"justify\">(1) Als Unterauftragsverhältnisse im Sinne dieser Regelung sind solche Dienstleistungen zu verstehen, die sich unmittelbar auf die Erbringung der Hauptleistung beziehen. Nicht hierzu gehören Nebenleistungen, die der Auftragnehmer wie z.B. Telekommunikationsleistungen, Post-/Transportdienstleistungen, Wartung und Benutzerservice oder die Entsorgung von Datenträgern sowie sonstige Maßnahmen zur Sicherstellung der Vertraulichkeit, Verfügbarkeit, Integrität und Belastbarkeit der Hard- und Software von Datenverarbeitungsanlagen in Anspruch nimmt. Der Auftragnehmer ist jedoch verpflichtet, zur Gewährleistung des Datenschutzes und der Datensicherheit der Daten des Auftraggebers auch bei ausgelagerten Nebenleistungen angemessene und gesetzeskonforme vertragliche Vereinbarungen sowie Kontrollmaßnahmen zu ergreifen.</p><p align=\"justify\">(2) Der Auftragnehmer darf Unterauftragnehmer (weitere Auftragsverarbeiter) nur nach vorheriger ausdrücklicher schriftlicher bzw. dokumentierter Zustimmung des Auftraggebers beauftragen.</p><p align=\"justify\">(3) Die Auslagerung auf Unterauftragnehmer sowie der&nbsp;Wechsel der bestehenden Unterauftragnehmer sind zulässig, soweit:</p><ul><li>der Auftragnehmer eine solche Auslagerung auf Unterauftragnehmer dem Auftraggeber eine angemessene Zeit vorab schriftlich oder in Textform anzeigt und</li><li>der Auftraggeber nicht bis zum Zeitpunkt der Übergabe der Daten gegenüber dem Auftragnehmer schriftlich oder in Textform Einspruch gegen die geplante Auslagerung erhebt und</li><li>eine vertragliche Vereinbarung nach Maßgabe des Art. 28 Abs. 2-4 DS-GVO zugrunde gelegt wird.</li></ul><p align=\"justify\">(4) Die Weitergabe von personenbezogenen Daten des Auftraggebers an den Unterauftragnehmer und dessen erstmaliges Tätigwerden sind erst mit Vorliegen aller Voraussetzungen für eine Unterbeauftragung gestattet.</p><p align=\"justify\">(5) Erbringt der Unterauftragnehmer die vereinbarte Leistung außerhalb der EU/des EWR stellt der Auftragnehmer die datenschutzrechtliche Zulässigkeit durch entsprechende Maßnahmen sicher. Gleiches gilt, wenn Dienstleister im Sinne von Abs. 1 Satz 2 eingesetzt werden sollen.</p><p align=\"justify\">(6) Eine weitere Auslagerung durch den Unterauftragnehmer bedarf der ausdrücklichen Zustimmung des Hauptauftraggebers (mind. Textform).</p><p align=\"justify\">(7) Sämtliche vertraglichen Regelungen in der Vertragskette sind auch dem weiteren Unterauftragnehmer aufzuerlegen.</p><h2 class=\"western\" id=\"VertragzurAuftragsverarbeitung-7.KontrollrechtedesAuftraggebers\">7. Kontrollrechte des Auftraggebers</h2><p align=\"justify\">(1) Der Auftraggeber hat das Recht, im Benehmen mit dem Auftragnehmer Überprüfungen durchzuführen oder durch im Einzelfall zu benennende Prüfer durchführen zu lassen. Er hat das Recht, sich durch Stichprobenkontrollen, die in der Regel rechtzeitig anzumelden sind, von der Einhaltung dieser Vereinbarung durch den Auftragnehmer in dessen Geschäftsbetrieb zu überzeugen.</p><p align=\"justify\">(2) Der Auftragnehmer stellt sicher, dass sich der Auftraggeber von der Einhaltung der Pflichten des Auftragnehmers nach Art. 28 DS-GVO überzeugen kann. Der Auftragnehmer verpflichtet sich, dem Auftraggeber auf Anforderung die erforderlichen Auskünfte zu erteilen und insbesondere die Umsetzung der technischen und organisatorischen Maßnahmen nachzuweisen.</p><p align=\"justify\">(3) Der Nachweis solcher Maßnahmen, die nicht nur den konkreten Auftrag betreffen, kann erfolgen durch</p><ul><li>die Einhaltung genehmigter Verhaltensregeln gemäß Art. 40 DS-GVO;</li><li>die Zertifizierung nach einem genehmigten Zertifizierungsverfahren gemäß Art. 42 DS-GVO;</li><li>aktuelle Testate, Berichte oder Berichtsauszüge unabhängiger Instanzen (z.B. Wirtschaftsprüfer, Revision, Datenschutzbeauftragter, IT-Sicherheitsabteilung, Datenschutzauditoren, Qualitätsauditoren);</li><li>eine geeignete Zertifizierung durch IT-Sicherheits- oder Datenschutzaudit (z.B. nach BSI-Grundschutz).</li></ul><p align=\"justify\">(4) Für die Ermöglichung von Kontrollen durch den Auftraggeber kann der Auftragnehmer einen Vergütungsanspruch geltend machen.</p><h2 class=\"western\" id=\"VertragzurAuftragsverarbeitung-8.MitteilungbeiVerstößendesAuftragnehmers\">8. Mitteilung bei Verstößen des Auftragnehmers</h2><p align=\"justify\">(1) Der Auftragnehmer unterstützt den Auftraggeber bei der Einhaltung der in den Artikeln 32 bis 36 der DS-GVO genannten Pflichten zur Sicherheit personenbezogener Daten, Meldepflichten bei Datenpannen, Datenschutz-Folgeabschätzungen und vorherige Konsultationen. Hierzu gehören u.a.</p><ol><li><p align=\"justify\">die Sicherstellung eines angemessenen Schutzniveaus durch technische und organisatorische Maßnahmen, die die Umstände und Zwecke der Verarbeitung sowie die prognostizierte Wahrscheinlichkeit und Schwere einer möglichen Rechtsverletzung durch Sicherheitslücken berücksichtigen und eine sofortige Feststellung von relevanten Verletzungsereignissen ermöglichen</p></li><li><p align=\"justify\">die Verpflichtung, Verletzungen personenbezogener Daten unverzüglich an den Auftraggeber zu melden</p></li><li><p align=\"justify\">die Verpflichtung, dem Auftraggeber im Rahmen seiner Informationspflicht gegenüber dem Betroffenen zu unterstützen und ihm in diesem Zusammenhang sämtliche relevante Informationen unverzüglich zur Verfügung zu stellen</p></li><li><p align=\"justify\">die Unterstützung des Auftraggebers für dessen Datenschutz-Folgenabschätzung</p></li><li><p align=\"justify\">die Unterstützung des Auftraggebers im Rahmen vorheriger Konsultationen mit der Aufsichtsbehörde</p></li></ol><p align=\"justify\">(2) Für Unterstützungsleistungen, die nicht in der Leistungsbeschreibung enthalten oder nicht auf ein Fehlverhalten des Auftragnehmers zurückzuführen sind, kann der Auftragnehmer eine Vergütung beanspruchen.</p><h2 class=\"western\" id=\"VertragzurAuftragsverarbeitung-9.WeisungsbefugnisdesAuftraggebers\">9. Weisungsbefugnis des Auftraggebers</h2><p align=\"justify\">(1) Mündliche Weisungen bestätigt der Auftraggeber unverzüglich (mind. Textform).</p><p align=\"justify\">(2) Der Auftragnehmer hat den Auftraggeber unverzüglich zu informieren, wenn er der Meinung ist, eine Weisung verstoße gegen Datenschutzvorschriften. Der Auftragnehmer ist berechtigt, die Durchführung der entsprechenden Weisung solange auszusetzen, bis sie durch den Auftraggeber bestätigt oder geändert wird.</p><h2 class=\"western\" id=\"VertragzurAuftragsverarbeitung-10.LöschungundRückgabevonpersonenbezogenenDaten\">10. Löschung und Rückgabe von personenbezogenen Daten</h2><p align=\"justify\">(1) Kopien oder Duplikate der Daten werden ohne Wissen des Auftraggebers nicht erstellt. Hiervon ausgenommen sind Sicherheitskopien, soweit sie zur Gewährleistung einer ordnungsgemäßen Datenverarbeitung erforderlich sind, sowie Daten, die im Hinblick auf die Einhaltung gesetzlicher Aufbewahrungspflichten erforderlich sind.</p><p align=\"justify\">(2) Nach Abschluss der vertraglich vereinbarten Arbeiten oder früher nach Aufforderung durch den Auftraggeber – spätestens mit Beendigung der Leistungsvereinbarung – hat der Auftragnehmer sämtliche in seinen Besitz gelangten Unterlagen, erstellte Verarbeitungs- und Nutzungsergebnisse sowie Datenbestände, die im Zusammenhang mit dem Auftragsverhältnis stehen, dem Auftraggeber auszuhändigen oder nach vorheriger Zustimmung datenschutzgerecht zu vernichten. Gleiches gilt für Test- und Ausschussmaterial. Das Protokoll der Löschung ist auf Anforderung vorzulegen.</p><p align=\"justify\">(3) Dokumentationen, die dem Nachweis der auftrags- und ordnungsgemäßen Datenverarbeitung dienen, sind durch den Auftragnehmer entsprechend der jeweiligen Aufbewahrungsfristen über das Vertragsende hinaus aufzubewahren. Er kann sie zu seiner Entlastung bei Vertragsende dem Auftraggeber übergeben.</p><h2 id=\"VertragzurAuftragsverarbeitung-11.Schlussbestimmungen\">11. Schlussbestimmungen</h2><p align=\"justify\">(1) <span>Dieser Vertrag unterliegt dem Recht der Bundesrepublik Deutschland. Gerichtsstand ist Hannover.</span></p><p align=\"justify\"><span>(2) Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform. Dies gilt auch für den Verzicht auf das Schriftformerfordernis.</span></p><p align=\"justify\" class=\"western\">(3) <span>Sollten einzelne Bestimmungen dieses Vertrags unwirksam sein oder werden, so wird dadurch die Gültigkeit der übrigen Bestimmungen nicht berührt. Die Vertragsparteien verpflichten sich in diesen Fällen, anstelle der etwa unwirksamen Bestimmung(en) – mit Wirkung von Beginn der Unwirksamkeit an – eine Ersatzregelung oder ggf. einen neuen wirksamen Vertrag zu vereinbaren, die bzw. der dem wirtschaftlichen gewollten Zweck der unwirksamen Bestimmung(en) weitgehend entspricht oder am nächsten kommt. Dies gilt auch für den Fall, dass der Vertrag eine Regelungslücke enthalten sollte.</span></p><p align=\"justify\">&nbsp;</p>",
		appendix: "<div class=\"pagebreak\" style=\"break-before:always;\"><p></p><h2 id=\"VertragzurAuftragsverarbeitung-Anlage1(TechnischeundorganisatorischeMaßnahmen)\">Anlage 1 (Technische und organisatorische Maßnahmen)</h2><p>Die Systemadministratoren werden im Folgenden \"DevOps\" genannt. Folgende Maßnahmen wurden getroffen:</p><ol><li>Zutrittskontrolle: Alle Systeme sind in ISO 27001 zertifizierten Rechenzentren in Deutschland gehostet. Nur DevOps haben Zutritt zu den physischen Systemen.</li><li>Zugangskontrolle/Benutzerkontrolle: Der Zugriff durch Benutzer ist mit starken Passwörtern entsprechend den internen Passwortregeln oder Public-Key-Zugriff und Zwei-Faktor-Authentifizierung (e.g. YubiKey) gesichert.&nbsp;Benutzerzugriff wird von DevOps verwaltet.</li><li>Zugriffskontrolle/Speicherkontrolle: Datensätze sind mit rollenbasierten Berechtigungen geschützt. Berechtigungen werden von DevOps verwaltet.</li><li>Datenträgerkontrolle: <span>Alle Festplatten mit personenbezogenen Daten sind verschüsselt. Dateiberechtigungen sind für DevOps sowie Anwendungen so vergeben, dass unberechtigter Zugriff auf Dateien von eingeloggten Benutzern und Prozessen verhindert wird.</span></li><li>Übertragungskontrolle/Weitergabekontrolle: Weitergabe von personenbezogenen Daten an andere Empfänger wird protokolliert.&nbsp;Die Protokolle enthalten den Benutzer/Prozess, der die Eingabe initiiert hat, die Kategorie personenbezogener Daten und den Zeitstempel. Die Protokolle werden für sechs Monate aufgehoben.</li><li>Eingabekontrolle: Eingabe von neuen und aktualisierten sowie die Löschung von personenbezogenen Daten wird protokolliert. <span>Die Protokolle enthalten den Benutzer/Prozess, der die Eingabe initiiert hat, die Kategorie personenbezogener Daten und den Zeitstempel. Die Protokolle werden für sechs Monate aufgehoben.</span></li><li>Transportkontrolle: Übertragung von personenbezogenen Daten von und zu den Systemen ist durch starke SSL-Verschlüsselung und/oder Ende-zu-Ende-Verschlüsselung gesichert.</li><li>Vertraulichkeit: Personenbezogene Daten werden soweit möglich Ende-zu-Ende verschlüsselte gespeichert.</li><li>Wiederherstellbarkeit: Alle Systeme haben eine zweite Netzwerkschnittstelle, die nur den Zugriff von DevOps erlaubt. Diese Schnittstelle erlaubt den Zugriff selbst wenn die Hauptschnittstelle blockiert ist. Komponenten des Systems können im Fehlerfall neu gestartet werden. Ein Dienst zum Schutz vor DDOS-Angriffen wird automatisch gestartet, wenn solch ein Angriff erkannt wird.</li><li>Zuverlässigkeit:&nbsp;&nbsp;DevOps überwachen alle Systeme und werden automatisch benachrichtigt, wenn eine Komponente des Systems ausfällt, um diese sofort wieder aktivieren zu können.</li><li>Datenintegrität: Automatische Fehlerkorrektur auf Datenträgern und auf Datenbankebene stellt sicher, dass die Datenintegrität gewahrt bleibt. Zusätzlich wird die Integrität der Ende-zu-Ende verschlüsselten personenbezogenen Daten durch MACs bei der Ver- und Entschlüsselung sichergestellt.</li><li>Auftragskontrolle: Alle Mitarbeiter kennen die Zwecke der Verarbeitung und absolvieren regelmäßig ein internes Sicherheitstraining. Unterauftragnehmer werden nur schriftlich beauftragt.</li><li>Verfügbarkeitskontrolle: <span>Alle Systeme sind in ISO 27001 zertifizierten Rechenzentren in Deutschland gehostet, die die physische Verfügbarkeit und Verbindung der Systeme sicherstellen</span>. Alle langfristig gespeicherten Daten werden dreifach repliziert auf unterschiedlichen Servern oder in einem RAID-System abgelegt. Vor der Aktualisierung kritischer Teile des Systems werden Backups angelegt.</li><li>Trennbarkeit: Getrennte Verarbeitung von personenbezogenen Daten ist bedarfsabhängig eingerichtet.</li><li>Belastbarkeit: Alle Systeme bestehen aus hochskalierbaren Komponenten, die für viel höhere Lasten als tatsächlich benötigt ausgelegt sind. Alle Systeme sind kurzfristig erweiterbar, um kontinuierlich steigende Lasten verarbeiten zu können.</li></ol></div>\n</div>"
	}
};
function showForSigning(customer, accountingInfo) {
	const signAction = (dialog) => {
		let data = createSignOrderProcessingAgreementData({
			version,
			customerAddress: addressEditor.getValue()
		});
		if (addressEditor.getValue().trim().split("\n").length < 3) Dialog.message("contractorInfo_msg");
else locator.serviceExecutor.post(SignOrderProcessingAgreementService, data).then(() => dialog.close());
	};
	const version = "1_" + (lang.code === "de" ? "de" : "en");
	const addressEditor = new HtmlEditor().setMinHeight(120).showBorders().setPlaceholderId("contractor_label").setMode(HtmlEditorMode.HTML).setHtmlMonospace(false).setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress));
	Dialog.showActionDialog({
		title: "orderProcessingAgreement_label",
		okAction: signAction,
		okActionTextId: "sign_action",
		type: DialogType.EditLarge,
		child: () => {
			const text = agreementTexts[version];
			return mithril_default(".pt", [
				mithril_default.trust(text.heading),
				mithril_default(".flex-center", mithril_default(".dialog-width-s", [mithril_default(addressEditor), mithril_default(".small", lang.get("contractorInfo_msg"))])),
				mithril_default.trust(text.content),
				mithril_default.trust(text.appendix)
			]);
		}
	});
}
function printElementContent(elem) {
	const root = document.getElementById("root");
	const body = document.body;
	if (!elem || !root || !body) return;
	let printDiv = document.getElementById(PRINT_DIV_ID);
	if (!printDiv) {
		printDiv = document.createElement("DIV");
		printDiv.id = PRINT_DIV_ID;
		body.appendChild(printDiv);
		const classes = root.className.split(" ");
		classes.push("noprint");
		root.className = classes.join(" ");
	}
	printDiv.innerHTML = elem.innerHTML;
	printDiv.classList.add("noscreen");
	window.print();
}
function cleanupPrintElement() {
	const root = document.getElementById("root");
	const body = document.body;
	const printDiv = document.getElementById(PRINT_DIV_ID);
	if (!printDiv || !root || !body) return;
	body.removeChild(printDiv);
	root.className = root.className.split(" ").filter((c) => c !== "noprint").join(" ");
}
function showForViewing(agreement, signerUserGroupInfo) {
	Dialog.showActionDialog({
		title: "orderProcessingAgreement_label",
		okAction: !isApp() && "function" === typeof window.print ? () => printElementContent(document.getElementById("agreement-content")) : null,
		okActionTextId: "print_action",
		cancelActionTextId: "close_alt",
		type: DialogType.EditLarge,
		child: () => {
			const text = agreementTexts[agreement.version];
			return mithril_default("#agreement-content.pt", { onremove: cleanupPrintElement }, [
				mithril_default.trust(text.heading),
				mithril_default("p.text-center.text-prewrap", agreement.customerAddress),
				mithril_default.trust(text.content),
				mithril_default("i", lang.get("signedOn_msg", { "{date}": formatDate(agreement.signatureDate) }) + " " + lang.get("by_label") + " " + getMailAddressDisplayText(signerUserGroupInfo.name, neverNull(signerUserGroupInfo.mailAddress), false)),
				mithril_default("hr"),
				mithril_default.trust(text.appendix)
			]);
		}
	});
}

//#endregion
//#region src/common/settings/SettingsExpander.ts
var SettingsExpander = class {
	oncreate(vnode) {
		vnode.attrs.expanded.map((expanded) => {
			if (expanded && vnode.attrs.onExpand) vnode.attrs.onExpand();
		});
	}
	view(vnode) {
		const { title, buttonText, infoLinkId, infoMsg, expanded } = vnode.attrs;
		return [
			mithril_default(".flex-space-between.items-center.mb-s.mt-l", [mithril_default(".h4", lang.getTranslationText(title)), mithril_default(ExpanderButton, {
				label: buttonText || "show_action",
				expanded: expanded(),
				onExpandedChange: expanded
			})]),
			mithril_default(ExpanderPanel, { expanded: expanded() }, vnode.children),
			infoMsg ? mithril_default("small", lang.getTranslationText(infoMsg)) : null,
			infoLinkId ? ifAllowedTutaLinks(locator.logins, infoLinkId, (link) => mithril_default("small.text-break", [mithril_default(`a[href=${link}][target=_blank]`, link)])) : null
		];
	}
};

//#endregion
//#region src/common/subscription/SubscriptionViewer.ts
var import_stream$1 = __toESM(require_stream(), 1);
assertMainOrNode();
const DAY = 864e5;
let SubscriptionApp = function(SubscriptionApp$1) {
	SubscriptionApp$1["Mail"] = "0";
	SubscriptionApp$1["Calendar"] = "1";
	return SubscriptionApp$1;
}({});
var SubscriptionViewer = class {
	view;
	_subscriptionFieldValue;
	_orderAgreementFieldValue;
	_selectedSubscriptionInterval;
	_currentPriceFieldValue;
	_nextPriceFieldValue;
	_usersFieldValue;
	_storageFieldValue;
	_emailAliasFieldValue;
	_groupsFieldValue;
	_whitelabelFieldValue;
	_sharingFieldValue;
	_eventInvitesFieldValue;
	_autoResponderFieldValue;
	_periodEndDate = null;
	_nextPeriodPriceVisible = null;
	_customer = null;
	_customerInfo = null;
	_accountingInfo = null;
	_lastBooking = null;
	_orderAgreement = null;
	currentPlanType;
	_isCancelled = null;
	_giftCards;
	_giftCardsExpanded;
	constructor(currentPlanType, mobilePaymentsFacade) {
		this.mobilePaymentsFacade = mobilePaymentsFacade;
		this.currentPlanType = currentPlanType;
		const isPremiumPredicate = () => locator.logins.getUserController().isPremiumAccount();
		this._giftCards = new Map();
		loadGiftCards(assertNotNull(locator.logins.getUserController().user.customer)).then((giftCards) => {
			for (const giftCard of giftCards) this._giftCards.set(elementIdPart(giftCard._id), giftCard);
		});
		this._giftCardsExpanded = (0, import_stream$1.default)(false);
		this.view = () => {
			return mithril_default("#subscription-settings.fill-absolute.scroll.plr-l", [
				mithril_default(".h4.mt-l", lang.get("currentlyBooked_label")),
				mithril_default(TextField, {
					label: "subscription_label",
					value: this._subscriptionFieldValue(),
					oninput: this._subscriptionFieldValue,
					isReadOnly: true,
					injectionsRight: () => locator.logins.getUserController().isFreeAccount() ? mithril_default(IconButton, {
						title: "upgrade_action",
						click: () => showProgressDialog("pleaseWait_msg", this.handleUpgradeSubscription()),
						icon: Icons.Edit,
						size: ButtonSize.Compact
					}) : !this._isCancelled ? mithril_default(IconButton, {
						title: "subscription_label",
						click: () => this.onSubscriptionClick(),
						icon: Icons.Edit,
						size: ButtonSize.Compact
					}) : null
				}),
				this.showOrderAgreement() ? this.renderAgreement() : null,
				this.showPriceData() ? this.renderIntervals() : null,
				this.showPriceData() && this._nextPeriodPriceVisible && this._periodEndDate ? mithril_default(TextField, {
					label: lang.getTranslation("priceFrom_label", { "{date}": formatDate(new Date(neverNull(this._periodEndDate).getTime() + DAY)) }),
					helpLabel: () => lang.get("nextSubscriptionPrice_msg"),
					value: this._nextPriceFieldValue(),
					oninput: this._nextPriceFieldValue,
					isReadOnly: true
				}) : null,
				mithril_default(".small.mt-s", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
				mithril_default(".small.mt-s", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
				mithril_default(SettingsExpander, {
					title: "giftCards_label",
					infoMsg: "giftCardSection_label",
					expanded: this._giftCardsExpanded
				}, renderGiftCardTable(Array.from(this._giftCards.values()), isPremiumPredicate)),
				LegacyPlans.includes(this.currentPlanType) ? [
					mithril_default(".h4.mt-l", lang.get("adminPremiumFeatures_action")),
					mithril_default(TextField, {
						label: "storageCapacity_label",
						value: this._storageFieldValue(),
						oninput: this._storageFieldValue,
						isReadOnly: true
					}),
					mithril_default(TextField, {
						label: "mailAddressAliases_label",
						value: this._emailAliasFieldValue(),
						oninput: this._emailAliasFieldValue,
						isReadOnly: true
					}),
					mithril_default(TextField, {
						label: "pricing.comparisonSharingCalendar_msg",
						value: this._sharingFieldValue(),
						oninput: this._sharingFieldValue,
						isReadOnly: true
					}),
					mithril_default(TextField, {
						label: "pricing.comparisonEventInvites_msg",
						value: this._eventInvitesFieldValue(),
						oninput: this._eventInvitesFieldValue,
						isReadOnly: true
					}),
					mithril_default(TextField, {
						label: "pricing.comparisonOutOfOffice_msg",
						value: this._autoResponderFieldValue(),
						oninput: this._autoResponderFieldValue,
						isReadOnly: true
					}),
					mithril_default(TextField, {
						label: "whitelabel.login_title",
						value: this._whitelabelFieldValue(),
						oninput: this._whitelabelFieldValue,
						isReadOnly: true
					}),
					mithril_default(TextField, {
						label: "whitelabel.custom_title",
						value: this._whitelabelFieldValue(),
						oninput: this._whitelabelFieldValue,
						isReadOnly: true
					})
				] : []
			]);
		};
		locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer)).then((customer) => {
			this.updateCustomerData(customer);
			return locator.logins.getUserController().loadCustomerInfo();
		}).then((customerInfo) => {
			this._customerInfo = customerInfo;
			return locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo);
		}).then((accountingInfo) => {
			this.updateAccountInfoData(accountingInfo);
			this.updatePriceInfo();
		});
		const loadingString = lang.get("loading_msg");
		this._currentPriceFieldValue = (0, import_stream$1.default)(loadingString);
		this._subscriptionFieldValue = (0, import_stream$1.default)(loadingString);
		this._orderAgreementFieldValue = (0, import_stream$1.default)(loadingString);
		this._nextPriceFieldValue = (0, import_stream$1.default)(loadingString);
		this._usersFieldValue = (0, import_stream$1.default)(loadingString);
		this._storageFieldValue = (0, import_stream$1.default)(loadingString);
		this._emailAliasFieldValue = (0, import_stream$1.default)(loadingString);
		this._groupsFieldValue = (0, import_stream$1.default)(loadingString);
		this._whitelabelFieldValue = (0, import_stream$1.default)(loadingString);
		this._sharingFieldValue = (0, import_stream$1.default)(loadingString);
		this._eventInvitesFieldValue = (0, import_stream$1.default)(loadingString);
		this._autoResponderFieldValue = (0, import_stream$1.default)(loadingString);
		this._selectedSubscriptionInterval = (0, import_stream$1.default)(null);
		this.updateBookings();
	}
	onSubscriptionClick() {
		const paymentMethod = this._accountingInfo ? getPaymentMethodType(this._accountingInfo) : null;
		if (isIOSApp() && (paymentMethod == null || paymentMethod == PaymentMethodType.AppStore)) this.handleAppStoreSubscriptionChange();
else if (paymentMethod == PaymentMethodType.AppStore && this._accountingInfo?.appStoreSubscription) return showManageThroughAppStoreDialog();
else if (this._accountingInfo && this._customer && this._customerInfo && this._lastBooking) showSwitchDialog(this._customer, this._customerInfo, this._accountingInfo, this._lastBooking, AvailablePlans, null);
	}
	async handleUpgradeSubscription() {
		if (isIOSApp()) {
			const appStoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null);
			if (appStoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) return Dialog.message(lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }));
		}
		return showUpgradeWizard(locator.logins);
	}
	async handleAppStoreSubscriptionChange() {
		if (!this.mobilePaymentsFacade) throw Error("Not allowed to change AppStore subscription from web client");
		let customer;
		let accountingInfo;
		if (this._customer && this._accountingInfo) {
			customer = this._customer;
			accountingInfo = this._accountingInfo;
		} else return;
		const appStoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(base64ToUint8Array(base64ExtToBase64(customer._id)));
		const isAppStorePayment = getPaymentMethodType(accountingInfo) === PaymentMethodType.AppStore;
		const userStatus = customer.approvalStatus;
		const hasAnActiveSubscription = isAppStorePayment && accountingInfo.appStoreSubscription != null;
		if (hasAnActiveSubscription && !await this.canManageAppStoreSubscriptionInApp(accountingInfo, appStoreSubscriptionOwnership)) return;
		if (appStoreSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NotOwner) return Dialog.message(lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }));
else if (isAppStorePayment && appStoreSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NoSubscription && userStatus === ApprovalStatus.REGISTRATION_APPROVED) return Dialog.message(lang.getTranslation("storeNoSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }));
else if (appStoreSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NoSubscription) {
			const isResubscribe = await Dialog.choice(lang.getTranslation("storeDowngradeOrResubscribe_msg", { "{AppStoreDowngrade}": InfoLink.AppStoreDowngrade }), [{
				text: "changePlan_action",
				value: false
			}, {
				text: "resubscribe_action",
				value: true
			}]);
			if (isResubscribe) {
				const planType = await locator.logins.getUserController().getPlanType();
				const customerId = locator.logins.getUserController().user.customer;
				const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId));
				try {
					await this.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(planType), asPaymentInterval(accountingInfo.paymentInterval), customerIdBytes);
				} catch (e) {
					if (e instanceof MobilePaymentError) {
						console.error("AppStore subscription failed", e);
						Dialog.message("appStoreSubscriptionError_msg", e.message);
					} else throw e;
				}
			} else if (this._customerInfo && this._lastBooking) return showSwitchDialog(customer, this._customerInfo, accountingInfo, this._lastBooking, AvailablePlans, null);
		} else if (this._customerInfo && this._lastBooking) return showSwitchDialog(customer, this._customerInfo, accountingInfo, this._lastBooking, AvailablePlans, null);
	}
	async canManageAppStoreSubscriptionInApp(accountingInfo, ownership) {
		if (ownership === MobilePaymentSubscriptionOwnership.NotOwner) return true;
		const appStoreSubscriptionData = await locator.serviceExecutor.get(AppStoreSubscriptionService, createAppStoreSubscriptionGetIn({ subscriptionId: elementIdPart(assertNotNull(accountingInfo.appStoreSubscription)) }));
		if (!appStoreSubscriptionData || appStoreSubscriptionData.app == null) throw new ProgrammingError("Failed to determine subscription origin");
		const isMailSubscription = appStoreSubscriptionData.app === SubscriptionApp.Mail;
		if (client.isCalendarApp() && isMailSubscription) return await this.handleAppOpen(SubscriptionApp.Mail);
else if (!client.isCalendarApp() && !isMailSubscription) return await this.handleAppOpen(SubscriptionApp.Calendar);
		return true;
	}
	async handleAppOpen(app) {
		const appName = app === SubscriptionApp.Calendar ? "Tuta Calendar" : "Tuta Mail";
		const dialogResult = await Dialog.confirm(lang.getTranslation("handleSubscriptionOnApp_msg", { "{1}": appName }), "yes_label");
		const query = stringToBase64(`settings=subscription`);
		if (!dialogResult) return false;
		if (app === SubscriptionApp.Calendar) locator.systemFacade.openCalendarApp(query);
else locator.systemFacade.openMailApp(query);
		return false;
	}
	openAppDialogCallback(open, app) {
		if (!open) return;
		const appName = app === AppType.Mail ? "Tuta Mail" : "Tuta Calendar";
	}
	showOrderAgreement() {
		return locator.logins.getUserController().isPremiumAccount() && (this._customer != null && this._customer.businessUse || this._customer != null && (this._customer.orderProcessingAgreement != null || this._customer.orderProcessingAgreementNeeded));
	}
	async updateCustomerData(customer) {
		this._customer = customer;
		if (customer.orderProcessingAgreement) this._orderAgreement = await locator.entityClient.load(OrderProcessingAgreementTypeRef, customer.orderProcessingAgreement);
else this._orderAgreement = null;
		if (customer.orderProcessingAgreementNeeded) this._orderAgreementFieldValue(lang.get("signingNeeded_msg"));
else if (this._orderAgreement) this._orderAgreementFieldValue(lang.get("signedOn_msg", { "{date}": formatDate(this._orderAgreement.signatureDate) }));
else this._orderAgreementFieldValue(lang.get("notSigned_msg"));
		mithril_default.redraw();
	}
	showPriceData() {
		const isAppStorePayment = this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.AppStore;
		return locator.logins.getUserController().isPremiumAccount() && !isIOSApp() && !isAppStorePayment;
	}
	async updatePriceInfo() {
		if (!this.showPriceData()) return;
		const priceServiceReturn = await locator.bookingFacade.getCurrentPrice();
		if (priceServiceReturn.currentPriceThisPeriod != null && priceServiceReturn.currentPriceNextPeriod != null) {
			if (priceServiceReturn.currentPriceThisPeriod.price !== priceServiceReturn.currentPriceNextPeriod.price) {
				this._currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod));
				this._nextPriceFieldValue(formatPriceDataWithInfo(neverNull(priceServiceReturn.currentPriceNextPeriod)));
				this._nextPeriodPriceVisible = true;
			} else {
				this._currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod));
				this._nextPeriodPriceVisible = false;
			}
			this._periodEndDate = priceServiceReturn.periodEndDate;
			mithril_default.redraw();
		}
	}
	updateAccountInfoData(accountingInfo) {
		this._accountingInfo = accountingInfo;
		this._selectedSubscriptionInterval(asPaymentInterval(accountingInfo.paymentInterval));
		mithril_default.redraw();
	}
	async updateSubscriptionField() {
		const userController = locator.logins.getUserController();
		const accountType = downcast(userController.user.accountType);
		const planType = await userController.getPlanType();
		this._subscriptionFieldValue(_getAccountTypeName(accountType, planType));
	}
	async updateBookings() {
		const userController = locator.logins.getUserController();
		const customer = await userController.loadCustomer();
		let customerInfo;
		try {
			customerInfo = await userController.loadCustomerInfo();
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could not update bookings as customer info does not exist (moved between free/premium lists)");
				return;
			} else throw e;
		}
		this._customerInfo = customerInfo;
		const bookings = await locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true);
		this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null;
		this._customer = customer;
		this.currentPlanType = await userController.getPlanType();
		const planConfig = await userController.getPlanConfig();
		await this.updateSubscriptionField();
		await Promise.all([
			this.updateUserField(),
			this.updateStorageField(customer, customerInfo),
			this.updateAliasField(),
			this.updateGroupsField(),
			this.updateWhitelabelField(planConfig),
			this.updateSharingField(planConfig),
			this.updateEventInvitesField(planConfig),
			this.updateAutoResponderField(planConfig)
		]);
		mithril_default.redraw();
	}
	async updateUserField() {
		this._usersFieldValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.LegacyUsers, this._lastBooking)));
	}
	async updateStorageField(customer, customerInfo) {
		const usedStorage = await locator.customerFacade.readUsedCustomerStorage(getEtId(customer));
		const usedStorageFormatted = formatStorageSize(Number(usedStorage));
		const totalStorageFormatted = formatStorageSize(getTotalStorageCapacityPerCustomer(customer, customerInfo, this._lastBooking) * Const.MEMORY_GB_FACTOR);
		this._storageFieldValue(lang.get("amountUsedOf_label", {
			"{amount}": usedStorageFormatted,
			"{totalAmount}": totalStorageFormatted
		}));
	}
	async updateAliasField() {
		const counters = await locator.mailAddressFacade.getAliasCounters(locator.logins.getUserController().user.userGroup.group);
		this._emailAliasFieldValue(lang.get("amountUsedAndActivatedOf_label", {
			"{used}": counters.usedAliases,
			"{active}": counters.enabledAliases,
			"{totalAmount}": counters.totalAliases
		}));
	}
	async updateGroupsField() {
		let localAdminCount = getCurrentCount(BookingItemFeatureType.LocalAdminGroup, this._lastBooking);
		const localAdminText = localAdminCount + " " + lang.get(localAdminCount === 1 ? "localAdminGroup_label" : "localAdminGroups_label");
		let sharedMailCount = getCurrentCount(BookingItemFeatureType.SharedMailGroup, this._lastBooking);
		const sharedMailText = sharedMailCount + " " + lang.get(sharedMailCount === 1 ? "sharedMailbox_label" : "sharedMailboxes_label");
		if (localAdminCount === 0) this._groupsFieldValue(sharedMailText);
else if (localAdminCount > 0 && sharedMailCount > 0) this._groupsFieldValue(sharedMailText + ", " + localAdminText);
else this._groupsFieldValue(localAdminText);
	}
	async updateWhitelabelField(planConfig) {
		if (isWhitelabelActive(this._lastBooking, planConfig)) this._whitelabelFieldValue(lang.get("active_label"));
else this._whitelabelFieldValue(lang.get("deactivated_label"));
	}
	async updateSharingField(planConfig) {
		if (isSharingActive(this._lastBooking, planConfig)) this._sharingFieldValue(lang.get("active_label"));
else this._sharingFieldValue(lang.get("deactivated_label"));
	}
	async updateEventInvitesField(planConfig) {
		if (!this._customer) this._eventInvitesFieldValue("");
else if (isEventInvitesActive(this._lastBooking, planConfig)) this._eventInvitesFieldValue(lang.get("active_label"));
else this._eventInvitesFieldValue(lang.get("deactivated_label"));
	}
	async updateAutoResponderField(planConfig) {
		if (!this._customer) this._autoResponderFieldValue("");
else if (isAutoResponderActive(this._lastBooking, planConfig)) this._autoResponderFieldValue(lang.get("active_label"));
else this._autoResponderFieldValue(lang.get("deactivated_label"));
	}
	async entityEventsReceived(updates) {
		await pMap(updates, (update) => this.processUpdate(update));
	}
	async processUpdate(update) {
		const { instanceListId, instanceId } = update;
		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, instanceId);
			this.updateAccountInfoData(accountingInfo);
			return await this.updatePriceInfo();
		} else if (isUpdateForTypeRef(UserTypeRef, update)) {
			await this.updateBookings();
			return await this.updatePriceInfo();
		} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
			await this.updateBookings();
			return await this.updatePriceInfo();
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			const customer = await locator.entityClient.load(CustomerTypeRef, instanceId);
			return await this.updateCustomerData(customer);
		} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
			await this.updateBookings();
			return await this.updatePriceInfo();
		} else if (isUpdateForTypeRef(GiftCardTypeRef, update)) {
			const giftCard = await locator.entityClient.load(GiftCardTypeRef, [instanceListId, instanceId]);
			this._giftCards.set(elementIdPart(giftCard._id), giftCard);
			if (update.operation === OperationType.CREATE) this._giftCardsExpanded(true);
		}
	}
	renderIntervals() {
		const isAppStorePayment = this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.AppStore;
		if (isIOSApp() || isAppStorePayment) return;
		const subscriptionPeriods = [
			{
				name: lang.get("pricing.yearly_label"),
				value: PaymentInterval.Yearly
			},
			{
				name: lang.get("pricing.monthly_label"),
				value: PaymentInterval.Monthly
			},
			{
				name: lang.get("loading_msg"),
				value: null,
				selectable: false
			}
		];
		const bonusMonths = this._lastBooking ? Number(this._lastBooking.bonusMonth) : 0;
		return [
			mithril_default(DropDownSelector, {
				label: "paymentInterval_label",
				helpLabel: () => this.getChargeDateText(),
				items: subscriptionPeriods,
				selectedValue: this._selectedSubscriptionInterval(),
				dropdownWidth: 300,
				selectionChangedHandler: (value) => {
					if (this._accountingInfo) showChangeSubscriptionIntervalDialog(this._accountingInfo, value, this._periodEndDate);
				}
			}),
			bonusMonths === 0 ? null : mithril_default(TextField, {
				label: "bonus_label",
				value: lang.get("bonusMonth_msg", { "{months}": bonusMonths }),
				isReadOnly: true
			}),
			mithril_default(TextField, {
				label: this._nextPeriodPriceVisible && this._periodEndDate ? lang.getTranslation("priceTill_label", { "{date}": formatDate(this._periodEndDate) }) : "price_label",
				value: this._currentPriceFieldValue(),
				oninput: this._currentPriceFieldValue,
				isReadOnly: true,
				helpLabel: () => this._customer && this._customer.businessUse === true ? lang.get("pricing.subscriptionPeriodInfoBusiness_msg") : null
			})
		];
	}
	renderAgreement() {
		return mithril_default(TextField, {
			label: "orderProcessingAgreement_label",
			helpLabel: () => lang.get("orderProcessingAgreementInfo_msg"),
			value: this._orderAgreementFieldValue(),
			oninput: this._orderAgreementFieldValue,
			isReadOnly: true,
			injectionsRight: () => {
				if (this._orderAgreement && this._customer && this._customer.orderProcessingAgreementNeeded) return [this.renderSignProcessingAgreementAction(), this.renderShowProcessingAgreementAction()];
else if (this._orderAgreement) return [this.renderShowProcessingAgreementAction()];
else if (this._customer && this._customer.orderProcessingAgreementNeeded) return [this.renderSignProcessingAgreementAction()];
else return [];
			}
		});
	}
	renderShowProcessingAgreementAction() {
		return mithril_default(IconButton, {
			title: "show_action",
			click: () => locator.entityClient.load(GroupInfoTypeRef, neverNull(this._orderAgreement).signerUserGroupInfo).then((signerUserGroupInfo) => showForViewing(neverNull(this._orderAgreement), signerUserGroupInfo)),
			icon: Icons.Download,
			size: ButtonSize.Compact
		});
	}
	renderSignProcessingAgreementAction() {
		return mithril_default(IconButton, {
			title: "sign_action",
			click: () => showForSigning(neverNull(this._customer), neverNull(this._accountingInfo)),
			icon: Icons.Edit,
			size: ButtonSize.Compact
		});
	}
	getChargeDateText() {
		if (this._periodEndDate) {
			const chargeDate = formatDate(incrementDate(new Date(this._periodEndDate), 1));
			return lang.get("nextChargeOn_label", { "{chargeDate}": chargeDate });
		} else return "";
	}
};
function _getAccountTypeName(type, subscription) {
	if (type === AccountType.PAID) return getDisplayNameOfPlanType(subscription);
else return AccountTypeNames[type];
}
function showChangeSubscriptionIntervalDialog(accountingInfo, paymentInterval, periodEndDate) {
	if (accountingInfo && accountingInfo.invoiceCountry && asPaymentInterval(accountingInfo.paymentInterval) !== paymentInterval) {
		const confirmationMessage = periodEndDate ? lang.getTranslation("subscriptionChangePeriod_msg", { "{1}": formatDate(periodEndDate) }) : "subscriptionChange_msg";
		Dialog.confirm(confirmationMessage).then(async (confirmed) => {
			if (confirmed) await locator.customerFacade.changePaymentInterval(accountingInfo, paymentInterval);
		});
	}
}
function renderGiftCardTable(giftCards, isPremiumPredicate) {
	const addButtonAttrs = {
		title: "buyGiftCard_label",
		click: createNotAvailableForFreeClickHandler(NewPaidPlans, () => showPurchaseGiftCardDialog(), isPremiumPredicate),
		icon: Icons.Add,
		size: ButtonSize.Compact
	};
	const columnHeading = ["purchaseDate_label", "value_label"];
	const columnWidths = [
		ColumnWidth.Largest,
		ColumnWidth.Small,
		ColumnWidth.Small
	];
	const lines = giftCards.filter((giftCard) => giftCard.status === GiftCardStatus.Usable).map((giftCard) => {
		return {
			cells: [formatDate(giftCard.orderDate), formatPrice(parseFloat(giftCard.value), true)],
			actionButtonAttrs: attachDropdown({
				mainButtonAttrs: {
					title: "options_action",
					icon: Icons.More,
					size: ButtonSize.Compact
				},
				childAttrs: () => [{
					label: "view_label",
					click: () => showGiftCardToShare(giftCard)
				}, {
					label: "edit_action",
					click: () => {
						let message = (0, import_stream$1.default)(giftCard.message);
						Dialog.showActionDialog({
							title: "editMessage_label",
							child: () => mithril_default(".flex-center", mithril_default(GiftCardMessageEditorField, {
								message: message(),
								onMessageChanged: message
							})),
							okAction: (dialog) => {
								giftCard.message = message();
								locator.entityClient.update(giftCard).then(() => dialog.close()).catch(() => Dialog.message("giftCardUpdateError_msg"));
								showGiftCardToShare(giftCard);
							},
							okActionTextId: "save_action",
							type: DialogType.EditSmall
						});
					}
				}]
			})
		};
	});
	return [mithril_default(Table, {
		addButtonAttrs,
		columnHeading,
		columnWidths,
		lines,
		showActionButtonColumn: true
	}), mithril_default(".small", renderTermsAndConditionsButton(TermsSection.GiftCards, CURRENT_GIFT_CARD_TERMS_VERSION))];
}

//#endregion
//#region src/common/subscription/SwitchSubscriptionDialog.ts
var import_stream = __toESM(require_stream(), 1);
async function showSwitchDialog(customer, customerInfo, accountingInfo, lastBooking, acceptedPlans, reason) {
	if (hasRunningAppStoreSubscription(accountingInfo) && !isIOSApp()) {
		await showManageThroughAppStoreDialog();
		return;
	}
	const [featureListProvider, priceAndConfigProvider] = await showProgressDialog("pleaseWait_msg", Promise.all([FeatureListProvider.getInitializedInstance(locator.domainConfigProvider().getCurrentDomainConfig()), PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)]));
	const model = new SwitchSubscriptionDialogModel(customer, accountingInfo, await locator.logins.getUserController().getPlanType(), lastBooking);
	const cancelAction = () => {
		dialog.close();
	};
	const headerBarAttrs = {
		left: [{
			label: "cancel_action",
			click: cancelAction,
			type: ButtonType.Secondary
		}],
		right: [],
		middle: "subscription_label"
	};
	const currentPlanInfo = model.currentPlanInfo;
	const businessUse = (0, import_stream.default)(currentPlanInfo.businessUse);
	const paymentInterval = (0, import_stream.default)(PaymentInterval.Yearly);
	const multipleUsersAllowed = model.multipleUsersStillSupportedLegacy();
	const dialog = Dialog.largeDialog(headerBarAttrs, { view: () => mithril_default(".pt", mithril_default(SubscriptionSelector, {
		options: {
			businessUse,
			paymentInterval
		},
		priceInfoTextId: priceAndConfigProvider.getPriceInfoMessage(),
		msg: reason,
		boxWidth: 230,
		boxHeight: 270,
		acceptedPlans,
		currentPlanType: currentPlanInfo.planType,
		allowSwitchingPaymentInterval: currentPlanInfo.paymentInterval !== PaymentInterval.Yearly,
		actionButtons: subscriptionActionButtons,
		featureListProvider,
		priceAndConfigProvider,
		multipleUsersAllowed
	})) }).addShortcut({
		key: Keys.ESC,
		exec: cancelAction,
		help: "close_alt"
	}).setCloseHandler(cancelAction);
	const subscriptionActionButtons = {
		[PlanType.Free]: () => ({
			label: "pricing.select_action",
			onclick: () => onSwitchToFree(customer, dialog, currentPlanInfo)
		}),
		[PlanType.Revolutionary]: createPlanButton(dialog, PlanType.Revolutionary, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Legend]: createPlanButton(dialog, PlanType.Legend, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Essential]: createPlanButton(dialog, PlanType.Essential, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Advanced]: createPlanButton(dialog, PlanType.Advanced, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Unlimited]: createPlanButton(dialog, PlanType.Unlimited, currentPlanInfo, paymentInterval, accountingInfo)
	};
	dialog.show();
	return;
}
async function onSwitchToFree(customer, dialog, currentPlanInfo) {
	if (isIOSApp()) {
		const ownership = await locator.mobilePaymentsFacade.queryAppStoreSubscriptionOwnership(base64ToUint8Array(base64ExtToBase64(customer._id)));
		if (ownership === MobilePaymentSubscriptionOwnership.Owner && await locator.mobilePaymentsFacade.isAppStoreRenewalEnabled()) {
			await locator.mobilePaymentsFacade.showSubscriptionConfigView();
			await showProgressDialog("pleaseWait_msg", waitUntilRenewalDisabled());
			if (await locator.mobilePaymentsFacade.isAppStoreRenewalEnabled()) {
				console.log("AppStore renewal is still enabled, canceling downgrade");
				return;
			}
		}
	}
	const reason = await showLeavingUserSurveyWizard(true, true);
	const data = reason.submitted && reason.category && reason.reason ? createSurveyData({
		category: reason.category,
		reason: reason.reason,
		details: reason.details,
		version: SURVEY_VERSION_NUMBER
	}) : null;
	const newPlanType = await cancelSubscription(dialog, currentPlanInfo, customer, data);
	if (newPlanType === PlanType.Free) for (const importedMailSet of mailLocator.mailModel.getImportedMailSets()) mailLocator.mailModel.finallyDeleteCustomMailFolder(importedMailSet);
}
async function waitUntilRenewalDisabled() {
	for (let i = 0; i < 3; i++) {
		await delay(2e3);
		if (!await locator.mobilePaymentsFacade.isAppStoreRenewalEnabled()) return;
	}
}
async function doSwitchToPaidPlan(accountingInfo, newPaymentInterval, targetSubscription, dialog, currentPlanInfo) {
	if (isIOSApp() && getPaymentMethodType(accountingInfo) === PaymentMethodType.AppStore) {
		const customerIdBytes = base64ToUint8Array(base64ExtToBase64(assertNotNull(locator.logins.getUserController().user.customer)));
		dialog.close();
		try {
			await locator.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(targetSubscription), newPaymentInterval, customerIdBytes);
		} catch (e) {
			if (e instanceof MobilePaymentError) {
				console.error("AppStore subscription failed", e);
				Dialog.message("appStoreSubscriptionError_msg", e.message);
			} else throw e;
		}
	} else {
		if (currentPlanInfo.paymentInterval !== newPaymentInterval) await locator.customerFacade.changePaymentInterval(accountingInfo, newPaymentInterval);
		await switchSubscription(targetSubscription, dialog, currentPlanInfo);
	}
}
function createPlanButton(dialog, targetSubscription, currentPlanInfo, newPaymentInterval, accountingInfo) {
	return () => ({
		label: "buy_action",
		onclick: async () => {
			if (LegacyPlans.includes(currentPlanInfo.planType) && !await Dialog.confirm(lang.getTranslation("upgradePlan_msg", { "{plan}": PlanTypeToName[targetSubscription] }))) return;
			await showProgressDialog("pleaseWait_msg", doSwitchToPaidPlan(accountingInfo, newPaymentInterval(), targetSubscription, dialog, currentPlanInfo));
		}
	});
}
function handleSwitchAccountPreconditionFailed(e) {
	const reason = e.data;
	if (reason == null) return Dialog.message("unknownError_msg");
else {
		let detailMsg;
		switch (reason) {
			case UnsubscribeFailureReason.TOO_MANY_ENABLED_USERS:
				detailMsg = lang.get("accountSwitchTooManyActiveUsers_msg");
				break;
			case UnsubscribeFailureReason.CUSTOM_MAIL_ADDRESS:
				detailMsg = lang.get("accountSwitchCustomMailAddress_msg");
				break;
			case UnsubscribeFailureReason.TOO_MANY_CALENDARS:
				detailMsg = lang.get("accountSwitchMultipleCalendars_msg");
				break;
			case UnsubscribeFailureReason.CALENDAR_TYPE:
				detailMsg = lang.get("accountSwitchSharedCalendar_msg");
				break;
			case UnsubscribeFailureReason.TOO_MANY_ALIASES:
			case BookingFailureReason.TOO_MANY_ALIASES:
				detailMsg = lang.get("accountSwitchAliases_msg");
				break;
			case UnsubscribeFailureReason.TOO_MUCH_STORAGE_USED:
			case BookingFailureReason.TOO_MUCH_STORAGE_USED:
				detailMsg = lang.get("storageCapacityTooManyUsedForBooking_msg");
				break;
			case UnsubscribeFailureReason.TOO_MANY_DOMAINS:
			case BookingFailureReason.TOO_MANY_DOMAINS:
				detailMsg = lang.get("tooManyCustomDomains_msg");
				break;
			case UnsubscribeFailureReason.HAS_TEMPLATE_GROUP:
			case BookingFailureReason.HAS_TEMPLATE_GROUP:
				detailMsg = lang.get("deleteTemplateGroups_msg");
				break;
			case UnsubscribeFailureReason.WHITELABEL_DOMAIN_ACTIVE:
			case BookingFailureReason.WHITELABEL_DOMAIN_ACTIVE:
				detailMsg = lang.get("whitelabelDomainExisting_msg");
				break;
			case UnsubscribeFailureReason.HAS_CONTACT_LIST_GROUP:
				detailMsg = lang.get("contactListExisting_msg");
				break;
			case UnsubscribeFailureReason.NOT_ENOUGH_CREDIT: return Dialog.message("insufficientBalanceError_msg");
			case UnsubscribeFailureReason.INVOICE_NOT_PAID: return Dialog.message("invoiceNotPaidSwitch_msg");
			case UnsubscribeFailureReason.ACTIVE_APPSTORE_SUBSCRIPTION: if (isIOSApp()) return locator.mobilePaymentsFacade.showSubscriptionConfigView();
else return showManageThroughAppStoreDialog();
			case UnsubscribeFailureReason.LABEL_LIMIT_EXCEEDED: return Dialog.message("labelLimitExceeded_msg");
			default: throw e;
		}
		return Dialog.message(lang.getTranslation("accountSwitchNotPossible_msg", { "{detailMsg}": detailMsg }));
	}
}
/**
* @param customer
* @param currentPlanInfo
* @param surveyData
* @returns the new plan type after the attempt.
*/
async function tryDowngradePremiumToFree(customer, currentPlanInfo, surveyData) {
	const switchAccountTypeData = createSwitchAccountTypePostIn({
		accountType: AccountType.FREE,
		date: Const.CURRENT_DATE,
		customer: customer._id,
		specialPriceUserSingle: null,
		referralCode: null,
		plan: PlanType.Free,
		surveyData,
		app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail
	});
	try {
		await locator.serviceExecutor.post(SwitchAccountTypeService, switchAccountTypeData);
		await locator.customerFacade.switchPremiumToFreeGroup();
		return PlanType.Free;
	} catch (e) {
		if (e instanceof PreconditionFailedError) await handleSwitchAccountPreconditionFailed(e);
else if (e instanceof InvalidDataError) await Dialog.message("accountSwitchTooManyActiveUsers_msg");
else if (e instanceof BadRequestError) await Dialog.message("deactivatePremiumWithCustomDomainError_msg");
else throw e;
		return currentPlanInfo.planType;
	}
}
async function cancelSubscription(dialog, currentPlanInfo, customer, surveyData = null) {
	const confirmCancelSubscription = Dialog.confirm("unsubscribeConfirm_msg", "ok_action", () => {
		return mithril_default(".pt", mithril_default("ul.usage-test-opt-in-bullets", [
			mithril_default("li", lang.get("importedMailsWillBeDeleted_label")),
			mithril_default("li", lang.get("accountWillBeDeactivatedIn6Month_label")),
			mithril_default("li", lang.get("accountWillHaveLessStorage_label"))
		]));
	});
	if (!await confirmCancelSubscription) return currentPlanInfo.planType;
	try {
		return await showProgressDialog("pleaseWait_msg", tryDowngradePremiumToFree(customer, currentPlanInfo, surveyData));
	} finally {
		dialog.close();
	}
}
async function switchSubscription(targetSubscription, dialog, currentPlanInfo) {
	if (targetSubscription === currentPlanInfo.planType) return currentPlanInfo.planType;
	const userController = locator.logins.getUserController();
	const customer = await userController.loadCustomer();
	if (!customer.businessUse && NewBusinessPlans.includes(downcast(targetSubscription))) {
		const accountingInfo = await userController.loadAccountingInfo();
		const invoiceData = {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo
		};
		const updatedInvoiceData = await showSwitchToBusinessInvoiceDataDialog(customer, invoiceData, accountingInfo);
		if (!updatedInvoiceData) return currentPlanInfo.planType;
	}
	try {
		const postIn = createSwitchAccountTypePostIn({
			accountType: AccountType.PAID,
			plan: targetSubscription,
			date: Const.CURRENT_DATE,
			referralCode: null,
			customer: customer._id,
			specialPriceUserSingle: null,
			surveyData: null,
			app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail
		});
		try {
			await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SwitchAccountTypeService, postIn));
			return targetSubscription;
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				await handleSwitchAccountPreconditionFailed(e);
				return currentPlanInfo.planType;
			}
			throw e;
		}
	} finally {
		dialog.close();
	}
}

//#endregion
export { PaymentViewer, SelectMailAddressForm, SettingsExpander, SignupForm, SubscriptionViewer, loadSignupWizard, showSwitchDialog, showUpgradeWizard };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3dpdGNoU3Vic2NyaXB0aW9uRGlhbG9nLWNodW5rLmpzIiwibmFtZXMiOlsiQnVzaW5lc3NVc2VJdGVtczogU2VnbWVudENvbnRyb2xJdGVtPGJvb2xlYW4+W10iLCJhY3Rpb25CdXR0b25zOiBTdWJzY3JpcHRpb25BY3Rpb25CdXR0b25zIiwic3Vic2NyaXB0aW9uOiBBdmFpbGFibGVQbGFuVHlwZSIsInZub2RlOiBWbm9kZTxTdWJzY3JpcHRpb25TZWxlY3RvckF0dHI+IiwibXNnOiBNYXliZVRyYW5zbGF0aW9uIHwgbnVsbCIsImN1cnJlbnRQbGFuVHlwZTogUGxhblR5cGUgfCBudWxsIiwicHJpY2VJbmZvVGV4dElkOiBUcmFuc2xhdGlvbktleSB8IG51bGwiLCJpc0J1c2luZXNzOiBib29sZWFuIiwiaXNDeWJlck1vbmRheTogYm9vbGVhbiIsInRleHQ6IHN0cmluZyIsInN0eWxlPzogUmVjb3JkPHN0cmluZywgYW55PiIsImluTW9iaWxlVmlldzogYm9vbGVhbiIsImFkZGl0aW9uYWxJbmZvOiBDaGlsZHJlbiIsInBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdIiwic2lnbnVwIiwidm5vZGUiLCJhdHRyczogU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyIiwicGxhblR5cGU6IEF2YWlsYWJsZVBsYW5UeXBlIiwicmVuZGVyQ2F0ZWdvcnlUaXRsZTogYm9vbGVhbiIsImZlYXR1cmVFeHBhbmRlcjogUmVjb3JkPEV4cGFuZGVyVGFyZ2V0cywgQ2hpbGRyZW4+Iiwic2VsZWN0b3JBdHRyczogU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyIiwidGFyZ2V0U3Vic2NyaXB0aW9uOiBBdmFpbGFibGVQbGFuVHlwZSIsIm1vYmlsZTogYm9vbGVhbiIsInByaWNlU3RyOiBzdHJpbmciLCJyZWZlcmVuY2VQcmljZVN0cjogc3RyaW5nIHwgdW5kZWZpbmVkIiwiaW5Nb2JpbGVWaWV3OiBib29sZWFuIHwgbnVsbCIsImZlYXR1cmVMaXN0UHJvdmlkZXI6IEZlYXR1cmVMaXN0UHJvdmlkZXIiLCJzdWJUeXBlOiBFeHBhbmRlclRhcmdldHMiLCJpdGVtOiBGZWF0dXJlTGlzdEl0ZW0iLCJ0YXJnZXRTdWJzY3JpcHRpb246IFBsYW5UeXBlIiwiY2F0ZWdvcnk6IEZlYXR1cmVDYXRlZ29yeSIsImtleTogVHJhbnNsYXRpb25LZXkiLCJyZXBsYWNlbWVudHM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXI+Iiwia2V5OiBSZXBsYWNlbWVudEtleSB8IHVuZGVmaW5lZCIsInN1YnNjcmlwdGlvbjogUGxhblR5cGUiLCJwbGFuVHlwZTogUGxhblR5cGUiLCJidXNpbmVzc1VzZTogYm9vbGVhbiIsInN1YnNjcmlwdGlvblByaWNlOiBudW1iZXIiLCJwYXltZW50SW50ZXJ2YWw6IFBheW1lbnRJbnRlcnZhbCIsIm11bHRpdXNlcjogYm9vbGVhbiIsImN1c3RvbWVyOiBDdXN0b21lciIsImFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyIsInBsYW5UeXBlOiBQbGFuVHlwZSIsImxhc3RCb29raW5nOiBCb29raW5nIiwicGF5bWVudEludGVydmFsOiBQYXltZW50SW50ZXJ2YWwiLCJidXNpbmVzc1VzZTogYm9vbGVhbiIsImludm9pY2VEYXRhOiBJbnZvaWNlRGF0YSIsImxvY2F0aW9uOiBMb2NhdGlvblNlcnZpY2VHZXRSZXR1cm4iLCJkb21JbnB1dDogSFRNTElucHV0RWxlbWVudCIsInZub2RlOiBWbm9kZTxTaW1wbGlmaWVkQ3JlZGl0Q2FyZEF0dHJzPiIsIm1vZGVsOiBTaW1wbGlmaWVkQ3JlZGl0Q2FyZFZpZXdNb2RlbCIsImNjOiBzdHJpbmciLCJDYXJkUHJlZml4UmFuZ2VzOiBSZWNvcmQ8Q2FyZFR5cGUsIE51bWJlclN0cmluZ1tdW10+Iiwiczogc3RyaW5nIiwiZm46IFN0cmluZ0lucHV0Q29ycmVjdGVyIiwidjogc3RyaW5nIiwib3Y6IHN0cmluZyIsInJlc3Q6IHN0cmluZyIsInJldDogc3RyaW5nIiwibGVuZ3RoOiBudW1iZXIiLCJ2YWx1ZTogc3RyaW5nIiwib2xkRGF0ZTogc3RyaW5nIiwiZ3JvdXBzOiBudW1iZXJbXSIsImV4cGlyYXRpb25EYXRlOiBzdHJpbmciLCJsYW5nOiBMYW5ndWFnZVZpZXdNb2RlbCIsIm51bWJlcjogc3RyaW5nIiwiY3Z2OiBzdHJpbmciLCJkYXRhOiBDcmVkaXRDYXJkIHwgbnVsbCIsInN1YnNjcmlwdGlvbk9wdGlvbnM6IFNlbGVjdGVkU3Vic2NyaXB0aW9uT3B0aW9ucyIsInNlbGVjdGVkQ291bnRyeTogU3RyZWFtPENvdW50cnkgfCBudWxsPiIsImFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyIsInBheVBhbFJlcXVlc3RVcmw6IExhenlMb2FkZWQ8c3RyaW5nPiIsImRlZmF1bHRQYXltZW50TWV0aG9kOiBQYXltZW50TWV0aG9kVHlwZSIsImFjY291bnRpbmdJbmZvIiwidmFsdWU6IFBheW1lbnRNZXRob2RUeXBlIiwicGF5bWVudERhdGE/OiBQYXltZW50RGF0YSIsInZub2RlOiBWbm9kZTxQYXlwYWxBdHRycz4iLCJ2bm9kZTogVm5vZGU8V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4iLCJ2bm9kZTogVm5vZGVET008V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4iLCJsb2dpbjogUHJvbWlzZTxDcmVkZW50aWFscyB8IG51bGw+IiwiZGVmYXVsdFBheW1lbnRNZXRob2Q6IFBheW1lbnRNZXRob2RUeXBlIiwidXBncmFkZURhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhIiwic2hvd0Vycm9yRGlhbG9nOiBib29sZWFuIiwiZW5hYmxlZDogKCkgPT4gYm9vbGVhbiIsInBheW1lbnRJbnRlcnZhbDogUGF5bWVudEludGVydmFsIiwiaW52b2ljZURhdGE6IEludm9pY2VEYXRhIiwicGF5bWVudERhdGE6IFBheW1lbnREYXRhIHwgbnVsbCIsImNvbmZpcm1lZENvdW50cnk6IENvdW50cnkgfCBudWxsIiwiaXNTaWdudXA6IGJvb2xlYW4iLCJwcmljZTogc3RyaW5nIHwgbnVsbCIsImFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyIsImJyYWludHJlZTNkczogQnJhaW50cmVlM2RzMlJlcXVlc3QiLCJwcmljZTogc3RyaW5nIiwicmVzb2x2ZTogKGFyZzA6IGJvb2xlYW4pID0+IHZvaWQiLCJwcm9ncmVzc0RpYWxvZ1Byb21pc2U6IFByb21pc2U8Ym9vbGVhbj4iLCJwcm9ncmVzc0RpYWxvZzogRGlhbG9nIiwiZW50aXR5RXZlbnRMaXN0ZW5lcjogRW50aXR5RXZlbnRzTGlzdGVuZXIiLCJ1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+IiwiZXZlbnRPd25lckdyb3VwSWQ6IElkIiwiaW52b2ljZUluZm8iLCJjdXN0b21lcjogQ3VzdG9tZXIiLCJpbnZvaWNlRGF0YTogSW52b2ljZURhdGEiLCJhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8iLCJzaG93IiwiYnVzaW5lc3NVc2U6IGJvb2xlYW4iLCJpbnZvaWNlRGF0YTogSW52b2ljZURhdGEiLCJhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8iLCJoZWFkaW5nSWQ/OiBUcmFuc2xhdGlvbktleSIsImluZm9NZXNzYWdlSWQ/OiBUcmFuc2xhdGlvbktleSIsImN1c3RvbWVyOiBDdXN0b21lciIsImFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyIsInByaWNlOiBudW1iZXIiLCJkZWZhdWx0UGF5bWVudE1ldGhvZDogUGF5bWVudE1ldGhvZFR5cGUiLCJ2YWx1ZTogUGF5bWVudE1ldGhvZFR5cGUiLCJzdWNjZXNzOiBib29sZWFuIiwiQ3VzdG9tZXJBY2NvdW50UG9zdGluZ1R5cGVSZWY6IFR5cGVSZWY8Q3VzdG9tZXJBY2NvdW50UG9zdGluZz4iLCJDdXN0b21lckFjY291bnRSZXR1cm5UeXBlUmVmOiBUeXBlUmVmPEN1c3RvbWVyQWNjb3VudFJldHVybj4iLCJlOiBNb3VzZUV2ZW50IiwiZG9tOiBIVE1MRWxlbWVudCIsImN1cnJlbnRQYXltZW50TWV0aG9kOiBQYXltZW50TWV0aG9kVHlwZSB8IG51bGwiLCJwb3N0aW5nOiBDdXN0b21lckFjY291bnRQb3N0aW5nIiwiYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsInVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSIsIm9wZW5CYWxhbmNlOiBudW1iZXIiLCJlcnJvcklkOiBUcmFuc2xhdGlvbktleVR5cGUgfCB2b2lkIiwicHJpY2U6IG51bWJlciIsImRpYWxvZzogRGlhbG9nIiwicmVzOiBib29sZWFuIiwiYWN0aW9uQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzIiwidm5vZGU6IFZub2RlRE9NPFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4+IiwicGF5bWVudEludGVydmFsOiBQYXltZW50SW50ZXJ2YWwiLCJ2bm9kZTogVm5vZGU8V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4iLCJzdWJzY3JpcHRpb25BY3Rpb25CdXR0b25zOiBTdWJzY3JpcHRpb25BY3Rpb25CdXR0b25zIiwiZGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEiLCJzdWJzY3JpcHRpb25QYXJhbWV0ZXJzOiBTdWJzY3JpcHRpb25QYXJhbWV0ZXJzIiwic3Vic2NyaXB0aW9uVHlwZTogU3Vic2NyaXB0aW9uVHlwZSB8IG51bGwiLCJwbGFuVHlwZTogUGxhblR5cGUiLCJkaWFsb2c6IERpYWxvZyIsImNvbmZpcm1lZDogYm9vbGVhbiIsInVwZ3JhZGVEYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSIsInNob3dFcnJvckRpYWxvZzogYm9vbGVhbiIsInZub2RlOiBWbm9kZURPTTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+PiIsImRhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhIiwiZG9tOiBIVE1MRWxlbWVudCIsInVwZ3JhZGVEYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSIsInNob3dEaWFsb2dzOiBib29sZWFuIiwidm5vZGU6IFZub2RlPFNlbGVjdE1haWxBZGRyZXNzRm9ybUF0dHJzPiIsImF0dHJzOiBTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycyIsImRvbWFpbkRhdGE6IEVtYWlsRG9tYWluRGF0YSIsImlzQnVzeTogYm9vbGVhbiIsIm9uQnVzeVN0YXRlQ2hhbmdlZDogKGFyZzA6IGJvb2xlYW4pID0+IHVua25vd24iLCJlbWFpbDogc3RyaW5nIiwidmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCIsIm9uVmFsaWRhdGlvblJlc3VsdDogU2VsZWN0TWFpbEFkZHJlc3NGb3JtQXR0cnNbXCJvblZhbGlkYXRpb25SZXN1bHRcIl0iLCJyZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQiLCJjYXB0Y2hhSW5wdXQ6IHN0cmluZyIsIm1haWxBZGRyZXNzOiBzdHJpbmciLCJpc0J1c2luZXNzVXNlOiBib29sZWFuIiwiaXNQYWlkU3Vic2NyaXB0aW9uOiBib29sZWFuIiwiY2FtcGFpZ25Ub2tlbjogc3RyaW5nIHwgbnVsbCIsImNoYWxsZW5nZTogVWludDhBcnJheSIsInRva2VuOiBzdHJpbmciLCJkaWFsb2c6IERpYWxvZyIsImFjdGlvbkJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyIsInZub2RlOiBWbm9kZTxTaWdudXBGb3JtQXR0cnM+IiwibWFpbEFkZHJlc3NGb3JtQXR0cnM6IFNlbGVjdE1haWxBZGRyZXNzRm9ybUF0dHJzIiwiY29uZmlybVRlcm1zQ2hlY2tCb3hBdHRyczogQ2hlY2tib3hBdHRycyIsImNvbmZpcm1BZ2VDaGVja0JveEF0dHJzOiBDaGVja2JveEF0dHJzIiwibWFpbEFkZHJlc3M6IHN0cmluZyIsInB3OiBzdHJpbmciLCJyZWdpc3RyYXRpb25Db2RlOiBzdHJpbmciLCJpc0J1c2luZXNzVXNlOiBib29sZWFuIiwiaXNQYWlkU3Vic2NyaXB0aW9uOiBib29sZWFuIiwiY2FtcGFpZ246IHN0cmluZyB8IG51bGwiLCJ2bm9kZTogVm5vZGVET008V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4iLCJ2bm9kZTogVm5vZGU8V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4iLCJtYWlsQWRkcmVzczogdW5kZWZpbmVkIHwgc3RyaW5nIiwibmV3QWNjb3VudERhdGEiLCJzaWdudXBEYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSIsInNob3dFcnJvckRpYWxvZzogYm9vbGVhbiIsInZub2RlOiBWbm9kZURPTTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+PiIsImRhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhIiwiYXR0cnM6IFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4iLCJkb206IEhUTUxFbGVtZW50IiwicHJpY2U6IHN0cmluZyIsIm9wdGlvbnM6IFNlbGVjdGVkU3Vic2NyaXB0aW9uT3B0aW9ucyIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwiYWNjZXB0ZWRQbGFuczogQXZhaWxhYmxlUGxhblR5cGVbXSIsIm1zZz86IE1heWJlVHJhbnNsYXRpb24iLCJ1cGdyYWRlRGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEiLCJzdWJzY3JpcHRpb25QYXJhbWV0ZXJzOiBTdWJzY3JpcHRpb25QYXJhbWV0ZXJzIHwgbnVsbCIsInJlZ2lzdHJhdGlvbkRhdGFJZDogc3RyaW5nIHwgbnVsbCIsInJlZmVycmFsQ29kZTogc3RyaW5nIHwgbnVsbCIsIm1lc3NhZ2U6IE1heWJlVHJhbnNsYXRpb24gfCBudWxsIiwic2lnbnVwRGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEiLCJjdXN0b21lcjogQ3VzdG9tZXIiLCJhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8iLCJkaWFsb2c6IERpYWxvZyIsImVsZW06IEhUTUxFbGVtZW50IHwgbnVsbCIsImFncmVlbWVudDogT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50Iiwic2lnbmVyVXNlckdyb3VwSW5mbzogR3JvdXBJbmZvIiwidm5vZGU6IFZub2RlPFNldHRpbmdzRXhwYW5kZXJBdHRycz4iLCJjdXJyZW50UGxhblR5cGU6IFBsYW5UeXBlIiwibW9iaWxlUGF5bWVudHNGYWNhZGU6IE1vYmlsZVBheW1lbnRzRmFjYWRlIHwgbnVsbCIsImFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyIsIm93bmVyc2hpcDogTW9iaWxlUGF5bWVudFN1YnNjcmlwdGlvbk93bmVyc2hpcCIsImFwcDogU3Vic2NyaXB0aW9uQXBwIiwib3BlbjogYm9vbGVhbiIsImFwcDogQXBwVHlwZS5NYWlsIHwgQXBwVHlwZS5DYWxlbmRhciIsImN1c3RvbWVyOiBDdXN0b21lciIsImFjY291bnRUeXBlOiBBY2NvdW50VHlwZSIsImN1c3RvbWVySW5mbzogQ3VzdG9tZXJJbmZvIiwicGxhbkNvbmZpZzogUGxhbkNvbmZpZ3VyYXRpb24iLCJ1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+IiwidXBkYXRlOiBFbnRpdHlVcGRhdGVEYXRhIiwic3Vic2NyaXB0aW9uUGVyaW9kczogU2VsZWN0b3JJdGVtTGlzdDxQYXltZW50SW50ZXJ2YWwgfCBudWxsPiIsInZhbHVlOiBudW1iZXIiLCJ0eXBlOiBBY2NvdW50VHlwZSIsInN1YnNjcmlwdGlvbjogUGxhblR5cGUiLCJwYXltZW50SW50ZXJ2YWw6IFBheW1lbnRJbnRlcnZhbCIsInBlcmlvZEVuZERhdGU6IERhdGUgfCBudWxsIiwiZ2lmdENhcmRzOiBHaWZ0Q2FyZFtdIiwiaXNQcmVtaXVtUHJlZGljYXRlOiAoKSA9PiBib29sZWFuIiwiYWRkQnV0dG9uQXR0cnM6IEljb25CdXR0b25BdHRycyIsImNvbHVtbkhlYWRpbmc6IFtUcmFuc2xhdGlvbktleSwgVHJhbnNsYXRpb25LZXldIiwiZGlhbG9nOiBEaWFsb2ciLCJjdXN0b21lcjogQ3VzdG9tZXIiLCJjdXN0b21lckluZm86IEN1c3RvbWVySW5mbyIsImFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyIsImxhc3RCb29raW5nOiBCb29raW5nIiwiYWNjZXB0ZWRQbGFuczogQXZhaWxhYmxlUGxhblR5cGVbXSIsInJlYXNvbjogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGwiLCJoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMiLCJkaWFsb2c6IERpYWxvZyIsInN1YnNjcmlwdGlvbkFjdGlvbkJ1dHRvbnM6IFN1YnNjcmlwdGlvbkFjdGlvbkJ1dHRvbnMiLCJjdXJyZW50UGxhbkluZm86IEN1cnJlbnRQbGFuSW5mbyIsIm5ld1BheW1lbnRJbnRlcnZhbDogUGF5bWVudEludGVydmFsIiwidGFyZ2V0U3Vic2NyaXB0aW9uOiBQbGFuVHlwZSIsIm5ld1BheW1lbnRJbnRlcnZhbDogc3RyZWFtPFBheW1lbnRJbnRlcnZhbD4iLCJlOiBQcmVjb25kaXRpb25GYWlsZWRFcnJvciIsImRldGFpbE1zZzogc3RyaW5nIiwic3VydmV5RGF0YTogU3VydmV5RGF0YSB8IG51bGwiLCJpbnZvaWNlRGF0YTogSW52b2ljZURhdGEiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9TdWJzY3JpcHRpb25TZWxlY3Rvci50cyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL1N3aXRjaFN1YnNjcmlwdGlvbkRpYWxvZ01vZGVsLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vSW52b2ljZURhdGFJbnB1dC50cyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL1NpbXBsaWZpZWRDcmVkaXRDYXJkSW5wdXQudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9TaW1wbGlmaWVkQ3JlZGl0Q2FyZElucHV0TW9kZWwudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9QYXltZW50TWV0aG9kSW5wdXQudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9JbnZvaWNlQW5kUGF5bWVudERhdGFQYWdlLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vU3dpdGNoVG9CdXNpbmVzc0ludm9pY2VEYXRhRGlhbG9nLnRzIiwiLi4vc3JjL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVQYXltZW50U3Vic2NyaXB0aW9uT3duZXJzaGlwLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vSW52b2ljZURhdGFEaWFsb2cudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9QYXltZW50RGF0YURpYWxvZy50cyIsIi4uL3NyYy9jb21tb24vYXBpL2VudGl0aWVzL2FjY291bnRpbmcvVHlwZVJlZnMudHMiLCIuLi9zcmMvY29tbW9uL2FwaS9lbnRpdGllcy9hY2NvdW50aW5nL1NlcnZpY2VzLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vUGF5bWVudFZpZXdlci50cyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL1VwZ3JhZGVTdWJzY3JpcHRpb25QYWdlLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vVXBncmFkZUNvbmdyYXR1bGF0aW9uc1BhZ2UudHMiLCIuLi9zcmMvY29tbW9uL3NldHRpbmdzL1NlbGVjdE1haWxBZGRyZXNzRm9ybS50cyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL0NhcHRjaGEudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9TaWdudXBGb3JtLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vU2lnbnVwUGFnZS50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlUGF5bWVudFJlc3VsdFR5cGUudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9VcGdyYWRlQ29uZmlybVN1YnNjcmlwdGlvblBhZ2UudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9VcGdyYWRlU3Vic2NyaXB0aW9uV2l6YXJkLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vU2lnbk9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudERpYWxvZy50cyIsIi4uL3NyYy9jb21tb24vc2V0dGluZ3MvU2V0dGluZ3NFeHBhbmRlci50cyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL1N1YnNjcmlwdGlvblZpZXdlci50cyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL1N3aXRjaFN1YnNjcmlwdGlvbkRpYWxvZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgTWF5YmVUcmFuc2xhdGlvbiwgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHR5cGUgeyBCdXlPcHRpb25Cb3hBdHRyLCBCdXlPcHRpb25EZXRhaWxzQXR0ciB9IGZyb20gXCIuL0J1eU9wdGlvbkJveFwiXG5pbXBvcnQgeyBCT1hfTUFSR0lOLCBCdXlPcHRpb25Cb3gsIEJ1eU9wdGlvbkRldGFpbHMsIGdldEFjdGl2ZVN1YnNjcmlwdGlvbkFjdGlvbkJ1dHRvblJlcGxhY2VtZW50IH0gZnJvbSBcIi4vQnV5T3B0aW9uQm94XCJcbmltcG9ydCB0eXBlIHsgU2VnbWVudENvbnRyb2xJdGVtIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1NlZ21lbnRDb250cm9sXCJcbmltcG9ydCB7IFNlZ21lbnRDb250cm9sIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1NlZ21lbnRDb250cm9sXCJcbmltcG9ydCB7IGZvcm1hdE1vbnRobHlQcmljZSwgUGF5bWVudEludGVydmFsLCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4vUHJpY2VVdGlsc1wiXG5pbXBvcnQge1xuXHRGZWF0dXJlQ2F0ZWdvcnksXG5cdEZlYXR1cmVMaXN0SXRlbSxcblx0RmVhdHVyZUxpc3RQcm92aWRlcixcblx0Z2V0RGlzcGxheU5hbWVPZlBsYW5UeXBlLFxuXHRSZXBsYWNlbWVudEtleSxcblx0U2VsZWN0ZWRTdWJzY3JpcHRpb25PcHRpb25zLFxuXHRVcGdyYWRlUHJpY2VUeXBlLFxufSBmcm9tIFwiLi9GZWF0dXJlTGlzdFByb3ZpZGVyXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgZG93bmNhc3QsIGxhenksIE5CU1AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdEF2YWlsYWJsZVBsYW5UeXBlLFxuXHRDb25zdCxcblx0SGlnaGxpZ2h0ZWRQbGFucyxcblx0TGVnYWN5UGxhbnMsXG5cdE5ld0J1c2luZXNzUGxhbnMsXG5cdE5ld1BlcnNvbmFsUGxhbnMsXG5cdFBsYW5UeXBlLFxuXHRQbGFuVHlwZVRvTmFtZSxcbn0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgTG9naW5CdXR0b24sIExvZ2luQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvYnV0dG9ucy9Mb2dpbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBpc0lPU0FwcCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBpc1JlZmVyZW5jZURhdGVXaXRoaW5DeWJlck1vbmRheUNhbXBhaWduIH0gZnJvbSBcIi4uL21pc2MvQ3liZXJNb25kYXlVdGlscy5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi9ndWkvdGhlbWUuanNcIlxuXG5jb25zdCBCdXNpbmVzc1VzZUl0ZW1zOiBTZWdtZW50Q29udHJvbEl0ZW08Ym9vbGVhbj5bXSA9IFtcblx0e1xuXHRcdG5hbWU6IGxhbmcuZ2V0KFwicHJpY2luZy5wcml2YXRlVXNlX2xhYmVsXCIpLFxuXHRcdHZhbHVlOiBmYWxzZSxcblx0fSxcblx0e1xuXHRcdG5hbWU6IGxhbmcuZ2V0KFwicHJpY2luZy5idXNpbmVzc1VzZV9sYWJlbFwiKSxcblx0XHR2YWx1ZTogdHJ1ZSxcblx0fSxcbl1cblxuZXhwb3J0IHR5cGUgU3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9ucyA9IFJlY29yZDxBdmFpbGFibGVQbGFuVHlwZSwgbGF6eTxMb2dpbkJ1dHRvbkF0dHJzPj5cblxuZXhwb3J0IHR5cGUgU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyID0ge1xuXHRvcHRpb25zOiBTZWxlY3RlZFN1YnNjcmlwdGlvbk9wdGlvbnNcblx0cHJpY2VJbmZvVGV4dElkOiBUcmFuc2xhdGlvbktleSB8IG51bGxcblx0YWN0aW9uQnV0dG9uczogU3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9uc1xuXHRib3hXaWR0aDogbnVtYmVyXG5cdGJveEhlaWdodDogbnVtYmVyXG5cdGN1cnJlbnRQbGFuVHlwZTogUGxhblR5cGUgfCBudWxsXG5cdGFsbG93U3dpdGNoaW5nUGF5bWVudEludGVydmFsOiBib29sZWFuXG5cdGZlYXR1cmVMaXN0UHJvdmlkZXI6IEZlYXR1cmVMaXN0UHJvdmlkZXJcblx0cHJpY2VBbmRDb25maWdQcm92aWRlcjogUHJpY2VBbmRDb25maWdQcm92aWRlclxuXHRhY2NlcHRlZFBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdXG5cdG11bHRpcGxlVXNlcnNBbGxvd2VkOiBib29sZWFuXG5cdG1zZzogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGlvbkJ1dHRvbkJ5U3Vic2NyaXB0aW9uKGFjdGlvbkJ1dHRvbnM6IFN1YnNjcmlwdGlvbkFjdGlvbkJ1dHRvbnMsIHN1YnNjcmlwdGlvbjogQXZhaWxhYmxlUGxhblR5cGUpOiBsYXp5PENoaWxkcmVuPiB7XG5cdGNvbnN0IHJldCA9IGFjdGlvbkJ1dHRvbnNbc3Vic2NyaXB0aW9uXVxuXHRpZiAocmV0ID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIlBsYW4gaXMgbm90IHZhbGlkXCIpXG5cdH1cblx0cmV0dXJuICgpID0+IG0oTG9naW5CdXR0b24sIHJldCgpKVxufVxuXG50eXBlIEV4cGFuZGVyVGFyZ2V0cyA9IEF2YWlsYWJsZVBsYW5UeXBlIHwgXCJBbGxcIlxuXG5leHBvcnQgY2xhc3MgU3Vic2NyaXB0aW9uU2VsZWN0b3IgaW1wbGVtZW50cyBDb21wb25lbnQ8U3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyPiB7XG5cdHByaXZhdGUgY29udGFpbmVyRE9NOiBFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBmZWF0dXJlc0V4cGFuZGVkOiB7IFtLIGluIEV4cGFuZGVyVGFyZ2V0c106IGJvb2xlYW4gfSA9IHtcblx0XHRbUGxhblR5cGUuRnJlZV06IGZhbHNlLFxuXHRcdFtQbGFuVHlwZS5SZXZvbHV0aW9uYXJ5XTogZmFsc2UsXG5cdFx0W1BsYW5UeXBlLkxlZ2VuZF06IGZhbHNlLFxuXHRcdFtQbGFuVHlwZS5Fc3NlbnRpYWxdOiBmYWxzZSxcblx0XHRbUGxhblR5cGUuQWR2YW5jZWRdOiBmYWxzZSxcblx0XHRbUGxhblR5cGUuVW5saW1pdGVkXTogZmFsc2UsXG5cdFx0QWxsOiBmYWxzZSxcblx0fVxuXG5cdG9uaW5pdCh2bm9kZTogVm5vZGU8U3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyPik6IGFueSB7XG5cdFx0Y29uc3QgYWNjZXB0ZWRQbGFucyA9IHZub2RlLmF0dHJzLmFjY2VwdGVkUGxhbnNcblx0XHRjb25zdCBvbmx5QnVzaW5lc3NQbGFuc0FjY2VwdGVkID0gYWNjZXB0ZWRQbGFucy5ldmVyeSgocGxhbikgPT4gTmV3QnVzaW5lc3NQbGFucy5pbmNsdWRlcyhwbGFuKSlcblxuXHRcdGlmIChvbmx5QnVzaW5lc3NQbGFuc0FjY2VwdGVkKSB7XG5cdFx0XHQvLyBpZiBvbmx5IGJ1c2luZXNzIHBsYW5zIGFyZSBhY2NlcHRlZCwgd2Ugc2hvdyB0aGVtIGZpcnN0IGV2ZW4gaWYgdGhlIGN1cnJlbnQgcGxhbiBpcyBhIHBlcnNvbmFsIHBsYW5cblx0XHRcdHZub2RlLmF0dHJzLm9wdGlvbnMuYnVzaW5lc3NVc2UodHJ1ZSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckhlYWRsaW5lKFxuXHRcdG1zZzogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGwsXG5cdFx0Y3VycmVudFBsYW5UeXBlOiBQbGFuVHlwZSB8IG51bGwsXG5cdFx0cHJpY2VJbmZvVGV4dElkOiBUcmFuc2xhdGlvbktleSB8IG51bGwsXG5cdFx0aXNCdXNpbmVzczogYm9vbGVhbixcblx0XHRpc0N5YmVyTW9uZGF5OiBib29sZWFuLFxuXHQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3Qgd3JhcEluRGl2ID0gKHRleHQ6IHN0cmluZywgc3R5bGU/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PiB7XG5cdFx0XHRyZXR1cm4gbShcIi5iLmNlbnRlclwiLCB7IHN0eWxlIH0sIHRleHQpXG5cdFx0fVxuXG5cdFx0aWYgKG1zZykge1xuXHRcdFx0cmV0dXJuIHdyYXBJbkRpdihsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChtc2cpKVxuXHRcdH0gZWxzZSBpZiAoY3VycmVudFBsYW5UeXBlICE9IG51bGwgJiYgTGVnYWN5UGxhbnMuaW5jbHVkZXMoY3VycmVudFBsYW5UeXBlKSkge1xuXHRcdFx0cmV0dXJuIHdyYXBJbkRpdihsYW5nLmdldChcImN1cnJlbnRQbGFuRGlzY29udGludWVkX21zZ1wiKSlcblx0XHR9XG5cblx0XHRpZiAocHJpY2VJbmZvVGV4dElkICYmIGxhbmcuZXhpc3RzKHByaWNlSW5mb1RleHRJZCkpIHtcblx0XHRcdHJldHVybiB3cmFwSW5EaXYobGFuZy5nZXQocHJpY2VJbmZvVGV4dElkKSlcblx0XHR9XG5cblx0XHRpZiAoaXNDeWJlck1vbmRheSAmJiAhaXNCdXNpbmVzcykge1xuXHRcdFx0cmV0dXJuIHdyYXBJbkRpdihsYW5nLmdldChcInByaWNpbmcuY3liZXJfbW9uZGF5X21zZ1wiKSwgeyB3aWR0aDogXCIyMzBweFwiLCBtYXJnaW46IFwiMWVtIGF1dG8gMCBhdXRvXCIgfSlcblx0XHR9XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxTdWJzY3JpcHRpb25TZWxlY3RvckF0dHI+KTogQ2hpbGRyZW4ge1xuXHRcdC8vIEFkZCBCdXlPcHRpb25Cb3ggbWFyZ2luIHR3aWNlIHRvIHRoZSBib3hXaWR0aCByZWNlaXZlZFxuXHRcdGNvbnN0IHsgYWNjZXB0ZWRQbGFucywgcHJpY2VJbmZvVGV4dElkLCBtc2csIGZlYXR1cmVMaXN0UHJvdmlkZXIsIGN1cnJlbnRQbGFuVHlwZSwgb3B0aW9ucywgYm94V2lkdGggfSA9IHZub2RlLmF0dHJzXG5cblx0XHRjb25zdCBjb2x1bW5XaWR0aCA9IGJveFdpZHRoICsgQk9YX01BUkdJTiAqIDJcblx0XHRjb25zdCBpbk1vYmlsZVZpZXc6IGJvb2xlYW4gPSAodGhpcy5jb250YWluZXJET00gJiYgdGhpcy5jb250YWluZXJET00uY2xpZW50V2lkdGggPCBjb2x1bW5XaWR0aCAqIDIpID09IHRydWVcblx0XHRjb25zdCBmZWF0dXJlRXhwYW5kZXIgPSB0aGlzLnJlbmRlckZlYXR1cmVFeHBhbmRlcnMoaW5Nb2JpbGVWaWV3LCBmZWF0dXJlTGlzdFByb3ZpZGVyKSAvLyByZW5kZXJzIGFsbCBmZWF0dXJlIGV4cGFuZGVycywgYm90aCBmb3IgZXZlcnkgc2luZ2xlIHN1YnNjcmlwdGlvbiBvcHRpb24gYnV0IGFsc28gZm9yIHRoZSB3aG9sZSBsaXN0XG5cdFx0bGV0IGFkZGl0aW9uYWxJbmZvOiBDaGlsZHJlblxuXG5cdFx0bGV0IHBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdXG5cdFx0Y29uc3QgY3VycmVudFBsYW4gPSBjdXJyZW50UGxhblR5cGVcblx0XHRjb25zdCBzaWdudXAgPSBjdXJyZW50UGxhbiA9PSBudWxsXG5cblx0XHRjb25zdCBvbmx5QnVzaW5lc3NQbGFuc0FjY2VwdGVkID0gYWNjZXB0ZWRQbGFucy5ldmVyeSgocGxhbikgPT4gTmV3QnVzaW5lc3NQbGFucy5pbmNsdWRlcyhwbGFuKSlcblx0XHRjb25zdCBvbmx5UGVyc29uYWxQbGFuc0FjY2VwdGVkID0gYWNjZXB0ZWRQbGFucy5ldmVyeSgocGxhbikgPT4gTmV3UGVyc29uYWxQbGFucy5pbmNsdWRlcyhwbGFuKSlcblx0XHQvLyBTaG93IHRoZSBidXNpbmVzcyBzZWdtZW50Q29udHJvbCBmb3Igc2lnbnVwLCBpZiBib3RoIHBlcnNvbmFsICYgYnVzaW5lc3MgcGxhbnMgYXJlIGFsbG93ZWRcblx0XHRjb25zdCBzaG93QnVzaW5lc3NTZWxlY3RvciA9ICFvbmx5QnVzaW5lc3NQbGFuc0FjY2VwdGVkICYmICFvbmx5UGVyc29uYWxQbGFuc0FjY2VwdGVkICYmICFpc0lPU0FwcCgpXG5cblx0XHRjb25zdCBpc0N5YmVyTW9uZGF5ID0gaXNSZWZlcmVuY2VEYXRlV2l0aGluQ3liZXJNb25kYXlDYW1wYWlnbihDb25zdC5DVVJSRU5UX0RBVEUgPz8gbmV3IERhdGUoKSlcblxuXHRcdGxldCBzdWJzY3JpcHRpb25QZXJpb2RJbmZvTXNnID0gIXNpZ251cCAmJiBjdXJyZW50UGxhbiAhPT0gUGxhblR5cGUuRnJlZSA/IGxhbmcuZ2V0KFwic3dpdGNoU3Vic2NyaXB0aW9uSW5mb19tc2dcIikgKyBcIiBcIiA6IFwiXCJcblx0XHRpZiAob3B0aW9ucy5idXNpbmVzc1VzZSgpKSB7XG5cdFx0XHRwbGFucyA9IFtQbGFuVHlwZS5Fc3NlbnRpYWwsIFBsYW5UeXBlLkFkdmFuY2VkLCBQbGFuVHlwZS5VbmxpbWl0ZWRdXG5cdFx0XHRzdWJzY3JpcHRpb25QZXJpb2RJbmZvTXNnICs9IGxhbmcuZ2V0KFwicHJpY2luZy5zdWJzY3JpcHRpb25QZXJpb2RJbmZvQnVzaW5lc3NfbXNnXCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChpbk1vYmlsZVZpZXcpIHtcblx0XHRcdFx0aWYgKGlzQ3liZXJNb25kYXkpIHtcblx0XHRcdFx0XHRwbGFucyA9IFtQbGFuVHlwZS5MZWdlbmQsIFBsYW5UeXBlLlJldm9sdXRpb25hcnksIFBsYW5UeXBlLkZyZWVdXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cGxhbnMgPSBbUGxhblR5cGUuUmV2b2x1dGlvbmFyeSwgUGxhblR5cGUuTGVnZW5kLCBQbGFuVHlwZS5GcmVlXVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoaXNDeWJlck1vbmRheSkge1xuXHRcdFx0XHRcdHBsYW5zID0gW1BsYW5UeXBlLkZyZWUsIFBsYW5UeXBlLkxlZ2VuZCwgUGxhblR5cGUuUmV2b2x1dGlvbmFyeV1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwbGFucyA9IFtQbGFuVHlwZS5GcmVlLCBQbGFuVHlwZS5SZXZvbHV0aW9uYXJ5LCBQbGFuVHlwZS5MZWdlbmRdXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHN1YnNjcmlwdGlvblBlcmlvZEluZm9Nc2cgKz0gbGFuZy5nZXQoXCJwcmljaW5nLnN1YnNjcmlwdGlvblBlcmlvZEluZm9Qcml2YXRlX21zZ1wiKVxuXHRcdH1cblxuXHRcdGNvbnN0IHNob3VsZFNob3dGaXJzdFllYXJEaXNjb3VudE5vdGljZSA9ICFpc0lPU0FwcCgpICYmIGlzQ3liZXJNb25kYXkgJiYgIW9wdGlvbnMuYnVzaW5lc3NVc2UoKSAmJiBvcHRpb25zLnBheW1lbnRJbnRlcnZhbCgpID09PSBQYXltZW50SW50ZXJ2YWwuWWVhcmx5XG5cblx0XHRhZGRpdGlvbmFsSW5mbyA9IG0oXCIuZmxleC5mbGV4LWNvbHVtbi5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0ZmVhdHVyZUV4cGFuZGVyLkFsbCwgLy8gZ2xvYmFsIGZlYXR1cmUgZXhwYW5kZXJcblx0XHRcdG0oXCIuc21hbGxlci5tYi5jZW50ZXJcIiwgc3Vic2NyaXB0aW9uUGVyaW9kSW5mb01zZyksXG5cdFx0XHRzaG91bGRTaG93Rmlyc3RZZWFyRGlzY291bnROb3RpY2UgJiYgbShcIi5zbWFsbGVyLm1iLmNlbnRlclwiLCBgKiAke2xhbmcuZ2V0KFwicHJpY2luZy5sZWdlbmRBc3Rlcmlza19tc2dcIil9YCksXG5cdFx0XSlcblxuXHRcdGNvbnN0IGJ1eUJveGVzVmlld1BsYWNlbWVudCA9IHBsYW5zXG5cdFx0XHQuZmlsdGVyKChwbGFuKSA9PiBhY2NlcHRlZFBsYW5zLmluY2x1ZGVzKHBsYW4pIHx8IGN1cnJlbnRQbGFuVHlwZSA9PT0gcGxhbilcblx0XHRcdC5tYXAoKHBlcnNvbmFsUGxhbiwgaSkgPT4ge1xuXHRcdFx0XHQvLyBvbmx5IHNob3cgY2F0ZWdvcnkgdGl0bGUgZm9yIHRoZSBsZWZ0bW9zdCBpdGVtXG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJCdXlPcHRpb25Cb3godm5vZGUuYXR0cnMsIGluTW9iaWxlVmlldywgcGVyc29uYWxQbGFuLCBpc0N5YmVyTW9uZGF5KSxcblx0XHRcdFx0XHR0aGlzLnJlbmRlckJ1eU9wdGlvbkRldGFpbHModm5vZGUuYXR0cnMsIGkgPT09IDAsIHBlcnNvbmFsUGxhbiwgZmVhdHVyZUV4cGFuZGVyLCBpc0N5YmVyTW9uZGF5KSxcblx0XHRcdFx0XVxuXHRcdFx0fSlcblxuXHRcdHJldHVybiBtKFwiXCIsIHsgbGFuZzogbGFuZy5jb2RlIH0sIFtcblx0XHRcdHNob3dCdXNpbmVzc1NlbGVjdG9yXG5cdFx0XHRcdD8gbShTZWdtZW50Q29udHJvbCwge1xuXHRcdFx0XHRcdFx0c2VsZWN0ZWRWYWx1ZTogb3B0aW9ucy5idXNpbmVzc1VzZSgpLFxuXHRcdFx0XHRcdFx0b25WYWx1ZVNlbGVjdGVkOiBvcHRpb25zLmJ1c2luZXNzVXNlLFxuXHRcdFx0XHRcdFx0aXRlbXM6IEJ1c2luZXNzVXNlSXRlbXMsXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0dGhpcy5yZW5kZXJIZWFkbGluZShtc2csIGN1cnJlbnRQbGFuVHlwZSwgcHJpY2VJbmZvVGV4dElkLCBvcHRpb25zLmJ1c2luZXNzVXNlKCksIGlzQ3liZXJNb25kYXkpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC5jZW50ZXItaG9yaXpvbnRhbGx5LndyYXBcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdFwiZGF0YS10ZXN0aWRcIjogXCJkaWFsb2c6c2VsZWN0LXN1YnNjcmlwdGlvblwiLFxuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuY29udGFpbmVyRE9NID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XCJjb2x1bW4tZ2FwXCI6IHB4KEJPWF9NQVJHSU4pLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG0oXCIucGxhbnMtZ3JpZFwiLCBidXlCb3hlc1ZpZXdQbGFjZW1lbnQuZmxhdCgpKSxcblx0XHRcdFx0YWRkaXRpb25hbEluZm8sXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckJ1eU9wdGlvbkJveChhdHRyczogU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyLCBpbk1vYmlsZVZpZXc6IGJvb2xlYW4sIHBsYW5UeXBlOiBBdmFpbGFibGVQbGFuVHlwZSwgaXNDeWJlck1vbmRheTogYm9vbGVhbik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0d2lkdGg6IGF0dHJzLmJveFdpZHRoID8gcHgoYXR0cnMuYm94V2lkdGgpIDogcHgoMjMwKSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRtKEJ1eU9wdGlvbkJveCwgdGhpcy5jcmVhdGVCdXlPcHRpb25Cb3hBdHRyKGF0dHJzLCBwbGFuVHlwZSwgaW5Nb2JpbGVWaWV3LCBpc0N5YmVyTW9uZGF5KSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJCdXlPcHRpb25EZXRhaWxzKFxuXHRcdGF0dHJzOiBTdWJzY3JpcHRpb25TZWxlY3RvckF0dHIsXG5cdFx0cmVuZGVyQ2F0ZWdvcnlUaXRsZTogYm9vbGVhbixcblx0XHRwbGFuVHlwZTogQXZhaWxhYmxlUGxhblR5cGUsXG5cdFx0ZmVhdHVyZUV4cGFuZGVyOiBSZWNvcmQ8RXhwYW5kZXJUYXJnZXRzLCBDaGlsZHJlbj4sXG5cdFx0aXNDeWJlck1vbmRheTogYm9vbGVhbiwgLy8gY2hhbmdlIHRvIGlzRGlzY291bnRGb3JBbnlQbGFuQXZhaWxhYmxlIHdoZW4gcmVtb3ZpbmcgdGhlIGN5YmVyIG1vbmRheSBpbXBsZW1lbnRhdGlvblxuXHQpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIlwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZTogeyB3aWR0aDogYXR0cnMuYm94V2lkdGggPyBweChhdHRycy5ib3hXaWR0aCkgOiBweCgyMzApIH0sXG5cdFx0XHR9LFxuXHRcdFx0bShCdXlPcHRpb25EZXRhaWxzLCB0aGlzLmNyZWF0ZUJ1eU9wdGlvbkJveERldGFpbHNBdHRyKGF0dHJzLCBwbGFuVHlwZSwgcmVuZGVyQ2F0ZWdvcnlUaXRsZSwgaXNDeWJlck1vbmRheSkpLFxuXHRcdFx0ZmVhdHVyZUV4cGFuZGVyW3BsYW5UeXBlXSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUJ1eU9wdGlvbkJveEF0dHIoXG5cdFx0c2VsZWN0b3JBdHRyczogU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyLFxuXHRcdHRhcmdldFN1YnNjcmlwdGlvbjogQXZhaWxhYmxlUGxhblR5cGUsXG5cdFx0bW9iaWxlOiBib29sZWFuLFxuXHRcdGlzQ3liZXJNb25kYXk6IGJvb2xlYW4sXG5cdCk6IEJ1eU9wdGlvbkJveEF0dHIge1xuXHRcdGNvbnN0IHsgcHJpY2VBbmRDb25maWdQcm92aWRlciB9ID0gc2VsZWN0b3JBdHRyc1xuXG5cdFx0Ly8gd2UgaGlnaGxpZ2h0IHRoZSBjZW50ZXIgYm94IGlmIHRoaXMgaXMgYSBzaWdudXAgb3IgdGhlIGN1cnJlbnQgc3Vic2NyaXB0aW9uIHR5cGUgaXMgRnJlZVxuXHRcdGNvbnN0IGludGVydmFsID0gc2VsZWN0b3JBdHRycy5vcHRpb25zLnBheW1lbnRJbnRlcnZhbCgpXG5cdFx0Y29uc3QgdXBncmFkaW5nVG9QYWlkQWNjb3VudCA9ICFzZWxlY3RvckF0dHJzLmN1cnJlbnRQbGFuVHlwZSB8fCBzZWxlY3RvckF0dHJzLmN1cnJlbnRQbGFuVHlwZSA9PT0gUGxhblR5cGUuRnJlZVxuXHRcdGNvbnN0IGlzSGlnaGxpZ2h0ZWQgPSAoKCkgPT4ge1xuXHRcdFx0aWYgKGlzQ3liZXJNb25kYXkpIHtcblx0XHRcdFx0cmV0dXJuIHRhcmdldFN1YnNjcmlwdGlvbiA9PT0gUGxhblR5cGUuTGVnZW5kXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1cGdyYWRpbmdUb1BhaWRBY2NvdW50ICYmIEhpZ2hsaWdodGVkUGxhbnMuaW5jbHVkZXModGFyZ2V0U3Vic2NyaXB0aW9uKVxuXHRcdH0pKClcblx0XHRjb25zdCBtdWx0aXVzZXIgPSBOZXdCdXNpbmVzc1BsYW5zLmluY2x1ZGVzKHRhcmdldFN1YnNjcmlwdGlvbikgfHwgTGVnYWN5UGxhbnMuaW5jbHVkZXModGFyZ2V0U3Vic2NyaXB0aW9uKSB8fCBzZWxlY3RvckF0dHJzLm11bHRpcGxlVXNlcnNBbGxvd2VkXG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb25QcmljZSA9IHByaWNlQW5kQ29uZmlnUHJvdmlkZXIuZ2V0U3Vic2NyaXB0aW9uUHJpY2UoaW50ZXJ2YWwsIHRhcmdldFN1YnNjcmlwdGlvbiwgVXBncmFkZVByaWNlVHlwZS5QbGFuQWN0dWFsUHJpY2UpXG5cblx0XHRsZXQgcHJpY2VTdHI6IHN0cmluZ1xuXHRcdGxldCByZWZlcmVuY2VQcmljZVN0cjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG5cdFx0aWYgKGlzSU9TQXBwKCkpIHtcblx0XHRcdGNvbnN0IHByaWNlcyA9IHByaWNlQW5kQ29uZmlnUHJvdmlkZXIuZ2V0TW9iaWxlUHJpY2VzKCkuZ2V0KFBsYW5UeXBlVG9OYW1lW3RhcmdldFN1YnNjcmlwdGlvbl0udG9Mb3dlckNhc2UoKSlcblx0XHRcdGlmIChwcmljZXMgIT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNDeWJlck1vbmRheSAmJiB0YXJnZXRTdWJzY3JpcHRpb24gPT09IFBsYW5UeXBlLkxlZ2VuZCAmJiBpbnRlcnZhbCA9PSBQYXltZW50SW50ZXJ2YWwuWWVhcmx5KSB7XG5cdFx0XHRcdFx0Y29uc3QgcmV2b2x1dGlvbmFyeVByaWNlID0gcHJpY2VBbmRDb25maWdQcm92aWRlci5nZXRNb2JpbGVQcmljZXMoKS5nZXQoUGxhblR5cGVUb05hbWVbUGxhblR5cGUuUmV2b2x1dGlvbmFyeV0udG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0XHRwcmljZVN0ciA9IHJldm9sdXRpb25hcnlQcmljZT8uZGlzcGxheVllYXJseVBlck1vbnRoID8/IE5CU1Bcblx0XHRcdFx0XHQvLyBpZiB0aGVyZSBpcyBhIGRpc2NvdW50IGZvciB0aGlzIHBsYW4gd2Ugc2hvdyB0aGUgb3JpZ2luYWwgcHJpY2UgYXMgcmVmZXJlbmNlXG5cdFx0XHRcdFx0cmVmZXJlbmNlUHJpY2VTdHIgPSBwcmljZXM/LmRpc3BsYXlZZWFybHlQZXJNb250aFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN3aXRjaCAoaW50ZXJ2YWwpIHtcblx0XHRcdFx0XHRcdGNhc2UgUGF5bWVudEludGVydmFsLk1vbnRobHk6XG5cdFx0XHRcdFx0XHRcdHByaWNlU3RyID0gcHJpY2VzLmRpc3BsYXlNb250aGx5UGVyTW9udGhcblx0XHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHRcdGNhc2UgUGF5bWVudEludGVydmFsLlllYXJseTpcblx0XHRcdFx0XHRcdFx0cHJpY2VTdHIgPSBwcmljZXMuZGlzcGxheVllYXJseVBlclllYXJcblx0XHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHByaWNlU3RyID0gTkJTUFxuXHRcdFx0XHRyZWZlcmVuY2VQcmljZVN0ciA9IE5CU1Bcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgcmVmZXJlbmNlUHJpY2UgPSBwcmljZUFuZENvbmZpZ1Byb3ZpZGVyLmdldFN1YnNjcmlwdGlvblByaWNlKGludGVydmFsLCB0YXJnZXRTdWJzY3JpcHRpb24sIFVwZ3JhZGVQcmljZVR5cGUuUGxhblJlZmVyZW5jZVByaWNlKVxuXHRcdFx0cHJpY2VTdHIgPSBmb3JtYXRNb250aGx5UHJpY2Uoc3Vic2NyaXB0aW9uUHJpY2UsIGludGVydmFsKVxuXHRcdFx0aWYgKHJlZmVyZW5jZVByaWNlID4gc3Vic2NyaXB0aW9uUHJpY2UpIHtcblx0XHRcdFx0Ly8gaWYgdGhlcmUgaXMgYSBkaXNjb3VudCBmb3IgdGhpcyBwbGFuIHdlIHNob3cgdGhlIG9yaWdpbmFsIHByaWNlIGFzIHJlZmVyZW5jZVxuXHRcdFx0XHRyZWZlcmVuY2VQcmljZVN0ciA9IGZvcm1hdE1vbnRobHlQcmljZShyZWZlcmVuY2VQcmljZSwgaW50ZXJ2YWwpXG5cdFx0XHR9IGVsc2UgaWYgKGludGVydmFsID09IFBheW1lbnRJbnRlcnZhbC5ZZWFybHkgJiYgc3Vic2NyaXB0aW9uUHJpY2UgIT09IDAgJiYgIWlzQ3liZXJNb25kYXkpIHtcblx0XHRcdFx0Ly8gaWYgdGhlcmUgaXMgbm8gZGlzY291bnQgZm9yIGFueSBwbGFuIHRoZW4gd2Ugc2hvdyB0aGUgbW9udGhseSBwcmljZSBhcyByZWZlcmVuY2Vcblx0XHRcdFx0Y29uc3QgbW9udGhseVJlZmVyZW5jZVByaWNlID0gcHJpY2VBbmRDb25maWdQcm92aWRlci5nZXRTdWJzY3JpcHRpb25QcmljZShcblx0XHRcdFx0XHRQYXltZW50SW50ZXJ2YWwuTW9udGhseSxcblx0XHRcdFx0XHR0YXJnZXRTdWJzY3JpcHRpb24sXG5cdFx0XHRcdFx0VXBncmFkZVByaWNlVHlwZS5QbGFuQWN0dWFsUHJpY2UsXG5cdFx0XHRcdClcblx0XHRcdFx0cmVmZXJlbmNlUHJpY2VTdHIgPSBmb3JtYXRNb250aGx5UHJpY2UobW9udGhseVJlZmVyZW5jZVByaWNlLCBQYXltZW50SW50ZXJ2YWwuTW9udGhseSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJZiB3ZSBhcmUgb24gdGhlIGN5YmVyIG1vbmRheSBjYW1wYWlnbiwgd2Ugd2FudCB0byBsZXQgdGhlIHVzZXIga25vdyB0aGUgZGlzY291bnQgaXMganVzdCBmb3IgdGhlIGZpcnN0IHllYXIuXG5cdFx0Y29uc3QgYXN0ZXJpc2tPckVtcHR5U3RyaW5nID0gIWlzSU9TQXBwKCkgJiYgaXNDeWJlck1vbmRheSAmJiB0YXJnZXRTdWJzY3JpcHRpb24gPT09IFBsYW5UeXBlLkxlZ2VuZCAmJiBpbnRlcnZhbCA9PT0gUGF5bWVudEludGVydmFsLlllYXJseSA/IFwiKlwiIDogXCJcIlxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGhlYWRpbmc6IGdldERpc3BsYXlOYW1lT2ZQbGFuVHlwZSh0YXJnZXRTdWJzY3JpcHRpb24pLFxuXHRcdFx0YWN0aW9uQnV0dG9uOlxuXHRcdFx0XHRzZWxlY3RvckF0dHJzLmN1cnJlbnRQbGFuVHlwZSA9PT0gdGFyZ2V0U3Vic2NyaXB0aW9uXG5cdFx0XHRcdFx0PyBnZXRBY3RpdmVTdWJzY3JpcHRpb25BY3Rpb25CdXR0b25SZXBsYWNlbWVudCgpXG5cdFx0XHRcdFx0OiBnZXRBY3Rpb25CdXR0b25CeVN1YnNjcmlwdGlvbihzZWxlY3RvckF0dHJzLmFjdGlvbkJ1dHRvbnMsIHRhcmdldFN1YnNjcmlwdGlvbiksXG5cdFx0XHRwcmljZTogcHJpY2VTdHIsXG5cdFx0XHRyZWZlcmVuY2VQcmljZTogcmVmZXJlbmNlUHJpY2VTdHIsXG5cdFx0XHRwcmljZUhpbnQ6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwicHJpY2VfaGludFwiLCBgJHtnZXRQcmljZUhpbnQoc3Vic2NyaXB0aW9uUHJpY2UsIGludGVydmFsLCBtdWx0aXVzZXIpfSR7YXN0ZXJpc2tPckVtcHR5U3RyaW5nfWApLFxuXHRcdFx0aGVscExhYmVsOiBnZXRIZWxwTGFiZWwodGFyZ2V0U3Vic2NyaXB0aW9uLCBzZWxlY3RvckF0dHJzLm9wdGlvbnMuYnVzaW5lc3NVc2UoKSksXG5cdFx0XHR3aWR0aDogc2VsZWN0b3JBdHRycy5ib3hXaWR0aCxcblx0XHRcdGhlaWdodDogc2VsZWN0b3JBdHRycy5ib3hIZWlnaHQsXG5cdFx0XHRzZWxlY3RlZFBheW1lbnRJbnRlcnZhbDpcblx0XHRcdFx0c2VsZWN0b3JBdHRycy5hbGxvd1N3aXRjaGluZ1BheW1lbnRJbnRlcnZhbCAmJiB0YXJnZXRTdWJzY3JpcHRpb24gIT09IFBsYW5UeXBlLkZyZWUgPyBzZWxlY3RvckF0dHJzLm9wdGlvbnMucGF5bWVudEludGVydmFsIDogbnVsbCxcblx0XHRcdGFjY291bnRQYXltZW50SW50ZXJ2YWw6IGludGVydmFsLFxuXHRcdFx0aGlnaGxpZ2h0ZWQ6IGlzSGlnaGxpZ2h0ZWQsXG5cdFx0XHRtb2JpbGUsXG5cdFx0XHRib251c01vbnRoczpcblx0XHRcdFx0dGFyZ2V0U3Vic2NyaXB0aW9uICE9PSBQbGFuVHlwZS5GcmVlICYmIGludGVydmFsID09PSBQYXltZW50SW50ZXJ2YWwuWWVhcmx5XG5cdFx0XHRcdFx0PyBOdW1iZXIoc2VsZWN0b3JBdHRycy5wcmljZUFuZENvbmZpZ1Byb3ZpZGVyLmdldFJhd1ByaWNpbmdEYXRhKCkuYm9udXNNb250aHNGb3JZZWFybHlQbGFuKVxuXHRcdFx0XHRcdDogMCxcblx0XHRcdHRhcmdldFN1YnNjcmlwdGlvbixcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUJ1eU9wdGlvbkJveERldGFpbHNBdHRyKFxuXHRcdHNlbGVjdG9yQXR0cnM6IFN1YnNjcmlwdGlvblNlbGVjdG9yQXR0cixcblx0XHR0YXJnZXRTdWJzY3JpcHRpb246IEF2YWlsYWJsZVBsYW5UeXBlLFxuXHRcdHJlbmRlckNhdGVnb3J5VGl0bGU6IGJvb2xlYW4sXG5cdFx0aXNDeWJlck1vbmRheTogYm9vbGVhbixcblx0KTogQnV5T3B0aW9uRGV0YWlsc0F0dHIge1xuXHRcdGNvbnN0IHsgZmVhdHVyZUxpc3RQcm92aWRlciB9ID0gc2VsZWN0b3JBdHRyc1xuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbkZlYXR1cmVzID0gZmVhdHVyZUxpc3RQcm92aWRlci5nZXRGZWF0dXJlTGlzdCh0YXJnZXRTdWJzY3JpcHRpb24pXG5cdFx0Y29uc3QgY2F0ZWdvcmllc1RvU2hvdyA9IHN1YnNjcmlwdGlvbkZlYXR1cmVzLmNhdGVnb3JpZXNcblx0XHRcdC5tYXAoKGZjKSA9PiB7XG5cdFx0XHRcdHJldHVybiBsb2NhbGl6ZUZlYXR1cmVDYXRlZ29yeShmYywgdGFyZ2V0U3Vic2NyaXB0aW9uLCBzZWxlY3RvckF0dHJzKVxuXHRcdFx0fSlcblx0XHRcdC5maWx0ZXIoKGZjKTogZmMgaXMgQnV5T3B0aW9uRGV0YWlsc0F0dHJbXCJjYXRlZ29yaWVzXCJdWzBdID0+IGZjICE9IG51bGwpXG5cblx0XHRjb25zdCBpc0xlZ2VuZCA9IHRhcmdldFN1YnNjcmlwdGlvbiA9PT0gUGxhblR5cGUuTGVnZW5kXG5cdFx0Y29uc3QgaXNZZWFybHkgPSBzZWxlY3RvckF0dHJzLm9wdGlvbnMucGF5bWVudEludGVydmFsKCkgPT09IFBheW1lbnRJbnRlcnZhbC5ZZWFybHlcblxuXHRcdHJldHVybiB7XG5cdFx0XHRjYXRlZ29yaWVzOiBjYXRlZ29yaWVzVG9TaG93LFxuXHRcdFx0ZmVhdHVyZXNFeHBhbmRlZDogdGhpcy5mZWF0dXJlc0V4cGFuZGVkW3RhcmdldFN1YnNjcmlwdGlvbl0gfHwgdGhpcy5mZWF0dXJlc0V4cGFuZGVkLkFsbCxcblx0XHRcdHJlbmRlckNhdGVnb3J5VGl0bGUsXG5cdFx0XHRpY29uU3R5bGU6IGlzQ3liZXJNb25kYXkgJiYgaXNZZWFybHkgJiYgaXNMZWdlbmQgPyB7IGZpbGw6IHRoZW1lLmNvbnRlbnRfYWNjZW50X2N5YmVyX21vbmRheSB9IDogdW5kZWZpbmVkLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZW5kZXJzIHRoZSBmZWF0dXJlIGV4cGFuZGVycyBkZXBlbmRpbmcgb24gd2hldGhlciBjdXJyZW50bHkgZGlzcGxheWluZyB0aGUgZmVhdHVyZSBsaXN0IGluIHNpbmdsZS1jb2x1bW4gbGF5b3V0IG9yIGluIG11bHRpLWNvbHVtbiBsYXlvdXQuXG5cdCAqIElmIGEgc3BlY2lmaWMgZXhwYW5kZXIgaXMgbm90IG5lZWRlZCBhbmQgdGh1cyBzaG91bGQgbm90IGJlIHJlbmRlcmVyLCBudWxsIHwgdW5kZWZpbmVkIGlzIHJldHVybmVkXG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckZlYXR1cmVFeHBhbmRlcnMoaW5Nb2JpbGVWaWV3OiBib29sZWFuIHwgbnVsbCwgZmVhdHVyZUxpc3RQcm92aWRlcjogRmVhdHVyZUxpc3RQcm92aWRlcik6IFJlY29yZDxFeHBhbmRlclRhcmdldHMsIENoaWxkcmVuPiB7XG5cdFx0aWYgKCFmZWF0dXJlTGlzdFByb3ZpZGVyLmZlYXR1cmVMb2FkaW5nRG9uZSgpKSB7XG5cdFx0XHQvLyB0aGUgZmVhdHVyZSBsaXN0IGlzIG5vdCBhdmFpbGFibGVcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFtQbGFuVHlwZS5GcmVlXTogbnVsbCxcblx0XHRcdFx0W1BsYW5UeXBlLlJldm9sdXRpb25hcnldOiBudWxsLFxuXHRcdFx0XHRbUGxhblR5cGUuTGVnZW5kXTogbnVsbCxcblx0XHRcdFx0W1BsYW5UeXBlLkVzc2VudGlhbF06IG51bGwsXG5cdFx0XHRcdFtQbGFuVHlwZS5BZHZhbmNlZF06IG51bGwsXG5cdFx0XHRcdFtQbGFuVHlwZS5VbmxpbWl0ZWRdOiBudWxsLFxuXHRcdFx0XHRBbGw6IG51bGwsXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChpbk1vYmlsZVZpZXcpIHtcblx0XHRcdC8vIEluIHNpbmdsZS1jb2x1bW4gbGF5b3V0IGV2ZXJ5IHN1YnNjcmlwdGlvbiB0eXBlIGhhcyBpdHMgb3duIGZlYXR1cmUgZXhwYW5kZXIuXG5cdFx0XHRpZiAodGhpcy5mZWF0dXJlc0V4cGFuZGVkLkFsbCkge1xuXHRcdFx0XHRmb3IgKGNvbnN0IGsgaW4gdGhpcy5mZWF0dXJlc0V4cGFuZGVkKSB7XG5cdFx0XHRcdFx0dGhpcy5mZWF0dXJlc0V4cGFuZGVkW2sgYXMgRXhwYW5kZXJUYXJnZXRzXSA9IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0W1BsYW5UeXBlLkZyZWVdOiB0aGlzLnJlbmRlckV4cGFuZGVyKFBsYW5UeXBlLkZyZWUpLFxuXHRcdFx0XHRbUGxhblR5cGUuUmV2b2x1dGlvbmFyeV06IHRoaXMucmVuZGVyRXhwYW5kZXIoUGxhblR5cGUuUmV2b2x1dGlvbmFyeSksXG5cdFx0XHRcdFtQbGFuVHlwZS5MZWdlbmRdOiB0aGlzLnJlbmRlckV4cGFuZGVyKFBsYW5UeXBlLkxlZ2VuZCksXG5cdFx0XHRcdFtQbGFuVHlwZS5BZHZhbmNlZF06IHRoaXMucmVuZGVyRXhwYW5kZXIoUGxhblR5cGUuQWR2YW5jZWQpLFxuXHRcdFx0XHRbUGxhblR5cGUuRXNzZW50aWFsXTogdGhpcy5yZW5kZXJFeHBhbmRlcihQbGFuVHlwZS5Fc3NlbnRpYWwpLFxuXHRcdFx0XHRbUGxhblR5cGUuVW5saW1pdGVkXTogdGhpcy5yZW5kZXJFeHBhbmRlcihQbGFuVHlwZS5VbmxpbWl0ZWQpLFxuXHRcdFx0XHRBbGw6IG51bGwsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAoY29uc3QgayBpbiB0aGlzLmZlYXR1cmVzRXhwYW5kZWQpIHtcblx0XHRcdFx0dGhpcy5mZWF0dXJlc0V4cGFuZGVkW2sgYXMgRXhwYW5kZXJUYXJnZXRzXSA9IHRoaXMuZmVhdHVyZXNFeHBhbmRlZC5BbGwgLy8gaW4gbXVsdGktY29sdW1uIGxheW91dCB0aGUgc3BlY2lmaWMgZmVhdHVyZSBleHBhbmRlcnMgc2hvdWxkIGZvbGxvdyB0aGUgZ2xvYmFsIG9uZVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oe30gYXMgUmVjb3JkPEV4cGFuZGVyVGFyZ2V0cywgQ2hpbGRyZW4+LCB7IEFsbDogdGhpcy5yZW5kZXJFeHBhbmRlcihcIkFsbFwiKSB9KVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZW5kZXJzIGEgc2luZ2xlIGZlYXR1cmUgZXhwYW5kZXIuXG5cdCAqIEBwYXJhbSBzdWJUeXBlIFRoZSBjdXJyZW50IGV4cGFuZGVyIHRoYXQgc2hvdWxkIGJlIHJlbmRlcmVkXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckV4cGFuZGVyKHN1YlR5cGU6IEV4cGFuZGVyVGFyZ2V0cyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gdGhpcy5mZWF0dXJlc0V4cGFuZGVkW3N1YlR5cGVdXG5cdFx0XHQ/IG51bGxcblx0XHRcdDogbShCdXR0b24sIHtcblx0XHRcdFx0XHRsYWJlbDogXCJwcmljaW5nLnNob3dBbGxGZWF0dXJlc1wiLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdGNsaWNrOiAoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuZmVhdHVyZXNFeHBhbmRlZFtzdWJUeXBlXSA9ICF0aGlzLmZlYXR1cmVzRXhwYW5kZWRbc3ViVHlwZV1cblx0XHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0fSxcblx0XHRcdCAgfSlcblx0fVxufVxuXG5mdW5jdGlvbiBsb2NhbGl6ZUZlYXR1cmVMaXN0SXRlbShcblx0aXRlbTogRmVhdHVyZUxpc3RJdGVtLFxuXHR0YXJnZXRTdWJzY3JpcHRpb246IFBsYW5UeXBlLFxuXHRhdHRyczogU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyLFxuKTogQnV5T3B0aW9uRGV0YWlsc0F0dHJbXCJjYXRlZ29yaWVzXCJdWzBdW1wiZmVhdHVyZXNcIl1bMF0gfCBudWxsIHtcblx0Y29uc3QgdGV4dCA9IHRyeUdldFRyYW5zbGF0aW9uKGl0ZW0udGV4dCwgZ2V0UmVwbGFjZW1lbnQoaXRlbS5yZXBsYWNlbWVudHMsIHRhcmdldFN1YnNjcmlwdGlvbiwgYXR0cnMpKVxuXHRpZiAodGV4dCA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXHRpZiAoIWl0ZW0udG9vbFRpcCkge1xuXHRcdHJldHVybiB7IHRleHQsIGtleTogaXRlbS50ZXh0LCBhbnRpRmVhdHVyZTogaXRlbS5hbnRpRmVhdHVyZSwgb21pdDogaXRlbS5vbWl0LCBoZWFydDogISFpdGVtLmhlYXJ0IH1cblx0fSBlbHNlIHtcblx0XHRjb25zdCB0b29sVGlwVGV4dCA9IHRyeUdldFRyYW5zbGF0aW9uKGl0ZW0udG9vbFRpcClcblx0XHRpZiAodG9vbFRpcFRleHQgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHRcdGNvbnN0IHRvb2xUaXAgPSBpdGVtLnRvb2xUaXAuZW5kc1dpdGgoXCJfbWFya2Rvd25cIikgPyBtLnRydXN0KHRvb2xUaXBUZXh0KSA6IHRvb2xUaXBUZXh0XG5cdFx0cmV0dXJuIHsgdGV4dCwgdG9vbFRpcCwga2V5OiBpdGVtLnRleHQsIGFudGlGZWF0dXJlOiBpdGVtLmFudGlGZWF0dXJlLCBvbWl0OiBpdGVtLm9taXQsIGhlYXJ0OiAhIWl0ZW0uaGVhcnQgfVxuXHR9XG59XG5cbmZ1bmN0aW9uIGxvY2FsaXplRmVhdHVyZUNhdGVnb3J5KFxuXHRjYXRlZ29yeTogRmVhdHVyZUNhdGVnb3J5LFxuXHR0YXJnZXRTdWJzY3JpcHRpb246IFBsYW5UeXBlLFxuXHRhdHRyczogU3Vic2NyaXB0aW9uU2VsZWN0b3JBdHRyLFxuKTogQnV5T3B0aW9uRGV0YWlsc0F0dHJbXCJjYXRlZ29yaWVzXCJdWzBdIHwgbnVsbCB7XG5cdGNvbnN0IHRpdGxlID0gdHJ5R2V0VHJhbnNsYXRpb24oY2F0ZWdvcnkudGl0bGUpXG5cdGNvbnN0IGZlYXR1cmVzID0gZG93bmNhc3Q8eyB0ZXh0OiBzdHJpbmc7IHRvb2xUaXA/OiBtLkNoaWxkOyBrZXk6IHN0cmluZzsgYW50aUZlYXR1cmU/OiBib29sZWFuIHwgdW5kZWZpbmVkOyBvbWl0OiBib29sZWFuOyBoZWFydDogYm9vbGVhbiB9W10+KFxuXHRcdGNhdGVnb3J5LmZlYXR1cmVzLm1hcCgoZikgPT4gbG9jYWxpemVGZWF0dXJlTGlzdEl0ZW0oZiwgdGFyZ2V0U3Vic2NyaXB0aW9uLCBhdHRycykpLmZpbHRlcigoaXQpID0+IGl0ICE9IG51bGwpLFxuXHQpXG5cdHJldHVybiB7IHRpdGxlLCBrZXk6IGNhdGVnb3J5LnRpdGxlLCBmZWF0dXJlcywgZmVhdHVyZUNvdW50OiBjYXRlZ29yeS5mZWF0dXJlQ291bnQgfVxufVxuXG5mdW5jdGlvbiB0cnlHZXRUcmFuc2xhdGlvbihrZXk6IFRyYW5zbGF0aW9uS2V5LCByZXBsYWNlbWVudHM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXI+KTogc3RyaW5nIHwgbnVsbCB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0KGtleSwgcmVwbGFjZW1lbnRzKVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0Y29uc29sZS5sb2coXCJjb3VsZCBub3QgdHJhbnNsYXRlIGZlYXR1cmUgdGV4dCBmb3Iga2V5XCIsIGtleSwgXCJoaWRpbmcgZmVhdHVyZSBpdGVtXCIpXG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuXG4vKipcbiAqIGdldCBhIHN0cmluZyB0byBpbnNlcnQgaW50byBhIHRyYW5zbGF0aW9uIHdpdGggYSBzbG90LlxuICogaWYgbm8ga2V5IGlzIGZvdW5kLCB1bmRlZmluZWQgaXMgcmV0dXJuZWQgYW5kIG5vdGhpbmcgaXMgcmVwbGFjZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXBsYWNlbWVudChcblx0a2V5OiBSZXBsYWNlbWVudEtleSB8IHVuZGVmaW5lZCxcblx0c3Vic2NyaXB0aW9uOiBQbGFuVHlwZSxcblx0YXR0cnM6IFN1YnNjcmlwdGlvblNlbGVjdG9yQXR0cixcbik6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4gfCB1bmRlZmluZWQge1xuXHRjb25zdCB7IHByaWNlQW5kQ29uZmlnUHJvdmlkZXIgfSA9IGF0dHJzXG5cdHN3aXRjaCAoa2V5KSB7XG5cdFx0Y2FzZSBcImN1c3RvbURvbWFpbnNcIjpcblx0XHRcdHJldHVybiB7IFwie2Ftb3VudH1cIjogcHJpY2VBbmRDb25maWdQcm92aWRlci5nZXRQbGFuUHJpY2VzRm9yUGxhbihzdWJzY3JpcHRpb24pLmN1c3RvbURvbWFpbnMgfVxuXHRcdGNhc2UgXCJtYWlsQWRkcmVzc0FsaWFzZXNcIjpcblx0XHRcdHJldHVybiB7IFwie2Ftb3VudH1cIjogcHJpY2VBbmRDb25maWdQcm92aWRlci5nZXRQbGFuUHJpY2VzRm9yUGxhbihzdWJzY3JpcHRpb24pLmluY2x1ZGVkQWxpYXNlcyB9XG5cdFx0Y2FzZSBcInN0b3JhZ2VcIjpcblx0XHRcdHJldHVybiB7IFwie2Ftb3VudH1cIjogcHJpY2VBbmRDb25maWdQcm92aWRlci5nZXRQbGFuUHJpY2VzRm9yUGxhbihzdWJzY3JpcHRpb24pLmluY2x1ZGVkU3RvcmFnZSB9XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0SGVscExhYmVsKHBsYW5UeXBlOiBQbGFuVHlwZSwgYnVzaW5lc3NVc2U6IGJvb2xlYW4pOiBUcmFuc2xhdGlvbktleSB7XG5cdGlmIChwbGFuVHlwZSA9PT0gUGxhblR5cGUuRnJlZSkgcmV0dXJuIFwicHJpY2luZy51cGdyYWRlTGF0ZXJfbXNnXCJcblx0cmV0dXJuIGJ1c2luZXNzVXNlID8gXCJwcmljaW5nLmV4Y2x1ZGVzVGF4ZXNfbXNnXCIgOiBcInByaWNpbmcuaW5jbHVkZXNUYXhlc19tc2dcIlxufVxuXG5mdW5jdGlvbiBnZXRQcmljZUhpbnQoc3Vic2NyaXB0aW9uUHJpY2U6IG51bWJlciwgcGF5bWVudEludGVydmFsOiBQYXltZW50SW50ZXJ2YWwsIG11bHRpdXNlcjogYm9vbGVhbik6IHN0cmluZyB7XG5cdGlmIChzdWJzY3JpcHRpb25QcmljZSA+IDApIHtcblx0XHRpZiAobXVsdGl1c2VyKSB7XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQocGF5bWVudEludGVydmFsID09PSBQYXltZW50SW50ZXJ2YWwuWWVhcmx5ID8gXCJwcmljaW5nLnBlclVzZXJNb250aFBhaWRZZWFybHlfbGFiZWxcIiA6IFwicHJpY2luZy5wZXJVc2VyTW9udGhfbGFiZWxcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0KHBheW1lbnRJbnRlcnZhbCA9PT0gUGF5bWVudEludGVydmFsLlllYXJseSA/IFwicHJpY2luZy5wZXJNb250aFBhaWRZZWFybHlfbGFiZWxcIiA6IFwicHJpY2luZy5wZXJNb250aF9sYWJlbFwiKVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gXCJcIlxufVxuIiwiaW1wb3J0IHsgQm9va2luZ0l0ZW1GZWF0dXJlVHlwZSwgRmVhdHVyZVR5cGUsIExlZ2FjeVBsYW5zLCBQbGFuVHlwZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB0eXBlIHsgQWNjb3VudGluZ0luZm8sIEJvb2tpbmcsIEN1c3RvbWVyIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgYXNQYXltZW50SW50ZXJ2YWwsIFBheW1lbnRJbnRlcnZhbCB9IGZyb20gXCIuL1ByaWNlVXRpbHNcIlxuaW1wb3J0IHsgaXNDdXN0b21pemF0aW9uRW5hYmxlZEZvckN1c3RvbWVyIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvQ3VzdG9tZXJVdGlscy5qc1wiXG5cbmV4cG9ydCB0eXBlIEN1cnJlbnRQbGFuSW5mbyA9IHtcblx0YnVzaW5lc3NVc2U6IGJvb2xlYW5cblx0cGxhblR5cGU6IFBsYW5UeXBlXG5cdHBheW1lbnRJbnRlcnZhbDogUGF5bWVudEludGVydmFsXG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hTdWJzY3JpcHRpb25EaWFsb2dNb2RlbCB7XG5cdGN1cnJlbnRQbGFuSW5mbzogQ3VycmVudFBsYW5JbmZvXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjdXN0b21lcjogQ3VzdG9tZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBwbGFuVHlwZTogUGxhblR5cGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBsYXN0Qm9va2luZzogQm9va2luZyxcblx0KSB7XG5cdFx0dGhpcy5jdXJyZW50UGxhbkluZm8gPSB0aGlzLl9pbml0Q3VycmVudFBsYW5JbmZvKClcblx0fVxuXG5cdF9pbml0Q3VycmVudFBsYW5JbmZvKCk6IEN1cnJlbnRQbGFuSW5mbyB7XG5cdFx0Y29uc3QgcGF5bWVudEludGVydmFsOiBQYXltZW50SW50ZXJ2YWwgPSBhc1BheW1lbnRJbnRlcnZhbCh0aGlzLmFjY291bnRpbmdJbmZvLnBheW1lbnRJbnRlcnZhbClcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnVzaW5lc3NVc2U6IHRoaXMuY3VzdG9tZXIuYnVzaW5lc3NVc2UsXG5cdFx0XHRwbGFuVHlwZTogdGhpcy5wbGFuVHlwZSxcblx0XHRcdHBheW1lbnRJbnRlcnZhbCxcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2sgaWYgdGhlIHVzZXIncyBjdXJyZW50IHBsYW4gaGFzIG11bHRpcGxlIHVzZXJzIGR1ZSB0byBhIGxlZ2FjeSBhZ3JlZW1lbnQgYW5kIHdpbGwgY29udGludWUgdG8gZG8gc28gaWYgdGhlIHVzZXIgc3dpdGNoZXMgcGxhbnMuXG5cdCAqXG5cdCAqIEByZXR1cm4gdHJ1ZSBpZiBtdWx0aXBsZSB1c2VycyBhcmUgc3VwcG9ydGVkIGR1ZSB0byBsZWdhY3ksIGZhbHNlIGlmIG5vdDsgbm90ZSB0aGF0IHJldHVybmluZyBmYWxzZSBkb2VzIG5vdCBtZWFuIHRoYXQgdGhlIGN1cnJlbnQgcGxhbiBkb2VzIG5vdCBhY3R1YWxseSBzdXBwb3J0IG11bHRpcGxlIHVzZXJzXG5cdCAqL1xuXHRtdWx0aXBsZVVzZXJzU3RpbGxTdXBwb3J0ZWRMZWdhY3koKTogYm9vbGVhbiB7XG5cdFx0aWYgKGlzQ3VzdG9taXphdGlvbkVuYWJsZWRGb3JDdXN0b21lcih0aGlzLmN1c3RvbWVyLCBGZWF0dXJlVHlwZS5NdWx0aXBsZVVzZXJzKSkge1xuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHRpZiAoTGVnYWN5UGxhbnMuaW5jbHVkZXModGhpcy5wbGFuVHlwZSkpIHtcblx0XHRcdGNvbnN0IHVzZXJJdGVtID0gdGhpcy5sYXN0Qm9va2luZy5pdGVtcy5maW5kKChpdGVtKSA9PiBpdGVtLmZlYXR1cmVUeXBlID09PSBCb29raW5nSXRlbUZlYXR1cmVUeXBlLkxlZ2FjeVVzZXJzKVxuXHRcdFx0Y29uc3Qgc2hhcmVkTWFpbEl0ZW0gPSB0aGlzLmxhc3RCb29raW5nLml0ZW1zLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZmVhdHVyZVR5cGUgPT09IEJvb2tpbmdJdGVtRmVhdHVyZVR5cGUuU2hhcmVkTWFpbEdyb3VwKVxuXHRcdFx0Y29uc3QgbG9jYWxBZG1pbkl0ZW0gPSB0aGlzLmxhc3RCb29raW5nLml0ZW1zLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZmVhdHVyZVR5cGUgPT09IEJvb2tpbmdJdGVtRmVhdHVyZVR5cGUuTG9jYWxBZG1pbkdyb3VwKVxuXG5cdFx0XHQvLyBBIHVzZXIgdGhhdCBoYXMgUGxhblR5cGUuUHJlbWl1bSB3aWxsIGFsd2F5cyBoYXZlIExlZ2FjeVVzZXJzIGJvb2tlZC5cblx0XHRcdGNvbnN0IHVzZXJDb3VudCA9IE51bWJlcih1c2VySXRlbT8uY3VycmVudENvdW50KVxuXG5cdFx0XHQvLyBUaGVzZSBtYXkgYmUgYm9va2VkIGJ1dCBub3QgYWx3YXlzLlxuXHRcdFx0Y29uc3Qgc2hhcmVkTWFpbENvdW50ID0gc2hhcmVkTWFpbEl0ZW0gPyBOdW1iZXIoc2hhcmVkTWFpbEl0ZW0uY3VycmVudENvdW50KSA6IDBcblx0XHRcdGNvbnN0IGxvY2FsQWRtaW5Db3VudCA9IGxvY2FsQWRtaW5JdGVtID8gTnVtYmVyKGxvY2FsQWRtaW5JdGVtLmN1cnJlbnRDb3VudCkgOiAwXG5cblx0XHRcdHJldHVybiB1c2VyQ291bnQgKyBzaGFyZWRNYWlsQ291bnQgKyBsb2NhbEFkbWluQ291bnQgPiAxXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB0eXBlIHsgQ291bnRyeSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0NvdW50cnlMaXN0XCJcbmltcG9ydCB7IENvdW50cmllcywgQ291bnRyeVR5cGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9Db3VudHJ5TGlzdFwiXG5pbXBvcnQgeyBIdG1sRWRpdG9yLCBIdG1sRWRpdG9yTW9kZSB9IGZyb20gXCIuLi9ndWkvZWRpdG9yL0h0bWxFZGl0b3JcIlxuaW1wb3J0IHR5cGUgeyBMb2NhdGlvblNlcnZpY2VHZXRSZXR1cm4gfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyByZW5kZXJDb3VudHJ5RHJvcGRvd24gfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvR3VpVXRpbHNcIlxuaW1wb3J0IHsgVGV4dEZpZWxkIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgdHlwZSB7IEludm9pY2VEYXRhIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgTG9jYXRpb25TZXJ2aWNlIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvU2VydmljZXNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IFVzYWdlVGVzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXNhZ2V0ZXN0c1wiXG5cbmV4cG9ydCBlbnVtIEludm9pY2VEYXRhSW5wdXRMb2NhdGlvbiB7XG5cdEluV2l6YXJkID0gMCxcblx0T3RoZXIgPSAxLFxufVxuXG5leHBvcnQgY2xhc3MgSW52b2ljZURhdGFJbnB1dCBpbXBsZW1lbnRzIENvbXBvbmVudCB7XG5cdHByaXZhdGUgcmVhZG9ubHkgaW52b2ljZUFkZHJlc3NDb21wb25lbnQ6IEh0bWxFZGl0b3Jcblx0cHVibGljIHJlYWRvbmx5IHNlbGVjdGVkQ291bnRyeTogU3RyZWFtPENvdW50cnkgfCBudWxsPlxuXHRwcml2YXRlIHZhdE51bWJlcjogc3RyaW5nID0gXCJcIlxuXHRwcml2YXRlIF9fcGF5bWVudFBheXBhbFRlc3Q/OiBVc2FnZVRlc3RcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIGJ1c2luZXNzVXNlOiBib29sZWFuLCBpbnZvaWNlRGF0YTogSW52b2ljZURhdGEsIHByaXZhdGUgcmVhZG9ubHkgbG9jYXRpb24gPSBJbnZvaWNlRGF0YUlucHV0TG9jYXRpb24uT3RoZXIpIHtcblx0XHR0aGlzLl9fcGF5bWVudFBheXBhbFRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInBheW1lbnQucGF5cGFsXCIpXG5cblx0XHR0aGlzLmludm9pY2VBZGRyZXNzQ29tcG9uZW50ID0gbmV3IEh0bWxFZGl0b3IoKVxuXHRcdFx0LnNldFN0YXRpY051bWJlck9mTGluZXMoNSlcblx0XHRcdC5zaG93Qm9yZGVycygpXG5cdFx0XHQuc2V0UGxhY2Vob2xkZXJJZChcImludm9pY2VBZGRyZXNzX2xhYmVsXCIpXG5cdFx0XHQuc2V0TW9kZShIdG1sRWRpdG9yTW9kZS5IVE1MKVxuXHRcdFx0LnNldEh0bWxNb25vc3BhY2UoZmFsc2UpXG5cdFx0XHQuc2V0VmFsdWUoaW52b2ljZURhdGEuaW52b2ljZUFkZHJlc3MpXG5cblx0XHR0aGlzLnNlbGVjdGVkQ291bnRyeSA9IHN0cmVhbShpbnZvaWNlRGF0YS5jb3VudHJ5KVxuXG5cdFx0dGhpcy52aWV3ID0gdGhpcy52aWV3LmJpbmQodGhpcylcblx0XHR0aGlzLm9uY3JlYXRlID0gdGhpcy5vbmNyZWF0ZS5iaW5kKHRoaXMpXG5cdH1cblxuXHR2aWV3KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0dGhpcy5idXNpbmVzc1VzZSB8fCB0aGlzLmxvY2F0aW9uICE9PSBJbnZvaWNlRGF0YUlucHV0TG9jYXRpb24uSW5XaXphcmRcblx0XHRcdFx0PyBtKFwiXCIsIFtcblx0XHRcdFx0XHRcdG0oXCIucHRcIiwgbSh0aGlzLmludm9pY2VBZGRyZXNzQ29tcG9uZW50KSksXG5cdFx0XHRcdFx0XHRtKFwiLnNtYWxsXCIsIGxhbmcuZ2V0KHRoaXMuYnVzaW5lc3NVc2UgPyBcImludm9pY2VBZGRyZXNzSW5mb0J1c2luZXNzX21zZ1wiIDogXCJpbnZvaWNlQWRkcmVzc0luZm9Qcml2YXRlX21zZ1wiKSksXG5cdFx0XHRcdCAgXSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0cmVuZGVyQ291bnRyeURyb3Bkb3duKHtcblx0XHRcdFx0c2VsZWN0ZWRDb3VudHJ5OiB0aGlzLnNlbGVjdGVkQ291bnRyeSgpLFxuXHRcdFx0XHRvblNlbGVjdGlvbkNoYW5nZWQ6IHRoaXMuc2VsZWN0ZWRDb3VudHJ5LFxuXHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+IGxhbmcuZ2V0KFwiaW52b2ljZUNvdW50cnlJbmZvQ29uc3VtZXJfbXNnXCIpLFxuXHRcdFx0fSksXG5cdFx0XHR0aGlzLmlzVmF0SWRGaWVsZFZpc2libGUoKVxuXHRcdFx0XHQ/IG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJpbnZvaWNlVmF0SWROb19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0dmFsdWU6IHRoaXMudmF0TnVtYmVyLFxuXHRcdFx0XHRcdFx0b25pbnB1dDogKHZhbHVlKSA9PiAodGhpcy52YXROdW1iZXIgPSB2YWx1ZSksXG5cdFx0XHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+IGxhbmcuZ2V0KFwiaW52b2ljZVZhdElkTm9JbmZvQnVzaW5lc3NfbXNnXCIpLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbnVsbCxcblx0XHRdXG5cdH1cblxuXHRvbmNyZWF0ZSgpIHtcblx0XHRsb2NhdG9yLnNlcnZpY2VFeGVjdXRvci5nZXQoTG9jYXRpb25TZXJ2aWNlLCBudWxsKS50aGVuKChsb2NhdGlvbjogTG9jYXRpb25TZXJ2aWNlR2V0UmV0dXJuKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2VsZWN0ZWRDb3VudHJ5KCkpIHtcblx0XHRcdFx0Y29uc3QgY291bnRyeSA9IENvdW50cmllcy5maW5kKChjKSA9PiBjLmEgPT09IGxvY2F0aW9uLmNvdW50cnkpXG5cblx0XHRcdFx0aWYgKGNvdW50cnkpIHtcblx0XHRcdFx0XHR0aGlzLnNlbGVjdGVkQ291bnRyeShjb3VudHJ5KVxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHR2YWxpZGF0ZUludm9pY2VEYXRhKCk6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCB7XG5cdFx0Y29uc3QgYWRkcmVzcyA9IHRoaXMuZ2V0QWRkcmVzcygpXG5cdFx0Y29uc3QgY291bnRyeVNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZENvdW50cnkoKSAhPSBudWxsXG5cblx0XHRpZiAodGhpcy5idXNpbmVzc1VzZSkge1xuXHRcdFx0aWYgKGFkZHJlc3MudHJpbSgpID09PSBcIlwiIHx8IGFkZHJlc3Muc3BsaXQoXCJcXG5cIikubGVuZ3RoID4gNSkge1xuXHRcdFx0XHRyZXR1cm4gXCJpbnZvaWNlQWRkcmVzc0luZm9CdXNpbmVzc19tc2dcIlxuXHRcdFx0fSBlbHNlIGlmICghY291bnRyeVNlbGVjdGVkKSB7XG5cdFx0XHRcdHJldHVybiBcImludm9pY2VDb3VudHJ5SW5mb0J1c2luZXNzX21zZ1wiXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghY291bnRyeVNlbGVjdGVkKSB7XG5cdFx0XHRcdHJldHVybiBcImludm9pY2VDb3VudHJ5SW5mb0J1c2luZXNzX21zZ1wiIC8vIHVzZSBidXNpbmVzcyB0ZXh0IGhlcmUgYmVjYXVzZSBpdCBmaXRzIGJldHRlclxuXHRcdFx0fSBlbHNlIGlmIChhZGRyZXNzLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCA+IDQpIHtcblx0XHRcdFx0cmV0dXJuIFwiaW52b2ljZUFkZHJlc3NJbmZvQnVzaW5lc3NfbXNnXCJcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fX3BheW1lbnRQYXlwYWxUZXN0Py5nZXRTdGFnZSgzKS5jb21wbGV0ZSgpXG5cdFx0Ly8gbm8gZXJyb3Jcblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0Z2V0SW52b2ljZURhdGEoKTogSW52b2ljZURhdGEge1xuXHRcdGNvbnN0IGFkZHJlc3MgPSB0aGlzLmdldEFkZHJlc3MoKVxuXHRcdGNvbnN0IHNlbGVjdGVkQ291bnRyeSA9IHRoaXMuc2VsZWN0ZWRDb3VudHJ5KClcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW52b2ljZUFkZHJlc3M6IGFkZHJlc3MsXG5cdFx0XHRjb3VudHJ5OiBzZWxlY3RlZENvdW50cnksXG5cdFx0XHR2YXROdW1iZXI6IHNlbGVjdGVkQ291bnRyeT8udCA9PT0gQ291bnRyeVR5cGUuRVUgJiYgdGhpcy5idXNpbmVzc1VzZSA/IHRoaXMudmF0TnVtYmVyIDogXCJcIixcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGlzVmF0SWRGaWVsZFZpc2libGUoKTogYm9vbGVhbiB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWRDb3VudHJ5ID0gdGhpcy5zZWxlY3RlZENvdW50cnkoKVxuXHRcdHJldHVybiB0aGlzLmJ1c2luZXNzVXNlICYmIHNlbGVjdGVkQ291bnRyeSAhPSBudWxsICYmIHNlbGVjdGVkQ291bnRyeS50ID09PSBDb3VudHJ5VHlwZS5FVVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRBZGRyZXNzKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMuaW52b2ljZUFkZHJlc3NDb21wb25lbnRcblx0XHRcdC5nZXRWYWx1ZSgpXG5cdFx0XHQuc3BsaXQoXCJcXG5cIilcblx0XHRcdC5maWx0ZXIoKGxpbmUpID0+IGxpbmUudHJpbSgpLmxlbmd0aCA+IDApXG5cdFx0XHQuam9pbihcIlxcblwiKVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEF1dG9jb21wbGV0ZSwgVGV4dEZpZWxkIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBTaW1wbGlmaWVkQ3JlZGl0Q2FyZFZpZXdNb2RlbCB9IGZyb20gXCIuL1NpbXBsaWZpZWRDcmVkaXRDYXJkSW5wdXRNb2RlbC5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IFN0YWdlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11c2FnZXRlc3RzXCJcbmltcG9ydCB7IENyZWRpdENhcmQgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5cbmV4cG9ydCB0eXBlIFNpbXBsaWZpZWRDcmVkaXRDYXJkQXR0cnMgPSB7XG5cdHZpZXdNb2RlbDogU2ltcGxpZmllZENyZWRpdENhcmRWaWV3TW9kZWxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDQ1ZpZXdNb2RlbCB7XG5cdHZhbGlkYXRlQ3JlZGl0Q2FyZFBheW1lbnREYXRhKCk6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbFxuXG5cdHNldENyZWRpdENhcmREYXRhKGRhdGE6IENyZWRpdENhcmQgfCBudWxsKTogdm9pZFxuXG5cdGdldENyZWRpdENhcmREYXRhKCk6IENyZWRpdENhcmRcbn1cblxuLy8gY2hhbmdpbmcgdGhlIGNvbnRlbnQgKGllIGdyb3VwaW5nKSBzZXRzIHNlbGVjdGlvbiB0byB0aGUgZW5kLCB0aGlzIHJlc3RvcmVzIGl0IGFmdGVyIHRoZSBuZXh0IHJlZHJhdy5cbmZ1bmN0aW9uIHJlc3RvcmVTZWxlY3Rpb24oZG9tSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpIHtcblx0Y29uc3QgeyBzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kLCBzZWxlY3Rpb25EaXJlY3Rpb24gfSA9IGRvbUlucHV0XG5cdGNvbnN0IGlzQXRFbmQgPSBkb21JbnB1dC52YWx1ZS5sZW5ndGggPT09IHNlbGVjdGlvblN0YXJ0XG5cdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdGNvbnN0IGN1cnJlbnRMZW5ndGggPSBkb21JbnB1dC52YWx1ZS5sZW5ndGhcblx0XHQvLyB3ZSdyZSBhZGRpbmcgY2hhcmFjdGVycywgc28ganVzdCByZS11c2luZyB0aGUgaW5kZXggZmFpbHMgYmVjYXVzZSBhdCB0aGUgdGltZSB3ZSBzZXQgdGhlIHNlbGVjdGlvbiwgdGhlIHN0cmluZyBpcyBsb25nZXIgdGhhbiBpdCB3YXMuXG5cdFx0Ly8gdGhpcyBtb3N0bHkgd29ya3MsIGJ1dCBmYWlscyBpbiBjYXNlcyB3aGVyZSB3ZSdyZSBhZGRpbmcgc3R1ZmYgaW4gdGhlIG1pZGRsZSBvZiB0aGUgc3RyaW5nLlxuXHRcdGRvbUlucHV0LnNldFNlbGVjdGlvblJhbmdlKGlzQXRFbmQgPyBjdXJyZW50TGVuZ3RoIDogc2VsZWN0aW9uU3RhcnQsIGlzQXRFbmQgPyBjdXJyZW50TGVuZ3RoIDogc2VsZWN0aW9uRW5kLCBzZWxlY3Rpb25EaXJlY3Rpb24gPz8gdW5kZWZpbmVkKVxuXHR9LCAwKVxufVxuXG5leHBvcnQgY2xhc3MgU2ltcGxpZmllZENyZWRpdENhcmRJbnB1dCBpbXBsZW1lbnRzIENvbXBvbmVudDxTaW1wbGlmaWVkQ3JlZGl0Q2FyZEF0dHJzPiB7XG5cdGRhdGVGaWVsZExlZnQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRudW1iZXJGaWVsZExlZnQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRjdnZGaWVsZExlZnQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRjY051bWJlckRvbTogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsXG5cdGV4cERhdGVEb206IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdHZpZXcodm5vZGU6IFZub2RlPFNpbXBsaWZpZWRDcmVkaXRDYXJkQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGxldCB7IHZpZXdNb2RlbCB9ID0gdm5vZGUuYXR0cnNcblxuXHRcdHJldHVybiBbXG5cdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRsYWJlbDogXCJjcmVkaXRDYXJkTnVtYmVyX2xhYmVsXCIsXG5cdFx0XHRcdGhlbHBMYWJlbDogKCkgPT4gdGhpcy5yZW5kZXJDY051bWJlckhlbHBMYWJlbCh2aWV3TW9kZWwpLFxuXHRcdFx0XHR2YWx1ZTogdmlld01vZGVsLmNyZWRpdENhcmROdW1iZXIsXG5cdFx0XHRcdG9uaW5wdXQ6IChuZXdWYWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHZpZXdNb2RlbC5jcmVkaXRDYXJkTnVtYmVyID0gbmV3VmFsdWVcblx0XHRcdFx0XHRyZXN0b3JlU2VsZWN0aW9uKHRoaXMuY2NOdW1iZXJEb20hKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmJsdXI6ICgpID0+ICh0aGlzLm51bWJlckZpZWxkTGVmdCA9IHRydWUpLFxuXHRcdFx0XHRhdXRvY29tcGxldGVBczogQXV0b2NvbXBsZXRlLmNjTnVtYmVyLFxuXHRcdFx0XHRvbkRvbUlucHV0Q3JlYXRlZDogKGRvbSkgPT4gKHRoaXMuY2NOdW1iZXJEb20gPSBkb20pLFxuXHRcdFx0fSksXG5cdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRsYWJlbDogXCJjcmVkaXRDYXJkRXhwaXJhdGlvbkRhdGVXaXRoRm9ybWF0X2xhYmVsXCIsXG5cdFx0XHRcdHZhbHVlOiB2aWV3TW9kZWwuZXhwaXJhdGlvbkRhdGUsXG5cdFx0XHRcdC8vIHdlIG9ubHkgc2hvdyB0aGUgaGludCBpZiB0aGUgZmllbGQgaXMgbm90IGVtcHR5IGFuZCBub3Qgc2VsZWN0ZWQgdG8gYXZvaWQgc2hvd2luZyBlcnJvcnMgd2hpbGUgdGhlIHVzZXIgaXMgdHlwaW5nLlxuXHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+ICh0aGlzLmRhdGVGaWVsZExlZnQgPyBsYW5nLmdldCh2aWV3TW9kZWwuZ2V0RXhwaXJhdGlvbkRhdGVFcnJvckhpbnQoKSA/PyBcImVtcHR5U3RyaW5nX21zZ1wiKSA6IGxhbmcuZ2V0KFwiZW1wdHlTdHJpbmdfbXNnXCIpKSxcblx0XHRcdFx0b25ibHVyOiAoKSA9PiAodGhpcy5kYXRlRmllbGRMZWZ0ID0gdHJ1ZSksXG5cdFx0XHRcdG9uaW5wdXQ6IChuZXdWYWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHZpZXdNb2RlbC5leHBpcmF0aW9uRGF0ZSA9IG5ld1ZhbHVlXG5cdFx0XHRcdFx0cmVzdG9yZVNlbGVjdGlvbih0aGlzLmV4cERhdGVEb20hKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkRvbUlucHV0Q3JlYXRlZDogKGRvbSkgPT4gKHRoaXMuZXhwRGF0ZURvbSA9IGRvbSksXG5cdFx0XHRcdGF1dG9jb21wbGV0ZUFzOiBBdXRvY29tcGxldGUuY2NFeHAsXG5cdFx0XHR9KSxcblx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImN2dlwiLCB2aWV3TW9kZWwuZ2V0Q3Z2TGFiZWwoKSksXG5cdFx0XHRcdHZhbHVlOiB2aWV3TW9kZWwuY3Z2LFxuXHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+IHRoaXMucmVuZGVyQ3Z2TnVtYmVySGVscExhYmVsKHZpZXdNb2RlbCksXG5cdFx0XHRcdG9uaW5wdXQ6IChuZXdWYWx1ZSkgPT4gKHZpZXdNb2RlbC5jdnYgPSBuZXdWYWx1ZSksXG5cdFx0XHRcdG9uYmx1cjogKCkgPT4gKHRoaXMuY3Z2RmllbGRMZWZ0ID0gdHJ1ZSksXG5cdFx0XHRcdGF1dG9jb21wbGV0ZUFzOiBBdXRvY29tcGxldGUuY2NDc2MsXG5cdFx0XHR9KSxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNjTnVtYmVySGVscExhYmVsKG1vZGVsOiBTaW1wbGlmaWVkQ3JlZGl0Q2FyZFZpZXdNb2RlbCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBoaW50ID0gbW9kZWwuZ2V0Q3JlZGl0Q2FyZE51bWJlckhpbnQoKVxuXHRcdGNvbnN0IGVycm9yID0gbW9kZWwuZ2V0Q3JlZGl0Q2FyZE51bWJlckVycm9ySGludCgpXG5cdFx0Ly8gd2Ugb25seSBkcmF3IHRoZSBoaW50IGlmIHRoZSBudW1iZXIgZmllbGQgd2FzIGVudGVyZWQgJiBleGl0ZWQgYmVmb3JlXG5cdFx0aWYgKHRoaXMubnVtYmVyRmllbGRMZWZ0KSB7XG5cdFx0XHRpZiAoaGludCkge1xuXHRcdFx0XHRyZXR1cm4gZXJyb3IgPyBsYW5nLmdldChcImNyZWRpdENhcmRIaW50V2l0aEVycm9yX21zZ1wiLCB7IFwie2hpbnR9XCI6IGhpbnQsIFwie2Vycm9yVGV4dH1cIjogZXJyb3IgfSkgOiBoaW50XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gZXJyb3IgPyBlcnJvciA6IGxhbmcuZ2V0KFwiZW1wdHlTdHJpbmdfbXNnXCIpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBoaW50ID8/IGxhbmcuZ2V0KFwiZW1wdHlTdHJpbmdfbXNnXCIpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDdnZOdW1iZXJIZWxwTGFiZWwobW9kZWw6IFNpbXBsaWZpZWRDcmVkaXRDYXJkVmlld01vZGVsKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGN2dkhpbnQgPSBtb2RlbC5nZXRDdnZIaW50KClcblx0XHRjb25zdCBjdnZFcnJvciA9IG1vZGVsLmdldEN2dkVycm9ySGludCgpXG5cdFx0aWYgKHRoaXMuY3Z2RmllbGRMZWZ0KSB7XG5cdFx0XHRpZiAoY3Z2SGludCkge1xuXHRcdFx0XHRyZXR1cm4gY3Z2RXJyb3IgPyBsYW5nLmdldChcImNyZWRpdENhcmRIaW50V2l0aEVycm9yX21zZ1wiLCB7IFwie2hpbnR9XCI6IGN2dkhpbnQsIFwie2Vycm9yVGV4dH1cIjogY3Z2RXJyb3IgfSkgOiBjdnZIaW50XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY3Z2RXJyb3IgPyBjdnZFcnJvciA6IGxhbmcuZ2V0KFwiZW1wdHlTdHJpbmdfbXNnXCIpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBjdnZIaW50ID8/IGxhbmcuZ2V0KFwiZW1wdHlTdHJpbmdfbXNnXCIpXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVDcmVkaXRDYXJkLCBDcmVkaXRDYXJkIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgTGFuZ3VhZ2VWaWV3TW9kZWwsIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQ0NWaWV3TW9kZWwgfSBmcm9tIFwiLi9TaW1wbGlmaWVkQ3JlZGl0Q2FyZElucHV0LmpzXCJcbmltcG9ydCB7IGlzVmFsaWRDcmVkaXRDYXJkTnVtYmVyIH0gZnJvbSBcIi4uL21pc2MvRm9ybWF0VmFsaWRhdG9yLmpzXCJcbmltcG9ydCB7IHR5cGVkVmFsdWVzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5cbi8vIHdlJ3JlIHVzaW5nIHN0cmluZyB2YWx1ZXMgdG8gbWFrZSBpdCBlYXN5IHRvIGl0ZXJhdGUgYWxsIGNhcmQgdHlwZXNcbmV4cG9ydCBlbnVtIENhcmRUeXBlIHtcblx0QW1leCA9IFwiQW1leFwiLFxuXHRWaXNhID0gXCJWaXNhXCIsXG5cdE1hc3RlcmNhcmQgPSBcIk1hc3RlcmNhcmRcIixcblx0TWFlc3RybyA9IFwiTWFlc3Ryb1wiLFxuXHREaXNjb3ZlciA9IFwiRGlzY292ZXJcIixcblx0T3RoZXIgPSBcIk90aGVyXCIsXG59XG5cbi8qKlxuICogVHJpZXMgdG8gZmluZCB0aGUgY3JlZGl0IGNhcmQgaXNzdWVyIGJ5IGNyZWRpdCBjYXJkIG51bWJlci5cbiAqIFRoZXJlZm9yZSwgaXQgaXMgY2hlY2tlZCB3aGV0aGVyIHRoZSB0eXBlZCBpbiBudW1iZXIgaXMgaW4gYSBrbm93biByYW5nZS5cbiAqIElucHV0IE1VU1QgYmUgc2FuaXRpemVkIHRvIG9ubHkgY29udGFpbiBudW1lcmljYWwgZGlnaXRzXG4gKiBAcGFyYW0gY2MgdGhlIGNyZWRpdCBjYXJkIG51bWJlciB0eXBlZCBpbiBieSB0aGUgdXNlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FyZFR5cGVSYW5nZShjYzogc3RyaW5nKTogQ2FyZFR5cGUge1xuXHRmb3IgKGxldCBjYXJkVHlwZSBvZiB0eXBlZFZhbHVlcyhDYXJkVHlwZSkpIHtcblx0XHRpZiAoY2FyZFR5cGUgPT09IENhcmRUeXBlLk90aGVyKSBjb250aW51ZVxuXHRcdGZvciAobGV0IHJhbmdlIG9mIENhcmRQcmVmaXhSYW5nZXNbY2FyZFR5cGVdKSB7XG5cdFx0XHRjb25zdCBsb3dlc3RSYW5nZSA9IHJhbmdlWzBdLnBhZEVuZCg4LCBcIjBcIilcblx0XHRcdGNvbnN0IGhpZ2hlc3RSYW5nZSA9IHJhbmdlWzFdLnBhZEVuZCg4LCBcIjlcIilcblx0XHRcdGNvbnN0IGxvd2VzdENDID0gY2Muc2xpY2UoMCwgOCkucGFkRW5kKDgsIFwiMFwiKVxuXHRcdFx0Y29uc3QgaGlnaGVzdENDID0gY2Muc2xpY2UoMCwgOCkucGFkRW5kKDgsIFwiOVwiKVxuXHRcdFx0aWYgKGxvd2VzdFJhbmdlIDw9IGxvd2VzdENDICYmIGhpZ2hlc3RDQyA8PSBoaWdoZXN0UmFuZ2UpIHtcblx0XHRcdFx0cmV0dXJuIGNhcmRUeXBlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiBDYXJkVHlwZS5PdGhlclxufVxuXG50eXBlIENhcmRTcGVjID0geyBjdnZMZW5ndGg6IG51bWJlciB8IG51bGw7IGN2dk5hbWU6IHN0cmluZzsgbmFtZTogc3RyaW5nIHwgbnVsbCB9XG5cbi8vIHdlIGNhbid0IGhhdmUgZW51bXMgd2l0aFxuY29uc3QgQ2FyZFNwZWNzID0gT2JqZWN0LmZyZWV6ZSh7XG5cdFtDYXJkVHlwZS5WaXNhXTogeyBjdnZMZW5ndGg6IDMsIGN2dk5hbWU6IFwiQ1ZWXCIsIG5hbWU6IFwiVmlzYVwiIH0sXG5cdFtDYXJkVHlwZS5NYXN0ZXJjYXJkXTogeyBjdnZMZW5ndGg6IDMsIGN2dk5hbWU6IFwiQ1ZDXCIsIG5hbWU6IFwiTWFzdGVyY2FyZFwiIH0sXG5cdFtDYXJkVHlwZS5NYWVzdHJvXTogeyBjdnZMZW5ndGg6IDMsIGN2dk5hbWU6IFwiQ1ZWXCIsIG5hbWU6IFwiTWFlc3Ryb1wiIH0sXG5cdFtDYXJkVHlwZS5BbWV4XTogeyBjdnZMZW5ndGg6IDQsIGN2dk5hbWU6IFwiQ1NDXCIsIG5hbWU6IFwiQW1lcmljYW4gRXhwcmVzc1wiIH0sXG5cdFtDYXJkVHlwZS5EaXNjb3Zlcl06IHsgY3Z2TGVuZ3RoOiAzLCBjdnZOYW1lOiBcIkNWRFwiLCBuYW1lOiBcIkRpc2NvdmVyXCIgfSxcblx0W0NhcmRUeXBlLk90aGVyXTogeyBjdnZMZW5ndGg6IG51bGwsIGN2dk5hbWU6IFwiQ1ZWXCIsIG5hbWU6IG51bGwgfSxcbn0pXG5cbi8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BheW1lbnRfY2FyZF9udW1iZXJcbmNvbnN0IENhcmRQcmVmaXhSYW5nZXM6IFJlY29yZDxDYXJkVHlwZSwgTnVtYmVyU3RyaW5nW11bXT4gPSBPYmplY3QuZnJlZXplKHtcblx0W0NhcmRUeXBlLlZpc2FdOiBbW1wiNFwiLCBcIjRcIl1dLFxuXHRbQ2FyZFR5cGUuTWFzdGVyY2FyZF06IFtcblx0XHRbXCI1MVwiLCBcIjU1XCJdLFxuXHRcdFtcIjIyMjFcIiwgXCIyNzIwXCJdLFxuXHRdLFxuXHRbQ2FyZFR5cGUuTWFlc3Ryb106IFtcblx0XHRbXCI2NzU5XCIsIFwiNjc1OVwiXSxcblx0XHRbXCI2NzY3NzBcIiwgXCI2NzY3NzBcIl0sXG5cdFx0W1wiNjc2Nzc0XCIsIFwiNjc2Nzc0XCJdLFxuXHRcdFtcIjUwMThcIiwgXCI1MDE4XCJdLFxuXHRcdFtcIjUwMjBcIiwgXCI1MDIwXCJdLFxuXHRcdFtcIjUwMzhcIiwgXCI1MDM4XCJdLFxuXHRcdFtcIjU4OTNcIiwgXCI1ODkzXCJdLFxuXHRcdFtcIjYzMDRcIiwgXCI2MzA0XCJdLFxuXHRcdFtcIjY3NTlcIiwgXCI2NzU5XCJdLFxuXHRcdFtcIjY3NjFcIiwgXCI2NzYzXCJdLFxuXHRdLFxuXHRbQ2FyZFR5cGUuQW1leF06IFtcblx0XHRbXCIzNFwiLCBcIjM0XCJdLFxuXHRcdFtcIjM3XCIsIFwiMzdcIl0sXG5cdF0sXG5cdFtDYXJkVHlwZS5EaXNjb3Zlcl06IFtcblx0XHRbXCI2MDExXCIsIFwiNjAxMVwiXSxcblx0XHRbXCI2NDRcIiwgXCI2NDlcIl0sXG5cdFx0W1wiNjVcIiwgXCI2NVwiXSxcblx0XHRbXCI2MjIxMjZcIiwgXCI2MjI5MjVcIl0sXG5cdF0sXG5cdFtDYXJkVHlwZS5PdGhlcl06IFtbXV0sXG59KVxudHlwZSBTdHJpbmdJbnB1dENvcnJlY3RlciA9ICh2YWx1ZTogc3RyaW5nLCBvbGRWYWx1ZT86IHN0cmluZykgPT4gc3RyaW5nXG5cbmNvbnN0IGFsbERpZ2l0cyA9IFtcIjBcIiwgXCIxXCIsIFwiMlwiLCBcIjNcIiwgXCI0XCIsIFwiNVwiLCBcIjZcIiwgXCI3XCIsIFwiOFwiLCBcIjlcIl1cbmNvbnN0IGRlZmluaXRlTW9udGhEaWdpdHMgPSBbXCIyXCIsIFwiM1wiLCBcIjRcIiwgXCI1XCIsIFwiNlwiLCBcIjdcIiwgXCI4XCIsIFwiOVwiXVxuY29uc3Qgc2Vjb25kTW9udGhEaWdpdHMgPSBbXCIwXCIsIFwiMVwiLCBcIjJcIl1cbmNvbnN0IHNlcGFyYXRvciA9IFwiL1wiXG5jb25zdCBuaWNlU2VwYXJhdG9yID0gYCAke3NlcGFyYXRvcn0gYFxuXG4vKipcbiAqIGNvbXBsZXRlbHkgc3RyaXAgYWxsIHdoaXRlc3BhY2UgZnJvbSBhIHN0cmluZ1xuICogQHBhcmFtIHMgdGhlIHN0cmluZyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBzdHJpcFdoaXRlc3BhY2Uoczogc3RyaW5nKTogc3RyaW5nIHtcblx0cmV0dXJuIHMucmVwbGFjZSgvXFxzL2csIFwiXCIpXG59XG5cbmZ1bmN0aW9uIHN0cmlwTm9uRGlnaXRzKHM6IHN0cmluZyk6IHN0cmluZyB7XG5cdHJldHVybiBzLnJlcGxhY2UoL1xcRC9nLCBcIlwiKVxufVxuXG4vKipcbiAqIHRydWUgaWYgcyBjb250YWlucyBjaGFyYWN0ZXJzIGFuZCBhbGwgb2YgdGhlbSBhcmUgZGlnaXRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaWdpdFN0cmluZyhzOiBzdHJpbmcpIHtcblx0aWYgKHMubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2Vcblx0Y29uc3QgbWF0Y2hlcyA9IHMubWF0Y2goL1xcZC9nKVxuXHRyZXR1cm4gbWF0Y2hlcyAhPSBudWxsICYmIG1hdGNoZXMubGVuZ3RoID09PSBzLmxlbmd0aFxufVxuXG4vKipcbiAqIHRha2UgYSBmdW5jdGlvbiB0aGF0IGNvcnJlY3RzIHdoaXRlc3BhY2Ugb24gaW5wdXQgdGhhdCBkb2VzIG5vdCBjb250YWluIHdoaXRlc3BhY2VcbiAqIGFuZCByZXR1cm4gb25lIHRoYXQgZG9lcyB0aGUgc2FtZSBvbiBpbnB1dCB0aGF0IGNvbnRhaW5zIGFyYml0cmFyeSB3aGl0ZXNwYWNlLlxuICogQHBhcmFtIGZuIGEgZnVuY3Rpb24gdGhhdCBkb2VzIG5vdCBkZWFsIHdpdGggd2hpdGVzcGFjZS1jb250YWluaW5nIG9yIGVtcHR5IGlucHV0XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUlucHV0KGZuOiBTdHJpbmdJbnB1dENvcnJlY3Rlcik6IFN0cmluZ0lucHV0Q29ycmVjdGVyIHtcblx0cmV0dXJuICh2OiBzdHJpbmcsIG92OiBzdHJpbmcgPSBcIlwiKSA9PiB7XG5cdFx0diA9IHN0cmlwV2hpdGVzcGFjZSh2KVxuXHRcdGlmICh2ID09PSBcIlwiKSByZXR1cm4gdlxuXHRcdG92ID0gc3RyaXBXaGl0ZXNwYWNlKG92KVxuXHRcdHJldHVybiBmbih2LCBvdilcblx0fVxufVxuXG4vKlxuICogdGFrZSBkaWdpdHMgZnJvbSB0aGUgc3RhcnQgb2YgcmVzdCBhbmQgYWRkIHRoZW0gdG8gdGhlIGVuZCBvZiByZXQgdW50aWwgYSBub24tZGlnaXQgaXMgZW5jb3VudGVyZWQuXG4gKiBkaXNjYXJkcyByZXN0IGZyb20gZmlyc3Qgbm9uLWRpZ2l0LlxuICpcbiAqIHJldHVybnMgbW9kaWZpZWQgcmVzdCBhbmQgcmV0XG4gKi9cbmZ1bmN0aW9uIG5vbURpZ2l0c1VudGlsTGVuZ3RoKHJlc3Q6IHN0cmluZywgcmV0OiBzdHJpbmcsIGxlbmd0aDogbnVtYmVyKTogeyByZXN0OiBzdHJpbmc7IHJldDogc3RyaW5nIH0ge1xuXHR3aGlsZSAocmVzdC5sZW5ndGggPiAwICYmIHJldC5sZW5ndGggPCBsZW5ndGgpIHtcblx0XHRjb25zdCBuZXh0ID0gcmVzdFswXVxuXHRcdHJlc3QgPSByZXN0LnNsaWNlKDEpXG5cdFx0aWYgKGFsbERpZ2l0cy5pbmNsdWRlcyhuZXh0KSkge1xuXHRcdFx0cmV0ICs9IG5leHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdCA9IFwiXCJcblx0XHRcdGJyZWFrXG5cdFx0fVxuXHR9XG5cdHJldHVybiB7IHJlc3QsIHJldCB9XG59XG5cbi8qKlxuICogdGFrZSBhIGRhdGUgaW5wdXQgc3RyaW5nIGFuZCBhIHByZXZpb3VzIHZhbHVlIHRvIHJlbmRlciBhIHZlcnNpb24gdGhhdCdzIG5vbi1hbWJpZ3VvdXNcbiAqIGFuZCBjb25mb3JtcyB0byBhIHZhbGlkIHByZWZpeCBvZiB0aGUgXCJNTSAvIFlZXCIgb3IgXCJNTSAvIFlZWVlcIiBmb3JtYXQgaW4gdGhlIDIwMDAtMjA5OSBkYXRlIHJhbmdlLlxuICogLSBzaG91bGQgd29yayB3aXRoIHByZS1lbXB0aXZlbHkgYWRkaW5nL3JlbW92aW5nIHRoZSBiYWNrc2xhc2hcbiAqIC0gc2hvdWxkIHJlZm9ybWF0IHBhc3RlZCBpbnB1dFxuICogLSBpZ25vcmVzIGludmFsaWQgaW5wdXQgY2hhcmFjdGVycyBhbmQgYW55IGxlZnRvdmVyIGlucHV0LlxuICpcbiAqIEVYQU1QTEVTOiBuZXcsIG9sZCAtPiBvdXRwdXQgKGZvciBtb3JlLCBsb29rIGF0IHRoZSBDcmVkaXRDYXJkVmlld01vZGVsVGVzdC50cyk6XG4gKiBcIjFcIiAtPiBcIjFcIiBcdFx0XHRcdGFtYmlndW91cywgd2UgY2FuJ3QgY29tcGxldGUgdGhpc1xuICogXCIwMFwiLCBcIjBcIiAtPiBcIjBcIiAgICAgXHRpbnZhbGlkIGlucHV0IGNoYXJhY3RlclxuICogXCIzXCIsIFwiXCIgLT4gXCIwMyAvIFwiICAgICAgIHRoaXMgbXVzdCBiZSBtYXJjaCwgdGhlcmUgYXJlIG5vIG1vbnRocyBzdGFydGluZyB3aXRoIDNcbiAqIFwiMTNcIiwgXCIxXCIgLT4gXCIwMSAvIDNcIiAgICAxMyBhcyBhIG1vbnRoIGlzIGludmFsaWQsIHRoZSAxIG11c3QgaGF2ZSBiZWVuIGphbnVhcnkgYW5kIDMgcGFydCBvZiB0aGUgeWVhclxuICogXCIwMSAvXCIsIFwiMDEgLyAyXCIgLT4gXCIwMVwiIHByZS1lbXB0aXZlbHkgcmVtb3ZlIGJhY2tzbGFzaCBpZiB0aGUgdXNlciBiYWNrc3BhY2VzIGFjcm9zcyBpdFxuICogXCIwMTI2XCIsIFwiXCIgLT4gXCIwMSAvIDI2XCIgIGlmIHRoZSBpbnB1dCBpcyB2YWxpZCwgd2Ugc3RpbGwgYWRkIHRoZSBzZXBhcmF0b3IgZXZlbiB3aGVuIHBhc3RpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRoZSBuZXcgdmFsdWUgb2YgdGhlIChwb3RlbnRpYWxseSBwYXJ0aWFsKSBleHBpcmF0aW9uIGRhdGVcbiAqIEBwYXJhbSBvbGREYXRlIHRoZSBwcmV2aW91cyB2YWx1ZSwgbmVlZGVkIGZvciBzb21lIHNwZWNpYWwgYmFja3NwYWNlIGhhbmRsaW5nLlxuICovXG5leHBvcnQgY29uc3QgaW5mZXJFeHBpcmF0aW9uRGF0ZSA9IG5vcm1hbGl6ZUlucHV0KGluZmVyTm9ybWFsaXplZEV4cGlyYXRpb25EYXRlKVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gdmFsdWUgbm9uLWVtcHR5IHN0cmluZyB3aXRob3V0IHdoaXRlc3BhY2Ugc3BlY2lmeWluZyBhIChwb3RlbnRpYWxseSBwYXJ0aWFsKSBkYXRlIGFzIGEgc2VxdWVuY2Ugb2YgMCB0byA2IGRpZ2l0cy5cbiAqIEBwYXJhbSBvbGREYXRlIHByZXZpb3VzIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGluZmVyTm9ybWFsaXplZEV4cGlyYXRpb25EYXRlKHZhbHVlOiBzdHJpbmcsIG9sZERhdGU6IHN0cmluZyk6IHN0cmluZyB7XG5cdGlmIChvbGREYXRlLnN0YXJ0c1dpdGgodmFsdWUpICYmIHZhbHVlLmVuZHNXaXRoKHNlcGFyYXRvcikpIHtcblx0XHQvLyBwcm9iYWJseSB1c2VkIGJhY2tzcGFjZS4gaW4gdGhpcyBjYXNlLCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgc2VwYXJhdG9yXG5cdFx0Ly8gaW4gYSBzcGVjaWFsIHdheSB0byBiZSBjb25zaXN0ZW50LlxuXHRcdHJldHVybiB2YWx1ZS5zbGljZSgwLCAtMSlcblx0fVxuXHRpZiAoIWFsbERpZ2l0cy5pbmNsdWRlcyh2YWx1ZVswXSkpIHJldHVybiBcIlwiXG5cdGxldCByZXN0ID0gdmFsdWVcblx0bGV0IHJldCA9IFwiXCJcblx0aWYgKGRlZmluaXRlTW9udGhEaWdpdHMuaW5jbHVkZXMocmVzdFswXSkpIHtcblx0XHQvLyB3ZSBhbHJlYWR5IGtub3cgd2hhdCBtb250aCB0aGlzIG11c3QgYmUgKHR5cGVkIHdpdGhvdXQgbGVhZGluZyB6ZXJvKVxuXHRcdHJldCA9IFwiMFwiICsgcmVzdFswXVxuXHRcdHJlc3QgPSByZXN0LnNsaWNlKDEpXG5cdH0gZWxzZSB7XG5cdFx0Ly8gd2UgZG9uJ3Qga25vdyB5ZXQgaWYgd2UgaGF2ZSAwMSwgMDIsIC4uLiwgMDkgb3IgMTAsIDExLCAxMlxuXHRcdGlmIChyZXN0WzBdID09PSBcIjBcIikge1xuXHRcdFx0cmV0ID0gXCIwXCJcblx0XHRcdHJlc3QgPSByZXN0LnNsaWNlKDEpXG5cdFx0XHRpZiAocmVzdFswXSA9PT0gXCIwXCIpIHtcblx0XHRcdFx0Ly8gc3RhcnRlZCB3aXRoIFwiMDBcIlxuXHRcdFx0XHRyZXR1cm4gXCIwXCJcblx0XHRcdH0gZWxzZSBpZiAoYWxsRGlnaXRzLmluY2x1ZGVzKHJlc3RbMF0pKSB7XG5cdFx0XHRcdC8vIHN0YXJ0ZWQgd2l0aCBcIjB4XCIgeCBiZWluZyBhIGRpZ2l0XG5cdFx0XHRcdHJldCA9IFwiMFwiICsgcmVzdFswXVxuXHRcdFx0XHRyZXN0ID0gcmVzdC5zbGljZSgxKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gc3RhcnRlZCB3aXRoIDB4IHggbm90IGJlaW5nIGEgbm9uLXplcm8gZGlnaXQuXG5cdFx0XHRcdHJldHVybiBcIjBcIlxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodmFsdWUubGVuZ3RoID4gMSkge1xuXHRcdFx0LyogaW5wdXQgc3RhcnRlZCB3aXRoIDEgKi9cblx0XHRcdHJlc3QgPSByZXN0LnNsaWNlKDEpXG5cdFx0XHRpZiAoc2Vjb25kTW9udGhEaWdpdHMuaW5jbHVkZXMocmVzdFswXSkpIHtcblx0XHRcdFx0cmV0ID0gXCIxXCIgKyByZXN0WzBdXG5cdFx0XHRcdHJlc3QgPSByZXN0LnNsaWNlKDEpXG5cdFx0XHR9IGVsc2UgaWYgKGFsbERpZ2l0cy5pbmNsdWRlcyhyZXN0WzBdKSkge1xuXHRcdFx0XHQvLyBhbnkgZGlnaXQgb3RoZXIgdGhhbiAwLDEsMiBhZnRlciBcIjFcIiBtdXN0IG1lYW4gamFudWFyeVxuXHRcdFx0XHRyZXQgPSBcIjAxXCJcblx0XHRcdFx0Ly8gbm90IHJlbW92aW5nIGEgc2xhc2ggb3IgaW5wdXQgdGhhdCdzIHBhcnQgb2YgdGhlIHllYXIgaGVyZS5cblx0XHRcdH0gZWxzZSBpZiAocmVzdFswXSA9PT0gc2VwYXJhdG9yKSB7XG5cdFx0XHRcdHJldCA9IFwiMDFcIlxuXHRcdFx0XHQvLyBub3Qgc3RyaXBwaW5nIHNlcGFyYXRvciBoZXJlLCB3ZSBkbyB0aGF0IGxhdGVyIGFueXdheVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gMXguLi4gLT4geCBpcyBpbnZhbGlkIGluIHRoaXMgcG9zaXRpb25cblx0XHRcdFx0cmV0dXJuIFwiMVwiXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8qIGlucHV0IHdhcyBleGFjdGx5IFwiMVwiICovXG5cdFx0XHRyZXR1cm4gXCIxXCJcblx0XHR9XG5cdH1cblxuXHRsZXQgaGFkU2xhc2ggPSBmYWxzZVxuXHR3aGlsZSAocmVzdC5zdGFydHNXaXRoKHNlcGFyYXRvcikpIHtcblx0XHRoYWRTbGFzaCA9IHRydWVcblx0XHRyZXN0ID0gcmVzdC5zbGljZSgxKVxuXHR9XG5cblx0aWYgKChyZXQubGVuZ3RoID09PSAyICYmIHJlc3QubGVuZ3RoID4gMCkgfHwgaGFkU2xhc2ggfHwgdmFsdWUubGVuZ3RoID4gb2xkRGF0ZS5sZW5ndGgpIHtcblx0XHQvLyBpZiB0aGVyZSBpcyBtb3JlIGlucHV0IG9yIHRoZSB1c2VyIGFkZGVkIGEgc2xhc2ggYXQgdGhlIGVuZCBvZiB0aGUgbW9udGggb3IgdGhlIG1vbnRoIGp1c3QgZ290IGZpbmlzaGVkLFxuXHRcdC8vIHdlIG5lZWQgYSBzbGFzaFxuXHRcdHJldCArPSBzZXBhcmF0b3Jcblx0fVxuXG5cdC8vIHdlIGhhdmUgYSBtb250aCArIHNsYXNoICsgcG90ZW50aWFsbHkgZmlyc3QgeWVhciBkaWdpdFxuXHQvLyByZXN0IGNvbnRhaW5zIG9ubHkgdGhlIHBhcnQgb2YgdGhlIGlucHV0IHRoYXQgaXMgcmVsZXZhbnQgdG8gdGhlIHllYXJcblx0Oyh7IHJlc3QsIHJldCB9ID0gbm9tRGlnaXRzVW50aWxMZW5ndGgocmVzdCwgcmV0LCBcInh4L3h4XCIubGVuZ3RoKSlcblxuXHRpZiAoIXJldC5lbmRzV2l0aChcIi8yMFwiKSkge1xuXHRcdC8vIHdlIG9ubHkgY29uc2lkZXIgeWVhcnMgaW4gdGhlIDIwMDAtMjA5OSByYW5nZSB2YWxpZCwgd2hpY2hcblx0XHQvLyBtZWFucyB3ZSBjYW4gYXNzdW1lIHR3by1kaWdpdCB5ZWFyIGFuZCByZXR1cm4uXG5cdFx0cmV0dXJuIHJldC5yZXBsYWNlKHNlcGFyYXRvciwgbmljZVNlcGFyYXRvcilcblx0fVxuXG5cdDsoeyByZXQgfSA9IG5vbURpZ2l0c1VudGlsTGVuZ3RoKHJlc3QsIHJldCwgXCJ4eC94eHh4XCIubGVuZ3RoKSlcblxuXHRyZXR1cm4gcmV0LnJlcGxhY2Uoc2VwYXJhdG9yLCBuaWNlU2VwYXJhdG9yKVxufVxuXG4vKipcbiAqIHRha2UgYSBzZXF1ZW5jZSBvZiBkaWdpdHMgYW5kIG90aGVyIGNoYXJhY3RlcnMsIHN0cmlwIG5vbi1kaWdpdHMgYW5kIGdyb3VwIHRoZSByZXN0IGludG8gc3BhY2Utc2VwYXJhdGVkIGdyb3Vwcy5cbiAqIEBwYXJhbSB2YWx1ZSBub24tZW1wdHkgc3RyaW5nIHdpdGhvdXQgd2hpdGVzcGFjZSBzcGVjaWZ5aW5nIGEgKHBvdGVudGlhbGx5IHBhcnRpYWwpIGNyZWRpdCBjYXJkIG51bWJlclxuICogQHBhcmFtIGdyb3VwcyBtb3N0IGNyZWRpdCBjYXJkIG51bWJlciBkaWdpdHMgYXJlIGdyb3VwZWQgaW4gZ3JvdXBzIG9mIDQsIGJ1dCB0aGVyZSBhcmUgZXhjZXB0aW9uc1xuICovXG5mdW5jdGlvbiBncm91cENyZWRpdENhcmROdW1iZXIodmFsdWU6IHN0cmluZywgZ3JvdXBzOiBudW1iZXJbXSA9IFs0LCA0LCA0LCA0LCA0XSk6IHN0cmluZyB7XG5cdHZhbHVlID0gc3RyaXBOb25EaWdpdHModmFsdWUpXG5cdHZhbHVlID0gdmFsdWUuc2xpY2UoMCwgMjApXG5cdGxldCByZXQgPSB2YWx1ZS5zbGljZSgwLCBncm91cHNbMF0pXG5cdHZhbHVlID0gdmFsdWUuc2xpY2UoZ3JvdXBzWzBdKVxuXHRmb3IgKGxldCBpID0gMTsgaSA8IGdyb3Vwcy5sZW5ndGggJiYgdmFsdWUubGVuZ3RoID4gMDsgaSsrKSB7XG5cdFx0cmV0ICs9IFwiIFwiXG5cdFx0cmV0ICs9IHZhbHVlLnNsaWNlKDAsIGdyb3Vwc1tpXSlcblx0XHR2YWx1ZSA9IHZhbHVlLnNsaWNlKGdyb3Vwc1tpXSlcblx0fVxuXHRyZXR1cm4gcmV0XG59XG5cbi8qXG4gKiBleHRyYWN0IGEgbnVtZXJpYyBtb250aCBhbmQgeWVhciBmcm9tIGFuIGV4cGlyYXRpb24gZGF0ZSBpbiB0aGUgZm9ybSBcIk0uLi4gLyBZLi4uXCJcbiAqIGlmIHRoZSBmb3JtYXQgaXMgaW52YWxpZCAod3Jvbmcgc2VwYXJhdG9yLCBtb250aCBub3QgMSAtIDEyLCBpbnZhbGlkIG51bWJlcnMsIHllYXIgbm90IGluIDIwMDAgLSAyMDk5IHJhbmdlKSByZXR1cm4gbnVsbC5cbiAqIG90aGVyd2lzZSwgcmV0dXJuIG9iamVjdCBjb250YWluaW5nIHRoZSB5ZWFyIGFuZCBtb250aCBwcm9wZXJ0aWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwaXJhdGlvbk1vbnRoQW5kWWVhcihleHBpcmF0aW9uRGF0ZTogc3RyaW5nKTogeyB5ZWFyOiBudW1iZXI7IG1vbnRoOiBudW1iZXIgfSB8IG51bGwge1xuXHRpZiAoZXhwaXJhdGlvbkRhdGUubGVuZ3RoIDwgXCJ4eCAvIHh4XCIubGVuZ3RoIHx8ICFleHBpcmF0aW9uRGF0ZS5pbmNsdWRlcyhcIiAvIFwiKSkge1xuXHRcdHJldHVybiBudWxsXG5cdH1cblx0Y29uc3QgW21vbnRoU3RyaW5nLCB5ZWFyU3RyaW5nXSA9IGV4cGlyYXRpb25EYXRlLnNwbGl0KFwiIC8gXCIpLm1hcCgocCkgPT4gcC50cmltKCkpXG5cdGlmICghaXNEaWdpdFN0cmluZyhtb250aFN0cmluZykgfHwgIWlzRGlnaXRTdHJpbmcoeWVhclN0cmluZykpIHtcblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cdGNvbnN0IG1vbnRoTnVtYmVyID0gTnVtYmVyKG1vbnRoU3RyaW5nKVxuXHRpZiAobW9udGhOdW1iZXIgPCAxIHx8IG1vbnRoTnVtYmVyID4gMTIpIHtcblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cdGNvbnN0IHllYXJOdW1iZXIgPSBOdW1iZXIoeWVhclN0cmluZylcblx0aWYgKHllYXJTdHJpbmcubGVuZ3RoID09PSA0ICYmIHllYXJTdHJpbmcuc3RhcnRzV2l0aChcIjIwXCIpKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHllYXI6IE1hdGguZmxvb3IoeWVhck51bWJlcikgLSAyMDAwLFxuXHRcdFx0bW9udGg6IE1hdGguZmxvb3IobW9udGhOdW1iZXIpLFxuXHRcdH1cblx0fSBlbHNlIGlmICh5ZWFyU3RyaW5nLmxlbmd0aCA9PT0gMikge1xuXHRcdHJldHVybiB7XG5cdFx0XHR5ZWFyOiBNYXRoLmZsb29yKHllYXJOdW1iZXIpLFxuXHRcdFx0bW9udGg6IE1hdGguZmxvb3IobW9udGhOdW1iZXIpLFxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbnVsbFxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGlmaWVkQ3JlZGl0Q2FyZFZpZXdNb2RlbCBpbXBsZW1lbnRzIENDVmlld01vZGVsIHtcblx0cHJpdmF0ZSBfY2FyZEhvbGRlck5hbWU6IHN0cmluZyA9IFwiXCJcblx0cHJpdmF0ZSBfY3JlZGl0Q2FyZE51bWJlcjogc3RyaW5nID0gXCJcIlxuXHRwcml2YXRlIF9jdnY6IHN0cmluZyA9IFwiXCJcblx0cHJpdmF0ZSBfZXhwaXJhdGlvbkRhdGU6IHN0cmluZyA9IFwiXCJcblxuXHRwcml2YXRlIGNyZWRpdENhcmRUeXBlOiBDYXJkVHlwZSA9IENhcmRUeXBlLk90aGVyXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBsYW5nOiBMYW5ndWFnZVZpZXdNb2RlbCkge31cblxuXHRnZXQgZXhwaXJhdGlvbkRhdGUoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5fZXhwaXJhdGlvbkRhdGVcblx0fVxuXG5cdHNldCBleHBpcmF0aW9uRGF0ZSh2YWx1ZTogc3RyaW5nKSB7XG5cdFx0dGhpcy5fZXhwaXJhdGlvbkRhdGUgPSBpbmZlckV4cGlyYXRpb25EYXRlKHZhbHVlLCB0aGlzLl9leHBpcmF0aW9uRGF0ZSlcblx0fVxuXG5cdGdldCBjdnYoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5fY3Z2XG5cdH1cblxuXHRzZXQgY3Z2KHZhbHVlOiBzdHJpbmcpIHtcblx0XHRjb25zdCBjb3JyZWN0ZWRDdnYgPSBzdHJpcFdoaXRlc3BhY2Uoc3RyaXBOb25EaWdpdHModmFsdWUpKVxuXHRcdHRoaXMuX2N2diA9IGNvcnJlY3RlZEN2di5zbGljZSgwLCA0KVxuXHR9XG5cblx0Z2V0IGNyZWRpdENhcmROdW1iZXIoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5fY3JlZGl0Q2FyZE51bWJlclxuXHR9XG5cblx0c2V0IGNyZWRpdENhcmROdW1iZXIodmFsdWU6IHN0cmluZykge1xuXHRcdGxldCBjbGVhbmVkTnVtYmVyID0gc3RyaXBOb25EaWdpdHMoc3RyaXBXaGl0ZXNwYWNlKHZhbHVlKSlcblx0XHR0aGlzLmNyZWRpdENhcmRUeXBlID0gZ2V0Q2FyZFR5cGVSYW5nZShjbGVhbmVkTnVtYmVyKVxuXHRcdHRoaXMuX2NyZWRpdENhcmROdW1iZXIgPVxuXHRcdFx0dGhpcy5jcmVkaXRDYXJkVHlwZSA9PT0gQ2FyZFR5cGUuQW1leCA/IGdyb3VwQ3JlZGl0Q2FyZE51bWJlcihjbGVhbmVkTnVtYmVyLCBbNCwgNiwgNSwgNV0pIDogZ3JvdXBDcmVkaXRDYXJkTnVtYmVyKGNsZWFuZWROdW1iZXIpXG5cdH1cblxuXHRnZXQgY2FyZEhvbGRlck5hbWUoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5fY2FyZEhvbGRlck5hbWVcblx0fVxuXG5cdHNldCBjYXJkSG9sZGVyTmFtZSh2YWx1ZTogc3RyaW5nKSB7XG5cdFx0Ly8gbm8tb3AgZm9yIG5vdy5cblx0fVxuXG5cdHZhbGlkYXRlQ3JlZGl0Q2FyZFBheW1lbnREYXRhKCk6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCB7XG5cdFx0Y29uc3QgY2MgPSB0aGlzLmdldENyZWRpdENhcmREYXRhKClcblx0XHRjb25zdCBpbnZhbGlkTnVtYmVyID0gdGhpcy52YWxpZGF0ZUNyZWRpdENhcmROdW1iZXIoY2MubnVtYmVyKVxuXHRcdGlmIChpbnZhbGlkTnVtYmVyKSB7XG5cdFx0XHRyZXR1cm4gaW52YWxpZE51bWJlclxuXHRcdH1cblx0XHRjb25zdCBpbnZhbGlkQ1ZWID0gdGhpcy52YWxpZGF0ZUNWVihjYy5jdnYpXG5cdFx0aWYgKGludmFsaWRDVlYpIHtcblx0XHRcdHJldHVybiBpbnZhbGlkQ1ZWXG5cdFx0fVxuXHRcdGNvbnN0IGludmFsaWRFeHBpcmF0aW9uRGF0ZSA9IHRoaXMuZ2V0RXhwaXJhdGlvbkRhdGVFcnJvckhpbnQoKVxuXHRcdGlmIChpbnZhbGlkRXhwaXJhdGlvbkRhdGUpIHtcblx0XHRcdHJldHVybiBpbnZhbGlkRXhwaXJhdGlvbkRhdGVcblx0XHR9XG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdHZhbGlkYXRlQ3JlZGl0Q2FyZE51bWJlcihudW1iZXI6IHN0cmluZyk6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCB7XG5cdFx0aWYgKG51bWJlciA9PT0gXCJcIikge1xuXHRcdFx0cmV0dXJuIFwiY3JlZGl0Q2FyZE51bWJlckZvcm1hdF9tc2dcIlxuXHRcdH0gZWxzZSBpZiAoIWlzVmFsaWRDcmVkaXRDYXJkTnVtYmVyKG51bWJlcikpIHtcblx0XHRcdHJldHVybiBcImNyZWRpdENhcmROdW1iZXJJbnZhbGlkX21zZ1wiXG5cdFx0fVxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHR2YWxpZGF0ZUNWVihjdnY6IHN0cmluZyk6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCB7XG5cdFx0aWYgKGN2di5sZW5ndGggPCAzIHx8IGN2di5sZW5ndGggPiA0KSB7XG5cdFx0XHRyZXR1cm4gXCJjcmVkaXRDYXJkQ1ZWRm9ybWF0X2xhYmVsXCJcblx0XHR9XG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdGdldENyZWRpdENhcmROdW1iZXJIaW50KCk6IHN0cmluZyB8IG51bGwge1xuXHRcdGNvbnN0IHNwZWMgPSBDYXJkU3BlY3NbdGhpcy5jcmVkaXRDYXJkVHlwZV1cblx0XHRpZiAodGhpcy5jcmVkaXRDYXJkVHlwZSA9PT0gQ2FyZFR5cGUuT3RoZXIpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHRcdHJldHVybiBzcGVjLm5hbWVcblx0fVxuXG5cdGdldENyZWRpdENhcmROdW1iZXJFcnJvckhpbnQoKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMudmFsaWRhdGVDcmVkaXRDYXJkTnVtYmVyKHRoaXMuX2NyZWRpdENhcmROdW1iZXIpID8gdGhpcy5sYW5nLmdldChcImNyZWRpdENhcmROdW1iZXJJbnZhbGlkX21zZ1wiKSA6IG51bGxcblx0fVxuXG5cdC8qKlxuXHQgKiByZXR1cm4gYSB0cmFuc2xhdGlvbiBzdHJpbmcgZGV0YWlsaW5nIHdoYXQncyB3cm9uZyB3aXRoIHRoZVxuXHQgKiBjb250ZW50cyBvZiB0aGUgZXhwaXJhdGlvbiBkYXRlIGZpZWxkLCBpZiBhbnkuXG5cdCAqL1xuXHRnZXRFeHBpcmF0aW9uRGF0ZUVycm9ySGludCgpOiBUcmFuc2xhdGlvbktleSB8IG51bGwge1xuXHRcdGNvbnN0IGV4cGlyYXRpb24gPSBnZXRFeHBpcmF0aW9uTW9udGhBbmRZZWFyKHRoaXMuX2V4cGlyYXRpb25EYXRlKVxuXHRcdGlmIChleHBpcmF0aW9uID09IG51bGwpIHtcblx0XHRcdHJldHVybiBcImNyZWRpdENhcmRFeHByYXRpb25EYXRlSW52YWxpZF9tc2dcIlxuXHRcdH1cblx0XHRjb25zdCB0b2RheSA9IG5ldyBEYXRlKClcblx0XHRjb25zdCBjdXJyZW50WWVhciA9IHRvZGF5LmdldEZ1bGxZZWFyKCkgLSAyMDAwXG5cdFx0Y29uc3QgY3VycmVudE1vbnRoID0gdG9kYXkuZ2V0TW9udGgoKSArIDFcblx0XHRjb25zdCB7IHllYXIsIG1vbnRoIH0gPSBleHBpcmF0aW9uXG5cdFx0aWYgKHllYXIgPiBjdXJyZW50WWVhciB8fCAoeWVhciA9PT0gY3VycmVudFllYXIgJiYgbW9udGggPj0gY3VycmVudE1vbnRoKSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdFx0cmV0dXJuIFwiY3JlZGl0Q2FyZEV4cGlyZWRfbXNnXCJcblx0fVxuXG5cdGdldEN2dkhpbnQoKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0aWYgKHRoaXMuY3JlZGl0Q2FyZFR5cGUgPT09IENhcmRUeXBlLk90aGVyKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBzcGVjID0gQ2FyZFNwZWNzW3RoaXMuY3JlZGl0Q2FyZFR5cGVdXG5cdFx0XHRyZXR1cm4gdGhpcy5sYW5nLmdldChcImNyZWRpdENhcmRDdnZIaW50X21zZ1wiLCB7IFwie2N1cnJlbnREaWdpdHN9XCI6IHRoaXMuY3Z2Lmxlbmd0aCwgXCJ7dG90YWxEaWdpdHN9XCI6IHNwZWMuY3Z2TGVuZ3RoIH0pXG5cdFx0fVxuXHR9XG5cblx0Z2V0Q3Z2RXJyb3JIaW50KCk6IHN0cmluZyB8IG51bGwge1xuXHRcdGNvbnN0IHNwZWMgPSBDYXJkU3BlY3NbdGhpcy5jcmVkaXRDYXJkVHlwZV1cblx0XHRyZXR1cm4gdGhpcy52YWxpZGF0ZUNWVih0aGlzLmN2dikgPyB0aGlzLmxhbmcuZ2V0KFwiY3JlZGl0Q2FyZFNwZWNpZmljQ1ZWSW52YWxpZF9tc2dcIiwgeyBcIntzZWN1cml0eUNvZGV9XCI6IHNwZWMuY3Z2TmFtZSB9KSA6IG51bGxcblx0fVxuXG5cdGdldEN2dkxhYmVsKCk6IHN0cmluZyB7XG5cdFx0aWYgKHRoaXMuY3JlZGl0Q2FyZFR5cGUgPT09IENhcmRUeXBlLk90aGVyKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5sYW5nLmdldChcImNyZWRpdENhcmRDdnZMYWJlbExvbmdfbGFiZWxcIiwgeyBcIntjdnZOYW1lfVwiOiBDYXJkU3BlY3NbQ2FyZFR5cGUuT3RoZXJdLmN2dk5hbWUgfSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgc3BlYyA9IENhcmRTcGVjc1t0aGlzLmNyZWRpdENhcmRUeXBlXVxuXHRcdFx0cmV0dXJuIHRoaXMubGFuZy5nZXQoXCJjcmVkaXRDYXJkQ3Z2TGFiZWxMb25nX2xhYmVsXCIsIHsgXCJ7Y3Z2TmFtZX1cIjogc3BlYy5jdnZOYW1lIH0pXG5cdFx0fVxuXHR9XG5cblx0Z2V0Q3JlZGl0Q2FyZERhdGEoKTogQ3JlZGl0Q2FyZCB7XG5cdFx0Y29uc3QgZXhwaXJhdGlvbiA9IGdldEV4cGlyYXRpb25Nb250aEFuZFllYXIodGhpcy5fZXhwaXJhdGlvbkRhdGUpXG5cdFx0bGV0IGNjID0gY3JlYXRlQ3JlZGl0Q2FyZCh7XG5cdFx0XHRudW1iZXI6IHN0cmlwV2hpdGVzcGFjZSh0aGlzLl9jcmVkaXRDYXJkTnVtYmVyKSxcblx0XHRcdGNhcmRIb2xkZXJOYW1lOiB0aGlzLl9jYXJkSG9sZGVyTmFtZSxcblx0XHRcdGN2djogdGhpcy5fY3Z2LFxuXHRcdFx0ZXhwaXJhdGlvbk1vbnRoOiBleHBpcmF0aW9uID8gU3RyaW5nKGV4cGlyYXRpb24ubW9udGgpIDogXCJcIixcblx0XHRcdGV4cGlyYXRpb25ZZWFyOiBleHBpcmF0aW9uID8gU3RyaW5nKGV4cGlyYXRpb24ueWVhcikgOiBcIlwiLFxuXHRcdH0pXG5cdFx0cmV0dXJuIGNjXG5cdH1cblxuXHRzZXRDcmVkaXRDYXJkRGF0YShkYXRhOiBDcmVkaXRDYXJkIHwgbnVsbCk6IHZvaWQge1xuXHRcdGlmIChkYXRhKSB7XG5cdFx0XHR0aGlzLmNyZWRpdENhcmROdW1iZXIgPSBkYXRhLm51bWJlclxuXHRcdFx0dGhpcy5jdnYgPSBkYXRhLmN2dlxuXG5cdFx0XHRpZiAoZGF0YS5leHBpcmF0aW9uTW9udGggJiYgZGF0YS5leHBpcmF0aW9uWWVhcikge1xuXHRcdFx0XHR0aGlzLmV4cGlyYXRpb25EYXRlID0gZGF0YS5leHBpcmF0aW9uTW9udGggKyBcIiAvIFwiICsgZGF0YS5leHBpcmF0aW9uWWVhclxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9jcmVkaXRDYXJkTnVtYmVyID0gXCJcIlxuXHRcdFx0dGhpcy5fY3Z2ID0gXCJcIlxuXHRcdFx0dGhpcy5fZXhwaXJhdGlvbkRhdGUgPSBcIlwiXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB0eXBlIHsgQ291bnRyeSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0NvdW50cnlMaXN0XCJcbmltcG9ydCB7IENvdW50cnlUeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vQ291bnRyeUxpc3RcIlxuaW1wb3J0IHsgUGF5bWVudERhdGEsIFBheW1lbnRNZXRob2RUeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgUGF5UGFsTG9nbyB9IGZyb20gXCIuLi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBMYXp5TG9hZGVkLCBub09wLCBwcm9taXNlTWFwIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBzaG93UHJvZ3Jlc3NEaWFsb2cgfSBmcm9tIFwiLi4vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBBY2NvdW50aW5nSW5mbyB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEFjY291bnRpbmdJbmZvVHlwZVJlZiB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBNZXNzYWdlQm94IH0gZnJvbSBcIi4uL2d1aS9iYXNlL01lc3NhZ2VCb3guanNcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vZ3VpL3NpemVcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgVXNhZ2VUZXN0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11c2FnZXRlc3RzXCJcbmltcG9ydCB7IFNlbGVjdGVkU3Vic2NyaXB0aW9uT3B0aW9ucyB9IGZyb20gXCIuL0ZlYXR1cmVMaXN0UHJvdmlkZXJcIlxuaW1wb3J0IHsgQ0NWaWV3TW9kZWwsIFNpbXBsaWZpZWRDcmVkaXRDYXJkSW5wdXQgfSBmcm9tIFwiLi9TaW1wbGlmaWVkQ3JlZGl0Q2FyZElucHV0LmpzXCJcbmltcG9ydCB7IFNpbXBsaWZpZWRDcmVkaXRDYXJkVmlld01vZGVsIH0gZnJvbSBcIi4vU2ltcGxpZmllZENyZWRpdENhcmRJbnB1dE1vZGVsLmpzXCJcbmltcG9ydCB7IGlzVXBkYXRlRm9yVHlwZVJlZiB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzLmpzXCJcbmltcG9ydCB7IEVudGl0eUV2ZW50c0xpc3RlbmVyIH0gZnJvbSBcIi4uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBCYXNlQnV0dG9uIH0gZnJvbSBcIi4uL2d1aS9iYXNlL2J1dHRvbnMvQmFzZUJ1dHRvbi5qc1wiXG5cbi8qKlxuICogQ29tcG9uZW50IHRvIGRpc3BsYXkgdGhlIGlucHV0IGZpZWxkcyBmb3IgYSBwYXltZW50IG1ldGhvZC4gVGhlIHNlbGVjdG9yIHRvIHN3aXRjaCBiZXR3ZWVuIHBheW1lbnQgbWV0aG9kcyBpcyBub3QgaW5jbHVkZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXltZW50TWV0aG9kSW5wdXQge1xuXHRwcml2YXRlIHJlYWRvbmx5IGNjVmlld01vZGVsOiBDQ1ZpZXdNb2RlbFxuXHRfcGF5UGFsQXR0cnM6IFBheXBhbEF0dHJzXG5cdF9zZWxlY3RlZENvdW50cnk6IFN0cmVhbTxDb3VudHJ5IHwgbnVsbD5cblx0X3NlbGVjdGVkUGF5bWVudE1ldGhvZDogUGF5bWVudE1ldGhvZFR5cGVcblx0X3N1YnNjcmlwdGlvbk9wdGlvbnM6IFNlbGVjdGVkU3Vic2NyaXB0aW9uT3B0aW9uc1xuXHRfYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvXG5cdF9lbnRpdHlFdmVudExpc3RlbmVyOiBFbnRpdHlFdmVudHNMaXN0ZW5lclxuXHRwcml2YXRlIF9fcGF5bWVudFBheXBhbFRlc3Q/OiBVc2FnZVRlc3RcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRzdWJzY3JpcHRpb25PcHRpb25zOiBTZWxlY3RlZFN1YnNjcmlwdGlvbk9wdGlvbnMsXG5cdFx0c2VsZWN0ZWRDb3VudHJ5OiBTdHJlYW08Q291bnRyeSB8IG51bGw+LFxuXHRcdGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyxcblx0XHRwYXlQYWxSZXF1ZXN0VXJsOiBMYXp5TG9hZGVkPHN0cmluZz4sXG5cdFx0ZGVmYXVsdFBheW1lbnRNZXRob2Q6IFBheW1lbnRNZXRob2RUeXBlLFxuXHQpIHtcblx0XHR0aGlzLl9zZWxlY3RlZENvdW50cnkgPSBzZWxlY3RlZENvdW50cnlcblx0XHR0aGlzLl9zdWJzY3JpcHRpb25PcHRpb25zID0gc3Vic2NyaXB0aW9uT3B0aW9uc1xuXHRcdHRoaXMuY2NWaWV3TW9kZWwgPSBuZXcgU2ltcGxpZmllZENyZWRpdENhcmRWaWV3TW9kZWwobGFuZylcblx0XHR0aGlzLl9hY2NvdW50aW5nSW5mbyA9IGFjY291bnRpbmdJbmZvXG5cdFx0dGhpcy5fcGF5UGFsQXR0cnMgPSB7XG5cdFx0XHRwYXlQYWxSZXF1ZXN0VXJsLFxuXHRcdFx0YWNjb3VudGluZ0luZm86IHRoaXMuX2FjY291bnRpbmdJbmZvLFxuXHRcdH1cblx0XHR0aGlzLl9fcGF5bWVudFBheXBhbFRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInBheW1lbnQucGF5cGFsXCIpXG5cblx0XHR0aGlzLl9lbnRpdHlFdmVudExpc3RlbmVyID0gKHVwZGF0ZXMpID0+IHtcblx0XHRcdHJldHVybiBwcm9taXNlTWFwKHVwZGF0ZXMsICh1cGRhdGUpID0+IHtcblx0XHRcdFx0aWYgKGlzVXBkYXRlRm9yVHlwZVJlZihBY2NvdW50aW5nSW5mb1R5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZChBY2NvdW50aW5nSW5mb1R5cGVSZWYsIHVwZGF0ZS5pbnN0YW5jZUlkKS50aGVuKChhY2NvdW50aW5nSW5mbykgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5fX3BheW1lbnRQYXlwYWxUZXN0Py5nZXRTdGFnZSgyKS5jb21wbGV0ZSgpXG5cdFx0XHRcdFx0XHR0aGlzLl9hY2NvdW50aW5nSW5mbyA9IGFjY291bnRpbmdJbmZvXG5cdFx0XHRcdFx0XHR0aGlzLl9wYXlQYWxBdHRycy5hY2NvdW50aW5nSW5mbyA9IGFjY291bnRpbmdJbmZvXG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSkudGhlbihub09wKVxuXHRcdH1cblxuXHRcdHRoaXMuX3NlbGVjdGVkUGF5bWVudE1ldGhvZCA9IGRlZmF1bHRQYXltZW50TWV0aG9kXG5cdH1cblxuXHRvbmNyZWF0ZSgpIHtcblx0XHRsb2NhdG9yLmV2ZW50Q29udHJvbGxlci5hZGRFbnRpdHlMaXN0ZW5lcih0aGlzLl9lbnRpdHlFdmVudExpc3RlbmVyKVxuXHR9XG5cblx0b25yZW1vdmUoKSB7XG5cdFx0bG9jYXRvci5ldmVudENvbnRyb2xsZXIucmVtb3ZlRW50aXR5TGlzdGVuZXIodGhpcy5fZW50aXR5RXZlbnRMaXN0ZW5lcilcblx0fVxuXG5cdHZpZXcoKTogQ2hpbGRyZW4ge1xuXHRcdHN3aXRjaCAodGhpcy5fc2VsZWN0ZWRQYXltZW50TWV0aG9kKSB7XG5cdFx0XHRjYXNlIFBheW1lbnRNZXRob2RUeXBlLkludm9pY2U6XG5cdFx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcdFwiLmZsZXgtY2VudGVyXCIsXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdE1lc3NhZ2VCb3gsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0bWFyZ2luVG9wOiBweCgxNiksXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0dGhpcy5pc09uQWNjb3VudEFsbG93ZWQoKVxuXHRcdFx0XHRcdFx0XHQ/IGxhbmcuZ2V0KFwicGF5bWVudE1ldGhvZE9uQWNjb3VudF9tc2dcIikgKyBcIiBcIiArIGxhbmcuZ2V0KFwicGF5bWVudFByb2Nlc3NpbmdUaW1lX21zZ1wiKVxuXHRcdFx0XHRcdFx0XHQ6IGxhbmcuZ2V0KFwicGF5bWVudE1ldGhvZE5vdEF2YWlsYWJsZV9tc2dcIiksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KVxuXHRcdFx0Y2FzZSBQYXltZW50TWV0aG9kVHlwZS5BY2NvdW50QmFsYW5jZTpcblx0XHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFx0XCIuZmxleC1jZW50ZXJcIixcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0TWVzc2FnZUJveCxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRtYXJnaW5Ub3A6IHB4KDE2KSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRsYW5nLmdldChcInBheW1lbnRNZXRob2RBY2NvdW50QmFsYW5jZV9tc2dcIiksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KVxuXHRcdFx0Y2FzZSBQYXltZW50TWV0aG9kVHlwZS5QYXlwYWw6XG5cdFx0XHRcdHJldHVybiBtKFBheXBhbElucHV0LCB0aGlzLl9wYXlQYWxBdHRycylcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBtKFNpbXBsaWZpZWRDcmVkaXRDYXJkSW5wdXQsIHsgdmlld01vZGVsOiB0aGlzLmNjVmlld01vZGVsIGFzIFNpbXBsaWZpZWRDcmVkaXRDYXJkVmlld01vZGVsIH0pXG5cdFx0fVxuXHR9XG5cblx0aXNPbkFjY291bnRBbGxvd2VkKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGNvdW50cnkgPSB0aGlzLl9zZWxlY3RlZENvdW50cnkoKVxuXG5cdFx0aWYgKCFjb3VudHJ5KSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9IGVsc2UgaWYgKHRoaXMuX2FjY291bnRpbmdJbmZvLnBheW1lbnRNZXRob2QgPT09IFBheW1lbnRNZXRob2RUeXBlLkludm9pY2UpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fSBlbHNlIGlmICh0aGlzLl9zdWJzY3JpcHRpb25PcHRpb25zLmJ1c2luZXNzVXNlKCkgJiYgY291bnRyeS50ICE9PSBDb3VudHJ5VHlwZS5PVEhFUikge1xuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHR9XG5cblx0aXNQYXlwYWxBc3NpZ25lZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gaXNQYXlwYWxBc3NpZ25lZCh0aGlzLl9hY2NvdW50aW5nSW5mbylcblx0fVxuXG5cdHZhbGlkYXRlUGF5bWVudERhdGEoKTogVHJhbnNsYXRpb25LZXkgfCBudWxsIHtcblx0XHRpZiAoIXRoaXMuX3NlbGVjdGVkUGF5bWVudE1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIFwiaW52b2ljZVBheW1lbnRNZXRob2RJbmZvX21zZ1wiXG5cdFx0fSBlbHNlIGlmICh0aGlzLl9zZWxlY3RlZFBheW1lbnRNZXRob2QgPT09IFBheW1lbnRNZXRob2RUeXBlLkludm9pY2UpIHtcblx0XHRcdGlmICghdGhpcy5pc09uQWNjb3VudEFsbG93ZWQoKSkge1xuXHRcdFx0XHRyZXR1cm4gXCJwYXltZW50TWV0aG9kTm90QXZhaWxhYmxlX21zZ1wiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGhpcy5fc2VsZWN0ZWRQYXltZW50TWV0aG9kID09PSBQYXltZW50TWV0aG9kVHlwZS5QYXlwYWwpIHtcblx0XHRcdHJldHVybiBpc1BheXBhbEFzc2lnbmVkKHRoaXMuX2FjY291bnRpbmdJbmZvKSA/IG51bGwgOiBcInBheW1lbnREYXRhUGF5UGFsTG9naW5fbXNnXCJcblx0XHR9IGVsc2UgaWYgKHRoaXMuX3NlbGVjdGVkUGF5bWVudE1ldGhvZCA9PT0gUGF5bWVudE1ldGhvZFR5cGUuQ3JlZGl0Q2FyZCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuY2NWaWV3TW9kZWwudmFsaWRhdGVDcmVkaXRDYXJkUGF5bWVudERhdGEoKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXG5cdHVwZGF0ZVBheW1lbnRNZXRob2QodmFsdWU6IFBheW1lbnRNZXRob2RUeXBlLCBwYXltZW50RGF0YT86IFBheW1lbnREYXRhKSB7XG5cdFx0dGhpcy5fc2VsZWN0ZWRQYXltZW50TWV0aG9kID0gdmFsdWVcblxuXHRcdGlmICh2YWx1ZSA9PT0gUGF5bWVudE1ldGhvZFR5cGUuQ3JlZGl0Q2FyZCkge1xuXHRcdFx0aWYgKHBheW1lbnREYXRhKSB7XG5cdFx0XHRcdHRoaXMuY2NWaWV3TW9kZWwuc2V0Q3JlZGl0Q2FyZERhdGEocGF5bWVudERhdGEuY3JlZGl0Q2FyZERhdGEpXG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLl9fcGF5bWVudFBheXBhbFRlc3QpIHtcblx0XHRcdFx0dGhpcy5fX3BheW1lbnRQYXlwYWxUZXN0LmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gUGF5bWVudE1ldGhvZFR5cGUuUGF5cGFsKSB7XG5cdFx0XHR0aGlzLl9wYXlQYWxBdHRycy5wYXlQYWxSZXF1ZXN0VXJsLmdldEFzeW5jKCkudGhlbigoKSA9PiBtLnJlZHJhdygpKVxuXG5cdFx0XHRpZiAodGhpcy5fX3BheW1lbnRQYXlwYWxUZXN0KSB7XG5cdFx0XHRcdHRoaXMuX19wYXltZW50UGF5cGFsVGVzdC5hY3RpdmUgPSB0cnVlXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX19wYXltZW50UGF5cGFsVGVzdD8uZ2V0U3RhZ2UoMCkuY29tcGxldGUoKVxuXHRcdH1cblxuXHRcdG0ucmVkcmF3KClcblx0fVxuXG5cdGdldFBheW1lbnREYXRhKCk6IFBheW1lbnREYXRhIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cGF5bWVudE1ldGhvZDogdGhpcy5fc2VsZWN0ZWRQYXltZW50TWV0aG9kLFxuXHRcdFx0Y3JlZGl0Q2FyZERhdGE6IHRoaXMuX3NlbGVjdGVkUGF5bWVudE1ldGhvZCA9PT0gUGF5bWVudE1ldGhvZFR5cGUuQ3JlZGl0Q2FyZCA/IHRoaXMuY2NWaWV3TW9kZWwuZ2V0Q3JlZGl0Q2FyZERhdGEoKSA6IG51bGwsXG5cdFx0fVxuXHR9XG5cblx0Z2V0VmlzaWJsZVBheW1lbnRNZXRob2RzKCk6IEFycmF5PHtcblx0XHRuYW1lOiBzdHJpbmdcblx0XHR2YWx1ZTogUGF5bWVudE1ldGhvZFR5cGVcblx0fT4ge1xuXHRcdGNvbnN0IGF2YWlsYWJsZVBheW1lbnRNZXRob2RzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBsYW5nLmdldChcInBheW1lbnRNZXRob2RDcmVkaXRDYXJkX2xhYmVsXCIpLFxuXHRcdFx0XHR2YWx1ZTogUGF5bWVudE1ldGhvZFR5cGUuQ3JlZGl0Q2FyZCxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwiUGF5UGFsXCIsXG5cdFx0XHRcdHZhbHVlOiBQYXltZW50TWV0aG9kVHlwZS5QYXlwYWwsXG5cdFx0XHR9LFxuXHRcdF1cblxuXHRcdC8vIHNob3cgYmFuayB0cmFuc2ZlciBpbiBjYXNlIG9mIGJ1c2luZXNzIHVzZSwgZXZlbiBpZiBpdCBpcyBub3QgYXZhaWxhYmxlIGZvciB0aGUgc2VsZWN0ZWQgY291bnRyeVxuXHRcdGlmICh0aGlzLl9zdWJzY3JpcHRpb25PcHRpb25zLmJ1c2luZXNzVXNlKCkgfHwgdGhpcy5fYWNjb3VudGluZ0luZm8ucGF5bWVudE1ldGhvZCA9PT0gUGF5bWVudE1ldGhvZFR5cGUuSW52b2ljZSkge1xuXHRcdFx0YXZhaWxhYmxlUGF5bWVudE1ldGhvZHMucHVzaCh7XG5cdFx0XHRcdG5hbWU6IGxhbmcuZ2V0KFwicGF5bWVudE1ldGhvZE9uQWNjb3VudF9sYWJlbFwiKSxcblx0XHRcdFx0dmFsdWU6IFBheW1lbnRNZXRob2RUeXBlLkludm9pY2UsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdC8vIHNob3cgYWNjb3VudCBiYWxhbmNlIG9ubHkgaWYgdGhpcyBpcyB0aGUgY3VycmVudCBwYXltZW50IG1ldGhvZFxuXHRcdGlmICh0aGlzLl9hY2NvdW50aW5nSW5mby5wYXltZW50TWV0aG9kID09PSBQYXltZW50TWV0aG9kVHlwZS5BY2NvdW50QmFsYW5jZSkge1xuXHRcdFx0YXZhaWxhYmxlUGF5bWVudE1ldGhvZHMucHVzaCh7XG5cdFx0XHRcdG5hbWU6IGxhbmcuZ2V0KFwicGF5bWVudE1ldGhvZEFjY291bnRCYWxhbmNlX2xhYmVsXCIpLFxuXHRcdFx0XHR2YWx1ZTogUGF5bWVudE1ldGhvZFR5cGUuQWNjb3VudEJhbGFuY2UsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBhdmFpbGFibGVQYXltZW50TWV0aG9kc1xuXHR9XG59XG5cbnR5cGUgUGF5cGFsQXR0cnMgPSB7XG5cdHBheVBhbFJlcXVlc3RVcmw6IExhenlMb2FkZWQ8c3RyaW5nPlxuXHRhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm9cbn1cblxuY2xhc3MgUGF5cGFsSW5wdXQge1xuXHRwcml2YXRlIF9fcGF5bWVudFBheXBhbFRlc3Q/OiBVc2FnZVRlc3RcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLl9fcGF5bWVudFBheXBhbFRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInBheW1lbnQucGF5cGFsXCIpXG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxQYXlwYWxBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0bGV0IGF0dHJzID0gdm5vZGUuYXR0cnNcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1jZW50ZXJcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcIm1hcmdpbi10b3BcIjogXCI1MHB4XCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bShCYXNlQnV0dG9uLCB7XG5cdFx0XHRcdFx0bGFiZWw6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiUGF5UGFsXCIsIFwiUGF5UGFsXCIpLFxuXHRcdFx0XHRcdGljb246IG0oXCIucGF5bWVudC1sb2dvLmZsZXhcIiwgbS50cnVzdChQYXlQYWxMb2dvKSksXG5cdFx0XHRcdFx0Y2xhc3M6IFwiYm9yZGVyIGJvcmRlci1yYWRpdXMgYmctd2hpdGUgYnV0dG9uLWhlaWdodCBwbHJcIixcblx0XHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLl9fcGF5bWVudFBheXBhbFRlc3Q/LmdldFN0YWdlKDEpLmNvbXBsZXRlKClcblx0XHRcdFx0XHRcdGlmIChhdHRycy5wYXlQYWxSZXF1ZXN0VXJsLmlzTG9hZGVkKCkpIHtcblx0XHRcdFx0XHRcdFx0d2luZG93Lm9wZW4oYXR0cnMucGF5UGFsUmVxdWVzdFVybC5nZXRMb2FkZWQoKSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHNob3dQcm9ncmVzc0RpYWxvZyhcInBheVBhbFJlZGlyZWN0X21zZ1wiLCBhdHRycy5wYXlQYWxSZXF1ZXN0VXJsLmdldEFzeW5jKCkpLnRoZW4oKHVybCkgPT4gd2luZG93Lm9wZW4odXJsKSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5zbWFsbC5wdC5jZW50ZXJcIixcblx0XHRcdFx0aXNQYXlwYWxBc3NpZ25lZChhdHRycy5hY2NvdW50aW5nSW5mbylcblx0XHRcdFx0XHQ/IGxhbmcuZ2V0KFwicGF5bWVudERhdGFQYXlQYWxGaW5pc2hlZF9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcInthY2NvdW50QWRkcmVzc31cIjogYXR0cnMuYWNjb3VudGluZ0luZm8ucGF5bWVudE1ldGhvZEluZm8gPz8gXCJcIixcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBsYW5nLmdldChcInBheW1lbnREYXRhUGF5UGFsTG9naW5fbXNnXCIpLFxuXHRcdFx0KSxcblx0XHRdXG5cdH1cbn1cblxuZnVuY3Rpb24gaXNQYXlwYWxBc3NpZ25lZChhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8pOiBib29sZWFuIHtcblx0cmV0dXJuIGFjY291bnRpbmdJbmZvLnBheXBhbEJpbGxpbmdBZ3JlZW1lbnQgIT0gbnVsbFxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IERpYWxvZywgRGlhbG9nVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgbGFuZywgdHlwZSBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB0eXBlIHsgVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEgfSBmcm9tIFwiLi9VcGdyYWRlU3Vic2NyaXB0aW9uV2l6YXJkXCJcbmltcG9ydCB7IEludm9pY2VEYXRhSW5wdXQsIEludm9pY2VEYXRhSW5wdXRMb2NhdGlvbiB9IGZyb20gXCIuL0ludm9pY2VEYXRhSW5wdXRcIlxuaW1wb3J0IHsgUGF5bWVudE1ldGhvZElucHV0IH0gZnJvbSBcIi4vUGF5bWVudE1ldGhvZElucHV0XCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7XG5cdGdldENsaWVudFR5cGUsXG5cdGdldERlZmF1bHRQYXltZW50TWV0aG9kLFxuXHRJbnZvaWNlRGF0YSxcblx0S2V5cyxcblx0UGF5bWVudERhdGEsXG5cdFBheW1lbnREYXRhUmVzdWx0VHlwZSxcblx0UGF5bWVudE1ldGhvZFR5cGUsXG5cdFBheW1lbnRNZXRob2RUeXBlVG9OYW1lLFxufSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBzaG93UHJvZ3Jlc3NEaWFsb2cgfSBmcm9tIFwiLi4vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBBY2NvdW50aW5nSW5mbywgQnJhaW50cmVlM2RzMlJlcXVlc3QgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBBY2NvdW50aW5nSW5mb1R5cGVSZWYsIEludm9pY2VJbmZvVHlwZVJlZiB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIG5ldmVyTnVsbCwgbm9PcCwgcHJvbWlzZU1hcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgZ2V0TGF6eUxvYWRlZFBheVBhbFVybCwgZ2V0UHJlY29uZGl0aW9uRmFpbGVkUGF5bWVudE1zZywgUGF5bWVudEVycm9yQ29kZSwgVXBncmFkZVR5cGUgfSBmcm9tIFwiLi9TdWJzY3JpcHRpb25VdGlsc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB0eXBlIHsgU2VnbWVudENvbnRyb2xJdGVtIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1NlZ21lbnRDb250cm9sXCJcbmltcG9ydCB7IFNlZ21lbnRDb250cm9sIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1NlZ21lbnRDb250cm9sXCJcbmltcG9ydCB0eXBlIHsgV2l6YXJkUGFnZUF0dHJzLCBXaXphcmRQYWdlTiB9IGZyb20gXCIuLi9ndWkvYmFzZS9XaXphcmREaWFsb2cuanNcIlxuaW1wb3J0IHsgZW1pdFdpemFyZEV2ZW50LCBXaXphcmRFdmVudFR5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvV2l6YXJkRGlhbG9nLmpzXCJcbmltcG9ydCB0eXBlIHsgQ291bnRyeSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0NvdW50cnlMaXN0XCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uL2d1aS9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbHMgfSBmcm9tIFwiLi4vbWlzYy9jcmVkZW50aWFscy9DcmVkZW50aWFsc1wiXG5pbXBvcnQgeyBTZXNzaW9uVHlwZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL1Nlc3Npb25UeXBlLmpzXCJcbmltcG9ydCB7IFVzYWdlVGVzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXNhZ2V0ZXN0c1wiXG5pbXBvcnQgeyBQYXltZW50SW50ZXJ2YWwgfSBmcm9tIFwiLi9QcmljZVV0aWxzLmpzXCJcbmltcG9ydCB7IEVudGl0eVVwZGF0ZURhdGEsIGlzVXBkYXRlRm9yVHlwZVJlZiB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzLmpzXCJcbmltcG9ydCB7IEVudGl0eUV2ZW50c0xpc3RlbmVyIH0gZnJvbSBcIi4uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcblxuLyoqXG4gKiBXaXphcmQgcGFnZSBmb3IgZWRpdGluZyBpbnZvaWNlIGFuZCBwYXltZW50IGRhdGEuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnZvaWNlQW5kUGF5bWVudERhdGFQYWdlIGltcGxlbWVudHMgV2l6YXJkUGFnZU48VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+IHtcblx0cHJpdmF0ZSBfcGF5bWVudE1ldGhvZElucHV0OiBQYXltZW50TWV0aG9kSW5wdXQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIF9pbnZvaWNlRGF0YUlucHV0OiBJbnZvaWNlRGF0YUlucHV0IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfYXZhaWxhYmxlUGF5bWVudE1ldGhvZHM6IEFycmF5PFNlZ21lbnRDb250cm9sSXRlbTxQYXltZW50TWV0aG9kVHlwZT4+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfc2VsZWN0ZWRQYXltZW50TWV0aG9kOiBTdHJlYW08UGF5bWVudE1ldGhvZFR5cGU+XG5cdHByaXZhdGUgZG9tITogSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBfX3NpZ251cFBhaWRUZXN0PzogVXNhZ2VUZXN0XG5cdHByaXZhdGUgX19wYXltZW50UGF5cGFsVGVzdD86IFVzYWdlVGVzdFxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuX19zaWdudXBQYWlkVGVzdCA9IGxvY2F0b3IudXNhZ2VUZXN0Q29udHJvbGxlci5nZXRUZXN0KFwic2lnbnVwLnBhaWRcIilcblx0XHR0aGlzLl9fcGF5bWVudFBheXBhbFRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInBheW1lbnQucGF5cGFsXCIpXG5cblx0XHR0aGlzLl9zZWxlY3RlZFBheW1lbnRNZXRob2QgPSBzdHJlYW0oKVxuXG5cdFx0dGhpcy5fc2VsZWN0ZWRQYXltZW50TWV0aG9kLm1hcCgobWV0aG9kKSA9PiBuZXZlck51bGwodGhpcy5fcGF5bWVudE1ldGhvZElucHV0KS51cGRhdGVQYXltZW50TWV0aG9kKG1ldGhvZCkpXG5cdH1cblxuXHRvbnJlbW92ZSh2bm9kZTogVm5vZGU8V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4pIHtcblx0XHRjb25zdCBkYXRhID0gdm5vZGUuYXR0cnMuZGF0YVxuXG5cdFx0Ly8gVE9ETyBjaGVjayBpZiBjb3JyZWN0IHBsYWNlIHRvIHVwZGF0ZSB0aGVzZVxuXHRcdGlmICh0aGlzLl9pbnZvaWNlRGF0YUlucHV0ICYmIHRoaXMuX3BheW1lbnRNZXRob2RJbnB1dCkge1xuXHRcdFx0ZGF0YS5pbnZvaWNlRGF0YSA9IHRoaXMuX2ludm9pY2VEYXRhSW5wdXQuZ2V0SW52b2ljZURhdGEoKVxuXHRcdFx0ZGF0YS5wYXltZW50RGF0YSA9IHRoaXMuX3BheW1lbnRNZXRob2RJbnB1dC5nZXRQYXltZW50RGF0YSgpXG5cdFx0fVxuXHR9XG5cblx0b25jcmVhdGUodm5vZGU6IFZub2RlRE9NPFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4+KSB7XG5cdFx0dGhpcy5kb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRjb25zdCBkYXRhID0gdm5vZGUuYXR0cnMuZGF0YVxuXG5cdFx0Ly8gVE9ETyBjaGVjayBpZiBjb3JyZWN0IHBsYWNlIHRvIHVwZGF0ZSB0aGVzZVxuXHRcdGlmICh0aGlzLl9pbnZvaWNlRGF0YUlucHV0ICYmIHRoaXMuX3BheW1lbnRNZXRob2RJbnB1dCkge1xuXHRcdFx0ZGF0YS5pbnZvaWNlRGF0YSA9IHRoaXMuX2ludm9pY2VEYXRhSW5wdXQuZ2V0SW52b2ljZURhdGEoKVxuXHRcdFx0ZGF0YS5wYXltZW50RGF0YSA9IHRoaXMuX3BheW1lbnRNZXRob2RJbnB1dC5nZXRQYXltZW50RGF0YSgpXG5cdFx0fVxuXG5cdFx0bGV0IGxvZ2luOiBQcm9taXNlPENyZWRlbnRpYWxzIHwgbnVsbD4gPSBQcm9taXNlLnJlc29sdmUobnVsbClcblxuXHRcdGlmICghbG9jYXRvci5sb2dpbnMuaXNVc2VyTG9nZ2VkSW4oKSkge1xuXHRcdFx0bG9naW4gPSBsb2NhdG9yLmxvZ2luc1xuXHRcdFx0XHQuY3JlYXRlU2Vzc2lvbihuZXZlck51bGwoZGF0YS5uZXdBY2NvdW50RGF0YSkubWFpbEFkZHJlc3MsIG5ldmVyTnVsbChkYXRhLm5ld0FjY291bnREYXRhKS5wYXNzd29yZCwgU2Vzc2lvblR5cGUuVGVtcG9yYXJ5KVxuXHRcdFx0XHQudGhlbigobmV3U2Vzc2lvbkRhdGEpID0+IG5ld1Nlc3Npb25EYXRhLmNyZWRlbnRpYWxzKVxuXHRcdH1cblxuXHRcdGxvZ2luXG5cdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdGlmICghZGF0YS5hY2NvdW50aW5nSW5mbyB8fCAhZGF0YS5jdXN0b21lcikge1xuXHRcdFx0XHRcdHJldHVybiBsb2NhdG9yLmxvZ2luc1xuXHRcdFx0XHRcdFx0LmdldFVzZXJDb250cm9sbGVyKClcblx0XHRcdFx0XHRcdC5sb2FkQ3VzdG9tZXIoKVxuXHRcdFx0XHRcdFx0LnRoZW4oKGN1c3RvbWVyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGRhdGEuY3VzdG9tZXIgPSBjdXN0b21lclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQ3VzdG9tZXJJbmZvKClcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbigoY3VzdG9tZXJJbmZvKSA9PlxuXHRcdFx0XHRcdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkKEFjY291bnRpbmdJbmZvVHlwZVJlZiwgY3VzdG9tZXJJbmZvLmFjY291bnRpbmdJbmZvKS50aGVuKChhY2NvdW50aW5nSW5mbykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGRhdGEuYWNjb3VudGluZ0luZm8gPSBhY2NvdW50aW5nSW5mb1xuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50aGVuKCgpID0+IGdldERlZmF1bHRQYXltZW50TWV0aG9kKCkpXG5cdFx0XHQudGhlbigoZGVmYXVsdFBheW1lbnRNZXRob2Q6IFBheW1lbnRNZXRob2RUeXBlKSA9PiB7XG5cdFx0XHRcdHRoaXMuX2ludm9pY2VEYXRhSW5wdXQgPSBuZXcgSW52b2ljZURhdGFJbnB1dChkYXRhLm9wdGlvbnMuYnVzaW5lc3NVc2UoKSwgZGF0YS5pbnZvaWNlRGF0YSwgSW52b2ljZURhdGFJbnB1dExvY2F0aW9uLkluV2l6YXJkKVxuXHRcdFx0XHRsZXQgcGF5UGFsUmVxdWVzdFVybCA9IGdldExhenlMb2FkZWRQYXlQYWxVcmwoKVxuXG5cdFx0XHRcdGlmIChsb2NhdG9yLmxvZ2lucy5pc1VzZXJMb2dnZWRJbigpKSB7XG5cdFx0XHRcdFx0bG9jYXRvci5sb2dpbnMud2FpdEZvckZ1bGxMb2dpbigpLnRoZW4oKCkgPT4gcGF5UGFsUmVxdWVzdFVybC5nZXRBc3luYygpKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5fcGF5bWVudE1ldGhvZElucHV0ID0gbmV3IFBheW1lbnRNZXRob2RJbnB1dChcblx0XHRcdFx0XHRkYXRhLm9wdGlvbnMsXG5cdFx0XHRcdFx0dGhpcy5faW52b2ljZURhdGFJbnB1dC5zZWxlY3RlZENvdW50cnksXG5cdFx0XHRcdFx0bmV2ZXJOdWxsKGRhdGEuYWNjb3VudGluZ0luZm8pLFxuXHRcdFx0XHRcdHBheVBhbFJlcXVlc3RVcmwsXG5cdFx0XHRcdFx0ZGVmYXVsdFBheW1lbnRNZXRob2QsXG5cdFx0XHRcdClcblx0XHRcdFx0dGhpcy5fYXZhaWxhYmxlUGF5bWVudE1ldGhvZHMgPSB0aGlzLl9wYXltZW50TWV0aG9kSW5wdXQuZ2V0VmlzaWJsZVBheW1lbnRNZXRob2RzKClcblxuXHRcdFx0XHR0aGlzLl9zZWxlY3RlZFBheW1lbnRNZXRob2QoZGF0YS5wYXltZW50RGF0YS5wYXltZW50TWV0aG9kKVxuXG5cdFx0XHRcdHRoaXMuX3BheW1lbnRNZXRob2RJbnB1dC51cGRhdGVQYXltZW50TWV0aG9kKGRhdGEucGF5bWVudERhdGEucGF5bWVudE1ldGhvZCwgZGF0YS5wYXltZW50RGF0YSlcblx0XHRcdH0pXG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+Pik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblxuXHRcdGNvbnN0IG9uTmV4dENsaWNrID0gKCkgPT4ge1xuXHRcdFx0Y29uc3QgaW52b2ljZURhdGFJbnB1dCA9IGFzc2VydE5vdE51bGwodGhpcy5faW52b2ljZURhdGFJbnB1dClcblx0XHRcdGNvbnN0IHBheW1lbnRNZXRob2RJbnB1dCA9IGFzc2VydE5vdE51bGwodGhpcy5fcGF5bWVudE1ldGhvZElucHV0KVxuXHRcdFx0bGV0IGVycm9yID0gaW52b2ljZURhdGFJbnB1dC52YWxpZGF0ZUludm9pY2VEYXRhKCkgfHwgcGF5bWVudE1ldGhvZElucHV0LnZhbGlkYXRlUGF5bWVudERhdGEoKVxuXG5cdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKGVycm9yKS50aGVuKCgpID0+IG51bGwpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhLmRhdGEuaW52b2ljZURhdGEgPSBpbnZvaWNlRGF0YUlucHV0LmdldEludm9pY2VEYXRhKClcblx0XHRcdFx0YS5kYXRhLnBheW1lbnREYXRhID0gcGF5bWVudE1ldGhvZElucHV0LmdldFBheW1lbnREYXRhKClcblx0XHRcdFx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcblx0XHRcdFx0XHRcInVwZGF0ZVBheW1lbnREYXRhQnVzeV9tc2dcIixcblx0XHRcdFx0XHRQcm9taXNlLnJlc29sdmUoKVxuXHRcdFx0XHRcdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRsZXQgY3VzdG9tZXIgPSBuZXZlck51bGwoYS5kYXRhLmN1c3RvbWVyKVxuXG5cdFx0XHRcdFx0XHRcdGlmIChjdXN0b21lci5idXNpbmVzc1VzZSAhPT0gYS5kYXRhLm9wdGlvbnMuYnVzaW5lc3NVc2UoKSkge1xuXHRcdFx0XHRcdFx0XHRcdGN1c3RvbWVyLmJ1c2luZXNzVXNlID0gYS5kYXRhLm9wdGlvbnMuYnVzaW5lc3NVc2UoKVxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBsb2NhdG9yLmVudGl0eUNsaWVudC51cGRhdGUoY3VzdG9tZXIpXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbigoKSA9PlxuXHRcdFx0XHRcdFx0XHR1cGRhdGVQYXltZW50RGF0YShcblx0XHRcdFx0XHRcdFx0XHRhLmRhdGEub3B0aW9ucy5wYXltZW50SW50ZXJ2YWwoKSxcblx0XHRcdFx0XHRcdFx0XHRhLmRhdGEuaW52b2ljZURhdGEsXG5cdFx0XHRcdFx0XHRcdFx0YS5kYXRhLnBheW1lbnREYXRhLFxuXHRcdFx0XHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0YS5kYXRhLnVwZ3JhZGVUeXBlID09PSBVcGdyYWRlVHlwZS5TaWdudXAsXG5cdFx0XHRcdFx0XHRcdFx0bmV2ZXJOdWxsKGEuZGF0YS5wcmljZT8ucmF3UHJpY2UpLFxuXHRcdFx0XHRcdFx0XHRcdG5ldmVyTnVsbChhLmRhdGEuYWNjb3VudGluZ0luZm8pLFxuXHRcdFx0XHRcdFx0XHQpLnRoZW4oKHN1Y2Nlc3MpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gUGF5bWVudCBtZXRob2QgY29uZmlybWF0aW9uIChjbGljayBvbiBuZXh0KSwgc2VuZCBzZWxlY3RlZCBwYXltZW50IG1ldGhvZCBhcyBhbiBlbnVtXG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBwYXltZW50TWV0aG9kQ29uZmlybWF0aW9uU3RhZ2UgPSB0aGlzLl9fc2lnbnVwUGFpZFRlc3Q/LmdldFN0YWdlKDQpXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXltZW50TWV0aG9kQ29uZmlybWF0aW9uU3RhZ2U/LnNldE1ldHJpYyh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwicGF5bWVudE1ldGhvZFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogUGF5bWVudE1ldGhvZFR5cGVUb05hbWVbYS5kYXRhLnBheW1lbnREYXRhLnBheW1lbnRNZXRob2RdLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdHBheW1lbnRNZXRob2RDb25maXJtYXRpb25TdGFnZT8uY29tcGxldGUoKVxuXHRcdFx0XHRcdFx0XHRcdFx0ZW1pdFdpemFyZEV2ZW50KHRoaXMuZG9tLCBXaXphcmRFdmVudFR5cGUuU0hPV19ORVhUX1BBR0UpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdClcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLnB0XCIsXG5cdFx0XHR0aGlzLl9hdmFpbGFibGVQYXltZW50TWV0aG9kc1xuXHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdG0oU2VnbWVudENvbnRyb2wsIHtcblx0XHRcdFx0XHRcdFx0aXRlbXM6IHRoaXMuX2F2YWlsYWJsZVBheW1lbnRNZXRob2RzLFxuXHRcdFx0XHRcdFx0XHRzZWxlY3RlZFZhbHVlOiB0aGlzLl9zZWxlY3RlZFBheW1lbnRNZXRob2QoKSxcblx0XHRcdFx0XHRcdFx0b25WYWx1ZVNlbGVjdGVkOiB0aGlzLl9zZWxlY3RlZFBheW1lbnRNZXRob2QsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdG0oXCIuZmxleC1zcGFjZS1hcm91bmQuZmxleC13cmFwLnB0XCIsIFtcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LWdyb3ctc2hyaW5rLWhhbGYucGxyLWxcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRtaW5XaWR0aDogXCIyNjBweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdG0obmV2ZXJOdWxsKHRoaXMuX2ludm9pY2VEYXRhSW5wdXQpKSxcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LWdyb3ctc2hyaW5rLWhhbGYucGxyLWxcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRtaW5XaWR0aDogXCIyNjBweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdG0obmV2ZXJOdWxsKHRoaXMuX3BheW1lbnRNZXRob2RJbnB1dCkpLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcIi5mbGV4LWNlbnRlci5mdWxsLXdpZHRoLnB0LWxcIixcblx0XHRcdFx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcIm5leHRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0Y2xhc3M6IFwic21hbGwtbG9naW4tYnV0dG9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0b25jbGljazogb25OZXh0Q2xpY2ssXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0ICBdXG5cdFx0XHRcdDogbnVsbCxcblx0XHQpXG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VBdHRycyBpbXBsZW1lbnRzIFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4ge1xuXHRkYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YVxuXHRfZW5hYmxlZDogKCkgPT4gYm9vbGVhbiA9ICgpID0+IHRydWVcblxuXHRjb25zdHJ1Y3Rvcih1cGdyYWRlRGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEpIHtcblx0XHR0aGlzLmRhdGEgPSB1cGdyYWRlRGF0YVxuXHR9XG5cblx0bmV4dEFjdGlvbihzaG93RXJyb3JEaWFsb2c6IGJvb2xlYW4pOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRydWUpXG5cdH1cblxuXHRoZWFkZXJUaXRsZSgpOiBUcmFuc2xhdGlvbktleSB7XG5cdFx0cmV0dXJuIFwiYWRtaW5QYXltZW50X2FjdGlvblwiXG5cdH1cblxuXHRpc1NraXBBdmFpbGFibGUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRpc0VuYWJsZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuX2VuYWJsZWQoKVxuXHR9XG5cblx0LyoqXG5cdCAqIFNldCB0aGUgZW5hYmxlZCBmdW5jdGlvbiBmb3IgaXNFbmFibGVkXG5cdCAqIEBwYXJhbSBlbmFibGVkXG5cdCAqL1xuXHRzZXRFbmFibGVkRnVuY3Rpb248VD4oZW5hYmxlZDogKCkgPT4gYm9vbGVhbikge1xuXHRcdHRoaXMuX2VuYWJsZWQgPSBlbmFibGVkXG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVBheW1lbnREYXRhKFxuXHRwYXltZW50SW50ZXJ2YWw6IFBheW1lbnRJbnRlcnZhbCxcblx0aW52b2ljZURhdGE6IEludm9pY2VEYXRhLFxuXHRwYXltZW50RGF0YTogUGF5bWVudERhdGEgfCBudWxsLFxuXHRjb25maXJtZWRDb3VudHJ5OiBDb3VudHJ5IHwgbnVsbCxcblx0aXNTaWdudXA6IGJvb2xlYW4sXG5cdHByaWNlOiBzdHJpbmcgfCBudWxsLFxuXHRhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8sXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0Y29uc3QgcGF5bWVudFJlc3VsdCA9IGF3YWl0IGxvY2F0b3IuY3VzdG9tZXJGYWNhZGUudXBkYXRlUGF5bWVudERhdGEocGF5bWVudEludGVydmFsLCBpbnZvaWNlRGF0YSwgcGF5bWVudERhdGEsIGNvbmZpcm1lZENvdW50cnkpXG5cdGNvbnN0IHN0YXR1c0NvZGUgPSBwYXltZW50UmVzdWx0LnJlc3VsdFxuXG5cdGlmIChzdGF0dXNDb2RlID09PSBQYXltZW50RGF0YVJlc3VsdFR5cGUuT0spIHtcblx0XHQvLyBzaG93IGRpYWxvZ1xuXHRcdGxldCBicmFpbnRyZWUzZHMgPSBwYXltZW50UmVzdWx0LmJyYWludHJlZTNkc1JlcXVlc3Rcblx0XHRpZiAoYnJhaW50cmVlM2RzKSB7XG5cdFx0XHRyZXR1cm4gdmVyaWZ5Q3JlZGl0Q2FyZChhY2NvdW50aW5nSW5mbywgYnJhaW50cmVlM2RzLCBwcmljZSEpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXHR9IGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IFBheW1lbnREYXRhUmVzdWx0VHlwZS5DT1VOVFJZX01JU01BVENIKSB7XG5cdFx0Y29uc3QgY291bnRyeU5hbWUgPSBpbnZvaWNlRGF0YS5jb3VudHJ5ID8gaW52b2ljZURhdGEuY291bnRyeS5uIDogXCJcIlxuXHRcdGNvbnN0IGNvbmZpcm1NZXNzYWdlID0gbGFuZy5nZXRUcmFuc2xhdGlvbihcImNvbmZpcm1Db3VudHJ5X21zZ1wiLCB7XG5cdFx0XHRcInsxfVwiOiBjb3VudHJ5TmFtZSxcblx0XHR9KVxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IERpYWxvZy5jb25maXJtKGNvbmZpcm1NZXNzYWdlKVxuXHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdHJldHVybiB1cGRhdGVQYXltZW50RGF0YShwYXltZW50SW50ZXJ2YWwsIGludm9pY2VEYXRhLCBwYXltZW50RGF0YSwgaW52b2ljZURhdGEuY291bnRyeSwgaXNTaWdudXAsIHByaWNlLCBhY2NvdW50aW5nSW5mbykgLy8gYWRkIGNvbmZpcm1lZCBpbnZvaWNlIGNvdW50cnlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHR9IGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IFBheW1lbnREYXRhUmVzdWx0VHlwZS5JTlZBTElEX1ZBVElEX05VTUJFUikge1xuXHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFxuXHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXCJpbnZhbGlkVmF0SWROdW1iZXJfbXNnXCIsIGxhbmcuZ2V0KFwiaW52YWxpZFZhdElkTnVtYmVyX21zZ1wiKSArIChpc1NpZ251cCA/IFwiIFwiICsgbGFuZy5nZXQoXCJhY2NvdW50V2FzU3RpbGxDcmVhdGVkX21zZ1wiKSA6IFwiXCIpKSxcblx0XHQpXG5cdH0gZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gUGF5bWVudERhdGFSZXN1bHRUeXBlLkNSRURJVF9DQVJEX0RFQ0xJTkVEKSB7XG5cdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXG5cdFx0XHRsYW5nLm1ha2VUcmFuc2xhdGlvbihcImNyZWRpdENhcmREZWNsaW5lZF9tc2dcIiwgbGFuZy5nZXQoXCJjcmVkaXRDYXJkRGVjbGluZWRfbXNnXCIpICsgKGlzU2lnbnVwID8gXCIgXCIgKyBsYW5nLmdldChcImFjY291bnRXYXNTdGlsbENyZWF0ZWRfbXNnXCIpIDogXCJcIikpLFxuXHRcdClcblx0fSBlbHNlIGlmIChzdGF0dXNDb2RlID09PSBQYXltZW50RGF0YVJlc3VsdFR5cGUuQ1JFRElUX0NBUkRfQ1ZWX0lOVkFMSUQpIHtcblx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShcImNyZWRpdENhcmRDVlZJbnZhbGlkX21zZ1wiKVxuXHR9IGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IFBheW1lbnREYXRhUmVzdWx0VHlwZS5QQVlNRU5UX1BST1ZJREVSX05PVF9BVkFJTEFCTEUpIHtcblx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShcblx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcInBheW1lbnRQcm92aWRlck5vdEF2YWlsYWJsZUVycm9yX21zZ1wiLFxuXHRcdFx0XHRsYW5nLmdldChcInBheW1lbnRQcm92aWRlck5vdEF2YWlsYWJsZUVycm9yX21zZ1wiKSArIChpc1NpZ251cCA/IFwiIFwiICsgbGFuZy5nZXQoXCJhY2NvdW50V2FzU3RpbGxDcmVhdGVkX21zZ1wiKSA6IFwiXCIpLFxuXHRcdFx0KSxcblx0XHQpXG5cdH0gZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gUGF5bWVudERhdGFSZXN1bHRUeXBlLk9USEVSX1BBWU1FTlRfQUNDT1VOVF9SRUpFQ1RFRCkge1xuXHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFxuXHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFwicGF5bWVudEFjY291bnRSZWplY3RlZF9tc2dcIixcblx0XHRcdFx0bGFuZy5nZXQoXCJwYXltZW50QWNjb3VudFJlamVjdGVkX21zZ1wiKSArIChpc1NpZ251cCA/IFwiIFwiICsgbGFuZy5nZXQoXCJhY2NvdW50V2FzU3RpbGxDcmVhdGVkX21zZ1wiKSA6IFwiXCIpLFxuXHRcdFx0KSxcblx0XHQpXG5cdH0gZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gUGF5bWVudERhdGFSZXN1bHRUeXBlLkNSRURJVF9DQVJEX0RBVEVfSU5WQUxJRCkge1xuXHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwiY3JlZGl0Q2FyZEV4cHJhdGlvbkRhdGVJbnZhbGlkX21zZ1wiKVxuXHR9IGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IFBheW1lbnREYXRhUmVzdWx0VHlwZS5DUkVESVRfQ0FSRF9OVU1CRVJfSU5WQUxJRCkge1xuXHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFxuXHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFwiY3JlZGl0Q2FyZE51bWJlckludmFsaWRfbXNnXCIsXG5cdFx0XHRcdGxhbmcuZ2V0KFwiY3JlZGl0Q2FyZE51bWJlckludmFsaWRfbXNnXCIpICsgKGlzU2lnbnVwID8gXCIgXCIgKyBsYW5nLmdldChcImFjY291bnRXYXNTdGlsbENyZWF0ZWRfbXNnXCIpIDogXCJcIiksXG5cdFx0XHQpLFxuXHRcdClcblx0fSBlbHNlIGlmIChzdGF0dXNDb2RlID09PSBQYXltZW50RGF0YVJlc3VsdFR5cGUuQ09VTERfTk9UX1ZFUklGWV9WQVRJRCkge1xuXHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFxuXHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFwiaW52YWxpZFZhdElkVmFsaWRhdGlvbkZhaWxlZF9tc2dcIixcblx0XHRcdFx0bGFuZy5nZXQoXCJpbnZhbGlkVmF0SWRWYWxpZGF0aW9uRmFpbGVkX21zZ1wiKSArIChpc1NpZ251cCA/IFwiIFwiICsgbGFuZy5nZXQoXCJhY2NvdW50V2FzU3RpbGxDcmVhdGVkX21zZ1wiKSA6IFwiXCIpLFxuXHRcdFx0KSxcblx0XHQpXG5cdH0gZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gUGF5bWVudERhdGFSZXN1bHRUeXBlLkNSRURJVF9DQVJEX1ZFUklGSUNBVElPTl9MSU1JVF9SRUFDSEVEKSB7XG5cdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXG5cdFx0XHRsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XCJjcmVkaXRDYXJkVmVyaWZpY2F0aW9uTGltaXRSZWFjaGVkX21zZ1wiLFxuXHRcdFx0XHRsYW5nLmdldChcImNyZWRpdENhcmRWZXJpZmljYXRpb25MaW1pdFJlYWNoZWRfbXNnXCIpICsgKGlzU2lnbnVwID8gXCIgXCIgKyBsYW5nLmdldChcImFjY291bnRXYXNTdGlsbENyZWF0ZWRfbXNnXCIpIDogXCJcIiksXG5cdFx0XHQpLFxuXHRcdClcblx0fSBlbHNlIHtcblx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShcblx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcIm90aGVyUGF5bWVudFByb3ZpZGVyRXJyb3JfbXNnXCIsXG5cdFx0XHRcdGxhbmcuZ2V0KFwib3RoZXJQYXltZW50UHJvdmlkZXJFcnJvcl9tc2dcIikgKyAoaXNTaWdudXAgPyBcIiBcIiArIGxhbmcuZ2V0KFwiYWNjb3VudFdhc1N0aWxsQ3JlYXRlZF9tc2dcIikgOiBcIlwiKSxcblx0XHRcdCksXG5cdFx0KVxuXHR9XG5cblx0cmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogRGlzcGxheXMgYSBwcm9ncmVzcyBkaWFsb2cgdGhhdCBhbGxvd3MgdG8gY2FuY2VsIHRoZSB2ZXJpZmljYXRpb24gYW5kIG9wZW5zIGEgbmV3IHdpbmRvdyB0byBkbyB0aGUgYWN0dWFsIHZlcmlmaWNhdGlvbiB3aXRoIHRoZSBiYW5rLlxuICovXG5mdW5jdGlvbiB2ZXJpZnlDcmVkaXRDYXJkKGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbywgYnJhaW50cmVlM2RzOiBCcmFpbnRyZWUzZHMyUmVxdWVzdCwgcHJpY2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRyZXR1cm4gbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZChJbnZvaWNlSW5mb1R5cGVSZWYsIG5ldmVyTnVsbChhY2NvdW50aW5nSW5mby5pbnZvaWNlSW5mbykpLnRoZW4oKGludm9pY2VJbmZvKSA9PiB7XG5cdFx0bGV0IGludm9pY2VJbmZvV3JhcHBlciA9IHtcblx0XHRcdGludm9pY2VJbmZvLFxuXHRcdH1cblx0XHRsZXQgcmVzb2x2ZTogKGFyZzA6IGJvb2xlYW4pID0+IHZvaWRcblx0XHRsZXQgcHJvZ3Jlc3NEaWFsb2dQcm9taXNlOiBQcm9taXNlPGJvb2xlYW4+ID0gbmV3IFByb21pc2UoKHJlcykgPT4gKHJlc29sdmUgPSByZXMpKVxuXHRcdGxldCBwcm9ncmVzc0RpYWxvZzogRGlhbG9nXG5cblx0XHRjb25zdCBjbG9zZUFjdGlvbiA9ICgpID0+IHtcblx0XHRcdC8vIHVzZXIgZGlkIG5vdCBjb21wbGV0ZSB0aGUgM2RzIGRpYWxvZyBhbmQgUGF5bWVudERhdGFTZXJ2aWNlLlBPU1Qgd2FzIG5vdCBpbnZva2VkXG5cdFx0XHRwcm9ncmVzc0RpYWxvZy5jbG9zZSgpXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoZmFsc2UpLCBEZWZhdWx0QW5pbWF0aW9uVGltZSlcblx0XHR9XG5cblx0XHRwcm9ncmVzc0RpYWxvZyA9IG5ldyBEaWFsb2coRGlhbG9nVHlwZS5BbGVydCwge1xuXHRcdFx0dmlldzogKCkgPT4gW1xuXHRcdFx0XHRtKFwiLmRpYWxvZy1jb250ZW50QnV0dG9uc0JvdHRvbS50ZXh0LWJyZWFrLnNlbGVjdGFibGVcIiwgbGFuZy5nZXQoXCJjcmVkaXRDYXJkUGVuZGluZ1ZlcmlmaWNhdGlvbl9tc2dcIikpLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXgtY2VudGVyLmRpYWxvZy1idXR0b25zXCIsXG5cdFx0XHRcdFx0bShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiBjbG9zZUFjdGlvbixcblx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0fSlcblx0XHRcdC5zZXRDbG9zZUhhbmRsZXIoY2xvc2VBY3Rpb24pXG5cdFx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0XHRrZXk6IEtleXMuUkVUVVJOLFxuXHRcdFx0XHRzaGlmdDogZmFsc2UsXG5cdFx0XHRcdGV4ZWM6IGNsb3NlQWN0aW9uLFxuXHRcdFx0XHRoZWxwOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0fSlcblx0XHRcdC5hZGRTaG9ydGN1dCh7XG5cdFx0XHRcdGtleTogS2V5cy5FU0MsXG5cdFx0XHRcdHNoaWZ0OiBmYWxzZSxcblx0XHRcdFx0ZXhlYzogY2xvc2VBY3Rpb24sXG5cdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHR9KVxuXHRcdGxldCBlbnRpdHlFdmVudExpc3RlbmVyOiBFbnRpdHlFdmVudHNMaXN0ZW5lciA9ICh1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+LCBldmVudE93bmVyR3JvdXBJZDogSWQpID0+IHtcblx0XHRcdHJldHVybiBwcm9taXNlTWFwKHVwZGF0ZXMsICh1cGRhdGUpID0+IHtcblx0XHRcdFx0aWYgKGlzVXBkYXRlRm9yVHlwZVJlZihJbnZvaWNlSW5mb1R5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZChJbnZvaWNlSW5mb1R5cGVSZWYsIHVwZGF0ZS5pbnN0YW5jZUlkKS50aGVuKChpbnZvaWNlSW5mbykgPT4ge1xuXHRcdFx0XHRcdFx0aW52b2ljZUluZm9XcmFwcGVyLmludm9pY2VJbmZvID0gaW52b2ljZUluZm9cblx0XHRcdFx0XHRcdGlmICghaW52b2ljZUluZm8ucGF5bWVudEVycm9ySW5mbykge1xuXHRcdFx0XHRcdFx0XHQvLyB1c2VyIHN1Y2Nlc3NmdWxseSB2ZXJpZmllZCB0aGUgY2FyZFxuXHRcdFx0XHRcdFx0XHRwcm9ncmVzc0RpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdFx0XHRcdHJlc29sdmUodHJ1ZSlcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoaW52b2ljZUluZm8ucGF5bWVudEVycm9ySW5mbyAmJiBpbnZvaWNlSW5mby5wYXltZW50RXJyb3JJbmZvLmVycm9yQ29kZSA9PT0gXCJjYXJkLjNkczJfcGVuZGluZ1wiKSB7XG5cdFx0XHRcdFx0XHRcdC8vIGtlZXAgd2FpdGluZy4gdGhpcyBlcnJvciBjb2RlIGlzIHNldCBiZWZvcmUgc3RhcnRpbmcgdGhlIDNEUzIgdmVyaWZpY2F0aW9uIGFuZCB3ZSBqdXN0IHJlY2VpdmVkIHRoZSBldmVudCB2ZXJ5IGxhdGVcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoaW52b2ljZUluZm8ucGF5bWVudEVycm9ySW5mbyAmJiBpbnZvaWNlSW5mby5wYXltZW50RXJyb3JJbmZvLmVycm9yQ29kZSAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHQvLyB2ZXJpZmljYXRpb24gZXJyb3IgZHVyaW5nIDNkcyB2ZXJpZmljYXRpb25cblx0XHRcdFx0XHRcdFx0bGV0IGVycm9yID0gXCIzZHNGYWlsZWRPdGhlclwiXG5cblx0XHRcdFx0XHRcdFx0c3dpdGNoIChpbnZvaWNlSW5mby5wYXltZW50RXJyb3JJbmZvLmVycm9yQ29kZSBhcyBQYXltZW50RXJyb3JDb2RlKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcImNhcmQuY3Z2X2ludmFsaWRcIjpcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yID0gXCJjdnZJbnZhbGlkXCJcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcImNhcmQubnVtYmVyX2ludmFsaWRcIjpcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yID0gXCJjY051bWJlckludmFsaWRcIlxuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWtcblxuXHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJjYXJkLmRhdGVfaW52YWxpZFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0ZXJyb3IgPSBcImV4cGlyYXRpb25EYXRlXCJcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcImNhcmQuaW5zdWZmaWNpZW50X2Z1bmRzXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRlcnJvciA9IFwiaW5zdWZmaWNpZW50RnVuZHNcIlxuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiY2FyZC5leHBpcmVkX2NhcmRcIjpcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yID0gXCJjYXJkRXhwaXJlZFwiXG5cdFx0XHRcdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJjYXJkLjNkczJfZmFpbGVkXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRlcnJvciA9IFwiM2RzRmFpbGVkXCJcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShnZXRQcmVjb25kaXRpb25GYWlsZWRQYXltZW50TXNnKGludm9pY2VJbmZvLnBheW1lbnRFcnJvckluZm8uZXJyb3JDb2RlKSlcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZShmYWxzZSlcblx0XHRcdFx0XHRcdFx0cHJvZ3Jlc3NEaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSkudGhlbihub09wKVxuXHRcdH1cblxuXHRcdGxvY2F0b3IuZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKGVudGl0eUV2ZW50TGlzdGVuZXIpXG5cdFx0Y29uc3QgYXBwID0gY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSA/IFwiY2FsZW5kYXJcIiA6IFwibWFpbFwiXG5cdFx0bGV0IHBhcmFtcyA9IGBjbGllbnRUb2tlbj0ke2VuY29kZVVSSUNvbXBvbmVudChicmFpbnRyZWUzZHMuY2xpZW50VG9rZW4pfSZub25jZT0ke2VuY29kZVVSSUNvbXBvbmVudChicmFpbnRyZWUzZHMubm9uY2UpfSZiaW49JHtlbmNvZGVVUklDb21wb25lbnQoXG5cdFx0XHRicmFpbnRyZWUzZHMuYmluLFxuXHRcdCl9JnByaWNlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHByaWNlKX0mbWVzc2FnZT0ke2VuY29kZVVSSUNvbXBvbmVudChsYW5nLmdldChcImNyZWRpdENhcmRWZXJpZmljYXRpb25fbXNnXCIpKX0mY2xpZW50VHlwZT0ke2dldENsaWVudFR5cGUoKX0mYXBwPSR7YXBwfWBcblx0XHREaWFsb2cubWVzc2FnZShcImNyZWRpdENhcmRWZXJpZmljYXRpb25OZWVkZWRQb3B1cF9tc2dcIikudGhlbigoKSA9PiB7XG5cdFx0XHRjb25zdCBwYXltZW50VXJsU3RyaW5nID0gbG9jYXRvci5kb21haW5Db25maWdQcm92aWRlcigpLmdldEN1cnJlbnREb21haW5Db25maWcoKS5wYXltZW50VXJsXG5cdFx0XHRjb25zdCBwYXltZW50VXJsID0gbmV3IFVSTChwYXltZW50VXJsU3RyaW5nKVxuXHRcdFx0cGF5bWVudFVybC5oYXNoICs9IHBhcmFtc1xuXHRcdFx0d2luZG93Lm9wZW4ocGF5bWVudFVybClcblx0XHRcdHByb2dyZXNzRGlhbG9nLnNob3coKVxuXHRcdH0pXG5cdFx0cmV0dXJuIHByb2dyZXNzRGlhbG9nUHJvbWlzZS5maW5hbGx5KCgpID0+IGxvY2F0b3IuZXZlbnRDb250cm9sbGVyLnJlbW92ZUVudGl0eUxpc3RlbmVyKGVudGl0eUV2ZW50TGlzdGVuZXIpKVxuXHR9KVxufVxuIiwiaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBJbnZvaWNlRGF0YUlucHV0LCBJbnZvaWNlRGF0YUlucHV0TG9jYXRpb24gfSBmcm9tIFwiLi9JbnZvaWNlRGF0YUlucHV0XCJcbmltcG9ydCB7IHVwZGF0ZVBheW1lbnREYXRhIH0gZnJvbSBcIi4vSW52b2ljZUFuZFBheW1lbnREYXRhUGFnZVwiXG5pbXBvcnQgeyBCYWRSZXF1ZXN0RXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHR5cGUgeyBBY2NvdW50aW5nSW5mbywgQ3VzdG9tZXIgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBzaG93UHJvZ3Jlc3NEaWFsb2cgfSBmcm9tIFwiLi4vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBJbnZvaWNlRGF0YSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGFzUGF5bWVudEludGVydmFsIH0gZnJvbSBcIi4vUHJpY2VVdGlscy5qc1wiXG5pbXBvcnQgeyBkZWZlciwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuXG4vKipcbiAqIFNob3dzIGEgZGlhbG9nIHRvIHVwZGF0ZSB0aGUgaW52b2ljZSBkYXRhIGZvciBidXNpbmVzcyB1c2UuIFN3aXRjaGVzIHRoZSBhY2NvdW50IHRvIGJ1c2luZXNzIHVzZSBiZWZvcmUgYWN0dWFsbHkgc2F2aW5nIHRoZSBuZXcgaW52b2ljZSBkYXRhXG4gKiBiZWNhdXNlIG9ubHkgd2hlbiB0aGUgYWNjb3VudCBpcyBzZXQgdG8gYnVzaW5lc3MgdXNlIHNvbWUgcGF5bWVudCBkYXRhIGxpa2UgdmF0IGlkIG51bWJlciBtYXkgYmUgc2F2ZWQuXG4gKiBAcmV0dXJuIHRydWUsIGlmIHRoZSBidXNpbmVzcyBpbnZvaWNlRGF0YSB3YXMgd3JpdHRlbiBzdWNjZXNzZnVsbHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3dTd2l0Y2hUb0J1c2luZXNzSW52b2ljZURhdGFEaWFsb2coY3VzdG9tZXI6IEN1c3RvbWVyLCBpbnZvaWNlRGF0YTogSW52b2ljZURhdGEsIGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRpZiAoY3VzdG9tZXIuYnVzaW5lc3NVc2UpIHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImNhbm5vdCBzaG93IGludm9pY2UgZGF0YSBkaWFsb2cgaWYgdGhlIGN1c3RvbWVyIGlzIGFscmVhZHkgYSBidXNpbmVzcyBjdXN0b21lclwiKVxuXHR9XG5cdGNvbnN0IGludm9pY2VEYXRhSW5wdXQgPSBuZXcgSW52b2ljZURhdGFJbnB1dCh0cnVlLCBpbnZvaWNlRGF0YSwgSW52b2ljZURhdGFJbnB1dExvY2F0aW9uLkluV2l6YXJkKVxuXG5cdGNvbnN0IHJlc3VsdCA9IGRlZmVyPGJvb2xlYW4+KClcblx0Y29uc3QgY29uZmlybUFjdGlvbiA9IGFzeW5jICgpID0+IHtcblx0XHRsZXQgZXJyb3IgPSBpbnZvaWNlRGF0YUlucHV0LnZhbGlkYXRlSW52b2ljZURhdGEoKVxuXG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHREaWFsb2cubWVzc2FnZShlcnJvcilcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgcmVzdWx0LnByb21pc2UpXG5cblx0XHRcdGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB1cGRhdGVQYXltZW50RGF0YShcblx0XHRcdFx0YXNQYXltZW50SW50ZXJ2YWwoYWNjb3VudGluZ0luZm8ucGF5bWVudEludGVydmFsKSxcblx0XHRcdFx0aW52b2ljZURhdGFJbnB1dC5nZXRJbnZvaWNlRGF0YSgpLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRmYWxzZSxcblx0XHRcdFx0XCIwXCIsXG5cdFx0XHRcdGFjY291bnRpbmdJbmZvLFxuXHRcdFx0KVxuXHRcdFx0XHQuY2F0Y2goXG5cdFx0XHRcdFx0b2ZDbGFzcyhCYWRSZXF1ZXN0RXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwicGF5bWVudE1ldGhvZE5vdEF2YWlsYWJsZV9tc2dcIilcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdHJlc3VsdC5yZWplY3QoZSlcblx0XHRcdFx0fSlcblx0XHRcdGlmIChzdWNjZXNzKSB7XG5cdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdHJlc3VsdC5yZXNvbHZlKHRydWUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXN1bHQucmVzb2x2ZShmYWxzZSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCBjYW5jZWxBY3Rpb24gPSAoKSA9PiByZXN1bHQucmVzb2x2ZShmYWxzZSlcblxuXHRjb25zdCBkaWFsb2cgPSBEaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0dGl0bGU6IFwiaW52b2ljZURhdGFfbXNnXCIsXG5cdFx0Y2hpbGQ6IHtcblx0XHRcdHZpZXc6ICgpID0+XG5cdFx0XHRcdG0oXCIjY2hhbmdlSW52b2ljZURhdGFEaWFsb2dcIiwgW1xuXHRcdFx0XHRcdC8vIGluZm9NZXNzYWdlSWQgPyBtKFwiLnB0XCIsIGxhbmcuZ2V0KGluZm9NZXNzYWdlSWQpKSA6IG51bGwsXG5cdFx0XHRcdFx0bShpbnZvaWNlRGF0YUlucHV0KSxcblx0XHRcdFx0XSksXG5cdFx0fSxcblx0XHRva0FjdGlvbjogY29uZmlybUFjdGlvbixcblx0XHRjYW5jZWxBY3Rpb246IGNhbmNlbEFjdGlvbixcblx0XHRhbGxvd0NhbmNlbDogdHJ1ZSxcblx0XHRva0FjdGlvblRleHRJZDogXCJzYXZlX2FjdGlvblwiLFxuXHR9KVxuXG5cdHJldHVybiByZXN1bHQucHJvbWlzZVxufVxuIiwiLyogZ2VuZXJhdGVkIGZpbGUsIGRvbid0IGVkaXQuICovXG5cbmV4cG9ydCBjb25zdCBlbnVtIE1vYmlsZVBheW1lbnRTdWJzY3JpcHRpb25Pd25lcnNoaXAge1xuXHRPd25lciA9IFwiMFwiLFxuXHROb3RPd25lciA9IFwiMVwiLFxuXHROb1N1YnNjcmlwdGlvbiA9IFwiMlwiLFxufVxuIiwiaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEludm9pY2VEYXRhSW5wdXQgfSBmcm9tIFwiLi9JbnZvaWNlRGF0YUlucHV0XCJcbmltcG9ydCB7IHVwZGF0ZVBheW1lbnREYXRhIH0gZnJvbSBcIi4vSW52b2ljZUFuZFBheW1lbnREYXRhUGFnZVwiXG5pbXBvcnQgeyBCYWRSZXF1ZXN0RXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHR5cGUgeyBBY2NvdW50aW5nSW5mbyB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgSW52b2ljZURhdGEgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBvZkNsYXNzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBhc1BheW1lbnRJbnRlcnZhbCB9IGZyb20gXCIuL1ByaWNlVXRpbHMuanNcIlxuXG5leHBvcnQgZnVuY3Rpb24gc2hvdyhcblx0YnVzaW5lc3NVc2U6IGJvb2xlYW4sXG5cdGludm9pY2VEYXRhOiBJbnZvaWNlRGF0YSxcblx0YWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvLFxuXHRoZWFkaW5nSWQ/OiBUcmFuc2xhdGlvbktleSxcblx0aW5mb01lc3NhZ2VJZD86IFRyYW5zbGF0aW9uS2V5LFxuKTogRGlhbG9nIHtcblx0Y29uc3QgaW52b2ljZURhdGFJbnB1dCA9IG5ldyBJbnZvaWNlRGF0YUlucHV0KGJ1c2luZXNzVXNlLCBpbnZvaWNlRGF0YSlcblxuXHRjb25zdCBjb25maXJtQWN0aW9uID0gKCkgPT4ge1xuXHRcdGxldCBlcnJvciA9IGludm9pY2VEYXRhSW5wdXQudmFsaWRhdGVJbnZvaWNlRGF0YSgpXG5cblx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdERpYWxvZy5tZXNzYWdlKGVycm9yKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR1cGRhdGVQYXltZW50RGF0YShhc1BheW1lbnRJbnRlcnZhbChhY2NvdW50aW5nSW5mby5wYXltZW50SW50ZXJ2YWwpLCBpbnZvaWNlRGF0YUlucHV0LmdldEludm9pY2VEYXRhKCksIG51bGwsIG51bGwsIGZhbHNlLCBcIjBcIiwgYWNjb3VudGluZ0luZm8pXG5cdFx0XHRcdC50aGVuKChzdWNjZXNzKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHN1Y2Nlc3MpIHtcblx0XHRcdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goXG5cdFx0XHRcdFx0b2ZDbGFzcyhCYWRSZXF1ZXN0RXJyb3IsIChlKSA9PiB7XG5cdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcInBheW1lbnRNZXRob2ROb3RBdmFpbGFibGVfbXNnXCIpXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRjb25zdCBkaWFsb2cgPSBEaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0dGl0bGU6IGhlYWRpbmdJZCA/IGhlYWRpbmdJZCA6IFwiaW52b2ljZURhdGFfbXNnXCIsXG5cdFx0Y2hpbGQ6IHtcblx0XHRcdHZpZXc6ICgpID0+IG0oXCIjY2hhbmdlSW52b2ljZURhdGFEaWFsb2dcIiwgW2luZm9NZXNzYWdlSWQgPyBtKFwiLnB0XCIsIGxhbmcuZ2V0KGluZm9NZXNzYWdlSWQpKSA6IG51bGwsIG0oaW52b2ljZURhdGFJbnB1dCldKSxcblx0XHR9LFxuXHRcdG9rQWN0aW9uOiBjb25maXJtQWN0aW9uLFxuXHRcdGFsbG93Q2FuY2VsOiB0cnVlLFxuXHRcdG9rQWN0aW9uVGV4dElkOiBcInNhdmVfYWN0aW9uXCIsXG5cdH0pXG5cdHJldHVybiBkaWFsb2dcbn1cbiIsImltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGdldEJ5QWJicmV2aWF0aW9uIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vQ291bnRyeUxpc3RcIlxuaW1wb3J0IHsgUGF5bWVudE1ldGhvZElucHV0IH0gZnJvbSBcIi4vUGF5bWVudE1ldGhvZElucHV0XCJcbmltcG9ydCB7IHVwZGF0ZVBheW1lbnREYXRhIH0gZnJvbSBcIi4vSW52b2ljZUFuZFBheW1lbnREYXRhUGFnZVwiXG5pbXBvcnQgeyBweCB9IGZyb20gXCIuLi9ndWkvc2l6ZVwiXG5pbXBvcnQgeyBzaG93UHJvZ3Jlc3NEaWFsb2cgfSBmcm9tIFwiLi4vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHsgZ2V0RGVmYXVsdFBheW1lbnRNZXRob2QsIFBheW1lbnRNZXRob2RUeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgbmV2ZXJOdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IEFjY291bnRpbmdJbmZvLCBDdXN0b21lciB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IERyb3BEb3duU2VsZWN0b3IgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBhc1BheW1lbnRJbnRlcnZhbCB9IGZyb20gXCIuL1ByaWNlVXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0TGF6eUxvYWRlZFBheVBhbFVybCB9IGZyb20gXCIuL1N1YnNjcmlwdGlvblV0aWxzLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBmb3JtYXROYW1lQW5kQWRkcmVzcyB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkZvcm1hdHRlci5qc1wiXG5cbi8qKlxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdGhlIHBheW1lbnQgZGF0YSB1cGRhdGUgd2FzIHN1Y2Nlc3NmdWxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3coY3VzdG9tZXI6IEN1c3RvbWVyLCBhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8sIHByaWNlOiBudW1iZXIsIGRlZmF1bHRQYXltZW50TWV0aG9kOiBQYXltZW50TWV0aG9kVHlwZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRjb25zdCBwYXlQYWxSZXF1ZXN0VXJsID0gZ2V0TGF6eUxvYWRlZFBheVBhbFVybCgpXG5cdGNvbnN0IGludm9pY2VEYXRhID0ge1xuXHRcdGludm9pY2VBZGRyZXNzOiBmb3JtYXROYW1lQW5kQWRkcmVzcyhhY2NvdW50aW5nSW5mby5pbnZvaWNlTmFtZSwgYWNjb3VudGluZ0luZm8uaW52b2ljZUFkZHJlc3MpLFxuXHRcdGNvdW50cnk6IGFjY291bnRpbmdJbmZvLmludm9pY2VDb3VudHJ5ID8gZ2V0QnlBYmJyZXZpYXRpb24oYWNjb3VudGluZ0luZm8uaW52b2ljZUNvdW50cnkpIDogbnVsbCxcblx0XHR2YXROdW1iZXI6IGFjY291bnRpbmdJbmZvLmludm9pY2VWYXRJZE5vLFxuXHR9XG5cdGNvbnN0IHN1YnNjcmlwdGlvbk9wdGlvbnMgPSB7XG5cdFx0YnVzaW5lc3NVc2U6IHN0cmVhbShhc3NlcnROb3ROdWxsKGN1c3RvbWVyLmJ1c2luZXNzVXNlKSksXG5cdFx0cGF5bWVudEludGVydmFsOiBzdHJlYW0oYXNQYXltZW50SW50ZXJ2YWwoYWNjb3VudGluZ0luZm8ucGF5bWVudEludGVydmFsKSksXG5cdH1cblx0Y29uc3QgcGF5bWVudE1ldGhvZElucHV0ID0gbmV3IFBheW1lbnRNZXRob2RJbnB1dChcblx0XHRzdWJzY3JpcHRpb25PcHRpb25zLFxuXHRcdHN0cmVhbShpbnZvaWNlRGF0YS5jb3VudHJ5KSxcblx0XHRuZXZlck51bGwoYWNjb3VudGluZ0luZm8pLFxuXHRcdHBheVBhbFJlcXVlc3RVcmwsXG5cdFx0ZGVmYXVsdFBheW1lbnRNZXRob2QsXG5cdClcblx0Y29uc3QgYXZhaWxhYmxlUGF5bWVudE1ldGhvZHMgPSBwYXltZW50TWV0aG9kSW5wdXQuZ2V0VmlzaWJsZVBheW1lbnRNZXRob2RzKClcblxuXHRsZXQgc2VsZWN0ZWRQYXltZW50TWV0aG9kID0gYWNjb3VudGluZ0luZm8ucGF5bWVudE1ldGhvZCBhcyBQYXltZW50TWV0aG9kVHlwZVxuXHRwYXltZW50TWV0aG9kSW5wdXQudXBkYXRlUGF5bWVudE1ldGhvZChzZWxlY3RlZFBheW1lbnRNZXRob2QpXG5cdGNvbnN0IHNlbGVjdGVkUGF5bWVudE1ldGhvZENoYW5nZWRIYW5kbGVyID0gYXN5bmMgKHZhbHVlOiBQYXltZW50TWV0aG9kVHlwZSkgPT4ge1xuXHRcdGlmICh2YWx1ZSA9PT0gUGF5bWVudE1ldGhvZFR5cGUuUGF5cGFsICYmICFwYXlQYWxSZXF1ZXN0VXJsLmlzTG9hZGVkKCkpIHtcblx0XHRcdGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhcInBsZWFzZVdhaXRfbXNnXCIsIHBheVBhbFJlcXVlc3RVcmwuZ2V0QXN5bmMoKSlcblx0XHR9XG5cdFx0c2VsZWN0ZWRQYXltZW50TWV0aG9kID0gdmFsdWVcblx0XHRwYXltZW50TWV0aG9kSW5wdXQudXBkYXRlUGF5bWVudE1ldGhvZCh2YWx1ZSlcblx0fVxuXG5cdGNvbnN0IGRpZExpbmtQYXlwYWwgPSAoKSA9PiBzZWxlY3RlZFBheW1lbnRNZXRob2QgPT09IFBheW1lbnRNZXRob2RUeXBlLlBheXBhbCAmJiBwYXltZW50TWV0aG9kSW5wdXQuaXNQYXlwYWxBc3NpZ25lZCgpXG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0Y29uc3QgY29uZmlybUFjdGlvbiA9ICgpID0+IHtcblx0XHRcdGxldCBlcnJvciA9IHBheW1lbnRNZXRob2RJbnB1dC52YWxpZGF0ZVBheW1lbnREYXRhKClcblxuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKGVycm9yKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgZmluaXNoID0gKHN1Y2Nlc3M6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0XHRcdHJlc29sdmUodHJ1ZSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyB1cGRhdGVQYXltZW50RGF0YSBnZXRzIGRvbmUgd2hlbiB0aGUgYmlnIHBheXBhbCBidXR0b24gaXMgY2xpY2tlZFxuXHRcdFx0XHRpZiAoZGlkTGlua1BheXBhbCgpKSB7XG5cdFx0XHRcdFx0ZmluaXNoKHRydWUpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XHRcdFx0XCJ1cGRhdGVQYXltZW50RGF0YUJ1c3lfbXNnXCIsXG5cdFx0XHRcdFx0XHR1cGRhdGVQYXltZW50RGF0YShcblx0XHRcdFx0XHRcdFx0c3Vic2NyaXB0aW9uT3B0aW9ucy5wYXltZW50SW50ZXJ2YWwoKSxcblx0XHRcdFx0XHRcdFx0aW52b2ljZURhdGEsXG5cdFx0XHRcdFx0XHRcdHBheW1lbnRNZXRob2RJbnB1dC5nZXRQYXltZW50RGF0YSgpLFxuXHRcdFx0XHRcdFx0XHRpbnZvaWNlRGF0YS5jb3VudHJ5LFxuXHRcdFx0XHRcdFx0XHRmYWxzZSxcblx0XHRcdFx0XHRcdFx0cHJpY2UgKyBcIlwiLFxuXHRcdFx0XHRcdFx0XHRhY2NvdW50aW5nSW5mbyxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KS50aGVuKGZpbmlzaClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGRpYWxvZyA9IERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHRcdHRpdGxlOiBcImFkbWluUGF5bWVudF9hY3Rpb25cIixcblx0XHRcdGNoaWxkOiB7XG5cdFx0XHRcdHZpZXc6ICgpID0+XG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFwiI2NoYW5nZVBheW1lbnREYXRhRGlhbG9nXCIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0bWluSGVpZ2h0OiBweCgzMTApLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdFx0bShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwicGF5bWVudE1ldGhvZF9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW1zOiBhdmFpbGFibGVQYXltZW50TWV0aG9kcyxcblx0XHRcdFx0XHRcdFx0XHRzZWxlY3RlZFZhbHVlOiBzZWxlY3RlZFBheW1lbnRNZXRob2QsXG5cdFx0XHRcdFx0XHRcdFx0c2VsZWN0aW9uQ2hhbmdlZEhhbmRsZXI6IHNlbGVjdGVkUGF5bWVudE1ldGhvZENoYW5nZWRIYW5kbGVyLFxuXHRcdFx0XHRcdFx0XHRcdGRyb3Bkb3duV2lkdGg6IDI1MCxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdG0ocGF5bWVudE1ldGhvZElucHV0KSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0KSxcblx0XHRcdH0sXG5cdFx0XHRva0FjdGlvbjogY29uZmlybUFjdGlvbixcblx0XHRcdC8vIGlmIHRoZXkndmUganVzdCBnb25lIHRocm91Z2ggdGhlIHByb2Nlc3Mgb2YgbGlua2luZyBhIHBheXBhbCBhY2NvdW50LCBkb24ndCBvZmZlciBhIGNhbmNlbCBidXR0b25cblx0XHRcdGFsbG93Q2FuY2VsOiAoKSA9PiAhZGlkTGlua1BheXBhbCgpLFxuXHRcdFx0b2tBY3Rpb25UZXh0SWQ6IGRpZExpbmtQYXlwYWwoKSA/IFwiY2xvc2VfYWx0XCIgOiBcInNhdmVfYWN0aW9uXCIsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHJlc29sdmUoZmFsc2UpLFxuXHRcdH0pXG5cdH0pXG59XG4iLCJpbXBvcnQgeyBjcmVhdGUsIFN0cmlwcGVkLCBTdHJpcHBlZEVudGl0eSB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgVHlwZVJlZiB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgdHlwZU1vZGVscyB9IGZyb20gXCIuL1R5cGVNb2RlbHMuanNcIlxuXG5cbmV4cG9ydCBjb25zdCBDdXN0b21lckFjY291bnRQb3N0aW5nVHlwZVJlZjogVHlwZVJlZjxDdXN0b21lckFjY291bnRQb3N0aW5nPiA9IG5ldyBUeXBlUmVmKFwiYWNjb3VudGluZ1wiLCBcIkN1c3RvbWVyQWNjb3VudFBvc3RpbmdcIilcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbWVyQWNjb3VudFBvc3RpbmcodmFsdWVzOiBTdHJpcHBlZEVudGl0eTxDdXN0b21lckFjY291bnRQb3N0aW5nPik6IEN1c3RvbWVyQWNjb3VudFBvc3Rpbmcge1xuXHRyZXR1cm4gT2JqZWN0LmFzc2lnbihjcmVhdGUodHlwZU1vZGVscy5DdXN0b21lckFjY291bnRQb3N0aW5nLCBDdXN0b21lckFjY291bnRQb3N0aW5nVHlwZVJlZiksIHZhbHVlcylcbn1cblxuZXhwb3J0IHR5cGUgQ3VzdG9tZXJBY2NvdW50UG9zdGluZyA9IHtcblx0X3R5cGU6IFR5cGVSZWY8Q3VzdG9tZXJBY2NvdW50UG9zdGluZz47XG5cblx0X2lkOiBJZDtcblx0YW1vdW50OiBOdW1iZXJTdHJpbmc7XG5cdGludm9pY2VOdW1iZXI6IG51bGwgfCBzdHJpbmc7XG5cdHR5cGU6IE51bWJlclN0cmluZztcblx0dmFsdWVEYXRlOiBEYXRlO1xufVxuZXhwb3J0IGNvbnN0IEN1c3RvbWVyQWNjb3VudFJldHVyblR5cGVSZWY6IFR5cGVSZWY8Q3VzdG9tZXJBY2NvdW50UmV0dXJuPiA9IG5ldyBUeXBlUmVmKFwiYWNjb3VudGluZ1wiLCBcIkN1c3RvbWVyQWNjb3VudFJldHVyblwiKVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tZXJBY2NvdW50UmV0dXJuKHZhbHVlczogU3RyaXBwZWRFbnRpdHk8Q3VzdG9tZXJBY2NvdW50UmV0dXJuPik6IEN1c3RvbWVyQWNjb3VudFJldHVybiB7XG5cdHJldHVybiBPYmplY3QuYXNzaWduKGNyZWF0ZSh0eXBlTW9kZWxzLkN1c3RvbWVyQWNjb3VudFJldHVybiwgQ3VzdG9tZXJBY2NvdW50UmV0dXJuVHlwZVJlZiksIHZhbHVlcylcbn1cblxuZXhwb3J0IHR5cGUgQ3VzdG9tZXJBY2NvdW50UmV0dXJuID0ge1xuXHRfdHlwZTogVHlwZVJlZjxDdXN0b21lckFjY291bnRSZXR1cm4+O1xuXHRfZXJyb3JzOiBPYmplY3Q7XG5cblx0X2Zvcm1hdDogTnVtYmVyU3RyaW5nO1xuXHRfb3duZXJHcm91cDogbnVsbCB8IElkO1xuXHRfb3duZXJQdWJsaWNFbmNTZXNzaW9uS2V5OiBudWxsIHwgVWludDhBcnJheTtcblx0X3B1YmxpY0NyeXB0b1Byb3RvY29sVmVyc2lvbjogbnVsbCB8IE51bWJlclN0cmluZztcblx0YmFsYW5jZTogTnVtYmVyU3RyaW5nO1xuXHRvdXRzdGFuZGluZ0Jvb2tpbmdzUHJpY2U6IE51bWJlclN0cmluZztcblxuXHRwb3N0aW5nczogQ3VzdG9tZXJBY2NvdW50UG9zdGluZ1tdO1xufVxuIiwiaW1wb3J0IHsgQ3VzdG9tZXJBY2NvdW50UmV0dXJuVHlwZVJlZiB9IGZyb20gXCIuL1R5cGVSZWZzLmpzXCJcblxuZXhwb3J0IGNvbnN0IEN1c3RvbWVyQWNjb3VudFNlcnZpY2UgPSBPYmplY3QuZnJlZXplKHtcblx0YXBwOiBcImFjY291bnRpbmdcIixcblx0bmFtZTogXCJDdXN0b21lckFjY291bnRTZXJ2aWNlXCIsXG5cdGdldDogeyBkYXRhOiBudWxsLCByZXR1cm46IEN1c3RvbWVyQWNjb3VudFJldHVyblR5cGVSZWYgfSxcblx0cG9zdDogbnVsbCxcblx0cHV0OiBudWxsLFxuXHRkZWxldGU6IG51bGwsXG59IGFzIGNvbnN0KSIsImltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSwgaXNJT1NBcHAgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgbGFzdCwgbmV2ZXJOdWxsLCBvZkNsYXNzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBJbmZvTGluaywgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQge1xuXHRBY2NvdW50aW5nSW5mbyxcblx0QWNjb3VudGluZ0luZm9UeXBlUmVmLFxuXHRCb29raW5nVHlwZVJlZixcblx0Y3JlYXRlRGViaXRTZXJ2aWNlUHV0RGF0YSxcblx0Q3VzdG9tZXIsXG5cdEN1c3RvbWVyVHlwZVJlZixcblx0SW52b2ljZUluZm8sXG5cdEludm9pY2VJbmZvVHlwZVJlZixcbn0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgSHRtbEVkaXRvciwgSHRtbEVkaXRvck1vZGUgfSBmcm9tIFwiLi4vZ3VpL2VkaXRvci9IdG1sRWRpdG9yXCJcbmltcG9ydCB7IGZvcm1hdFByaWNlLCBnZXRQYXltZW50TWV0aG9kSW5mb1RleHQsIGdldFBheW1lbnRNZXRob2ROYW1lIH0gZnJvbSBcIi4vUHJpY2VVdGlsc1wiXG5pbXBvcnQgKiBhcyBJbnZvaWNlRGF0YURpYWxvZyBmcm9tIFwiLi9JbnZvaWNlRGF0YURpYWxvZ1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBDb2x1bW5XaWR0aCwgVGFibGUsIFRhYmxlTGluZUF0dHJzIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1RhYmxlLmpzXCJcbmltcG9ydCB7IEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IGZvcm1hdERhdGUgfSBmcm9tIFwiLi4vbWlzYy9Gb3JtYXR0ZXJcIlxuaW1wb3J0IHtcblx0QWNjb3VudFR5cGUsXG5cdEF2YWlsYWJsZVBsYW5zLFxuXHRnZXREZWZhdWx0UGF5bWVudE1ldGhvZCxcblx0Z2V0UGF5bWVudE1ldGhvZFR5cGUsXG5cdE5ld1BhaWRQbGFucyxcblx0UGF5bWVudE1ldGhvZFR5cGUsXG5cdFBvc3RpbmdUeXBlLFxufSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBCYWRHYXRld2F5RXJyb3IsIExvY2tlZEVycm9yLCBQcmVjb25kaXRpb25GYWlsZWRFcnJvciwgVG9vTWFueVJlcXVlc3RzRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBnZXRCeUFiYnJldmlhdGlvbiB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0NvdW50cnlMaXN0XCJcbmltcG9ydCAqIGFzIFBheW1lbnREYXRhRGlhbG9nIGZyb20gXCIuL1BheW1lbnREYXRhRGlhbG9nXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZ1wiXG5pbXBvcnQgeyBnZXRQcmVjb25kaXRpb25GYWlsZWRQYXltZW50TXNnLCBoYXNSdW5uaW5nQXBwU3RvcmVTdWJzY3JpcHRpb24gfSBmcm9tIFwiLi9TdWJzY3JpcHRpb25VdGlsc1wiXG5pbXBvcnQgdHlwZSB7IERpYWxvZ0hlYWRlckJhckF0dHJzIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ0hlYWRlckJhclwiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXIgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvRGlhbG9nSGVhZGVyQmFyXCJcbmltcG9ydCB7IFRleHRGaWVsZCB9IGZyb20gXCIuLi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHR5cGUgeyBDdXN0b21lckFjY291bnRQb3N0aW5nIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9hY2NvdW50aW5nL1R5cGVSZWZzXCJcbmltcG9ydCB7IEV4cGFuZGVyQnV0dG9uLCBFeHBhbmRlclBhbmVsIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0V4cGFuZGVyXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBjcmVhdGVOb3RBdmFpbGFibGVGb3JGcmVlQ2xpY2tIYW5kbGVyIH0gZnJvbSBcIi4uL21pc2MvU3Vic2NyaXB0aW9uRGlhbG9nc1wiXG5pbXBvcnQgeyBUcmFuc2xhdGlvbktleVR5cGUgfSBmcm9tIFwiLi4vbWlzYy9UcmFuc2xhdGlvbktleVwiXG5pbXBvcnQgeyBDdXN0b21lckFjY291bnRTZXJ2aWNlIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9hY2NvdW50aW5nL1NlcnZpY2VzXCJcbmltcG9ydCB7IERlYml0U2VydmljZSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1NlcnZpY2VzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0J1dHRvblNpemUuanNcIlxuaW1wb3J0IHsgZm9ybWF0TmFtZUFuZEFkZHJlc3MgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi91dGlscy9Db21tb25Gb3JtYXR0ZXIuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgRGV2aWNlVHlwZSB9IGZyb20gXCIuLi9taXNjL0NsaWVudENvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcbmltcG9ydCB0eXBlIHsgVXBkYXRhYmxlU2V0dGluZ3NWaWV3ZXIgfSBmcm9tIFwiLi4vc2V0dGluZ3MvSW50ZXJmYWNlcy5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBzaG93U3dpdGNoRGlhbG9nIH0gZnJvbSBcIi4vU3dpdGNoU3Vic2NyaXB0aW9uRGlhbG9nLmpzXCJcbmltcG9ydCB7IEdFTkVSQVRFRF9NQVhfSUQgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBjcmVhdGVEcm9wZG93biB9IGZyb20gXCIuLi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG4vKipcbiAqIERpc3BsYXlzIHBheW1lbnQgbWV0aG9kL2ludm9pY2UgZGF0YSBhbmQgYWxsb3dzIGNoYW5naW5nIHRoZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXltZW50Vmlld2VyIGltcGxlbWVudHMgVXBkYXRhYmxlU2V0dGluZ3NWaWV3ZXIge1xuXHRwcml2YXRlIHJlYWRvbmx5IGludm9pY2VBZGRyZXNzRmllbGQ6IEh0bWxFZGl0b3Jcblx0cHJpdmF0ZSBjdXN0b21lcjogQ3VzdG9tZXIgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcG9zdGluZ3M6IHJlYWRvbmx5IEN1c3RvbWVyQWNjb3VudFBvc3RpbmdbXSA9IFtdXG5cdHByaXZhdGUgb3V0c3RhbmRpbmdCb29raW5nc1ByaWNlOiBudW1iZXIgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGJhbGFuY2U6IG51bWJlciA9IDBcblx0cHJpdmF0ZSBpbnZvaWNlSW5mbzogSW52b2ljZUluZm8gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHBvc3RpbmdzRXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZVxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuaW52b2ljZUFkZHJlc3NGaWVsZCA9IG5ldyBIdG1sRWRpdG9yKClcblx0XHRcdC5zZXRNaW5IZWlnaHQoMTQwKVxuXHRcdFx0LnNob3dCb3JkZXJzKClcblx0XHRcdC5zZXRNb2RlKEh0bWxFZGl0b3JNb2RlLkhUTUwpXG5cdFx0XHQuc2V0SHRtbE1vbm9zcGFjZShmYWxzZSlcblx0XHRcdC5zZXRSZWFkT25seSh0cnVlKVxuXHRcdFx0LnNldFBsYWNlaG9sZGVySWQoXCJpbnZvaWNlQWRkcmVzc19sYWJlbFwiKVxuXHRcdHRoaXMubG9hZERhdGEoKVxuXHRcdHRoaXMudmlldyA9IHRoaXMudmlldy5iaW5kKHRoaXMpXG5cdH1cblxuXHR2aWV3KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiI2ludm9pY2luZy1zZXR0aW5ncy5maWxsLWFic29sdXRlLnNjcm9sbC5wbHItbFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRyb2xlOiBcImdyb3VwXCIsXG5cdFx0XHR9LFxuXHRcdFx0W3RoaXMucmVuZGVySW52b2ljZURhdGEoKSwgdGhpcy5yZW5kZXJQYXltZW50TWV0aG9kKCksIHRoaXMucmVuZGVyUG9zdGluZ3MoKV0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBsb2FkRGF0YSgpIHtcblx0XHR0aGlzLmN1c3RvbWVyID0gYXdhaXQgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQ3VzdG9tZXIoKVxuXHRcdGNvbnN0IGN1c3RvbWVySW5mbyA9IGF3YWl0IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkubG9hZEN1c3RvbWVySW5mbygpXG5cblx0XHRjb25zdCBhY2NvdW50aW5nSW5mbyA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoQWNjb3VudGluZ0luZm9UeXBlUmVmLCBjdXN0b21lckluZm8uYWNjb3VudGluZ0luZm8pXG5cdFx0dGhpcy51cGRhdGVBY2NvdW50aW5nSW5mb0RhdGEoYWNjb3VudGluZ0luZm8pXG5cdFx0dGhpcy5pbnZvaWNlSW5mbyA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoSW52b2ljZUluZm9UeXBlUmVmLCBuZXZlck51bGwoYWNjb3VudGluZ0luZm8uaW52b2ljZUluZm8pKVxuXHRcdG0ucmVkcmF3KClcblx0XHRhd2FpdCB0aGlzLmxvYWRQb3N0aW5ncygpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclBheW1lbnRNZXRob2QoKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHBheW1lbnRNZXRob2RIZWxwTGFiZWwgPSAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5hY2NvdW50aW5nSW5mbyAmJiBnZXRQYXltZW50TWV0aG9kVHlwZSh0aGlzLmFjY291bnRpbmdJbmZvKSA9PT0gUGF5bWVudE1ldGhvZFR5cGUuSW52b2ljZSkge1xuXHRcdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJwYXltZW50UHJvY2Vzc2luZ1RpbWVfbXNnXCIpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBcIlwiXG5cdFx0fVxuXG5cdFx0Y29uc3QgcGF5bWVudE1ldGhvZCA9IHRoaXMuYWNjb3VudGluZ0luZm9cblx0XHRcdD8gZ2V0UGF5bWVudE1ldGhvZE5hbWUoZ2V0UGF5bWVudE1ldGhvZFR5cGUobmV2ZXJOdWxsKHRoaXMuYWNjb3VudGluZ0luZm8pKSkgKyBcIiBcIiArIGdldFBheW1lbnRNZXRob2RJbmZvVGV4dChuZXZlck51bGwodGhpcy5hY2NvdW50aW5nSW5mbykpXG5cdFx0XHQ6IGxhbmcuZ2V0KFwibG9hZGluZ19tc2dcIilcblxuXHRcdHJldHVybiBtKFRleHRGaWVsZCwge1xuXHRcdFx0bGFiZWw6IFwicGF5bWVudE1ldGhvZF9sYWJlbFwiLFxuXHRcdFx0dmFsdWU6IHBheW1lbnRNZXRob2QsXG5cdFx0XHRoZWxwTGFiZWw6IHBheW1lbnRNZXRob2RIZWxwTGFiZWwsXG5cdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0aW5qZWN0aW9uc1JpZ2h0OiAoKSA9PlxuXHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHR0aXRsZTogXCJwYXltZW50TWV0aG9kX2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xpY2s6IChlLCBkb20pID0+IHRoaXMuaGFuZGxlUGF5bWVudE1ldGhvZENsaWNrKGUsIGRvbSksXG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdH0pLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZVBheW1lbnRNZXRob2RDbGljayhlOiBNb3VzZUV2ZW50LCBkb206IEhUTUxFbGVtZW50KSB7XG5cdFx0aWYgKHRoaXMuYWNjb3VudGluZ0luZm8gPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGNvbnN0IGN1cnJlbnRQYXltZW50TWV0aG9kOiBQYXltZW50TWV0aG9kVHlwZSB8IG51bGwgPSBnZXRQYXltZW50TWV0aG9kVHlwZSh0aGlzLmFjY291bnRpbmdJbmZvKVxuXHRcdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0XHQvLyBQYWlkIHVzZXJzIHRyeWluZyB0byBjaGFuZ2UgcGF5bWVudCBtZXRob2Qgb24gaU9TIHdpdGggYW4gYWN0aXZlIHN1YnNjcmlwdGlvblxuXHRcdFx0aWYgKGN1cnJlbnRQYXltZW50TWV0aG9kICE9PSBQYXltZW50TWV0aG9kVHlwZS5BcHBTdG9yZSAmJiB0aGlzLmN1c3RvbWVyPy50eXBlID09PSBBY2NvdW50VHlwZS5QQUlEKSB7XG5cdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShsYW5nLmdldFRyYW5zbGF0aW9uKFwic3RvcmVQYXltZW50TWV0aG9kQ2hhbmdlX21zZ1wiLCB7IFwie0FwcFN0b3JlUGF5bWVudENoYW5nZX1cIjogSW5mb0xpbmsuQXBwU3RvcmVQYXltZW50Q2hhbmdlIH0pKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbG9jYXRvci5tb2JpbGVQYXltZW50c0ZhY2FkZS5zaG93U3Vic2NyaXB0aW9uQ29uZmlnVmlldygpXG5cdFx0fSBlbHNlIGlmIChoYXNSdW5uaW5nQXBwU3RvcmVTdWJzY3JpcHRpb24odGhpcy5hY2NvdW50aW5nSW5mbykpIHtcblx0XHRcdHJldHVybiBzaG93TWFuYWdlVGhyb3VnaEFwcFN0b3JlRGlhbG9nKClcblx0XHR9IGVsc2UgaWYgKGN1cnJlbnRQYXltZW50TWV0aG9kID09IFBheW1lbnRNZXRob2RUeXBlLkFwcFN0b3JlICYmIHRoaXMuY3VzdG9tZXI/LnR5cGUgPT09IEFjY291bnRUeXBlLlBBSUQpIHtcblx0XHRcdC8vIEZvciBub3cgd2UgZG8gbm90IGFsbG93IGNoYW5naW5nIHBheW1lbnQgbWV0aG9kIGZvciBQYWlkIGFjY291bnRzIHRoYXQgdXNlIEFwcFN0b3JlLFxuXHRcdFx0Ly8gdGhleSBtdXN0IGRvd25ncmFkZSB0byBGcmVlIGZpcnN0LlxuXG5cdFx0XHRjb25zdCBpc1Jlc3Vic2NyaWJlID0gYXdhaXQgRGlhbG9nLmNob2ljZShcblx0XHRcdFx0bGFuZy5nZXRUcmFuc2xhdGlvbihcInN0b3JlRG93bmdyYWRlT3JSZXN1YnNjcmliZV9tc2dcIiwgeyBcIntBcHBTdG9yZURvd25ncmFkZX1cIjogSW5mb0xpbmsuQXBwU3RvcmVEb3duZ3JhZGUgfSksXG5cdFx0XHRcdFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0OiBcImNoYW5nZVBsYW5fYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHR2YWx1ZTogZmFsc2UsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0OiBcInJlc3Vic2NyaWJlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0dmFsdWU6IHRydWUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdClcblx0XHRcdGlmIChpc1Jlc3Vic2NyaWJlKSB7XG5cdFx0XHRcdHJldHVybiBzaG93TWFuYWdlVGhyb3VnaEFwcFN0b3JlRGlhbG9nKClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGN1c3RvbWVySW5mbyA9IGF3YWl0IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkubG9hZEN1c3RvbWVySW5mbygpXG5cdFx0XHRcdGNvbnN0IGJvb2tpbmdzID0gYXdhaXQgbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZFJhbmdlKEJvb2tpbmdUeXBlUmVmLCBhc3NlcnROb3ROdWxsKGN1c3RvbWVySW5mby5ib29raW5ncykuaXRlbXMsIEdFTkVSQVRFRF9NQVhfSUQsIDEsIHRydWUpXG5cdFx0XHRcdGNvbnN0IGxhc3RCb29raW5nID0gbGFzdChib29raW5ncylcblx0XHRcdFx0aWYgKGxhc3RCb29raW5nID09IG51bGwpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJObyBib29raW5nIGJ1dCBwYXltZW50IG1ldGhvZCBpcyBBcHBTdG9yZT9cIilcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gc2hvd1N3aXRjaERpYWxvZyh0aGlzLmN1c3RvbWVyLCBjdXN0b21lckluZm8sIHRoaXMuYWNjb3VudGluZ0luZm8sIGxhc3RCb29raW5nLCBBdmFpbGFibGVQbGFucywgbnVsbClcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgc2hvd1BheW1lbnRNZXRob2REaWFsb2cgPSBjcmVhdGVOb3RBdmFpbGFibGVGb3JGcmVlQ2xpY2tIYW5kbGVyKFxuXHRcdFx0XHROZXdQYWlkUGxhbnMsXG5cdFx0XHRcdCgpID0+IHRoaXMuYWNjb3VudGluZ0luZm8gJiYgdGhpcy5jaGFuZ2VQYXltZW50TWV0aG9kKCksXG5cdFx0XHRcdC8vIGlPUyBhcHAgaXMgY2hlY2tlZCBhYm92ZVxuXHRcdFx0XHQoKSA9PiBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzUHJlbWl1bUFjY291bnQoKSxcblx0XHRcdClcblxuXHRcdFx0c2hvd1BheW1lbnRNZXRob2REaWFsb2coZSwgZG9tKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgY2hhbmdlSW52b2ljZURhdGEoKSB7XG5cdFx0aWYgKHRoaXMuYWNjb3VudGluZ0luZm8pIHtcblx0XHRcdGNvbnN0IGFjY291bnRpbmdJbmZvID0gbmV2ZXJOdWxsKHRoaXMuYWNjb3VudGluZ0luZm8pXG5cdFx0XHRjb25zdCBpbnZvaWNlQ291bnRyeSA9IGFjY291bnRpbmdJbmZvLmludm9pY2VDb3VudHJ5ID8gZ2V0QnlBYmJyZXZpYXRpb24oYWNjb3VudGluZ0luZm8uaW52b2ljZUNvdW50cnkpIDogbnVsbFxuXHRcdFx0SW52b2ljZURhdGFEaWFsb2cuc2hvdyhcblx0XHRcdFx0bmV2ZXJOdWxsKG5ldmVyTnVsbCh0aGlzLmN1c3RvbWVyKS5idXNpbmVzc1VzZSksXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpbnZvaWNlQWRkcmVzczogZm9ybWF0TmFtZUFuZEFkZHJlc3MoYWNjb3VudGluZ0luZm8uaW52b2ljZU5hbWUsIGFjY291bnRpbmdJbmZvLmludm9pY2VBZGRyZXNzKSxcblx0XHRcdFx0XHRjb3VudHJ5OiBpbnZvaWNlQ291bnRyeSxcblx0XHRcdFx0XHR2YXROdW1iZXI6IGFjY291bnRpbmdJbmZvLmludm9pY2VWYXRJZE5vLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhY2NvdW50aW5nSW5mbyxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNoYW5nZVBheW1lbnRNZXRob2QoKSB7XG5cdFx0aWYgKHRoaXMuYWNjb3VudGluZ0luZm8gJiYgaGFzUnVubmluZ0FwcFN0b3JlU3Vic2NyaXB0aW9uKHRoaXMuYWNjb3VudGluZ0luZm8pKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIkFjdGl2ZSBBcHBTdG9yZSBzdWJzY3JpcHRpb25cIilcblx0XHR9XG5cblx0XHRsZXQgbmV4dFBheW1lbnQgPSB0aGlzLmFtb3VudE93ZWQoKSAqIC0xXG5cdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdFx0bG9jYXRvci5ib29raW5nRmFjYWRlLmdldEN1cnJlbnRQcmljZSgpLnRoZW4oKHByaWNlU2VydmljZVJldHVybikgPT4ge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5tYXgoXG5cdFx0XHRcdFx0bmV4dFBheW1lbnQsXG5cdFx0XHRcdFx0TnVtYmVyKG5ldmVyTnVsbChwcmljZVNlcnZpY2VSZXR1cm4uY3VycmVudFByaWNlVGhpc1BlcmlvZCkucHJpY2UpLFxuXHRcdFx0XHRcdE51bWJlcihuZXZlck51bGwocHJpY2VTZXJ2aWNlUmV0dXJuLmN1cnJlbnRQcmljZU5leHRQZXJpb2QpLnByaWNlKSxcblx0XHRcdFx0KVxuXHRcdFx0fSksXG5cdFx0KVxuXHRcdFx0LnRoZW4oKHByaWNlKSA9PlxuXHRcdFx0XHRnZXREZWZhdWx0UGF5bWVudE1ldGhvZCgpLnRoZW4oKHBheW1lbnRNZXRob2QpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4geyBwcmljZSwgcGF5bWVudE1ldGhvZCB9XG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LnRoZW4oKHsgcHJpY2UsIHBheW1lbnRNZXRob2QgfSkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gUGF5bWVudERhdGFEaWFsb2cuc2hvdyhuZXZlck51bGwodGhpcy5jdXN0b21lciksIG5ldmVyTnVsbCh0aGlzLmFjY291bnRpbmdJbmZvKSwgcHJpY2UsIHBheW1lbnRNZXRob2QpLnRoZW4oKHN1Y2Nlc3MpID0+IHtcblx0XHRcdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuaXNQYXlCdXR0b25WaXNpYmxlKCkpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2hvd1BheURpYWxvZyh0aGlzLmFtb3VudE93ZWQoKSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQb3N0aW5ncygpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKCF0aGlzLnBvc3RpbmdzIHx8IHRoaXMucG9zdGluZ3MubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBiYWxhbmNlID0gdGhpcy5iYWxhbmNlXG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRtKFwiLmg0Lm10LWxcIiwgbGFuZy5nZXQoXCJjdXJyZW50QmFsYW5jZV9sYWJlbFwiKSksXG5cdFx0XHRcdG0oXCIuZmxleC5jZW50ZXItaG9yaXpvbnRhbGx5LmNlbnRlci12ZXJ0aWNhbGx5LmNvbFwiLCBbXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFwiZGl2Lmg0LnB0LnBiXCIgKyAodGhpcy5pc0Ftb3VudE93ZWQoKSA/IFwiLmNvbnRlbnQtYWNjZW50LWZnXCIgOiBcIlwiKSxcblx0XHRcdFx0XHRcdGZvcm1hdFByaWNlKGJhbGFuY2UsIHRydWUpICsgKHRoaXMuYWNjb3VudEJhbGFuY2UoKSAhPT0gYmFsYW5jZSA/IGAgKCR7Zm9ybWF0UHJpY2UodGhpcy5hY2NvdW50QmFsYW5jZSgpLCB0cnVlKX0pYCA6IFwiXCIpLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0dGhpcy5hY2NvdW50QmFsYW5jZSgpICE9PSBiYWxhbmNlXG5cdFx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIuc21hbGxcIiArICh0aGlzLmFjY291bnRCYWxhbmNlKCkgPCAwID8gXCIuY29udGVudC1hY2NlbnQtZmdcIiA6IFwiXCIpLFxuXHRcdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwidW5wcm9jZXNzZWRCb29raW5nc19tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XCJ7YW1vdW50fVwiOiBmb3JtYXRQcmljZShhc3NlcnROb3ROdWxsKHRoaXMub3V0c3RhbmRpbmdCb29raW5nc1ByaWNlKSwgdHJ1ZSksXG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHR0aGlzLmlzUGF5QnV0dG9uVmlzaWJsZSgpXG5cdFx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIucGJcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR3aWR0aDogXCIyMDBweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdG0oTG9naW5CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImludm9pY2VQYXlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB0aGlzLnNob3dQYXlEaWFsb2codGhpcy5hbW91bnRPd2VkKCkpLFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0ICApXG5cdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHR0aGlzLmFjY291bnRpbmdJbmZvICYmXG5cdFx0XHRcdHRoaXMuYWNjb3VudGluZ0luZm8ucGF5bWVudE1ldGhvZCAhPT0gUGF5bWVudE1ldGhvZFR5cGUuSW52b2ljZSAmJlxuXHRcdFx0XHQodGhpcy5pc0Ftb3VudE93ZWQoKSB8fCAodGhpcy5pbnZvaWNlSW5mbyAmJiB0aGlzLmludm9pY2VJbmZvLnBheW1lbnRFcnJvckluZm8pKVxuXHRcdFx0XHRcdD8gdGhpcy5pbnZvaWNlSW5mbyAmJiB0aGlzLmludm9pY2VJbmZvLnBheW1lbnRFcnJvckluZm9cblx0XHRcdFx0XHRcdD8gbShcIi5zbWFsbC51bmRlcmxpbmUuYlwiLCBsYW5nLmdldChnZXRQcmVjb25kaXRpb25GYWlsZWRQYXltZW50TXNnKHRoaXMuaW52b2ljZUluZm8ucGF5bWVudEVycm9ySW5mby5lcnJvckNvZGUpKSlcblx0XHRcdFx0XHRcdDogbShcIi5zbWFsbC51bmRlcmxpbmUuYlwiLCBsYW5nLmdldChcImZhaWxlZERlYml0QXR0ZW1wdF9tc2dcIikpXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRtKFwiLmZsZXgtc3BhY2UtYmV0d2Vlbi5pdGVtcy1jZW50ZXIubXQtbC5tYi1zXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwicG9zdGluZ3NfbGFiZWxcIikpLFxuXHRcdFx0XHRcdG0oRXhwYW5kZXJCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInNob3dfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRleHBhbmRlZDogdGhpcy5wb3N0aW5nc0V4cGFuZGVkLFxuXHRcdFx0XHRcdFx0b25FeHBhbmRlZENoYW5nZTogKGV4cGFuZGVkKSA9PiAodGhpcy5wb3N0aW5nc0V4cGFuZGVkID0gZXhwYW5kZWQpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRFeHBhbmRlclBhbmVsLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGV4cGFuZGVkOiB0aGlzLnBvc3RpbmdzRXhwYW5kZWQsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRtKFRhYmxlLCB7XG5cdFx0XHRcdFx0XHRjb2x1bW5IZWFkaW5nOiBbXCJ0eXBlX2xhYmVsXCIsIFwiYW1vdW50X2xhYmVsXCJdLFxuXHRcdFx0XHRcdFx0Y29sdW1uV2lkdGhzOiBbQ29sdW1uV2lkdGguTGFyZ2VzdCwgQ29sdW1uV2lkdGguU21hbGwsIENvbHVtbldpZHRoLlNtYWxsXSxcblx0XHRcdFx0XHRcdGNvbHVtbkFsaWdubWVudHM6IFtmYWxzZSwgdHJ1ZSwgZmFsc2VdLFxuXHRcdFx0XHRcdFx0c2hvd0FjdGlvbkJ1dHRvbkNvbHVtbjogdHJ1ZSxcblx0XHRcdFx0XHRcdGxpbmVzOiB0aGlzLnBvc3RpbmdzLm1hcCgocG9zdGluZzogQ3VzdG9tZXJBY2NvdW50UG9zdGluZykgPT4gdGhpcy5wb3N0aW5nTGluZUF0dHJzKHBvc3RpbmcpKSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcIi5zbWFsbFwiLCBsYW5nLmdldChcImludm9pY2VTZXR0aW5nRGVzY3JpcHRpb25fbXNnXCIpICsgXCIgXCIgKyBsYW5nLmdldChcImxhdGVySW52b2ljaW5nSW5mb19tc2dcIikpLFxuXHRcdFx0XVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcG9zdGluZ0xpbmVBdHRycyhwb3N0aW5nOiBDdXN0b21lckFjY291bnRQb3N0aW5nKTogVGFibGVMaW5lQXR0cnMge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjZWxsczogKCkgPT4gW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bWFpbjogZ2V0UG9zdGluZ1R5cGVUZXh0KHBvc3RpbmcpLFxuXHRcdFx0XHRcdGluZm86IFtmb3JtYXREYXRlKHBvc3RpbmcudmFsdWVEYXRlKV0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRtYWluOiBmb3JtYXRQcmljZShOdW1iZXIocG9zdGluZy5hbW91bnQpLCB0cnVlKSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0XHRhY3Rpb25CdXR0b25BdHRyczpcblx0XHRcdFx0cG9zdGluZy50eXBlID09PSBQb3N0aW5nVHlwZS5Vc2FnZUZlZSB8fCBwb3N0aW5nLnR5cGUgPT09IFBvc3RpbmdUeXBlLkNyZWRpdCB8fCBwb3N0aW5nLnR5cGUgPT09IFBvc3RpbmdUeXBlLlNhbGVzQ29tbWlzc2lvblxuXHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogXCJkb3dubG9hZF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRG93bmxvYWQsXG5cdFx0XHRcdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IChlLCBkb20pID0+IHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5jdXN0b21lcj8uYnVzaW5lc3NVc2UpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNyZWF0ZURyb3Bkb3duKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IDMwMCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGF6eUJ1dHRvbnM6ICgpID0+IFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJkb3dubG9hZEludm9pY2VQZGZfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5kb1BkZkludm9pY2VEb3dubG9hZChwb3N0aW5nKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImRvd25sb2FkSW52b2ljZVhtbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLmRvWHJlY2hudW5nSW52b2ljZURvd25sb2FkKHBvc3RpbmcpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KShlLCBkb20pXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZG9QZGZJbnZvaWNlRG93bmxvYWQocG9zdGluZylcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ICB9XG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZG9QZGZJbnZvaWNlRG93bmxvYWQocG9zdGluZzogQ3VzdG9tZXJBY2NvdW50UG9zdGluZyk6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdGlmIChjbGllbnQuY29tcHJlc3Npb25TdHJlYW1TdXBwb3J0ZWQoKSkge1xuXHRcdFx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcInBsZWFzZVdhaXRfbXNnXCIsIGxvY2F0b3IuY3VzdG9tZXJGYWNhZGUuZ2VuZXJhdGVQZGZJbnZvaWNlKG5ldmVyTnVsbChwb3N0aW5nLmludm9pY2VOdW1iZXIpKSkudGhlbigocGRmSW52b2ljZSkgPT5cblx0XHRcdFx0bG9jYXRvci5maWxlQ29udHJvbGxlci5zYXZlRGF0YUZpbGUocGRmSW52b2ljZSksXG5cdFx0XHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChjbGllbnQuZGV2aWNlID09IERldmljZVR5cGUuQU5EUk9JRCkge1xuXHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJpbnZvaWNlRmFpbGVkV2Vidmlld19tc2dcIiwgKCkgPT4gbShcImRpdlwiLCBtKFwiYVwiLCB7IGhyZWY6IEluZm9MaW5rLldlYnZpZXcsIHRhcmdldDogXCJfYmxhbmtcIiB9LCBJbmZvTGluay5XZWJ2aWV3KSkpXG5cdFx0XHR9IGVsc2UgaWYgKGNsaWVudC5pc0lvcygpKSB7XG5cdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcImludm9pY2VGYWlsZWRJT1NfbXNnXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJpbnZvaWNlRmFpbGVkQnJvd3Nlcl9tc2dcIilcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRvWHJlY2hudW5nSW52b2ljZURvd25sb2FkKHBvc3Rpbmc6IEN1c3RvbWVyQWNjb3VudFBvc3RpbmcpIHtcblx0XHRyZXR1cm4gc2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdFx0bG9jYXRvci5jdXN0b21lckZhY2FkZS5nZW5lcmF0ZVhSZWNobnVuZ0ludm9pY2UobmV2ZXJOdWxsKHBvc3RpbmcuaW52b2ljZU51bWJlcikpLnRoZW4oKHhJbnZvaWNlKSA9PiBsb2NhdG9yLmZpbGVDb250cm9sbGVyLnNhdmVEYXRhRmlsZSh4SW52b2ljZSkpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlQWNjb3VudGluZ0luZm9EYXRhKGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbykge1xuXHRcdHRoaXMuYWNjb3VudGluZ0luZm8gPSBhY2NvdW50aW5nSW5mb1xuXG5cdFx0dGhpcy5pbnZvaWNlQWRkcmVzc0ZpZWxkLnNldFZhbHVlKFxuXHRcdFx0Zm9ybWF0TmFtZUFuZEFkZHJlc3MoYWNjb3VudGluZ0luZm8uaW52b2ljZU5hbWUsIGFjY291bnRpbmdJbmZvLmludm9pY2VBZGRyZXNzLCBhY2NvdW50aW5nSW5mby5pbnZvaWNlQ291bnRyeSA/PyB1bmRlZmluZWQpLFxuXHRcdClcblxuXHRcdG0ucmVkcmF3KClcblx0fVxuXG5cdHByaXZhdGUgYWNjb3VudEJhbGFuY2UoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5iYWxhbmNlIC0gYXNzZXJ0Tm90TnVsbCh0aGlzLm91dHN0YW5kaW5nQm9va2luZ3NQcmljZSlcblx0fVxuXG5cdHByaXZhdGUgYW1vdW50T3dlZCgpOiBudW1iZXIge1xuXHRcdGlmICh0aGlzLmJhbGFuY2UgIT0gbnVsbCkge1xuXHRcdFx0bGV0IGJhbGFuY2UgPSB0aGlzLmJhbGFuY2VcblxuXHRcdFx0aWYgKGJhbGFuY2UgPCAwKSB7XG5cdFx0XHRcdHJldHVybiBiYWxhbmNlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIDBcblx0fVxuXG5cdHByaXZhdGUgaXNBbW91bnRPd2VkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmFtb3VudE93ZWQoKSA8IDBcblx0fVxuXG5cdHByaXZhdGUgbG9hZFBvc3RpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvci5nZXQoQ3VzdG9tZXJBY2NvdW50U2VydmljZSwgbnVsbCkudGhlbigocmVzdWx0KSA9PiB7XG5cdFx0XHR0aGlzLnBvc3RpbmdzID0gcmVzdWx0LnBvc3RpbmdzXG5cdFx0XHR0aGlzLm91dHN0YW5kaW5nQm9va2luZ3NQcmljZSA9IE51bWJlcihyZXN1bHQub3V0c3RhbmRpbmdCb29raW5nc1ByaWNlKVxuXHRcdFx0dGhpcy5iYWxhbmNlID0gTnVtYmVyKHJlc3VsdC5iYWxhbmNlKVxuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH0pXG5cdH1cblxuXHRhc3luYyBlbnRpdHlFdmVudHNSZWNlaXZlZCh1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChjb25zdCB1cGRhdGUgb2YgdXBkYXRlcykge1xuXHRcdFx0YXdhaXQgdGhpcy5wcm9jZXNzRW50aXR5VXBkYXRlKHVwZGF0ZSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NFbnRpdHlVcGRhdGUodXBkYXRlOiBFbnRpdHlVcGRhdGVEYXRhKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgeyBpbnN0YW5jZUlkIH0gPSB1cGRhdGVcblxuXHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQWNjb3VudGluZ0luZm9UeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHRjb25zdCBhY2NvdW50aW5nSW5mbyA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoQWNjb3VudGluZ0luZm9UeXBlUmVmLCBpbnN0YW5jZUlkKVxuXHRcdFx0dGhpcy51cGRhdGVBY2NvdW50aW5nSW5mb0RhdGEoYWNjb3VudGluZ0luZm8pXG5cdFx0fSBlbHNlIGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQ3VzdG9tZXJUeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHR0aGlzLmN1c3RvbWVyID0gYXdhaXQgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQ3VzdG9tZXIoKVxuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH0gZWxzZSBpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKEludm9pY2VJbmZvVHlwZVJlZiwgdXBkYXRlKSkge1xuXHRcdFx0dGhpcy5pbnZvaWNlSW5mbyA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoSW52b2ljZUluZm9UeXBlUmVmLCBpbnN0YW5jZUlkKVxuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaXNQYXlCdXR0b25WaXNpYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmFjY291bnRpbmdJbmZvICE9IG51bGwgJiZcblx0XHRcdCh0aGlzLmFjY291bnRpbmdJbmZvLnBheW1lbnRNZXRob2QgPT09IFBheW1lbnRNZXRob2RUeXBlLkNyZWRpdENhcmQgfHwgdGhpcy5hY2NvdW50aW5nSW5mby5wYXltZW50TWV0aG9kID09PSBQYXltZW50TWV0aG9kVHlwZS5QYXlwYWwpICYmXG5cdFx0XHR0aGlzLmlzQW1vdW50T3dlZCgpXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBzaG93UGF5RGlhbG9nKG9wZW5CYWxhbmNlOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gc2hvd1BheUNvbmZpcm1EaWFsb2cob3BlbkJhbGFuY2UpXG5cdFx0XHQudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gc2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XHRcdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdFx0XHRcdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3Jcblx0XHRcdFx0XHRcdFx0LnB1dChEZWJpdFNlcnZpY2UsIGNyZWF0ZURlYml0U2VydmljZVB1dERhdGEoeyBpbnZvaWNlOiBudWxsIH0pKVxuXHRcdFx0XHRcdFx0XHQuY2F0Y2gob2ZDbGFzcyhMb2NrZWRFcnJvciwgKCkgPT4gXCJvcGVyYXRpb25TdGlsbEFjdGl2ZV9tc2dcIiBhcyBUcmFuc2xhdGlvbktleSkpXG5cdFx0XHRcdFx0XHRcdC5jYXRjaChvZkNsYXNzKFByZWNvbmRpdGlvbkZhaWxlZEVycm9yLCAoZXJyb3IpID0+IGdldFByZWNvbmRpdGlvbkZhaWxlZFBheW1lbnRNc2coZXJyb3IuZGF0YSkpKVxuXHRcdFx0XHRcdFx0XHQuY2F0Y2gob2ZDbGFzcyhCYWRHYXRld2F5RXJyb3IsICgpID0+IFwicGF5bWVudFByb3ZpZGVyTm90QXZhaWxhYmxlRXJyb3JfbXNnXCIgYXMgVHJhbnNsYXRpb25LZXkpKVxuXHRcdFx0XHRcdFx0XHQuY2F0Y2gob2ZDbGFzcyhUb29NYW55UmVxdWVzdHNFcnJvciwgKCkgPT4gXCJ0b29NYW55QXR0ZW1wdHNfbXNnXCIgYXMgVHJhbnNsYXRpb25LZXkpKSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGhlbigoZXJyb3JJZDogVHJhbnNsYXRpb25LZXlUeXBlIHwgdm9pZCkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3JJZCkge1xuXHRcdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShlcnJvcklkKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmxvYWRQb3N0aW5ncygpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckludm9pY2VEYXRhKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcIi5mbGV4LXNwYWNlLWJldHdlZW4uaXRlbXMtY2VudGVyLm10LWwubWItc1wiLCBbXG5cdFx0XHRcdG0oXCIuaDRcIiwgbGFuZy5nZXQoXCJpbnZvaWNlRGF0YV9tc2dcIikpLFxuXHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHR0aXRsZTogXCJpbnZvaWNlRGF0YV9tc2dcIixcblx0XHRcdFx0XHRjbGljazogY3JlYXRlTm90QXZhaWxhYmxlRm9yRnJlZUNsaWNrSGFuZGxlcihcblx0XHRcdFx0XHRcdE5ld1BhaWRQbGFucyxcblx0XHRcdFx0XHRcdCgpID0+IHRoaXMuY2hhbmdlSW52b2ljZURhdGEoKSxcblx0XHRcdFx0XHRcdCgpID0+IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNQcmVtaXVtQWNjb3VudCgpLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSksXG5cdFx0XHRtKHRoaXMuaW52b2ljZUFkZHJlc3NGaWVsZCksXG5cdFx0XHR0aGlzLmFjY291bnRpbmdJbmZvICYmIHRoaXMuYWNjb3VudGluZ0luZm8uaW52b2ljZVZhdElkTm8udHJpbSgpLmxlbmd0aCA+IDBcblx0XHRcdFx0PyBtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiaW52b2ljZVZhdElkTm9fbGFiZWxcIixcblx0XHRcdFx0XHRcdHZhbHVlOiB0aGlzLmFjY291bnRpbmdJbmZvID8gdGhpcy5hY2NvdW50aW5nSW5mby5pbnZvaWNlVmF0SWRObyA6IGxhbmcuZ2V0KFwibG9hZGluZ19tc2dcIiksXG5cdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbnVsbCxcblx0XHRdXG5cdH1cbn1cblxuZnVuY3Rpb24gc2hvd1BheUNvbmZpcm1EaWFsb2cocHJpY2U6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRsZXQgZGlhbG9nOiBEaWFsb2dcblxuXHRcdGNvbnN0IGRvQWN0aW9uID0gKHJlczogYm9vbGVhbikgPT4ge1xuXHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdHJlc29sdmUocmVzKVxuXHRcdH1cblxuXHRcdGNvbnN0IGFjdGlvbkJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRcdGxlZnQ6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gZG9BY3Rpb24oZmFsc2UpLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHRcdHJpZ2h0OiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogXCJpbnZvaWNlUGF5X2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBkb0FjdGlvbih0cnVlKSxcblx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdFx0bWlkZGxlOiBcImFkbWluUGF5bWVudF9hY3Rpb25cIixcblx0XHR9XG5cdFx0ZGlhbG9nID0gbmV3IERpYWxvZyhEaWFsb2dUeXBlLkVkaXRTbWFsbCwge1xuXHRcdFx0dmlldzogKCk6IENoaWxkcmVuID0+IFtcblx0XHRcdFx0bShEaWFsb2dIZWFkZXJCYXIsIGFjdGlvbkJhckF0dHJzKSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5wbHItbC5wYlwiLFxuXHRcdFx0XHRcdG0oXCJcIiwgW1xuXHRcdFx0XHRcdFx0bShcIi5wdFwiLCBsYW5nLmdldChcImludm9pY2VQYXlDb25maXJtX21zZ1wiKSksXG5cdFx0XHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJwcmljZV9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZTogZm9ybWF0UHJpY2UoLXByaWNlLCB0cnVlKSxcblx0XHRcdFx0XHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSxcblx0XHR9KVxuXHRcdFx0LnNldENsb3NlSGFuZGxlcigoKSA9PiBkb0FjdGlvbihmYWxzZSkpXG5cdFx0XHQuc2hvdygpXG5cdH0pXG59XG5cbmZ1bmN0aW9uIGdldFBvc3RpbmdUeXBlVGV4dChwb3N0aW5nOiBDdXN0b21lckFjY291bnRQb3N0aW5nKTogc3RyaW5nIHtcblx0c3dpdGNoIChwb3N0aW5nLnR5cGUpIHtcblx0XHRjYXNlIFBvc3RpbmdUeXBlLlVzYWdlRmVlOlxuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0KFwiaW52b2ljZV9sYWJlbFwiKVxuXG5cdFx0Y2FzZSBQb3N0aW5nVHlwZS5DcmVkaXQ6XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJjcmVkaXRfbGFiZWxcIilcblxuXHRcdGNhc2UgUG9zdGluZ1R5cGUuUGF5bWVudDpcblx0XHRcdHJldHVybiBsYW5nLmdldChcImFkbWluUGF5bWVudF9hY3Rpb25cIilcblxuXHRcdGNhc2UgUG9zdGluZ1R5cGUuUmVmdW5kOlxuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0KFwicmVmdW5kX2xhYmVsXCIpXG5cblx0XHRjYXNlIFBvc3RpbmdUeXBlLkdpZnRDYXJkOlxuXHRcdFx0cmV0dXJuIE51bWJlcihwb3N0aW5nLmFtb3VudCkgPCAwID8gbGFuZy5nZXQoXCJib3VnaHRHaWZ0Q2FyZFBvc3RpbmdfbGFiZWxcIikgOiBsYW5nLmdldChcInJlZGVlbWVkR2lmdENhcmRQb3N0aW5nX2xhYmVsXCIpXG5cblx0XHRjYXNlIFBvc3RpbmdUeXBlLlNhbGVzQ29tbWlzc2lvbjpcblx0XHRcdHJldHVybiBOdW1iZXIocG9zdGluZy5hbW91bnQpIDwgMCA/IGxhbmcuZ2V0KFwiY2FuY2VsbGVkUmVmZXJyYWxDcmVkaXRQb3N0aW5nX2xhYmVsXCIpIDogbGFuZy5nZXQoXCJyZWZlcnJhbENyZWRpdFBvc3RpbmdfbGFiZWxcIilcblxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gXCJcIlxuXHRcdC8vIEdlbmVyaWMsIERpc3B1dGUsIFN1c3BlbnNpb24sIFN1c3BlbnNpb25DYW5jZWxcblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd01hbmFnZVRocm91Z2hBcHBTdG9yZURpYWxvZygpOiBQcm9taXNlPHZvaWQ+IHtcblx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0oXG5cdFx0bGFuZy5nZXRUcmFuc2xhdGlvbihcInN0b3JlU3Vic2NyaXB0aW9uX21zZ1wiLCB7XG5cdFx0XHRcIntBcHBTdG9yZVBheW1lbnR9XCI6IEluZm9MaW5rLkFwcFN0b3JlUGF5bWVudCxcblx0XHR9KSxcblx0KVxuXHRpZiAoY29uZmlybWVkKSB7XG5cdFx0d2luZG93Lm9wZW4oXCJodHRwczovL2FwcHMuYXBwbGUuY29tL2FjY291bnQvc3Vic2NyaXB0aW9uc1wiLCBcIl9ibGFua1wiLCBcIm5vb3BlbmVyLG5vcmVmZXJyZXJcIilcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IGxhbmcsIHR5cGUgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgdHlwZSB7IFN1YnNjcmlwdGlvblBhcmFtZXRlcnMsIFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhIH0gZnJvbSBcIi4vVXBncmFkZVN1YnNjcmlwdGlvbldpemFyZFwiXG5pbXBvcnQgeyBTdWJzY3JpcHRpb25BY3Rpb25CdXR0b25zLCBTdWJzY3JpcHRpb25TZWxlY3RvciB9IGZyb20gXCIuL1N1YnNjcmlwdGlvblNlbGVjdG9yXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgVXBncmFkZVR5cGUgfSBmcm9tIFwiLi9TdWJzY3JpcHRpb25VdGlsc1wiXG5pbXBvcnQgeyBEaWFsb2csIERpYWxvZ1R5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB0eXBlIHsgV2l6YXJkUGFnZUF0dHJzLCBXaXphcmRQYWdlTiB9IGZyb20gXCIuLi9ndWkvYmFzZS9XaXphcmREaWFsb2cuanNcIlxuaW1wb3J0IHsgZW1pdFdpemFyZEV2ZW50LCBXaXphcmRFdmVudFR5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvV2l6YXJkRGlhbG9nLmpzXCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uL2d1aS9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBDb25zdCwgS2V5cywgUGxhblR5cGUsIFN1YnNjcmlwdGlvblR5cGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBDaGVja2JveCB9IGZyb20gXCIuLi9ndWkvYmFzZS9DaGVja2JveC5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgVXNhZ2VUZXN0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11c2FnZXRlc3RzXCJcbmltcG9ydCB7IFVwZ3JhZGVQcmljZVR5cGUgfSBmcm9tIFwiLi9GZWF0dXJlTGlzdFByb3ZpZGVyXCJcbmltcG9ydCB7IGFzUGF5bWVudEludGVydmFsLCBQYXltZW50SW50ZXJ2YWwgfSBmcm9tIFwiLi9QcmljZVV0aWxzLmpzXCJcbmltcG9ydCB7IGxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IExvZ2luQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvYnV0dG9ucy9Mb2dpbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBzdHJpbmdUb1N1YnNjcmlwdGlvblR5cGUgfSBmcm9tIFwiLi4vbWlzYy9Mb2dpblV0aWxzLmpzXCJcbmltcG9ydCB7IGlzUmVmZXJlbmNlRGF0ZVdpdGhpbkN5YmVyTW9uZGF5Q2FtcGFpZ24gfSBmcm9tIFwiLi4vbWlzYy9DeWJlck1vbmRheVV0aWxzLmpzXCJcblxuLyoqIFN1YnNjcmlwdGlvbiB0eXBlIHBhc3NlZCBmcm9tIHRoZSB3ZWJzaXRlICovXG5leHBvcnQgY29uc3QgUGxhblR5cGVQYXJhbWV0ZXIgPSBPYmplY3QuZnJlZXplKHtcblx0RlJFRTogXCJmcmVlXCIsXG5cdFJFVk9MVVRJT05BUlk6IFwicmV2b2x1dGlvbmFyeVwiLFxuXHRMRUdFTkQ6IFwibGVnZW5kXCIsXG5cdEVTU0VOVElBTDogXCJlc3NlbnRpYWxcIixcblx0QURWQU5DRUQ6IFwiYWR2YW5jZWRcIixcblx0VU5MSU1JVEVEOiBcInVubGltaXRlZFwiLFxufSlcblxuZXhwb3J0IGNsYXNzIFVwZ3JhZGVTdWJzY3JpcHRpb25QYWdlIGltcGxlbWVudHMgV2l6YXJkUGFnZU48VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+IHtcblx0cHJpdmF0ZSBfZG9tOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgX19zaWdudXBGcmVlVGVzdD86IFVzYWdlVGVzdFxuXHRwcml2YXRlIF9fc2lnbnVwUGFpZFRlc3Q/OiBVc2FnZVRlc3Rcblx0cHJpdmF0ZSB1cGdyYWRlVHlwZTogVXBncmFkZVR5cGUgfCBudWxsID0gbnVsbFxuXG5cdG9uY3JlYXRlKHZub2RlOiBWbm9kZURPTTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+Pik6IHZvaWQge1xuXHRcdHRoaXMuX2RvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvblBhcmFtZXRlcnMgPSB2bm9kZS5hdHRycy5kYXRhLnN1YnNjcmlwdGlvblBhcmFtZXRlcnNcblx0XHR0aGlzLnVwZ3JhZGVUeXBlID0gdm5vZGUuYXR0cnMuZGF0YS51cGdyYWRlVHlwZVxuXG5cdFx0dGhpcy5fX3NpZ251cEZyZWVUZXN0ID0gbG9jYXRvci51c2FnZVRlc3RDb250cm9sbGVyLmdldFRlc3QoXCJzaWdudXAuZnJlZVwiKVxuXHRcdHRoaXMuX19zaWdudXBGcmVlVGVzdC5hY3RpdmUgPSBmYWxzZVxuXG5cdFx0dGhpcy5fX3NpZ251cFBhaWRUZXN0ID0gbG9jYXRvci51c2FnZVRlc3RDb250cm9sbGVyLmdldFRlc3QoXCJzaWdudXAucGFpZFwiKVxuXHRcdHRoaXMuX19zaWdudXBQYWlkVGVzdC5hY3RpdmUgPSBmYWxzZVxuXG5cdFx0aWYgKHN1YnNjcmlwdGlvblBhcmFtZXRlcnMpIHtcblx0XHRcdGNvbnN0IHBheW1lbnRJbnRlcnZhbDogUGF5bWVudEludGVydmFsID0gc3Vic2NyaXB0aW9uUGFyYW1ldGVycy5pbnRlcnZhbFxuXHRcdFx0XHQ/IGFzUGF5bWVudEludGVydmFsKHN1YnNjcmlwdGlvblBhcmFtZXRlcnMuaW50ZXJ2YWwpXG5cdFx0XHRcdDogUGF5bWVudEludGVydmFsLlllYXJseVxuXHRcdFx0Ly8gV2UgYXV0b21hdGljYWxseSByb3V0ZSB0byB0aGUgbmV4dCBwYWdlOyB3aGVuIHdlIHdhbnQgdG8gZ28gYmFjayBmcm9tIHRoZSBzZWNvbmQgcGFnZSwgd2UgZG8gbm90IHdhbnQgdG8ga2VlcCBjYWxsaW5nIG5leHRQYWdlXG5cdFx0XHR2bm9kZS5hdHRycy5kYXRhLnN1YnNjcmlwdGlvblBhcmFtZXRlcnMgPSBudWxsXG5cdFx0XHR2bm9kZS5hdHRycy5kYXRhLm9wdGlvbnMucGF5bWVudEludGVydmFsID0gc3RyZWFtKHBheW1lbnRJbnRlcnZhbClcblx0XHRcdHRoaXMuZ29Ub05leHRQYWdlV2l0aFByZXNlbGVjdGVkU3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvblBhcmFtZXRlcnMsIHZub2RlLmF0dHJzLmRhdGEpXG5cdFx0fVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8V2l6YXJkUGFnZUF0dHJzPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPj4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZGF0YSA9IHZub2RlLmF0dHJzLmRhdGFcblx0XHRsZXQgYXZhaWxhYmxlUGxhbnMgPSB2bm9kZS5hdHRycy5kYXRhLmFjY2VwdGVkUGxhbnNcblx0XHQvLyBuZXdBY2NvdW50RGF0YSBpcyBmaWxsZWQgaW4gd2hlbiBzaWduaW5nIHVwIGFuZCB0aGVuIGdvaW5nIGJhY2sgaW4gdGhlIHNpZ251cCBwcm9jZXNzXG5cdFx0Ly8gSWYgdGhlIHVzZXIgaGFzIHNlbGVjdGVkIGEgdHV0YS5jb20gYWRkcmVzcyB3ZSB3YW50IHRvIHByZXZlbnQgdGhlbSBmcm9tIHNlbGVjdGluZyBhIGZyZWUgcGxhbiBhdCB0aGlzIHBvaW50XG5cdFx0aWYgKCEhZGF0YS5uZXdBY2NvdW50RGF0YSAmJiBkYXRhLm5ld0FjY291bnREYXRhLm1haWxBZGRyZXNzLmluY2x1ZGVzKFwidHV0YS5jb21cIikgJiYgYXZhaWxhYmxlUGxhbnMuaW5jbHVkZXMoUGxhblR5cGUuRnJlZSkpIHtcblx0XHRcdGF2YWlsYWJsZVBsYW5zID0gYXZhaWxhYmxlUGxhbnMuZmlsdGVyKChwbGFuKSA9PiBwbGFuICE9IFBsYW5UeXBlLkZyZWUpXG5cdFx0fVxuXG5cdFx0Y29uc3QgaXNZZWFybHkgPSBkYXRhLm9wdGlvbnMucGF5bWVudEludGVydmFsKCkgPT09IFBheW1lbnRJbnRlcnZhbC5ZZWFybHlcblx0XHRjb25zdCBpc0N5YmVyTW9uZGF5ID0gaXNSZWZlcmVuY2VEYXRlV2l0aGluQ3liZXJNb25kYXlDYW1wYWlnbihDb25zdC5DVVJSRU5UX0RBVEUgPz8gbmV3IERhdGUoKSlcblx0XHRjb25zdCBzaG91bGRBcHBseUN5YmVyTW9uZGF5ID0gaXNZZWFybHkgJiYgaXNDeWJlck1vbmRheVxuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9uczogU3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9ucyA9IHtcblx0XHRcdFtQbGFuVHlwZS5GcmVlXTogKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGxhYmVsOiBcInByaWNpbmcuc2VsZWN0X2FjdGlvblwiLFxuXHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IHRoaXMuc2VsZWN0RnJlZShkYXRhKSxcblx0XHRcdFx0fSBhcyBMb2dpbkJ1dHRvbkF0dHJzXG5cdFx0XHR9LFxuXHRcdFx0W1BsYW5UeXBlLlJldm9sdXRpb25hcnldOiB0aGlzLmNyZWF0ZVVwZ3JhZGVCdXR0b24oZGF0YSwgUGxhblR5cGUuUmV2b2x1dGlvbmFyeSksXG5cdFx0XHRbUGxhblR5cGUuTGVnZW5kXTogKCkgPT4gKHtcblx0XHRcdFx0bGFiZWw6IHNob3VsZEFwcGx5Q3liZXJNb25kYXkgPyBcInByaWNpbmcuY3liZXJfbW9uZGF5X3NlbGVjdF9hY3Rpb25cIiA6IFwicHJpY2luZy5zZWxlY3RfYWN0aW9uXCIsXG5cdFx0XHRcdGNsYXNzOiBzaG91bGRBcHBseUN5YmVyTW9uZGF5ID8gXCJhY2NlbnQtYmctY3liZXItbW9uZGF5XCIgOiB1bmRlZmluZWQsXG5cdFx0XHRcdG9uY2xpY2s6ICgpID0+IHRoaXMuc2V0Tm9uRnJlZURhdGFBbmRHb1RvTmV4dFBhZ2UoZGF0YSwgUGxhblR5cGUuTGVnZW5kKSxcblx0XHRcdH0pLFxuXHRcdFx0W1BsYW5UeXBlLkVzc2VudGlhbF06IHRoaXMuY3JlYXRlVXBncmFkZUJ1dHRvbihkYXRhLCBQbGFuVHlwZS5Fc3NlbnRpYWwpLFxuXHRcdFx0W1BsYW5UeXBlLkFkdmFuY2VkXTogdGhpcy5jcmVhdGVVcGdyYWRlQnV0dG9uKGRhdGEsIFBsYW5UeXBlLkFkdmFuY2VkKSxcblx0XHRcdFtQbGFuVHlwZS5VbmxpbWl0ZWRdOiB0aGlzLmNyZWF0ZVVwZ3JhZGVCdXR0b24oZGF0YSwgUGxhblR5cGUuVW5saW1pdGVkKSxcblx0XHR9XG5cdFx0cmV0dXJuIG0oXCIucHRcIiwgW1xuXHRcdFx0bShTdWJzY3JpcHRpb25TZWxlY3Rvciwge1xuXHRcdFx0XHRvcHRpb25zOiBkYXRhLm9wdGlvbnMsXG5cdFx0XHRcdHByaWNlSW5mb1RleHRJZDogZGF0YS5wcmljZUluZm9UZXh0SWQsXG5cdFx0XHRcdGJveFdpZHRoOiAyMzAsXG5cdFx0XHRcdGJveEhlaWdodDogMjcwLFxuXHRcdFx0XHRhY2NlcHRlZFBsYW5zOiBhdmFpbGFibGVQbGFucyxcblx0XHRcdFx0YWxsb3dTd2l0Y2hpbmdQYXltZW50SW50ZXJ2YWw6IGRhdGEudXBncmFkZVR5cGUgIT09IFVwZ3JhZGVUeXBlLlN3aXRjaCxcblx0XHRcdFx0Y3VycmVudFBsYW5UeXBlOiBkYXRhLmN1cnJlbnRQbGFuLFxuXHRcdFx0XHRhY3Rpb25CdXR0b25zOiBzdWJzY3JpcHRpb25BY3Rpb25CdXR0b25zLFxuXHRcdFx0XHRmZWF0dXJlTGlzdFByb3ZpZGVyOiB2bm9kZS5hdHRycy5kYXRhLmZlYXR1cmVMaXN0UHJvdmlkZXIsXG5cdFx0XHRcdHByaWNlQW5kQ29uZmlnUHJvdmlkZXI6IHZub2RlLmF0dHJzLmRhdGEucGxhblByaWNlcyxcblx0XHRcdFx0bXVsdGlwbGVVc2Vyc0FsbG93ZWQ6IHZub2RlLmF0dHJzLmRhdGEubXVsdGlwbGVVc2Vyc0FsbG93ZWQsXG5cdFx0XHRcdG1zZzogZGF0YS5tc2csXG5cdFx0XHR9KSxcblx0XHRdKVxuXHR9XG5cblx0c2VsZWN0RnJlZShkYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSkge1xuXHRcdC8vIENvbmZpcm1hdGlvbiBvZiBmcmVlIHN1YnNjcmlwdGlvbiBzZWxlY3Rpb24gKGNsaWNrIG9uIHN1YnNjcmlwdGlvbiBzZWxlY3Rvcilcblx0XHRpZiAodGhpcy5fX3NpZ251cFBhaWRUZXN0KSB7XG5cdFx0XHR0aGlzLl9fc2lnbnVwUGFpZFRlc3QuYWN0aXZlID0gZmFsc2Vcblx0XHR9XG5cblx0XHRpZiAodGhpcy5fX3NpZ251cEZyZWVUZXN0ICYmIHRoaXMudXBncmFkZVR5cGUgPT0gVXBncmFkZVR5cGUuU2lnbnVwKSB7XG5cdFx0XHR0aGlzLl9fc2lnbnVwRnJlZVRlc3QuYWN0aXZlID0gdHJ1ZVxuXHRcdFx0dGhpcy5fX3NpZ251cEZyZWVUZXN0LmdldFN0YWdlKDApLmNvbXBsZXRlKClcblx0XHR9XG5cdFx0Y29uZmlybUZyZWVTdWJzY3JpcHRpb24oKS50aGVuKChjb25maXJtZWQpID0+IHtcblx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0Ly8gQ29uZmlybWF0aW9uIG9mIGZyZWUvYnVzaW5lc3MgZGlhbG9nIChjbGljayBvbiBvaylcblx0XHRcdFx0dGhpcy5fX3NpZ251cEZyZWVUZXN0Py5nZXRTdGFnZSgxKS5jb21wbGV0ZSgpXG5cdFx0XHRcdGRhdGEudHlwZSA9IFBsYW5UeXBlLkZyZWVcblx0XHRcdFx0ZGF0YS5wcmljZSA9IG51bGxcblx0XHRcdFx0ZGF0YS5uZXh0WWVhclByaWNlID0gbnVsbFxuXHRcdFx0XHR0aGlzLnNob3dOZXh0UGFnZSgpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHNob3dOZXh0UGFnZSgpOiB2b2lkIHtcblx0XHRpZiAodGhpcy5fZG9tKSB7XG5cdFx0XHRlbWl0V2l6YXJkRXZlbnQodGhpcy5fZG9tLCBXaXphcmRFdmVudFR5cGUuU0hPV19ORVhUX1BBR0UpXG5cdFx0fVxuXHR9XG5cblx0Z29Ub05leHRQYWdlV2l0aFByZXNlbGVjdGVkU3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvblBhcmFtZXRlcnM6IFN1YnNjcmlwdGlvblBhcmFtZXRlcnMsIGRhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhKTogdm9pZCB7XG5cdFx0bGV0IHN1YnNjcmlwdGlvblR5cGU6IFN1YnNjcmlwdGlvblR5cGUgfCBudWxsXG5cdFx0dHJ5IHtcblx0XHRcdHN1YnNjcmlwdGlvblR5cGUgPSBzdWJzY3JpcHRpb25QYXJhbWV0ZXJzLnR5cGUgPT0gbnVsbCA/IG51bGwgOiBzdHJpbmdUb1N1YnNjcmlwdGlvblR5cGUoc3Vic2NyaXB0aW9uUGFyYW1ldGVycy50eXBlKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHN1YnNjcmlwdGlvblR5cGUgPSBudWxsXG5cdFx0fVxuXG5cdFx0aWYgKHN1YnNjcmlwdGlvblR5cGUgPT09IFN1YnNjcmlwdGlvblR5cGUuUGVyc29uYWwgfHwgc3Vic2NyaXB0aW9uVHlwZSA9PT0gU3Vic2NyaXB0aW9uVHlwZS5QYWlkUGVyc29uYWwpIHtcblx0XHRcdC8vIHdlIGhhdmUgdG8gaW5kaXZpZHVhbGx5IGNoYW5nZSB0aGUgZGF0YSBzbyB0aGF0IHdoZW4gcmV0dXJuaW5nIHdlIHNob3cgdGhlIGNob3NlIHN1YnNjcmlwdGlvbiB0eXBlIChwcml2YXRlL2J1c2luZXNzKSB8IGZhbHNlID0gcHJpdmF0ZSwgdHJ1ZSA9IGJ1c2luZXNzXG5cdFx0XHRkYXRhLm9wdGlvbnMuYnVzaW5lc3NVc2UoZmFsc2UpXG5cblx0XHRcdHN3aXRjaCAoc3Vic2NyaXB0aW9uUGFyYW1ldGVycy5zdWJzY3JpcHRpb24pIHtcblx0XHRcdFx0Y2FzZSBQbGFuVHlwZVBhcmFtZXRlci5GUkVFOlxuXHRcdFx0XHRcdHRoaXMuc2VsZWN0RnJlZShkYXRhKVxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBQbGFuVHlwZVBhcmFtZXRlci5SRVZPTFVUSU9OQVJZOlxuXHRcdFx0XHRcdHRoaXMuc2V0Tm9uRnJlZURhdGFBbmRHb1RvTmV4dFBhZ2UoZGF0YSwgUGxhblR5cGUuUmV2b2x1dGlvbmFyeSlcblx0XHRcdFx0XHRicmVha1xuXG5cdFx0XHRcdGNhc2UgUGxhblR5cGVQYXJhbWV0ZXIuTEVHRU5EOlxuXHRcdFx0XHRcdHRoaXMuc2V0Tm9uRnJlZURhdGFBbmRHb1RvTmV4dFBhZ2UoZGF0YSwgUGxhblR5cGUuTGVnZW5kKVxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIlVua25vd24gc3Vic2NyaXB0aW9uIHBhc3NlZDogXCIsIHN1YnNjcmlwdGlvblBhcmFtZXRlcnMpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHN1YnNjcmlwdGlvblR5cGUgPT09IFN1YnNjcmlwdGlvblR5cGUuQnVzaW5lc3MpIHtcblx0XHRcdGRhdGEub3B0aW9ucy5idXNpbmVzc1VzZSh0cnVlKVxuXG5cdFx0XHRzd2l0Y2ggKHN1YnNjcmlwdGlvblBhcmFtZXRlcnMuc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRcdGNhc2UgUGxhblR5cGVQYXJhbWV0ZXIuRVNTRU5USUFMOlxuXHRcdFx0XHRcdHRoaXMuc2V0Tm9uRnJlZURhdGFBbmRHb1RvTmV4dFBhZ2UoZGF0YSwgUGxhblR5cGUuRXNzZW50aWFsKVxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBQbGFuVHlwZVBhcmFtZXRlci5BRFZBTkNFRDpcblx0XHRcdFx0XHR0aGlzLnNldE5vbkZyZWVEYXRhQW5kR29Ub05leHRQYWdlKGRhdGEsIFBsYW5UeXBlLkFkdmFuY2VkKVxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBQbGFuVHlwZVBhcmFtZXRlci5VTkxJTUlURUQ6XG5cdFx0XHRcdFx0dGhpcy5zZXROb25GcmVlRGF0YUFuZEdvVG9OZXh0UGFnZShkYXRhLCBQbGFuVHlwZS5VbmxpbWl0ZWQpXG5cdFx0XHRcdFx0YnJlYWtcblxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiVW5rbm93biBzdWJzY3JpcHRpb24gcGFzc2VkOiBcIiwgc3Vic2NyaXB0aW9uUGFyYW1ldGVycylcblx0XHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlVua25vd24gc3Vic2NyaXB0aW9uIHR5cGUgcGFzc2VkOiBcIiwgc3Vic2NyaXB0aW9uUGFyYW1ldGVycylcblx0XHR9XG5cdH1cblxuXHRzZXROb25GcmVlRGF0YUFuZEdvVG9OZXh0UGFnZShkYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSwgcGxhblR5cGU6IFBsYW5UeXBlKTogdm9pZCB7XG5cdFx0Ly8gQ29uZmlybWF0aW9uIG9mIHBhaWQgc3Vic2NyaXB0aW9uIHNlbGVjdGlvbiAoY2xpY2sgb24gc3Vic2NyaXB0aW9uIHNlbGVjdG9yKVxuXHRcdGlmICh0aGlzLl9fc2lnbnVwRnJlZVRlc3QpIHtcblx0XHRcdHRoaXMuX19zaWdudXBGcmVlVGVzdC5hY3RpdmUgPSBmYWxzZVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLl9fc2lnbnVwUGFpZFRlc3QgJiYgdGhpcy51cGdyYWRlVHlwZSA9PSBVcGdyYWRlVHlwZS5TaWdudXApIHtcblx0XHRcdHRoaXMuX19zaWdudXBQYWlkVGVzdC5hY3RpdmUgPSB0cnVlXG5cdFx0XHR0aGlzLl9fc2lnbnVwUGFpZFRlc3QuZ2V0U3RhZ2UoMCkuY29tcGxldGUoKVxuXHRcdH1cblx0XHRkYXRhLnR5cGUgPSBwbGFuVHlwZVxuXHRcdGNvbnN0IHsgcGxhblByaWNlcywgb3B0aW9ucyB9ID0gZGF0YVxuXHRcdHRyeSB7XG5cdFx0XHQvLyBgZGF0YS5wcmljZS5yYXdQcmljZWAgaXMgdXNlZCBmb3IgdGhlIGFtb3VudCBwYXJhbWV0ZXIgaW4gdGhlIEJyYWludHJlZSBjcmVkaXQgY2FyZCB2ZXJpZmljYXRpb24gY2FsbCwgc28gd2UgZG8gbm90IGluY2x1ZGUgY3VycmVuY3kgbG9jYWxlIG91dHNpZGUgaU9TLlxuXHRcdFx0ZGF0YS5wcmljZSA9IHBsYW5QcmljZXMuZ2V0U3Vic2NyaXB0aW9uUHJpY2VXaXRoQ3VycmVuY3kob3B0aW9ucy5wYXltZW50SW50ZXJ2YWwoKSwgZGF0YS50eXBlLCBVcGdyYWRlUHJpY2VUeXBlLlBsYW5BY3R1YWxQcmljZSlcblx0XHRcdGNvbnN0IG5leHRZZWFyID0gcGxhblByaWNlcy5nZXRTdWJzY3JpcHRpb25QcmljZVdpdGhDdXJyZW5jeShvcHRpb25zLnBheW1lbnRJbnRlcnZhbCgpLCBkYXRhLnR5cGUsIFVwZ3JhZGVQcmljZVR5cGUuUGxhbk5leHRZZWFyc1ByaWNlKVxuXHRcdFx0ZGF0YS5uZXh0WWVhclByaWNlID0gZGF0YS5wcmljZS5yYXdQcmljZSAhPT0gbmV4dFllYXIucmF3UHJpY2UgPyBuZXh0WWVhciA6IG51bGxcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGUpXG5cdFx0XHREaWFsb2cubWVzc2FnZShcImFwcFN0b3JlTm90QXZhaWxhYmxlX21zZ1wiKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHRoaXMuc2hvd05leHRQYWdlKClcblx0fVxuXG5cdGNyZWF0ZVVwZ3JhZGVCdXR0b24oZGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEsIHBsYW5UeXBlOiBQbGFuVHlwZSk6IGxhenk8TG9naW5CdXR0b25BdHRycz4ge1xuXHRcdHJldHVybiAoKSA9PiAoe1xuXHRcdFx0bGFiZWw6IFwicHJpY2luZy5zZWxlY3RfYWN0aW9uXCIsXG5cdFx0XHRvbmNsaWNrOiAoKSA9PiB0aGlzLnNldE5vbkZyZWVEYXRhQW5kR29Ub05leHRQYWdlKGRhdGEsIHBsYW5UeXBlKSxcblx0XHR9KVxuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbmZpcm1GcmVlU3Vic2NyaXB0aW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRsZXQgb25lQWNjb3VudFZhbHVlID0gc3RyZWFtKGZhbHNlKVxuXHRcdGxldCBwcml2YXRlVXNlVmFsdWUgPSBzdHJlYW0oZmFsc2UpXG5cdFx0bGV0IGRpYWxvZzogRGlhbG9nXG5cblx0XHRjb25zdCBjbG9zZUFjdGlvbiA9IChjb25maXJtZWQ6IGJvb2xlYW4pID0+IHtcblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoY29uZmlybWVkKSwgRGVmYXVsdEFuaW1hdGlvblRpbWUpXG5cdFx0fVxuXHRcdGNvbnN0IGlzRm9ybVZhbGlkID0gKCkgPT4gb25lQWNjb3VudFZhbHVlKCkgJiYgcHJpdmF0ZVVzZVZhbHVlKClcblx0XHRkaWFsb2cgPSBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuQWxlcnQsIHtcblx0XHRcdHZpZXc6ICgpID0+IFtcblx0XHRcdFx0Ly8gbShcIi5oMi5wYlwiLCBsYW5nLmdldChcImNvbmZpcm1GcmVlQWNjb3VudF9sYWJlbFwiKSksXG5cdFx0XHRcdG0oXCIjZGlhbG9nLW1lc3NhZ2UuZGlhbG9nLWNvbnRlbnRCdXR0b25zQm90dG9tLnRleHQtYnJlYWsudGV4dC1wcmV3cmFwLnNlbGVjdGFibGVcIiwgbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoXCJmcmVlQWNjb3VudEluZm9fbXNnXCIpKSxcblx0XHRcdFx0bShcIi5kaWFsb2ctY29udGVudEJ1dHRvbnNCb3R0b21cIiwgW1xuXHRcdFx0XHRcdG0oQ2hlY2tib3gsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiAoKSA9PiBsYW5nLmdldChcImNvbmZpcm1Ob090aGVyRnJlZUFjY291bnRfbXNnXCIpLFxuXHRcdFx0XHRcdFx0Y2hlY2tlZDogb25lQWNjb3VudFZhbHVlKCksXG5cdFx0XHRcdFx0XHRvbkNoZWNrZWQ6IG9uZUFjY291bnRWYWx1ZSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRtKENoZWNrYm94LCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJjb25maXJtUHJpdmF0ZVVzZV9tc2dcIiksXG5cdFx0XHRcdFx0XHRjaGVja2VkOiBwcml2YXRlVXNlVmFsdWUoKSxcblx0XHRcdFx0XHRcdG9uQ2hlY2tlZDogcHJpdmF0ZVVzZVZhbHVlLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcIi5mbGV4LWNlbnRlci5kaWFsb2ctYnV0dG9uc1wiLCBbXG5cdFx0XHRcdFx0bShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBjbG9zZUFjdGlvbihmYWxzZSksXG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAoaXNGb3JtVmFsaWQoKSkgY2xvc2VBY3Rpb24odHJ1ZSlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSxcblx0XHR9KVxuXHRcdFx0LnNldENsb3NlSGFuZGxlcigoKSA9PiBjbG9zZUFjdGlvbihmYWxzZSkpXG5cdFx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRzaGlmdDogZmFsc2UsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IGNsb3NlQWN0aW9uKGZhbHNlKSxcblx0XHRcdFx0aGVscDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHR9KVxuXHRcdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdFx0a2V5OiBLZXlzLlJFVFVSTixcblx0XHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGlzRm9ybVZhbGlkKCkpIGNsb3NlQWN0aW9uKHRydWUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHR9KVxuXHRcdFx0LnNob3coKVxuXHR9KVxufVxuXG5leHBvcnQgY2xhc3MgVXBncmFkZVN1YnNjcmlwdGlvblBhZ2VBdHRycyBpbXBsZW1lbnRzIFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4ge1xuXHRkYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YVxuXG5cdGNvbnN0cnVjdG9yKHVwZ3JhZGVEYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSkge1xuXHRcdHRoaXMuZGF0YSA9IHVwZ3JhZGVEYXRhXG5cdH1cblxuXHRoZWFkZXJUaXRsZSgpOiBUcmFuc2xhdGlvbktleSB7XG5cdFx0cmV0dXJuIFwic3Vic2NyaXB0aW9uX2xhYmVsXCJcblx0fVxuXG5cdG5leHRBY3Rpb24oc2hvd0Vycm9yRGlhbG9nOiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Ly8gbmV4dCBhY3Rpb24gbm90IGF2YWlsYWJsZSBmb3IgdGhpcyBwYWdlXG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKVxuXHR9XG5cblx0aXNTa2lwQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0aXNFbmFibGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0cnVlXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBsYW5nLCB0eXBlIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHR5cGUgeyBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSB9IGZyb20gXCIuL1VwZ3JhZGVTdWJzY3JpcHRpb25XaXphcmRcIlxuaW1wb3J0IHR5cGUgeyBXaXphcmRQYWdlQXR0cnMsIFdpemFyZFBhZ2VOIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1dpemFyZERpYWxvZy5qc1wiXG5pbXBvcnQgeyBlbWl0V2l6YXJkRXZlbnQsIFdpemFyZEV2ZW50VHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9XaXphcmREaWFsb2cuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IFVzYWdlVGVzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXNhZ2V0ZXN0c1wiXG5pbXBvcnQgeyBSZWNvdmVyQ29kZUZpZWxkIH0gZnJvbSBcIi4uL3NldHRpbmdzL2xvZ2luL1JlY292ZXJDb2RlRGlhbG9nLmpzXCJcbmltcG9ydCB7IFZpc1NpZ251cEltYWdlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IFBsYW5UeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgTG9naW5CdXR0b24gfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvYnV0dG9ucy9Mb2dpbkJ1dHRvbi5qc1wiXG5cbmV4cG9ydCBjbGFzcyBVcGdyYWRlQ29uZ3JhdHVsYXRpb25zUGFnZSBpbXBsZW1lbnRzIFdpemFyZFBhZ2VOPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPiB7XG5cdHByaXZhdGUgZG9tITogSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBfX3NpZ251cFBhaWRUZXN0PzogVXNhZ2VUZXN0XG5cdHByaXZhdGUgX19zaWdudXBGcmVlVGVzdD86IFVzYWdlVGVzdFxuXG5cdG9uY3JlYXRlKHZub2RlOiBWbm9kZURPTTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+Pikge1xuXHRcdHRoaXMuX19zaWdudXBQYWlkVGVzdCA9IGxvY2F0b3IudXNhZ2VUZXN0Q29udHJvbGxlci5nZXRUZXN0KFwic2lnbnVwLnBhaWRcIilcblx0XHR0aGlzLl9fc2lnbnVwRnJlZVRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInNpZ251cC5mcmVlXCIpXG5cblx0XHR0aGlzLmRvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHR9XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgbmV3QWNjb3VudERhdGEgfSA9IGF0dHJzLmRhdGFcblxuXHRcdHJldHVybiBbXG5cdFx0XHRtKFwiLmNlbnRlci5oNC5wdFwiLCBsYW5nLmdldChcImFjY291bnRDcmVhdGlvbkNvbmdyYXR1bGF0aW9uX21zZ1wiKSksXG5cdFx0XHRuZXdBY2NvdW50RGF0YVxuXHRcdFx0XHQ/IG0oXCIucGxyLWxcIiwgW1xuXHRcdFx0XHRcdFx0bShSZWNvdmVyQ29kZUZpZWxkLCB7XG5cdFx0XHRcdFx0XHRcdHNob3dNZXNzYWdlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRyZWNvdmVyQ29kZTogbmV3QWNjb3VudERhdGEucmVjb3ZlckNvZGUsXG5cdFx0XHRcdFx0XHRcdGltYWdlOiB7XG5cdFx0XHRcdFx0XHRcdFx0c3JjOiBWaXNTaWdudXBJbWFnZSxcblx0XHRcdFx0XHRcdFx0XHRhbHQ6IFwidml0b3JfYWx0XCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0ICBdKVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LWNlbnRlci5mdWxsLXdpZHRoLnB0LWxcIixcblx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsYXNzOiBcInNtYWxsLWxvZ2luLWJ1dHRvblwiLFxuXHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdGlmIChhdHRycy5kYXRhLnR5cGUgPT09IFBsYW5UeXBlLkZyZWUpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVjb3ZlcnlDb25maXJtYXRpb25TdGFnZUZyZWUgPSB0aGlzLl9fc2lnbnVwRnJlZVRlc3Q/LmdldFN0YWdlKDUpXG5cblx0XHRcdFx0XHRcdFx0cmVjb3ZlcnlDb25maXJtYXRpb25TdGFnZUZyZWU/LnNldE1ldHJpYyh7XG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogXCJzd2l0Y2hlZEZyb21QYWlkXCIsXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6ICh0aGlzLl9fc2lnbnVwUGFpZFRlc3Q/LmlzU3RhcnRlZCgpID8/IGZhbHNlKS50b1N0cmluZygpLFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRyZWNvdmVyeUNvbmZpcm1hdGlvblN0YWdlRnJlZT8uY29tcGxldGUoKVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR0aGlzLmNsb3NlKGF0dHJzLmRhdGEsIHRoaXMuZG9tKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIGNsb3NlKGRhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhLCBkb206IEhUTUxFbGVtZW50KSB7XG5cdFx0bGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKVxuXG5cdFx0aWYgKGRhdGEubmV3QWNjb3VudERhdGEgJiYgbG9jYXRvci5sb2dpbnMuaXNVc2VyTG9nZ2VkSW4oKSkge1xuXHRcdFx0cHJvbWlzZSA9IGxvY2F0b3IubG9naW5zLmxvZ291dChmYWxzZSlcblx0XHR9XG5cblx0XHRwcm9taXNlLnRoZW4oKCkgPT4ge1xuXHRcdFx0ZW1pdFdpemFyZEV2ZW50KGRvbSwgV2l6YXJkRXZlbnRUeXBlLlNIT1dfTkVYVF9QQUdFKVxuXHRcdH0pXG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFVwZ3JhZGVDb25ncmF0dWxhdGlvbnNQYWdlQXR0cnMgaW1wbGVtZW50cyBXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+IHtcblx0ZGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGFcblx0cHJldmVudEdvQmFjayA9IHRydWVcblx0aGlkZVBhZ2luZ0J1dHRvbkZvclBhZ2UgPSB0cnVlXG5cblx0Y29uc3RydWN0b3IodXBncmFkZURhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhKSB7XG5cdFx0dGhpcy5kYXRhID0gdXBncmFkZURhdGFcblx0fVxuXG5cdGhlYWRlclRpdGxlKCk6IFRyYW5zbGF0aW9uS2V5IHtcblx0XHRyZXR1cm4gXCJhY2NvdW50Q29uZ3JhdHVsYXRpb25zX21zZ1wiXG5cdH1cblxuXHRuZXh0QWN0aW9uKHNob3dEaWFsb2dzOiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Ly8gbmV4dCBhY3Rpb24gbm90IGF2YWlsYWJsZSBmb3IgdGhpcyBwYWdlXG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKVxuXHR9XG5cblx0aXNTa2lwQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0aXNFbmFibGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0cnVlXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBpc01haWxBZGRyZXNzIH0gZnJvbSBcIi4uL21pc2MvRm9ybWF0VmFsaWRhdG9yLmpzXCJcbmltcG9ydCB7IEFjY2Vzc0RlYWN0aXZhdGVkRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgZm9ybWF0TWFpbEFkZHJlc3NGcm9tUGFydHMgfSBmcm9tIFwiLi4vbWlzYy9Gb3JtYXR0ZXIuanNcIlxuaW1wb3J0IHsgSWNvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9JY29uLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IEF1dG9jYXBpdGFsaXplLCBBdXRvY29tcGxldGUsIGlucHV0TGluZUhlaWdodCwgVGV4dEZpZWxkIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBhdHRhY2hEcm9wZG93biwgRHJvcGRvd25CdXR0b25BdHRycyB9IGZyb20gXCIuLi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uLCBJY29uQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0J1dHRvblNpemUuanNcIlxuaW1wb3J0IHsgRW1haWxEb21haW5EYXRhIH0gZnJvbSBcIi4vbWFpbGFkZHJlc3MvTWFpbEFkZHJlc3Nlc1V0aWxzLmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnMuanNcIlxuaW1wb3J0IHsgaXNUdXRhTWFpbEFkZHJlc3MgfSBmcm9tIFwiLi4vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmNvbnN0IFZBTElEX01FU1NBR0VfSUQgPSBcIm1haWxBZGRyZXNzQXZhaWxhYmxlX21zZ1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0TWFpbEFkZHJlc3NGb3JtQXR0cnMge1xuXHRzZWxlY3RlZERvbWFpbjogRW1haWxEb21haW5EYXRhXG5cdGF2YWlsYWJsZURvbWFpbnM6IHJlYWRvbmx5IEVtYWlsRG9tYWluRGF0YVtdXG5cdG9uVmFsaWRhdGlvblJlc3VsdDogKGVtYWlsQWRkcmVzczogc3RyaW5nLCB2YWxpZGF0aW9uUmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0KSA9PiB1bmtub3duXG5cdG9uQnVzeVN0YXRlQ2hhbmdlZDogKGlzQnVzeTogYm9vbGVhbikgPT4gdW5rbm93blxuXHRpbmplY3Rpb25zUmlnaHRCdXR0b25BdHRycz86IEljb25CdXR0b25BdHRycyB8IG51bGxcblx0b25Eb21haW5DaGFuZ2VkOiAoZG9tYWluOiBFbWFpbERvbWFpbkRhdGEpID0+IHVua25vd25cblx0bWFpbEFkZHJlc3NOQUVycm9yPzogVHJhbnNsYXRpb25LZXlcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uUmVzdWx0IHtcblx0aXNWYWxpZDogYm9vbGVhblxuXHRlcnJvcklkOiBUcmFuc2xhdGlvbktleSB8IG51bGxcbn1cblxuZXhwb3J0IGNsYXNzIFNlbGVjdE1haWxBZGRyZXNzRm9ybSBpbXBsZW1lbnRzIENvbXBvbmVudDxTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycz4ge1xuXHRwcml2YXRlIHVzZXJuYW1lOiBzdHJpbmdcblx0cHJpdmF0ZSBtZXNzYWdlSWQ6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbFxuXHRwcml2YXRlIGNoZWNrQWRkcmVzc1RpbWVvdXQ6IFRpbWVvdXRJRCB8IG51bGxcblx0cHJpdmF0ZSBpc1ZlcmlmaWNhdGlvbkJ1c3k6IGJvb2xlYW5cblx0cHJpdmF0ZSBsYXN0QXR0cnM6IFNlbGVjdE1haWxBZGRyZXNzRm9ybUF0dHJzXG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycz4pIHtcblx0XHR0aGlzLmxhc3RBdHRycyA9IGF0dHJzXG5cdFx0dGhpcy5pc1ZlcmlmaWNhdGlvbkJ1c3kgPSBmYWxzZVxuXHRcdHRoaXMuY2hlY2tBZGRyZXNzVGltZW91dCA9IG51bGxcblx0XHR0aGlzLnVzZXJuYW1lID0gXCJcIlxuXHRcdHRoaXMubWVzc2FnZUlkID0gXCJtYWlsQWRkcmVzc05ldXRyYWxfbXNnXCJcblx0fVxuXG5cdG9udXBkYXRlKHZub2RlOiBWbm9kZTxTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycz4pIHtcblx0XHRpZiAodGhpcy5sYXN0QXR0cnMuc2VsZWN0ZWREb21haW4uZG9tYWluICE9PSB2bm9kZS5hdHRycy5zZWxlY3RlZERvbWFpbi5kb21haW4pIHtcblx0XHRcdHRoaXMudmVyaWZ5TWFpbEFkZHJlc3Modm5vZGUuYXR0cnMpXG5cdFx0fVxuXHRcdHRoaXMubGFzdEF0dHJzID0gdm5vZGUuYXR0cnNcblx0fVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Ly8gdGhpcyBpcyBhIHNlbWktZ29vZCBoYWNrIHRvIHJlc2V0IHRoZSB1c2VybmFtZSBhZnRlciB0aGUgdXNlciBwcmVzc2VkIFwib2tcIlxuXHRcdC8vIHRoaXMgYmVoYXZpb3IgaXMgbm90IG5lY2Vzc2FyaWx5IGV4cGVjdGVkLCBlLmcuIGlmIHRoZSB1c2VyIGVudGVycyBhbiBpbnZhbGlkIGVtYWlsIGFkZHJlc3MgYW5kIHByZXNzZXMgXCJva1wiIHdlIG1pZ2h0IG5vdCB3YW50IHRvIGNsZWFyIHRoZVxuXHRcdC8vIHVzZXJuYW1lIGZpZWxkLiB3ZSB3b3VsZCBuZWVkIHRvIGZpbmQgYSB3YXkgdG8gY2xlYXIgdGhlIGZpZWxkIGZyb20gdGhlIG91dHNpZGUgdG8gc29sdmUgdGhpcy5cblx0XHRpZiAoYXR0cnMuaW5qZWN0aW9uc1JpZ2h0QnV0dG9uQXR0cnM/LmNsaWNrKSB7XG5cdFx0XHRjb25zdCBvcmlnaW5hbENhbGxiYWNrID0gYXR0cnMuaW5qZWN0aW9uc1JpZ2h0QnV0dG9uQXR0cnMuY2xpY2tcblxuXHRcdFx0YXR0cnMuaW5qZWN0aW9uc1JpZ2h0QnV0dG9uQXR0cnMuY2xpY2sgPSAoZXZlbnQsIGRvbSkgPT4ge1xuXHRcdFx0XHRvcmlnaW5hbENhbGxiYWNrKGV2ZW50LCBkb20pXG5cdFx0XHRcdHRoaXMudXNlcm5hbWUgPSBcIlwiXG5cdFx0XHRcdHRoaXMubWVzc2FnZUlkID0gXCJtYWlsQWRkcmVzc05ldXRyYWxfbXNnXCJcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBcIm1haWxBZGRyZXNzX2xhYmVsXCIsXG5cdFx0XHR2YWx1ZTogdGhpcy51c2VybmFtZSxcblx0XHRcdGFsaWduUmlnaHQ6IHRydWUsXG5cdFx0XHRhdXRvY29tcGxldGVBczogQXV0b2NvbXBsZXRlLm5ld1Bhc3N3b3JkLFxuXHRcdFx0YXV0b2NhcGl0YWxpemU6IEF1dG9jYXBpdGFsaXplLm5vbmUsXG5cdFx0XHRoZWxwTGFiZWw6ICgpID0+IHRoaXMuYWRkcmVzc0hlbHBMYWJlbCgpLFxuXHRcdFx0Zm9udFNpemU6IHB4KHNpemUuZm9udF9zaXplX3NtYWxsZXIpLFxuXHRcdFx0b25pbnB1dDogKHZhbHVlKSA9PiB7XG5cdFx0XHRcdHRoaXMudXNlcm5hbWUgPSB2YWx1ZVxuXHRcdFx0XHR0aGlzLnZlcmlmeU1haWxBZGRyZXNzKGF0dHJzKVxuXHRcdFx0fSxcblx0XHRcdGluamVjdGlvbnNSaWdodDogKCkgPT4gW1xuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXguaXRlbXMtZW5kLmFsaWduLXNlbGYtZW5kXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBcIjFweFwiLFxuXHRcdFx0XHRcdFx0XHRmbGV4OiBcIjEgMSBhdXRvXCIsXG5cdFx0XHRcdFx0XHRcdGZvbnRTaXplOiBweChzaXplLmZvbnRfc2l6ZV9zbWFsbGVyKSxcblx0XHRcdFx0XHRcdFx0bGluZUhlaWdodDogcHgoaW5wdXRMaW5lSGVpZ2h0KSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRgQCR7YXR0cnMuc2VsZWN0ZWREb21haW4uZG9tYWlufWAsXG5cdFx0XHRcdCksXG5cdFx0XHRcdGF0dHJzLmF2YWlsYWJsZURvbWFpbnMubGVuZ3RoID4gMVxuXHRcdFx0XHRcdD8gbShcblx0XHRcdFx0XHRcdFx0SWNvbkJ1dHRvbixcblx0XHRcdFx0XHRcdFx0YXR0YWNoRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiZG9tYWluX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuRXhwYW5kLFxuXHRcdFx0XHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRBdHRyczogKCkgPT4gYXR0cnMuYXZhaWxhYmxlRG9tYWlucy5tYXAoKGRvbWFpbikgPT4gdGhpcy5jcmVhdGVEcm9wZG93bkl0ZW1BdHRycyhkb21haW4sIGF0dHJzKSksXG5cdFx0XHRcdFx0XHRcdFx0c2hvd0Ryb3Bkb3duOiAoKSA9PiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdHdpZHRoOiAyNTAsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdDogYXR0cnMuaW5qZWN0aW9uc1JpZ2h0QnV0dG9uQXR0cnNcblx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwgYXR0cnMuaW5qZWN0aW9uc1JpZ2h0QnV0dG9uQXR0cnMpXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRDbGVhbk1haWxBZGRyZXNzKGF0dHJzOiBTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycykge1xuXHRcdHJldHVybiBmb3JtYXRNYWlsQWRkcmVzc0Zyb21QYXJ0cyh0aGlzLnVzZXJuYW1lLCBhdHRycy5zZWxlY3RlZERvbWFpbi5kb21haW4pXG5cdH1cblxuXHRwcml2YXRlIGFkZHJlc3NIZWxwTGFiZWwoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiB0aGlzLmlzVmVyaWZpY2F0aW9uQnVzeVxuXHRcdFx0PyBtKFwiLmZsZXguaXRlbXMtY2VudGVyLm10LXNcIiwgW3RoaXMucHJvZ3Jlc3NJY29uKCksIGxhbmcuZ2V0KFwibWFpbEFkZHJlc3NCdXN5X21zZ1wiKV0pXG5cdFx0XHQ6IG0oXCIubXQtc1wiLCBsYW5nLmdldCh0aGlzLm1lc3NhZ2VJZCA/PyBWQUxJRF9NRVNTQUdFX0lEKSlcblx0fVxuXG5cdHByaXZhdGUgcHJvZ3Jlc3NJY29uKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShJY29uLCB7XG5cdFx0XHRpY29uOiBCb290SWNvbnMuUHJvZ3Jlc3MsXG5cdFx0XHRjbGFzczogXCJpY29uLXByb2dyZXNzIG1yLXNcIixcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVEcm9wZG93bkl0ZW1BdHRycyhkb21haW5EYXRhOiBFbWFpbERvbWFpbkRhdGEsIGF0dHJzOiBTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycyk6IERyb3Bkb3duQnV0dG9uQXR0cnMge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJkb21haW5cIiwgZG9tYWluRGF0YS5kb21haW4pLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0YXR0cnMub25Eb21haW5DaGFuZ2VkKGRvbWFpbkRhdGEpXG5cdFx0XHR9LFxuXHRcdFx0aWNvbjogZG9tYWluRGF0YS5pc1BhaWQgPyBCb290SWNvbnMuUHJlbWl1bSA6IHVuZGVmaW5lZCxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIG9uQnVzeVN0YXRlQ2hhbmdlZChpc0J1c3k6IGJvb2xlYW4sIG9uQnVzeVN0YXRlQ2hhbmdlZDogKGFyZzA6IGJvb2xlYW4pID0+IHVua25vd24pOiB2b2lkIHtcblx0XHR0aGlzLmlzVmVyaWZpY2F0aW9uQnVzeSA9IGlzQnVzeVxuXHRcdG9uQnVzeVN0YXRlQ2hhbmdlZChpc0J1c3kpXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0cHJpdmF0ZSBvblZhbGlkYXRpb25GaW5pc2hlZChcblx0XHRlbWFpbDogc3RyaW5nLFxuXHRcdHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsXG5cdFx0b25WYWxpZGF0aW9uUmVzdWx0OiBTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRyc1tcIm9uVmFsaWRhdGlvblJlc3VsdFwiXSxcblx0KTogdm9pZCB7XG5cdFx0dGhpcy5tZXNzYWdlSWQgPSB2YWxpZGF0aW9uUmVzdWx0LmVycm9ySWRcblx0XHRvblZhbGlkYXRpb25SZXN1bHQoZW1haWwsIHZhbGlkYXRpb25SZXN1bHQpXG5cdH1cblxuXHRwcml2YXRlIHZlcmlmeU1haWxBZGRyZXNzKGF0dHJzOiBTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycykge1xuXHRcdGNvbnN0IHsgb25WYWxpZGF0aW9uUmVzdWx0LCBvbkJ1c3lTdGF0ZUNoYW5nZWQgfSA9IGF0dHJzXG5cdFx0aWYgKHRoaXMuY2hlY2tBZGRyZXNzVGltZW91dCkgY2xlYXJUaW1lb3V0KHRoaXMuY2hlY2tBZGRyZXNzVGltZW91dClcblxuXHRcdGNvbnN0IGNsZWFuTWFpbEFkZHJlc3MgPSB0aGlzLmdldENsZWFuTWFpbEFkZHJlc3MoYXR0cnMpXG5cdFx0Y29uc3QgY2xlYW5Vc2VybmFtZSA9IHRoaXMudXNlcm5hbWUudHJpbSgpLnRvTG93ZXJDYXNlKClcblxuXHRcdGlmIChjbGVhblVzZXJuYW1lID09PSBcIlwiKSB7XG5cdFx0XHR0aGlzLm9uVmFsaWRhdGlvbkZpbmlzaGVkKFxuXHRcdFx0XHRjbGVhbk1haWxBZGRyZXNzLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aXNWYWxpZDogZmFsc2UsXG5cdFx0XHRcdFx0ZXJyb3JJZDogXCJtYWlsQWRkcmVzc05ldXRyYWxfbXNnXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uVmFsaWRhdGlvblJlc3VsdCxcblx0XHRcdClcblx0XHRcdHRoaXMub25CdXN5U3RhdGVDaGFuZ2VkKGZhbHNlLCBvbkJ1c3lTdGF0ZUNoYW5nZWQpXG5cblx0XHRcdHJldHVyblxuXHRcdH0gZWxzZSBpZiAoIWlzTWFpbEFkZHJlc3MoY2xlYW5NYWlsQWRkcmVzcywgdHJ1ZSkgfHwgKGlzVHV0YU1haWxBZGRyZXNzKGNsZWFuTWFpbEFkZHJlc3MpICYmIGNsZWFuVXNlcm5hbWUubGVuZ3RoIDwgMykpIHtcblx0XHRcdHRoaXMub25WYWxpZGF0aW9uRmluaXNoZWQoXG5cdFx0XHRcdGNsZWFuTWFpbEFkZHJlc3MsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpc1ZhbGlkOiBmYWxzZSxcblx0XHRcdFx0XHRlcnJvcklkOiBcIm1haWxBZGRyZXNzSW52YWxpZF9tc2dcIixcblx0XHRcdFx0fSxcblx0XHRcdFx0b25WYWxpZGF0aW9uUmVzdWx0LFxuXHRcdFx0KVxuXHRcdFx0dGhpcy5vbkJ1c3lTdGF0ZUNoYW5nZWQoZmFsc2UsIG9uQnVzeVN0YXRlQ2hhbmdlZClcblxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dGhpcy5vbkJ1c3lTdGF0ZUNoYW5nZWQodHJ1ZSwgb25CdXN5U3RhdGVDaGFuZ2VkKVxuXG5cdFx0dGhpcy5jaGVja0FkZHJlc3NUaW1lb3V0ID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5nZXRDbGVhbk1haWxBZGRyZXNzKGF0dHJzKSAhPT0gY2xlYW5NYWlsQWRkcmVzcykgcmV0dXJuXG5cblx0XHRcdGxldCByZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGF2YWlsYWJsZSA9IGF3YWl0IGxvY2F0b3IubWFpbEFkZHJlc3NGYWNhZGUuaXNNYWlsQWRkcmVzc0F2YWlsYWJsZShjbGVhbk1haWxBZGRyZXNzKVxuXHRcdFx0XHRyZXN1bHQgPSBhdmFpbGFibGVcblx0XHRcdFx0XHQ/IHsgaXNWYWxpZDogdHJ1ZSwgZXJyb3JJZDogbnVsbCB9XG5cdFx0XHRcdFx0OiB7XG5cdFx0XHRcdFx0XHRcdGlzVmFsaWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRlcnJvcklkOiBhdHRycy5tYWlsQWRkcmVzc05BRXJyb3IgPz8gXCJtYWlsQWRkcmVzc05BX21zZ1wiLFxuXHRcdFx0XHRcdCAgfVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIEFjY2Vzc0RlYWN0aXZhdGVkRXJyb3IpIHtcblx0XHRcdFx0XHRyZXN1bHQgPSB7IGlzVmFsaWQ6IGZhbHNlLCBlcnJvcklkOiBcIm1haWxBZGRyZXNzRGVsYXlfbXNnXCIgfVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0aWYgKHRoaXMuZ2V0Q2xlYW5NYWlsQWRkcmVzcyhhdHRycykgPT09IGNsZWFuTWFpbEFkZHJlc3MpIHtcblx0XHRcdFx0XHR0aGlzLm9uQnVzeVN0YXRlQ2hhbmdlZChmYWxzZSwgb25CdXN5U3RhdGVDaGFuZ2VkKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmdldENsZWFuTWFpbEFkZHJlc3MoYXR0cnMpID09PSBjbGVhbk1haWxBZGRyZXNzKSB7XG5cdFx0XHRcdHRoaXMub25WYWxpZGF0aW9uRmluaXNoZWQoY2xlYW5NYWlsQWRkcmVzcywgcmVzdWx0LCBvblZhbGlkYXRpb25SZXN1bHQpXG5cdFx0XHR9XG5cdFx0fSwgNTAwKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgUmVnaXN0cmF0aW9uQ2FwdGNoYVNlcnZpY2UgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3N5cy9TZXJ2aWNlcy5qc1wiXG5pbXBvcnQgeyBjcmVhdGVSZWdpc3RyYXRpb25DYXB0Y2hhU2VydmljZURhdGEsIGNyZWF0ZVJlZ2lzdHJhdGlvbkNhcHRjaGFTZXJ2aWNlR2V0RGF0YSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGRldmljZUNvbmZpZyB9IGZyb20gXCIuLi9taXNjL0RldmljZUNvbmZpZy5qc1wiXG5pbXBvcnQgeyBBY2Nlc3NEZWFjdGl2YXRlZEVycm9yLCBBY2Nlc3NFeHBpcmVkRXJyb3IsIEludmFsaWREYXRhRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXIsIERpYWxvZ0hlYWRlckJhckF0dHJzIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ0hlYWRlckJhci5qc1wiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBUZXh0RmllbGQgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IHVpbnQ4QXJyYXlUb0Jhc2U2NCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vZ3VpL3RoZW1lXCJcbmltcG9ydCB7IGdldENvbG9yTHVtaW5hbmNlLCBpc01vbm9jaHJvbWUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvQ29sb3JcIlxuXG4vKipcbiAqIEFjY2VwdHMgbXVsdGlwbGUgZm9ybWF0cyBmb3IgYSB0aW1lIG9mIGRheSBhbmQgYWx3YXlzIHJldHVybnMgMTJoLWZvcm1hdCB3aXRoIGxlYWRpbmcgemVyb3MuXG4gKiBAcGFyYW0gY2FwdGNoYUlucHV0XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBISDpNTSBpZiBwYXJzZWQsIG51bGwgb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNhcHRjaGFJbnB1dChjYXB0Y2hhSW5wdXQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuXHRpZiAoY2FwdGNoYUlucHV0Lm1hdGNoKC9eWzAtMl0/WzAtOV06WzAtNV0/WzAtOV0kLykpIHtcblx0XHRsZXQgW2gsIG1dID0gY2FwdGNoYUlucHV0XG5cdFx0XHQudHJpbSgpXG5cdFx0XHQuc3BsaXQoXCI6XCIpXG5cdFx0XHQubWFwKCh0KSA9PiBOdW1iZXIodCkpXG5cblx0XHQvLyByZWdleCBjb3JyZWN0bHkgbWF0Y2hlcyAwLTU5IG1pbnV0ZXMsIGJ1dCBtYXRjaGVzIGhvdXJzIDAtMjksIHNvIHdlIG5lZWQgdG8gbWFrZSBzdXJlIGhvdXJzIGlzIDAtMjRcblx0XHRpZiAoaCA+IDI0KSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblxuXHRcdHJldHVybiBbaCAlIDEyLCBtXS5tYXAoKGEpID0+IFN0cmluZyhhKS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXCI6XCIpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHRoZSBhdXRoIHRva2VuIGZvciB0aGUgc2lnbnVwIGlmIHRoZSBjYXB0Y2hhIHdhcyBzb2x2ZWQgb3Igbm8gY2FwdGNoYSB3YXMgbmVjZXNzYXJ5LCBudWxsIG90aGVyd2lzZVxuICpcbiAqIFRPRE86XG4gKiAgKiBSZWZhY3RvciB0b2tlbiB1c2FnZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuQ2FwdGNoYUZsb3coXG5cdG1haWxBZGRyZXNzOiBzdHJpbmcsXG5cdGlzQnVzaW5lc3NVc2U6IGJvb2xlYW4sXG5cdGlzUGFpZFN1YnNjcmlwdGlvbjogYm9vbGVhbixcblx0Y2FtcGFpZ25Ub2tlbjogc3RyaW5nIHwgbnVsbCxcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuXHR0cnkge1xuXHRcdGNvbnN0IGNhcHRjaGFSZXR1cm4gPSBhd2FpdCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvci5nZXQoXG5cdFx0XHRSZWdpc3RyYXRpb25DYXB0Y2hhU2VydmljZSxcblx0XHRcdGNyZWF0ZVJlZ2lzdHJhdGlvbkNhcHRjaGFTZXJ2aWNlR2V0RGF0YSh7XG5cdFx0XHRcdHRva2VuOiBjYW1wYWlnblRva2VuLFxuXHRcdFx0XHRtYWlsQWRkcmVzcyxcblx0XHRcdFx0c2lnbnVwVG9rZW46IGRldmljZUNvbmZpZy5nZXRTaWdudXBUb2tlbigpLFxuXHRcdFx0XHRidXNpbmVzc1VzZVNlbGVjdGVkOiBpc0J1c2luZXNzVXNlLFxuXHRcdFx0XHRwYWlkU3Vic2NyaXB0aW9uU2VsZWN0ZWQ6IGlzUGFpZFN1YnNjcmlwdGlvbixcblx0XHRcdH0pLFxuXHRcdClcblx0XHRpZiAoY2FwdGNoYVJldHVybi5jaGFsbGVuZ2UpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiBhd2FpdCBzaG93Q2FwdGNoYURpYWxvZyhjYXB0Y2hhUmV0dXJuLmNoYWxsZW5nZSwgY2FwdGNoYVJldHVybi50b2tlbilcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkRGF0YUVycm9yKSB7XG5cdFx0XHRcdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXCJjcmVhdGVBY2NvdW50SW52YWxpZENhcHRjaGFfbXNnXCIpXG5cdFx0XHRcdFx0cmV0dXJuIHJ1bkNhcHRjaGFGbG93KG1haWxBZGRyZXNzLCBpc0J1c2luZXNzVXNlLCBpc1BhaWRTdWJzY3JpcHRpb24sIGNhbXBhaWduVG9rZW4pXG5cdFx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIEFjY2Vzc0V4cGlyZWRFcnJvcikge1xuXHRcdFx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwiY3JlYXRlQWNjb3VudEFjY2Vzc0RlYWN0aXZhdGVkX21zZ1wiKVxuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBjYXB0Y2hhUmV0dXJuLnRva2VuXG5cdFx0fVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKGUgaW5zdGFuY2VvZiBBY2Nlc3NEZWFjdGl2YXRlZEVycm9yKSB7XG5cdFx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShcImNyZWF0ZUFjY291bnRBY2Nlc3NEZWFjdGl2YXRlZF9tc2dcIilcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IGVcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gc2hvd0NhcHRjaGFEaWFsb2coY2hhbGxlbmdlOiBVaW50OEFycmF5LCB0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmcgfCBudWxsPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0bGV0IGRpYWxvZzogRGlhbG9nXG5cdFx0bGV0IGNhcHRjaGFJbnB1dCA9IFwiXCJcblxuXHRcdGNvbnN0IGNhbmNlbEFjdGlvbiA9ICgpID0+IHtcblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRyZXNvbHZlKG51bGwpXG5cdFx0fVxuXG5cdFx0Y29uc3Qgb2tBY3Rpb24gPSAoKSA9PiB7XG5cdFx0XHRsZXQgcGFyc2VkSW5wdXQgPSBwYXJzZUNhcHRjaGFJbnB1dChjYXB0Y2hhSW5wdXQpXG5cblx0XHRcdC8vIFVzZXIgZW50ZXJlZCBhbiBpbmNvcnJlY3RseSBmb3JtYXR0ZWQgdGltZVxuXHRcdFx0aWYgKHBhcnNlZElucHV0ID09IG51bGwpIHtcblx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJjYXB0Y2hhRW50ZXJfbXNnXCIpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaGUgdXNlciBlbnRlcmVkIGEgY29ycmVjdGx5IGZvcm1hdHRlZCB0aW1lLCBidXQgbm90IG9uZSB0aGF0IG91ciBjYXB0Y2hhIHdpbGwgZXZlciBnaXZlIG91dCAoaS5lLiBub3QgKjAgb3IgKjUpXG5cdFx0XHRjb25zdCBtaW51dGVPbmVzUGxhY2UgPSBwYXJzZWRJbnB1dFtwYXJzZWRJbnB1dC5sZW5ndGggLSAxXVxuXHRcdFx0aWYgKG1pbnV0ZU9uZXNQbGFjZSAhPT0gXCIwXCIgJiYgbWludXRlT25lc1BsYWNlICE9PSBcIjVcIikge1xuXHRcdFx0XHREaWFsb2cubWVzc2FnZShcImNyZWF0ZUFjY291bnRJbnZhbGlkQ2FwdGNoYV9tc2dcIilcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRsb2NhdG9yLnNlcnZpY2VFeGVjdXRvclxuXHRcdFx0XHQucG9zdChSZWdpc3RyYXRpb25DYXB0Y2hhU2VydmljZSwgY3JlYXRlUmVnaXN0cmF0aW9uQ2FwdGNoYVNlcnZpY2VEYXRhKHsgdG9rZW4sIHJlc3BvbnNlOiBwYXJzZWRJbnB1dCB9KSlcblx0XHRcdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdHJlc29sdmUodG9rZW4pXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdHJlamVjdChlKVxuXHRcdFx0XHR9KVxuXHRcdH1cblxuXHRcdGxldCBhY3Rpb25CYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMgPSB7XG5cdFx0XHRsZWZ0OiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6IGNhbmNlbEFjdGlvbixcblx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0XHRyaWdodDogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6IG9rQWN0aW9uLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0XHRtaWRkbGU6IFwiY2FwdGNoYURpc3BsYXlfbGFiZWxcIixcblx0XHR9XG5cdFx0Y29uc3QgaW1hZ2VEYXRhID0gYGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwke3VpbnQ4QXJyYXlUb0Jhc2U2NChjaGFsbGVuZ2UpfWBcblxuXHRcdGRpYWxvZyA9IG5ldyBEaWFsb2coRGlhbG9nVHlwZS5FZGl0U21hbGwsIHtcblx0XHRcdHZpZXc6ICgpOiBDaGlsZHJlbiA9PiB7XG5cdFx0XHRcdC8vIFRoZSBjYXB0Y2hhIGlzIGJsYWNrLW9uLXdoaXRlLCB3aGljaCB3aWxsIG5vdCBsb29rIGNvcnJlY3Qgb24gYW55dGhpbmcgd2hlcmUgdGhlIGJhY2tncm91bmQgaXMgbm90XG5cdFx0XHRcdC8vIHdoaXRlLiBXZSBjYW4gdXNlIENTUyBmaWx0ZXJzIHRvIGZpeCB0aGlzLlxuXHRcdFx0XHRsZXQgY2FwdGNoYUZpbHRlciA9IHt9XG5cdFx0XHRcdGlmICh0aGVtZS5lbGV2YXRlZF9iZyAhPSBudWxsICYmIGlzTW9ub2Nocm9tZSh0aGVtZS5lbGV2YXRlZF9iZykpIHtcblx0XHRcdFx0XHRjYXB0Y2hhRmlsdGVyID0ge1xuXHRcdFx0XHRcdFx0ZmlsdGVyOiBgaW52ZXJ0KCR7MS4wIC0gZ2V0Q29sb3JMdW1pbmFuY2UodGhlbWUuZWxldmF0ZWRfYmcpfWAsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0bShEaWFsb2dIZWFkZXJCYXIsIGFjdGlvbkJhckF0dHJzKSxcblx0XHRcdFx0XHRtKFwiLnBsci1sLnBiXCIsIFtcblx0XHRcdFx0XHRcdG0oXCJpbWcucHQtbWwuY2VudGVyLWguYmxvY2tcIiwge1xuXHRcdFx0XHRcdFx0XHRzcmM6IGltYWdlRGF0YSxcblx0XHRcdFx0XHRcdFx0YWx0OiBsYW5nLmdldChcImNhcHRjaGFEaXNwbGF5X2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0XHRzdHlsZTogY2FwdGNoYUZpbHRlcixcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiY2FwdGNoYV9pbnB1dFwiLCBsYW5nLmdldChcImNhcHRjaGFJbnB1dF9sYWJlbFwiKSArIFwiIChoaDptbSlcIiksXG5cdFx0XHRcdFx0XHRcdGhlbHBMYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJjYXB0Y2hhSW5mb19tc2dcIiksXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBjYXB0Y2hhSW5wdXQsXG5cdFx0XHRcdFx0XHRcdG9uaW5wdXQ6ICh2YWx1ZSkgPT4gKGNhcHRjaGFJbnB1dCA9IHZhbHVlKSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRdXG5cdFx0XHR9LFxuXHRcdH0pXG5cdFx0XHQuc2V0Q2xvc2VIYW5kbGVyKGNhbmNlbEFjdGlvbilcblx0XHRcdC5zaG93KClcblx0fSlcbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBBdXRvY29tcGxldGUsIFRleHRGaWVsZCB9IGZyb20gXCIuLi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgZ2V0V2hpdGVsYWJlbFJlZ2lzdHJhdGlvbkRvbWFpbnMgfSBmcm9tIFwiLi4vbG9naW4vTG9naW5WaWV3LmpzXCJcbmltcG9ydCB0eXBlIHsgTmV3QWNjb3VudERhdGEgfSBmcm9tIFwiLi9VcGdyYWRlU3Vic2NyaXB0aW9uV2l6YXJkXCJcbmltcG9ydCB7IFNlbGVjdE1haWxBZGRyZXNzRm9ybSwgU2VsZWN0TWFpbEFkZHJlc3NGb3JtQXR0cnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3NldHRpbmdzL1NlbGVjdE1haWxBZGRyZXNzRm9ybS5qc1wiXG5pbXBvcnQge1xuXHRBY2NvdW50VHlwZSxcblx0REVGQVVMVF9GUkVFX01BSUxfQUREUkVTU19TSUdOVVBfRE9NQUlOLFxuXHRERUZBVUxUX1BBSURfTUFJTF9BRERSRVNTX1NJR05VUF9ET01BSU4sXG5cdFRVVEFfTUFJTF9BRERSRVNTX1NJR05VUF9ET01BSU5TLFxufSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5cbmltcG9ydCB0eXBlIHsgQ2hlY2tib3hBdHRycyB9IGZyb20gXCIuLi9ndWkvYmFzZS9DaGVja2JveC5qc1wiXG5pbXBvcnQgeyBDaGVja2JveCB9IGZyb20gXCIuLi9ndWkvYmFzZS9DaGVja2JveC5qc1wiXG5pbXBvcnQgdHlwZSB7IGxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGdldEZpcnN0T3JUaHJvdywgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEluZm9MaW5rLCBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IEludmFsaWREYXRhRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IENVUlJFTlRfUFJJVkFDWV9WRVJTSU9OLCBDVVJSRU5UX1RFUk1TX1ZFUlNJT04sIHJlbmRlclRlcm1zQW5kQ29uZGl0aW9uc0J1dHRvbiwgVGVybXNTZWN0aW9uIH0gZnJvbSBcIi4vVGVybXNBbmRDb25kaXRpb25zXCJcbmltcG9ydCB7IFVzYWdlVGVzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXNhZ2V0ZXN0c1wiXG5pbXBvcnQgeyBydW5DYXB0Y2hhRmxvdyB9IGZyb20gXCIuL0NhcHRjaGEuanNcIlxuaW1wb3J0IHsgRW1haWxEb21haW5EYXRhLCBpc1BhaWRQbGFuRG9tYWluIH0gZnJvbSBcIi4uL3NldHRpbmdzL21haWxhZGRyZXNzL01haWxBZGRyZXNzZXNVdGlscy5qc1wiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcbmltcG9ydCB7IEV4dGVybmFsTGluayB9IGZyb20gXCIuLi9ndWkvYmFzZS9FeHRlcm5hbExpbmsuanNcIlxuaW1wb3J0IHsgUGFzc3dvcmRGb3JtLCBQYXNzd29yZE1vZGVsIH0gZnJvbSBcIi4uL3NldHRpbmdzL1Bhc3N3b3JkRm9ybS5qc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBTdWJzY3JpcHRpb25BcHAgfSBmcm9tIFwiLi9TdWJzY3JpcHRpb25WaWV3ZXJcIlxuXG5leHBvcnQgdHlwZSBTaWdudXBGb3JtQXR0cnMgPSB7XG5cdC8qKiBIYW5kbGUgYSBuZXcgYWNjb3VudCBzaWdudXAuIGlmIHJlYWRvbmx5IHRoZW4gdGhlIGFyZ3VtZW50IHdpbGwgYWx3YXlzIGJlIG51bGwgKi9cblx0b25Db21wbGV0ZTogKGFyZzA6IE5ld0FjY291bnREYXRhIHwgbnVsbCkgPT4gdm9pZFxuXHRvbkNoYW5nZVBsYW46ICgpID0+IHZvaWRcblx0aXNCdXNpbmVzc1VzZTogbGF6eTxib29sZWFuPlxuXHRpc1BhaWRTdWJzY3JpcHRpb246IGxhenk8Ym9vbGVhbj5cblx0Y2FtcGFpZ246IGxhenk8c3RyaW5nIHwgbnVsbD5cblx0Ly8gb25seSB1c2VkIGlmIHJlYWRvbmx5IGlzIHRydWVcblx0cHJlZmlsbGVkTWFpbEFkZHJlc3M/OiBzdHJpbmcgfCB1bmRlZmluZWRcblx0cmVhZG9ubHk6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNsYXNzIFNpZ251cEZvcm0gaW1wbGVtZW50cyBDb21wb25lbnQ8U2lnbnVwRm9ybUF0dHJzPiB7XG5cdHByaXZhdGUgcmVhZG9ubHkgcGFzc3dvcmRNb2RlbDogUGFzc3dvcmRNb2RlbFxuXHRwcml2YXRlIHJlYWRvbmx5IF9jb25maXJtVGVybXM6IFN0cmVhbTxib29sZWFuPlxuXHRwcml2YXRlIHJlYWRvbmx5IF9jb25maXJtQWdlOiBTdHJlYW08Ym9vbGVhbj5cblx0cHJpdmF0ZSByZWFkb25seSBfY29kZTogU3RyZWFtPHN0cmluZz5cblx0cHJpdmF0ZSBzZWxlY3RlZERvbWFpbjogRW1haWxEb21haW5EYXRhXG5cdHByaXZhdGUgX21haWxBZGRyZXNzRm9ybUVycm9ySWQ6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfbWFpbEFkZHJlc3MhOiBzdHJpbmdcblx0cHJpdmF0ZSBfaXNNYWlsVmVyaWZpY2F0aW9uQnVzeTogYm9vbGVhblxuXHRwcml2YXRlIHJlYWRvbmx5IF9fbWFpbFZhbGlkOiBTdHJlYW08Ym9vbGVhbj5cblx0cHJpdmF0ZSByZWFkb25seSBfX2xhc3RNYWlsVmFsaWRhdGlvbkVycm9yOiBTdHJlYW08VHJhbnNsYXRpb25LZXkgfCBudWxsPlxuXHRwcml2YXRlIF9fc2lnbnVwRnJlZVRlc3Q/OiBVc2FnZVRlc3Rcblx0cHJpdmF0ZSBfX3NpZ251cFBhaWRUZXN0PzogVXNhZ2VUZXN0XG5cblx0cHJpdmF0ZSByZWFkb25seSBhdmFpbGFibGVEb21haW5zOiByZWFkb25seSBFbWFpbERvbWFpbkRhdGFbXSA9IChsb2NhdG9yLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpLmZpcnN0UGFydHlEb21haW5cblx0XHQ/IFRVVEFfTUFJTF9BRERSRVNTX1NJR05VUF9ET01BSU5TXG5cdFx0OiBnZXRXaGl0ZWxhYmVsUmVnaXN0cmF0aW9uRG9tYWlucygpXG5cdCkubWFwKChkb21haW4pID0+ICh7IGRvbWFpbiwgaXNQYWlkOiBpc1BhaWRQbGFuRG9tYWluKGRvbWFpbikgfSkpXG5cblx0Y29uc3RydWN0b3Iodm5vZGU6IFZub2RlPFNpZ251cEZvcm1BdHRycz4pIHtcblx0XHR0aGlzLnNlbGVjdGVkRG9tYWluID0gZ2V0Rmlyc3RPclRocm93KHRoaXMuYXZhaWxhYmxlRG9tYWlucylcblx0XHQvLyB0dXRhLmNvbSBnZXRzIHByZWZlcmVuY2UgdXNlciBpcyBzaWduaW5nIHVwIGZvciBhIHBhaWQgYWNjb3VudCBhbmQgaXQgaXMgYXZhaWxhYmxlXG5cdFx0aWYgKHZub2RlLmF0dHJzLmlzUGFpZFN1YnNjcmlwdGlvbigpKSB7XG5cdFx0XHR0aGlzLnNlbGVjdGVkRG9tYWluID0gdGhpcy5hdmFpbGFibGVEb21haW5zLmZpbmQoKGRvbWFpbikgPT4gZG9tYWluLmRvbWFpbiA9PT0gREVGQVVMVF9QQUlEX01BSUxfQUREUkVTU19TSUdOVVBfRE9NQUlOKSA/PyB0aGlzLnNlbGVjdGVkRG9tYWluXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc2VsZWN0ZWREb21haW4gPSB0aGlzLmF2YWlsYWJsZURvbWFpbnMuZmluZCgoZG9tYWluKSA9PiBkb21haW4uZG9tYWluID09PSBERUZBVUxUX0ZSRUVfTUFJTF9BRERSRVNTX1NJR05VUF9ET01BSU4pID8/IHRoaXMuc2VsZWN0ZWREb21haW5cblx0XHR9XG5cblx0XHR0aGlzLl9fbWFpbFZhbGlkID0gc3RyZWFtKGZhbHNlKVxuXHRcdHRoaXMuX19sYXN0TWFpbFZhbGlkYXRpb25FcnJvciA9IHN0cmVhbShudWxsKVxuXHRcdHRoaXMucGFzc3dvcmRNb2RlbCA9IG5ldyBQYXNzd29yZE1vZGVsKFxuXHRcdFx0bG9jYXRvci51c2FnZVRlc3RDb250cm9sbGVyLFxuXHRcdFx0bG9jYXRvci5sb2dpbnMsXG5cdFx0XHR7XG5cdFx0XHRcdGNoZWNrT2xkUGFzc3dvcmQ6IGZhbHNlLFxuXHRcdFx0XHRlbmZvcmNlU3RyZW5ndGg6IHRydWUsXG5cdFx0XHRcdHJlc2VydmVkU3RyaW5nczogKCkgPT4gKHRoaXMuX21haWxBZGRyZXNzID8gW3RoaXMuX21haWxBZGRyZXNzLnNwbGl0KFwiQFwiKVswXV0gOiBbXSksXG5cdFx0XHR9LFxuXHRcdFx0dGhpcy5fX21haWxWYWxpZCxcblx0XHQpXG5cblx0XHR0aGlzLl9fc2lnbnVwRnJlZVRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInNpZ251cC5mcmVlXCIpXG5cdFx0dGhpcy5fX3NpZ251cFBhaWRUZXN0ID0gbG9jYXRvci51c2FnZVRlc3RDb250cm9sbGVyLmdldFRlc3QoXCJzaWdudXAucGFpZFwiKVxuXG5cdFx0dGhpcy5fY29uZmlybVRlcm1zID0gc3RyZWFtPGJvb2xlYW4+KGZhbHNlKVxuXHRcdHRoaXMuX2NvbmZpcm1BZ2UgPSBzdHJlYW08Ym9vbGVhbj4oZmFsc2UpXG5cdFx0dGhpcy5fY29kZSA9IHN0cmVhbShcIlwiKVxuXHRcdHRoaXMuX2lzTWFpbFZlcmlmaWNhdGlvbkJ1c3kgPSBmYWxzZVxuXHRcdHRoaXMuX21haWxBZGRyZXNzRm9ybUVycm9ySWQgPSBcIm1haWxBZGRyZXNzTmV1dHJhbF9tc2dcIlxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8U2lnbnVwRm9ybUF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblxuXHRcdGNvbnN0IG1haWxBZGRyZXNzRm9ybUF0dHJzOiBTZWxlY3RNYWlsQWRkcmVzc0Zvcm1BdHRycyA9IHtcblx0XHRcdHNlbGVjdGVkRG9tYWluOiB0aGlzLnNlbGVjdGVkRG9tYWluLFxuXHRcdFx0b25Eb21haW5DaGFuZ2VkOiAoZG9tYWluKSA9PiB7XG5cdFx0XHRcdGlmICghZG9tYWluLmlzUGFpZCB8fCBhLmlzUGFpZFN1YnNjcmlwdGlvbigpKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZERvbWFpbiA9IGRvbWFpblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdERpYWxvZy5jb25maXJtKGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiY29uZmlybV9tc2dcIiwgYCR7bGFuZy5nZXQoXCJwYWlkRW1haWxEb21haW5TaWdudXBfbXNnXCIpfVxcbiR7bGFuZy5nZXQoXCJjaGFuZ2VQYWlkUGxhbl9tc2dcIil9YCkpLnRoZW4oXG5cdFx0XHRcdFx0XHQoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0XHRcdFx0XHR2bm9kZS5hdHRycy5vbkNoYW5nZVBsYW4oKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGF2YWlsYWJsZURvbWFpbnM6IHRoaXMuYXZhaWxhYmxlRG9tYWlucyxcblx0XHRcdG9uVmFsaWRhdGlvblJlc3VsdDogKGVtYWlsLCB2YWxpZGF0aW9uUmVzdWx0KSA9PiB7XG5cdFx0XHRcdHRoaXMuX19tYWlsVmFsaWQodmFsaWRhdGlvblJlc3VsdC5pc1ZhbGlkKVxuXG5cdFx0XHRcdGlmICh2YWxpZGF0aW9uUmVzdWx0LmlzVmFsaWQpIHtcblx0XHRcdFx0XHR0aGlzLl9tYWlsQWRkcmVzcyA9IGVtYWlsXG5cdFx0XHRcdFx0dGhpcy5wYXNzd29yZE1vZGVsLnJlY2FsY3VsYXRlUGFzc3dvcmRTdHJlbmd0aCgpXG5cdFx0XHRcdFx0dGhpcy5fbWFpbEFkZHJlc3NGb3JtRXJyb3JJZCA9IG51bGxcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLl9tYWlsQWRkcmVzc0Zvcm1FcnJvcklkID0gdmFsaWRhdGlvblJlc3VsdC5lcnJvcklkXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvbkJ1c3lTdGF0ZUNoYW5nZWQ6IChpc0J1c3kpID0+IHtcblx0XHRcdFx0dGhpcy5faXNNYWlsVmVyaWZpY2F0aW9uQnVzeSA9IGlzQnVzeVxuXHRcdFx0fSxcblx0XHR9XG5cdFx0Y29uc3QgY29uZmlybVRlcm1zQ2hlY2tCb3hBdHRyczogQ2hlY2tib3hBdHRycyA9IHtcblx0XHRcdGxhYmVsOiByZW5kZXJUZXJtc0xhYmVsLFxuXHRcdFx0Y2hlY2tlZDogdGhpcy5fY29uZmlybVRlcm1zKCksXG5cdFx0XHRvbkNoZWNrZWQ6IHRoaXMuX2NvbmZpcm1UZXJtcyxcblx0XHR9XG5cdFx0Y29uc3QgY29uZmlybUFnZUNoZWNrQm94QXR0cnM6IENoZWNrYm94QXR0cnMgPSB7XG5cdFx0XHRsYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJhZ2VDb25maXJtYXRpb25fbXNnXCIpLFxuXHRcdFx0Y2hlY2tlZDogdGhpcy5fY29uZmlybUFnZSgpLFxuXHRcdFx0b25DaGVja2VkOiB0aGlzLl9jb25maXJtQWdlLFxuXHRcdH1cblxuXHRcdGNvbnN0IHN1Ym1pdCA9ICgpID0+IHtcblx0XHRcdGlmICh0aGlzLl9pc01haWxWZXJpZmljYXRpb25CdXN5KSByZXR1cm5cblxuXHRcdFx0aWYgKGEucmVhZG9ubHkpIHtcblx0XHRcdFx0Ly8gRW1haWwgZmllbGQgaXMgcmVhZC1vbmx5LCBhY2NvdW50IGhhcyBhbHJlYWR5IGJlZW4gY3JlYXRlZCBidXQgdXNlciBzd2l0Y2hlZCBmcm9tIGRpZmZlcmVudCBzdWJzY3JpcHRpb24uXG5cdFx0XHRcdHRoaXMuX19jb21wbGV0ZVByZXZpb3VzU3RhZ2VzKClcblxuXHRcdFx0XHRyZXR1cm4gYS5vbkNvbXBsZXRlKG51bGwpXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9XG5cdFx0XHRcdHRoaXMuX21haWxBZGRyZXNzRm9ybUVycm9ySWQgfHwgdGhpcy5wYXNzd29yZE1vZGVsLmdldEVycm9yTWVzc2FnZUlkKCkgfHwgKCF0aGlzLl9jb25maXJtVGVybXMoKSA/IFwidGVybXNBY2NlcHRlZE5ldXRyYWxfbXNnXCIgOiBudWxsKVxuXG5cdFx0XHRpZiAoZXJyb3JNZXNzYWdlKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKGVycm9yTWVzc2FnZSlcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGFnZUNvbmZpcm1Qcm9taXNlID0gdGhpcy5fY29uZmlybUFnZSgpID8gUHJvbWlzZS5yZXNvbHZlKHRydWUpIDogRGlhbG9nLmNvbmZpcm0oXCJwYXJlbnRDb25maXJtYXRpb25fbXNnXCIsIFwicGF5bWVudERhdGFWYWxpZGF0aW9uX2FjdGlvblwiKVxuXHRcdFx0YWdlQ29uZmlybVByb21pc2UudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0XHR0aGlzLl9fY29tcGxldGVQcmV2aW91c1N0YWdlcygpXG5cblx0XHRcdFx0XHRyZXR1cm4gc2lnbnVwKFxuXHRcdFx0XHRcdFx0dGhpcy5fbWFpbEFkZHJlc3MsXG5cdFx0XHRcdFx0XHR0aGlzLnBhc3N3b3JkTW9kZWwuZ2V0TmV3UGFzc3dvcmQoKSxcblx0XHRcdFx0XHRcdHRoaXMuX2NvZGUoKSxcblx0XHRcdFx0XHRcdGEuaXNCdXNpbmVzc1VzZSgpLFxuXHRcdFx0XHRcdFx0YS5pc1BhaWRTdWJzY3JpcHRpb24oKSxcblx0XHRcdFx0XHRcdGEuY2FtcGFpZ24oKSxcblx0XHRcdFx0XHQpLnRoZW4oKG5ld0FjY291bnREYXRhKSA9PiB7XG5cdFx0XHRcdFx0XHRhLm9uQ29tcGxldGUobmV3QWNjb3VudERhdGEgPyBuZXdBY2NvdW50RGF0YSA6IG51bGwpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiI3NpZ251cC1hY2NvdW50LWRpYWxvZy5mbGV4LWNlbnRlclwiLFxuXHRcdFx0bShcIi5mbGV4LWdyb3ctc2hyaW5rLWF1dG8ubWF4LXdpZHRoLW0ucHQucGIucGxyLWxcIiwgW1xuXHRcdFx0XHRhLnJlYWRvbmx5XG5cdFx0XHRcdFx0PyBtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJtYWlsQWRkcmVzc19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZTogYS5wcmVmaWxsZWRNYWlsQWRkcmVzcyA/PyBcIlwiLFxuXHRcdFx0XHRcdFx0XHRhdXRvY29tcGxldGVBczogQXV0b2NvbXBsZXRlLm5ld1Bhc3N3b3JkLFxuXHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IFtcblx0XHRcdFx0XHRcdFx0bShTZWxlY3RNYWlsQWRkcmVzc0Zvcm0sIG1haWxBZGRyZXNzRm9ybUF0dHJzKSwgLy8gTGVhdmUgYXMgaXNcblx0XHRcdFx0XHRcdFx0YS5pc1BhaWRTdWJzY3JpcHRpb24oKVxuXHRcdFx0XHRcdFx0XHRcdD8gbShcIi5zbWFsbC5tdC1zXCIsIGxhbmcuZ2V0KFwiY29uZmlndXJlQ3VzdG9tRG9tYWluQWZ0ZXJTaWdudXBfbXNnXCIpLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG0oRXh0ZXJuYWxMaW5rLCB7IGhyZWY6IEluZm9MaW5rLkRvbWFpbkluZm8sIGlzQ29tcGFueVNpdGU6IHRydWUgfSksXG5cdFx0XHRcdFx0XHRcdFx0ICBdKVxuXHRcdFx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRcdFx0bShQYXNzd29yZEZvcm0sIHtcblx0XHRcdFx0XHRcdFx0XHRtb2RlbDogdGhpcy5wYXNzd29yZE1vZGVsLFxuXHRcdFx0XHRcdFx0XHRcdHBhc3N3b3JkSW5mb0tleTogXCJwYXNzd29yZEltcG9ydGFuY2VfbXNnXCIsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRnZXRXaGl0ZWxhYmVsUmVnaXN0cmF0aW9uRG9tYWlucygpLmxlbmd0aCA+IDBcblx0XHRcdFx0XHRcdFx0XHQ/IG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlOiB0aGlzLl9jb2RlKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uaW5wdXQ6IHRoaXMuX2NvZGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcIndoaXRlbGFiZWxSZWdpc3RyYXRpb25Db2RlX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRcdFx0bShDaGVja2JveCwgY29uZmlybVRlcm1zQ2hlY2tCb3hBdHRycyksXG5cdFx0XHRcdFx0XHRcdG0oXCJkaXZcIiwgcmVuZGVyVGVybXNBbmRDb25kaXRpb25zQnV0dG9uKFRlcm1zU2VjdGlvbi5UZXJtcywgQ1VSUkVOVF9URVJNU19WRVJTSU9OKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJkaXZcIiwgcmVuZGVyVGVybXNBbmRDb25kaXRpb25zQnV0dG9uKFRlcm1zU2VjdGlvbi5Qcml2YWN5LCBDVVJSRU5UX1BSSVZBQ1lfVkVSU0lPTikpLFxuXHRcdFx0XHRcdFx0XHRtKENoZWNrYm94LCBjb25maXJtQWdlQ2hlY2tCb3hBdHRycyksXG5cdFx0XHRcdFx0ICBdLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLm10LWwubWItbFwiLFxuXHRcdFx0XHRcdG0oTG9naW5CdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcIm5leHRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRvbmNsaWNrOiBzdWJtaXQsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0XHRdKSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIF9fY29tcGxldGVQcmV2aW91c1N0YWdlcygpIHtcblx0XHQvLyBPbmx5IHRoZSBzdGFydGVkIHRlc3QncyAoZWl0aGVyIGZyZWUgb3IgcGFpZCBjbGlja2VkKSBzdGFnZXMgYXJlIGNvbXBsZXRlZCBoZXJlXG5cdFx0aWYgKHRoaXMuX19zaWdudXBGcmVlVGVzdCkge1xuXHRcdFx0Ly8gTWFrZSBzdXJlIHRoYXQgdGhlIHByZXZpb3VzIHR3byBwaW5ncyAodmFsaWQgZW1haWwgKyB2YWxpZCBwYXNzd29yZHMpIGhhdmUgYmVlbiBzZW50IGluIHRoZSBjb3JyZWN0IG9yZGVyXG5cdFx0XHRhd2FpdCB0aGlzLl9fc2lnbnVwRnJlZVRlc3QuZ2V0U3RhZ2UoMikuY29tcGxldGUoKVxuXHRcdFx0YXdhaXQgdGhpcy5fX3NpZ251cEZyZWVUZXN0LmdldFN0YWdlKDMpLmNvbXBsZXRlKClcblxuXHRcdFx0Ly8gQ3JlZGVudGlhbHMgY29uZmlybWF0aW9uIChjbGljayBvbiBuZXh0KVxuXHRcdFx0YXdhaXQgdGhpcy5fX3NpZ251cEZyZWVUZXN0LmdldFN0YWdlKDQpLmNvbXBsZXRlKClcblx0XHR9XG5cblx0XHRpZiAodGhpcy5fX3NpZ251cFBhaWRUZXN0KSB7XG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhhdCB0aGUgcHJldmlvdXMgdHdvIHBpbmdzICh2YWxpZCBlbWFpbCArIHZhbGlkIHBhc3N3b3JkcykgaGF2ZSBiZWVuIHNlbnQgaW4gdGhlIGNvcnJlY3Qgb3JkZXJcblx0XHRcdGF3YWl0IHRoaXMuX19zaWdudXBQYWlkVGVzdC5nZXRTdGFnZSgxKS5jb21wbGV0ZSgpXG5cdFx0XHRhd2FpdCB0aGlzLl9fc2lnbnVwUGFpZFRlc3QuZ2V0U3RhZ2UoMikuY29tcGxldGUoKVxuXG5cdFx0XHQvLyBDcmVkZW50aWFscyBjb25maXJtYXRpb24gKGNsaWNrIG9uIG5leHQpXG5cdFx0XHRhd2FpdCB0aGlzLl9fc2lnbnVwUGFpZFRlc3QuZ2V0U3RhZ2UoMykuY29tcGxldGUoKVxuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZW5kZXJUZXJtc0xhYmVsKCk6IENoaWxkcmVuIHtcblx0cmV0dXJuIGxhbmcuZ2V0KFwidGVybXNBbmRDb25kaXRpb25zX2xhYmVsXCIpXG59XG5cbi8qKlxuICogQHJldHVybiBTaWducyB0aGUgdXNlciB1cCwgaWYgbm8gY2FwdGNoYSBpcyBuZWVkZWQgb3IgaXQgaGFzIGJlZW4gc29sdmVkIGNvcnJlY3RseVxuICovXG5mdW5jdGlvbiBzaWdudXAoXG5cdG1haWxBZGRyZXNzOiBzdHJpbmcsXG5cdHB3OiBzdHJpbmcsXG5cdHJlZ2lzdHJhdGlvbkNvZGU6IHN0cmluZyxcblx0aXNCdXNpbmVzc1VzZTogYm9vbGVhbixcblx0aXNQYWlkU3Vic2NyaXB0aW9uOiBib29sZWFuLFxuXHRjYW1wYWlnbjogc3RyaW5nIHwgbnVsbCxcbik6IFByb21pc2U8TmV3QWNjb3VudERhdGEgfCB2b2lkPiB7XG5cdGNvbnN0IHsgY3VzdG9tZXJGYWNhZGUgfSA9IGxvY2F0b3Jcblx0Y29uc3Qgb3BlcmF0aW9uID0gbG9jYXRvci5vcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIuc3RhcnROZXdPcGVyYXRpb24oKVxuXHRyZXR1cm4gc2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFwiY3JlYXRlQWNjb3VudFJ1bm5pbmdfbXNnXCIsXG5cdFx0Y3VzdG9tZXJGYWNhZGUuZ2VuZXJhdGVTaWdudXBLZXlzKG9wZXJhdGlvbi5pZCkudGhlbigoa2V5UGFpcnMpID0+IHtcblx0XHRcdHJldHVybiBydW5DYXB0Y2hhRmxvdyhtYWlsQWRkcmVzcywgaXNCdXNpbmVzc1VzZSwgaXNQYWlkU3Vic2NyaXB0aW9uLCBjYW1wYWlnbikudGhlbihhc3luYyAocmVnRGF0YUlkKSA9PiB7XG5cdFx0XHRcdGlmIChyZWdEYXRhSWQpIHtcblx0XHRcdFx0XHRjb25zdCBhcHAgPSBjbGllbnQuaXNDYWxlbmRhckFwcCgpID8gU3Vic2NyaXB0aW9uQXBwLkNhbGVuZGFyIDogU3Vic2NyaXB0aW9uQXBwLk1haWxcblx0XHRcdFx0XHRyZXR1cm4gY3VzdG9tZXJGYWNhZGVcblx0XHRcdFx0XHRcdC5zaWdudXAoa2V5UGFpcnMsIEFjY291bnRUeXBlLkZSRUUsIHJlZ0RhdGFJZCwgbWFpbEFkZHJlc3MsIHB3LCByZWdpc3RyYXRpb25Db2RlLCBsYW5nLmNvZGUsIGFwcClcblx0XHRcdFx0XHRcdC50aGVuKChyZWNvdmVyQ29kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdG1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdFx0XHRcdHBhc3N3b3JkOiBwdyxcblx0XHRcdFx0XHRcdFx0XHRyZWNvdmVyQ29kZSxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KSxcblx0XHRvcGVyYXRpb24ucHJvZ3Jlc3MsXG5cdClcblx0XHQuY2F0Y2goXG5cdFx0XHRvZkNsYXNzKEludmFsaWREYXRhRXJyb3IsICgpID0+IHtcblx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJpbnZhbGlkUmVnaXN0cmF0aW9uQ29kZV9tc2dcIilcblx0XHRcdH0pLFxuXHRcdClcblx0XHQuZmluYWxseSgoKSA9PiBvcGVyYXRpb24uZG9uZSgpKVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEgfSBmcm9tIFwiLi9VcGdyYWRlU3Vic2NyaXB0aW9uV2l6YXJkXCJcbmltcG9ydCB0eXBlIHsgV2l6YXJkUGFnZUF0dHJzLCBXaXphcmRQYWdlTiB9IGZyb20gXCIuLi9ndWkvYmFzZS9XaXphcmREaWFsb2cuanNcIlxuaW1wb3J0IHsgZW1pdFdpemFyZEV2ZW50LCBXaXphcmRFdmVudFR5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvV2l6YXJkRGlhbG9nLmpzXCJcbmltcG9ydCB7IFNpZ251cEZvcm0gfSBmcm9tIFwiLi9TaWdudXBGb3JtXCJcbmltcG9ydCB7IGdldERpc3BsYXlOYW1lT2ZQbGFuVHlwZSB9IGZyb20gXCIuL0ZlYXR1cmVMaXN0UHJvdmlkZXJcIlxuaW1wb3J0IHsgUGxhblR5cGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbiwgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5cbmV4cG9ydCBjbGFzcyBTaWdudXBQYWdlIGltcGxlbWVudHMgV2l6YXJkUGFnZU48VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+IHtcblx0cHJpdmF0ZSBkb20hOiBIVE1MRWxlbWVudFxuXG5cdG9uY3JlYXRlKHZub2RlOiBWbm9kZURPTTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+Pikge1xuXHRcdHRoaXMuZG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+Pik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBkYXRhID0gdm5vZGUuYXR0cnMuZGF0YVxuXHRcdGNvbnN0IG5ld0FjY291bnREYXRhID0gZGF0YS5uZXdBY2NvdW50RGF0YVxuXHRcdGxldCBtYWlsQWRkcmVzczogdW5kZWZpbmVkIHwgc3RyaW5nID0gdW5kZWZpbmVkXG5cdFx0aWYgKG5ld0FjY291bnREYXRhKSBtYWlsQWRkcmVzcyA9IG5ld0FjY291bnREYXRhLm1haWxBZGRyZXNzXG5cdFx0cmV0dXJuIG0oU2lnbnVwRm9ybSwge1xuXHRcdFx0b25Db21wbGV0ZTogKG5ld0FjY291bnREYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChuZXdBY2NvdW50RGF0YSkgZGF0YS5uZXdBY2NvdW50RGF0YSA9IG5ld0FjY291bnREYXRhXG5cdFx0XHRcdGVtaXRXaXphcmRFdmVudCh0aGlzLmRvbSwgV2l6YXJkRXZlbnRUeXBlLlNIT1dfTkVYVF9QQUdFKVxuXHRcdFx0fSxcblx0XHRcdG9uQ2hhbmdlUGxhbjogKCkgPT4ge1xuXHRcdFx0XHRlbWl0V2l6YXJkRXZlbnQodGhpcy5kb20sIFdpemFyZEV2ZW50VHlwZS5TSE9XX1BSRVZJT1VTX1BBR0UpXG5cdFx0XHR9LFxuXHRcdFx0aXNCdXNpbmVzc1VzZTogZGF0YS5vcHRpb25zLmJ1c2luZXNzVXNlLFxuXHRcdFx0aXNQYWlkU3Vic2NyaXB0aW9uOiAoKSA9PiBkYXRhLnR5cGUgIT09IFBsYW5UeXBlLkZyZWUsXG5cdFx0XHRjYW1wYWlnbjogKCkgPT4gZGF0YS5yZWdpc3RyYXRpb25EYXRhSWQsXG5cdFx0XHRwcmVmaWxsZWRNYWlsQWRkcmVzczogbWFpbEFkZHJlc3MsXG5cdFx0XHRyZWFkb25seTogISFuZXdBY2NvdW50RGF0YSxcblx0XHR9KVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBTaWdudXBQYWdlQXR0cnMgaW1wbGVtZW50cyBXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+IHtcblx0ZGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGFcblxuXHRjb25zdHJ1Y3RvcihzaWdudXBEYXRhOiBVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YSkge1xuXHRcdHRoaXMuZGF0YSA9IHNpZ251cERhdGFcblx0fVxuXG5cdGhlYWRlclRpdGxlKCk6IFRyYW5zbGF0aW9uIHtcblx0XHRjb25zdCB0aXRsZSA9IGdldERpc3BsYXlOYW1lT2ZQbGFuVHlwZSh0aGlzLmRhdGEudHlwZSlcblxuXHRcdGlmICh0aGlzLmRhdGEudHlwZSA9PT0gUGxhblR5cGUuRXNzZW50aWFsIHx8IHRoaXMuZGF0YS50eXBlID09PSBQbGFuVHlwZS5BZHZhbmNlZCkge1xuXHRcdFx0cmV0dXJuIGxhbmcubWFrZVRyYW5zbGF0aW9uKFwic2lnbnVwX2J1c2luZXNzXCIsIHRpdGxlICsgXCIgQnVzaW5lc3NcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGxhbmcubWFrZVRyYW5zbGF0aW9uKFwic2lnbnVwX3RpdGxlXCIsIHRpdGxlKVxuXHRcdH1cblx0fVxuXG5cdG5leHRBY3Rpb24oc2hvd0Vycm9yRGlhbG9nOiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Ly8gbmV4dCBhY3Rpb24gbm90IGF2YWlsYWJsZSBmb3IgdGhpcyBwYWdlXG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKVxuXHR9XG5cblx0aXNTa2lwQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0aXNFbmFibGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0cnVlXG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5leHBvcnQgY29uc3QgZW51bSBNb2JpbGVQYXltZW50UmVzdWx0VHlwZSB7XG5cdFN1Y2Nlc3MgPSBcIjBcIixcblx0Q2FuY2VsbGVkID0gXCIxXCIsXG5cdFBlbmRpbmcgPSBcIjJcIixcbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBmb3JtYXRQcmljZVdpdGhJbmZvLCBnZXRQYXltZW50TWV0aG9kTmFtZSwgUGF5bWVudEludGVydmFsIH0gZnJvbSBcIi4vUHJpY2VVdGlsc1wiXG5pbXBvcnQgeyBjcmVhdGVTd2l0Y2hBY2NvdW50VHlwZVBvc3RJbiB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEFjY291bnRUeXBlLCBDb25zdCwgUGF5bWVudE1ldGhvZFR5cGUsIFBheW1lbnRNZXRob2RUeXBlVG9OYW1lIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB0eXBlIHsgVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEgfSBmcm9tIFwiLi9VcGdyYWRlU3Vic2NyaXB0aW9uV2l6YXJkXCJcbmltcG9ydCB7IEJhZEdhdGV3YXlFcnJvciwgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgYXBwU3RvcmVQbGFuTmFtZSwgZ2V0UHJlY29uZGl0aW9uRmFpbGVkUGF5bWVudE1zZywgVXBncmFkZVR5cGUgfSBmcm9tIFwiLi9TdWJzY3JpcHRpb25VdGlsc1wiXG5pbXBvcnQgdHlwZSB7IFdpemFyZFBhZ2VBdHRycywgV2l6YXJkUGFnZU4gfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvV2l6YXJkRGlhbG9nLmpzXCJcbmltcG9ydCB7IGVtaXRXaXphcmRFdmVudCwgV2l6YXJkRXZlbnRUeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1dpemFyZERpYWxvZy5qc1wiXG5pbXBvcnQgeyBUZXh0RmllbGQgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IGJhc2U2NEV4dFRvQmFzZTY0LCBiYXNlNjRUb1VpbnQ4QXJyYXksIG5ldmVyTnVsbCwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IFN3aXRjaEFjY291bnRUeXBlU2VydmljZSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1NlcnZpY2VzXCJcbmltcG9ydCB7IFVzYWdlVGVzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXNhZ2V0ZXN0c1wiXG5pbXBvcnQgeyBnZXREaXNwbGF5TmFtZU9mUGxhblR5cGUsIFNlbGVjdGVkU3Vic2NyaXB0aW9uT3B0aW9ucyB9IGZyb20gXCIuL0ZlYXR1cmVMaXN0UHJvdmlkZXJcIlxuaW1wb3J0IHsgTG9naW5CdXR0b24gfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvYnV0dG9ucy9Mb2dpbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBNb2JpbGVQYXltZW50UmVzdWx0VHlwZSB9IGZyb20gXCIuLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVQYXltZW50UmVzdWx0VHlwZVwiXG5pbXBvcnQgeyB1cGRhdGVQYXltZW50RGF0YSB9IGZyb20gXCIuL0ludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VcIlxuaW1wb3J0IHsgU2Vzc2lvblR5cGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9TZXNzaW9uVHlwZVwiXG5pbXBvcnQgeyBNb2JpbGVQYXltZW50RXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9Nb2JpbGVQYXltZW50RXJyb3IuanNcIlxuaW1wb3J0IHsgZ2V0UmF0aW5nQWxsb3dlZCwgUmF0aW5nQ2hlY2tSZXN1bHQgfSBmcm9tIFwiLi4vcmF0aW5ncy9JbkFwcFJhdGluZ1V0aWxzLmpzXCJcbmltcG9ydCB7IHNob3dBcHBSYXRpbmdEaWFsb2cgfSBmcm9tIFwiLi4vcmF0aW5ncy9JbkFwcFJhdGluZ0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBkZXZpY2VDb25maWcgfSBmcm9tIFwiLi4vbWlzYy9EZXZpY2VDb25maWcuanNcIlxuaW1wb3J0IHsgaXNJT1NBcHAgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgU3Vic2NyaXB0aW9uQXBwIH0gZnJvbSBcIi4vU3Vic2NyaXB0aW9uVmlld2VyLmpzXCJcblxuZXhwb3J0IGNsYXNzIFVwZ3JhZGVDb25maXJtU3Vic2NyaXB0aW9uUGFnZSBpbXBsZW1lbnRzIFdpemFyZFBhZ2VOPFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhPiB7XG5cdHByaXZhdGUgZG9tITogSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBfX3NpZ251cFBhaWRUZXN0PzogVXNhZ2VUZXN0XG5cdHByaXZhdGUgX19zaWdudXBGcmVlVGVzdD86IFVzYWdlVGVzdFxuXG5cdG9uY3JlYXRlKHZub2RlOiBWbm9kZURPTTxXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+Pikge1xuXHRcdHRoaXMuX19zaWdudXBQYWlkVGVzdCA9IGxvY2F0b3IudXNhZ2VUZXN0Q29udHJvbGxlci5nZXRUZXN0KFwic2lnbnVwLnBhaWRcIilcblx0XHR0aGlzLl9fc2lnbnVwRnJlZVRlc3QgPSBsb2NhdG9yLnVzYWdlVGVzdENvbnRyb2xsZXIuZ2V0VGVzdChcInNpZ251cC5mcmVlXCIpXG5cblx0XHR0aGlzLmRvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHR9XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPFdpemFyZFBhZ2VBdHRyczxVcGdyYWRlU3Vic2NyaXB0aW9uRGF0YT4+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiB0aGlzLnJlbmRlckNvbmZpcm1TdWJzY3JpcHRpb24oYXR0cnMpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZ3JhZGUoZGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEpIHtcblx0XHQvLyBXZSByZXR1cm4gZWFybHkgYmVjYXVzZSB3ZSBkbyB0aGUgdXBncmFkZSBhZnRlciB0aGUgdXNlciBoYXMgc3VibWl0dGVkIHBheW1lbnQgd2hpY2ggaXMgb24gdGhlIGNvbmZpcm1hdGlvbiBwYWdlXG5cdFx0aWYgKGRhdGEucGF5bWVudERhdGEucGF5bWVudE1ldGhvZCA9PT0gUGF5bWVudE1ldGhvZFR5cGUuQXBwU3RvcmUpIHtcblx0XHRcdGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0aGlzLmhhbmRsZUFwcFN0b3JlUGF5bWVudChkYXRhKVxuXHRcdFx0aWYgKCFzdWNjZXNzKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHNlcnZpY2VEYXRhID0gY3JlYXRlU3dpdGNoQWNjb3VudFR5cGVQb3N0SW4oe1xuXHRcdFx0YWNjb3VudFR5cGU6IEFjY291bnRUeXBlLlBBSUQsXG5cdFx0XHRjdXN0b21lcjogbnVsbCxcblx0XHRcdHBsYW46IGRhdGEudHlwZSxcblx0XHRcdGRhdGU6IENvbnN0LkNVUlJFTlRfREFURSxcblx0XHRcdHJlZmVycmFsQ29kZTogZGF0YS5yZWZlcnJhbENvZGUsXG5cdFx0XHRzcGVjaWFsUHJpY2VVc2VyU2luZ2xlOiBudWxsLFxuXHRcdFx0c3VydmV5RGF0YTogbnVsbCxcblx0XHRcdGFwcDogY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSA/IFN1YnNjcmlwdGlvbkFwcC5DYWxlbmRhciA6IFN1YnNjcmlwdGlvbkFwcC5NYWlsLFxuXHRcdH0pXG5cdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IucG9zdChTd2l0Y2hBY2NvdW50VHlwZVNlcnZpY2UsIHNlcnZpY2VEYXRhKS50aGVuKCgpID0+IHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuY3VzdG9tZXJGYWNhZGUuc3dpdGNoRnJlZVRvUHJlbWl1bUdyb3VwKClcblx0XHRcdH0pLFxuXHRcdClcblx0XHRcdC50aGVuKCgpID0+IHtcblx0XHRcdFx0Ly8gT3JkZXIgY29uZmlybWF0aW9uIChjbGljayBvbiBCdXkpLCBzZW5kIHNlbGVjdGVkIHBheW1lbnQgbWV0aG9kIGFzIGFuIGVudW1cblx0XHRcdFx0Y29uc3Qgb3JkZXJDb25maXJtYXRpb25TdGFnZSA9IHRoaXMuX19zaWdudXBQYWlkVGVzdD8uZ2V0U3RhZ2UoNSlcblx0XHRcdFx0b3JkZXJDb25maXJtYXRpb25TdGFnZT8uc2V0TWV0cmljKHtcblx0XHRcdFx0XHRuYW1lOiBcInBheW1lbnRNZXRob2RcIixcblx0XHRcdFx0XHR2YWx1ZTogUGF5bWVudE1ldGhvZFR5cGVUb05hbWVbZGF0YS5wYXltZW50RGF0YS5wYXltZW50TWV0aG9kXSxcblx0XHRcdFx0fSlcblx0XHRcdFx0b3JkZXJDb25maXJtYXRpb25TdGFnZT8uc2V0TWV0cmljKHtcblx0XHRcdFx0XHRuYW1lOiBcInN3aXRjaGVkRnJvbUZyZWVcIixcblx0XHRcdFx0XHR2YWx1ZTogKHRoaXMuX19zaWdudXBGcmVlVGVzdD8uaXNTdGFydGVkKCkgPz8gZmFsc2UpLnRvU3RyaW5nKCksXG5cdFx0XHRcdH0pXG5cdFx0XHRcdG9yZGVyQ29uZmlybWF0aW9uU3RhZ2U/LmNvbXBsZXRlKClcblxuXHRcdFx0XHRyZXR1cm4gdGhpcy5jbG9zZShkYXRhLCB0aGlzLmRvbSlcblx0XHRcdH0pXG5cdFx0XHQudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHJhdGluZ0NoZWNrUmVzdWx0ID0gYXdhaXQgZ2V0UmF0aW5nQWxsb3dlZChuZXcgRGF0ZSgpLCBkZXZpY2VDb25maWcsIGlzSU9TQXBwKCkpXG5cdFx0XHRcdGlmIChyYXRpbmdDaGVja1Jlc3VsdCA9PT0gUmF0aW5nQ2hlY2tSZXN1bHQuUkFUSU5HX0FMTE9XRUQpIHtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdHZvaWQgc2hvd0FwcFJhdGluZ0RpYWxvZygpXG5cdFx0XHRcdFx0fSwgMjAwMClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhQcmVjb25kaXRpb25GYWlsZWRFcnJvciwgKGUpID0+IHtcblx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcblx0XHRcdFx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcdFx0XHRcInByZWNvbmRpdGlvbl9mYWlsZWRcIixcblx0XHRcdFx0XHRcdFx0bGFuZy5nZXQoZ2V0UHJlY29uZGl0aW9uRmFpbGVkUGF5bWVudE1zZyhlLmRhdGEpKSArXG5cdFx0XHRcdFx0XHRcdFx0KGRhdGEudXBncmFkZVR5cGUgPT09IFVwZ3JhZGVUeXBlLlNpZ251cCA/IFwiIFwiICsgbGFuZy5nZXQoXCJhY2NvdW50V2FzU3RpbGxDcmVhdGVkX21zZ1wiKSA6IFwiXCIpLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKEJhZEdhdGV3YXlFcnJvciwgKGUpID0+IHtcblx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcblx0XHRcdFx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcdFx0XHRcInBheW1lbnRfZmFpbGVkXCIsXG5cdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwicGF5bWVudFByb3ZpZGVyTm90QXZhaWxhYmxlRXJyb3JfbXNnXCIpICtcblx0XHRcdFx0XHRcdFx0XHQoZGF0YS51cGdyYWRlVHlwZSA9PT0gVXBncmFkZVR5cGUuU2lnbnVwID8gXCIgXCIgKyBsYW5nLmdldChcImFjY291bnRXYXNTdGlsbENyZWF0ZWRfbXNnXCIpIDogXCJcIiksXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdH1cblxuXHQvKiogQHJldHVybiB3aGV0aGVyIHN1YnNjcmliZWQgc3VjY2Vzc2Z1bGx5ICovXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlQXBwU3RvcmVQYXltZW50KGRhdGE6IFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0aWYgKCFsb2NhdG9yLmxvZ2lucy5pc1VzZXJMb2dnZWRJbigpKSB7XG5cdFx0XHRhd2FpdCBsb2NhdG9yLmxvZ2lucy5jcmVhdGVTZXNzaW9uKG5ldmVyTnVsbChkYXRhLm5ld0FjY291bnREYXRhKS5tYWlsQWRkcmVzcywgbmV2ZXJOdWxsKGRhdGEubmV3QWNjb3VudERhdGEpLnBhc3N3b3JkLCBTZXNzaW9uVHlwZS5UZW1wb3JhcnkpXG5cdFx0fVxuXG5cdFx0Y29uc3QgY3VzdG9tZXJJZCA9IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5jdXN0b21lciFcblx0XHRjb25zdCBjdXN0b21lcklkQnl0ZXMgPSBiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0RXh0VG9CYXNlNjQoY3VzdG9tZXJJZCkpXG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgc2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XHRcInBsZWFzZVdhaXRfbXNnXCIsXG5cdFx0XHRcdGxvY2F0b3IubW9iaWxlUGF5bWVudHNGYWNhZGUucmVxdWVzdFN1YnNjcmlwdGlvblRvUGxhbihhcHBTdG9yZVBsYW5OYW1lKGRhdGEudHlwZSksIGRhdGEub3B0aW9ucy5wYXltZW50SW50ZXJ2YWwoKSwgY3VzdG9tZXJJZEJ5dGVzKSxcblx0XHRcdClcblx0XHRcdGlmIChyZXN1bHQucmVzdWx0ICE9PSBNb2JpbGVQYXltZW50UmVzdWx0VHlwZS5TdWNjZXNzKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTW9iaWxlUGF5bWVudEVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJBcHBTdG9yZSBzdWJzY3JpcHRpb24gZmFpbGVkXCIsIGUpXG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwiYXBwU3RvcmVTdWJzY3JpcHRpb25FcnJvcl9tc2dcIiwgZS5tZXNzYWdlKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gYXdhaXQgdXBkYXRlUGF5bWVudERhdGEoXG5cdFx0XHRkYXRhLm9wdGlvbnMucGF5bWVudEludGVydmFsKCksXG5cdFx0XHRkYXRhLmludm9pY2VEYXRhLFxuXHRcdFx0ZGF0YS5wYXltZW50RGF0YSxcblx0XHRcdG51bGwsXG5cdFx0XHRkYXRhLm5ld0FjY291bnREYXRhICE9IG51bGwsXG5cdFx0XHRudWxsLFxuXHRcdFx0ZGF0YS5hY2NvdW50aW5nSW5mbyEsXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDb25maXJtU3Vic2NyaXB0aW9uKGF0dHJzOiBXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+KSB7XG5cdFx0Y29uc3QgaXNZZWFybHkgPSBhdHRycy5kYXRhLm9wdGlvbnMucGF5bWVudEludGVydmFsKCkgPT09IFBheW1lbnRJbnRlcnZhbC5ZZWFybHlcblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBpc1llYXJseSA/IGxhbmcuZ2V0KFwicHJpY2luZy55ZWFybHlfbGFiZWxcIikgOiBsYW5nLmdldChcInByaWNpbmcubW9udGhseV9sYWJlbFwiKVxuXG5cdFx0cmV0dXJuIFtcblx0XHRcdG0oXCIuY2VudGVyLmg0LnB0XCIsIGxhbmcuZ2V0KFwidXBncmFkZUNvbmZpcm1fbXNnXCIpKSxcblx0XHRcdG0oXCIucHQucGIucGxyLWxcIiwgW1xuXHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBcInN1YnNjcmlwdGlvbl9sYWJlbFwiLFxuXHRcdFx0XHRcdHZhbHVlOiBnZXREaXNwbGF5TmFtZU9mUGxhblR5cGUoYXR0cnMuZGF0YS50eXBlKSxcblx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRsYWJlbDogXCJwYXltZW50SW50ZXJ2YWxfbGFiZWxcIixcblx0XHRcdFx0XHR2YWx1ZTogc3Vic2NyaXB0aW9uLFxuXHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBpc1llYXJseSAmJiBhdHRycy5kYXRhLm5leHRZZWFyUHJpY2UgPyBcInByaWNlRmlyc3RZZWFyX2xhYmVsXCIgOiBcInByaWNlX2xhYmVsXCIsXG5cdFx0XHRcdFx0dmFsdWU6IGJ1aWxkUHJpY2VTdHJpbmcoYXR0cnMuZGF0YS5wcmljZT8uZGlzcGxheVByaWNlID8/IFwiMFwiLCBhdHRycy5kYXRhLm9wdGlvbnMpLFxuXHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHR0aGlzLnJlbmRlclByaWNlTmV4dFllYXIoYXR0cnMpLFxuXHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBcInBheW1lbnRNZXRob2RfbGFiZWxcIixcblx0XHRcdFx0XHR2YWx1ZTogZ2V0UGF5bWVudE1ldGhvZE5hbWUoYXR0cnMuZGF0YS5wYXltZW50RGF0YS5wYXltZW50TWV0aG9kKSxcblx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHR9KSxcblx0XHRcdF0pLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuc21hbGxlci5jZW50ZXIucHQtbFwiLFxuXHRcdFx0XHRhdHRycy5kYXRhLm9wdGlvbnMuYnVzaW5lc3NVc2UoKVxuXHRcdFx0XHRcdD8gbGFuZy5nZXQoXCJwcmljaW5nLnN1YnNjcmlwdGlvblBlcmlvZEluZm9CdXNpbmVzc19tc2dcIilcblx0XHRcdFx0XHQ6IGxhbmcuZ2V0KFwicHJpY2luZy5zdWJzY3JpcHRpb25QZXJpb2RJbmZvUHJpdmF0ZV9tc2dcIiksXG5cdFx0XHQpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1jZW50ZXIuZnVsbC13aWR0aC5wdC1sXCIsXG5cdFx0XHRcdG0oTG9naW5CdXR0b24sIHtcblx0XHRcdFx0XHRsYWJlbDogXCJidXlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xhc3M6IFwic21hbGwtbG9naW4tYnV0dG9uXCIsXG5cdFx0XHRcdFx0b25jbGljazogKCkgPT4gdGhpcy51cGdyYWRlKGF0dHJzLmRhdGEpLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQcmljZU5leHRZZWFyKGF0dHJzOiBXaXphcmRQYWdlQXR0cnM8VXBncmFkZVN1YnNjcmlwdGlvbkRhdGE+KSB7XG5cdFx0cmV0dXJuIGF0dHJzLmRhdGEubmV4dFllYXJQcmljZVxuXHRcdFx0PyBtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBcInByaWNlRm9yTmV4dFllYXJfbGFiZWxcIixcblx0XHRcdFx0XHR2YWx1ZTogYnVpbGRQcmljZVN0cmluZyhhdHRycy5kYXRhLm5leHRZZWFyUHJpY2UuZGlzcGxheVByaWNlLCBhdHRycy5kYXRhLm9wdGlvbnMpLFxuXHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHQgIH0pXG5cdFx0XHQ6IG51bGxcblx0fVxuXG5cdHByaXZhdGUgY2xvc2UoZGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEsIGRvbTogSFRNTEVsZW1lbnQpIHtcblx0XHRlbWl0V2l6YXJkRXZlbnQoZG9tLCBXaXphcmRFdmVudFR5cGUuU0hPV19ORVhUX1BBR0UpXG5cdH1cbn1cblxuZnVuY3Rpb24gYnVpbGRQcmljZVN0cmluZyhwcmljZTogc3RyaW5nLCBvcHRpb25zOiBTZWxlY3RlZFN1YnNjcmlwdGlvbk9wdGlvbnMpOiBzdHJpbmcge1xuXHRyZXR1cm4gZm9ybWF0UHJpY2VXaXRoSW5mbyhwcmljZSwgb3B0aW9ucy5wYXltZW50SW50ZXJ2YWwoKSwgIW9wdGlvbnMuYnVzaW5lc3NVc2UoKSlcbn1cbiIsImltcG9ydCB0eXBlIHsgSGV4IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBkZWZlciB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQWNjb3VudGluZ0luZm8sIEN1c3RvbWVyIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHtcblx0QXZhaWxhYmxlUGxhbnMsXG5cdEF2YWlsYWJsZVBsYW5UeXBlLFxuXHRnZXREZWZhdWx0UGF5bWVudE1ldGhvZCxcblx0Z2V0UGF5bWVudE1ldGhvZFR5cGUsXG5cdEludm9pY2VEYXRhLFxuXHROZXdQYWlkUGxhbnMsXG5cdFBheW1lbnREYXRhLFxuXHRQbGFuVHlwZSxcbn0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgZ2V0QnlBYmJyZXZpYXRpb24gfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9Db3VudHJ5TGlzdFwiXG5pbXBvcnQgeyBVcGdyYWRlU3Vic2NyaXB0aW9uUGFnZSwgVXBncmFkZVN1YnNjcmlwdGlvblBhZ2VBdHRycyB9IGZyb20gXCIuL1VwZ3JhZGVTdWJzY3JpcHRpb25QYWdlXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IEluZm9MaW5rLCBsYW5nLCBUcmFuc2xhdGlvbktleSwgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGNyZWF0ZVdpemFyZERpYWxvZywgd2l6YXJkUGFnZVdyYXBwZXIgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvV2l6YXJkRGlhbG9nLmpzXCJcbmltcG9ydCB7IEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2UsIEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VBdHRycyB9IGZyb20gXCIuL0ludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VcIlxuaW1wb3J0IHsgVXBncmFkZUNvbmdyYXR1bGF0aW9uc1BhZ2UsIFVwZ3JhZGVDb25ncmF0dWxhdGlvbnNQYWdlQXR0cnMgfSBmcm9tIFwiLi9VcGdyYWRlQ29uZ3JhdHVsYXRpb25zUGFnZS5qc1wiXG5pbXBvcnQgeyBTaWdudXBQYWdlLCBTaWdudXBQYWdlQXR0cnMgfSBmcm9tIFwiLi9TaWdudXBQYWdlXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUsIGlzSU9TQXBwIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBTdG9yYWdlQmVoYXZpb3IgfSBmcm9tIFwiLi4vbWlzYy9Vc2FnZVRlc3RNb2RlbFwiXG5pbXBvcnQgeyBGZWF0dXJlTGlzdFByb3ZpZGVyLCBTZWxlY3RlZFN1YnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi9GZWF0dXJlTGlzdFByb3ZpZGVyXCJcbmltcG9ydCB7IHF1ZXJ5QXBwU3RvcmVTdWJzY3JpcHRpb25Pd25lcnNoaXAsIFVwZ3JhZGVUeXBlIH0gZnJvbSBcIi4vU3Vic2NyaXB0aW9uVXRpbHNcIlxuaW1wb3J0IHsgVXBncmFkZUNvbmZpcm1TdWJzY3JpcHRpb25QYWdlIH0gZnJvbSBcIi4vVXBncmFkZUNvbmZpcm1TdWJzY3JpcHRpb25QYWdlLmpzXCJcbmltcG9ydCB7IGFzUGF5bWVudEludGVydmFsLCBQYXltZW50SW50ZXJ2YWwsIFByaWNlQW5kQ29uZmlnUHJvdmlkZXIsIFN1YnNjcmlwdGlvblByaWNlIH0gZnJvbSBcIi4vUHJpY2VVdGlsc1wiXG5pbXBvcnQgeyBmb3JtYXROYW1lQW5kQWRkcmVzcyB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkZvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IE1vYmlsZVBheW1lbnRTdWJzY3JpcHRpb25Pd25lcnNoaXAgfSBmcm9tIFwiLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlUGF5bWVudFN1YnNjcmlwdGlvbk93bmVyc2hpcC5qc1wiXG5pbXBvcnQgeyBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuZXhwb3J0IHR5cGUgU3Vic2NyaXB0aW9uUGFyYW1ldGVycyA9IHtcblx0c3Vic2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsXG5cdHR5cGU6IHN0cmluZyB8IG51bGxcblx0aW50ZXJ2YWw6IHN0cmluZyB8IG51bGwgLy8gdHlwZWQgYXMgc3RyaW5nIGJlY2F1c2UgbS5wYXJzZVF1ZXJ5U3RyaW5nIHJldHVybnMgYW4gb2JqZWN0IHdpdGggc3RyaW5nc1xufVxuXG5leHBvcnQgdHlwZSBOZXdBY2NvdW50RGF0YSA9IHtcblx0bWFpbEFkZHJlc3M6IHN0cmluZ1xuXHRyZWNvdmVyQ29kZTogSGV4XG5cdHBhc3N3b3JkOiBzdHJpbmdcbn1cbmV4cG9ydCB0eXBlIFVwZ3JhZGVTdWJzY3JpcHRpb25EYXRhID0ge1xuXHRvcHRpb25zOiBTZWxlY3RlZFN1YnNjcmlwdGlvbk9wdGlvbnNcblx0aW52b2ljZURhdGE6IEludm9pY2VEYXRhXG5cdHBheW1lbnREYXRhOiBQYXltZW50RGF0YVxuXHR0eXBlOiBQbGFuVHlwZVxuXHRwcmljZTogU3Vic2NyaXB0aW9uUHJpY2UgfCBudWxsXG5cdG5leHRZZWFyUHJpY2U6IFN1YnNjcmlwdGlvblByaWNlIHwgbnVsbFxuXHRhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8gfCBudWxsXG5cdC8vIG5vdCBpbml0aWFsbHkgc2V0IGZvciBzaWdudXAgYnV0IGxvYWRlZCBpbiBJbnZvaWNlQW5kUGF5bWVudERhdGFQYWdlXG5cdGN1c3RvbWVyOiBDdXN0b21lciB8IG51bGxcblx0Ly8gbm90IGluaXRpYWxseSBzZXQgZm9yIHNpZ251cCBidXQgbG9hZGVkIGluIEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2Vcblx0bmV3QWNjb3VudERhdGE6IE5ld0FjY291bnREYXRhIHwgbnVsbFxuXHRyZWdpc3RyYXRpb25EYXRhSWQ6IHN0cmluZyB8IG51bGxcblx0cHJpY2VJbmZvVGV4dElkOiBUcmFuc2xhdGlvbktleSB8IG51bGxcblx0dXBncmFkZVR5cGU6IFVwZ3JhZGVUeXBlXG5cdHBsYW5QcmljZXM6IFByaWNlQW5kQ29uZmlnUHJvdmlkZXJcblx0Y3VycmVudFBsYW46IFBsYW5UeXBlIHwgbnVsbFxuXHRzdWJzY3JpcHRpb25QYXJhbWV0ZXJzOiBTdWJzY3JpcHRpb25QYXJhbWV0ZXJzIHwgbnVsbFxuXHRmZWF0dXJlTGlzdFByb3ZpZGVyOiBGZWF0dXJlTGlzdFByb3ZpZGVyXG5cdHJlZmVycmFsQ29kZTogc3RyaW5nIHwgbnVsbFxuXHRtdWx0aXBsZVVzZXJzQWxsb3dlZDogYm9vbGVhblxuXHRhY2NlcHRlZFBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdXG5cdG1zZzogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dVcGdyYWRlV2l6YXJkKGxvZ2luczogTG9naW5Db250cm9sbGVyLCBhY2NlcHRlZFBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdID0gTmV3UGFpZFBsYW5zLCBtc2c/OiBNYXliZVRyYW5zbGF0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG5cdGNvbnN0IFtjdXN0b21lciwgYWNjb3VudGluZ0luZm9dID0gYXdhaXQgUHJvbWlzZS5hbGwoW2xvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmxvYWRDdXN0b21lcigpLCBsb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQWNjb3VudGluZ0luZm8oKV0pXG5cblx0Y29uc3QgcHJpY2VEYXRhUHJvdmlkZXIgPSBhd2FpdCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyLmdldEluaXRpYWxpemVkSW5zdGFuY2UobnVsbCwgbG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsIG51bGwpXG5cblx0Y29uc3QgcHJpY2VzID0gcHJpY2VEYXRhUHJvdmlkZXIuZ2V0UmF3UHJpY2luZ0RhdGEoKVxuXHRjb25zdCBkb21haW5Db25maWcgPSBsb2NhdG9yLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpXG5cdGNvbnN0IGZlYXR1cmVMaXN0UHJvdmlkZXIgPSBhd2FpdCBGZWF0dXJlTGlzdFByb3ZpZGVyLmdldEluaXRpYWxpemVkSW5zdGFuY2UoZG9tYWluQ29uZmlnKVxuXHRjb25zdCB1cGdyYWRlRGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0b3B0aW9uczoge1xuXHRcdFx0YnVzaW5lc3NVc2U6IHN0cmVhbShwcmljZXMuYnVzaW5lc3MpLFxuXHRcdFx0cGF5bWVudEludGVydmFsOiBzdHJlYW0oYXNQYXltZW50SW50ZXJ2YWwoYWNjb3VudGluZ0luZm8ucGF5bWVudEludGVydmFsKSksXG5cdFx0fSxcblx0XHRpbnZvaWNlRGF0YToge1xuXHRcdFx0aW52b2ljZUFkZHJlc3M6IGZvcm1hdE5hbWVBbmRBZGRyZXNzKGFjY291bnRpbmdJbmZvLmludm9pY2VOYW1lLCBhY2NvdW50aW5nSW5mby5pbnZvaWNlQWRkcmVzcyksXG5cdFx0XHRjb3VudHJ5OiBhY2NvdW50aW5nSW5mby5pbnZvaWNlQ291bnRyeSA/IGdldEJ5QWJicmV2aWF0aW9uKGFjY291bnRpbmdJbmZvLmludm9pY2VDb3VudHJ5KSA6IG51bGwsXG5cdFx0XHR2YXROdW1iZXI6IGFjY291bnRpbmdJbmZvLmludm9pY2VWYXRJZE5vLCAvLyBvbmx5IGZvciBFVSBjb3VudHJpZXMgb3RoZXJ3aXNlIGVtcHR5XG5cdFx0fSxcblx0XHRwYXltZW50RGF0YToge1xuXHRcdFx0cGF5bWVudE1ldGhvZDogZ2V0UGF5bWVudE1ldGhvZFR5cGUoYWNjb3VudGluZ0luZm8pIHx8IChhd2FpdCBnZXREZWZhdWx0UGF5bWVudE1ldGhvZCgpKSxcblx0XHRcdGNyZWRpdENhcmREYXRhOiBudWxsLFxuXHRcdH0sXG5cdFx0cHJpY2U6IG51bGwsXG5cdFx0dHlwZTogUGxhblR5cGUuUmV2b2x1dGlvbmFyeSxcblx0XHRuZXh0WWVhclByaWNlOiBudWxsLFxuXHRcdGFjY291bnRpbmdJbmZvOiBhY2NvdW50aW5nSW5mbyxcblx0XHRjdXN0b21lcjogY3VzdG9tZXIsXG5cdFx0bmV3QWNjb3VudERhdGE6IG51bGwsXG5cdFx0cmVnaXN0cmF0aW9uRGF0YUlkOiBudWxsLFxuXHRcdHByaWNlSW5mb1RleHRJZDogcHJpY2VEYXRhUHJvdmlkZXIuZ2V0UHJpY2VJbmZvTWVzc2FnZSgpLFxuXHRcdHVwZ3JhZGVUeXBlOiBVcGdyYWRlVHlwZS5Jbml0aWFsLFxuXHRcdC8vIEZyZWUgdXNlZCB0byBiZSBhbHdheXMgc2VsZWN0ZWQgaGVyZSBmb3IgY3VycmVudCBwbGFuLCBidXQgcmVzdWx0ZWQgaW4gaXQgZGlzcGxheWluZyBcImZyZWVcIiBhcyBjdXJyZW50IHBsYW4gZm9yIGxlZ2FjeSB1c2Vyc1xuXHRcdGN1cnJlbnRQbGFuOiBsb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ZyZWVBY2NvdW50KCkgPyBQbGFuVHlwZS5GcmVlIDogbnVsbCxcblx0XHRzdWJzY3JpcHRpb25QYXJhbWV0ZXJzOiBudWxsLFxuXHRcdHBsYW5QcmljZXM6IHByaWNlRGF0YVByb3ZpZGVyLFxuXHRcdGZlYXR1cmVMaXN0UHJvdmlkZXI6IGZlYXR1cmVMaXN0UHJvdmlkZXIsXG5cdFx0cmVmZXJyYWxDb2RlOiBudWxsLFxuXHRcdG11bHRpcGxlVXNlcnNBbGxvd2VkOiBmYWxzZSxcblx0XHRhY2NlcHRlZFBsYW5zLFxuXHRcdG1zZzogbXNnICE9IG51bGwgPyBtc2cgOiBudWxsLFxuXHR9XG5cblx0Y29uc3Qgd2l6YXJkUGFnZXMgPSBbXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoVXBncmFkZVN1YnNjcmlwdGlvblBhZ2UsIG5ldyBVcGdyYWRlU3Vic2NyaXB0aW9uUGFnZUF0dHJzKHVwZ3JhZGVEYXRhKSksXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoSW52b2ljZUFuZFBheW1lbnREYXRhUGFnZSwgbmV3IEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VBdHRycyh1cGdyYWRlRGF0YSkpLFxuXHRcdHdpemFyZFBhZ2VXcmFwcGVyKFVwZ3JhZGVDb25maXJtU3Vic2NyaXB0aW9uUGFnZSwgbmV3IEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VBdHRycyh1cGdyYWRlRGF0YSkpLFxuXHRdXG5cdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0d2l6YXJkUGFnZXMuc3BsaWNlKDEsIDEpIC8vIGRvIG5vdCBzaG93IHRoaXMgcGFnZSBvbiBBcHBTdG9yZSBwYXltZW50IHNpbmNlIHdlIGFyZSBvbmx5IGFibGUgdG8gc2hvdyB0aGlzIHNpbmdsZSBwYXltZW50IG1ldGhvZCBvbiBpT1Ncblx0fVxuXG5cdGNvbnN0IGRlZmVycmVkID0gZGVmZXI8dm9pZD4oKVxuXHRjb25zdCB3aXphcmRCdWlsZGVyID0gY3JlYXRlV2l6YXJkRGlhbG9nKFxuXHRcdHVwZ3JhZGVEYXRhLFxuXHRcdHdpemFyZFBhZ2VzLFxuXHRcdGFzeW5jICgpID0+IHtcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoKVxuXHRcdH0sXG5cdFx0RGlhbG9nVHlwZS5FZGl0TGFyZ2UsXG5cdClcblx0d2l6YXJkQnVpbGRlci5kaWFsb2cuc2hvdygpXG5cdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkU2lnbnVwV2l6YXJkKFxuXHRzdWJzY3JpcHRpb25QYXJhbWV0ZXJzOiBTdWJzY3JpcHRpb25QYXJhbWV0ZXJzIHwgbnVsbCxcblx0cmVnaXN0cmF0aW9uRGF0YUlkOiBzdHJpbmcgfCBudWxsLFxuXHRyZWZlcnJhbENvZGU6IHN0cmluZyB8IG51bGwsXG5cdGFjY2VwdGVkUGxhbnM6IEF2YWlsYWJsZVBsYW5UeXBlW10gPSBBdmFpbGFibGVQbGFucyxcbik6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCB1c2FnZVRlc3RNb2RlbCA9IGxvY2F0b3IudXNhZ2VUZXN0TW9kZWxcblxuXHR1c2FnZVRlc3RNb2RlbC5zZXRTdG9yYWdlQmVoYXZpb3IoU3RvcmFnZUJlaGF2aW9yLkVwaGVtZXJhbClcblx0bG9jYXRvci51c2FnZVRlc3RDb250cm9sbGVyLnNldFRlc3RzKGF3YWl0IHVzYWdlVGVzdE1vZGVsLmxvYWRBY3RpdmVVc2FnZVRlc3RzKCkpXG5cblx0Y29uc3QgcHJpY2VEYXRhUHJvdmlkZXIgPSBhd2FpdCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyLmdldEluaXRpYWxpemVkSW5zdGFuY2UocmVnaXN0cmF0aW9uRGF0YUlkLCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvciwgcmVmZXJyYWxDb2RlKVxuXHRjb25zdCBwcmljZXMgPSBwcmljZURhdGFQcm92aWRlci5nZXRSYXdQcmljaW5nRGF0YSgpXG5cdGNvbnN0IGRvbWFpbkNvbmZpZyA9IGxvY2F0b3IuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXRDdXJyZW50RG9tYWluQ29uZmlnKClcblx0Y29uc3QgZmVhdHVyZUxpc3RQcm92aWRlciA9IGF3YWl0IEZlYXR1cmVMaXN0UHJvdmlkZXIuZ2V0SW5pdGlhbGl6ZWRJbnN0YW5jZShkb21haW5Db25maWcpXG5cblx0bGV0IG1lc3NhZ2U6IE1heWJlVHJhbnNsYXRpb24gfCBudWxsXG5cdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0Y29uc3QgYXBwc3RvcmVTdWJzY3JpcHRpb25Pd25lcnNoaXAgPSBhd2FpdCBxdWVyeUFwcFN0b3JlU3Vic2NyaXB0aW9uT3duZXJzaGlwKG51bGwpXG5cdFx0Ly8gaWYgd2UgYXJlIG9uIGlPUyBhcHAgd2Ugb25seSBzaG93IG90aGVyIHBsYW5zIGlmIEFwcFN0b3JlIHBheW1lbnRzIGFyZSBlbmFibGVkIGFuZCB0aGVyZSdzIG5vIHN1YnNjcmlwdGlvbiBmb3IgdGhpcyBBcHBsZSBJRC5cblx0XHRpZiAoYXBwc3RvcmVTdWJzY3JpcHRpb25Pd25lcnNoaXAgIT09IE1vYmlsZVBheW1lbnRTdWJzY3JpcHRpb25Pd25lcnNoaXAuTm9TdWJzY3JpcHRpb24pIHtcblx0XHRcdGFjY2VwdGVkUGxhbnMgPSBhY2NlcHRlZFBsYW5zLmZpbHRlcigocGxhbikgPT4gcGxhbiA9PT0gUGxhblR5cGUuRnJlZSlcblx0XHR9XG5cdFx0bWVzc2FnZSA9XG5cdFx0XHRhcHBzdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcCAhPSBNb2JpbGVQYXltZW50U3Vic2NyaXB0aW9uT3duZXJzaGlwLk5vU3Vic2NyaXB0aW9uXG5cdFx0XHRcdD8gbGFuZy5nZXRUcmFuc2xhdGlvbihcInN0b3JlTXVsdGlTdWJzY3JpcHRpb25FcnJvcl9tc2dcIiwgeyBcIntBcHBTdG9yZVBheW1lbnR9XCI6IEluZm9MaW5rLkFwcFN0b3JlUGF5bWVudCB9KVxuXHRcdFx0XHQ6IG51bGxcblx0fSBlbHNlIHtcblx0XHRtZXNzYWdlID0gbnVsbFxuXHR9XG5cblx0Y29uc3Qgc2lnbnVwRGF0YTogVXBncmFkZVN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0b3B0aW9uczoge1xuXHRcdFx0YnVzaW5lc3NVc2U6IHN0cmVhbShwcmljZXMuYnVzaW5lc3MpLFxuXHRcdFx0cGF5bWVudEludGVydmFsOiBzdHJlYW0oUGF5bWVudEludGVydmFsLlllYXJseSksXG5cdFx0fSxcblx0XHRpbnZvaWNlRGF0YToge1xuXHRcdFx0aW52b2ljZUFkZHJlc3M6IFwiXCIsXG5cdFx0XHRjb3VudHJ5OiBudWxsLFxuXHRcdFx0dmF0TnVtYmVyOiBcIlwiLCAvLyBvbmx5IGZvciBFVSBjb3VudHJpZXMgb3RoZXJ3aXNlIGVtcHR5XG5cdFx0fSxcblx0XHRwYXltZW50RGF0YToge1xuXHRcdFx0cGF5bWVudE1ldGhvZDogYXdhaXQgZ2V0RGVmYXVsdFBheW1lbnRNZXRob2QoKSxcblx0XHRcdGNyZWRpdENhcmREYXRhOiBudWxsLFxuXHRcdH0sXG5cdFx0cHJpY2U6IG51bGwsXG5cdFx0bmV4dFllYXJQcmljZTogbnVsbCxcblx0XHR0eXBlOiBQbGFuVHlwZS5GcmVlLFxuXHRcdGFjY291bnRpbmdJbmZvOiBudWxsLFxuXHRcdGN1c3RvbWVyOiBudWxsLFxuXHRcdG5ld0FjY291bnREYXRhOiBudWxsLFxuXHRcdHJlZ2lzdHJhdGlvbkRhdGFJZCxcblx0XHRwcmljZUluZm9UZXh0SWQ6IHByaWNlRGF0YVByb3ZpZGVyLmdldFByaWNlSW5mb01lc3NhZ2UoKSxcblx0XHR1cGdyYWRlVHlwZTogVXBncmFkZVR5cGUuU2lnbnVwLFxuXHRcdHBsYW5QcmljZXM6IHByaWNlRGF0YVByb3ZpZGVyLFxuXHRcdGN1cnJlbnRQbGFuOiBudWxsLFxuXHRcdHN1YnNjcmlwdGlvblBhcmFtZXRlcnM6IHN1YnNjcmlwdGlvblBhcmFtZXRlcnMsXG5cdFx0ZmVhdHVyZUxpc3RQcm92aWRlcjogZmVhdHVyZUxpc3RQcm92aWRlcixcblx0XHRyZWZlcnJhbENvZGUsXG5cdFx0bXVsdGlwbGVVc2Vyc0FsbG93ZWQ6IGZhbHNlLFxuXHRcdGFjY2VwdGVkUGxhbnMsXG5cdFx0bXNnOiBtZXNzYWdlLFxuXHR9XG5cblx0Y29uc3QgaW52b2ljZUF0dHJzID0gbmV3IEludm9pY2VBbmRQYXltZW50RGF0YVBhZ2VBdHRycyhzaWdudXBEYXRhKVxuXG5cdGNvbnN0IHdpemFyZFBhZ2VzID0gW1xuXHRcdHdpemFyZFBhZ2VXcmFwcGVyKFVwZ3JhZGVTdWJzY3JpcHRpb25QYWdlLCBuZXcgVXBncmFkZVN1YnNjcmlwdGlvblBhZ2VBdHRycyhzaWdudXBEYXRhKSksXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoU2lnbnVwUGFnZSwgbmV3IFNpZ251cFBhZ2VBdHRycyhzaWdudXBEYXRhKSksXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoSW52b2ljZUFuZFBheW1lbnREYXRhUGFnZSwgaW52b2ljZUF0dHJzKSwgLy8gdGhpcyBwYWdlIHdpbGwgbG9naW4gdGhlIHVzZXIgYWZ0ZXIgc2lnbmluZyB1cCB3aXRoIG5ld2FjY291bnQgZGF0YVxuXHRcdHdpemFyZFBhZ2VXcmFwcGVyKFVwZ3JhZGVDb25maXJtU3Vic2NyaXB0aW9uUGFnZSwgaW52b2ljZUF0dHJzKSwgLy8gdGhpcyBwYWdlIHdpbGwgbG9naW4gdGhlIHVzZXIgaWYgdGhleSBhcmUgbm90IGxvZ2luIGZvciBpT1MgcGF5bWVudCB0aHJvdWdoIEFwcFN0b3JlXG5cdFx0d2l6YXJkUGFnZVdyYXBwZXIoVXBncmFkZUNvbmdyYXR1bGF0aW9uc1BhZ2UsIG5ldyBVcGdyYWRlQ29uZ3JhdHVsYXRpb25zUGFnZUF0dHJzKHNpZ251cERhdGEpKSxcblx0XVxuXG5cdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0d2l6YXJkUGFnZXMuc3BsaWNlKDIsIDEpIC8vIGRvIG5vdCBzaG93IHRoaXMgcGFnZSBvbiBBcHBTdG9yZSBwYXltZW50IHNpbmNlIHdlIGFyZSBvbmx5IGFibGUgdG8gc2hvdyB0aGlzIHNpbmdsZSBwYXltZW50IG1ldGhvZCBvbiBpT1Ncblx0fVxuXG5cdGNvbnN0IHdpemFyZEJ1aWxkZXIgPSBjcmVhdGVXaXphcmREaWFsb2coXG5cdFx0c2lnbnVwRGF0YSxcblx0XHR3aXphcmRQYWdlcyxcblx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRpZiAobG9jYXRvci5sb2dpbnMuaXNVc2VyTG9nZ2VkSW4oKSkge1xuXHRcdFx0XHQvLyB0aGlzIGVuc3VyZXMgdGhhdCBhbGwgY3JlYXRlZCBzZXNzaW9ucyBkdXJpbmcgc2lnbnVwIHByb2Nlc3MgYXJlIGNsb3NlZFxuXHRcdFx0XHQvLyBlaXRoZXIgYnkgY2xpY2tpbmcgb24gYGNhbmNlbGAsIGNsb3NpbmcgdGhlIHdpbmRvdywgb3IgY29uZmlybSBvbiB0aGUgVXBncmFkZUNvbmdyYXR1bGF0aW9uc1BhZ2Vcblx0XHRcdFx0YXdhaXQgbG9jYXRvci5sb2dpbnMubG9nb3V0KGZhbHNlKVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2lnbnVwRGF0YS5uZXdBY2NvdW50RGF0YSkge1xuXHRcdFx0XHRtLnJvdXRlLnNldChcIi9sb2dpblwiLCB7XG5cdFx0XHRcdFx0bm9BdXRvTG9naW46IHRydWUsXG5cdFx0XHRcdFx0bG9naW5XaXRoOiBzaWdudXBEYXRhLm5ld0FjY291bnREYXRhLm1haWxBZGRyZXNzLFxuXHRcdFx0XHR9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bS5yb3V0ZS5zZXQoXCIvbG9naW5cIiwge1xuXHRcdFx0XHRcdG5vQXV0b0xvZ2luOiB0cnVlLFxuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0RGlhbG9nVHlwZS5FZGl0TGFyZ2UsXG5cdClcblxuXHQvLyBmb3Igc2lnbnVwIHNwZWNpZmljYWxseSwgd2Ugb25seSB3YW50IHRoZSBpbnZvaWNlIGFuZCBwYXltZW50IHBhZ2UgYXMgd2VsbCBhcyB0aGUgY29uZmlybWF0aW9uIHBhZ2UgdG8gc2hvdyB1cCBpZiBzaWduaW5nIHVwIGZvciBhIHBhaWQgYWNjb3VudCAoYW5kIHRoZSB1c2VyIGRpZCBub3QgZ28gYmFjayB0byB0aGUgZmlyc3QgcGFnZSEpXG5cdGludm9pY2VBdHRycy5zZXRFbmFibGVkRnVuY3Rpb24oKCkgPT4gc2lnbnVwRGF0YS50eXBlICE9PSBQbGFuVHlwZS5GcmVlICYmIHdpemFyZEJ1aWxkZXIuYXR0cnMuY3VycmVudFBhZ2UgIT09IHdpemFyZFBhZ2VzWzBdKVxuXG5cdHdpemFyZEJ1aWxkZXIuZGlhbG9nLnNob3coKVxufVxuIiwiaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSwgaXNBcHAgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgZm9ybWF0RGF0ZSB9IGZyb20gXCIuLi9taXNjL0Zvcm1hdHRlclwiXG5pbXBvcnQgeyBIdG1sRWRpdG9yLCBIdG1sRWRpdG9yTW9kZSB9IGZyb20gXCIuLi9ndWkvZWRpdG9yL0h0bWxFZGl0b3JcIlxuaW1wb3J0IHR5cGUgeyBBY2NvdW50aW5nSW5mbywgQ3VzdG9tZXIsIEdyb3VwSW5mbywgT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50IH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlU2lnbk9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudERhdGEgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBuZXZlck51bGwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBTaWduT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50U2VydmljZSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1NlcnZpY2VzXCJcbmltcG9ydCB7IGZvcm1hdE5hbWVBbmRBZGRyZXNzIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uRm9ybWF0dGVyLmpzXCJcbmltcG9ydCB7IGdldE1haWxBZGRyZXNzRGlzcGxheVRleHQgfSBmcm9tIFwiLi4vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5jb25zdCBQUklOVF9ESVZfSUQgPSBcInByaW50LWRpdlwiXG5jb25zdCBhZ3JlZW1lbnRUZXh0cyA9IHtcblx0XCIxX2VuXCI6IHtcblx0XHRoZWFkaW5nOlxuXHRcdFx0JzxkaXYgY2xhc3M9XCJwYXBlcnRleHRcIj48aDMgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCIgaWQ9XCJPcmRlcnByb2Nlc3NpbmdhZ3JlZW1lbnQtT3JkZXJwcm9jZXNzaW5nYWdyZWVtZW50XCI+T3JkZXIgcHJvY2Vzc2luZyBhZ3JlZW1lbnQ8L2gzPjxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPmJldHdlZW48L3A+Jyxcblx0XHRjb250ZW50OlxuXHRcdFx0JzxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPi0mbmJzcDtjb250cm9sbGVyIC08YnI+aGVyZWluYWZ0ZXIgcmVmZXJyZWQgdG8gYXMgdGhlIENsaWVudDwvcD48cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj5hbmQ8L3A+PHAgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCI+VHV0YW8gR21iSCwgRGVpc3RlcnN0ci4gMTdhLCAzMDQ0OSBIYW5ub3ZlciwgR2VybWFueTwvcD48cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4tJm5ic3A7cHJvY2Vzc29yIC08YnI+aGVyZWluYWZ0ZXIgcmVmZXJyZWQgdG8gYXMgdGhlIFN1cHBsaWVyPC9wPjxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPiZuYnNwOzwvcD48aDQgaWQ9XCJPcmRlcnByb2Nlc3NpbmdhZ3JlZW1lbnQtMS5TdWJqZWN0bWF0dGVyYW5kZHVyYXRpb25vZnRoZWFncmVlbWVudFwiPjEuJm5ic3A7U3ViamVjdCBtYXR0ZXIgYW5kIGR1cmF0aW9uIG9mIHRoZSBhZ3JlZW1lbnQ8L2g0PjxwPlRoZSBTdWJqZWN0IG1hdHRlciBvZiB0aGUgYWdyZWVtZW50IHJlc3VsdHMgZnJvbSB0aGUgVGVybXMgYW5kIENvbmRpdGlvbnMgb2YgVHV0YW8gR21iSCBpbiBpdHMgY3VycmVudCB2ZXJzaW9uLCBzZWUgPHNwYW4gY2xhc3M9XCJub2xpbmtcIj5odHRwczovL3R1dGEuY29tL3Rlcm1zPC9zcGFuPiwgd2hpY2ggaXMgcmVmZXJyZWQgdG8gaGVyZSAoaGVyZWluYWZ0ZXIgcmVmZXJyZWQgdG8gYXMgU2VydmljZSBBZ3JlZW1lbnQpLiBUaGUgU3VwcGxpZXIgcHJvY2Vzc2VzIHBlcnNvbmFsIGRhdGEgZm9yIHRoZSBDbGllbnQgYWNjb3JkaW5nIHRvIEFydC4gNCBuby4gMiBhbmQgQXJ0LiAyOCBHRFBSIGJhc2VkIG9uIHRoaXMgYWdyZWVtZW50LjwvcD48cD5UaGUgZHVyYXRpb24gb2YgdGhpcyBBZ3JlZW1lbnQgY29ycmVzcG9uZHMgdG8gdGhlIHNlbGVjdGVkIHRlcm0gb2YgcG9saWN5IGluIHRoZSBzZWxlY3RlZCB0YXJpZmYuPC9wPjxoNCBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC0yLlB1cnBvc2UsVHlwZW9mRGF0YWFuZENhdGVnb3JpZXNvZkRhdGFTdWJqZWN0c1wiPjIuIFB1cnBvc2UsIFR5cGUgb2YgRGF0YSBhbmQgQ2F0ZWdvcmllcyBvZiBEYXRhIFN1YmplY3RzPC9oND48cD5Gb3IgdGhlIGluaXRpYXRpb24gb2YgYSBjb250cmFjdHVhbCByZWxhdGlvbnNoaXAgYW5kIGZvciBzZXJ2aWNlIHByb3Zpc2lvbjwvcD48dWw+PGxpPnRoZSBuZXdseSByZWdpc3RlcmVkIGVtYWlsIGFkZHJlc3M8L2xpPjwvdWw+PHA+aXMgY29sbGVjdGVkIGFzIGludmVudG9yeSBkYXRhLjwvcD48cD5Gb3IgaW52b2ljaW5nIGFuZCBkZXRlcm1pbmluZyB0aGUgVkFUPC9wPjx1bD48bGk+dGhlIGRvbWljaWxlIG9mIHRoZSBjdXN0b21lciAoY291bnRyeSk8L2xpPjxsaT50aGUgaW52b2ljaW5nIGFkZHJlc3M8L2xpPjxsaT50aGUgVkFUIGlkZW50aWZpY2F0aW9uIG51bWJlciAob25seSBmb3IgYnVzaW5lc3MgY3VzdG9tZXJzIG9mIHNvbWUgY291bnRyaWVzKTwvbGk+PC91bD48cD5pcyBjb2xsZWN0ZWQgYXMgaW52ZW50b3J5IGRhdGEuPC9wPjxwPkZvciB0aGUgdHJhbnNhY3Rpb24gb2YgcGF5bWVudHMgdGhlIGZvbGxvd2luZyBwYXltZW50IGRhdGEgKGludmVudG9yeSBkYXRhKSBpcyBjb2xsZWN0ZWQgZGVwZW5kaW5nIG9uIHRoZSBjaG9zZW4gcGF5bWVudCBtZXRob2Q6PC9wPjx1bD48bGk+QmFua2luZyBkZXRhaWxzIChhY2NvdW50IG51bWJlciBhbmQgc29ydCBjb2RlIGFuZCBJQkFOL0JJQywgaWYgbmVjZXNzYXJ5IGJhbmsgbmFtZSwgYWNjb3VudCBob2xkZXIpLDwvbGk+PGxpPmNyZWRpdCBjYXJkIGRhdGEsPC9saT48bGk+UGF5UGFsIHVzZXIgbmFtZS48L2xpPjwvdWw+PHA+Rm9yIHRoZSBleGVjdXRpb24gb2YgZGlyZWN0IGRlYml0aW5nLCB0aGUgYmFua2luZyBkZXRhaWxzIGFyZSBzaGFyZWQgd2l0aCB0aGUgYXV0aG9yaXplZCBjcmVkaXQgaW5zdGl0dXRpb24uIEZvciB0aGUgZXhlY3V0aW9uIG9mIFBheVBhbCBwYXltZW50cywgdGhlIFBheVBhbCBkYXRhIGlzIHNoYXJlZCB3aXRoIFBheVBhbCAoRXVyb3BlKS4gRm9yIHRoZSBleGVjdXRpb24gb2YgY3JlZGl0IGNhcmQgcGF5bWVudHMsIHRoZSBjcmVkaXQgY2FyZCBkYXRhIGlzIHNoYXJlZCB3aXRoIHRoZSBwYXltZW50IHNlcnZpY2UgcHJvdmlkZXImbmJzcDtCcmFpbnRyZWUmbmJzcDtmb3Igc3VicHJvY2Vzc2luZy4gVGhpcyBpbmNsdWRlcyB0aGUgdHJhbnNmZXIgb2YgcGVyc29uYWwgZGF0YSBpbnRvIGEgdGhpcmQgY291bnRyeSAoVVNBKS4gQW4gYWdyZWVtZW50IGVudGVyZWQgaW50byB3aXRoIEJyYWludHJlZSBkZWZpbmVzIGFwcHJvcHJpYXRlIHNhZmVndWFyZHMgYW5kIGRlbWFuZHMgdGhhdCB0aGUgZGF0YSBpcyBvbmx5IHByb2Nlc3NlZCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIEdEUFIgYW5kIG9ubHkgZm9yIHRoZSBwdXJwb3NlIG9mIGV4ZWN1dGlvbiBvZiBwYXltZW50cy4gVGhpcyBhZ3JlZW1lbnQgY2FuIGJlIGV4YW1pbmVkIGhlcmU6Jm5ic3A7PHNwYW4gY2xhc3M9XCJub2xpbmtcIj5odHRwczovL3d3dy5icmFpbnRyZWVwYXltZW50cy5jb20vYXNzZXRzL0JyYWludHJlZS1QU0EtTW9kZWwtQ2xhdXNlcy1NYXJjaDIwMTgucGRmPC9zcGFuPjwvcD48cD5UdXRhbm90YSBwcm92aWRlcyBzZXJ2aWNlcyBmb3Igc2F2aW5nLCBlZGl0aW5nLCBwcmVzZW50YXRpb24gYW5kIGVsZWN0cm9uaWMgdHJhbnNtaXNzaW9uIG9mIGRhdGEsIHN1Y2ggYXMgZW1haWwgc2VydmljZSwgY29udGFjdCBtYW5hZ2VtZW50IGFuZCBkYXRhIHN0b3JhZ2UuIFdpdGhpbiB0aGUgY29udGV4dCBvZiB0aGlzIGNvbnRlbnQgZGF0YSwgcGVyc29uYWwgZGF0YSBvZiB0aGUgQ2xpZW50IG1heSBiZSBwcm9jZXNzZWQuIEFsbCB0ZXh0dWFsIGNvbnRlbnQgaXMgZW5jcnlwdGVkIGZvciB0aGUgdXNlciBhbmQgaXRzIGNvbW11bmljYXRpb24gcGFydG5lcnMgaW4gYSB3YXkgdGhhdCBldmVuIFR1dGFvIEdtYkggaGFzIG5vIGFjY2VzcyB0byB0aGUgZGF0YS4mbmJzcDs8L3A+PHA+SW4gb3JkZXIgdG8gbWFpbnRhaW4gZW1haWwgc2VydmVyIG9wZXJhdGlvbnMsIGZvciBlcnJvciBkaWFnbm9zaXMgYW5kIGZvciBwcmV2ZW50aW9uIG9mIGFidXNlLCBtYWlsIHNlcnZlciBsb2dzIGFyZSBzdG9yZWQgbWF4LiAzMCBkYXlzLiBUaGVzZSBsb2dzIGNvbnRhaW4gc2VuZGVyIGFuZCByZWNpcGllbnQgZW1haWwgYWRkcmVzc2VzIGFuZCB0aW1lIG9mIGNvbm5lY3Rpb24sIGJ1dCBubyBjdXN0b21lciBJUCBhZGRyZXNzZXMuJm5ic3A7PC9wPjxwPkluIG9yZGVyIHRvIG1haW50YWluIG9wZXJhdGlvbnMsIGZvciBwcmV2ZW50aW9uIG9mIGFidXNlIGFuZCBhbmQgZm9yIHZpc2l0b3JzIGFuYWx5c2lzLCBJUCBhZGRyZXNzZXMgb2YgdXNlcnMgYXJlIHByb2Nlc3NlZC4gU3RvcmFnZSBvbmx5IHRha2VzIHBsYWNlIGZvciBJUCBhZGRyZXNzZXMgbWFkZSBhbm9ueW1vdXMgd2hpY2ggYXJlIHRoZXJlZm9yZSBub3QgcGVyc29uYWwgZGF0YSBhbnkgbW9yZS48L3A+PHA+V2l0aCB0aGUgZXhjZXB0aW9uIG9mIHBheW1lbnQgZGF0YSwgdGhlIHBlcnNvbmFsIGRhdGEgaW5jbHVkaW5nIHRoZSBlbWFpbCBhZGRyZXNzIGlzIG5vdCBkaXNjbG9zZWQgdG8gdGhpcmQgcGFydGllcy4gSG93ZXZlciwgVHV0YW8gR21iSCBjYW4gYmUgbGVnYWxseSBib3VuZCB0byBwcm92aWRlIGNvbnRlbnQgZGF0YSAoaW4gY2FzZSBvZiBhIHZhbGlkIEdlcm1hbiBjb3VydCBvcmRlcikgYW5kIGludmVudG9yeSBkYXRhIHRvIHByb3NlY3V0aW9uIHNlcnZpY2VzLiBUaGVyZSB3aWxsIGJlIG5vIHNhbGUgb2YgZGF0YS48L3A+PHA+VGhlIHVuZGVydGFraW5nIG9mIHRoZSBjb250cmFjdHVhbGx5IGFncmVlZCBQcm9jZXNzaW5nIG9mIERhdGEgc2hhbGwgYmUgY2FycmllZCBvdXQgZXhjbHVzaXZlbHkgd2l0aGluIGEgTWVtYmVyIFN0YXRlIG9mIHRoZSBFdXJvcGVhbiBVbmlvbiAoRVUpIG9yIHdpdGhpbiBhIE1lbWJlciBTdGF0ZSBvZiB0aGUgRXVyb3BlYW4gRWNvbm9taWMgQXJlYSAoRUVBKS4gRWFjaCBhbmQgZXZlcnkgVHJhbnNmZXIgb2YgRGF0YSB0byBhIFN0YXRlIHdoaWNoIGlzIG5vdCBhIE1lbWJlciBTdGF0ZSBvZiBlaXRoZXIgdGhlIEVVIG9yIHRoZSBFRUEgcmVxdWlyZXMgdGhlIHByaW9yIGFncmVlbWVudCBvZiB0aGUgQ2xpZW50IGFuZCBzaGFsbCBvbmx5IG9jY3VyIGlmIHRoZSBzcGVjaWZpYyBDb25kaXRpb25zIG9mIEFydGljbGUgNDQgZXQgc2VxLiBHRFBSIGhhdmUgYmVlbiBmdWxmaWxsZWQuPC9wPjxwPlRoZSBDYXRlZ29yaWVzIG9mIERhdGEgU3ViamVjdHMgY29tcHJpc2UgdGhlIHVzZXJzIHNldCB1cCBpbiBUdXRhbm90YSBieSB0aGUgQ2xpZW50IGFuZCB0aGVzZSB1c2Vyc1xcJyBjb21tdW5pY2F0aW9uIHBhcnRuZXJzLjwvcD48aDQgaWQ9XCJPcmRlcnByb2Nlc3NpbmdhZ3JlZW1lbnQtMy5UZWNobmljYWxhbmRPcmdhbml6YXRpb25hbE1lYXN1cmVzXCI+My4gVGVjaG5pY2FsIGFuZCBPcmdhbml6YXRpb25hbCBNZWFzdXJlczwvaDQ+PHA+KDEpIEJlZm9yZSB0aGUgY29tbWVuY2VtZW50IG9mIHByb2Nlc3NpbmcsIHRoZSBTdXBwbGllciBzaGFsbCBkb2N1bWVudCB0aGUgZXhlY3V0aW9uIG9mIHRoZSBuZWNlc3NhcnkgVGVjaG5pY2FsIGFuZCBPcmdhbml6YXRpb25hbCBNZWFzdXJlcywgc2V0IG91dCBpbiBhZHZhbmNlIG9mIHRoZSBhd2FyZGluZyBvZiB0aGUgQWdyZWVtZW50LCBzcGVjaWZpY2FsbHkgd2l0aCByZWdhcmQgdG8gdGhlIGRldGFpbGVkIGV4ZWN1dGlvbiBvZiB0aGUgQWdyZWVtZW50LCBhbmQgc2hhbGwgcHJlc2VudCB0aGVzZSBkb2N1bWVudGVkIG1lYXN1cmVzIHRvIHRoZSBDbGllbnQgZm9yIGluc3BlY3Rpb24uIFVwb24gYWNjZXB0YW5jZSBieSB0aGUgQ2xpZW50LCB0aGUgZG9jdW1lbnRlZCBtZWFzdXJlcyBiZWNvbWUgdGhlIGZvdW5kYXRpb24gb2YgdGhlIEFncmVlbWVudC4gSW5zb2ZhciBhcyB0aGUgaW5zcGVjdGlvbi9hdWRpdCBieSB0aGUgQ2xpZW50IHNob3dzIHRoZSBuZWVkIGZvciBhbWVuZG1lbnRzLCBzdWNoIGFtZW5kbWVudHMgc2hhbGwgYmUgaW1wbGVtZW50ZWQgYnkgbXV0dWFsIGFncmVlbWVudC48L3A+PHA+KDIpIFRoZSBTdXBwbGllciBzaGFsbCBlc3RhYmxpc2ggdGhlIHNlY3VyaXR5IGluIGFjY29yZGFuY2Ugd2l0aCBBcnRpY2xlIDI4IFBhcmFncmFwaCAzIFBvaW50IGMsIGFuZCBBcnRpY2xlIDMyIEdEUFIgaW4gcGFydGljdWxhciBpbiBjb25qdW5jdGlvbiB3aXRoIEFydGljbGUgNSBQYXJhZ3JhcGggMSwgYW5kIFBhcmFncmFwaCAyIEdEUFIuIFRoZSBtZWFzdXJlcyB0byBiZSB0YWtlbiBhcmUgbWVhc3VyZXMgb2YgZGF0YSBzZWN1cml0eSBhbmQgbWVhc3VyZXMgdGhhdCBndWFyYW50ZWUgYSBwcm90ZWN0aW9uIGxldmVsIGFwcHJvcHJpYXRlIHRvIHRoZSByaXNrIGNvbmNlcm5pbmcgY29uZmlkZW50aWFsaXR5LCBpbnRlZ3JpdHksIGF2YWlsYWJpbGl0eSBhbmQgcmVzaWxpZW5jZSBvZiB0aGUgc3lzdGVtcy4gVGhlIHN0YXRlIG9mIHRoZSBhcnQsIGltcGxlbWVudGF0aW9uIGNvc3RzLCB0aGUgbmF0dXJlLCBzY29wZSBhbmQgcHVycG9zZXMgb2YgcHJvY2Vzc2luZyBhcyB3ZWxsIGFzIHRoZSBwcm9iYWJpbGl0eSBvZiBvY2N1cnJlbmNlIGFuZCB0aGUgc2V2ZXJpdHkgb2YgdGhlIHJpc2sgdG8gdGhlIHJpZ2h0cyBhbmQgZnJlZWRvbXMgb2YgbmF0dXJhbCBwZXJzb25zIHdpdGhpbiB0aGUgbWVhbmluZyBvZiBBcnRpY2xlIDMyIFBhcmFncmFwaCAxIEdEUFIgbXVzdCBiZSB0YWtlbiBpbnRvIGFjY291bnQuIFtEZXRhaWxzIGluIEFwcGVuZGl4IDFdPC9wPjxwPigzKSBUaGUgVGVjaG5pY2FsIGFuZCBPcmdhbml6YXRpb25hbCBNZWFzdXJlcyBhcmUgc3ViamVjdCB0byB0ZWNobmljYWwgcHJvZ3Jlc3MgYW5kIGZ1cnRoZXIgZGV2ZWxvcG1lbnQuIEluIHRoaXMgcmVzcGVjdCwgaXQgaXMgcGVybWlzc2libGUgZm9yIHRoZSBTdXBwbGllciB0byBpbXBsZW1lbnQgYWx0ZXJuYXRpdmUgYWRlcXVhdGUgbWVhc3VyZXMuIEluIHNvIGRvaW5nLCB0aGUgc2VjdXJpdHkgbGV2ZWwgb2YgdGhlIGRlZmluZWQgbWVhc3VyZXMgbXVzdCBub3QgYmUgcmVkdWNlZC4gU3Vic3RhbnRpYWwgY2hhbmdlcyBtdXN0IGJlIGRvY3VtZW50ZWQuPC9wPjxoNCBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC00LlJlY3RpZmljYXRpb24scmVzdHJpY3Rpb25hbmRlcmFzdXJlb2ZkYXRhXCI+PHNwYW4+NC4gUmVjdGlmaWNhdGlvbiwgcmVzdHJpY3Rpb24gYW5kIGVyYXN1cmUgb2YgZGF0YTwvc3Bhbj48L2g0PjxwPigxKSBUaGUgU3VwcGxpZXIgbWF5IG5vdCBvbiBpdHMgb3duIGF1dGhvcml0eSByZWN0aWZ5LCBlcmFzZSBvciByZXN0cmljdCB0aGUgcHJvY2Vzc2luZyBvZiBkYXRhIHRoYXQgaXMgYmVpbmcgcHJvY2Vzc2VkIG9uIGJlaGFsZiBvZiB0aGUgQ2xpZW50LCBidXQgb25seSBvbiBkb2N1bWVudGVkIGluc3RydWN0aW9ucyBmcm9tIHRoZSBDbGllbnQuIDxicj5JbnNvZmFyIGFzIGEgRGF0YSBTdWJqZWN0IGNvbnRhY3RzIHRoZSBTdXBwbGllciBkaXJlY3RseSBjb25jZXJuaW5nIGEgcmVjdGlmaWNhdGlvbiwgZXJhc3VyZSwgb3IgcmVzdHJpY3Rpb24gb2YgcHJvY2Vzc2luZywgdGhlIFN1cHBsaWVyIHdpbGwgaW1tZWRpYXRlbHkgZm9yd2FyZCB0aGUgRGF0YSBTdWJqZWN04oCZcyByZXF1ZXN0IHRvIHRoZSBDbGllbnQuPC9wPjxwPigyKSBJbnNvZmFyIGFzIGl0IGlzIGluY2x1ZGVkIGluIHRoZSBzY29wZSBvZiBzZXJ2aWNlcywgdGhlIGVyYXN1cmUgcG9saWN5LCDigJhyaWdodCB0byBiZSBmb3Jnb3R0ZW7igJksIHJlY3RpZmljYXRpb24sIGRhdGEgcG9ydGFiaWxpdHkgYW5kIGFjY2VzcyBzaGFsbCBiZSBlbnN1cmVkIGJ5IHRoZSBTdXBwbGllciBpbiBhY2NvcmRhbmNlIHdpdGggZG9jdW1lbnRlZCBpbnN0cnVjdGlvbnMgZnJvbSB0aGUgQ2xpZW50IHdpdGhvdXQgdW5kdWUgZGVsYXkuPC9wPjxoNCBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC01LlF1YWxpdHlhc3N1cmFuY2VhbmRvdGhlcmR1dGllc29mdGhlU3VwcGxpZXJcIj41LiBRdWFsaXR5IGFzc3VyYW5jZSBhbmQgb3RoZXIgZHV0aWVzIG9mIHRoZSBTdXBwbGllciZuYnNwOzwvaDQ+PHAgYWxpZ249XCJqdXN0aWZ5XCI+SW4gYWRkaXRpb24gdG8gY29tcGx5aW5nIHdpdGggdGhlIHJ1bGVzIHNldCBvdXQgaW4gdGhpcyBBZ3JlZW1lbnQsIHRoZSBTdXBwbGllciBzaGFsbCBjb21wbHkgd2l0aCB0aGUgc3RhdHV0b3J5IHJlcXVpcmVtZW50cyByZWZlcnJlZCB0byBpbiBBcnRpY2xlcyAyOCB0byAzMyBHRFBSOyBhY2NvcmRpbmdseSwgdGhlIFN1cHBsaWVyIGVuc3VyZXMsIGluIHBhcnRpY3VsYXIsIGNvbXBsaWFuY2Ugd2l0aCB0aGUgZm9sbG93aW5nIHJlcXVpcmVtZW50czo8L3A+PG9sPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5UaGUgU3VwcGxpZXIgaXMgbm90IG9ibGlnZWQgdG8gYXBwb2ludCBhIERhdGEgUHJvdGVjdGlvbiBPZmZpY2VyLiBNci4gQXJuZSBNb2VobGUsIHBob25lOiArNDkgNTExIDIwMjgwMS0xMSwgYXJuZS5tb2VobGVAdHV0YW8uZGUsIGlzIGRlc2lnbmF0ZWQgYXMgdGhlIENvbnRhY3QgUGVyc29uIG9uIGJlaGFsZiBvZiB0aGUgU3VwcGxpZXIuPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPkNvbmZpZGVudGlhbGl0eSBpbiBhY2NvcmRhbmNlIHdpdGggQXJ0aWNsZSAyOCBQYXJhZ3JhcGggMyBTZW50ZW5jZSAyIFBvaW50IGIsIEFydGljbGVzIDI5IGFuZCAzMiBQYXJhZ3JhcGggNCBHRFBSLiBUaGUgU3VwcGxpZXIgZW50cnVzdHMgb25seSBzdWNoIGVtcGxveWVlcyB3aXRoIHRoZSBkYXRhIHByb2Nlc3Npbmcgb3V0bGluZWQgaW4gdGhpcyBBZ3JlZW1lbnQgd2hvIGhhdmUgYmVlbiBib3VuZCB0byBjb25maWRlbnRpYWxpdHkgYW5kIGhhdmUgcHJldmlvdXNseSBiZWVuIGZhbWlsaWFyaXplZCB3aXRoIHRoZSBkYXRhIHByb3RlY3Rpb24gcHJvdmlzaW9ucyByZWxldmFudCB0byB0aGVpciB3b3JrLiBUaGUgU3VwcGxpZXIgYW5kIGFueSBwZXJzb24gYWN0aW5nIHVuZGVyIGl0cyBhdXRob3JpdHkgd2hvIGhhcyBhY2Nlc3MgdG8gcGVyc29uYWwgZGF0YSwgc2hhbGwgbm90IHByb2Nlc3MgdGhhdCBkYXRhIHVubGVzcyBvbiBpbnN0cnVjdGlvbnMgZnJvbSB0aGUgQ2xpZW50LCB3aGljaCBpbmNsdWRlcyB0aGUgcG93ZXJzIGdyYW50ZWQgaW4gdGhpcyBBZ3JlZW1lbnQsIHVubGVzcyByZXF1aXJlZCB0byBkbyBzbyBieSBsYXcuPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPkltcGxlbWVudGF0aW9uIG9mIGFuZCBjb21wbGlhbmNlIHdpdGggYWxsIFRlY2huaWNhbCBhbmQgT3JnYW5pemF0aW9uYWwgTWVhc3VyZXMgbmVjZXNzYXJ5IGZvciB0aGlzIEFncmVlbWVudCBpbiBhY2NvcmRhbmNlIHdpdGggQXJ0aWNsZSAyOCBQYXJhZ3JhcGggMyBTZW50ZW5jZSAyIFBvaW50IGMsIEFydGljbGUgMzIgR0RQUiBbZGV0YWlscyBpbiBBcHBlbmRpeCAxXS48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+VGhlIENsaWVudCBhbmQgdGhlIFN1cHBsaWVyIHNoYWxsIGNvb3BlcmF0ZSwgb24gcmVxdWVzdCwgd2l0aCB0aGUgc3VwZXJ2aXNvcnkgYXV0aG9yaXR5IGluIHBlcmZvcm1hbmNlIG9mIGl0cyB0YXNrcy48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+VGhlIENsaWVudCBzaGFsbCBiZSBpbmZvcm1lZCBpbW1lZGlhdGVseSBvZiBhbnkgaW5zcGVjdGlvbnMgYW5kIG1lYXN1cmVzIGNvbmR1Y3RlZCBieSB0aGUgc3VwZXJ2aXNvcnkgYXV0aG9yaXR5LCBpbnNvZmFyIGFzIHRoZXkgcmVsYXRlIHRvIHRoaXMgQWdyZWVtZW50LiBUaGlzIGFsc28gYXBwbGllcyBpbnNvZmFyIGFzIHRoZSBTdXBwbGllciBpcyB1bmRlciBpbnZlc3RpZ2F0aW9uIG9yIGlzIHBhcnR5IHRvIGFuIGludmVzdGlnYXRpb24gYnkgYSBjb21wZXRlbnQgYXV0aG9yaXR5IGluIGNvbm5lY3Rpb24gd2l0aCBpbmZyaW5nZW1lbnRzIHRvIGFueSBDaXZpbCBvciBDcmltaW5hbCBMYXcsIG9yIEFkbWluaXN0cmF0aXZlIFJ1bGUgb3IgUmVndWxhdGlvbiByZWdhcmRpbmcgdGhlIHByb2Nlc3Npbmcgb2YgcGVyc29uYWwgZGF0YSBpbiBjb25uZWN0aW9uIHdpdGggdGhlIHByb2Nlc3Npbmcgb2YgdGhpcyBBZ3JlZW1lbnQuPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPkluc29mYXIgYXMgdGhlIENsaWVudCBpcyBzdWJqZWN0IHRvIGFuIGluc3BlY3Rpb24gYnkgdGhlIHN1cGVydmlzb3J5IGF1dGhvcml0eSwgYW4gYWRtaW5pc3RyYXRpdmUgb3Igc3VtbWFyeSBvZmZlbnNlIG9yIGNyaW1pbmFsIHByb2NlZHVyZSwgYSBsaWFiaWxpdHkgY2xhaW0gYnkgYSBEYXRhIFN1YmplY3Qgb3IgYnkgYSB0aGlyZCBwYXJ0eSBvciBhbnkgb3RoZXIgY2xhaW0gaW4gY29ubmVjdGlvbiB3aXRoIHRoZSBBZ3JlZW1lbnQgZGF0YSBwcm9jZXNzaW5nIGJ5IHRoZSBTdXBwbGllciwgdGhlIFN1cHBsaWVyIHNoYWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIHN1cHBvcnQgdGhlIENsaWVudC48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+VGhlIFN1cHBsaWVyIHNoYWxsIHBlcmlvZGljYWxseSBtb25pdG9yIHRoZSBpbnRlcm5hbCBwcm9jZXNzZXMgYW5kIHRoZSBUZWNobmljYWwgYW5kIE9yZ2FuaXphdGlvbmFsIE1lYXN1cmVzIHRvIGVuc3VyZSB0aGF0IHByb2Nlc3Npbmcgd2l0aGluIGhpcyBhcmVhIG9mIHJlc3BvbnNpYmlsaXR5IGlzIGluIGFjY29yZGFuY2Ugd2l0aCB0aGUgcmVxdWlyZW1lbnRzIG9mIGFwcGxpY2FibGUgZGF0YSBwcm90ZWN0aW9uIGxhdyBhbmQgdGhlIHByb3RlY3Rpb24gb2YgdGhlIHJpZ2h0cyBvZiB0aGUgZGF0YSBzdWJqZWN0LjwvcD48L2xpPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5WZXJpZmlhYmlsaXR5IG9mIHRoZSBUZWNobmljYWwgYW5kIE9yZ2FuaXphdGlvbmFsIE1lYXN1cmVzIGNvbmR1Y3RlZCBieSB0aGUgQ2xpZW50IGFzIHBhcnQgb2YgdGhlIENsaWVudOKAmXMgc3VwZXJ2aXNvcnkgcG93ZXJzIHJlZmVycmVkIHRvIGluIGl0ZW0gNyBvZiB0aGlzIEFncmVlbWVudC48L3A+PC9saT48L29sPjxoNCBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC02LlN1YmNvbnRyYWN0aW5nXCI+Ni4gU3ViY29udHJhY3Rpbmc8L2g0PjxwIGFsaWduPVwianVzdGlmeVwiPigxKSBTdWJjb250cmFjdGluZyBmb3IgdGhlIHB1cnBvc2Ugb2YgdGhpcyBBZ3JlZW1lbnQgaXMgdG8gYmUgdW5kZXJzdG9vZCBhcyBtZWFuaW5nIHNlcnZpY2VzIHdoaWNoIHJlbGF0ZSBkaXJlY3RseSB0byB0aGUgcHJvdmlzaW9uIG9mIHRoZSBwcmluY2lwYWwgc2VydmljZS4gVGhpcyBkb2VzIG5vdCBpbmNsdWRlIGFuY2lsbGFyeSBzZXJ2aWNlcywgc3VjaCBhcyB0ZWxlY29tbXVuaWNhdGlvbiBzZXJ2aWNlcywgcG9zdGFsIC8gdHJhbnNwb3J0IHNlcnZpY2VzLCBtYWludGVuYW5jZSBhbmQgdXNlciBzdXBwb3J0IHNlcnZpY2VzIG9yIHRoZSBkaXNwb3NhbCBvZiBkYXRhIGNhcnJpZXJzLCBhcyB3ZWxsIGFzIG90aGVyIG1lYXN1cmVzIHRvIGVuc3VyZSB0aGUgY29uZmlkZW50aWFsaXR5LCBhdmFpbGFiaWxpdHksIGludGVncml0eSBhbmQgcmVzaWxpZW5jZSBvZiB0aGUgaGFyZHdhcmUgYW5kIHNvZnR3YXJlIG9mIGRhdGEgcHJvY2Vzc2luZyBlcXVpcG1lbnQuIFRoZSBTdXBwbGllciBzaGFsbCwgaG93ZXZlciwgYmUgb2JsaWdlZCB0byBtYWtlIGFwcHJvcHJpYXRlIGFuZCBsZWdhbGx5IGJpbmRpbmcgY29udHJhY3R1YWwgYXJyYW5nZW1lbnRzIGFuZCB0YWtlIGFwcHJvcHJpYXRlIGluc3BlY3Rpb24gbWVhc3VyZXMgdG8gZW5zdXJlIHRoZSBkYXRhIHByb3RlY3Rpb24gYW5kIHRoZSBkYXRhIHNlY3VyaXR5IG9mIHRoZSBDbGllbnRcXCdzIGRhdGEsIGV2ZW4gaW4gdGhlIGNhc2Ugb2Ygb3V0c291cmNlZCBhbmNpbGxhcnkgc2VydmljZXMuPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigyKSBUaGUgU3VwcGxpZXIgbWF5IGNvbW1pc3Npb24gc3ViY29udHJhY3RvcnMgKGFkZGl0aW9uYWwgY29udHJhY3QgcHJvY2Vzc29ycykgb25seSBhZnRlciBwcmlvciBleHBsaWNpdCB3cml0dGVuIG9yIGRvY3VtZW50ZWQgY29uc2VudCBmcm9tIHRoZSBDbGllbnQuJm5ic3A7PC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigzKSBPdXRzb3VyY2luZyB0byBzdWJjb250cmFjdG9ycyBvciBjaGFuZ2luZyB0aGUgZXhpc3Rpbmcgc3ViY29udHJhY3RvciBhcmUgcGVybWlzc2libGUgd2hlbjo8L3A+PHVsPjxsaT5UaGUgU3VwcGxpZXIgc3VibWl0cyBzdWNoIGFuIG91dHNvdXJjaW5nIHRvIGEgc3ViY29udHJhY3RvciB0byB0aGUgQ2xpZW50IGluIHdyaXRpbmcgb3IgaW4gdGV4dCBmb3JtIHdpdGggYXBwcm9wcmlhdGUgYWR2YW5jZSBub3RpY2U7IGFuZDwvbGk+PGxpPlRoZSBDbGllbnQgaGFzIG5vdCBvYmplY3RlZCB0byB0aGUgcGxhbm5lZCBvdXRzb3VyY2luZyBpbiB3cml0aW5nIG9yIGluIHRleHQgZm9ybSBieSB0aGUgZGF0ZSBvZiBoYW5kaW5nIG92ZXIgdGhlIGRhdGEgdG8gdGhlIFN1cHBsaWVyOyBhbmQ8L2xpPjxsaT5UaGUgc3ViY29udHJhY3RpbmcgaXMgYmFzZWQgb24gYSBjb250cmFjdHVhbCBhZ3JlZW1lbnQgaW4gYWNjb3JkYW5jZSB3aXRoIEFydGljbGUgMjggcGFyYWdyYXBocyAyLTQgR0RQUi48L2xpPjwvdWw+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDQpIFRoZSB0cmFuc2ZlciBvZiBwZXJzb25hbCBkYXRhIGZyb20gdGhlIENsaWVudCB0byB0aGUgc3ViY29udHJhY3RvciBhbmQgdGhlIHN1YmNvbnRyYWN0b3JzIGNvbW1lbmNlbWVudCBvZiB0aGUgZGF0YSBwcm9jZXNzaW5nIHNoYWxsIG9ubHkgYmUgdW5kZXJ0YWtlbiBhZnRlciBjb21wbGlhbmNlIHdpdGggYWxsIHJlcXVpcmVtZW50cyBoYXMgYmVlbiBhY2hpZXZlZC48L3A+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDUpIElmIHRoZSBzdWJjb250cmFjdG9yIHByb3ZpZGVzIHRoZSBhZ3JlZWQgc2VydmljZSBvdXRzaWRlIHRoZSBFVS9FRUEsIHRoZSBTdXBwbGllciBzaGFsbCBlbnN1cmUgY29tcGxpYW5jZSB3aXRoIEVVIERhdGEgUHJvdGVjdGlvbiBSZWd1bGF0aW9ucyBieSBhcHByb3ByaWF0ZSBtZWFzdXJlcy4gVGhlIHNhbWUgYXBwbGllcyBpZiBzZXJ2aWNlIHByb3ZpZGVycyBhcmUgdG8gYmUgdXNlZCB3aXRoaW4gdGhlIG1lYW5pbmcgb2YgUGFyYWdyYXBoIDEgU2VudGVuY2UgMi48L3A+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDYpIEZ1cnRoZXIgb3V0c291cmNpbmcgYnkgdGhlIHN1YmNvbnRyYWN0b3IgcmVxdWlyZXMgdGhlIGV4cHJlc3MgY29uc2VudCBvZiB0aGUgbWFpbiBDbGllbnQgKGF0IHRoZSBtaW5pbXVtIGluIHRleHQgZm9ybSk7PC9wPjxwIGFsaWduPVwianVzdGlmeVwiPig3KSBBbGwgY29udHJhY3R1YWwgcHJvdmlzaW9ucyBpbiB0aGUgY29udHJhY3QgY2hhaW4gc2hhbGwgYmUgY29tbXVuaWNhdGVkIHRvIGFuZCBhZ3JlZWQgd2l0aCBlYWNoIGFuZCBldmVyeSBhZGRpdGlvbmFsIHN1YmNvbnRyYWN0b3IuPC9wPjxoNCBjbGFzcz1cIndlc3Rlcm5cIiBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC03LlN1cGVydmlzb3J5cG93ZXJzb2Z0aGVDbGllbnRcIj43LiBTdXBlcnZpc29yeSBwb3dlcnMgb2YgdGhlIENsaWVudDwvaDQ+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDEpIFRoZSBDbGllbnQgaGFzIHRoZSByaWdodCwgYWZ0ZXIgY29uc3VsdGF0aW9uIHdpdGggdGhlIFN1cHBsaWVyLCB0byBjYXJyeSBvdXQgaW5zcGVjdGlvbnMgb3IgdG8gaGF2ZSB0aGVtIGNhcnJpZWQgb3V0IGJ5IGFuIGF1ZGl0b3IgdG8gYmUgZGVzaWduYXRlZCBpbiBlYWNoIGluZGl2aWR1YWwgY2FzZS4gSXQgaGFzIHRoZSByaWdodCB0byBjb252aW5jZSBpdHNlbGYgb2YgdGhlIGNvbXBsaWFuY2Ugd2l0aCB0aGlzIGFncmVlbWVudCBieSB0aGUgU3VwcGxpZXIgaW4gaGlzIGJ1c2luZXNzIG9wZXJhdGlvbnMgYnkgbWVhbnMgb2YgcmFuZG9tIGNoZWNrcywgd2hpY2ggYXJlIG9yZGluYXJpbHkgdG8gYmUgYW5ub3VuY2VkIGluIGdvb2QgdGltZS48L3A+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDIpIFRoZSBTdXBwbGllciBzaGFsbCBlbnN1cmUgdGhhdCB0aGUgQ2xpZW50IGlzIGFibGUgdG8gdmVyaWZ5IGNvbXBsaWFuY2Ugd2l0aCB0aGUgb2JsaWdhdGlvbnMgb2YgdGhlIFN1cHBsaWVyIGluIGFjY29yZGFuY2Ugd2l0aCBBcnRpY2xlIDI4IEdEUFIuIFRoZSBTdXBwbGllciB1bmRlcnRha2VzIHRvIGdpdmUgdGhlIENsaWVudCB0aGUgbmVjZXNzYXJ5IGluZm9ybWF0aW9uIG9uIHJlcXVlc3QgYW5kLCBpbiBwYXJ0aWN1bGFyLCB0byBkZW1vbnN0cmF0ZSB0aGUgZXhlY3V0aW9uIG9mIHRoZSBUZWNobmljYWwgYW5kIE9yZ2FuaXphdGlvbmFsIE1lYXN1cmVzLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMykgRXZpZGVuY2Ugb2Ygc3VjaCBtZWFzdXJlcywgd2hpY2ggY29uY2VybiBub3Qgb25seSB0aGUgc3BlY2lmaWMgQWdyZWVtZW50LCBtYXkgYmUgcHJvdmlkZWQgYnk8L3A+PHVsPjxsaT5Db21wbGlhbmNlIHdpdGggYXBwcm92ZWQgQ29kZXMgb2YgQ29uZHVjdCBwdXJzdWFudCB0byBBcnRpY2xlIDQwIEdEUFI7PC9saT48bGk+Q2VydGlmaWNhdGlvbiBhY2NvcmRpbmcgdG8gYW4gYXBwcm92ZWQgY2VydGlmaWNhdGlvbiBwcm9jZWR1cmUgaW4gYWNjb3JkYW5jZSB3aXRoIEFydGljbGUgNDIgR0RQUjs8L2xpPjxsaT5DdXJyZW50IGF1ZGl0b3LigJlzIGNlcnRpZmljYXRlcywgcmVwb3J0cyBvciBleGNlcnB0cyBmcm9tIHJlcG9ydHMgcHJvdmlkZWQgYnkgaW5kZXBlbmRlbnQgYm9kaWVzIChlLmcuIGF1ZGl0b3IsIERhdGEgUHJvdGVjdGlvbiBPZmZpY2VyLCBJVCBzZWN1cml0eSBkZXBhcnRtZW50LCBkYXRhIHByaXZhY3kgYXVkaXRvciwgcXVhbGl0eSBhdWRpdG9yKTwvbGk+PGxpPkEgc3VpdGFibGUgY2VydGlmaWNhdGlvbiBieSBJVCBzZWN1cml0eSBvciBkYXRhIHByb3RlY3Rpb24gYXVkaXRpbmcgKGUuZy4gYWNjb3JkaW5nIHRvIEJTSS1HcnVuZHNjaHV0eiAoSVQgQmFzZWxpbmUgUHJvdGVjdGlvbiBjZXJ0aWZpY2F0aW9uIGRldmVsb3BlZCBieSB0aGUgR2VybWFuJm5ic3A7IEZlZGVyYWwgT2ZmaWNlIGZvciBTZWN1cml0eSBpbiBJbmZvcm1hdGlvbiBUZWNobm9sb2d5IChCU0kpKSBvciBJU08vSUVDIDI3MDAxKS48L2xpPjwvdWw+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDQpIFRoZSBTdXBwbGllciBtYXkgY2xhaW0gcmVtdW5lcmF0aW9uIGZvciBlbmFibGluZyBDbGllbnQgaW5zcGVjdGlvbnMuJm5ic3A7PC9wPjxoNCBjbGFzcz1cIndlc3Rlcm5cIiBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC04LkNvbW11bmljYXRpb25pbnRoZWNhc2VvZmluZnJpbmdlbWVudHNieXRoZVN1cHBsaWVyXCI+OC4gQ29tbXVuaWNhdGlvbiBpbiB0aGUgY2FzZSBvZiBpbmZyaW5nZW1lbnRzIGJ5IHRoZSBTdXBwbGllcjwvaDQ+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDEpIFRoZSBTdXBwbGllciBzaGFsbCBhc3Npc3QgdGhlIENsaWVudCBpbiBjb21wbHlpbmcgd2l0aCB0aGUgb2JsaWdhdGlvbnMgY29uY2VybmluZyB0aGUgc2VjdXJpdHkgb2YgcGVyc29uYWwgZGF0YSwgcmVwb3J0aW5nIHJlcXVpcmVtZW50cyBmb3IgZGF0YSBicmVhY2hlcywgZGF0YSBwcm90ZWN0aW9uIGltcGFjdCBhc3Nlc3NtZW50cyBhbmQgcHJpb3IgY29uc3VsdGF0aW9ucywgcmVmZXJyZWQgdG8gaW4gQXJ0aWNsZXMgMzIgdG8gMzYgb2YgdGhlIEdEUFIuIFRoZXNlIGluY2x1ZGU6PC9wPjxvbD48bGk+RW5zdXJpbmcgYW4gYXBwcm9wcmlhdGUgbGV2ZWwgb2YgcHJvdGVjdGlvbiB0aHJvdWdoIFRlY2huaWNhbCBhbmQgT3JnYW5pemF0aW9uYWwgTWVhc3VyZXMgdGhhdCB0YWtlIGludG8gYWNjb3VudCB0aGUgY2lyY3Vtc3RhbmNlcyBhbmQgcHVycG9zZXMgb2YgdGhlIHByb2Nlc3NpbmcgYXMgd2VsbCBhcyB0aGUgcHJvamVjdGVkIHByb2JhYmlsaXR5IGFuZCBzZXZlcml0eSBvZiBhIHBvc3NpYmxlIGluZnJpbmdlbWVudCBvZiB0aGUgbGF3IGFzIGEgcmVzdWx0IG9mIHNlY3VyaXR5IHZ1bG5lcmFiaWxpdGllcyBhbmQgdGhhdCBlbmFibGUgYW4gaW1tZWRpYXRlIGRldGVjdGlvbiBvZiByZWxldmFudCBpbmZyaW5nZW1lbnQgZXZlbnRzLjwvbGk+PGxpPlRoZSBvYmxpZ2F0aW9uIHRvIHJlcG9ydCBhIHBlcnNvbmFsIGRhdGEgYnJlYWNoIGltbWVkaWF0ZWx5IHRvIHRoZSBDbGllbnQ8L2xpPjxsaT5UaGUgZHV0eSB0byBhc3Npc3QgdGhlIENsaWVudCB3aXRoIHJlZ2FyZCB0byB0aGUgQ2xpZW504oCZcyBvYmxpZ2F0aW9uIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gdG8gdGhlIERhdGEgU3ViamVjdCBjb25jZXJuZWQgYW5kIHRvIGltbWVkaWF0ZWx5IHByb3ZpZGUgdGhlIENsaWVudCB3aXRoIGFsbCByZWxldmFudCBpbmZvcm1hdGlvbiBpbiB0aGlzIHJlZ2FyZC48L2xpPjxsaT5TdXBwb3J0aW5nIHRoZSBDbGllbnQgd2l0aCBpdHMgZGF0YSBwcm90ZWN0aW9uIGltcGFjdCBhc3Nlc3NtZW50PC9saT48bGk+U3VwcG9ydGluZyB0aGUgQ2xpZW50IHdpdGggcmVnYXJkIHRvIHByaW9yIGNvbnN1bHRhdGlvbiBvZiB0aGUgc3VwZXJ2aXNvcnkgYXV0aG9yaXR5PC9saT48L29sPjxwIGFsaWduPVwianVzdGlmeVwiPigyKSBUaGUgU3VwcGxpZXIgbWF5IGNsYWltIGNvbXBlbnNhdGlvbiBmb3Igc3VwcG9ydCBzZXJ2aWNlcyB3aGljaCBhcmUgbm90IGluY2x1ZGVkIGluIHRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgc2VydmljZXMgYW5kIHdoaWNoIGFyZSBub3QgYXR0cmlidXRhYmxlIHRvIGZhaWx1cmVzIG9uIHRoZSBwYXJ0IG9mIHRoZSBTdXBwbGllci48L3A+PGg0IGNsYXNzPVwid2VzdGVyblwiIGlkPVwiT3JkZXJwcm9jZXNzaW5nYWdyZWVtZW50LTkuQXV0aG9yaXR5b2Z0aGVDbGllbnR0b2lzc3VlaW5zdHJ1Y3Rpb25zXCI+OS4gQXV0aG9yaXR5IG9mIHRoZSBDbGllbnQgdG8gaXNzdWUgaW5zdHJ1Y3Rpb25zPC9oND48cD4oMSkgVGhlIENsaWVudCBzaGFsbCBpbW1lZGlhdGVseSBjb25maXJtIG9yYWwgaW5zdHJ1Y3Rpb25zIChhdCB0aGUgbWluaW11bSBpbiB0ZXh0IGZvcm0pLjwvcD48cD4oMikgVGhlIFN1cHBsaWVyIHNoYWxsIGluZm9ybSB0aGUgQ2xpZW50IGltbWVkaWF0ZWx5IGlmIGhlIGNvbnNpZGVycyB0aGF0IGFuIGluc3RydWN0aW9uIHZpb2xhdGVzIERhdGEgUHJvdGVjdGlvbiBSZWd1bGF0aW9ucy4gVGhlIFN1cHBsaWVyIHNoYWxsIHRoZW4gYmUgZW50aXRsZWQgdG8gc3VzcGVuZCB0aGUgZXhlY3V0aW9uIG9mIHRoZSByZWxldmFudCBpbnN0cnVjdGlvbnMgdW50aWwgdGhlIENsaWVudCBjb25maXJtcyBvciBjaGFuZ2VzIHRoZW0uPC9wPjxoNCBjbGFzcz1cIndlc3Rlcm5cIiBpZD1cIk9yZGVycHJvY2Vzc2luZ2FncmVlbWVudC0xMC5EZWxldGlvbmFuZHJldHVybm9mcGVyc29uYWxkYXRhXCI+MTAuIERlbGV0aW9uIGFuZCByZXR1cm4gb2YgcGVyc29uYWwgZGF0YTwvaDQ+PHA+KDEpIENvcGllcyBvciBkdXBsaWNhdGVzIG9mIHRoZSBkYXRhIHNoYWxsIG5ldmVyIGJlIGNyZWF0ZWQgd2l0aG91dCB0aGUga25vd2xlZGdlIG9mIHRoZSBDbGllbnQsIHdpdGggdGhlIGV4Y2VwdGlvbiBvZiBiYWNrLXVwIGNvcGllcyBhcyBmYXIgYXMgdGhleSBhcmUgbmVjZXNzYXJ5IHRvIGVuc3VyZSBvcmRlcmx5IGRhdGEgcHJvY2Vzc2luZywgYXMgd2VsbCBhcyBkYXRhIHJlcXVpcmVkIHRvIG1lZXQgcmVndWxhdG9yeSByZXF1aXJlbWVudHMgdG8gcmV0YWluIGRhdGEuPC9wPjxwPigyKSBBZnRlciBjb25jbHVzaW9uIG9mIHRoZSBjb250cmFjdGVkIHdvcmssIG9yIGVhcmxpZXIgdXBvbiByZXF1ZXN0IGJ5IHRoZSBDbGllbnQsIGF0IHRoZSBsYXRlc3QgdXBvbiB0ZXJtaW5hdGlvbiBvZiB0aGUgU2VydmljZSBBZ3JlZW1lbnQsIHRoZSBTdXBwbGllciBzaGFsbCBoYW5kIG92ZXIgdG8gdGhlIENsaWVudCBvciDigJMgc3ViamVjdCB0byBwcmlvciBjb25zZW50IOKAkyBkZXN0cm95IGFsbCBkb2N1bWVudHMsIHByb2Nlc3NpbmcgYW5kIHV0aWxpemF0aW9uIHJlc3VsdHMsIGFuZCBkYXRhIHNldHMgcmVsYXRlZCB0byB0aGUgQWdyZWVtZW50IHRoYXQgaGF2ZSBjb21lIGludG8gaXRzIHBvc3Nlc3Npb24sIGluIGEgZGF0YS1wcm90ZWN0aW9uIGNvbXBsaWFudCBtYW5uZXIuIFRoZSBzYW1lIGFwcGxpZXMgdG8gYW55IGFuZCBhbGwgY29ubmVjdGVkIHRlc3QsIHdhc3RlLCByZWR1bmRhbnQgYW5kIGRpc2NhcmRlZCBtYXRlcmlhbC4gVGhlIGxvZyBvZiB0aGUgZGVzdHJ1Y3Rpb24gb3IgZGVsZXRpb24gc2hhbGwgYmUgcHJvdmlkZWQgb24gcmVxdWVzdC48L3A+PHA+KDMpIERvY3VtZW50YXRpb24gd2hpY2ggaXMgdXNlZCB0byBkZW1vbnN0cmF0ZSBvcmRlcmx5IGRhdGEgcHJvY2Vzc2luZyBpbiBhY2NvcmRhbmNlIHdpdGggdGhlIEFncmVlbWVudCBzaGFsbCBiZSBzdG9yZWQgYmV5b25kIHRoZSBjb250cmFjdCBkdXJhdGlvbiBieSB0aGUgU3VwcGxpZXIgaW4gYWNjb3JkYW5jZSB3aXRoIHRoZSByZXNwZWN0aXZlIHJldGVudGlvbiBwZXJpb2RzLiBJdCBtYXkgaGFuZCBzdWNoIGRvY3VtZW50YXRpb24gb3ZlciB0byB0aGUgQ2xpZW50IGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRyYWN0IGR1cmF0aW9uIHRvIHJlbGlldmUgdGhlIFN1cHBsaWVyIG9mIHRoaXMgY29udHJhY3R1YWwgb2JsaWdhdGlvbi48L3A+PGg0IGlkPVwiT3JkZXJwcm9jZXNzaW5nYWdyZWVtZW50LTExLkZpbmFscHJvdmlzaW9uc1wiPjExLiBGaW5hbCBwcm92aXNpb25zPC9oND48cCBhbGlnbj1cImp1c3RpZnlcIj4oMSkgVGhpcyBhZ3JlZW1lbnQgc2hhbGwgYmUgZ292ZXJuZWQgYnkgYW5kIGNvbnN0cnVlZCBpbiBhY2NvcmRhbmNlIHdpdGggR2VybWFuIGxhdy4gUGxhY2Ugb2YganVyaXNkaWN0aW9uIHNoYWxsIGJlIEhhbm92ZXIsIEdlcm1hbnkuPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigyKSBBbnkgY2hhbmdlcyBvZiBvciBhbWVuZG1lbnRzIHRvIHRoaXMgQWdyZWVtZW50IG11c3QgYmUgaW4gd3JpdGluZyB0byBiZWNvbWUgZWZmZWN0aXZlLiBUaGlzIGluY2x1ZGVzIGFueSBhbHRlcmF0aW9uIG9mIHRoaXMgd3JpdHRlbiBmb3JtIGNsYXVzZS48L3A+PHAgYWxpZ249XCJqdXN0aWZ5XCIgY2xhc3M9XCJ3ZXN0ZXJuXCI+KDMpIFNob3VsZCBhbnkgcHJvdmlzaW9uIG9mIHRoaXMgQWdyZWVtZW50IGJlIG9yIGJlY29tZSBsZWdhbGx5IGludmFsaWQgb3IgaWYgdGhlcmUgaXMgYW55IHZvaWQgdGhhdCBuZWVkcyB0byBiZSBmaWxsZWQsIHRoZSB2YWxpZGl0eSBvZiB0aGUgcmVtYWluZGVyIG9mIHRoZSBhZ3JlZW1lbnQgc2hhbGwgbm90IGJlIGFmZmVjdGVkIHRoZXJlYnkuIEludmFsaWQgcHJvdmlzaW9ucyBzaGFsbCBiZSByZXBsYWNlZCBieSBjb21tb24gY29uc2VudCB3aXRoIHN1Y2ggcHJvdmlzaW9ucyB3aGljaCBjb21lIGFzIGNsb3NlIGFzIHBvc3NpYmxlIHRvIHRoZSBpbnRlbmRlZCByZXN1bHQgb2YgdGhlIGludmFsaWQgcHJvdmlzaW9uLiBJbiB0aGUgZXZlbnQgb2YgZ2FwcyBzdWNoIHByb3Zpc2lvbiBzaGFsbCBjb21lIGludG8gZm9yY2UgYnkgY29tbW9uIGNvbnNlbnQgd2hpY2ggY29tZXMgYXMgY2xvc2UgYXMgcG9zc2libGUgdG8gdGhlIGludGVuZGVkIHJlc3VsdCBvZiB0aGUgYWdyZWVtZW50LCBzaG91bGQgdGhlIG1hdHRlciBoYXZlIGJlZW4gY29uc2lkZXJlZCBpbiBhZHZhbmNlLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4mbmJzcDs8L3A+Jyxcblx0XHRhcHBlbmRpeDpcblx0XHRcdCc8ZGl2IGNsYXNzPVwicGFnZWJyZWFrXCIgc3R5bGU9XCJicmVhay1iZWZvcmU6YWx3YXlzO1wiPjxwPjwvcD48aDQgaWQ9XCJPcmRlcnByb2Nlc3NpbmdhZ3JlZW1lbnQtQXBwZW5kaXgxLVRlY2huaWNhbGFuZE9yZ2FuaXphdGlvbmFsTWVhc3VyZXNcIj5BcHBlbmRpeCAxIC0gVGVjaG5pY2FsIGFuZCBPcmdhbml6YXRpb25hbCBNZWFzdXJlcyZuYnNwOzwvaDQ+PHA+U3lzdGVtIGFkbWluaXN0cmF0b3JzIGFyZSBoZXJlaW5hZnRlciByZWZlcnJlZCB0byBhcyBcIkRldk9wc1wiLiBUaGUgZm9sbG93aW5nIFRlY2huaWNhbCBhbmQgT3JnYW5pemF0aW9uYWwgTWVhc3VyZXMgaGF2ZSBiZWVuIGltcGxlbWVudGVkOjwvcD48b2w+PGxpPkVudHJhbmNlIGNvbnRyb2w6IEFsbCBzeXN0ZW1zIGFyZSBsb2NhdGVkIGluIElTTyAyNzAwMSBjZXJ0aWZpZWQmbmJzcDtkYXRhIGNlbnRlcnMgaW4gR2VybWFueS4gT25seSBEZXZPcHMgYXJlIGdyYW50ZWQgYWNjZXNzIHRvIHRoZSBwaHlzaWNhbCBzeXN0ZW1zLjwvbGk+PGxpPkF1dGhlbnRpY2F0aW9uIGFjY2VzcyBjb250cm9sOiBVc2VyIGFjY2VzcyBpcyBzZWN1cmVkIHdpdGggc3Ryb25nIHBhc3N3b3JkIHByb3RlY3Rpb24gYWNjb3JkaW5nIHRvIHRoZSBpbnRlcm5hbCBQYXNzd29yZCBQb2xpY3kgb3IgcHVibGljIGtleSBhY2Nlc3MgY29udHJvbCBhcyB3ZWxsIGFzIHNlY29uZCBmYWN0b3IgYXV0aGVudGljYXRpb24gKGUuZy4gWXViaUtleSkuJm5ic3A7VXNlciBhY2Nlc3MgaXMgbWFuYWdlZCBieSBEZXZPcHMuPC9saT48bGk+QXV0aG9yaXphdGlvbiBhY2Nlc3MgY29udHJvbDogRGF0YSByZWNvcmRzIGFyZSBzZWN1cmVkIHdpdGggcm9sZSBiYXNlZCBwZXJtaXNzaW9ucy4gUGVybWlzc2lvbnMgYXJlIG1hbmFnZWQgYnkgRGV2T3BzLjwvbGk+PGxpPkRhdGEgbWVkaXVtIGNvbnRyb2w6IEFsbCBoYXJkIGRpc2NzIGNvbnRhaW5pbmcgcGVyc29uYWwgZGF0YSBhcmUgZW5jcnlwdGVkLiBGaWxlIHBlcm1pc3Npb25zIGFyZSBhbGxvY2F0ZWQgdG8gRGV2T3BzIHVzZXJzL3JvbGVzIGFzIHdlbGwgYXMgYXBwbGljYXRpb24gdXNlcnMvcm9sZXMgdG8gbWFrZSBzdXJlIG5vIHVuYXV0aG9yaXplZCBhY2Nlc3MgdG8gZmlsZXMgaXMgYWxsb3dlZCBmcm9tIGxvZ2dlZCBpbiB1c2VycyBhbmQgcHJvY2Vzc2VzLjwvbGk+PGxpPlRyYW5zZmVyIGNvbnRyb2w6IFRyYW5zZmVyIG9mIHBlcnNvbmFsIGRhdGEgdG8gb3RoZXIgcGFydGllcyBpcyBiZWluZyBsb2dnZWQuJm5ic3A7TG9ncyBpbmNsdWRlIHRoZSB1c2VyL3Byb2Nlc3MgdGhhdCBpbml0aWF0ZWQgdGhlIGlucHV0LCB0aGUgdHlwZSBvZiBwZXJzb25hbCBkYXRhIGFuZCB0aGUgdGltZXN0YW1wLiBUaGUgbG9ncyBhcmUga2VwdCBmb3IgNiBtb250aHMuPC9saT48bGk+SW5wdXQgY29udHJvbDogSW5wdXQgb2YgbmV3IGFuZCB1cGRhdGVkIGFzIHdlbGwgYXMgZGVsZXRpb24gb2YgcGVyc29uYWwgZGF0YSBpcyBsb2dnZWQuIExvZ3MgaW5jbHVkZSB0aGUgdXNlci9wcm9jZXNzIHRoYXQgaW5pdGlhdGVkIHRoZSBpbnB1dCwgdGhlIHR5cGUgb2YgcGVyc29uYWwgZGF0YSBhbmQgdGhlIHRpbWVzdGFtcC4gVGhlIGxvZ3MgYXJlIGtlcHQgZm9yIDYgbW9udGhzLjwvbGk+PGxpPlRyYW5zcG9ydCBjb250cm9sOiBUcmFuc3BvcnQgb2YgcGVyc29uYWwgZGF0YSBmcm9tIGFuZCB0byB0aGUgc3lzdGVtIGFyZSBzZWN1cmVkIHdpdGggc3Ryb25nIFNTTCBhbmQvb3IgZW5kLXRvLWVuZCBlbmNyeXB0aW9uLjwvbGk+PGxpPkNvbmZpZGVudGlhbGl0eTogUGVyc29uYWwgZGF0YSBpcyBzdG9yZWQgZW5kLXRvLWVuZCBlbmNyeXB0ZWQgd2hlcmV2ZXIgcG9zc2libGUuPC9saT48bGk+UmVzdG9yYXRpb24gY29udHJvbDogQWxsIHN5c3RlbXMgaGF2ZSBhIHNlY29uZCBuZXR3b3JrIGludGVyZmFjZSB3aXRoIGFjY2VzcyBmb3IgRGV2T3BzIG9ubHkuIFRoaXMgaW50ZXJmYWNlIGFsbG93cyBhY2Nlc3MgZXZlbiBpZiB0aGUgbWFpbiBpbnRlcmZhY2UgaXMgYmxvY2tlZC4gQ29tcG9uZW50cyBvZiB0aGUgc3lzdGVtIGNhbiBiZSByZXN0YXJ0ZWQgaW4gY2FzZSBvZiBlcnJvciBjb25kaXRpb25zLiBBIERET1MgbWl0aWdhdGlvbiBzZXJ2aWNlIGlzIGF1dG9tYXRpY2FsbHkgYWN0aXZhdGVkIGlmIGEgRERPUyBhdHRhY2sgb2NjdXJzIHRoYXQgbWFrZXMgdGhlIHN5c3RlbSBpbmFjY2Vzc2libGUuPC9saT48bGk+UmVsaWFiaWxpdHk6Jm5ic3A7Jm5ic3A7RGV2T3BzIG1vbml0b3IgYWxsIHN5c3RlbXMgYW5kIGFyZSBub3RpZmllZCBpZiBhbnkgY29tcG9uZW50IG9mIHRoZSBzeXN0ZW0gZmFpbHMgdG8gYmUgYWJsZSB0byBicmluZyBpdCB1cCBhZ2FpbiBpbW1lZGlhdGVseS48L2xpPjxsaT5EYXRhIGludGVncml0eTogQXV0b21hdGljIGVycm9yIGNvcnJlY3Rpb24gb24gZGF0YSBtZWRpdW1zIGFuZCBhbHNvIG9uIGRhdGFiYXNlIGxldmVsIG1ha2Ugc3VyZSB0aGF0IGRhdGEgaW50ZWdyaXR5IGlzIGd1YXJhbnRlZWQuIEFkZGl0aW9uYWxseSB0aGUgaW50ZWdyaXR5IG9mIGVuZC10by1lbmQgZW5jcnlwdGVkIHBlcnNvbmFsIGRhdGEgaXMgZ3VhcmFudGVlZCB0aHJvdWdoIE1BQ3MgZHVyaW5nIGVuY3J5cHRpb24gYW5kIGRlY3J5cHRpb24uPC9saT48bGk+SW5zdHJ1Y3Rpb24gY29udHJvbDogQWxsIGVtcGxveWVlcyBhcmUgYXdhcmUgb2YgdGhlIHB1cnBvc2VzIG9mIHByb2Nlc3NpbmcgYW5kIHJlZ3VsYXJseSBjb21wbGV0ZSZuYnNwO2FuIGludGVybmFsIHNlY3VyaXR5IGF3YXJlbmVzcyBwcm9ncmFtLiAoU3ViKXByb2Nlc3NvcnMgYXJlIGluc3RydWN0ZWQgYnkgd3JpdHRlbiBjb250cmFjdHMuPC9saT48bGk+QXZhaWxhYmlsaXR5IGNvbnRyb2w6IEFsbCBzeXN0ZW1zIGFyZSBsb2NhdGVkIGluIElTTyAyNzAwMSBjZXJ0aWZpZWQmbmJzcDtkYXRhIGNlbnRlcnMgaW4gR2VybWFueSB3aGljaCBndWFyYW50ZWUgdGhlIHBoeXNpY2FsIGF2YWlsYWJpbGl0eSBhbmQgY29ubmVjdGlvbiBvZiB0aGUgc3lzdGVtcy4gQWxsIGxvbmctdGVybSBkYXRhIGlzIHN0b3JlZCBhcyB0aHJlZSByZXBsaWNhcyBvbiBkaWZmZXJlbnQgc2VydmVycyBvciBpbiBhIFJBSUQgc3lzdGVtLiBCYWNrdXBzIGFyZSBjcmVhdGVkIHByaW9yIHRvIHVwZGF0aW5nIGNyaXRpY2FsIHBhcnRzIG9mIHRoZSBzeXN0ZW0uPC9saT48bGk+U2VwYXJhYmlsaXR5OiBTZXBhcmF0ZSBwcm9jZXNzaW5nIGZvciBwZXJzb25hbCBkYXRhIGlzIHNldCB1cCBhcyByZXF1aXJlZC48L2xpPjxsaT5SZXNpbGllbmNlOiBBbGwgc3lzdGVtcyB1c2UgaGlnaGx5IHNjYWxhYmxlIGNvbXBvbmVudHMgdGhhdCBhcmUgZGVzaWduZWQgZm9yIG11Y2ggaGlnaGVyIGxvYWQgdGhhbiBhY3R1YWxseSBuZWVkZWQuIEFsbCBzeXN0ZW1zIGFyZSBleHBhbmRhYmxlIHZlcnkgcXVpY2tseSB0byBjb250aW51b3VzbHkgYWxsb3cgcHJvY2Vzc2luZyBoaWdoZXIgbG9hZHMuPC9saT48L29sPjwvZGl2PlxcbicgK1xuXHRcdFx0XCI8L2Rpdj5cIixcblx0fSxcblx0XCIxX2RlXCI6IHtcblx0XHRoZWFkaW5nOlxuXHRcdFx0JzxkaXYgY2xhc3M9XCJwYXBlcnRleHRcIj48aDIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCIgaWQ9XCJWZXJ0cmFnenVyQXVmdHJhZ3N2ZXJhcmJlaXR1bmctVmVydHJhZ3p1ckF1ZnRyYWdzdmVyYXJiZWl0dW5nXCI+VmVydHJhZyB6dXIgQXVmdHJhZ3N2ZXJhcmJlaXR1bmc8L2gyPjxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPnp3aXNjaGVuPC9wPicsXG5cdFx0Y29udGVudDpcblx0XHRcdCc8cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4tJm5ic3A7VmVyYW50d29ydGxpY2hlciAtPGJyPm5hY2hzdGVoZW5kIEF1ZnRyYWdnZWJlciBnZW5hbm50Jm5ic3A7PC9wPjxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPnVuZDwvcD48cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj5UdXRhbyBHbWJILCBEZWlzdGVyc3RyLiAxN2EsIDMwNDQ5IEhhbm5vdmVyPC9wPjxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPi0mbmJzcDtBdWZ0cmFnc3ZlcmFyYmVpdGVyIC08YnI+bmFjaHN0ZWhlbmQmbmJzcDtBdWZ0cmFnbmVobWVyIGdlbmFubnQ8L3A+PHAgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCI+Jm5ic3A7PC9wPjxoMiBpZD1cIlZlcnRyYWd6dXJBdWZ0cmFnc3ZlcmFyYmVpdHVuZy0xLkdlZ2Vuc3RhbmR1bmREYXVlclwiPjEuJm5ic3A7R2VnZW5zdGFuZCB1bmQgRGF1ZXI8L2gyPjxwPkRlciBHZWdlbnN0YW5kIGRlcyBBdWZ0cmFncyBlcmdpYnQgc2ljaCBhdXMgZGVuIEFHQiBkZXIgVHV0YW8gR21iSCBpbiBkZXIgamV3ZWlscyBnw7xsdGlnZW4gVmVyc2lvbiwgc2llaGUgPHNwYW4gY2xhc3M9XCJub2xpbmtcIj5odHRwczovL3R1dGEuY29tL3Rlcm1zPC9zcGFuPiwgYXVmIGRpZSBoaWVyIHZlcndpZXNlbiB3aXJkIChpbSBGb2xnZW5kZW4gTGVpc3R1bmdzdmVyZWluYmFydW5nKS4gRGVyJm5ic3A7QXVmdHJhZ25laG1lciB2ZXJhcmJlaXRldCBkYWJlaSBwZXJzb25lbmJlem9nZW5lIERhdGVuIGbDvHIgZGVuIEF1ZnRyYWdnZWJlciZuYnNwO2ltIFNpbm5lIHZvbiBBcnQuIDQgTnIuIDIgdW5kIEFydC4gMjggRFMtR1ZPIGF1ZiBHcnVuZGxhZ2UgZGllc2VzIFZlcnRyYWdlcy48L3A+PHA+RGllIERhdWVyIGRpZXNlcyBBdWZ0cmFncyBlbnRzcHJpY2h0IGRlciBpbSBqZXdlaWxpZ2VuIFRhcmlmIGdld8OkaGx0ZW4gVmVydHJhZ3NsYXVmemVpdC48L3A+PGgyIGlkPVwiVmVydHJhZ3p1ckF1ZnRyYWdzdmVyYXJiZWl0dW5nLTIuWndlY2ssRGF0ZW5rYXRlZ29yaWVudW5kYmV0cm9mZmVuZVBlcnNvbmVuXCI+Mi4gWndlY2ssIERhdGVua2F0ZWdvcmllbiB1bmQgYmV0cm9mZmVuZSBQZXJzb25lbjwvaDI+PHA+WnVyIEJlZ3LDvG5kdW5nIGVpbmVzIFZlcnRyYWdzdmVyaMOkbHRuaXNzZXMsIHVuZCB6dXIgTGVpc3R1bmdzZXJicmluZ3VuZyB3aXJkPC9wPjx1bD48bGk+ZGllIG5ldSByZWdpc3RyaWVydGUgRS1NYWlsLUFkcmVzc2U8L2xpPjwvdWw+PHA+YWxzIEJlc3RhbmRzZGF0dW0gZXJmYXNzdC48L3A+PHA+RsO8ciBkaWUgUmVjaG51bmdzc3RlbGx1bmcgdW5kIEJlc3RpbW11bmcgZGVyIFVtc2F0enN0ZXVlciZuYnNwO3dlcmRlbjwvcD48dWw+PGxpPmRlciBTaXR6IGRlcyBLdW5kZW4gKExhbmQpPC9saT48bGk+ZGllIFJlY2hudW5nc2FkcmVzc2U8L2xpPjxsaT5kaWUmbmJzcDtVU3QtSWROci4gKG51ciBmw7xyIEdlc2Now6RmdHNrdW5kZW4gYmVzdGltbXRlciBMw6RuZGVyKTwvbGk+PC91bD48cD5hbHMgQmVzdGFuZHNkYXRlbiBlcmZhc3N0LjwvcD48cD5adXIgQWJ3aWNrbHVuZyB2b24gWmFobHVuZ2VuIHdlcmRlbiwgamUgbmFjaCBnZXfDpGhsdGVyIFphaGx1bmdzYXJ0LCBkaWUgZm9sZ2VuZGVuIFphaGx1bmdzZGF0ZW4gKEJlc3RhbmRzZGF0ZW4pIGVyZmFzc3Q6PC9wPjx1bD48bGk+QmFua3ZlcmJpbmR1bmcgKEtvbnRvbnVtbWVyIHVuZCBCTFogYnp3LiBJQkFOL0JJQywgZ2dmLiBCYW5rbmFtZSwgS29udG9pbmhhYmVyKSw8L2xpPjxsaT5LcmVkaXRrYXJ0ZW5kYXRlbiw8L2xpPjxsaT5kZXIgUGF5UGFsLU51dHplcm5hbWUuPC9saT48L3VsPjxwPlp1ciBBYndpY2tsdW5nIHZvbiBMYXN0c2NocmlmdGVuIHdpcmQgZGllIEJhbmt2ZXJiaW5kdW5nIGFuIGRhcyBiZWF1ZnRyYWd0ZSBLcmVkaXRpbnN0aXR1dCB3ZWl0ZXJnZWdlYmVuLiA8c3Bhbj5adXIgQWJ3aWNrbHVuZyB2b24gUGF5UGFsLVphaGx1bmdlbiB3ZXJkZW4gZGllIFBheVBhbC1aYWhsdW5nc2RhdGVuIGFuIFBheVBhbCAoRXVyb3BlKSB3ZWl0ZXJnZWdlYmVuLiA8L3NwYW4+WnVyIEFid2lja2x1bmcgdm9uJm5ic3A7S3JlZGl0a2FydGVuemFobHVuZ2VuIHdlcmRlbiBkaWUgS3JlZGl0a2FydGVuZGF0ZW4genVyIEF1ZnRyYWdzdmVyYXJiZWl0dW5nIGFuIGRlbiBaYWhsdW5nc2RpZW5zdGxlaXN0ZXImbmJzcDtCcmFpbnRyZWUmbmJzcDt3ZWl0ZXJnZWdlYmVuLiBIaWVyYmVpIGhhbmRlbHQgZXMgc2ljaCB1bSBlaW5lIMOcYmVybWl0dGx1bmcgdm9uIHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIGFuIGVpbiBEcml0dGxhbmQuIEVpbiBtaXQgQnJhaW50cmVlIGdlc2NobG9zc2VuZXIgVmVydHJhZyBzaWVodCBnZWVpZ25ldGUgR2FyYW50aWVuIHZvciB1bmQgc3RlbGx0IHNpY2hlciwgZGFzcyBkaWUgd2VpdGVyZ2VnZWJlbmVuIERhdGVuIG51ciBpbSBFaW5rbGFuZyBtaXQgZGVyIERTR1ZPIHVuZCBsZWRpZ2xpY2ggenVyIEFid2lja2x1bmcgdm9uIFphaGx1bmdlbiB2ZXJ3ZW5kZXQgd2VyZGVuLiBEaWVzZXIgVmVydHJhZyBrYW5uJm5ic3A7aGllciBlaW5nZXNlaGVuIHdlcmRlbjombmJzcDs8c3BhbiBjbGFzcz1cIm5vbGlua1wiPmh0dHBzOi8vd3d3LmJyYWludHJlZXBheW1lbnRzLmNvbS9hc3NldHMvQnJhaW50cmVlLVBTQS1Nb2RlbC1DbGF1c2VzLU1hcmNoMjAxOC5wZGY8L3NwYW4+PC9wPjxwPlR1dGFub3RhIHN0ZWxsdCBEaWVuc3RlIHp1ciBTcGVpY2hlcnVuZywgQmVhcmJlaXR1bmcsIERhcnN0ZWxsdW5nIHVuZCBlbGVrdHJvbmlzY2hlbSBWZXJzYW5kIHZvbiBEYXRlbiBiZXJlaXQsIHdpZSB6LkIuIEUtTWFpbC1TZXJ2aWNlLCBLb250YWt0dmVyd2FsdHVuZyB1bmQgRGF0ZW5hYmxhZ2UuIEltIFJhaG1lbiBkaWVzZXIgSW5oYWx0c2RhdGVuIGvDtm5uZW4gcGVyc29uZW5iZXpvZ2VuZSBEYXRlbiBkZXMgQXVmdHJhZ2dlYmVycyB2ZXJhcmJlaXRldCB3ZXJkZW4uIEFsbGUgdGV4dHVlbGxlbiBJbmhhbHRlIHdlcmRlbiB2ZXJzY2hsw7xzc2VsdCBmw7xyIGRlbiBOdXR6ZXIgdW5kIGRlc3NlbiBLb21tdW5pa2F0aW9uc3BhcnRuZXIgZ2VzcGVpY2hlcnQsIHNvIGRhc3MgZGllIFR1dGFvIEdtYkggc2VsYnN0IGtlaW5lbiBadWdyaWZmIGF1ZiBkaWVzZSBEYXRlbiBoYXQuPC9wPjxwPlp1ciBBdWZyZWNodGVyaGFsdHVuZyBkZXMmbmJzcDtNYWlsc2VydmVyLUJldHJpZWJzLCB6dXIgRmVobGVyZGlhZ25vc2UgdW5kIHp1ciBWZXJoaW5kZXJ1bmcgdm9uIE1pc3NicmF1Y2ggd2VyZGVuIE1haWwtU2VydmVyLUxvZ3MgbWF4aW1hbCAzMCBUYWdlIGdlc3BlaWNoZXJ0LiBEaWVzZSBlbnRoYWx0ZW4gU2VuZGVyLSB1bmQgRW1wZsOkbmdlci1FLU1haWwtQWRyZXNzZW4gc293aWUgZGVuIFplaXRwdW5rdCBkZXIgVmVyYmluZHVuZywgamVkb2NoIGtlaW5lIElQLUFkcmVzc2VuIGRlciBCZW51dHplci48L3A+PHA+WnVyIFNpY2hlcnN0ZWxsdW5nIGRlcyBCZXRyaWVicywgenVyJm5ic3A7VmVyaGluZGVydW5nIHZvbiBNaXNzYnJhdWNoIHVuZCB6dXImbmJzcDtCZXN1Y2hlcmF1c3dlcnR1bmcgd2VyZGVuIElQLUFkcmVzc2VuIGRlciBCZW51dHplciB2ZXJhcmJlaXRldC4gPHNwYW4+RWluZSBTcGVpY2hlcnVuZyBlcmZvbGd0IG51ciBmw7xyIGFub255bWlzaWVydGUgdW5kIGRhbWl0IG5pY2h0IG1laHIgPC9zcGFuPjxzcGFuPnBlcnNvbmVuYmV6b2dlbmUgPC9zcGFuPjxzcGFuPklQLUFkcmVzc2VuLjwvc3Bhbj48L3A+PHA+TWl0IEF1c25haG1lIGRlciBaYWhsdW5nc2RhdGVuIHdlcmRlbiBkaWUgcGVyc29uZW5iZXpvZ2VuZW4gRGF0ZW4gaW5rbHVzaXZlIGRlciBFLU1haWwtQWRyZXNzZSBuaWNodCBhbiBEcml0dGUgd2VpdGVyZ2VnZWJlbi4gSmVkb2NoIGthbm4gVHV0YW8gR21iSCByZWNodGxpY2ggdmVycGZsaWNodGV0IHdlcmRlbiBJbmhhbHRzZGF0ZW4gKGJlaSBWb3JsYWdlIGVpbmVzIGfDvGx0aWdlbiBkZXV0c2NoZW4gR2VyaWNodHNiZXNjaGx1c3Nlcykgc293aWUmbmJzcDtCZXN0YW5kc2RhdGVuIGFuIFN0cmFmdmVyZm9sZ3VuZ3NiZWjDtnJkZW4gYXVzenVsaWVmZXJuLiBFcyBlcmZvbGd0IGtlaW4gVmVya2F1ZiB2b24gRGF0ZW4uPC9wPjxwPkRpZSBFcmJyaW5ndW5nIGRlciB2ZXJ0cmFnbGljaCB2ZXJlaW5iYXJ0ZW4gRGF0ZW52ZXJhcmJlaXR1bmcgZmluZGV0IGF1c3NjaGxpZcOfbGljaCBpbiBlaW5lbSBNaXRnbGllZHNzdGFhdCBkZXIgRXVyb3DDpGlzY2hlbiBVbmlvbiBvZGVyIGluIGVpbmVtIGFuZGVyZW4gVmVydHJhZ3NzdGFhdCBkZXMgQWJrb21tZW5zIMO8YmVyIGRlbiBFdXJvcMOkaXNjaGVuIFdpcnRzY2hhZnRzcmF1bSBzdGF0dC4mbmJzcDtKZWRlIFZlcmxhZ2VydW5nIGluIGVpbiBEcml0dGxhbmQgYmVkYXJmIGRlciB2b3JoZXJpZ2VuIFp1c3RpbW11bmcgZGVzIEF1ZnRyYWdnZWJlcnMgdW5kIGRhcmYgbnVyIGVyZm9sZ2VuLCB3ZW5uIGRpZSBiZXNvbmRlcmVuIFZvcmF1c3NldHp1bmdlbiBkZXIgQXJ0LiA0NCBmZi4gRFMtR1ZPIGVyZsO8bGx0IHNpbmQuJm5ic3A7PC9wPjxwPkRpZSBLYXRlZ29yaWVuIGRlciBkdXJjaCBkaWUgVmVyYXJiZWl0dW5nIGJldHJvZmZlbmVuIFBlcnNvbmVuIHVtZmFzc2VuIGRpZSBkdXJjaCBkZW4gQXVmdHJhZ2dlYmVyIGluIFR1dGFub3RhIGVpbmdlcmljaHRldGUgTnV0emVyIHVuZCBkZXJlbiBLb21tdW5pa2F0aW9uc3BhcnRuZXIuPC9wPjxoMiBpZD1cIlZlcnRyYWd6dXJBdWZ0cmFnc3ZlcmFyYmVpdHVuZy0zLlRlY2huaXNjaC1vcmdhbmlzYXRvcmlzY2hlTWHDn25haG1lblwiPjMuIFRlY2huaXNjaC1vcmdhbmlzYXRvcmlzY2hlIE1hw59uYWhtZW48L2gyPjxwPigxKSBEZXImbmJzcDtBdWZ0cmFnbmVobWVyIGhhdCBkaWUgVW1zZXR6dW5nIGRlciBpbSBWb3JmZWxkIGRlciBBdWZ0cmFnc3ZlcmdhYmUgZGFyZ2VsZWd0ZW4gdW5kIGVyZm9yZGVybGljaGVuIHRlY2huaXNjaGVuIHVuZCBvcmdhbmlzYXRvcmlzY2hlbiBNYcOfbmFobWVuIHZvciBCZWdpbm4gZGVyIFZlcmFyYmVpdHVuZywgaW5zYmVzb25kZXJlIGhpbnNpY2h0bGljaCBkZXIga29ua3JldGVuIEF1ZnRyYWdzZHVyY2hmw7xocnVuZyB6dSBkb2t1bWVudGllcmVuIHVuZCBkZW0mbmJzcDtBdWZ0cmFnZ2ViZXIgenVyIFByw7xmdW5nIHp1IMO8YmVyZ2ViZW4uIEJlaSBBa3plcHRhbnogZHVyY2ggZGVuJm5ic3A7QXVmdHJhZ2dlYmVyJm5ic3A7d2VyZGVuIGRpZSBkb2t1bWVudGllcnRlbiBNYcOfbmFobWVuIEdydW5kbGFnZSBkZXMgQXVmdHJhZ3MuIFNvd2VpdCBkaWUgUHLDvGZ1bmcgZGVzJm5ic3A7QXVmdHJhZ2dlYmVycyBlaW5lbiBBbnBhc3N1bmdzYmVkYXJmIGVyZ2lidCwgaXN0IGRpZXNlciBlaW52ZXJuZWhtbGljaCB1bXp1c2V0emVuPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigyKSBEZXIgQXVmdHJhZ25laG1lciBoYXQgZGllIFNpY2hlcmhlaXQgZ2VtLiBBcnQuIDI4IEFicy4gMyBsaXQuIGMsIDMyIERTLUdWTyBpbnNiZXNvbmRlcmUgaW4gVmVyYmluZHVuZyBtaXQgQXJ0LiA1IEFicy4gMSwgQWJzLiAyIERTLUdWTyBoZXJ6dXN0ZWxsZW4uIEluc2dlc2FtdCBoYW5kZWx0IGVzIHNpY2ggYmVpIGRlbiB6dSB0cmVmZmVuZGVuIE1hw59uYWhtZW4gdW0gTWHDn25haG1lbiBkZXIgRGF0ZW5zaWNoZXJoZWl0IHVuZCB6dXIgR2V3w6RocmxlaXN0dW5nIGVpbmVzIGRlbSBSaXNpa28gYW5nZW1lc3NlbmVuIFNjaHV0em5pdmVhdXMgaGluc2ljaHRsaWNoIGRlciBWZXJ0cmF1bGljaGtlaXQsIGRlciBJbnRlZ3JpdMOkdCwgZGVyIFZlcmbDvGdiYXJrZWl0IHNvd2llIGRlciBCZWxhc3RiYXJrZWl0IGRlciBTeXN0ZW1lLiBEYWJlaSBzaW5kIGRlciBTdGFuZCBkZXIgVGVjaG5paywgZGllIEltcGxlbWVudGllcnVuZ3Nrb3N0ZW4gdW5kIGRpZSBBcnQsIGRlciBVbWZhbmcgdW5kIGRpZSBad2Vja2UgZGVyIFZlcmFyYmVpdHVuZyBzb3dpZSBkaWUgdW50ZXJzY2hpZWRsaWNoZSBFaW50cml0dHN3YWhyc2NoZWlubGljaGtlaXQgdW5kIFNjaHdlcmUgZGVzIFJpc2lrb3MgZsO8ciBkaWUgUmVjaHRlIHVuZCBGcmVpaGVpdGVuIG5hdMO8cmxpY2hlciBQZXJzb25lbiBpbSBTaW5uZSB2b24gQXJ0LiAzMiBBYnMuIDEgRFMtR1ZPIHp1IGJlcsO8Y2tzaWNodGlnZW4gW0VpbnplbGhlaXRlbiBpbiBBbmxhZ2UgMV0uPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigzKSBEaWUgdGVjaG5pc2NoZW4gdW5kIG9yZ2FuaXNhdG9yaXNjaGVuIE1hw59uYWhtZW4gdW50ZXJsaWVnZW4gZGVtIHRlY2huaXNjaGVuIEZvcnRzY2hyaXR0IHVuZCBkZXIgV2VpdGVyZW50d2lja2x1bmcuIEluc293ZWl0IGlzdCBlcyBkZW0gQXVmdHJhZ25laG1lciBnZXN0YXR0ZXQsIGFsdGVybmF0aXZlIGFkw6RxdWF0ZSBNYcOfbmFobWVuIHVtenVzZXR6ZW4uIERhYmVpIGRhcmYgZGFzIFNpY2hlcmhlaXRzbml2ZWF1IGRlciBmZXN0Z2VsZWd0ZW4gTWHDn25haG1lbiBuaWNodCB1bnRlcnNjaHJpdHRlbiB3ZXJkZW4uIFdlc2VudGxpY2hlIMOEbmRlcnVuZ2VuIHNpbmQgenUgZG9rdW1lbnRpZXJlbi48L3A+PGgyIGlkPVwiVmVydHJhZ3p1ckF1ZnRyYWdzdmVyYXJiZWl0dW5nLTQuQmVyaWNodGlndW5nLEVpbnNjaHLDpG5rdW5ndW5kTMO2c2NodW5ndm9uRGF0ZW5cIj40LiBCZXJpY2h0aWd1bmcsIEVpbnNjaHLDpG5rdW5nIHVuZCBMw7ZzY2h1bmcgdm9uIERhdGVuPC9oMj48cCBhbGlnbj1cImp1c3RpZnlcIj4oMSkgRGVyIEF1ZnRyYWduZWhtZXIgZGFyZiBkaWUgRGF0ZW4sIGRpZSBpbSBBdWZ0cmFnIHZlcmFyYmVpdGV0IHdlcmRlbiwgbmljaHQgZWlnZW5tw6RjaHRpZyBzb25kZXJuIG51ciBuYWNoIGRva3VtZW50aWVydGVyIFdlaXN1bmcgZGVzIEF1ZnRyYWdnZWJlcnMgYmVyaWNodGlnZW4sIGzDtnNjaGVuIG9kZXIgZGVyZW4gVmVyYXJiZWl0dW5nIGVpbnNjaHLDpG5rZW4uIFNvd2VpdCBlaW5lIGJldHJvZmZlbmUgUGVyc29uIHNpY2ggZGllc2JlesO8Z2xpY2ggdW5taXR0ZWxiYXIgYW4gZGVuIEF1ZnRyYWduZWhtZXIgd2VuZGV0LCB3aXJkIGRlciBBdWZ0cmFnbmVobWVyIGRpZXNlcyBFcnN1Y2hlbiB1bnZlcnrDvGdsaWNoIGFuIGRlbiBBdWZ0cmFnZ2ViZXIgd2VpdGVybGVpdGVuLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMikgU293ZWl0IHZvbSBMZWlzdHVuZ3N1bWZhbmcgdW1mYXNzdCwgc2luZCBMw7ZzY2hrb256ZXB0LCBSZWNodCBhdWYgVmVyZ2Vzc2Vud2VyZGVuLCBCZXJpY2h0aWd1bmcsIERhdGVucG9ydGFiaWxpdMOkdCB1bmQgQXVza3VuZnQgbmFjaCBkb2t1bWVudGllcnRlciBXZWlzdW5nIGRlcyBBdWZ0cmFnZ2ViZXJzIHVubWl0dGVsYmFyIGR1cmNoIGRlbiBBdWZ0cmFnbmVobWVyIHNpY2hlcnp1c3RlbGxlbi48L3A+PGgyIGlkPVwiVmVydHJhZ3p1ckF1ZnRyYWdzdmVyYXJiZWl0dW5nLTUuUXVhbGl0w6R0c3NpY2hlcnVuZ3VuZHNvbnN0aWdlUGZsaWNodGVuZGVzQXVmdHJhZ25laG1lcnNcIj41LiBRdWFsaXTDpHRzc2ljaGVydW5nIHVuZCBzb25zdGlnZSBQZmxpY2h0ZW4gZGVzIEF1ZnRyYWduZWhtZXJzPC9oMj48cCBhbGlnbj1cImp1c3RpZnlcIj5EZXIgQXVmdHJhZ25laG1lciBoYXQgenVzw6R0emxpY2ggenUgZGVyIEVpbmhhbHR1bmcgZGVyIFJlZ2VsdW5nZW4gZGllc2VzIEF1ZnRyYWdzIGdlc2V0emxpY2hlIFBmbGljaHRlbiBnZW3DpMOfIEFydC4gMjggYmlzIDMzIERTLUdWTzsgaW5zb2Zlcm4gZ2V3w6RocmxlaXN0ZXQgZXIgaW5zYmVzb25kZXJlIGRpZSBFaW5oYWx0dW5nIGZvbGdlbmRlciBWb3JnYWJlbjo8L3A+PG9sPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5EZXIgQXVmdHJhZ25laG1lciBpc3QgbmljaHQgenVyIEJlc3RlbGx1bmcgZWluZXMgRGF0ZW5zY2h1dHpiZWF1ZnRyYWd0ZW4gdmVycGZsaWNodGV0LiBBbHMgQW5zcHJlY2hwYXJ0bmVyIGJlaW0gQXVmdHJhZ25laG1lciB3aXJkIEhlcnIgQXJuZSBNw7ZobGUsIFRlbGVmb246IDA1MTEgMjAyODAxLTExLCBhcm5lLm1vZWhsZUB0dXRhby5kZSwgYmVuYW5udC48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+RGllIFdhaHJ1bmcgZGVyIFZlcnRyYXVsaWNoa2VpdCBnZW3DpMOfIEFydC4gMjggQWJzLiAzIFMuIDIgbGl0LiBiLCAyOSwgMzIgQWJzLiA0IERTLUdWTy4gRGVyIEF1ZnRyYWduZWhtZXIgc2V0enQgYmVpIGRlciBEdXJjaGbDvGhydW5nIGRlciBBcmJlaXRlbiBudXIgQmVzY2jDpGZ0aWd0ZSBlaW4sIGRpZSBhdWYgZGllIFZlcnRyYXVsaWNoa2VpdCB2ZXJwZmxpY2h0ZXQgdW5kIHp1dm9yIG1pdCBkZW4gZsO8ciBzaWUgcmVsZXZhbnRlbiBCZXN0aW1tdW5nZW4genVtIERhdGVuc2NodXR6IHZlcnRyYXV0IGdlbWFjaHQgd3VyZGVuLiBEZXIgQXVmdHJhZ25laG1lciB1bmQgamVkZSBkZW0gQXVmdHJhZ25laG1lciB1bnRlcnN0ZWxsdGUgUGVyc29uLCBkaWUgWnVnYW5nIHp1IHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIGhhdCwgZMO8cmZlbiBkaWVzZSBEYXRlbiBhdXNzY2hsaWXDn2xpY2ggZW50c3ByZWNoZW5kIGRlciBXZWlzdW5nIGRlcyBBdWZ0cmFnZ2ViZXJzIHZlcmFyYmVpdGVuIGVpbnNjaGxpZcOfbGljaCBkZXIgaW4gZGllc2VtIFZlcnRyYWcgZWluZ2Vyw6R1bXRlbiBCZWZ1Z25pc3NlLCBlcyBzZWkgZGVubiwgZGFzcyBzaWUgZ2VzZXR6bGljaCB6dXIgVmVyYXJiZWl0dW5nIHZlcnBmbGljaHRldCBzaW5kLjwvcD48L2xpPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5EaWUgVW1zZXR6dW5nIHVuZCBFaW5oYWx0dW5nIGFsbGVyIGbDvHIgZGllc2VuIEF1ZnRyYWcgZXJmb3JkZXJsaWNoZW4gdGVjaG5pc2NoZW4gdW5kIG9yZ2FuaXNhdG9yaXNjaGVuIE1hw59uYWhtZW4gZ2Vtw6TDnyBBcnQuIDI4IEFicy4gMyBTLiAyIGxpdC4gYywgMzIgRFMtR1ZPIFtFaW56ZWxoZWl0ZW4gaW4gQW5sYWdlIDFdLjwvcD48L2xpPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5EZXIgQXVmdHJhZ2dlYmVyIHVuZCBkZXIgQXVmdHJhZ25laG1lciBhcmJlaXRlbiBhdWYgQW5mcmFnZSBtaXQgZGVyIEF1ZnNpY2h0c2JlaMO2cmRlIGJlaSBkZXIgRXJmw7xsbHVuZyBpaHJlciBBdWZnYWJlbiB6dXNhbW1lbi48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+RGllIHVudmVyesO8Z2xpY2hlIEluZm9ybWF0aW9uIGRlcyBBdWZ0cmFnbmVobWVycyDDvGJlciBLb250cm9sbGhhbmRsdW5nZW4gdW5kIE1hw59uYWhtZW4gZGVyIEF1ZnNpY2h0c2JlaMO2cmRlLCBzb3dlaXQgc2llIHNpY2ggYXVmIGRpZXNlbiBBdWZ0cmFnIGJlemllaGVuLiBEaWVzIGdpbHQgYXVjaCwgc293ZWl0IGVpbmUgenVzdMOkbmRpZ2UgQmVow7ZyZGUgaW0gUmFobWVuIGVpbmVzIE9yZG51bmdzd2lkcmlna2VpdHMtIG9kZXIgU3RyYWZ2ZXJmYWhyZW5zIGluIEJlenVnIGF1ZiBkaWUgVmVyYXJiZWl0dW5nIHBlcnNvbmVuYmV6b2dlbmVyIERhdGVuIGJlaSBkZXIgQXVmdHJhZ3N2ZXJhcmJlaXR1bmcgYmVpbSBBdWZ0cmFnbmVobWVyIGVybWl0dGVsdC48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+U293ZWl0IGRlciBBdWZ0cmFnZ2ViZXIgc2VpbmVyc2VpdHMgZWluZXIgS29udHJvbGxlIGRlciBBdWZzaWNodHNiZWjDtnJkZSwgZWluZW0gT3JkbnVuZ3N3aWRyaWdrZWl0cy0gb2RlciBTdHJhZnZlcmZhaHJlbiwgZGVtIEhhZnR1bmdzYW5zcHJ1Y2ggZWluZXIgYmV0cm9mZmVuZW4gUGVyc29uIG9kZXIgZWluZXMgRHJpdHRlbiBvZGVyIGVpbmVtIGFuZGVyZW4gQW5zcHJ1Y2ggaW0gWnVzYW1tZW5oYW5nIG1pdCBkZXIgQXVmdHJhZ3N2ZXJhcmJlaXR1bmcgYmVpbSBBdWZ0cmFnbmVobWVyIGF1c2dlc2V0enQgaXN0LCBoYXQgaWhuIGRlciBBdWZ0cmFnbmVobWVyIG5hY2ggYmVzdGVuIEtyw6RmdGVuIHp1IHVudGVyc3TDvHR6ZW4uPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPkRlciBBdWZ0cmFnbmVobWVyIGtvbnRyb2xsaWVydCByZWdlbG3DpMOfaWcgZGllIGludGVybmVuIFByb3plc3NlIHNvd2llIGRpZSB0ZWNobmlzY2hlbiB1bmQgb3JnYW5pc2F0b3Jpc2NoZW4gTWHDn25haG1lbiwgdW0genUgZ2V3w6RocmxlaXN0ZW4sIGRhc3MgZGllIFZlcmFyYmVpdHVuZyBpbiBzZWluZW0gVmVyYW50d29ydHVuZ3NiZXJlaWNoIGltIEVpbmtsYW5nIG1pdCBkZW4gQW5mb3JkZXJ1bmdlbiBkZXMgZ2VsdGVuZGVuIERhdGVuc2NodXR6cmVjaHRzIGVyZm9sZ3QgdW5kIGRlciBTY2h1dHogZGVyIFJlY2h0ZSBkZXIgYmV0cm9mZmVuZW4gUGVyc29uIGdld8OkaHJsZWlzdGV0IHdpcmQuPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPk5hY2h3ZWlzYmFya2VpdCBkZXIgZ2V0cm9mZmVuZW4gdGVjaG5pc2NoZW4gdW5kIG9yZ2FuaXNhdG9yaXNjaGVuIE1hw59uYWhtZW4gZ2VnZW7DvGJlciBkZW0gQXVmdHJhZ2dlYmVyIGltIFJhaG1lbiBzZWluZXIgS29udHJvbGxiZWZ1Z25pc3NlIG5hY2ggWmlmZmVyIDcgZGllc2VzIFZlcnRyYWdlcy48L3A+PC9saT48L29sPjxoMiBpZD1cIlZlcnRyYWd6dXJBdWZ0cmFnc3ZlcmFyYmVpdHVuZy02LlVudGVyYXVmdHJhZ3N2ZXJow6RsdG5pc3NlXCI+Ni4gVW50ZXJhdWZ0cmFnc3ZlcmjDpGx0bmlzc2U8L2gyPjxwIGFsaWduPVwianVzdGlmeVwiPigxKSBBbHMgVW50ZXJhdWZ0cmFnc3ZlcmjDpGx0bmlzc2UgaW0gU2lubmUgZGllc2VyIFJlZ2VsdW5nIHNpbmQgc29sY2hlIERpZW5zdGxlaXN0dW5nZW4genUgdmVyc3RlaGVuLCBkaWUgc2ljaCB1bm1pdHRlbGJhciBhdWYgZGllIEVyYnJpbmd1bmcgZGVyIEhhdXB0bGVpc3R1bmcgYmV6aWVoZW4uIE5pY2h0IGhpZXJ6dSBnZWjDtnJlbiBOZWJlbmxlaXN0dW5nZW4sIGRpZSBkZXIgQXVmdHJhZ25laG1lciB3aWUgei5CLiBUZWxla29tbXVuaWthdGlvbnNsZWlzdHVuZ2VuLCBQb3N0LS9UcmFuc3BvcnRkaWVuc3RsZWlzdHVuZ2VuLCBXYXJ0dW5nIHVuZCBCZW51dHplcnNlcnZpY2Ugb2RlciBkaWUgRW50c29yZ3VuZyB2b24gRGF0ZW50csOkZ2VybiBzb3dpZSBzb25zdGlnZSBNYcOfbmFobWVuIHp1ciBTaWNoZXJzdGVsbHVuZyBkZXIgVmVydHJhdWxpY2hrZWl0LCBWZXJmw7xnYmFya2VpdCwgSW50ZWdyaXTDpHQgdW5kIEJlbGFzdGJhcmtlaXQgZGVyIEhhcmQtIHVuZCBTb2Z0d2FyZSB2b24gRGF0ZW52ZXJhcmJlaXR1bmdzYW5sYWdlbiBpbiBBbnNwcnVjaCBuaW1tdC4gRGVyIEF1ZnRyYWduZWhtZXIgaXN0IGplZG9jaCB2ZXJwZmxpY2h0ZXQsIHp1ciBHZXfDpGhybGVpc3R1bmcgZGVzIERhdGVuc2NodXR6ZXMgdW5kIGRlciBEYXRlbnNpY2hlcmhlaXQgZGVyIERhdGVuIGRlcyBBdWZ0cmFnZ2ViZXJzIGF1Y2ggYmVpIGF1c2dlbGFnZXJ0ZW4gTmViZW5sZWlzdHVuZ2VuIGFuZ2VtZXNzZW5lIHVuZCBnZXNldHplc2tvbmZvcm1lIHZlcnRyYWdsaWNoZSBWZXJlaW5iYXJ1bmdlbiBzb3dpZSBLb250cm9sbG1hw59uYWhtZW4genUgZXJncmVpZmVuLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMikgRGVyIEF1ZnRyYWduZWhtZXIgZGFyZiBVbnRlcmF1ZnRyYWduZWhtZXIgKHdlaXRlcmUgQXVmdHJhZ3N2ZXJhcmJlaXRlcikgbnVyIG5hY2ggdm9yaGVyaWdlciBhdXNkcsO8Y2tsaWNoZXIgc2NocmlmdGxpY2hlciBiencuIGRva3VtZW50aWVydGVyIFp1c3RpbW11bmcgZGVzIEF1ZnRyYWdnZWJlcnMgYmVhdWZ0cmFnZW4uPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigzKSBEaWUgQXVzbGFnZXJ1bmcgYXVmIFVudGVyYXVmdHJhZ25laG1lciBzb3dpZSBkZXImbmJzcDtXZWNoc2VsIGRlciBiZXN0ZWhlbmRlbiBVbnRlcmF1ZnRyYWduZWhtZXIgc2luZCB6dWzDpHNzaWcsIHNvd2VpdDo8L3A+PHVsPjxsaT5kZXIgQXVmdHJhZ25laG1lciBlaW5lIHNvbGNoZSBBdXNsYWdlcnVuZyBhdWYgVW50ZXJhdWZ0cmFnbmVobWVyIGRlbSBBdWZ0cmFnZ2ViZXIgZWluZSBhbmdlbWVzc2VuZSBaZWl0IHZvcmFiIHNjaHJpZnRsaWNoIG9kZXIgaW4gVGV4dGZvcm0gYW56ZWlndCB1bmQ8L2xpPjxsaT5kZXIgQXVmdHJhZ2dlYmVyIG5pY2h0IGJpcyB6dW0gWmVpdHB1bmt0IGRlciDDnGJlcmdhYmUgZGVyIERhdGVuIGdlZ2Vuw7xiZXIgZGVtIEF1ZnRyYWduZWhtZXIgc2NocmlmdGxpY2ggb2RlciBpbiBUZXh0Zm9ybSBFaW5zcHJ1Y2ggZ2VnZW4gZGllIGdlcGxhbnRlIEF1c2xhZ2VydW5nIGVyaGVidCB1bmQ8L2xpPjxsaT5laW5lIHZlcnRyYWdsaWNoZSBWZXJlaW5iYXJ1bmcgbmFjaCBNYcOfZ2FiZSBkZXMgQXJ0LiAyOCBBYnMuIDItNCBEUy1HVk8genVncnVuZGUgZ2VsZWd0IHdpcmQuPC9saT48L3VsPjxwIGFsaWduPVwianVzdGlmeVwiPig0KSBEaWUgV2VpdGVyZ2FiZSB2b24gcGVyc29uZW5iZXpvZ2VuZW4gRGF0ZW4gZGVzIEF1ZnRyYWdnZWJlcnMgYW4gZGVuIFVudGVyYXVmdHJhZ25laG1lciB1bmQgZGVzc2VuIGVyc3RtYWxpZ2VzIFTDpHRpZ3dlcmRlbiBzaW5kIGVyc3QgbWl0IFZvcmxpZWdlbiBhbGxlciBWb3JhdXNzZXR6dW5nZW4gZsO8ciBlaW5lIFVudGVyYmVhdWZ0cmFndW5nIGdlc3RhdHRldC48L3A+PHAgYWxpZ249XCJqdXN0aWZ5XCI+KDUpIEVyYnJpbmd0IGRlciBVbnRlcmF1ZnRyYWduZWhtZXIgZGllIHZlcmVpbmJhcnRlIExlaXN0dW5nIGF1w59lcmhhbGIgZGVyIEVVL2RlcyBFV1Igc3RlbGx0IGRlciBBdWZ0cmFnbmVobWVyIGRpZSBkYXRlbnNjaHV0enJlY2h0bGljaGUgWnVsw6Rzc2lna2VpdCBkdXJjaCBlbnRzcHJlY2hlbmRlIE1hw59uYWhtZW4gc2ljaGVyLiBHbGVpY2hlcyBnaWx0LCB3ZW5uIERpZW5zdGxlaXN0ZXIgaW0gU2lubmUgdm9uIEFicy4gMSBTYXR6IDIgZWluZ2VzZXR6dCB3ZXJkZW4gc29sbGVuLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oNikgRWluZSB3ZWl0ZXJlIEF1c2xhZ2VydW5nIGR1cmNoIGRlbiBVbnRlcmF1ZnRyYWduZWhtZXIgYmVkYXJmIGRlciBhdXNkcsO8Y2tsaWNoZW4gWnVzdGltbXVuZyBkZXMgSGF1cHRhdWZ0cmFnZ2ViZXJzIChtaW5kLiBUZXh0Zm9ybSkuPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPig3KSBTw6RtdGxpY2hlIHZlcnRyYWdsaWNoZW4gUmVnZWx1bmdlbiBpbiBkZXIgVmVydHJhZ3NrZXR0ZSBzaW5kIGF1Y2ggZGVtIHdlaXRlcmVuIFVudGVyYXVmdHJhZ25laG1lciBhdWZ6dWVybGVnZW4uPC9wPjxoMiBjbGFzcz1cIndlc3Rlcm5cIiBpZD1cIlZlcnRyYWd6dXJBdWZ0cmFnc3ZlcmFyYmVpdHVuZy03LktvbnRyb2xscmVjaHRlZGVzQXVmdHJhZ2dlYmVyc1wiPjcuIEtvbnRyb2xscmVjaHRlIGRlcyBBdWZ0cmFnZ2ViZXJzPC9oMj48cCBhbGlnbj1cImp1c3RpZnlcIj4oMSkgRGVyIEF1ZnRyYWdnZWJlciBoYXQgZGFzIFJlY2h0LCBpbSBCZW5laG1lbiBtaXQgZGVtIEF1ZnRyYWduZWhtZXIgw5xiZXJwcsO8ZnVuZ2VuIGR1cmNoenVmw7xocmVuIG9kZXIgZHVyY2ggaW0gRWluemVsZmFsbCB6dSBiZW5lbm5lbmRlIFByw7xmZXIgZHVyY2hmw7xocmVuIHp1IGxhc3Nlbi4gRXIgaGF0IGRhcyBSZWNodCwgc2ljaCBkdXJjaCBTdGljaHByb2JlbmtvbnRyb2xsZW4sIGRpZSBpbiBkZXIgUmVnZWwgcmVjaHR6ZWl0aWcgYW56dW1lbGRlbiBzaW5kLCB2b24gZGVyIEVpbmhhbHR1bmcgZGllc2VyIFZlcmVpbmJhcnVuZyBkdXJjaCBkZW4gQXVmdHJhZ25laG1lciBpbiBkZXNzZW4gR2VzY2jDpGZ0c2JldHJpZWIgenUgw7xiZXJ6ZXVnZW4uPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigyKSBEZXIgQXVmdHJhZ25laG1lciBzdGVsbHQgc2ljaGVyLCBkYXNzIHNpY2ggZGVyIEF1ZnRyYWdnZWJlciB2b24gZGVyIEVpbmhhbHR1bmcgZGVyIFBmbGljaHRlbiBkZXMgQXVmdHJhZ25laG1lcnMgbmFjaCBBcnQuIDI4IERTLUdWTyDDvGJlcnpldWdlbiBrYW5uLiBEZXIgQXVmdHJhZ25laG1lciB2ZXJwZmxpY2h0ZXQgc2ljaCwgZGVtIEF1ZnRyYWdnZWJlciBhdWYgQW5mb3JkZXJ1bmcgZGllIGVyZm9yZGVybGljaGVuIEF1c2vDvG5mdGUgenUgZXJ0ZWlsZW4gdW5kIGluc2Jlc29uZGVyZSBkaWUgVW1zZXR6dW5nIGRlciB0ZWNobmlzY2hlbiB1bmQgb3JnYW5pc2F0b3Jpc2NoZW4gTWHDn25haG1lbiBuYWNoenV3ZWlzZW4uPC9wPjxwIGFsaWduPVwianVzdGlmeVwiPigzKSBEZXIgTmFjaHdlaXMgc29sY2hlciBNYcOfbmFobWVuLCBkaWUgbmljaHQgbnVyIGRlbiBrb25rcmV0ZW4gQXVmdHJhZyBiZXRyZWZmZW4sIGthbm4gZXJmb2xnZW4gZHVyY2g8L3A+PHVsPjxsaT5kaWUgRWluaGFsdHVuZyBnZW5laG1pZ3RlciBWZXJoYWx0ZW5zcmVnZWxuIGdlbcOkw58gQXJ0LiA0MCBEUy1HVk87PC9saT48bGk+ZGllIFplcnRpZml6aWVydW5nIG5hY2ggZWluZW0gZ2VuZWhtaWd0ZW4gWmVydGlmaXppZXJ1bmdzdmVyZmFocmVuIGdlbcOkw58gQXJ0LiA0MiBEUy1HVk87PC9saT48bGk+YWt0dWVsbGUgVGVzdGF0ZSwgQmVyaWNodGUgb2RlciBCZXJpY2h0c2F1c3rDvGdlIHVuYWJow6RuZ2lnZXIgSW5zdGFuemVuICh6LkIuIFdpcnRzY2hhZnRzcHLDvGZlciwgUmV2aXNpb24sIERhdGVuc2NodXR6YmVhdWZ0cmFndGVyLCBJVC1TaWNoZXJoZWl0c2FidGVpbHVuZywgRGF0ZW5zY2h1dHphdWRpdG9yZW4sIFF1YWxpdMOkdHNhdWRpdG9yZW4pOzwvbGk+PGxpPmVpbmUgZ2VlaWduZXRlIFplcnRpZml6aWVydW5nIGR1cmNoIElULVNpY2hlcmhlaXRzLSBvZGVyIERhdGVuc2NodXR6YXVkaXQgKHouQi4gbmFjaCBCU0ktR3J1bmRzY2h1dHopLjwvbGk+PC91bD48cCBhbGlnbj1cImp1c3RpZnlcIj4oNCkgRsO8ciBkaWUgRXJtw7ZnbGljaHVuZyB2b24gS29udHJvbGxlbiBkdXJjaCBkZW4gQXVmdHJhZ2dlYmVyIGthbm4gZGVyIEF1ZnRyYWduZWhtZXIgZWluZW4gVmVyZ8O8dHVuZ3NhbnNwcnVjaCBnZWx0ZW5kIG1hY2hlbi48L3A+PGgyIGNsYXNzPVwid2VzdGVyblwiIGlkPVwiVmVydHJhZ3p1ckF1ZnRyYWdzdmVyYXJiZWl0dW5nLTguTWl0dGVpbHVuZ2JlaVZlcnN0w7bDn2VuZGVzQXVmdHJhZ25laG1lcnNcIj44LiBNaXR0ZWlsdW5nIGJlaSBWZXJzdMO2w59lbiBkZXMgQXVmdHJhZ25laG1lcnM8L2gyPjxwIGFsaWduPVwianVzdGlmeVwiPigxKSBEZXIgQXVmdHJhZ25laG1lciB1bnRlcnN0w7x0enQgZGVuIEF1ZnRyYWdnZWJlciBiZWkgZGVyIEVpbmhhbHR1bmcgZGVyIGluIGRlbiBBcnRpa2VsbiAzMiBiaXMgMzYgZGVyIERTLUdWTyBnZW5hbm50ZW4gUGZsaWNodGVuIHp1ciBTaWNoZXJoZWl0IHBlcnNvbmVuYmV6b2dlbmVyIERhdGVuLCBNZWxkZXBmbGljaHRlbiBiZWkgRGF0ZW5wYW5uZW4sIERhdGVuc2NodXR6LUZvbGdlYWJzY2jDpHR6dW5nZW4gdW5kIHZvcmhlcmlnZSBLb25zdWx0YXRpb25lbi4gSGllcnp1IGdlaMO2cmVuIHUuYS48L3A+PG9sPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5kaWUgU2ljaGVyc3RlbGx1bmcgZWluZXMgYW5nZW1lc3NlbmVuIFNjaHV0em5pdmVhdXMgZHVyY2ggdGVjaG5pc2NoZSB1bmQgb3JnYW5pc2F0b3Jpc2NoZSBNYcOfbmFobWVuLCBkaWUgZGllIFVtc3TDpG5kZSB1bmQgWndlY2tlIGRlciBWZXJhcmJlaXR1bmcgc293aWUgZGllIHByb2dub3N0aXppZXJ0ZSBXYWhyc2NoZWlubGljaGtlaXQgdW5kIFNjaHdlcmUgZWluZXIgbcO2Z2xpY2hlbiBSZWNodHN2ZXJsZXR6dW5nIGR1cmNoIFNpY2hlcmhlaXRzbMO8Y2tlbiBiZXLDvGNrc2ljaHRpZ2VuIHVuZCBlaW5lIHNvZm9ydGlnZSBGZXN0c3RlbGx1bmcgdm9uIHJlbGV2YW50ZW4gVmVybGV0enVuZ3NlcmVpZ25pc3NlbiBlcm3DtmdsaWNoZW48L3A+PC9saT48bGk+PHAgYWxpZ249XCJqdXN0aWZ5XCI+ZGllIFZlcnBmbGljaHR1bmcsIFZlcmxldHp1bmdlbiBwZXJzb25lbmJlem9nZW5lciBEYXRlbiB1bnZlcnrDvGdsaWNoIGFuIGRlbiBBdWZ0cmFnZ2ViZXIgenUgbWVsZGVuPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPmRpZSBWZXJwZmxpY2h0dW5nLCBkZW0gQXVmdHJhZ2dlYmVyIGltIFJhaG1lbiBzZWluZXIgSW5mb3JtYXRpb25zcGZsaWNodCBnZWdlbsO8YmVyIGRlbSBCZXRyb2ZmZW5lbiB6dSB1bnRlcnN0w7x0emVuIHVuZCBpaG0gaW4gZGllc2VtIFp1c2FtbWVuaGFuZyBzw6RtdGxpY2hlIHJlbGV2YW50ZSBJbmZvcm1hdGlvbmVuIHVudmVyesO8Z2xpY2ggenVyIFZlcmbDvGd1bmcgenUgc3RlbGxlbjwvcD48L2xpPjxsaT48cCBhbGlnbj1cImp1c3RpZnlcIj5kaWUgVW50ZXJzdMO8dHp1bmcgZGVzIEF1ZnRyYWdnZWJlcnMgZsO8ciBkZXNzZW4gRGF0ZW5zY2h1dHotRm9sZ2VuYWJzY2jDpHR6dW5nPC9wPjwvbGk+PGxpPjxwIGFsaWduPVwianVzdGlmeVwiPmRpZSBVbnRlcnN0w7x0enVuZyBkZXMgQXVmdHJhZ2dlYmVycyBpbSBSYWhtZW4gdm9yaGVyaWdlciBLb25zdWx0YXRpb25lbiBtaXQgZGVyIEF1ZnNpY2h0c2JlaMO2cmRlPC9wPjwvbGk+PC9vbD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMikgRsO8ciBVbnRlcnN0w7x0enVuZ3NsZWlzdHVuZ2VuLCBkaWUgbmljaHQgaW4gZGVyIExlaXN0dW5nc2Jlc2NocmVpYnVuZyBlbnRoYWx0ZW4gb2RlciBuaWNodCBhdWYgZWluIEZlaGx2ZXJoYWx0ZW4gZGVzIEF1ZnRyYWduZWhtZXJzIHp1csO8Y2t6dWbDvGhyZW4gc2luZCwga2FubiBkZXIgQXVmdHJhZ25laG1lciBlaW5lIFZlcmfDvHR1bmcgYmVhbnNwcnVjaGVuLjwvcD48aDIgY2xhc3M9XCJ3ZXN0ZXJuXCIgaWQ9XCJWZXJ0cmFnenVyQXVmdHJhZ3N2ZXJhcmJlaXR1bmctOS5XZWlzdW5nc2JlZnVnbmlzZGVzQXVmdHJhZ2dlYmVyc1wiPjkuIFdlaXN1bmdzYmVmdWduaXMgZGVzIEF1ZnRyYWdnZWJlcnM8L2gyPjxwIGFsaWduPVwianVzdGlmeVwiPigxKSBNw7xuZGxpY2hlIFdlaXN1bmdlbiBiZXN0w6R0aWd0IGRlciBBdWZ0cmFnZ2ViZXIgdW52ZXJ6w7xnbGljaCAobWluZC4gVGV4dGZvcm0pLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMikgRGVyIEF1ZnRyYWduZWhtZXIgaGF0IGRlbiBBdWZ0cmFnZ2ViZXIgdW52ZXJ6w7xnbGljaCB6dSBpbmZvcm1pZXJlbiwgd2VubiBlciBkZXIgTWVpbnVuZyBpc3QsIGVpbmUgV2Vpc3VuZyB2ZXJzdG/Dn2UgZ2VnZW4gRGF0ZW5zY2h1dHp2b3JzY2hyaWZ0ZW4uIERlciBBdWZ0cmFnbmVobWVyIGlzdCBiZXJlY2h0aWd0LCBkaWUgRHVyY2hmw7xocnVuZyBkZXIgZW50c3ByZWNoZW5kZW4gV2Vpc3VuZyBzb2xhbmdlIGF1c3p1c2V0emVuLCBiaXMgc2llIGR1cmNoIGRlbiBBdWZ0cmFnZ2ViZXIgYmVzdMOkdGlndCBvZGVyIGdlw6RuZGVydCB3aXJkLjwvcD48aDIgY2xhc3M9XCJ3ZXN0ZXJuXCIgaWQ9XCJWZXJ0cmFnenVyQXVmdHJhZ3N2ZXJhcmJlaXR1bmctMTAuTMO2c2NodW5ndW5kUsO8Y2tnYWJldm9ucGVyc29uZW5iZXpvZ2VuZW5EYXRlblwiPjEwLiBMw7ZzY2h1bmcgdW5kIFLDvGNrZ2FiZSB2b24gcGVyc29uZW5iZXpvZ2VuZW4gRGF0ZW48L2gyPjxwIGFsaWduPVwianVzdGlmeVwiPigxKSBLb3BpZW4gb2RlciBEdXBsaWthdGUgZGVyIERhdGVuIHdlcmRlbiBvaG5lIFdpc3NlbiBkZXMgQXVmdHJhZ2dlYmVycyBuaWNodCBlcnN0ZWxsdC4gSGllcnZvbiBhdXNnZW5vbW1lbiBzaW5kIFNpY2hlcmhlaXRza29waWVuLCBzb3dlaXQgc2llIHp1ciBHZXfDpGhybGVpc3R1bmcgZWluZXIgb3JkbnVuZ3NnZW3DpMOfZW4gRGF0ZW52ZXJhcmJlaXR1bmcgZXJmb3JkZXJsaWNoIHNpbmQsIHNvd2llIERhdGVuLCBkaWUgaW0gSGluYmxpY2sgYXVmIGRpZSBFaW5oYWx0dW5nIGdlc2V0emxpY2hlciBBdWZiZXdhaHJ1bmdzcGZsaWNodGVuIGVyZm9yZGVybGljaCBzaW5kLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMikgTmFjaCBBYnNjaGx1c3MgZGVyIHZlcnRyYWdsaWNoIHZlcmVpbmJhcnRlbiBBcmJlaXRlbiBvZGVyIGZyw7xoZXIgbmFjaCBBdWZmb3JkZXJ1bmcgZHVyY2ggZGVuIEF1ZnRyYWdnZWJlciDigJMgc3DDpHRlc3RlbnMgbWl0IEJlZW5kaWd1bmcgZGVyIExlaXN0dW5nc3ZlcmVpbmJhcnVuZyDigJMgaGF0IGRlciBBdWZ0cmFnbmVobWVyIHPDpG10bGljaGUgaW4gc2VpbmVuIEJlc2l0eiBnZWxhbmd0ZW4gVW50ZXJsYWdlbiwgZXJzdGVsbHRlIFZlcmFyYmVpdHVuZ3MtIHVuZCBOdXR6dW5nc2VyZ2Vibmlzc2Ugc293aWUgRGF0ZW5iZXN0w6RuZGUsIGRpZSBpbSBadXNhbW1lbmhhbmcgbWl0IGRlbSBBdWZ0cmFnc3ZlcmjDpGx0bmlzIHN0ZWhlbiwgZGVtIEF1ZnRyYWdnZWJlciBhdXN6dWjDpG5kaWdlbiBvZGVyIG5hY2ggdm9yaGVyaWdlciBadXN0aW1tdW5nIGRhdGVuc2NodXR6Z2VyZWNodCB6dSB2ZXJuaWNodGVuLiBHbGVpY2hlcyBnaWx0IGbDvHIgVGVzdC0gdW5kIEF1c3NjaHVzc21hdGVyaWFsLiBEYXMgUHJvdG9rb2xsIGRlciBMw7ZzY2h1bmcgaXN0IGF1ZiBBbmZvcmRlcnVuZyB2b3J6dWxlZ2VuLjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4oMykgRG9rdW1lbnRhdGlvbmVuLCBkaWUgZGVtIE5hY2h3ZWlzIGRlciBhdWZ0cmFncy0gdW5kIG9yZG51bmdzZ2Vtw6TDn2VuIERhdGVudmVyYXJiZWl0dW5nIGRpZW5lbiwgc2luZCBkdXJjaCBkZW4gQXVmdHJhZ25laG1lciBlbnRzcHJlY2hlbmQgZGVyIGpld2VpbGlnZW4gQXVmYmV3YWhydW5nc2ZyaXN0ZW4gw7xiZXIgZGFzIFZlcnRyYWdzZW5kZSBoaW5hdXMgYXVmenViZXdhaHJlbi4gRXIga2FubiBzaWUgenUgc2VpbmVyIEVudGxhc3R1bmcgYmVpIFZlcnRyYWdzZW5kZSBkZW0gQXVmdHJhZ2dlYmVyIMO8YmVyZ2ViZW4uPC9wPjxoMiBpZD1cIlZlcnRyYWd6dXJBdWZ0cmFnc3ZlcmFyYmVpdHVuZy0xMS5TY2hsdXNzYmVzdGltbXVuZ2VuXCI+MTEuIFNjaGx1c3NiZXN0aW1tdW5nZW48L2gyPjxwIGFsaWduPVwianVzdGlmeVwiPigxKSA8c3Bhbj5EaWVzZXIgVmVydHJhZyB1bnRlcmxpZWd0IGRlbSBSZWNodCBkZXIgQnVuZGVzcmVwdWJsaWsgRGV1dHNjaGxhbmQuIEdlcmljaHRzc3RhbmQgaXN0IEhhbm5vdmVyLjwvc3Bhbj48L3A+PHAgYWxpZ249XCJqdXN0aWZ5XCI+PHNwYW4+KDIpIMOEbmRlcnVuZ2VuIHVuZCBFcmfDpG56dW5nZW4gZGllc2VzIFZlcnRyYWdzIGJlZMO8cmZlbiBkZXIgU2NocmlmdGZvcm0uIERpZXMgZ2lsdCBhdWNoIGbDvHIgZGVuIFZlcnppY2h0IGF1ZiBkYXMgU2NocmlmdGZvcm1lcmZvcmRlcm5pcy48L3NwYW4+PC9wPjxwIGFsaWduPVwianVzdGlmeVwiIGNsYXNzPVwid2VzdGVyblwiPigzKSA8c3Bhbj5Tb2xsdGVuIGVpbnplbG5lIEJlc3RpbW11bmdlbiBkaWVzZXMgVmVydHJhZ3MgdW53aXJrc2FtIHNlaW4gb2RlciB3ZXJkZW4sIHNvIHdpcmQgZGFkdXJjaCBkaWUgR8O8bHRpZ2tlaXQgZGVyIMO8YnJpZ2VuIEJlc3RpbW11bmdlbiBuaWNodCBiZXLDvGhydC4gRGllIFZlcnRyYWdzcGFydGVpZW4gdmVycGZsaWNodGVuIHNpY2ggaW4gZGllc2VuIEbDpGxsZW4sIGFuc3RlbGxlIGRlciBldHdhIHVud2lya3NhbWVuIEJlc3RpbW11bmcoZW4pIOKAkyBtaXQgV2lya3VuZyB2b24gQmVnaW5uIGRlciBVbndpcmtzYW1rZWl0IGFuIOKAkyBlaW5lIEVyc2F0enJlZ2VsdW5nIG9kZXIgZ2dmLiBlaW5lbiBuZXVlbiB3aXJrc2FtZW4gVmVydHJhZyB6dSB2ZXJlaW5iYXJlbiwgZGllIGJ6dy4gZGVyIGRlbSB3aXJ0c2NoYWZ0bGljaGVuIGdld29sbHRlbiBad2VjayBkZXIgdW53aXJrc2FtZW4gQmVzdGltbXVuZyhlbikgd2VpdGdlaGVuZCBlbnRzcHJpY2h0IG9kZXIgYW0gbsOkY2hzdGVuIGtvbW10LiBEaWVzIGdpbHQgYXVjaCBmw7xyIGRlbiBGYWxsLCBkYXNzIGRlciBWZXJ0cmFnIGVpbmUgUmVnZWx1bmdzbMO8Y2tlIGVudGhhbHRlbiBzb2xsdGUuPC9zcGFuPjwvcD48cCBhbGlnbj1cImp1c3RpZnlcIj4mbmJzcDs8L3A+Jyxcblx0XHRhcHBlbmRpeDpcblx0XHRcdCc8ZGl2IGNsYXNzPVwicGFnZWJyZWFrXCIgc3R5bGU9XCJicmVhay1iZWZvcmU6YWx3YXlzO1wiPjxwPjwvcD48aDIgaWQ9XCJWZXJ0cmFnenVyQXVmdHJhZ3N2ZXJhcmJlaXR1bmctQW5sYWdlMShUZWNobmlzY2hldW5kb3JnYW5pc2F0b3Jpc2NoZU1hw59uYWhtZW4pXCI+QW5sYWdlIDEgKFRlY2huaXNjaGUgdW5kIG9yZ2FuaXNhdG9yaXNjaGUgTWHDn25haG1lbik8L2gyPjxwPkRpZSBTeXN0ZW1hZG1pbmlzdHJhdG9yZW4gd2VyZGVuIGltIEZvbGdlbmRlbiBcIkRldk9wc1wiIGdlbmFubnQuIEZvbGdlbmRlIE1hw59uYWhtZW4gd3VyZGVuIGdldHJvZmZlbjo8L3A+PG9sPjxsaT5adXRyaXR0c2tvbnRyb2xsZTogQWxsZSBTeXN0ZW1lIHNpbmQgaW4gSVNPIDI3MDAxIHplcnRpZml6aWVydGVuIFJlY2hlbnplbnRyZW4gaW4gRGV1dHNjaGxhbmQgZ2Vob3N0ZXQuIE51ciBEZXZPcHMgaGFiZW4gWnV0cml0dCB6dSBkZW4gcGh5c2lzY2hlbiBTeXN0ZW1lbi48L2xpPjxsaT5adWdhbmdza29udHJvbGxlL0JlbnV0emVya29udHJvbGxlOiBEZXIgWnVncmlmZiBkdXJjaCBCZW51dHplciBpc3QgbWl0IHN0YXJrZW4gUGFzc3fDtnJ0ZXJuIGVudHNwcmVjaGVuZCBkZW4gaW50ZXJuZW4gUGFzc3dvcnRyZWdlbG4gb2RlciBQdWJsaWMtS2V5LVp1Z3JpZmYgdW5kIFp3ZWktRmFrdG9yLUF1dGhlbnRpZml6aWVydW5nIChlLmcuIFl1YmlLZXkpIGdlc2ljaGVydC4mbmJzcDtCZW51dHplcnp1Z3JpZmYgd2lyZCB2b24gRGV2T3BzIHZlcndhbHRldC48L2xpPjxsaT5adWdyaWZmc2tvbnRyb2xsZS9TcGVpY2hlcmtvbnRyb2xsZTogRGF0ZW5zw6R0emUgc2luZCBtaXQgcm9sbGVuYmFzaWVydGVuIEJlcmVjaHRpZ3VuZ2VuIGdlc2Now7x0enQuIEJlcmVjaHRpZ3VuZ2VuIHdlcmRlbiB2b24gRGV2T3BzIHZlcndhbHRldC48L2xpPjxsaT5EYXRlbnRyw6RnZXJrb250cm9sbGU6IDxzcGFuPkFsbGUgRmVzdHBsYXR0ZW4gbWl0IHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIHNpbmQgdmVyc2Now7xzc2VsdC4gRGF0ZWliZXJlY2h0aWd1bmdlbiBzaW5kIGbDvHIgRGV2T3BzIHNvd2llIEFud2VuZHVuZ2VuIHNvIHZlcmdlYmVuLCBkYXNzIHVuYmVyZWNodGlndGVyIFp1Z3JpZmYgYXVmIERhdGVpZW4gdm9uIGVpbmdlbG9nZ3RlbiBCZW51dHplcm4gdW5kIFByb3plc3NlbiB2ZXJoaW5kZXJ0IHdpcmQuPC9zcGFuPjwvbGk+PGxpPsOcYmVydHJhZ3VuZ3Nrb250cm9sbGUvV2VpdGVyZ2FiZWtvbnRyb2xsZTogV2VpdGVyZ2FiZSB2b24gcGVyc29uZW5iZXpvZ2VuZW4gRGF0ZW4gYW4gYW5kZXJlIEVtcGbDpG5nZXIgd2lyZCBwcm90b2tvbGxpZXJ0LiZuYnNwO0RpZSBQcm90b2tvbGxlIGVudGhhbHRlbiBkZW4gQmVudXR6ZXIvUHJvemVzcywgZGVyIGRpZSBFaW5nYWJlIGluaXRpaWVydCBoYXQsIGRpZSBLYXRlZ29yaWUgcGVyc29uZW5iZXpvZ2VuZXIgRGF0ZW4gdW5kIGRlbiBaZWl0c3RlbXBlbC4gRGllIFByb3Rva29sbGUgd2VyZGVuIGbDvHIgc2VjaHMgTW9uYXRlIGF1ZmdlaG9iZW4uPC9saT48bGk+RWluZ2FiZWtvbnRyb2xsZTogRWluZ2FiZSB2b24gbmV1ZW4gdW5kIGFrdHVhbGlzaWVydGVuIHNvd2llIGRpZSBMw7ZzY2h1bmcgdm9uIHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIHdpcmQgcHJvdG9rb2xsaWVydC4gPHNwYW4+RGllIFByb3Rva29sbGUgZW50aGFsdGVuIGRlbiBCZW51dHplci9Qcm96ZXNzLCBkZXIgZGllIEVpbmdhYmUgaW5pdGlpZXJ0IGhhdCwgZGllIEthdGVnb3JpZSBwZXJzb25lbmJlem9nZW5lciBEYXRlbiB1bmQgZGVuIFplaXRzdGVtcGVsLiBEaWUgUHJvdG9rb2xsZSB3ZXJkZW4gZsO8ciBzZWNocyBNb25hdGUgYXVmZ2Vob2Jlbi48L3NwYW4+PC9saT48bGk+VHJhbnNwb3J0a29udHJvbGxlOiDDnGJlcnRyYWd1bmcgdm9uIHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIHZvbiB1bmQgenUgZGVuIFN5c3RlbWVuIGlzdCBkdXJjaCBzdGFya2UgU1NMLVZlcnNjaGzDvHNzZWx1bmcgdW5kL29kZXIgRW5kZS16dS1FbmRlLVZlcnNjaGzDvHNzZWx1bmcgZ2VzaWNoZXJ0LjwvbGk+PGxpPlZlcnRyYXVsaWNoa2VpdDogUGVyc29uZW5iZXpvZ2VuZSBEYXRlbiB3ZXJkZW4gc293ZWl0IG3DtmdsaWNoIEVuZGUtenUtRW5kZSB2ZXJzY2hsw7xzc2VsdGUgZ2VzcGVpY2hlcnQuPC9saT48bGk+V2llZGVyaGVyc3RlbGxiYXJrZWl0OiBBbGxlIFN5c3RlbWUgaGFiZW4gZWluZSB6d2VpdGUgTmV0endlcmtzY2huaXR0c3RlbGxlLCBkaWUgbnVyIGRlbiBadWdyaWZmIHZvbiBEZXZPcHMgZXJsYXVidC4gRGllc2UgU2Nobml0dHN0ZWxsZSBlcmxhdWJ0IGRlbiBadWdyaWZmIHNlbGJzdCB3ZW5uIGRpZSBIYXVwdHNjaG5pdHRzdGVsbGUgYmxvY2tpZXJ0IGlzdC4gS29tcG9uZW50ZW4gZGVzIFN5c3RlbXMga8O2bm5lbiBpbSBGZWhsZXJmYWxsIG5ldSBnZXN0YXJ0ZXQgd2VyZGVuLiBFaW4gRGllbnN0IHp1bSBTY2h1dHogdm9yIERET1MtQW5ncmlmZmVuIHdpcmQgYXV0b21hdGlzY2ggZ2VzdGFydGV0LCB3ZW5uIHNvbGNoIGVpbiBBbmdyaWZmIGVya2FubnQgd2lyZC48L2xpPjxsaT5adXZlcmzDpHNzaWdrZWl0OiZuYnNwOyZuYnNwO0Rldk9wcyDDvGJlcndhY2hlbiBhbGxlIFN5c3RlbWUgdW5kIHdlcmRlbiBhdXRvbWF0aXNjaCBiZW5hY2hyaWNodGlndCwgd2VubiBlaW5lIEtvbXBvbmVudGUgZGVzIFN5c3RlbXMgYXVzZsOkbGx0LCB1bSBkaWVzZSBzb2ZvcnQgd2llZGVyIGFrdGl2aWVyZW4genUga8O2bm5lbi48L2xpPjxsaT5EYXRlbmludGVncml0w6R0OiBBdXRvbWF0aXNjaGUgRmVobGVya29ycmVrdHVyIGF1ZiBEYXRlbnRyw6RnZXJuIHVuZCBhdWYgRGF0ZW5iYW5rZWJlbmUgc3RlbGx0IHNpY2hlciwgZGFzcyBkaWUgRGF0ZW5pbnRlZ3JpdMOkdCBnZXdhaHJ0IGJsZWlidC4gWnVzw6R0emxpY2ggd2lyZCBkaWUgSW50ZWdyaXTDpHQgZGVyIEVuZGUtenUtRW5kZSB2ZXJzY2hsw7xzc2VsdGVuIHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIGR1cmNoIE1BQ3MgYmVpIGRlciBWZXItIHVuZCBFbnRzY2hsw7xzc2VsdW5nIHNpY2hlcmdlc3RlbGx0LjwvbGk+PGxpPkF1ZnRyYWdza29udHJvbGxlOiBBbGxlIE1pdGFyYmVpdGVyIGtlbm5lbiBkaWUgWndlY2tlIGRlciBWZXJhcmJlaXR1bmcgdW5kIGFic29sdmllcmVuIHJlZ2VsbcOkw59pZyBlaW4gaW50ZXJuZXMgU2ljaGVyaGVpdHN0cmFpbmluZy4gVW50ZXJhdWZ0cmFnbmVobWVyIHdlcmRlbiBudXIgc2NocmlmdGxpY2ggYmVhdWZ0cmFndC48L2xpPjxsaT5WZXJmw7xnYmFya2VpdHNrb250cm9sbGU6IDxzcGFuPkFsbGUgU3lzdGVtZSBzaW5kIGluIElTTyAyNzAwMSB6ZXJ0aWZpemllcnRlbiBSZWNoZW56ZW50cmVuIGluIERldXRzY2hsYW5kIGdlaG9zdGV0LCBkaWUgZGllIHBoeXNpc2NoZSBWZXJmw7xnYmFya2VpdCB1bmQgVmVyYmluZHVuZyBkZXIgU3lzdGVtZSBzaWNoZXJzdGVsbGVuPC9zcGFuPi4gQWxsZSBsYW5nZnJpc3RpZyBnZXNwZWljaGVydGVuIERhdGVuIHdlcmRlbiBkcmVpZmFjaCByZXBsaXppZXJ0IGF1ZiB1bnRlcnNjaGllZGxpY2hlbiBTZXJ2ZXJuIG9kZXIgaW4gZWluZW0gUkFJRC1TeXN0ZW0gYWJnZWxlZ3QuIFZvciBkZXIgQWt0dWFsaXNpZXJ1bmcga3JpdGlzY2hlciBUZWlsZSBkZXMgU3lzdGVtcyB3ZXJkZW4gQmFja3VwcyBhbmdlbGVndC48L2xpPjxsaT5UcmVubmJhcmtlaXQ6IEdldHJlbm50ZSBWZXJhcmJlaXR1bmcgdm9uIHBlcnNvbmVuYmV6b2dlbmVuIERhdGVuIGlzdCBiZWRhcmZzYWJow6RuZ2lnIGVpbmdlcmljaHRldC48L2xpPjxsaT5CZWxhc3RiYXJrZWl0OiBBbGxlIFN5c3RlbWUgYmVzdGVoZW4gYXVzIGhvY2hza2FsaWVyYmFyZW4gS29tcG9uZW50ZW4sIGRpZSBmw7xyIHZpZWwgaMO2aGVyZSBMYXN0ZW4gYWxzIHRhdHPDpGNobGljaCBiZW7DtnRpZ3QgYXVzZ2VsZWd0IHNpbmQuIEFsbGUgU3lzdGVtZSBzaW5kIGt1cnpmcmlzdGlnIGVyd2VpdGVyYmFyLCB1bSBrb250aW51aWVybGljaCBzdGVpZ2VuZGUgTGFzdGVuIHZlcmFyYmVpdGVuIHp1IGvDtm5uZW4uPC9saT48L29sPjwvZGl2PlxcbicgK1xuXHRcdFx0XCI8L2Rpdj5cIixcblx0fSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dGb3JTaWduaW5nKGN1c3RvbWVyOiBDdXN0b21lciwgYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvKSB7XG5cdGNvbnN0IHNpZ25BY3Rpb24gPSAoZGlhbG9nOiBEaWFsb2cpID0+IHtcblx0XHRsZXQgZGF0YSA9IGNyZWF0ZVNpZ25PcmRlclByb2Nlc3NpbmdBZ3JlZW1lbnREYXRhKHtcblx0XHRcdHZlcnNpb246IHZlcnNpb24sXG5cdFx0XHRjdXN0b21lckFkZHJlc3M6IGFkZHJlc3NFZGl0b3IuZ2V0VmFsdWUoKSxcblx0XHR9KVxuXG5cdFx0aWYgKGFkZHJlc3NFZGl0b3IuZ2V0VmFsdWUoKS50cmltKCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoIDwgMykge1xuXHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJjb250cmFjdG9ySW5mb19tc2dcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IucG9zdChTaWduT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50U2VydmljZSwgZGF0YSkudGhlbigoKSA9PiBkaWFsb2cuY2xvc2UoKSlcblx0XHR9XG5cdH1cblxuXHRjb25zdCB2ZXJzaW9uID0gXCIxX1wiICsgKGxhbmcuY29kZSA9PT0gXCJkZVwiID8gXCJkZVwiIDogXCJlblwiKVxuXHRjb25zdCBhZGRyZXNzRWRpdG9yID0gbmV3IEh0bWxFZGl0b3IoKVxuXHRcdC5zZXRNaW5IZWlnaHQoMTIwKVxuXHRcdC5zaG93Qm9yZGVycygpXG5cdFx0LnNldFBsYWNlaG9sZGVySWQoXCJjb250cmFjdG9yX2xhYmVsXCIpXG5cdFx0LnNldE1vZGUoSHRtbEVkaXRvck1vZGUuSFRNTClcblx0XHQuc2V0SHRtbE1vbm9zcGFjZShmYWxzZSlcblx0XHQuc2V0VmFsdWUoZm9ybWF0TmFtZUFuZEFkZHJlc3MoYWNjb3VudGluZ0luZm8uaW52b2ljZU5hbWUsIGFjY291bnRpbmdJbmZvLmludm9pY2VBZGRyZXNzKSlcblx0RGlhbG9nLnNob3dBY3Rpb25EaWFsb2coe1xuXHRcdHRpdGxlOiBcIm9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudF9sYWJlbFwiLFxuXHRcdG9rQWN0aW9uOiBzaWduQWN0aW9uLFxuXHRcdG9rQWN0aW9uVGV4dElkOiBcInNpZ25fYWN0aW9uXCIsXG5cdFx0dHlwZTogRGlhbG9nVHlwZS5FZGl0TGFyZ2UsXG5cdFx0Y2hpbGQ6ICgpID0+IHtcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdGNvbnN0IHRleHQgPSBhZ3JlZW1lbnRUZXh0c1t2ZXJzaW9uXVxuXHRcdFx0cmV0dXJuIG0oXCIucHRcIiwgW1xuXHRcdFx0XHRtLnRydXN0KHRleHQuaGVhZGluZyksXG5cdFx0XHRcdG0oXCIuZmxleC1jZW50ZXJcIiwgbShcIi5kaWFsb2ctd2lkdGgtc1wiLCBbbShhZGRyZXNzRWRpdG9yKSwgbShcIi5zbWFsbFwiLCBsYW5nLmdldChcImNvbnRyYWN0b3JJbmZvX21zZ1wiKSldKSksXG5cdFx0XHRcdG0udHJ1c3QodGV4dC5jb250ZW50KSxcblx0XHRcdFx0bS50cnVzdCh0ZXh0LmFwcGVuZGl4KSxcblx0XHRcdF0pXG5cdFx0fSxcblx0fSlcbn1cblxuLy8gdGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzb21lIHN0eWxlIGNvbWJpbmF0aW9uc1xuLy8gY2F1c2Ugc2V2ZXJhbCBicm93c2VycyBub3QgdG8gcHJpbnRcbi8vIHRoZSBjb250ZW50IGJlbG93IHRoZSBmb2xkXG5mdW5jdGlvbiBwcmludEVsZW1lbnRDb250ZW50KGVsZW06IEhUTUxFbGVtZW50IHwgbnVsbCkge1xuXHRjb25zdCByb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyb290XCIpXG5cdGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5XG5cdGlmICghZWxlbSB8fCAhcm9vdCB8fCAhYm9keSkgcmV0dXJuXG5cdGxldCBwcmludERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFBSSU5UX0RJVl9JRClcblxuXHRpZiAoIXByaW50RGl2KSB7XG5cdFx0cHJpbnREaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpXG5cdFx0cHJpbnREaXYuaWQgPSBQUklOVF9ESVZfSURcblx0XHRib2R5LmFwcGVuZENoaWxkKHByaW50RGl2KVxuXHRcdGNvbnN0IGNsYXNzZXMgPSByb290LmNsYXNzTmFtZS5zcGxpdChcIiBcIilcblx0XHRjbGFzc2VzLnB1c2goXCJub3ByaW50XCIpXG5cdFx0cm9vdC5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oXCIgXCIpXG5cdH1cblxuXHRwcmludERpdi5pbm5lckhUTUwgPSBlbGVtLmlubmVySFRNTFxuXHRwcmludERpdi5jbGFzc0xpc3QuYWRkKFwibm9zY3JlZW5cIilcblx0d2luZG93LnByaW50KClcbn1cblxuZnVuY3Rpb24gY2xlYW51cFByaW50RWxlbWVudCgpIHtcblx0Y29uc3Qgcm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicm9vdFwiKVxuXHRjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keVxuXHRjb25zdCBwcmludERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFBSSU5UX0RJVl9JRClcblx0aWYgKCFwcmludERpdiB8fCAhcm9vdCB8fCAhYm9keSkgcmV0dXJuXG5cdGJvZHkucmVtb3ZlQ2hpbGQocHJpbnREaXYpXG5cdHJvb3QuY2xhc3NOYW1lID0gcm9vdC5jbGFzc05hbWVcblx0XHQuc3BsaXQoXCIgXCIpXG5cdFx0LmZpbHRlcigoYykgPT4gYyAhPT0gXCJub3ByaW50XCIpXG5cdFx0LmpvaW4oXCIgXCIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93Rm9yVmlld2luZyhhZ3JlZW1lbnQ6IE9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudCwgc2lnbmVyVXNlckdyb3VwSW5mbzogR3JvdXBJbmZvKSB7XG5cdERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHR0aXRsZTogXCJvcmRlclByb2Nlc3NpbmdBZ3JlZW1lbnRfbGFiZWxcIixcblx0XHRva0FjdGlvbjogIWlzQXBwKCkgJiYgXCJmdW5jdGlvblwiID09PSB0eXBlb2Ygd2luZG93LnByaW50ID8gKCkgPT4gcHJpbnRFbGVtZW50Q29udGVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFncmVlbWVudC1jb250ZW50XCIpKSA6IG51bGwsXG5cdFx0b2tBY3Rpb25UZXh0SWQ6IFwicHJpbnRfYWN0aW9uXCIsXG5cdFx0Y2FuY2VsQWN0aW9uVGV4dElkOiBcImNsb3NlX2FsdFwiLFxuXHRcdHR5cGU6IERpYWxvZ1R5cGUuRWRpdExhcmdlLFxuXHRcdGNoaWxkOiAoKSA9PiB7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRjb25zdCB0ZXh0ID0gYWdyZWVtZW50VGV4dHNbYWdyZWVtZW50LnZlcnNpb25dXG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIjYWdyZWVtZW50LWNvbnRlbnQucHRcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9ucmVtb3ZlOiBjbGVhbnVwUHJpbnRFbGVtZW50LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0bS50cnVzdCh0ZXh0LmhlYWRpbmcpLFxuXHRcdFx0XHRcdG0oXCJwLnRleHQtY2VudGVyLnRleHQtcHJld3JhcFwiLCBhZ3JlZW1lbnQuY3VzdG9tZXJBZGRyZXNzKSxcblx0XHRcdFx0XHRtLnRydXN0KHRleHQuY29udGVudCksXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFwiaVwiLFxuXHRcdFx0XHRcdFx0bGFuZy5nZXQoXCJzaWduZWRPbl9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcIntkYXRlfVwiOiBmb3JtYXREYXRlKGFncmVlbWVudC5zaWduYXR1cmVEYXRlKSxcblx0XHRcdFx0XHRcdH0pICtcblx0XHRcdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdFx0XHRsYW5nLmdldChcImJ5X2xhYmVsXCIpICtcblx0XHRcdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdFx0XHRnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KHNpZ25lclVzZXJHcm91cEluZm8ubmFtZSwgbmV2ZXJOdWxsKHNpZ25lclVzZXJHcm91cEluZm8ubWFpbEFkZHJlc3MpLCBmYWxzZSksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRtKFwiaHJcIiksXG5cdFx0XHRcdFx0bS50cnVzdCh0ZXh0LmFwcGVuZGl4KSxcblx0XHRcdFx0XSxcblx0XHRcdClcblx0XHR9LFxuXHR9KVxufVxuIiwiaW1wb3J0IHR5cGUgeyBJbmZvTGluaywgVHJhbnNsYXRpb25LZXksIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBFeHBhbmRlckJ1dHRvbiwgRXhwYW5kZXJQYW5lbCB9IGZyb20gXCIuLi9ndWkvYmFzZS9FeHBhbmRlci5qc1wiXG5pbXBvcnQgeyBpZkFsbG93ZWRUdXRhTGlua3MgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvR3VpVXRpbHMuanNcIlxuaW1wb3J0IHR5cGUgeyBsYXp5LCBUaHVuayB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcblxuZXhwb3J0IHR5cGUgU2V0dGluZ3NFeHBhbmRlckF0dHJzID0ge1xuXHR0aXRsZTogTWF5YmVUcmFuc2xhdGlvblxuXHRidXR0b25UZXh0PzogTWF5YmVUcmFuc2xhdGlvblxuXHRpbmZvTXNnPzogTWF5YmVUcmFuc2xhdGlvblxuXHRpbmZvTGlua0lkPzogSW5mb0xpbmsgfCB1bmRlZmluZWRcblx0b25FeHBhbmQ/OiBUaHVuayB8IHVuZGVmaW5lZFxuXHRleHBhbmRlZDogU3RyZWFtPGJvb2xlYW4+XG59XG5cbmV4cG9ydCBjbGFzcyBTZXR0aW5nc0V4cGFuZGVyIGltcGxlbWVudHMgQ29tcG9uZW50PFNldHRpbmdzRXhwYW5kZXJBdHRycz4ge1xuXHRvbmNyZWF0ZSh2bm9kZTogVm5vZGU8U2V0dGluZ3NFeHBhbmRlckF0dHJzPikge1xuXHRcdHZub2RlLmF0dHJzLmV4cGFuZGVkLm1hcCgoZXhwYW5kZWQpID0+IHtcblx0XHRcdGlmIChleHBhbmRlZCAmJiB2bm9kZS5hdHRycy5vbkV4cGFuZCkge1xuXHRcdFx0XHR2bm9kZS5hdHRycy5vbkV4cGFuZCgpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPFNldHRpbmdzRXhwYW5kZXJBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyB0aXRsZSwgYnV0dG9uVGV4dCwgaW5mb0xpbmtJZCwgaW5mb01zZywgZXhwYW5kZWQgfSA9IHZub2RlLmF0dHJzXG5cdFx0cmV0dXJuIFtcblx0XHRcdG0oXCIuZmxleC1zcGFjZS1iZXR3ZWVuLml0ZW1zLWNlbnRlci5tYi1zLm10LWxcIiwgW1xuXHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KHRpdGxlKSksXG5cdFx0XHRcdG0oRXhwYW5kZXJCdXR0b24sIHtcblx0XHRcdFx0XHRsYWJlbDogYnV0dG9uVGV4dCB8fCBcInNob3dfYWN0aW9uXCIsXG5cdFx0XHRcdFx0ZXhwYW5kZWQ6IGV4cGFuZGVkKCksXG5cdFx0XHRcdFx0b25FeHBhbmRlZENoYW5nZTogZXhwYW5kZWQsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSksXG5cdFx0XHRtKFxuXHRcdFx0XHRFeHBhbmRlclBhbmVsLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZXhwYW5kZWQ6IGV4cGFuZGVkKCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHZub2RlLmNoaWxkcmVuLFxuXHRcdFx0KSxcblx0XHRcdGluZm9Nc2cgPyBtKFwic21hbGxcIiwgbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoaW5mb01zZykpIDogbnVsbCxcblx0XHRcdGluZm9MaW5rSWQgPyBpZkFsbG93ZWRUdXRhTGlua3MobG9jYXRvci5sb2dpbnMsIGluZm9MaW5rSWQsIChsaW5rKSA9PiBtKFwic21hbGwudGV4dC1icmVha1wiLCBbbShgYVtocmVmPSR7bGlua31dW3RhcmdldD1fYmxhbmtdYCwgbGluayldKSkgOiBudWxsLFxuXHRcdF1cblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlLCBpc0lPU0FwcCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQge1xuXHRBY2NvdW50VHlwZSxcblx0QWNjb3VudFR5cGVOYW1lcyxcblx0QXBwcm92YWxTdGF0dXMsXG5cdEF2YWlsYWJsZVBsYW5zLFxuXHRCb29raW5nSXRlbUZlYXR1cmVUeXBlLFxuXHRDb25zdCxcblx0Z2V0UGF5bWVudE1ldGhvZFR5cGUsXG5cdExlZ2FjeVBsYW5zLFxuXHROZXdQYWlkUGxhbnMsXG5cdE9wZXJhdGlvblR5cGUsXG5cdFBheW1lbnRNZXRob2RUeXBlLFxuXHRQbGFuVHlwZSxcbn0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHtcblx0QWNjb3VudGluZ0luZm8sXG5cdEFjY291bnRpbmdJbmZvVHlwZVJlZixcblx0Qm9va2luZyxcblx0Qm9va2luZ1R5cGVSZWYsXG5cdGNyZWF0ZUFwcFN0b3JlU3Vic2NyaXB0aW9uR2V0SW4sXG5cdEN1c3RvbWVyLFxuXHRDdXN0b21lckluZm8sXG5cdEN1c3RvbWVySW5mb1R5cGVSZWYsXG5cdEN1c3RvbWVyVHlwZVJlZixcblx0R2lmdENhcmQsXG5cdEdpZnRDYXJkVHlwZVJlZixcblx0R3JvdXBJbmZvVHlwZVJlZixcblx0T3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50LFxuXHRPcmRlclByb2Nlc3NpbmdBZ3JlZW1lbnRUeXBlUmVmLFxuXHRQbGFuQ29uZmlndXJhdGlvbixcblx0VXNlclR5cGVSZWYsXG59IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGJhc2U2NEV4dFRvQmFzZTY0LCBiYXNlNjRUb1VpbnQ4QXJyYXksIGRvd25jYXN0LCBpbmNyZW1lbnREYXRlLCBuZXZlck51bGwsIHByb21pc2VNYXAsIHN0cmluZ1RvQmFzZTY0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBJbmZvTGluaywgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBhc1BheW1lbnRJbnRlcnZhbCwgZm9ybWF0UHJpY2UsIGZvcm1hdFByaWNlRGF0YVdpdGhJbmZvLCBQYXltZW50SW50ZXJ2YWwgfSBmcm9tIFwiLi9QcmljZVV0aWxzXCJcbmltcG9ydCB7IGZvcm1hdERhdGUsIGZvcm1hdFN0b3JhZ2VTaXplIH0gZnJvbSBcIi4uL21pc2MvRm9ybWF0dGVyXCJcbmltcG9ydCB7IHNob3dVcGdyYWRlV2l6YXJkIH0gZnJvbSBcIi4vVXBncmFkZVN1YnNjcmlwdGlvbldpemFyZFwiXG5pbXBvcnQgeyBzaG93U3dpdGNoRGlhbG9nIH0gZnJvbSBcIi4vU3dpdGNoU3Vic2NyaXB0aW9uRGlhbG9nXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCAqIGFzIFNpZ25PcmRlckFncmVlbWVudERpYWxvZyBmcm9tIFwiLi9TaWduT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50RGlhbG9nXCJcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHtcblx0YXBwU3RvcmVQbGFuTmFtZSxcblx0Z2V0Q3VycmVudENvdW50LFxuXHRnZXRUb3RhbFN0b3JhZ2VDYXBhY2l0eVBlckN1c3RvbWVyLFxuXHRpc0F1dG9SZXNwb25kZXJBY3RpdmUsXG5cdGlzRXZlbnRJbnZpdGVzQWN0aXZlLFxuXHRpc1NoYXJpbmdBY3RpdmUsXG5cdGlzV2hpdGVsYWJlbEFjdGl2ZSxcblx0cXVlcnlBcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcCxcbn0gZnJvbSBcIi4vU3Vic2NyaXB0aW9uVXRpbHNcIlxuaW1wb3J0IHsgVGV4dEZpZWxkIH0gZnJvbSBcIi4uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBEaWFsb2csIERpYWxvZ1R5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IENvbHVtbldpZHRoLCBUYWJsZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9UYWJsZS5qc1wiXG5pbXBvcnQgeyBzaG93UHVyY2hhc2VHaWZ0Q2FyZERpYWxvZyB9IGZyb20gXCIuL2dpZnRjYXJkcy9QdXJjaGFzZUdpZnRDYXJkRGlhbG9nXCJcbmltcG9ydCB7IEdpZnRDYXJkU3RhdHVzLCBsb2FkR2lmdENhcmRzLCBzaG93R2lmdENhcmRUb1NoYXJlIH0gZnJvbSBcIi4vZ2lmdGNhcmRzL0dpZnRDYXJkVXRpbHNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IEdpZnRDYXJkTWVzc2FnZUVkaXRvckZpZWxkIH0gZnJvbSBcIi4vZ2lmdGNhcmRzL0dpZnRDYXJkTWVzc2FnZUVkaXRvckZpZWxkXCJcbmltcG9ydCB7IGF0dGFjaERyb3Bkb3duIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IGNyZWF0ZU5vdEF2YWlsYWJsZUZvckZyZWVDbGlja0hhbmRsZXIgfSBmcm9tIFwiLi4vbWlzYy9TdWJzY3JpcHRpb25EaWFsb2dzXCJcbmltcG9ydCB7IFNldHRpbmdzRXhwYW5kZXIgfSBmcm9tIFwiLi4vc2V0dGluZ3MvU2V0dGluZ3NFeHBhbmRlci5qc1wiXG5pbXBvcnQgeyBlbGVtZW50SWRQYXJ0LCBHRU5FUkFURURfTUFYX0lELCBnZXRFdElkIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHtcblx0Q1VSUkVOVF9HSUZUX0NBUkRfVEVSTVNfVkVSU0lPTixcblx0Q1VSUkVOVF9QUklWQUNZX1ZFUlNJT04sXG5cdENVUlJFTlRfVEVSTVNfVkVSU0lPTixcblx0cmVuZGVyVGVybXNBbmRDb25kaXRpb25zQnV0dG9uLFxuXHRUZXJtc1NlY3Rpb24sXG59IGZyb20gXCIuL1Rlcm1zQW5kQ29uZGl0aW9uc1wiXG5pbXBvcnQgeyBEcm9wRG93blNlbGVjdG9yLCBTZWxlY3Rvckl0ZW1MaXN0IH0gZnJvbSBcIi4uL2d1aS9iYXNlL0Ryb3BEb3duU2VsZWN0b3IuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiwgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uU2l6ZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b25TaXplLmpzXCJcbmltcG9ydCB7IGdldERpc3BsYXlOYW1lT2ZQbGFuVHlwZSB9IGZyb20gXCIuL0ZlYXR1cmVMaXN0UHJvdmlkZXJcIlxuaW1wb3J0IHsgRW50aXR5VXBkYXRlRGF0YSwgaXNVcGRhdGVGb3JUeXBlUmVmIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXBkYXRlVXRpbHMuanNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IE1vYmlsZVBheW1lbnRzRmFjYWRlIH0gZnJvbSBcIi4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL01vYmlsZVBheW1lbnRzRmFjYWRlXCJcbmltcG9ydCB7IE1vYmlsZVBheW1lbnRTdWJzY3JpcHRpb25Pd25lcnNoaXAgfSBmcm9tIFwiLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlUGF5bWVudFN1YnNjcmlwdGlvbk93bmVyc2hpcFwiXG5pbXBvcnQgeyBNb2JpbGVQYXltZW50RXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9Nb2JpbGVQYXltZW50RXJyb3JcIlxuaW1wb3J0IHsgc2hvd01hbmFnZVRocm91Z2hBcHBTdG9yZURpYWxvZyB9IGZyb20gXCIuL1BheW1lbnRWaWV3ZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBVcGRhdGFibGVTZXR0aW5nc1ZpZXdlciB9IGZyb20gXCIuLi9zZXR0aW5ncy9JbnRlcmZhY2VzLmpzXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcbmltcG9ydCB7IEFwcFN0b3JlU3Vic2NyaXB0aW9uU2VydmljZSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IEFwcFR5cGUgfSBmcm9tIFwiLi4vbWlzYy9DbGllbnRDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcbmNvbnN0IERBWSA9IDEwMDAgKiA2MCAqIDYwICogMjRcblxuLypcbiAqIElkZW50aWZpZXMgZnJvbSB3aGljaCBhcHAgdGhlIHVzZXIgc3Vic2NyaWJlZCBmcm9tXG4gKi9cbmV4cG9ydCBlbnVtIFN1YnNjcmlwdGlvbkFwcCB7XG5cdE1haWwgPSBcIjBcIixcblx0Q2FsZW5kYXIgPSBcIjFcIixcbn1cblxuZXhwb3J0IGNsYXNzIFN1YnNjcmlwdGlvblZpZXdlciBpbXBsZW1lbnRzIFVwZGF0YWJsZVNldHRpbmdzVmlld2VyIHtcblx0cmVhZG9ubHkgdmlldzogVXBkYXRhYmxlU2V0dGluZ3NWaWV3ZXJbXCJ2aWV3XCJdXG5cdHByaXZhdGUgX3N1YnNjcmlwdGlvbkZpZWxkVmFsdWU6IFN0cmVhbTxzdHJpbmc+XG5cdHByaXZhdGUgX29yZGVyQWdyZWVtZW50RmllbGRWYWx1ZTogU3RyZWFtPHN0cmluZz5cblx0cHJpdmF0ZSBfc2VsZWN0ZWRTdWJzY3JpcHRpb25JbnRlcnZhbDogU3RyZWFtPFBheW1lbnRJbnRlcnZhbCB8IG51bGw+XG5cdHByaXZhdGUgX2N1cnJlbnRQcmljZUZpZWxkVmFsdWU6IFN0cmVhbTxzdHJpbmc+XG5cdHByaXZhdGUgX25leHRQcmljZUZpZWxkVmFsdWU6IFN0cmVhbTxzdHJpbmc+XG5cdHByaXZhdGUgX3VzZXJzRmllbGRWYWx1ZTogU3RyZWFtPHN0cmluZz5cblx0cHJpdmF0ZSBfc3RvcmFnZUZpZWxkVmFsdWU6IFN0cmVhbTxzdHJpbmc+XG5cdHByaXZhdGUgX2VtYWlsQWxpYXNGaWVsZFZhbHVlOiBTdHJlYW08c3RyaW5nPlxuXHRwcml2YXRlIF9ncm91cHNGaWVsZFZhbHVlOiBTdHJlYW08c3RyaW5nPlxuXHRwcml2YXRlIF93aGl0ZWxhYmVsRmllbGRWYWx1ZTogU3RyZWFtPHN0cmluZz5cblx0cHJpdmF0ZSBfc2hhcmluZ0ZpZWxkVmFsdWU6IFN0cmVhbTxzdHJpbmc+XG5cdHByaXZhdGUgX2V2ZW50SW52aXRlc0ZpZWxkVmFsdWU6IFN0cmVhbTxzdHJpbmc+XG5cdHByaXZhdGUgX2F1dG9SZXNwb25kZXJGaWVsZFZhbHVlOiBTdHJlYW08c3RyaW5nPlxuXHRwcml2YXRlIF9wZXJpb2RFbmREYXRlOiBEYXRlIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfbmV4dFBlcmlvZFByaWNlVmlzaWJsZTogYm9vbGVhbiB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgX2N1c3RvbWVyOiBDdXN0b21lciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgX2N1c3RvbWVySW5mbzogQ3VzdG9tZXJJbmZvIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfbGFzdEJvb2tpbmc6IEJvb2tpbmcgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIF9vcmRlckFncmVlbWVudDogT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBjdXJyZW50UGxhblR5cGU6IFBsYW5UeXBlXG5cdHByaXZhdGUgX2lzQ2FuY2VsbGVkOiBib29sZWFuIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfZ2lmdENhcmRzOiBNYXA8SWQsIEdpZnRDYXJkPlxuXHRwcml2YXRlIF9naWZ0Q2FyZHNFeHBhbmRlZDogU3RyZWFtPGJvb2xlYW4+XG5cblx0Y29uc3RydWN0b3IoY3VycmVudFBsYW5UeXBlOiBQbGFuVHlwZSwgcHJpdmF0ZSByZWFkb25seSBtb2JpbGVQYXltZW50c0ZhY2FkZTogTW9iaWxlUGF5bWVudHNGYWNhZGUgfCBudWxsKSB7XG5cdFx0dGhpcy5jdXJyZW50UGxhblR5cGUgPSBjdXJyZW50UGxhblR5cGVcblx0XHRjb25zdCBpc1ByZW1pdW1QcmVkaWNhdGUgPSAoKSA9PiBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzUHJlbWl1bUFjY291bnQoKVxuXG5cdFx0dGhpcy5fZ2lmdENhcmRzID0gbmV3IE1hcCgpXG5cdFx0bG9hZEdpZnRDYXJkcyhhc3NlcnROb3ROdWxsKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5jdXN0b21lcikpLnRoZW4oKGdpZnRDYXJkcykgPT4ge1xuXHRcdFx0Zm9yIChjb25zdCBnaWZ0Q2FyZCBvZiBnaWZ0Q2FyZHMpIHtcblx0XHRcdFx0dGhpcy5fZ2lmdENhcmRzLnNldChlbGVtZW50SWRQYXJ0KGdpZnRDYXJkLl9pZCksIGdpZnRDYXJkKVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0dGhpcy5fZ2lmdENhcmRzRXhwYW5kZWQgPSBzdHJlYW08Ym9vbGVhbj4oZmFsc2UpXG5cblx0XHR0aGlzLnZpZXcgPSAoKTogQ2hpbGRyZW4gPT4ge1xuXHRcdFx0cmV0dXJuIG0oXCIjc3Vic2NyaXB0aW9uLXNldHRpbmdzLmZpbGwtYWJzb2x1dGUuc2Nyb2xsLnBsci1sXCIsIFtcblx0XHRcdFx0bShcIi5oNC5tdC1sXCIsIGxhbmcuZ2V0KFwiY3VycmVudGx5Qm9va2VkX2xhYmVsXCIpKSxcblx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRsYWJlbDogXCJzdWJzY3JpcHRpb25fbGFiZWxcIixcblx0XHRcdFx0XHR2YWx1ZTogdGhpcy5fc3Vic2NyaXB0aW9uRmllbGRWYWx1ZSgpLFxuXHRcdFx0XHRcdG9uaW5wdXQ6IHRoaXMuX3N1YnNjcmlwdGlvbkZpZWxkVmFsdWUsXG5cdFx0XHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+XG5cdFx0XHRcdFx0XHRsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzRnJlZUFjY291bnQoKVxuXHRcdFx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6IFwidXBncmFkZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCB0aGlzLmhhbmRsZVVwZ3JhZGVTdWJzY3JpcHRpb24oKSksXG5cdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0XHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHRcdDogIXRoaXMuX2lzQ2FuY2VsbGVkXG5cdFx0XHRcdFx0XHRcdD8gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJzdWJzY3JpcHRpb25fbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLm9uU3Vic2NyaXB0aW9uQ2xpY2soKSxcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLkVkaXQsXG5cdFx0XHRcdFx0XHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0dGhpcy5zaG93T3JkZXJBZ3JlZW1lbnQoKSA/IHRoaXMucmVuZGVyQWdyZWVtZW50KCkgOiBudWxsLFxuXHRcdFx0XHR0aGlzLnNob3dQcmljZURhdGEoKSA/IHRoaXMucmVuZGVySW50ZXJ2YWxzKCkgOiBudWxsLFxuXHRcdFx0XHR0aGlzLnNob3dQcmljZURhdGEoKSAmJiB0aGlzLl9uZXh0UGVyaW9kUHJpY2VWaXNpYmxlICYmIHRoaXMuX3BlcmlvZEVuZERhdGVcblx0XHRcdFx0XHQ/IG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBsYW5nLmdldFRyYW5zbGF0aW9uKFwicHJpY2VGcm9tX2xhYmVsXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRcIntkYXRlfVwiOiBmb3JtYXREYXRlKG5ldyBEYXRlKG5ldmVyTnVsbCh0aGlzLl9wZXJpb2RFbmREYXRlKS5nZXRUaW1lKCkgKyBEQVkpKSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdGhlbHBMYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJuZXh0U3Vic2NyaXB0aW9uUHJpY2VfbXNnXCIpLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZTogdGhpcy5fbmV4dFByaWNlRmllbGRWYWx1ZSgpLFxuXHRcdFx0XHRcdFx0XHRvbmlucHV0OiB0aGlzLl9uZXh0UHJpY2VGaWVsZFZhbHVlLFxuXHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdG0oXCIuc21hbGwubXQtc1wiLCByZW5kZXJUZXJtc0FuZENvbmRpdGlvbnNCdXR0b24oVGVybXNTZWN0aW9uLlRlcm1zLCBDVVJSRU5UX1RFUk1TX1ZFUlNJT04pKSxcblx0XHRcdFx0bShcIi5zbWFsbC5tdC1zXCIsIHJlbmRlclRlcm1zQW5kQ29uZGl0aW9uc0J1dHRvbihUZXJtc1NlY3Rpb24uUHJpdmFjeSwgQ1VSUkVOVF9QUklWQUNZX1ZFUlNJT04pKSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRTZXR0aW5nc0V4cGFuZGVyLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRpdGxlOiBcImdpZnRDYXJkc19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0aW5mb01zZzogXCJnaWZ0Q2FyZFNlY3Rpb25fbGFiZWxcIixcblx0XHRcdFx0XHRcdGV4cGFuZGVkOiB0aGlzLl9naWZ0Q2FyZHNFeHBhbmRlZCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHJlbmRlckdpZnRDYXJkVGFibGUoQXJyYXkuZnJvbSh0aGlzLl9naWZ0Q2FyZHMudmFsdWVzKCkpLCBpc1ByZW1pdW1QcmVkaWNhdGUpLFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRMZWdhY3lQbGFucy5pbmNsdWRlcyh0aGlzLmN1cnJlbnRQbGFuVHlwZSlcblx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0bShcIi5oNC5tdC1sXCIsIGxhbmcuZ2V0KFwiYWRtaW5QcmVtaXVtRmVhdHVyZXNfYWN0aW9uXCIpKSxcblx0XHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJzdG9yYWdlQ2FwYWNpdHlfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogdGhpcy5fc3RvcmFnZUZpZWxkVmFsdWUoKSxcblx0XHRcdFx0XHRcdFx0XHRvbmlucHV0OiB0aGlzLl9zdG9yYWdlRmllbGRWYWx1ZSxcblx0XHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJtYWlsQWRkcmVzc0FsaWFzZXNfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogdGhpcy5fZW1haWxBbGlhc0ZpZWxkVmFsdWUoKSxcblx0XHRcdFx0XHRcdFx0XHRvbmlucHV0OiB0aGlzLl9lbWFpbEFsaWFzRmllbGRWYWx1ZSxcblx0XHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJwcmljaW5nLmNvbXBhcmlzb25TaGFyaW5nQ2FsZW5kYXJfbXNnXCIsXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6IHRoaXMuX3NoYXJpbmdGaWVsZFZhbHVlKCksXG5cdFx0XHRcdFx0XHRcdFx0b25pbnB1dDogdGhpcy5fc2hhcmluZ0ZpZWxkVmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwicHJpY2luZy5jb21wYXJpc29uRXZlbnRJbnZpdGVzX21zZ1wiLFxuXHRcdFx0XHRcdFx0XHRcdHZhbHVlOiB0aGlzLl9ldmVudEludml0ZXNGaWVsZFZhbHVlKCksXG5cdFx0XHRcdFx0XHRcdFx0b25pbnB1dDogdGhpcy5fZXZlbnRJbnZpdGVzRmllbGRWYWx1ZSxcblx0XHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJwcmljaW5nLmNvbXBhcmlzb25PdXRPZk9mZmljZV9tc2dcIixcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogdGhpcy5fYXV0b1Jlc3BvbmRlckZpZWxkVmFsdWUoKSxcblx0XHRcdFx0XHRcdFx0XHRvbmlucHV0OiB0aGlzLl9hdXRvUmVzcG9uZGVyRmllbGRWYWx1ZSxcblx0XHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJ3aGl0ZWxhYmVsLmxvZ2luX3RpdGxlXCIsXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6IHRoaXMuX3doaXRlbGFiZWxGaWVsZFZhbHVlKCksXG5cdFx0XHRcdFx0XHRcdFx0b25pbnB1dDogdGhpcy5fd2hpdGVsYWJlbEZpZWxkVmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwid2hpdGVsYWJlbC5jdXN0b21fdGl0bGVcIixcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogdGhpcy5fd2hpdGVsYWJlbEZpZWxkVmFsdWUoKSxcblx0XHRcdFx0XHRcdFx0XHRvbmlucHV0OiB0aGlzLl93aGl0ZWxhYmVsRmllbGRWYWx1ZSxcblx0XHRcdFx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQgIF1cblx0XHRcdFx0XHQ6IFtdLFxuXHRcdFx0XSlcblx0XHR9XG5cblx0XHRsb2NhdG9yLmVudGl0eUNsaWVudFxuXHRcdFx0LmxvYWQoQ3VzdG9tZXJUeXBlUmVmLCBuZXZlck51bGwobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLmN1c3RvbWVyKSlcblx0XHRcdC50aGVuKChjdXN0b21lcikgPT4ge1xuXHRcdFx0XHR0aGlzLnVwZGF0ZUN1c3RvbWVyRGF0YShjdXN0b21lcilcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkubG9hZEN1c3RvbWVySW5mbygpXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oKGN1c3RvbWVySW5mbykgPT4ge1xuXHRcdFx0XHR0aGlzLl9jdXN0b21lckluZm8gPSBjdXN0b21lckluZm9cblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoQWNjb3VudGluZ0luZm9UeXBlUmVmLCBjdXN0b21lckluZm8uYWNjb3VudGluZ0luZm8pXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oKGFjY291bnRpbmdJbmZvKSA9PiB7XG5cdFx0XHRcdHRoaXMudXBkYXRlQWNjb3VudEluZm9EYXRhKGFjY291bnRpbmdJbmZvKVxuXHRcdFx0XHR0aGlzLnVwZGF0ZVByaWNlSW5mbygpXG5cdFx0XHR9KVxuXHRcdGNvbnN0IGxvYWRpbmdTdHJpbmcgPSBsYW5nLmdldChcImxvYWRpbmdfbXNnXCIpXG5cdFx0dGhpcy5fY3VycmVudFByaWNlRmllbGRWYWx1ZSA9IHN0cmVhbShsb2FkaW5nU3RyaW5nKVxuXHRcdHRoaXMuX3N1YnNjcmlwdGlvbkZpZWxkVmFsdWUgPSBzdHJlYW0obG9hZGluZ1N0cmluZylcblx0XHR0aGlzLl9vcmRlckFncmVlbWVudEZpZWxkVmFsdWUgPSBzdHJlYW0obG9hZGluZ1N0cmluZylcblx0XHR0aGlzLl9uZXh0UHJpY2VGaWVsZFZhbHVlID0gc3RyZWFtKGxvYWRpbmdTdHJpbmcpXG5cdFx0dGhpcy5fdXNlcnNGaWVsZFZhbHVlID0gc3RyZWFtKGxvYWRpbmdTdHJpbmcpXG5cdFx0dGhpcy5fc3RvcmFnZUZpZWxkVmFsdWUgPSBzdHJlYW0obG9hZGluZ1N0cmluZylcblx0XHR0aGlzLl9lbWFpbEFsaWFzRmllbGRWYWx1ZSA9IHN0cmVhbShsb2FkaW5nU3RyaW5nKVxuXHRcdHRoaXMuX2dyb3Vwc0ZpZWxkVmFsdWUgPSBzdHJlYW0obG9hZGluZ1N0cmluZylcblx0XHR0aGlzLl93aGl0ZWxhYmVsRmllbGRWYWx1ZSA9IHN0cmVhbShsb2FkaW5nU3RyaW5nKVxuXHRcdHRoaXMuX3NoYXJpbmdGaWVsZFZhbHVlID0gc3RyZWFtKGxvYWRpbmdTdHJpbmcpXG5cdFx0dGhpcy5fZXZlbnRJbnZpdGVzRmllbGRWYWx1ZSA9IHN0cmVhbShsb2FkaW5nU3RyaW5nKVxuXHRcdHRoaXMuX2F1dG9SZXNwb25kZXJGaWVsZFZhbHVlID0gc3RyZWFtKGxvYWRpbmdTdHJpbmcpXG5cdFx0dGhpcy5fc2VsZWN0ZWRTdWJzY3JpcHRpb25JbnRlcnZhbCA9IHN0cmVhbTxQYXltZW50SW50ZXJ2YWwgfCBudWxsPihudWxsKVxuXG5cdFx0dGhpcy51cGRhdGVCb29raW5ncygpXG5cdH1cblxuXHRwcml2YXRlIG9uU3Vic2NyaXB0aW9uQ2xpY2soKSB7XG5cdFx0Y29uc3QgcGF5bWVudE1ldGhvZCA9IHRoaXMuX2FjY291bnRpbmdJbmZvID8gZ2V0UGF5bWVudE1ldGhvZFR5cGUodGhpcy5fYWNjb3VudGluZ0luZm8pIDogbnVsbFxuXG5cdFx0aWYgKGlzSU9TQXBwKCkgJiYgKHBheW1lbnRNZXRob2QgPT0gbnVsbCB8fCBwYXltZW50TWV0aG9kID09IFBheW1lbnRNZXRob2RUeXBlLkFwcFN0b3JlKSkge1xuXHRcdFx0Ly8gY2FzZSAxOiB3ZSBhcmUgaW4gaU9TIGFwcCBhbmQgd2UgZWl0aGVyIGFyZSBub3QgcGF5aW5nIG9yIGFyZSBhbHJlYWR5IG9uIEFwcFN0b3JlXG5cdFx0XHR0aGlzLmhhbmRsZUFwcFN0b3JlU3Vic2NyaXB0aW9uQ2hhbmdlKClcblx0XHR9IGVsc2UgaWYgKHBheW1lbnRNZXRob2QgPT0gUGF5bWVudE1ldGhvZFR5cGUuQXBwU3RvcmUgJiYgdGhpcy5fYWNjb3VudGluZ0luZm8/LmFwcFN0b3JlU3Vic2NyaXB0aW9uKSB7XG5cdFx0XHQvLyBjYXNlIDI6IHdlIGhhdmUgYSBydW5uaW5nIEFwcFN0b3JlIHN1YnNjcmlwdGlvbiBidXQgdGhpcyBpcyBub3QgYW4gaU9TIGFwcFxuXG5cdFx0XHQvLyBJZiB0aGVyZSdzIGEgcnVubmluZyBBcHAgU3RvcmUgc3Vic2NyaXB0aW9uIGl0IG11c3QgYmUgbWFuYWdlZCB0aHJvdWdoIEFwcGxlLlxuXHRcdFx0Ly8gVGhpcyBpbmNsdWRlcyB0aGUgY2FzZSB3aGVyZSByZW5ld2FsIGlzIGFscmVhZHkgZGlzYWJsZWQsIGJ1dCBpdCdzIG5vdCBleHBpcmVkIHlldC5cblx0XHRcdC8vIFJ1bm5pbmcgc3Vic2NyaXB0aW9uIGNhbm5vdCBiZSBjaGFuZ2VkIGZyb20gb3RoZXIgY2xpZW50LCBidXQgaXQgY2FuIHN0aWxsIGJlIG1hbmFnZWQgdGhyb3VnaCBpT1MgYXBwIG9yIHdoZW4gc3Vic2NyaXB0aW9uIGV4cGlyZXMuXG5cdFx0XHRyZXR1cm4gc2hvd01hbmFnZVRocm91Z2hBcHBTdG9yZURpYWxvZygpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIG90aGVyIGNhc2VzIChub3QgaU9TIGFwcCwgbm90IGFwcCBzdG9yZSBwYXltZW50IG1ldGhvZCwgbm8gcnVubmluZyBBcHBTdG9yZSBzdWJzY3JpcHRpb24sIGlPUyBidXQgYW5vdGhlciBwYXltZW50IG1ldGhvZClcblx0XHRcdGlmICh0aGlzLl9hY2NvdW50aW5nSW5mbyAmJiB0aGlzLl9jdXN0b21lciAmJiB0aGlzLl9jdXN0b21lckluZm8gJiYgdGhpcy5fbGFzdEJvb2tpbmcpIHtcblx0XHRcdFx0c2hvd1N3aXRjaERpYWxvZyh0aGlzLl9jdXN0b21lciwgdGhpcy5fY3VzdG9tZXJJbmZvLCB0aGlzLl9hY2NvdW50aW5nSW5mbywgdGhpcy5fbGFzdEJvb2tpbmcsIEF2YWlsYWJsZVBsYW5zLCBudWxsKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlVXBncmFkZVN1YnNjcmlwdGlvbigpIHtcblx0XHRpZiAoaXNJT1NBcHAoKSkge1xuXHRcdFx0Ly8gV2UgcGFzcyBgbnVsbGAgYmVjYXVzZSB3ZSBleHBlY3Qgbm8gc3Vic2NyaXB0aW9uIHdoZW4gdXBncmFkaW5nXG5cdFx0XHRjb25zdCBhcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcCA9IGF3YWl0IHF1ZXJ5QXBwU3RvcmVTdWJzY3JpcHRpb25Pd25lcnNoaXAobnVsbClcblxuXHRcdFx0aWYgKGFwcFN0b3JlU3Vic2NyaXB0aW9uT3duZXJzaGlwICE9PSBNb2JpbGVQYXltZW50U3Vic2NyaXB0aW9uT3duZXJzaGlwLk5vU3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcblx0XHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwic3RvcmVNdWx0aVN1YnNjcmlwdGlvbkVycm9yX21zZ1wiLCB7XG5cdFx0XHRcdFx0XHRcIntBcHBTdG9yZVBheW1lbnR9XCI6IEluZm9MaW5rLkFwcFN0b3JlUGF5bWVudCxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBzaG93VXBncmFkZVdpemFyZChsb2NhdG9yLmxvZ2lucylcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlQXBwU3RvcmVTdWJzY3JpcHRpb25DaGFuZ2UoKSB7XG5cdFx0aWYgKCF0aGlzLm1vYmlsZVBheW1lbnRzRmFjYWRlKSB7XG5cdFx0XHR0aHJvdyBFcnJvcihcIk5vdCBhbGxvd2VkIHRvIGNoYW5nZSBBcHBTdG9yZSBzdWJzY3JpcHRpb24gZnJvbSB3ZWIgY2xpZW50XCIpXG5cdFx0fVxuXG5cdFx0bGV0IGN1c3RvbWVyXG5cdFx0bGV0IGFjY291bnRpbmdJbmZvXG5cdFx0aWYgKHRoaXMuX2N1c3RvbWVyICYmIHRoaXMuX2FjY291bnRpbmdJbmZvKSB7XG5cdFx0XHRjdXN0b21lciA9IHRoaXMuX2N1c3RvbWVyXG5cdFx0XHRhY2NvdW50aW5nSW5mbyA9IHRoaXMuX2FjY291bnRpbmdJbmZvXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IGFwcFN0b3JlU3Vic2NyaXB0aW9uT3duZXJzaGlwID0gYXdhaXQgcXVlcnlBcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcChiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0RXh0VG9CYXNlNjQoY3VzdG9tZXIuX2lkKSkpXG5cdFx0Y29uc3QgaXNBcHBTdG9yZVBheW1lbnQgPSBnZXRQYXltZW50TWV0aG9kVHlwZShhY2NvdW50aW5nSW5mbykgPT09IFBheW1lbnRNZXRob2RUeXBlLkFwcFN0b3JlXG5cdFx0Y29uc3QgdXNlclN0YXR1cyA9IGN1c3RvbWVyLmFwcHJvdmFsU3RhdHVzXG5cdFx0Y29uc3QgaGFzQW5BY3RpdmVTdWJzY3JpcHRpb24gPSBpc0FwcFN0b3JlUGF5bWVudCAmJiBhY2NvdW50aW5nSW5mby5hcHBTdG9yZVN1YnNjcmlwdGlvbiAhPSBudWxsXG5cblx0XHRpZiAoaGFzQW5BY3RpdmVTdWJzY3JpcHRpb24gJiYgIShhd2FpdCB0aGlzLmNhbk1hbmFnZUFwcFN0b3JlU3Vic2NyaXB0aW9uSW5BcHAoYWNjb3VudGluZ0luZm8sIGFwcFN0b3JlU3Vic2NyaXB0aW9uT3duZXJzaGlwKSkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdC8vIFNob3cgYSBkaWFsb2cgb25seSBpZiB0aGUgdXNlcidzIEFwcGxlIGFjY291bnQncyBsYXN0IHRyYW5zYWN0aW9uIHdhcyB3aXRoIHRoaXMgY3VzdG9tZXIgSURcblx0XHQvL1xuXHRcdC8vIFRoaXMgcHJldmVudHMgdGhlIHVzZXIgZnJvbSBhY2NpZGVudGFsbHkgY2hhbmdpbmcgYSBzdWJzY3JpcHRpb24gdGhhdCB0aGV5IGRvbid0IG93blxuXHRcdGlmIChhcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcCA9PT0gTW9iaWxlUGF5bWVudFN1YnNjcmlwdGlvbk93bmVyc2hpcC5Ob3RPd25lcikge1xuXHRcdFx0Ly8gVGhlcmUncyBhIHN1YnNjcmlwdGlvbiB3aXRoIHRoaXMgYXBwbGUgYWNjb3VudCB0aGF0IGRvZXNuJ3QgYmVsb25nIHRvIHRoaXMgdXNlclxuXHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFxuXHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwic3RvcmVNdWx0aVN1YnNjcmlwdGlvbkVycm9yX21zZ1wiLCB7XG5cdFx0XHRcdFx0XCJ7QXBwU3RvcmVQYXltZW50fVwiOiBJbmZvTGluay5BcHBTdG9yZVBheW1lbnQsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSBpZiAoXG5cdFx0XHRpc0FwcFN0b3JlUGF5bWVudCAmJlxuXHRcdFx0YXBwU3RvcmVTdWJzY3JpcHRpb25Pd25lcnNoaXAgPT09IE1vYmlsZVBheW1lbnRTdWJzY3JpcHRpb25Pd25lcnNoaXAuTm9TdWJzY3JpcHRpb24gJiZcblx0XHRcdHVzZXJTdGF0dXMgPT09IEFwcHJvdmFsU3RhdHVzLlJFR0lTVFJBVElPTl9BUFBST1ZFRFxuXHRcdCkge1xuXHRcdFx0Ly8gVXNlciBoYXMgYW4gb25nb2luZyBzdWJzY3JpcHRpb25zIGJ1dCBub3Qgb24gdGhlIGN1cnJlbnQgQXBwbGUgQWNjb3VudCwgc28gd2Ugc2hvdWxkbid0IGFsbG93IHRoZW0gdG8gY2hhbmdlIHRoZWlyIHBsYW4gd2l0aCB0aGlzIGFjY291bnRcblx0XHRcdC8vIGluc3RlYWQgb2YgdGhlIGFjY291bnQgb3duZXIgb2YgdGhlIHN1YnNjcmlwdGlvbnNcblx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShsYW5nLmdldFRyYW5zbGF0aW9uKFwic3RvcmVOb1N1YnNjcmlwdGlvbl9tc2dcIiwgeyBcIntBcHBTdG9yZVBheW1lbnR9XCI6IEluZm9MaW5rLkFwcFN0b3JlUGF5bWVudCB9KSlcblx0XHR9IGVsc2UgaWYgKGFwcFN0b3JlU3Vic2NyaXB0aW9uT3duZXJzaGlwID09PSBNb2JpbGVQYXltZW50U3Vic2NyaXB0aW9uT3duZXJzaGlwLk5vU3Vic2NyaXB0aW9uKSB7XG5cdFx0XHQvLyBVc2VyIGhhcyBubyBvbmdvaW5nIHN1YnNjcmlwdGlvbiBhbmQgaXNuJ3QgYXBwcm92ZWQuIFdlIHNob3VsZCBhbGxvdyB0aGVtIHRvIGRvd25ncmFkZSB0aGVpciBhY2NvdW50cyBvciByZXN1YnNjcmliZSBhbmRcblx0XHRcdC8vIHJlc3RhcnQgYW4gQXBwbGUgU3Vic2NyaXB0aW9uIGZsb3dcblx0XHRcdGNvbnN0IGlzUmVzdWJzY3JpYmUgPSBhd2FpdCBEaWFsb2cuY2hvaWNlKFxuXHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwic3RvcmVEb3duZ3JhZGVPclJlc3Vic2NyaWJlX21zZ1wiLCB7IFwie0FwcFN0b3JlRG93bmdyYWRlfVwiOiBJbmZvTGluay5BcHBTdG9yZURvd25ncmFkZSB9KSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRleHQ6IFwiY2hhbmdlUGxhbl9hY3Rpb25cIixcblx0XHRcdFx0XHRcdHZhbHVlOiBmYWxzZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRleHQ6IFwicmVzdWJzY3JpYmVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHR2YWx1ZTogdHJ1ZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdLFxuXHRcdFx0KVxuXG5cdFx0XHRpZiAoaXNSZXN1YnNjcmliZSkge1xuXHRcdFx0XHRjb25zdCBwbGFuVHlwZSA9IGF3YWl0IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuZ2V0UGxhblR5cGUoKVxuXHRcdFx0XHRjb25zdCBjdXN0b21lcklkID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLmN1c3RvbWVyIVxuXHRcdFx0XHRjb25zdCBjdXN0b21lcklkQnl0ZXMgPSBiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0RXh0VG9CYXNlNjQoY3VzdG9tZXJJZCkpXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5tb2JpbGVQYXltZW50c0ZhY2FkZS5yZXF1ZXN0U3Vic2NyaXB0aW9uVG9QbGFuKFxuXHRcdFx0XHRcdFx0YXBwU3RvcmVQbGFuTmFtZShwbGFuVHlwZSksXG5cdFx0XHRcdFx0XHRhc1BheW1lbnRJbnRlcnZhbChhY2NvdW50aW5nSW5mby5wYXltZW50SW50ZXJ2YWwpLFxuXHRcdFx0XHRcdFx0Y3VzdG9tZXJJZEJ5dGVzLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTW9iaWxlUGF5bWVudEVycm9yKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKFwiQXBwU3RvcmUgc3Vic2NyaXB0aW9uIGZhaWxlZFwiLCBlKVxuXHRcdFx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJhcHBTdG9yZVN1YnNjcmlwdGlvbkVycm9yX21zZ1wiLCBlLm1lc3NhZ2UpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLl9jdXN0b21lckluZm8gJiYgdGhpcy5fbGFzdEJvb2tpbmcpIHtcblx0XHRcdFx0XHRyZXR1cm4gc2hvd1N3aXRjaERpYWxvZyhjdXN0b21lciwgdGhpcy5fY3VzdG9tZXJJbmZvLCBhY2NvdW50aW5nSW5mbywgdGhpcy5fbGFzdEJvb2tpbmcsIEF2YWlsYWJsZVBsYW5zLCBudWxsKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICh0aGlzLl9jdXN0b21lckluZm8gJiYgdGhpcy5fbGFzdEJvb2tpbmcpIHtcblx0XHRcdFx0cmV0dXJuIHNob3dTd2l0Y2hEaWFsb2coY3VzdG9tZXIsIHRoaXMuX2N1c3RvbWVySW5mbywgYWNjb3VudGluZ0luZm8sIHRoaXMuX2xhc3RCb29raW5nLCBBdmFpbGFibGVQbGFucywgbnVsbClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNhbk1hbmFnZUFwcFN0b3JlU3Vic2NyaXB0aW9uSW5BcHAoYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvLCBvd25lcnNoaXA6IE1vYmlsZVBheW1lbnRTdWJzY3JpcHRpb25Pd25lcnNoaXApOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRpZiAob3duZXJzaGlwID09PSBNb2JpbGVQYXltZW50U3Vic2NyaXB0aW9uT3duZXJzaGlwLk5vdE93bmVyKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblxuXHRcdGNvbnN0IGFwcFN0b3JlU3Vic2NyaXB0aW9uRGF0YSA9IGF3YWl0IGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yLmdldChcblx0XHRcdEFwcFN0b3JlU3Vic2NyaXB0aW9uU2VydmljZSxcblx0XHRcdGNyZWF0ZUFwcFN0b3JlU3Vic2NyaXB0aW9uR2V0SW4oeyBzdWJzY3JpcHRpb25JZDogZWxlbWVudElkUGFydChhc3NlcnROb3ROdWxsKGFjY291bnRpbmdJbmZvLmFwcFN0b3JlU3Vic2NyaXB0aW9uKSkgfSksXG5cdFx0KVxuXG5cdFx0aWYgKCFhcHBTdG9yZVN1YnNjcmlwdGlvbkRhdGEgfHwgYXBwU3RvcmVTdWJzY3JpcHRpb25EYXRhLmFwcCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIkZhaWxlZCB0byBkZXRlcm1pbmUgc3Vic2NyaXB0aW9uIG9yaWdpblwiKVxuXHRcdH1cblxuXHRcdGNvbnN0IGlzTWFpbFN1YnNjcmlwdGlvbiA9IGFwcFN0b3JlU3Vic2NyaXB0aW9uRGF0YS5hcHAgPT09IFN1YnNjcmlwdGlvbkFwcC5NYWlsXG5cblx0XHRpZiAoY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSAmJiBpc01haWxTdWJzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUFwcE9wZW4oU3Vic2NyaXB0aW9uQXBwLk1haWwpXG5cdFx0fSBlbHNlIGlmICghY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSAmJiAhaXNNYWlsU3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVBcHBPcGVuKFN1YnNjcmlwdGlvbkFwcC5DYWxlbmRhcilcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVBcHBPcGVuKGFwcDogU3Vic2NyaXB0aW9uQXBwKSB7XG5cdFx0Y29uc3QgYXBwTmFtZSA9IGFwcCA9PT0gU3Vic2NyaXB0aW9uQXBwLkNhbGVuZGFyID8gXCJUdXRhIENhbGVuZGFyXCIgOiBcIlR1dGEgTWFpbFwiXG5cdFx0Y29uc3QgZGlhbG9nUmVzdWx0ID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0obGFuZy5nZXRUcmFuc2xhdGlvbihcImhhbmRsZVN1YnNjcmlwdGlvbk9uQXBwX21zZ1wiLCB7IFwiezF9XCI6IGFwcE5hbWUgfSksIFwieWVzX2xhYmVsXCIpXG5cdFx0Y29uc3QgcXVlcnkgPSBzdHJpbmdUb0Jhc2U2NChgc2V0dGluZ3M9c3Vic2NyaXB0aW9uYClcblxuXHRcdGlmICghZGlhbG9nUmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRpZiAoYXBwID09PSBTdWJzY3JpcHRpb25BcHAuQ2FsZW5kYXIpIHtcblx0XHRcdGxvY2F0b3Iuc3lzdGVtRmFjYWRlLm9wZW5DYWxlbmRhckFwcChxdWVyeSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9jYXRvci5zeXN0ZW1GYWNhZGUub3Blbk1haWxBcHAocXVlcnkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRwcml2YXRlIG9wZW5BcHBEaWFsb2dDYWxsYmFjayhvcGVuOiBib29sZWFuLCBhcHA6IEFwcFR5cGUuTWFpbCB8IEFwcFR5cGUuQ2FsZW5kYXIpIHtcblx0XHRpZiAoIW9wZW4pIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IGFwcE5hbWUgPSBhcHAgPT09IEFwcFR5cGUuTWFpbCA/IFwiVHV0YSBNYWlsXCIgOiBcIlR1dGEgQ2FsZW5kYXJcIlxuXHR9XG5cblx0cHJpdmF0ZSBzaG93T3JkZXJBZ3JlZW1lbnQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIChcblx0XHRcdGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNQcmVtaXVtQWNjb3VudCgpICYmXG5cdFx0XHQoKHRoaXMuX2N1c3RvbWVyICE9IG51bGwgJiYgdGhpcy5fY3VzdG9tZXIuYnVzaW5lc3NVc2UpIHx8XG5cdFx0XHRcdCh0aGlzLl9jdXN0b21lciAhPSBudWxsICYmICh0aGlzLl9jdXN0b21lci5vcmRlclByb2Nlc3NpbmdBZ3JlZW1lbnQgIT0gbnVsbCB8fCB0aGlzLl9jdXN0b21lci5vcmRlclByb2Nlc3NpbmdBZ3JlZW1lbnROZWVkZWQpKSlcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZGF0ZUN1c3RvbWVyRGF0YShjdXN0b21lcjogQ3VzdG9tZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLl9jdXN0b21lciA9IGN1c3RvbWVyXG5cblx0XHRpZiAoY3VzdG9tZXIub3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50KSB7XG5cdFx0XHR0aGlzLl9vcmRlckFncmVlbWVudCA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoT3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50VHlwZVJlZiwgY3VzdG9tZXIub3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9vcmRlckFncmVlbWVudCA9IG51bGxcblx0XHR9XG5cblx0XHRpZiAoY3VzdG9tZXIub3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50TmVlZGVkKSB7XG5cdFx0XHR0aGlzLl9vcmRlckFncmVlbWVudEZpZWxkVmFsdWUobGFuZy5nZXQoXCJzaWduaW5nTmVlZGVkX21zZ1wiKSlcblx0XHR9IGVsc2UgaWYgKHRoaXMuX29yZGVyQWdyZWVtZW50KSB7XG5cdFx0XHR0aGlzLl9vcmRlckFncmVlbWVudEZpZWxkVmFsdWUoXG5cdFx0XHRcdGxhbmcuZ2V0KFwic2lnbmVkT25fbXNnXCIsIHtcblx0XHRcdFx0XHRcIntkYXRlfVwiOiBmb3JtYXREYXRlKHRoaXMuX29yZGVyQWdyZWVtZW50LnNpZ25hdHVyZURhdGUpLFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fb3JkZXJBZ3JlZW1lbnRGaWVsZFZhbHVlKGxhbmcuZ2V0KFwibm90U2lnbmVkX21zZ1wiKSlcblx0XHR9XG5cblx0XHRtLnJlZHJhdygpXG5cdH1cblxuXHRwcml2YXRlIHNob3dQcmljZURhdGEoKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgaXNBcHBTdG9yZVBheW1lbnQgPSB0aGlzLl9hY2NvdW50aW5nSW5mbyAmJiBnZXRQYXltZW50TWV0aG9kVHlwZSh0aGlzLl9hY2NvdW50aW5nSW5mbykgPT09IFBheW1lbnRNZXRob2RUeXBlLkFwcFN0b3JlXG5cdFx0cmV0dXJuIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNQcmVtaXVtQWNjb3VudCgpICYmICFpc0lPU0FwcCgpICYmICFpc0FwcFN0b3JlUGF5bWVudFxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVQcmljZUluZm8oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLnNob3dQcmljZURhdGEoKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgcHJpY2VTZXJ2aWNlUmV0dXJuID0gYXdhaXQgbG9jYXRvci5ib29raW5nRmFjYWRlLmdldEN1cnJlbnRQcmljZSgpXG5cdFx0aWYgKHByaWNlU2VydmljZVJldHVybi5jdXJyZW50UHJpY2VUaGlzUGVyaW9kICE9IG51bGwgJiYgcHJpY2VTZXJ2aWNlUmV0dXJuLmN1cnJlbnRQcmljZU5leHRQZXJpb2QgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHByaWNlU2VydmljZVJldHVybi5jdXJyZW50UHJpY2VUaGlzUGVyaW9kLnByaWNlICE9PSBwcmljZVNlcnZpY2VSZXR1cm4uY3VycmVudFByaWNlTmV4dFBlcmlvZC5wcmljZSkge1xuXHRcdFx0XHR0aGlzLl9jdXJyZW50UHJpY2VGaWVsZFZhbHVlKGZvcm1hdFByaWNlRGF0YVdpdGhJbmZvKHByaWNlU2VydmljZVJldHVybi5jdXJyZW50UHJpY2VUaGlzUGVyaW9kKSlcblxuXHRcdFx0XHR0aGlzLl9uZXh0UHJpY2VGaWVsZFZhbHVlKGZvcm1hdFByaWNlRGF0YVdpdGhJbmZvKG5ldmVyTnVsbChwcmljZVNlcnZpY2VSZXR1cm4uY3VycmVudFByaWNlTmV4dFBlcmlvZCkpKVxuXG5cdFx0XHRcdHRoaXMuX25leHRQZXJpb2RQcmljZVZpc2libGUgPSB0cnVlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9jdXJyZW50UHJpY2VGaWVsZFZhbHVlKGZvcm1hdFByaWNlRGF0YVdpdGhJbmZvKHByaWNlU2VydmljZVJldHVybi5jdXJyZW50UHJpY2VUaGlzUGVyaW9kKSlcblxuXHRcdFx0XHR0aGlzLl9uZXh0UGVyaW9kUHJpY2VWaXNpYmxlID0gZmFsc2Vcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fcGVyaW9kRW5kRGF0ZSA9IHByaWNlU2VydmljZVJldHVybi5wZXJpb2RFbmREYXRlXG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVBY2NvdW50SW5mb0RhdGEoYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvKSB7XG5cdFx0dGhpcy5fYWNjb3VudGluZ0luZm8gPSBhY2NvdW50aW5nSW5mb1xuXG5cdFx0dGhpcy5fc2VsZWN0ZWRTdWJzY3JpcHRpb25JbnRlcnZhbChhc1BheW1lbnRJbnRlcnZhbChhY2NvdW50aW5nSW5mby5wYXltZW50SW50ZXJ2YWwpKVxuXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVTdWJzY3JpcHRpb25GaWVsZCgpIHtcblx0XHRjb25zdCB1c2VyQ29udHJvbGxlciA9IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKClcblx0XHRjb25zdCBhY2NvdW50VHlwZTogQWNjb3VudFR5cGUgPSBkb3duY2FzdCh1c2VyQ29udHJvbGxlci51c2VyLmFjY291bnRUeXBlKVxuXHRcdGNvbnN0IHBsYW5UeXBlID0gYXdhaXQgdXNlckNvbnRyb2xsZXIuZ2V0UGxhblR5cGUoKVxuXG5cdFx0dGhpcy5fc3Vic2NyaXB0aW9uRmllbGRWYWx1ZShfZ2V0QWNjb3VudFR5cGVOYW1lKGFjY291bnRUeXBlLCBwbGFuVHlwZSkpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZGF0ZUJvb2tpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKVxuXG5cdFx0Y29uc3QgY3VzdG9tZXIgPSBhd2FpdCB1c2VyQ29udHJvbGxlci5sb2FkQ3VzdG9tZXIoKVxuXHRcdGxldCBjdXN0b21lckluZm86IEN1c3RvbWVySW5mb1xuXHRcdHRyeSB7XG5cdFx0XHRjdXN0b21lckluZm8gPSBhd2FpdCB1c2VyQ29udHJvbGxlci5sb2FkQ3VzdG9tZXJJbmZvKClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJjb3VsZCBub3QgdXBkYXRlIGJvb2tpbmdzIGFzIGN1c3RvbWVyIGluZm8gZG9lcyBub3QgZXhpc3QgKG1vdmVkIGJldHdlZW4gZnJlZS9wcmVtaXVtIGxpc3RzKVwiKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl9jdXN0b21lckluZm8gPSBjdXN0b21lckluZm9cblx0XHRjb25zdCBib29raW5ncyA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWRSYW5nZShCb29raW5nVHlwZVJlZiwgbmV2ZXJOdWxsKGN1c3RvbWVySW5mby5ib29raW5ncykuaXRlbXMsIEdFTkVSQVRFRF9NQVhfSUQsIDEsIHRydWUpXG5cdFx0dGhpcy5fbGFzdEJvb2tpbmcgPSBib29raW5ncy5sZW5ndGggPiAwID8gYm9va2luZ3NbYm9va2luZ3MubGVuZ3RoIC0gMV0gOiBudWxsXG5cdFx0dGhpcy5fY3VzdG9tZXIgPSBjdXN0b21lclxuXHRcdHRoaXMuY3VycmVudFBsYW5UeXBlID0gYXdhaXQgdXNlckNvbnRyb2xsZXIuZ2V0UGxhblR5cGUoKVxuXG5cdFx0Y29uc3QgcGxhbkNvbmZpZyA9IGF3YWl0IHVzZXJDb250cm9sbGVyLmdldFBsYW5Db25maWcoKVxuXHRcdGF3YWl0IHRoaXMudXBkYXRlU3Vic2NyaXB0aW9uRmllbGQoKVxuXG5cdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0dGhpcy51cGRhdGVVc2VyRmllbGQoKSxcblx0XHRcdHRoaXMudXBkYXRlU3RvcmFnZUZpZWxkKGN1c3RvbWVyLCBjdXN0b21lckluZm8pLFxuXHRcdFx0dGhpcy51cGRhdGVBbGlhc0ZpZWxkKCksXG5cdFx0XHR0aGlzLnVwZGF0ZUdyb3Vwc0ZpZWxkKCksXG5cdFx0XHR0aGlzLnVwZGF0ZVdoaXRlbGFiZWxGaWVsZChwbGFuQ29uZmlnKSxcblx0XHRcdHRoaXMudXBkYXRlU2hhcmluZ0ZpZWxkKHBsYW5Db25maWcpLFxuXHRcdFx0dGhpcy51cGRhdGVFdmVudEludml0ZXNGaWVsZChwbGFuQ29uZmlnKSxcblx0XHRcdHRoaXMudXBkYXRlQXV0b1Jlc3BvbmRlckZpZWxkKHBsYW5Db25maWcpLFxuXHRcdF0pXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVVc2VyRmllbGQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5fdXNlcnNGaWVsZFZhbHVlKFwiXCIgKyBNYXRoLm1heCgxLCBnZXRDdXJyZW50Q291bnQoQm9va2luZ0l0ZW1GZWF0dXJlVHlwZS5MZWdhY3lVc2VycywgdGhpcy5fbGFzdEJvb2tpbmcpKSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlU3RvcmFnZUZpZWxkKGN1c3RvbWVyOiBDdXN0b21lciwgY3VzdG9tZXJJbmZvOiBDdXN0b21lckluZm8pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB1c2VkU3RvcmFnZSA9IGF3YWl0IGxvY2F0b3IuY3VzdG9tZXJGYWNhZGUucmVhZFVzZWRDdXN0b21lclN0b3JhZ2UoZ2V0RXRJZChjdXN0b21lcikpXG5cdFx0Y29uc3QgdXNlZFN0b3JhZ2VGb3JtYXR0ZWQgPSBmb3JtYXRTdG9yYWdlU2l6ZShOdW1iZXIodXNlZFN0b3JhZ2UpKVxuXHRcdGNvbnN0IHRvdGFsU3RvcmFnZUZvcm1hdHRlZCA9IGZvcm1hdFN0b3JhZ2VTaXplKGdldFRvdGFsU3RvcmFnZUNhcGFjaXR5UGVyQ3VzdG9tZXIoY3VzdG9tZXIsIGN1c3RvbWVySW5mbywgdGhpcy5fbGFzdEJvb2tpbmcpICogQ29uc3QuTUVNT1JZX0dCX0ZBQ1RPUilcblxuXHRcdHRoaXMuX3N0b3JhZ2VGaWVsZFZhbHVlKFxuXHRcdFx0bGFuZy5nZXQoXCJhbW91bnRVc2VkT2ZfbGFiZWxcIiwge1xuXHRcdFx0XHRcInthbW91bnR9XCI6IHVzZWRTdG9yYWdlRm9ybWF0dGVkLFxuXHRcdFx0XHRcInt0b3RhbEFtb3VudH1cIjogdG90YWxTdG9yYWdlRm9ybWF0dGVkLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVBbGlhc0ZpZWxkKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIHdlIHBhc3MgaW4gdGhlIHVzZXIgZ3JvdXAgaWQgaGVyZSBldmVuIHRob3VnaCBmb3IgbGVnYWN5IHBsYW5zIHRoZSBpZCBpcyBpZ25vcmVkXG5cdFx0Y29uc3QgY291bnRlcnMgPSBhd2FpdCBsb2NhdG9yLm1haWxBZGRyZXNzRmFjYWRlLmdldEFsaWFzQ291bnRlcnMobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLnVzZXJHcm91cC5ncm91cClcblx0XHR0aGlzLl9lbWFpbEFsaWFzRmllbGRWYWx1ZShcblx0XHRcdGxhbmcuZ2V0KFwiYW1vdW50VXNlZEFuZEFjdGl2YXRlZE9mX2xhYmVsXCIsIHtcblx0XHRcdFx0XCJ7dXNlZH1cIjogY291bnRlcnMudXNlZEFsaWFzZXMsXG5cdFx0XHRcdFwie2FjdGl2ZX1cIjogY291bnRlcnMuZW5hYmxlZEFsaWFzZXMsXG5cdFx0XHRcdFwie3RvdGFsQW1vdW50fVwiOiBjb3VudGVycy50b3RhbEFsaWFzZXMsXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZGF0ZUdyb3Vwc0ZpZWxkKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGxldCBsb2NhbEFkbWluQ291bnQgPSBnZXRDdXJyZW50Q291bnQoQm9va2luZ0l0ZW1GZWF0dXJlVHlwZS5Mb2NhbEFkbWluR3JvdXAsIHRoaXMuX2xhc3RCb29raW5nKVxuXHRcdGNvbnN0IGxvY2FsQWRtaW5UZXh0ID0gbG9jYWxBZG1pbkNvdW50ICsgXCIgXCIgKyBsYW5nLmdldChsb2NhbEFkbWluQ291bnQgPT09IDEgPyBcImxvY2FsQWRtaW5Hcm91cF9sYWJlbFwiIDogXCJsb2NhbEFkbWluR3JvdXBzX2xhYmVsXCIpXG5cdFx0bGV0IHNoYXJlZE1haWxDb3VudCA9IGdldEN1cnJlbnRDb3VudChCb29raW5nSXRlbUZlYXR1cmVUeXBlLlNoYXJlZE1haWxHcm91cCwgdGhpcy5fbGFzdEJvb2tpbmcpXG5cdFx0Y29uc3Qgc2hhcmVkTWFpbFRleHQgPSBzaGFyZWRNYWlsQ291bnQgKyBcIiBcIiArIGxhbmcuZ2V0KHNoYXJlZE1haWxDb3VudCA9PT0gMSA/IFwic2hhcmVkTWFpbGJveF9sYWJlbFwiIDogXCJzaGFyZWRNYWlsYm94ZXNfbGFiZWxcIilcblxuXHRcdGlmIChsb2NhbEFkbWluQ291bnQgPT09IDApIHtcblx0XHRcdC8vIGFsc28gc2hvdyB0aGUgc2hhcmVkIG1haWxib3hlcyB0ZXh0IGlmIG5vIGdyb3VwcyBleGlzdHMgYXQgYWxsXG5cdFx0XHR0aGlzLl9ncm91cHNGaWVsZFZhbHVlKHNoYXJlZE1haWxUZXh0KVxuXHRcdH0gZWxzZSBpZiAobG9jYWxBZG1pbkNvdW50ID4gMCAmJiBzaGFyZWRNYWlsQ291bnQgPiAwKSB7XG5cdFx0XHR0aGlzLl9ncm91cHNGaWVsZFZhbHVlKHNoYXJlZE1haWxUZXh0ICsgXCIsIFwiICsgbG9jYWxBZG1pblRleHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX2dyb3Vwc0ZpZWxkVmFsdWUobG9jYWxBZG1pblRleHQpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVXaGl0ZWxhYmVsRmllbGQocGxhbkNvbmZpZzogUGxhbkNvbmZpZ3VyYXRpb24pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoaXNXaGl0ZWxhYmVsQWN0aXZlKHRoaXMuX2xhc3RCb29raW5nLCBwbGFuQ29uZmlnKSkge1xuXHRcdFx0dGhpcy5fd2hpdGVsYWJlbEZpZWxkVmFsdWUobGFuZy5nZXQoXCJhY3RpdmVfbGFiZWxcIikpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX3doaXRlbGFiZWxGaWVsZFZhbHVlKGxhbmcuZ2V0KFwiZGVhY3RpdmF0ZWRfbGFiZWxcIikpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVTaGFyaW5nRmllbGQocGxhbkNvbmZpZzogUGxhbkNvbmZpZ3VyYXRpb24pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoaXNTaGFyaW5nQWN0aXZlKHRoaXMuX2xhc3RCb29raW5nLCBwbGFuQ29uZmlnKSkge1xuXHRcdFx0dGhpcy5fc2hhcmluZ0ZpZWxkVmFsdWUobGFuZy5nZXQoXCJhY3RpdmVfbGFiZWxcIikpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX3NoYXJpbmdGaWVsZFZhbHVlKGxhbmcuZ2V0KFwiZGVhY3RpdmF0ZWRfbGFiZWxcIikpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVFdmVudEludml0ZXNGaWVsZChwbGFuQ29uZmlnOiBQbGFuQ29uZmlndXJhdGlvbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghdGhpcy5fY3VzdG9tZXIpIHtcblx0XHRcdHRoaXMuX2V2ZW50SW52aXRlc0ZpZWxkVmFsdWUoXCJcIilcblx0XHR9IGVsc2UgaWYgKGlzRXZlbnRJbnZpdGVzQWN0aXZlKHRoaXMuX2xhc3RCb29raW5nLCBwbGFuQ29uZmlnKSkge1xuXHRcdFx0dGhpcy5fZXZlbnRJbnZpdGVzRmllbGRWYWx1ZShsYW5nLmdldChcImFjdGl2ZV9sYWJlbFwiKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fZXZlbnRJbnZpdGVzRmllbGRWYWx1ZShsYW5nLmdldChcImRlYWN0aXZhdGVkX2xhYmVsXCIpKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlQXV0b1Jlc3BvbmRlckZpZWxkKHBsYW5Db25maWc6IFBsYW5Db25maWd1cmF0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLl9jdXN0b21lcikge1xuXHRcdFx0dGhpcy5fYXV0b1Jlc3BvbmRlckZpZWxkVmFsdWUoXCJcIilcblx0XHR9IGVsc2UgaWYgKGlzQXV0b1Jlc3BvbmRlckFjdGl2ZSh0aGlzLl9sYXN0Qm9va2luZywgcGxhbkNvbmZpZykpIHtcblx0XHRcdHRoaXMuX2F1dG9SZXNwb25kZXJGaWVsZFZhbHVlKGxhbmcuZ2V0KFwiYWN0aXZlX2xhYmVsXCIpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9hdXRvUmVzcG9uZGVyRmllbGRWYWx1ZShsYW5nLmdldChcImRlYWN0aXZhdGVkX2xhYmVsXCIpKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCBwcm9taXNlTWFwKHVwZGF0ZXMsICh1cGRhdGUpID0+IHRoaXMucHJvY2Vzc1VwZGF0ZSh1cGRhdGUpKVxuXHR9XG5cblx0YXN5bmMgcHJvY2Vzc1VwZGF0ZSh1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB7IGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkIH0gPSB1cGRhdGVcblxuXHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQWNjb3VudGluZ0luZm9UeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHRjb25zdCBhY2NvdW50aW5nSW5mbyA9IGF3YWl0IGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWQoQWNjb3VudGluZ0luZm9UeXBlUmVmLCBpbnN0YW5jZUlkKVxuXHRcdFx0dGhpcy51cGRhdGVBY2NvdW50SW5mb0RhdGEoYWNjb3VudGluZ0luZm8pXG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVQcmljZUluZm8oKVxuXHRcdH0gZWxzZSBpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKFVzZXJUeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZUJvb2tpbmdzKClcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZVByaWNlSW5mbygpXG5cdFx0fSBlbHNlIGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQm9va2luZ1R5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQm9va2luZ3MoKVxuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlUHJpY2VJbmZvKClcblx0XHR9IGVsc2UgaWYgKGlzVXBkYXRlRm9yVHlwZVJlZihDdXN0b21lclR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZChDdXN0b21lclR5cGVSZWYsIGluc3RhbmNlSWQpXG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVDdXN0b21lckRhdGEoY3VzdG9tZXIpXG5cdFx0fSBlbHNlIGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQ3VzdG9tZXJJbmZvVHlwZVJlZiwgdXBkYXRlKSkge1xuXHRcdFx0Ly8gbmVlZGVkIHRvIHVwZGF0ZSB0aGUgZGlzcGxheWVkIHBsYW5cblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQm9va2luZ3MoKVxuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlUHJpY2VJbmZvKClcblx0XHR9IGVsc2UgaWYgKGlzVXBkYXRlRm9yVHlwZVJlZihHaWZ0Q2FyZFR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdGNvbnN0IGdpZnRDYXJkID0gYXdhaXQgbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZChHaWZ0Q2FyZFR5cGVSZWYsIFtpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZF0pXG5cdFx0XHR0aGlzLl9naWZ0Q2FyZHMuc2V0KGVsZW1lbnRJZFBhcnQoZ2lmdENhcmQuX2lkKSwgZ2lmdENhcmQpXG5cdFx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUpIHRoaXMuX2dpZnRDYXJkc0V4cGFuZGVkKHRydWUpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJJbnRlcnZhbHMoKSB7XG5cdFx0Y29uc3QgaXNBcHBTdG9yZVBheW1lbnQgPSB0aGlzLl9hY2NvdW50aW5nSW5mbyAmJiBnZXRQYXltZW50TWV0aG9kVHlwZSh0aGlzLl9hY2NvdW50aW5nSW5mbykgPT09IFBheW1lbnRNZXRob2RUeXBlLkFwcFN0b3JlXG5cdFx0aWYgKGlzSU9TQXBwKCkgfHwgaXNBcHBTdG9yZVBheW1lbnQpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvblBlcmlvZHM6IFNlbGVjdG9ySXRlbUxpc3Q8UGF5bWVudEludGVydmFsIHwgbnVsbD4gPSBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IGxhbmcuZ2V0KFwicHJpY2luZy55ZWFybHlfbGFiZWxcIiksXG5cdFx0XHRcdHZhbHVlOiBQYXltZW50SW50ZXJ2YWwuWWVhcmx5LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogbGFuZy5nZXQoXCJwcmljaW5nLm1vbnRobHlfbGFiZWxcIiksXG5cdFx0XHRcdHZhbHVlOiBQYXltZW50SW50ZXJ2YWwuTW9udGhseSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IGxhbmcuZ2V0KFwibG9hZGluZ19tc2dcIiksXG5cdFx0XHRcdHZhbHVlOiBudWxsLFxuXHRcdFx0XHRzZWxlY3RhYmxlOiBmYWxzZSxcblx0XHRcdH0sXG5cdFx0XVxuXG5cdFx0Y29uc3QgYm9udXNNb250aHMgPSB0aGlzLl9sYXN0Qm9va2luZyA/IE51bWJlcih0aGlzLl9sYXN0Qm9va2luZy5ib251c01vbnRoKSA6IDBcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRcdGxhYmVsOiBcInBheW1lbnRJbnRlcnZhbF9sYWJlbFwiLFxuXHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+IHRoaXMuZ2V0Q2hhcmdlRGF0ZVRleHQoKSxcblx0XHRcdFx0aXRlbXM6IHN1YnNjcmlwdGlvblBlcmlvZHMsXG5cdFx0XHRcdHNlbGVjdGVkVmFsdWU6IHRoaXMuX3NlbGVjdGVkU3Vic2NyaXB0aW9uSW50ZXJ2YWwoKSxcblx0XHRcdFx0ZHJvcGRvd25XaWR0aDogMzAwLFxuXHRcdFx0XHRzZWxlY3Rpb25DaGFuZ2VkSGFuZGxlcjogKHZhbHVlOiBudW1iZXIpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5fYWNjb3VudGluZ0luZm8pIHtcblx0XHRcdFx0XHRcdHNob3dDaGFuZ2VTdWJzY3JpcHRpb25JbnRlcnZhbERpYWxvZyh0aGlzLl9hY2NvdW50aW5nSW5mbywgdmFsdWUsIHRoaXMuX3BlcmlvZEVuZERhdGUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0XHRib251c01vbnRocyA9PT0gMFxuXHRcdFx0XHQ/IG51bGxcblx0XHRcdFx0OiBtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiYm9udXNfbGFiZWxcIixcblx0XHRcdFx0XHRcdHZhbHVlOiBsYW5nLmdldChcImJvbnVzTW9udGhfbXNnXCIsIHsgXCJ7bW9udGhzfVwiOiBib251c01vbnRocyB9KSxcblx0XHRcdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRcdCAgfSksXG5cdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRsYWJlbDpcblx0XHRcdFx0XHR0aGlzLl9uZXh0UGVyaW9kUHJpY2VWaXNpYmxlICYmIHRoaXMuX3BlcmlvZEVuZERhdGVcblx0XHRcdFx0XHRcdD8gbGFuZy5nZXRUcmFuc2xhdGlvbihcInByaWNlVGlsbF9sYWJlbFwiLCB7XG5cdFx0XHRcdFx0XHRcdFx0XCJ7ZGF0ZX1cIjogZm9ybWF0RGF0ZSh0aGlzLl9wZXJpb2RFbmREYXRlKSxcblx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdDogXCJwcmljZV9sYWJlbFwiLFxuXHRcdFx0XHR2YWx1ZTogdGhpcy5fY3VycmVudFByaWNlRmllbGRWYWx1ZSgpLFxuXHRcdFx0XHRvbmlucHV0OiB0aGlzLl9jdXJyZW50UHJpY2VGaWVsZFZhbHVlLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+ICh0aGlzLl9jdXN0b21lciAmJiB0aGlzLl9jdXN0b21lci5idXNpbmVzc1VzZSA9PT0gdHJ1ZSA/IGxhbmcuZ2V0KFwicHJpY2luZy5zdWJzY3JpcHRpb25QZXJpb2RJbmZvQnVzaW5lc3NfbXNnXCIpIDogbnVsbCksXG5cdFx0XHR9KSxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckFncmVlbWVudCgpIHtcblx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBcIm9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudF9sYWJlbFwiLFxuXHRcdFx0aGVscExhYmVsOiAoKSA9PiBsYW5nLmdldChcIm9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudEluZm9fbXNnXCIpLFxuXHRcdFx0dmFsdWU6IHRoaXMuX29yZGVyQWdyZWVtZW50RmllbGRWYWx1ZSgpLFxuXHRcdFx0b25pbnB1dDogdGhpcy5fb3JkZXJBZ3JlZW1lbnRGaWVsZFZhbHVlLFxuXHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdGluamVjdGlvbnNSaWdodDogKCkgPT4ge1xuXHRcdFx0XHRpZiAodGhpcy5fb3JkZXJBZ3JlZW1lbnQgJiYgdGhpcy5fY3VzdG9tZXIgJiYgdGhpcy5fY3VzdG9tZXIub3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50TmVlZGVkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFt0aGlzLnJlbmRlclNpZ25Qcm9jZXNzaW5nQWdyZWVtZW50QWN0aW9uKCksIHRoaXMucmVuZGVyU2hvd1Byb2Nlc3NpbmdBZ3JlZW1lbnRBY3Rpb24oKV1cblx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLl9vcmRlckFncmVlbWVudCkge1xuXHRcdFx0XHRcdHJldHVybiBbdGhpcy5yZW5kZXJTaG93UHJvY2Vzc2luZ0FncmVlbWVudEFjdGlvbigpXVxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuX2N1c3RvbWVyICYmIHRoaXMuX2N1c3RvbWVyLm9yZGVyUHJvY2Vzc2luZ0FncmVlbWVudE5lZWRlZCkge1xuXHRcdFx0XHRcdHJldHVybiBbdGhpcy5yZW5kZXJTaWduUHJvY2Vzc2luZ0FncmVlbWVudEFjdGlvbigpXVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBbXVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclNob3dQcm9jZXNzaW5nQWdyZWVtZW50QWN0aW9uKCkge1xuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcInNob3dfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT5cblx0XHRcdFx0bG9jYXRvci5lbnRpdHlDbGllbnRcblx0XHRcdFx0XHQubG9hZChHcm91cEluZm9UeXBlUmVmLCBuZXZlck51bGwodGhpcy5fb3JkZXJBZ3JlZW1lbnQpLnNpZ25lclVzZXJHcm91cEluZm8pXG5cdFx0XHRcdFx0LnRoZW4oKHNpZ25lclVzZXJHcm91cEluZm8pID0+IFNpZ25PcmRlckFncmVlbWVudERpYWxvZy5zaG93Rm9yVmlld2luZyhuZXZlck51bGwodGhpcy5fb3JkZXJBZ3JlZW1lbnQpLCBzaWduZXJVc2VyR3JvdXBJbmZvKSksXG5cdFx0XHRpY29uOiBJY29ucy5Eb3dubG9hZCxcblx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTaWduUHJvY2Vzc2luZ0FncmVlbWVudEFjdGlvbigpIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJzaWduX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IFNpZ25PcmRlckFncmVlbWVudERpYWxvZy5zaG93Rm9yU2lnbmluZyhuZXZlck51bGwodGhpcy5fY3VzdG9tZXIpLCBuZXZlck51bGwodGhpcy5fYWNjb3VudGluZ0luZm8pKSxcblx0XHRcdGljb246IEljb25zLkVkaXQsXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0Q2hhcmdlRGF0ZVRleHQoKTogc3RyaW5nIHtcblx0XHRpZiAodGhpcy5fcGVyaW9kRW5kRGF0ZSkge1xuXHRcdFx0Y29uc3QgY2hhcmdlRGF0ZSA9IGZvcm1hdERhdGUoaW5jcmVtZW50RGF0ZShuZXcgRGF0ZSh0aGlzLl9wZXJpb2RFbmREYXRlKSwgMSkpXG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJuZXh0Q2hhcmdlT25fbGFiZWxcIiwgeyBcIntjaGFyZ2VEYXRlfVwiOiBjaGFyZ2VEYXRlIH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBcIlwiXG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIF9nZXRBY2NvdW50VHlwZU5hbWUodHlwZTogQWNjb3VudFR5cGUsIHN1YnNjcmlwdGlvbjogUGxhblR5cGUpOiBzdHJpbmcge1xuXHRpZiAodHlwZSA9PT0gQWNjb3VudFR5cGUuUEFJRCkge1xuXHRcdHJldHVybiBnZXREaXNwbGF5TmFtZU9mUGxhblR5cGUoc3Vic2NyaXB0aW9uKVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBBY2NvdW50VHlwZU5hbWVzW3R5cGVdXG5cdH1cbn1cblxuZnVuY3Rpb24gc2hvd0NoYW5nZVN1YnNjcmlwdGlvbkludGVydmFsRGlhbG9nKGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbywgcGF5bWVudEludGVydmFsOiBQYXltZW50SW50ZXJ2YWwsIHBlcmlvZEVuZERhdGU6IERhdGUgfCBudWxsKTogdm9pZCB7XG5cdGlmIChhY2NvdW50aW5nSW5mbyAmJiBhY2NvdW50aW5nSW5mby5pbnZvaWNlQ291bnRyeSAmJiBhc1BheW1lbnRJbnRlcnZhbChhY2NvdW50aW5nSW5mby5wYXltZW50SW50ZXJ2YWwpICE9PSBwYXltZW50SW50ZXJ2YWwpIHtcblx0XHRjb25zdCBjb25maXJtYXRpb25NZXNzYWdlID0gcGVyaW9kRW5kRGF0ZVxuXHRcdFx0PyBsYW5nLmdldFRyYW5zbGF0aW9uKFwic3Vic2NyaXB0aW9uQ2hhbmdlUGVyaW9kX21zZ1wiLCB7XG5cdFx0XHRcdFx0XCJ7MX1cIjogZm9ybWF0RGF0ZShwZXJpb2RFbmREYXRlKSxcblx0XHRcdCAgfSlcblx0XHRcdDogXCJzdWJzY3JpcHRpb25DaGFuZ2VfbXNnXCJcblxuXHRcdERpYWxvZy5jb25maXJtKGNvbmZpcm1hdGlvbk1lc3NhZ2UpLnRoZW4oYXN5bmMgKGNvbmZpcm1lZCkgPT4ge1xuXHRcdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0XHRhd2FpdCBsb2NhdG9yLmN1c3RvbWVyRmFjYWRlLmNoYW5nZVBheW1lbnRJbnRlcnZhbChhY2NvdW50aW5nSW5mbywgcGF5bWVudEludGVydmFsKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyR2lmdENhcmRUYWJsZShnaWZ0Q2FyZHM6IEdpZnRDYXJkW10sIGlzUHJlbWl1bVByZWRpY2F0ZTogKCkgPT4gYm9vbGVhbik6IENoaWxkcmVuIHtcblx0Y29uc3QgYWRkQnV0dG9uQXR0cnM6IEljb25CdXR0b25BdHRycyA9IHtcblx0XHR0aXRsZTogXCJidXlHaWZ0Q2FyZF9sYWJlbFwiLFxuXHRcdGNsaWNrOiBjcmVhdGVOb3RBdmFpbGFibGVGb3JGcmVlQ2xpY2tIYW5kbGVyKE5ld1BhaWRQbGFucywgKCkgPT4gc2hvd1B1cmNoYXNlR2lmdENhcmREaWFsb2coKSwgaXNQcmVtaXVtUHJlZGljYXRlKSxcblx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHR9XG5cdGNvbnN0IGNvbHVtbkhlYWRpbmc6IFtUcmFuc2xhdGlvbktleSwgVHJhbnNsYXRpb25LZXldID0gW1wicHVyY2hhc2VEYXRlX2xhYmVsXCIsIFwidmFsdWVfbGFiZWxcIl1cblx0Y29uc3QgY29sdW1uV2lkdGhzID0gW0NvbHVtbldpZHRoLkxhcmdlc3QsIENvbHVtbldpZHRoLlNtYWxsLCBDb2x1bW5XaWR0aC5TbWFsbF1cblx0Y29uc3QgbGluZXMgPSBnaWZ0Q2FyZHNcblx0XHQuZmlsdGVyKChnaWZ0Q2FyZCkgPT4gZ2lmdENhcmQuc3RhdHVzID09PSBHaWZ0Q2FyZFN0YXR1cy5Vc2FibGUpXG5cdFx0Lm1hcCgoZ2lmdENhcmQpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNlbGxzOiBbZm9ybWF0RGF0ZShnaWZ0Q2FyZC5vcmRlckRhdGUpLCBmb3JtYXRQcmljZShwYXJzZUZsb2F0KGdpZnRDYXJkLnZhbHVlKSwgdHJ1ZSldLFxuXHRcdFx0XHRhY3Rpb25CdXR0b25BdHRyczogYXR0YWNoRHJvcGRvd24oe1xuXHRcdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdFx0dGl0bGU6IFwib3B0aW9uc19hY3Rpb25cIixcblx0XHRcdFx0XHRcdGljb246IEljb25zLk1vcmUsXG5cdFx0XHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRjaGlsZEF0dHJzOiAoKSA9PiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcInZpZXdfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHNob3dHaWZ0Q2FyZFRvU2hhcmUoZ2lmdENhcmQpLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiZWRpdF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgbWVzc2FnZSA9IHN0cmVhbShnaWZ0Q2FyZC5tZXNzYWdlKVxuXHRcdFx0XHRcdFx0XHRcdERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBcImVkaXRNZXNzYWdlX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRjaGlsZDogKCkgPT5cblx0XHRcdFx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LWNlbnRlclwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG0oR2lmdENhcmRNZXNzYWdlRWRpdG9yRmllbGQsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG9uTWVzc2FnZUNoYW5nZWQ6IG1lc3NhZ2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdFx0XHRva0FjdGlvbjogKGRpYWxvZzogRGlhbG9nKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGdpZnRDYXJkLm1lc3NhZ2UgPSBtZXNzYWdlKClcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG9jYXRvci5lbnRpdHlDbGllbnRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQudXBkYXRlKGdpZnRDYXJkKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKCgpID0+IGRpYWxvZy5jbG9zZSgpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5jYXRjaCgoKSA9PiBEaWFsb2cubWVzc2FnZShcImdpZnRDYXJkVXBkYXRlRXJyb3JfbXNnXCIpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzaG93R2lmdENhcmRUb1NoYXJlKGdpZnRDYXJkKVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdG9rQWN0aW9uVGV4dElkOiBcInNhdmVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR0eXBlOiBEaWFsb2dUeXBlLkVkaXRTbWFsbCxcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHR9KSxcblx0XHRcdH1cblx0XHR9KVxuXHRyZXR1cm4gW1xuXHRcdG0oVGFibGUsIHtcblx0XHRcdGFkZEJ1dHRvbkF0dHJzLFxuXHRcdFx0Y29sdW1uSGVhZGluZyxcblx0XHRcdGNvbHVtbldpZHRocyxcblx0XHRcdGxpbmVzLFxuXHRcdFx0c2hvd0FjdGlvbkJ1dHRvbkNvbHVtbjogdHJ1ZSxcblx0XHR9KSxcblx0XHRtKFwiLnNtYWxsXCIsIHJlbmRlclRlcm1zQW5kQ29uZGl0aW9uc0J1dHRvbihUZXJtc1NlY3Rpb24uR2lmdENhcmRzLCBDVVJSRU5UX0dJRlRfQ0FSRF9URVJNU19WRVJTSU9OKSksXG5cdF1cbn1cbiIsImltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgbGFuZywgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IEFjY291bnRpbmdJbmZvLCBCb29raW5nLCBjcmVhdGVTdXJ2ZXlEYXRhLCBjcmVhdGVTd2l0Y2hBY2NvdW50VHlwZVBvc3RJbiwgQ3VzdG9tZXIsIEN1c3RvbWVySW5mbywgU3VydmV5RGF0YSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7XG5cdEFjY291bnRUeXBlLFxuXHRBdmFpbGFibGVQbGFuVHlwZSxcblx0Qm9va2luZ0ZhaWx1cmVSZWFzb24sXG5cdENvbnN0LFxuXHRnZXRQYXltZW50TWV0aG9kVHlwZSxcblx0SW52b2ljZURhdGEsXG5cdEtleXMsXG5cdExlZ2FjeVBsYW5zLFxuXHROZXdCdXNpbmVzc1BsYW5zLFxuXHRQYXltZW50TWV0aG9kVHlwZSxcblx0UGxhblR5cGUsXG5cdFBsYW5UeXBlVG9OYW1lLFxuXHRVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24sXG59IGZyb20gXCIuLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IFN1YnNjcmlwdGlvbkFjdGlvbkJ1dHRvbnMsIFN1YnNjcmlwdGlvblNlbGVjdG9yIH0gZnJvbSBcIi4vU3Vic2NyaXB0aW9uU2VsZWN0b3JcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IERpYWxvZ0hlYWRlckJhckF0dHJzIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ0hlYWRlckJhclwiXG5pbXBvcnQgdHlwZSB7IEN1cnJlbnRQbGFuSW5mbyB9IGZyb20gXCIuL1N3aXRjaFN1YnNjcmlwdGlvbkRpYWxvZ01vZGVsXCJcbmltcG9ydCB7IFN3aXRjaFN1YnNjcmlwdGlvbkRpYWxvZ01vZGVsIH0gZnJvbSBcIi4vU3dpdGNoU3Vic2NyaXB0aW9uRGlhbG9nTW9kZWxcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IFN3aXRjaEFjY291bnRUeXBlU2VydmljZSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IEJhZFJlcXVlc3RFcnJvciwgSW52YWxpZERhdGFFcnJvciwgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgRmVhdHVyZUxpc3RQcm92aWRlciB9IGZyb20gXCIuL0ZlYXR1cmVMaXN0UHJvdmlkZXJcIlxuaW1wb3J0IHsgUGF5bWVudEludGVydmFsLCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4vUHJpY2VVdGlsc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBiYXNlNjRFeHRUb0Jhc2U2NCwgYmFzZTY0VG9VaW50OEFycmF5LCBkZWxheSwgZG93bmNhc3QsIGxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHNob3dTd2l0Y2hUb0J1c2luZXNzSW52b2ljZURhdGFEaWFsb2cgfSBmcm9tIFwiLi9Td2l0Y2hUb0J1c2luZXNzSW52b2ljZURhdGFEaWFsb2cuanNcIlxuaW1wb3J0IHsgZ2V0QnlBYmJyZXZpYXRpb24gfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9Db3VudHJ5TGlzdC5qc1wiXG5pbXBvcnQgeyBmb3JtYXROYW1lQW5kQWRkcmVzcyB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkZvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uL2d1aS9iYXNlL2J1dHRvbnMvTG9naW5CdXR0b24uanNcIlxuaW1wb3J0IHsgc2hvd0xlYXZpbmdVc2VyU3VydmV5V2l6YXJkIH0gZnJvbSBcIi4vTGVhdmluZ1VzZXJTdXJ2ZXlXaXphcmQuanNcIlxuaW1wb3J0IHsgU1VSVkVZX1ZFUlNJT05fTlVNQkVSIH0gZnJvbSBcIi4vTGVhdmluZ1VzZXJTdXJ2ZXlDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgaXNJT1NBcHAgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgTW9iaWxlUGF5bWVudFN1YnNjcmlwdGlvbk93bmVyc2hpcCB9IGZyb20gXCIuLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVQYXltZW50U3Vic2NyaXB0aW9uT3duZXJzaGlwLmpzXCJcbmltcG9ydCB7IHNob3dNYW5hZ2VUaHJvdWdoQXBwU3RvcmVEaWFsb2cgfSBmcm9tIFwiLi9QYXltZW50Vmlld2VyLmpzXCJcbmltcG9ydCB7IGFwcFN0b3JlUGxhbk5hbWUsIGhhc1J1bm5pbmdBcHBTdG9yZVN1YnNjcmlwdGlvbiB9IGZyb20gXCIuL1N1YnNjcmlwdGlvblV0aWxzLmpzXCJcbmltcG9ydCB7IE1vYmlsZVBheW1lbnRFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL01vYmlsZVBheW1lbnRFcnJvci5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi8uLi9tYWlsLWFwcC9tYWlsTG9jYXRvclwiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vbWlzYy9DbGllbnREZXRlY3Rvci5qc1wiXG5pbXBvcnQgeyBTdWJzY3JpcHRpb25BcHAgfSBmcm9tIFwiLi9TdWJzY3JpcHRpb25WaWV3ZXIuanNcIlxuXG4vKipcbiAqIEFsbG93cyBjYW5jZWxsaW5nIHRoZSBzdWJzY3JpcHRpb24gKG9ubHkgcHJpdmF0ZSB1c2UpIGFuZCBzd2l0Y2hpbmcgdGhlIHN1YnNjcmlwdGlvbiB0byBhIGRpZmZlcmVudCBwYWlkIHN1YnNjcmlwdGlvbi5cbiAqIE5vdGU6IE9ubHkgc2hvd24gaWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBhIFByZW1pdW0gdXNlci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dTd2l0Y2hEaWFsb2coXG5cdGN1c3RvbWVyOiBDdXN0b21lcixcblx0Y3VzdG9tZXJJbmZvOiBDdXN0b21lckluZm8sXG5cdGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyxcblx0bGFzdEJvb2tpbmc6IEJvb2tpbmcsXG5cdGFjY2VwdGVkUGxhbnM6IEF2YWlsYWJsZVBsYW5UeXBlW10sXG5cdHJlYXNvbjogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGwsXG4pOiBQcm9taXNlPHZvaWQ+IHtcblx0aWYgKGhhc1J1bm5pbmdBcHBTdG9yZVN1YnNjcmlwdGlvbihhY2NvdW50aW5nSW5mbykgJiYgIWlzSU9TQXBwKCkpIHtcblx0XHRhd2FpdCBzaG93TWFuYWdlVGhyb3VnaEFwcFN0b3JlRGlhbG9nKClcblx0XHRyZXR1cm5cblx0fVxuXG5cdGNvbnN0IFtmZWF0dXJlTGlzdFByb3ZpZGVyLCBwcmljZUFuZENvbmZpZ1Byb3ZpZGVyXSA9IGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhcblx0XHRcInBsZWFzZVdhaXRfbXNnXCIsXG5cdFx0UHJvbWlzZS5hbGwoW1xuXHRcdFx0RmVhdHVyZUxpc3RQcm92aWRlci5nZXRJbml0aWFsaXplZEluc3RhbmNlKGxvY2F0b3IuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXRDdXJyZW50RG9tYWluQ29uZmlnKCkpLFxuXHRcdFx0UHJpY2VBbmRDb25maWdQcm92aWRlci5nZXRJbml0aWFsaXplZEluc3RhbmNlKG51bGwsIGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yLCBudWxsKSxcblx0XHRdKSxcblx0KVxuXHRjb25zdCBtb2RlbCA9IG5ldyBTd2l0Y2hTdWJzY3JpcHRpb25EaWFsb2dNb2RlbChjdXN0b21lciwgYWNjb3VudGluZ0luZm8sIGF3YWl0IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuZ2V0UGxhblR5cGUoKSwgbGFzdEJvb2tpbmcpXG5cdGNvbnN0IGNhbmNlbEFjdGlvbiA9ICgpID0+IHtcblx0XHRkaWFsb2cuY2xvc2UoKVxuXHR9XG5cblx0Y29uc3QgaGVhZGVyQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzID0ge1xuXHRcdGxlZnQ6IFtcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogY2FuY2VsQWN0aW9uLFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdH0sXG5cdFx0XSxcblx0XHRyaWdodDogW10sXG5cdFx0bWlkZGxlOiBcInN1YnNjcmlwdGlvbl9sYWJlbFwiLFxuXHR9XG5cdGNvbnN0IGN1cnJlbnRQbGFuSW5mbyA9IG1vZGVsLmN1cnJlbnRQbGFuSW5mb1xuXHRjb25zdCBidXNpbmVzc1VzZSA9IHN0cmVhbShjdXJyZW50UGxhbkluZm8uYnVzaW5lc3NVc2UpXG5cdGNvbnN0IHBheW1lbnRJbnRlcnZhbCA9IHN0cmVhbShQYXltZW50SW50ZXJ2YWwuWWVhcmx5KSAvLyBhbHdheXMgZGVmYXVsdCB0byB5ZWFybHlcblx0Y29uc3QgbXVsdGlwbGVVc2Vyc0FsbG93ZWQgPSBtb2RlbC5tdWx0aXBsZVVzZXJzU3RpbGxTdXBwb3J0ZWRMZWdhY3koKVxuXG5cdGNvbnN0IGRpYWxvZzogRGlhbG9nID0gRGlhbG9nLmxhcmdlRGlhbG9nKGhlYWRlckJhckF0dHJzLCB7XG5cdFx0dmlldzogKCkgPT5cblx0XHRcdG0oXG5cdFx0XHRcdFwiLnB0XCIsXG5cdFx0XHRcdG0oU3Vic2NyaXB0aW9uU2VsZWN0b3IsIHtcblx0XHRcdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdFx0XHRidXNpbmVzc1VzZSxcblx0XHRcdFx0XHRcdHBheW1lbnRJbnRlcnZhbDogcGF5bWVudEludGVydmFsLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cHJpY2VJbmZvVGV4dElkOiBwcmljZUFuZENvbmZpZ1Byb3ZpZGVyLmdldFByaWNlSW5mb01lc3NhZ2UoKSxcblx0XHRcdFx0XHRtc2c6IHJlYXNvbixcblx0XHRcdFx0XHRib3hXaWR0aDogMjMwLFxuXHRcdFx0XHRcdGJveEhlaWdodDogMjcwLFxuXHRcdFx0XHRcdGFjY2VwdGVkUGxhbnM6IGFjY2VwdGVkUGxhbnMsXG5cdFx0XHRcdFx0Y3VycmVudFBsYW5UeXBlOiBjdXJyZW50UGxhbkluZm8ucGxhblR5cGUsXG5cdFx0XHRcdFx0YWxsb3dTd2l0Y2hpbmdQYXltZW50SW50ZXJ2YWw6IGN1cnJlbnRQbGFuSW5mby5wYXltZW50SW50ZXJ2YWwgIT09IFBheW1lbnRJbnRlcnZhbC5ZZWFybHksXG5cdFx0XHRcdFx0YWN0aW9uQnV0dG9uczogc3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9ucyxcblx0XHRcdFx0XHRmZWF0dXJlTGlzdFByb3ZpZGVyOiBmZWF0dXJlTGlzdFByb3ZpZGVyLFxuXHRcdFx0XHRcdHByaWNlQW5kQ29uZmlnUHJvdmlkZXIsXG5cdFx0XHRcdFx0bXVsdGlwbGVVc2Vyc0FsbG93ZWQsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0fSlcblx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRcdGV4ZWM6IGNhbmNlbEFjdGlvbixcblx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0fSlcblx0XHQuc2V0Q2xvc2VIYW5kbGVyKGNhbmNlbEFjdGlvbilcblx0Y29uc3Qgc3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9uczogU3Vic2NyaXB0aW9uQWN0aW9uQnV0dG9ucyA9IHtcblx0XHRbUGxhblR5cGUuRnJlZV06ICgpID0+XG5cdFx0XHQoe1xuXHRcdFx0XHRsYWJlbDogXCJwcmljaW5nLnNlbGVjdF9hY3Rpb25cIixcblx0XHRcdFx0b25jbGljazogKCkgPT4gb25Td2l0Y2hUb0ZyZWUoY3VzdG9tZXIsIGRpYWxvZywgY3VycmVudFBsYW5JbmZvKSxcblx0XHRcdH0gc2F0aXNmaWVzIExvZ2luQnV0dG9uQXR0cnMpLFxuXHRcdFtQbGFuVHlwZS5SZXZvbHV0aW9uYXJ5XTogY3JlYXRlUGxhbkJ1dHRvbihkaWFsb2csIFBsYW5UeXBlLlJldm9sdXRpb25hcnksIGN1cnJlbnRQbGFuSW5mbywgcGF5bWVudEludGVydmFsLCBhY2NvdW50aW5nSW5mbyksXG5cdFx0W1BsYW5UeXBlLkxlZ2VuZF06IGNyZWF0ZVBsYW5CdXR0b24oZGlhbG9nLCBQbGFuVHlwZS5MZWdlbmQsIGN1cnJlbnRQbGFuSW5mbywgcGF5bWVudEludGVydmFsLCBhY2NvdW50aW5nSW5mbyksXG5cdFx0W1BsYW5UeXBlLkVzc2VudGlhbF06IGNyZWF0ZVBsYW5CdXR0b24oZGlhbG9nLCBQbGFuVHlwZS5Fc3NlbnRpYWwsIGN1cnJlbnRQbGFuSW5mbywgcGF5bWVudEludGVydmFsLCBhY2NvdW50aW5nSW5mbyksXG5cdFx0W1BsYW5UeXBlLkFkdmFuY2VkXTogY3JlYXRlUGxhbkJ1dHRvbihkaWFsb2csIFBsYW5UeXBlLkFkdmFuY2VkLCBjdXJyZW50UGxhbkluZm8sIHBheW1lbnRJbnRlcnZhbCwgYWNjb3VudGluZ0luZm8pLFxuXHRcdFtQbGFuVHlwZS5VbmxpbWl0ZWRdOiBjcmVhdGVQbGFuQnV0dG9uKGRpYWxvZywgUGxhblR5cGUuVW5saW1pdGVkLCBjdXJyZW50UGxhbkluZm8sIHBheW1lbnRJbnRlcnZhbCwgYWNjb3VudGluZ0luZm8pLFxuXHR9XG5cdGRpYWxvZy5zaG93KClcblx0cmV0dXJuXG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uU3dpdGNoVG9GcmVlKGN1c3RvbWVyOiBDdXN0b21lciwgZGlhbG9nOiBEaWFsb2csIGN1cnJlbnRQbGFuSW5mbzogQ3VycmVudFBsYW5JbmZvKSB7XG5cdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0Ly8gV2Ugd2FudCB0aGUgdXNlciB0byBkaXNhYmxlIHJlbmV3YWwgaW4gQXBwU3RvcmUgYmVmb3JlIHRoZXkgdHJ5IHRvIGRvd25ncmFkZSBvbiBvdXIgc2lkZVxuXHRcdGNvbnN0IG93bmVyc2hpcCA9IGF3YWl0IGxvY2F0b3IubW9iaWxlUGF5bWVudHNGYWNhZGUucXVlcnlBcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcChiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0RXh0VG9CYXNlNjQoY3VzdG9tZXIuX2lkKSkpXG5cdFx0aWYgKG93bmVyc2hpcCA9PT0gTW9iaWxlUGF5bWVudFN1YnNjcmlwdGlvbk93bmVyc2hpcC5Pd25lciAmJiAoYXdhaXQgbG9jYXRvci5tb2JpbGVQYXltZW50c0ZhY2FkZS5pc0FwcFN0b3JlUmVuZXdhbEVuYWJsZWQoKSkpIHtcblx0XHRcdGF3YWl0IGxvY2F0b3IubW9iaWxlUGF5bWVudHNGYWNhZGUuc2hvd1N1YnNjcmlwdGlvbkNvbmZpZ1ZpZXcoKVxuXG5cdFx0XHRhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCB3YWl0VW50aWxSZW5ld2FsRGlzYWJsZWQoKSlcblxuXHRcdFx0aWYgKGF3YWl0IGxvY2F0b3IubW9iaWxlUGF5bWVudHNGYWNhZGUuaXNBcHBTdG9yZVJlbmV3YWxFbmFibGVkKCkpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJBcHBTdG9yZSByZW5ld2FsIGlzIHN0aWxsIGVuYWJsZWQsIGNhbmNlbGluZyBkb3duZ3JhZGVcIilcblx0XHRcdFx0Ly8gVXNlciBwcm9iYWJseSBkaWQgbm90IGRpc2FibGUgdGhlIHJlbmV3YWwgc3RpbGwsIGNhbmNlbFxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCByZWFzb24gPSBhd2FpdCBzaG93TGVhdmluZ1VzZXJTdXJ2ZXlXaXphcmQodHJ1ZSwgdHJ1ZSlcblx0Y29uc3QgZGF0YSA9XG5cdFx0cmVhc29uLnN1Ym1pdHRlZCAmJiByZWFzb24uY2F0ZWdvcnkgJiYgcmVhc29uLnJlYXNvblxuXHRcdFx0PyBjcmVhdGVTdXJ2ZXlEYXRhKHtcblx0XHRcdFx0XHRjYXRlZ29yeTogcmVhc29uLmNhdGVnb3J5LFxuXHRcdFx0XHRcdHJlYXNvbjogcmVhc29uLnJlYXNvbixcblx0XHRcdFx0XHRkZXRhaWxzOiByZWFzb24uZGV0YWlscyxcblx0XHRcdFx0XHR2ZXJzaW9uOiBTVVJWRVlfVkVSU0lPTl9OVU1CRVIsXG5cdFx0XHQgIH0pXG5cdFx0XHQ6IG51bGxcblx0Y29uc3QgbmV3UGxhblR5cGUgPSBhd2FpdCBjYW5jZWxTdWJzY3JpcHRpb24oZGlhbG9nLCBjdXJyZW50UGxhbkluZm8sIGN1c3RvbWVyLCBkYXRhKVxuXG5cdGlmIChuZXdQbGFuVHlwZSA9PT0gUGxhblR5cGUuRnJlZSkge1xuXHRcdGZvciAoY29uc3QgaW1wb3J0ZWRNYWlsU2V0IG9mIG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRJbXBvcnRlZE1haWxTZXRzKCkpIG1haWxMb2NhdG9yLm1haWxNb2RlbC5maW5hbGx5RGVsZXRlQ3VzdG9tTWFpbEZvbGRlcihpbXBvcnRlZE1haWxTZXQpXG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gd2FpdFVudGlsUmVuZXdhbERpc2FibGVkKCkge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuXHRcdC8vIFdhaXQgYSBiaXQgYmVmb3JlIGNoZWNraW5nLCBpdCB0YWtlcyBhIGJpdCB0byBwcm9wYWdhdGVcblx0XHRhd2FpdCBkZWxheSgyMDAwKVxuXHRcdGlmICghKGF3YWl0IGxvY2F0b3IubW9iaWxlUGF5bWVudHNGYWNhZGUuaXNBcHBTdG9yZVJlbmV3YWxFbmFibGVkKCkpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZG9Td2l0Y2hUb1BhaWRQbGFuKFxuXHRhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8sXG5cdG5ld1BheW1lbnRJbnRlcnZhbDogUGF5bWVudEludGVydmFsLFxuXHR0YXJnZXRTdWJzY3JpcHRpb246IFBsYW5UeXBlLFxuXHRkaWFsb2c6IERpYWxvZyxcblx0Y3VycmVudFBsYW5JbmZvOiBDdXJyZW50UGxhbkluZm8sXG4pIHtcblx0aWYgKGlzSU9TQXBwKCkgJiYgZ2V0UGF5bWVudE1ldGhvZFR5cGUoYWNjb3VudGluZ0luZm8pID09PSBQYXltZW50TWV0aG9kVHlwZS5BcHBTdG9yZSkge1xuXHRcdGNvbnN0IGN1c3RvbWVySWRCeXRlcyA9IGJhc2U2NFRvVWludDhBcnJheShiYXNlNjRFeHRUb0Jhc2U2NChhc3NlcnROb3ROdWxsKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5jdXN0b21lcikpKVxuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGxvY2F0b3IubW9iaWxlUGF5bWVudHNGYWNhZGUucmVxdWVzdFN1YnNjcmlwdGlvblRvUGxhbihhcHBTdG9yZVBsYW5OYW1lKHRhcmdldFN1YnNjcmlwdGlvbiksIG5ld1BheW1lbnRJbnRlcnZhbCwgY3VzdG9tZXJJZEJ5dGVzKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTW9iaWxlUGF5bWVudEVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJBcHBTdG9yZSBzdWJzY3JpcHRpb24gZmFpbGVkXCIsIGUpXG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwiYXBwU3RvcmVTdWJzY3JpcHRpb25FcnJvcl9tc2dcIiwgZS5tZXNzYWdlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoY3VycmVudFBsYW5JbmZvLnBheW1lbnRJbnRlcnZhbCAhPT0gbmV3UGF5bWVudEludGVydmFsKSB7XG5cdFx0XHRhd2FpdCBsb2NhdG9yLmN1c3RvbWVyRmFjYWRlLmNoYW5nZVBheW1lbnRJbnRlcnZhbChhY2NvdW50aW5nSW5mbywgbmV3UGF5bWVudEludGVydmFsKVxuXHRcdH1cblx0XHRhd2FpdCBzd2l0Y2hTdWJzY3JpcHRpb24odGFyZ2V0U3Vic2NyaXB0aW9uLCBkaWFsb2csIGN1cnJlbnRQbGFuSW5mbylcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVQbGFuQnV0dG9uKFxuXHRkaWFsb2c6IERpYWxvZyxcblx0dGFyZ2V0U3Vic2NyaXB0aW9uOiBQbGFuVHlwZSxcblx0Y3VycmVudFBsYW5JbmZvOiBDdXJyZW50UGxhbkluZm8sXG5cdG5ld1BheW1lbnRJbnRlcnZhbDogc3RyZWFtPFBheW1lbnRJbnRlcnZhbD4sXG5cdGFjY291bnRpbmdJbmZvOiBBY2NvdW50aW5nSW5mbyxcbik6IGxhenk8TG9naW5CdXR0b25BdHRycz4ge1xuXHRyZXR1cm4gKCkgPT4gKHtcblx0XHRsYWJlbDogXCJidXlfYWN0aW9uXCIsXG5cdFx0b25jbGljazogYXN5bmMgKCkgPT4ge1xuXHRcdFx0Ly8gU2hvdyBhbiBleHRyYSBkaWFsb2cgaW4gdGhlIGNhc2UgdGhhdCBzb21lb25lIGlzIHVwZ3JhZGluZyBmcm9tIGEgbGVnYWN5IHBsYW4gdG8gYSBuZXcgcGxhbiBiZWNhdXNlIHRoZXkgY2FuJ3QgcmV2ZXJ0LlxuXHRcdFx0aWYgKFxuXHRcdFx0XHRMZWdhY3lQbGFucy5pbmNsdWRlcyhjdXJyZW50UGxhbkluZm8ucGxhblR5cGUpICYmXG5cdFx0XHRcdCEoYXdhaXQgRGlhbG9nLmNvbmZpcm0obGFuZy5nZXRUcmFuc2xhdGlvbihcInVwZ3JhZGVQbGFuX21zZ1wiLCB7IFwie3BsYW59XCI6IFBsYW5UeXBlVG9OYW1lW3RhcmdldFN1YnNjcmlwdGlvbl0gfSkpKVxuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdFx0YXdhaXQgc2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgZG9Td2l0Y2hUb1BhaWRQbGFuKGFjY291bnRpbmdJbmZvLCBuZXdQYXltZW50SW50ZXJ2YWwoKSwgdGFyZ2V0U3Vic2NyaXB0aW9uLCBkaWFsb2csIGN1cnJlbnRQbGFuSW5mbykpXG5cdFx0fSxcblx0fSlcbn1cblxuZnVuY3Rpb24gaGFuZGxlU3dpdGNoQWNjb3VudFByZWNvbmRpdGlvbkZhaWxlZChlOiBQcmVjb25kaXRpb25GYWlsZWRFcnJvcik6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCByZWFzb24gPSBlLmRhdGFcblxuXHRpZiAocmVhc29uID09IG51bGwpIHtcblx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJ1bmtub3duRXJyb3JfbXNnXCIpXG5cdH0gZWxzZSB7XG5cdFx0bGV0IGRldGFpbE1zZzogc3RyaW5nXG5cblx0XHRzd2l0Y2ggKHJlYXNvbikge1xuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uVE9PX01BTllfRU5BQkxFRF9VU0VSUzpcblx0XHRcdFx0ZGV0YWlsTXNnID0gbGFuZy5nZXQoXCJhY2NvdW50U3dpdGNoVG9vTWFueUFjdGl2ZVVzZXJzX21zZ1wiKVxuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRjYXNlIFVuc3Vic2NyaWJlRmFpbHVyZVJlYXNvbi5DVVNUT01fTUFJTF9BRERSRVNTOlxuXHRcdFx0XHRkZXRhaWxNc2cgPSBsYW5nLmdldChcImFjY291bnRTd2l0Y2hDdXN0b21NYWlsQWRkcmVzc19tc2dcIilcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uVE9PX01BTllfQ0FMRU5EQVJTOlxuXHRcdFx0XHRkZXRhaWxNc2cgPSBsYW5nLmdldChcImFjY291bnRTd2l0Y2hNdWx0aXBsZUNhbGVuZGFyc19tc2dcIilcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uQ0FMRU5EQVJfVFlQRTpcblx0XHRcdFx0ZGV0YWlsTXNnID0gbGFuZy5nZXQoXCJhY2NvdW50U3dpdGNoU2hhcmVkQ2FsZW5kYXJfbXNnXCIpXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgVW5zdWJzY3JpYmVGYWlsdXJlUmVhc29uLlRPT19NQU5ZX0FMSUFTRVM6XG5cdFx0XHRjYXNlIEJvb2tpbmdGYWlsdXJlUmVhc29uLlRPT19NQU5ZX0FMSUFTRVM6XG5cdFx0XHRcdGRldGFpbE1zZyA9IGxhbmcuZ2V0KFwiYWNjb3VudFN3aXRjaEFsaWFzZXNfbXNnXCIpXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgVW5zdWJzY3JpYmVGYWlsdXJlUmVhc29uLlRPT19NVUNIX1NUT1JBR0VfVVNFRDpcblx0XHRcdGNhc2UgQm9va2luZ0ZhaWx1cmVSZWFzb24uVE9PX01VQ0hfU1RPUkFHRV9VU0VEOlxuXHRcdFx0XHRkZXRhaWxNc2cgPSBsYW5nLmdldChcInN0b3JhZ2VDYXBhY2l0eVRvb01hbnlVc2VkRm9yQm9va2luZ19tc2dcIilcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uVE9PX01BTllfRE9NQUlOUzpcblx0XHRcdGNhc2UgQm9va2luZ0ZhaWx1cmVSZWFzb24uVE9PX01BTllfRE9NQUlOUzpcblx0XHRcdFx0ZGV0YWlsTXNnID0gbGFuZy5nZXQoXCJ0b29NYW55Q3VzdG9tRG9tYWluc19tc2dcIilcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uSEFTX1RFTVBMQVRFX0dST1VQOlxuXHRcdFx0Y2FzZSBCb29raW5nRmFpbHVyZVJlYXNvbi5IQVNfVEVNUExBVEVfR1JPVVA6XG5cdFx0XHRcdGRldGFpbE1zZyA9IGxhbmcuZ2V0KFwiZGVsZXRlVGVtcGxhdGVHcm91cHNfbXNnXCIpXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgVW5zdWJzY3JpYmVGYWlsdXJlUmVhc29uLldISVRFTEFCRUxfRE9NQUlOX0FDVElWRTpcblx0XHRcdGNhc2UgQm9va2luZ0ZhaWx1cmVSZWFzb24uV0hJVEVMQUJFTF9ET01BSU5fQUNUSVZFOlxuXHRcdFx0XHRkZXRhaWxNc2cgPSBsYW5nLmdldChcIndoaXRlbGFiZWxEb21haW5FeGlzdGluZ19tc2dcIilcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uSEFTX0NPTlRBQ1RfTElTVF9HUk9VUDpcblx0XHRcdFx0ZGV0YWlsTXNnID0gbGFuZy5nZXQoXCJjb250YWN0TGlzdEV4aXN0aW5nX21zZ1wiKVxuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRjYXNlIFVuc3Vic2NyaWJlRmFpbHVyZVJlYXNvbi5OT1RfRU5PVUdIX0NSRURJVDpcblx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwiaW5zdWZmaWNpZW50QmFsYW5jZUVycm9yX21zZ1wiKVxuXG5cdFx0XHRjYXNlIFVuc3Vic2NyaWJlRmFpbHVyZVJlYXNvbi5JTlZPSUNFX05PVF9QQUlEOlxuXHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJpbnZvaWNlTm90UGFpZFN3aXRjaF9tc2dcIilcblxuXHRcdFx0Y2FzZSBVbnN1YnNjcmliZUZhaWx1cmVSZWFzb24uQUNUSVZFX0FQUFNUT1JFX1NVQlNDUklQVElPTjpcblx0XHRcdFx0aWYgKGlzSU9TQXBwKCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5tb2JpbGVQYXltZW50c0ZhY2FkZS5zaG93U3Vic2NyaXB0aW9uQ29uZmlnVmlldygpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHNob3dNYW5hZ2VUaHJvdWdoQXBwU3RvcmVEaWFsb2coKVxuXHRcdFx0XHR9XG5cblx0XHRcdGNhc2UgVW5zdWJzY3JpYmVGYWlsdXJlUmVhc29uLkxBQkVMX0xJTUlUX0VYQ0VFREVEOlxuXHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJsYWJlbExpbWl0RXhjZWVkZWRfbXNnXCIpXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFxuXHRcdFx0bGFuZy5nZXRUcmFuc2xhdGlvbihcImFjY291bnRTd2l0Y2hOb3RQb3NzaWJsZV9tc2dcIiwge1xuXHRcdFx0XHRcIntkZXRhaWxNc2d9XCI6IGRldGFpbE1zZyxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSBjdXN0b21lclxuICogQHBhcmFtIGN1cnJlbnRQbGFuSW5mb1xuICogQHBhcmFtIHN1cnZleURhdGFcbiAqIEByZXR1cm5zIHRoZSBuZXcgcGxhbiB0eXBlIGFmdGVyIHRoZSBhdHRlbXB0LlxuICovXG5hc3luYyBmdW5jdGlvbiB0cnlEb3duZ3JhZGVQcmVtaXVtVG9GcmVlKGN1c3RvbWVyOiBDdXN0b21lciwgY3VycmVudFBsYW5JbmZvOiBDdXJyZW50UGxhbkluZm8sIHN1cnZleURhdGE6IFN1cnZleURhdGEgfCBudWxsKTogUHJvbWlzZTxQbGFuVHlwZT4ge1xuXHRjb25zdCBzd2l0Y2hBY2NvdW50VHlwZURhdGEgPSBjcmVhdGVTd2l0Y2hBY2NvdW50VHlwZVBvc3RJbih7XG5cdFx0YWNjb3VudFR5cGU6IEFjY291bnRUeXBlLkZSRUUsXG5cdFx0ZGF0ZTogQ29uc3QuQ1VSUkVOVF9EQVRFLFxuXHRcdGN1c3RvbWVyOiBjdXN0b21lci5faWQsXG5cdFx0c3BlY2lhbFByaWNlVXNlclNpbmdsZTogbnVsbCxcblx0XHRyZWZlcnJhbENvZGU6IG51bGwsXG5cdFx0cGxhbjogUGxhblR5cGUuRnJlZSxcblx0XHRzdXJ2ZXlEYXRhOiBzdXJ2ZXlEYXRhLFxuXHRcdGFwcDogY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSA/IFN1YnNjcmlwdGlvbkFwcC5DYWxlbmRhciA6IFN1YnNjcmlwdGlvbkFwcC5NYWlsLFxuXHR9KVxuXHR0cnkge1xuXHRcdGF3YWl0IGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yLnBvc3QoU3dpdGNoQWNjb3VudFR5cGVTZXJ2aWNlLCBzd2l0Y2hBY2NvdW50VHlwZURhdGEpXG5cdFx0YXdhaXQgbG9jYXRvci5jdXN0b21lckZhY2FkZS5zd2l0Y2hQcmVtaXVtVG9GcmVlR3JvdXAoKVxuXHRcdHJldHVybiBQbGFuVHlwZS5GcmVlXG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAoZSBpbnN0YW5jZW9mIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yKSB7XG5cdFx0XHRhd2FpdCBoYW5kbGVTd2l0Y2hBY2NvdW50UHJlY29uZGl0aW9uRmFpbGVkKGUpXG5cdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgSW52YWxpZERhdGFFcnJvcikge1xuXHRcdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXCJhY2NvdW50U3dpdGNoVG9vTWFueUFjdGl2ZVVzZXJzX21zZ1wiKVxuXHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIEJhZFJlcXVlc3RFcnJvcikge1xuXHRcdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXCJkZWFjdGl2YXRlUHJlbWl1bVdpdGhDdXN0b21Eb21haW5FcnJvcl9tc2dcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblx0XHRyZXR1cm4gY3VycmVudFBsYW5JbmZvLnBsYW5UeXBlXG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FuY2VsU3Vic2NyaXB0aW9uKFxuXHRkaWFsb2c6IERpYWxvZyxcblx0Y3VycmVudFBsYW5JbmZvOiBDdXJyZW50UGxhbkluZm8sXG5cdGN1c3RvbWVyOiBDdXN0b21lcixcblx0c3VydmV5RGF0YTogU3VydmV5RGF0YSB8IG51bGwgPSBudWxsLFxuKTogUHJvbWlzZTxQbGFuVHlwZT4ge1xuXHRjb25zdCBjb25maXJtQ2FuY2VsU3Vic2NyaXB0aW9uID0gRGlhbG9nLmNvbmZpcm0oXCJ1bnN1YnNjcmliZUNvbmZpcm1fbXNnXCIsIFwib2tfYWN0aW9uXCIsICgpID0+IHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLnB0XCIsXG5cdFx0XHRtKFwidWwudXNhZ2UtdGVzdC1vcHQtaW4tYnVsbGV0c1wiLCBbXG5cdFx0XHRcdG0oXCJsaVwiLCBsYW5nLmdldChcImltcG9ydGVkTWFpbHNXaWxsQmVEZWxldGVkX2xhYmVsXCIpKSxcblx0XHRcdFx0bShcImxpXCIsIGxhbmcuZ2V0KFwiYWNjb3VudFdpbGxCZURlYWN0aXZhdGVkSW42TW9udGhfbGFiZWxcIikpLFxuXHRcdFx0XHRtKFwibGlcIiwgbGFuZy5nZXQoXCJhY2NvdW50V2lsbEhhdmVMZXNzU3RvcmFnZV9sYWJlbFwiKSksXG5cdFx0XHRdKSxcblx0XHQpXG5cdH0pXG5cblx0aWYgKCEoYXdhaXQgY29uZmlybUNhbmNlbFN1YnNjcmlwdGlvbikpIHtcblx0XHRyZXR1cm4gY3VycmVudFBsYW5JbmZvLnBsYW5UeXBlXG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCB0cnlEb3duZ3JhZGVQcmVtaXVtVG9GcmVlKGN1c3RvbWVyLCBjdXJyZW50UGxhbkluZm8sIHN1cnZleURhdGEpKVxuXHR9IGZpbmFsbHkge1xuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc3dpdGNoU3Vic2NyaXB0aW9uKHRhcmdldFN1YnNjcmlwdGlvbjogUGxhblR5cGUsIGRpYWxvZzogRGlhbG9nLCBjdXJyZW50UGxhbkluZm86IEN1cnJlbnRQbGFuSW5mbyk6IFByb21pc2U8UGxhblR5cGU+IHtcblx0aWYgKHRhcmdldFN1YnNjcmlwdGlvbiA9PT0gY3VycmVudFBsYW5JbmZvLnBsYW5UeXBlKSB7XG5cdFx0cmV0dXJuIGN1cnJlbnRQbGFuSW5mby5wbGFuVHlwZVxuXHR9XG5cblx0Y29uc3QgdXNlckNvbnRyb2xsZXIgPSBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpXG5cdGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgdXNlckNvbnRyb2xsZXIubG9hZEN1c3RvbWVyKClcblx0aWYgKCFjdXN0b21lci5idXNpbmVzc1VzZSAmJiBOZXdCdXNpbmVzc1BsYW5zLmluY2x1ZGVzKGRvd25jYXN0KHRhcmdldFN1YnNjcmlwdGlvbikpKSB7XG5cdFx0Y29uc3QgYWNjb3VudGluZ0luZm8gPSBhd2FpdCB1c2VyQ29udHJvbGxlci5sb2FkQWNjb3VudGluZ0luZm8oKVxuXHRcdGNvbnN0IGludm9pY2VEYXRhOiBJbnZvaWNlRGF0YSA9IHtcblx0XHRcdGludm9pY2VBZGRyZXNzOiBmb3JtYXROYW1lQW5kQWRkcmVzcyhhY2NvdW50aW5nSW5mby5pbnZvaWNlTmFtZSwgYWNjb3VudGluZ0luZm8uaW52b2ljZUFkZHJlc3MpLFxuXHRcdFx0Y291bnRyeTogYWNjb3VudGluZ0luZm8uaW52b2ljZUNvdW50cnkgPyBnZXRCeUFiYnJldmlhdGlvbihhY2NvdW50aW5nSW5mby5pbnZvaWNlQ291bnRyeSkgOiBudWxsLFxuXHRcdFx0dmF0TnVtYmVyOiBhY2NvdW50aW5nSW5mby5pbnZvaWNlVmF0SWRObywgLy8gb25seSBmb3IgRVUgY291bnRyaWVzIG90aGVyd2lzZSBlbXB0eVxuXHRcdH1cblx0XHRjb25zdCB1cGRhdGVkSW52b2ljZURhdGEgPSBhd2FpdCBzaG93U3dpdGNoVG9CdXNpbmVzc0ludm9pY2VEYXRhRGlhbG9nKGN1c3RvbWVyLCBpbnZvaWNlRGF0YSwgYWNjb3VudGluZ0luZm8pXG5cdFx0aWYgKCF1cGRhdGVkSW52b2ljZURhdGEpIHtcblx0XHRcdHJldHVybiBjdXJyZW50UGxhbkluZm8ucGxhblR5cGVcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdGNvbnN0IHBvc3RJbiA9IGNyZWF0ZVN3aXRjaEFjY291bnRUeXBlUG9zdEluKHtcblx0XHRcdGFjY291bnRUeXBlOiBBY2NvdW50VHlwZS5QQUlELFxuXHRcdFx0cGxhbjogdGFyZ2V0U3Vic2NyaXB0aW9uLFxuXHRcdFx0ZGF0ZTogQ29uc3QuQ1VSUkVOVF9EQVRFLFxuXHRcdFx0cmVmZXJyYWxDb2RlOiBudWxsLFxuXHRcdFx0Y3VzdG9tZXI6IGN1c3RvbWVyLl9pZCxcblx0XHRcdHNwZWNpYWxQcmljZVVzZXJTaW5nbGU6IG51bGwsXG5cdFx0XHRzdXJ2ZXlEYXRhOiBudWxsLFxuXHRcdFx0YXBwOiBjbGllbnQuaXNDYWxlbmRhckFwcCgpID8gU3Vic2NyaXB0aW9uQXBwLkNhbGVuZGFyIDogU3Vic2NyaXB0aW9uQXBwLk1haWwsXG5cdFx0fSlcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvci5wb3N0KFN3aXRjaEFjY291bnRUeXBlU2VydmljZSwgcG9zdEluKSlcblx0XHRcdHJldHVybiB0YXJnZXRTdWJzY3JpcHRpb25cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yKSB7XG5cdFx0XHRcdGF3YWl0IGhhbmRsZVN3aXRjaEFjY291bnRQcmVjb25kaXRpb25GYWlsZWQoZSlcblxuXHRcdFx0XHRyZXR1cm4gY3VycmVudFBsYW5JbmZvLnBsYW5UeXBlXG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXHR9IGZpbmFsbHkge1xuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7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