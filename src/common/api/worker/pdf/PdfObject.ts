import { GENERATION_NUMBER, NEW_LINE, PdfDictValue } from "./PdfConstants.js"

/**
 * Class representing objects in PDF.
 * Holds data in form of an associative array which mirror the actual PDF object's "object dictionary"
 */
export class PdfObject {
	protected readonly objectNumber: number
	protected bytePosition: number = -1
	protected objectDictionary: Map<string, PdfDictValue> = new Map<string, PdfDictValue>()

	constructor(objectNumber: number, objectDictionary: Map<string, PdfDictValue>) {
		this.objectNumber = objectNumber
		this.objectDictionary = objectDictionary
	}

	public getDictionary(): Map<string, PdfDictValue> {
		return this.objectDictionary
	}

	public getObjectNumber() {
		return this.objectNumber
	}

	public getBytePosition(): number {
		return this.bytePosition
	}

	/**
	 * Set the dictionary of the object to be one with all references resolved (string, string)
	 */
	public setResolvedDictionary(map: Map<string, string>) {
		this.objectDictionary = map
	}

	/**
	 * Set the byte-position of the object which is the byte in the PDF file at which the object's declaration starts
	 */
	public setBytePosition(bytePosition: number) {
		this.bytePosition = bytePosition
	}

	/**
	 * Encode the object into a Uint8Array to enable writing it into a buffer / file
	 * @param textEncoder
	 */
	public encodeToUInt8Array(textEncoder: TextEncoder): Uint8Array {
		return new Uint8Array([...textEncoder.encode(this.parseObjectHead()), ...textEncoder.encode(this.parseObjectTail())])
	}

	/**
	 * Convert the object's head data into PDF syntax
	 */
	public parseObjectHead(): string {
		let head = `${this.objectNumber} ${GENERATION_NUMBER} obj${NEW_LINE}<<${NEW_LINE}`
		for (const [key, val] of this.objectDictionary) {
			if (typeof val !== "string")
				throw new Error(
					`Unresolved reference in object: ${this.objectNumber}. Unresolved reference found as value of: "${key}". Cannot encode an object that has unresolved references, aborting...`,
				)
			head += `/${key} ${val}`
		}
		head += `${NEW_LINE}>>${NEW_LINE}`
		return head
	}

	/**
	 * Convert the object's tail data into PDF syntax
	 */
	public parseObjectTail(): string {
		return `endobj${NEW_LINE}`
	}
}
