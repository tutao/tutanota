use std::num::NonZeroU32;

pub fn to_non_zero_u32(slice: &[u32]) -> Vec<NonZeroU32> {
	slice.iter().map(|s| NonZeroU32::new(*s).unwrap()).collect()
}
