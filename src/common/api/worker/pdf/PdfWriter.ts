import { PdfObject } from "./PdfObject.js"
import { GENERATION_NUMBER, NEW_LINE, PDF_DEFAULT_OBJECTS, PdfDictValue, PdfObjectRef, PdfStreamEncoding } from "./PdfConstants.js"
import { PdfStreamObject } from "./PdfStreamObject.js"
import { concat, hexToUint8Array } from "@tutao/tutanota-utils"
import { Deflater } from "./Deflater.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"

// Binary header specifying the PDF version (2.0 = "322e30") and the fact that binary data is present in the file
const PDF_HEADER = hexToUint8Array("255044462d322e300a25e2e3cfd30a")
// Special PDF object with number 0. Only appears in xref table
const ZERO_OBJECT_ENTRY = "0000000000 65535 f"

type GlobalFetch = typeof global.fetch

/**
 * Object which manages the low-level building of a PDF document by managing objects and their relation to each other.
 * For high-level functionality see "PdfDocument" class
 */
export class PdfWriter {
	private readonly textEncoder: TextEncoder
	private byteLengthPosition = PDF_HEADER.byteLength
	private pdfObjectList: PdfObject[] = []
	private referenceTable: Map<string, PdfObject> = new Map<string, PdfObject>()
	private customFetch: GlobalFetch | undefined
	private deflater: Deflater
	private cachedResources: ArrayBuffer[] | undefined

	constructor(textEncoder: TextEncoder, customFetch: GlobalFetch | undefined) {
		this.textEncoder = textEncoder
		this.customFetch = customFetch
		this.deflater = new Deflater()
		this.cachedResources = undefined
	}

	/**
	 * Add all PDF default objects to this writer that are necessary for any functioning document, see "PdfConstants"
	 */
	setupDefaultObjects() {
		for (const object of PDF_DEFAULT_OBJECTS) {
			this.createObject(object.dictionary, object.refId)
		}
	}

	/**
	 * Create a new PDF object
	 * @param objectDictionary Map of the object dictionary
	 * @param refId ID by which other objects can reference this object
	 */
	createObject(objectDictionary: Map<string, PdfDictValue>, refId: string = ""): void {
		if (this.referenceTable.has(refId)) {
			throw new ProgrammingError(`already defined object refId ${refId}`)
		}
		const obj = new PdfObject(this.pdfObjectList.length + 1, objectDictionary)
		if (refId.length > 0) {
			this.referenceTable.set(refId, obj)
		}
		this.pdfObjectList.push(obj)
	}

	/**
	 * Create a new PDF object with stream data
	 * @param objectDictionary Map of the object dictionary. Must not provide stream-specific data
	 * @param stream The stream of the object
	 * @param streamEncoding The encoding of the stream
	 * @param refId ID by which other objects can reference this object
	 */
	createStreamObject(objectDictionary: Map<string, PdfDictValue>, stream: Uint8Array, streamEncoding: PdfStreamEncoding, refId: string = ""): void {
		if (this.referenceTable.has(refId)) {
			throw new ProgrammingError(`already defined stream refId ${refId}`)
		}
		const obj = new PdfStreamObject(this.pdfObjectList.length + 1, objectDictionary, stream, streamEncoding)
		if (refId.length > 0) {
			this.referenceTable.set(refId, obj)
		}
		this.pdfObjectList.push(obj)
	}

	/**
	 * Get a PDF object added to this writer by its ID
	 * @param refId The id of the desired object
	 */
	getObjectByRefId(refId: string): PdfObject {
		const obj = this.referenceTable.get(refId)
		if (obj != null) {
			return obj
		} else {
			throw new Error(`Invalid ReferenceId: ${refId}. No object was found that has this refId. Reference can't be resolved, aborting...`)
		}
	}

