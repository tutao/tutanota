public func neverNull<T>(_ obj: Nullable<T>) -> T {
  if obj == nil {
    console.trace("Called neverNull with a null value")
  }

  return obj!
}
/// returns its argument if it is not null, throws otherwise.
/// @param value the value to check
/// @param message optional error message
public func assertNotNull<T>(_ value: Nullable<T>, message: SwString = SwString("null")) throws -> T
{
  if let value {
    return value
  }
  throw ProgrammingError(SwString("AssertNotNull failed: " + message.asPrimitiveString()))
}

public func assertNotNaN(
  _ number: SwDouble, message: SwString = SwString("Found NaN when valid number is expected")
) throws -> SwDouble {
  if number.asPrimitive().isNaN {
    throw ProgrammingError(message)
  }
  return number
}

/// throws if the value is not null.
/// @param value the value to check
/// @param message optional error message
public func assertNull<T>(_ value: Nullable<T>, message: SwString = SwString("not null")) throws {
  if isNotNull(value) {
    throw TutanotaError(
      SwString("Error"), SwString("AssertNull failed : " + message.asPrimitiveString()))
  }
}

public func isNotNull<T>(_ t: Nullable<T>) -> Bool {
  return t != nil
}

public func isNull<T>(_ t: Nullable<T>) -> Bool {
  return t == nil
}

public func assert(_ assertion: Bool, _ message: SwString) throws {
  if !assertion {
    throw TutanotaError(
      SwString("Error"), SwString("Assertion failed: " + message.asPrimitiveString()))
  }
}

public func downcast<R>(_ object: Any) -> R {
  return object as! R
}
