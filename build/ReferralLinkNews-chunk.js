import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { getDayShifted, neverNull } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import { generatedIdToTimestamp } from "./EntityUtils-chunk.js";
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
import "./Services-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./CommonLocator-chunk.js";
import "./ExternalLink-chunk.js";
import "./SnackBar-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./MoreInfoLink-chunk.js";
import { ReferralLinkViewer, getReferralLink } from "./ReferralLinkViewer-chunk.js";

//#region src/common/misc/news/items/ReferralLinkNews.ts
const REFERRAL_NEWS_DISPLAY_THRESHOLD_DAYS = 7;
var ReferralLinkNews = class {
	referralLink = "";
	constructor(newsModel, dateProvider, userController) {
		this.newsModel = newsModel;
		this.dateProvider = dateProvider;
		this.userController = userController;
	}
	async isShown() {
		if ((await this.userController.loadCustomer()).businessUse === true) return false;
		this.referralLink = await getReferralLink(this.userController);
		const customerCreatedTime = generatedIdToTimestamp(neverNull(this.userController.user.customer));
		return this.userController.isGlobalAdmin() && getDayShifted(new Date(customerCreatedTime), REFERRAL_NEWS_DISPLAY_THRESHOLD_DAYS) <= new Date(this.dateProvider.now());
	}
	render(newsId) {
		const buttonAttrs = [{
			label: "close_alt",
			click: () => this.newsModel.acknowledgeNews(newsId.newsItemId).then(mithril_default.redraw),
			type: ButtonType.Secondary
		}];
		return mithril_default(".full-width", [mithril_default(ReferralLinkViewer, { referralLink: this.referralLink }), mithril_default(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", buttonAttrs.map((a) => mithril_default(Button, a)))]);
	}
};

//#endregion
export { ReferralLinkNews };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVmZXJyYWxMaW5rTmV3cy1jaHVuay5qcyIsIm5hbWVzIjpbIm5ld3NNb2RlbDogTmV3c01vZGVsIiwiZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIiLCJ1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIiLCJuZXdzSWQ6IE5ld3NJZCIsImJ1dHRvbkF0dHJzOiBBcnJheTxCdXR0b25BdHRycz4iLCJtIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9taXNjL25ld3MvaXRlbXMvUmVmZXJyYWxMaW5rTmV3cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXdzTGlzdEl0ZW0gfSBmcm9tIFwiLi4vTmV3c0xpc3RJdGVtLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgTmV3c0lkIH0gZnJvbSBcIi4uLy4uLy4uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvbkF0dHJzLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBOZXdzTW9kZWwgfSBmcm9tIFwiLi4vTmV3c01vZGVsLmpzXCJcbmltcG9ydCB7IGdldFJlZmVycmFsTGluaywgUmVmZXJyYWxMaW5rVmlld2VyIH0gZnJvbSBcIi4vUmVmZXJyYWxMaW5rVmlld2VyLmpzXCJcbmltcG9ydCB7IERhdGVQcm92aWRlciB9IGZyb20gXCIuLi8uLi8uLi9hcGkvY29tbW9uL0RhdGVQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBnZW5lcmF0ZWRJZFRvVGltZXN0YW1wIH0gZnJvbSBcIi4uLy4uLy4uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0RGF5U2hpZnRlZCwgbmV2ZXJOdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBVc2VyQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9hcGkvbWFpbi9Vc2VyQ29udHJvbGxlci5qc1wiXG5cbmNvbnN0IFJFRkVSUkFMX05FV1NfRElTUExBWV9USFJFU0hPTERfREFZUyA9IDdcblxuLyoqXG4gKiBOZXdzIGl0ZW0gdGhhdCBpbmZvcm1zIHVzZXJzIGFib3V0IG9wdGlvbiB0byByZWZlciBmcmllbmRzLiBPbmx5IHNob3duIGFmdGVyIHRoZSBjdXN0b21lciBleGlzdHMgYXQgbGVhc3QgNyBkYXlzLlxuICpcbiAqIE5vdCBzaG93biBmb3Igbm9uLWFkbWluIHVzZXJzLlxuICovXG5leHBvcnQgY2xhc3MgUmVmZXJyYWxMaW5rTmV3cyBpbXBsZW1lbnRzIE5ld3NMaXN0SXRlbSB7XG5cdHByaXZhdGUgcmVmZXJyYWxMaW5rOiBzdHJpbmcgPSBcIlwiXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBuZXdzTW9kZWw6IE5ld3NNb2RlbCwgcHJpdmF0ZSByZWFkb25seSBkYXRlUHJvdmlkZXI6IERhdGVQcm92aWRlciwgcHJpdmF0ZSByZWFkb25seSB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIpIHt9XG5cblx0YXN5bmMgaXNTaG93bigpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHQvLyBEbyBub3Qgc2hvdyB0aGlzIGZvciBidXNpbmVzcyBjdXN0b21lcnMgeWV0IChub3QgYWxsb3dlZCB0byBjcmVhdGUgcmVmZXJyYWwgbGlua3MpXG5cdFx0aWYgKChhd2FpdCB0aGlzLnVzZXJDb250cm9sbGVyLmxvYWRDdXN0b21lcigpKS5idXNpbmVzc1VzZSA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0Ly8gQ3JlYXRlIHRoZSByZWZlcnJhbCBsaW5rXG5cdFx0dGhpcy5yZWZlcnJhbExpbmsgPSBhd2FpdCBnZXRSZWZlcnJhbExpbmsodGhpcy51c2VyQ29udHJvbGxlcilcblxuXHRcdC8vIERlY29kZSB0aGUgZGF0ZSB0aGUgdXNlciB3YXMgZ2VuZXJhdGVkIGZyb20gdGhlIHRpbWVzdGFtcCBpbiB0aGUgdXNlciBJRFxuXHRcdGNvbnN0IGN1c3RvbWVyQ3JlYXRlZFRpbWUgPSBnZW5lcmF0ZWRJZFRvVGltZXN0YW1wKG5ldmVyTnVsbCh0aGlzLnVzZXJDb250cm9sbGVyLnVzZXIuY3VzdG9tZXIpKVxuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLnVzZXJDb250cm9sbGVyLmlzR2xvYmFsQWRtaW4oKSAmJlxuXHRcdFx0Z2V0RGF5U2hpZnRlZChuZXcgRGF0ZShjdXN0b21lckNyZWF0ZWRUaW1lKSwgUkVGRVJSQUxfTkVXU19ESVNQTEFZX1RIUkVTSE9MRF9EQVlTKSA8PSBuZXcgRGF0ZSh0aGlzLmRhdGVQcm92aWRlci5ub3coKSlcblx0XHQpXG5cdH1cblxuXHRyZW5kZXIobmV3c0lkOiBOZXdzSWQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYnV0dG9uQXR0cnM6IEFycmF5PEJ1dHRvbkF0dHJzPiA9IFtcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLm5ld3NNb2RlbC5hY2tub3dsZWRnZU5ld3MobmV3c0lkLm5ld3NJdGVtSWQpLnRoZW4obS5yZWRyYXcpLFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdH0sXG5cdFx0XVxuXG5cdFx0cmV0dXJuIG0oXCIuZnVsbC13aWR0aFwiLCBbXG5cdFx0XHRtKFJlZmVycmFsTGlua1ZpZXdlciwgeyByZWZlcnJhbExpbms6IHRoaXMucmVmZXJyYWxMaW5rIH0pLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1lbmQuZmxleC1uby1ncm93LW5vLXNocmluay1hdXRvLmZsZXgtd3JhcFwiLFxuXHRcdFx0XHRidXR0b25BdHRycy5tYXAoKGEpID0+IG0oQnV0dG9uLCBhKSksXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFXQSxNQUFNLHVDQUF1QztJQU9oQyxtQkFBTixNQUErQztDQUNyRCxBQUFRLGVBQXVCO0NBRS9CLFlBQTZCQSxXQUF1Q0MsY0FBNkNDLGdCQUFnQztFQXFDakosS0FyQzZCO0VBcUM1QixLQXJDbUU7RUFxQ2xFLEtBckMrRztDQUFrQztDQUVuSixNQUFNLFVBQTRCO0FBRWpDLE9BQUssTUFBTSxLQUFLLGVBQWUsY0FBYyxFQUFFLGdCQUFnQixLQUM5RCxRQUFPO0FBSVIsT0FBSyxlQUFlLE1BQU0sZ0JBQWdCLEtBQUssZUFBZTtFQUc5RCxNQUFNLHNCQUFzQix1QkFBdUIsVUFBVSxLQUFLLGVBQWUsS0FBSyxTQUFTLENBQUM7QUFDaEcsU0FDQyxLQUFLLGVBQWUsZUFBZSxJQUNuQyxjQUFjLElBQUksS0FBSyxzQkFBc0IscUNBQXFDLElBQUksSUFBSSxLQUFLLEtBQUssYUFBYSxLQUFLO0NBRXZIO0NBRUQsT0FBT0MsUUFBMEI7RUFDaEMsTUFBTUMsY0FBa0MsQ0FDdkM7R0FDQyxPQUFPO0dBQ1AsT0FBTyxNQUFNLEtBQUssVUFBVSxnQkFBZ0IsT0FBTyxXQUFXLENBQUMsS0FBS0MsZ0JBQUUsT0FBTztHQUM3RSxNQUFNLFdBQVc7RUFDakIsQ0FDRDtBQUVELFNBQU8sZ0JBQUUsZUFBZSxDQUN2QixnQkFBRSxvQkFBb0IsRUFBRSxjQUFjLEtBQUssYUFBYyxFQUFDLEVBQzFELGdCQUNDLG1EQUNBLFlBQVksSUFBSSxDQUFDLE1BQU0sZ0JBQUUsUUFBUSxFQUFFLENBQUMsQ0FDcEMsQUFDRCxFQUFDO0NBQ0Y7QUFDRCJ9