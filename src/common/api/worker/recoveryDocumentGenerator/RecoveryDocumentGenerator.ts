import { PDF_FONTS, PDF_IMAGES, PdfDocument } from "../pdf/PdfDocument.js"
import { PdfWriter } from "../pdf/PdfWriter.js"
import QRCode from "qrcode-svg"
import { formatSortableDate } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError"

const ON_SURFACE_HIGH: [number, number, number] = [245 / 255, 238 / 255, 234 / 255]
const THEME_PRIMARY: [number, number, number] = [143 / 255, 74 / 255, 78 / 255]
const BLACK: [number, number, number] = [0, 0, 0]

function pxToMm(px: number): number {
	return px * (210 / 595)
}

export class PdfRecoveryDocumentGenerator {
	private readonly doc: PdfDocument
	private readonly recoveryCode: string
	private readonly emailAddress: string

	constructor(pdfWriter: PdfWriter, recoveryCode: string, emailAddress: string) {
		this.recoveryCode = recoveryCode
		this.emailAddress = emailAddress
		this.doc = new PdfDocument(pdfWriter)
	}
	private formateRecoveryCode(recoveryCode: string): [string, string, string, string] {
		if (recoveryCode.length !== 64) throw new ProgrammingError(`Expected 64 chars, got ${recoveryCode.length}`)
		const blocks = recoveryCode.match(/.{4}/g)!
		return [blocks.slice(0, 4).join(" "), blocks.slice(4, 8).join(" "), blocks.slice(8, 12).join(" "), blocks.slice(12, 16).join(" ")]
	}

