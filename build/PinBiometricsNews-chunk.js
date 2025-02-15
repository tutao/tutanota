import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { isAndroidApp, isIOSApp } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
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
import { Dialog } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import { ExternalLink } from "./ExternalLink-chunk.js";
import "./CredentialEncryptionMode-chunk.js";
import "./RadioSelector-chunk.js";
import { showCredentialsEncryptionModeDialog } from "./SelectCredentialsEncryptionModeDialog-chunk.js";

//#region src/common/misc/news/items/PinBiometricsNews.ts
const playstoreLink = "https://play.google.com/store/apps/details?id=de.tutao.tutanota";
const appstoreLink = "https://apps.apple.com/app/tutanota/id922429609";
var PinBiometricsNews = class {
	constructor(newsModel, credentialsProvider, userId) {
		this.newsModel = newsModel;
		this.credentialsProvider = credentialsProvider;
		this.userId = userId;
	}
	isShown(newsId) {
		return Promise.resolve((isIOSApp() || isAndroidApp()) && !this.newsModel.hasAcknowledgedNewsForDevice(newsId.newsItemId));
	}
	render(newsId) {
		const displayedLink = isAndroidApp() ? playstoreLink : appstoreLink;
		return mithril_default(".full-width", [
			mithril_default(".h4", { style: { "text-transform": "capitalize" } }, lang.get("pinBiometrics_action")),
			mithril_default("p", lang.get("pinBiometrics1_msg", { "{secureNowAction}": lang.get("secureNow_action") })),
			mithril_default("p", lang.get("pinBiometrics2_msg")),
			mithril_default("p", [mithril_default(".text-break", [mithril_default(ExternalLink, {
				href: displayedLink,
				isCompanySite: false
			})])]),
			mithril_default("p", lang.get("pinBiometrics3_msg")),
			mithril_default(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", [
				this.renderLaterButton(newsId),
				this.renderDismissButton(newsId),
				this.renderConfirmButton(newsId)
			])
		]);
	}
	renderLaterButton(newsId) {
		return mithril_default(Button, {
			label: "decideLater_action",
			type: ButtonType.Secondary,
			click: async () => {
				await this.newsModel.acknowledgeNews(newsId.newsItemId);
				mithril_default.redraw();
			}
		});
	}
	renderDismissButton(newsId) {
		return mithril_default(Button, {
			label: "noThanks_action",
			type: ButtonType.Secondary,
			click: async () => {
				this.newsModel.acknowledgeNewsForDevice(newsId.newsItemId);
				await this.newsModel.acknowledgeNews(newsId.newsItemId);
				mithril_default.redraw();
			}
		});
	}
	renderConfirmButton(newsId) {
		return mithril_default(Button, {
			label: "secureNow_action",
			click: async () => {
				if (await this.credentialsProvider.getCredentialsInfoByUserId(this.userId) === null) await Dialog.message(lang.getTranslation("needSavedCredentials_msg", { "{storePasswordAction}": lang.get("storePassword_action") }));
else {
					await showCredentialsEncryptionModeDialog(this.credentialsProvider);
					this.newsModel.acknowledgeNewsForDevice(newsId.newsItemId);
					await this.newsModel.acknowledgeNews(newsId.newsItemId);
					mithril_default.redraw();
				}
			},
			type: ButtonType.Primary
		});
	}
};

