import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import "./dist2-chunk.js";
import "./ParserCombinator-chunk.js";
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
import "./MessageDispatcher-chunk.js";
import { exposeRemote } from "./WorkerProxy-chunk.js";

//#region src/common/api/common/ExposeNativeInterface.ts
function exposeNativeInterface(native) {
	return exposeRemote((request) => native.invokeNative(request.requestType, request.args));
}

//#endregion
export { exposeNativeInterface };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXhwb3NlTmF0aXZlSW50ZXJmYWNlLWNodW5rLmpzIiwibmFtZXMiOlsibmF0aXZlOiBOYXRpdmVJbnRlcmZhY2UiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2FwaS9jb21tb24vRXhwb3NlTmF0aXZlSW50ZXJmYWNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cG9zZVJlbW90ZSB9IGZyb20gXCIuL1dvcmtlclByb3h5LmpzXCJcbmltcG9ydCB0eXBlIHsgRXhwb3NlZE5hdGl2ZUludGVyZmFjZSwgTmF0aXZlSW50ZXJmYWNlIH0gZnJvbSBcIi4uLy4uL25hdGl2ZS9jb21tb24vTmF0aXZlSW50ZXJmYWNlLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9zZU5hdGl2ZUludGVyZmFjZShuYXRpdmU6IE5hdGl2ZUludGVyZmFjZSk6IEV4cG9zZWROYXRpdmVJbnRlcmZhY2Uge1xuXHRyZXR1cm4gZXhwb3NlUmVtb3RlKChyZXF1ZXN0KSA9PiBuYXRpdmUuaW52b2tlTmF0aXZlKHJlcXVlc3QucmVxdWVzdFR5cGUsIHJlcXVlc3QuYXJncykpXG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdPLFNBQVMsc0JBQXNCQSxRQUFpRDtBQUN0RixRQUFPLGFBQWEsQ0FBQyxZQUFZLE9BQU8sYUFBYSxRQUFRLGFBQWEsUUFBUSxLQUFLLENBQUM7QUFDeEYifQ==