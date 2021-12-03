// @flow
import type {SettingsSection, SettingsTableAttrs, SettingsValue} from "./SettingsModel"
import {SettingsTable} from "./SettingsModel"
import type {EntityUpdateData} from "../../api/main/EventController"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import m from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import {formatPrice, getPaymentMethodInfoText, getPaymentMethodName} from "../../subscription/PriceUtils"
import {getPaymentMethodType, PaymentMethodType, PostingType} from "../../api/common/TutanotaConstants"
import {neverNull} from "../../api/common/utils/Utils"
import {lang} from "../../misc/LanguageViewModel"
import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {worker} from "../../api/main/WorkerClient"
import * as PaymentDataDialog from "../../subscription/PaymentDataDialog"
import {isIOSApp} from "../../api/common/Env"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import type {Customer} from "../../api/entities/sys/Customer"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import type {AccountingInfo} from "../../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../../api/entities/sys/AccountingInfo"
import {load, serviceRequest, serviceRequestVoid} from "../../api/main/Entity"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import type {InvoiceInfo} from "../../api/entities/sys/InvoiceInfo"
import {InvoiceInfoTypeRef} from "../../api/entities/sys/InvoiceInfo"
import {formatDate, formatNameAndAddress} from "../../misc/Formatter"
import {HtmlEditor, Mode} from "../../gui/editor/HtmlEditor"
import type {CustomerAccountPosting} from "../../api/entities/accounting/CustomerAccountPosting"
import {createCustomerAccountPosting} from "../../api/entities/accounting/CustomerAccountPosting"
import {AccountingService} from "../../api/entities/accounting/Services"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {CustomerAccountReturnTypeRef} from "../../api/entities/accounting/CustomerAccountReturn"
import {locator} from "../../api/main/MainLocator"
import type {Booking} from "../../api/entities/sys/Booking"
import {BookingTypeRef} from "../../api/entities/sys/Booking"
import {createDebitServicePutData} from "../../api/entities/sys/DebitServicePutData"
import {SysService} from "../../api/entities/sys/Services"
import {ofClass} from "../../api/common/utils/PromiseUtils"
import {BadGatewayError, LockedError, PreconditionFailedError, TooManyRequestsError} from "../../api/common/error/RestError"
import {getPreconditionFailedPaymentMsg} from "../../subscription/SubscriptionUtils"
import {Dialog} from "../../gui/base/Dialog"
import {_showPayConfirmDialog, getPostingTypeText} from "../../subscription/PaymentViewer"
import type {TableAttrs} from "../../gui/base/TableN"
import {ColumnWidth} from "../../gui/base/TableN"
import {fileController} from "../../file/FileController"

export class PaymentSettingsSection implements SettingsSection {
	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	invoiceAddressField: HtmlEditor
	customer: ?Customer
	accountingInfo: AccountingInfo
	invoiceInfo: ?InvoiceInfo
	postings: CustomerAccountPosting[]
	lastBooking: ?Booking
	outstandingBookingsPrice: number
	paymentBusy: boolean

