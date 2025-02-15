import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, clear, debounce, delay, downcast } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { LanguageViewModel, lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { Keys } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import "./EntityRestClient-chunk.js";
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
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./EntityClient-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import "./MailChecks-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog, TextField } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import "./MailRecipientsTextField-chunk.js";
import "./NavButton-chunk.js";
import "./InfoBanner-chunk.js";
import "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import "./ErrorHandlerImpl-chunk.js";
import "./InAppRatingDialog-chunk.js";
import "./RouteChange-chunk.js";
import "./CustomerUtils-chunk.js";
import "./mailLocator-chunk.js";
import "./LoginScreenHeader-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import "./CounterBadge-chunk.js";
import "./HtmlEditor-chunk.js";
import { htmlSanitizer } from "./HtmlSanitizer-chunk.js";
import "./Signature-chunk.js";
import "./LoginUtils-chunk.js";
import "./AttachmentBubble-chunk.js";
import { writeSupportMail } from "./MailEditor-chunk.js";
import "./MailGuiUtils-chunk.js";
import "./UsageTestModel-chunk.js";
import "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import "./FontIcons-chunk.js";
import { search } from "./TemplatePopupModel-chunk.js";
import "./MailViewerViewModel-chunk.js";
import "./LoadingState-chunk.js";
import "./inlineImagesUtils-chunk.js";

//#region src/common/support/FaqModel.ts
const FAQ_PREFIX = "faq.";
const MARKDOWN_SUFFIX = "_markdown";
var FaqModel = class {
	list = null;
	currentLanguageCode = null;
	faqLanguages = null;
	lazyLoaded;
	websiteBaseUrl = "https://tuta.com";
	get faqLang() {
		if (this.faqLanguages == null) throw new ProgrammingError("faq not initialized!");
		return this.faqLanguages;
	}
	constructor() {
		this.lazyLoaded = new LazyLoaded(() => {
			return Promise.all([this.fetchFAQ("en"), this.fetchFAQ(lang.code)]).then(([defaultTranslations, currentLanguageTranslations]) => {
				if (defaultTranslations != null || currentLanguageTranslations != null) {
					const faqLanguageViewModel = new LanguageViewModel();
					faqLanguageViewModel.initWithTranslations(lang.code, lang.languageTag, defaultTranslations, currentLanguageTranslations);
					this.faqLanguages = faqLanguageViewModel;
				}
			});
		});
	}
	async init(websiteBaseUrl) {
		if (this.currentLanguageCode !== lang.code) this.lazyLoaded.reset();
		this.websiteBaseUrl = websiteBaseUrl;
		await this.lazyLoaded.getAsync();
		this.getList();
	}
	/**
	* will return an AsyncGenerator yielding faq entries that contain the given query and mark the query occurrences
	* with <mark> tags. it is safe to insert the results of this call into the DOM.
	*
	*/
	async *search(query) {
		const cleanQuery = query.trim();
		if (cleanQuery === "") return [];
else {
			const searchableList = this.getList().map((item) => {
				return {
					...item,
					tags: item.tags.join(", ")
				};
			});
			const markedResults = search(cleanQuery, searchableList, [
				"tags",
				"title",
				"text"
			], true);
			for (const result of markedResults) {
				await delay(1);
				yield this.sanitizeEntry(result);
			}
		}
	}
	sanitizeEntry(result) {
		return {
			id: result.id,
			title: htmlSanitizer.sanitizeHTML(result.title).html,
			tags: result.tags.split(", ").map((tag) => htmlSanitizer.sanitizeHTML(tag).html),
			text: htmlSanitizer.sanitizeHTML(result.text, { blockExternalContent: false }).html
		};
	}
	/**
	* fetch the entries for the given lang code from the web site
	*/
	async fetchFAQ(langCode) {
		const faqPath = `${this.websiteBaseUrl}/faq-entries/${langCode}.json`;
		const translations = await fetch(faqPath).then((response) => response.json()).then((language) => language.keys).catch((error) => {
			console.log("Failed to fetch FAQ entries", error);
			return {};
		});
		return {
			code: langCode,
			keys: translations
		};
	}
	/**
	* return the current faqEntry list if it fits the current language code
	* otherwise, recreate the list for current lang and then return it
	*/
	getList() {
		if (this.list == null && this.faqLanguages == null) return [];
		if (this.list == null || this.currentLanguageCode !== lang.code) {
			this.currentLanguageCode = lang.code;
			const faqNames = Object.keys(this.faqLang.fallback.keys);
			this.list = faqNames.filter((key) => key.startsWith(FAQ_PREFIX) && key.endsWith(MARKDOWN_SUFFIX)).map((titleKey) => titleKey.substring(FAQ_PREFIX.length, titleKey.indexOf(MARKDOWN_SUFFIX))).map((name) => this.createFAQ(name));
		}
		return this.list;
	}
	/**
	* convert the raw translations for an id to a structured FaqEntry
	*/
	createFAQ(id) {
		return {
			id,
			title: this.faqLang.get(downcast(`faq.${id}_title`)),
			text: this.faqLang.get(downcast(`faq.${id}_markdown`)),
			tags: this.getTags(`faq.${id}_tags`).split(", ")
		};
	}
	getTags(id) {
		try {
			return this.faqLang.get(downcast(id));
		} catch (e) {
			return "";
		}
	}
};
const faq = new FaqModel();

//#endregion
//#region src/common/support/SupportDialog.ts
var import_stream = __toESM(require_stream(), 1);
assertMainOrNode();
async function showSupportDialog(logins) {
	const canHaveEmailSupport = logins.isInternalUserLoggedIn();
	const searchValue = (0, import_stream.default)("");
	const searchResult = [];
	let searchExecuted = false;
	const closeButton = {
		label: "close_alt",
		type: ButtonType.Secondary,
		click: () => {
			closeAction();
		}
	};
	const closeAction = () => {
		searchValue("");
		clear(searchResult);
		dialog.close();
	};
	const debouncedSearch = debounce(200, async (value) => {
		clear(searchResult);
		for await (const result of faq.search(value)) {
			if (searchValue() != value) break;
			searchResult.push(result);
			if (searchResult.length > 3) mithril_default.redraw();
		}
		mithril_default.redraw();
		searchExecuted = value.trim() !== "";
	});
	searchValue.map(debouncedSearch);
	const header = {
		left: [closeButton],
		middle: "supportMenu_label"
	};
	const child = { view: () => {
		return [
			mithril_default(".pt"),
			mithril_default(".h1 .text-center", lang.get("howCanWeHelp_title")),
			mithril_default(TextField, {
				label: "describeProblem_msg",
				value: searchValue(),
				oninput: searchValue
			}),
			mithril_default(".pt", searchResult.map((value) => {
				return mithril_default(".pb.faq-items", [
					mithril_default(".b", mithril_default.trust(value.title)),
					mithril_default(".flex-start.flex-wrap", value.tags.filter((tag) => tag !== "").map((tag) => mithril_default(".keyword-bubble.plr-button", mithril_default.trust(tag.trim())))),
					mithril_default(".list-border-bottom.pb", mithril_default.trust(value.text))
				]);
			})),
			searchExecuted && canHaveEmailSupport ? mithril_default(".pb", [mithril_default(".h1 .text-center", lang.get("noSolution_msg")), mithril_default(".flex.center-horizontally.pt", mithril_default(".flex-grow-shrink-auto.max-width-200", mithril_default(LoginButton, {
				label: "contactSupport_action",
				onclick: () => {
					writeSupportMail(searchValue().trim()).then((isSuccessful) => {
						if (isSuccessful) closeAction();
					});
				}
			})))]) : null
		];
	} };
	await faq.init(locator.domainConfigProvider().getCurrentDomainConfig().websiteBaseUrl);
	const dialog = Dialog.largeDialog(header, child).addShortcut({
		key: Keys.ESC,
		exec: () => {
			closeAction();
		},
		help: "close_alt"
	});
	dialog.show();
}

//#endregion
export { showSupportDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwcG9ydERpYWxvZy1jaHVuay5qcyIsIm5hbWVzIjpbIndlYnNpdGVCYXNlVXJsOiBzdHJpbmciLCJxdWVyeTogc3RyaW5nIiwic2VhcmNoYWJsZUxpc3Q6IHJlYWRvbmx5IFNlYXJjaGFibGVGYXFFbnRyeVtdIiwibWFya2VkUmVzdWx0czogUmVhZG9ubHlBcnJheTxTZWFyY2hhYmxlRmFxRW50cnk+IiwicmVzdWx0OiBTZWFyY2hhYmxlRmFxRW50cnkiLCJsYW5nQ29kZTogc3RyaW5nIiwidHJhbnNsYXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IiwidGl0bGVLZXk6IHN0cmluZyIsIm5hbWU6IHN0cmluZyIsImlkOiBzdHJpbmciLCJmYXE6IEZhcU1vZGVsIiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJzZWFyY2hSZXN1bHQ6IEFycmF5PEZhcUVudHJ5PiIsImNsb3NlQnV0dG9uOiBCdXR0b25BdHRycyIsInZhbHVlOiBzdHJpbmciLCJoZWFkZXI6IERpYWxvZ0hlYWRlckJhckF0dHJzIiwiY2hpbGQ6IENvbXBvbmVudCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vc3VwcG9ydC9GYXFNb2RlbC50cyIsIi4uL3NyYy9jb21tb24vc3VwcG9ydC9TdXBwb3J0RGlhbG9nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTGFuZ3VhZ2VWaWV3TW9kZWxUeXBlIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZywgTGFuZ3VhZ2VWaWV3TW9kZWwgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBkZWxheSwgZG93bmNhc3QsIExhenlMb2FkZWQgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHNlYXJjaCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL1BsYWluVGV4dFNlYXJjaFwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBodG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uL21pc2MvSHRtbFNhbml0aXplci5qc1wiXG5cbmV4cG9ydCB0eXBlIEZhcUVudHJ5ID0ge1xuXHRpZDogc3RyaW5nXG5cdHRpdGxlOiBzdHJpbmdcblx0dGV4dDogc3RyaW5nXG5cdHRhZ3M6IHN0cmluZ1tdXG59XG5cbnR5cGUgU2VhcmNoYWJsZUZhcUVudHJ5ID0gT21pdDxGYXFFbnRyeSwgXCJ0YWdzXCI+ICYgeyB0YWdzOiBzdHJpbmcgfVxuXG50eXBlIFRyYW5zbGF0aW9uID0ge1xuXHRjb2RlOiBzdHJpbmdcblx0a2V5czogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxufVxuY29uc3QgRkFRX1BSRUZJWCA9IFwiZmFxLlwiXG5jb25zdCBNQVJLRE9XTl9TVUZGSVggPSBcIl9tYXJrZG93blwiXG5cbi8qKlxuICogTG9hZHMgRkFRIGVudHJpZXMgZnJvbSB0dXRhLmNvbSBmb3IgZGlmZmVyZW50IGxhbmd1YWdlcyBhbmQgYWxsb3dzIHNlYXJjaGluZ1xuICpcbiAqIE5PVEU6IGl0J3Mgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyFcbiAqL1xuZXhwb3J0IGNsYXNzIEZhcU1vZGVsIHtcblx0cHJpdmF0ZSBsaXN0OiBBcnJheTxGYXFFbnRyeT4gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGN1cnJlbnRMYW5ndWFnZUNvZGU6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgZmFxTGFuZ3VhZ2VzOiBMYW5ndWFnZVZpZXdNb2RlbFR5cGUgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGxhenlMb2FkZWQ6IExhenlMb2FkZWQ8dm9pZD5cblx0cHJpdmF0ZSB3ZWJzaXRlQmFzZVVybDogc3RyaW5nID0gXCJodHRwczovL3R1dGEuY29tXCJcblxuXHRwcml2YXRlIGdldCBmYXFMYW5nKCk6IExhbmd1YWdlVmlld01vZGVsIHtcblx0XHRpZiAodGhpcy5mYXFMYW5ndWFnZXMgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJmYXEgbm90IGluaXRpYWxpemVkIVwiKVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5mYXFMYW5ndWFnZXNcblx0fVxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMubGF6eUxvYWRlZCA9IG5ldyBMYXp5TG9hZGVkKCgpID0+IHtcblx0XHRcdHJldHVybiBQcm9taXNlLmFsbChbdGhpcy5mZXRjaEZBUShcImVuXCIpLCB0aGlzLmZldGNoRkFRKGxhbmcuY29kZSldKS50aGVuKChbZGVmYXVsdFRyYW5zbGF0aW9ucywgY3VycmVudExhbmd1YWdlVHJhbnNsYXRpb25zXSkgPT4ge1xuXHRcdFx0XHRpZiAoZGVmYXVsdFRyYW5zbGF0aW9ucyAhPSBudWxsIHx8IGN1cnJlbnRMYW5ndWFnZVRyYW5zbGF0aW9ucyAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Y29uc3QgZmFxTGFuZ3VhZ2VWaWV3TW9kZWwgPSBuZXcgTGFuZ3VhZ2VWaWV3TW9kZWwoKVxuXHRcdFx0XHRcdGZhcUxhbmd1YWdlVmlld01vZGVsLmluaXRXaXRoVHJhbnNsYXRpb25zKGxhbmcuY29kZSwgbGFuZy5sYW5ndWFnZVRhZywgZGVmYXVsdFRyYW5zbGF0aW9ucywgY3VycmVudExhbmd1YWdlVHJhbnNsYXRpb25zKVxuXHRcdFx0XHRcdHRoaXMuZmFxTGFuZ3VhZ2VzID0gZmFxTGFuZ3VhZ2VWaWV3TW9kZWxcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0YXN5bmMgaW5pdCh3ZWJzaXRlQmFzZVVybDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly9yZXNldHRpbmcgdGhlIGxhenkgcmVsb2FkIHdoZW5ldmVyIHRoZSBsYW5ndWFnZSBwcmVmZXJlbmNlIGNoYW5nZSB0byBjbGVhciBjYWNoaW5nLlxuXHRcdGlmICh0aGlzLmN1cnJlbnRMYW5ndWFnZUNvZGUgIT09IGxhbmcuY29kZSkge1xuXHRcdFx0dGhpcy5sYXp5TG9hZGVkLnJlc2V0KClcblx0XHR9XG5cdFx0dGhpcy53ZWJzaXRlQmFzZVVybCA9IHdlYnNpdGVCYXNlVXJsXG5cdFx0YXdhaXQgdGhpcy5sYXp5TG9hZGVkLmdldEFzeW5jKClcblx0XHR0aGlzLmdldExpc3QoKVxuXHR9XG5cblx0LyoqXG5cdCAqIHdpbGwgcmV0dXJuIGFuIEFzeW5jR2VuZXJhdG9yIHlpZWxkaW5nIGZhcSBlbnRyaWVzIHRoYXQgY29udGFpbiB0aGUgZ2l2ZW4gcXVlcnkgYW5kIG1hcmsgdGhlIHF1ZXJ5IG9jY3VycmVuY2VzXG5cdCAqIHdpdGggPG1hcms+IHRhZ3MuIGl0IGlzIHNhZmUgdG8gaW5zZXJ0IHRoZSByZXN1bHRzIG9mIHRoaXMgY2FsbCBpbnRvIHRoZSBET00uXG5cdCAqXG5cdCAqL1xuXHRhc3luYyAqc2VhcmNoKHF1ZXJ5OiBzdHJpbmcpOiBBc3luY0dlbmVyYXRvcjxGYXFFbnRyeT4ge1xuXHRcdGNvbnN0IGNsZWFuUXVlcnkgPSBxdWVyeS50cmltKClcblxuXHRcdGlmIChjbGVhblF1ZXJ5ID09PSBcIlwiKSB7XG5cdFx0XHRyZXR1cm4gW11cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgc2VhcmNoYWJsZUxpc3Q6IHJlYWRvbmx5IFNlYXJjaGFibGVGYXFFbnRyeVtdID0gdGhpcy5nZXRMaXN0KCkubWFwKChpdGVtKSA9PiB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0Li4uaXRlbSxcblx0XHRcdFx0XHQvLyBqb2luIHRhZ3MgdG8gc2VhcmNoIHdpdGggcGxhaW50ZXh0IHNlYXJjaFxuXHRcdFx0XHRcdHRhZ3M6IGl0ZW0udGFncy5qb2luKFwiLCBcIiksXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQvLyB3ZSBjb3VsZCBwcm9iYWJseSBjb252ZXJ0IHRoaXMgdG8gYW4gQXN5bmNHZW5lcmF0b3IgdG8gc3ByZWFkIHRoZSBsb2FkIG9mIHNlYXJjaGluZyB0aGUgZW50cmllcyBhcyB3ZWxsLCBidXQgaXQncyBwcmV0dHkgc25hcHB5IGF0bS5cblx0XHRcdGNvbnN0IG1hcmtlZFJlc3VsdHM6IFJlYWRvbmx5QXJyYXk8U2VhcmNoYWJsZUZhcUVudHJ5PiA9IHNlYXJjaChjbGVhblF1ZXJ5LCBzZWFyY2hhYmxlTGlzdCwgW1widGFnc1wiLCBcInRpdGxlXCIsIFwidGV4dFwiXSwgdHJ1ZSlcblx0XHRcdGZvciAoY29uc3QgcmVzdWx0IG9mIG1hcmtlZFJlc3VsdHMpIHtcblx0XHRcdFx0Ly8gdGhpcyBkZWxheSBpcyBuZWVkZWQgdG8gbWFrZSB0aGUgbmV4dCBpdGVyYXRpb24gYmUgc2NoZWR1bGVkIG9uIHRoZSBuZXh0IG1hY3JvIHRhc2suXG5cdFx0XHRcdC8vIGp1c3QgeWllbGRpbmcvYXdhaXRpbmcgY3JlYXRlcyBhIG1pY3JvIHRhc2sgdGhhdCBkb2Vzbid0IGxldCB0aGUgZXZlbnQgbG9vcCBydW4uXG5cdFx0XHRcdGF3YWl0IGRlbGF5KDEpXG5cdFx0XHRcdHlpZWxkIHRoaXMuc2FuaXRpemVFbnRyeShyZXN1bHQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBzYW5pdGl6ZUVudHJ5KHJlc3VsdDogU2VhcmNoYWJsZUZhcUVudHJ5KTogRmFxRW50cnkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogcmVzdWx0LmlkLFxuXHRcdFx0dGl0bGU6IGh0bWxTYW5pdGl6ZXIuc2FuaXRpemVIVE1MKHJlc3VsdC50aXRsZSkuaHRtbCxcblx0XHRcdHRhZ3M6IHJlc3VsdC50YWdzLnNwbGl0KFwiLCBcIikubWFwKCh0YWcpID0+IGh0bWxTYW5pdGl6ZXIuc2FuaXRpemVIVE1MKHRhZykuaHRtbCksXG5cdFx0XHR0ZXh0OiBodG1sU2FuaXRpemVyLnNhbml0aXplSFRNTChyZXN1bHQudGV4dCwgeyBibG9ja0V4dGVybmFsQ29udGVudDogZmFsc2UgfSkuaHRtbCxcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogZmV0Y2ggdGhlIGVudHJpZXMgZm9yIHRoZSBnaXZlbiBsYW5nIGNvZGUgZnJvbSB0aGUgd2ViIHNpdGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZmV0Y2hGQVEobGFuZ0NvZGU6IHN0cmluZyk6IFByb21pc2U8VHJhbnNsYXRpb24+IHtcblx0XHRjb25zdCBmYXFQYXRoID0gYCR7dGhpcy53ZWJzaXRlQmFzZVVybH0vZmFxLWVudHJpZXMvJHtsYW5nQ29kZX0uanNvbmBcblx0XHRjb25zdCB0cmFuc2xhdGlvbnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSBhd2FpdCBmZXRjaChmYXFQYXRoKVxuXHRcdFx0LnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5qc29uKCkpXG5cdFx0XHQudGhlbigobGFuZ3VhZ2UpID0+IGxhbmd1YWdlLmtleXMpXG5cdFx0XHQuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiRmFpbGVkIHRvIGZldGNoIEZBUSBlbnRyaWVzXCIsIGVycm9yKVxuXHRcdFx0XHRyZXR1cm4ge31cblx0XHRcdH0pXG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29kZTogbGFuZ0NvZGUsXG5cdFx0XHRrZXlzOiB0cmFuc2xhdGlvbnMsXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIHJldHVybiB0aGUgY3VycmVudCBmYXFFbnRyeSBsaXN0IGlmIGl0IGZpdHMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgY29kZVxuXHQgKiBvdGhlcndpc2UsIHJlY3JlYXRlIHRoZSBsaXN0IGZvciBjdXJyZW50IGxhbmcgYW5kIHRoZW4gcmV0dXJuIGl0XG5cdCAqL1xuXHRwcml2YXRlIGdldExpc3QoKTogQXJyYXk8RmFxRW50cnk+IHtcblx0XHRpZiAodGhpcy5saXN0ID09IG51bGwgJiYgdGhpcy5mYXFMYW5ndWFnZXMgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMubGlzdCA9PSBudWxsIHx8IHRoaXMuY3VycmVudExhbmd1YWdlQ29kZSAhPT0gbGFuZy5jb2RlKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRMYW5ndWFnZUNvZGUgPSBsYW5nLmNvZGVcblx0XHRcdGNvbnN0IGZhcU5hbWVzID0gT2JqZWN0LmtleXModGhpcy5mYXFMYW5nLmZhbGxiYWNrLmtleXMpXG5cdFx0XHR0aGlzLmxpc3QgPSBmYXFOYW1lc1xuXHRcdFx0XHQuZmlsdGVyKChrZXkpID0+IGtleS5zdGFydHNXaXRoKEZBUV9QUkVGSVgpICYmIGtleS5lbmRzV2l0aChNQVJLRE9XTl9TVUZGSVgpKVxuXHRcdFx0XHQubWFwKCh0aXRsZUtleTogc3RyaW5nKSA9PiB0aXRsZUtleS5zdWJzdHJpbmcoRkFRX1BSRUZJWC5sZW5ndGgsIHRpdGxlS2V5LmluZGV4T2YoTUFSS0RPV05fU1VGRklYKSkpXG5cdFx0XHRcdC5tYXAoKG5hbWU6IHN0cmluZykgPT4gdGhpcy5jcmVhdGVGQVEobmFtZSkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubGlzdFxuXHR9XG5cblx0LyoqXG5cdCAqIGNvbnZlcnQgdGhlIHJhdyB0cmFuc2xhdGlvbnMgZm9yIGFuIGlkIHRvIGEgc3RydWN0dXJlZCBGYXFFbnRyeVxuXHQgKi9cblx0cHJpdmF0ZSBjcmVhdGVGQVEoaWQ6IHN0cmluZyk6IEZhcUVudHJ5IHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IGlkLFxuXHRcdFx0dGl0bGU6IHRoaXMuZmFxTGFuZy5nZXQoZG93bmNhc3QoYGZhcS4ke2lkfV90aXRsZWApKSxcblx0XHRcdHRleHQ6IHRoaXMuZmFxTGFuZy5nZXQoZG93bmNhc3QoYGZhcS4ke2lkfV9tYXJrZG93bmApKSxcblx0XHRcdHRhZ3M6IHRoaXMuZ2V0VGFncyhgZmFxLiR7aWR9X3RhZ3NgKS5zcGxpdChcIiwgXCIpLFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZ2V0VGFncyhpZDogc3RyaW5nKTogc3RyaW5nIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZmFxTGFuZy5nZXQoZG93bmNhc3QoaWQpKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBcIlwiXG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBmYXE6IEZhcU1vZGVsID0gbmV3IEZhcU1vZGVsKClcbiIsImltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dIZWFkZXJCYXJcIlxuaW1wb3J0IHR5cGUgeyBCdXR0b25BdHRycyB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IFRleHRGaWVsZCB9IGZyb20gXCIuLi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IG0sIHsgQ29tcG9uZW50IH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgZmFxLCBGYXFFbnRyeSB9IGZyb20gXCIuL0ZhcU1vZGVsXCJcbmltcG9ydCB7IEtleXMgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBjbGVhciwgZGVib3VuY2UgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHdyaXRlU3VwcG9ydE1haWwgfSBmcm9tIFwiLi4vLi4vbWFpbC1hcHAvbWFpbC9lZGl0b3IvTWFpbEVkaXRvclwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IExvZ2luQnV0dG9uIH0gZnJvbSBcIi4uL2d1aS9iYXNlL2J1dHRvbnMvTG9naW5CdXR0b24uanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dTdXBwb3J0RGlhbG9nKGxvZ2luczogTG9naW5Db250cm9sbGVyKSB7XG5cdGNvbnN0IGNhbkhhdmVFbWFpbFN1cHBvcnQgPSBsb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpXG5cdGNvbnN0IHNlYXJjaFZhbHVlID0gc3RyZWFtKFwiXCIpXG5cdGNvbnN0IHNlYXJjaFJlc3VsdDogQXJyYXk8RmFxRW50cnk+ID0gW11cblx0bGV0IHNlYXJjaEV4ZWN1dGVkID0gZmFsc2Vcblx0Y29uc3QgY2xvc2VCdXR0b246IEJ1dHRvbkF0dHJzID0ge1xuXHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRjbG9zZUFjdGlvbigpXG5cdFx0fSxcblx0fVxuXG5cdGNvbnN0IGNsb3NlQWN0aW9uID0gKCkgPT4ge1xuXHRcdHNlYXJjaFZhbHVlKFwiXCIpXG5cdFx0Y2xlYXIoc2VhcmNoUmVzdWx0KVxuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdH1cblxuXHRjb25zdCBkZWJvdW5jZWRTZWFyY2ggPSBkZWJvdW5jZSgyMDAsIGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0Y2xlYXIoc2VhcmNoUmVzdWx0KVxuXHRcdGZvciBhd2FpdCAoY29uc3QgcmVzdWx0IG9mIGZhcS5zZWFyY2godmFsdWUpKSB7XG5cdFx0XHQvLyBpZiB0aGUgc2VhcmNoIHF1ZXJ5IGNoYW5nZWQsIHdlIGRvbid0IHdhbnQgdG8gY29udGludWVcblx0XHRcdC8vIHNhbml0aXppbmcgZW50cmllcywgd2UnbGwgZ2V0IGNhbGxlZCBhZ2FpbiBpbiAyMDBtc1xuXHRcdFx0aWYgKHNlYXJjaFZhbHVlKCkgIT0gdmFsdWUpIGJyZWFrXG5cdFx0XHRzZWFyY2hSZXN1bHQucHVzaChyZXN1bHQpXG5cdFx0XHQvLyBkZWxheSBmaXJzdCByZWRyYXcgdW50aWwgdGhlIGJvdHRvbSBvZiB0aGUgcmVzdWx0IGxpc3QgaXMgbGlrZWx5IHRvIGJlIGJlbG93IHRoZVxuXHRcdFx0Ly8gdmlzaWJsZSBhcmVhIHRvIHByZXZlbnQgZmxhc2hlcyB3aGlsZSB0aGUgbGlzdCBpcyBidWlsdCB1cFxuXHRcdFx0aWYgKHNlYXJjaFJlc3VsdC5sZW5ndGggPiAzKSBtLnJlZHJhdygpXG5cdFx0fVxuXHRcdG0ucmVkcmF3KClcblx0XHRzZWFyY2hFeGVjdXRlZCA9IHZhbHVlLnRyaW0oKSAhPT0gXCJcIlxuXHR9KVxuXG5cdHNlYXJjaFZhbHVlLm1hcChkZWJvdW5jZWRTZWFyY2gpXG5cblx0Y29uc3QgaGVhZGVyOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRsZWZ0OiBbY2xvc2VCdXR0b25dLFxuXHRcdG1pZGRsZTogXCJzdXBwb3J0TWVudV9sYWJlbFwiLFxuXHR9XG5cdGNvbnN0IGNoaWxkOiBDb21wb25lbnQgPSB7XG5cdFx0dmlldzogKCkgPT4ge1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0bShcIi5wdFwiKSxcblx0XHRcdFx0bShcIi5oMSAudGV4dC1jZW50ZXJcIiwgbGFuZy5nZXQoXCJob3dDYW5XZUhlbHBfdGl0bGVcIikpLFxuXHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBcImRlc2NyaWJlUHJvYmxlbV9tc2dcIixcblx0XHRcdFx0XHR2YWx1ZTogc2VhcmNoVmFsdWUoKSxcblx0XHRcdFx0XHRvbmlucHV0OiBzZWFyY2hWYWx1ZSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIucHRcIixcblx0XHRcdFx0XHRzZWFyY2hSZXN1bHQubWFwKCh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG0oXCIucGIuZmFxLWl0ZW1zXCIsIFtcblx0XHRcdFx0XHRcdFx0Ly8gd2UgY2FuIHRydXN0IHRoZSBmYXEgZW50cnkgaGVyZSBiZWNhdXNlIGl0IGlzIHNhbml0aXplZCBpbiB1cGRhdGUtdHJhbnNsYXRpb25zLmpzIGZyb20gdGhlIHdlYnNpdGUgcHJvamVjdFxuXHRcdFx0XHRcdFx0XHQvLyB0cnVzdCBpcyByZXF1aXJlZCBiZWNhdXNlIHRoZSBzZWFyY2ggcmVzdWx0cyBhcmUgbWFya2VkIHdpdGggPG1hcms+IHRhZyBhbmQgdGhlIGZhcSBlbnRyaWVzIGNvbnRhaW4gaHRtbCBlbGVtZW50cy5cblx0XHRcdFx0XHRcdFx0bShcIi5iXCIsIG0udHJ1c3QodmFsdWUudGl0bGUpKSxcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LXN0YXJ0LmZsZXgtd3JhcFwiLFxuXHRcdFx0XHRcdFx0XHRcdHZhbHVlLnRhZ3MuZmlsdGVyKCh0YWcpID0+IHRhZyAhPT0gXCJcIikubWFwKCh0YWcpID0+IG0oXCIua2V5d29yZC1idWJibGUucGxyLWJ1dHRvblwiLCBtLnRydXN0KHRhZy50cmltKCkpKSksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdG0oXCIubGlzdC1ib3JkZXItYm90dG9tLnBiXCIsIG0udHJ1c3QodmFsdWUudGV4dCkpLFxuXHRcdFx0XHRcdFx0XSlcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdFx0c2VhcmNoRXhlY3V0ZWQgJiYgY2FuSGF2ZUVtYWlsU3VwcG9ydFxuXHRcdFx0XHRcdD8gbShcIi5wYlwiLCBbXG5cdFx0XHRcdFx0XHRcdG0oXCIuaDEgLnRleHQtY2VudGVyXCIsIGxhbmcuZ2V0KFwibm9Tb2x1dGlvbl9tc2dcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFwiLmZsZXguY2VudGVyLWhvcml6b250YWxseS5wdFwiLFxuXHRcdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LWdyb3ctc2hyaW5rLWF1dG8ubWF4LXdpZHRoLTIwMFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJjb250YWN0U3VwcG9ydF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25jbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHdyaXRlU3VwcG9ydE1haWwoc2VhcmNoVmFsdWUoKS50cmltKCkpLnRoZW4oKGlzU3VjY2Vzc2Z1bCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGlzU3VjY2Vzc2Z1bCkgY2xvc2VBY3Rpb24oKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdCAgXSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRdXG5cdFx0fSxcblx0fVxuXHRhd2FpdCBmYXEuaW5pdChsb2NhdG9yLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpLndlYnNpdGVCYXNlVXJsKVxuXHRjb25zdCBkaWFsb2cgPSBEaWFsb2cubGFyZ2VEaWFsb2coaGVhZGVyLCBjaGlsZCkuYWRkU2hvcnRjdXQoe1xuXHRcdGtleTogS2V5cy5FU0MsXG5cdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0Y2xvc2VBY3Rpb24oKVxuXHRcdH0sXG5cdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0fSlcblx0ZGlhbG9nLnNob3coKVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQkEsTUFBTSxhQUFhO0FB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