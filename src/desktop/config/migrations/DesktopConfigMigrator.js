// @flow
import {log} from "../../DesktopUtils"

/**
 *
 * @param migrationFunction name of the function to use for migration
 * @param oldConfig old config read from disk
 * @param defaultConfig default config to use if oldConfig is invalid
 * @returns config after aplplication of all migrations
 */
export default function applyMigrations(migrationFunction: "migrateClient" | "migrateAdmin", oldConfig: any, defaultConfig: any): any {
	if (oldConfig == null) oldConfig = {}
	// noinspection FallThroughInSwitchStatementJS
	switch (oldConfig.desktopConfigVersion) {
		case undefined:
			oldConfig = applyMigration(require('./migration-0000')[migrationFunction], oldConfig)
		// no break, fallthrough applies all migrations in sequence
		case 0:
			oldConfig = applyMigration(require('./migration-0001')[migrationFunction], oldConfig)
		case 1:
			log.debug("config up to date")
			/* add new migrations as needed */
			break;
		default:
			console.error("unknown config version, resetting to default config")
			oldConfig = applyMigrations(defaultConfig, defaultConfig)
	}
	return oldConfig
}

function applyMigration(migration: any, config: any): any {
	const oldVersion = Object.freeze(config.desktopConfigVersion)
	config = migration(config)
	const newVersion = config.desktopConfigVersion
	if (newVersion === undefined || oldVersion >= newVersion) {
		console.error("config migration did not increment desktopConfigVersion! aborting.")
		process.exit(1)
	}
	return config
}