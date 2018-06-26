import {Bubble} from "../src/gui/base/BubbleTextField"
import {ViewColumn as _ViewColumn} from "../src/gui/base/ViewColumn"
import {TypeRef} from "../src/api/common/EntityFunctions"
import type {OperationTypeEnum} from "../src/api/common/TutanotaConstants"

/**
 * The BubbleInputField delegates certain tasks like retrieving suggestions and creating bubbles
 * to the BubbleHandler.
 */
interface BubbleHandler<T, S:Suggestion> {
	/**
	 * @param text The text to filter for.
	 * @return A list of suggestions.
	 */
	getSuggestions(text: string):Promise<S[]>;

	/**
	 * Creates a new bubble for a suggestion.
	 * @param suggestion The suggestion.
	 * @return Returns the new bubble or null if none could be created.
	 */
	createBubbleFromSuggestion(suggestion: S):Bubble<T>;

	/**
	 * Creates a new bubble from the provided text.
	 * @param text
	 * @return Returns the new bubble or null if none could be created.
	 */
	createBubblesFromText(text: string):Bubble<T>[];

	/**
	 * Notifies the BubbleHandler that the given bubble was deleted.
	 * @param bubble The bubble that was deleted.
	 */
	bubbleDeleted(bubble: Bubble<T>):void;

	/**
	 * Height of a suggestion in pixels
	 */
		suggestionHeight: number;
}

/**
 * Suggestions are provided to the user whenever he writes text to the input field.
 */
interface Suggestion {
	view: Function;
	selected: boolean;
}

interface IViewSlider {
	focusedColumn:_ViewColumn;
	isFocusPreviousPossible():boolean;
	getPreviousColumn():?_ViewColumn;
	focusPreviousColumn():void;
}

interface IUserController {
	user: User;
	userGroupInfo: GroupInfo;
	props: TutanotaProperties;
	sessionId: IdTuple;
	accessToken: string;
	isGlobalAdmin():boolean;
	isGlobalOrLocalAdmin():boolean;
	isFreeAccount(): boolean;
	isPremiumAccount(): boolean;
	isOutlookAccount(): boolean;
	isInternalUser(): boolean;
	loadCustomer(): Promise<Customer>;
	getMailGroupMemberships(): GroupMembership[];
	getUserMailGroupMembership(): GroupMembership;
	getLocalAdminGroupMemberships():GroupMembership[];
	entityEventReceived(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum):Promise<void>;
	deleteSession(sync: boolean):Promise<void>;
}

interface ILoginViewController {
	formLogin():void;
	autologin(credentials: Credentials):Promise<IUserController>;
	deleteCredentialsNotLoggedIn(credentials: Credentials):Promise<void>;
	migrateDeviceConfig(oldCredentials: Object[]):Promise<void>;
}