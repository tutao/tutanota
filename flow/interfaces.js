import {ViewColumn as _ViewColumn} from "../src/gui/base/ViewColumn"
import type {EntityUpdateData} from "../src/api/main/EntityEventController"


interface IViewSlider {
	focusedColumn: _ViewColumn;

	isFocusPreviousPossible(): boolean;

	getPreviousColumn(): ?_ViewColumn;

	focusPreviousColumn(): void;
}

interface IUserController {
	user: User;
	userGroupInfo: GroupInfo;
	props: TutanotaProperties;
	sessionId: IdTuple;
	accessToken: string;

	isGlobalAdmin(): boolean;

	isGlobalOrLocalAdmin(): boolean;

	isFreeAccount(): boolean;

	isPremiumAccount(): boolean;

	isOutlookAccount(): boolean;

	isInternalUser(): boolean;

	loadCustomer(): Promise<Customer>;

	getMailGroupMemberships(): GroupMembership[];

	getUserMailGroupMembership(): GroupMembership;

	getLocalAdminGroupMemberships(): GroupMembership[];

	entityEventsReceived($ReadOnlyArray<EntityUpdateData>): Promise<void>;

	deleteSession(sync: boolean): Promise<void>;
}

interface ILoginViewController {
	formLogin(): void;

	autologin(credentials: Credentials): void;

	deleteCredentialsNotLoggedIn(credentials: Credentials): Promise<void>;

	migrateDeviceConfig(oldCredentials: Object[]): Promise<void>;

	recoverLogin(emailAddress: string, recoverCode: string, newPassword: string): Promise<void>;

	resetSecondFactors(mailAddress: string, password: string, recoverCode: string): Promise<void>;
}