import type {SettingsSection, SettingsTableAttrs, SettingsValue} from "./SettingsModel";
import {SettingsTable} from "./SettingsModel";
import type {EntityUpdateData} from "../../api/main/EventController";
import type {TextFieldAttrs} from "../../gui/base/TextFieldN";
import {TextFieldN} from "../../gui/base/TextFieldN";
import stream from "mithril/stream";
import m from "mithril";
import {ButtonAttrs, ButtonN} from "../../gui/base/ButtonN";
import {formatPrice, getPaymentMethodInfoText, getPaymentMethodName} from "../../subscription/PriceUtils";
import {getPaymentMethodType, PaymentMethodType, PostingType} from "../../api/common/TutanotaConstants";
import {lang, TranslationKey} from "../../misc/LanguageViewModel";
import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs";
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog";
import * as PaymentDataDialog from "../../subscription/PaymentDataDialog";
import {isIOSApp} from "../../api/common/Env";
import {logins} from "../../api/main/LoginController";
import {Icons} from "../../gui/base/icons/Icons";
import type {Customer} from "../../api/entities/sys/Customer";
import {CustomerTypeRef} from "../../api/entities/sys/Customer";
import type {AccountingInfo} from "../../api/entities/sys/AccountingInfo";
import {AccountingInfoTypeRef} from "../../api/entities/sys/AccountingInfo";
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo";
import type {InvoiceInfo} from "../../api/entities/sys/InvoiceInfo";
import {InvoiceInfoTypeRef} from "../../api/entities/sys/InvoiceInfo";
import {formatDate, formatNameAndAddress} from "../../misc/Formatter";
import {HtmlEditor, HtmlEditorMode} from "../../gui/editor/HtmlEditor";
import type {CustomerAccountPosting} from "../../api/entities/accounting/CustomerAccountPosting";
import {createCustomerAccountPosting} from "../../api/entities/accounting/CustomerAccountPosting";
import {locator} from "../../api/main/MainLocator";
import type {Booking} from "../../api/entities/sys/Booking";
import {BookingTypeRef} from "../../api/entities/sys/Booking";
import {createDebitServicePutData} from "../../api/entities/sys/DebitServicePutData";
import {BadGatewayError, LockedError, PreconditionFailedError, TooManyRequestsError} from "../../api/common/error/RestError";
import {getPreconditionFailedPaymentMsg} from "../../subscription/SubscriptionUtils";
import {Dialog} from "../../gui/base/Dialog";
import {_showPayConfirmDialog, getPostingTypeText} from "../../subscription/PaymentViewer";
import type {TableAttrs} from "../../gui/base/TableN";
import {ColumnWidth} from "../../gui/base/TableN";
import {assertNotNull, lazy, neverNull, ofClass} from "@tutao/tutanota-utils";
import type {EntityClient} from "../../api/common/EntityClient";
import type {BookingFacade} from "../../api/worker/facades/BookingFacade";
import type {CustomerFacade} from "../../api/worker/facades/CustomerFacade";
import type {FileController} from "../../file/FileController";
import {DebitService} from "../../api/entities/sys/Services"
import {CustomerAccountService} from "../../api/entities/accounting/Services"

export class PaymentSettingsSection implements SettingsSection {
	heading: string;
	category: string;
	settingsValues: Array<SettingsValue<any>>;
	invoiceAddressField: HtmlEditor;
	customer: Customer | null | undefined;
	accountingInfo: AccountingInfo | null;
	invoiceInfo: InvoiceInfo | null | undefined;
	postings: CustomerAccountPosting[] | null;
	lastBooking: Booking | null | undefined;
	outstandingBookingsPrice: number | null;
	paymentBusy: boolean;
	entityClient: EntityClient;
	bookingFacade: BookingFacade;
	customerFacade: CustomerFacade;
	fileController: FileController;

