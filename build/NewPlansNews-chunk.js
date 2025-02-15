import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./EntityUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./stream-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./CommonLocator-chunk.js";
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "./SubscriptionDialogs-chunk.js";

//#region src/common/misc/news/items/NewPlansNews.ts
var NewPlansNews = class {
	constructor(newsModel, userController) {
		this.newsModel = newsModel;
		this.userController = userController;
	}
	async isShown() {
		if (!this.userController.isGlobalAdmin()) return false;
		return !await this.userController.isNewPaidPlan();
	}
	render(newsId) {
		const lnk = InfoLink.Privacy;
		const acknowledgeAction = () => {
			this.newsModel.acknowledgeNews(newsId.newsItemId).then(mithril_default.redraw);
		};
		const buttonAttrs = [{
			label: "decideLater_action",
			click: () => acknowledgeAction(),
			type: ButtonType.Secondary
		}, {
			label: "showMoreUpgrade_action",
			click: async () => {
				await showUpgradeWizardOrSwitchSubscriptionDialog(this.userController);
				if (await this.userController.isNewPaidPlan()) acknowledgeAction();
			},
			type: ButtonType.Primary
		}];
		return mithril_default(".full-width", [
			mithril_default(".h4", lang.get("newPlansNews_title")),
			mithril_default(".pb", lang.get("newPlansExplanation_msg", {
				"{plan1}": "Revolutionary",
				"{plan2}": "Legend"
			})),
			mithril_default(".pb", lang.get("newPlansOfferExplanation_msg")),
			mithril_default(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", buttonAttrs.map((a) => mithril_default(Button, a)))
		]);
	}
};

//#endregion
export { NewPlansNews };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV3UGxhbnNOZXdzLWNodW5rLmpzIiwibmFtZXMiOlsibmV3c01vZGVsOiBOZXdzTW9kZWwiLCJ1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIiLCJuZXdzSWQ6IE5ld3NJZCIsIm0iLCJidXR0b25BdHRyczogQXJyYXk8QnV0dG9uQXR0cnM+Il0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9taXNjL25ld3MvaXRlbXMvTmV3UGxhbnNOZXdzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5ld3NMaXN0SXRlbSB9IGZyb20gXCIuLi9OZXdzTGlzdEl0ZW0uanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBOZXdzSWQgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEluZm9MaW5rLCBsYW5nIH0gZnJvbSBcIi4uLy4uL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uQXR0cnMsIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IE5ld3NNb2RlbCB9IGZyb20gXCIuLi9OZXdzTW9kZWwuanNcIlxuaW1wb3J0IHsgVXNlckNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL21haW4vVXNlckNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgc2hvd1VwZ3JhZGVXaXphcmRPclN3aXRjaFN1YnNjcmlwdGlvbkRpYWxvZyB9IGZyb20gXCIuLi8uLi9TdWJzY3JpcHRpb25EaWFsb2dzLmpzXCJcblxuLyoqXG4gKiBOZXdzIGl0ZW0gdGhhdCBpbmZvcm1zIGFkbWluIHVzZXJzIGFib3V0IHRoZSBuZXcgcHJpY2luZyBtb2RlbC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5ld1BsYW5zTmV3cyBpbXBsZW1lbnRzIE5ld3NMaXN0SXRlbSB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbmV3c01vZGVsOiBOZXdzTW9kZWwsIHByaXZhdGUgcmVhZG9ubHkgdXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVyKSB7fVxuXG5cdGFzeW5jIGlzU2hvd24oKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0aWYgKCF0aGlzLnVzZXJDb250cm9sbGVyLmlzR2xvYmFsQWRtaW4oKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0Ly8gLy8gRG8gbm90IHNob3cgdGhpcyBmb3IgY3VzdG9tZXJzIHRoYXQgYXJlIGFscmVhZHkgb24gYSBuZXcgcGxhblxuXHRcdHJldHVybiAhKGF3YWl0IHRoaXMudXNlckNvbnRyb2xsZXIuaXNOZXdQYWlkUGxhbigpKVxuXHR9XG5cblx0cmVuZGVyKG5ld3NJZDogTmV3c0lkKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGxuayA9IEluZm9MaW5rLlByaXZhY3lcblxuXHRcdGNvbnN0IGFja25vd2xlZGdlQWN0aW9uID0gKCkgPT4ge1xuXHRcdFx0dGhpcy5uZXdzTW9kZWwuYWNrbm93bGVkZ2VOZXdzKG5ld3NJZC5uZXdzSXRlbUlkKS50aGVuKG0ucmVkcmF3KVxuXHRcdH1cblxuXHRcdGNvbnN0IGJ1dHRvbkF0dHJzOiBBcnJheTxCdXR0b25BdHRycz4gPSBbXG5cdFx0XHR7XG5cdFx0XHRcdGxhYmVsOiBcImRlY2lkZUxhdGVyX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogKCkgPT4gYWNrbm93bGVkZ2VBY3Rpb24oKSxcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJzaG93TW9yZVVwZ3JhZGVfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0YXdhaXQgc2hvd1VwZ3JhZGVXaXphcmRPclN3aXRjaFN1YnNjcmlwdGlvbkRpYWxvZyh0aGlzLnVzZXJDb250cm9sbGVyKVxuXHRcdFx0XHRcdGlmIChhd2FpdCB0aGlzLnVzZXJDb250cm9sbGVyLmlzTmV3UGFpZFBsYW4oKSkge1xuXHRcdFx0XHRcdFx0YWNrbm93bGVkZ2VBY3Rpb24oKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0fSxcblx0XHRdXG5cblx0XHRyZXR1cm4gbShcIi5mdWxsLXdpZHRoXCIsIFtcblx0XHRcdG0oXCIuaDRcIiwgbGFuZy5nZXQoXCJuZXdQbGFuc05ld3NfdGl0bGVcIikpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIucGJcIixcblx0XHRcdFx0bGFuZy5nZXQoXCJuZXdQbGFuc0V4cGxhbmF0aW9uX21zZ1wiLCB7XG5cdFx0XHRcdFx0XCJ7cGxhbjF9XCI6IFwiUmV2b2x1dGlvbmFyeVwiLFxuXHRcdFx0XHRcdFwie3BsYW4yfVwiOiBcIkxlZ2VuZFwiLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKFwiLnBiXCIsIGxhbmcuZ2V0KFwibmV3UGxhbnNPZmZlckV4cGxhbmF0aW9uX21zZ1wiKSksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LWVuZC5mbGV4LW5vLWdyb3ctbm8tc2hyaW5rLWF1dG8uZmxleC13cmFwXCIsXG5cdFx0XHRcdGJ1dHRvbkF0dHJzLm1hcCgoYSkgPT4gbShCdXR0b24sIGEpKSxcblx0XHRcdCksXG5cdFx0XSlcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFZYSxlQUFOLE1BQTJDO0NBQ2pELFlBQTZCQSxXQUF1Q0MsZ0JBQWdDO0VBcURwRyxLQXJENkI7RUFxRDVCLEtBckRtRTtDQUFrQztDQUV0RyxNQUFNLFVBQTRCO0FBQ2pDLE9BQUssS0FBSyxlQUFlLGVBQWUsQ0FDdkMsUUFBTztBQUlSLFVBQVMsTUFBTSxLQUFLLGVBQWUsZUFBZTtDQUNsRDtDQUVELE9BQU9DLFFBQTBCO0VBQ2hDLE1BQU0sTUFBTSxTQUFTO0VBRXJCLE1BQU0sb0JBQW9CLE1BQU07QUFDL0IsUUFBSyxVQUFVLGdCQUFnQixPQUFPLFdBQVcsQ0FBQyxLQUFLQyxnQkFBRSxPQUFPO0VBQ2hFO0VBRUQsTUFBTUMsY0FBa0MsQ0FDdkM7R0FDQyxPQUFPO0dBQ1AsT0FBTyxNQUFNLG1CQUFtQjtHQUNoQyxNQUFNLFdBQVc7RUFDakIsR0FDRDtHQUNDLE9BQU87R0FDUCxPQUFPLFlBQVk7QUFDbEIsVUFBTSw0Q0FBNEMsS0FBSyxlQUFlO0FBQ3RFLFFBQUksTUFBTSxLQUFLLGVBQWUsZUFBZSxDQUM1QyxvQkFBbUI7R0FFcEI7R0FDRCxNQUFNLFdBQVc7RUFDakIsQ0FDRDtBQUVELFNBQU8sZ0JBQUUsZUFBZTtHQUN2QixnQkFBRSxPQUFPLEtBQUssSUFBSSxxQkFBcUIsQ0FBQztHQUN4QyxnQkFDQyxPQUNBLEtBQUssSUFBSSwyQkFBMkI7SUFDbkMsV0FBVztJQUNYLFdBQVc7R0FDWCxFQUFDLENBQ0Y7R0FDRCxnQkFBRSxPQUFPLEtBQUssSUFBSSwrQkFBK0IsQ0FBQztHQUNsRCxnQkFDQyxtREFDQSxZQUFZLElBQUksQ0FBQyxNQUFNLGdCQUFFLFFBQVEsRUFBRSxDQUFDLENBQ3BDO0VBQ0QsRUFBQztDQUNGO0FBQ0QifQ==