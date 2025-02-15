import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, assertNotNull, getFirstOrThrow, isSameTypeRef, last, lazyMemoized, memoized, noOp, ofClass } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { FeatureType, Keys, MailSetKind } from "./TutanotaConstants-chunk.js";
import { keyManager } from "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import { getElementId, isSameId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "./TypeRefs-chunk.js";
import { getEventWithDefaultTimes, setNextHalfHour } from "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import { extractContactIdFromEvent, isBirthdayEvent } from "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import { NotFoundError } from "./RestError-chunk.js";
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
import { PermissionError } from "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./Services-chunk.js";
import "./EntityClient-chunk.js";
import "./dist3-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import { getGroupInfoDisplayName } from "./GroupUtils-chunk.js";
import "./MailChecks-chunk.js";
import "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog, DropDownSelector } from "./Dialog-chunk.js";
import { BootIcons } from "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import { IconButton } from "./IconButton-chunk.js";
import "./CalendarEventWhenModel-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import "./CalendarFacade-chunk.js";
import "./CalendarModel-chunk.js";
import { getSharedGroupName } from "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./RecipientsModel-chunk.js";
import { CalendarOperation } from "./CalendarGuiUtils-chunk.js";
import "./UpgradeRequiredError-chunk.js";
import "./ColorPickerModel-chunk.js";
import "./BannerButton-chunk.js";
import { showNotAvailableForFreeDialog } from "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./EventPreviewView-chunk.js";
import "./ToggleButton-chunk.js";
import { EventEditorDialog } from "./CalendarEventEditDialog-chunk.js";
import { DatePicker } from "./DatePicker-chunk.js";
import "./MailRecipientsTextField-chunk.js";
import { ColumnEmptyMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import "./DateParser-chunk.js";
import { NavButton, NavButtonColor } from "./NavButton-chunk.js";
import "./InfoBanner-chunk.js";
import "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import { Checkbox } from "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import "./ErrorHandlerImpl-chunk.js";
import "./InAppRatingDialog-chunk.js";
import { MultiselectMode, listSelectionKeyboardShortcuts } from "./List-chunk.js";
import "./SelectableRowContainer-chunk.js";
import "./CalendarRow-chunk.js";
import "./RouteChange-chunk.js";
import { selectionAttrsForList } from "./ListModel-chunk.js";
import "./ListElementListModel-chunk.js";
import "./CalendarExporter-chunk.js";
import "./CalendarImporter-chunk.js";
import "./CustomerUtils-chunk.js";
import "./CalendarInvites-chunk.js";
import { BackgroundColumnLayout, BaseMobileHeader, ColumnType, FolderColumnView, Header, MobileHeader, MobileHeaderMenuButton, SidebarSection, ViewColumn, ViewSlider, isNewMailActionAvailable } from "./MobileHeader-chunk.js";
import { ProgressBar, mailLocator } from "./mailLocator-chunk.js";
import { BaseTopLevelView } from "./LoginScreenHeader-chunk.js";
import { EventDetailsView, handleEventDeleteButtonClick, handleEventEditButtonClick, handleSendUpdatesClick } from "./EventDetailsView-chunk.js";
import "./ContactGuiUtils-chunk.js";
import { ContactCardViewer, ContactViewerActions, MobileActionBar, MultiContactViewer, confirmMerge, deleteContacts, exportContacts, getContactSelectionMessage, writeMail } from "./ContactView-chunk.js";
import { DesktopListToolbar, DesktopViewerToolbar, EnterMultiselectIconButton, MobileBottomActionBar, MultiselectMobileHeader } from "./SidebarSectionRow-chunk.js";
import "./LoginButton-chunk.js";
import "./CounterBadge-chunk.js";
import "./InfoIcon-chunk.js";
import "./Table-chunk.js";
import { ContactEditor } from "./ContactEditor-chunk.js";
import "./ListColumnWrapper-chunk.js";
import "./ContactListView-chunk.js";
import "./HtmlEditor-chunk.js";
import "./HtmlSanitizer-chunk.js";
import "./Signature-chunk.js";
import "./LoginUtils-chunk.js";
import "./AttachmentBubble-chunk.js";
import "./MailEditor-chunk.js";
import { archiveMails, getConversationTitle, getMoveMailBounds, moveToInbox, showDeleteConfirmationDialog, showMoveMailsDropdown } from "./MailGuiUtils-chunk.js";
import "./UsageTestModel-chunk.js";
import { getIndentedFolderNameForDropdown } from "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import { SEARCH_MAIL_FIELDS, SearchCategoryTypes } from "./SearchUtils-chunk.js";
import "./FontIcons-chunk.js";
import "./TemplatePopupModel-chunk.js";
import "./MailViewerViewModel-chunk.js";
import "./LoadingState-chunk.js";
import "./inlineImagesUtils-chunk.js";
import { SelectAllCheckbox } from "./SelectAllCheckbox-chunk.js";
import "./LazySearchBar-chunk.js";
import { BottomNav } from "./BottomNav-chunk.js";
import "./SearchRouter-chunk.js";
import "./Badge-chunk.js";
import "./MailRow-chunk.js";
import { ConversationViewer, MailFilterButton, MailViewerActions, MobileMailActionBar, MobileMailMultiselectionActionBar, MultiItemViewer, getMailSelectionMessage } from "./MailFilterButton-chunk.js";
import "./SearchTypes-chunk.js";
import { searchBar } from "./SearchBar-chunk.js";
import "./BaseSearchBar-chunk.js";
import { PaidFunctionResult, SearchListView } from "./SearchViewModel-chunk.js";

//#region src/mail-app/search/view/SearchView.ts
assertMainOrNode();
var SearchView = class extends BaseTopLevelView {
	resultListColumn;
	resultDetailsColumn;
	folderColumn;
	viewSlider;
	searchViewModel;
	contactModel;
	startOfTheWeekOffset;
	getSanitizedPreviewData = memoized((event) => new LazyLoaded(async () => {
		const calendars = await this.searchViewModel.getLazyCalendarInfos().getAsync();
		const eventPreviewModel = await locator.calendarEventPreviewModel(event, calendars);
		eventPreviewModel.sanitizeDescription().then(() => mithril_default.redraw());
		return eventPreviewModel;
	}).load());
	getContactPreviewData = memoized((id) => new LazyLoaded(async () => {
		const idParts = id.split("/");
		const contact = await this.contactModel.loadContactFromId([idParts[0], idParts[1]]);
		mithril_default.redraw();
		return contact;
	}).load());
	constructor(vnode) {
		super();
		this.searchViewModel = vnode.attrs.makeViewModel();
		this.contactModel = vnode.attrs.contactModel;
		this.startOfTheWeekOffset = this.searchViewModel.getStartOfTheWeekOffset();
		this.folderColumn = new ViewColumn({ view: () => {
			const restriction = this.searchViewModel.getRestriction();
			return mithril_default(FolderColumnView, {
				drawer: vnode.attrs.drawerAttrs,
				button: this.getMainButton(restriction.type),
				content: [mithril_default(SidebarSection, { name: "search_label" }, [
					mithril_default(".folder-row.flex-start.mlr-button", mithril_default(NavButton, {
						label: "emails_label",
						icon: () => BootIcons.Mail,
						href: this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.mail),
						click: () => {
							this.viewSlider.focus(this.resultListColumn);
						},
						isSelectedPrefix: "/search/mail",
						colors: NavButtonColor.Nav,
						persistentBackground: true
					})),
					mithril_default(".folder-row.flex-start.mlr-button", mithril_default(NavButton, {
						label: "contacts_label",
						icon: () => BootIcons.Contacts,
						href: this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.contact),
						click: () => {
							this.viewSlider.focus(this.resultListColumn);
						},
						isSelectedPrefix: "/search/contact",
						colors: NavButtonColor.Nav,
						persistentBackground: true
					})),
					mithril_default(".folder-row.flex-start.mlr-button", mithril_default(NavButton, {
						label: "calendar_label",
						icon: () => BootIcons.Calendar,
						href: this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.calendar),
						click: () => {
							this.viewSlider.focus(this.resultListColumn);
						},
						isSelectedPrefix: "/search/calendar",
						colors: NavButtonColor.Nav,
						persistentBackground: true
					}))
				]), this.renderFilterSection()],
				ariaLabel: "search_label"
			});
		} }, ColumnType.Foreground, {
			minWidth: size.first_col_min_width,
			maxWidth: size.first_col_max_width,
			headerCenter: "search_label"
		});
		this.resultListColumn = new ViewColumn({ view: () => {
			return mithril_default(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => mithril_default(DesktopListToolbar, [this.searchViewModel.listModel && getCurrentSearchMode() !== SearchCategoryTypes.calendar ? [mithril_default(SelectAllCheckbox, selectionAttrsForList(this.searchViewModel.listModel)), isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef) ? this.renderFilterButton() : null] : mithril_default(".button-height")]),
				mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
				columnLayout: this.getResultColumnLayout()
			});
		} }, ColumnType.Background, {
			minWidth: size.second_col_min_width,
			maxWidth: size.second_col_max_width,
			headerCenter: "searchResult_label"
		});
		this.resultDetailsColumn = new ViewColumn({ view: () => this.renderDetailsView(vnode.attrs.header) }, ColumnType.Background, {
			minWidth: size.third_col_min_width,
			maxWidth: size.third_col_max_width
		});
		this.viewSlider = new ViewSlider([
			this.folderColumn,
			this.resultListColumn,
			this.resultDetailsColumn
		]);
	}
	getResultColumnLayout() {
		return mithril_default(SearchListView, {
			listModel: this.searchViewModel.listModel,
			currentType: this.searchViewModel.searchedType,
			onSingleSelection: (item) => {
				this.viewSlider.focus(this.resultDetailsColumn);
				if (isSameTypeRef(item.entry._type, MailTypeRef)) Promise.resolve().then(() => {
					const conversationViewModel = this.searchViewModel.conversationViewModel;
					if (conversationViewModel && isSameId(item._id, conversationViewModel.primaryMail._id)) conversationViewModel?.primaryViewModel().setUnread(false);
				});
			},
			cancelCallback: () => {
				this.searchViewModel.sendStopLoadingSignal();
			},
			isFreeAccount: locator.logins.getUserController().isFreeAccount(),
			getLabelsForMail: (mail) => this.searchViewModel.getLabelsForMail(mail)
		});
	}
	renderFilterSection() {
		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) return mithril_default(SidebarSection, { name: "filter_label" }, this.renderMailFilterSection());
