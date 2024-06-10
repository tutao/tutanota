export enum PdfStreamEncoding {
	NONE = "NONE",
	FLATE = "/FlateDecode",
	DCT = "/DCTDecode",
}

export interface PdfObjectRef {
	refId: string
}

export type PdfDictValue = string | PdfObjectRef | PdfDictValue[] | Map<string, PdfDictValue>
export const NEW_LINE = "\n"
export const GENERATION_NUMBER = "0"

// Widths of the glyphs in each font. The unit is 1/1000 of a PostScript point. Array is in unicode order starting with the glyph at 0x20 (Space character)
// To (re)generate these width arrays, use the script provided in tuta docs
export const regularFontWidths: number[] = [
	200, 289, 426, 497, 497, 824, 609, 249, 303, 303, 418, 497, 249, 311, 249, 350, 497, 497, 497, 497, 497, 497, 497, 497, 497, 497, 249, 249, 497, 497, 497,
	425, 847, 544, 588, 571, 615, 527, 494, 617, 652, 263, 480, 579, 486, 727, 647, 664, 566, 664, 569, 534, 536, 645, 515, 786, 513, 476, 539, 303, 350, 303,
	497, 500, 542, 504, 553, 456, 555, 496, 292, 504, 544, 246, 247, 495, 255, 829, 547, 542, 555, 555, 347, 419, 338, 544, 467, 719, 446, 467, 425, 303, 241,
	303, 497, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
	1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 200, 289, 497, 497, 497, 497, 241, 497, 542, 744, 345, 429, 497, 423, 423, 542, 331, 497, 367,
	367, 542, 562, 560, 249, 542, 367, 365, 429, 781, 808, 796, 425, 544, 544, 544, 544, 544, 544, 822, 571, 527, 527, 527, 527, 263, 263, 263, 263, 639, 647,
	664, 664, 664, 664, 664, 497, 664, 645, 645, 645, 645, 476, 576, 576, 504, 504, 504, 504, 504, 504, 778, 456, 496, 496, 496, 496, 246, 246, 246, 246, 544,
	547, 542, 542, 542, 542, 542, 497, 542, 544, 544, 544, 544, 467, 555, 467,
]
export const boldFontWidths: number[] = [
	200, 340, 537, 528, 528, 857, 667, 300, 344, 344, 457, 528, 300, 332, 300, 339, 528, 528, 528, 528, 528, 528, 528, 528, 528, 528, 300, 300, 528, 528, 528,
	463, 902, 573, 605, 582, 635, 548, 524, 638, 674, 301, 509, 614, 518, 762, 665, 684, 596, 684, 613, 556, 556, 665, 556, 813, 567, 525, 541, 344, 339, 344,
	528, 500, 555, 527, 573, 467, 573, 518, 341, 534, 571, 276, 278, 548, 286, 857, 572, 555, 573, 573, 398, 443, 383, 568, 523, 776, 514, 521, 460, 344, 268,
	344,
]

/**
 * All PDF documents require "default objects" which define many basic aspects for PDF. These objects are defined here as constants
 */
