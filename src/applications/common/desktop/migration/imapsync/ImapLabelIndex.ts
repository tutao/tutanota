import type { FetchMessageObject } from "imapflow"
import { sha256Hash } from "@tutao/crypto"

/** The subset of an IMAP fetch result that is needed to compute the label index key. Fetch it with {envelope, internalDate, size}. */
export type LabelIndexKeySource = Pick<FetchMessageObject, "envelope" | "internalDate" | "size">

/**
 * Computes a 64 bit key that identifies a mail across the folders of an IMAP server which does not provide X-GM-LABELS (e.g. Proton Mail Bridge).
 * IMAP UIDs are per folder, so the key is derived from the content-related fields that are identical in each folder the mail appears in.
 * We deliberately avoid the RFC822 source here, so that the (large) mail bodies of label folders do not have to be downloaded.
 */
export function computeLabelIndexKey(mail: LabelIndexKeySource): bigint {
	const envelope = mail.envelope
	const internalDate = mail.internalDate != null ? new Date(mail.internalDate).getTime() : ""
	const parts: unknown[] = [envelope?.messageId ?? "", internalDate, mail.size ?? ""]
	if (!envelope?.messageId) {
		// without a Message-ID we need more fields to make collisions unlikely
		parts.push(envelope?.subject ?? "", envelope?.date?.getTime() ?? "", envelope?.from?.[0]?.address ?? "")
	}

	const hash = sha256Hash(new TextEncoder().encode(JSON.stringify(parts)))
	const view = new DataView(hash.buffer, hash.byteOffset, hash.byteLength)
	return view.getBigUint64(0, false)
}

/** Growable list of 64 bit keys which is sorted once, after all keys have been added. */
class SortedKeys {
	private keys = new BigUint64Array(0)
	private length = 0

	reserve(additional: number) {
		const required = this.length + additional
		if (required > this.keys.length) {
			this.resize(required)
		}
	}

	add(key: bigint) {
		if (this.length === this.keys.length) {
			this.resize(Math.max(16, this.keys.length * 2))
		}
		this.keys[this.length++] = key
	}

	/** sorts the keys and drops the unused capacity */
	finish() {
		if (this.keys.length !== this.length) {
			this.resize(this.length)
		}
		this.keys.sort()
	}

	has(key: bigint): boolean {
		let low = 0
		let high = this.length - 1
		while (low <= high) {
			const mid = (low + high) >>> 1
			const value = this.keys[mid]
			if (value < key) {
				low = mid + 1
			} else if (value > key) {
				high = mid - 1
			} else {
				return true
			}
		}
		return false
	}

	private resize(capacity: number) {
		const resized = new BigUint64Array(capacity)
		resized.set(this.keys.subarray(0, Math.min(this.length, capacity)))
		this.keys = resized
	}
}

/**
 * Remembers which label (folder) each mail belongs to, for servers that do not report labels on the mails themselves.
 *
 * To keep the memory usage low for large mailboxes, we do not store a map from mail to label names.
 * Instead, every label has a sorted array of the 64 bit keys of its mails, which costs 8 bytes per mail and label.
 * Looking up a mail is a binary search per label.
 *
 * Usage: {@link add} all mails of all labels, call {@link finish} and then query with {@link labelsFor}.
 */
export class ImapLabelIndex {
	private readonly keysByLabel = new Map<string, SortedKeys>()

	/** Optional hint to allocate the storage for a label at once. */
	reserve(label: string, mailCount: number) {
		this.getOrCreate(label).reserve(mailCount)
	}

	add(label: string, key: bigint) {
		this.getOrCreate(label).add(key)
	}

	finish() {
		for (const keys of this.keysByLabel.values()) {
			keys.finish()
		}
	}

	labelsFor(key: bigint): Set<string> {
		const labels = new Set<string>()
		for (const [label, keys] of this.keysByLabel) {
			if (keys.has(key)) {
				labels.add(label)
			}
		}
		return labels
	}

	private getOrCreate(label: string): SortedKeys {
		let keys = this.keysByLabel.get(label)
		if (keys == null) {
			keys = new SortedKeys()
			this.keysByLabel.set(label, keys)
		}
		return keys
	}
}
