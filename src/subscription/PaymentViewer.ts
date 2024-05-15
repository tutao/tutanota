import m, { Children } from "mithril"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { assertNotNull, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { InfoLink, lang, TranslationKey } from "../misc/LanguageViewModel"
import type { AccountingInfo, Booking, Customer, InvoiceInfo } from "../api/entities/sys/TypeRefs.js"
import { AccountingInfoTypeRef, BookingTypeRef, createDebitServicePutData, CustomerTypeRef, InvoiceInfoTypeRef } from "../api/entities/sys/TypeRefs.js"
import { HtmlEditor, HtmlEditorMode } from "../gui/editor/HtmlEditor"
import { formatPrice, getPaymentMethodInfoText, getPaymentMethodName } from "./PriceUtils"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import { Icons } from "../gui/base/icons/Icons"
import { ColumnWidth, Table, TableLineAttrs } from "../gui/base/Table.js"
import { ButtonType } from "../gui/base/Button.js"
import { formatDate } from "../misc/Formatter"
import { getPaymentMethodType, NewPaidPlans, PaymentMethodType, PostingType } from "../api/common/TutanotaConstants"
import { BadGatewayError, LockedError, PreconditionFailedError, TooManyRequestsError } from "../api/common/error/RestError"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { getByAbbreviation } from "../api/common/CountryList"
import * as PaymentDataDialog from "./PaymentDataDialog"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"

import stream from "mithril/stream"
import Stream from "mithril/stream"
import { getPreconditionFailedPaymentMsg } from "./SubscriptionUtils"
import type { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import { DialogHeaderBar } from "../gui/base/DialogHeaderBar"
import { TextField } from "../gui/base/TextField.js"
import type { CustomerAccountPosting } from "../api/entities/accounting/TypeRefs"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander"
import { locator } from "../api/main/MainLocator"
import { createNotAvailableForFreeClickHandler } from "../misc/SubscriptionDialogs"
import type { UpdatableSettingsViewer } from "../settings/SettingsView"
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

assertMainOrNode()

export class PaymentViewer implements UpdatableSettingsViewer {
	private readonly _invoiceAddressField: HtmlEditor
	private _customer: Customer | null = null
	private _accountingInfo: AccountingInfo | null = null
	private _postings: CustomerAccountPosting[]
	private _outstandingBookingsPrice: number | null = null
	private _balance: number
	private _lastBooking: Booking | null
	private _paymentBusy: boolean
	private _invoiceInfo: InvoiceInfo | null = null
	view: UpdatableSettingsViewer["view"]

	constructor() {
		this._invoiceAddressField = new HtmlEditor()
			.setMinHeight(140)
			.showBorders()
			.setMode(HtmlEditorMode.HTML)
			.setHtmlMonospace(false)
			.setReadOnly(true)
			.setPlaceholderId("invoiceAddress_label")
		this._postings = []
		this._outstandingBookingsPrice = null
		this._balance = 0
		this._lastBooking = null
		this._paymentBusy = false
		const postingExpanded = stream(false)

		this.view = (): Children => {
			return m(
				"#invoicing-settings.fill-absolute.scroll.plr-l",
				{
					role: "group",
				},
				[this.renderInvoiceData(), this.renderPaymentMethod(), this._renderPostings(postingExpanded)],
			)
		}
		locator.logins
			.getUserController()
			.loadCustomer()
			.then((customer) => {
				this._customer = customer
				return locator.logins.getUserController().loadCustomerInfo()
			})
			.then((customerInfo) => locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then((accountingInfo) => {
				this._updateAccountingInfoData(accountingInfo)

				locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo)).then((invoiceInfo) => {
					this._invoiceInfo = invoiceInfo
					m.redraw()
				})
			})
			.then(() => this._loadPostings())
			.then(() => this._loadBookings())
	}

	private renderPaymentMethod() {
		const paymentMethodHelpLabel = () => {
			if (this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.Invoice) {
				return lang.get("paymentProcessingTime_msg")
			}

			return ""
		}

		const paymentMethod = this._accountingInfo
			? getPaymentMethodName(getPaymentMethodType(neverNull(this._accountingInfo))) + " " + getPaymentMethodInfoText(neverNull(this._accountingInfo))
			: lang.get("loading_msg")

		return m(TextField, {
			label: "paymentMethod_label",
			value: paymentMethod,
			helpLabel: paymentMethodHelpLabel,
			isReadOnly: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "paymentMethod_label",
					click: (e, dom) => this.handlePlanChangeClick(e, dom),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private handlePlanChangeClick(e: MouseEvent, dom: HTMLElement) {
		if (isIOSApp()) {
			return Dialog.message("notAvailableInApp_msg")
		} else if (this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.AppStore) {
			return Dialog.message(() =>
				lang.get("storePaymentMethodChange_msg", {
					"{AppStorePaymentChange}": InfoLink.AppStorePaymentChange,
				}),
			)
		}

		const showPaymentMethodDialog = createNotAvailableForFreeClickHandler(
			NewPaidPlans,
			() => this._accountingInfo && this.changePaymentMethod(),
			() => !isIOSApp() && locator.logins.getUserController().isPremiumAccount(),
		)

		showPaymentMethodDialog(e, dom)
	}

	private changeInvoiceData() {
		if (this._accountingInfo) {
			const accountingInfo = neverNull(this._accountingInfo)
			const invoiceCountry = accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null
			InvoiceDataDialog.show(
				neverNull(neverNull(this._customer).businessUse),
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
		const isAppStorePayment = this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.AppStore

		if (isAppStorePayment) {
			return Dialog.message(() =>
				lang.get("storeSubscription_msg", {
					"{AppStorePayment}": InfoLink.AppStorePayment,
				}),
			).then(() => {
				window.open("https://apps.apple.com/account/subscriptions", "_blank")
			})
		}

		let nextPayment = this._amountOwed() * -1
		showProgressDialog(
			"pleaseWait_msg",
			locator.bookingFacade.getCurrentPrice().then((priceServiceReturn) => {
				return Math.max(
					nextPayment,
					Number(neverNull(priceServiceReturn.currentPriceThisPeriod).price),
					Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price),
				)
			}),
		).then((price) => {
			return PaymentDataDialog.show(neverNull(this._customer), neverNull(this._accountingInfo), price).then((success) => {
				if (success) {
					if (this._isPayButtonVisible()) {
						return this._showPayDialog(this._amountOwed())
					}
				}
			})
		})
	}

	_renderPostings(postingExpanded: Stream<boolean>): Children {
		if (!this._postings || this._postings.length === 0) {
			return null
		} else {
			const balance = this._balance
			return [
				m(".h4.mt-l", lang.get("currentBalance_label")),
				m(".flex.center-horizontally.center-vertically.col", [
					m(
						"div.h4.pt.pb" + (this._isAmountOwed() ? ".content-accent-fg" : ""),
						formatPrice(balance, true) + (this._accountBalance() !== balance ? ` (${formatPrice(this._accountBalance(), true)})` : ""),
					),
					this._accountBalance() !== balance
						? m(
								".small" + (this._accountBalance() < 0 ? ".content-accent-fg" : ""),
								lang.get("unprocessedBookings_msg", {
									"{amount}": formatPrice(assertNotNull(this._outstandingBookingsPrice), true),
								}),
						  )
						: null,
					this._isPayButtonVisible()
						? m(
								".pb",
								{
									style: {
										width: "200px",
									},
								},
								m(LoginButton, {
									label: "invoicePay_action",
									onclick: () => this._showPayDialog(this._amountOwed()),
								}),
						  )
						: null,
				]),
				this._accountingInfo &&
				this._accountingInfo.paymentMethod !== PaymentMethodType.Invoice &&
				(this._isAmountOwed() || (this._invoiceInfo && this._invoiceInfo.paymentErrorInfo))
					? this._invoiceInfo && this._invoiceInfo.paymentErrorInfo
						? m(".small.underline.b", lang.get(getPreconditionFailedPaymentMsg(this._invoiceInfo.paymentErrorInfo.errorCode)))
						: m(".small.underline.b", lang.get("failedDebitAttempt_msg"))
					: null,
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get("postings_label")),
					m(ExpanderButton, {
						label: "show_action",
						expanded: postingExpanded(),
						onExpandedChange: postingExpanded,
					}),
				]),
				m(
					ExpanderPanel,
					{
						expanded: postingExpanded(),
					},
					m(Table, {
						columnHeading: ["type_label", "amount_label"],
						columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
						columnAlignments: [false, true, false],
						showActionButtonColumn: true,
						lines: this._postings.map((posting: CustomerAccountPosting) => this.postingLineAttrs(posting)),
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

	_updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo

		this._invoiceAddressField.setValue(
			formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry ?? undefined),
		)

		m.redraw()
	}

	_accountBalance(): number {
		return this._balance - assertNotNull(this._outstandingBookingsPrice)
	}

	_amountOwed(): number {
		if (this._balance != null) {
			let balance = this._balance

			if (balance < 0) {
				return balance
			}
		}

		return 0
	}

	_isAmountOwed(): boolean {
		return this._amountOwed() < 0
	}

	_loadBookings(): Promise<void> {
		return locator.logins
			.getUserController()
			.loadCustomerInfo()
			.then((customerInfo) => (customerInfo.bookings ? locator.entityClient.loadAll(BookingTypeRef, customerInfo.bookings.items) : []))
			.then((bookings) => {
				this._lastBooking = bookings[bookings.length - 1]
				m.redraw()
			})
	}

	_loadPostings(): Promise<void> {
		return locator.serviceExecutor.get(CustomerAccountService, null).then((result) => {
			this._postings = result.postings
			this._outstandingBookingsPrice = Number(result.outstandingBookingsPrice)
			this._balance = Number(result.balance)
			m.redraw()
		})
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			return this.processUpdate(update)
		}).then(noOp)
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const { instanceId } = update

		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			return locator.entityClient.load(AccountingInfoTypeRef, instanceId).then((accountingInfo) => this._updateAccountingInfoData(accountingInfo))
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			return locator.entityClient.load(CustomerTypeRef, instanceId).then((customer) => {
				this._customer = customer
			})
		} else if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
			return locator.entityClient.load(InvoiceInfoTypeRef, instanceId).then((invoiceInfo) => {
				this._invoiceInfo = invoiceInfo
				m.redraw()
			})
		} else {
			return Promise.resolve()
		}
	}

	_isPayButtonVisible(): boolean {
		return (
			this._accountingInfo != null &&
			(this._accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this._accountingInfo.paymentMethod === PaymentMethodType.Paypal) &&
			this._isAmountOwed()
		)
	}

	_showPayDialog(openBalance: number): Promise<void> {
		this._paymentBusy = true
		return _showPayConfirmDialog(openBalance)
			.then((confirmed) => {
				if (confirmed) {
					return showProgressDialog(
						"pleaseWait_msg",
						locator.serviceExecutor
							.put(DebitService, createDebitServicePutData({ invoice: null }))
							.catch(ofClass(LockedError, () => "operationStillActive_msg" as TranslationKey))
							.catch(
								ofClass(PreconditionFailedError, (error) => {
									return getPreconditionFailedPaymentMsg(error.data)
								}),
							)
							.catch(ofClass(BadGatewayError, () => "paymentProviderNotAvailableError_msg" as TranslationKey))
							.catch(ofClass(TooManyRequestsError, () => "tooManyAttempts_msg" as TranslationKey)),
					)
				}
			})
			.then((errorId: TranslationKeyType | void) => {
				if (errorId) {
					return Dialog.message(errorId)
				} else {
					return this._loadPostings()
				}
			})
			.finally(() => (this._paymentBusy = false))
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
			m(this._invoiceAddressField),
			this._accountingInfo && this._accountingInfo.invoiceVatIdNo.trim().length > 0
				? m(TextField, {
						label: "invoiceVatIdNo_label",
						value: this._accountingInfo ? this._accountingInfo.invoiceVatIdNo : lang.get("loading_msg"),
						isReadOnly: true,
				  })
				: null,
		]
	}
}

function _showPayConfirmDialog(price: number): Promise<boolean> {
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
