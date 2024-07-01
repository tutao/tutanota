import { boldFontWidths, PdfDictValue, PdfObjectRef, PdfStreamEncoding, regularFontWidths } from "./PdfConstants.js"
import { PdfWriter } from "./PdfWriter.js"
import { Deflater } from "./Deflater.js"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"

export enum PDF_FONTS {
	REGULAR = 1,
	BOLD = 2,
	INVISIBLE_CID = 3,
}

export enum PDF_IMAGES {
	TUTA_LOGO = 1,
	ADDRESS = 2,
}

export enum TEXT_RENDERING_MODE {
	NORMAL = 0,
	INVISIBLE = 3,
}

export type TableColumn = { headerName: string; columnWidth: number }

export const MARGIN_TOP = 20
export const MARGIN_LEFT = 25
export const TABLE_VERTICAL_SPACING = 5
const TEXT_VERTICAL_SPACING = 2
const PAPER_HEIGHT = 297
const PAPER_WIDTH = 210
const ORIGIN_POSITION: [x: number, y: number] = [0, 0]
// Transform matrix to set origin point top-left
const TRANSFORM_MATRIX = `1 0 0 -1 0 ${mmToPSPoint(PAPER_HEIGHT)}`
// 1 InvoiceItem = 2 Table rows (first row item info, second row dates)
// Amount of table rows that can fit on the first page
const ROWS_FIRST_PAGE_SINGLE = 4 // 2 InvoiceItems
// Amount of table rows that can fit on the first page if a second is rendered too
const ROWS_FIRST_PAGE_MULTIPLE = 24 // 12 InvoiceItems
// Amount of table rows that can fit on any n-th page that isn't the first
const ROWS_N_PAGE = 50

const ADDRESS_FIELD_WIDTH = 800
const ADDRESS_FIELD_HEIGHT = 320

/**
 * Object which manages the high-level creation of a PDF document by parsing function instructions into PDF streams.
 * Use this object to create PDF documents. For the low-level functionality see "PdfWriter" class
 *
 * Once instantiated, use the public methods starting with "add...()" or "change...()" to describe the document.
 * Generate the PDF by calling the "create()" method any time. Do not utilize the same PdfDocument instance again once a PDF file has been created with it.
 * Private "render...()" methods are only used internally to interact with the low-level PdfWriter
 */
export class PdfDocument {
	private readonly pdfWriter: PdfWriter
	private pageCount: number = 0
	private textStream: string = ""
	private graphicsStream: string = ""
	private currentFont: PDF_FONTS = PDF_FONTS.REGULAR
	private currentFontSize: number = 12
	private pageList: PdfObjectRef[] = []
	private deflater: Deflater

	constructor(pdfWriter: PdfWriter) {
		this.pdfWriter = pdfWriter
		this.pdfWriter.setupDefaultObjects()
		this.deflater = new Deflater()
	}

	/**
	 * Create the document: commit all streams to objects and let the PdfWriter write the file
	 */
	async create(): Promise<Uint8Array> {
		// Write all open streams and add the page tree with all pages of the document to the PDF
		await this.renderText()
		await this.renderGraphics()
		this.pdfWriter.createObject(
			new Map<string, PdfDictValue>([
				["Type", "/Pages"],
				["Parent", { refId: "CATALOG" }],
				["Kids", this.pageList],
				["Count", `${this.pageCount}`],
			]),
			"PAGES",
		)
		return await this.pdfWriter.writePdfFile()
	}

	/**
	 * Closes the current textStream and writes it into an object
	 */
	private async renderText(): Promise<void> {
		const encodedTextStream = await this.deflater.deflate(
			stringToUtf8Uint8Array(`BT q ${TRANSFORM_MATRIX} cm /F${this.currentFont} ${this.currentFontSize} Tf ` + this.textStream + ` Q ET`),
		)
		this.pdfWriter.createStreamObject(new Map(), encodedTextStream, PdfStreamEncoding.FLATE, `TEXT_${this.pageCount}`)
		this.textStream = ""
	}

