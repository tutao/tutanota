import { stringToUtf8Uint8Array } from "./dist2-chunk.js";
import { Deflater, PdfStreamEncoding, boldFontWidths, regularFontWidths } from "./Deflater-chunk.js";
import { InvoiceItemType, InvoiceTexts_default, InvoiceType, PaymentMethod, VatType, countryUsesGerman, getInvoiceItemTypeName } from "./InvoiceUtils-chunk.js";

//#region src/common/api/worker/pdf/PdfDocument.ts
let PDF_FONTS = function(PDF_FONTS$1) {
	PDF_FONTS$1[PDF_FONTS$1["REGULAR"] = 1] = "REGULAR";
	PDF_FONTS$1[PDF_FONTS$1["BOLD"] = 2] = "BOLD";
	PDF_FONTS$1[PDF_FONTS$1["INVISIBLE_CID"] = 3] = "INVISIBLE_CID";
	return PDF_FONTS$1;
}({});
let PDF_IMAGES = function(PDF_IMAGES$1) {
	PDF_IMAGES$1[PDF_IMAGES$1["TUTA_LOGO"] = 1] = "TUTA_LOGO";
	PDF_IMAGES$1[PDF_IMAGES$1["ADDRESS"] = 2] = "ADDRESS";
	return PDF_IMAGES$1;
}({});
let TEXT_RENDERING_MODE = function(TEXT_RENDERING_MODE$1) {
	TEXT_RENDERING_MODE$1[TEXT_RENDERING_MODE$1["NORMAL"] = 0] = "NORMAL";
	TEXT_RENDERING_MODE$1[TEXT_RENDERING_MODE$1["INVISIBLE"] = 3] = "INVISIBLE";
	return TEXT_RENDERING_MODE$1;
}({});
const MARGIN_TOP = 20;
const MARGIN_LEFT = 25;
const TABLE_VERTICAL_SPACING = 5;
const TEXT_VERTICAL_SPACING = 2;
const PAPER_HEIGHT = 297;
const PAPER_WIDTH = 210;
const ORIGIN_POSITION = [0, 0];
const TRANSFORM_MATRIX = `1 0 0 -1 0 ${mmToPSPoint(PAPER_HEIGHT)}`;
const ROWS_FIRST_PAGE_MULTIPLE = 24;
const ROWS_N_PAGE = 50;
const ADDRESS_FIELD_WIDTH = 800;
const ADDRESS_FIELD_HEIGHT = 320;
var PdfDocument = class {
	pdfWriter;
	deflater;
	pageCount = 0;
	textStream = "";
	graphicsStream = "";
	currentFont = PDF_FONTS.REGULAR;
	currentFontSize = 12;
	pageList = [];
	constructor(pdfWriter) {
		this.pdfWriter = pdfWriter;
		this.pdfWriter.setupDefaultObjects();
		this.deflater = new Deflater();
	}
	/**
	* Create the document: commit all streams to objects and let the PdfWriter write the file
	*/
	async create() {
		await this.renderText();
		await this.renderGraphics();
		this.pdfWriter.createObject(new Map([
			["Type", "/Pages"],
			["Parent", { refId: "CATALOG" }],
			["Kids", this.pageList],
			["Count", `${this.pageCount}`]
		]), "PAGES");
		return await this.pdfWriter.writePdfFile();
	}
	/**
	* Closes the current textStream and writes it into an object
	*/
	async renderText() {
		const encodedTextStream = await this.deflater.deflate(stringToUtf8Uint8Array(`BT q ${TRANSFORM_MATRIX} cm /F${this.currentFont} ${this.currentFontSize} Tf ` + this.textStream + ` Q ET`));
		this.pdfWriter.createStreamObject(new Map(), encodedTextStream, PdfStreamEncoding.FLATE, `TEXT_${this.pageCount}`);
		this.textStream = "";
	}
	/**
	* Closes the current graphicsStream and writes it into an object
	*/
	async renderGraphics() {
		const encodedGraphicsStream = await this.deflater.deflate(stringToUtf8Uint8Array(`q ${TRANSFORM_MATRIX} cm ` + this.graphicsStream + ` Q`));
		this.pdfWriter.createStreamObject(new Map(), encodedGraphicsStream, PdfStreamEncoding.FLATE, `GRAPHICS_${this.pageCount}`);
		this.graphicsStream = "";
	}
	/**
	* Append a new page to the PDF document
	*/
	async addPage() {
		if (this.pageCount > 0) {
			await this.renderText();
			await this.renderGraphics();
		}
		this.pageCount++;
		const pageRefId = `PAGE_${this.pageCount}`;
		this.pdfWriter.createObject(new Map([
			["Type", "/Page"],
			["Parent", { refId: "PAGES" }],
			["MediaBox", `[ 0 0 ${mmToPSPoint(PAPER_WIDTH)} ${mmToPSPoint(PAPER_HEIGHT)}]`],
			["Resources", { refId: "RESOURCES" }],
			["Contents", [{ refId: `TEXT_${this.pageCount}` }, { refId: `GRAPHICS_${this.pageCount}` }]]
		]), pageRefId);
		this.pageList.push({ refId: pageRefId });
		return this;
	}
	/**
	* Add a text string at the given coordinates in millimeters
	* The coordinate field is in the fourth quadrant, i.e. the point of origin is top-left
	* @param text The text to place
	* @param position Coordinates [x,y] where to place the text, can be omitted to keep the current position
	* @param byteLength The byteLength of every character in the string. By default, this is 1 byte = 2 nibbles = "XX" e.g. "20" = "SPACE".
	* Do not change it to more than 1 byte unless you can verify any text printed this way will be displayed correctly on the PDF.
	*/
	addText(text, position = ORIGIN_POSITION, byteLength = 1) {
		if (text === "") return this;
		if (position !== ORIGIN_POSITION) this.textStream += `1 0 0 -1 ${mmToPSPoint(position[0])} ${mmToPSPoint(position[1]) + this.currentFontSize} Tm <${toUnicodePoint(text, byteLength).join("")}> Tj `;
else this.textStream += `<${toUnicodePoint(text, byteLength).join("")}> Tj `;
		return this;
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
	addTextRightAlign(text, position, containerWidth) {
		if (text === "") return this;
		const unicodePoints = toUnicodePoint(text);
		this.textStream += `1 0 0 -1 ${mmToPSPoint(position[0]) + mmToPSPoint(containerWidth) - getWordLengthInPoints(unicodePoints, this.currentFont, this.currentFontSize)} ${mmToPSPoint(position[1]) + this.currentFontSize} Tm <${unicodePoints.join("")}> Tj `;
		return this;
	}
	/**
	* Add a linebreak in the text
	*/
	addLineBreak() {
		this.textStream += "T* ";
		return this;
	}
	/**
	* Add an image at the given coordinates in millimeters
	* The coordinate field is in the fourth quadrant, i.e. the point of origin is top-left
	* @param image The image to add which is an enum of readily embeddable images
	* @param position Coordinates [x,y] where to place the image
	* @param dimensions Dimensions [width, height] of the image. Image will be stretched to fit the given dimensions
	*/
	addImage(image, position, dimensions) {
		this.graphicsStream += `Q q ${TRANSFORM_MATRIX} cm ${mmToPSPoint(dimensions[0])} 0 0 -${mmToPSPoint(dimensions[1])} ${mmToPSPoint(position[0])} ${mmToPSPoint(position[1])} cm /Im${image} Do Q q ${TRANSFORM_MATRIX} cm `;
		return this;
	}
	/**
	* Draw black line "fromPos" "toPos"
	* @param fromPos Starting point of the line [x,y]
	* @param toPos Ending point of the line [x,y]
	*/
	addDrawnLine(fromPos, toPos) {
		this.graphicsStream += `${mmToPSPoint(fromPos[0])} ${mmToPSPoint(fromPos[1])} m ${mmToPSPoint(toPos[0])} ${mmToPSPoint(toPos[1])} l s `;
		return this;
	}
	/**
	* Change the currently used text font
	* @param font Font to change to which is an enum of readily embeddable fonts
	* @param points Font size in PostScript points
	*/
	changeFont(font, points) {
		this.textStream += `/F${font} ${points} Tf ${points + TEXT_VERTICAL_SPACING} TL `;
		this.currentFont = font;
		this.currentFontSize = points;
		return this;
	}
	/**
	* Changes the current text cursor position to the specified position
	* @param position The position to place the cursor at
	*/
	changeTextCursorPosition(position) {
		this.textStream += `1 0 0 -1 ${mmToPSPoint(position[0])} ${mmToPSPoint(position[1]) + this.currentFontSize} Tm `;
		return this;
	}
	/**
	* Change font size of the currently used font
	* @param points Font size in PostScript points
	*/
	changeFontSize(points) {
		this.textStream += `/F${this.currentFont} ${points} Tf ${points + TEXT_VERTICAL_SPACING} TL `;
		this.currentFontSize = points;
		return this;
	}
	/**
	* Change the grayscale of the current text
	* @param grayScale Float between 0 and 1 by which the text lightness shall be adjusted. 1 = white, 0 = black
	*/
	changeTextGrayscale(grayScale) {
		grayScale = Math.max(Math.min(grayScale, 1), 0);
		this.textStream += `${grayScale} g `;
		return this;
	}
	/**
	* Change the rendering mode of the current text. The rendering mode values and their effect are the same as the PDF standard describes
	* @param renderingMode Rendering mode (number) to set
	*/
	changeTextRenderingMode(renderingMode) {
		this.textStream += `${renderingMode} Tr `;
		return this;
	}
	/**
	* Render a table with the input of a two-dimensional array. Produces automatic page breaks.
	* Returns the table's height on the last page where it is still rendered, allowing that value to be used to continue placing objects after the table
	* @param position Coordinates [x,y] where to place the table's origin point
	* @param tableWidth The width of the table
	* @param columns Array of ColumnObjects, specifying the header name and width of each column in percent of the total tableWidth { headerName: string, columnWidth: number  }
	* @param data Two-dimensional array of strings, specifying the data for every row : [ //row1 [a,b,c] //row2 [x,y,z]...   ]. The inner arrays (rows) must have the same length as the columns array!
	* @param rowsOnFirstPage How many rows can fit on the first page. This is dynamically decided by the amount of text that should follow after the table
	*/
	async addTable(position, tableWidth, columns, data, rowsOnFirstPage = 4) {
		this.addTableHeader(position, tableWidth, columns);
		const entriesOnFirstPage = data.length > rowsOnFirstPage ? ROWS_FIRST_PAGE_MULTIPLE : rowsOnFirstPage;
		let tableHeight = this.addTablePage(position, tableWidth, columns, data.slice(0, entriesOnFirstPage));
		let entryCounter = entriesOnFirstPage;
		while (entryCounter < data.length) {
			await this.addPage();
			position = [position[0], MARGIN_TOP];
			tableHeight = this.addTablePage(position, tableWidth, columns, data.slice(entryCounter, entryCounter + ROWS_N_PAGE));
			entryCounter += ROWS_N_PAGE;
		}
		const lastPageCannotFitRemainingRows = (entryCounter - entriesOnFirstPage) % ROWS_N_PAGE <= ROWS_FIRST_PAGE_MULTIPLE;
		const insufficientSpaceBelowTable = entryCounter == ROWS_FIRST_PAGE_MULTIPLE;
		if (!lastPageCannotFitRemainingRows || insufficientSpaceBelowTable) {
			await this.addPage();
			tableHeight = MARGIN_TOP;
		}
		this.addDrawnLine([position[0], tableHeight], [position[0] + tableWidth, tableHeight]);
		return tableHeight;
	}
	/**
	* Render the actual visible table, starting with a header and all subsequent entries inside the "chunk"
	*/
	addTablePage(position, tableWidth, columns, chunk) {
		this.addTableHeader(position, tableWidth, columns);
		let previousRowOffset = TABLE_VERTICAL_SPACING;
		for (const row of chunk) {
			this.addTableRow([position[0], position[1] + previousRowOffset], columns, row);
			previousRowOffset += TABLE_VERTICAL_SPACING;
		}
		return position[1] + previousRowOffset;
	}
	/**
	* Render the table header
	*/
	addTableHeader(position, tableWidth, columns) {
		this.changeFont(PDF_FONTS.BOLD, 11);
		this.addTableRow(position, columns, columns.flatMap((column) => column.headerName));
		this.addDrawnLine([position[0], position[1] + 5], [position[0] + tableWidth, position[1] + 5]);
		this.changeFont(PDF_FONTS.REGULAR, 11);
	}
	/**
	* Render a table row
	*/
	addTableRow(position, columnInfo, rowItems) {
		if (rowItems.length !== columnInfo.length) console.error("Amount of items in table row not equal to amount of columns!");
		let previousWidthOffset = 0;
		for (let i = 0; i < rowItems.length; i++) {
			if (i >= 2) this.addTextRightAlign(rowItems[i], [position[0] + previousWidthOffset, position[1]], columnInfo[i].columnWidth);
else this.addText(rowItems[i], [position[0] + previousWidthOffset, position[1]]);
			previousWidthOffset += columnInfo[i].columnWidth;
		}
	}
	/**
	* Renders an address field, allowing the inclusion of any character inside text.
	* If any multibyte character outside the defined encoding is detected, the text will be written as an image via the canvas API.
	* The image will then be attached be inserted into the PDF. If the image generation fails (missing canvas support) fallback text will be rendered
	* @param position Coordinates [x,y] where to place the field's origin point
	* @param address String containing the address (expected to hold multiple newlines)
	*/
	async addAddressField(position, address) {
		const addressParts = address.split("\n");
		let imageBuffer = new ArrayBuffer(0);
		let byteLengthForAddress = 1;
		try {
			if (!areStringPartsOneByteLength(addressParts)) {
				const canvas = new OffscreenCanvas(ADDRESS_FIELD_WIDTH, ADDRESS_FIELD_HEIGHT);
				const context = canvas.getContext("2d");
				if (context) {
					context.font = "36px serif";
					context.fillStyle = "white";
					context.fillRect(0, 0, canvas.width, canvas.height);
					context.fillStyle = "black";
					for (let i = 0; i < addressParts.length; i++) context.fillText(addressParts[i], 0, 40 * (i + 1));
					const dataUrl = await canvas.convertToBlob({ type: "image/jpeg" });
					imageBuffer = await dataUrl.arrayBuffer();
					this.addImage(PDF_IMAGES.ADDRESS, position, [ADDRESS_FIELD_WIDTH / 8, ADDRESS_FIELD_HEIGHT / 8]);
					byteLengthForAddress = 2;
					this.changeTextRenderingMode(TEXT_RENDERING_MODE.INVISIBLE);
					this.changeFont(PDF_FONTS.INVISIBLE_CID, 12);
				} else throw new Error("PDF Canvas Error - Could not access OffscreenCanvasContext2D.");
			}
		} catch (err) {
			console.warn(`PDF Error - Cannot render canvas. This is likely because the browser does not support OffscreenCanvas. The error was:\n"${err}"`);
		}
		this.pdfWriter.createStreamObject(new Map([
			["Name", "/Im2"],
			["Type", "/XObject"],
			["Subtype", "/Image"],
			["Width", `${ADDRESS_FIELD_WIDTH}`],
			["Height", `${ADDRESS_FIELD_HEIGHT}`],
			["BitsPerComponent", "8"],
			["ColorSpace", "/DeviceRGB"]
		]), new Uint8Array(imageBuffer), PdfStreamEncoding.DCT, "IMG_ADDRESS");
		for (const addressPart of addressParts) this.addText(addressPart, ORIGIN_POSITION, byteLengthForAddress).addLineBreak();
		this.changeFont(PDF_FONTS.REGULAR, 12);
		this.changeTextRenderingMode(TEXT_RENDERING_MODE.NORMAL);
	}
};
function toUnicodePoint(input, byteLength = 1) {
	if (byteLength === 1) {
		const out = [];
		for (let i = 0; i < input.length; i++) {
			const codePoint = input.codePointAt(i);
			if (codePoint && isCodePointOneByteLength(codePoint)) out.push(codePoint.toString(16));
else console.warn(`Attempted to render a character longer than one byte. Character was ${input[i]} with a code of ${codePoint}.`);
		}
		return out;
	} else return input.split("").map((c) => c.charCodeAt(0).toString(16).padStart(4, "0"));
}
function isCodePointOneByteLength(codePoint) {
	return codePoint < 256;
}
function areStringPartsOneByteLength(stringParts) {
	for (const addressPart of stringParts) for (let i = 0; i < addressPart.length; i++) {
		const codePoint = addressPart.codePointAt(i);
		if (codePoint && !isCodePointOneByteLength(codePoint)) return false;
	}
	return true;
}
function getWordLengthInPoints(codePoints, font, fontSize) {
	const widthsArray = font === PDF_FONTS.REGULAR ? regularFontWidths : boldFontWidths;
	let total = 0;
	for (let i = 0; i < codePoints.length; i++) {
		let index = parseInt(codePoints[i], 16) - 32;
		total += 1 / (1e3 / widthsArray[index]);
	}
	return total * fontSize;
}
/**
* Convert millimeters to PostScript points
*/
function mmToPSPoint(mm) {
	return mm * 2.834645688;
}

//#endregion
//#region src/common/api/worker/invoicegen/PdfInvoiceGenerator.ts
var PdfInvoiceGenerator = class {
	doc;
	languageCode = "en";
	invoiceNumber;
	customerId;
	invoice;
	constructor(pdfWriter, invoice, invoiceNumber, customerId) {
		this.invoice = invoice;
		this.invoiceNumber = invoiceNumber;
		this.customerId = customerId;
		this.languageCode = countryUsesGerman(this.invoice.country);
		this.doc = new PdfDocument(pdfWriter);
	}
	/**
	* Generate the PDF document
	*/
	async generate() {
		await this.doc.addPage();
		this.doc.addImage(PDF_IMAGES.TUTA_LOGO, [25, MARGIN_TOP + 15.7], [45, 15.7]);
		this.renderSideBarInfo();
		await this.renderAddressField();
		this.renderInvoiceInfo();
		await this.renderInvoiceTable();
		this.renderAdditional();
		this.renderLegalDisclaimer();
		return await this.doc.create();
	}
	/**
	* The sidebar on the document in the top-right corner
	*/
	renderSideBarInfo() {
		this.doc.changeFont(PDF_FONTS.BOLD, 11).addText(InvoiceTexts_default.universal.companyName, [MARGIN_LEFT + 125, MARGIN_TOP]).changeFont(PDF_FONTS.REGULAR, 11).addLineBreak().addText(InvoiceTexts_default.universal.addressStreet).addLineBreak().addText(InvoiceTexts_default[this.languageCode].addressPostal).addLineBreak().addText(InvoiceTexts_default[this.languageCode].addressCountry).addLineBreak().addLineBreak().addText(InvoiceTexts_default[this.languageCode].tutaPhone).addLineBreak().addText(InvoiceTexts_default.universal.tutaFax).addLineBreak().addText(InvoiceTexts_default.universal.tutaEmail).addLineBreak().addText(InvoiceTexts_default.universal.tutaWebsite).addLineBreak().addLineBreak().addText(InvoiceTexts_default[this.languageCode].yourCustomerId).addLineBreak().addText(this.customerId).changeFontSize(12).addText(`${InvoiceTexts_default[this.languageCode].addressCity}, ${this.formatInvoiceDate(this.invoice.date)}`, [MARGIN_LEFT + 125, MARGIN_TOP + 70]);
	}
	/**
	* The short address field of Tuta and the address field of the customer below the image
	*/
	async renderAddressField() {
		this.doc.changeFontSize(9).addText(`${InvoiceTexts_default.universal.companyName} - ${InvoiceTexts_default.universal.addressStreet} - ${InvoiceTexts_default[this.languageCode].addressPostal}`, [MARGIN_LEFT, MARGIN_TOP + 35]).addLineBreak().changeFontSize(11).addLineBreak();
		await this.doc.addAddressField([MARGIN_LEFT, MARGIN_TOP + 82], this.invoice.address);
	}
	/**
	* The basic invoice info above the invoice table
	*/
	renderInvoiceInfo() {
		this.doc.changeFontSize(18).addText(this.getInvoiceTypeName(this.invoice.invoiceType, this.invoice.grandTotal), [MARGIN_LEFT, MARGIN_TOP + 90]).changeFont(PDF_FONTS.BOLD, 12).addText(`${InvoiceTexts_default[this.languageCode].invoiceNumber} ${this.invoiceNumber}`, [MARGIN_LEFT, MARGIN_TOP + 100]).changeFont(PDF_FONTS.REGULAR, 11);
		if (this.invoice.invoiceType === InvoiceType.INVOICE) this.doc.addText(InvoiceTexts_default[this.languageCode].asAgreedBlock, [MARGIN_LEFT, MARGIN_TOP + 110]);
	}
	/**
	* The table with all invoice items
	*/
	async renderInvoiceTable() {
		const columns = [
			{
				headerName: InvoiceTexts_default[this.languageCode].quantity,
				columnWidth: 19.8
			},
			{
				headerName: InvoiceTexts_default[this.languageCode].item,
				columnWidth: 95.7
			},
			{
				headerName: InvoiceTexts_default[this.languageCode].singlePrice,
				columnWidth: 24.75
			},
			{
				headerName: InvoiceTexts_default[this.languageCode].totalPrice,
				columnWidth: 24.75
			}
		];
		const tableData = [];
		for (const invoiceItem of this.invoice.items) {
			tableData.push([
				this.formatAmount(invoiceItem.itemType, invoiceItem.amount),
				getInvoiceItemTypeName(invoiceItem.itemType, this.languageCode),
				invoiceItem.singlePrice == null ? "" : this.formatInvoiceCurrency(invoiceItem.singlePrice),
				this.formatInvoiceCurrency(invoiceItem.totalPrice)
			]);
			tableData.push([
				"",
				`${this.formatInvoiceDate(invoiceItem.startDate)} - ${this.formatInvoiceDate(invoiceItem.endDate)}`,
				"",
				""
			]);
		}
		const tableEndPoint = await this.doc.addTable([MARGIN_LEFT, MARGIN_TOP + 120], 165, columns, tableData, this.getTableRowsForFirstPage());
		this.renderTableSummary(tableEndPoint, columns);
		this.doc.changeTextCursorPosition([MARGIN_LEFT, tableEndPoint + 4 * TABLE_VERTICAL_SPACING]);
	}
	/**
	* Summary of totals and applied VAT below the rendered table
	*/
	renderTableSummary(tableEndPoint, columns) {
		let additionalVerticalSpace = 1;
		this.doc.changeFont(PDF_FONTS.REGULAR, 11);
		this.doc.addTableRow([MARGIN_LEFT, tableEndPoint], columns, [
			"",
			"",
			InvoiceTexts_default[this.languageCode].subTotal,
			this.formatInvoiceCurrency(this.invoice.subTotal)
		]);
		if (this.invoice.vatType === VatType.ADD_VAT) this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + TABLE_VERTICAL_SPACING], columns, [
			"",
			"",
			`${InvoiceTexts_default[this.languageCode].addedVat} ${this.invoice.vatRate}${InvoiceTexts_default[this.languageCode].vatPercent}`,
			this.formatInvoiceCurrency(this.invoice.vat)
		]);
else if (this.invoice.vatType === VatType.VAT_INCLUDED_SHOWN) this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + TABLE_VERTICAL_SPACING], columns, [
			"",
			"",
			`${InvoiceTexts_default[this.languageCode].includedVat} ${this.invoice.vatRate}${InvoiceTexts_default[this.languageCode].vatPercent}`,
			this.formatInvoiceCurrency(this.invoice.vat)
		]);
