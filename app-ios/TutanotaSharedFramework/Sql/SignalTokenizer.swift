/**
 * High-level Swift wrapper over the `signal_tokenizer` tokenizer.
 */
public class SignalTokenizer {
	private var signalTokenizerHandle: UnsafeMutableRawPointer

	// These signatures must be kept in sync!
	private var signalTokenize: @convention(c) (UnsafePointer<Int8>) -> UnsafeMutableRawPointer
	private var signalTokenizeFromPtr: @convention(c) (UnsafeRawPointer) -> UnsafeMutablePointer<UnsafePointer<Int8>?>
	private var signalTokenizeFree: @convention(c) (UnsafeMutableRawPointer) -> Void

	public init() throws {
		guard let signalTokenizerHandle = dlopen("libsignal_tokenizer.dylib", RTLD_NOW) else { throw TUTErrorFactory.createError("Failed to load libsignal_tokenizer.dylib") }

		guard let signalTokenizeAddr = dlsym(signalTokenizerHandle, "signal_tokenize") else {
			throw TUTErrorFactory.createError("Failed to resolve signal_tokenize from libsignal_tokenizer.dylib")
		}
		guard let signalTokenizeFromPtrAddr = dlsym(signalTokenizerHandle, "signal_tokenize_from_ptr") else {
			throw TUTErrorFactory.createError("Failed to resolve signal_tokenize_from_ptr from libsignal_tokenizer.dylib")
		}
		guard let signalTokenizeFreeAddr = dlsym(signalTokenizerHandle, "signal_tokenize_free") else {
			throw TUTErrorFactory.createError("Failed to resolve signal_tokenize_free from libsignal_tokenizer.dylib")
		}

		signalTokenize = unsafeBitCast(signalTokenizeAddr, to: type(of: signalTokenize))
		signalTokenizeFromPtr = unsafeBitCast(signalTokenizeFromPtrAddr, to: type(of: signalTokenizeFromPtr))
		signalTokenizeFree = unsafeBitCast(signalTokenizeFreeAddr, to: type(of: signalTokenizeFree))

		self.signalTokenizerHandle = signalTokenizerHandle
	}

	/**
	 * Split the query into tokens.
	 * @param query query to split
	 * @returns tokens
	 */
	public func tokenize(_ query: String) -> [String] {
		let tokens = query.withCString(signalTokenize)

		var tokens_cstrs = signalTokenizeFromPtr(tokens)
		var strings = [String]()

		// copy C strings until we hit a null pointer
		while let string = tokens_cstrs.pointee {
			strings.append(String(cString: string))
			tokens_cstrs = tokens_cstrs.advanced(by: 1)
		}

		signalTokenizeFree(tokens)

		return strings
	}

	deinit { dlclose(signalTokenizerHandle) }
}