	/**
	 * Closes the current graphicsStream and writes it into an object
	 */
	private async renderGraphics(): Promise<void> {
		const encodedGraphicsStream = await this.deflater.deflate(stringToUtf8Uint8Array(`q ${TRANSFORM_MATRIX} cm ` + this.graphicsStream + ` Q`))
		this.pdfWriter.createStreamObject(new Map(), encodedGraphicsStream, PdfStreamEncoding.FLATE, `GRAPHICS_${this.pageCount}`)
		this.graphicsStream = ""
	}

	/**
	 * Append a new page to the PDF document
	 */
	async addPage(): Promise<PdfDocument> {
		// When adding a new page, all content streams must be rendered on the previous page. When creating the first page, all streams are still empty
		if (this.pageCount > 0) {
			await this.renderText()
			await this.renderGraphics()
		}
		this.pageCount++

		// Create new page object
		const pageRefId = `PAGE_${this.pageCount}`
		this.pdfWriter.createObject(
			new Map<string, PdfDictValue>([
				["Type", "/Page"],
				["Parent", { refId: "PAGES" }],
				["MediaBox", `[ 0 0 ${mmToPSPoint(PAPER_WIDTH)} ${mmToPSPoint(PAPER_HEIGHT)}]`],
				["Resources", { refId: "RESOURCES" }],
				["Contents", [{ refId: `TEXT_${this.pageCount}` }, { refId: `GRAPHICS_${this.pageCount}` }]],
			]),
			pageRefId,
		)

		// Add new page to page-tree
		this.pageList.push({ refId: pageRefId })
		return this
	}

	/**
	 * Add a text string at the given coordinates in millimeters
	 * The coordinate field is in the fourth quadrant, i.e. the point of origin is top-left
	 * @param text The text to place
	 * @param position Coordinates [x,y] where to place the text, can be omitted to keep the current position
	 * @param byteLength The byteLength of every character in the string. By default, this is 1 byte = 2 nibbles = "XX" e.g. "20" = "SPACE".
	 * Do not change it to more than 1 byte unless you can verify any text printed this way will be displayed correctly on the PDF.
	 */
	addText(text: string, position: [x: number, y: number] = ORIGIN_POSITION, byteLength: number = 1): PdfDocument {
		if (text === "") return this
		// If no position was specified, don't update the text cursor position
		if (position !== ORIGIN_POSITION) {
			this.textStream += `1 0 0 -1 ${mmToPSPoint(position[0])} ${mmToPSPoint(position[1]) + this.currentFontSize} Tm <${toUnicodePoint(
				text,
				byteLength,
			).join("")}> Tj `
		} else {
			this.textStream += `<${toUnicodePoint(text, byteLength).join("")}> Tj `
		}
		return this
	}

	/**
	 *
	 *
	 * Add a text string at the given coordinates in millimeters and align it to the right of its "container"
	 * The container is specified by a width in millimeters.
	 * @param text The text to place
	 * @param position Coordinates [x,y] where to place the text, can be omitted to keep the current position
	 * @param containerWidth The width in millimeters of the "container" in which the text is to be right aligned in
	 */
	addTextRightAlign(text: string, position: [x: number, y: number], containerWidth: number): PdfDocument {
		if (text === "") return this
		const unicodePoints = toUnicodePoint(text)
		this.textStream += `1 0 0 -1 ${
			mmToPSPoint(position[0]) + mmToPSPoint(containerWidth) - getWordLengthInPoints(unicodePoints, this.currentFont, this.currentFontSize)
		} ${mmToPSPoint(position[1]) + this.currentFontSize} Tm <${unicodePoints.join("")}> Tj `
		return this
	}

	/**
	 * Add a linebreak in the text
	 */
	addLineBreak(): PdfDocument {
		this.textStream += "T* "
		return this
	}

	/**
	 * Add an image at the given coordinates in millimeters
	 * The coordinate field is in the fourth quadrant, i.e. the point of origin is top-left
	 * @param image The image to add which is an enum of readily embeddable images
	 * @param position Coordinates [x,y] where to place the image
	 * @param dimensions Dimensions [width, height] of the image. Image will be stretched to fit the given dimensions
	 */
	addImage(image: PDF_IMAGES, position: [x: number, y: number], dimensions: [width: number, height: number]): PdfDocument {
		// Image placement demands two matrix transformations, so it must make its own graphic state to not affect graphic elements which need no transform (drawLine)
		this.graphicsStream += `Q q ${TRANSFORM_MATRIX} cm ${mmToPSPoint(dimensions[0])} 0 0 -${mmToPSPoint(dimensions[1])} ${mmToPSPoint(
			position[0],
		)} ${mmToPSPoint(position[1])} cm /Im${image} Do Q q ${TRANSFORM_MATRIX} cm `
		return this
	}