export const PDF_DEFAULT_OBJECTS = Object.freeze([
	Object.freeze({
		// Catalog object. Acts as starting object / entry point
		refId: "CATALOG",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/Catalog"],
			["Pages", { refId: "PAGES" }],
			["PageLayout", "/SinglePage"],
			["Metadata", { refId: "METADATA" }],
			["MarkInfo", "<< /Marked true >>"],
			["OutputIntents", [{ refId: "OUTPUT_INTENT" }]],
			["StructTreeRoot", { refId: "STRUCT_TREE_ROOT" }],
		]),
	}),
	Object.freeze({
		// Object specifying how the PDF should be rendered. Required for PDF/A
		refId: "OUTPUT_INTENT",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/OutputIntent"],
			["S", "/GTS_PDFA1"],
			["OutputConditionIdentifier", "(sRGB)"],
			["Info", "(sRGB)"],
			["DestOutputProfile", { refId: "DEST_OUTPUT_PROFILE" }],
		]),
	}),
	Object.freeze({
		// Object specifying the structure of the PDF for accessibility. Required for PDF/A
		refId: "STRUCT_TREE_ROOT",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/StructTreeRoot"],
			["K", "[ null ]"],
		]),
	}),
	Object.freeze({
		// Resources object. Keeps references to all used resources, i.e. fonts and images.
		refId: "RESOURCES",
		dictionary: new Map<string, PdfDictValue>([
			["ProcSet", "[/PDF/Text]"],
			[
				"XObject",
				new Map<string, PdfDictValue>([
					["Im1", { refId: "IMG_TUTA_LOGO" }],
					["Im2", { refId: "IMG_ADDRESS" }],
				]),
			],
			[
				"Font",
				new Map<string, PdfObjectRef>([
					["F1", { refId: "FONT_REGULAR" }],
					["F2", { refId: "FONT_BOLD" }],
					["F3", { refId: "FONT_INVISIBLE_CID" }],
				]),
			],
		]),
	}),
	Object.freeze({
		// Regular font
		refId: "FONT_REGULAR",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/Font"],
			["Subtype", "/TrueType"],
			["FontDescriptor", { refId: "FONT_REGULAR_DESCRIPTOR" }],
			["Name", "/F1"],
			["BaseFont", "/SourceSans3-Regular"],
			["Encoding", "/WinAnsiEncoding"],
			["FirstChar", "32"],
			["LastChar", "256"],
			["Widths", regularFontWidths.map((width) => width.toString())],
		]),
	}),
	Object.freeze({
		refId: "FONT_REGULAR_DESCRIPTOR",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/FontDescriptor"],
			["FontName", "/SourceSans3-Regular"],
			["FontFile2", { refId: "FONT_REGULAR_FILE" }],
			["Subtype", "/TrueType"],
			["Flags", "64"],
		]),
	}),
	Object.freeze({
		// Bold font
		refId: "FONT_BOLD",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/Font"],
			["Subtype", "/TrueType"],
			["FontDescriptor", { refId: "FONT_BOLD_DESCRIPTOR" }],
			["Name", "/F2"],
			["BaseFont", "/SourceSans3-Bold"],
			["Encoding", "/WinAnsiEncoding"],
			["FirstChar", "32"],
			["LastChar", "125"],
			["Widths", boldFontWidths.map((width) => width.toString())],
		]),
	}),
	Object.freeze({
		refId: "FONT_BOLD_DESCRIPTOR",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/FontDescriptor"],
			["FontName", "/SourceSans3-Bold"],
			["FontFile2", { refId: "FONT_BOLD_FILE" }],
			["Subtype", "/TrueType"],
			["Flags", "64"],
		]),
	}),
	// Invisible font for the purpose of writing full UTF8, selectable ghost text.
	// We use external Helvetica as a standard PDF font to try to get as much compatibility as possible since external fonts are very unsafe to use.
	Object.freeze({
		refId: "FONT_INVISIBLE_CID",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/Font"],
			["BaseFont", "/Helvetica"],
			["Subtype", "/Type0"],
			["Encoding", "/Identity-H"],
			["DescendantFonts", [{ refId: "FONT_INVISIBLE_CID_DESCENDANT" }]],
			["ToUnicode", { refId: "CMAP" }],
		]),
	}),
	Object.freeze({
		refId: "FONT_INVISIBLE_CID_DESCENDANT",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/Font"],
			["BaseFont", "/Helvetica"],
			["Subtype", "/CIDFontType2"],
			["CIDToGIDMap", "/Identity"],
			["FontDescriptor", { refId: "FONT_INVISIBLE_CID_DESCRIPTOR" }],
			["CIDSystemInfo", "<< /Registry (Adobe) /Ordering (Identity) /Supplement 0>>"],
			["DW", "1000"],
		]),
	}),
	Object.freeze({
		refId: "FONT_INVISIBLE_CID_DESCRIPTOR",
		dictionary: new Map<string, PdfDictValue>([
			["Type", "/FontDescriptor"],
			["FontName", "/Helvetica"],
			["Subtype", "/TrueType"],
			["Flags", "64"],
		]),
	}),
])
