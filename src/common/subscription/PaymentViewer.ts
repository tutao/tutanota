import m, { Children } from "mithril"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { assertNotNull, last, neverNull, ofClass } from "@tutao/tutanota-utils"
import { InfoLink, lang, TranslationKey } from "../misc/LanguageViewModel"
import {
	AccountingInfo,
	AccountingInfoTypeRef,
	BookingTypeRef,
	createDebitServicePutData,
	Customer,
	CustomerTypeRef,
	InvoiceInfo,
	InvoiceInfoTypeRef,
} from "../api/entities/sys/TypeRefs.js"
import { HtmlEditor, HtmlEditorMode } from "../gui/editor/HtmlEditor"
import { formatPrice, getPaymentMethodInfoText, getPaymentMethodName } from "./PriceUtils"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import { Icons } from "../gui/base/icons/Icons"
import { ColumnWidth, Table, TableLineAttrs } from "../gui/base/Table.js"
import { ButtonType } from "../gui/base/Button.js"
import { formatDate } from "../misc/Formatter"
import {
	AccountType,
	AvailablePlans,
	getDefaultPaymentMethod,
	getPaymentMethodType,
	NewPaidPlans,
	PaymentMethodType,
	PostingType,
} from "../api/common/TutanotaConstants"
import { BadGatewayError, LockedError, PreconditionFailedError, TooManyRequestsError } from "../api/common/error/RestError"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { getByAbbreviation } from "../api/common/CountryList"
import * as PaymentDataDialog from "./PaymentDataDialog"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { getPreconditionFailedPaymentMsg, hasRunningAppStoreSubscription } from "./SubscriptionUtils"
import type { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import { DialogHeaderBar } from "../gui/base/DialogHeaderBar"
import { TextField } from "../gui/base/TextField.js"
import type { CustomerAccountPosting } from "../api/entities/accounting/TypeRefs"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander"
import { locator } from "../api/main/CommonLocator"
import { createNotAvailableForFreeClickHandler } from "../misc/SubscriptionDialogs"
import { TranslationKeyType } from "../misc/TranslationKey"
import { CustomerAccountService } from "../api/entities/accounting/Services"
import { DebitService } from "../api/entities/sys/Services"
import { IconButton } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { client } from "../misc/ClientDetector.js"
import { DeviceType } from "../misc/ClientConstants.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import type { UpdatableSettingsViewer } from "../settings/Interfaces.js"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"
import { showSwitchDialog } from "./SwitchSubscriptionDialog.js"
import { GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"

assertMainOrNode()

/**
 * Displays payment method/invoice data and allows changing them.
 */
export class PaymentViewer implements UpdatableSettingsViewer {
	private readonly invoiceAddressField: HtmlEditor
	private customer: Customer | null = null
	private accountingInfo: AccountingInfo | null = null
	private postings: readonly CustomerAccountPosting[] = []
	private outstandingBookingsPrice: number | null = null
	private balance: number = 0
	private invoiceInfo: InvoiceInfo | null = null
	private postingsExpanded: boolean = false

	constructor() {
		this.invoiceAddressField = new HtmlEditor()
			.setMinHeight(140)
			.showBorders()
			.setMode(HtmlEditorMode.HTML)
			.setHtmlMonospace(false)
			.setReadOnly(true)
			.setPlaceholderId("invoiceAddress_label")
		this.loadData()
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m(
			"#invoicing-settings.fill-absolute.scroll.plr-l",
			{
				role: "group",
			},
			[this.renderInvoiceData(), this.renderPaymentMethod(), this.renderPostings()],
		)
	}

	private async loadData() {
		this.customer = await locator.logins.getUserController().loadCustomer()
		const customerInfo = await locator.logins.getUserController().loadCustomerInfo()

		const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
		this.updateAccountingInfoData(accountingInfo)
		this.invoiceInfo = await locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo))
		m.redraw()
		await this.loadPostings()
	}

	private renderPaymentMethod(): Children {
		const paymentMethodHelpLabel = () => {
			if (this.accountingInfo && getPaymentMethodType(this.accountingInfo) === PaymentMethodType.Invoice) {
				return lang.get("paymentProcessingTime_msg")
			}

			return ""
		}

		const paymentMethod = this.accountingInfo
			? getPaymentMethodName(getPaymentMethodType(neverNull(this.accountingInfo))) + " " + getPaymentMethodInfoText(neverNull(this.accountingInfo))
			: lang.get("loading_msg")

		return m(TextField, {
			label: "paymentMethod_label",
			value: paymentMethod,
			helpLabel: paymentMethodHelpLabel,
			isReadOnly: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "paymentMethod_label",
					click: (e, dom) => this.handlePaymentMethodClick(e, dom),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private async handlePaymentMethodClick(e: MouseEvent, dom: HTMLElement) {
		if (this.accountingInfo == null) {
			return
		}
		const currentPaymentMethod: PaymentMethodType | null = getPaymentMethodType(this.accountingInfo)
		if (isIOSApp()) {
			const shouldEnableiOSPayment = await locator.appStorePaymentPicker.shouldEnableAppStorePayment(currentPaymentMethod)
			if (shouldEnableiOSPayment) {
				return locator.mobilePaymentsFacade.showSubscriptionConfigView()
			} else {
				return Dialog.message("notAvailableInApp_msg")
			}
		} else if (hasRunningAppStoreSubscription(this.accountingInfo)) {
			return showManageThroughAppStoreDialog()
		} else if (currentPaymentMethod == PaymentMethodType.AppStore && this.customer?.type === AccountType.PAID) {
			// For now we do not allow changing payment method for Paid accounts that use AppStore,
			// they must downgrade to Free first.

			const isResubscribe = await Dialog.choice(
				() => lang.get("storeDowngradeOrResubscribe_msg", { "{AppStoreDowngrade}": InfoLink.AppStoreDowngrade }),
				[
					{
						text: "changePlan_action",
						value: false,
					},
					{
						text: "resubscribe_action",
						value: true,
					},
				],
			)
			if (isResubscribe) {
				return showManageThroughAppStoreDialog()
			} else {
				const customerInfo = await locator.logins.getUserController().loadCustomerInfo()
				const bookings = await locator.entityClient.loadRange(BookingTypeRef, assertNotNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
				const lastBooking = last(bookings)
				if (lastBooking == null) {
					console.warn("No booking but payment method is AppStore?")
					return
				}
				return showSwitchDialog(this.customer, customerInfo, this.accountingInfo, lastBooking, AvailablePlans, null)
			}
		} else {
			const showPaymentMethodDialog = createNotAvailableForFreeClickHandler(
				NewPaidPlans,
				() => this.accountingInfo && this.changePaymentMethod(),
				// iOS app is checked above
				() => locator.logins.getUserController().isPremiumAccount(),
			)

			showPaymentMethodDialog(e, dom)
		}
	}

	private changeInvoiceData() {
		if (this.accountingInfo) {
			const accountingInfo = neverNull(this.accountingInfo)
			const invoiceCountry = accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null
			InvoiceDataDialog.show(
				neverNull(neverNull(this.customer).businessUse),
				{
					invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
					country: invoiceCountry,
					vatNumber: accountingInfo.invoiceVatIdNo,
				},
				accountingInfo,
			)
		}
	}

	private changePaymentMethod() {
		if (this.accountingInfo && hasRunningAppStoreSubscription(this.accountingInfo)) {
			throw new ProgrammingError("Active AppStore subscription")
		}

		let nextPayment = this.amountOwed() * -1
		showProgressDialog(
			"pleaseWait_msg",
			locator.bookingFacade.getCurrentPrice().then((priceServiceReturn) => {
				return Math.max(
					nextPayment,
					Number(neverNull(priceServiceReturn.currentPriceThisPeriod).price),
					Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price),
				)
			}),
		)
			.then((price) =>
				getDefaultPaymentMethod(locator.appStorePaymentPicker).then((paymentMethod) => {
					return { price, paymentMethod }
				}),
			)
			.then(({ price, paymentMethod }) => {
				return PaymentDataDialog.show(neverNull(this.customer), neverNull(this.accountingInfo), price, paymentMethod).then((success) => {
					if (success) {
						if (this.isPayButtonVisible()) {
							return this.showPayDialog(this.amountOwed())
						}
					}
				})
			})
	}

	private renderPostings(): Children {
		if (!this.postings || this.postings.length === 0) {
			return null
		} else {
			const balance = this.balance
			return [
				m(".h4.mt-l", lang.get("currentBalance_label")),
				m(".flex.center-horizontally.center-vertically.col", [
					m(
						"div.h4.pt.pb" + (this.isAmountOwed() ? ".content-accent-fg" : ""),
						formatPrice(balance, true) + (this.accountBalance() !== balance ? ` (${formatPrice(this.accountBalance(), true)})` : ""),
					),
					this.accountBalance() !== balance
						? m(
								".small" + (this.accountBalance() < 0 ? ".content-accent-fg" : ""),
								lang.get("unprocessedBookings_msg", {
									"{amount}": formatPrice(assertNotNull(this.outstandingBookingsPrice), true),
								}),
						  )
						: null,
					this.isPayButtonVisible()
						? m(
								".pb",
								{
									style: {
										width: "200px",
									},
								},
								m(LoginButton, {
									label: "invoicePay_action",
									onclick: () => this.showPayDialog(this.amountOwed()),
								}),
						  )
						: null,
				]),
				this.accountingInfo &&
				this.accountingInfo.paymentMethod !== PaymentMethodType.Invoice &&
				(this.isAmountOwed() || (this.invoiceInfo && this.invoiceInfo.paymentErrorInfo))
					? this.invoiceInfo && this.invoiceInfo.paymentErrorInfo
						? m(".small.underline.b", lang.get(getPreconditionFailedPaymentMsg(this.invoiceInfo.paymentErrorInfo.errorCode)))
						: m(".small.underline.b", lang.get("failedDebitAttempt_msg"))
					: null,
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get("postings_label")),
					m(ExpanderButton, {
						label: "show_action",
						expanded: this.postingsExpanded,
						onExpandedChange: (expanded) => (this.postingsExpanded = expanded),
					}),
				]),
				m(
					ExpanderPanel,
					{
						expanded: this.postingsExpanded,
					},
					m(Table, {
						columnHeading: ["type_label", "amount_label"],
						columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
						columnAlignments: [false, true, false],
						showActionButtonColumn: true,
						lines: this.postings.map((posting: CustomerAccountPosting) => this.postingLineAttrs(posting)),
					}),
				),
				m(".small", lang.get("invoiceSettingDescription_msg") + " " + lang.get("laterInvoicingInfo_msg")),
			]
		}
	}

	private postingLineAttrs(posting: CustomerAccountPosting): TableLineAttrs {
		return {
			cells: () => [
				{
					main: getPostingTypeText(posting),
					info: [formatDate(posting.valueDate)],
				},
				{
					main: formatPrice(Number(posting.amount), true),
				},
			],
			actionButtonAttrs:
				posting.type === PostingType.UsageFee || posting.type === PostingType.Credit || posting.type === PostingType.SalesCommission
					? {
							title: "download_action",
							icon: Icons.Download,
							size: ButtonSize.Compact,
							click: () => this.doInvoiceDownload(posting),
					  }
					: null,
		}
	}

	private async doInvoiceDownload(posting: CustomerAccountPosting): Promise<unknown> {
		if (client.compressionStreamSupported()) {
			return showProgressDialog("pleaseWait_msg", locator.customerFacade.generatePdfInvoice(neverNull(posting.invoiceNumber))).then((pdfInvoice) =>
				locator.fileController.saveDataFile(pdfInvoice),
			)
		} else {
			if (client.device == DeviceType.ANDROID) {
				return Dialog.message("invoiceFailedWebview_msg", () => m("div", m("a", { href: InfoLink.Webview, target: "_blank" }, InfoLink.Webview)))
			} else if (client.isIos()) {
				return Dialog.message("invoiceFailedIOS_msg")
			} else {
				return Dialog.message("invoiceFailedBrowser_msg")
			}
		}
	}

	private updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this.accountingInfo = accountingInfo

		this.invoiceAddressField.setValue(
			formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry ?? undefined),
		)

		m.redraw()
	}

	private accountBalance(): number {
		return this.balance - assertNotNull(this.outstandingBookingsPrice)
	}

	private amountOwed(): number {
		if (this.balance != null) {
			let balance = this.balance

			if (balance < 0) {
				return balance
			}
		}

		return 0
	}

	private isAmountOwed(): boolean {
		return this.amountOwed() < 0
	}

	private loadPostings(): Promise<void> {
		return locator.serviceExecutor.get(CustomerAccountService, null).then((result) => {
			this.postings = result.postings
			this.outstandingBookingsPrice = Number(result.outstandingBookingsPrice)
			this.balance = Number(result.balance)
			m.redraw()
		})
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			await this.processEntityUpdate(update)
		}
	}

	private async processEntityUpdate(update: EntityUpdateData): Promise<void> {
		const { instanceId } = update

		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, instanceId)
			this.updateAccountingInfoData(accountingInfo)
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			this.customer = await locator.logins.getUserController().loadCustomer()
			m.redraw()
		} else if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
			this.invoiceInfo = await locator.entityClient.load(InvoiceInfoTypeRef, instanceId)
			m.redraw()
		}
	}

	private isPayButtonVisible(): boolean {
		return (
			this.accountingInfo != null &&
			(this.accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this.accountingInfo.paymentMethod === PaymentMethodType.Paypal) &&
			this.isAmountOwed()
		)
	}

	private showPayDialog(openBalance: number): Promise<void> {
		return showPayConfirmDialog(openBalance)
			.then((confirmed) => {
				if (confirmed) {
					return showProgressDialog(
						"pleaseWait_msg",
						locator.serviceExecutor
							.put(DebitService, createDebitServicePutData({ invoice: null }))
							.catch(ofClass(LockedError, () => "operationStillActive_msg" as TranslationKey))
							.catch(ofClass(PreconditionFailedError, (error) => getPreconditionFailedPaymentMsg(error.data)))
							.catch(ofClass(BadGatewayError, () => "paymentProviderNotAvailableError_msg" as TranslationKey))
							.catch(ofClass(TooManyRequestsError, () => "tooManyAttempts_msg" as TranslationKey)),
					)
				}
			})
			.then((errorId: TranslationKeyType | void) => {
				if (errorId) {
					return Dialog.message(errorId)
				} else {
					return this.loadPostings()
				}
			})
	}

	private renderInvoiceData(): Children {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("invoiceData_msg")),
				m(IconButton, {
					title: "invoiceData_msg",
					click: createNotAvailableForFreeClickHandler(
						NewPaidPlans,
						() => this.changeInvoiceData(),
						() => locator.logins.getUserController().isPremiumAccount(),
					),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
			]),
			m(this.invoiceAddressField),
			this.accountingInfo && this.accountingInfo.invoiceVatIdNo.trim().length > 0
				? m(TextField, {
						label: "invoiceVatIdNo_label",
						value: this.accountingInfo ? this.accountingInfo.invoiceVatIdNo : lang.get("loading_msg"),
						isReadOnly: true,
				  })
				: null,
		]
	}
}

