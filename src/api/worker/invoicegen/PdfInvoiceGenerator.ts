import { MARGIN_LEFT, MARGIN_TOP, PDF_FONTS, PDF_IMAGES, PdfDocument, TABLE_VERTICAL_SPACING, TableColumn } from "../pdf/PdfDocument.js"
import InvoiceTexts from "./InvoiceTexts.js"
import { PdfWriter } from "../pdf/PdfWriter.js"
import { InvoiceDataGetOut } from "../../entities/sys/TypeRefs.js"

const enum VatType {
	NO_VAT = "0",
	ADD_VAT = "1",
	VAT_INCLUDED_SHOWN = "2",
	VAT_INCLUDED_HIDDEN = "3",
	NO_VAT_REVERSE_CHARGE = "4",
}

const enum InvoiceType {
	INVOICE = "0",
	CREDIT = "1",
	REFERRAL_CREDIT = "2",
}

const enum PaymentMethod {
	INVOICE = "0",
	CREDIT_CARD = "1",
	SEPA_UNUSED = "2",
	PAYPAL = "3",
	ACCOUNT_BALANCE = "4",
}

const enum InvoiceItemType {
	PREMIUM_USER = "0",
	StarterUser = "1",
	StarterUserPackage = "2",
	StarterUserPackageUpgrade = "3",
	StoragePackage = "4",
	StoragePackageUpgrade = "5",
	EmailAliasPackage = "6",
	EmailAliasPackageUpgrade = "7",
	SharedMailGroup = "8",
	WhitelabelFeature = "9",
	ContactForm_UNUSED = "10",
	WhitelabelChild = "11",
	LocalAdminGroup = "12",
	Discount = "13",
	SharingFeature = "14",
	Credit = "15",
	GiftCard = "16",
	BusinessFeature = "17",
	GiftCardMigration = "18",
	ReferralCredit = "19",
	CancelledReferralCredit = "20",
	RevolutionaryAccount = "21",
	LegendAccount = "22",
	EssentialAccount = "23",
	AdvancedAccount = "24",
	UnlimitedAccount = "25",
}

/**
 * Object generating a PDF invoice document.
 * This document is ONLY responsible for rendering the data it gets and formatting it in a way that does not change anything about it.
 * If adjustments to the data must be made prior to rendering, then these should take place within the RenderInvoice service.
 */
export class PdfInvoiceGenerator {
	private readonly doc: PdfDocument
	private readonly languageCode: "de" | "en" = "en"
	private invoice: InvoiceDataGetOut
	private invoiceNumber: string
	private customerId: string

	constructor(pdfWriter: PdfWriter, invoice: InvoiceDataGetOut, invoiceNumber: string, customerId: string) {
		this.invoice = invoice
		this.invoiceNumber = invoiceNumber
		this.customerId = customerId
		this.languageCode = countryUsesGerman(this.invoice.country)
		this.doc = new PdfDocument(pdfWriter)
	}

	/**
	 * Generate the PDF document
	 */
	async generate(): Promise<Uint8Array> {
		await this.doc.addPage()
		this.doc.addImage(PDF_IMAGES.TUTA_LOGO, [25, MARGIN_TOP + 15.7], [45, 15.7])
		this.renderSideBarInfo()
		await this.renderAddressField()
		this.renderInvoiceInfo()
		await this.renderInvoiceTable()
		this.renderAdditional()
		this.renderLegalDisclaimer()
		return await this.doc.create()
	}

