import { log } from "../../DesktopLog"

/**
 * Should not import them all manually but we need make the whole thing async then.
 */
import * as migration0000 from "./migration-0000"
import * as migration0001 from "./migration-0001"
import * as migration0002 from "./migration-0002"
import * as migration0003 from "./migration-0003"
import * as migration0004 from "./migration-0004"
import * as migration0005 from "./migration-0005"
import * as migration0006 from "./migration-0006"
import * as migration0007 from "./migration-0007"
import * as migration0008 from "./migration-0008"

import type { Config, ConfigMigration } from "../ConfigCommon"
import { DesktopNativeCryptoFacade } from "../../DesktopNativeCryptoFacade"
import type { DesktopKeyStoreFacade } from "../../DesktopKeyStoreFacade.js"

export type MigrationKind = "migrateClient" | "migrateAdmin"
export type ElectronExports = typeof Electron.CrossProcessExports

export class DesktopConfigMigrator {
	readonly crypto: DesktopNativeCryptoFacade
	_keyStoreFacade: DesktopKeyStoreFacade
	_electron: ElectronExports

	constructor(crypto: DesktopNativeCryptoFacade, keyStoreFacade: DesktopKeyStoreFacade, electron: ElectronExports) {
		this.crypto = crypto
		this._keyStoreFacade = keyStoreFacade
		this._electron = electron
	}

	async applyMigrations(migrationFunction: MigrationKind, oldConfig: Config): Promise<Config> {
		// noinspection FallThroughInSwitchStatementJS
		switch (oldConfig.desktopConfigVersion) {
			case undefined:
				await applyMigration(migration0000[migrationFunction], oldConfig)

			// no break, fallthrough applies all migrations in sequence
			case 0:
				await applyMigration(migration0001[migrationFunction], oldConfig)

			case 1:
				await applyMigration(migration0002[migrationFunction], oldConfig)

			case 2:
				await applyMigration((config) => migration0003[migrationFunction](config, this.crypto, this._keyStoreFacade), oldConfig)

			case 3:
				await applyMigration(migration0004[migrationFunction], oldConfig)

			case 4:
				await applyMigration((config) => migration0005[migrationFunction](config, this._electron), oldConfig)

			case 5:
				await applyMigration(migration0006[migrationFunction], oldConfig)

			case 6:
				await applyMigration(migration0007[migrationFunction], oldConfig)
			case 7:
				await applyMigration(migration0008[migrationFunction], oldConfig)
			case 8:
				log.debug("config up to date")
				/* add new migrations as needed */
				break
			default:
				throw new Error(`unknown config version ${String(oldConfig.desktopConfigVersion)}`)
		}

		return oldConfig
	}
}

/**
 * @param migration name of the function to use for migration
 * @param config default config to use if oldConfig is invalid
 */
async function applyMigration(migration: ConfigMigration, config: Config) {
	const oldVersion = Object.freeze(config.desktopConfigVersion)
	await migration(config)
	const newVersion = config.desktopConfigVersion

	if (newVersion === undefined || Number(oldVersion) >= Number(newVersion)) {
		console.error("config migration did not increment desktopConfigVersion! aborting.")
		process.exit(1)
	}
}
