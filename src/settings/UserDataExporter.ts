import {LoginController} from "../api/main/LoginController.js"
import {CustomerTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef} from "../api/entities/sys/TypeRefs.js"
import {assertNotNull, mapNullable, promiseMap, replaceAll} from "@tutao/tutanota-utils"
import {UserManagementFacade} from "../api/worker/facades/UserManagementFacade.js"
import {EntityClient} from "../api/common/EntityClient.js"
import {FileController} from "../file/FileController.js"
import {formatDateTimeUTC} from "../calendar/export/CalendarImporter.js"

export const CSV_MIMETYPE = "text/csv"
export const USER_CSV_FILENAME = "users.csv"
export const USER_EXPORT_CSV_HEADER = "name; mail address; date created; date deleted; storage used; aliases"


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
	fileController: FileController
) {
	const data = await loadUserExportData(entityClient, userManagementFacade, logins)
	const csv = renderExportDataCsv(data)
	await fileController.saveStringAsFile(csv, USER_CSV_FILENAME, CSV_MIMETYPE)
}

/**
 * Load data for each user administrated by the logged in user, in order to be exported
 */
export async function loadUserExportData(
	entityClient: EntityClient,
	userManagementFacade: UserManagementFacade,
	logins: LoginController,
): Promise<Array<UserExportData>> {
	const {user} = logins.getUserController()
	const {userGroups} = await entityClient.load(CustomerTypeRef, assertNotNull(user.customer))

	const localAdminGroupIds = new Set(
		logins
			.getUserController()
			.getLocalAdminGroupMemberships()
			.map(gm => gm.group)
	)

	const groupsAdministeredByUser = (await entityClient.loadAll(GroupInfoTypeRef, userGroups)).filter(
		// if we are a global admin we keep all group infos
		// otherwise we only keep group infos of users who the logged in user administrates
		info => logins.getUserController().isGlobalAdmin()
			|| (info.localAdmin && localAdminGroupIds.has(info.localAdmin))
	)
	return promiseMap(
		groupsAdministeredByUser,
		async info => {

			const group = await entityClient.load(GroupTypeRef, info.group)
			const user = await entityClient.load(UserTypeRef, assertNotNull(group.user))
			const usedStorage = await userManagementFacade.readUsedUserStorage(user)

			return {
				name: info.name,
				mailAddress: info.mailAddress ?? "",
				created: info.created,
				deleted: info.deleted,
				usedStorage,
				aliases: info.mailAddressAliases.map(alias => alias.mailAddress)
			}
		}
	)
}

export function renderExportDataCsv(userData: Array<UserExportData>) {

	const lines = [
		USER_EXPORT_CSV_HEADER,
		...userData.map(
			data => {
				const created = formatDateTimeUTC(data.created)
				const deleted = mapNullable(data.deleted, formatDateTimeUTC)
				const usedStorage = data.usedStorage ? `${data.usedStorage}B` : null
				return `${replaceAll(data.name, ";", "\\;")}; ${data.mailAddress}; ${created}; ${deleted}; ${usedStorage}; ${data.aliases.join(" ")}`
			}
		)
	]

	return lines.join("\n")
}