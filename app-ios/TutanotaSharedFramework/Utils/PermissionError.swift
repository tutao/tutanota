/// Thrown when we are unable to perform an action due to insufficient permissions, such as if the user denies permission to the app.
public class PermissionError: TutanotaError {
	override init(message: String, underlyingError: Error?) { super.init(message: message, underlyingError: underlyingError) }

	init(message: String) { super.init(message: message, underlyingError: nil) }

	public override var name: String { get { "de.tutao.tutanota.PermissionError" } }
}
