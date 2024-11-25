import o from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils.js"
import { InvoiceDataGetOutTypeRef, InvoiceDataItemTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { extractCityName, extractPostalCode, XRechnungInvoiceGenerator } from "../../../../../src/common/api/worker/invoicegen/XRechnungInvoiceGenerator.js"

import { InvoiceItemType, InvoiceType, PaymentMethod, VatType } from "../../../../../src/common/api/worker/invoicegen/InvoiceUtils.js"

o.spec("XRechnungInvoiceGenerator", function () {
	o("xrechnung generation for japanese invoice noVat 2_items", async function () {
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
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_jp_invoice_noVat_2.xml", xml, { flag: "w" })
	})

	o("xrechnung generation for german paypal addVat 3_items", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Bernd Brot\nNeuschauerberg 56\n91488 Emskirchen",
			country: "DE",
			subTotal: "60.00",
			grandTotal: "71.40",
			vatRate: "19",
			vat: "11.40",
			vatIdNumber: "DE12345678912345678912",
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
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_de_paypal_addVat_3.xml", xml, { flag: "w" })
	})

	o("xrechnung generation for german accountBalance vatIncludedHidden 1_items", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Klappriger Klabautermann\nMariendorfer Hof 971\n12107 Berlin",
			country: "DE",
			subTotal: "36.00",
			grandTotal: "36.00",
			vatRate: "19",
			vat: "5.75",
			vatIdNumber: "DE12345678912345678912",
			vatType: VatType.VAT_INCLUDED_HIDDEN,
			paymentMethod: PaymentMethod.ACCOUNT_BALANCE,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("11.11.1999"),
					endDate: new Date("12.31.2000"),
					singlePrice: "36.00",
					totalPrice: "36.00",
					itemType: "21",
				}),
			],
		})
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_de_accountBalance_includedVat_2.xml", xml, { flag: "w" })
	})

	o("xrechnung generation for russia noVatReverse creditCard addVat 1_items", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "CompanyRU\n194352, Санкт-Петербург\nСиреневый бульвар, д. 8, корп. 2, лит. А.",
			country: "RU",
			subTotal: "30.00",
			grandTotal: "30.00",
			vatType: VatType.NO_VAT_REVERSE_CHARGE,
			vatRate: "0",
			vat: "0",
			vatIdNumber: "RU1234567891",
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
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_ru_creditCard_noVatReverseCharge_3.xml", xml, { flag: "w" })
	})

	o("xrechnung generation for credit note", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Malte Kieselstein\nLudwigstraße 6\nHanau-Steinheim",
			invoiceType: InvoiceType.CREDIT,
			country: "DE",
			subTotal: "14.40",
			grandTotal: "17.14",
			vatType: VatType.ADD_VAT,
			vatRate: "19",
			vat: "2.74",
			vatIdNumber: "DE12345678912345678912",
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
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_credit.xml", xml, { flag: "w" })
	})

	o("xrechnung generation for discount", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "يورك هاوس، شييت ستريت،\n" + "وندسور SL4 1DD، المملكة المتحدة،‎",
			invoiceType: InvoiceType.INVOICE,
			country: "AE",
			subTotal: "30.00",
			grandTotal: "33.00",
			vatType: VatType.ADD_VAT,
			vatRate: "10",
			vat: "3.00",
			vatIdNumber: "AE12345678912345678912",
			paymentMethod: PaymentMethod.ACCOUNT_BALANCE,
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
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_discount.xml", xml, { flag: "w" })
	})

	o("xrechnung generation for multi discount", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Jarl Balgruuf\nHolywood BT18 0AA",
			invoiceType: InvoiceType.INVOICE,
			country: "DE",
			subTotal: "8.30",
			grandTotal: "8.30",
			vatType: VatType.VAT_INCLUDED_SHOWN,
			vatRate: "19",
			vat: "1.27",
			vatIdNumber: "DE12345678912345678912",
			paymentMethod: PaymentMethod.ACCOUNT_BALANCE,
			items: [
				createTestEntity(InvoiceDataItemTypeRef, {
					amount: "1",
					startDate: new Date("09.09.1984"),
					endDate: new Date("09.09.1984"),
					singlePrice: "20.30",
					totalPrice: "20.30",
					itemType: InvoiceItemType.Credit,
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
		const gen = new XRechnungInvoiceGenerator(invoiceData, "1978197819801981931", "MyCustomerId", "test@tutao.de")
		const xml = gen.generate()
		//fs.writeFileSync("/tmp/xtuta_multi_discount.xml", xml, { flag: "w" })
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
