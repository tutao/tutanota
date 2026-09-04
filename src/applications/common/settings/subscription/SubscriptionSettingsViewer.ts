import m, { Children } from "mithril"
import { ApprovalStatus, Const, EnvProvider, PaymentSetup, UpgradePromptType } from "@tutao/app-env"
import { elementIdToId, GENERATED_MAX_ID, getEtId, idToElementId } from "@tutao/meta"
import { assertNotNull, base64ExtToBase64, base64ToUint8Array, downcast, neverNull, promiseMap, stringToBase64 } from "@tutao/utils"
import { InfoLink, lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../../ui/base/icons/Icons"
import { asPaymentInterval, formatPriceDataWithInfo, PaymentInterval } from "../../subscription/utils/PriceUtils"
import { formatDate, formatStorageSize } from "../../../../ui/utils/Formatter"
import { showUpgradeWizard } from "../../subscription/UpgradeSubscriptionWizard"
import { showConfirmDowngradingToFreeDialog, showSwitchDialog } from "../../subscription/SwitchSubscriptionDialog"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import * as SignOrderAgreementDialog from "../../subscription/SignOrderProcessingAgreementDialog"
import {
	AccountingInfo,
	AccountingInfoTypeRef,
	Booking,
	BookingTypeRef,
	createRenewalPreferenceServicePostIn,
	Customer,
	CustomerInfo,
	CustomerInfoTypeRef,
	CustomerTypeRef,
	GroupInfoTypeRef,
	OrderProcessingAgreement,
	OrderProcessingAgreementTypeRef,
	PlanConfiguration,
	RenewalPreferenceService_POST,
	UserTypeRef,
} from "@tutao/entities/sys"
import {
	AccountType,
	AccountTypeNames,
	AvailablePlans,
	AvailablePlanType,
	BookingItemFeatureType,
	isExternalPaymentMethod,
	LegacyPlans,
	NewPaidPlans,
	PlanType,
} from "../../../../entities/sys/Utils"
import {
	externalStorePlanName,
	getCurrentCount,
	getPaymentMethodType,
	getTotalStorageCapacityPerCustomer,
	hasMatchingExternalPaymentSetup,
	hasMatchingExternalStoreSubscription,
	isAppStorePayment,
	isAutoResponderActive,
	isEventInvitesActive,
	isSharingActive,
	isWhitelabelActive,
	PlanTypeToName,
	queryExternalSubscriptionOwnership,
	SubscriptionApp,
} from "../../subscription/utils/SubscriptionUtils"
import { LegacyTextField } from "../../../../ui/base/LegacyTextField.js"
import { Dialog } from "../../../../ui/base/Dialog"
import { locator } from "../../api/main/CommonLocator"
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection } from "../../subscription/TermsAndConditions"
import { IconButtonAttrs } from "../../../../ui/base/IconButton.js"
import { getDisplayNameOfPlanType } from "../../subscription/FeatureListProvider"
import { MobilePaymentsFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MobilePaymentSubscriptionOwnership } from "@tutao/native-bridge/generatedIpc/enums"
import { NotFoundError } from "@tutao/rest-client/error"
import { openExternalSubscriptionPage } from "../../subscription/PaymentViewer.js"
import { theme } from "../../../../ui/theme"
import { TitleSection } from "../../../../ui/TitleSection"
import { px } from "../../../../ui/size"
import { SubscriptionStateCard, SubscriptionStateCardAttrs, SubscriptionStatus } from "../../subscription/components/SubscriptionStateCard"
import { SubscriptionPaidFeaturesCard } from "../../subscription/components/SubscriptionPaidFeaturesCard"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { Card } from "../../../../ui/base/Card"
import { DynamicColorSvg } from "../../../../ui/base/DynamicColorSvg"
import { PrimaryButton, SecondaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { showSubscriptionCancellationDialog } from "./SubscriptionCancellationDialog"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { MobilePaymentError } from "../../api/common/error/MobilePaymentError"
import { showUserSatisfactionDialogAfterUpgrade } from "../../ratings/UserSatisfactionUtils"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { SubscriptionStateCellAttrs } from "../../subscription/components/SubscriptionStateCell"
import { MessageBanner } from "../../../../ui/base/MessageBanner"
import { shouldOfferSubscriptionRevocation } from "./RevocationEligibility"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector"
import { UpdatableSettingsViewer } from "../Interfaces"

EnvProvider.assertMainOrNode()
export class SubscriptionSettingsViewer implements UpdatableSettingsViewer {
	readonly view: UpdatableSettingsViewer["view"]
	private readonly _subscriptionFieldValue: Stream<string>
	private readonly _orderAgreementFieldValue: Stream<string>
	private readonly _selectedSubscriptionInterval: Stream<PaymentInterval | null>
	private readonly _currentPriceFieldValue: Stream<string>
	private readonly _nextPriceFieldValue: Stream<string>
	private readonly _usersFieldValue: Stream<string>
	private readonly _storageFieldValue: Stream<string>
	private readonly _emailAliasFieldValue: Stream<string>
	private readonly _groupsFieldValue: Stream<string>
	private readonly _whitelabelFieldValue: Stream<string>
	private readonly _sharingFieldValue: Stream<string>
	private readonly _eventInvitesFieldValue: Stream<string>
	private readonly _autoResponderFieldValue: Stream<string>
	private _customer: Customer | null = null
	private _customerInfo: CustomerInfo | null = null
	private _accountingInfo: AccountingInfo | null = null
	private _lastBooking: Booking | null = null
	private _orderAgreement: OrderProcessingAgreement | null = null
	private currentPlanType: PlanType | null = null
	private _shownSatisfactionDialog = false

	constructor(private readonly mobilePaymentsFacade: MobilePaymentsFacade | null) {
		locator.logins
			.getUserController()
			.getPlanType()
			.then((currentPlanType) => {
				this.currentPlanType = currentPlanType
				m.redraw()
			})

		this.view = (): Children => {
			return m(
				"#subscription-settings.fill-absolute.scroll.plr-24.pb-48",
				{
					style: {
						backgroundColor: theme.surface_container,
					},
				},
				[
					m(
						".flex.col.gap-32",
						m(TitleSection, {
							icon: Icons.TrophyOutline,
							title: lang.getTranslationText("adminSubscription_action"),
							subTitle: lang.getTranslationText("subscriptionSettingsSubtitle_label"),
						}),
						this._customerInfo !== null
							? this._customerInfo.plan === PlanType.Free
								? this.renderFreeSubscriptionCard()
								: this.renderSubscriptionStateCard()
							: undefined,
						this.showOrderAgreementSection() ? this.renderAgreement() : null,
						m(
							".subscription-links",
							this.showOrderAgreementLink() ? m(".small", this.showAgreementLink()) : null,
							m(".small", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
							m(".small", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
						),
						this.currentPlanType && LegacyPlans.includes(this.currentPlanType)
							? [
									m(
										"",
										m(".h4", lang.get("adminPremiumFeatures_action")),
										m(
											"",
											{
												style: { minHeight: px(50) },
											},
											m(LegacyTextField, {
												label: "storageCapacity_label",
												value: this._storageFieldValue(),
												oninput: this._storageFieldValue,
												isReadOnly: true,
											}),
											m(LegacyTextField, {
												label: "mailAddressAliases_label",
												value: this._emailAliasFieldValue(),
												oninput: this._emailAliasFieldValue,
												isReadOnly: true,
											}),
											m(LegacyTextField, {
												label: "pricing.comparisonSharingCalendar_msg",
												value: this._sharingFieldValue(),
												oninput: this._sharingFieldValue,
												isReadOnly: true,
											}),
											m(LegacyTextField, {
												label: "pricing.comparisonEventInvites_msg",
												value: this._eventInvitesFieldValue(),
												oninput: this._eventInvitesFieldValue,
												isReadOnly: true,
											}),
											m(LegacyTextField, {
												label: "pricing.comparisonOutOfOffice_msg",
												value: this._autoResponderFieldValue(),
												oninput: this._autoResponderFieldValue,
												isReadOnly: true,
											}),
											m(LegacyTextField, {
												label: "whitelabel.login_title",
												value: this._whitelabelFieldValue(),
												oninput: this._whitelabelFieldValue,
												isReadOnly: true,
											}),
											m(LegacyTextField, {
												label: "whitelabel.custom_title",
												value: this._whitelabelFieldValue(),
												oninput: this._whitelabelFieldValue,
												isReadOnly: true,
											}),
										),
									),
								]
							: [],
					),
				],
			)
		}

		locator.entityClient
			.load(CustomerTypeRef, idToElementId(neverNull(locator.logins.getUserController().user.customer)))
			.then((customer) => {
				void this.updateCustomerData(customer)
				return locator.logins.getUserController().loadCustomerInfo()
			})
			.then((customerInfo) => {
				this._customerInfo = customerInfo
				return locator.entityClient.load(AccountingInfoTypeRef, idToElementId(customerInfo.accountingInfo))
			})
			.then((accountingInfo) => {
				this.updateAccountInfoData(accountingInfo)
				void this.updatePriceInfo()
			})
		const loadingString = lang.getTranslationText("loading_msg")
		this._currentPriceFieldValue = stream(loadingString)
		this._subscriptionFieldValue = stream(loadingString)
		this._orderAgreementFieldValue = stream(loadingString)
		this._nextPriceFieldValue = stream(loadingString)
		this._usersFieldValue = stream(loadingString)
		this._storageFieldValue = stream(loadingString)
		this._emailAliasFieldValue = stream(loadingString)
		this._groupsFieldValue = stream(loadingString)
		this._whitelabelFieldValue = stream(loadingString)
		this._sharingFieldValue = stream(loadingString)
		this._eventInvitesFieldValue = stream(loadingString)
		this._autoResponderFieldValue = stream(loadingString)
		this._selectedSubscriptionInterval = stream<PaymentInterval | null>(null)

		void this.updateBookings()
	}

	private renderSubscriptionStateCard(): Children {
		const booking = this._lastBooking
		const accountingInfo = this._accountingInfo
		const planType = this.currentPlanType

		if (booking == null || accountingInfo == null || planType == null) {
			return
		}
		const currentStateSubscription = this.getCurrentStateOfSubscription(booking)
		//Accounting interval can be changed by customer
		const paymentInterval = Number(asPaymentInterval(accountingInfo.paymentInterval))
		const isNewPlan = NewPaidPlans.includes(planType as AvailablePlanType)
		const isExternalSubscription = isExternalPaymentMethod(getPaymentMethodType(accountingInfo))
		//Make copy of booking end date to alter it
		const nextEndDate = new Date(assertNotNull(booking.endDate))
		nextEndDate.setMonth(nextEndDate.getMonth() + paymentInterval)
		//Is the new subscription section visible
		const isNewSubscriptionVisible =
			booking.renewalEnabled && booking.endDate && !this._customerInfo?.revocationRequest && currentStateSubscription !== "expired"

		return [
			m(
				".flex.col.gap-32",
				//Current subscription
				m(
					".flex.col.gap-8",
					m(SubscriptionStateCard, {
						title: "subscriptionSettingCurrentSubscription_label",
						cells: [
							this.getPlanCellAttrs(planType),
							this.getStatusCellAttrs(currentStateSubscription),
							!isExternalSubscription ? this.getPriceCellAttrs(this._currentPriceFieldValue()) : null,
							this.getEndDateAttrs(currentStateSubscription, booking.endDate),
						],
					} satisfies SubscriptionStateCardAttrs),
					(!isNewSubscriptionVisible || isExternalSubscription) &&
						isNewPlan &&
						this.renderButtons(booking, currentStateSubscription, isExternalSubscription),
				),
				//Next Subscription period
				isNewSubscriptionVisible &&
					!isExternalSubscription &&
					m(
						".flex.col.gap-8",
						m(SubscriptionStateCard, {
							title: "subscriptionSettingNewSubscription_label",
							cells: [
								this.getPlanCellAttrs(
									planType,
									//Don't show edit button next to plan for apple users -> managed by os
									!isExternalSubscription
										? {
												icon: Icons.PenFilled,
												title: "changePlan_action",
												click: () => {
													this.onSubscriptionClick()
													m.redraw()
												},
											}
										: undefined,
								),
								//Don't show interval edit button for apple users -> managed by os
								!isExternalSubscription ? this.getPaymentPeriodAttrs(accountingInfo.paymentInterval) : null,
								!isExternalSubscription ? this.getPriceCellAttrs(this._nextPriceFieldValue()) : null,
								this.getEndDateAttrs("planned", booking.endDate),
							],
						} satisfies SubscriptionStateCardAttrs),
						//Render Buttons
						isNewPlan && this.renderButtons(booking, currentStateSubscription, isExternalSubscription),
					),
			),

			//Render subscription-only features if not active or planned
			currentStateSubscription !== "active" &&
				currentStateSubscription !== "planned" &&
				m(SubscriptionPaidFeaturesCard, {
					subscriptionStatus: currentStateSubscription,
				}),
		]
	}

	//Free variant subscription card if customer has no plan
	//Shows a picture and a "Get more features" button
	private renderFreeSubscriptionCard(): Children {
		return m(".flex.col.gap-16", [
			m(MenuTitle, { content: lang.getTranslationText("subscriptionSettingCurrentSubscription_label") }),
			m(
				Card,
				m(
					".p-16",
					m(
						".block.center-h",
						{
							style: {
								width: "80%",
								maxWidth: px(320),
							},
						},
						m(DynamicColorSvg, {
							path: `/images/leaving-wizard/feature.svg`,
						}),
					),
					m("", lang.getTranslationText("subscriptionSettingsFreePlan_label")),
				),
			),
			m(
				".flex.justify-end",
				{
					id: "managesubscription",
				},
				m(PrimaryButton, {
					label: "subscriptionSettingsMoreFeatures_action",
					width: "flex",
					onclick: () => {
						this.handleUpgradeSubscription()
					},
				}),
			),
		])
	}

	//Render needed buttons
	private renderButtons(booking: Booking, currentSubscriptionState: SubscriptionStatus, isExternalSubscription: boolean): Children {
		//Show no buttons if subscription is in revocation process
		const isRevoked = this._customerInfo?.revocationRequest != null
		if (isRevoked) {
			return undefined
		}
		//Show downgrade and resubscribe button if expired
		if (currentSubscriptionState === "expired") {
			return m(
				".flex.justify-end.gap-8",
				m(SecondaryButton, {
					label: "subscriptionSettingDowngrade_action",
					width: "flex",
					onclick: () => showConfirmDowngradingToFreeDialog(),
				}),
				m(PrimaryButton, {
					label: "subscriptionStateCardResubscribe_action",
					width: "flex",
					onclick: () => this.onSubscriptionClick(),
				}),
			)
		}
		// Render external-store controls only when this client matches the subscription's store.
		if (isExternalSubscription) {
			const paymentMethod = this._accountingInfo ? getPaymentMethodType(this._accountingInfo) : null
			return hasMatchingExternalPaymentSetup(paymentMethod)
				? m(
						".flex.justify-end.gap-8",

						m(SecondaryButton, {
							label:
								EnvProvider.get().getPaymentSetup() === PaymentSetup.Appstore
									? "subscriptionSettingManageSubscription_action"
									: "subscriptionSettingManageSubscriptionGoogle_action",
							width: "flex",
							icon: Icons.OpenOutline,
							onclick: async () => {
								await locator.mobilePaymentsFacade.showSubscriptionConfigView()
							},
						}),
						currentSubscriptionState !== "cancelled" &&
							m(PrimaryButton, {
								label: "subscriptionSettingSwitchPlan_action",
								width: "flex",
								onclick: () => {
									this.onSubscriptionClick()
								},
							}),
					)
				: m(
						".flex.justify-end.gap-8",
						m(PrimaryButton, {
							label:
								EnvProvider.get().getPaymentSetup() === PaymentSetup.Appstore
									? "subscriptionSettingAppleWebsite_action"
									: "subscriptionSettingGoogleWebsite_action",
							width: "flex",
							icon: Icons.OpenOutline,
							onclick: () => {
								this.onSubscriptionClick()
							},
						}),
					)
		}

		//Show cancel button if renewal is enabled
		if (booking.renewalEnabled) {
			return m(
				".flex.justify-end",
				{
					id: "managesubscription",
				},
				m(SecondaryButton, {
					label: "subscriptionStateCardCancel_action",
					width: "flex",
					onclick: () =>
						showSubscriptionCancellationDialog(
							booking,
							shouldOfferSubscriptionRevocation(assertNotNull(this._customer).businessUse, assertNotNull(this._customerInfo).activationTime),
						),
				}),
			)
		}

		//Show keep subscription if renewal is not enabled
		else if (!booking.renewalEnabled) {
			return m(
				".flex.justify-end",
				{
					id: "managesubscription",
				},
				m(PrimaryButton, {
					label: "subscriptionSettingsKeep_action",
					width: "flex",
					onclick: () => this.handleKeepSubscriptionClick(),
				}),
			)
		}
	}

	//Handle the keep subscription button click. Calls renewalPreferenceService with isEnabled = true
	//to keep the subscription from getting downgraded
	private async handleKeepSubscriptionClick() {
		const confirm = await Dialog.confirm("subscriptionSettingsKeep_msg")
		if (confirm) {
			const customerId = assertNotNull(locator.logins.getUserController().user.customer)
			const inputData = {
				isEnabled: true,
				customerId: customerId,
			}
			const data = createRenewalPreferenceServicePostIn(inputData)
			await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.execute(RenewalPreferenceService_POST, data, null))
		}
	}

	//Gets the current state of a subscription
	private getCurrentStateOfSubscription(booking: Booking): SubscriptionStatus {
		if (booking.endDate && booking.endDate?.getTime() < Date.now()) {
			return "expired"
		} else if (this._customerInfo?.revocationRequest) {
			return "revoked"
		} else if (booking.renewalEnabled) {
			return "active"
		} else if (!booking.renewalEnabled) {
			return "cancelled"
		} else {
			return "unknown"
		}
	}

	private async onSubscriptionClick() {
		const paymentMethod = this._accountingInfo ? getPaymentMethodType(this._accountingInfo) : null

		if (hasMatchingExternalPaymentSetup(paymentMethod)) {
			// case 1: we are in iOS/ Android app and we either are not paying or are already on external subscription
			void this.handleExternalSubscriptionChange()
		} else if (isExternalPaymentMethod(paymentMethod)) {
			// case 2: we have a running AppStore/Google subscription but this is not the matching app

			// If there's a running App Store subscription it must be managed through Apple.
			// If there's a running Play Store subscription it must be managed through Google.
			// This includes the case where renewal is already disabled, but it's not expired yet.
			// Running subscription cannot be changed from other client, but it can still be managed through OS or when subscription expires.
			void openExternalSubscriptionPage(paymentMethod)
		} else {
			// other cases (not mobile app, not external payment method, no running external subscription, iOS/Android but another payment method)
			if (this._accountingInfo && this._customer && this._customerInfo && this._lastBooking) {
				void showSwitchDialog({
					customer: this._customer,
					accountingInfo: this._accountingInfo,
					lastBooking: this._lastBooking,
					acceptedPlans: (await locator.logins.getUserController().isNewPaidPlan()) ? NewPaidPlans : AvailablePlans,
					reason: null,
				})
			}
		}
	}

	private async handleUpgradeSubscription() {
		if (EnvProvider.get().getPaymentSetup() !== PaymentSetup.Default) {
			// We pass `null` because we expect no subscription when upgrading
			const externalSubscriptionOwnership = await queryExternalSubscriptionOwnership(null)

			if (externalSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				return Dialog.message(
					lang.getTranslation("storeMultiSubscriptionError_msg", {
						"{AppStorePayment}": InfoLink.AppStorePayment,
					}),
				)
			}
		}

		await showUpgradeWizard({ upgradePromptType: UpgradePromptType.SUBSCRIPTION_VIEWER, logins: locator.logins })
	}

	private async handleExternalSubscriptionChange() {
		if (!this.mobilePaymentsFacade) {
			throw Error("Not allowed to change external subscription from web client")
		}

		let customer
		let accountingInfo
		if (this._customer && this._accountingInfo) {
			customer = this._customer
			accountingInfo = this._accountingInfo
		} else {
			return
		}

		const externalSubscriptionOwnership = await queryExternalSubscriptionOwnership(base64ToUint8Array(base64ExtToBase64(elementIdToId(customer._id))))
		const isExternalPayment = isExternalPaymentMethod(getPaymentMethodType(accountingInfo))
		const userStatus = customer.approvalStatus
		const hasAnActiveSubscription = hasMatchingExternalStoreSubscription(accountingInfo, this._lastBooking)

		if (hasAnActiveSubscription && !(await this.canManageExternalSubscriptionInApp(externalSubscriptionOwnership))) {
			return
		}

		// Show a dialog only if the user's Apple account's last transaction was with this customer ID
		//
		// This prevents the user from accidentally changing a subscription that they don't own
		if (externalSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NotOwner) {
			// There's a subscription with this apple account that doesn't belong to this user
			return Dialog.message(
				lang.getTranslation("storeMultiSubscriptionError_msg", {
					"{AppStorePayment}": InfoLink.AppStorePayment,
				}),
			)
		} else if (
			isExternalPayment &&
			externalSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NoSubscription &&
			userStatus === ApprovalStatus.REGISTRATION_APPROVED
		) {
			// User has an ongoing subscriptions but not on the current Apple/Google Account, so we shouldn't allow them to change their plan with this account
			// instead of the account owner of the subscriptions
			return Dialog.message(lang.getTranslation("storeNoSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }))
		} else if (externalSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NoSubscription) {
			// User has no ongoing subscription and isn't approved. We should allow them to downgrade their accounts or resubscribe and
			// restart an Apple/Google Subscription flow
			const isResubscribe = await Dialog.choice(
				lang.getTranslation("storeDowngradeOrResubscribe_msg", { "{AppStoreDowngrade}": InfoLink.AppStoreDowngrade }),
				[
					{
						text: "subscriptionSettingDowngrade_action",
						value: false,
					},
					{
						text: "resubscribe_action",
						value: true,
					},
				],
			)

			if (isResubscribe) {
				const planType = await locator.logins.getUserController().getPlanType()
				const customerId = locator.logins.getUserController().user.customer!
				const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId))
				try {
					await this.mobilePaymentsFacade.requestSubscriptionToPlan(
						externalStorePlanName(planType),
						asPaymentInterval(accountingInfo.paymentInterval),
						customerIdBytes,
						null,
					)
				} catch (e) {
					if (e instanceof MobilePaymentError) {
						console.error("external subscription failed", e)
						void Dialog.message("appStoreSubscriptionError_msg", e.message)
					} else {
						throw e
					}
				}
			} else {
				return showConfirmDowngradingToFreeDialog()
			}
		} else {
			if (this._customerInfo && this._lastBooking) {
				return showSwitchDialog({
					customer,
					accountingInfo,
					lastBooking: this._lastBooking,
					acceptedPlans: NewPaidPlans,
					reason: null,
				})
			}
		}
	}

	private async canManageExternalSubscriptionInApp(ownership: MobilePaymentSubscriptionOwnership): Promise<boolean> {
		if (ownership === MobilePaymentSubscriptionOwnership.NotOwner) {
			// we have a subscription with the external provider for this app (calendar / mail / drive), but it's for another tuta account.
			// we could technically manage it from this tuta account, but we should not allow it because it's too easy to
			// confuse which subscription belongs to which tuta account.
			return false
		}

		const isMailSubscription = this._lastBooking?.subscriptionReference.subscriptionApp === SubscriptionApp.Mail

		if (ClientDetector.get().isCalendarApp() && isMailSubscription) {
			return await this.handleAppOpen(SubscriptionApp.Mail)
		} else if (!ClientDetector.get().isCalendarApp() && !isMailSubscription) {
			return await this.handleAppOpen(SubscriptionApp.Calendar)
		}

		return true
	}

	private async handleAppOpen(app: SubscriptionApp) {
		const appName = app === SubscriptionApp.Calendar ? "Tuta Calendar" : "Tuta Mail"
		const dialogResult = await Dialog.confirm(lang.getTranslation("handleSubscriptionOnApp_msg", { "{1}": appName }), "yes_label")
		const query = stringToBase64(`settings=subscription`)

		if (!dialogResult) {
			return false
		}

		if (app === SubscriptionApp.Calendar) {
			void locator.systemFacade.openCalendarApp(query)
		} else {
			void locator.systemFacade.openMailApp(query)
		}

		return false
	}

	private showOrderAgreementSection(): boolean {
		return (
			locator.logins.getUserController().isPaidAccount() &&
			this._customer != null &&
			this._customer.businessUse &&
			(this._customer.orderProcessingAgreement == null || this._customer.orderProcessingAgreementNeeded)
		)
	}
	private showOrderAgreementLink(): boolean {
		return (
			locator.logins.getUserController().isPaidAccount() &&
			this._customer != null &&
			this._customer.businessUse &&
			this._customer.orderProcessingAgreement != null &&
			!this._customer.orderProcessingAgreementNeeded
		)
	}

	private async updateCustomerData(customer: Customer): Promise<void> {
		this._customer = customer

		if (customer.orderProcessingAgreement) {
			this._orderAgreement = await locator.entityClient.load(OrderProcessingAgreementTypeRef, customer.orderProcessingAgreement)
		} else {
			this._orderAgreement = null
		}

		if (customer.orderProcessingAgreementNeeded) {
			this._orderAgreementFieldValue(lang.get("signingNeeded_msg"))
		} else if (this._orderAgreement) {
			this._orderAgreementFieldValue(
				lang.get("signedOn_msg", {
					"{date}": formatDate(this._orderAgreement.signatureDate),
				}),
			)
		} else {
			this._orderAgreementFieldValue(lang.get("notSigned_msg"))
		}

		m.redraw()
	}

	private showPriceData(): boolean {
		return locator.logins.getUserController().isPaidAccount() && !isAppStorePayment(this._accountingInfo)
	}

	private async updatePriceInfo(): Promise<void> {
		if (!this.showPriceData()) {
			return
		}

		const priceServiceReturn = await locator.bookingFacade.getCurrentPrice()
		if (priceServiceReturn.currentPriceThisPeriod != null && priceServiceReturn.currentPriceNextPeriod != null) {
			this._currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
			this._nextPriceFieldValue(formatPriceDataWithInfo(neverNull(priceServiceReturn.currentPriceNextPeriod)))
			m.redraw()
		}
	}

	private updateAccountInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo

		this._selectedSubscriptionInterval(asPaymentInterval(accountingInfo.paymentInterval))

		m.redraw()
	}

	private async updateSubscriptionField() {
		const userController = locator.logins.getUserController()
		const accountType: AccountType = downcast(userController.user.accountType)
		const planType = await userController.getPlanType()

		this._subscriptionFieldValue(_getAccountTypeName(accountType, planType))
	}

	private async updateBookings(): Promise<void> {
		const userController = locator.logins.getUserController()

		const customer = await userController.reloadCustomer()
		let customerInfo: CustomerInfo
		try {
			customerInfo = await userController.loadCustomerInfo()
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could not update bookings as customer info does not exist (moved between free/premium lists)")
				return
			} else {
				throw e
			}
		}

		this._customerInfo = customerInfo
		const bookings = await locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
		this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
		this._customer = customer

		const planConfig = await userController.getPlanConfig()
		await this.updateSubscriptionField()

		await Promise.all([
			this.updateUserField(),
			this.updateStorageField(customer, customerInfo),
			this.updateAliasField(),
			this.updateGroupsField(),
			this.updateWhitelabelField(planConfig),
			this.updateSharingField(planConfig),
			this.updateEventInvitesField(planConfig),
			this.updateAutoResponderField(planConfig),
		])
		m.redraw()
	}

	private async showSatisfactionDialog() {
		this._shownSatisfactionDialog = true
		const oldPlanType = this.currentPlanType
		this.currentPlanType = await locator.logins.getUserController().getPlanType()
		if (oldPlanType) {
			await showUserSatisfactionDialogAfterUpgrade(oldPlanType, this.currentPlanType)
		}
	}

	private async updateUserField(): Promise<void> {
		this._usersFieldValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.LegacyUsers, this._lastBooking)))
	}

	private async updateStorageField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		const usedStorage = await locator.customerFacade.readUsedCustomerStorage(getEtId(customer))
		const usedStorageFormatted = formatStorageSize(Number(usedStorage))
		const totalStorageFormatted = formatStorageSize(getTotalStorageCapacityPerCustomer(customer, customerInfo, this._lastBooking) * Const.MEMORY_GB_FACTOR)

		this._storageFieldValue(
			lang.get("amountUsedOf_label", {
				"{amount}": usedStorageFormatted,
				"{totalAmount}": totalStorageFormatted,
			}),
		)
	}

	private async updateAliasField(): Promise<void> {
		// we pass in the user group id here even though for legacy plans the id is ignored
		const counters = await locator.mailAddressFacade.getAliasCounters(locator.logins.getUserController().user.userGroup.group)
		this._emailAliasFieldValue(
			lang.get("amountUsedAndActivatedOf_label", {
				"{used}": counters.usedAliases,
				"{active}": counters.enabledAliases,
				"{totalAmount}": counters.totalAliases,
			}),
		)
	}

	private async updateGroupsField(): Promise<void> {
		const sharedMailCount = getCurrentCount(BookingItemFeatureType.SharedMailGroup, this._lastBooking)
		// Plural forms and number placement inside the string should be handled by the translation framework, but this is what we got now.
		const sharedMailText = sharedMailCount + " " + lang.get(sharedMailCount === 1 ? "sharedMailbox_label" : "sharedMailboxes_label")
		this._groupsFieldValue(sharedMailText)
	}

	private async updateWhitelabelField(planConfig: PlanConfiguration): Promise<void> {
		if (isWhitelabelActive(this._lastBooking, planConfig)) {
			this._whitelabelFieldValue(lang.get("active_label"))
		} else {
			this._whitelabelFieldValue(lang.get("deactivated_label"))
		}
	}

	private async updateSharingField(planConfig: PlanConfiguration): Promise<void> {
		if (isSharingActive(this._lastBooking, planConfig)) {
			this._sharingFieldValue(lang.get("active_label"))
		} else {
			this._sharingFieldValue(lang.get("deactivated_label"))
		}
	}

	private async updateEventInvitesField(planConfig: PlanConfiguration): Promise<void> {
		if (!this._customer) {
			this._eventInvitesFieldValue("")
		} else if (isEventInvitesActive(this._lastBooking, planConfig)) {
			this._eventInvitesFieldValue(lang.get("active_label"))
		} else {
			this._eventInvitesFieldValue(lang.get("deactivated_label"))
		}
	}

	private async updateAutoResponderField(planConfig: PlanConfiguration): Promise<void> {
		if (!this._customer) {
			this._autoResponderFieldValue("")
		} else if (isAutoResponderActive(this._lastBooking, planConfig)) {
			this._autoResponderFieldValue(lang.get("active_label"))
		} else {
			this._autoResponderFieldValue(lang.get("deactivated_label"))
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await promiseMap(updates, (update) => this.processUpdate(update))
	}

	async processUpdate(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, idToElementId(update.instanceId))
			this.updateAccountInfoData(accountingInfo)
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(UserTypeRef, update)) {
			await this.updateBookings()
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
			await this.updateBookings()
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			const customer = await locator.entityClient.load(CustomerTypeRef, idToElementId(update.instanceId))
			return await this.updateCustomerData(customer)
		} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
			// needed to update the displayed plan
			await this.updateBookings()
			if (!this._shownSatisfactionDialog) await this.showSatisfactionDialog()
			return await this.updatePriceInfo()
		}
	}

	private renderAgreement() {
		if (assertNotNull(this._customer).orderProcessingAgreementNeeded) {
			return m(
				".flex.col",
				m(MenuTitle, {
					content: lang.getTranslationText("orderProcessingAgreement_label"),
				}),

				m(MessageBanner, {
					translation: lang.getTranslation("orderProcessingAgreementInfo_msg"),
					type: "warning",
				}),
				m(
					".flex.row.justify-end",
					m(PrimaryButton, {
						label: "openAgreement_action",
						width: "flex",
						style: { width: "fit-content", marginTop: "-8px" },
						onclick: () => SignOrderAgreementDialog.showForSigning(neverNull(this._customer), neverNull(this._accountingInfo)),
					}),
				),
			)
		}
	}

	private showAgreementLink() {
		return m(
			".underline.cursor-pointer",
			{
				onclick: () => {
					locator.entityClient
						.load(GroupInfoTypeRef, neverNull(this._orderAgreement).signerUserGroupInfo)
						.then((signerUserGroupInfo) => SignOrderAgreementDialog.showForViewing(neverNull(this._orderAgreement), signerUserGroupInfo))
				},
			},
			lang.getTranslationText("orderProcessingAgreement_action"),
		)
	}

	private getPlanCellAttrs(plan: PlanType, button?: IconButtonAttrs): SubscriptionStateCellAttrs {
		return {
			label: "subscription_label",
			value: PlanTypeToName[plan],
			button,
		}
	}

	private getStatusCellAttrs(status: SubscriptionStatus): SubscriptionStateCellAttrs {
		return {
			label: "state_label",
			value: lang.getTranslationText(this.getSubscriptionStateLabel(status)),
		}
	}

	private getPaymentPeriodAttrs(paymentInterval: string): SubscriptionStateCellAttrs {
		const currentInterval = asPaymentInterval(paymentInterval)
		return {
			label: "paymentInterval_label",
			value:
				currentInterval === PaymentInterval.Monthly
					? lang.getTranslation("pricing.monthly_label").text
					: lang.getTranslation("pricing.yearly_label").text,
			button: {
				icon: Icons.Swap,
				title: "changePaymentInterval_action",
				click: async () => {
					const message = lang.getTranslation("subscriptionChangeInterval_msg", {
						"{period}":
							currentInterval === PaymentInterval.Yearly
								? lang.getTranslationText("pricing.monthly_label")
								: lang.getTranslationText("pricing.yearly_label"),
					})
					Dialog.confirm(message).then(async (confirmed) => {
						if (this._accountingInfo == null) {
							return
						}
						if (confirmed) {
							if (currentInterval === PaymentInterval.Yearly) {
								await locator.customerFacade.changePaymentInterval(this._accountingInfo, PaymentInterval.Monthly)
							} else {
								await locator.customerFacade.changePaymentInterval(this._accountingInfo, PaymentInterval.Yearly)
							}
						}
						m.redraw()
					})
				},
			},
		}
	}

	private getPriceCellAttrs(formattedPrice: string): SubscriptionStateCellAttrs {
		return {
			label: "price_label",
			value: formattedPrice,
		}
	}

	private getEndDateAttrs(status: SubscriptionStatus, endDate: Date | null): SubscriptionStateCellAttrs {
		const formatDateNullableDate = (value: Date | null): string => (value ? formatDate(value) : "-")
		const dateLabel = (status: SubscriptionStatus) => {
			if (status === "active") {
				return "subscriptionStateCardRenewalDate_label"
			} else if (status === "planned") {
				return "subscriptionStateCardStartDate_label"
			} else {
				return "subscriptionStateCardEndDate_label"
			}
		}
		return {
			label: dateLabel(status),
			value: formatDateNullableDate(endDate),
		}
	}

	private getSubscriptionStateLabel(status: SubscriptionStatus): TranslationKey {
		switch (status) {
			case "active":
				return "subscriptionSettingsActiveState_label"
			case "revoked":
				return "subscriptionSettingsRevokedState_label"
			case "expired":
				return "subscriptionSettingsExpiredState_label"
			case "planned":
				return "subscriptionSettingsPlannedState_label"
			case "cancelled":
				return "subscriptionSettingsCancelledState_label"
			default:
				return "subscriptionSettingsUnknownState_label"
		}
	}
}

function _getAccountTypeName(type: AccountType, subscription: PlanType): string {
	if (type === AccountType.PAID) {
		return getDisplayNameOfPlanType(subscription)
	} else {
		return AccountTypeNames[type]
	}
}