	/**
	 * Write the cross-reference table of the PDF which is a special object lookup table for PDF readers
	 */
	makeXRefTable(): string {
		let xref = `xref${NEW_LINE}0 ${this.pdfObjectList.length + 1}${NEW_LINE}${ZERO_OBJECT_ENTRY} ${NEW_LINE}`
		for (const pdfObject of this.pdfObjectList) {
			if (pdfObject.getBytePosition() === -1) throw new Error(`Found an object with invalid byte-position! ${pdfObject.getObjectNumber()}`)
			// Replace the "0000000000" value with the byte-position but keep all leading zeros
			xref += `${("0000000000" + pdfObject.getBytePosition()).slice(-10)} 00000 n ${NEW_LINE}`
		}
		return xref
	}

	/**
	 * Write the trailer of the PDF which is a special object pointing at the "Catalog object" and additional metadata
	 * @param identifier A preferably unique string
	 */
	makeTrailer(identifier: string): string {
		let trailer = `trailer${NEW_LINE}<<${NEW_LINE}`
		trailer += `/Size ${this.pdfObjectList.length + 1}`
		trailer += `/Root ${this.pdfReferenceToString({ refId: "CATALOG" })}`
		trailer += `/ID [(${identifier})(${identifier})]`
		trailer += `${NEW_LINE}>>${NEW_LINE}startxref${NEW_LINE}${this.byteLengthPosition}${NEW_LINE}%%EOF`
		return trailer
	}

	/**
	 * Resolve all references to other objects in a PDF dictionary
	 * This replaces every refId with the string "objNumber 0 R" which is PDF syntax for referencing other objects
	 * Returns the PDF dictionary as Map of <string, string> allowing it to be encoded
	 * @param objDictionary The dictionary t
	 */
	resolveReferences(objDictionary: Map<string, PdfDictValue>): Map<string, string> {
		const newMap = new Map<string, string>()
		for (const [key, value] of objDictionary) {
			newMap.set(key, this.resolveDictValue(value))
		}
		return newMap
	}

	/**
	 * Resolve a PdfDictValue into its string equivalent
	 * @param value Value to resolve
	 */
	resolveDictValue(value: PdfDictValue): string {
		if (typeof value !== "string") {
			if (value instanceof Map) {
				// Value is a nested directory, recursively resolve all references in the nested directory and convert to string
				return this.pdfDictionaryToString(value)
			} else if (Array.isArray(value)) {
				// Value is a list, iterate over all elements, resolve them if necessary and convert to string
				return this.pdfListToString(value)
			} else {
				// Value is a singular reference, resolve it into a string
				return this.pdfReferenceToString(value)
			}
		} else {
			// Value is a string, keep it
			return value
		}
	}

	pdfReferenceToString(objectReference: PdfObjectRef): string {
		const referencedObject = this.getObjectByRefId(objectReference.refId)
		return `${referencedObject.getObjectNumber()} ${GENERATION_NUMBER} R`
	}

	pdfListToString(objectReferences: PdfDictValue[]): string {
		let referenceString = "[" + " "
		for (const objRef of objectReferences) {
			referenceString += this.resolveDictValue(objRef) + " "
		}
		referenceString += "]"
		return referenceString
	}

	pdfDictionaryToString(objectReferenceDict: Map<string, PdfDictValue>): string {
		let referenceString = "<<" + " "
		for (const [key, value] of objectReferenceDict) {
			referenceString += `/${key} ${this.resolveDictValue(value)} `
		}
		referenceString += ">>"
		return referenceString
	}

	/**
	 * Calculate the byte-position for a given object
	 * @param object The object that should have its byte-position be calculated
	 * @param encodedObject The provided object in encoded format to allow calculation for the next object
	 */
	calculateBytePositions(object: PdfObject, encodedObject: Uint8Array) {
		object.setBytePosition(this.byteLengthPosition)
		this.byteLengthPosition += encodedObject.byteLength
	}