	constructor(entityClient: EntityClient, bookingFacade: BookingFacade, customerFacade: CustomerFacade, fileController: FileController) {
		this.accountingInfo = null
		this.outstandingBookingsPrice = null
		this.paymentBusy = false
		this.postings = null
		this.heading = "Payment";
		this.category = "Payment";
		this.settingsValues = [];
		this.entityClient = entityClient;
		this.bookingFacade = bookingFacade;
		this.customerFacade = customerFacade;
		this.fileController = fileController;
		this.invoiceAddressField = new HtmlEditor()
			.setMinHeight(140)
			.showBorders()
			.setMode(HtmlEditorMode.HTML)
			.setHtmlMonospace(false)
			.setEnabled(false)
			.setPlaceholderId("invoiceAddress_label")
		this.loadClient().then()

	}

	async loadClient(): Promise<void> {
		const customer = await this.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		this.customer = customer
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		const accountingInfo = await this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
		this.updateAccountingInfoData(accountingInfo)
		const invoiceInfo = this.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo))
		this.invoiceInfo = await invoiceInfo
		m.redraw()
		await this.loadPostings()
		await this.loadBookings()
		this.settingsValues.push(this.createPaymentMethodSetting())
		this.settingsValues.push(this.createAccountBalanceSetting())
		this.settingsValues.push(this.createInvoicePaymentSetting())
	}

	createInvoiceAddressFieldSetting() {
	}

	createPaymentMethodSetting(): SettingsValue<TextFieldAttrs> {
		const paymentMethodHelpLabel = () => {
			if (this.accountingInfo && getPaymentMethodType(this.accountingInfo) === PaymentMethodType.Invoice) {
				return lang.get("paymentProcessingTime_msg");
			}

			return "";
		};

		const changePaymentDataButtonAttrs: ButtonAttrs = {
			label: "paymentMethod_label",
			click: createNotAvailableForFreeClickHandler(true, () => {
					if (this.accountingInfo && this.postings) {
						let nextPayment = this.postings.length ? Number(this.postings[0].balance) * -1 : 0;
						showProgressDialog("pleaseWait_msg", this.bookingFacade.getCurrentPrice().then(priceServiceReturn => {
							return Math.max(nextPayment, Number(neverNull(priceServiceReturn.currentPriceThisPeriod).price), Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price));
						})).then(price => {
							return PaymentDataDialog.show(neverNull(this.customer), neverNull(this.accountingInfo), price).then(success => {
								if (success) {
									if (this.isPayButtonVisible()) {
										return this.showPayDialog(this.amountOwed());
									}
								}
							});
						});
					}
				}, // iOS app doesn't work with PayPal button or 3dsecure redirects
				() => !isIOSApp() && logins.getUserController().isPremiumAccount()),
			icon: () => Icons.Edit
		};
		const paymentMethod = this.accountingInfo ? getPaymentMethodName(getPaymentMethodType(neverNull(this.accountingInfo))) + " " + getPaymentMethodInfoText(neverNull(this.accountingInfo)) : lang.get("loading_msg");
		const settingsAttrs: TextFieldAttrs = {
			label: "paymentMethod_label",
			value: stream(paymentMethod),
			helpLabel: paymentMethodHelpLabel,
			disabled: true,
			injectionsRight: () => [m(ButtonN, changePaymentDataButtonAttrs)]
		};
		return {
			name: "paymentMethod_label",
			component: TextFieldN,
			attrs: settingsAttrs
		};
	}

	createAccountBalanceSetting(): SettingsValue<TextFieldAttrs> {
		const balance = Number.parseFloat(assertNotNull(this.postings)[0].balance)
		const balanceValue = formatPrice(balance, true) + (this.accountBalance() !== balance ? ` (${formatPrice(this.accountBalance(), true)})` : "")
		const balanceHelpLabel = this.accountBalance() !== balance ? lang.get("unprocessedBookings_msg", {
			"{amount}": formatPrice(assertNotNull(this.outstandingBookingsPrice), true)
		}) : null
		const settingsAttrs: TextFieldAttrs = {
			label: "currentBalance_label",
			value: stream(balanceValue),
			helpLabel: () => balanceHelpLabel,
			disabled: true
		};
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
			lines: assertNotNull(this.postings).map((posting: CustomerAccountPosting) => {
				return {
					cells: () => [{
						main: getPostingTypeText(posting),
						info: [formatDate(posting.valueDate)]
					}, {
						main: formatPrice(Number(posting.amount), true)
					}],
					actionButtonAttrs: posting.type === PostingType.UsageFee || posting.type === PostingType.Credit ? {
						label: "download_action",
						icon: () => Icons.Download,
						click: () => {
							showProgressDialog("pleaseWait_msg", this.customerFacade.downloadInvoice(neverNull(posting.invoiceNumber))).then(pdfInvoice => this.fileController.openDataFileInBrowser(pdfInvoice));
						}
					} : null
				};
			})
		};
		const SettingsAttrs: SettingsTableAttrs = {
			tableHeading: "postings_label",
			tableAttrs: tableAttrs
		};
		return {
			name: "postings_label",
			component: SettingsTable,
			attrs: SettingsAttrs
		};
	}

	updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this.accountingInfo = accountingInfo;
		this.invoiceAddressField.setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry));
		m.redraw();
	}

	loadPostings(): Promise<void> {
		return locator.serviceExecutor.get(CustomerAccountService, null).then(result => {
			this.postings = result.postings
			this.outstandingBookingsPrice = Number(result.outstandingBookingsPrice)
			m.redraw()
		})
	}

	loadBookings(): Promise<void> {
		return logins.getUserController().loadCustomer().then(customer => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)).then(customerInfo => customerInfo.bookings ? locator.entityClient.loadAll(BookingTypeRef, customerInfo.bookings.items) : []).then(bookings => {
			this.lastBooking = bookings[bookings.length - 1];
			m.redraw();
		});
	}

	isPayButtonVisible(): boolean {
		return this.accountingInfo != null && (this.accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this.accountingInfo.paymentMethod === PaymentMethodType.Paypal) && this.isAmountOwed();
	}

	amountOwed(): number {
		if (this.postings != null && this.postings.length > 0) {
			let balance = Number(this.postings[0].balance);

			if (balance < 0) {
				return balance;
			}
		}

		return 0;
	}

	isAmountOwed(): boolean {
		return this.amountOwed() < 0;
	}

	showPayDialog(openBalance: number): Promise<void> {
		this.paymentBusy = true;
		return _showPayConfirmDialog(openBalance).then((confirmed: any) => {
			if (confirmed) {
				return showProgressDialog(
					"pleaseWait_msg",
					locator.serviceExecutor.put(DebitService, createDebitServicePutData())
						.then(() => {
					// accounting is updated async but we know that the balance will be 0 when the payment was successful.
					let mostCurrentPosting = assertNotNull(this.postings)[0];
					let newPosting = createCustomerAccountPosting({
						valueDate: new Date(),
						amount: String(-Number.parseFloat(mostCurrentPosting.balance)),
						balance: "0",
						type: PostingType.Payment
					});
					assertNotNull(this.postings).unshift(newPosting);
					m.redraw();
				}).catch(ofClass(LockedError, e => "operationStillActive_msg")).catch(ofClass(PreconditionFailedError, error => {
					return getPreconditionFailedPaymentMsg(error.data);
				})).catch(ofClass(BadGatewayError, () => "paymentProviderNotAvailableError_msg")).catch(ofClass(TooManyRequestsError, () => "tooManyAttempts_msg")));
			}
		}).then((errorId: TranslationKey) => {
			if (errorId) {
				return Dialog.message(errorId)
			}
		}).finally(() => this.paymentBusy = false);
	}

	accountBalance(): number {
		const balance = this.postings && this.postings.length > 0 ? Number(this.postings[0].balance) : 0;
		return balance - assertNotNull(this.outstandingBookingsPrice);
	}

	entityEventReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<unknown> {
		return Promise.resolve(undefined);
	}

}