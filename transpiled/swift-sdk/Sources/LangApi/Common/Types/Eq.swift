/// * For primitive JavascriptType ( string, number, boolean, BigInt ) and Structs
public protocol EquitableIsStructural: Equatable {
}

/**
* All non-primitive type where === should behave as identity,
* default implementation is to compare the pointer of two object
*/
// FIXME:
// Ideally this protocol can be removed as we should not be comparing any non-primitive type with === in typescript,
// we should have used function like deepEquals or manual implementation for that ts class
public protocol EquitableIsIdentity: Equatable, AnyObject {
  static func == (lhs: Self, rhs: Self) -> Bool
}
extension EquitableIsIdentity {
  public static func == (lhs: Self, rhs: Self) -> Bool {
    return lhs === rhs
  }
}
