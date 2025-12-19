#[allow(dead_code)] // TODO decide where to call it
pub fn set_panic_hook() {
	// When the `console_error_panic_hook` feature is enabled, we can call the
	// `set_panic_hook` function at least once during initialization, and then
	// we will get better error messages if our code ever panics.
	//
	// For more details see
	// https://github.com/rustwasm/console_error_panic_hook#readme
	#[cfg(feature = "console_error_panic_hook")]
	console_error_panic_hook::set_once();
}

/// Converts a slice into a fixed size array.
///
/// If the size of the slice does not match, it will return an `Err`.
pub fn array_cast_slice<T: Copy + Clone, const SIZE: usize>(
	from: &[T],
	type_name: &'static str,
) -> Result<[T; SIZE], ArrayCastingError> {
	match <[T; SIZE]>::try_from(from) {
		Ok(n) => Ok(n),
		Err(_) => Err(ArrayCastingError {
			type_name,
			actual_size: from.len(),
		}),
	}
}

/// Denotes a failure to convert a slice of size `actual_size` into a newtype `type_name`
/// containing a fixed size array
#[derive(thiserror::Error, Debug)]
#[error("Incorrect {type_name} size: {actual_size}")]
pub struct ArrayCastingError {
	pub type_name: &'static str,
	pub actual_size: usize,
}

/// Cast the array into an array of a fixed size.
///
/// If the size is the same, it will be re-returned. Otherwise, returns `Err`.
///
/// This is used to prove to the compiler that the size is correct, and will generally be optimized
/// by the compiler to have no runtime cost in release builds.
pub fn array_cast_size<const SIZE: usize, const ARR_SIZE: usize>(
	arr: [u8; ARR_SIZE],
	type_name: &'static str,
) -> Result<[u8; SIZE], ArrayCastingError> {
	if arr.len() == SIZE {
		let mut result: [u8; SIZE] = [0; SIZE];
		result.copy_from_slice(&arr);
		Ok(result)
	} else {
		Err(ArrayCastingError {
			type_name,
			actual_size: ARR_SIZE,
		})
	}
}

/// Combine multiple slices into one Vec.
///
/// Each slice must have the same object type, and the object must implement Copy. This makes it suitable for byte arrays.
#[macro_export]
macro_rules! join_slices {
    ($($slices:expr), +) => {{
        // Get the length upfront so we only allocate exactly once
        let mut length = 0usize;
        $(length += ($slices).len();)*
        let mut v = Vec::with_capacity(length);

        // Append all slices now.
        $(v.extend_from_slice($slices);)*

        v
    }}
}
