import { LoginController } from "../api/main/LoginController.js"
import { CustomerTypeRef, GroupInfoTypeRef, GroupTypeRef } from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, mapNullable, neverNull, pad, promiseMap, renderCsv, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { EntityClient } from "../api/common/EntityClient.js"
import { FileController } from "../file/FileController.js"
import { createDataFile } from "../api/common/DataFile.js"
import { CounterFacade } from "../api/worker/facades/lazy/CounterFacade.js"
import { CounterType } from "../api/common/TutanotaConstants.js"

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

export async function exportUserCsv(entityClient: EntityClient, logins: LoginController, fileController: FileController, counterFacade: CounterFacade) {
	const data = await loadUserExportData(entityClient, logins, counterFacade)
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
export async function loadUserExportData(entityClient: EntityClient, logins: LoginController, counterFacade: CounterFacade): Promise<Array<UserExportData>> {
	const { user } = logins.getUserController()
	const { userGroups } = await entityClient.load(CustomerTypeRef, assertNotNull(user.customer))

	const groupsAdministeredByUser = await entityClient.loadAll(GroupInfoTypeRef, userGroups)

	const usedCustomerStorageCounterValues = await counterFacade.readAllCustomerCounterValues(CounterType.UserStorageLegacy, neverNull(user.customer))
	return promiseMap(groupsAdministeredByUser, async (info) => {
		const group = await entityClient.load(GroupTypeRef, info.group)
		const userStorageCounterValue = usedCustomerStorageCounterValues.find((counterValue) => counterValue.counterId === group.storageCounter)
		const usedStorage = userStorageCounterValue != null ? Number(userStorageCounterValue.value) : 0

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