	constructor() {
		this.heading = "Payment"
		this.category = "Payment"
		this.settingsValues = []

		this.invoiceAddressField = new HtmlEditor()
			.setMinHeight(140)
			.showBorders()
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)
			.setEnabled(false)
			.setPlaceholderId("invoiceAddress_label")

		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => {
				this.customer = customer
				return load(CustomerInfoTypeRef, customer.customerInfo)
			})
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				this.updateAccountingInfoData(accountingInfo)

				load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo))
					.then((invoiceInfo) => {
						this.invoiceInfo = invoiceInfo
						m.redraw()
					})
			})
			.then(() => this.loadPostings())
			.then(() => this.loadBookings())
			.finally(() => {
				// this.settingsValues.push(this.createInvoiceAddressFieldSetting())
				this.settingsValues.push(this.createPaymentMethodSetting())
				this.settingsValues.push(this.createAccountBalanceSetting())
				this.settingsValues.push(this.createInvoicePaymentSetting())
			})
	}

	createInvoiceAddressFieldSetting() {

	}

	createPaymentMethodSetting(): SettingsValue<TextFieldAttrs> {

		const paymentMethodHelpLabel = () => {
			if (this.accountingInfo && getPaymentMethodType(this.accountingInfo) === PaymentMethodType.Invoice) {
				return lang.get("paymentProcessingTime_msg")
			}
			return ""
		}
		const changePaymentDataButtonAttrs = {
			label: "paymentMethod_label",
			click: createNotAvailableForFreeClickHandler(true, () => {
					if (this.accountingInfo) {
						let nextPayment = this.postings.length
							? Number(this.postings[0].balance) * -1
							: 0
						showProgressDialog("pleaseWait_msg", worker.bookingFacade.getCurrentPrice().then(priceServiceReturn => {
							return Math.max(nextPayment, Number(neverNull(priceServiceReturn.currentPriceThisPeriod).price), Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price))
						})).then(price => {
							return PaymentDataDialog.show(neverNull(this.customer), neverNull(this.accountingInfo), price).then(success => {
								if (success) {
									if (this.isPayButtonVisible()) {
										return this.showPayDialog(this.amountOwed())
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
		const paymentMethod = (this.accountingInfo)
			? getPaymentMethodName(getPaymentMethodType(neverNull(this.accountingInfo)))
			+ " "
			+ getPaymentMethodInfoText(neverNull(this.accountingInfo))
			: lang.get("loading_msg")

		const settingsAttrs: TextFieldAttrs = {
			label: "paymentMethod_label",
			value: stream(paymentMethod),
			helpLabel: paymentMethodHelpLabel,
			disabled: true,
			injectionsRight: () => [m(ButtonN, changePaymentDataButtonAttrs)],
		}

		return {
			name: "paymentMethod_label",
			component: TextFieldN,
			attrs: settingsAttrs
		}
	}

	createAccountBalanceSetting(): SettingsValue<TextFieldAttrs> {

		const balance = Number.parseFloat(this.postings[0].balance)
		const balanceValue = formatPrice(balance, true) + (this.accountBalance()
		!== balance ? ` (${formatPrice(this.accountBalance(), true)})` : "")
		const balanceHelpLabel = (this.accountBalance() !== balance)
			? lang.get("unprocessedBookings_msg", {"{amount}": formatPrice(this.outstandingBookingsPrice, true)})
			: null

		const settingsAttrs: TextFieldAttrs = {
			label: "currentBalance_label",
			value: stream(balanceValue),
			helpLabel: () => balanceHelpLabel,
			disabled: true
		}

		return {
			name: "currentBalance_label",
			component: TextFieldN,
			attrs: settingsAttrs
		}
	}

	createInvoicePaymentSetting(): SettingsValue<SettingsTableAttrs> {

		const tableAttrs: TableAttrs = {
			columnHeading: ["type_label", "amount_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
			columnAlignments: [false, true, false],
			showActionButtonColumn: true,
			lines: this.postings.map((posting: CustomerAccountPosting) => {
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
					actionButtonAttrs: posting.type === PostingType.UsageFee || posting.type === PostingType.Credit
						? {
							label: "download_action",
							icon: () => Icons.Download,
							click: () => {
								showProgressDialog("pleaseWait_msg", worker
									.customerFacade
									.downloadInvoice(neverNull(posting.invoiceNumber))
								)
									.then(pdfInvoice => fileController.open(pdfInvoice))
							}
						}
						: null
				}
			})
		}

		const SettingsAttrs: SettingsTableAttrs = {
			tableHeading: "postings_label",
			tableAttrs: tableAttrs
		}

		return {
			name: "postings_label",
			component: SettingsTable,
			attrs: SettingsAttrs
		}
	}

	updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this.accountingInfo = accountingInfo
		this.invoiceAddressField.setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry))
		m.redraw()
	}

	loadPostings(): Promise<void> {
		return serviceRequest(AccountingService.CustomerAccountService, HttpMethod.GET, null, CustomerAccountReturnTypeRef)
			.then(result => {
				this.postings = result.postings
				this.outstandingBookingsPrice = Number(result.outstandingBookingsPrice)
				m.redraw()
			})
	}

	loadBookings(): Promise<void> {
		return logins.getUserController().loadCustomer()
		             .then(customer => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		             .then(customerInfo => customerInfo.bookings
			             ? locator.entityClient.loadAll(BookingTypeRef, customerInfo.bookings.items)
			             : [])
		             .then(bookings => {
			             this.lastBooking = bookings[bookings.length - 1]
			             m.redraw()
		             })
	}

	isPayButtonVisible(): boolean {
		return this.accountingInfo != null &&
			(this.accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this.accountingInfo.paymentMethod
				=== PaymentMethodType.Paypal)
			&& this.isAmountOwed()
	}

	amountOwed(): number {
		if (this.postings != null && this.postings.length > 0) {
			let balance = Number(this.postings[0].balance)
			if (balance < 0) {
				return balance
			}
		}
		return 0
	}

	isAmountOwed(): boolean {
		return this.amountOwed() < 0;
	}

	showPayDialog(openBalance: number): Promise<void> {
		this.paymentBusy = true
		return _showPayConfirmDialog(openBalance)
			.then(confirmed => {
				if (confirmed) {
					let service = createDebitServicePutData()
					return showProgressDialog("pleaseWait_msg", serviceRequestVoid(SysService.DebitService, HttpMethod.PUT, service)
						.then(() => {
							// accounting is updated async but we know that the balance will be 0 when the payment was successful.
							let mostCurrentPosting = this.postings[0]
							let newPosting = createCustomerAccountPosting({
								valueDate: new Date(),
								amount: String(-Number.parseFloat(mostCurrentPosting.balance)),
								balance: "0",
								type: PostingType.Payment,
							})
							this.postings.unshift(newPosting)
							m.redraw()
						})
						.catch(ofClass(LockedError, e => "operationStillActive_msg"))
						.catch(ofClass(PreconditionFailedError, error => {
							return getPreconditionFailedPaymentMsg(error.data)
						}))
						.catch(ofClass(BadGatewayError, () => "paymentProviderNotAvailableError_msg"))
						.catch(ofClass(TooManyRequestsError, () => "tooManyAttempts_msg")))
				}
			})
			.then(errorId => {
				if (errorId) {
					return Dialog.error(errorId)
				}
			})
			.finally(() => this.paymentBusy = false)
	}

	accountBalance(): number {
		const balance = this.postings && this.postings.length > 0
			? Number(this.postings[0].balance)
			: 0
		return balance - this.outstandingBookingsPrice
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		return Promise.resolve(undefined);
	}
}