	/**
	 * Add all resource objects (stream objects) to the PDF. These are referenced by the "default objects" but need to be dynamically generated because they
	 * include a huge amount of stream data / need to read their stream data in from external resources (base64 encoded)
	 */
	async setupResourceObjects() {
		const baseUrl = typeof location === "undefined" ? "" : location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "")
		if (!this.cachedResources) {
			this.cachedResources = await Promise.all(
				[
					"/pdf/SourceSans3-Regular.ttf",
					"/pdf/SourceSans3-Bold.ttf",
					"/pdf/sRGB2014.icc",
					"/pdf/identity_h.cmap",
					"/pdf/tutanota_logo_en.jpg",
					"/pdf/metadata.xml",
				].map((url) =>
					typeof this.customFetch !== "undefined"
						? this.customFetch(baseUrl + url).then((r) => r.arrayBuffer())
						: fetch(baseUrl + url).then((r) => r.arrayBuffer()),
				),
			)
		}
		const [fontRegular, fontBold, colorProfile, cmap, tutaImage, metaData] = this.cachedResources

		// Regular font file
		this.createStreamObject(
			new Map([["Length1", fontRegular.byteLength.toString()]]),
			await this.deflater.deflate(fontRegular),
			PdfStreamEncoding.FLATE,
			"FONT_REGULAR_FILE",
		)
		// Bold font file
		this.createStreamObject(
			new Map([["Length1", fontBold.byteLength.toString()]]),
			await this.deflater.deflate(fontBold),
			PdfStreamEncoding.FLATE,
			"FONT_BOLD_FILE",
		)
		// Identity CMap
		this.createStreamObject(
			new Map([
				["Type", "/CMap"],
				["CMapName", "/Identity-H "],
				["CIDSystemInfo", "<< /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>"],
			]),
			await this.deflater.deflate(cmap),
			PdfStreamEncoding.FLATE,
			"CMAP",
		)
		// Color profile
		this.createStreamObject(
			new Map([
				["Length1", colorProfile.byteLength.toString()],
				["N", "3"],
			]),
			await this.deflater.deflate(colorProfile),
			PdfStreamEncoding.FLATE,
			"DEST_OUTPUT_PROFILE",
		)
		// Tuta logo as raster image
		this.createStreamObject(
			new Map([
				["Name", "/Im1"],
				["Type", "/XObject"],
				["Subtype", "/Image"],
				["Width", "600"],
				["Height", "209"],
				["BitsPerComponent", "8"],
				["ColorSpace", "/DeviceRGB"],
			]),
			new Uint8Array(tutaImage),
			PdfStreamEncoding.DCT,
			"IMG_TUTA_LOGO",
		)
		// Metadata
		this.createStreamObject(
			new Map([
				["Type", "/Metadata"],
				["Subtype", "/XML"],
			]),
			new Uint8Array(metaData),
			PdfStreamEncoding.NONE,
			"METADATA",
		)
	}

	/**
	 * Writes the PDF file and return its entire data as a Uint8Array
	 * @pre baseUrl must be defined
	 */
	async writePdfFile(): Promise<Uint8Array> {
		// Set up the objects requiring external resources last
		await this.setupResourceObjects()

		// Encode all components of the file into uint8arrays for writing
		const encodedObjects: Uint8Array[] = []
		encodedObjects.push(PDF_HEADER) // Header is written at the top of the file
		for (const obj of this.pdfObjectList) {
			// Body includes all objects and streams
			obj.setResolvedDictionary(this.resolveReferences(obj.getDictionary())) // With all objects present, resolve all their references
			const encodedObject = obj.encodeToUInt8Array(this.textEncoder) // Encode the object to uint8array
			this.calculateBytePositions(obj, encodedObject) // Calculate the objects byte-position by considering its encoded form
			encodedObjects.push(encodedObject)
		}
		encodedObjects.push(this.textEncoder.encode(this.makeXRefTable())) // Make xref table which requires all object's calculated byte-positions
		encodedObjects.push(this.textEncoder.encode(this.makeTrailer(Date.now().toString()))) // Make trailer

		return concat(...encodedObjects)
	}
}
