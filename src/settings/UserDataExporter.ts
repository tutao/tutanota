import { LoginController } from "../api/main/LoginController.js"
import { CustomerTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, mapNullable, pad, promiseMap, renderCsv, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { UserManagementFacade } from "../api/worker/facades/UserManagementFacade.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { FileController } from "../file/FileController.js"
import { createDataFile } from "../api/common/DataFile.js"

export const CSV_MIMETYPE = "text/csv"
export const USER_CSV_FILENAME = "users.csv"

interface UserExportData {
	name: string
	mailAddress: string
	created: Date
	deleted: Date | null
	usedStorage: number
	aliases: Array<string>
}

export async function exportUserCsv(
	entityClient: EntityClient,
	userManagementFacade: UserManagementFacade,
	logins: LoginController,
	fileController: FileController,
) {
	const data = await loadUserExportData(entityClient, userManagementFacade, logins)
	const csv = renderCsv(
		["name", "mail address", "date created", "date deleted", "storage used (in bytes)", "aliases"],
		data.map((user) => [
			user.name,
			user.mailAddress,
			formatDate(user.created),
			mapNullable(user.deleted, formatDate) ?? "",
			`${user.usedStorage}`,
			user.aliases.join(" "),
		]),
	)
	const dataFile = createDataFile(USER_CSV_FILENAME, CSV_MIMETYPE, stringToUtf8Uint8Array(csv))
	await fileController.saveDataFile(dataFile)
}

function formatDate(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`
}

/**
 * Load data for each user administrated by the logged in user, in order to be exported
 */
export async function loadUserExportData(
	entityClient: EntityClient,
	userManagementFacade: UserManagementFacade,
	logins: LoginController,
): Promise<Array<UserExportData>> {
	const { user } = logins.getUserController()
	const { userGroups } = await entityClient.load(CustomerTypeRef, assertNotNull(user.customer))

	const localAdminGroupIds = new Set(
		logins
			.getUserController()
			.getLocalAdminGroupMemberships()
			.map((gm) => gm.group),
	)

	const groupsAdministeredByUser = (await entityClient.loadAll(GroupInfoTypeRef, userGroups)).filter(
		// if we are a global admin we keep all group infos
		// otherwise we only keep group infos of users who the logged in user administrates
		(info) => logins.getUserController().isGlobalAdmin() || (info.localAdmin && localAdminGroupIds.has(info.localAdmin)),
	)
	return promiseMap(groupsAdministeredByUser, async (info) => {
		const group = await entityClient.load(GroupTypeRef, info.group)
		const user = await entityClient.load(UserTypeRef, assertNotNull(group.user))
		const usedStorage = await userManagementFacade.readUsedUserStorage(user)

		return {
			name: info.name,
			mailAddress: info.mailAddress ?? "",
			created: info.created,
			deleted: info.deleted,
			usedStorage,
			aliases: info.mailAddressAliases.map((alias) => alias.mailAddress),
		}
	})
}
