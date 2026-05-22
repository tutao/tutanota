import { AppNameEnum } from "@tutao/meta"
import { baseModelInfo, baseTypeModels } from "@tutao/entities/base"
import { sysModelInfo, sysTypeModels } from "@tutao/entities/sys"
import { tutanotaModelInfo, tutanotaTypeModels } from "@tutao/entities/tutanota"
import { driveModelInfo, driveTypeModels } from "@tutao/entities/drive"
import { storageModelInfo, storageTypeModels } from "@tutao/entities/storage"
import { monitorModelInfo, monitorTypeModels } from "@tutao/entities/monitor"
import { usageModelInfo, usageTypeModels } from "@tutao/entities/usage"
import { accountingModelInfo, accountingTypeModels } from "@tutao/entities/accounting"
import { ClientModelInfo } from "../../../../platform-kits/instance-pipeline/EntityFunctions.js"

const clientModelInfo: ClientModelInfo = new ClientModelInfo()

export function initClientModels() {
	if (clientModelInfo.applicationVersionSum() > 0) {
		return clientModelInfo
	}
	const apps = [
		{ app: AppNameEnum.Base, clientModel: baseTypeModels, modelInfo: baseModelInfo },
		{ app: "sys", clientModel: sysTypeModels, modelInfo: sysModelInfo },
		{ app: "tutanota", clientModel: tutanotaTypeModels, modelInfo: tutanotaModelInfo },
		{ app: "drive", clientModel: driveTypeModels, modelInfo: driveModelInfo },
		{ app: "storage", clientModel: storageTypeModels, modelInfo: storageModelInfo },
		{ app: "monitor", clientModel: monitorTypeModels, modelInfo: monitorModelInfo },
		{ app: "usage", clientModel: usageTypeModels, modelInfo: usageModelInfo },
		{ app: "accounting", clientModel: accountingTypeModels, modelInfo: accountingModelInfo },
	]
	for (const namedClientModel of apps) {
		clientModelInfo.registerApp(namedClientModel)
	}
	return clientModelInfo
}
