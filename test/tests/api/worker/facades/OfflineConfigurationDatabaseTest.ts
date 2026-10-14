import o from "@tutao/otest"
import {
	OfflineConfigurationDatabase,
	OfflineConfigurationDatabaseDefinitions,
} from "../../../../../src/applications/common/api/worker/facades/lazy/OfflineConfigurationDatabase"
import { SqlCipherFacade } from "../../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { DesktopSqlCipher } from "../../../../../src/applications/common/desktop/db/DesktopSqlCipher"
import { ExternalImageRule, NewsletterBannerRule } from "../../../../../src/entities/tutanota/Utils"
import { object, when } from "testdouble"
import { IndexedDbConfigurationDatabase } from "../../../../../src/applications/common/api/worker/facades/lazy/IndexedDbConfigurationDatabase"

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineConfigurationDatabase", function () {
	let db: OfflineConfigurationDatabase
	let sql: SqlCipherFacade
	const userId = "8675309"

	o.beforeEach(async () => {
		sql = new DesktopSqlCipher(":memory:", false)
		await sql.openDb(userId, offlineDatabaseTestKey)

		for (const { definition } of Object.values(OfflineConfigurationDatabaseDefinitions)) {
			await sql.run(definition, [])
		}

		db = new OfflineConfigurationDatabase(sql)
	})

	o.spec("external image rules", () => {
		o.test("none by default", async () => {
			const nonRule = await db.getExternalImageRule("alice@tutao.de")
			o.check(nonRule).equals(ExternalImageRule.None)
		})
		o.test("add new rule", async () => {
			await db.addExternalImageRule("alice@tutao.de", ExternalImageRule.Allow)
			o.check(await db.getExternalImageRule("alice@tutao.de")).deepEquals(ExternalImageRule.Allow)
		})
		o.test("overwrite existing rule", async () => {
			await db.addExternalImageRule("alice@tutao.de", ExternalImageRule.Allow)
			await db.addExternalImageRule("alice@tutao.de", ExternalImageRule.Block)
			o.check(await db.getExternalImageRule("alice@tutao.de")).deepEquals(ExternalImageRule.Block)
		})
	})

	o.spec("news banner rules", () => {
		o.test("none by default", async () => {
			const nonRule = await db.getNewsletterBannerRule("alice@tutao.de")
			o.check(nonRule).equals(NewsletterBannerRule.Allow)
		})
		o.test("add new rule", async () => {
			await db.addNewsletterBannerRule("alice@tutao.de", NewsletterBannerRule.Block)
			o.check(await db.getNewsletterBannerRule("alice@tutao.de")).deepEquals(NewsletterBannerRule.Block)
		})
		o.test("overwrite existing rule", async () => {
			await db.addNewsletterBannerRule("alice@tutao.de", NewsletterBannerRule.Block)
			await db.addNewsletterBannerRule("alice@tutao.de", NewsletterBannerRule.Allow)
			o.check(await db.getNewsletterBannerRule("alice@tutao.de")).deepEquals(NewsletterBannerRule.Allow)
		})
	})

	o.spec("migration from indexeddb", () => {
		o.test("needed by default", async () => {
			o.check(await db.needsMigratedFromIndexedDbConfigurationDatabase()).equals(true)
		})
		o.test("migration success", async () => {
			db.triggerMigrationIfNeeded()

			const oldDb = object<IndexedDbConfigurationDatabase>()
			const userId = "I am a user."

			when(oldDb.dumpRules()).thenResolve({
				imageRules: {
					"alice@tuta.com": ExternalImageRule.Block,
					"zebra@keemail.me": ExternalImageRule.Allow,
				},
				newsletterBannerRules: {
					"noreply@spamworld.com": NewsletterBannerRule.Block,
					"getspammedforever@andever.com": NewsletterBannerRule.Block,
				},
			})

			await db.migrateFromIndexedDbConfigurationDatabase(
				async () => oldDb,
				() => userId,
			)

			// should return false now
			o.check(await db.needsMigratedFromIndexedDbConfigurationDatabase()).equals(false)

			// should match what we had here
			o.check(await db.getExternalImageRule("alice@tuta.com")).equals(ExternalImageRule.Block)
			o.check(await db.getExternalImageRule(`${1.0 / 0.0}`)).equals(ExternalImageRule.None) // not in db
			o.check(await db.getExternalImageRule("zebra@keemail.me")).equals(ExternalImageRule.Allow)

			o.check(await db.getNewsletterBannerRule("noreply@spamworld.com")).equals(NewsletterBannerRule.Block)
			o.check(await db.getNewsletterBannerRule("yesreply@spamification")).equals(NewsletterBannerRule.Allow) // not in db
			o.check(await db.getNewsletterBannerRule("getspammedforever@andever.com")).equals(NewsletterBannerRule.Block)
		})
		o.test("migration failure", async () => {
			db.triggerMigrationIfNeeded()

			const oldDb = object<IndexedDbConfigurationDatabase>()
			const userId = "THERE ARE FOUR LIGHTS"

			when(oldDb.dumpRules()).thenResolve(null)

			await db.migrateFromIndexedDbConfigurationDatabase(
				async () => oldDb,
				() => userId,
			)

			// should still return true since it failed
			o.check(await db.needsMigratedFromIndexedDbConfigurationDatabase()).equals(true)
		})
	})
})
