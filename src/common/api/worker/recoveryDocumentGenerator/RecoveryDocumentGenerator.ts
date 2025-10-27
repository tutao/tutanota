import { PdfDocument } from "../pdf/PdfDocument.js"
import { PdfWriter } from "../pdf/PdfWriter.js"
import QRCode from "qrcode-svg"

export class PdfRecoveryDocumentGenerator {
	private readonly doc: PdfDocument
	private readonly recoveryCode: string

	constructor(pdfWriter: PdfWriter, recoveryCode: string) {
		this.recoveryCode = recoveryCode
		this.doc = new PdfDocument(pdfWriter)
	}

	/**
	 * Generate the PDF document
	 */
	async generate(): Promise<Uint8Array> {
		const qrCode = new QRCode({
			height: 50,
			width: 50,
			content: this.recoveryCode,
			padding: 0,
			xmlDeclaration: false,
		})
		console.log(qrCode.svg())
		await this.doc.addPage()
		await this.doc.addAddressField([0, 0], "")
		this.doc.addText(this.recoveryCode, [10, 10])
		this.doc.addLineBreak()
		this.doc.addQrSvg(qrCode.svg(), [80, 50])
		return await this.doc.create()
	}
}
