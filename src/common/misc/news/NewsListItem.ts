import { Children } from "mithril"
import { NewsId } from "../../api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog.js"

/**
 * News items must implement this interface to be rendered.
 */
export interface NewsListItem {
	/**
	 * Returns the rendered NewsItem. Should display a button that acknowledges the news via NewsModel.acknowledge().
	 */
	render(newsId: NewsId, dialog?: Dialog): Children

	/**
	 * Return true iff the news should be shown to the logged-in user.
	 */
	isShown(newsId: NewsId): Promise<boolean>
}
