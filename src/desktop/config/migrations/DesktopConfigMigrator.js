// @flow
import {log} from "../../DesktopLog"
/**
 * Should not import them all manually but we need make the whole thing async then.
 */
import * as migration0000 from "./migration-0000"
import * as migration0001 from "./migration-0001"
import * as migration0002 from "./migration-0002"
import type {Config, ConfigMigration} from "../ConfigCommon"

export type MigrationKind = "migrateClient" | "migrateAdmin"
/**
 *
 * @param migrationFunction name of the function to use for migration
 * @param oldConfig old config read from disk
 * @param defaultConfig default config to use if oldConfig is invalid
 * @returns config after aplplication of all migrations
 */
export default function applyMigrations(migrationFunction: MigrationKind, oldConfig: ?Config,
                                        defaultConfig: Config
): Config {
	if (oldConfig == null) oldConfig = {}
	// noinspection FallThroughInSwitchStatementJS
	switch (oldConfig.desktopConfigVersion) {
		case undefined:
			applyMigration(migration0000[migrationFunction], oldConfig)
		// no break, fallthrough applies all migrations in sequence
		case 0:
			applyMigration(migration0001[migrationFunction], oldConfig)
		case 1:
			applyMigration(migration0002[migrationFunction], oldConfig)
		case 2:
			log.debug("config up to date")
			/* add new migrations as needed */
			break;
		default:
			console.error("unknown config version, resetting to default config")
			applyMigrations(migrationFunction, defaultConfig, defaultConfig)
	}
	return oldConfig
}

function applyMigration(migration: ConfigMigration, config: Config) {
	const oldVersion = Object.freeze(config.desktopConfigVersion)
	migration(config)
	const newVersion = config.desktopConfigVersion
	if (newVersion === undefined || Number(oldVersion) >= Number(newVersion)) {
		console.error("config migration did not increment desktopConfigVersion! aborting.")
		process.exit(1)
	}
}