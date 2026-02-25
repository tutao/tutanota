import { PushIdentifier, PushIdentifierTypeRef, User } from "../../common/api/entities/sys/TypeRefs"
import { AppType } from "../../common/misc/ClientConstants"
import { assertMainOrNode } from "../../common/api/common/Env"
import type { NativePushServiceApp } from "../../common/native/main/NativePushServiceApp"
import { EntityClient } from "../../common/api/common/EntityClient"

assertMainOrNode()

// We clean up notifiers past a certain amount, but the list might not be cleaned up. To prevent showing an infinite
// list, we limit the list to some pretty generous (but still fairly reasonable) amount.
const MAX_DISPLAYED_PUSH_NOTIFIERS = 50

/**
 * Viewmodel that handles loading and sorting push identifiers remotely.
 */
export class NotificationSettingsViewerModel {
	private currentIdentifier: string | null = null
	private identifiers: readonly PushIdentifier[] = []

	constructor(
		private readonly pushService: NativePushServiceApp,
		private readonly user: User,
		private readonly entityClient: EntityClient,
	) {}

	/**
	 * Get all loaded push identifiers.
	 */
	public getLoadedPushIdentifiers(): readonly PushIdentifier[] {
		return this.identifiers
	}

	/**
	 * Filter mail identifiers in an array of identifiers
	 * @param identifiersAscending All identifiers in ascending order (i.e. oldest to newest order)
	 * @param currentIdentifier Current identifier of the client
	 */
	private filterAndLimitMailIdentifiers(identifiersAscending: readonly PushIdentifier[], currentIdentifier: string | null): PushIdentifier[] {
		// Filter out calendar targets
		const validTargets = identifiersAscending.filter((identifier) => identifier.app === AppType.Mail || identifier.app === AppType.Integrated)

		// The identifier may or may not be on the list depending on if the identifier was deleted
		let currentIdentifierEntry: PushIdentifier | null = null
		if (currentIdentifier != null) {
			const currentIdentifierIndex = validTargets.findIndex((identifier) => identifier.identifier === currentIdentifier)
			if (currentIdentifierIndex >= 0) {
				currentIdentifierEntry = validTargets.splice(currentIdentifierIndex, 1)[0]
			}
		}

		// The list is in ascending order, so older notifiers are at the beginning
		const identifiersSlice = validTargets.slice(validTargets.length - Math.min(validTargets.length, MAX_DISPLAYED_PUSH_NOTIFIERS))

		// We should take our push identifier and push it somewhere else!
		if (currentIdentifierEntry != null) {
			identifiersSlice.unshift(currentIdentifierEntry)
		}

		return identifiersSlice
	}

	/**
	 * Get the current loaded push identifier for the client.
	 */
	public getCurrentIdentifier(): string | null {
		return this.currentIdentifier
	}

	/**
	 * (Re)load everything.
	 */
	public async reload() {
		this.currentIdentifier = this.pushService.getLoadedPushIdentifier()?.identifier ?? null
		const list = this.user.pushIdentifierList

		if (list) {
			const allIdentifiers = await this.entityClient.loadAll(PushIdentifierTypeRef, list.list)
			this.identifiers = this.filterAndLimitMailIdentifiers(allIdentifiers, this.currentIdentifier)
		} else {
			this.identifiers = []
		}
	}
}
