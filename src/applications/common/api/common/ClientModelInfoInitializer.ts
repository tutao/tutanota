import { ClientModelInfo, NamedClientModel } from "../../../../platform-kits/instance-pipeline/EntityFunctions.js"

const clientModelInfo: ClientModelInfo = new ClientModelInfo()

export function initClientModels(apps: Array<NamedClientModel>): ClientModelInfo {
	if (clientModelInfo.applicationVersionSum() > 0) {
		return clientModelInfo
	}
	for (const namedClientModel of apps) {
		clientModelInfo.registerApp(namedClientModel)
	}
	return clientModelInfo
}
