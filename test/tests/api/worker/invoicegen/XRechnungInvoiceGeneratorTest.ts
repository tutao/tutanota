import o from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils.js"
import {
	extractCityName,
	extractPostalCode,
	XRechnungInvoiceGenerator,
} from "../../../../../src/applications/common/api/worker/invoicegen/XRechnungInvoiceGenerator.js"

import { InvoiceItemType, InvoiceType, PaymentMethod, VatType } from "../../../../../src/applications/common/api/worker/invoicegen/InvoiceUtils.js"

import { InvoiceDataGetOutTypeRef, InvoiceDataItemTypeRef } from "@tutao/entities/sys"
import { urlEncodeHtmlTags } from "../../../../../src/platform-kit/utils"

o.spec("XRechnungInvoiceGenerator", function () {
	function checkResult(generated: Uint8Array<ArrayBufferLike>, expected: string) {
		let normalizedGeneratedText = new TextDecoder().decode(generated).replaceAll("\r", "").replaceAll("\n", "").replaceAll("\t", "")
		let normalizedExpectedText = expected.replaceAll("\r", "").replaceAll("\n", "").replaceAll("\t", "")
		// fs.writeFileSync("/tmp/gen.xml", normalizedGeneratedText, { flag: "w" })
		// fs.writeFileSync("/tmp/exp.xml", normalizedExpectedText, { flag: "w" })
		o(normalizedGeneratedText).equals(normalizedExpectedText)
	}

	/**
	 * Countries outside the EU will rather not use/accept this standard, but we still verify that we create a valid xRechnung format
	 */
	o("japan invoice 2_items", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "竜宮 礼奈\n荻町, 411,\n〒501-5627 Shirakawa, Ono-Gun, Gifu, Japan",
			country: "JP",
			subTotal: "20.00",
			grandTotal: "20.00",
			vatType: VatType.NO_VAT,
			paymentMethod: PaymentMethod.INVOICE,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: `1`,
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "10.00",
					totalPrice: "10.00",
					itemType: "25",
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: `1`,
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "10.00",
					totalPrice: "10.00",
					itemType: "25",
				}),
			],
		})
		const generated = new XRechnungInvoiceGenerator(
			invoiceData,
			"1978197819801981931",
			"MyCustomerId",
			"test@tutao.de",
			false,
			urlEncodeHtmlTags,
		).generate()
		const expected = `<?xml version="1.0" encoding="UTF-8"?><ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID><cbc:ID>1978197819801981931</cbc:ID><cbc:IssueDate>1970-01-01</cbc:IssueDate><cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>MyCustomerId</cbc:BuyerReference><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="EM">invoice@tutao.de</cbc:EndpointID><cac:PartyName><cbc:Name>Tutao GmbH</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>Deisterstraße 17a</cbc:StreetName><cbc:CityName>Hannover</cbc:CityName><cbc:PostalZone>30449</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE280903265</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName><cbc:CompanyID>HRB 208014</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Name>Tutao GmbH</cbc:Name><cbc:Telephone>+49 511202801-0</cbc:Telephone><cbc:ElectronicMail>invoice@tutao.de</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="EM">test@tutao.de</cbc:EndpointID><cac:PostalAddress><cbc:StreetName>荻町, 411,</cbc:StreetName><cbc:CityName>〒501-5627 Shirakawa Ono-Gun, Gifu, Japan</cbc:CityName><cbc:PostalZone>Could not extract postal code. Please refer to full address line.</cbc:PostalZone><cac:AddressLine><cbc:Line>竜宮 礼奈 荻町, 411, 〒501-5627 Shirakawa, Ono-Gun, Gifu, Japan</cbc:Line></cac:AddressLine><cac:Country><cbc:IdentificationCode>JP</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyLegalEntity><cbc:RegistrationName>竜宮 礼奈</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty><cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>DE67250800200138040001</cbc:ID><cbc:Name>Tutao GmbH</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>DRESDEFF250</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans><cac:PaymentTerms><cbc:Note>The payment is due 7 days after the invoice date without any deduction. Please transfer the grand total with reference to the invoice number to our account: Account holder: Tutao GmbH Bank: Commerzbank Hannover IBAN: DE67 2508 0020 0138 0400 01 BIC: DRESDEFF250 Please name only the invoice number 1978197819801981931 in the payment as reference. Thank you very much!</cbc:Note></cac:PaymentTerms><cac:TaxTotal><cbc:TaxAmount currencyID="EUR">0</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">20.00</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">0</cbc:TaxAmount><cac:TaxCategory><cbc:ID>O</cbc:ID><cbc:Percent>0</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">20.00</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">20.00</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">20.00</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="EUR">0.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="EUR">20.00</cbc:PayableAmount></cac:LegalMonetaryTotal><cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">10.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Unlimited Accounts</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>O</cbc:ID><cbc:Percent>0</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine><cac:InvoiceLine><cbc:ID>2</cbc:ID><cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">10.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Unlimited Accounts</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>O</cbc:ID><cbc:Percent>0</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine></ubl:Invoice>`
		checkResult(generated, expected)
	})

	o("german paypal 3_items", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Bernd Brot\nNeuschauerberg 56\n91488 Emskirchen",
			country: "DE",
			subTotal: "60.00",
			grandTotal: "71.40",
			vatRate: "19",
			vat: "11.40",
			vatIdNumber: null,
			vatType: VatType.ADD_VAT,
			paymentMethod: PaymentMethod.PAYPAL,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "4",
					startDate: new Date("11.11.1999"),
					endDate: new Date("12.31.2000"),
					singlePrice: "10.00",
					totalPrice: "40.00",
					itemType: "21",
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "2",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "5.00",
					totalPrice: "10.00",
					itemType: "9",
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "10.00",
					totalPrice: "10.00",
					itemType: "12",
				}),
			],
		})
		const generated = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de", true, urlEncodeHtmlTags).generate()
		const expected = `<?xml version="1.0" encoding="UTF-8"?><ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID><cbc:ID>1978197819801981931</cbc:ID><cbc:IssueDate>1970-01-01</cbc:IssueDate><cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>MyCustomerId</cbc:BuyerReference><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="EM">invoice@tutao.de</cbc:EndpointID><cac:PartyName><cbc:Name>Tutao GmbH</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>Deisterstraße 17a</cbc:StreetName><cbc:CityName>Hannover</cbc:CityName><cbc:PostalZone>30449</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE280903265</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName><cbc:CompanyID>HRB 208014</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Name>Tutao GmbH</cbc:Name><cbc:Telephone>+49 511202801-0</cbc:Telephone><cbc:ElectronicMail>invoice@tutao.de</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="EM">test@tutao.de</cbc:EndpointID><cac:PostalAddress><cbc:StreetName>Neuschauerberg 56</cbc:StreetName><cbc:CityName>Emskirchen</cbc:CityName><cbc:PostalZone>91488</cbc:PostalZone><cac:AddressLine><cbc:Line>Bernd Brot Neuschauerberg 56 91488 Emskirchen</cbc:Line></cac:AddressLine><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyLegalEntity><cbc:RegistrationName>Bernd Brot</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty><cac:PaymentMeans><cbc:PaymentMeansCode>48</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>DE67250800200138040001</cbc:ID><cbc:Name>Tutao GmbH</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>DRESDEFF250</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans><cac:PaymentTerms><cbc:Note>Der Rechnungsbetrag wird von Ihrem PayPal-Account abgebucht. Vielen Dank!</cbc:Note></cac:PaymentTerms><cac:TaxTotal><cbc:TaxAmount currencyID="EUR">11.40</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">60.00</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">11.40</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">60.00</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">60.00</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">71.40</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="EUR">0.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="EUR">71.40</cbc:PayableAmount></cac:LegalMonetaryTotal><cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:InvoicedQuantity unitCode="C62">4</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">40.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1999-11-10</cbc:StartDate><cbc:EndDate>2000-12-30</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Revolutionary Accounts</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine><cac:InvoiceLine><cbc:ID>2</cbc:ID><cbc:InvoicedQuantity unitCode="C62">2</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">10.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Whitelabel-Funktion pro Benutzer</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">5.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine><cac:InvoiceLine><cbc:ID>3</cbc:ID><cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">10.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Lokale Admin-Gruppe</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine></ubl:Invoice>`
		checkResult(generated, expected)
	})

	o("france reverse charge creditCard addVat 1_items + xml escaping", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Company France & Partner\nRue de la Chanson 4\nParis 194352", // the & must become escaped here
			country: "FR",
			subTotal: "30.00",
			grandTotal: "30.00",
			vatType: VatType.NO_VAT,
			vatRate: "0",
			vat: "0",
			vatIdNumber: "FR1234567891",
			paymentMethod: PaymentMethod.CREDIT_CARD,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "3",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "10.00",
					totalPrice: "30.00",
					itemType: "12",
				}),
			],
		})
		const generated = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de", true, urlEncodeHtmlTags).generate()
		const expected = `<?xml version="1.0" encoding="UTF-8"?><ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID><cbc:ID>1978197819801981931</cbc:ID><cbc:IssueDate>1970-01-01</cbc:IssueDate><cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>MyCustomerId</cbc:BuyerReference><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="EM">invoice@tutao.de</cbc:EndpointID><cac:PartyName><cbc:Name>Tutao GmbH</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>Deisterstraße 17a</cbc:StreetName><cbc:CityName>Hannover</cbc:CityName><cbc:PostalZone>30449</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE280903265</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName><cbc:CompanyID>HRB 208014</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Name>Tutao GmbH</cbc:Name><cbc:Telephone>+49 511202801-0</cbc:Telephone><cbc:ElectronicMail>invoice@tutao.de</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="EM">test@tutao.de</cbc:EndpointID><cac:PostalAddress><cbc:StreetName>Rue de la Chanson 4</cbc:StreetName><cbc:CityName>Paris 2</cbc:CityName><cbc:PostalZone>19435</cbc:PostalZone><cac:AddressLine><cbc:Line>Company France &amp; Partner Rue de la Chanson 4 Paris 194352</cbc:Line></cac:AddressLine><cac:Country><cbc:IdentificationCode>FR</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>FR1234567891</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Company France &amp; Partner</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty><cac:PaymentMeans><cbc:PaymentMeansCode>54</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>DE67250800200138040001</cbc:ID><cbc:Name>Tutao GmbH</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>DRESDEFF250</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans><cac:PaymentTerms><cbc:Note>The grand total will be debited from your credit card. Thank you very much!</cbc:Note></cac:PaymentTerms><cac:TaxTotal><cbc:TaxAmount currencyID="EUR">0</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">30.00</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">0</cbc:TaxAmount><cac:TaxCategory><cbc:ID>AE</cbc:ID><cbc:Percent>0</cbc:Percent><cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>Steuerschuld des Leistungsempfängers (reverse charge)</cbc:TaxExemptionReason><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">30.00</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">30.00</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">30.00</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="EUR">0.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="EUR">30.00</cbc:PayableAmount></cac:LegalMonetaryTotal><cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:InvoicedQuantity unitCode="C62">3</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">30.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Local admin group</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>AE</cbc:ID><cbc:Percent>0</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine></ubl:Invoice>`

		checkResult(generated, expected)
	})

	o("germany credit note account balance", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Malte Kieselstein\nLudwigstraße 6\nHanau-Steinheim",
			invoiceType: InvoiceType.CREDIT,
			country: "DE",
			subTotal: "14.40",
			grandTotal: "17.14",
			vatType: VatType.ADD_VAT,
			vatRate: "19",
			vat: "2.74",
			vatIdNumber: null,
			paymentMethod: PaymentMethod.ACCOUNT_BALANCE,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "14.40",
					totalPrice: "14.40",
					itemType: InvoiceItemType.Credit,
				}),
			],
		})
		const generated = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de", true, urlEncodeHtmlTags).generate()
		const expected = `<?xml version="1.0" encoding="UTF-8"?><ubl:CreditNote xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID><cbc:ID>1978197819801981931</cbc:ID><cbc:IssueDate>1970-01-01</cbc:IssueDate><cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>MyCustomerId</cbc:BuyerReference><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="EM">invoice@tutao.de</cbc:EndpointID><cac:PartyName><cbc:Name>Tutao GmbH</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>Deisterstraße 17a</cbc:StreetName><cbc:CityName>Hannover</cbc:CityName><cbc:PostalZone>30449</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE280903265</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName><cbc:CompanyID>HRB 208014</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Name>Tutao GmbH</cbc:Name><cbc:Telephone>+49 511202801-0</cbc:Telephone><cbc:ElectronicMail>invoice@tutao.de</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="EM">test@tutao.de</cbc:EndpointID><cac:PostalAddress><cbc:StreetName>Ludwigstraße 6</cbc:StreetName><cbc:CityName>Hanau-Steinheim</cbc:CityName><cbc:PostalZone>Could not extract postal code. Please refer to full address line.</cbc:PostalZone><cac:AddressLine><cbc:Line>Malte Kieselstein Ludwigstraße 6 Hanau-Steinheim</cbc:Line></cac:AddressLine><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyLegalEntity><cbc:RegistrationName>Malte Kieselstein</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty><cac:PaymentMeans><cbc:PaymentMeansCode>97</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>DE67250800200138040001</cbc:ID><cbc:Name>Tutao GmbH</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>DRESDEFF250</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans><cac:TaxTotal><cbc:TaxAmount currencyID="EUR">2.74</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">14.40</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">2.74</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">14.40</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">14.40</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">17.14</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="EUR">0.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="EUR">17.14</cbc:PayableAmount></cac:LegalMonetaryTotal><cac:CreditNoteLine><cbc:ID>1</cbc:ID><cbc:CreditedQuantity unitCode="C62">1</cbc:CreditedQuantity><cbc:LineExtensionAmount currencyID="EUR">14.40</cbc:LineExtensionAmount><cac:Item><cbc:Name>Gutschrift für Tuta Nutzungsgebühren</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">14.40</cbc:PriceAmount></cac:Price></cac:CreditNoteLine></ubl:CreditNote>`
		checkResult(generated, expected)
	})

	o("france no vatIdNumber discount", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Company France\nRue de la Chanson 4\nParis 194352",
			country: "FR",
			subTotal: "30.00",
			grandTotal: "36.00",
			vatType: VatType.ADD_VAT,
			vatRate: "20",
			vat: "6.00",
			vatIdNumber: null,
			paymentMethod: PaymentMethod.CREDIT_CARD,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "30.00",
					totalPrice: "30.00",
					itemType: InvoiceItemType.LegendAccount,
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "3",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "10.00",
					totalPrice: "30.00",
					itemType: InvoiceItemType.WhitelabelChild,
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "-30.00",
					totalPrice: "-30.00",
					itemType: InvoiceItemType.Discount,
				}),
			],
		})
		const generated = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de", true, urlEncodeHtmlTags).generate()
		const expected = `<?xml version="1.0" encoding="UTF-8"?><ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID><cbc:ID>1978197819801981931</cbc:ID><cbc:IssueDate>1970-01-01</cbc:IssueDate><cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>MyCustomerId</cbc:BuyerReference><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="EM">invoice@tutao.de</cbc:EndpointID><cac:PartyName><cbc:Name>Tutao GmbH</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>Deisterstraße 17a</cbc:StreetName><cbc:CityName>Hannover</cbc:CityName><cbc:PostalZone>30449</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE280903265</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName><cbc:CompanyID>HRB 208014</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Name>Tutao GmbH</cbc:Name><cbc:Telephone>+49 511202801-0</cbc:Telephone><cbc:ElectronicMail>invoice@tutao.de</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="EM">test@tutao.de</cbc:EndpointID><cac:PostalAddress><cbc:StreetName>Rue de la Chanson 4</cbc:StreetName><cbc:CityName>Paris 2</cbc:CityName><cbc:PostalZone>19435</cbc:PostalZone><cac:AddressLine><cbc:Line>Company France Rue de la Chanson 4 Paris 194352</cbc:Line></cac:AddressLine><cac:Country><cbc:IdentificationCode>FR</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyLegalEntity><cbc:RegistrationName>Company France</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty><cac:PaymentMeans><cbc:PaymentMeansCode>54</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>DE67250800200138040001</cbc:ID><cbc:Name>Tutao GmbH</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>DRESDEFF250</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans><cac:PaymentTerms><cbc:Note>The grand total will be debited from your credit card. Thank you very much!</cbc:Note></cac:PaymentTerms><cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator><cbc:AllowanceChargeReasonCode>95</cbc:AllowanceChargeReasonCode><cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason><cbc:Amount currencyID="EUR">30.00</cbc:Amount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:AllowanceCharge><cac:TaxTotal><cbc:TaxAmount currencyID="EUR">6.00</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">30.00</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">6.00</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">60.00</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">30.00</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">36.00</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="EUR">30.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="EUR">36.00</cbc:PayableAmount></cac:LegalMonetaryTotal><cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">30.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Legend Accounts</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">30.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine><cac:InvoiceLine><cbc:ID>2</cbc:ID><cbc:InvoicedQuantity unitCode="C62">3</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">30.00</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Whitelabel accounts</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount></cac:Price></cac:InvoiceLine></ubl:Invoice>`
		checkResult(generated, expected)
	})

	o("germany multiple discounts", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Firma\nStraße\nplz Stadt",
			invoiceType: InvoiceType.INVOICE,
			country: "DE",
			subTotal: "8.30",
			grandTotal: "9.87",
			vatType: VatType.ADD_VAT,
			vatRate: "19",
			vat: "1.57",
			vatIdNumber: "DE123456789",
			paymentMethod: PaymentMethod.INVOICE,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "20.30",
					totalPrice: "20.30",
					itemType: InvoiceItemType.EssentialAccount,
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "-10.50",
					totalPrice: "-10.50",
					itemType: InvoiceItemType.Discount,
				}),
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "-1.50",
					totalPrice: "-1.50",
					itemType: InvoiceItemType.Discount,
				}),
			],
		})
		const generated = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de", true, urlEncodeHtmlTags).generate()
		const expected = `<?xml version="1.0" encoding="UTF-8"?><ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID><cbc:ID>1978197819801981931</cbc:ID><cbc:IssueDate>1970-01-01</cbc:IssueDate><cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>MyCustomerId</cbc:BuyerReference><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="EM">invoice@tutao.de</cbc:EndpointID><cac:PartyName><cbc:Name>Tutao GmbH</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>Deisterstraße 17a</cbc:StreetName><cbc:CityName>Hannover</cbc:CityName><cbc:PostalZone>30449</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE280903265</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName><cbc:CompanyID>HRB 208014</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Name>Tutao GmbH</cbc:Name><cbc:Telephone>+49 511202801-0</cbc:Telephone><cbc:ElectronicMail>invoice@tutao.de</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="EM">test@tutao.de</cbc:EndpointID><cac:PostalAddress><cbc:StreetName>Straße</cbc:StreetName><cbc:CityName>plz Stadt</cbc:CityName><cbc:PostalZone>Could not extract postal code. Please refer to full address line.</cbc:PostalZone><cac:AddressLine><cbc:Line>Firma Straße plz Stadt</cbc:Line></cac:AddressLine><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>DE123456789</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>Firma</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty><cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>DE67250800200138040001</cbc:ID><cbc:Name>Tutao GmbH</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>DRESDEFF250</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans><cac:PaymentTerms><cbc:Note>Der Rechnungsbetrag ist sieben Tage nach Rechnungsdatum ohne Abzug fällig. Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer auf unser Konto: Inhaber: Tutao GmbH Bank: Commerzbank Hannover IBAN: DE67 2508 0020 0138 0400 01  Bitte geben Sie bei der Zahlung nur die Rechnungsnummer 1978197819801981931 als Referenz an. Vielen Dank!</cbc:Note></cac:PaymentTerms><cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator><cbc:AllowanceChargeReasonCode>95</cbc:AllowanceChargeReasonCode><cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason><cbc:Amount currencyID="EUR">12.00</cbc:Amount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:AllowanceCharge><cac:TaxTotal><cbc:TaxAmount currencyID="EUR">1.57</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">8.30</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">1.57</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">20.30</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">8.30</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">9.87</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="EUR">12.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="EUR">9.87</cbc:PayableAmount></cac:LegalMonetaryTotal><cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">20.30</cbc:LineExtensionAmount><cac:InvoicePeriod><cbc:StartDate>1984-09-08</cbc:StartDate><cbc:EndDate>1984-09-08</cbc:EndDate></cac:InvoicePeriod><cac:Item><cbc:Name>Essential Accounts</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">20.30</cbc:PriceAmount></cac:Price></cac:InvoiceLine></ubl:Invoice>`
		checkResult(generated, expected)
	})

	o("extractPostalCode", function () {
		const line1 = "Berlin, 12107"
		o(extractPostalCode(line1)).equals("12107")

		const line2 = "Neustadt a.d. Aisch 91413"
		o(extractPostalCode(line2)).equals("91413")

		const line3 = "94188 Emskirchen"
		o(extractPostalCode(line3)).equals("94188")

		const line4 = "Holywood BT18 0AA"
		o(extractPostalCode(line4)).equals("Could not extract postal code. Please refer to full address line.")

		const line5 = "〒501-5627 Shirakawa, Ono-Gun, Gifu, Japan"
		o(extractPostalCode(line5)).equals("Could not extract postal code. Please refer to full address line.")
	})

	o("extractCityName", function () {
		const line1 = "Berlin, 12107"
		o(extractCityName(line1).includes("Berlin")).equals(true)

		const line2 = "Neustadt a.d. Aisch 91413"
		o(extractCityName(line2).includes("Neustadt a.d. Aisch")).equals(true)

		const line3 = "94188 Emskirchen"
		o(extractCityName(line3).includes("Emskirchen")).equals(true)

		const line4 = "Holywood BT18 0AA"
		o(extractCityName(line4).includes("Holywood")).equals(true)

		const line5 = "〒501-5627 Shirakawa, Ono-Gun, Gifu, Japan"
		o(extractCityName(line5).includes("Shirakawa")).equals(true)
	})
})