	/**
	 * Draw black line "fromPos" "toPos"
	 * @param fromPos Starting point of the line [x,y]
	 * @param toPos Ending point of the line [x,y]
	 */
	addDrawnLine(fromPos: [x: number, y: number], toPos: [x: number, y: number]): PdfDocument {
		this.graphicsStream += `${mmToPSPoint(fromPos[0])} ${mmToPSPoint(fromPos[1])} m ${mmToPSPoint(toPos[0])} ${mmToPSPoint(toPos[1])} l s `
		return this
	}

	/**
	 * Change the currently used text font
	 * @param font Font to change to which is an enum of readily embeddable fonts
	 * @param points Font size in PostScript points
	 */
	changeFont(font: PDF_FONTS, points: number): PdfDocument {
		this.textStream += `/F${font} ${points} Tf ${points + TEXT_VERTICAL_SPACING} TL `
		this.currentFont = font
		this.currentFontSize = points
		return this
	}

	/**
	 * Changes the current text cursor position to the specified position
	 * @param position The position to place the cursor at
	 */
	changeTextCursorPosition(position: [x: number, y: number]): PdfDocument {
		this.textStream += `1 0 0 -1 ${mmToPSPoint(position[0])} ${mmToPSPoint(position[1]) + this.currentFontSize} Tm `
		return this
	}

	/**
	 * Change font size of the currently used font
	 * @param points Font size in PostScript points
	 */
	changeFontSize(points: number): PdfDocument {
		this.textStream += `/F${this.currentFont} ${points} Tf ${points + TEXT_VERTICAL_SPACING} TL `
		this.currentFontSize = points
		return this
	}

	/**
	 * Change the grayscale of the current text
	 * @param grayScale Float between 0 and 1 by which the text lightness shall be adjusted. 1 = white, 0 = black
	 */
	changeTextGrayscale(grayScale: number): PdfDocument {
		grayScale = Math.max(Math.min(grayScale, 1), 0)
		this.textStream += `${grayScale} g `
		return this
	}

	/**
	 * Change the rendering mode of the current text. The rendering mode values and their effect are the same as the PDF standard describes
	 * @param renderingMode Rendering mode (number) to set
	 */
	changeTextRenderingMode(renderingMode: TEXT_RENDERING_MODE) {
		this.textStream += `${renderingMode} Tr `
		return this
	}

	/**
	 * Render a table with the input of a two-dimensional array. Produces automatic page breaks.
	 * Returns the table's height on the last page where it is still rendered, allowing that value to be used to continue placing objects after the table
	 * @param position Coordinates [x,y] where to place the table's origin point
	 * @param tableWidth The width of the table
	 * @param columns Array of ColumnObjects, specifying the header name and width of each column in percent of the total tableWidth { headerName: string, columnWidth: number  }
	 * @param data Two-dimensional array of strings, specifying the data for every row : [ //row1 [a,b,c] //row2 [x,y,z]...   ]. The inner arrays (rows) must have the same length as the columns array!
	 */
	async addTable(position: [x: number, y: number], tableWidth: number, columns: TableColumn[], data: ReadonlyArray<ReadonlyArray<string>>): Promise<number> {
		this.addTableHeader(position, tableWidth, columns)
		// If all entries fit on the first page, then have "ITEMS_FIRST_PAGE_SINGLE" amount of entries, else "ROWS_FIRST_PAGE_MULTIPLE"
		const entriesOnFirstPage = data.length > ROWS_FIRST_PAGE_SINGLE ? ROWS_FIRST_PAGE_MULTIPLE : ROWS_FIRST_PAGE_SINGLE
		// Render the first page, save the height of the table
		let tableHeight = this.addTablePage(position, tableWidth, columns, data.slice(0, entriesOnFirstPage))
		let entryCounter = entriesOnFirstPage

		// Keep writing pages of entries until all data is exhausted
		while (entryCounter < data.length) {
			await this.addPage()
			position = [position[0], MARGIN_TOP]
			tableHeight = this.addTablePage(position, tableWidth, columns, data.slice(entryCounter, entryCounter + ROWS_N_PAGE))
			entryCounter += ROWS_N_PAGE
		}

		const lastPageCannotFitRemainingRows = (entryCounter - entriesOnFirstPage) % ROWS_N_PAGE <= ROWS_FIRST_PAGE_MULTIPLE
		const insufficientSpaceBelowTable = entryCounter == ROWS_FIRST_PAGE_MULTIPLE
		if (!lastPageCannotFitRemainingRows || insufficientSpaceBelowTable) {
			await this.addPage()
			tableHeight = MARGIN_TOP
		}

		this.addDrawnLine([position[0], tableHeight], [position[0] + tableWidth, tableHeight])
		return tableHeight
	}

