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
import { Dialog } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import "./ExternalLink-chunk.js";
import { MoreInfoLink } from "./MoreInfoLink-chunk.js";

//#region src/common/misc/news/items/UsageOptInNews.ts
var UsageOptInNews = class {
	constructor(newsModel, usageTestModel) {
		this.newsModel = newsModel;
		this.usageTestModel = usageTestModel;
	}
	isShown() {
		return Promise.resolve(locator.usageTestModel.showOptInIndicator());
	}
	render(newsId) {
		const closeAction = (optedIn) => {
			this.newsModel.acknowledgeNews(newsId.newsItemId).then(() => {
				if (optedIn) Dialog.message("userUsageDataOptInThankYouOptedIn_msg");
else if (optedIn !== undefined) Dialog.message("userUsageDataOptInThankYouOptedOut_msg");
			}).then(mithril_default.redraw);
		};
		const buttonAttrs = [
			{
				label: "decideLater_action",
				click: () => closeAction(),
				type: ButtonType.Secondary
			},
			{
				label: "deactivate_action",
				click: () => {
					const decision = false;
					this.usageTestModel.setOptInDecision(decision).then(() => closeAction(decision));
				},
				type: ButtonType.Secondary
			},
			{
				label: "activate_action",
				click: () => {
					const decision = true;
					this.usageTestModel.setOptInDecision(decision).then(() => closeAction(decision));
				},
				type: ButtonType.Primary
			}
		];
		return mithril_default(".full-width", [
			mithril_default(".h4", lang.get("userUsageDataOptIn_title")),
			mithril_default(".pb", lang.get("userUsageDataOptInExplanation_msg")),
			mithril_default("ul.usage-test-opt-in-bullets", [
				mithril_default("li", lang.get("userUsageDataOptInStatement1_msg")),
				mithril_default("li", lang.get("userUsageDataOptInStatement2_msg")),
				mithril_default("li", lang.get("userUsageDataOptInStatement3_msg")),
				mithril_default("li", lang.get("userUsageDataOptInStatement4_msg"))
			]),
			mithril_default(MoreInfoLink, { link: InfoLink.Privacy }),
			mithril_default(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", buttonAttrs.map((a) => mithril_default(Button, a)))
		]);
	}
};

//#endregion
export { UsageOptInNews };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNhZ2VPcHRJbk5ld3MtY2h1bmsuanMiLCJuYW1lcyI6WyJuZXdzTW9kZWw6IE5ld3NNb2RlbCIsInVzYWdlVGVzdE1vZGVsOiBVc2FnZVRlc3RNb2RlbCIsIm5ld3NJZDogTmV3c0lkIiwib3B0ZWRJbj86IGJvb2xlYW4iLCJtIiwiYnV0dG9uQXR0cnM6IEFycmF5PEJ1dHRvbkF0dHJzPiJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL1VzYWdlT3B0SW5OZXdzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5ld3NMaXN0SXRlbSB9IGZyb20gXCIuLi9OZXdzTGlzdEl0ZW0uanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBOZXdzSWQgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBJbmZvTGluaywgbGFuZyB9IGZyb20gXCIuLi8uLi9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vZ3VpL2Jhc2UvRGlhbG9nLmpzXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uQXR0cnMsIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IE5ld3NNb2RlbCB9IGZyb20gXCIuLi9OZXdzTW9kZWwuanNcIlxuaW1wb3J0IHsgVXNhZ2VUZXN0TW9kZWwgfSBmcm9tIFwiLi4vLi4vVXNhZ2VUZXN0TW9kZWwuanNcIlxuaW1wb3J0IHsgTW9yZUluZm9MaW5rIH0gZnJvbSBcIi4uL01vcmVJbmZvTGluay5qc1wiXG5cbi8qKlxuICogTmV3cyBpdGVtIHRoYXQgaW5mb3JtcyB1c2VycyBhYm91dCB0aGUgdXNhZ2UgZGF0YSBvcHQtaW4uXG4gKi9cbmV4cG9ydCBjbGFzcyBVc2FnZU9wdEluTmV3cyBpbXBsZW1lbnRzIE5ld3NMaXN0SXRlbSB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbmV3c01vZGVsOiBOZXdzTW9kZWwsIHByaXZhdGUgcmVhZG9ubHkgdXNhZ2VUZXN0TW9kZWw6IFVzYWdlVGVzdE1vZGVsKSB7fVxuXG5cdGlzU2hvd24oKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShsb2NhdG9yLnVzYWdlVGVzdE1vZGVsLnNob3dPcHRJbkluZGljYXRvcigpKVxuXHR9XG5cblx0cmVuZGVyKG5ld3NJZDogTmV3c0lkKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGNsb3NlQWN0aW9uID0gKG9wdGVkSW4/OiBib29sZWFuKSA9PiB7XG5cdFx0XHR0aGlzLm5ld3NNb2RlbFxuXHRcdFx0XHQuYWNrbm93bGVkZ2VOZXdzKG5ld3NJZC5uZXdzSXRlbUlkKVxuXHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKG9wdGVkSW4pIHtcblx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwidXNlclVzYWdlRGF0YU9wdEluVGhhbmtZb3VPcHRlZEluX21zZ1wiKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAob3B0ZWRJbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcInVzZXJVc2FnZURhdGFPcHRJblRoYW5rWW91T3B0ZWRPdXRfbXNnXCIpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbihtLnJlZHJhdylcblx0XHR9XG5cblx0XHRjb25zdCBidXR0b25BdHRyczogQXJyYXk8QnV0dG9uQXR0cnM+ID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJkZWNpZGVMYXRlcl9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IGNsb3NlQWN0aW9uKCksXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwiZGVhY3RpdmF0ZV9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBkZWNpc2lvbiA9IGZhbHNlXG5cdFx0XHRcdFx0dGhpcy51c2FnZVRlc3RNb2RlbC5zZXRPcHRJbkRlY2lzaW9uKGRlY2lzaW9uKS50aGVuKCgpID0+IGNsb3NlQWN0aW9uKGRlY2lzaW9uKSlcblx0XHRcdFx0fSxcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJhY3RpdmF0ZV9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBkZWNpc2lvbiA9IHRydWVcblx0XHRcdFx0XHR0aGlzLnVzYWdlVGVzdE1vZGVsLnNldE9wdEluRGVjaXNpb24oZGVjaXNpb24pLnRoZW4oKCkgPT4gY2xvc2VBY3Rpb24oZGVjaXNpb24pKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHR9LFxuXHRcdF1cblxuXHRcdHJldHVybiBtKFwiLmZ1bGwtd2lkdGhcIiwgW1xuXHRcdFx0bShcIi5oNFwiLCBsYW5nLmdldChcInVzZXJVc2FnZURhdGFPcHRJbl90aXRsZVwiKSksXG5cdFx0XHRtKFwiLnBiXCIsIGxhbmcuZ2V0KFwidXNlclVzYWdlRGF0YU9wdEluRXhwbGFuYXRpb25fbXNnXCIpKSxcblx0XHRcdG0oXCJ1bC51c2FnZS10ZXN0LW9wdC1pbi1idWxsZXRzXCIsIFtcblx0XHRcdFx0bShcImxpXCIsIGxhbmcuZ2V0KFwidXNlclVzYWdlRGF0YU9wdEluU3RhdGVtZW50MV9tc2dcIikpLFxuXHRcdFx0XHRtKFwibGlcIiwgbGFuZy5nZXQoXCJ1c2VyVXNhZ2VEYXRhT3B0SW5TdGF0ZW1lbnQyX21zZ1wiKSksXG5cdFx0XHRcdG0oXCJsaVwiLCBsYW5nLmdldChcInVzZXJVc2FnZURhdGFPcHRJblN0YXRlbWVudDNfbXNnXCIpKSxcblx0XHRcdFx0bShcImxpXCIsIGxhbmcuZ2V0KFwidXNlclVzYWdlRGF0YU9wdEluU3RhdGVtZW50NF9tc2dcIikpLFxuXHRcdFx0XSksXG5cdFx0XHRtKE1vcmVJbmZvTGluaywgeyBsaW5rOiBJbmZvTGluay5Qcml2YWN5IH0pLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1lbmQuZmxleC1uby1ncm93LW5vLXNocmluay1hdXRvLmZsZXgtd3JhcFwiLFxuXHRcdFx0XHRidXR0b25BdHRycy5tYXAoKGEpID0+IG0oQnV0dG9uLCBhKSksXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWNhLGlCQUFOLE1BQTZDO0NBQ25ELFlBQTZCQSxXQUF1Q0MsZ0JBQWdDO0VBNkRwRyxLQTdENkI7RUE2RDVCLEtBN0RtRTtDQUFrQztDQUV0RyxVQUE0QjtBQUMzQixTQUFPLFFBQVEsUUFBUSxRQUFRLGVBQWUsb0JBQW9CLENBQUM7Q0FDbkU7Q0FFRCxPQUFPQyxRQUEwQjtFQUNoQyxNQUFNLGNBQWMsQ0FBQ0MsWUFBc0I7QUFDMUMsUUFBSyxVQUNILGdCQUFnQixPQUFPLFdBQVcsQ0FDbEMsS0FBSyxNQUFNO0FBQ1gsUUFBSSxRQUNILFFBQU8sUUFBUSx3Q0FBd0M7U0FDN0MsWUFBWSxVQUN0QixRQUFPLFFBQVEseUNBQXlDO0dBRXpELEVBQUMsQ0FDRCxLQUFLQyxnQkFBRSxPQUFPO0VBQ2hCO0VBRUQsTUFBTUMsY0FBa0M7R0FDdkM7SUFDQyxPQUFPO0lBQ1AsT0FBTyxNQUFNLGFBQWE7SUFDMUIsTUFBTSxXQUFXO0dBQ2pCO0dBQ0Q7SUFDQyxPQUFPO0lBQ1AsT0FBTyxNQUFNO0tBQ1osTUFBTSxXQUFXO0FBQ2pCLFVBQUssZUFBZSxpQkFBaUIsU0FBUyxDQUFDLEtBQUssTUFBTSxZQUFZLFNBQVMsQ0FBQztJQUNoRjtJQUNELE1BQU0sV0FBVztHQUNqQjtHQUNEO0lBQ0MsT0FBTztJQUNQLE9BQU8sTUFBTTtLQUNaLE1BQU0sV0FBVztBQUNqQixVQUFLLGVBQWUsaUJBQWlCLFNBQVMsQ0FBQyxLQUFLLE1BQU0sWUFBWSxTQUFTLENBQUM7SUFDaEY7SUFDRCxNQUFNLFdBQVc7R0FDakI7RUFDRDtBQUVELFNBQU8sZ0JBQUUsZUFBZTtHQUN2QixnQkFBRSxPQUFPLEtBQUssSUFBSSwyQkFBMkIsQ0FBQztHQUM5QyxnQkFBRSxPQUFPLEtBQUssSUFBSSxvQ0FBb0MsQ0FBQztHQUN2RCxnQkFBRSxnQ0FBZ0M7SUFDakMsZ0JBQUUsTUFBTSxLQUFLLElBQUksbUNBQW1DLENBQUM7SUFDckQsZ0JBQUUsTUFBTSxLQUFLLElBQUksbUNBQW1DLENBQUM7SUFDckQsZ0JBQUUsTUFBTSxLQUFLLElBQUksbUNBQW1DLENBQUM7SUFDckQsZ0JBQUUsTUFBTSxLQUFLLElBQUksbUNBQW1DLENBQUM7R0FDckQsRUFBQztHQUNGLGdCQUFFLGNBQWMsRUFBRSxNQUFNLFNBQVMsUUFBUyxFQUFDO0dBQzNDLGdCQUNDLG1EQUNBLFlBQVksSUFBSSxDQUFDLE1BQU0sZ0JBQUUsUUFBUSxFQUFFLENBQUMsQ0FDcEM7RUFDRCxFQUFDO0NBQ0Y7QUFDRCJ9