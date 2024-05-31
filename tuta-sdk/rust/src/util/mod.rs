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

#[cfg(test)]
mod test {
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
}