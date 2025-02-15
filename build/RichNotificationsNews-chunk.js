import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { isApp } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
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
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./CommonLocator-chunk.js";
import "./BannerButton-chunk.js";
import "./PermissionType-chunk.js";
import { ExtendedNotificationMode, NotificationContentSelector } from "./NotificationContentSelector-chunk.js";
import "./NotificationPermissionsDialog-chunk.js";

//#region src/common/misc/news/items/RichNotificationsNews.ts
var RichNotificationsNews = class {
	notificationMode = null;
	constructor(newsModel, pushApp) {
		this.newsModel = newsModel;
		this.pushApp = pushApp;
	}
	async isShown(_newsId) {
		return isApp() && this.pushApp != null && (this.notificationMode = await this.pushApp.getExtendedNotificationMode()) != ExtendedNotificationMode.SenderAndSubject;
	}
	render(newsId) {
		const pushApp = assertNotNull(this.pushApp);
		return mithril_default(".full-width", [
			mithril_default(".h4", { style: { "text-transform": "capitalize" } }, lang.get("richNotifications_title")),
			mithril_default("p", lang.get("richNotificationsNewsItem_msg")),
			mithril_default(".max-width-s", mithril_default(NotificationContentSelector, {
				extendedNotificationMode: this.notificationMode ?? ExtendedNotificationMode.NoSenderOrSubject,
				onChange: (mode) => {
					this.notificationMode = mode;
					pushApp.setExtendedNotificationMode(mode);
				}
			})),
			mithril_default(".flex-end", mithril_default(Button, {
				label: "close_alt",
				click: () => this.acknowledge(newsId),
				type: ButtonType.Secondary
			}))
		]);
	}
	async acknowledge(newsId) {
		await this.newsModel.acknowledgeNews(newsId.newsItemId);
		mithril_default.redraw();
	}
};

