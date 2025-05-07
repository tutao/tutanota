/**
 * Split the query into tokens.
 * @param query query to split
 * @returns tokens
 */
public func signalTokenize(_ query: String) -> [String] {
	let tokens = query.withCString(signal_tokenize)

	var tokens_cstrs = signal_tokenize_from_ptr(tokens)!
	var strings = [String]()

	// copy C strings until we hit a null pointer
	while let string = tokens_cstrs.pointee {
		strings.append(String(cString: string))
		tokens_cstrs = tokens_cstrs.advanced(by: 1)
	}

	signal_tokenize_free(tokens)

	return strings
}
