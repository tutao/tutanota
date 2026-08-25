import { defer, DeferredObject } from "./TsUtils.js"

/**
 * Readers run concurrently with each other. A writer waits for all currently in-flight readers to finish
 * before running, and blocks new readers from starting until it is done, so a reader never starts under
 * one state and finishes under another.
 *
 * Writers are serialized against each other and take priority over readers that are still waiting to start.
 */
export class ReadWriteLock {
	private readers = 0
	private writerChain: Promise<void> = Promise.resolve()
	private readerGate: DeferredObject<void> | null = null
	private drained: DeferredObject<void> | null = null

	async withReadLock<T>(fn: () => Promise<T>): Promise<T> {
		while (this.readerGate != null) {
			await this.readerGate.promise
		}
		this.readers++
		try {
			return await fn()
		} finally {
			this.readers--
			if (this.readers === 0 && this.drained != null) {
				this.drained.resolve()
			}
		}
	}

	async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
		const previous = this.writerChain
		const myTurn = defer<void>()
		this.writerChain = myTurn.promise
		await previous

		const gate = defer<void>()
		this.readerGate = gate
		if (this.readers > 0) {
			this.drained = defer<void>()
			await this.drained.promise
			this.drained = null
		}
		try {
			return await fn()
		} finally {
			this.readerGate = null
			myTurn.resolve()
			gate.resolve()
		}
	}
}
