#[cfg(test)]
pub mod test_utils;
pub mod entity_test_utils;

pub struct Versioned<T> {
    pub object: T,
    pub version: i64
}

impl<T> Clone for Versioned<T> where T: Clone {
    fn clone(&self) -> Self {
        Versioned { object: self.object.clone(), version: self.version }
    }
}

impl<T> Versioned<T> {
    pub fn new(object: T, version: i64) -> Versioned<T> {
        Versioned {
            object,
            version
        }
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

/// Error occurred from [`decode_byte_arrays`] and [`encode_byte_arrays].
#[derive(thiserror::Error, Debug)]
#[error("Byte array error: {reason}")]
pub struct ByteArrayError {
    reason: String,
}

/// Decode the encoded byte arrays.
///
/// We encode multiple byte arrays into one by prefixing each byte array with the length as a 16-bit integer (in big endian byte order).
///
/// Returns `Err` if this is invalid.
pub fn decode_byte_arrays<const SIZE: usize>(arrays: &[u8]) -> Result<[&[u8]; SIZE], ByteArrayError> {
    let mut result = [[0u8; 0].as_slice(); SIZE];
    let mut remaining = arrays;

    for i in 0..SIZE {
        if remaining.len() < 2 {
            return Err(ByteArrayError { reason: format!("expected more byte arrays (only got {i}, expected {SIZE})") });
        }
        let (len_bytes, after) = remaining.split_at(2);

        let length = u16::from_be_bytes(len_bytes.try_into().unwrap()) as usize;
        if after.len() < length {
            return Err(ByteArrayError { reason: format!("invalid encoded byte arrays (size {length} is too large)") });
        }
        let (arr, new_remaining) = after.split_at(length);

        result[i] = arr;
        remaining = new_remaining;
    }

    if !remaining.is_empty() {
        return Err(ByteArrayError { reason: format!("extraneous {} byte(s) detected - incorrect size?", remaining.len()) });
    }

    Ok(result)
}

/// Encode the byte arrays into one.
///
/// We encode multiple byte arrays into one by prefixing each byte array with the length as a 16-bit integer (in big endian byte order).
///
/// Returns `Err` if anything is bigger than a 16-bit integer.
pub fn encode_byte_arrays<const SIZE: usize>(arrays: &[&[u8]; SIZE]) -> Result<Vec<u8>, ByteArrayError> {
    let mut expected_size = 0usize;
    for &i in arrays {
        let len = i.len();
        if len > u16::MAX as usize {
            return Err(ByteArrayError { reason: format!("byte array length {len} exceeds 16-bit limit") });
        }
        expected_size += 2 + i.len();
    }

    let mut v = Vec::with_capacity(expected_size);
    for &i in arrays {
        v.extend_from_slice(&(i.len() as u16).to_be_bytes());
        v.extend_from_slice(i);
    }

    Ok(v)
}


/// Denotes a failure to convert a slice of size `actual_size` into a newtype `type_name`
/// containing a fixed size array
#[derive(thiserror::Error, Debug)]
#[error("Incorrect {type_name} size: {actual_size}")]
pub struct ArrayCastingError {
    pub type_name: &'static str,
    pub actual_size: usize,
}

/// Converts a slice into a fixed size array.
///
/// If the size of the slice does not match, it will return an `Err`.
pub fn array_cast_slice<T: Copy + Clone, const SIZE: usize>(from: &[T], type_name: &'static str) -> Result<[T; SIZE], ArrayCastingError> {
    match <[T; SIZE]>::try_from(from) {
        Ok(n) => Ok(n),
        Err(_) => Err(ArrayCastingError { type_name, actual_size: from.len() })
    }
}

/// Cast the array into an array of a fixed size.
///
/// If the size is the same, it will be re-returned. Otherwise, returns `Err`.
///
/// This is used to prove to the compiler that the size is correct, and will generally be optimized
/// by the compiler to have no runtime cost in release builds.
pub fn array_cast_size<const SIZE: usize, const ARR_SIZE: usize>(arr: [u8; ARR_SIZE], type_name: &'static str) -> Result<[u8; SIZE], ArrayCastingError> {
    if arr.len() == SIZE {
        let mut result: [u8; SIZE] = [0; SIZE];
        result.copy_from_slice(&arr);
        Ok(result)
    } else {
        Err(ArrayCastingError { type_name, actual_size: ARR_SIZE })
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn combine_slices() {
        let a = &[0u8, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let b = &[100u8, 101, 102, 103, 104, 105, 106];
        let c = &[207u8, 208, 209, 210, 211, 212, 213, 214, 215];

        // Should match a (why would you do this?)
        let a_a = join_slices!(a);
        assert_eq!(a, a_a.as_slice());
        assert_eq!(a.len(), a_a.len());

        // Should match a/b
        let ab = join_slices!(a, b);
        let (ab_a, ab_b) = ab.split_at(a.len());
        assert_eq!(a, ab_a);
        assert_eq!(b, ab_b);
        assert_eq!(a.len() + b.len(), ab.len());

        // Should match a/b/c
        let abc = join_slices!(a, b, c);
        let (abc_a, abc_bc) = abc.split_at(a.len());
        let (abc_b, abc_c) = abc_bc.split_at(b.len());
        assert_eq!(a, abc_a);
        assert_eq!(b, abc_b);
        assert_eq!(c, abc_c);
        assert_eq!(a.len() + b.len() + c.len(), abc.len());
    }

    #[test]
    fn test_encoded_byte_arrays() {
        let encoded_byte_arrays = [
            0, 5, 123, 45, 67, 89, 10,
            0, 2, 22, 23
        ];
        let decoded_byte_arrays = [
            [123, 45, 67, 89, 10].as_slice(),
            [22, 23].as_slice()
        ];

        let decoded = decode_byte_arrays::<2>(&encoded_byte_arrays).unwrap();
        assert_eq!(decoded_byte_arrays, decoded);

        let encoded = encode_byte_arrays(&decoded_byte_arrays).unwrap();
        assert_eq!(encoded_byte_arrays, encoded.as_slice());
    }
}