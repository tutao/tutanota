export const enum LockResult {
	LockAcquired,
	AlreadyLocked,
}

/** A simple lock to prevent parallel mailbox export in multiple windows */
export class DesktopExportLock {
	private readonly locks: Set<Id> = new Set()

	acquireLock(userId: Id): LockResult {
		if (this.locks.has(userId)) {
			return LockResult.AlreadyLocked
		} else {
			this.locks.add(userId)
			return LockResult.LockAcquired
		}
	}

	unlock(userId: Id): void {
		this.locks.delete(userId)
	}
}
