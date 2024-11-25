import o from "@tutao/otest"
import { PdfWriter } from "../../../../../src/common/api/worker/pdf/PdfWriter.js"
import { createTestEntity } from "../../../TestUtils.js"
import { InvoiceDataGetOutTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { PdfInvoiceGenerator } from "../../../../../src/common/api/worker/invoicegen/PdfInvoiceGenerator.js"
import { object, when } from "testdouble"
import { invoiceItemListMock } from "./invoiceTestUtils.js"
import { PaymentMethod, VatType } from "../../../../../src/common/api/worker/invoicegen/InvoiceUtils.js"

o.spec("PdfInvoiceGenerator", function () {
	let pdfWriter: PdfWriter
	o.beforeEach(function () {
		pdfWriter = new PdfWriter(new TextEncoder(), fetchStub)
	})

	o("pdf generation for japanese invoice addVat 3_items", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "竜宮 礼奈\n荻町, 411,\n〒501-5627 Shirakawa, Ono-Gun, Gifu, Japan",
			country: "JP",
			subTotal: "28.00",
			grandTotal: "28.00",
			vatType: VatType.ADD_VAT,
			vatIdNumber: "JP999999999",
			paymentMethod: PaymentMethod.INVOICE,
			items: invoiceItemListMock(3),
		})

		const gen = new PdfInvoiceGenerator(pdfWriter, invoiceData, "1978197819801981931", "NiiNii")
		const pdf = await gen.generate()
		//fs.writeFileSync("/tmp/tuta_jp_invoice_noVat_3.pdf", pdf, { flag: "w" })
	})

	o("pdf generation for russian invoice vatReverseCharge 4_items", async function () {
		const renderInvoice = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "CompanyRU\n194352, Санкт-Петербург\nСиреневый бульвар, д. 8, корп. 2, лит. А.",
			country: "RU",
			items: invoiceItemListMock(2),
			vatType: "4",
			vat: "0",
			vatRate: "0",
			vatIdNumber: "1111_2222_3333_4444",
		})
		const gen = new PdfInvoiceGenerator(pdfWriter, renderInvoice, "1978197819801981931", "NiiNii")
		const pdf = await gen.generate()
		//fs.writeFileSync("/tmp/tuta_ru_invoice_vatReverse_4.pdf", pdf, { flag: "w" })
	})

	o("pdf rendering with 100 entries", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Marcel Davis",
			country: "DE",
			vatRate: "19",
			vatType: "1",
			vat: "1",
			items: invoiceItemListMock(100),
		})

		const gen = new PdfInvoiceGenerator(pdfWriter, invoiceData, "1978197819801981931", "NiiNii")
		const pdf = await gen.generate()
		//fs.writeFileSync("/tmp/tuta_100_entries.pdf", pdf, { flag: "w" })
	})

	o("pdf rendering with max entries to be put on first page", async function () {
		const renderInvoice = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Peter Lustig",
			country: "DE",
			items: invoiceItemListMock(13),
		})
		const gen = new PdfInvoiceGenerator(pdfWriter, renderInvoice, "1978197819801981931", "NiiNii")
		const pdf = await gen.generate()
		//fs.writeFileSync("/tmp/tuta_max_single_page_test.pdf", pdf, { flag: "w" })
	})
})

async function fetchStub(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	if (globalThis.isBrowser) {
		return fetch("./resources/pdf/" + input.toString())
	} else {
		const [fs, path] = await Promise.all([import("node:fs"), import("node:path")])
		const resourceFile = path.normalize(process.cwd() + "/../resources" + input.toString())
		const response: Response = object()
		when(response.arrayBuffer()).thenResolve(fs.readFileSync(resourceFile))
		return response
	}
}
