import { TutanotaError } from "./dist-chunk.js";

//#region src/common/api/common/error/DbError.ts
var DbError = class extends TutanotaError {
	error;
	/**
	* A db error is thrown from indexeddb
	* @param message An information about the exception.
	* @param error The original error that was thrown.
	*/
	constructor(message, error) {
		super("DbError", error ? message + `: ${error.name}, ${error.message}> ` + (error.stack ? error.stack : error.message) : message);
		this.error = error ?? null;
	}
};

//#endregion
export { DbError };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGJFcnJvci1jaHVuay5qcyIsIm5hbWVzIjpbIm1lc3NhZ2U6IHN0cmluZyIsImVycm9yPzogRXJyb3IiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2FwaS9jb21tb24vZXJyb3IvRGJFcnJvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvL0BidW5kbGVJbnRvOmNvbW1vbi1taW5cblxuaW1wb3J0IHsgVHV0YW5vdGFFcnJvciB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtZXJyb3JcIlxuXG5leHBvcnQgY2xhc3MgRGJFcnJvciBleHRlbmRzIFR1dGFub3RhRXJyb3Ige1xuXHRlcnJvcjogRXJyb3IgfCBudWxsXG5cblx0LyoqXG5cdCAqIEEgZGIgZXJyb3IgaXMgdGhyb3duIGZyb20gaW5kZXhlZGRiXG5cdCAqIEBwYXJhbSBtZXNzYWdlIEFuIGluZm9ybWF0aW9uIGFib3V0IHRoZSBleGNlcHRpb24uXG5cdCAqIEBwYXJhbSBlcnJvciBUaGUgb3JpZ2luYWwgZXJyb3IgdGhhdCB3YXMgdGhyb3duLlxuXHQgKi9cblx0Y29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBlcnJvcj86IEVycm9yKSB7XG5cdFx0c3VwZXIoXCJEYkVycm9yXCIsIGVycm9yID8gbWVzc2FnZSArIGA6ICR7ZXJyb3IubmFtZX0sICR7ZXJyb3IubWVzc2FnZX0+IGAgKyAoZXJyb3Iuc3RhY2sgPyBlcnJvci5zdGFjayA6IGVycm9yLm1lc3NhZ2UpIDogbWVzc2FnZSlcblx0XHR0aGlzLmVycm9yID0gZXJyb3IgPz8gbnVsbFxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7OztJQUlhLFVBQU4sY0FBc0IsY0FBYztDQUMxQzs7Ozs7O0NBT0EsWUFBWUEsU0FBaUJDLE9BQWU7QUFDM0MsUUFBTSxXQUFXLFFBQVEsV0FBVyxJQUFJLE1BQU0sS0FBSyxJQUFJLE1BQU0sUUFBUSxPQUFPLE1BQU0sUUFBUSxNQUFNLFFBQVEsTUFBTSxXQUFXLFFBQVE7QUFDakksT0FBSyxRQUFRLFNBQVM7Q0FDdEI7QUFDRCJ9