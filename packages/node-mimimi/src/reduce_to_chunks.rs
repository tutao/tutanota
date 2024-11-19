use std::iter::Peekable;
use std::ops::Deref;

struct ChunkingIterator<Inner, Element>
where
	Inner: Iterator + Send,
	Element: Send,
{
	inner: Peekable<Inner>,
	max_size: usize,
	sizer: Box<dyn Fn(&Element) -> usize + Send>,
}

impl<Inner, Element> Iterator for ChunkingIterator<Inner, Element>
where
	Inner: Iterator<Item = Element> + Send,
	Element: Send,
{
	type Item = Vec<Element>;
	fn next(&mut self) -> Option<Self::Item> {
		let seq = &mut self.inner;
		let mut element = seq.peek()?;

		let mut chunk: Vec<Element> = Vec::new();
		let mut current_chunk_size = 0_usize;
		loop {
			let element_size = self.sizer.deref()(element);
			if element_size > self.max_size {
				// this element is too big for one chunk. we might just ignore that and make a
				// one-element chunk that fails to upload, or we stop iteration here.
				// this discards any elements already in the chunk
				return None;
			}
			let new_chunk_size = current_chunk_size.saturating_add(element_size);
			if new_chunk_size > self.max_size {
				// chunk is full - this element goes into the next chunk.
				// because we used peek() it'll still be available for the next call to this function.
				return Some(chunk);
			} else {
				current_chunk_size = new_chunk_size;
				chunk.push(
					seq.next()
						.expect("got None from next even though peek() gave Some"),
				);
				element = match seq.peek() {
					None => break,
					Some(e) => e,
				};
			}
		}
		Some(chunk)
	}
}
/// split a given vector of elements into a vector of chunks not exceeding max_size, where the
/// chunks size is calculated by summing up the elements sizes as given by the sizer function.
///
/// the number of chunks is not guaranteed to be optimal.
pub fn reduce_to_chunks<'element, Element: 'element + Send>(
	seq: impl Iterator<Item = Element> + Send,
	max_size: usize,
	sizer: Box<dyn Send + Fn(&Element) -> usize>,
) -> impl Iterator<Item = Vec<Element>> + Send {
	ChunkingIterator {
		inner: seq.peekable(),
		max_size,
		sizer,
	}
}

#[cfg(test)]
mod tests {
	use crate::reduce_to_chunks::reduce_to_chunks;

	#[test]
	fn reduce_to_chunks_simple() {
		assert_eq!(
			vec![vec![1, 2, 3], vec![4], vec![5], vec![6]],
			reduce_to_chunks::<usize>(
				vec![1, 2, 3, 4, 5, 6].into_iter(),
				6,
				Box::new(|item| { *item })
			)
			.collect::<Vec<Vec<usize>>>()
		);
	}

	#[test]
	fn reduce_to_chunks_no_split() {
		assert_eq!(
			vec![vec![1, 2, 3, 4, 5, 6],],
			reduce_to_chunks::<usize>(
				vec![1, 2, 3, 4, 5, 6].into_iter(),
				21,
				Box::new(|item| { *item })
			)
			.collect::<Vec<Vec<usize>>>()
		);
	}

	#[test]
	fn reduce_to_chunks_empty() {
		assert_eq!(
			Vec::<Vec<usize>>::new(),
			reduce_to_chunks::<usize>(vec![].into_iter(), 0, Box::new(|item| { *item }))
				.collect::<Vec<Vec<usize>>>()
		);
	}

	#[test]
	fn split_too_big() {
		assert_eq!(
			Vec::<Vec<usize>>::new(),
			reduce_to_chunks::<usize>(vec![1, 10, 11].into_iter(), 2, Box::new(|item| { *item }))
				.collect::<Vec<Vec<usize>>>()
		);
	}
}