	/**
	 * Render the actual visible table, starting with a header and all subsequent entries inside the "chunk"
	 */
	addTablePage(position: [x: number, y: number], tableWidth: number, columns: TableColumn[], chunk: ReadonlyArray<ReadonlyArray<string>>): number {
		this.addTableHeader(position, tableWidth, columns)
		let previousRowOffset = TABLE_VERTICAL_SPACING
		for (const row of chunk) {
			this.addTableRow([position[0], position[1] + previousRowOffset], columns, row)
			previousRowOffset += TABLE_VERTICAL_SPACING
		}
		return position[1] + previousRowOffset
	}

	/**
	 * Render the table header
	 */
	addTableHeader(position: [x: number, y: number], tableWidth: number, columns: TableColumn[]) {
		this.changeFont(PDF_FONTS.BOLD, 11)
		this.addTableRow(
			position,
			columns,
			columns.flatMap((column) => column.headerName),
		)
		this.addDrawnLine([position[0], position[1] + 5], [position[0] + tableWidth, position[1] + 5])
		this.changeFont(PDF_FONTS.REGULAR, 11)
	}

	/**
	 * Render a table row
	 */
	addTableRow(position: [x: number, y: number], columnInfo: ReadonlyArray<TableColumn>, rowItems: ReadonlyArray<string>) {
		if (rowItems.length !== columnInfo.length) console.error("Amount of items in table row not equal to amount of columns!")
		let previousWidthOffset = 0
		for (let i = 0; i < rowItems.length; i++) {
			if (i >= 2) {
				this.addTextRightAlign(rowItems[i], [position[0] + previousWidthOffset, position[1]], columnInfo[i].columnWidth)
			} else {
				this.addText(rowItems[i], [position[0] + previousWidthOffset, position[1]])
			}
			previousWidthOffset += columnInfo[i].columnWidth
		}
	}