function showPayConfirmDialog(price: number): Promise<boolean> {
	return new Promise((resolve) => {
		let dialog: Dialog

		const doAction = (res: boolean) => {
			dialog.close()
			resolve(res)
		}

		const actionBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: () => doAction(false),
					type: ButtonType.Secondary,
				},
			],
			right: [
				{
					label: "invoicePay_action",
					click: () => doAction(true),
					type: ButtonType.Primary,
				},
			],
			middle: () => lang.get("adminPayment_action"),
		}
		dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => [
				m(DialogHeaderBar, actionBarAttrs),
				m(
					".plr-l.pb",
					m("", [
						m(".pt", lang.get("invoicePayConfirm_msg")),
						m(TextField, {
							label: "price_label",
							value: formatPrice(-price, true),
							isReadOnly: true,
						}),
					]),
				),
			],
		})
			.setCloseHandler(() => doAction(false))
			.show()
	})
}

function getPostingTypeText(posting: CustomerAccountPosting): string {
	switch (posting.type) {
		case PostingType.UsageFee:
			return lang.get("invoice_label")

		case PostingType.Credit:
			return lang.get("credit_label")

		case PostingType.Payment:
			return lang.get("adminPayment_action")

		case PostingType.Refund:
			return lang.get("refund_label")

		case PostingType.GiftCard:
			return Number(posting.amount) < 0 ? lang.get("boughtGiftCardPosting_label") : lang.get("redeemedGiftCardPosting_label")

		case PostingType.SalesCommission:
			return Number(posting.amount) < 0 ? lang.get("cancelledReferralCreditPosting_label") : lang.get("referralCreditPosting_label")

		default:
			return ""
		// Generic, Dispute, Suspension, SuspensionCancel
	}
}

export async function showManageThroughAppStoreDialog(): Promise<void> {
	const confirmed = await Dialog.confirm(() =>
		lang.get("storeSubscription_msg", {
			"{AppStorePayment}": InfoLink.AppStorePayment,
		}),
	)
	if (confirmed) {
		window.open("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer")
	}
}
