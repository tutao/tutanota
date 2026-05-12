import XRechnungUBLTemplate from "./XRechnungUBLTemplate.js"
import InvoiceTexts from "./InvoiceTexts.js"
import { InvoiceDataGetOut, InvoiceDataItem } from "@tutao/entities/sys"
import { countryUsesGerman, getInvoiceItemTypeName, InvoiceItemType, InvoiceType, PaymentMethod, VatType } from "./InvoiceUtils"

const DE_POSTAL_CODE_REGEX = new RegExp(/\d{5}/)
const CITY_NAME_REGEX = new RegExp(/\d{5}/)

// https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL4461/
const PaymentMethodTypeCodes: Record<PaymentMethod, NumberString> = Object.freeze({
	[PaymentMethod.INVOICE]: "58",
	[PaymentMethod.CREDIT_CARD]: "54",
	[PaymentMethod.SEPA_UNUSED]: "59",
	[PaymentMethod.PAYPAL]: "48", // no actual code for Paypal, no common recommendation for a good code
	[PaymentMethod.ACCOUNT_BALANCE]: "97",
})

// https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL5305
const enum TaxCategory {
	STANDARD_RATE = "S",
	OUTSIDE_SCOPE_OF_TAX = "O",
	VAT_REVERSE_CHARGE = "AE",
}

/**
 * Class for generating XRechnung invoices.
 * These are electronic invoices conforming to the European standard EN16931 and the German CIUS+Extension XRechnung standard.
 * They are a legal requirement and also improve the billing process for business users.
 * The resulting invoice is an XML file in UBL syntax.
 *
 * This generator is ONLY responsible for processing the data it gets and formatting it in a way that does not change anything about it.
 * If adjustments to the data must be made prior to generation, then these should take place within the RenderInvoice service.
 * XRechnung invoice are only supported for business customers and accepted rather only inside the EU.
 */
export class XRechnungInvoiceGenerator {
	private readonly languageCode: "de" | "en" = "en"

	constructor(
		private readonly invoice: InvoiceDataGetOut,
		private readonly invoiceNumber: string,
		private readonly customerId: string,
		private readonly buyerMailAddress: string,
		private readonly isInEuCountry: boolean,
		private readonly urlEncoder: (html: string) => string,
	) {
		this.languageCode = countryUsesGerman(this.invoice.country)
	}

	/**
	 * Generate the XRechnung xml file
	 */
	generate(): Uint8Array {
		let taxCategory = this.getTaxCategory(this.invoice.vatType as VatType, this.isInEuCountry)
		let stringTemplate =
			`<?xml version="1.0" encoding="UTF-8"?>\n` +
			(this.invoice.invoiceType === InvoiceType.INVOICE ? XRechnungUBLTemplate.RootInvoice : XRechnungUBLTemplate.RootCreditNote)
		stringTemplate = stringTemplate
			.replace("{slotMain}", XRechnungUBLTemplate.Main)
			.replace("{slotInvoiceLines}", this.resolveInvoiceLines(taxCategory))
			.replace("{invoiceNumber}", this.invoiceNumber)
			.replace("{issueDate}", formatDate(this.invoice.date))
			.replace("{slotInvoiceType}", this.resolveInvoiceType())
			.replace("{buyerId}", this.customerId)
			.replace("{slotSeller}", XRechnungUBLTemplate.Seller)
			.replace("{slotBuyer}", this.resolveBuyer())
			.replace("{paymentMeansCode}", PaymentMethodTypeCodes[this.invoice.paymentMethod as PaymentMethod])
			.replace("{slotPaymentTerms}", this.resolvePaymentTerms())
			.replace("{slotAllowanceCharge}", this.resolveAllowanceCharge(taxCategory))
			.replace("{slotTotalTax}", this.resolveTotalTax(taxCategory))
			.replace("{slotDocumentTotals}", this.resolveDocumentsTotal())
			.replaceAll(/^\t\t/gm, "")
		return new TextEncoder().encode(stringTemplate)
	}

	private getTaxCategory(vatType: VatType, isEuCountry: boolean): TaxCategory {
		switch (vatType) {
			case VatType.NO_VAT: {
				return isEuCountry ? TaxCategory.VAT_REVERSE_CHARGE : TaxCategory.OUTSIDE_SCOPE_OF_TAX
			}
			case VatType.ADD_VAT:
				return TaxCategory.STANDARD_RATE
			case VatType.NO_VAT_CHARGE_TUTAO:
				return TaxCategory.VAT_REVERSE_CHARGE
			default:
				throw Error("vat type not supported")
		}
	}

