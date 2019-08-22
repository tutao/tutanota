// @flow
function migrate(oldConfig: any): any {
	return Object.assign(oldConfig, {"desktopConfigVersion": 1, "showAutoUpdateOption": true})
}

export const migrateClient = migrate
export const migrateAdmin = migrate