else additionalVerticalSpace -= 1;
		this.doc.changeFont(PDF_FONTS.BOLD, 11);
		this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + (additionalVerticalSpace + 1) * TABLE_VERTICAL_SPACING], columns, [
			"",
			"",
			InvoiceTexts_default[this.languageCode].grandTotal,
			this.formatInvoiceCurrency(this.invoice.vatType == VatType.NO_VAT_CHARGE_TUTAO ? this.invoice.subTotal : this.invoice.grandTotal)
		]);
	}
	/**
	* Additional blocks displayed below the table depending on invoice type, vat type and payment method
	*/
	renderAdditional() {
		this.doc.changeFont(PDF_FONTS.REGULAR, 11);
		switch (this.invoice.vatType) {
			case VatType.ADD_VAT:
			case VatType.VAT_INCLUDED_SHOWN: break;
			case VatType.NO_VAT:
				if (this.invoice.vatIdNumber != null) this.doc.addText(InvoiceTexts_default[this.languageCode].reverseChargeVatIdNumber1).addLineBreak().addText(InvoiceTexts_default[this.languageCode].reverseChargeVatIdNumber2).addLineBreak().addText(`${InvoiceTexts_default[this.languageCode].yourVatId} `).changeFont(PDF_FONTS.BOLD, 11).addText(`${this.invoice.vatIdNumber}`).changeFont(PDF_FONTS.REGULAR, 11);
else this.doc.addText(InvoiceTexts_default[this.languageCode].netPricesNoVatInGermany);
				break;
			case VatType.NO_VAT_CHARGE_TUTAO:
				this.doc.addText(InvoiceTexts_default[this.languageCode].reverseChargeAffiliate).addLineBreak().addText(InvoiceTexts_default[this.languageCode].reverseChargeVatIdNumber2);
				if (this.invoice.vatIdNumber != null) this.doc.addLineBreak().addText(`${InvoiceTexts_default[this.languageCode].yourVatId} `).changeFont(PDF_FONTS.BOLD, 11).addText(`${this.invoice.vatIdNumber}`);
				break;
			case VatType.VAT_INCLUDED_HIDDEN:
				this.doc.addText(InvoiceTexts_default[this.languageCode].noVatInGermany);
				break;
			default: throw new Error("Unknown VatType " + this.invoice.vatType);
		}
		this.doc.addLineBreak();
		this.doc.addLineBreak();
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			switch (this.invoice.paymentMethod) {
				case PaymentMethod.INVOICE:
					this.doc.addText(InvoiceTexts_default[this.languageCode].paymentInvoiceDue1).addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceDue2).addLineBreak().addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceHolder).addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceBank).addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceIBAN).addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceBIC).addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceProvideNumber1).changeFont(PDF_FONTS.BOLD, 11).addText(` ${this.invoiceNumber} `).changeFont(PDF_FONTS.REGULAR, 11).addLineBreak().addText(InvoiceTexts_default[this.languageCode].paymentInvoiceProvideNumber2);
					break;
				case PaymentMethod.CREDIT_CARD:
					this.doc.addText(InvoiceTexts_default[this.languageCode].paymentCreditCard);
					break;
				case PaymentMethod.PAYPAL:
					this.doc.addText(InvoiceTexts_default[this.languageCode].paymentPaypal);
					break;
				case PaymentMethod.ACCOUNT_BALANCE:
					this.doc.addText(InvoiceTexts_default[this.languageCode].paymentAccountBalance);
					break;
			}
			this.doc.addLineBreak().addLineBreak().addText(InvoiceTexts_default[this.languageCode].thankYou);
		}
	}
	/**
	* The legal disclaimer info at the bottom of the last page
	*/
	renderLegalDisclaimer() {
		this.doc.changeFont(PDF_FONTS.REGULAR, 10).addText(InvoiceTexts_default[this.languageCode].legalNoSigned, [MARGIN_LEFT, MARGIN_TOP + 240]).addLineBreak().addLineBreak().changeTextGrayscale(.5).addText(InvoiceTexts_default[this.languageCode].legalRepresented, [MARGIN_LEFT, MARGIN_TOP + 250]).addLineBreak().addText(InvoiceTexts_default[this.languageCode].legalRegistration).addLineBreak().addText(InvoiceTexts_default[this.languageCode].legalVatIdentification).addLineBreak().addText(InvoiceTexts_default[this.languageCode].legalBankAccount);
	}
	/**
	* Determines how many table rows (invoice items) can be rendered on the first page depending on the texts that follow after the table
	*/
	getTableRowsForFirstPage() {
		if (this.invoice.paymentMethod === PaymentMethod.INVOICE && this.invoice.vatIdNumber != null && (this.invoice.vatType === VatType.NO_VAT || this.invoice.vatType === VatType.NO_VAT_CHARGE_TUTAO)) return 4;
else return 8;
	}
	/**
	* Get the name of a given InvoiceType
	*/
	getInvoiceTypeName(type, amount) {
		switch (type) {
			case InvoiceType.INVOICE: return InvoiceTexts_default[this.languageCode].invoice;
			case InvoiceType.CREDIT: return InvoiceTexts_default[this.languageCode].credit;
			case InvoiceType.REFERRAL_CREDIT: if (parseFloat(amount) >= 0) return InvoiceTexts_default[this.languageCode].credit;
else return InvoiceTexts_default[this.languageCode].cancelCredit;
			default: throw new Error("Invalid InvoiceType " + type);
		}
	}
	/**
	* Format the date depending on document language (dd.mm.yyyy) / (dd. Mon yyyy)
	*/
	formatInvoiceDate(date) {
		if (date == null) return "";
		if (this.languageCode === "de") return date.toLocaleDateString("de-DE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric"
		});
else return date.toLocaleDateString("en-UK", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		});
	}
	/**
	* Format the currency separator (dot, comma) depending on the country
	*/
	formatInvoiceCurrency(price) {
		price = `${price} EUR`;
		return this.languageCode === "de" ? price.replace(".", ",") : price;
	}
	/**
	* Format the amount of storage into the appropriate byte unit if the item is a legacy storage package. Otherwise, return as is
	*/
	formatAmount(itemType, amount) {
		if (itemType === InvoiceItemType.StoragePackage || itemType === InvoiceItemType.StoragePackageUpgrade) {
			const numAmount = Number(amount);
			return numAmount < 1e3 ? `${amount} GB` : `${numAmount / 1e3} TB`;
		} else return amount;
	}
};

