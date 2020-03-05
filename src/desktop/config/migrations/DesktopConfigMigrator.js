// @flow

export default function applyMigrations(oldConfig: any, defaultConfig: any): any {
	// noinspection FallThroughInSwitchStatementJS
	switch (oldConfig.desktopConfigVersion) {
		case undefined:
			oldConfig = applyMigration(require('./migration-0000').default, oldConfig)
		// no break, fallthrough applies all migrations in sequence
		case 0:
			console.log("config up to date")
			/* add new migrations as needed */
			break;
		default:
			console.error("unknown config version, resetting to default config")
			oldConfig = applyMigrations(defaultConfig, defaultConfig)
	}
	return oldConfig
}

function applyMigration(migration: any => any, config: any): any {
	const oldVersion = Object.freeze(config.desktopConfigVersion)
	config = migration(config)
	const newVersion = config.desktopConfigVersion
	if (newVersion === undefined || oldVersion >= newVersion) {
		console.error("config migration did not increment desktopConfigVersion! aborting.")
		process.exit(1)
	}
	return config
}