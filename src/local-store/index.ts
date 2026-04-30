export * from "./CacheManagementInterface.js"
export * from "./CacheStorage.js"
export * from "./CustomCacheHandler.js"
export * from "./IdentityKeyTrustDatabase.js"
export * from "./OfflineStorage.js"
export * from "./OfflineStorageMigrator.js"
export * from "./OutOfSyncError.js"
export * from "./PublicEncryptionKeyCache"
export * from "./Sql.js"

// following imports are not exported. We
// include them here to make it part of this ts module
import { offline5 } from "./migrations/offline-v5.js"
import { offline6 } from "./migrations/offline-v6.js"
import { offline7 } from "./migrations/offline-v7.js"
import { offline8 } from "./migrations/offline-v8.js"
import { offline9 } from "./migrations/offline-v9.js"
import { offline10 } from "./migrations/offline-v10.js"
import { offline11 } from "./migrations/offline-v11.js"
import { offline12 } from "./migrations/offline-v12.js"

const _unused_import = { offline5, offline6, offline7, offline8, offline9, offline10, offline11, offline12 }