	/**
	 * The sidebar on the document in the top-right corner
	 */
	renderSideBarInfo() {
		this.doc
			.changeFont(PDF_FONTS.BOLD, 11)
			.addText(InvoiceTexts.universal.companyName, [MARGIN_LEFT + 125, MARGIN_TOP])
			.changeFont(PDF_FONTS.REGULAR, 11)
			.addLineBreak()
			.addText(InvoiceTexts.universal.addressStreet)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].addressPostal)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].addressCountry)
			.addLineBreak()
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].tutaPhone)
			.addLineBreak()
			.addText(InvoiceTexts.universal.tutaFax)
			.addLineBreak()
			.addText(InvoiceTexts.universal.tutaEmail)
			.addLineBreak()
			.addText(InvoiceTexts.universal.tutaWebsite)
			.addLineBreak()
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].yourCustomerId)
			.addLineBreak()
			.addText(this.customerId)
			.changeFontSize(12)
			.addText(`${InvoiceTexts[this.languageCode].addressCity}, ${this.formatInvoiceDate(this.invoice.date)}`, [MARGIN_LEFT + 125, MARGIN_TOP + 70])
	}

	/**
	 * The short address field of Tuta and the address field of the customer below the image
	 */
	async renderAddressField() {
		this.doc
			.changeFontSize(9)
			.addText(`${InvoiceTexts.universal.companyName} - ${InvoiceTexts.universal.addressStreet} - ${InvoiceTexts[this.languageCode].addressPostal}`, [
				MARGIN_LEFT,
				MARGIN_TOP + 35,
			])
			.addLineBreak()
			.changeFontSize(11)
			.addLineBreak()
		await this.doc.addAddressField([MARGIN_LEFT, MARGIN_TOP + 82], this.invoice.address)
	}

	/**
	 * The basic invoice info above the invoice table
	 */
	renderInvoiceInfo() {
		this.doc
			.changeFontSize(18)
			.addText(this.getInvoiceTypeName(this.invoice.invoiceType, this.invoice.grandTotal), [MARGIN_LEFT, MARGIN_TOP + 90])
			.changeFont(PDF_FONTS.BOLD, 12)
			.addText(`${InvoiceTexts[this.languageCode].invoiceNumber} ${this.invoiceNumber}`, [MARGIN_LEFT, MARGIN_TOP + 100])
			.changeFont(PDF_FONTS.REGULAR, 11)
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			this.doc.addText(InvoiceTexts[this.languageCode].asAgreedBlock, [MARGIN_LEFT, MARGIN_TOP + 110])
		}
	}

	/**
	 * The table with all invoice items
	 */
	async renderInvoiceTable() {
		// Define headers and column widths
		const columns: TableColumn[] = [
			{ headerName: InvoiceTexts[this.languageCode].quantity, columnWidth: 19.8 },
			{ headerName: InvoiceTexts[this.languageCode].item, columnWidth: 95.7 },
			{ headerName: InvoiceTexts[this.languageCode].singlePrice, columnWidth: 24.75 },
			{ headerName: InvoiceTexts[this.languageCode].totalPrice, columnWidth: 24.75 },
		]
		const tableData: Array<Array<string>> = []

		// Fill table data (two entries at the time) and render it
		for (const invoiceItem of this.invoice.items) {
			// Entry with all invoice info
			tableData.push([
				this.formatAmount(invoiceItem.itemType, invoiceItem.amount),
				this.getInvoiceItemTypeName(invoiceItem.itemType),
				invoiceItem.singlePrice == null ? "" : this.formatInvoiceCurrency(invoiceItem.singlePrice),
				this.formatInvoiceCurrency(invoiceItem.totalPrice),
			])
			// Entry with date range
			tableData.push(["", `${this.formatInvoiceDate(invoiceItem.startDate)} - ${this.formatInvoiceDate(invoiceItem.endDate)}`, "", ""])
		}
		const tableEndPoint = await this.doc.addTable([MARGIN_LEFT, MARGIN_TOP + 120], 165, columns, tableData)

		this.renderTableSummary(tableEndPoint, columns)
		this.doc.changeTextCursorPosition([MARGIN_LEFT, tableEndPoint + 4 * TABLE_VERTICAL_SPACING])
	}

	/**
	 * Summary of totals and applied VAT below the rendered table
	 */
	renderTableSummary(tableEndPoint: number, columns: TableColumn[]) {
		// Line break that's to be removed if no VAT appears in the summary
		let additionalVerticalSpace = 1

		// Sub total
		this.doc.addTableRow([MARGIN_LEFT, tableEndPoint], columns, [
			"",
			"",
			InvoiceTexts[this.languageCode].subTotal,
			this.formatInvoiceCurrency(this.invoice.subTotal),
		])
		// VAT
		if (this.invoice.vatType === VatType.ADD_VAT) {
			// AddedVat
			this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + TABLE_VERTICAL_SPACING], columns, [
				"",
				"",
				`${InvoiceTexts[this.languageCode].addedVat} ${this.invoice.vatRate}${InvoiceTexts[this.languageCode].vatPercent}`,
				this.formatInvoiceCurrency(this.invoice.vat),
			])
		} else if (this.invoice.vatType === VatType.VAT_INCLUDED_SHOWN) {
			// IncludedVat
			this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + TABLE_VERTICAL_SPACING], columns, [
				"",
				"",
				`${InvoiceTexts[this.languageCode].includedVat} ${this.invoice.vatRate}${InvoiceTexts[this.languageCode].vatPercent}`,
				this.formatInvoiceCurrency(this.invoice.vat),
			])
		} else {
			additionalVerticalSpace -= 1
		}
		// Grand total
		this.doc.changeFont(PDF_FONTS.BOLD, 11)
		this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + (additionalVerticalSpace + 1) * TABLE_VERTICAL_SPACING], columns, [
			"",
			"",
			InvoiceTexts[this.languageCode].grandTotal,
			this.formatInvoiceCurrency(this.invoice.grandTotal),
		])
	}

	/**
	 * Additional blocks displayed below the table depending on invoice type, vat type and payment method
	 */
	renderAdditional() {
		this.doc.changeFont(PDF_FONTS.REGULAR, 12)

		// No VAT / VAT not shown in table
		switch (this.invoice.vatType) {
			case VatType.ADD_VAT:
			case VatType.VAT_INCLUDED_SHOWN:
				break
			case VatType.NO_VAT:
			case VatType.NO_VAT_REVERSE_CHARGE:
				if (this.invoice.vatIdNumber != null) {
					this.doc
						.addText(InvoiceTexts[this.languageCode].reverseChargeVatIdNumber1)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].reverseChargeVatIdNumber2)
						.addLineBreak()
						.addText(`${InvoiceTexts[this.languageCode].yourVatId} `)
						.changeFont(PDF_FONTS.BOLD, 11)
						.addText(`${this.invoice.vatIdNumber}`)
				} else {
					this.doc.addText(InvoiceTexts[this.languageCode].netPricesNoVatInGermany)
				}
				break
			case VatType.VAT_INCLUDED_HIDDEN:
				this.doc.addText(InvoiceTexts[this.languageCode].noVatInGermany)
				break
			default:
				throw new Error("Unknown VatType " + this.invoice.vatType)
		}
		this.doc.addLineBreak()
		this.doc.addLineBreak()

		// Payment info
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			switch (this.invoice.paymentMethod) {
				case PaymentMethod.INVOICE:
					this.doc
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceDue1)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceDue2)
						.addLineBreak()
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceHolder)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceBank)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceIBAN)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceBIC)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceProvideNumber1)
						.changeFont(PDF_FONTS.BOLD, 11)
						.addText(` ${this.invoiceNumber} `)
						.changeFont(PDF_FONTS.REGULAR, 11)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceProvideNumber2)
					break
				case PaymentMethod.CREDIT_CARD:
					this.doc.addText(InvoiceTexts[this.languageCode].paymentCreditCard)
					break
				case PaymentMethod.PAYPAL:
					this.doc.addText(InvoiceTexts[this.languageCode].paymentPaypal)
					break
				case PaymentMethod.ACCOUNT_BALANCE:
					this.doc.addText(InvoiceTexts[this.languageCode].paymentAccountBalance)
					break
			}
			this.doc.addLineBreak().addLineBreak().addText(InvoiceTexts[this.languageCode].thankYou)
		}
	}

	/**
	 * The legal disclaimer info at the bottom of the last page
	 */
	renderLegalDisclaimer() {
		this.doc
			.changeFont(PDF_FONTS.REGULAR, 10)
			.addText(InvoiceTexts[this.languageCode].legalNoSigned, [MARGIN_LEFT, MARGIN_TOP + 240])
			.addLineBreak()
			.addLineBreak()
			.changeTextGrayscale(0.5)
			.addText(InvoiceTexts[this.languageCode].legalRepresented, [MARGIN_LEFT, MARGIN_TOP + 250])
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].legalRegistration)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].legalVatIdentification)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].legalBankAccount)
	}

	/**
	 * Get the name of a given InvoiceType
	 */
	getInvoiceTypeName(type: NumberString, amount: NumberString): string {
		switch (type) {
			case InvoiceType.INVOICE:
				return InvoiceTexts[this.languageCode].invoice
			case InvoiceType.CREDIT:
				return InvoiceTexts[this.languageCode].credit
			case InvoiceType.REFERRAL_CREDIT:
				if (parseFloat(amount) >= 0) {
					return InvoiceTexts[this.languageCode].credit
				} else {
					return InvoiceTexts[this.languageCode].cancelCredit
				}
			default:
				throw new Error("Invalid InvoiceType " + type)
		}
	}

	/**
	 * Get the name of a given InvoiceItemType
	 */
	getInvoiceItemTypeName(type: NumberString): string {
		switch (type) {
			case InvoiceItemType.PREMIUM_USER:
				return InvoiceTexts[this.languageCode].premiumUser
			case InvoiceItemType.StarterUser:
				return InvoiceTexts[this.languageCode].starterUser
			case InvoiceItemType.StarterUserPackage:
				return InvoiceTexts[this.languageCode].starterUserPackage
			case InvoiceItemType.StarterUserPackageUpgrade:
				return InvoiceTexts[this.languageCode].starterUserPackageUpgrade
			case InvoiceItemType.StoragePackage:
				return InvoiceTexts[this.languageCode].storagePackage
			case InvoiceItemType.StoragePackageUpgrade:
				return InvoiceTexts[this.languageCode].storagePackageUpgrade
			case InvoiceItemType.EmailAliasPackage:
				return InvoiceTexts[this.languageCode].emailAliasPackage
			case InvoiceItemType.EmailAliasPackageUpgrade:
				return InvoiceTexts[this.languageCode].emailAliasPackageUpgrade
			case InvoiceItemType.SharedMailGroup:
				return InvoiceTexts[this.languageCode].sharedMailGroup
			case InvoiceItemType.WhitelabelFeature:
				return InvoiceTexts[this.languageCode].whitelabelFeature
			case InvoiceItemType.ContactForm_UNUSED:
				return InvoiceTexts[this.languageCode].contactFormUnused
			case InvoiceItemType.WhitelabelChild:
				return InvoiceTexts[this.languageCode].whitelabelChild
			case InvoiceItemType.LocalAdminGroup:
				return InvoiceTexts[this.languageCode].localAdminGroup
			case InvoiceItemType.Discount:
				return InvoiceTexts[this.languageCode].discount
			case InvoiceItemType.SharingFeature:
				return InvoiceTexts[this.languageCode].sharingFeature
			case InvoiceItemType.Credit:
				return InvoiceTexts[this.languageCode].creditType
			case InvoiceItemType.GiftCard:
				return InvoiceTexts[this.languageCode].giftCard
			case InvoiceItemType.BusinessFeature:
				return InvoiceTexts[this.languageCode].businessFeature
			case InvoiceItemType.GiftCardMigration:
				return InvoiceTexts[this.languageCode].giftCardMigration
			case InvoiceItemType.ReferralCredit:
				return InvoiceTexts[this.languageCode].referralCredit
			case InvoiceItemType.CancelledReferralCredit:
				return InvoiceTexts[this.languageCode].cancelledReferralCredit
			case InvoiceItemType.RevolutionaryAccount:
				return InvoiceTexts[this.languageCode].revolutionaryAccount
			case InvoiceItemType.LegendAccount:
				return InvoiceTexts[this.languageCode].legendAccount
			case InvoiceItemType.EssentialAccount:
				return InvoiceTexts[this.languageCode].essentialAccount
			case InvoiceItemType.AdvancedAccount:
				return InvoiceTexts[this.languageCode].advancedAccount
			case InvoiceItemType.UnlimitedAccount:
				return InvoiceTexts[this.languageCode].unlimitedAccount
			default:
				throw new Error("Unknown InvoiceItemType " + type)
		}
	}

	/**
	 * Format the date depending on document language (dd.mm.yyyy) / (dd. Mon yyyy)
	 */
	formatInvoiceDate(date: Date | null): string {
		if (date == null) return ""
		if (this.languageCode === "de") {
			return date.toLocaleDateString("de-DE", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			})
		} else {
			return date.toLocaleDateString("en-UK", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		}
	}

	/**
	 * Format the currency separator (dot, comma) depending on the country
	 */
	formatInvoiceCurrency(price: string | number): string {
		price = `${price} EUR`
		return this.languageCode === "de" ? price.replace(".", ",") : price
	}

	/**
	 * Format the amount of storage into the appropriate byte unit if the item is a legacy storage package. Otherwise, return as is
	 */
	formatAmount(itemType: string, amount: string): string {
		if (itemType === InvoiceItemType.StoragePackage || itemType === InvoiceItemType.StoragePackageUpgrade) {
			const numAmount = Number(amount)
			return numAmount < 1000 ? `${amount} GB` : `${numAmount / 1000} TB`
		} else {
			return amount
		}
	}
}

function countryUsesGerman(country: string): "de" | "en" {
	return country === "DE" || country === "AT" ? "de" : "en"
}
