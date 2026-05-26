import { OfflineStorage } from "./OfflineStorage"

export abstract class OfflineMigration {
	protected constructor(readonly version: number) {}

	abstract migrate(storage: OfflineStorage): Promise<void>
}
