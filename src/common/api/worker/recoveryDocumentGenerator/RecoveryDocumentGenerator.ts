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
		this.doc.addTextCenterAlignAutoScaled(`${this.emailAddress}`, [pxToMm(323), pxToMm(230)], pxToMm(422))

		this.doc.changeFont(PDF_FONTS.MONO_BOLD, 12)
		this.doc.changeTextGrayscale(0)
		const formattedRecoveryCode = this.formateRecoveryCode(this.recoveryCode)
		for (let i = 0; i < formattedRecoveryCode.length; i++) {
			this.doc.addText(`${formattedRecoveryCode[i]}`, [pxToMm(354), pxToMm(301.62 + i * 18)])
		}

		// Bottom Text
		this.doc.changeFont(PDF_FONTS.REGULAR, 10)
		this.doc.addTextCenterAlignAutoScaled("Need help? Contact us at hello@tutao.de", [pxToMm(323), pxToMm(717.62)])

		// top box
		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(90), pxToMm(206)],
			cornerRadiusMM: pxToMm(16),
			widthMM: pxToMm(466),
			heightMM: pxToMm(285),
			fillColor: ON_SURFACE_HIGH,
		})
		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(113.5), pxToMm(277.62)],
			cornerRadiusMM: pxToMm(8),
			widthMM: pxToMm(172),
			heightMM: pxToMm(120),
			fillColor: ON_SURFACE_HIGH,
			borderColor: THEME_PRIMARY,
			borderWidthMM: pxToMm(2),
		})
		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(317.5), pxToMm(277.62)],
			cornerRadiusMM: pxToMm(8),
			widthMM: pxToMm(215),
			heightMM: pxToMm(120),
			fillColor: ON_SURFACE_HIGH,
			borderColor: THEME_PRIMARY,
			borderWidthMM: pxToMm(2),
		})

		// bottom box

		this.doc.addRoundedRectangle({
			topLeftMM: [pxToMm(90), pxToMm(530.62)],
			cornerRadiusMM: pxToMm(16),
			widthMM: pxToMm(466),
			heightMM: pxToMm(147),
			fillColor: ON_SURFACE_HIGH,
		})

		this.doc.changeFont(PDF_FONTS.BOLD, 16)
		this.doc.addTextCenterAlignAutoScaled(`Storage Tips`, [pxToMm(323), pxToMm(554.62)])

		this.doc.changeFont(PDF_FONTS.REGULAR, 12.5)
		this.doc.addText("If you get locked out of your Tuta Account, use this Recovery Code to log in and", [pxToMm(112), pxToMm(421.62)])
		this.doc.addText("recover your data. This is the only way, because Tuta is not able to recover your", [pxToMm(112), pxToMm(439.62)])
		this.doc.addText("account, because it is so safe. Also this text should explain how to use this kit.", [pxToMm(112), pxToMm(457.62)])

		this.doc.addImage(PDF_IMAGES.EDIT_ICON, [pxToMm(114), pxToMm(597.25)], [pxToMm(21.33), pxToMm(21.33)])
		this.doc.addImage(PDF_IMAGES.CLOUD_ICON, [pxToMm(337.96), pxToMm(597.25)], [pxToMm(21.33), pxToMm(21.33)])

		this.doc.changeFont(PDF_FONTS.REGULAR, 11)
		this.doc.addText("Write down or print copy of", [pxToMm(160.58), pxToMm(597.25)])
		this.doc.addText("RC, store it in a safe or where", [pxToMm(160.58), pxToMm(610.25)])
		this.doc.addText("you're important documents", [pxToMm(160.58), pxToMm(623.25)])
		this.doc.addText("are, making this text this long", [pxToMm(160.58), pxToMm(636.25)])

		this.doc.addText("Digital: encrypted password", [pxToMm(383.17), pxToMm(597.25)])
		this.doc.addText("manager or cloud storage, not", [pxToMm(383.17), pxToMm(610.25)])
		this.doc.addText("Tuta Drive because would lock", [pxToMm(383.17), pxToMm(623.25)])
		this.doc.addText("if access to the account is lost", [pxToMm(383.17), pxToMm(636.25)])

		this.doc.addQrSvg(qrCode.svg(), [pxToMm(168), pxToMm(306.12)])
		return await this.doc.create()
	}
}
