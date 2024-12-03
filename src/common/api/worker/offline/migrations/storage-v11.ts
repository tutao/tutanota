import {OfflineMigration} from "../OfflineStorageMigrator";
import {OfflineStorage} from "../OfflineStorage";
import {migrateAllElements} from "../StandardMigrations";
import {createMailBox, MailBoxTypeRef} from "../../../entities/tutanota/TypeRefs";

export const storage11: OfflineMigration = {
    app: "storage",
    version: 11,
    async migrate(storage: OfflineStorage) {
    },
}