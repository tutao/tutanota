/**
 * These tables contain mostly cached data and can be purged when necessary.
 */
const DisposableTableDefinitions = Object.freeze({
	// plus ownerGroup added in a migration
	list_entities:
		"type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",
	// plus ownerGroup added in a migration
	element_entities: "type TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, elementId)",
	ranges: "type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId)",
	lastUpdateBatchIdPerGroupId: "groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId)",
	metadata: "key TEXT NOT NULL, value BLOB, PRIMARY KEY (key)",
	blob_element_entities:
		"type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",
})

export const CacheTableDefinitions = Object.freeze(Object.keys(DisposableTableDefinitions))

/**
 * These tables contain user data that cannot be retrieved from elsewhere and must survive password resets, migrations that clear the offline cache etc.
 */
const PersistentTableDefinitions = {
	identity_store:
		"mailAddress TEXT NOT NULL, publicIdentityKey BLOB NOT NULL, identityKeyVersion INTEGER NOT NULL, identityKeyType INTEGER NOT NULL, " +
		"sourceOfTrust INTEGER NOT NULL, PRIMARY KEY (mailAddress, identityKeyVersion)",
}

/**
 * Definitions for all tables that should exist in an offline storage.
 */
export const TableDefinitions = Object.freeze({
	...DisposableTableDefinitions,
	...PersistentTableDefinitions,
})
