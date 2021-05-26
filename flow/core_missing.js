// @flow

/**
 * Declarations of browser APIs that aren't declared by flow
 */

/** DOMException that can be thrown by the browser
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMException/DOMException
 *
 * flow doesn't declare it for some reason
 */
declare class DOMException {

	constructor(message?: string, name?: string): DOMException;

	+message: string;

	// possible name values:
	// https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names
	+name: "SecurityError";

	/** @deprecated use {@code DOMException.name} instead */
	+code: number;

	// Legacy constants for values of DOMException.code
	+ABORT_ERR: number;
	+DATA_CLONE_ERR: number;
	+DOMSTRING_SIZE_ERR: number;
	+HIERARCHY_REQUEST_ERR: number;
	+INDEX_SIZE_ERR: number;
	+INUSE_ATTRIBUTE_ERR: number;
	+INVALID_ACCESS_ERR: number;
	+INVALID_CHARACTER_ERR: number;
	+INVALID_MODIFICATION_ERR: number;
	+INVALID_NODE_TYPE_ERR: number;
	+INVALID_STATE_ERR: number;
	+NAMESPACE_ERR: number;
	+NETWORK_ERR: number;
	+NOT_FOUND_ERR: number;
	+NOT_SUPPORTED_ERR: number;
	+NO_DATA_ALLOWED_ERR: number;
	+NO_MODIFICATION_ALLOWED_ERR: number;
	+QUOTA_EXCEEDED_ERR: number;
	+SECURITY_ERR: number;
	+SYNTAX_ERR: number;
	+TIMEOUT_ERR: number;
	+TYPE_MISMATCH_ERR: number;
	+URL_MISMATCH_ERR: number;
	+VALIDATION_ERR: number;
	+WRONG_DOCUMENT_ERR: number;
}

