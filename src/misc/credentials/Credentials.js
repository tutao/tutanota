// @flow

import type {Base64, Base64Url} from "@tutao/tutanota-utils"

/** Data obtained after logging in. */
export type Credentials = {
	/**
	 * Identifier which we use for logging in.
	 * Email address used to log in for internal users, userId for external users.
	 * */
	login: string,
	/** Session#accessKey encrypted password. Is set when session is persisted. */
	encryptedPassword: ?Base64,
	accessToken: Base64Url,
	userId: Id,
	type: "internal" | "external",
}