	/**
	 * Renders an address field, allowing the inclusion of any character inside text.
	 * If any multibyte character outside the defined encoding is detected, the text will be written as an image via the canvas API.
	 * The image will then be attached be inserted into the PDF. If the image generation fails (missing canvas support) fallback text will be rendered
	 * @param position Coordinates [x,y] where to place the field's origin point
	 * @param address String containing the address (expected to hold multiple newlines)
	 */
	async addAddressField(position: [x: number, y: number], address: string) {
		const addressParts = address.split("\n")
		let imageBuffer = new ArrayBuffer(0)
		let byteLengthForAddress = 1

		try {
			if (!areStringPartsOneByteLength(addressParts)) {
				const canvas = new OffscreenCanvas(ADDRESS_FIELD_WIDTH, ADDRESS_FIELD_HEIGHT)
				const context = canvas.getContext("2d")
				if (context) {
					// 36px is arbitrarily chosen to align with the 12pt size of the actual PDF text
					context.font = "36px serif"
					context.fillStyle = "white"
					context.fillRect(0, 0, canvas.width, canvas.height)
					context.fillStyle = "black"

					for (let i = 0; i < addressParts.length; i++) {
						context.fillText(addressParts[i], 0, 40 * (i + 1))
					}
					const dataUrl = await canvas.convertToBlob({ type: "image/jpeg" })
					imageBuffer = await dataUrl.arrayBuffer()

					// For the rendered image, we take its dimension divided by 8. This gives a nice resolution for JPEG
					this.addImage(PDF_IMAGES.ADDRESS, position, [ADDRESS_FIELD_WIDTH / 8, ADDRESS_FIELD_HEIGHT / 8])

					// Prepare for rendering the address below the image invisibly
					byteLengthForAddress = 2
					this.changeTextRenderingMode(TEXT_RENDERING_MODE.INVISIBLE)
					this.changeFont(PDF_FONTS.INVISIBLE_CID, 12)
				} else {
					throw new Error("PDF Canvas Error - Could not access OffscreenCanvasContext2D.")
				}
			}
		} catch (err) {
			console.warn(`PDF Error - Cannot render canvas. This is likely because the browser does not support OffscreenCanvas. The error was:\n"${err}"`)
		}

		// Must create image object in any case since otherwise the reference cannot be resolved. We then just fill it with empty data, but never render it
		this.pdfWriter.createStreamObject(
			new Map([
				["Name", "/Im2"],
				["Type", "/XObject"],
				["Subtype", "/Image"],
				["Width", `${ADDRESS_FIELD_WIDTH}`],
				["Height", `${ADDRESS_FIELD_HEIGHT}`],
				["BitsPerComponent", "8"],
				["ColorSpace", "/DeviceRGB"],
			]),
			new Uint8Array(imageBuffer),
			PdfStreamEncoding.DCT,
			"IMG_ADDRESS",
		)

		// Always render the address as text, Either directly or invisibly in case the canvas was called
		for (const addressPart of addressParts) {
			this.addText(addressPart, ORIGIN_POSITION, byteLengthForAddress).addLineBreak()
		}

		// Undo any invisible-configuration in case it was set
		this.changeFont(PDF_FONTS.REGULAR, 12)
		this.changeTextRenderingMode(TEXT_RENDERING_MODE.NORMAL)
	}
}

/**
 * Convert a text string into a NumString array where each character is replaced by its byte unicode point with a length specified by "byteLength"
 */
export function toUnicodePoint(input: string, byteLength: number = 1): string[] {
	if (byteLength === 1) {
		const out: string[] = []
		for (let i = 0; i < input.length; i++) {
			const codePoint = input.codePointAt(i)
			if (codePoint && isCodePointOneByteLength(codePoint)) {
				out.push(codePoint.toString(16))
			} else {
				console.warn(`Attempted to render a character longer than one byte. Character was ${input[i]} with a code of ${codePoint}.`)
			}
		}
		return out
	} else {
		return input.split("").map((c) => c.charCodeAt(0).toString(16).padStart(4, "0"))
	}
}

/**
 * Returns whether a given char's codepoint is above one byte in size, making it not displayable by simple PDF fonts
 * @param codePoint
 */
export function isCodePointOneByteLength(codePoint: number): boolean {
	return codePoint < 256
}

/**
 * Returns whether a given string, split into its parts, includes any characters that are longer than one byte in size
 * @param stringParts
 */
export function areStringPartsOneByteLength(stringParts: string[]): boolean {
	for (const addressPart of stringParts) {
		for (let i = 0; i < addressPart.length; i++) {
			const codePoint = addressPart.codePointAt(i)
			if (codePoint && !isCodePointOneByteLength(codePoint)) {
				return false
			}
		}
	}
	return true
}

/**
 * Calculates the size of a word by considering the width of every glyph in the font
 * @param codePoints Array of unicode points representing every character in the word
 * @param font The font used for the processed word
 * @param fontSize The font size used for the processed word
 */
export function getWordLengthInPoints(codePoints: string[], font: PDF_FONTS, fontSize: number): number {
	const widthsArray = font === PDF_FONTS.REGULAR ? regularFontWidths : boldFontWidths
	let total = 0
	for (let i = 0; i < codePoints.length; i++) {
		let index = parseInt(codePoints[i], 16) - 32
		total += 1 / (1000 / widthsArray[index])
	}
	return total * fontSize
}

/**
 * Convert millimeters to PostScript points
 */
function mmToPSPoint(mm: number) {
	return mm * 2.834645688
}