else if (isSameTypeRef(this.searchViewModel.searchedType, CalendarEventTypeRef)) return mithril_default(SidebarSection, { name: "filter_label" }, this.renderCalendarFilterSection());
else return null;
	}
	oncreate() {
		this.searchViewModel.init(() => this.confirmMailSearch());
		keyManager.registerShortcuts(this.shortcuts());
	}
	onremove() {
		this.searchViewModel.dispose();
		keyManager.unregisterShortcuts(this.shortcuts());
	}
	renderMobileListHeader(header) {
		return this.searchViewModel.listModel && this.searchViewModel.listModel?.state.inMultiselect ? this.renderMultiSelectMobileHeader() : this.renderMobileListActionsHeader(header);
	}
	renderMobileListActionsHeader(header) {
		const rightActions = [];
		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) rightActions.push(this.renderFilterButton());
		if (!isSameTypeRef(this.searchViewModel.searchedType, CalendarEventTypeRef)) rightActions.push(mithril_default(EnterMultiselectIconButton, { clickAction: () => {
			this.searchViewModel.listModel?.enterMultiselect();
		} }));
		if (styles.isSingleColumnLayout()) rightActions.push(this.renderHeaderRightView());
		return mithril_default(BaseMobileHeader, {
			left: mithril_default(MobileHeaderMenuButton, {
				...header,
				backAction: () => this.viewSlider.focusPreviousColumn()
			}),
			right: rightActions,
			center: mithril_default(".flex-grow.flex.justify-center", { class: rightActions.length === 0 ? "mr" : "" }, mithril_default(searchBar, {
				placeholder: this.searchBarPlaceholder(),
				returnListener: () => this.resultListColumn.focus()
			})),
			injections: mithril_default(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() })
		});
	}
	renderMultiSelectMobileHeader() {
		return mithril_default(MultiselectMobileHeader, {
			...selectionAttrsForList(this.searchViewModel.listModel),
			message: getCurrentSearchMode() === SearchCategoryTypes.mail ? getMailSelectionMessage(this.searchViewModel.getSelectedMails()) : getContactSelectionMessage(this.searchViewModel.getSelectedContacts().length)
		});
	}
	/** depending on the search and selection state we want to render a
	* (multi) mail viewer or a (multi) contact viewer or an event preview
	*/
	renderDetailsView(header) {
		if (this.searchViewModel.listModel.isSelectionEmpty() && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			this.viewSlider.focus(this.resultListColumn);
			return null;
		}
		if (getCurrentSearchMode() === SearchCategoryTypes.contact) {
			const selectedContacts = this.searchViewModel.getSelectedContacts();
			const actions = mithril_default(ContactViewerActions, {
				contacts: selectedContacts,
				onEdit: (c) => new ContactEditor(locator.entityClient, c).show(),
				onDelete: deleteContacts,
				onMerge: confirmMerge,
				onExport: exportContacts
			});
			const isMultiselect = this.searchViewModel.listModel?.state.inMultiselect || selectedContacts.length === 0;
			return mithril_default(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => mithril_default(DesktopViewerToolbar, actions),
				mobileHeader: () => mithril_default(MobileHeader, {
					...header,
					backAction: () => this.viewSlider.focusPreviousColumn(),
					columnType: "other",
					title: "search_label",
					actions: null,
					multicolumnActions: () => actions,
					primaryAction: () => this.renderHeaderRightView()
				}),
				columnLayout: mithril_default(".fill-absolute.flex.col.overflow-y-scroll", isMultiselect ? mithril_default(MultiContactViewer, {
					selectedEntities: selectedContacts,
					selectNone: () => this.searchViewModel.listModel.selectNone()
				}) : mithril_default(ContactCardViewer, {
					contact: selectedContacts[0],
					onWriteMail: writeMail
				}))
			});
		} else if (getCurrentSearchMode() === SearchCategoryTypes.mail) {
			const selectedMails = this.searchViewModel.getSelectedMails();
			const conversationViewModel = this.searchViewModel.conversationViewModel;
			if (this.searchViewModel.listModel?.state.inMultiselect || !conversationViewModel) {
				const actions = mithril_default(MailViewerActions, {
					mailboxModel: locator.mailboxModel,
					mailModel: mailLocator.mailModel,
					mails: selectedMails,
					selectNone: () => this.searchViewModel.listModel.selectNone()
				});
				return mithril_default(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => mithril_default(DesktopViewerToolbar, actions),
					mobileHeader: () => mithril_default(MobileHeader, {
						...header,
						backAction: () => this.viewSlider.focusPreviousColumn(),
						columnType: "other",
						title: getMailSelectionMessage(selectedMails),
						actions: null,
						multicolumnActions: () => actions,
						primaryAction: () => this.renderHeaderRightView()
					}),
					columnLayout: mithril_default(MultiItemViewer, {
						selectedEntities: selectedMails,
						selectNone: () => this.searchViewModel.listModel.selectNone(),
						loadAll: () => this.searchViewModel.loadAll(),
						stopLoadAll: () => this.searchViewModel.stopLoadAll(),
						loadingAll: this.searchViewModel.loadingAllForSearchResult != null ? "loading" : this.searchViewModel.listModel?.isLoadedCompletely() ? "loaded" : "can_load",
						getSelectionMessage: (selected) => getMailSelectionMessage(selected)
					})
				});
			} else {
				const actions = mithril_default(MailViewerActions, {
					mailboxModel: conversationViewModel.primaryViewModel().mailboxModel,
					mailModel: conversationViewModel.primaryViewModel().mailModel,
					mailViewerViewModel: conversationViewModel.primaryViewModel(),
					mails: [conversationViewModel.primaryMail]
				});
				return mithril_default(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => mithril_default(DesktopViewerToolbar, actions),
					mobileHeader: () => mithril_default(MobileHeader, {
						...header,
						backAction: () => this.viewSlider.focusPreviousColumn(),
						columnType: "other",
						title: getConversationTitle(conversationViewModel),
						actions: null,
						multicolumnActions: () => actions,
						primaryAction: () => this.renderHeaderRightView()
					}),
					columnLayout: mithril_default(ConversationViewer, {
						key: getElementId(conversationViewModel.primaryMail),
						viewModel: conversationViewModel,
						delayBodyRendering: Promise.resolve()
					})
				});
			}
		} else if (getCurrentSearchMode() === SearchCategoryTypes.calendar) {
			const selectedEvent = this.searchViewModel.getSelectedEvents()[0];
			return mithril_default(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => mithril_default(DesktopViewerToolbar, []),
				mobileHeader: () => mithril_default(MobileHeader, {
					...header,
					backAction: () => this.viewSlider.focusPreviousColumn(),
					columnType: "other",
					title: "search_label",
					actions: null,
					multicolumnActions: () => [],
					primaryAction: () => this.renderHeaderRightView()
				}),
				columnLayout: selectedEvent == null ? mithril_default(ColumnEmptyMessageBox, {
					message: "noEventSelect_msg",
					icon: BootIcons.Calendar,
					color: theme.content_message_bg,
					backgroundColor: theme.navigation_bg
				}) : this.renderEventPreview(selectedEvent)
			});
		} else return mithril_default(
			".flex.col.fill-absolute",
			// Using contactViewToolbar because it will display empty
			mithril_default(ContactViewerActions, {
				contacts: [],
				onExport: noOp,
				onMerge: noOp,
				onDelete: noOp,
				onEdit: noOp
			}),
			mithril_default(".flex-grow.rel.overflow-hidden", mithril_default(ColumnEmptyMessageBox, {
				message: "noSelection_msg",
				color: theme.content_message_bg,
				backgroundColor: theme.navigation_bg
			}))
);
	}
	invalidateBirthdayPreview() {
		if (getCurrentSearchMode() !== SearchCategoryTypes.calendar) return;
		const selectedEvent = this.searchViewModel.getSelectedEvents()[0];
		if (!selectedEvent || !isBirthdayEvent(selectedEvent.uid)) return;
		const idParts = selectedEvent._id[1].split("#");
		const contactId = extractContactIdFromEvent(last(idParts));
		if (!contactId) return;
		this.getContactPreviewData(contactId).reload().then(mithril_default.redraw);
	}
	renderEventPreview(event) {
		if (isBirthdayEvent(event.uid)) {
			const idParts = event._id[1].split("#");
			const contactId = extractContactIdFromEvent(last(idParts));
			if (contactId != null && this.getContactPreviewData(contactId).isLoaded()) return this.renderContactPreview(this.getContactPreviewData(contactId).getSync());
			return null;
		} else if (this.getSanitizedPreviewData(event).isLoaded()) return this.renderEventDetails(event);
		return null;
	}
	renderContactPreview(contact) {
		return mithril_default(".fill-absolute.flex.col.overflow-y-scroll", mithril_default(ContactCardViewer, {
			contact,
			editAction: (contact$1) => {
				new ContactEditor(locator.entityClient, contact$1).show();
			},
			onWriteMail: writeMail,
			extendedActions: true
		}));
	}
	renderEventDetails(selectedEvent) {
		return mithril_default(".height-100p.overflow-y-scroll.mb-l.fill-absolute.pb-l", mithril_default(".border-radius-big.flex.col.flex-grow.content-bg", {
			class: styles.isDesktopLayout() ? "mlr-l" : "mlr",
			style: {
				"min-width": styles.isDesktopLayout() ? px(size.third_col_min_width) : null,
				"max-width": styles.isDesktopLayout() ? px(size.third_col_max_width) : null
			}
		}, mithril_default(EventDetailsView, { eventPreviewModel: assertNotNull(this.getSanitizedPreviewData(selectedEvent).getSync()) })));
	}
	view({ attrs }) {
		return mithril_default("#search.main-view", mithril_default(this.viewSlider, {
			header: mithril_default(Header, {
				searchBar: () => mithril_default(searchBar, {
					placeholder: this.searchBarPlaceholder(),
					returnListener: () => this.resultListColumn.focus()
				}),
				...attrs.header
			}),
			bottomNav: this.renderBottomNav()
		}));
	}
	renderBottomNav() {
		if (!styles.isSingleColumnLayout()) return mithril_default(BottomNav);
		const isInMultiselect = this.searchViewModel.listModel?.state.inMultiselect ?? false;
		if (this.viewSlider.focusedColumn === this.resultDetailsColumn && this.searchViewModel.conversationViewModel) return mithril_default(MobileMailActionBar, { viewModel: this.searchViewModel.conversationViewModel?.primaryViewModel() });
else if (!isInMultiselect && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			if (getCurrentSearchMode() === SearchCategoryTypes.contact) return mithril_default(MobileActionBar, { actions: [{
				icon: Icons.Edit,
				title: "edit_action",
				action: () => new ContactEditor(locator.entityClient, this.searchViewModel.getSelectedContacts()[0]).show()
			}, {
				icon: Icons.Trash,
				title: "delete_action",
				action: () => deleteContacts(this.searchViewModel.getSelectedContacts())
			}] });
else if (getCurrentSearchMode() === SearchCategoryTypes.calendar) {
				const selectedEvent = this.searchViewModel.getSelectedEvents()[0];
				if (!selectedEvent) {
					this.viewSlider.focus(this.resultListColumn);
					return mithril_default(MobileActionBar, { actions: [] });
				}
				const previewModel = this.getSanitizedPreviewData(selectedEvent).getSync();
				const actions = [];
				if (previewModel) {
					if (previewModel.canSendUpdates) actions.push({
						icon: BootIcons.Mail,
						title: "sendUpdates_label",
						action: () => handleSendUpdatesClick(previewModel)
					});
					if (previewModel.canEdit) actions.push({
						icon: Icons.Edit,
						title: "edit_action",
						action: (ev, receiver) => handleEventEditButtonClick(previewModel, ev, receiver)
					});
					if (previewModel.canDelete) actions.push({
						icon: Icons.Trash,
						title: "delete_action",
						action: (ev, receiver) => handleEventDeleteButtonClick(previewModel, ev, receiver)
					});
				} else this.getSanitizedPreviewData(selectedEvent).load();
				return mithril_default(MobileActionBar, { actions });
			}
		} else if (isInMultiselect) {
			if (getCurrentSearchMode() === SearchCategoryTypes.mail) return mithril_default(MobileMailMultiselectionActionBar, {
				mails: this.searchViewModel.getSelectedMails(),
				selectNone: () => this.searchViewModel.listModel.selectNone(),
				mailModel: mailLocator.mailModel,
				mailboxModel: locator.mailboxModel
			});
else if (this.viewSlider.focusedColumn === this.resultListColumn) return mithril_default(MobileBottomActionBar, mithril_default(ContactViewerActions, {
				contacts: this.searchViewModel.getSelectedContacts(),
				onEdit: () => new ContactEditor(locator.entityClient, getFirstOrThrow(this.searchViewModel.getSelectedContacts())).show(),
				onDelete: (contacts) => deleteContacts(contacts, () => this.searchViewModel.listModel.selectNone()),
				onMerge: confirmMerge,
				onExport: exportContacts
			}));
		}
		return mithril_default(BottomNav);
	}
	searchBarPlaceholder() {
		const route = mithril_default.route.get();
		if (route.startsWith("/search/calendar")) return lang.get("searchCalendar_placeholder");
else if (route.startsWith("/search/contact")) return lang.get("searchContacts_placeholder");
else return lang.get("searchEmails_placeholder");
	}
	getAvailableMailFolders() {
		const mailboxes = this.searchViewModel.mailboxes;
		const availableMailFolders = [{
			name: lang.get("all_label"),
			value: null,
			indentationLevel: 0
		}];
		for (const mailbox of mailboxes) {
			const mailboxIndex = mailboxes.indexOf(mailbox);
			const mailFolders = mailLocator.mailModel.getFolderSystemByGroupId(mailbox.mailGroup._id)?.getIndentedList() ?? [];
			for (const folderInfo of mailFolders) if (folderInfo.folder.folderType !== MailSetKind.SPAM) {
				const mailboxLabel = mailboxIndex === 0 ? "" : ` (${getGroupInfoDisplayName(mailbox.mailGroupInfo)})`;
				const folderId = folderInfo.folder.isMailSet ? getElementId(folderInfo.folder) : folderInfo.folder.mails;
				availableMailFolders.push({
					name: getIndentedFolderNameForDropdown(folderInfo) + mailboxLabel,
					value: folderId
				});
			}
		}
		return availableMailFolders;
	}
	renderMailFilterSection() {
		const availableMailFolders = this.getAvailableMailFolders();
		const availableMailFields = SEARCH_MAIL_FIELDS.map((f) => ({
			name: lang.get(f.textId),
			value: f.field
		}));
		return [this.renderDateRangeSelection(), mithril_default("div.ml-button", [mithril_default(DropDownSelector, {
			label: "field_label",
			items: availableMailFields,
			selectedValue: this.searchViewModel.selectedMailField,
			selectionChangedHandler: (newValue) => {
				const result = this.searchViewModel.selectMailField(newValue);
				if (result === PaidFunctionResult.PaidSubscriptionNeeded) showNotAvailableForFreeDialog();
			},
			dropdownWidth: 250
		}), availableMailFolders.length > 0 ? mithril_default(DropDownSelector, {
			label: "mailFolder_label",
			items: availableMailFolders,
			selectedValue: this.searchViewModel.selectedMailFolder[0] ?? null,
			selectionChangedHandler: (newValue) => {
				const result = this.searchViewModel.selectMailFolder(newValue ? [newValue] : []);
				if (result === PaidFunctionResult.PaidSubscriptionNeeded) showNotAvailableForFreeDialog();
			},
			dropdownWidth: 250
		}) : null])].map((row) => mithril_default(".folder-row.plr-button.content-fg", row));
	}
	renderCalendarFilterSection() {
		return [
			this.renderDateRangeSelection(),
			this.renderCalendarFilter(),
			this.renderRepeatingFilter()
		].map((row) => mithril_default(".folder-row.plr-button.content-fg", row));
	}
	getViewSlider() {
		return this.viewSlider;
	}
	renderHeaderRightView() {
		const restriction = this.searchViewModel.getRestriction();
		if (styles.isUsingBottomNavigation()) {
			if (isSameTypeRef(restriction.type, MailTypeRef) && isNewMailActionAvailable()) return mithril_default(IconButton, {
				click: () => {
					newMailEditor().then((editor) => editor.show()).catch(ofClass(PermissionError, noOp));
				},
				title: "newMail_action",
				icon: Icons.PencilSquare
			});
else if (isSameTypeRef(restriction.type, ContactTypeRef)) return mithril_default(IconButton, {
				click: () => {
					locator.contactModel.getContactListId().then((contactListId) => {
						new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show();
					});
				},
				title: "newContact_action",
				icon: Icons.Add
			});
else if (isSameTypeRef(restriction.type, CalendarEventTypeRef)) return mithril_default(IconButton, {
				click: () => this.createNewEventDialog(),
				title: "newEvent_action",
				icon: Icons.Add
			});
		}
	}
	renderDateRangeSelection() {
		const renderedHelpText = this.searchViewModel.warning === "startafterend" ? "startAfterEnd_label" : this.searchViewModel.warning === "long" ? "longSearchRange_msg" : this.searchViewModel.startDate == null ? "unlimited_label" : undefined;
		return mithril_default(".flex.col", mithril_default(".pl-s.flex-grow.flex-space-between.flex-column", mithril_default(DatePicker, {
			date: this.searchViewModel.startDate ?? undefined,
			onDateSelected: (date) => this.onStartDateSelected(date),
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			label: "dateFrom_label",
			nullSelectionText: renderedHelpText,
			rightAlignDropdown: true
		})), mithril_default(".pl-s.flex-grow.flex-space-between.flex-column", mithril_default(DatePicker, {
			date: this.searchViewModel.endDate,
			onDateSelected: (date) => {
				if (this.searchViewModel.selectEndDate(date) != PaidFunctionResult.Success) showNotAvailableForFreeDialog();
			},
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			label: "dateTo_label",
			rightAlignDropdown: true
		})));
	}
	async onStartDateSelected(date) {
		if (await this.searchViewModel.selectStartDate(date) != PaidFunctionResult.Success) showNotAvailableForFreeDialog();
	}
	confirmMailSearch() {
		return Dialog.confirm("continueSearchMailbox_msg", "search_label");
	}
	shortcuts = lazyMemoized(() => [
		...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
		{
			key: Keys.N,
			exec: () => {
				const type = this.searchViewModel.searchedType;
				if (isSameTypeRef(type, MailTypeRef)) newMailEditor().then((editor) => editor.show()).catch(ofClass(PermissionError, noOp));
else if (isSameTypeRef(type, ContactTypeRef)) locator.contactModel.getContactListId().then((contactListId) => {
					new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show();
				});
			},
			enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly),
			help: "newMail_action"
		},
		{
			key: Keys.DELETE,
			exec: () => this.deleteSelected(),
			help: "delete_action"
		},
		{
			key: Keys.BACKSPACE,
			exec: () => this.deleteSelected(),
			help: "delete_action"
		},
		{
			key: Keys.A,
			exec: () => this.archiveSelected(),
			help: "archive_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail
		},
		{
			key: Keys.I,
			exec: () => this.moveSelectedToInbox(),
			help: "moveToInbox_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail
		},
		{
			key: Keys.V,
			exec: () => this.move(),
			help: "move_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail
		},
		{
			key: Keys.U,
			exec: () => this.toggleUnreadStatus(),
			help: "toggleUnread_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail
		}
	]);
	async onNewUrl(args, requestedPath) {
		await this.searchViewModel.init(() => this.confirmMailSearch());
		this.searchViewModel.onNewUrl(args, requestedPath);
		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef) && styles.isSingleColumnLayout() && !args.id && this.viewSlider.focusedColumn === this.resultDetailsColumn) this.viewSlider.focusPreviousColumn();
		this.invalidateBirthdayPreview();
		mithril_default.redraw();
	}
	getMainButton(typeRef) {
		if (styles.isUsingBottomNavigation()) return null;
else if (isSameTypeRef(typeRef, MailTypeRef) && isNewMailActionAvailable()) return {
			click: () => {
				newMailEditor().then((editor) => editor.show()).catch(ofClass(PermissionError, noOp));
			},
			label: "newMail_action"
		};
else if (isSameTypeRef(typeRef, ContactTypeRef)) return {
			click: () => {
				locator.contactModel.getContactListId().then((contactListId) => {
					new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show();
				});
			},
			label: "newContact_action"
		};
else if (isSameTypeRef(typeRef, CalendarEventTypeRef)) return {
			click: () => {
				this.createNewEventDialog();
			},
			label: "newEvent_action"
		};
else return null;
	}
	async createNewEventDialog() {
		const dateToUse = this.searchViewModel.startDate ? setNextHalfHour(new Date(this.searchViewModel.startDate)) : setNextHalfHour(new Date());
		const lazyCalendarInfo = this.searchViewModel.getLazyCalendarInfos();
		const calendarInfos = lazyCalendarInfo.isLoaded() ? lazyCalendarInfo.getSync() : lazyCalendarInfo.getAsync();
		if (calendarInfos instanceof Promise) await showProgressDialog("pleaseWait_msg", calendarInfos);
		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails();
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
		const model = await locator.calendarEventModel(CalendarOperation.Create, getEventWithDefaultTimes(dateToUse), mailboxDetails, mailboxProperties, null);
		if (model) {
			const eventEditor = new EventEditorDialog();
			await eventEditor.showNewCalendarEventEditDialog(model);
		}
	}
	archiveSelected() {
		const selectedMails = this.searchViewModel.getSelectedMails();
		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) this.searchViewModel.listModel.selectNone();
			archiveMails(selectedMails);
		}
	}
	moveSelectedToInbox() {
		const selectedMails = this.searchViewModel.getSelectedMails();
		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) this.searchViewModel.listModel.selectNone();
			moveToInbox(selectedMails);
		}
	}
	move() {
		const selectedMails = this.searchViewModel.getSelectedMails();
		if (selectedMails.length > 0) showMoveMailsDropdown(locator.mailboxModel, mailLocator.mailModel, getMoveMailBounds(), selectedMails, { onSelected: () => {
			if (selectedMails.length > 1) this.searchViewModel.listModel.selectNone();
		} });
	}
	toggleUnreadStatus() {
		let selectedMails = this.searchViewModel.getSelectedMails();
		if (selectedMails.length > 0) mailLocator.mailModel.markMails(selectedMails, !selectedMails[0].unread);
	}
	deleteSelected() {
		if (this.searchViewModel.listModel.state.selectedItems.size > 0) {
			if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
				const selected = this.searchViewModel.getSelectedMails();
				showDeleteConfirmationDialog(selected).then((confirmed) => {
					if (confirmed) {
						if (selected.length > 1) this.searchViewModel.listModel.selectNone();
						mailLocator.mailModel.deleteMails(selected);
					}
				});
				return false;
			} else if (isSameTypeRef(this.searchViewModel.searchedType, ContactTypeRef)) {
				Dialog.confirm("deleteContacts_msg").then((confirmed) => {
					const selected = this.searchViewModel.getSelectedContacts();
					if (confirmed) {
						if (selected.length > 1) this.searchViewModel.listModel.selectNone();
						for (const contact of selected) locator.entityClient.erase(contact).catch(ofClass(NotFoundError, (_) => {}));
					}
				});
				return false;
			}
		}
		return true;
	}
	renderFilterButton() {
		return mithril_default(MailFilterButton, {
			filter: this.searchViewModel.mailFilter,
			setFilter: (filter) => this.searchViewModel.setMailFilter(filter)
		});
	}
	renderCalendarFilter() {
		if (this.searchViewModel.getLazyCalendarInfos().isLoaded() && this.searchViewModel.getUserHasNewPaidPlan().isLoaded()) {
			const calendarInfos = this.searchViewModel.getLazyCalendarInfos().getSync() ?? [];
			const items = Array.from(calendarInfos.values()).map((ci) => ({
				name: getSharedGroupName(ci.groupInfo, locator.logins.getUserController(), true),
				value: ci
			}));
			if (this.searchViewModel.getUserHasNewPaidPlan().getSync()) {
				const localCalendars = this.searchViewModel.getLocalCalendars().map((cal) => ({
					name: cal.name,
					value: cal.id
				}));
				items.push(...localCalendars);
			}
			const selectedValue = items.find((calendar) => {
				if (!calendar.value) return;
				if (typeof calendar.value === "string") return calendar.value === this.searchViewModel.selectedCalendar;
				const calendarValue = calendar.value;
				return isSameId([calendarValue.groupRoot.longEvents, calendarValue.groupRoot.shortEvents], this.searchViewModel.selectedCalendar);
			})?.value ?? null;
			return mithril_default(".ml-button", mithril_default(DropDownSelector, {
				label: "calendar_label",
				items: [{
					name: lang.get("all_label"),
					value: null
				}, ...items],
				selectedValue,
				selectionChangedHandler: (value) => {
					this.searchViewModel.selectCalendar(value);
				}
			}));
		} else return null;
	}
	renderRepeatingFilter() {
		return mithril_default(".mlr-button", mithril_default(Checkbox, {
			label: () => lang.get("includeRepeatingEvents_action"),
			checked: this.searchViewModel.includeRepeatingEvents,
			onChecked: (value) => {
				this.searchViewModel.selectIncludeRepeatingEvents(value);
			}
		}));
	}
};
function getCurrentSearchMode() {
	const route = mithril_default.route.get();
	if (route.startsWith("/search/contact")) return SearchCategoryTypes.contact;
else if (route.startsWith("/search/calendar")) return SearchCategoryTypes.calendar;
else return SearchCategoryTypes.mail;
}
async function newMailEditor() {
	const [mailboxDetails, { newMailEditor: newMailEditor$1 }] = await Promise.all([locator.mailboxModel.getUserMailboxDetails(), import("./MailEditor2-chunk.js")]);
	return newMailEditor$1(mailboxDetails);
}

