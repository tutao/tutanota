import { Nullable } from "@tutao/utils"

export interface ConfigHostApi {
	storeUserConfig(configJson: string): Promise<void>
	storeCustomerConfig(configJson: string): Promise<void>
	getUserConfig(): Promise<Nullable<string>>
	getCustomerConfig(): Promise<Nullable<string>>
}
