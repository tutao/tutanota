import { ExternalImageRule, NewsletterBannerRule } from "../../../../../../entities/tutanota/Utils"
import { EntityUpdateData } from "../../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

export interface ConfigurationDatabase {
	addExternalImageRule(address: string, rule: ExternalImageRule): Promise<void>
	getExternalImageRule(address: string): Promise<ExternalImageRule>
	addNewsletterBannerRule(address: string, rule: NewsletterBannerRule): Promise<void>
	getNewsletterBannerRule(address: string): Promise<NewsletterBannerRule>
	onEntityUpdatesReceived(events: readonly EntityUpdateData[], _batchId: Id, _groupId: Id): Promise<any>
	delete(userId: Id): Promise<void>
}