//#endregion
export { SearchView };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VhcmNoVmlldy1jaHVuay5qcyIsIm5hbWVzIjpbImV2ZW50OiBDYWxlbmRhckV2ZW50IiwiaWQ6IHN0cmluZyIsInZub2RlOiBWbm9kZTxTZWFyY2hWaWV3QXR0cnM+IiwiaGVhZGVyOiBBcHBIZWFkZXJBdHRycyIsImM6IENvbnRhY3QiLCJzZWxlY3RlZDogUmVhZG9ubHlBcnJheTxNYWlsPiIsIm0iLCJjb250YWN0OiBDb250YWN0IiwiY29udGFjdCIsInNlbGVjdGVkRXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJhY3Rpb25zOiBBcnJheTxNb2JpbGVBY3Rpb25BdHRycz4iLCJldjogTW91c2VFdmVudCIsInJlY2VpdmVyOiBIVE1MRWxlbWVudCIsImNvbnRhY3RzOiBDb250YWN0W10iLCJhdmFpbGFibGVNYWlsRm9sZGVyczogU2VsZWN0b3JJdGVtPElkIHwgbnVsbD5bXSIsIm5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsIiwicmVuZGVyZWRIZWxwVGV4dDogTWF5YmVUcmFuc2xhdGlvbiB8IHVuZGVmaW5lZCIsImRhdGU6IERhdGUiLCJhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwicmVxdWVzdGVkUGF0aDogc3RyaW5nIiwidHlwZVJlZjogVHlwZVJlZjx1bmtub3duPiIsIml0ZW1zOiB7XG5cdFx0XHRcdG5hbWU6IHN0cmluZ1xuXHRcdFx0XHR2YWx1ZTogQ2FsZW5kYXJJbmZvIHwgc3RyaW5nXG5cdFx0XHR9W10iLCJ2YWx1ZTogQ2FsZW5kYXJJbmZvIHwgbnVsbCIsInZhbHVlOiBib29sZWFuIl0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL3NlYXJjaC92aWV3L1NlYXJjaFZpZXcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgVmlld1NsaWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL25hdi9WaWV3U2xpZGVyLmpzXCJcbmltcG9ydCB7IENvbHVtblR5cGUsIFZpZXdDb2x1bW4gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1ZpZXdDb2x1bW5cIlxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbktleSwgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEZlYXR1cmVUeXBlLCBLZXlzLCBNYWlsU2V0S2luZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBrZXlNYW5hZ2VyLCBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IE5hdkJ1dHRvbiwgTmF2QnV0dG9uQ29sb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL05hdkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29uc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50LCBDYWxlbmRhckV2ZW50VHlwZVJlZiwgQ29udGFjdCwgQ29udGFjdFR5cGVSZWYsIE1haWwsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgU2VhcmNoTGlzdFZpZXcsIFNlYXJjaExpc3RWaWV3QXR0cnMgfSBmcm9tIFwiLi9TZWFyY2hMaXN0Vmlld1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgU0VBUkNIX01BSUxfRklFTERTLCBTZWFyY2hDYXRlZ29yeVR5cGVzIH0gZnJvbSBcIi4uL21vZGVsL1NlYXJjaFV0aWxzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgZ2V0Rmlyc3RPclRocm93LCBpc1NhbWVUeXBlUmVmLCBsYXN0LCBMYXp5TG9hZGVkLCBsYXp5TWVtb2l6ZWQsIG1lbW9pemVkLCBub09wLCBvZkNsYXNzLCBUeXBlUmVmIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgQXBwSGVhZGVyQXR0cnMsIEhlYWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0hlYWRlci5qc1wiXG5pbXBvcnQgeyBQZXJtaXNzaW9uRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUGVybWlzc2lvbkVycm9yXCJcbmltcG9ydCB7IENvbnRhY3RFZGl0b3IgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvQ29udGFjdEVkaXRvclwiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXNcIlxuaW1wb3J0IHsgRm9sZGVyQ29sdW1uVmlldyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0ZvbGRlckNvbHVtblZpZXcuanNcIlxuaW1wb3J0IHsgZ2V0R3JvdXBJbmZvRGlzcGxheU5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvR3JvdXBVdGlsc1wiXG5pbXBvcnQgeyBpc05ld01haWxBY3Rpb25BdmFpbGFibGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9uYXYvTmF2RnVuY3Rpb25zXCJcbmltcG9ydCB7IFNpZGViYXJTZWN0aW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvU2lkZWJhclNlY3Rpb25cIlxuaW1wb3J0IHR5cGUgeyBDbGlja0hhbmRsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0d1aVV0aWxzXCJcbmltcG9ydCB7IERyb3BEb3duU2VsZWN0b3IsIERyb3BEb3duU2VsZWN0b3JBdHRycywgU2VsZWN0b3JJdGVtIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wRG93blNlbGVjdG9yLmpzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgTW9iaWxlTWFpbEFjdGlvbkJhciB9IGZyb20gXCIuLi8uLi9tYWlsL3ZpZXcvTW9iaWxlTWFpbEFjdGlvbkJhci5qc1wiXG5pbXBvcnQgeyBEcmF3ZXJNZW51QXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9uYXYvRHJhd2VyTWVudS5qc1wiXG5pbXBvcnQgeyBCYXNlVG9wTGV2ZWxWaWV3IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvQmFzZVRvcExldmVsVmlldy5qc1wiXG5pbXBvcnQgeyBUb3BMZXZlbEF0dHJzLCBUb3BMZXZlbFZpZXcgfSBmcm9tIFwiLi4vLi4vLi4vVG9wTGV2ZWxWaWV3LmpzXCJcbmltcG9ydCB7IGdldENvbnRhY3RTZWxlY3Rpb25NZXNzYWdlLCBNdWx0aUNvbnRhY3RWaWV3ZXIgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvdmlldy9NdWx0aUNvbnRhY3RWaWV3ZXIuanNcIlxuaW1wb3J0IHsgQ29udGFjdENhcmRWaWV3ZXIgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvdmlldy9Db250YWN0Q2FyZFZpZXdlci5qc1wiXG5pbXBvcnQgeyBnZXRNYWlsU2VsZWN0aW9uTWVzc2FnZSwgTXVsdGlJdGVtVmlld2VyIH0gZnJvbSBcIi4uLy4uL21haWwvdmlldy9NdWx0aUl0ZW1WaWV3ZXIuanNcIlxuaW1wb3J0IHsgQ29udmVyc2F0aW9uVmlld2VyIH0gZnJvbSBcIi4uLy4uL21haWwvdmlldy9Db252ZXJzYXRpb25WaWV3ZXIuanNcIlxuaW1wb3J0IHsgQ29udGFjdFZpZXdlckFjdGlvbnMgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvdmlldy9Db250YWN0Vmlld2VyQWN0aW9ucy5qc1wiXG5pbXBvcnQgeyBjb25maXJtTWVyZ2UsIGRlbGV0ZUNvbnRhY3RzLCB3cml0ZU1haWwgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvdmlldy9Db250YWN0Vmlldy5qc1wiXG5pbXBvcnQgQ29sdW1uRW1wdHlNZXNzYWdlQm94IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ29sdW1uRW1wdHlNZXNzYWdlQm94LmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgc2VhcmNoQmFyIH0gZnJvbSBcIi4uL1NlYXJjaEJhci5qc1wiXG5pbXBvcnQgeyBNb2JpbGVNYWlsTXVsdGlzZWxlY3Rpb25BY3Rpb25CYXIgfSBmcm9tIFwiLi4vLi4vbWFpbC92aWV3L01vYmlsZU1haWxNdWx0aXNlbGVjdGlvbkFjdGlvbkJhci5qc1wiXG5pbXBvcnQgeyBleHBvcnRDb250YWN0cyB9IGZyb20gXCIuLi8uLi9jb250YWN0cy9WQ2FyZEV4cG9ydGVyLmpzXCJcbmltcG9ydCB7IEJhY2tncm91bmRDb2x1bW5MYXlvdXQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9CYWNrZ3JvdW5kQ29sdW1uTGF5b3V0LmpzXCJcbmltcG9ydCB7IERlc2t0b3BMaXN0VG9vbGJhciwgRGVza3RvcFZpZXdlclRvb2xiYXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9EZXNrdG9wVG9vbGJhcnMuanNcIlxuaW1wb3J0IHsgTWFpbFZpZXdlckFjdGlvbnMgfSBmcm9tIFwiLi4vLi4vbWFpbC92aWV3L01haWxWaWV3ZXJUb29sYmFyLmpzXCJcbmltcG9ydCB7IEJhc2VNb2JpbGVIZWFkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9CYXNlTW9iaWxlSGVhZGVyLmpzXCJcbmltcG9ydCB7IFByb2dyZXNzQmFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Qcm9ncmVzc0Jhci5qc1wiXG5pbXBvcnQgeyBFbnRlck11bHRpc2VsZWN0SWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0VudGVyTXVsdGlzZWxlY3RJY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IE1vYmlsZUhlYWRlciwgTW9iaWxlSGVhZGVyTWVudUJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL01vYmlsZUhlYWRlci5qc1wiXG5pbXBvcnQgeyBNb2JpbGVBY3Rpb25BdHRycywgTW9iaWxlQWN0aW9uQmFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvTW9iaWxlQWN0aW9uQmFyLmpzXCJcbmltcG9ydCB7IE1vYmlsZUJvdHRvbUFjdGlvbkJhciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL01vYmlsZUJvdHRvbUFjdGlvbkJhci5qc1wiXG5pbXBvcnQge1xuXHRhcmNoaXZlTWFpbHMsXG5cdGdldENvbnZlcnNhdGlvblRpdGxlLFxuXHRnZXRNb3ZlTWFpbEJvdW5kcyxcblx0bW92ZVRvSW5ib3gsXG5cdHNob3dEZWxldGVDb25maXJtYXRpb25EaWFsb2csXG5cdHNob3dNb3ZlTWFpbHNEcm9wZG93bixcbn0gZnJvbSBcIi4uLy4uL21haWwvdmlldy9NYWlsR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgU2VsZWN0QWxsQ2hlY2tib3ggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9TZWxlY3RBbGxDaGVja2JveC5qc1wiXG5pbXBvcnQgeyBzZWxlY3Rpb25BdHRyc0Zvckxpc3QgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGlzdE1vZGVsLmpzXCJcbmltcG9ydCB7IE11bHRpc2VsZWN0TW9iaWxlSGVhZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvTXVsdGlzZWxlY3RNb2JpbGVIZWFkZXIuanNcIlxuaW1wb3J0IHsgTXVsdGlzZWxlY3RNb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0LmpzXCJcbmltcG9ydCB7IFBhaWRGdW5jdGlvblJlc3VsdCwgU2VhcmNoVmlld01vZGVsIH0gZnJvbSBcIi4vU2VhcmNoVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IHNob3dOb3RBdmFpbGFibGVGb3JGcmVlRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1N1YnNjcmlwdGlvbkRpYWxvZ3MuanNcIlxuaW1wb3J0IHsgTWFpbEZpbHRlckJ1dHRvbiB9IGZyb20gXCIuLi8uLi9tYWlsL3ZpZXcvTWFpbEZpbHRlckJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBsaXN0U2VsZWN0aW9uS2V5Ym9hcmRTaG9ydGN1dHMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xpc3RVdGlscy5qc1wiXG5pbXBvcnQgeyBnZXRFbGVtZW50SWQsIGlzU2FtZUlkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFySW5mbyB9IGZyb20gXCIuLi8uLi8uLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvbW9kZWwvQ2FsZW5kYXJNb2RlbC5qc1wiXG5pbXBvcnQgeyBDaGVja2JveCwgQ2hlY2tib3hBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ2hlY2tib3guanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudHBvcHVwL0NhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7XG5cdEV2ZW50RGV0YWlsc1ZpZXcsXG5cdEV2ZW50RGV0YWlsc1ZpZXdBdHRycyxcblx0aGFuZGxlRXZlbnREZWxldGVCdXR0b25DbGljayxcblx0aGFuZGxlRXZlbnRFZGl0QnV0dG9uQ2xpY2ssXG5cdGhhbmRsZVNlbmRVcGRhdGVzQ2xpY2ssXG59IGZyb20gXCIuLi8uLi8uLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvdmlldy9FdmVudERldGFpbHNWaWV3LmpzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2cuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJPcGVyYXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50TW9kZWwuanNcIlxuaW1wb3J0IHsgZ2V0RXZlbnRXaXRoRGVmYXVsdFRpbWVzLCBzZXROZXh0SGFsZkhvdXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBFdmVudEVkaXRvckRpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLXZpZXcvQ2FsZW5kYXJFdmVudEVkaXREaWFsb2cuanNcIlxuaW1wb3J0IHsgZ2V0U2hhcmVkR3JvdXBOYW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9zaGFyaW5nL0dyb3VwVXRpbHMuanNcIlxuaW1wb3J0IHsgQm90dG9tTmF2IH0gZnJvbSBcIi4uLy4uL2d1aS9Cb3R0b21OYXYuanNcIlxuaW1wb3J0IHsgbWFpbExvY2F0b3IgfSBmcm9tIFwiLi4vLi4vbWFpbExvY2F0b3IuanNcIlxuaW1wb3J0IHsgZ2V0SW5kZW50ZWRGb2xkZXJOYW1lRm9yRHJvcGRvd24gfSBmcm9tIFwiLi4vLi4vbWFpbC9tb2RlbC9NYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgQ29udGFjdE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jb250YWN0c0Z1bmN0aW9uYWxpdHkvQ29udGFjdE1vZGVsLmpzXCJcbmltcG9ydCB7IGV4dHJhY3RDb250YWN0SWRGcm9tRXZlbnQsIGlzQmlydGhkYXlFdmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IERhdGVQaWNrZXIsIERhdGVQaWNrZXJBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL3BpY2tlcnMvRGF0ZVBpY2tlci5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaFZpZXdBdHRycyBleHRlbmRzIFRvcExldmVsQXR0cnMge1xuXHRkcmF3ZXJBdHRyczogRHJhd2VyTWVudUF0dHJzXG5cdGhlYWRlcjogQXBwSGVhZGVyQXR0cnNcblx0bWFrZVZpZXdNb2RlbDogKCkgPT4gU2VhcmNoVmlld01vZGVsXG5cdGNvbnRhY3RNb2RlbDogQ29udGFjdE1vZGVsXG59XG5cbmV4cG9ydCBjbGFzcyBTZWFyY2hWaWV3IGV4dGVuZHMgQmFzZVRvcExldmVsVmlldyBpbXBsZW1lbnRzIFRvcExldmVsVmlldzxTZWFyY2hWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSByZWFkb25seSByZXN1bHRMaXN0Q29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgcmVhZG9ubHkgcmVzdWx0RGV0YWlsc0NvbHVtbjogVmlld0NvbHVtblxuXHRwcml2YXRlIHJlYWRvbmx5IGZvbGRlckNvbHVtbjogVmlld0NvbHVtblxuXHRwcml2YXRlIHJlYWRvbmx5IHZpZXdTbGlkZXI6IFZpZXdTbGlkZXJcblx0cHJpdmF0ZSByZWFkb25seSBzZWFyY2hWaWV3TW9kZWw6IFNlYXJjaFZpZXdNb2RlbFxuXHRwcml2YXRlIHJlYWRvbmx5IGNvbnRhY3RNb2RlbDogQ29udGFjdE1vZGVsXG5cdHByaXZhdGUgcmVhZG9ubHkgc3RhcnRPZlRoZVdlZWtPZmZzZXQ6IG51bWJlclxuXG5cdHByaXZhdGUgZ2V0U2FuaXRpemVkUHJldmlld0RhdGE6IChldmVudDogQ2FsZW5kYXJFdmVudCkgPT4gTGF6eUxvYWRlZDxDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbD4gPSBtZW1vaXplZCgoZXZlbnQ6IENhbGVuZGFyRXZlbnQpID0+XG5cdFx0bmV3IExhenlMb2FkZWQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgY2FsZW5kYXJzID0gYXdhaXQgdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0TGF6eUNhbGVuZGFySW5mb3MoKS5nZXRBc3luYygpXG5cdFx0XHRjb25zdCBldmVudFByZXZpZXdNb2RlbCA9IGF3YWl0IGxvY2F0b3IuY2FsZW5kYXJFdmVudFByZXZpZXdNb2RlbChldmVudCwgY2FsZW5kYXJzKVxuXHRcdFx0ZXZlbnRQcmV2aWV3TW9kZWwuc2FuaXRpemVEZXNjcmlwdGlvbigpLnRoZW4oKCkgPT4gbS5yZWRyYXcoKSlcblx0XHRcdHJldHVybiBldmVudFByZXZpZXdNb2RlbFxuXHRcdH0pLmxvYWQoKSxcblx0KVxuXG5cdHByaXZhdGUgZ2V0Q29udGFjdFByZXZpZXdEYXRhID0gbWVtb2l6ZWQoKGlkOiBzdHJpbmcpID0+XG5cdFx0bmV3IExhenlMb2FkZWQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgaWRQYXJ0cyA9IGlkLnNwbGl0KFwiL1wiKVxuXHRcdFx0Y29uc3QgY29udGFjdCA9IGF3YWl0IHRoaXMuY29udGFjdE1vZGVsLmxvYWRDb250YWN0RnJvbUlkKFtpZFBhcnRzWzBdLCBpZFBhcnRzWzFdXSlcblx0XHRcdG0ucmVkcmF3KClcblx0XHRcdHJldHVybiBjb250YWN0XG5cdFx0fSkubG9hZCgpLFxuXHQpXG5cblx0Y29uc3RydWN0b3Iodm5vZGU6IFZub2RlPFNlYXJjaFZpZXdBdHRycz4pIHtcblx0XHRzdXBlcigpXG5cdFx0dGhpcy5zZWFyY2hWaWV3TW9kZWwgPSB2bm9kZS5hdHRycy5tYWtlVmlld01vZGVsKClcblx0XHR0aGlzLmNvbnRhY3RNb2RlbCA9IHZub2RlLmF0dHJzLmNvbnRhY3RNb2RlbFxuXHRcdHRoaXMuc3RhcnRPZlRoZVdlZWtPZmZzZXQgPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRTdGFydE9mVGhlV2Vla09mZnNldCgpXG5cblx0XHR0aGlzLmZvbGRlckNvbHVtbiA9IG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdHJpY3Rpb24gPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRSZXN0cmljdGlvbigpXG5cdFx0XHRcdFx0cmV0dXJuIG0oRm9sZGVyQ29sdW1uVmlldywge1xuXHRcdFx0XHRcdFx0ZHJhd2VyOiB2bm9kZS5hdHRycy5kcmF3ZXJBdHRycyxcblx0XHRcdFx0XHRcdGJ1dHRvbjogdGhpcy5nZXRNYWluQnV0dG9uKHJlc3RyaWN0aW9uLnR5cGUpLFxuXHRcdFx0XHRcdFx0Y29udGVudDogW1xuXHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFNpZGViYXJTZWN0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwic2VhcmNoX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIi5mb2xkZXItcm93LmZsZXgtc3RhcnQubWxyLWJ1dHRvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtKE5hdkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImVtYWlsc19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGljb246ICgpID0+IEJvb3RJY29ucy5NYWlsLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIEdlbmVyYXRlIHRoZSBjdXJyZW50IHVybCBpbnN0ZWFkIG9mIHVzaW5nICcjJyB0byBhdm9pZCBFbGVjdHJvbiByZWxvYWRpbmcgdGhlIHBhZ2Ugb24gY2xpY2tcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRocmVmOiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRVcmxGcm9tU2VhcmNoQ2F0ZWdvcnkoU2VhcmNoQ2F0ZWdvcnlUeXBlcy5tYWlsKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMucmVzdWx0TGlzdENvbHVtbilcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlzU2VsZWN0ZWRQcmVmaXg6IFwiL3NlYXJjaC9tYWlsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29sb3JzOiBOYXZCdXR0b25Db2xvci5OYXYsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cGVyc2lzdGVudEJhY2tncm91bmQ6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiLmZvbGRlci1yb3cuZmxleC1zdGFydC5tbHItYnV0dG9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG0oTmF2QnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiY29udGFjdHNfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpY29uOiAoKSA9PiBCb290SWNvbnMuQ29udGFjdHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aHJlZjogdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0VXJsRnJvbVNlYXJjaENhdGVnb3J5KFNlYXJjaENhdGVnb3J5VHlwZXMuY29udGFjdCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLnJlc3VsdExpc3RDb2x1bW4pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpc1NlbGVjdGVkUHJlZml4OiBcIi9zZWFyY2gvY29udGFjdFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbG9yczogTmF2QnV0dG9uQ29sb3IuTmF2LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHBlcnNpc3RlbnRCYWNrZ3JvdW5kOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIi5mb2xkZXItcm93LmZsZXgtc3RhcnQubWxyLWJ1dHRvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtKE5hdkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImNhbGVuZGFyX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogKCkgPT4gQm9vdEljb25zLkNhbGVuZGFyLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGhyZWY6IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFVybEZyb21TZWFyY2hDYXRlZ29yeShTZWFyY2hDYXRlZ29yeVR5cGVzLmNhbGVuZGFyKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMucmVzdWx0TGlzdENvbHVtbilcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlzU2VsZWN0ZWRQcmVmaXg6IFwiL3NlYXJjaC9jYWxlbmRhclwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbG9yczogTmF2QnV0dG9uQ29sb3IuTmF2LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHBlcnNpc3RlbnRCYWNrZ3JvdW5kOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0dGhpcy5yZW5kZXJGaWx0ZXJTZWN0aW9uKCksXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0YXJpYUxhYmVsOiBcInNlYXJjaF9sYWJlbFwiLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0Q29sdW1uVHlwZS5Gb3JlZ3JvdW5kLFxuXHRcdFx0e1xuXHRcdFx0XHRtaW5XaWR0aDogc2l6ZS5maXJzdF9jb2xfbWluX3dpZHRoLFxuXHRcdFx0XHRtYXhXaWR0aDogc2l6ZS5maXJzdF9jb2xfbWF4X3dpZHRoLFxuXHRcdFx0XHRoZWFkZXJDZW50ZXI6IFwic2VhcmNoX2xhYmVsXCIsXG5cdFx0XHR9LFxuXHRcdClcblxuXHRcdHRoaXMucmVzdWx0TGlzdENvbHVtbiA9IG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIG0oQmFja2dyb3VuZENvbHVtbkxheW91dCwge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0XHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+XG5cdFx0XHRcdFx0XHRcdG0oRGVza3RvcExpc3RUb29sYmFyLCBbXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsICYmIGdldEN1cnJlbnRTZWFyY2hNb2RlKCkgIT09IFNlYXJjaENhdGVnb3J5VHlwZXMuY2FsZW5kYXJcblx0XHRcdFx0XHRcdFx0XHRcdD8gW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG0oU2VsZWN0QWxsQ2hlY2tib3gsIHNlbGVjdGlvbkF0dHJzRm9yTGlzdCh0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwpKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoVmlld01vZGVsLnNlYXJjaGVkVHlwZSwgTWFpbFR5cGVSZWYpID8gdGhpcy5yZW5kZXJGaWx0ZXJCdXR0b24oKSA6IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIF1cblx0XHRcdFx0XHRcdFx0XHRcdDogbShcIi5idXR0b24taGVpZ2h0XCIpLFxuXHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdG1vYmlsZUhlYWRlcjogKCkgPT4gdGhpcy5yZW5kZXJNb2JpbGVMaXN0SGVhZGVyKHZub2RlLmF0dHJzLmhlYWRlciksXG5cdFx0XHRcdFx0XHRjb2x1bW5MYXlvdXQ6IHRoaXMuZ2V0UmVzdWx0Q29sdW1uTGF5b3V0KCksXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRDb2x1bW5UeXBlLkJhY2tncm91bmQsXG5cdFx0XHR7XG5cdFx0XHRcdG1pbldpZHRoOiBzaXplLnNlY29uZF9jb2xfbWluX3dpZHRoLFxuXHRcdFx0XHRtYXhXaWR0aDogc2l6ZS5zZWNvbmRfY29sX21heF93aWR0aCxcblx0XHRcdFx0aGVhZGVyQ2VudGVyOiBcInNlYXJjaFJlc3VsdF9sYWJlbFwiLFxuXHRcdFx0fSxcblx0XHQpXG5cdFx0dGhpcy5yZXN1bHREZXRhaWxzQ29sdW1uID0gbmV3IFZpZXdDb2x1bW4oXG5cdFx0XHR7XG5cdFx0XHRcdHZpZXc6ICgpID0+IHRoaXMucmVuZGVyRGV0YWlsc1ZpZXcodm5vZGUuYXR0cnMuaGVhZGVyKSxcblx0XHRcdH0sXG5cdFx0XHRDb2x1bW5UeXBlLkJhY2tncm91bmQsXG5cdFx0XHR7XG5cdFx0XHRcdG1pbldpZHRoOiBzaXplLnRoaXJkX2NvbF9taW5fd2lkdGgsXG5cdFx0XHRcdG1heFdpZHRoOiBzaXplLnRoaXJkX2NvbF9tYXhfd2lkdGgsXG5cdFx0XHR9LFxuXHRcdClcblx0XHR0aGlzLnZpZXdTbGlkZXIgPSBuZXcgVmlld1NsaWRlcihbdGhpcy5mb2xkZXJDb2x1bW4sIHRoaXMucmVzdWx0TGlzdENvbHVtbiwgdGhpcy5yZXN1bHREZXRhaWxzQ29sdW1uXSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0UmVzdWx0Q29sdW1uTGF5b3V0KCkge1xuXHRcdHJldHVybiBtKFNlYXJjaExpc3RWaWV3LCB7XG5cdFx0XHRsaXN0TW9kZWw6IHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbCxcblx0XHRcdGN1cnJlbnRUeXBlOiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5zZWFyY2hlZFR5cGUsXG5cdFx0XHRvblNpbmdsZVNlbGVjdGlvbjogKGl0ZW0pID0+IHtcblx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMucmVzdWx0RGV0YWlsc0NvbHVtbilcblx0XHRcdFx0aWYgKGlzU2FtZVR5cGVSZWYoaXRlbS5lbnRyeS5fdHlwZSwgTWFpbFR5cGVSZWYpKSB7XG5cdFx0XHRcdFx0Ly8gTWFrZSBzdXJlIHRoYXQgd2UgbWFyayBtYWlsIGFzIHJlYWQgaWYgeW91IHNlbGVjdCB0aGUgbWFpbCBhZ2FpbiwgZXZlbiBpZiBpdCB3YXMgc2VsZWN0ZWQgYmVmb3JlLlxuXHRcdFx0XHRcdC8vIERvIGl0IGluIHRoZSBuZXh0IGV2ZW4gbG9vcCB0byBub3QgcmVseSBvbiB3aGF0IGlzIGNhbGxlZCBmaXJzdCwgbGlzdE1vZGVsIG9yIHVzLiBMaXN0TW9kZWwgY2hhbmdlcyBhcmVcblx0XHRcdFx0XHQvLyBzeW5jIHNvIHRoaXMgc2hvdWxkIGJlIGVub3VnaC5cblx0XHRcdFx0XHRQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGNvbnZlcnNhdGlvblZpZXdNb2RlbCA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmNvbnZlcnNhdGlvblZpZXdNb2RlbFxuXHRcdFx0XHRcdFx0aWYgKGNvbnZlcnNhdGlvblZpZXdNb2RlbCAmJiBpc1NhbWVJZChpdGVtLl9pZCwgY29udmVyc2F0aW9uVmlld01vZGVsLnByaW1hcnlNYWlsLl9pZCkpIHtcblx0XHRcdFx0XHRcdFx0Y29udmVyc2F0aW9uVmlld01vZGVsPy5wcmltYXJ5Vmlld01vZGVsKCkuc2V0VW5yZWFkKGZhbHNlKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRjYW5jZWxDYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNlYXJjaFZpZXdNb2RlbC5zZW5kU3RvcExvYWRpbmdTaWduYWwoKVxuXHRcdFx0fSxcblx0XHRcdGlzRnJlZUFjY291bnQ6IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNGcmVlQWNjb3VudCgpLFxuXHRcdFx0Z2V0TGFiZWxzRm9yTWFpbDogKG1haWwpID0+IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldExhYmVsc0Zvck1haWwobWFpbCksXG5cdFx0fSBzYXRpc2ZpZXMgU2VhcmNoTGlzdFZpZXdBdHRycylcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRmlsdGVyU2VjdGlvbigpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKGlzU2FtZVR5cGVSZWYodGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VhcmNoZWRUeXBlLCBNYWlsVHlwZVJlZikpIHtcblx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRTaWRlYmFyU2VjdGlvbixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6IFwiZmlsdGVyX2xhYmVsXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyTWFpbEZpbHRlclNlY3Rpb24oKSxcblx0XHRcdClcblx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYodGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VhcmNoZWRUeXBlLCBDYWxlbmRhckV2ZW50VHlwZVJlZikpIHtcblx0XHRcdHJldHVybiBtKFNpZGViYXJTZWN0aW9uLCB7IG5hbWU6IFwiZmlsdGVyX2xhYmVsXCIgfSwgdGhpcy5yZW5kZXJDYWxlbmRhckZpbHRlclNlY3Rpb24oKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gY29udGFjdHMgZG9uJ3QgaGF2ZSBmaWx0ZXJzXG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXG5cdG9uY3JlYXRlKCk6IHZvaWQge1xuXHRcdHRoaXMuc2VhcmNoVmlld01vZGVsLmluaXQoKCkgPT4gdGhpcy5jb25maXJtTWFpbFNlYXJjaCgpKVxuXG5cdFx0a2V5TWFuYWdlci5yZWdpc3RlclNob3J0Y3V0cyh0aGlzLnNob3J0Y3V0cygpKVxuXHR9XG5cblx0b25yZW1vdmUoKTogdm9pZCB7XG5cdFx0dGhpcy5zZWFyY2hWaWV3TW9kZWwuZGlzcG9zZSgpXG5cblx0XHRrZXlNYW5hZ2VyLnVucmVnaXN0ZXJTaG9ydGN1dHModGhpcy5zaG9ydGN1dHMoKSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTW9iaWxlTGlzdEhlYWRlcihoZWFkZXI6IEFwcEhlYWRlckF0dHJzKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbCAmJiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWw/LnN0YXRlLmluTXVsdGlzZWxlY3Rcblx0XHRcdD8gdGhpcy5yZW5kZXJNdWx0aVNlbGVjdE1vYmlsZUhlYWRlcigpXG5cdFx0XHQ6IHRoaXMucmVuZGVyTW9iaWxlTGlzdEFjdGlvbnNIZWFkZXIoaGVhZGVyKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNb2JpbGVMaXN0QWN0aW9uc0hlYWRlcihoZWFkZXI6IEFwcEhlYWRlckF0dHJzKSB7XG5cdFx0Y29uc3QgcmlnaHRBY3Rpb25zID0gW11cblxuXHRcdGlmIChpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoVmlld01vZGVsLnNlYXJjaGVkVHlwZSwgTWFpbFR5cGVSZWYpKSB7XG5cdFx0XHRyaWdodEFjdGlvbnMucHVzaCh0aGlzLnJlbmRlckZpbHRlckJ1dHRvbigpKVxuXHRcdH1cblxuXHRcdGlmICghaXNTYW1lVHlwZVJlZih0aGlzLnNlYXJjaFZpZXdNb2RlbC5zZWFyY2hlZFR5cGUsIENhbGVuZGFyRXZlbnRUeXBlUmVmKSkge1xuXHRcdFx0cmlnaHRBY3Rpb25zLnB1c2goXG5cdFx0XHRcdG0oRW50ZXJNdWx0aXNlbGVjdEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRjbGlja0FjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsPy5lbnRlck11bHRpc2VsZWN0KClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0aWYgKHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpKSB7XG5cdFx0XHRyaWdodEFjdGlvbnMucHVzaCh0aGlzLnJlbmRlckhlYWRlclJpZ2h0VmlldygpKVxuXHRcdH1cblxuXHRcdHJldHVybiBtKEJhc2VNb2JpbGVIZWFkZXIsIHtcblx0XHRcdGxlZnQ6IG0oTW9iaWxlSGVhZGVyTWVudUJ1dHRvbiwgeyAuLi5oZWFkZXIsIGJhY2tBY3Rpb246ICgpID0+IHRoaXMudmlld1NsaWRlci5mb2N1c1ByZXZpb3VzQ29sdW1uKCkgfSksXG5cdFx0XHRyaWdodDogcmlnaHRBY3Rpb25zLFxuXHRcdFx0Y2VudGVyOiBtKFxuXHRcdFx0XHRcIi5mbGV4LWdyb3cuZmxleC5qdXN0aWZ5LWNlbnRlclwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2xhc3M6IHJpZ2h0QWN0aW9ucy5sZW5ndGggPT09IDAgPyBcIm1yXCIgOiBcIlwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtKHNlYXJjaEJhciwge1xuXHRcdFx0XHRcdHBsYWNlaG9sZGVyOiB0aGlzLnNlYXJjaEJhclBsYWNlaG9sZGVyKCksXG5cdFx0XHRcdFx0cmV0dXJuTGlzdGVuZXI6ICgpID0+IHRoaXMucmVzdWx0TGlzdENvbHVtbi5mb2N1cygpLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRpbmplY3Rpb25zOiBtKFByb2dyZXNzQmFyLCB7IHByb2dyZXNzOiBoZWFkZXIub2ZmbGluZUluZGljYXRvck1vZGVsLmdldFByb2dyZXNzKCkgfSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTXVsdGlTZWxlY3RNb2JpbGVIZWFkZXIoKSB7XG5cdFx0cmV0dXJuIG0oTXVsdGlzZWxlY3RNb2JpbGVIZWFkZXIsIHtcblx0XHRcdC4uLnNlbGVjdGlvbkF0dHJzRm9yTGlzdCh0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwpLFxuXHRcdFx0bWVzc2FnZTpcblx0XHRcdFx0Z2V0Q3VycmVudFNlYXJjaE1vZGUoKSA9PT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5tYWlsXG5cdFx0XHRcdFx0PyBnZXRNYWlsU2VsZWN0aW9uTWVzc2FnZSh0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRTZWxlY3RlZE1haWxzKCkpXG5cdFx0XHRcdFx0OiBnZXRDb250YWN0U2VsZWN0aW9uTWVzc2FnZSh0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RzKCkubGVuZ3RoKSxcblx0XHR9KVxuXHR9XG5cblx0LyoqIGRlcGVuZGluZyBvbiB0aGUgc2VhcmNoIGFuZCBzZWxlY3Rpb24gc3RhdGUgd2Ugd2FudCB0byByZW5kZXIgYVxuXHQgKiAobXVsdGkpIG1haWwgdmlld2VyIG9yIGEgKG11bHRpKSBjb250YWN0IHZpZXdlciBvciBhbiBldmVudCBwcmV2aWV3XG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckRldGFpbHNWaWV3KGhlYWRlcjogQXBwSGVhZGVyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbC5pc1NlbGVjdGlvbkVtcHR5KCkgJiYgdGhpcy52aWV3U2xpZGVyLmZvY3VzZWRDb2x1bW4gPT09IHRoaXMucmVzdWx0RGV0YWlsc0NvbHVtbikge1xuXHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMucmVzdWx0TGlzdENvbHVtbilcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0aWYgKGdldEN1cnJlbnRTZWFyY2hNb2RlKCkgPT09IFNlYXJjaENhdGVnb3J5VHlwZXMuY29udGFjdCkge1xuXHRcdFx0Y29uc3Qgc2VsZWN0ZWRDb250YWN0cyA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkQ29udGFjdHMoKVxuXG5cdFx0XHRjb25zdCBhY3Rpb25zID0gbShDb250YWN0Vmlld2VyQWN0aW9ucywge1xuXHRcdFx0XHRjb250YWN0czogc2VsZWN0ZWRDb250YWN0cyxcblx0XHRcdFx0b25FZGl0OiAoYzogQ29udGFjdCkgPT4gbmV3IENvbnRhY3RFZGl0b3IobG9jYXRvci5lbnRpdHlDbGllbnQsIGMpLnNob3coKSxcblx0XHRcdFx0b25EZWxldGU6IGRlbGV0ZUNvbnRhY3RzLFxuXHRcdFx0XHRvbk1lcmdlOiBjb25maXJtTWVyZ2UsXG5cdFx0XHRcdG9uRXhwb3J0OiBleHBvcnRDb250YWN0cyxcblx0XHRcdH0pXG5cdFx0XHRjb25zdCBpc011bHRpc2VsZWN0ID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsPy5zdGF0ZS5pbk11bHRpc2VsZWN0IHx8IHNlbGVjdGVkQ29udGFjdHMubGVuZ3RoID09PSAwXG5cdFx0XHRyZXR1cm4gbShCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0LCB7XG5cdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+IG0oRGVza3RvcFZpZXdlclRvb2xiYXIsIGFjdGlvbnMpLFxuXHRcdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+XG5cdFx0XHRcdFx0bShNb2JpbGVIZWFkZXIsIHtcblx0XHRcdFx0XHRcdC4uLmhlYWRlcixcblx0XHRcdFx0XHRcdGJhY2tBY3Rpb246ICgpID0+IHRoaXMudmlld1NsaWRlci5mb2N1c1ByZXZpb3VzQ29sdW1uKCksXG5cdFx0XHRcdFx0XHRjb2x1bW5UeXBlOiBcIm90aGVyXCIsXG5cdFx0XHRcdFx0XHR0aXRsZTogXCJzZWFyY2hfbGFiZWxcIixcblx0XHRcdFx0XHRcdGFjdGlvbnM6IG51bGwsXG5cdFx0XHRcdFx0XHRtdWx0aWNvbHVtbkFjdGlvbnM6ICgpID0+IGFjdGlvbnMsXG5cdFx0XHRcdFx0XHRwcmltYXJ5QWN0aW9uOiAoKSA9PiB0aGlzLnJlbmRlckhlYWRlclJpZ2h0VmlldygpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRjb2x1bW5MYXlvdXQ6XG5cdFx0XHRcdFx0Ly8gc2VlIGNvbW1lbnQgZm9yIC5zY3JvbGxiYXItZ3V0dGVyLXN0YWJsZS1vci1mYWxsYmFja1xuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5maWxsLWFic29sdXRlLmZsZXguY29sLm92ZXJmbG93LXktc2Nyb2xsXCIsXG5cdFx0XHRcdFx0XHRpc011bHRpc2VsZWN0XG5cdFx0XHRcdFx0XHRcdD8gbShNdWx0aUNvbnRhY3RWaWV3ZXIsIHtcblx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdGVkRW50aXRpZXM6IHNlbGVjdGVkQ29udGFjdHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3ROb25lOiAoKSA9PiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpLFxuXHRcdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHRcdDogbShDb250YWN0Q2FyZFZpZXdlciwgeyBjb250YWN0OiBzZWxlY3RlZENvbnRhY3RzWzBdLCBvbldyaXRlTWFpbDogd3JpdGVNYWlsIH0pLFxuXHRcdFx0XHRcdCksXG5cdFx0XHR9KVxuXHRcdH0gZWxzZSBpZiAoZ2V0Q3VycmVudFNlYXJjaE1vZGUoKSA9PT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5tYWlsKSB7XG5cdFx0XHRjb25zdCBzZWxlY3RlZE1haWxzID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRNYWlscygpXG5cblx0XHRcdGNvbnN0IGNvbnZlcnNhdGlvblZpZXdNb2RlbCA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmNvbnZlcnNhdGlvblZpZXdNb2RlbFxuXHRcdFx0aWYgKHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbD8uc3RhdGUuaW5NdWx0aXNlbGVjdCB8fCAhY29udmVyc2F0aW9uVmlld01vZGVsKSB7XG5cdFx0XHRcdGNvbnN0IGFjdGlvbnMgPSBtKE1haWxWaWV3ZXJBY3Rpb25zLCB7XG5cdFx0XHRcdFx0bWFpbGJveE1vZGVsOiBsb2NhdG9yLm1haWxib3hNb2RlbCxcblx0XHRcdFx0XHRtYWlsTW9kZWw6IG1haWxMb2NhdG9yLm1haWxNb2RlbCxcblx0XHRcdFx0XHRtYWlsczogc2VsZWN0ZWRNYWlscyxcblx0XHRcdFx0XHRzZWxlY3ROb25lOiAoKSA9PiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRyZXR1cm4gbShCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0LCB7XG5cdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0XHRcdGRlc2t0b3BUb29sYmFyOiAoKSA9PiBtKERlc2t0b3BWaWV3ZXJUb29sYmFyLCBhY3Rpb25zKSxcblx0XHRcdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+XG5cdFx0XHRcdFx0XHRtKE1vYmlsZUhlYWRlciwge1xuXHRcdFx0XHRcdFx0XHQuLi5oZWFkZXIsXG5cdFx0XHRcdFx0XHRcdGJhY2tBY3Rpb246ICgpID0+IHRoaXMudmlld1NsaWRlci5mb2N1c1ByZXZpb3VzQ29sdW1uKCksXG5cdFx0XHRcdFx0XHRcdGNvbHVtblR5cGU6IFwib3RoZXJcIixcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGdldE1haWxTZWxlY3Rpb25NZXNzYWdlKHNlbGVjdGVkTWFpbHMpLFxuXHRcdFx0XHRcdFx0XHRhY3Rpb25zOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRtdWx0aWNvbHVtbkFjdGlvbnM6ICgpID0+IGFjdGlvbnMsXG5cdFx0XHRcdFx0XHRcdHByaW1hcnlBY3Rpb246ICgpID0+IHRoaXMucmVuZGVySGVhZGVyUmlnaHRWaWV3KCksXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRjb2x1bW5MYXlvdXQ6IG0oTXVsdGlJdGVtVmlld2VyLCB7XG5cdFx0XHRcdFx0XHRzZWxlY3RlZEVudGl0aWVzOiBzZWxlY3RlZE1haWxzLFxuXHRcdFx0XHRcdFx0c2VsZWN0Tm9uZTogKCkgPT4gdGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsLnNlbGVjdE5vbmUoKSxcblx0XHRcdFx0XHRcdGxvYWRBbGw6ICgpID0+IHRoaXMuc2VhcmNoVmlld01vZGVsLmxvYWRBbGwoKSxcblx0XHRcdFx0XHRcdHN0b3BMb2FkQWxsOiAoKSA9PiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5zdG9wTG9hZEFsbCgpLFxuXHRcdFx0XHRcdFx0bG9hZGluZ0FsbDpcblx0XHRcdFx0XHRcdFx0dGhpcy5zZWFyY2hWaWV3TW9kZWwubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdCAhPSBudWxsXG5cdFx0XHRcdFx0XHRcdFx0PyBcImxvYWRpbmdcIlxuXHRcdFx0XHRcdFx0XHRcdDogdGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsPy5pc0xvYWRlZENvbXBsZXRlbHkoKVxuXHRcdFx0XHRcdFx0XHRcdD8gXCJsb2FkZWRcIlxuXHRcdFx0XHRcdFx0XHRcdDogXCJjYW5fbG9hZFwiLFxuXHRcdFx0XHRcdFx0Z2V0U2VsZWN0aW9uTWVzc2FnZTogKHNlbGVjdGVkOiBSZWFkb25seUFycmF5PE1haWw+KSA9PiBnZXRNYWlsU2VsZWN0aW9uTWVzc2FnZShzZWxlY3RlZCksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBhY3Rpb25zID0gbShNYWlsVmlld2VyQWN0aW9ucywge1xuXHRcdFx0XHRcdG1haWxib3hNb2RlbDogY29udmVyc2F0aW9uVmlld01vZGVsLnByaW1hcnlWaWV3TW9kZWwoKS5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdFx0bWFpbE1vZGVsOiBjb252ZXJzYXRpb25WaWV3TW9kZWwucHJpbWFyeVZpZXdNb2RlbCgpLm1haWxNb2RlbCxcblx0XHRcdFx0XHRtYWlsVmlld2VyVmlld01vZGVsOiBjb252ZXJzYXRpb25WaWV3TW9kZWwucHJpbWFyeVZpZXdNb2RlbCgpLFxuXHRcdFx0XHRcdG1haWxzOiBbY29udmVyc2F0aW9uVmlld01vZGVsLnByaW1hcnlNYWlsXSxcblx0XHRcdFx0fSlcblx0XHRcdFx0cmV0dXJuIG0oQmFja2dyb3VuZENvbHVtbkxheW91dCwge1xuXHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdFx0XHRkZXNrdG9wVG9vbGJhcjogKCkgPT4gbShEZXNrdG9wVmlld2VyVG9vbGJhciwgYWN0aW9ucyksXG5cdFx0XHRcdFx0bW9iaWxlSGVhZGVyOiAoKSA9PlxuXHRcdFx0XHRcdFx0bShNb2JpbGVIZWFkZXIsIHtcblx0XHRcdFx0XHRcdFx0Li4uaGVhZGVyLFxuXHRcdFx0XHRcdFx0XHRiYWNrQWN0aW9uOiAoKSA9PiB0aGlzLnZpZXdTbGlkZXIuZm9jdXNQcmV2aW91c0NvbHVtbigpLFxuXHRcdFx0XHRcdFx0XHRjb2x1bW5UeXBlOiBcIm90aGVyXCIsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBnZXRDb252ZXJzYXRpb25UaXRsZShjb252ZXJzYXRpb25WaWV3TW9kZWwpLFxuXHRcdFx0XHRcdFx0XHRhY3Rpb25zOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRtdWx0aWNvbHVtbkFjdGlvbnM6ICgpID0+IGFjdGlvbnMsXG5cdFx0XHRcdFx0XHRcdHByaW1hcnlBY3Rpb246ICgpID0+IHRoaXMucmVuZGVySGVhZGVyUmlnaHRWaWV3KCksXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRjb2x1bW5MYXlvdXQ6IG0oQ29udmVyc2F0aW9uVmlld2VyLCB7XG5cdFx0XHRcdFx0XHQvLyBSZS1jcmVhdGUgdGhlIHdob2xlIHZpZXdlciBhbmQgaXRzIHZub2RlIHRyZWUgaWYgZW1haWwgaGFzIGNoYW5nZWRcblx0XHRcdFx0XHRcdGtleTogZ2V0RWxlbWVudElkKGNvbnZlcnNhdGlvblZpZXdNb2RlbC5wcmltYXJ5TWFpbCksXG5cdFx0XHRcdFx0XHR2aWV3TW9kZWw6IGNvbnZlcnNhdGlvblZpZXdNb2RlbCxcblx0XHRcdFx0XHRcdGRlbGF5Qm9keVJlbmRlcmluZzogUHJvbWlzZS5yZXNvbHZlKCksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChnZXRDdXJyZW50U2VhcmNoTW9kZSgpID09PSBTZWFyY2hDYXRlZ29yeVR5cGVzLmNhbGVuZGFyKSB7XG5cdFx0XHRjb25zdCBzZWxlY3RlZEV2ZW50ID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRFdmVudHMoKVswXVxuXHRcdFx0cmV0dXJuIG0oQmFja2dyb3VuZENvbHVtbkxheW91dCwge1xuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRcdGRlc2t0b3BUb29sYmFyOiAoKSA9PiBtKERlc2t0b3BWaWV3ZXJUb29sYmFyLCBbXSksXG5cdFx0XHRcdG1vYmlsZUhlYWRlcjogKCkgPT5cblx0XHRcdFx0XHRtKE1vYmlsZUhlYWRlciwge1xuXHRcdFx0XHRcdFx0Li4uaGVhZGVyLFxuXHRcdFx0XHRcdFx0YmFja0FjdGlvbjogKCkgPT4gdGhpcy52aWV3U2xpZGVyLmZvY3VzUHJldmlvdXNDb2x1bW4oKSxcblx0XHRcdFx0XHRcdGNvbHVtblR5cGU6IFwib3RoZXJcIixcblx0XHRcdFx0XHRcdHRpdGxlOiBcInNlYXJjaF9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0YWN0aW9uczogbnVsbCxcblx0XHRcdFx0XHRcdG11bHRpY29sdW1uQWN0aW9uczogKCkgPT4gW10sXG5cdFx0XHRcdFx0XHRwcmltYXJ5QWN0aW9uOiAoKSA9PiB0aGlzLnJlbmRlckhlYWRlclJpZ2h0VmlldygpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRjb2x1bW5MYXlvdXQ6XG5cdFx0XHRcdFx0c2VsZWN0ZWRFdmVudCA9PSBudWxsXG5cdFx0XHRcdFx0XHQ/IG0oQ29sdW1uRW1wdHlNZXNzYWdlQm94LCB7XG5cdFx0XHRcdFx0XHRcdFx0bWVzc2FnZTogXCJub0V2ZW50U2VsZWN0X21zZ1wiLFxuXHRcdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5DYWxlbmRhcixcblx0XHRcdFx0XHRcdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdFx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdDogdGhpcy5yZW5kZXJFdmVudFByZXZpZXcoc2VsZWN0ZWRFdmVudCksXG5cdFx0XHR9KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIuZmxleC5jb2wuZmlsbC1hYnNvbHV0ZVwiLFxuXHRcdFx0XHQvLyBVc2luZyBjb250YWN0Vmlld1Rvb2xiYXIgYmVjYXVzZSBpdCB3aWxsIGRpc3BsYXkgZW1wdHlcblx0XHRcdFx0bShDb250YWN0Vmlld2VyQWN0aW9ucywgeyBjb250YWN0czogW10sIG9uRXhwb3J0OiBub09wLCBvbk1lcmdlOiBub09wLCBvbkRlbGV0ZTogbm9PcCwgb25FZGl0OiBub09wIH0pLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXgtZ3Jvdy5yZWwub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHRcdFx0bShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IFwibm9TZWxlY3Rpb25fbXNnXCIsXG5cdFx0XHRcdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaW52YWxpZGF0ZUJpcnRoZGF5UHJldmlldygpIHtcblx0XHRpZiAoZ2V0Q3VycmVudFNlYXJjaE1vZGUoKSAhPT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5jYWxlbmRhcikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2VsZWN0ZWRFdmVudCA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkRXZlbnRzKClbMF1cblx0XHRpZiAoIXNlbGVjdGVkRXZlbnQgfHwgIWlzQmlydGhkYXlFdmVudChzZWxlY3RlZEV2ZW50LnVpZCkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IGlkUGFydHMgPSBzZWxlY3RlZEV2ZW50Ll9pZFsxXS5zcGxpdChcIiNcIilcblx0XHRjb25zdCBjb250YWN0SWQgPSBleHRyYWN0Q29udGFjdElkRnJvbUV2ZW50KGxhc3QoaWRQYXJ0cykpXG5cdFx0aWYgKCFjb250YWN0SWQpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0Q29udGFjdFByZXZpZXdEYXRhKGNvbnRhY3RJZCkucmVsb2FkKCkudGhlbihtLnJlZHJhdylcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXZlbnRQcmV2aWV3KGV2ZW50OiBDYWxlbmRhckV2ZW50KSB7XG5cdFx0aWYgKGlzQmlydGhkYXlFdmVudChldmVudC51aWQpKSB7XG5cdFx0XHRjb25zdCBpZFBhcnRzID0gZXZlbnQuX2lkWzFdLnNwbGl0KFwiI1wiKVxuXG5cdFx0XHRjb25zdCBjb250YWN0SWQgPSBleHRyYWN0Q29udGFjdElkRnJvbUV2ZW50KGxhc3QoaWRQYXJ0cykpXG5cdFx0XHRpZiAoY29udGFjdElkICE9IG51bGwgJiYgdGhpcy5nZXRDb250YWN0UHJldmlld0RhdGEoY29udGFjdElkKS5pc0xvYWRlZCgpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckNvbnRhY3RQcmV2aWV3KHRoaXMuZ2V0Q29udGFjdFByZXZpZXdEYXRhKGNvbnRhY3RJZCkuZ2V0U3luYygpISlcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9IGVsc2UgaWYgKHRoaXMuZ2V0U2FuaXRpemVkUHJldmlld0RhdGEoZXZlbnQpLmlzTG9hZGVkKCkpIHtcblx0XHRcdHJldHVybiB0aGlzLnJlbmRlckV2ZW50RGV0YWlscyhldmVudClcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDb250YWN0UHJldmlldyhjb250YWN0OiBDb250YWN0KSB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5maWxsLWFic29sdXRlLmZsZXguY29sLm92ZXJmbG93LXktc2Nyb2xsXCIsXG5cdFx0XHRtKENvbnRhY3RDYXJkVmlld2VyLCB7XG5cdFx0XHRcdGNvbnRhY3Q6IGNvbnRhY3QsXG5cdFx0XHRcdGVkaXRBY3Rpb246IChjb250YWN0KSA9PiB7XG5cdFx0XHRcdFx0bmV3IENvbnRhY3RFZGl0b3IobG9jYXRvci5lbnRpdHlDbGllbnQsIGNvbnRhY3QpLnNob3coKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbldyaXRlTWFpbDogd3JpdGVNYWlsLFxuXHRcdFx0XHRleHRlbmRlZEFjdGlvbnM6IHRydWUsXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckV2ZW50RGV0YWlscyhzZWxlY3RlZEV2ZW50OiBDYWxlbmRhckV2ZW50KSB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5oZWlnaHQtMTAwcC5vdmVyZmxvdy15LXNjcm9sbC5tYi1sLmZpbGwtYWJzb2x1dGUucGItbFwiLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuYm9yZGVyLXJhZGl1cy1iaWcuZmxleC5jb2wuZmxleC1ncm93LmNvbnRlbnQtYmdcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNsYXNzOiBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyBcIm1sci1sXCIgOiBcIm1sclwiLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcIm1pbi13aWR0aFwiOiBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyBweChzaXplLnRoaXJkX2NvbF9taW5fd2lkdGgpIDogbnVsbCxcblx0XHRcdFx0XHRcdFwibWF4LXdpZHRoXCI6IHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSA/IHB4KHNpemUudGhpcmRfY29sX21heF93aWR0aCkgOiBudWxsLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG0oRXZlbnREZXRhaWxzVmlldywge1xuXHRcdFx0XHRcdGV2ZW50UHJldmlld01vZGVsOiBhc3NlcnROb3ROdWxsKHRoaXMuZ2V0U2FuaXRpemVkUHJldmlld0RhdGEoc2VsZWN0ZWRFdmVudCkuZ2V0U3luYygpKSxcblx0XHRcdFx0fSBzYXRpc2ZpZXMgRXZlbnREZXRhaWxzVmlld0F0dHJzKSxcblx0XHRcdCksXG5cdFx0KVxuXHR9XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPFNlYXJjaFZpZXdBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIiNzZWFyY2gubWFpbi12aWV3XCIsXG5cdFx0XHRtKHRoaXMudmlld1NsaWRlciwge1xuXHRcdFx0XHRoZWFkZXI6IG0oSGVhZGVyLCB7XG5cdFx0XHRcdFx0c2VhcmNoQmFyOiAoKSA9PlxuXHRcdFx0XHRcdFx0bShzZWFyY2hCYXIsIHtcblx0XHRcdFx0XHRcdFx0cGxhY2Vob2xkZXI6IHRoaXMuc2VhcmNoQmFyUGxhY2Vob2xkZXIoKSxcblx0XHRcdFx0XHRcdFx0cmV0dXJuTGlzdGVuZXI6ICgpID0+IHRoaXMucmVzdWx0TGlzdENvbHVtbi5mb2N1cygpLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0Li4uYXR0cnMuaGVhZGVyLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0Ym90dG9tTmF2OiB0aGlzLnJlbmRlckJvdHRvbU5hdigpLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJCb3R0b21OYXYoKSB7XG5cdFx0aWYgKCFzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSkgcmV0dXJuIG0oQm90dG9tTmF2KVxuXG5cdFx0Y29uc3QgaXNJbk11bHRpc2VsZWN0ID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsPy5zdGF0ZS5pbk11bHRpc2VsZWN0ID8/IGZhbHNlXG5cblx0XHRpZiAodGhpcy52aWV3U2xpZGVyLmZvY3VzZWRDb2x1bW4gPT09IHRoaXMucmVzdWx0RGV0YWlsc0NvbHVtbiAmJiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5jb252ZXJzYXRpb25WaWV3TW9kZWwpIHtcblx0XHRcdHJldHVybiBtKE1vYmlsZU1haWxBY3Rpb25CYXIsIHsgdmlld01vZGVsOiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5jb252ZXJzYXRpb25WaWV3TW9kZWw/LnByaW1hcnlWaWV3TW9kZWwoKSB9KVxuXHRcdH0gZWxzZSBpZiAoIWlzSW5NdWx0aXNlbGVjdCAmJiB0aGlzLnZpZXdTbGlkZXIuZm9jdXNlZENvbHVtbiA9PT0gdGhpcy5yZXN1bHREZXRhaWxzQ29sdW1uKSB7XG5cdFx0XHRpZiAoZ2V0Q3VycmVudFNlYXJjaE1vZGUoKSA9PT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5jb250YWN0KSB7XG5cdFx0XHRcdHJldHVybiBtKE1vYmlsZUFjdGlvbkJhciwge1xuXHRcdFx0XHRcdGFjdGlvbnM6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiZWRpdF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0YWN0aW9uOiAoKSA9PiBuZXcgQ29udGFjdEVkaXRvcihsb2NhdG9yLmVudGl0eUNsaWVudCwgdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRDb250YWN0cygpWzBdKS5zaG93KCksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5UcmFzaCxcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRhY3Rpb246ICgpID0+IGRlbGV0ZUNvbnRhY3RzKHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkQ29udGFjdHMoKSksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0pXG5cdFx0XHR9IGVsc2UgaWYgKGdldEN1cnJlbnRTZWFyY2hNb2RlKCkgPT09IFNlYXJjaENhdGVnb3J5VHlwZXMuY2FsZW5kYXIpIHtcblx0XHRcdFx0Y29uc3Qgc2VsZWN0ZWRFdmVudCA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkRXZlbnRzKClbMF1cblx0XHRcdFx0aWYgKCFzZWxlY3RlZEV2ZW50KSB7XG5cdFx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMucmVzdWx0TGlzdENvbHVtbilcblx0XHRcdFx0XHRyZXR1cm4gbShNb2JpbGVBY3Rpb25CYXIsIHsgYWN0aW9uczogW10gfSlcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBwcmV2aWV3TW9kZWwgPSB0aGlzLmdldFNhbml0aXplZFByZXZpZXdEYXRhKHNlbGVjdGVkRXZlbnQpLmdldFN5bmMoKVxuXHRcdFx0XHRjb25zdCBhY3Rpb25zOiBBcnJheTxNb2JpbGVBY3Rpb25BdHRycz4gPSBbXVxuXHRcdFx0XHRpZiAocHJldmlld01vZGVsKSB7XG5cdFx0XHRcdFx0aWYgKHByZXZpZXdNb2RlbC5jYW5TZW5kVXBkYXRlcykge1xuXHRcdFx0XHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0aWNvbjogQm9vdEljb25zLk1haWwsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcInNlbmRVcGRhdGVzX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdGFjdGlvbjogKCkgPT4gaGFuZGxlU2VuZFVwZGF0ZXNDbGljayhwcmV2aWV3TW9kZWwpLFxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHByZXZpZXdNb2RlbC5jYW5FZGl0KSB7XG5cdFx0XHRcdFx0XHRhY3Rpb25zLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0XHRcdFx0XHR0aXRsZTogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRhY3Rpb246IChldjogTW91c2VFdmVudCwgcmVjZWl2ZXI6IEhUTUxFbGVtZW50KSA9PiBoYW5kbGVFdmVudEVkaXRCdXR0b25DbGljayhwcmV2aWV3TW9kZWwsIGV2LCByZWNlaXZlciksXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAocHJldmlld01vZGVsLmNhbkRlbGV0ZSkge1xuXHRcdFx0XHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0YWN0aW9uOiAoZXY6IE1vdXNlRXZlbnQsIHJlY2VpdmVyOiBIVE1MRWxlbWVudCkgPT4gaGFuZGxlRXZlbnREZWxldGVCdXR0b25DbGljayhwcmV2aWV3TW9kZWwsIGV2LCByZWNlaXZlciksXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmdldFNhbml0aXplZFByZXZpZXdEYXRhKHNlbGVjdGVkRXZlbnQpLmxvYWQoKVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtKE1vYmlsZUFjdGlvbkJhciwgeyBhY3Rpb25zIH0pXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpc0luTXVsdGlzZWxlY3QpIHtcblx0XHRcdGlmIChnZXRDdXJyZW50U2VhcmNoTW9kZSgpID09PSBTZWFyY2hDYXRlZ29yeVR5cGVzLm1haWwpIHtcblx0XHRcdFx0cmV0dXJuIG0oTW9iaWxlTWFpbE11bHRpc2VsZWN0aW9uQWN0aW9uQmFyLCB7XG5cdFx0XHRcdFx0bWFpbHM6IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkTWFpbHMoKSxcblx0XHRcdFx0XHRzZWxlY3ROb25lOiAoKSA9PiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpLFxuXHRcdFx0XHRcdG1haWxNb2RlbDogbWFpbExvY2F0b3IubWFpbE1vZGVsLFxuXHRcdFx0XHRcdG1haWxib3hNb2RlbDogbG9jYXRvci5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdH0pXG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMudmlld1NsaWRlci5mb2N1c2VkQ29sdW1uID09PSB0aGlzLnJlc3VsdExpc3RDb2x1bW4pIHtcblx0XHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFx0TW9iaWxlQm90dG9tQWN0aW9uQmFyLFxuXHRcdFx0XHRcdG0oQ29udGFjdFZpZXdlckFjdGlvbnMsIHtcblx0XHRcdFx0XHRcdGNvbnRhY3RzOiB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RzKCksXG5cdFx0XHRcdFx0XHRvbkVkaXQ6ICgpID0+IG5ldyBDb250YWN0RWRpdG9yKGxvY2F0b3IuZW50aXR5Q2xpZW50LCBnZXRGaXJzdE9yVGhyb3codGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRDb250YWN0cygpKSkuc2hvdygpLFxuXHRcdFx0XHRcdFx0b25EZWxldGU6IChjb250YWN0czogQ29udGFjdFtdKSA9PiBkZWxldGVDb250YWN0cyhjb250YWN0cywgKCkgPT4gdGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsLnNlbGVjdE5vbmUoKSksXG5cdFx0XHRcdFx0XHRvbk1lcmdlOiBjb25maXJtTWVyZ2UsXG5cdFx0XHRcdFx0XHRvbkV4cG9ydDogZXhwb3J0Q29udGFjdHMsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbShCb3R0b21OYXYpXG5cdH1cblxuXHRwcml2YXRlIHNlYXJjaEJhclBsYWNlaG9sZGVyKCkge1xuXHRcdGNvbnN0IHJvdXRlID0gbS5yb3V0ZS5nZXQoKVxuXHRcdGlmIChyb3V0ZS5zdGFydHNXaXRoKFwiL3NlYXJjaC9jYWxlbmRhclwiKSkge1xuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0KFwic2VhcmNoQ2FsZW5kYXJfcGxhY2Vob2xkZXJcIilcblx0XHR9IGVsc2UgaWYgKHJvdXRlLnN0YXJ0c1dpdGgoXCIvc2VhcmNoL2NvbnRhY3RcIikpIHtcblx0XHRcdHJldHVybiBsYW5nLmdldChcInNlYXJjaENvbnRhY3RzX3BsYWNlaG9sZGVyXCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBsYW5nLmdldChcInNlYXJjaEVtYWlsc19wbGFjZWhvbGRlclwiKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZ2V0QXZhaWxhYmxlTWFpbEZvbGRlcnMoKTogU2VsZWN0b3JJdGVtPElkIHwgbnVsbD5bXSB7XG5cdFx0Y29uc3QgbWFpbGJveGVzID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwubWFpbGJveGVzXG5cblx0XHRjb25zdCBhdmFpbGFibGVNYWlsRm9sZGVyczogU2VsZWN0b3JJdGVtPElkIHwgbnVsbD5bXSA9IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogbGFuZy5nZXQoXCJhbGxfbGFiZWxcIiksXG5cdFx0XHRcdHZhbHVlOiBudWxsLFxuXHRcdFx0XHRpbmRlbnRhdGlvbkxldmVsOiAwLFxuXHRcdFx0fSxcblx0XHRdXG5cblx0XHRmb3IgKGNvbnN0IG1haWxib3ggb2YgbWFpbGJveGVzKSB7XG5cdFx0XHRjb25zdCBtYWlsYm94SW5kZXggPSBtYWlsYm94ZXMuaW5kZXhPZihtYWlsYm94KVxuXHRcdFx0Y29uc3QgbWFpbEZvbGRlcnMgPSBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0Rm9sZGVyU3lzdGVtQnlHcm91cElkKG1haWxib3gubWFpbEdyb3VwLl9pZCk/LmdldEluZGVudGVkTGlzdCgpID8/IFtdXG5cdFx0XHRmb3IgKGNvbnN0IGZvbGRlckluZm8gb2YgbWFpbEZvbGRlcnMpIHtcblx0XHRcdFx0aWYgKGZvbGRlckluZm8uZm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLlNQQU0pIHtcblx0XHRcdFx0XHRjb25zdCBtYWlsYm94TGFiZWwgPSBtYWlsYm94SW5kZXggPT09IDAgPyBcIlwiIDogYCAoJHtnZXRHcm91cEluZm9EaXNwbGF5TmFtZShtYWlsYm94Lm1haWxHcm91cEluZm8pfSlgXG5cdFx0XHRcdFx0Y29uc3QgZm9sZGVySWQgPSBmb2xkZXJJbmZvLmZvbGRlci5pc01haWxTZXQgPyBnZXRFbGVtZW50SWQoZm9sZGVySW5mby5mb2xkZXIpIDogZm9sZGVySW5mby5mb2xkZXIubWFpbHNcblx0XHRcdFx0XHRhdmFpbGFibGVNYWlsRm9sZGVycy5wdXNoKHtcblx0XHRcdFx0XHRcdG5hbWU6IGdldEluZGVudGVkRm9sZGVyTmFtZUZvckRyb3Bkb3duKGZvbGRlckluZm8pICsgbWFpbGJveExhYmVsLFxuXHRcdFx0XHRcdFx0dmFsdWU6IGZvbGRlcklkLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGF2YWlsYWJsZU1haWxGb2xkZXJzXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1haWxGaWx0ZXJTZWN0aW9uKCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBhdmFpbGFibGVNYWlsRm9sZGVycyA9IHRoaXMuZ2V0QXZhaWxhYmxlTWFpbEZvbGRlcnMoKVxuXHRcdGNvbnN0IGF2YWlsYWJsZU1haWxGaWVsZHMgPSBTRUFSQ0hfTUFJTF9GSUVMRFMubWFwKChmKSA9PiAoeyBuYW1lOiBsYW5nLmdldChmLnRleHRJZCksIHZhbHVlOiBmLmZpZWxkIH0pKVxuXHRcdHJldHVybiBbXG5cdFx0XHR0aGlzLnJlbmRlckRhdGVSYW5nZVNlbGVjdGlvbigpLFxuXHRcdFx0bShcImRpdi5tbC1idXR0b25cIiwgW1xuXHRcdFx0XHRtKERyb3BEb3duU2VsZWN0b3IsIHtcblx0XHRcdFx0XHRsYWJlbDogXCJmaWVsZF9sYWJlbFwiLFxuXHRcdFx0XHRcdGl0ZW1zOiBhdmFpbGFibGVNYWlsRmllbGRzLFxuXHRcdFx0XHRcdHNlbGVjdGVkVmFsdWU6IHRoaXMuc2VhcmNoVmlld01vZGVsLnNlbGVjdGVkTWFpbEZpZWxkLFxuXHRcdFx0XHRcdHNlbGVjdGlvbkNoYW5nZWRIYW5kbGVyOiAobmV3VmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoVmlld01vZGVsLnNlbGVjdE1haWxGaWVsZChuZXdWYWx1ZSlcblx0XHRcdFx0XHRcdGlmIChyZXN1bHQgPT09IFBhaWRGdW5jdGlvblJlc3VsdC5QYWlkU3Vic2NyaXB0aW9uTmVlZGVkKSB7XG5cdFx0XHRcdFx0XHRcdHNob3dOb3RBdmFpbGFibGVGb3JGcmVlRGlhbG9nKClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGRyb3Bkb3duV2lkdGg6IDI1MCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGF2YWlsYWJsZU1haWxGb2xkZXJzLmxlbmd0aCA+IDBcblx0XHRcdFx0XHQ/IG0oRHJvcERvd25TZWxlY3Rvciwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJtYWlsRm9sZGVyX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdGl0ZW1zOiBhdmFpbGFibGVNYWlsRm9sZGVycyxcblx0XHRcdFx0XHRcdFx0c2VsZWN0ZWRWYWx1ZTogdGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VsZWN0ZWRNYWlsRm9sZGVyWzBdID8/IG51bGwsXG5cdFx0XHRcdFx0XHRcdHNlbGVjdGlvbkNoYW5nZWRIYW5kbGVyOiAobmV3VmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5zZWxlY3RNYWlsRm9sZGVyKG5ld1ZhbHVlID8gW25ld1ZhbHVlXSA6IFtdKVxuXHRcdFx0XHRcdFx0XHRcdGlmIChyZXN1bHQgPT09IFBhaWRGdW5jdGlvblJlc3VsdC5QYWlkU3Vic2NyaXB0aW9uTmVlZGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzaG93Tm90QXZhaWxhYmxlRm9yRnJlZURpYWxvZygpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRkcm9wZG93bldpZHRoOiAyNTAsXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdF0pLFxuXHRcdF0ubWFwKChyb3cpID0+IG0oXCIuZm9sZGVyLXJvdy5wbHItYnV0dG9uLmNvbnRlbnQtZmdcIiwgcm93KSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2FsZW5kYXJGaWx0ZXJTZWN0aW9uKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW3RoaXMucmVuZGVyRGF0ZVJhbmdlU2VsZWN0aW9uKCksIHRoaXMucmVuZGVyQ2FsZW5kYXJGaWx0ZXIoKSwgdGhpcy5yZW5kZXJSZXBlYXRpbmdGaWx0ZXIoKV0ubWFwKChyb3cpID0+XG5cdFx0XHRtKFwiLmZvbGRlci1yb3cucGxyLWJ1dHRvbi5jb250ZW50LWZnXCIsIHJvdyksXG5cdFx0KVxuXHR9XG5cblx0Z2V0Vmlld1NsaWRlcigpOiBWaWV3U2xpZGVyIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMudmlld1NsaWRlclxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJIZWFkZXJSaWdodFZpZXcoKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHJlc3RyaWN0aW9uID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0UmVzdHJpY3Rpb24oKVxuXG5cdFx0aWYgKHN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpKSB7XG5cdFx0XHRpZiAoaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBNYWlsVHlwZVJlZikgJiYgaXNOZXdNYWlsQWN0aW9uQXZhaWxhYmxlKCkpIHtcblx0XHRcdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXdNYWlsRWRpdG9yKClcblx0XHRcdFx0XHRcdFx0LnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLnNob3coKSlcblx0XHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoUGVybWlzc2lvbkVycm9yLCBub09wKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHRpdGxlOiBcIm5ld01haWxfYWN0aW9uXCIsXG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuUGVuY2lsU3F1YXJlLFxuXHRcdFx0XHR9KVxuXHRcdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKHJlc3RyaWN0aW9uLnR5cGUsIENvbnRhY3RUeXBlUmVmKSkge1xuXHRcdFx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdGxvY2F0b3IuY29udGFjdE1vZGVsLmdldENvbnRhY3RMaXN0SWQoKS50aGVuKChjb250YWN0TGlzdElkKSA9PiB7XG5cdFx0XHRcdFx0XHRcdG5ldyBDb250YWN0RWRpdG9yKGxvY2F0b3IuZW50aXR5Q2xpZW50LCBudWxsLCBhc3NlcnROb3ROdWxsKGNvbnRhY3RMaXN0SWQpKS5zaG93KClcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aXRsZTogXCJuZXdDb250YWN0X2FjdGlvblwiLFxuXHRcdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0fSlcblx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBDYWxlbmRhckV2ZW50VHlwZVJlZikpIHtcblx0XHRcdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLmNyZWF0ZU5ld0V2ZW50RGlhbG9nKCksXG5cdFx0XHRcdFx0dGl0bGU6IFwibmV3RXZlbnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuQWRkLFxuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGF0ZVJhbmdlU2VsZWN0aW9uKCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCByZW5kZXJlZEhlbHBUZXh0OiBNYXliZVRyYW5zbGF0aW9uIHwgdW5kZWZpbmVkID1cblx0XHRcdHRoaXMuc2VhcmNoVmlld01vZGVsLndhcm5pbmcgPT09IFwic3RhcnRhZnRlcmVuZFwiXG5cdFx0XHRcdD8gXCJzdGFydEFmdGVyRW5kX2xhYmVsXCJcblx0XHRcdFx0OiB0aGlzLnNlYXJjaFZpZXdNb2RlbC53YXJuaW5nID09PSBcImxvbmdcIlxuXHRcdFx0XHQ/IFwibG9uZ1NlYXJjaFJhbmdlX21zZ1wiXG5cdFx0XHRcdDogdGhpcy5zZWFyY2hWaWV3TW9kZWwuc3RhcnREYXRlID09IG51bGxcblx0XHRcdFx0PyBcInVubGltaXRlZF9sYWJlbFwiXG5cdFx0XHRcdDogdW5kZWZpbmVkXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmNvbFwiLFxuXHRcdFx0bShcblx0XHRcdFx0XCIucGwtcy5mbGV4LWdyb3cuZmxleC1zcGFjZS1iZXR3ZWVuLmZsZXgtY29sdW1uXCIsXG5cdFx0XHRcdG0oRGF0ZVBpY2tlciwge1xuXHRcdFx0XHRcdGRhdGU6IHRoaXMuc2VhcmNoVmlld01vZGVsLnN0YXJ0RGF0ZSA/PyB1bmRlZmluZWQsXG5cdFx0XHRcdFx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlKSA9PiB0aGlzLm9uU3RhcnREYXRlU2VsZWN0ZWQoZGF0ZSksXG5cdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IHRoaXMuc3RhcnRPZlRoZVdlZWtPZmZzZXQsXG5cdFx0XHRcdFx0bGFiZWw6IFwiZGF0ZUZyb21fbGFiZWxcIixcblx0XHRcdFx0XHRudWxsU2VsZWN0aW9uVGV4dDogcmVuZGVyZWRIZWxwVGV4dCxcblx0XHRcdFx0XHRyaWdodEFsaWduRHJvcGRvd246IHRydWUsXG5cdFx0XHRcdH0gc2F0aXNmaWVzIERhdGVQaWNrZXJBdHRycyksXG5cdFx0XHQpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIucGwtcy5mbGV4LWdyb3cuZmxleC1zcGFjZS1iZXR3ZWVuLmZsZXgtY29sdW1uXCIsXG5cdFx0XHRcdG0oRGF0ZVBpY2tlciwge1xuXHRcdFx0XHRcdGRhdGU6IHRoaXMuc2VhcmNoVmlld01vZGVsLmVuZERhdGUsXG5cdFx0XHRcdFx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VsZWN0RW5kRGF0ZShkYXRlKSAhPSBQYWlkRnVuY3Rpb25SZXN1bHQuU3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0XHRzaG93Tm90QXZhaWxhYmxlRm9yRnJlZURpYWxvZygpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdGFydE9mVGhlV2Vla09mZnNldDogdGhpcy5zdGFydE9mVGhlV2Vla09mZnNldCxcblx0XHRcdFx0XHRsYWJlbDogXCJkYXRlVG9fbGFiZWxcIixcblx0XHRcdFx0XHRyaWdodEFsaWduRHJvcGRvd246IHRydWUsXG5cdFx0XHRcdH0gc2F0aXNmaWVzIERhdGVQaWNrZXJBdHRycyksXG5cdFx0XHQpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgb25TdGFydERhdGVTZWxlY3RlZChkYXRlOiBEYXRlKSB7XG5cdFx0aWYgKChhd2FpdCB0aGlzLnNlYXJjaFZpZXdNb2RlbC5zZWxlY3RTdGFydERhdGUoZGF0ZSkpICE9IFBhaWRGdW5jdGlvblJlc3VsdC5TdWNjZXNzKSB7XG5cdFx0XHRzaG93Tm90QXZhaWxhYmxlRm9yRnJlZURpYWxvZygpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjb25maXJtTWFpbFNlYXJjaCgpIHtcblx0XHRyZXR1cm4gRGlhbG9nLmNvbmZpcm0oXCJjb250aW51ZVNlYXJjaE1haWxib3hfbXNnXCIsIFwic2VhcmNoX2xhYmVsXCIpXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IHNob3J0Y3V0cyA9IGxhenlNZW1vaXplZDxSZWFkb25seUFycmF5PFNob3J0Y3V0Pj4oKCkgPT4gW1xuXHRcdC4uLmxpc3RTZWxlY3Rpb25LZXlib2FyZFNob3J0Y3V0cyhNdWx0aXNlbGVjdE1vZGUuRW5hYmxlZCwgKCkgPT4gdGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsKSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuTixcblx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0Y29uc3QgdHlwZSA9IHRoaXMuc2VhcmNoVmlld01vZGVsLnNlYXJjaGVkVHlwZVxuXG5cdFx0XHRcdGlmIChpc1NhbWVUeXBlUmVmKHR5cGUsIE1haWxUeXBlUmVmKSkge1xuXHRcdFx0XHRcdG5ld01haWxFZGl0b3IoKVxuXHRcdFx0XHRcdFx0LnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLnNob3coKSlcblx0XHRcdFx0XHRcdC5jYXRjaChvZkNsYXNzKFBlcm1pc3Npb25FcnJvciwgbm9PcCkpXG5cdFx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZih0eXBlLCBDb250YWN0VHlwZVJlZikpIHtcblx0XHRcdFx0XHRsb2NhdG9yLmNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKCkudGhlbigoY29udGFjdExpc3RJZCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IENvbnRhY3RFZGl0b3IobG9jYXRvci5lbnRpdHlDbGllbnQsIG51bGwsIGFzc2VydE5vdE51bGwoY29udGFjdExpc3RJZCkpLnNob3coKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRlbmFibGVkOiAoKSA9PiBsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCkgJiYgIWxvY2F0b3IubG9naW5zLmlzRW5hYmxlZChGZWF0dXJlVHlwZS5SZXBseU9ubHkpLFxuXHRcdFx0aGVscDogXCJuZXdNYWlsX2FjdGlvblwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkRFTEVURSxcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0ZWQoKSxcblx0XHRcdGhlbHA6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkJBQ0tTUEFDRSxcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0ZWQoKSxcblx0XHRcdGhlbHA6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkEsXG5cdFx0XHRleGVjOiAoKSA9PiB0aGlzLmFyY2hpdmVTZWxlY3RlZCgpLFxuXHRcdFx0aGVscDogXCJhcmNoaXZlX2FjdGlvblwiLFxuXHRcdFx0ZW5hYmxlZDogKCkgPT4gZ2V0Q3VycmVudFNlYXJjaE1vZGUoKSA9PT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5tYWlsLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkksXG5cdFx0XHRleGVjOiAoKSA9PiB0aGlzLm1vdmVTZWxlY3RlZFRvSW5ib3goKSxcblx0XHRcdGhlbHA6IFwibW92ZVRvSW5ib3hfYWN0aW9uXCIsXG5cdFx0XHRlbmFibGVkOiAoKSA9PiBnZXRDdXJyZW50U2VhcmNoTW9kZSgpID09PSBTZWFyY2hDYXRlZ29yeVR5cGVzLm1haWwsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuVixcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMubW92ZSgpLFxuXHRcdFx0aGVscDogXCJtb3ZlX2FjdGlvblwiLFxuXHRcdFx0ZW5hYmxlZDogKCkgPT4gZ2V0Q3VycmVudFNlYXJjaE1vZGUoKSA9PT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5tYWlsLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLlUsXG5cdFx0XHRleGVjOiAoKSA9PiB0aGlzLnRvZ2dsZVVucmVhZFN0YXR1cygpLFxuXHRcdFx0aGVscDogXCJ0b2dnbGVVbnJlYWRfYWN0aW9uXCIsXG5cdFx0XHRlbmFibGVkOiAoKSA9PiBnZXRDdXJyZW50U2VhcmNoTW9kZSgpID09PSBTZWFyY2hDYXRlZ29yeVR5cGVzLm1haWwsXG5cdFx0fSxcblx0XSlcblxuXHRhc3luYyBvbk5ld1VybChhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCByZXF1ZXN0ZWRQYXRoOiBzdHJpbmcpIHtcblx0XHQvLyBjYWxsaW5nIGluaXQgaGVyZSB0b28gYmVjYXVzZSB0aGlzIGlzIGNhbGxlZCB2ZXJ5IGVhcmx5IGluIHRoZSBsaWZlY3ljbGUgYW5kIG9uTmV3VXJsIHdvbid0IHdvcmsgcHJvcGVybHkgaWYgaW5pdCBpcyBjYWxsZWRcblx0XHQvLyBhZnRlcndvcmRzXG5cdFx0YXdhaXQgdGhpcy5zZWFyY2hWaWV3TW9kZWwuaW5pdCgoKSA9PiB0aGlzLmNvbmZpcm1NYWlsU2VhcmNoKCkpXG5cdFx0dGhpcy5zZWFyY2hWaWV3TW9kZWwub25OZXdVcmwoYXJncywgcmVxdWVzdGVkUGF0aClcblx0XHRpZiAoXG5cdFx0XHRpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoVmlld01vZGVsLnNlYXJjaGVkVHlwZSwgTWFpbFR5cGVSZWYpICYmXG5cdFx0XHRzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSAmJlxuXHRcdFx0IWFyZ3MuaWQgJiZcblx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1c2VkQ29sdW1uID09PSB0aGlzLnJlc3VsdERldGFpbHNDb2x1bW5cblx0XHQpIHtcblx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1c1ByZXZpb3VzQ29sdW1uKClcblx0XHR9XG5cdFx0dGhpcy5pbnZhbGlkYXRlQmlydGhkYXlQcmV2aWV3KClcblxuXHRcdC8vIHJlZHJhdyBiZWNhdXNlIGluaXQoKSBpcyBhc3luY1xuXHRcdG0ucmVkcmF3KClcblx0fVxuXG5cdHByaXZhdGUgZ2V0TWFpbkJ1dHRvbih0eXBlUmVmOiBUeXBlUmVmPHVua25vd24+KToge1xuXHRcdGxhYmVsOiBUcmFuc2xhdGlvbktleVxuXHRcdGNsaWNrOiBDbGlja0hhbmRsZXJcblx0fSB8IG51bGwge1xuXHRcdGlmIChzdHlsZXMuaXNVc2luZ0JvdHRvbU5hdmlnYXRpb24oKSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYodHlwZVJlZiwgTWFpbFR5cGVSZWYpICYmIGlzTmV3TWFpbEFjdGlvbkF2YWlsYWJsZSgpKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdG5ld01haWxFZGl0b3IoKVxuXHRcdFx0XHRcdFx0LnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLnNob3coKSlcblx0XHRcdFx0XHRcdC5jYXRjaChvZkNsYXNzKFBlcm1pc3Npb25FcnJvciwgbm9PcCkpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxhYmVsOiBcIm5ld01haWxfYWN0aW9uXCIsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIENvbnRhY3RUeXBlUmVmKSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRsb2NhdG9yLmNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKCkudGhlbigoY29udGFjdExpc3RJZCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IENvbnRhY3RFZGl0b3IobG9jYXRvci5lbnRpdHlDbGllbnQsIG51bGwsIGFzc2VydE5vdE51bGwoY29udGFjdExpc3RJZCkpLnNob3coKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxhYmVsOiBcIm5ld0NvbnRhY3RfYWN0aW9uXCIsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIENhbGVuZGFyRXZlbnRUeXBlUmVmKSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmNyZWF0ZU5ld0V2ZW50RGlhbG9nKClcblx0XHRcdFx0fSxcblx0XHRcdFx0bGFiZWw6IFwibmV3RXZlbnRfYWN0aW9uXCIsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVOZXdFdmVudERpYWxvZygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBkYXRlVG9Vc2UgPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5zdGFydERhdGUgPyBzZXROZXh0SGFsZkhvdXIobmV3IERhdGUodGhpcy5zZWFyY2hWaWV3TW9kZWwuc3RhcnREYXRlKSkgOiBzZXROZXh0SGFsZkhvdXIobmV3IERhdGUoKSlcblxuXHRcdC8vIERpc2FsbG93IGNyZWF0aW9uIG9mIGV2ZW50cyB3aGVuIHRoZXJlIGlzIG5vIGV4aXN0aW5nIGNhbGVuZGFyXG5cdFx0Y29uc3QgbGF6eUNhbGVuZGFySW5mbyA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldExhenlDYWxlbmRhckluZm9zKClcblx0XHRjb25zdCBjYWxlbmRhckluZm9zID0gbGF6eUNhbGVuZGFySW5mby5pc0xvYWRlZCgpID8gbGF6eUNhbGVuZGFySW5mby5nZXRTeW5jKCkgOiBsYXp5Q2FsZW5kYXJJbmZvLmdldEFzeW5jKClcblxuXHRcdGlmIChjYWxlbmRhckluZm9zIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuXHRcdFx0YXdhaXQgc2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgY2FsZW5kYXJJbmZvcylcblx0XHR9XG5cblx0XHRjb25zdCBtYWlsYm94RGV0YWlscyA9IGF3YWl0IGxvY2F0b3IubWFpbGJveE1vZGVsLmdldFVzZXJNYWlsYm94RGV0YWlscygpXG5cdFx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCBsb2NhdG9yLm1haWxib3hNb2RlbC5nZXRNYWlsYm94UHJvcGVydGllcyhtYWlsYm94RGV0YWlscy5tYWlsYm94R3JvdXBSb290KVxuXHRcdGNvbnN0IG1vZGVsID0gYXdhaXQgbG9jYXRvci5jYWxlbmRhckV2ZW50TW9kZWwoQ2FsZW5kYXJPcGVyYXRpb24uQ3JlYXRlLCBnZXRFdmVudFdpdGhEZWZhdWx0VGltZXMoZGF0ZVRvVXNlKSwgbWFpbGJveERldGFpbHMsIG1haWxib3hQcm9wZXJ0aWVzLCBudWxsKVxuXG5cdFx0aWYgKG1vZGVsKSB7XG5cdFx0XHRjb25zdCBldmVudEVkaXRvciA9IG5ldyBFdmVudEVkaXRvckRpYWxvZygpXG5cdFx0XHRhd2FpdCBldmVudEVkaXRvci5zaG93TmV3Q2FsZW5kYXJFdmVudEVkaXREaWFsb2cobW9kZWwpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhcmNoaXZlU2VsZWN0ZWQoKTogdm9pZCB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWRNYWlscyA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkTWFpbHMoKVxuXG5cdFx0aWYgKHNlbGVjdGVkTWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0aWYgKHNlbGVjdGVkTWFpbHMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHR0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHR9XG5cblx0XHRcdGFyY2hpdmVNYWlscyhzZWxlY3RlZE1haWxzKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgbW92ZVNlbGVjdGVkVG9JbmJveCgpOiB2b2lkIHtcblx0XHRjb25zdCBzZWxlY3RlZE1haWxzID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRNYWlscygpXG5cblx0XHRpZiAoc2VsZWN0ZWRNYWlscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRpZiAoc2VsZWN0ZWRNYWlscy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbC5zZWxlY3ROb25lKClcblx0XHRcdH1cblxuXHRcdFx0bW92ZVRvSW5ib3goc2VsZWN0ZWRNYWlscylcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIG1vdmUoKSB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWRNYWlscyA9IHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFNlbGVjdGVkTWFpbHMoKVxuXG5cdFx0aWYgKHNlbGVjdGVkTWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0c2hvd01vdmVNYWlsc0Ryb3Bkb3duKGxvY2F0b3IubWFpbGJveE1vZGVsLCBtYWlsTG9jYXRvci5tYWlsTW9kZWwsIGdldE1vdmVNYWlsQm91bmRzKCksIHNlbGVjdGVkTWFpbHMsIHtcblx0XHRcdFx0b25TZWxlY3RlZDogKCkgPT4ge1xuXHRcdFx0XHRcdGlmIChzZWxlY3RlZE1haWxzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0XHRcdHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbC5zZWxlY3ROb25lKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdG9nZ2xlVW5yZWFkU3RhdHVzKCk6IHZvaWQge1xuXHRcdGxldCBzZWxlY3RlZE1haWxzID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRNYWlscygpXG5cblx0XHRpZiAoc2VsZWN0ZWRNYWlscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRtYWlsTG9jYXRvci5tYWlsTW9kZWwubWFya01haWxzKHNlbGVjdGVkTWFpbHMsICFzZWxlY3RlZE1haWxzWzBdLnVucmVhZClcblx0XHR9XG5cdH1cblxuXHQvLyByZXR1cm4gdmFsdWU6IGZhbHNlIG1lYW5zIGl0IGhhcyBiZWVuIGhhbmRsZWRcblx0cHJpdmF0ZSBkZWxldGVTZWxlY3RlZCgpOiBib29sZWFuIHtcblx0XHRpZiAodGhpcy5zZWFyY2hWaWV3TW9kZWwubGlzdE1vZGVsLnN0YXRlLnNlbGVjdGVkSXRlbXMuc2l6ZSA+IDApIHtcblx0XHRcdGlmIChpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoVmlld01vZGVsLnNlYXJjaGVkVHlwZSwgTWFpbFR5cGVSZWYpKSB7XG5cdFx0XHRcdGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRNYWlscygpXG5cdFx0XHRcdHNob3dEZWxldGVDb25maXJtYXRpb25EaWFsb2coc2VsZWN0ZWQpLnRoZW4oKGNvbmZpcm1lZCkgPT4ge1xuXHRcdFx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0XHRcdGlmIChzZWxlY3RlZC5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdFx0XHRcdC8vIGlzIG5lZWRlZCBmb3IgY29ycmVjdCBzZWxlY3Rpb24gYmVoYXZpb3Igb24gbW9iaWxlXG5cdFx0XHRcdFx0XHRcdHRoaXMuc2VhcmNoVmlld01vZGVsLmxpc3RNb2RlbC5zZWxlY3ROb25lKClcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bWFpbExvY2F0b3IubWFpbE1vZGVsLmRlbGV0ZU1haWxzKHNlbGVjdGVkKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYodGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VhcmNoZWRUeXBlLCBDb250YWN0VHlwZVJlZikpIHtcblx0XHRcdFx0RGlhbG9nLmNvbmZpcm0oXCJkZWxldGVDb250YWN0c19tc2dcIikudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RzKClcblx0XHRcdFx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2VsZWN0ZWQubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRcdFx0XHQvLyBpcyBuZWVkZWQgZm9yIGNvcnJlY3Qgc2VsZWN0aW9uIGJlaGF2aW9yIG9uIG1vYmlsZVxuXHRcdFx0XHRcdFx0XHR0aGlzLnNlYXJjaFZpZXdNb2RlbC5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGZvciAoY29uc3QgY29udGFjdCBvZiBzZWxlY3RlZCkge1xuXHRcdFx0XHRcdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudC5lcmFzZShjb250YWN0KS5jYXRjaChcblx0XHRcdFx0XHRcdFx0XHRvZkNsYXNzKE5vdEZvdW5kRXJyb3IsIChfKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBpZ25vcmUgYmVjYXVzZSB0aGUgZGVsZXRlIGtleSBzaG9ydGN1dCBtYXkgYmUgZXhlY3V0ZWQgYWdhaW4gd2hpbGUgdGhlIGNvbnRhY3QgaXMgYWxyZWFkeSBkZWxldGVkXG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJGaWx0ZXJCdXR0b24oKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKE1haWxGaWx0ZXJCdXR0b24sIHtcblx0XHRcdGZpbHRlcjogdGhpcy5zZWFyY2hWaWV3TW9kZWwubWFpbEZpbHRlcixcblx0XHRcdHNldEZpbHRlcjogKGZpbHRlcikgPT4gdGhpcy5zZWFyY2hWaWV3TW9kZWwuc2V0TWFpbEZpbHRlcihmaWx0ZXIpLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNhbGVuZGFyRmlsdGVyKCk6IENoaWxkcmVuIHtcblx0XHRpZiAodGhpcy5zZWFyY2hWaWV3TW9kZWwuZ2V0TGF6eUNhbGVuZGFySW5mb3MoKS5pc0xvYWRlZCgpICYmIHRoaXMuc2VhcmNoVmlld01vZGVsLmdldFVzZXJIYXNOZXdQYWlkUGxhbigpLmlzTG9hZGVkKCkpIHtcblx0XHRcdGNvbnN0IGNhbGVuZGFySW5mb3MgPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRMYXp5Q2FsZW5kYXJJbmZvcygpLmdldFN5bmMoKSA/PyBbXVxuXG5cdFx0XHQvLyBMb2FkIHVzZXIncyBjYWxlbmRhciBsaXN0XG5cdFx0XHRjb25zdCBpdGVtczoge1xuXHRcdFx0XHRuYW1lOiBzdHJpbmdcblx0XHRcdFx0dmFsdWU6IENhbGVuZGFySW5mbyB8IHN0cmluZ1xuXHRcdFx0fVtdID0gQXJyYXkuZnJvbShjYWxlbmRhckluZm9zLnZhbHVlcygpKS5tYXAoKGNpKSA9PiAoe1xuXHRcdFx0XHRuYW1lOiBnZXRTaGFyZWRHcm91cE5hbWUoY2kuZ3JvdXBJbmZvLCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCB0cnVlKSxcblx0XHRcdFx0dmFsdWU6IGNpLFxuXHRcdFx0fSkpXG5cblx0XHRcdGlmICh0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRVc2VySGFzTmV3UGFpZFBsYW4oKS5nZXRTeW5jKCkpIHtcblx0XHRcdFx0Y29uc3QgbG9jYWxDYWxlbmRhcnMgPSB0aGlzLnNlYXJjaFZpZXdNb2RlbC5nZXRMb2NhbENhbGVuZGFycygpLm1hcCgoY2FsKSA9PiAoe1xuXHRcdFx0XHRcdG5hbWU6IGNhbC5uYW1lLFxuXHRcdFx0XHRcdHZhbHVlOiBjYWwuaWQsXG5cdFx0XHRcdH0pKVxuXG5cdFx0XHRcdGl0ZW1zLnB1c2goLi4ubG9jYWxDYWxlbmRhcnMpXG5cdFx0XHR9XG5cblx0XHRcdC8vIEZpbmQgdGhlIHNlbGVjdGVkIHZhbHVlIGFmdGVyIGxvYWRpbmcgdGhlIGF2YWlsYWJsZSBjYWxlbmRhcnNcblx0XHRcdGNvbnN0IHNlbGVjdGVkVmFsdWUgPVxuXHRcdFx0XHRpdGVtcy5maW5kKChjYWxlbmRhcikgPT4ge1xuXHRcdFx0XHRcdGlmICghY2FsZW5kYXIudmFsdWUpIHtcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsZW5kYXIudmFsdWUgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0XHRcdHJldHVybiBjYWxlbmRhci52YWx1ZSA9PT0gdGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VsZWN0ZWRDYWxlbmRhclxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIEl0IGlzbid0IGEgc3RyaW5nLCBzbyBpdCBjYW4gYmUgb25seSBhIENhbGVuZGFyIEluZm9cblx0XHRcdFx0XHRjb25zdCBjYWxlbmRhclZhbHVlID0gY2FsZW5kYXIudmFsdWVcblx0XHRcdFx0XHRyZXR1cm4gaXNTYW1lSWQoW2NhbGVuZGFyVmFsdWUuZ3JvdXBSb290LmxvbmdFdmVudHMsIGNhbGVuZGFyVmFsdWUuZ3JvdXBSb290LnNob3J0RXZlbnRzXSwgdGhpcy5zZWFyY2hWaWV3TW9kZWwuc2VsZWN0ZWRDYWxlbmRhcilcblx0XHRcdFx0fSk/LnZhbHVlID8/IG51bGxcblxuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFwiLm1sLWJ1dHRvblwiLFxuXHRcdFx0XHRtKERyb3BEb3duU2VsZWN0b3IsIHtcblx0XHRcdFx0XHRsYWJlbDogXCJjYWxlbmRhcl9sYWJlbFwiLFxuXHRcdFx0XHRcdGl0ZW1zOiBbeyBuYW1lOiBsYW5nLmdldChcImFsbF9sYWJlbFwiKSwgdmFsdWU6IG51bGwgfSwgLi4uaXRlbXNdLFxuXHRcdFx0XHRcdHNlbGVjdGVkVmFsdWUsXG5cdFx0XHRcdFx0c2VsZWN0aW9uQ2hhbmdlZEhhbmRsZXI6ICh2YWx1ZTogQ2FsZW5kYXJJbmZvIHwgbnVsbCkgPT4ge1xuXHRcdFx0XHRcdFx0Ly8gdmFsdWUgY2FuIGJlIG51bGwgaWYgZGVmYXVsdCBvcHRpb24gaGFzIGJlZW4gc2VsZWN0ZWRcblx0XHRcdFx0XHRcdHRoaXMuc2VhcmNoVmlld01vZGVsLnNlbGVjdENhbGVuZGFyKHZhbHVlKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0gc2F0aXNmaWVzIERyb3BEb3duU2VsZWN0b3JBdHRyczxDYWxlbmRhckluZm8gfCBzdHJpbmcgfCBudWxsPiksXG5cdFx0XHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJSZXBlYXRpbmdGaWx0ZXIoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIubWxyLWJ1dHRvblwiLFxuXHRcdFx0bShDaGVja2JveCwge1xuXHRcdFx0XHRsYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJpbmNsdWRlUmVwZWF0aW5nRXZlbnRzX2FjdGlvblwiKSxcblx0XHRcdFx0Y2hlY2tlZDogdGhpcy5zZWFyY2hWaWV3TW9kZWwuaW5jbHVkZVJlcGVhdGluZ0V2ZW50cyxcblx0XHRcdFx0b25DaGVja2VkOiAodmFsdWU6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0XHR0aGlzLnNlYXJjaFZpZXdNb2RlbC5zZWxlY3RJbmNsdWRlUmVwZWF0aW5nRXZlbnRzKHZhbHVlKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSBzYXRpc2ZpZXMgQ2hlY2tib3hBdHRycyksXG5cdFx0KVxuXHR9XG59XG5cbmZ1bmN0aW9uIGdldEN1cnJlbnRTZWFyY2hNb2RlKCk6IFNlYXJjaENhdGVnb3J5VHlwZXMge1xuXHRjb25zdCByb3V0ZSA9IG0ucm91dGUuZ2V0KClcblx0aWYgKHJvdXRlLnN0YXJ0c1dpdGgoXCIvc2VhcmNoL2NvbnRhY3RcIikpIHtcblx0XHRyZXR1cm4gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5jb250YWN0XG5cdH0gZWxzZSBpZiAocm91dGUuc3RhcnRzV2l0aChcIi9zZWFyY2gvY2FsZW5kYXJcIikpIHtcblx0XHRyZXR1cm4gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5jYWxlbmRhclxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBTZWFyY2hDYXRlZ29yeVR5cGVzLm1haWxcblx0fVxufVxuXG5hc3luYyBmdW5jdGlvbiBuZXdNYWlsRWRpdG9yKCk6IFByb21pc2U8RGlhbG9nPiB7XG5cdGNvbnN0IFttYWlsYm94RGV0YWlscywgeyBuZXdNYWlsRWRpdG9yIH1dID0gYXdhaXQgUHJvbWlzZS5hbGwoW2xvY2F0b3IubWFpbGJveE1vZGVsLmdldFVzZXJNYWlsYm94RGV0YWlscygpLCBpbXBvcnQoXCIuLi8uLi9tYWlsL2VkaXRvci9NYWlsRWRpdG9yXCIpXSlcblx0cmV0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