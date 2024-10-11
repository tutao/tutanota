use crate::rest_client::RestClientError;

/// wrapper around hyper::Uri that saves some unwrapping
pub struct Uri(hyper::Uri);

impl Uri {
	pub fn authority(&self) -> String {
		self.0.authority().unwrap().to_string()
	}

	pub fn inner(self) -> hyper::Uri {
		self.0
	}
}
impl TryFrom<&str> for Uri {
	type Error = RestClientError;

	fn try_from(value: &str) -> Result<Self, Self::Error> {
		let uri = value
			.parse::<hyper::Uri>()
			.map_err(|_| RestClientError::InvalidURL)?;

		// it looks like hyper::Uri doesn't accept Urls without an authority
		// but with a scheme (like http:///path) so this check could be omitted.
		// feels safer this way though.
		let Some(_) = uri.authority() else {
			return Err(RestClientError::InvalidURL);
		};

		let (Some("http") | Some("https")) = uri.scheme_str() else {
			return Err(RestClientError::InvalidURL);
		};

		Ok(Self(uri))
	}
}

#[cfg(test)]
mod tests {
	#[test]
	fn should_work() {
		super::Uri::try_from("http://localhost:8080").unwrap();
		super::Uri::try_from("https://localhost:8080").unwrap();
		super::Uri::try_from("https://localhost.com").unwrap();
		super::Uri::try_from("https://127.0.0.1:123").unwrap();
		super::Uri::try_from("https://localhost.com/path?with=params").unwrap();
	}

	#[test]
	fn should_fail() {
		// wrong scheme
		assert!(super::Uri::try_from("ftp://localhost:8080").is_err());
		// no authority
		assert!(super::Uri::try_from("/relative").is_err());
		assert!(super::Uri::try_from("").is_err());
	}
}