//#endregion
export { PdfInvoiceGenerator };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGRmSW52b2ljZUdlbmVyYXRvci1jaHVuay5qcyIsIm5hbWVzIjpbIk9SSUdJTl9QT1NJVElPTjogW3g6IG51bWJlciwgeTogbnVtYmVyXSIsInBkZldyaXRlcjogUGRmV3JpdGVyIiwidGV4dDogc3RyaW5nIiwicG9zaXRpb246IFt4OiBudW1iZXIsIHk6IG51bWJlcl0iLCJieXRlTGVuZ3RoOiBudW1iZXIiLCJjb250YWluZXJXaWR0aDogbnVtYmVyIiwiaW1hZ2U6IFBERl9JTUFHRVMiLCJkaW1lbnNpb25zOiBbd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXJdIiwiZnJvbVBvczogW3g6IG51bWJlciwgeTogbnVtYmVyXSIsInRvUG9zOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdIiwiZm9udDogUERGX0ZPTlRTIiwicG9pbnRzOiBudW1iZXIiLCJncmF5U2NhbGU6IG51bWJlciIsInJlbmRlcmluZ01vZGU6IFRFWFRfUkVOREVSSU5HX01PREUiLCJ0YWJsZVdpZHRoOiBudW1iZXIiLCJjb2x1bW5zOiBUYWJsZUNvbHVtbltdIiwiZGF0YTogUmVhZG9ubHlBcnJheTxSZWFkb25seUFycmF5PHN0cmluZz4+Iiwicm93c09uRmlyc3RQYWdlOiBudW1iZXIiLCJjaHVuazogUmVhZG9ubHlBcnJheTxSZWFkb25seUFycmF5PHN0cmluZz4+IiwiY29sdW1uSW5mbzogUmVhZG9ubHlBcnJheTxUYWJsZUNvbHVtbj4iLCJyb3dJdGVtczogUmVhZG9ubHlBcnJheTxzdHJpbmc+IiwiYWRkcmVzczogc3RyaW5nIiwiaW5wdXQ6IHN0cmluZyIsIm91dDogc3RyaW5nW10iLCJjb2RlUG9pbnQ6IG51bWJlciIsInN0cmluZ1BhcnRzOiBzdHJpbmdbXSIsImNvZGVQb2ludHM6IHN0cmluZ1tdIiwiZm9udFNpemU6IG51bWJlciIsIm1tOiBudW1iZXIiLCJwZGZXcml0ZXI6IFBkZldyaXRlciIsImludm9pY2U6IEludm9pY2VEYXRhR2V0T3V0IiwiaW52b2ljZU51bWJlcjogc3RyaW5nIiwiY3VzdG9tZXJJZDogc3RyaW5nIiwiSW52b2ljZVRleHRzIiwiY29sdW1uczogVGFibGVDb2x1bW5bXSIsInRhYmxlRGF0YTogQXJyYXk8QXJyYXk8c3RyaW5nPj4iLCJ0YWJsZUVuZFBvaW50OiBudW1iZXIiLCJ0eXBlOiBOdW1iZXJTdHJpbmciLCJhbW91bnQ6IE51bWJlclN0cmluZyIsImRhdGU6IERhdGUgfCBudWxsIiwicHJpY2U6IHN0cmluZyB8IG51bWJlciIsIml0ZW1UeXBlOiBzdHJpbmciLCJhbW91bnQ6IHN0cmluZyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9wZGYvUGRmRG9jdW1lbnQudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvaW52b2ljZWdlbi9QZGZJbnZvaWNlR2VuZXJhdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvbGRGb250V2lkdGhzLCBQZGZEaWN0VmFsdWUsIFBkZk9iamVjdFJlZiwgUGRmU3RyZWFtRW5jb2RpbmcsIHJlZ3VsYXJGb250V2lkdGhzIH0gZnJvbSBcIi4vUGRmQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IFBkZldyaXRlciB9IGZyb20gXCIuL1BkZldyaXRlci5qc1wiXG5pbXBvcnQgeyBEZWZsYXRlciB9IGZyb20gXCIuL0RlZmxhdGVyLmpzXCJcbmltcG9ydCB7IHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuZXhwb3J0IGVudW0gUERGX0ZPTlRTIHtcblx0UkVHVUxBUiA9IDEsXG5cdEJPTEQgPSAyLFxuXHRJTlZJU0lCTEVfQ0lEID0gMyxcbn1cblxuZXhwb3J0IGVudW0gUERGX0lNQUdFUyB7XG5cdFRVVEFfTE9HTyA9IDEsXG5cdEFERFJFU1MgPSAyLFxufVxuXG5leHBvcnQgZW51bSBURVhUX1JFTkRFUklOR19NT0RFIHtcblx0Tk9STUFMID0gMCxcblx0SU5WSVNJQkxFID0gMyxcbn1cblxuZXhwb3J0IHR5cGUgVGFibGVDb2x1bW4gPSB7IGhlYWRlck5hbWU6IHN0cmluZzsgY29sdW1uV2lkdGg6IG51bWJlciB9XG5cbmV4cG9ydCBjb25zdCBNQVJHSU5fVE9QID0gMjBcbmV4cG9ydCBjb25zdCBNQVJHSU5fTEVGVCA9IDI1XG5leHBvcnQgY29uc3QgVEFCTEVfVkVSVElDQUxfU1BBQ0lORyA9IDVcbmNvbnN0IFRFWFRfVkVSVElDQUxfU1BBQ0lORyA9IDJcbmNvbnN0IFBBUEVSX0hFSUdIVCA9IDI5N1xuY29uc3QgUEFQRVJfV0lEVEggPSAyMTBcbmNvbnN0IE9SSUdJTl9QT1NJVElPTjogW3g6IG51bWJlciwgeTogbnVtYmVyXSA9IFswLCAwXVxuLy8gVHJhbnNmb3JtIG1hdHJpeCB0byBzZXQgb3JpZ2luIHBvaW50IHRvcC1sZWZ0XG5jb25zdCBUUkFOU0ZPUk1fTUFUUklYID0gYDEgMCAwIC0xIDAgJHttbVRvUFNQb2ludChQQVBFUl9IRUlHSFQpfWBcbi8vIDEgSW52b2ljZUl0ZW0gPSAyIFRhYmxlIHJvd3MgKGZpcnN0IHJvdyBpdGVtIGluZm8sIHNlY29uZCByb3cgZGF0ZXMpXG4vLyBUaGUgYW1vdW50IG9mIHJvd3MgcmVuZGVyZWQgb24gdGhlIGZpcnN0IHBhZ2UgaXMgZHluYW1pY2FsbHkgZGV0ZXJtaW5lZCBpbiB0aGUgYWRkVGFibGUoKSBtZXRob2Rcbi8vIEFtb3VudCBvZiB0YWJsZSByb3dzIHRoYXQgY2FuIGZpdCBvbiB0aGUgZmlyc3QgcGFnZSBpZiBhIHNlY29uZCBpcyByZW5kZXJlZCB0b29cbmNvbnN0IFJPV1NfRklSU1RfUEFHRV9NVUxUSVBMRSA9IDI0IC8vIDEyIEludm9pY2VJdGVtc1xuLy8gQW1vdW50IG9mIHRhYmxlIHJvd3MgdGhhdCBjYW4gZml0IG9uIGFueSBuLXRoIHBhZ2UgdGhhdCBpc24ndCB0aGUgZmlyc3RcbmNvbnN0IFJPV1NfTl9QQUdFID0gNTBcblxuY29uc3QgQUREUkVTU19GSUVMRF9XSURUSCA9IDgwMFxuY29uc3QgQUREUkVTU19GSUVMRF9IRUlHSFQgPSAzMjBcblxuLyoqXG4gKiBPYmplY3Qgd2hpY2ggbWFuYWdlcyB0aGUgaGlnaC1sZXZlbCBjcmVhdGlvbiBvZiBhIFBERiBkb2N1bWVudCBieSBwYXJzaW5nIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBpbnRvIFBERiBzdHJlYW1zLlxuICogVXNlIHRoaXMgb2JqZWN0IHRvIGNyZWF0ZSBQREYgZG9jdW1lbnRzLiBGb3IgdGhlIGxvdy1sZXZlbCBmdW5jdGlvbmFsaXR5IHNlZSBcIlBkZldyaXRlclwiIGNsYXNzXG4gKlxuICogT25jZSBpbnN0YW50aWF0ZWQsIHVzZSB0aGUgcHVibGljIG1ldGhvZHMgc3RhcnRpbmcgd2l0aCBcImFkZC4uLigpXCIgb3IgXCJjaGFuZ2UuLi4oKVwiIHRvIGRlc2NyaWJlIHRoZSBkb2N1bWVudC5cbiAqIEdlbmVyYXRlIHRoZSBQREYgYnkgY2FsbGluZyB0aGUgXCJjcmVhdGUoKVwiIG1ldGhvZCBhbnkgdGltZS4gRG8gbm90IHV0aWxpemUgdGhlIHNhbWUgUGRmRG9jdW1lbnQgaW5zdGFuY2UgYWdhaW4gb25jZSBhIFBERiBmaWxlIGhhcyBiZWVuIGNyZWF0ZWQgd2l0aCBpdC5cbiAqIFByaXZhdGUgXCJyZW5kZXIuLi4oKVwiIG1ldGhvZHMgYXJlIG9ubHkgdXNlZCBpbnRlcm5hbGx5IHRvIGludGVyYWN0IHdpdGggdGhlIGxvdy1sZXZlbCBQZGZXcml0ZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFBkZkRvY3VtZW50IHtcblx0cHJpdmF0ZSByZWFkb25seSBwZGZXcml0ZXI6IFBkZldyaXRlclxuXHRwcml2YXRlIHJlYWRvbmx5IGRlZmxhdGVyOiBEZWZsYXRlclxuXHRwcml2YXRlIHBhZ2VDb3VudDogbnVtYmVyID0gMFxuXHRwcml2YXRlIHRleHRTdHJlYW06IHN0cmluZyA9IFwiXCJcblx0cHJpdmF0ZSBncmFwaGljc1N0cmVhbTogc3RyaW5nID0gXCJcIlxuXHRwcml2YXRlIGN1cnJlbnRGb250OiBQREZfRk9OVFMgPSBQREZfRk9OVFMuUkVHVUxBUlxuXHRwcml2YXRlIGN1cnJlbnRGb250U2l6ZTogbnVtYmVyID0gMTJcblx0cHJpdmF0ZSBwYWdlTGlzdDogUGRmT2JqZWN0UmVmW10gPSBbXVxuXG5cdGNvbnN0cnVjdG9yKHBkZldyaXRlcjogUGRmV3JpdGVyKSB7XG5cdFx0dGhpcy5wZGZXcml0ZXIgPSBwZGZXcml0ZXJcblx0XHR0aGlzLnBkZldyaXRlci5zZXR1cERlZmF1bHRPYmplY3RzKClcblx0XHR0aGlzLmRlZmxhdGVyID0gbmV3IERlZmxhdGVyKClcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgdGhlIGRvY3VtZW50OiBjb21taXQgYWxsIHN0cmVhbXMgdG8gb2JqZWN0cyBhbmQgbGV0IHRoZSBQZGZXcml0ZXIgd3JpdGUgdGhlIGZpbGVcblx0ICovXG5cdGFzeW5jIGNyZWF0ZSgpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcblx0XHQvLyBXcml0ZSBhbGwgb3BlbiBzdHJlYW1zIGFuZCBhZGQgdGhlIHBhZ2UgdHJlZSB3aXRoIGFsbCBwYWdlcyBvZiB0aGUgZG9jdW1lbnQgdG8gdGhlIFBERlxuXHRcdGF3YWl0IHRoaXMucmVuZGVyVGV4dCgpXG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJHcmFwaGljcygpXG5cdFx0dGhpcy5wZGZXcml0ZXIuY3JlYXRlT2JqZWN0KFxuXHRcdFx0bmV3IE1hcDxzdHJpbmcsIFBkZkRpY3RWYWx1ZT4oW1xuXHRcdFx0XHRbXCJUeXBlXCIsIFwiL1BhZ2VzXCJdLFxuXHRcdFx0XHRbXCJQYXJlbnRcIiwgeyByZWZJZDogXCJDQVRBTE9HXCIgfV0sXG5cdFx0XHRcdFtcIktpZHNcIiwgdGhpcy5wYWdlTGlzdF0sXG5cdFx0XHRcdFtcIkNvdW50XCIsIGAke3RoaXMucGFnZUNvdW50fWBdLFxuXHRcdFx0XSksXG5cdFx0XHRcIlBBR0VTXCIsXG5cdFx0KVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLnBkZldyaXRlci53cml0ZVBkZkZpbGUoKVxuXHR9XG5cblx0LyoqXG5cdCAqIENsb3NlcyB0aGUgY3VycmVudCB0ZXh0U3RyZWFtIGFuZCB3cml0ZXMgaXQgaW50byBhbiBvYmplY3Rcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVuZGVyVGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBlbmNvZGVkVGV4dFN0cmVhbSA9IGF3YWl0IHRoaXMuZGVmbGF0ZXIuZGVmbGF0ZShcblx0XHRcdHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkoYEJUIHEgJHtUUkFOU0ZPUk1fTUFUUklYfSBjbSAvRiR7dGhpcy5jdXJyZW50Rm9udH0gJHt0aGlzLmN1cnJlbnRGb250U2l6ZX0gVGYgYCArIHRoaXMudGV4dFN0cmVhbSArIGAgUSBFVGApLFxuXHRcdClcblx0XHR0aGlzLnBkZldyaXRlci5jcmVhdGVTdHJlYW1PYmplY3QobmV3IE1hcCgpLCBlbmNvZGVkVGV4dFN0cmVhbSwgUGRmU3RyZWFtRW5jb2RpbmcuRkxBVEUsIGBURVhUXyR7dGhpcy5wYWdlQ291bnR9YClcblx0XHR0aGlzLnRleHRTdHJlYW0gPSBcIlwiXG5cdH1cblxuXHQvKipcblx0ICogQ2xvc2VzIHRoZSBjdXJyZW50IGdyYXBoaWNzU3RyZWFtIGFuZCB3cml0ZXMgaXQgaW50byBhbiBvYmplY3Rcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVuZGVyR3JhcGhpY3MoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZW5jb2RlZEdyYXBoaWNzU3RyZWFtID0gYXdhaXQgdGhpcy5kZWZsYXRlci5kZWZsYXRlKHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkoYHEgJHtUUkFOU0ZPUk1fTUFUUklYfSBjbSBgICsgdGhpcy5ncmFwaGljc1N0cmVhbSArIGAgUWApKVxuXHRcdHRoaXMucGRmV3JpdGVyLmNyZWF0ZVN0cmVhbU9iamVjdChuZXcgTWFwKCksIGVuY29kZWRHcmFwaGljc1N0cmVhbSwgUGRmU3RyZWFtRW5jb2RpbmcuRkxBVEUsIGBHUkFQSElDU18ke3RoaXMucGFnZUNvdW50fWApXG5cdFx0dGhpcy5ncmFwaGljc1N0cmVhbSA9IFwiXCJcblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBlbmQgYSBuZXcgcGFnZSB0byB0aGUgUERGIGRvY3VtZW50XG5cdCAqL1xuXHRhc3luYyBhZGRQYWdlKCk6IFByb21pc2U8UGRmRG9jdW1lbnQ+IHtcblx0XHQvLyBXaGVuIGFkZGluZyBhIG5ldyBwYWdlLCBhbGwgY29udGVudCBzdHJlYW1zIG11c3QgYmUgcmVuZGVyZWQgb24gdGhlIHByZXZpb3VzIHBhZ2UuIFdoZW4gY3JlYXRpbmcgdGhlIGZpcnN0IHBhZ2UsIGFsbCBzdHJlYW1zIGFyZSBzdGlsbCBlbXB0eVxuXHRcdGlmICh0aGlzLnBhZ2VDb3VudCA+IDApIHtcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVGV4dCgpXG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlckdyYXBoaWNzKClcblx0XHR9XG5cdFx0dGhpcy5wYWdlQ291bnQrK1xuXG5cdFx0Ly8gQ3JlYXRlIG5ldyBwYWdlIG9iamVjdFxuXHRcdGNvbnN0IHBhZ2VSZWZJZCA9IGBQQUdFXyR7dGhpcy5wYWdlQ291bnR9YFxuXHRcdHRoaXMucGRmV3JpdGVyLmNyZWF0ZU9iamVjdChcblx0XHRcdG5ldyBNYXA8c3RyaW5nLCBQZGZEaWN0VmFsdWU+KFtcblx0XHRcdFx0W1wiVHlwZVwiLCBcIi9QYWdlXCJdLFxuXHRcdFx0XHRbXCJQYXJlbnRcIiwgeyByZWZJZDogXCJQQUdFU1wiIH1dLFxuXHRcdFx0XHRbXCJNZWRpYUJveFwiLCBgWyAwIDAgJHttbVRvUFNQb2ludChQQVBFUl9XSURUSCl9ICR7bW1Ub1BTUG9pbnQoUEFQRVJfSEVJR0hUKX1dYF0sXG5cdFx0XHRcdFtcIlJlc291cmNlc1wiLCB7IHJlZklkOiBcIlJFU09VUkNFU1wiIH1dLFxuXHRcdFx0XHRbXCJDb250ZW50c1wiLCBbeyByZWZJZDogYFRFWFRfJHt0aGlzLnBhZ2VDb3VudH1gIH0sIHsgcmVmSWQ6IGBHUkFQSElDU18ke3RoaXMucGFnZUNvdW50fWAgfV1dLFxuXHRcdFx0XSksXG5cdFx0XHRwYWdlUmVmSWQsXG5cdFx0KVxuXG5cdFx0Ly8gQWRkIG5ldyBwYWdlIHRvIHBhZ2UtdHJlZVxuXHRcdHRoaXMucGFnZUxpc3QucHVzaCh7IHJlZklkOiBwYWdlUmVmSWQgfSlcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhIHRleHQgc3RyaW5nIGF0IHRoZSBnaXZlbiBjb29yZGluYXRlcyBpbiBtaWxsaW1ldGVyc1xuXHQgKiBUaGUgY29vcmRpbmF0ZSBmaWVsZCBpcyBpbiB0aGUgZm91cnRoIHF1YWRyYW50LCBpLmUuIHRoZSBwb2ludCBvZiBvcmlnaW4gaXMgdG9wLWxlZnRcblx0ICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gcGxhY2Vcblx0ICogQHBhcmFtIHBvc2l0aW9uIENvb3JkaW5hdGVzIFt4LHldIHdoZXJlIHRvIHBsYWNlIHRoZSB0ZXh0LCBjYW4gYmUgb21pdHRlZCB0byBrZWVwIHRoZSBjdXJyZW50IHBvc2l0aW9uXG5cdCAqIEBwYXJhbSBieXRlTGVuZ3RoIFRoZSBieXRlTGVuZ3RoIG9mIGV2ZXJ5IGNoYXJhY3RlciBpbiB0aGUgc3RyaW5nLiBCeSBkZWZhdWx0LCB0aGlzIGlzIDEgYnl0ZSA9IDIgbmliYmxlcyA9IFwiWFhcIiBlLmcuIFwiMjBcIiA9IFwiU1BBQ0VcIi5cblx0ICogRG8gbm90IGNoYW5nZSBpdCB0byBtb3JlIHRoYW4gMSBieXRlIHVubGVzcyB5b3UgY2FuIHZlcmlmeSBhbnkgdGV4dCBwcmludGVkIHRoaXMgd2F5IHdpbGwgYmUgZGlzcGxheWVkIGNvcnJlY3RseSBvbiB0aGUgUERGLlxuXHQgKi9cblx0YWRkVGV4dCh0ZXh0OiBzdHJpbmcsIHBvc2l0aW9uOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdID0gT1JJR0lOX1BPU0lUSU9OLCBieXRlTGVuZ3RoOiBudW1iZXIgPSAxKTogUGRmRG9jdW1lbnQge1xuXHRcdGlmICh0ZXh0ID09PSBcIlwiKSByZXR1cm4gdGhpc1xuXHRcdC8vIElmIG5vIHBvc2l0aW9uIHdhcyBzcGVjaWZpZWQsIGRvbid0IHVwZGF0ZSB0aGUgdGV4dCBjdXJzb3IgcG9zaXRpb25cblx0XHRpZiAocG9zaXRpb24gIT09IE9SSUdJTl9QT1NJVElPTikge1xuXHRcdFx0dGhpcy50ZXh0U3RyZWFtICs9IGAxIDAgMCAtMSAke21tVG9QU1BvaW50KHBvc2l0aW9uWzBdKX0gJHttbVRvUFNQb2ludChwb3NpdGlvblsxXSkgKyB0aGlzLmN1cnJlbnRGb250U2l6ZX0gVG0gPCR7dG9Vbmljb2RlUG9pbnQoXG5cdFx0XHRcdHRleHQsXG5cdFx0XHRcdGJ5dGVMZW5ndGgsXG5cdFx0XHQpLmpvaW4oXCJcIil9PiBUaiBgXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudGV4dFN0cmVhbSArPSBgPCR7dG9Vbmljb2RlUG9pbnQodGV4dCwgYnl0ZUxlbmd0aCkuam9pbihcIlwiKX0+IFRqIGBcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKlxuXHQgKiBBZGQgYSB0ZXh0IHN0cmluZyBhdCB0aGUgZ2l2ZW4gY29vcmRpbmF0ZXMgaW4gbWlsbGltZXRlcnMgYW5kIGFsaWduIGl0IHRvIHRoZSByaWdodCBvZiBpdHMgXCJjb250YWluZXJcIlxuXHQgKiBUaGUgY29udGFpbmVyIGlzIHNwZWNpZmllZCBieSBhIHdpZHRoIGluIG1pbGxpbWV0ZXJzLlxuXHQgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBwbGFjZVxuXHQgKiBAcGFyYW0gcG9zaXRpb24gQ29vcmRpbmF0ZXMgW3gseV0gd2hlcmUgdG8gcGxhY2UgdGhlIHRleHQsIGNhbiBiZSBvbWl0dGVkIHRvIGtlZXAgdGhlIGN1cnJlbnQgcG9zaXRpb25cblx0ICogQHBhcmFtIGNvbnRhaW5lcldpZHRoIFRoZSB3aWR0aCBpbiBtaWxsaW1ldGVycyBvZiB0aGUgXCJjb250YWluZXJcIiBpbiB3aGljaCB0aGUgdGV4dCBpcyB0byBiZSByaWdodCBhbGlnbmVkIGluXG5cdCAqL1xuXHRhZGRUZXh0UmlnaHRBbGlnbih0ZXh0OiBzdHJpbmcsIHBvc2l0aW9uOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdLCBjb250YWluZXJXaWR0aDogbnVtYmVyKTogUGRmRG9jdW1lbnQge1xuXHRcdGlmICh0ZXh0ID09PSBcIlwiKSByZXR1cm4gdGhpc1xuXHRcdGNvbnN0IHVuaWNvZGVQb2ludHMgPSB0b1VuaWNvZGVQb2ludCh0ZXh0KVxuXHRcdHRoaXMudGV4dFN0cmVhbSArPSBgMSAwIDAgLTEgJHtcblx0XHRcdG1tVG9QU1BvaW50KHBvc2l0aW9uWzBdKSArIG1tVG9QU1BvaW50KGNvbnRhaW5lcldpZHRoKSAtIGdldFdvcmRMZW5ndGhJblBvaW50cyh1bmljb2RlUG9pbnRzLCB0aGlzLmN1cnJlbnRGb250LCB0aGlzLmN1cnJlbnRGb250U2l6ZSlcblx0XHR9ICR7bW1Ub1BTUG9pbnQocG9zaXRpb25bMV0pICsgdGhpcy5jdXJyZW50Rm9udFNpemV9IFRtIDwke3VuaWNvZGVQb2ludHMuam9pbihcIlwiKX0+IFRqIGBcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhIGxpbmVicmVhayBpbiB0aGUgdGV4dFxuXHQgKi9cblx0YWRkTGluZUJyZWFrKCk6IFBkZkRvY3VtZW50IHtcblx0XHR0aGlzLnRleHRTdHJlYW0gKz0gXCJUKiBcIlxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHQvKipcblx0ICogQWRkIGFuIGltYWdlIGF0IHRoZSBnaXZlbiBjb29yZGluYXRlcyBpbiBtaWxsaW1ldGVyc1xuXHQgKiBUaGUgY29vcmRpbmF0ZSBmaWVsZCBpcyBpbiB0aGUgZm91cnRoIHF1YWRyYW50LCBpLmUuIHRoZSBwb2ludCBvZiBvcmlnaW4gaXMgdG9wLWxlZnRcblx0ICogQHBhcmFtIGltYWdlIFRoZSBpbWFnZSB0byBhZGQgd2hpY2ggaXMgYW4gZW51bSBvZiByZWFkaWx5IGVtYmVkZGFibGUgaW1hZ2VzXG5cdCAqIEBwYXJhbSBwb3NpdGlvbiBDb29yZGluYXRlcyBbeCx5XSB3aGVyZSB0byBwbGFjZSB0aGUgaW1hZ2Vcblx0ICogQHBhcmFtIGRpbWVuc2lvbnMgRGltZW5zaW9ucyBbd2lkdGgsIGhlaWdodF0gb2YgdGhlIGltYWdlLiBJbWFnZSB3aWxsIGJlIHN0cmV0Y2hlZCB0byBmaXQgdGhlIGdpdmVuIGRpbWVuc2lvbnNcblx0ICovXG5cdGFkZEltYWdlKGltYWdlOiBQREZfSU1BR0VTLCBwb3NpdGlvbjogW3g6IG51bWJlciwgeTogbnVtYmVyXSwgZGltZW5zaW9uczogW3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyXSk6IFBkZkRvY3VtZW50IHtcblx0XHQvLyBJbWFnZSBwbGFjZW1lbnQgZGVtYW5kcyB0d28gbWF0cml4IHRyYW5zZm9ybWF0aW9ucywgc28gaXQgbXVzdCBtYWtlIGl0cyBvd24gZ3JhcGhpYyBzdGF0ZSB0byBub3QgYWZmZWN0IGdyYXBoaWMgZWxlbWVudHMgd2hpY2ggbmVlZCBubyB0cmFuc2Zvcm0gKGRyYXdMaW5lKVxuXHRcdHRoaXMuZ3JhcGhpY3NTdHJlYW0gKz0gYFEgcSAke1RSQU5TRk9STV9NQVRSSVh9IGNtICR7bW1Ub1BTUG9pbnQoZGltZW5zaW9uc1swXSl9IDAgMCAtJHttbVRvUFNQb2ludChkaW1lbnNpb25zWzFdKX0gJHttbVRvUFNQb2ludChcblx0XHRcdHBvc2l0aW9uWzBdLFxuXHRcdCl9ICR7bW1Ub1BTUG9pbnQocG9zaXRpb25bMV0pfSBjbSAvSW0ke2ltYWdlfSBEbyBRIHEgJHtUUkFOU0ZPUk1fTUFUUklYfSBjbSBgXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdC8qKlxuXHQgKiBEcmF3IGJsYWNrIGxpbmUgXCJmcm9tUG9zXCIgXCJ0b1Bvc1wiXG5cdCAqIEBwYXJhbSBmcm9tUG9zIFN0YXJ0aW5nIHBvaW50IG9mIHRoZSBsaW5lIFt4LHldXG5cdCAqIEBwYXJhbSB0b1BvcyBFbmRpbmcgcG9pbnQgb2YgdGhlIGxpbmUgW3gseV1cblx0ICovXG5cdGFkZERyYXduTGluZShmcm9tUG9zOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdLCB0b1BvczogW3g6IG51bWJlciwgeTogbnVtYmVyXSk6IFBkZkRvY3VtZW50IHtcblx0XHR0aGlzLmdyYXBoaWNzU3RyZWFtICs9IGAke21tVG9QU1BvaW50KGZyb21Qb3NbMF0pfSAke21tVG9QU1BvaW50KGZyb21Qb3NbMV0pfSBtICR7bW1Ub1BTUG9pbnQodG9Qb3NbMF0pfSAke21tVG9QU1BvaW50KHRvUG9zWzFdKX0gbCBzIGBcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZSB0aGUgY3VycmVudGx5IHVzZWQgdGV4dCBmb250XG5cdCAqIEBwYXJhbSBmb250IEZvbnQgdG8gY2hhbmdlIHRvIHdoaWNoIGlzIGFuIGVudW0gb2YgcmVhZGlseSBlbWJlZGRhYmxlIGZvbnRzXG5cdCAqIEBwYXJhbSBwb2ludHMgRm9udCBzaXplIGluIFBvc3RTY3JpcHQgcG9pbnRzXG5cdCAqL1xuXHRjaGFuZ2VGb250KGZvbnQ6IFBERl9GT05UUywgcG9pbnRzOiBudW1iZXIpOiBQZGZEb2N1bWVudCB7XG5cdFx0dGhpcy50ZXh0U3RyZWFtICs9IGAvRiR7Zm9udH0gJHtwb2ludHN9IFRmICR7cG9pbnRzICsgVEVYVF9WRVJUSUNBTF9TUEFDSU5HfSBUTCBgXG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IGZvbnRcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IHBvaW50c1xuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHQvKipcblx0ICogQ2hhbmdlcyB0aGUgY3VycmVudCB0ZXh0IGN1cnNvciBwb3NpdGlvbiB0byB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uXG5cdCAqIEBwYXJhbSBwb3NpdGlvbiBUaGUgcG9zaXRpb24gdG8gcGxhY2UgdGhlIGN1cnNvciBhdFxuXHQgKi9cblx0Y2hhbmdlVGV4dEN1cnNvclBvc2l0aW9uKHBvc2l0aW9uOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdKTogUGRmRG9jdW1lbnQge1xuXHRcdHRoaXMudGV4dFN0cmVhbSArPSBgMSAwIDAgLTEgJHttbVRvUFNQb2ludChwb3NpdGlvblswXSl9ICR7bW1Ub1BTUG9pbnQocG9zaXRpb25bMV0pICsgdGhpcy5jdXJyZW50Rm9udFNpemV9IFRtIGBcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZSBmb250IHNpemUgb2YgdGhlIGN1cnJlbnRseSB1c2VkIGZvbnRcblx0ICogQHBhcmFtIHBvaW50cyBGb250IHNpemUgaW4gUG9zdFNjcmlwdCBwb2ludHNcblx0ICovXG5cdGNoYW5nZUZvbnRTaXplKHBvaW50czogbnVtYmVyKTogUGRmRG9jdW1lbnQge1xuXHRcdHRoaXMudGV4dFN0cmVhbSArPSBgL0Yke3RoaXMuY3VycmVudEZvbnR9ICR7cG9pbnRzfSBUZiAke3BvaW50cyArIFRFWFRfVkVSVElDQUxfU1BBQ0lOR30gVEwgYFxuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gcG9pbnRzXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGFuZ2UgdGhlIGdyYXlzY2FsZSBvZiB0aGUgY3VycmVudCB0ZXh0XG5cdCAqIEBwYXJhbSBncmF5U2NhbGUgRmxvYXQgYmV0d2VlbiAwIGFuZCAxIGJ5IHdoaWNoIHRoZSB0ZXh0IGxpZ2h0bmVzcyBzaGFsbCBiZSBhZGp1c3RlZC4gMSA9IHdoaXRlLCAwID0gYmxhY2tcblx0ICovXG5cdGNoYW5nZVRleHRHcmF5c2NhbGUoZ3JheVNjYWxlOiBudW1iZXIpOiBQZGZEb2N1bWVudCB7XG5cdFx0Z3JheVNjYWxlID0gTWF0aC5tYXgoTWF0aC5taW4oZ3JheVNjYWxlLCAxKSwgMClcblx0XHR0aGlzLnRleHRTdHJlYW0gKz0gYCR7Z3JheVNjYWxlfSBnIGBcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZSB0aGUgcmVuZGVyaW5nIG1vZGUgb2YgdGhlIGN1cnJlbnQgdGV4dC4gVGhlIHJlbmRlcmluZyBtb2RlIHZhbHVlcyBhbmQgdGhlaXIgZWZmZWN0IGFyZSB0aGUgc2FtZSBhcyB0aGUgUERGIHN0YW5kYXJkIGRlc2NyaWJlc1xuXHQgKiBAcGFyYW0gcmVuZGVyaW5nTW9kZSBSZW5kZXJpbmcgbW9kZSAobnVtYmVyKSB0byBzZXRcblx0ICovXG5cdGNoYW5nZVRleHRSZW5kZXJpbmdNb2RlKHJlbmRlcmluZ01vZGU6IFRFWFRfUkVOREVSSU5HX01PREUpIHtcblx0XHR0aGlzLnRleHRTdHJlYW0gKz0gYCR7cmVuZGVyaW5nTW9kZX0gVHIgYFxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHQvKipcblx0ICogUmVuZGVyIGEgdGFibGUgd2l0aCB0aGUgaW5wdXQgb2YgYSB0d28tZGltZW5zaW9uYWwgYXJyYXkuIFByb2R1Y2VzIGF1dG9tYXRpYyBwYWdlIGJyZWFrcy5cblx0ICogUmV0dXJucyB0aGUgdGFibGUncyBoZWlnaHQgb24gdGhlIGxhc3QgcGFnZSB3aGVyZSBpdCBpcyBzdGlsbCByZW5kZXJlZCwgYWxsb3dpbmcgdGhhdCB2YWx1ZSB0byBiZSB1c2VkIHRvIGNvbnRpbnVlIHBsYWNpbmcgb2JqZWN0cyBhZnRlciB0aGUgdGFibGVcblx0ICogQHBhcmFtIHBvc2l0aW9uIENvb3JkaW5hdGVzIFt4LHldIHdoZXJlIHRvIHBsYWNlIHRoZSB0YWJsZSdzIG9yaWdpbiBwb2ludFxuXHQgKiBAcGFyYW0gdGFibGVXaWR0aCBUaGUgd2lkdGggb2YgdGhlIHRhYmxlXG5cdCAqIEBwYXJhbSBjb2x1bW5zIEFycmF5IG9mIENvbHVtbk9iamVjdHMsIHNwZWNpZnlpbmcgdGhlIGhlYWRlciBuYW1lIGFuZCB3aWR0aCBvZiBlYWNoIGNvbHVtbiBpbiBwZXJjZW50IG9mIHRoZSB0b3RhbCB0YWJsZVdpZHRoIHsgaGVhZGVyTmFtZTogc3RyaW5nLCBjb2x1bW5XaWR0aDogbnVtYmVyICB9XG5cdCAqIEBwYXJhbSBkYXRhIFR3by1kaW1lbnNpb25hbCBhcnJheSBvZiBzdHJpbmdzLCBzcGVjaWZ5aW5nIHRoZSBkYXRhIGZvciBldmVyeSByb3cgOiBbIC8vcm93MSBbYSxiLGNdIC8vcm93MiBbeCx5LHpdLi4uICAgXS4gVGhlIGlubmVyIGFycmF5cyAocm93cykgbXVzdCBoYXZlIHRoZSBzYW1lIGxlbmd0aCBhcyB0aGUgY29sdW1ucyBhcnJheSFcblx0ICogQHBhcmFtIHJvd3NPbkZpcnN0UGFnZSBIb3cgbWFueSByb3dzIGNhbiBmaXQgb24gdGhlIGZpcnN0IHBhZ2UuIFRoaXMgaXMgZHluYW1pY2FsbHkgZGVjaWRlZCBieSB0aGUgYW1vdW50IG9mIHRleHQgdGhhdCBzaG91bGQgZm9sbG93IGFmdGVyIHRoZSB0YWJsZVxuXHQgKi9cblx0YXN5bmMgYWRkVGFibGUoXG5cdFx0cG9zaXRpb246IFt4OiBudW1iZXIsIHk6IG51bWJlcl0sXG5cdFx0dGFibGVXaWR0aDogbnVtYmVyLFxuXHRcdGNvbHVtbnM6IFRhYmxlQ29sdW1uW10sXG5cdFx0ZGF0YTogUmVhZG9ubHlBcnJheTxSZWFkb25seUFycmF5PHN0cmluZz4+LFxuXHRcdHJvd3NPbkZpcnN0UGFnZTogbnVtYmVyID0gNCxcblx0KTogUHJvbWlzZTxudW1iZXI+IHtcblx0XHR0aGlzLmFkZFRhYmxlSGVhZGVyKHBvc2l0aW9uLCB0YWJsZVdpZHRoLCBjb2x1bW5zKVxuXHRcdC8vIElmIGFsbCBlbnRyaWVzIGZpdCBvbiB0aGUgZmlyc3QgcGFnZSwgdGhlbiBoYXZlIFwiSVRFTVNfRklSU1RfUEFHRV9TSU5HTEVcIiBhbW91bnQgb2YgZW50cmllcywgZWxzZSBcIlJPV1NfRklSU1RfUEFHRV9NVUxUSVBMRVwiXG5cdFx0Y29uc3QgZW50cmllc09uRmlyc3RQYWdlID0gZGF0YS5sZW5ndGggPiByb3dzT25GaXJzdFBhZ2UgPyBST1dTX0ZJUlNUX1BBR0VfTVVMVElQTEUgOiByb3dzT25GaXJzdFBhZ2Vcblx0XHQvLyBSZW5kZXIgdGhlIGZpcnN0IHBhZ2UsIHNhdmUgdGhlIGhlaWdodCBvZiB0aGUgdGFibGVcblx0XHRsZXQgdGFibGVIZWlnaHQgPSB0aGlzLmFkZFRhYmxlUGFnZShwb3NpdGlvbiwgdGFibGVXaWR0aCwgY29sdW1ucywgZGF0YS5zbGljZSgwLCBlbnRyaWVzT25GaXJzdFBhZ2UpKVxuXHRcdGxldCBlbnRyeUNvdW50ZXIgPSBlbnRyaWVzT25GaXJzdFBhZ2VcblxuXHRcdC8vIG9ubHkgdHdvIGZpdCBvbiBmaXJzdCBwYWdlIHRvIHRoZW4gaGF2ZSBlbm91Z2ggc3BhY2UgdG8gcmVuZGVyIHRoZSBCSUdHRVNULCB3ZSBoYXZlIHRocmVlIHNvIHdlIG5ldyBwYWdlXG5cdFx0Ly8gQklHR0VTVCBpcyBHZXJtYW4gb3IgRW5saWdzaCAoaXRzIGNsb3NlKSBpbnZvaWNlICsgbm90IHZhdCArIHZhdGlkXG5cblx0XHQvLyBLZWVwIHdyaXRpbmcgcGFnZXMgb2YgZW50cmllcyB1bnRpbCBhbGwgZGF0YSBpcyBleGhhdXN0ZWRcblx0XHR3aGlsZSAoZW50cnlDb3VudGVyIDwgZGF0YS5sZW5ndGgpIHtcblx0XHRcdGF3YWl0IHRoaXMuYWRkUGFnZSgpXG5cdFx0XHRwb3NpdGlvbiA9IFtwb3NpdGlvblswXSwgTUFSR0lOX1RPUF1cblx0XHRcdHRhYmxlSGVpZ2h0ID0gdGhpcy5hZGRUYWJsZVBhZ2UocG9zaXRpb24sIHRhYmxlV2lkdGgsIGNvbHVtbnMsIGRhdGEuc2xpY2UoZW50cnlDb3VudGVyLCBlbnRyeUNvdW50ZXIgKyBST1dTX05fUEFHRSkpXG5cdFx0XHRlbnRyeUNvdW50ZXIgKz0gUk9XU19OX1BBR0Vcblx0XHR9XG5cblx0XHRjb25zdCBsYXN0UGFnZUNhbm5vdEZpdFJlbWFpbmluZ1Jvd3MgPSAoZW50cnlDb3VudGVyIC0gZW50cmllc09uRmlyc3RQYWdlKSAlIFJPV1NfTl9QQUdFIDw9IFJPV1NfRklSU1RfUEFHRV9NVUxUSVBMRVxuXHRcdGNvbnN0IGluc3VmZmljaWVudFNwYWNlQmVsb3dUYWJsZSA9IGVudHJ5Q291bnRlciA9PSBST1dTX0ZJUlNUX1BBR0VfTVVMVElQTEVcblxuXHRcdGlmICghbGFzdFBhZ2VDYW5ub3RGaXRSZW1haW5pbmdSb3dzIHx8IGluc3VmZmljaWVudFNwYWNlQmVsb3dUYWJsZSkge1xuXHRcdFx0YXdhaXQgdGhpcy5hZGRQYWdlKClcblx0XHRcdHRhYmxlSGVpZ2h0ID0gTUFSR0lOX1RPUFxuXHRcdH1cblxuXHRcdHRoaXMuYWRkRHJhd25MaW5lKFtwb3NpdGlvblswXSwgdGFibGVIZWlnaHRdLCBbcG9zaXRpb25bMF0gKyB0YWJsZVdpZHRoLCB0YWJsZUhlaWdodF0pXG5cdFx0cmV0dXJuIHRhYmxlSGVpZ2h0XG5cdH1cblxuXHQvKipcblx0ICogUmVuZGVyIHRoZSBhY3R1YWwgdmlzaWJsZSB0YWJsZSwgc3RhcnRpbmcgd2l0aCBhIGhlYWRlciBhbmQgYWxsIHN1YnNlcXVlbnQgZW50cmllcyBpbnNpZGUgdGhlIFwiY2h1bmtcIlxuXHQgKi9cblx0YWRkVGFibGVQYWdlKHBvc2l0aW9uOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdLCB0YWJsZVdpZHRoOiBudW1iZXIsIGNvbHVtbnM6IFRhYmxlQ29sdW1uW10sIGNodW5rOiBSZWFkb25seUFycmF5PFJlYWRvbmx5QXJyYXk8c3RyaW5nPj4pOiBudW1iZXIge1xuXHRcdHRoaXMuYWRkVGFibGVIZWFkZXIocG9zaXRpb24sIHRhYmxlV2lkdGgsIGNvbHVtbnMpXG5cdFx0bGV0IHByZXZpb3VzUm93T2Zmc2V0ID0gVEFCTEVfVkVSVElDQUxfU1BBQ0lOR1xuXHRcdGZvciAoY29uc3Qgcm93IG9mIGNodW5rKSB7XG5cdFx0XHR0aGlzLmFkZFRhYmxlUm93KFtwb3NpdGlvblswXSwgcG9zaXRpb25bMV0gKyBwcmV2aW91c1Jvd09mZnNldF0sIGNvbHVtbnMsIHJvdylcblx0XHRcdHByZXZpb3VzUm93T2Zmc2V0ICs9IFRBQkxFX1ZFUlRJQ0FMX1NQQUNJTkdcblx0XHR9XG5cdFx0cmV0dXJuIHBvc2l0aW9uWzFdICsgcHJldmlvdXNSb3dPZmZzZXRcblx0fVxuXG5cdC8qKlxuXHQgKiBSZW5kZXIgdGhlIHRhYmxlIGhlYWRlclxuXHQgKi9cblx0YWRkVGFibGVIZWFkZXIocG9zaXRpb246IFt4OiBudW1iZXIsIHk6IG51bWJlcl0sIHRhYmxlV2lkdGg6IG51bWJlciwgY29sdW1uczogVGFibGVDb2x1bW5bXSkge1xuXHRcdHRoaXMuY2hhbmdlRm9udChQREZfRk9OVFMuQk9MRCwgMTEpXG5cdFx0dGhpcy5hZGRUYWJsZVJvdyhcblx0XHRcdHBvc2l0aW9uLFxuXHRcdFx0Y29sdW1ucyxcblx0XHRcdGNvbHVtbnMuZmxhdE1hcCgoY29sdW1uKSA9PiBjb2x1bW4uaGVhZGVyTmFtZSksXG5cdFx0KVxuXHRcdHRoaXMuYWRkRHJhd25MaW5lKFtwb3NpdGlvblswXSwgcG9zaXRpb25bMV0gKyA1XSwgW3Bvc2l0aW9uWzBdICsgdGFibGVXaWR0aCwgcG9zaXRpb25bMV0gKyA1XSlcblx0XHR0aGlzLmNoYW5nZUZvbnQoUERGX0ZPTlRTLlJFR1VMQVIsIDExKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlbmRlciBhIHRhYmxlIHJvd1xuXHQgKi9cblx0YWRkVGFibGVSb3cocG9zaXRpb246IFt4OiBudW1iZXIsIHk6IG51bWJlcl0sIGNvbHVtbkluZm86IFJlYWRvbmx5QXJyYXk8VGFibGVDb2x1bW4+LCByb3dJdGVtczogUmVhZG9ubHlBcnJheTxzdHJpbmc+KSB7XG5cdFx0aWYgKHJvd0l0ZW1zLmxlbmd0aCAhPT0gY29sdW1uSW5mby5sZW5ndGgpIGNvbnNvbGUuZXJyb3IoXCJBbW91bnQgb2YgaXRlbXMgaW4gdGFibGUgcm93IG5vdCBlcXVhbCB0byBhbW91bnQgb2YgY29sdW1ucyFcIilcblx0XHRsZXQgcHJldmlvdXNXaWR0aE9mZnNldCA9IDBcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHJvd0l0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoaSA+PSAyKSB7XG5cdFx0XHRcdHRoaXMuYWRkVGV4dFJpZ2h0QWxpZ24ocm93SXRlbXNbaV0sIFtwb3NpdGlvblswXSArIHByZXZpb3VzV2lkdGhPZmZzZXQsIHBvc2l0aW9uWzFdXSwgY29sdW1uSW5mb1tpXS5jb2x1bW5XaWR0aClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuYWRkVGV4dChyb3dJdGVtc1tpXSwgW3Bvc2l0aW9uWzBdICsgcHJldmlvdXNXaWR0aE9mZnNldCwgcG9zaXRpb25bMV1dKVxuXHRcdFx0fVxuXHRcdFx0cHJldmlvdXNXaWR0aE9mZnNldCArPSBjb2x1bW5JbmZvW2ldLmNvbHVtbldpZHRoXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlbmRlcnMgYW4gYWRkcmVzcyBmaWVsZCwgYWxsb3dpbmcgdGhlIGluY2x1c2lvbiBvZiBhbnkgY2hhcmFjdGVyIGluc2lkZSB0ZXh0LlxuXHQgKiBJZiBhbnkgbXVsdGlieXRlIGNoYXJhY3RlciBvdXRzaWRlIHRoZSBkZWZpbmVkIGVuY29kaW5nIGlzIGRldGVjdGVkLCB0aGUgdGV4dCB3aWxsIGJlIHdyaXR0ZW4gYXMgYW4gaW1hZ2UgdmlhIHRoZSBjYW52YXMgQVBJLlxuXHQgKiBUaGUgaW1hZ2Ugd2lsbCB0aGVuIGJlIGF0dGFjaGVkIGJlIGluc2VydGVkIGludG8gdGhlIFBERi4gSWYgdGhlIGltYWdlIGdlbmVyYXRpb24gZmFpbHMgKG1pc3NpbmcgY2FudmFzIHN1cHBvcnQpIGZhbGxiYWNrIHRleHQgd2lsbCBiZSByZW5kZXJlZFxuXHQgKiBAcGFyYW0gcG9zaXRpb24gQ29vcmRpbmF0ZXMgW3gseV0gd2hlcmUgdG8gcGxhY2UgdGhlIGZpZWxkJ3Mgb3JpZ2luIHBvaW50XG5cdCAqIEBwYXJhbSBhZGRyZXNzIFN0cmluZyBjb250YWluaW5nIHRoZSBhZGRyZXNzIChleHBlY3RlZCB0byBob2xkIG11bHRpcGxlIG5ld2xpbmVzKVxuXHQgKi9cblx0YXN5bmMgYWRkQWRkcmVzc0ZpZWxkKHBvc2l0aW9uOiBbeDogbnVtYmVyLCB5OiBudW1iZXJdLCBhZGRyZXNzOiBzdHJpbmcpIHtcblx0XHRjb25zdCBhZGRyZXNzUGFydHMgPSBhZGRyZXNzLnNwbGl0KFwiXFxuXCIpXG5cdFx0bGV0IGltYWdlQnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDApXG5cdFx0bGV0IGJ5dGVMZW5ndGhGb3JBZGRyZXNzID0gMVxuXG5cdFx0dHJ5IHtcblx0XHRcdGlmICghYXJlU3RyaW5nUGFydHNPbmVCeXRlTGVuZ3RoKGFkZHJlc3NQYXJ0cykpIHtcblx0XHRcdFx0Y29uc3QgY2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyhBRERSRVNTX0ZJRUxEX1dJRFRILCBBRERSRVNTX0ZJRUxEX0hFSUdIVClcblx0XHRcdFx0Y29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIilcblx0XHRcdFx0aWYgKGNvbnRleHQpIHtcblx0XHRcdFx0XHQvLyAzNnB4IGlzIGFyYml0cmFyaWx5IGNob3NlbiB0byBhbGlnbiB3aXRoIHRoZSAxMnB0IHNpemUgb2YgdGhlIGFjdHVhbCBQREYgdGV4dFxuXHRcdFx0XHRcdGNvbnRleHQuZm9udCA9IFwiMzZweCBzZXJpZlwiXG5cdFx0XHRcdFx0Y29udGV4dC5maWxsU3R5bGUgPSBcIndoaXRlXCJcblx0XHRcdFx0XHRjb250ZXh0LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcblx0XHRcdFx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IFwiYmxhY2tcIlxuXG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhZGRyZXNzUGFydHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGNvbnRleHQuZmlsbFRleHQoYWRkcmVzc1BhcnRzW2ldLCAwLCA0MCAqIChpICsgMSkpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnN0IGRhdGFVcmwgPSBhd2FpdCBjYW52YXMuY29udmVydFRvQmxvYih7IHR5cGU6IFwiaW1hZ2UvanBlZ1wiIH0pXG5cdFx0XHRcdFx0aW1hZ2VCdWZmZXIgPSBhd2FpdCBkYXRhVXJsLmFycmF5QnVmZmVyKClcblxuXHRcdFx0XHRcdC8vIEZvciB0aGUgcmVuZGVyZWQgaW1hZ2UsIHdlIHRha2UgaXRzIGRpbWVuc2lvbiBkaXZpZGVkIGJ5IDguIFRoaXMgZ2l2ZXMgYSBuaWNlIHJlc29sdXRpb24gZm9yIEpQRUdcblx0XHRcdFx0XHR0aGlzLmFkZEltYWdlKFBERl9JTUFHRVMuQUREUkVTUywgcG9zaXRpb24sIFtBRERSRVNTX0ZJRUxEX1dJRFRIIC8gOCwgQUREUkVTU19GSUVMRF9IRUlHSFQgLyA4XSlcblxuXHRcdFx0XHRcdC8vIFByZXBhcmUgZm9yIHJlbmRlcmluZyB0aGUgYWRkcmVzcyBiZWxvdyB0aGUgaW1hZ2UgaW52aXNpYmx5XG5cdFx0XHRcdFx0Ynl0ZUxlbmd0aEZvckFkZHJlc3MgPSAyXG5cdFx0XHRcdFx0dGhpcy5jaGFuZ2VUZXh0UmVuZGVyaW5nTW9kZShURVhUX1JFTkRFUklOR19NT0RFLklOVklTSUJMRSlcblx0XHRcdFx0XHR0aGlzLmNoYW5nZUZvbnQoUERGX0ZPTlRTLklOVklTSUJMRV9DSUQsIDEyKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlBERiBDYW52YXMgRXJyb3IgLSBDb3VsZCBub3QgYWNjZXNzIE9mZnNjcmVlbkNhbnZhc0NvbnRleHQyRC5cIilcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc29sZS53YXJuKGBQREYgRXJyb3IgLSBDYW5ub3QgcmVuZGVyIGNhbnZhcy4gVGhpcyBpcyBsaWtlbHkgYmVjYXVzZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IE9mZnNjcmVlbkNhbnZhcy4gVGhlIGVycm9yIHdhczpcXG5cIiR7ZXJyfVwiYClcblx0XHR9XG5cblx0XHQvLyBNdXN0IGNyZWF0ZSBpbWFnZSBvYmplY3QgaW4gYW55IGNhc2Ugc2luY2Ugb3RoZXJ3aXNlIHRoZSByZWZlcmVuY2UgY2Fubm90IGJlIHJlc29sdmVkLiBXZSB0aGVuIGp1c3QgZmlsbCBpdCB3aXRoIGVtcHR5IGRhdGEsIGJ1dCBuZXZlciByZW5kZXIgaXRcblx0XHR0aGlzLnBkZldyaXRlci5jcmVhdGVTdHJlYW1PYmplY3QoXG5cdFx0XHRuZXcgTWFwKFtcblx0XHRcdFx0W1wiTmFtZVwiLCBcIi9JbTJcIl0sXG5cdFx0XHRcdFtcIlR5cGVcIiwgXCIvWE9iamVjdFwiXSxcblx0XHRcdFx0W1wiU3VidHlwZVwiLCBcIi9JbWFnZVwiXSxcblx0XHRcdFx0W1wiV2lkdGhcIiwgYCR7QUREUkVTU19GSUVMRF9XSURUSH1gXSxcblx0XHRcdFx0W1wiSGVpZ2h0XCIsIGAke0FERFJFU1NfRklFTERfSEVJR0hUfWBdLFxuXHRcdFx0XHRbXCJCaXRzUGVyQ29tcG9uZW50XCIsIFwiOFwiXSxcblx0XHRcdFx0W1wiQ29sb3JTcGFjZVwiLCBcIi9EZXZpY2VSR0JcIl0sXG5cdFx0XHRdKSxcblx0XHRcdG5ldyBVaW50OEFycmF5KGltYWdlQnVmZmVyKSxcblx0XHRcdFBkZlN0cmVhbUVuY29kaW5nLkRDVCxcblx0XHRcdFwiSU1HX0FERFJFU1NcIixcblx0XHQpXG5cblx0XHQvLyBBbHdheXMgcmVuZGVyIHRoZSBhZGRyZXNzIGFzIHRleHQsIEVpdGhlciBkaXJlY3RseSBvciBpbnZpc2libHkgaW4gY2FzZSB0aGUgY2FudmFzIHdhcyBjYWxsZWRcblx0XHRmb3IgKGNvbnN0IGFkZHJlc3NQYXJ0IG9mIGFkZHJlc3NQYXJ0cykge1xuXHRcdFx0dGhpcy5hZGRUZXh0KGFkZHJlc3NQYXJ0LCBPUklHSU5fUE9TSVRJT04sIGJ5dGVMZW5ndGhGb3JBZGRyZXNzKS5hZGRMaW5lQnJlYWsoKVxuXHRcdH1cblxuXHRcdC8vIFVuZG8gYW55IGludmlzaWJsZS1jb25maWd1cmF0aW9uIGluIGNhc2UgaXQgd2FzIHNldFxuXHRcdHRoaXMuY2hhbmdlRm9udChQREZfRk9OVFMuUkVHVUxBUiwgMTIpXG5cdFx0dGhpcy5jaGFuZ2VUZXh0UmVuZGVyaW5nTW9kZShURVhUX1JFTkRFUklOR19NT0RFLk5PUk1BTClcblx0fVxufVxuXG4vKipcbiAqIENvbnZlcnQgYSB0ZXh0IHN0cmluZyBpbnRvIGEgTnVtU3RyaW5nIGFycmF5IHdoZXJlIGVhY2ggY2hhcmFjdGVyIGlzIHJlcGxhY2VkIGJ5IGl0cyBieXRlIHVuaWNvZGUgcG9pbnQgd2l0aCBhIGxlbmd0aCBzcGVjaWZpZWQgYnkgXCJieXRlTGVuZ3RoXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvVW5pY29kZVBvaW50KGlucHV0OiBzdHJpbmcsIGJ5dGVMZW5ndGg6IG51bWJlciA9IDEpOiBzdHJpbmdbXSB7XG5cdGlmIChieXRlTGVuZ3RoID09PSAxKSB7XG5cdFx0Y29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgY29kZVBvaW50ID0gaW5wdXQuY29kZVBvaW50QXQoaSlcblx0XHRcdGlmIChjb2RlUG9pbnQgJiYgaXNDb2RlUG9pbnRPbmVCeXRlTGVuZ3RoKGNvZGVQb2ludCkpIHtcblx0XHRcdFx0b3V0LnB1c2goY29kZVBvaW50LnRvU3RyaW5nKDE2KSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgQXR0ZW1wdGVkIHRvIHJlbmRlciBhIGNoYXJhY3RlciBsb25nZXIgdGhhbiBvbmUgYnl0ZS4gQ2hhcmFjdGVyIHdhcyAke2lucHV0W2ldfSB3aXRoIGEgY29kZSBvZiAke2NvZGVQb2ludH0uYClcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG91dFxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBpbnB1dC5zcGxpdChcIlwiKS5tYXAoKGMpID0+IGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikucGFkU3RhcnQoNCwgXCIwXCIpKVxuXHR9XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgZ2l2ZW4gY2hhcidzIGNvZGVwb2ludCBpcyBhYm92ZSBvbmUgYnl0ZSBpbiBzaXplLCBtYWtpbmcgaXQgbm90IGRpc3BsYXlhYmxlIGJ5IHNpbXBsZSBQREYgZm9udHNcbiAqIEBwYXJhbSBjb2RlUG9pbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQ29kZVBvaW50T25lQnl0ZUxlbmd0aChjb2RlUG9pbnQ6IG51bWJlcik6IGJvb2xlYW4ge1xuXHRyZXR1cm4gY29kZVBvaW50IDwgMjU2XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgZ2l2ZW4gc3RyaW5nLCBzcGxpdCBpbnRvIGl0cyBwYXJ0cywgaW5jbHVkZXMgYW55IGNoYXJhY3RlcnMgdGhhdCBhcmUgbG9uZ2VyIHRoYW4gb25lIGJ5dGUgaW4gc2l6ZVxuICogQHBhcmFtIHN0cmluZ1BhcnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcmVTdHJpbmdQYXJ0c09uZUJ5dGVMZW5ndGgoc3RyaW5nUGFydHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG5cdGZvciAoY29uc3QgYWRkcmVzc1BhcnQgb2Ygc3RyaW5nUGFydHMpIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGFkZHJlc3NQYXJ0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBjb2RlUG9pbnQgPSBhZGRyZXNzUGFydC5jb2RlUG9pbnRBdChpKVxuXHRcdFx0aWYgKGNvZGVQb2ludCAmJiAhaXNDb2RlUG9pbnRPbmVCeXRlTGVuZ3RoKGNvZGVQb2ludCkpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiBhIHdvcmQgYnkgY29uc2lkZXJpbmcgdGhlIHdpZHRoIG9mIGV2ZXJ5IGdseXBoIGluIHRoZSBmb250XG4gKiBAcGFyYW0gY29kZVBvaW50cyBBcnJheSBvZiB1bmljb2RlIHBvaW50cyByZXByZXNlbnRpbmcgZXZlcnkgY2hhcmFjdGVyIGluIHRoZSB3b3JkXG4gKiBAcGFyYW0gZm9udCBUaGUgZm9udCB1c2VkIGZvciB0aGUgcHJvY2Vzc2VkIHdvcmRcbiAqIEBwYXJhbSBmb250U2l6ZSBUaGUgZm9udCBzaXplIHVzZWQgZm9yIHRoZSBwcm9jZXNzZWQgd29yZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0V29yZExlbmd0aEluUG9pbnRzKGNvZGVQb2ludHM6IHN0cmluZ1tdLCBmb250OiBQREZfRk9OVFMsIGZvbnRTaXplOiBudW1iZXIpOiBudW1iZXIge1xuXHRjb25zdCB3aWR0aHNBcnJheSA9IGZvbnQgPT09IFBERl9GT05UUy5SRUdVTEFSID8gcmVndWxhckZvbnRXaWR0aHMgOiBib2xkRm9udFdpZHRoc1xuXHRsZXQgdG90YWwgPSAwXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgY29kZVBvaW50cy5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBpbmRleCA9IHBhcnNlSW50KGNvZGVQb2ludHNbaV0sIDE2KSAtIDMyXG5cdFx0dG90YWwgKz0gMSAvICgxMDAwIC8gd2lkdGhzQXJyYXlbaW5kZXhdKVxuXHR9XG5cdHJldHVybiB0b3RhbCAqIGZvbnRTaXplXG59XG5cbi8qKlxuICogQ29udmVydCBtaWxsaW1ldGVycyB0byBQb3N0U2NyaXB0IHBvaW50c1xuICovXG5mdW5jdGlvbiBtbVRvUFNQb2ludChtbTogbnVtYmVyKSB7XG5cdHJldHVybiBtbSAqIDIuODM0NjQ1Njg4XG59XG4iLCJpbXBvcnQgeyBNQVJHSU5fTEVGVCwgTUFSR0lOX1RPUCwgUERGX0ZPTlRTLCBQREZfSU1BR0VTLCBQZGZEb2N1bWVudCwgVEFCTEVfVkVSVElDQUxfU1BBQ0lORywgVGFibGVDb2x1bW4gfSBmcm9tIFwiLi4vcGRmL1BkZkRvY3VtZW50LmpzXCJcbmltcG9ydCBJbnZvaWNlVGV4dHMgZnJvbSBcIi4vSW52b2ljZVRleHRzLmpzXCJcbmltcG9ydCB7IFBkZldyaXRlciB9IGZyb20gXCIuLi9wZGYvUGRmV3JpdGVyLmpzXCJcbmltcG9ydCB7IEludm9pY2VEYXRhR2V0T3V0IH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBjb3VudHJ5VXNlc0dlcm1hbiwgZ2V0SW52b2ljZUl0ZW1UeXBlTmFtZSwgSW52b2ljZUl0ZW1UeXBlLCBJbnZvaWNlVHlwZSwgUGF5bWVudE1ldGhvZCwgVmF0VHlwZSB9IGZyb20gXCIuL0ludm9pY2VVdGlscy5qc1wiXG5cbi8qKlxuICogT2JqZWN0IGdlbmVyYXRpbmcgYSBQREYgaW52b2ljZSBkb2N1bWVudC5cbiAqIFRoaXMgZ2VuZXJhdG9yIGlzIE9OTFkgcmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgZGF0YSBpdCBnZXRzIGFuZCBmb3JtYXR0aW5nIGl0IGluIGEgd2F5IHRoYXQgZG9lcyBub3QgY2hhbmdlIGFueXRoaW5nIGFib3V0IGl0LlxuICogSWYgYWRqdXN0bWVudHMgdG8gdGhlIGRhdGEgbXVzdCBiZSBtYWRlIHByaW9yIHRvIHJlbmRlcmluZywgdGhlbiB0aGVzZSBzaG91bGQgdGFrZSBwbGFjZSB3aXRoaW4gdGhlIFJlbmRlckludm9pY2Ugc2VydmljZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFBkZkludm9pY2VHZW5lcmF0b3Ige1xuXHRwcml2YXRlIHJlYWRvbmx5IGRvYzogUGRmRG9jdW1lbnRcblx0cHJpdmF0ZSByZWFkb25seSBsYW5ndWFnZUNvZGU6IFwiZGVcIiB8IFwiZW5cIiA9IFwiZW5cIlxuXHRwcml2YXRlIHJlYWRvbmx5IGludm9pY2VOdW1iZXI6IHN0cmluZ1xuXHRwcml2YXRlIHJlYWRvbmx5IGN1c3RvbWVySWQ6IHN0cmluZ1xuXHRwcml2YXRlIGludm9pY2U6IEludm9pY2VEYXRhR2V0T3V0XG5cblx0Y29uc3RydWN0b3IocGRmV3JpdGVyOiBQZGZXcml0ZXIsIGludm9pY2U6IEludm9pY2VEYXRhR2V0T3V0LCBpbnZvaWNlTnVtYmVyOiBzdHJpbmcsIGN1c3RvbWVySWQ6IHN0cmluZykge1xuXHRcdHRoaXMuaW52b2ljZSA9IGludm9pY2Vcblx0XHR0aGlzLmludm9pY2VOdW1iZXIgPSBpbnZvaWNlTnVtYmVyXG5cdFx0dGhpcy5jdXN0b21lcklkID0gY3VzdG9tZXJJZFxuXHRcdHRoaXMubGFuZ3VhZ2VDb2RlID0gY291bnRyeVVzZXNHZXJtYW4odGhpcy5pbnZvaWNlLmNvdW50cnkpXG5cdFx0dGhpcy5kb2MgPSBuZXcgUGRmRG9jdW1lbnQocGRmV3JpdGVyKVxuXHR9XG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlIHRoZSBQREYgZG9jdW1lbnRcblx0ICovXG5cdGFzeW5jIGdlbmVyYXRlKCk6IFByb21pc2U8VWludDhBcnJheT4ge1xuXHRcdGF3YWl0IHRoaXMuZG9jLmFkZFBhZ2UoKVxuXHRcdHRoaXMuZG9jLmFkZEltYWdlKFBERl9JTUFHRVMuVFVUQV9MT0dPLCBbMjUsIE1BUkdJTl9UT1AgKyAxNS43XSwgWzQ1LCAxNS43XSlcblx0XHR0aGlzLnJlbmRlclNpZGVCYXJJbmZvKClcblx0XHRhd2FpdCB0aGlzLnJlbmRlckFkZHJlc3NGaWVsZCgpXG5cdFx0dGhpcy5yZW5kZXJJbnZvaWNlSW5mbygpXG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJJbnZvaWNlVGFibGUoKVxuXHRcdHRoaXMucmVuZGVyQWRkaXRpb25hbCgpXG5cdFx0dGhpcy5yZW5kZXJMZWdhbERpc2NsYWltZXIoKVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmRvYy5jcmVhdGUoKVxuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBzaWRlYmFyIG9uIHRoZSBkb2N1bWVudCBpbiB0aGUgdG9wLXJpZ2h0IGNvcm5lclxuXHQgKi9cblx0cmVuZGVyU2lkZUJhckluZm8oKSB7XG5cdFx0dGhpcy5kb2Ncblx0XHRcdC5jaGFuZ2VGb250KFBERl9GT05UUy5CT0xELCAxMSlcblx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0cy51bml2ZXJzYWwuY29tcGFueU5hbWUsIFtNQVJHSU5fTEVGVCArIDEyNSwgTUFSR0lOX1RPUF0pXG5cdFx0XHQuY2hhbmdlRm9udChQREZfRk9OVFMuUkVHVUxBUiwgMTEpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0cy51bml2ZXJzYWwuYWRkcmVzc1N0cmVldClcblx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5hZGRyZXNzUG9zdGFsKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLmFkZHJlc3NDb3VudHJ5KVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0udHV0YVBob25lKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHMudW5pdmVyc2FsLnR1dGFGYXgpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0cy51bml2ZXJzYWwudHV0YUVtYWlsKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHMudW5pdmVyc2FsLnR1dGFXZWJzaXRlKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ueW91ckN1c3RvbWVySWQpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdC5hZGRUZXh0KHRoaXMuY3VzdG9tZXJJZClcblx0XHRcdC5jaGFuZ2VGb250U2l6ZSgxMilcblx0XHRcdC5hZGRUZXh0KGAke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uYWRkcmVzc0NpdHl9LCAke3RoaXMuZm9ybWF0SW52b2ljZURhdGUodGhpcy5pbnZvaWNlLmRhdGUpfWAsIFtNQVJHSU5fTEVGVCArIDEyNSwgTUFSR0lOX1RPUCArIDcwXSlcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgc2hvcnQgYWRkcmVzcyBmaWVsZCBvZiBUdXRhIGFuZCB0aGUgYWRkcmVzcyBmaWVsZCBvZiB0aGUgY3VzdG9tZXIgYmVsb3cgdGhlIGltYWdlXG5cdCAqL1xuXHRhc3luYyByZW5kZXJBZGRyZXNzRmllbGQoKSB7XG5cdFx0dGhpcy5kb2Ncblx0XHRcdC5jaGFuZ2VGb250U2l6ZSg5KVxuXHRcdFx0LmFkZFRleHQoYCR7SW52b2ljZVRleHRzLnVuaXZlcnNhbC5jb21wYW55TmFtZX0gLSAke0ludm9pY2VUZXh0cy51bml2ZXJzYWwuYWRkcmVzc1N0cmVldH0gLSAke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uYWRkcmVzc1Bvc3RhbH1gLCBbXG5cdFx0XHRcdE1BUkdJTl9MRUZULFxuXHRcdFx0XHRNQVJHSU5fVE9QICsgMzUsXG5cdFx0XHRdKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuY2hhbmdlRm9udFNpemUoMTEpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRhd2FpdCB0aGlzLmRvYy5hZGRBZGRyZXNzRmllbGQoW01BUkdJTl9MRUZULCBNQVJHSU5fVE9QICsgODJdLCB0aGlzLmludm9pY2UuYWRkcmVzcylcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgYmFzaWMgaW52b2ljZSBpbmZvIGFib3ZlIHRoZSBpbnZvaWNlIHRhYmxlXG5cdCAqL1xuXHRyZW5kZXJJbnZvaWNlSW5mbygpIHtcblx0XHR0aGlzLmRvY1xuXHRcdFx0LmNoYW5nZUZvbnRTaXplKDE4KVxuXHRcdFx0LmFkZFRleHQodGhpcy5nZXRJbnZvaWNlVHlwZU5hbWUodGhpcy5pbnZvaWNlLmludm9pY2VUeXBlLCB0aGlzLmludm9pY2UuZ3JhbmRUb3RhbCksIFtNQVJHSU5fTEVGVCwgTUFSR0lOX1RPUCArIDkwXSlcblx0XHRcdC5jaGFuZ2VGb250KFBERl9GT05UUy5CT0xELCAxMilcblx0XHRcdC5hZGRUZXh0KGAke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uaW52b2ljZU51bWJlcn0gJHt0aGlzLmludm9pY2VOdW1iZXJ9YCwgW01BUkdJTl9MRUZULCBNQVJHSU5fVE9QICsgMTAwXSlcblx0XHRcdC5jaGFuZ2VGb250KFBERl9GT05UUy5SRUdVTEFSLCAxMSlcblx0XHRpZiAodGhpcy5pbnZvaWNlLmludm9pY2VUeXBlID09PSBJbnZvaWNlVHlwZS5JTlZPSUNFKSB7XG5cdFx0XHR0aGlzLmRvYy5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uYXNBZ3JlZWRCbG9jaywgW01BUkdJTl9MRUZULCBNQVJHSU5fVE9QICsgMTEwXSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVGhlIHRhYmxlIHdpdGggYWxsIGludm9pY2UgaXRlbXNcblx0ICovXG5cdGFzeW5jIHJlbmRlckludm9pY2VUYWJsZSgpIHtcblx0XHQvLyBEZWZpbmUgaGVhZGVycyBhbmQgY29sdW1uIHdpZHRoc1xuXHRcdGNvbnN0IGNvbHVtbnM6IFRhYmxlQ29sdW1uW10gPSBbXG5cdFx0XHR7IGhlYWRlck5hbWU6IEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucXVhbnRpdHksIGNvbHVtbldpZHRoOiAxOS44IH0sXG5cdFx0XHR7IGhlYWRlck5hbWU6IEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uaXRlbSwgY29sdW1uV2lkdGg6IDk1LjcgfSxcblx0XHRcdHsgaGVhZGVyTmFtZTogSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5zaW5nbGVQcmljZSwgY29sdW1uV2lkdGg6IDI0Ljc1IH0sXG5cdFx0XHR7IGhlYWRlck5hbWU6IEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0udG90YWxQcmljZSwgY29sdW1uV2lkdGg6IDI0Ljc1IH0sXG5cdFx0XVxuXHRcdGNvbnN0IHRhYmxlRGF0YTogQXJyYXk8QXJyYXk8c3RyaW5nPj4gPSBbXVxuXG5cdFx0Ly8gRmlsbCB0YWJsZSBkYXRhICh0d28gZW50cmllcyBhdCB0aGUgdGltZSkgYW5kIHJlbmRlciBpdFxuXHRcdGZvciAoY29uc3QgaW52b2ljZUl0ZW0gb2YgdGhpcy5pbnZvaWNlLml0ZW1zKSB7XG5cdFx0XHQvLyBFbnRyeSB3aXRoIGFsbCBpbnZvaWNlIGluZm9cblx0XHRcdHRhYmxlRGF0YS5wdXNoKFtcblx0XHRcdFx0dGhpcy5mb3JtYXRBbW91bnQoaW52b2ljZUl0ZW0uaXRlbVR5cGUsIGludm9pY2VJdGVtLmFtb3VudCksXG5cdFx0XHRcdGdldEludm9pY2VJdGVtVHlwZU5hbWUoaW52b2ljZUl0ZW0uaXRlbVR5cGUsIHRoaXMubGFuZ3VhZ2VDb2RlKSxcblx0XHRcdFx0aW52b2ljZUl0ZW0uc2luZ2xlUHJpY2UgPT0gbnVsbCA/IFwiXCIgOiB0aGlzLmZvcm1hdEludm9pY2VDdXJyZW5jeShpbnZvaWNlSXRlbS5zaW5nbGVQcmljZSksXG5cdFx0XHRcdHRoaXMuZm9ybWF0SW52b2ljZUN1cnJlbmN5KGludm9pY2VJdGVtLnRvdGFsUHJpY2UpLFxuXHRcdFx0XSlcblx0XHRcdC8vIEVudHJ5IHdpdGggZGF0ZSByYW5nZVxuXHRcdFx0dGFibGVEYXRhLnB1c2goW1wiXCIsIGAke3RoaXMuZm9ybWF0SW52b2ljZURhdGUoaW52b2ljZUl0ZW0uc3RhcnREYXRlKX0gLSAke3RoaXMuZm9ybWF0SW52b2ljZURhdGUoaW52b2ljZUl0ZW0uZW5kRGF0ZSl9YCwgXCJcIiwgXCJcIl0pXG5cdFx0fVxuXHRcdGNvbnN0IHRhYmxlRW5kUG9pbnQgPSBhd2FpdCB0aGlzLmRvYy5hZGRUYWJsZShbTUFSR0lOX0xFRlQsIE1BUkdJTl9UT1AgKyAxMjBdLCAxNjUsIGNvbHVtbnMsIHRhYmxlRGF0YSwgdGhpcy5nZXRUYWJsZVJvd3NGb3JGaXJzdFBhZ2UoKSlcblxuXHRcdHRoaXMucmVuZGVyVGFibGVTdW1tYXJ5KHRhYmxlRW5kUG9pbnQsIGNvbHVtbnMpXG5cdFx0dGhpcy5kb2MuY2hhbmdlVGV4dEN1cnNvclBvc2l0aW9uKFtNQVJHSU5fTEVGVCwgdGFibGVFbmRQb2ludCArIDQgKiBUQUJMRV9WRVJUSUNBTF9TUEFDSU5HXSlcblx0fVxuXG5cdC8qKlxuXHQgKiBTdW1tYXJ5IG9mIHRvdGFscyBhbmQgYXBwbGllZCBWQVQgYmVsb3cgdGhlIHJlbmRlcmVkIHRhYmxlXG5cdCAqL1xuXHRyZW5kZXJUYWJsZVN1bW1hcnkodGFibGVFbmRQb2ludDogbnVtYmVyLCBjb2x1bW5zOiBUYWJsZUNvbHVtbltdKSB7XG5cdFx0Ly8gTGluZSBicmVhayB0aGF0J3MgdG8gYmUgcmVtb3ZlZCBpZiBubyBWQVQgYXBwZWFycyBpbiB0aGUgc3VtbWFyeVxuXHRcdGxldCBhZGRpdGlvbmFsVmVydGljYWxTcGFjZSA9IDFcblxuXHRcdHRoaXMuZG9jLmNoYW5nZUZvbnQoUERGX0ZPTlRTLlJFR1VMQVIsIDExKVxuXG5cdFx0Ly8gU3ViIHRvdGFsXG5cdFx0dGhpcy5kb2MuYWRkVGFibGVSb3coW01BUkdJTl9MRUZULCB0YWJsZUVuZFBvaW50XSwgY29sdW1ucywgW1xuXHRcdFx0XCJcIixcblx0XHRcdFwiXCIsXG5cdFx0XHRJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnN1YlRvdGFsLFxuXHRcdFx0dGhpcy5mb3JtYXRJbnZvaWNlQ3VycmVuY3kodGhpcy5pbnZvaWNlLnN1YlRvdGFsKSxcblx0XHRdKVxuXHRcdC8vIFZBVFxuXHRcdGlmICh0aGlzLmludm9pY2UudmF0VHlwZSA9PT0gVmF0VHlwZS5BRERfVkFUKSB7XG5cdFx0XHQvLyBBZGRlZFZhdFxuXHRcdFx0dGhpcy5kb2MuYWRkVGFibGVSb3coW01BUkdJTl9MRUZULCB0YWJsZUVuZFBvaW50ICsgVEFCTEVfVkVSVElDQUxfU1BBQ0lOR10sIGNvbHVtbnMsIFtcblx0XHRcdFx0XCJcIixcblx0XHRcdFx0XCJcIixcblx0XHRcdFx0YCR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5hZGRlZFZhdH0gJHt0aGlzLmludm9pY2UudmF0UmF0ZX0ke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0udmF0UGVyY2VudH1gLFxuXHRcdFx0XHR0aGlzLmZvcm1hdEludm9pY2VDdXJyZW5jeSh0aGlzLmludm9pY2UudmF0KSxcblx0XHRcdF0pXG5cdFx0fSBlbHNlIGlmICh0aGlzLmludm9pY2UudmF0VHlwZSA9PT0gVmF0VHlwZS5WQVRfSU5DTFVERURfU0hPV04pIHtcblx0XHRcdC8vIEluY2x1ZGVkVmF0XG5cdFx0XHR0aGlzLmRvYy5hZGRUYWJsZVJvdyhbTUFSR0lOX0xFRlQsIHRhYmxlRW5kUG9pbnQgKyBUQUJMRV9WRVJUSUNBTF9TUEFDSU5HXSwgY29sdW1ucywgW1xuXHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRgJHtJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLmluY2x1ZGVkVmF0fSAke3RoaXMuaW52b2ljZS52YXRSYXRlfSR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS52YXRQZXJjZW50fWAsXG5cdFx0XHRcdHRoaXMuZm9ybWF0SW52b2ljZUN1cnJlbmN5KHRoaXMuaW52b2ljZS52YXQpLFxuXHRcdFx0XSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWRkaXRpb25hbFZlcnRpY2FsU3BhY2UgLT0gMVxuXHRcdH1cblx0XHQvLyBHcmFuZCB0b3RhbFxuXHRcdHRoaXMuZG9jLmNoYW5nZUZvbnQoUERGX0ZPTlRTLkJPTEQsIDExKVxuXHRcdHRoaXMuZG9jLmFkZFRhYmxlUm93KFtNQVJHSU5fTEVGVCwgdGFibGVFbmRQb2ludCArIChhZGRpdGlvbmFsVmVydGljYWxTcGFjZSArIDEpICogVEFCTEVfVkVSVElDQUxfU1BBQ0lOR10sIGNvbHVtbnMsIFtcblx0XHRcdFwiXCIsXG5cdFx0XHRcIlwiLFxuXHRcdFx0SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5ncmFuZFRvdGFsLFxuXHRcdFx0Ly8gaW4gY2FzZSBvZiBOT19WQVRfQ0hBUkdFX1RVVEFPIHdlIG11c3Qgbm90IHNob3cgdGhlIFZBVCBpbiB0aGUgaW52b2ljZSwgYnV0IHdlIHBheSB0aGUgdGF4ZXMgb3Vyc2VsdmVzLCBzbyB0aGV5IG5lZWQgdG8gYmUgZXhpc3Rpbmcgb24gdGhlIGludm9pY2Vcblx0XHRcdHRoaXMuZm9ybWF0SW52b2ljZUN1cnJlbmN5KHRoaXMuaW52b2ljZS52YXRUeXBlID09IFZhdFR5cGUuTk9fVkFUX0NIQVJHRV9UVVRBTyA/IHRoaXMuaW52b2ljZS5zdWJUb3RhbCA6IHRoaXMuaW52b2ljZS5ncmFuZFRvdGFsKSxcblx0XHRdKVxuXHR9XG5cblx0LyoqXG5cdCAqIEFkZGl0aW9uYWwgYmxvY2tzIGRpc3BsYXllZCBiZWxvdyB0aGUgdGFibGUgZGVwZW5kaW5nIG9uIGludm9pY2UgdHlwZSwgdmF0IHR5cGUgYW5kIHBheW1lbnQgbWV0aG9kXG5cdCAqL1xuXHRyZW5kZXJBZGRpdGlvbmFsKCkge1xuXHRcdHRoaXMuZG9jLmNoYW5nZUZvbnQoUERGX0ZPTlRTLlJFR1VMQVIsIDExKVxuXG5cdFx0Ly8gTm8gVkFUIC8gVkFUIG5vdCBzaG93biBpbiB0YWJsZVxuXHRcdHN3aXRjaCAodGhpcy5pbnZvaWNlLnZhdFR5cGUpIHtcblx0XHRcdGNhc2UgVmF0VHlwZS5BRERfVkFUOlxuXHRcdFx0Y2FzZSBWYXRUeXBlLlZBVF9JTkNMVURFRF9TSE9XTjpcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgVmF0VHlwZS5OT19WQVQ6XG5cdFx0XHRcdGlmICh0aGlzLmludm9pY2UudmF0SWROdW1iZXIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHRoaXMuZG9jXG5cdFx0XHRcdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnJldmVyc2VDaGFyZ2VWYXRJZE51bWJlcjEpXG5cdFx0XHRcdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdFx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucmV2ZXJzZUNoYXJnZVZhdElkTnVtYmVyMilcblx0XHRcdFx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0XHRcdFx0LmFkZFRleHQoYCR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS55b3VyVmF0SWR9IGApXG5cdFx0XHRcdFx0XHQuY2hhbmdlRm9udChQREZfRk9OVFMuQk9MRCwgMTEpXG5cdFx0XHRcdFx0XHQuYWRkVGV4dChgJHt0aGlzLmludm9pY2UudmF0SWROdW1iZXJ9YClcblx0XHRcdFx0XHRcdC5jaGFuZ2VGb250KFBERl9GT05UUy5SRUdVTEFSLCAxMSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmRvYy5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ubmV0UHJpY2VzTm9WYXRJbkdlcm1hbnkpXG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgVmF0VHlwZS5OT19WQVRfQ0hBUkdFX1RVVEFPOlxuXHRcdFx0XHR0aGlzLmRvY1xuXHRcdFx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucmV2ZXJzZUNoYXJnZUFmZmlsaWF0ZSlcblx0XHRcdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnJldmVyc2VDaGFyZ2VWYXRJZE51bWJlcjIpXG5cdFx0XHRcdGlmICh0aGlzLmludm9pY2UudmF0SWROdW1iZXIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHRoaXMuZG9jXG5cdFx0XHRcdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdFx0XHRcdC5hZGRUZXh0KGAke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ueW91clZhdElkfSBgKVxuXHRcdFx0XHRcdFx0LmNoYW5nZUZvbnQoUERGX0ZPTlRTLkJPTEQsIDExKVxuXHRcdFx0XHRcdFx0LmFkZFRleHQoYCR7dGhpcy5pbnZvaWNlLnZhdElkTnVtYmVyfWApXG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgVmF0VHlwZS5WQVRfSU5DTFVERURfSElEREVOOlxuXHRcdFx0XHR0aGlzLmRvYy5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ubm9WYXRJbkdlcm1hbnkpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIFZhdFR5cGUgXCIgKyB0aGlzLmludm9pY2UudmF0VHlwZSlcblx0XHR9XG5cdFx0dGhpcy5kb2MuYWRkTGluZUJyZWFrKClcblx0XHR0aGlzLmRvYy5hZGRMaW5lQnJlYWsoKVxuXG5cdFx0Ly8gUGF5bWVudCBpbmZvXG5cdFx0aWYgKHRoaXMuaW52b2ljZS5pbnZvaWNlVHlwZSA9PT0gSW52b2ljZVR5cGUuSU5WT0lDRSkge1xuXHRcdFx0c3dpdGNoICh0aGlzLmludm9pY2UucGF5bWVudE1ldGhvZCkge1xuXHRcdFx0XHRjYXNlIFBheW1lbnRNZXRob2QuSU5WT0lDRTpcblx0XHRcdFx0XHR0aGlzLmRvY1xuXHRcdFx0XHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZUR1ZTEpXG5cdFx0XHRcdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdFx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudEludm9pY2VEdWUyKVxuXHRcdFx0XHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHRcdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdFx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudEludm9pY2VIb2xkZXIpXG5cdFx0XHRcdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdFx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudEludm9pY2VCYW5rKVxuXHRcdFx0XHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHRcdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnBheW1lbnRJbnZvaWNlSUJBTilcblx0XHRcdFx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0XHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZUJJQylcblx0XHRcdFx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0XHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZVByb3ZpZGVOdW1iZXIxKVxuXHRcdFx0XHRcdFx0LmNoYW5nZUZvbnQoUERGX0ZPTlRTLkJPTEQsIDExKVxuXHRcdFx0XHRcdFx0LmFkZFRleHQoYCAke3RoaXMuaW52b2ljZU51bWJlcn0gYClcblx0XHRcdFx0XHRcdC5jaGFuZ2VGb250KFBERl9GT05UUy5SRUdVTEFSLCAxMSlcblx0XHRcdFx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0XHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZVByb3ZpZGVOdW1iZXIyKVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGNhc2UgUGF5bWVudE1ldGhvZC5DUkVESVRfQ0FSRDpcblx0XHRcdFx0XHR0aGlzLmRvYy5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudENyZWRpdENhcmQpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBQYXltZW50TWV0aG9kLlBBWVBBTDpcblx0XHRcdFx0XHR0aGlzLmRvYy5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudFBheXBhbClcblx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRjYXNlIFBheW1lbnRNZXRob2QuQUNDT1VOVF9CQUxBTkNFOlxuXHRcdFx0XHRcdHRoaXMuZG9jLmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50QWNjb3VudEJhbGFuY2UpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHRcdHRoaXMuZG9jLmFkZExpbmVCcmVhaygpLmFkZExpbmVCcmVhaygpLmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS50aGFua1lvdSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGxlZ2FsIGRpc2NsYWltZXIgaW5mbyBhdCB0aGUgYm90dG9tIG9mIHRoZSBsYXN0IHBhZ2Vcblx0ICovXG5cdHJlbmRlckxlZ2FsRGlzY2xhaW1lcigpIHtcblx0XHR0aGlzLmRvY1xuXHRcdFx0LmNoYW5nZUZvbnQoUERGX0ZPTlRTLlJFR1VMQVIsIDEwKVxuXHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5sZWdhbE5vU2lnbmVkLCBbTUFSR0lOX0xFRlQsIE1BUkdJTl9UT1AgKyAyNDBdKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkTGluZUJyZWFrKClcblx0XHRcdC5jaGFuZ2VUZXh0R3JheXNjYWxlKDAuNSlcblx0XHRcdC5hZGRUZXh0KEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ubGVnYWxSZXByZXNlbnRlZCwgW01BUkdJTl9MRUZULCBNQVJHSU5fVE9QICsgMjUwXSlcblx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5sZWdhbFJlZ2lzdHJhdGlvbilcblx0XHRcdC5hZGRMaW5lQnJlYWsoKVxuXHRcdFx0LmFkZFRleHQoSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5sZWdhbFZhdElkZW50aWZpY2F0aW9uKVxuXHRcdFx0LmFkZExpbmVCcmVhaygpXG5cdFx0XHQuYWRkVGV4dChJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLmxlZ2FsQmFua0FjY291bnQpXG5cdH1cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBob3cgbWFueSB0YWJsZSByb3dzIChpbnZvaWNlIGl0ZW1zKSBjYW4gYmUgcmVuZGVyZWQgb24gdGhlIGZpcnN0IHBhZ2UgZGVwZW5kaW5nIG9uIHRoZSB0ZXh0cyB0aGF0IGZvbGxvdyBhZnRlciB0aGUgdGFibGVcblx0ICovXG5cdGdldFRhYmxlUm93c0ZvckZpcnN0UGFnZSgpOiBudW1iZXIge1xuXHRcdGlmIChcblx0XHRcdHRoaXMuaW52b2ljZS5wYXltZW50TWV0aG9kID09PSBQYXltZW50TWV0aG9kLklOVk9JQ0UgJiZcblx0XHRcdHRoaXMuaW52b2ljZS52YXRJZE51bWJlciAhPSBudWxsICYmXG5cdFx0XHQvLyBOZWVkcyBmaXggQGFybSwgQGp1ZywgQGpvcFxuXHRcdFx0KHRoaXMuaW52b2ljZS52YXRUeXBlID09PSBWYXRUeXBlLk5PX1ZBVCB8fCB0aGlzLmludm9pY2UudmF0VHlwZSA9PT0gVmF0VHlwZS5OT19WQVRfQ0hBUkdFX1RVVEFPKVxuXHRcdCkge1xuXHRcdFx0Ly8gSW4gdGhlc2Ugc2NlbmFyaW9zLCB0aGVyZSB3aWxsIGJlIGEgbG90IG9mIHRleHQgYWZ0ZXIgdGhlIHRhYmxlIHN1bW1hcnksIHNvIGZldyByb3dzIGNhbiByZW5kZXJcblx0XHRcdHJldHVybiA0XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEluIGFsbCBvdGhlciBzY2VuYXJpb3MsIHRoZXJlIHdpbGwgYmUgbGl0dGxlIHRleHQgYWZ0ZXIgdGhlIHRhYmxlIHN1bW1hcnksIHNvIG1vcmUgcm93cyBjYW4gcmVuZGVyXG5cdFx0XHRyZXR1cm4gOFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgdGhlIG5hbWUgb2YgYSBnaXZlbiBJbnZvaWNlVHlwZVxuXHQgKi9cblx0Z2V0SW52b2ljZVR5cGVOYW1lKHR5cGU6IE51bWJlclN0cmluZywgYW1vdW50OiBOdW1iZXJTdHJpbmcpOiBzdHJpbmcge1xuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSBJbnZvaWNlVHlwZS5JTlZPSUNFOlxuXHRcdFx0XHRyZXR1cm4gSW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5pbnZvaWNlXG5cdFx0XHRjYXNlIEludm9pY2VUeXBlLkNSRURJVDpcblx0XHRcdFx0cmV0dXJuIEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uY3JlZGl0XG5cdFx0XHRjYXNlIEludm9pY2VUeXBlLlJFRkVSUkFMX0NSRURJVDpcblx0XHRcdFx0aWYgKHBhcnNlRmxvYXQoYW1vdW50KSA+PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uY3JlZGl0XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0uY2FuY2VsQ3JlZGl0XG5cdFx0XHRcdH1cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgSW52b2ljZVR5cGUgXCIgKyB0eXBlKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBGb3JtYXQgdGhlIGRhdGUgZGVwZW5kaW5nIG9uIGRvY3VtZW50IGxhbmd1YWdlIChkZC5tbS55eXl5KSAvIChkZC4gTW9uIHl5eXkpXG5cdCAqL1xuXHRmb3JtYXRJbnZvaWNlRGF0ZShkYXRlOiBEYXRlIHwgbnVsbCk6IHN0cmluZyB7XG5cdFx0aWYgKGRhdGUgPT0gbnVsbCkgcmV0dXJuIFwiXCJcblx0XHRpZiAodGhpcy5sYW5ndWFnZUNvZGUgPT09IFwiZGVcIikge1xuXHRcdFx0cmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZGUtREVcIiwge1xuXHRcdFx0XHRkYXk6IFwiMi1kaWdpdFwiLFxuXHRcdFx0XHRtb250aDogXCIyLWRpZ2l0XCIsXG5cdFx0XHRcdHllYXI6IFwibnVtZXJpY1wiLFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVUtcIiwge1xuXHRcdFx0XHRkYXk6IFwiMi1kaWdpdFwiLFxuXHRcdFx0XHRtb250aDogXCJzaG9ydFwiLFxuXHRcdFx0XHR5ZWFyOiBcIm51bWVyaWNcIixcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEZvcm1hdCB0aGUgY3VycmVuY3kgc2VwYXJhdG9yIChkb3QsIGNvbW1hKSBkZXBlbmRpbmcgb24gdGhlIGNvdW50cnlcblx0ICovXG5cdGZvcm1hdEludm9pY2VDdXJyZW5jeShwcmljZTogc3RyaW5nIHwgbnVtYmVyKTogc3RyaW5nIHtcblx0XHRwcmljZSA9IGAke3ByaWNlfSBFVVJgXG5cdFx0cmV0dXJuIHRoaXMubGFuZ3VhZ2VDb2RlID09PSBcImRlXCIgPyBwcmljZS5yZXBsYWNlKFwiLlwiLCBcIixcIikgOiBwcmljZVxuXHR9XG5cblx0LyoqXG5cdCAqIEZvcm1hdCB0aGUgYW1vdW50IG9mIHN0b3JhZ2UgaW50byB0aGUgYXBwcm9wcmlhdGUgYnl0ZSB1bml0IGlmIHRoZSBpdGVtIGlzIGEgbGVnYWN5IHN0b3JhZ2UgcGFja2FnZS4gT3RoZXJ3aXNlLCByZXR1cm4gYXMgaXNcblx0ICovXG5cdGZvcm1hdEFtb3VudChpdGVtVHlwZTogc3RyaW5nLCBhbW91bnQ6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0aWYgKGl0ZW1UeXBlID09PSBJbnZvaWNlSXRlbVR5cGUuU3RvcmFnZVBhY2thZ2UgfHwgaXRlbVR5cGUgPT09IEludm9pY2VJdGVtVHlwZS5TdG9yYWdlUGFja2FnZVVwZ3JhZGUpIHtcblx0XHRcdGNvbnN0IG51bUFtb3VudCA9IE51bWJlcihhbW91bnQpXG5cdFx0XHRyZXR1cm4gbnVtQW1vdW50IDwgMTAwMCA/IGAke2Ftb3VudH0gR0JgIDogYCR7bnVtQW1vdW50IC8gMTAwMH0gVEJgXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBhbW91bnRcblx0XHR9XG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7SUFLWSxrQ0FBTDtBQUNOO0FBQ0E7QUFDQTs7QUFDQTtJQUVXLG9DQUFMO0FBQ047QUFDQTs7QUFDQTtJQUVXLHNEQUFMO0FBQ047QUFDQTs7QUFDQTtNQUlZLGFBQWE7TUFDYixjQUFjO01BQ2QseUJBQXlCO0FBQ3RDLE1BQU0sd0JBQXdCO0FBQzlCLE1BQU0sZUFBZTtBQUNyQixNQUFNLGNBQWM7QUFDcEIsTUFBTUEsa0JBQTBDLENBQUMsR0FBRyxDQUFFO0FBRXRELE1BQU0sb0JBQW9CLGFBQWEsWUFBWSxhQUFhLENBQUM7QUFJakUsTUFBTSwyQkFB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