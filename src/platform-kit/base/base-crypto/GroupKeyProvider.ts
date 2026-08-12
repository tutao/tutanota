import { KeyVersion } from "@tutao/utils"
import { AesKey, VersionedKey } from "@tutao/crypto"
import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { AdminKeyLoaderFacade } from "./AdminKeyLoaderFacade"

export interface GroupKeyProvider {
	/** Get the current symmetric group key for the given group. */
	getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey>

	/**
	 * Load a specific version of the symmetric group key.
	 */
	loadSymGroupKey(groupId: Id, version: KeyVersion): Promise<AesKey>
}

export class OwnGroupKeyProvider implements GroupKeyProvider {
	constructor(private readonly keyLoader: KeyLoaderFacade) {}

	getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		return this.keyLoader.getCurrentSymGroupKey(groupId)
	}

	loadSymGroupKey(groupId: Id, version: KeyVersion, currentGroupKey?: VersionedKey): Promise<AesKey> {
		return this.keyLoader.loadSymGroupKey(groupId, version, currentGroupKey)
	}
}

export class AdminGroupKeyProvider implements GroupKeyProvider {
	constructor(
		private readonly adminKeyLoader: AdminKeyLoaderFacade,
		private readonly userId: Id,
	) {}

	getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		return this.adminKeyLoader.getCurrentGroupKeyViaUser(groupId, this.userId)
	}

	loadSymGroupKey(groupId: Id, version: KeyVersion): Promise<AesKey> {
		return this.adminKeyLoader.getGroupKeyViaUser(groupId, version, this.userId)
	}
}

export class GroupKeyProviderFactory {
	constructor(
		private readonly keyLoader: KeyLoaderFacade,
		private readonly adminKeyLoader: AdminKeyLoaderFacade,
	) {}

	/** For the currently logged-in user. */
	ownProvider(): GroupKeyProvider {
		return new OwnGroupKeyProvider(this.keyLoader)
	}

	/** For an admin acting on behalf of another user. */
	adminProvider(userId: Id): GroupKeyProvider {
		return new AdminGroupKeyProvider(this.adminKeyLoader, userId)
	}
}
