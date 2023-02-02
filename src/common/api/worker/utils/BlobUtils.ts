import { aesEncrypt, AesKey, sha256Hash } from "@tutao/crypto"
import { base64ToBase64Ext, uint8ArrayToBase64 } from "@tutao/utils"
import { storageServices } from "@tutao/typerefs"
import { MAX_BLOB_SIZE_BYTES } from "@tutao/rest-client"

export type FileData = {
	data: Uint8Array
	sessionKey: AesKey
}
type NewBlobWrapper = {
	hash: Uint8Array
	data: Uint8Array
}
type KeyedNewBlobWrapper = {
	sessionKey: AesKey
	newBlobWrapper: NewBlobWrapper
}
type SerializedBinaryWrapper = {
	sessionKeys: AesKey[]
	binary: Uint8Array
}
const MAX_NUMBER_OF_BLOBS_IN_BINARY = 200
const MAX_UNENCRYPTED_BLOB_SIZE_BYTES = 10 * 1024 * 1024
const MAX_BLOB_SERVICE_BYTES = MAX_BLOB_SIZE_BYTES
const NEW_BLOB_OVERHEAD_BYTES = 4 + 6

/**
 * Deserializes a list of BlobWrappers that are in the following binary format
 * element [ #blobs ] [ blobId ] [ blobHash ] [blobSize] [blob]     [ . . . ]    [ blobNId ] [ blobNHash ] [blobNSize] [blobN]
 * bytes     4          9          6           4          blobSize                  9          6            4           blobSize
 *
 * @return a map from blobId to the binary data
 */
export function parseMultipleBlobsResponse(concatBinaryData: Uint8Array): Map<Id, Uint8Array> {
	const dataView = new DataView(concatBinaryData.buffer)
	const result = new Map<Id, Uint8Array>()
	const blobCount = dataView.getInt32(0)
	if (blobCount === 0) {
		return result
	}
	if (blobCount < 0) {
		throw new Error(`Invalid blob count: ${blobCount}`)
	}
	let offset = 4
	while (offset < concatBinaryData.length) {
		const blobIdBytes = concatBinaryData.slice(offset, offset + 9)
		const blobId = base64ToBase64Ext(uint8ArrayToBase64(blobIdBytes))

		const blobSize = dataView.getInt32(offset + 15)
		const dataStartOffset = offset + 19
		if (blobSize < 0 || dataStartOffset + blobSize > concatBinaryData.length) {
			throw new Error(`Invalid blob size: ${blobSize}. Remaining length: ${concatBinaryData.length - dataStartOffset}`)
		}
		const contents = concatBinaryData.slice(dataStartOffset, dataStartOffset + blobSize)
		result.set(blobId, contents)
		offset = dataStartOffset + blobSize
	}
	if (blobCount !== result.size) {
		throw new Error(`Parsed wrong number of blobs: ${blobCount}. Expected: ${result.size}`)
	}
	return result
}

export function encryptMultipleFileData(fileData: FileData[]): KeyedNewBlobWrapper[] {
	const result: KeyedNewBlobWrapper[] = []

	for (const file of fileData) {
		for (const chunk of chunkData(file.data, MAX_UNENCRYPTED_BLOB_SIZE_BYTES)) {
			const encrypted = aesEncrypt(file.sessionKey, chunk)

			const hashFull = sha256Hash(encrypted)
			const shortHash = hashFull.slice(0, 6)

			result.push({
				sessionKey: file.sessionKey,
				newBlobWrapper: {
					hash: shortHash,
					data: encrypted,
				},
			})
		}
	}

	return result
}

function chunkData(data: Uint8Array, size: number): Uint8Array[] {
	if (data.length === 0) return [new Uint8Array(0)]

	const out: Uint8Array[] = []
	for (let i = 0; i < data.length; i += size) {
		out.push(data.subarray(i, i + size))
	}
	return out
}

export function serializeNewBlobsInBinaryChunks(
	blobs: KeyedNewBlobWrapper[],
	maxBinaryChunkSize: number = MAX_BLOB_SERVICE_BYTES,
	maxBlobsPerChunk: number = MAX_NUMBER_OF_BLOBS_IN_BINARY,
): SerializedBinaryWrapper[] {
	const chunks: KeyedNewBlobWrapper[][] = []

	let current: KeyedNewBlobWrapper[] = []
	let currentSize = 0

	for (const blob of blobs) {
		const blobSize = NEW_BLOB_OVERHEAD_BYTES + blob.newBlobWrapper.data.length

		const wouldOverflow = currentSize + blobSize > maxBinaryChunkSize || current.length >= maxBlobsPerChunk

		if (wouldOverflow && current.length > 0) {
			chunks.push(current)
			current = []
			currentSize = 0
		}

		current.push(blob)
		currentSize += blobSize
	}

	if (current.length > 0) chunks.push(current)

	return chunks.map((chunk) => ({
		sessionKeys: chunk.map((c) => c.sessionKey),
		binary: serializeNewBlobs(chunk.map((c) => c.newBlobWrapper)),
	}))
}

function serializeNewBlobs(blobs: NewBlobWrapper[]): Uint8Array {
	let totalSize = 4 // bytes for the number of blobs

	for (const blob of blobs) {
		if (blob.hash.length !== 6) {
			throw new Error("Invalid hash length, expected 6 bytes")
		}
		totalSize += 6 + 4 + blob.data.length
	}

	const buffer = new Uint8Array(totalSize)
	const view = new DataView(buffer.buffer)

	let offset = 0

	// write blob count
	view.setUint32(offset, blobs.length, false)
	offset += 4

	for (const blob of blobs) {
		// hash (6 bytes)
		buffer.set(blob.hash, offset)
		offset += 6

		// size (4 bytes)
		view.setUint32(offset, blob.data.length, false)
		offset += 4

		// data
		buffer.set(blob.data, offset)
		offset += blob.data.length
	}

	return buffer
}
