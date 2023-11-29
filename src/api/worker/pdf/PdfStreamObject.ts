import { PdfObject } from "./PdfObject.js"
import { GENERATION_NUMBER, NEW_LINE, PdfDictValue, PdfStreamEncoding } from "./PdfConstants.js"

/**
 * PDF object with an additional stream.
 * The stream requires different encoding syntax
 */
export class PdfStreamObject extends PdfObject {
	private readonly stream: Uint8Array

	constructor(objectNumber: number, objectDictionary: Map<string, PdfDictValue>, stream: Uint8Array, streamEncoding: PdfStreamEncoding) {
		super(objectNumber, objectDictionary)
		this.stream = stream
		if (streamEncoding !== "NONE") {
			this.objectDictionary.set("Filter", streamEncoding)
		}
		this.objectDictionary.set("Length", stream.byteLength.toString())
	}

	public encodeToUInt8Array(textEncoder: TextEncoder): Uint8Array {
		return new Uint8Array([...textEncoder.encode(this.parseObjectHead()), ...this.stream, ...textEncoder.encode(this.parseObjectTail())])
	}

	public parseObjectHead(): string {
		let head = `${this.objectNumber} ${GENERATION_NUMBER} obj${NEW_LINE}<<${NEW_LINE}`
		for (const [key, val] of this.objectDictionary) {
			head += `/${key} ${val}`
		}
		head += `${NEW_LINE}>>${NEW_LINE}stream${NEW_LINE}`
		return head
	}

	public parseObjectTail(): string {
		return `${NEW_LINE}endstream${NEW_LINE}endobj${NEW_LINE}`
	}
}
