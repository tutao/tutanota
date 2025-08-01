import { LoginController } from "../api/main/LoginController.js"
import { GroupInfoTypeRef, GroupTypeRef } from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, mapNullable, pad, promiseMap, renderCsv, splitInChunks, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { EntityClient } from "../api/common/EntityClient.js"
import { FileController } from "../file/FileController.js"
import { createDataFile } from "../api/common/DataFile.js"
import { CounterFacade } from "../api/worker/facades/lazy/CounterFacade.js"
import { CounterType } from "../api/common/TutanotaConstants.js"
import { CancelledError } from "../api/common/error/CancelledError"

const GROUP_DOWNLOAD_SIZE = 50

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

export async function exportUserCsv(data: readonly UserExportData[], fileController: FileController) {
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
	logins: LoginController,
	counterFacade: CounterFacade,
	onProgress?: (complete: number, total: number) => unknown,
	abortSignal?: AbortSignal,
): Promise<UserExportData[]> {
	const customer = await logins.getUserController().loadCustomer()
	const groupsAdministeredByUser = await entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
	const usedCustomerStorageCounterValues = await counterFacade.readAllCustomerCounterValues(CounterType.UserStorageLegacy, customer._id)

	let isCancelled = false
	abortSignal?.addEventListener("abort", () => (isCancelled = true))

	let total = groupsAdministeredByUser.length
	let completed = 0
	onProgress?.(completed, total)

	const downloaded = await promiseMap(splitInChunks(GROUP_DOWNLOAD_SIZE, groupsAdministeredByUser), async (infos) => {
		if (isCancelled) {
			throw new CancelledError("user export cancelled by user")
		}

		const groups = await entityClient.loadMultiple(
			GroupTypeRef,
			null,
			infos.map((group) => group.group),
		)

		const mapped = groups.map((group) => {
			const info = assertNotNull(groupsAdministeredByUser.find((groupInfo) => groupInfo.group === group._id))
			const userStorageCounterValue = usedCustomerStorageCounterValues.find((counterValue) => counterValue.counterId === group.storageCounter)
			const usedStorage = Number(userStorageCounterValue?.value ?? "0")
			return {
				name: info.name,
				mailAddress: info.mailAddress ?? "",
				created: info.created,
				deleted: info.deleted,
				usedStorage,
				aliases: info.mailAddressAliases.map((alias) => alias.mailAddress),
			}
		})

		completed += mapped.length

		// in case we did not get every single group back that we requested (something may have changed in the meantime)
		total -= infos.length - mapped.length

		onProgress?.(completed, total)

		return mapped
	})

	return downloaded.flat()
}
