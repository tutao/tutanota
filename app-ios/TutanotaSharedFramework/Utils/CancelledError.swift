public class CancelledError: TutanotaError {
	public override init(message: String, underlyingError: Error?) { super.init(message: message, underlyingError: underlyingError) }

	public override var name: String { get { "de.tutao.tutashared.CancelledError" } }
}
