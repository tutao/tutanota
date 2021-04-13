// @flow
import m from "mithril"
import {assertMainOrNode, isIOSApp} from "../api/common/Env"
import {neverNull} from "../api/common/utils/Utils"
import {load, serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {lang} from "../misc/LanguageViewModel.js"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {HtmlEditor, Mode} from "../gui/editor/HtmlEditor"
import {formatPrice, getPaymentMethodInfoText, getPaymentMethodName} from "./PriceUtils"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import {Icons} from "../gui/base/icons/Icons"
import {HttpMethod} from "../api/common/EntityFunctions"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {formatDate, formatNameAndAddress} from "../misc/Formatter"
import {getPaymentMethodType, PaymentMethodType, PostingType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import {BadGatewayError, LockedError, PreconditionFailedError, TooManyRequestsError} from "../api/common/error/RestError"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {createDebitServicePutData} from "../api/entities/sys/DebitServicePutData"
import {SysService} from "../api/entities/sys/Services"
import {getByAbbreviation} from "../api/common/CountryList"
import * as PaymentDataDialog from "./PaymentDataDialog"
import {showProgressDialog} from "../gui/ProgressDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import stream from "mithril/stream/stream.js"
import {getPreconditionFailedPaymentMsg} from "./SubscriptionUtils"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {TextFieldN} from "../gui/base/TextFieldN"
import {AccountingService} from "../api/entities/accounting/Services"
import {CustomerAccountReturnTypeRef} from "../api/entities/accounting/CustomerAccountReturn"
import type {Customer} from "../api/entities/sys/Customer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {logins} from "../api/main/LoginController"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import type {InvoiceInfo} from "../api/entities/sys/InvoiceInfo"
import {InvoiceInfoTypeRef} from "../api/entities/sys/InvoiceInfo"
import type {CustomerAccountPosting} from "../api/entities/accounting/CustomerAccountPosting"
import {createCustomerAccountPosting} from "../api/entities/accounting/CustomerAccountPosting"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {locator} from "../api/main/MainLocator"
import type {Booking} from "../api/entities/sys/Booking"
import {BookingTypeRef} from "../api/entities/sys/Booking"
import {createNotAvailableForFreeClickHandler} from "../misc/SubscriptionDialogs"

assertMainOrNode()

export class PaymentViewer implements UpdatableSettingsViewer {
	_invoiceAddressField: HtmlEditor;
	_customer: ?Customer;
	_accountingInfo: ?AccountingInfo;
	_postings: CustomerAccountPosting[]
	_outstandingBookingsPrice: number
	_lastBooking: ?Booking
	_paymentBusy: boolean;
	_invoiceInfo: ?InvoiceInfo;

	view: Function;

	constructor() {
		this._invoiceAddressField = new HtmlEditor()
			.setMinHeight(140)
			.showBorders()
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)
			.setEnabled(false)
			.setPlaceholderId("invoiceAddress_label")

		const changeInvoiceDataButtonAttrs = {
			label: "invoiceData_msg",
			click: createNotAvailableForFreeClickHandler(true, () => {
				if (this._accountingInfo) {
					const accountingInfo = neverNull(this._accountingInfo)
					const invoiceCountry = accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null
					InvoiceDataDialog.show(
						neverNull(neverNull(this._customer).businessUse),
						{
							invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
							country: invoiceCountry,
							vatNumber: accountingInfo.invoiceVatIdNo
						},
						accountingInfo
					)
				}
			}, () => logins.getUserController().isPremiumAccount()),
			icon: () => Icons.Edit
		}

		this._postings = []
		this._lastBooking = null
		this._paymentBusy = false

		const postingExpanded = stream(false)


		this.view = (): VirtualElement => {
			const changePaymentDataButtonAttrs = {
				label: "paymentMethod_label",
				click: createNotAvailableForFreeClickHandler(true, () => {
						if (this._accountingInfo) {
							let nextPayment = this._postings.length
								? Number(this._postings[0].balance) * -1
								: 0
							showProgressDialog("pleaseWait_msg", worker.getCurrentPrice().then(priceServiceReturn => {
								return Math.max(nextPayment, Number(neverNull(priceServiceReturn.currentPriceThisPeriod).price), Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price))
							})).then(price => {
								return PaymentDataDialog.show(neverNull(this._customer), neverNull(this._accountingInfo), price).then(success => {
									if (success) {
										if (this._isPayButtonVisible()) {
											return this._showPayDialog(this._amountOwed())
										}
									}
								})
							})
						}
					},
					// iOS app doesn't work with PayPal button or 3dsecure redirects
					() => !isIOSApp() && logins.getUserController().isPremiumAccount()),
				icon: () => Icons.Edit
			}
			const invoiceVatId = (this._accountingInfo) ? this._accountingInfo.invoiceVatIdNo : lang.get("loading_msg")
			const invoiceVatNumberFieldAttrs = {
				label: "invoiceVatIdNo_label",
				value: stream(invoiceVatId),
				disabled: true,
			}

			const paymentMethodHelpLabel = () => {
				if (this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.Invoice) {
					return lang.get("paymentProcessingTime_msg")
				}
				return ""
			}

			const paymentMethod = (this._accountingInfo)
				? getPaymentMethodName(getPaymentMethodType(neverNull(this._accountingInfo)))
				+ " "
				+ getPaymentMethodInfoText(neverNull(this._accountingInfo))
				: lang.get("loading_msg")
			const paymentMethodFieldAttrs = {
				label: "paymentMethod_label",
				value: stream(paymentMethod),
				helpLabel: paymentMethodHelpLabel,
				disabled: true,
				injectionsRight: () => [m(ButtonN, changePaymentDataButtonAttrs)],
			}
			return m("#invoicing-settings.fill-absolute.scroll.plr-l", {
				role: "group",
			}, [
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('invoiceData_msg')),
					m(".mr-negative-s", m(ButtonN, changeInvoiceDataButtonAttrs))
				]),
				m(this._invoiceAddressField),
				(this._accountingInfo && this._accountingInfo.invoiceVatIdNo.trim().length > 0)
					? m(TextFieldN, invoiceVatNumberFieldAttrs)
					: null,
				m(TextFieldN, paymentMethodFieldAttrs),
				this._renderPostings(postingExpanded),
			])
		}

		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => {
				this._customer = customer
				return load(CustomerInfoTypeRef, customer.customerInfo)
			})
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				this._updateAccountingInfoData(accountingInfo)

				load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo))
					.then((invoiceInfo) => {
						this._invoiceInfo = invoiceInfo
						m.redraw()
					})
			})
			.then(() => this._loadPostings())
			.then(() => this._loadBookings())
	}

	_renderPostings(postingExpanded: Stream<boolean>): Children {
		if (!this._postings || this._postings.length === 0) {
			return null
		} else {
			const balance = Number.parseFloat(this._postings[0].balance)
			return [
				m(".h4.mt-l", lang.get('currentBalance_label')),
				m(".flex.center-horizontally.center-vertically.col", [
					m("div.h4.pt.pb" + (this._isAmountOwed() ? ".content-accent-fg" : ""),
						formatPrice(balance, true) + (this._accountBalance()
						!== balance ? ` (${formatPrice(this._accountBalance(), true)})` : "")
					),
					this._accountBalance() !== balance
						? m(".small" + (this._accountBalance() < 0 ? ".content-accent-fg" : ""),
						lang.get("unprocessedBookings_msg", {"{amount}": formatPrice(this._outstandingBookingsPrice, true)}))
						: null,
					this._isPayButtonVisible()
						? m(".pb", {style: {width: '200px'}}, m(ButtonN, {
							label: "invoicePay_action",
							type: ButtonType.Login,
							click: () => this._showPayDialog(this._amountOwed())
						}))
						: null,
				]),
				(this._accountingInfo && this._accountingInfo.paymentMethod !== PaymentMethodType.Invoice
					&& (this._isAmountOwed() || (this._invoiceInfo && this._invoiceInfo.paymentErrorInfo)))
					? (
						(this._invoiceInfo && this._invoiceInfo.paymentErrorInfo)
							? m(".small.underline.b", lang.get(getPreconditionFailedPaymentMsg(this._invoiceInfo.paymentErrorInfo.errorCode)))
							: m(".small.underline.b", lang.get("failedDebitAttempt_msg"))
					)
					: null,
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('postings_label')),
					m(ExpanderButtonN, {
						label: "show_action",
						expanded: postingExpanded
					}),
				]),
				m(ExpanderPanelN, {expanded: postingExpanded}, m(TableN, {
					columnHeading: ["type_label", "amount_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
					columnAlignments: [false, true, false],
					showActionButtonColumn: true,
					lines: this._postings.map((posting: CustomerAccountPosting) => {
						return {
							cells: () => [
								{
									main: getPostingTypeText(posting),
									info: [formatDate(posting.valueDate)]
								},
								{
									main: formatPrice(Number(posting.amount), true)
								}
							],
							actionButtonAttrs: posting.type === PostingType.UsageFee
								? {
									label: "download_action",
									icon: () => Icons.Download,
									click: () => {
										showProgressDialog("pleaseWait_msg", worker.downloadInvoice(neverNull(posting.invoiceNumber))).then(pdfInvoice => fileController.open(pdfInvoice))
									}
								}
								: null
						}
					})
				})),
				m(".small", lang.get("invoiceSettingDescription_msg") + " " + lang.get("laterInvoicingInfo_msg")),
			]
		}
	}

	_updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo
		this._invoiceAddressField.setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry))
		m.redraw()
	}

	_accountBalance(): number {
		const balance = this._postings && this._postings.length > 0
			? Number(this._postings[0].balance)
			: 0
		return balance - this._outstandingBookingsPrice
	}

	_amountOwed(): number {
		if (this._postings != null && this._postings.length > 0) {
			let balance = Number(this._postings[0].balance)
			if (balance < 0) {
				return balance
			}
		}
		return 0
	}

	_isAmountOwed(): boolean {
		return this._amountOwed() < 0;
	}

	_loadBookings(): Promise<void> {
		return logins.getUserController().loadCustomer()
		             .then(customer => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		             .then(customerInfo => customerInfo.bookings
			             ? locator.entityClient.loadAll(BookingTypeRef, customerInfo.bookings.items)
			             : [])
		             .then(bookings => {
			             this._lastBooking = bookings[bookings.length - 1]
			             m.redraw()
		             })
	}

	_loadPostings(): Promise<void> {
		return serviceRequest(AccountingService.CustomerAccountService, HttpMethod.GET, null, CustomerAccountReturnTypeRef)
			.then(result => {
				this._postings = result.postings
				this._outstandingBookingsPrice = Number(result.outstandingBookingsPrice)
				m.redraw()
			})
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return Promise.each(updates, update => {
			return this.processUpdate(update)
		}).return()
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const {instanceId} = update
		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			return load(AccountingInfoTypeRef, instanceId)
				.then(accountingInfo => this._updateAccountingInfoData(accountingInfo))
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			return load(CustomerTypeRef, instanceId)
				.then(customer => {
					this._customer = customer
				})
		} else if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
			return load(InvoiceInfoTypeRef, instanceId).then(invoiceInfo => {
				this._invoiceInfo = invoiceInfo
				m.redraw()
			})
		} else {
			return Promise.resolve()
		}
	}


	_isPayButtonVisible(): boolean {
		return this._accountingInfo != null &&
			(this._accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this._accountingInfo.paymentMethod
				=== PaymentMethodType.Paypal)
			&& this._isAmountOwed()
	}

	_showPayDialog(openBalance: number): Promise<void> {
		this._paymentBusy = true
		return _showPayConfirmDialog(openBalance)
			.then(confirmed => {
				if (confirmed) {
					let service = createDebitServicePutData()
					return showProgressDialog("pleaseWait_msg", serviceRequestVoid(SysService.DebitService, HttpMethod.PUT, service)
						.then(() => {
							// accounting is updated async but we know that the balance will be 0 when the payment was successful.
							let mostCurrentPosting = this._postings[0]
							let newPosting = createCustomerAccountPosting({
								valueDate: new Date(),
								amount: String(-Number.parseFloat(mostCurrentPosting.balance)),
								balance: "0",
								type: PostingType.Payment,
							})
							this._postings.unshift(newPosting)
							m.redraw()
						})
						.catch(LockedError, e => "operationStillActive_msg")
						.catch(PreconditionFailedError, error => {
							return getPreconditionFailedPaymentMsg(error.data)
						}).catch(BadGatewayError, error => {
							return "paymentProviderNotAvailableError_msg"
						}).catch(TooManyRequestsError, error => {
							return "tooManyAttempts_msg"
						}))
				}
			})
			.then(errorId => {
				if (errorId) {
					return Dialog.error(errorId)
				}
			})
			.finally(() => this._paymentBusy = false)
	}


}


function _showPayConfirmDialog(price: number): Promise<boolean> {
	return new Promise(resolve => {
		let dialog: Dialog

		const doAction = res => {
			dialog.close()
			resolve(res)
		}

		const actionBarAttrs: DialogHeaderBarAttrs = {
			left: [{label: "cancel_action", click: () => doAction(false), type: ButtonType.Secondary}],
			right: [{label: "invoicePay_action", click: () => doAction(true), type: ButtonType.Primary}],
			middle: () => lang.get("adminPayment_action")
		}

		dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => [
				m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
				m(".plr-l.pb", m("", [
					m(".pt", lang.get("invoicePayConfirm_msg")),
					m(TextFieldN, {label: "price_label", value: stream(formatPrice(-price, true)), disabled: true}),
				]))
			]
		}).setCloseHandler(() => doAction(false)).show()
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
		default:
			return "" // Generic, Dispute, Suspension, SuspensionCancel
	}
}