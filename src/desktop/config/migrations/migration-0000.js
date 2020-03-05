// @flow
function migrate(oldConfig: any) {
	return Object.assign(oldConfig, {"desktopConfigVersion": 0})
}

export const migrateClient = migrate
export const migrateAdmin = migrate