//#endregion
export { PinBiometricsNews };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGluQmlvbWV0cmljc05ld3MtY2h1bmsuanMiLCJuYW1lcyI6WyJuZXdzTW9kZWw6IE5ld3NNb2RlbCIsImNyZWRlbnRpYWxzUHJvdmlkZXI6IENyZWRlbnRpYWxzUHJvdmlkZXIiLCJ1c2VySWQ6IElkIiwibmV3c0lkOiBOZXdzSWQiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL21pc2MvbmV3cy9pdGVtcy9QaW5CaW9tZXRyaWNzTmV3cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXdzTGlzdEl0ZW0gfSBmcm9tIFwiLi4vTmV3c0xpc3RJdGVtLmpzXCJcbmltcG9ydCB7IE5ld3NJZCB9IGZyb20gXCIuLi8uLi8uLi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IE1pdGhyaWwgZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgaXNBbmRyb2lkQXBwLCBpc0lPU0FwcCB9IGZyb20gXCIuLi8uLi8uLi9hcGkvY29tbW9uL0Vudi5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgTmV3c01vZGVsIH0gZnJvbSBcIi4uL05ld3NNb2RlbC5qc1wiXG5pbXBvcnQgeyBzaG93Q3JlZGVudGlhbHNFbmNyeXB0aW9uTW9kZURpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9ndWkvZGlhbG9ncy9TZWxlY3RDcmVkZW50aWFsc0VuY3J5cHRpb25Nb2RlRGlhbG9nLmpzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxzUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vY3JlZGVudGlhbHMvQ3JlZGVudGlhbHNQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vZ3VpL2Jhc2UvRGlhbG9nLmpzXCJcbmltcG9ydCB7IEV4dGVybmFsTGluayB9IGZyb20gXCIuLi8uLi8uLi9ndWkvYmFzZS9FeHRlcm5hbExpbmsuanNcIlxuXG5jb25zdCBwbGF5c3RvcmVMaW5rID0gXCJodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM/aWQ9ZGUudHV0YW8udHV0YW5vdGFcIlxuY29uc3QgYXBwc3RvcmVMaW5rID0gXCJodHRwczovL2FwcHMuYXBwbGUuY29tL2FwcC90dXRhbm90YS9pZDkyMjQyOTYwOVwiXG5cbi8qKlxuICogTmV3cyBpdGVtIHRoYXQgcmVtaW5kcyB0aGUgdXNlciBvZiBjb25maWd1cmluZyBwaW4vIGJpb21ldHJpY3NcbiAqL1xuZXhwb3J0IGNsYXNzIFBpbkJpb21ldHJpY3NOZXdzIGltcGxlbWVudHMgTmV3c0xpc3RJdGVtIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBuZXdzTW9kZWw6IE5ld3NNb2RlbCwgcHJpdmF0ZSByZWFkb25seSBjcmVkZW50aWFsc1Byb3ZpZGVyOiBDcmVkZW50aWFsc1Byb3ZpZGVyLCBwcml2YXRlIHJlYWRvbmx5IHVzZXJJZDogSWQpIHt9XG5cblx0aXNTaG93bihuZXdzSWQ6IE5ld3NJZCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKGlzSU9TQXBwKCkgfHwgaXNBbmRyb2lkQXBwKCkpICYmICF0aGlzLm5ld3NNb2RlbC5oYXNBY2tub3dsZWRnZWROZXdzRm9yRGV2aWNlKG5ld3NJZC5uZXdzSXRlbUlkKSlcblx0fVxuXG5cdHJlbmRlcihuZXdzSWQ6IE5ld3NJZCk6IE1pdGhyaWwuQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGRpc3BsYXllZExpbmsgPSBpc0FuZHJvaWRBcHAoKSA/IHBsYXlzdG9yZUxpbmsgOiBhcHBzdG9yZUxpbmtcblx0XHRyZXR1cm4gbShcIi5mdWxsLXdpZHRoXCIsIFtcblx0XHRcdG0oXCIuaDRcIiwgeyBzdHlsZTogeyBcInRleHQtdHJhbnNmb3JtXCI6IFwiY2FwaXRhbGl6ZVwiIH0gfSwgbGFuZy5nZXQoXCJwaW5CaW9tZXRyaWNzX2FjdGlvblwiKSksXG5cdFx0XHRtKFwicFwiLCBsYW5nLmdldChcInBpbkJpb21ldHJpY3MxX21zZ1wiLCB7IFwie3NlY3VyZU5vd0FjdGlvbn1cIjogbGFuZy5nZXQoXCJzZWN1cmVOb3dfYWN0aW9uXCIpIH0pKSxcblx0XHRcdG0oXCJwXCIsIGxhbmcuZ2V0KFwicGluQmlvbWV0cmljczJfbXNnXCIpKSxcblx0XHRcdG0oXCJwXCIsIFttKFwiLnRleHQtYnJlYWtcIiwgW20oRXh0ZXJuYWxMaW5rLCB7IGhyZWY6IGRpc3BsYXllZExpbmssIGlzQ29tcGFueVNpdGU6IGZhbHNlIH0pXSldKSxcblx0XHRcdG0oXCJwXCIsIGxhbmcuZ2V0KFwicGluQmlvbWV0cmljczNfbXNnXCIpKSxcblx0XHRcdG0oXCIuZmxleC1lbmQuZmxleC1uby1ncm93LW5vLXNocmluay1hdXRvLmZsZXgtd3JhcFwiLCBbXG5cdFx0XHRcdHRoaXMucmVuZGVyTGF0ZXJCdXR0b24obmV3c0lkKSxcblx0XHRcdFx0dGhpcy5yZW5kZXJEaXNtaXNzQnV0dG9uKG5ld3NJZCksXG5cdFx0XHRcdHRoaXMucmVuZGVyQ29uZmlybUJ1dHRvbihuZXdzSWQpLFxuXHRcdFx0XSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTGF0ZXJCdXR0b24obmV3c0lkOiBOZXdzSWQpIHtcblx0XHRyZXR1cm4gbShCdXR0b24sIHtcblx0XHRcdGxhYmVsOiBcImRlY2lkZUxhdGVyX2FjdGlvblwiLFxuXHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRjbGljazogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCB0aGlzLm5ld3NNb2RlbC5hY2tub3dsZWRnZU5ld3MobmV3c0lkLm5ld3NJdGVtSWQpXG5cdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdH0sXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGlzbWlzc0J1dHRvbihuZXdzSWQ6IE5ld3NJZCkge1xuXHRcdHJldHVybiBtKEJ1dHRvbiwge1xuXHRcdFx0bGFiZWw6IFwibm9UaGFua3NfYWN0aW9uXCIsXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdGNsaWNrOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMubmV3c01vZGVsLmFja25vd2xlZGdlTmV3c0ZvckRldmljZShuZXdzSWQubmV3c0l0ZW1JZClcblx0XHRcdFx0YXdhaXQgdGhpcy5uZXdzTW9kZWwuYWNrbm93bGVkZ2VOZXdzKG5ld3NJZC5uZXdzSXRlbUlkKVxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNvbmZpcm1CdXR0b24obmV3c0lkOiBOZXdzSWQpIHtcblx0XHRyZXR1cm4gbShCdXR0b24sIHtcblx0XHRcdGxhYmVsOiBcInNlY3VyZU5vd19hY3Rpb25cIixcblx0XHRcdGNsaWNrOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGlmICgoYXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmdldENyZWRlbnRpYWxzSW5mb0J5VXNlcklkKHRoaXMudXNlcklkKSkgPT09IG51bGwpIHtcblx0XHRcdFx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShsYW5nLmdldFRyYW5zbGF0aW9uKFwibmVlZFNhdmVkQ3JlZGVudGlhbHNfbXNnXCIsIHsgXCJ7c3RvcmVQYXNzd29yZEFjdGlvbn1cIjogbGFuZy5nZXQoXCJzdG9yZVBhc3N3b3JkX2FjdGlvblwiKSB9KSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhd2FpdCBzaG93Q3JlZGVudGlhbHNFbmNyeXB0aW9uTW9kZURpYWxvZyh0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIpXG5cblx0XHRcdFx0XHR0aGlzLm5ld3NNb2RlbC5hY2tub3dsZWRnZU5ld3NGb3JEZXZpY2UobmV3c0lkLm5ld3NJdGVtSWQpXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5uZXdzTW9kZWwuYWNrbm93bGVkZ2VOZXdzKG5ld3NJZC5uZXdzSXRlbUlkKVxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHR9KVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsTUFBTSxnQkFBZ0I7QUFDdEIsTUFBTSxlQUFlO0lBS1Isb0JBQU4sTUFBZ0Q7Q0FDdEQsWUFBNkJBLFdBQXVDQyxxQkFBMkRDLFFBQVk7RUErRDNJLEtBL0Q2QjtFQStENUIsS0EvRG1FO0VBK0RsRSxLQS9ENkg7Q0FBYztDQUU3SSxRQUFRQyxRQUFrQztBQUN6QyxTQUFPLFFBQVEsU0FBUyxVQUFVLElBQUksY0FBYyxNQUFNLEtBQUssVUFBVSw2QkFBNkIsT0FBTyxXQUFXLENBQUM7Q0FDekg7Q0FFRCxPQUFPQSxRQUFrQztFQUN4QyxNQUFNLGdCQUFnQixjQUFjLEdBQUcsZ0JBQWdCO0FBQ3ZELFNBQU8sZ0JBQUUsZUFBZTtHQUN2QixnQkFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixhQUFjLEVBQUUsR0FBRSxLQUFLLElBQUksdUJBQXVCLENBQUM7R0FDekYsZ0JBQUUsS0FBSyxLQUFLLElBQUksc0JBQXNCLEVBQUUscUJBQXFCLEtBQUssSUFBSSxtQkFBbUIsQ0FBRSxFQUFDLENBQUM7R0FDN0YsZ0JBQUUsS0FBSyxLQUFLLElBQUkscUJBQXFCLENBQUM7R0FDdEMsZ0JBQUUsS0FBSyxDQUFDLGdCQUFFLGVBQWUsQ0FBQyxnQkFBRSxjQUFjO0lBQUUsTUFBTTtJQUFlLGVBQWU7R0FBTyxFQUFDLEFBQUMsRUFBQyxBQUFDLEVBQUM7R0FDNUYsZ0JBQUUsS0FBSyxLQUFLLElBQUkscUJBQXFCLENBQUM7R0FDdEMsZ0JBQUUsbURBQW1EO0lBQ3BELEtBQUssa0JBQWtCLE9BQU87SUFDOUIsS0FBSyxvQkFBb0IsT0FBTztJQUNoQyxLQUFLLG9CQUFvQixPQUFPO0dBQ2hDLEVBQUM7RUFDRixFQUFDO0NBQ0Y7Q0FFRCxBQUFRLGtCQUFrQkEsUUFBZ0I7QUFDekMsU0FBTyxnQkFBRSxRQUFRO0dBQ2hCLE9BQU87R0FDUCxNQUFNLFdBQVc7R0FDakIsT0FBTyxZQUFZO0FBQ2xCLFVBQU0sS0FBSyxVQUFVLGdCQUFnQixPQUFPLFdBQVc7QUFDdkQsb0JBQUUsUUFBUTtHQUNWO0VBQ0QsRUFBQztDQUNGO0NBRUQsQUFBUSxvQkFBb0JBLFFBQWdCO0FBQzNDLFNBQU8sZ0JBQUUsUUFBUTtHQUNoQixPQUFPO0dBQ1AsTUFBTSxXQUFXO0dBQ2pCLE9BQU8sWUFBWTtBQUNsQixTQUFLLFVBQVUseUJBQXlCLE9BQU8sV0FBVztBQUMxRCxVQUFNLEtBQUssVUFBVSxnQkFBZ0IsT0FBTyxXQUFXO0FBQ3ZELG9CQUFFLFFBQVE7R0FDVjtFQUNELEVBQUM7Q0FDRjtDQUVELEFBQVEsb0JBQW9CQSxRQUFnQjtBQUMzQyxTQUFPLGdCQUFFLFFBQVE7R0FDaEIsT0FBTztHQUNQLE9BQU8sWUFBWTtBQUNsQixRQUFLLE1BQU0sS0FBSyxvQkFBb0IsMkJBQTJCLEtBQUssT0FBTyxLQUFNLEtBQ2hGLE9BQU0sT0FBTyxRQUFRLEtBQUssZUFBZSw0QkFBNEIsRUFBRSx5QkFBeUIsS0FBSyxJQUFJLHVCQUF1QixDQUFFLEVBQUMsQ0FBQztLQUM5SDtBQUNOLFdBQU0sb0NBQW9DLEtBQUssb0JBQW9CO0FBRW5FLFVBQUssVUFBVSx5QkFBeUIsT0FBTyxXQUFXO0FBQzFELFdBQU0sS0FBSyxVQUFVLGdCQUFnQixPQUFPLFdBQVc7QUFDdkQscUJBQUUsUUFBUTtJQUNWO0dBQ0Q7R0FDRCxNQUFNLFdBQVc7RUFDakIsRUFBQztDQUNGO0FBQ0QifQ==