	/**
	 * Resolves the root of the xml depending on invoice type (billing invoice or credit)
	 * @private
	 */
	private resolveInvoiceType(): string {
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			return `<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>`
		}
		return `<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>`
	}

	/**
	 * Resolves placeholders concerning the buyer (customer)
	 * buyerMail - Electronic address of the customer
	 * buyerStreetName - despite its name, also includes the street number
	 * buyerCityName - self-explanatory
	 * buyerPostalZone - despite its name, only refers to the postal code, not any associated city
	 * buyerCountryCode - self-explanatory
	 * buyerName - Legal name / company name of the customer -> The first line of the address field
	 * @private
	 */
	private resolveBuyer(): string {
		const addressParts = this.invoice.address.split("\n")
		return XRechnungUBLTemplate.Buyer.replace("{buyerMail}", this.buyerMailAddress)
			.replace("{buyerStreetName}", this.urlEncoder(addressParts[1] ?? "STREET NAME UNKNOWN"))
			.replace("{buyerCityName}", this.urlEncoder(extractCityName(addressParts[2] ?? "")))
			.replace("{buyerPostalZone}", this.urlEncoder(extractPostalCode(addressParts[2] ?? "")))
			.replace("{buyerCountryCode}", this.urlEncoder(this.invoice.country))
			.replace("{buyerAddressLine}", this.urlEncoder(this.invoice.address.replaceAll("\n", " ")))
			.replace("{slotBuyerVatInfo}", this.resolveBuyerVatInfo())
			.replace("{buyerName}", this.urlEncoder(addressParts[0] ?? "BUYER NAME UNKNOWN"))
	}

	/**
	 * Resolves tax info about the buyer (customer). Only resolved if the buyer has a vatIdNumber.
	 * buyerVatId - Customer's vatIdNumber
	 * @private
	 */
	private resolveBuyerVatInfo(): string {
		if (this.invoice.vatIdNumber != null) {
			return XRechnungUBLTemplate.BuyerVatInfo.replace("{buyerVatId}", this.invoice.vatIdNumber)
		}
		return ""
	}

	/**
	 * Resolves the payment note, i.e. the instructions for the buyer
	 * These are the same texts below the summary table of a PDF invoice
	 * @private
	 */
	private resolvePaymentNote(): string {
		let paymentNote = ""
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			switch (this.invoice.paymentMethod) {
				case PaymentMethod.INVOICE:
					paymentNote += `${InvoiceTexts[this.languageCode].paymentInvoiceDue1} ${InvoiceTexts[this.languageCode].paymentInvoiceDue2} ${
						InvoiceTexts[this.languageCode].paymentInvoiceHolder
					} ${InvoiceTexts[this.languageCode].paymentInvoiceBank} ${InvoiceTexts[this.languageCode].paymentInvoiceIBAN} ${
						InvoiceTexts[this.languageCode].paymentInvoiceBIC
					} ${InvoiceTexts[this.languageCode].paymentInvoiceProvideNumber1} ${this.invoiceNumber} ${
						InvoiceTexts[this.languageCode].paymentInvoiceProvideNumber2
					}`
					break
				case PaymentMethod.CREDIT_CARD:
					paymentNote += `${InvoiceTexts[this.languageCode].paymentCreditCard}`
					break
				case PaymentMethod.PAYPAL:
					paymentNote += `${InvoiceTexts[this.languageCode].paymentPaypal}`
					break
				case PaymentMethod.ACCOUNT_BALANCE:
					paymentNote += `${InvoiceTexts[this.languageCode].paymentAccountBalance}`
					break
			}
			paymentNote += " " + InvoiceTexts[this.languageCode].thankYou
		}
		return paymentNote
	}

	/**
	 * Resolves the payment terms (supplementary note to customer) if the invoice is a billing invoice
	 * @private
	 */
	private resolvePaymentTerms(): string {
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			return "<cac:PaymentTerms><cbc:Note>" + this.resolvePaymentNote() + "</cbc:Note></cac:PaymentTerms>"
		}
		return ""
	}

	/**
	 * Resolves all information about potential discounts
	 * totalDiscount - Inverted sum of all discount invoiceitems
	 * vatType - Standardized VAT category code
	 * vatPercent - Percentage of the vat applied. I.e. 19% -> vatPercent == 19
	 * taxableAmount - Amount that is subject to the tax. Usually this is the entire amount, so the subTotal
	 * vatAmount - The amount of the tax. This is equal to "taxableAmount * vatPercent"
	 * @private
	 */
	private resolveAllowanceCharge(taxCategory: TaxCategory): string {
		if (this.calculateTotalDiscount() !== 0) {
			return XRechnungUBLTemplate.AllowanceCharge.replace("{totalDiscount}", this.calculateTotalDiscount().toFixed(2))
				.replace("{vatType}", taxCategory)
				.replace("{vatPercent}", this.invoice.vatRate)
				.replace("{slotTaxExemptionReason}", this.resolveTaxExemptionReason(taxCategory))
		} else {
			return ""
		}
	}

	/**
	 * Resolves the total tax slot: summarized information of all applied taxes (vat)
	 * vatType - Standardized VAT category code
	 * vatPercent - Percentage of the vat applied. I.e. 19% -> vatPercent == 19
	 * taxableAmount - Amount that is subject to the tax. Usually this is the entire amount, so the subTotal
	 * vatAmount - The amount of the tax. This is equal to "taxableAmount * vatPercent"
	 * @private
	 */
	private resolveTotalTax(taxCategory: TaxCategory): string {
		return XRechnungUBLTemplate.TaxTotal.replace("{vatType}", taxCategory)
			.replace("{vatPercent}", this.invoice.vatRate)
			.replace("{slotTaxExemptionReason}", this.resolveTaxExemptionReason(taxCategory))
			.replace("{taxableAmount}", this.invoice.subTotal)
			.replaceAll("{vatAmount}", this.invoice.vat)
	}

	/**
	 * Resolves the textual reason why taxes are exempt. Only resolved if the vat type is reverse-charge
	 * @private
	 */
	private resolveTaxExemptionReason(taxCategory: TaxCategory): string {
		if (taxCategory === TaxCategory.VAT_REVERSE_CHARGE) {
			return `<cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode>
<cbc:TaxExemptionReason>Steuerschuld des Leistungsempfängers (reverse charge)</cbc:TaxExemptionReason>`
		}
		return ""
	}

	/**
	 * Resolves the document total slot: summarized information of the pricing
	 * sumOfInvoiceLines - The total amount of all invoice items summed up without discounts and without vat (all business prices are net already)
	 * invoiceExclusiveVat - The total amount of the entire invoice without vat: subTotal
	 * invoiceInclusiveVat - The total amount of the entire invoice with vat: grandTotal
	 * amountDueForPayment - The final amount the buyer is billed with: grandTotal
	 * @private
	 */
	private resolveDocumentsTotal(): string {
		return XRechnungUBLTemplate.DocumentTotals.replace(
			"{sumOfInvoiceLines}",
			(parseFloat(this.invoice.subTotal) + this.calculateTotalDiscount()).toFixed(2),
		)
			.replace("{invoiceExclusiveVat}", this.invoice.subTotal)
			.replace("{invoiceInclusiveVat}", this.invoice.grandTotal)
			.replace("{amountDueForPayment}", this.invoice.grandTotal)
			.replace("{totalDiscount}", this.calculateTotalDiscount().toFixed(2))
	}

	/**
	 * Resolves all invoice items (invoiceLines) by iterating over every invoice item and resolving a list for it
	 * @private
	 */
	private resolveInvoiceLines(taxCategory: TaxCategory): string {
		let invoiceLines = ""
		let itemIndex = 1
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			for (const invoiceItem of this.invoice.items) {
				invoiceLines += this.resolveInvoiceLine(invoiceItem, taxCategory, itemIndex++)
			}
		} else {
			for (const invoiceItem of this.invoice.items) {
				invoiceLines += this.resolveCreditNoteLine(invoiceItem, taxCategory, itemIndex++)
			}
		}
		return invoiceLines
	}

	/**
	 * Resolves a singular invoice item (invoiceLine): information about one row in an invoice table
	 * invoiceLineQuantity - The amount (quantity) of the item in the invoice line, so the invoiceItem's amount
	 * invoiceLineTotal - The total price of the invoice line. This is equal to "itemPrice * quantity" == totalPrice
	 * invoiceLineStartDate - self-explanatory
	 * invoiceLineEndDate - self-explanatory
	 * invoiceLineItemName - self-explanatory
	 * invoiceLineItemVatType - Standardized Vat category code for this item. Equal to the vat type of the entire invoice
	 * invoiceLineItemVatPercent - Percentage of vat applied to this item. Equal to the vat percentage of the entire invoice
	 * invoiceLineItemPrice - Price of the singular item: singlePrice
	 * @param invoiceItem
	 * @private
	 */
	private resolveInvoiceLine(invoiceItem: InvoiceDataItem, taxCategory: TaxCategory, itemIndex: number): string {
		// If the invoice has a negative price it is some form of credit or discount.
		if (parseFloat(invoiceItem.totalPrice) > 0) {
			return XRechnungUBLTemplate.InvoiceLine.replace("{invoiceLineId}", itemIndex.toString())
				.replace("{invoiceLineQuantity}", invoiceItem.amount)
				.replace("{invoiceLineTotal}", invoiceItem.totalPrice)
				.replace("{invoiceLineStartDate}", formatDate(invoiceItem.startDate))
				.replace("{invoiceLineEndDate}", formatDate(invoiceItem.endDate))
				.replace("{invoiceLineItemName}", getInvoiceItemTypeName(invoiceItem.itemType, this.languageCode))
				.replace("{invoiceLineItemVatType}", taxCategory)
				.replace("{invoiceLineItemVatPercent}", this.invoice.vatRate)
				.replace("{invoiceLineItemPrice}", getInvoiceItemPrice(invoiceItem))
		} else {
			return ""
		}
	}

	/**
	 * Same as resolveInvoiceLine but for CreditNotes
	 * @param invoiceItem
	 * @private
	 */
	private resolveCreditNoteLine(invoiceItem: InvoiceDataItem, taxCategory: TaxCategory, itemIndex: number): string {
		return XRechnungUBLTemplate.CreditNoteLine.replace("{invoiceLineId}", itemIndex.toString())
			.replace("{invoiceLineQuantity}", invoiceItem.amount)
			.replace("{invoiceLineTotal}", invoiceItem.totalPrice)
			.replace("{invoiceLineItemName}", getInvoiceItemTypeName(invoiceItem.itemType, this.languageCode))
			.replace("{invoiceLineItemVatType}", taxCategory)
			.replace("{invoiceLineItemVatPercent}", this.invoice.vatRate)
			.replace("{invoiceLineItemPrice}", getInvoiceItemPrice(invoiceItem))
	}

	/**
	 * Calculates the total discount applied to the entire invoice. The discount is a positive number that is to be subtracted from the invoice total
	 * The discount is calculated by iterating over every invoiceItem that is of type "discount" and adding it up.
	 * @private
	 */
	private calculateTotalDiscount(): number {
		const sum = this.invoice.items
			.filter((item) => item.itemType === InvoiceItemType.Discount)
			.map((item) => parseFloat(item.totalPrice))
			.reduce((prev, current) => prev + current, 0)
		return -sum
	}
}