//#endregion
export { RichNotificationsNews };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmljaE5vdGlmaWNhdGlvbnNOZXdzLWNodW5rLmpzIiwibmFtZXMiOlsibmV3c01vZGVsOiBOZXdzTW9kZWwiLCJwdXNoQXBwOiBOYXRpdmVQdXNoU2VydmljZUFwcCB8IG51bGwiLCJfbmV3c0lkOiBOZXdzSWQiLCJuZXdzSWQ6IE5ld3NJZCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL1JpY2hOb3RpZmljYXRpb25zTmV3cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXdzTGlzdEl0ZW0gfSBmcm9tIFwiLi4vTmV3c0xpc3RJdGVtLmpzXCJcbmltcG9ydCB7IE5ld3NJZCB9IGZyb20gXCIuLi8uLi8uLi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBOZXdzTW9kZWwgfSBmcm9tIFwiLi4vTmV3c01vZGVsLmpzXCJcbmltcG9ydCB7IE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIH0gZnJvbSBcIi4uLy4uLy4uL25hdGl2ZS9tYWluL05hdGl2ZVB1c2hTZXJ2aWNlQXBwLmpzXCJcbmltcG9ydCB7IEV4dGVuZGVkTm90aWZpY2F0aW9uTW9kZSB9IGZyb20gXCIuLi8uLi8uLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9FeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IE5vdGlmaWNhdGlvbkNvbnRlbnRTZWxlY3RvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9tYWlsLWFwcC9zZXR0aW5ncy9Ob3RpZmljYXRpb25Db250ZW50U2VsZWN0b3IuanNcIlxuaW1wb3J0IHsgaXNBcHAgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuXG5leHBvcnQgY2xhc3MgUmljaE5vdGlmaWNhdGlvbnNOZXdzIGltcGxlbWVudHMgTmV3c0xpc3RJdGVtIHtcblx0cHJpdmF0ZSBub3RpZmljYXRpb25Nb2RlOiBFeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUgfCBudWxsID0gbnVsbFxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbmV3c01vZGVsOiBOZXdzTW9kZWwsIHByaXZhdGUgcmVhZG9ubHkgcHVzaEFwcDogTmF0aXZlUHVzaFNlcnZpY2VBcHAgfCBudWxsKSB7fVxuXG5cdGFzeW5jIGlzU2hvd24oX25ld3NJZDogTmV3c0lkKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIChcblx0XHRcdGlzQXBwKCkgJiZcblx0XHRcdHRoaXMucHVzaEFwcCAhPSBudWxsICYmXG5cdFx0XHQodGhpcy5ub3RpZmljYXRpb25Nb2RlID0gYXdhaXQgdGhpcy5wdXNoQXBwLmdldEV4dGVuZGVkTm90aWZpY2F0aW9uTW9kZSgpKSAhPSBFeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUuU2VuZGVyQW5kU3ViamVjdFxuXHRcdClcblx0fVxuXG5cdHJlbmRlcihuZXdzSWQ6IE5ld3NJZCk6IENoaWxkcmVuIHtcblx0XHQvLyBpZiB3ZSBnb3QgaGVyZSB0aGVuIHdlIG11c3QgaGF2ZSBpdFxuXHRcdGNvbnN0IHB1c2hBcHAgPSBhc3NlcnROb3ROdWxsKHRoaXMucHVzaEFwcClcblx0XHRyZXR1cm4gbShcIi5mdWxsLXdpZHRoXCIsIFtcblx0XHRcdG0oXCIuaDRcIiwgeyBzdHlsZTogeyBcInRleHQtdHJhbnNmb3JtXCI6IFwiY2FwaXRhbGl6ZVwiIH0gfSwgbGFuZy5nZXQoXCJyaWNoTm90aWZpY2F0aW9uc190aXRsZVwiKSksXG5cdFx0XHRtKFwicFwiLCBsYW5nLmdldChcInJpY2hOb3RpZmljYXRpb25zTmV3c0l0ZW1fbXNnXCIpKSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLm1heC13aWR0aC1zXCIsXG5cdFx0XHRcdG0oTm90aWZpY2F0aW9uQ29udGVudFNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0ZXh0ZW5kZWROb3RpZmljYXRpb25Nb2RlOiB0aGlzLm5vdGlmaWNhdGlvbk1vZGUgPz8gRXh0ZW5kZWROb3RpZmljYXRpb25Nb2RlLk5vU2VuZGVyT3JTdWJqZWN0LFxuXHRcdFx0XHRcdG9uQ2hhbmdlOiAobW9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5ub3RpZmljYXRpb25Nb2RlID0gbW9kZVxuXHRcdFx0XHRcdFx0cHVzaEFwcC5zZXRFeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUobW9kZSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LWVuZFwiLFxuXHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLmFja25vd2xlZGdlKG5ld3NJZCksXG5cdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBhY2tub3dsZWRnZShuZXdzSWQ6IE5ld3NJZCkge1xuXHRcdGF3YWl0IHRoaXMubmV3c01vZGVsLmFja25vd2xlZGdlTmV3cyhuZXdzSWQubmV3c0l0ZW1JZClcblx0XHRtLnJlZHJhdygpXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBWWEsd0JBQU4sTUFBb0Q7Q0FDMUQsQUFBUSxtQkFBb0Q7Q0FFNUQsWUFBNkJBLFdBQXVDQyxTQUFzQztFQTBDMUcsS0ExQzZCO0VBMEM1QixLQTFDbUU7Q0FBd0M7Q0FFNUcsTUFBTSxRQUFRQyxTQUFtQztBQUNoRCxTQUNDLE9BQU8sSUFDUCxLQUFLLFdBQVcsU0FDZixLQUFLLG1CQUFtQixNQUFNLEtBQUssUUFBUSw2QkFBNkIsS0FBSyx5QkFBeUI7Q0FFeEc7Q0FFRCxPQUFPQyxRQUEwQjtFQUVoQyxNQUFNLFVBQVUsY0FBYyxLQUFLLFFBQVE7QUFDM0MsU0FBTyxnQkFBRSxlQUFlO0dBQ3ZCLGdCQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsa0JBQWtCLGFBQWMsRUFBRSxHQUFFLEtBQUssSUFBSSwwQkFBMEIsQ0FBQztHQUM1RixnQkFBRSxLQUFLLEtBQUssSUFBSSxnQ0FBZ0MsQ0FBQztHQUNqRCxnQkFDQyxnQkFDQSxnQkFBRSw2QkFBNkI7SUFDOUIsMEJBQTBCLEtBQUssb0JBQW9CLHlCQUF5QjtJQUM1RSxVQUFVLENBQUMsU0FBUztBQUNuQixVQUFLLG1CQUFtQjtBQUN4QixhQUFRLDRCQUE0QixLQUFLO0lBQ3pDO0dBQ0QsRUFBQyxDQUNGO0dBQ0QsZ0JBQ0MsYUFDQSxnQkFBRSxRQUFRO0lBQ1QsT0FBTztJQUNQLE9BQU8sTUFBTSxLQUFLLFlBQVksT0FBTztJQUNyQyxNQUFNLFdBQVc7R0FDakIsRUFBQyxDQUNGO0VBQ0QsRUFBQztDQUNGO0NBRUQsTUFBYyxZQUFZQSxRQUFnQjtBQUN6QyxRQUFNLEtBQUssVUFBVSxnQkFBZ0IsT0FBTyxXQUFXO0FBQ3ZELGtCQUFFLFFBQVE7Q0FDVjtBQUNEIn0=