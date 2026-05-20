import { AppNameEnum } from "@tutao/meta"
import { baseModelInfo, baseTypeModels } from "@tutao/entities/base"
import { sysModelInfo, sysTypeModels } from "@tutao/entities/sys"
import { tutanotaModelInfo, tutanotaTypeModels } from "@tutao/entities/tutanota"
import { driveModelInfo, driveTypeModels } from "@tutao/entities/drive"
import { storageModelInfo, storageTypeModels } from "@tutao/entities/storage"
import { monitorModelInfo, monitorTypeModels } from "@tutao/entities/monitor"
import { usageModelInfo, usageTypeModels } from "@tutao/entities/usage"
import { accountingModelInfo, accountingTypeModels } from "@tutao/entities/accounting"

export default Object.freeze([
	{ app: AppNameEnum.Base, clientModel: baseTypeModels, modelInfo: baseModelInfo },
	{ app: AppNameEnum.Sys, clientModel: sysTypeModels, modelInfo: sysModelInfo },
	{ app: AppNameEnum.Tutanota, clientModel: tutanotaTypeModels, modelInfo: tutanotaModelInfo },
	{ app: AppNameEnum.Drive, clientModel: driveTypeModels, modelInfo: driveModelInfo },
	{ app: AppNameEnum.Storage, clientModel: storageTypeModels, modelInfo: storageModelInfo },
	{ app: AppNameEnum.Monitor, clientModel: monitorTypeModels, modelInfo: monitorModelInfo },
	{ app: AppNameEnum.Usage, clientModel: usageTypeModels, modelInfo: usageModelInfo },
	{ app: AppNameEnum.Accounting, clientModel: accountingTypeModels, modelInfo: accountingModelInfo },
] as const)