/**
 * Formats a date to be of the pattern "yyyy-mm-dd"
 * @param date
 */
function formatDate(date: Date | null): string {
	if (date != null) {
		return date.toISOString().split("T")[0]
	}
	return "No date given."
}

/**
 * Returns the price of an invoice item.
 * This is singlePrice if the amount of item is 1 or totalPrice if not.
 * @param invoiceItem
 */
function getInvoiceItemPrice(invoiceItem: InvoiceDataItem): string {
	if (invoiceItem.singlePrice != null) {
		return invoiceItem.singlePrice
	}
	return invoiceItem.totalPrice
}

/**
 * Naively tries to extract a German postal code.
 * If this extraction fails, returns a string notifying the user to consult their full address line
 * @param addressLine
 */
export function extractPostalCode(addressLine: string): string {
	const match = addressLine.match(DE_POSTAL_CODE_REGEX)
	if (match && match[0]) {
		return match[0].trim()
	}
	return "Could not extract postal code. Please refer to full address line."
}

/**
 * Naively tries to extract the city name from the third line.
 * If this extraction fails, then we accept that the city field of the customer is filled incorrectly and must be manually changed by them
 * @param addressLine
 */
export function extractCityName(addressLine: string): string {
	const cityName = addressLine.replace(CITY_NAME_REGEX, "").replace(",", "").trim()
	if (cityName === "") {
		return "Could not extract city name. Please refer to full address line."
	}
	return cityName
}
