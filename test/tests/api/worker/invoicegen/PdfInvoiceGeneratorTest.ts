import o from "@tutao/otest"
import { PdfWriter } from "../../../../../src/api/worker/pdf/PdfWriter.js"
import { createTestEntity } from "../../../TestUtils.js"
import { InvoiceDataGetOutTypeRef, InvoiceDataItemTypeRef } from "../../../../../src/api/entities/sys/TypeRefs.js"
import { PdfInvoiceGenerator } from "../../../../../src/api/worker/invoicegen/PdfInvoiceGenerator.js"
import { object, when } from "testdouble"

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

o.spec("PdfInvoiceGenerator", function () {
	const pdfWriter = new PdfWriter(new TextEncoder(), fetchStub)

	o("Gen", async function () {
		const invoiceData = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Altschauerberg 8\n91448 Emskirchen\nDeutschland",
			country: "DE",
			items: dataMock(2),
		})

		const gen = new PdfInvoiceGenerator(pdfWriter, invoiceData, "1978197819801981931", "NiiNii")
		const pdf = await gen.generate()
	})

	o("Entries fit all on a single page but generate a new empty page", async function () {
		const renderInvoice = createTestEntity(InvoiceDataGetOutTypeRef, {
			address: "Altschauerberg 8\n91448 Emskirchen\nDeutschland",
			country: "DE",
			items: dataMock(15),
		})
		const gen = new PdfInvoiceGenerator(pdfWriter, renderInvoice, "1978197819801981931", "NiiNii")
		const pdf = await gen.generate()
	})
})

function dataMock(amount: number) {
	const data: any = []
	for (let i = 0; i < amount; i++) {
		data.push(
			createTestEntity(InvoiceDataItemTypeRef, {
				amount: "1",
				endDate: new Date("09.09.1984"),
				singlePrice: "14.40",
				startDate: new Date("09.09.1984"),
				totalPrice: "14.40",
				itemType: "25",
			}),
		)
	}
	return data
}