	/**
	 * Generate the PDF document
	 */
	async generate(): Promise<Uint8Array> {
		const qrCodePayload = JSON.stringify({
			mailAddress: this.emailAddress,
			recoveryCode: this.recoveryCode,
		})
		const qrCode = new QRCode({
			height: pxToMm(63),
			width: pxToMm(63),
			content: qrCodePayload,
			padding: 0,
			xmlDeclaration: false,
		})
		await this.doc.addPage()
		await this.doc.addAddressField([0, 0], "")
		this.doc.addLineBreak()

		// header (logo) right
		this.doc.addImage(PDF_IMAGES.TUTA_LOGO, [pxToMm(437), pxToMm(73)], [pxToMm(113), pxToMm(40)])

		// header left
		this.doc.changeFont(PDF_FONTS.BOLD, 24)
		this.doc.addText("Recovery Kit", [pxToMm(90), pxToMm(73)])
		this.doc.changeFont(PDF_FONTS.REGULAR, 10)
		this.doc.addText(`created on ${formatSortableDate(new Date())}`, [pxToMm(90), pxToMm(105)])
		this.doc.changeFont(PDF_FONTS.BOLD, 20)
		this.doc.changeTextGrayscale(0)
		this.doc.addTextCenterAlignAutoScaled(`${this.emailAddress}`, [pxToMm(323), pxToMm(181)], pxToMm(422))

		this.doc.changeFont(PDF_FONTS.MONO_BOLD, 12)
		this.doc.changeTextGrayscale(0)
		const formattedRecoveryCode = this.formateRecoveryCode(this.recoveryCode)
		for (let i = 0; i < formattedRecoveryCode.length; i++) {
			this.doc.addText(`${formattedRecoveryCode[i]}`, [pxToMm(354), pxToMm(252 + i * 18)])
		}

		// Bottom Text
		this.doc.changeFont(PDF_FONTS.REGULAR, 10)
		this.doc.addTextCenterAlignAutoScaled("Need help? Contact us at hello@tutao.de", [pxToMm(323), pxToMm(805)])

		// top box
		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(90), pxToMm(157)],
			cornerRadiusMM: pxToMm(16),
			widthMM: pxToMm(466),
			heightMM: pxToMm(366),
			fillColor: ON_SURFACE_HIGH,
		})
		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(113.5), pxToMm(228)],
			cornerRadiusMM: pxToMm(8),
			widthMM: pxToMm(172),
			heightMM: pxToMm(120),
			fillColor: ON_SURFACE_HIGH,
			borderColor: THEME_PRIMARY,
			borderWidthMM: pxToMm(2),
		})
		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(317.5), pxToMm(228)],
			cornerRadiusMM: pxToMm(8),
			widthMM: pxToMm(215),
			heightMM: pxToMm(120),
			fillColor: ON_SURFACE_HIGH,
			borderColor: THEME_PRIMARY,
			borderWidthMM: pxToMm(2),
		})

		// bottom box

		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(90), pxToMm(557)],
			cornerRadiusMM: pxToMm(16),
			widthMM: pxToMm(466),
			heightMM: pxToMm(209),
			fillColor: ON_SURFACE_HIGH,
		})

		this.doc.changeFont(PDF_FONTS.BOLD, 16)
		this.doc.addTextCenterAlignAutoScaled(`Storage Tips`, [pxToMm(323), pxToMm(581)])

		this.doc.changeFont(PDF_FONTS.REGULAR, 12.5)
		this.doc.addText("If you lose access to your Tuta Account, this code can help you recover it.", [pxToMm(112), pxToMm(372)])
		this.doc.addText("To use it, visit https://app.tuta.com (or open the Tuta app on your computer or ", [pxToMm(112), pxToMm(390)])
		this.doc.addText('phone) and click on "Lost account access". Fill out your Email address and', [pxToMm(112), pxToMm(408)])
		this.doc.addText('Recovery code, or press the "QR code" button to scan the QR code and', [pxToMm(112), pxToMm(426)])
		this.doc.addText("automatically fill the fields. You can only use the QR code within the Tuta Apps.", [pxToMm(112), pxToMm(444)])
		this.doc.addText("Other apps will not work. This will allow you to either set a new password, or", [pxToMm(112), pxToMm(462)])
		this.doc.addText("remove a second factor from your Account.", [pxToMm(112), pxToMm(480)])

		this.doc.addImage(PDF_IMAGES.EDIT_ICON, [pxToMm(124), pxToMm(619)], [pxToMm(21.33), pxToMm(21.33)])
		this.doc.addImage(PDF_IMAGES.CLOUD_ICON, [pxToMm(347.96), pxToMm(619)], [pxToMm(21.33), pxToMm(21.33)])

		this.doc.changeFont(PDF_FONTS.REGULAR, 11)
		this.doc.addText("Because Tuta is end-to-end", [pxToMm(160.58), pxToMm(619)])
		this.doc.addText("encrypted, we cannot help", [pxToMm(160.58), pxToMm(632)])
		this.doc.addText("you regain access to your", [pxToMm(160.58), pxToMm(645)])
		this.doc.addText("account if you lose your", [pxToMm(160.58), pxToMm(658)])
		this.doc.addText("Recovery Kit. So make sure to", [pxToMm(160.58), pxToMm(671)])
		this.doc.addText("remember where you keep it.", [pxToMm(160.58), pxToMm(684)])
		this.doc.addText("Printing it out is a good", [pxToMm(160.58), pxToMm(697)])
		this.doc.addText("option if you don't want to", [pxToMm(160.58), pxToMm(710)])
		this.doc.addText("keep it on your computer.", [pxToMm(160.58), pxToMm(723)])

		this.doc.addText("This document contains all the", [pxToMm(383.17), pxToMm(619)])
		this.doc.addText("information needed to log into", [pxToMm(383.17), pxToMm(632)])
		this.doc.addText("your Tuta Account. Make sure", [pxToMm(383.17), pxToMm(645)])
		this.doc.addText("to keep it in a secure location.", [pxToMm(383.17), pxToMm(658)])
		this.doc.addText("We recommend using a", [pxToMm(383.17), pxToMm(671)])
		this.doc.addText("password manager if you want", [pxToMm(383.17), pxToMm(684)])
		this.doc.addText("to keep it electronically.", [pxToMm(383.17), pxToMm(697)])

		this.doc.addQrSvg(qrCode.svg(), [pxToMm(168), pxToMm(257)])
		return await this.doc.create()
	}
}
