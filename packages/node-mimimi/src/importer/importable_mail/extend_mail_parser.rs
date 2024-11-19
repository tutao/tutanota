//! Extends the functionality of mail_parser crate
use crate::importer::importable_mail::ReplyType;
use mail_parser::HeaderName;
use std::borrow::Cow;

pub(super) fn get_reply_type_from_headers<'a>(headers: &'a [mail_parser::Header<'a>]) -> ReplyType {
	let mut is_forward = false;
	let mut is_reply = false;

	for header in headers {
		if header.name == HeaderName::ResentFrom {
			if header.value().make_string().trim().is_empty() {
				is_forward = true;
			}
		} else if header.name == HeaderName::References
			&& header.value().make_string().trim().is_empty()
		{
			is_reply = true;
		}
		if is_reply && is_forward {
			break;
		}
	}

	if is_forward && is_reply {
		ReplyType::ReplyForward
	} else if is_forward {
		ReplyType::Forward
	} else if is_reply {
		ReplyType::Reply
	} else {
		ReplyType::default()
	}
}

/// Supports converting types of external library to string that can be imported
pub(super) trait MakeString {
	fn make_string(&self) -> Cow<str>;
}

impl<'a> MakeString for [mail_parser::Header<'a>] {
	fn make_string(&self) -> Cow<str> {
		self.iter()
			.map(MakeString::make_string)
			.collect::<Vec<_>>()
			.join("\n")
			.into()
	}
}
impl<'a> MakeString for mail_parser::Header<'a> {
	fn make_string(&self) -> Cow<str> {
		let Self {
			name,
			value,
			offset_field: _,
			offset_start: _,
			offset_end: _,
		} = self;
		let header_line = name.to_string() + ": " + value.make_string().as_ref();
		Cow::Owned(header_line)
	}
}

impl<'a> MakeString for mail_parser::HeaderValue<'a> {
	fn make_string(&self) -> Cow<str> {
		match self {
			mail_parser::HeaderValue::ContentType(content_t) => MakeString::make_string(content_t),
			mail_parser::HeaderValue::Received(recv) => MakeString::make_string(recv.as_ref()),
			mail_parser::HeaderValue::Address(address) => MakeString::make_string(address),
			mail_parser::HeaderValue::DateTime(date_time) => MakeString::make_string(date_time),
			mail_parser::HeaderValue::TextList(text_list) => Cow::Owned(text_list.join(",")),
			mail_parser::HeaderValue::Text(text) => Cow::Borrowed(text.as_ref()),
			mail_parser::HeaderValue::Empty => Cow::Borrowed(""),
		}
	}
}

impl MakeString for mail_parser::DateTime {
	fn make_string(&self) -> Cow<str> {
		const DAY_OF_WEEK: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const MONTH_OF_YEAR: [&str; 12] = [
			"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
		];

		let weekday = DAY_OF_WEEK[self.day_of_week() as usize];
		let Self {
			year,
			month,
			day,
			hour: hh,
			minute: mm,
			second: ss,
			tz_before_gmt: _,
			tz_hour: tz_hh,
			tz_minute: tz_mm,
		} = self;
		let month = MONTH_OF_YEAR[*month as usize - 1];

		Cow::Owned(format!(
			"{weekday}, {day:02} {month:02} {year} {hh:02}:{mm:02}:{ss:02} +{tz_hh:02}{tz_mm:02}"
		))
	}
}

impl<'x> MakeString for mail_parser::Received<'x> {
	fn make_string(&self) -> Cow<str> {
		Cow::Borrowed("todo!()")
	}
}

impl<'a> MakeString for mail_parser::Address<'a> {
	fn make_string(&self) -> Cow<str> {
		match self {
			mail_parser::Address::List(address_list) => address_list
				.iter()
				.map(|addr| make_mail_address(addr.name(), addr.address()))
				.collect::<Vec<_>>()
				.join(",")
				.into(),
			mail_parser::Address::Group(_group_list) => {
				todo!()
			},
		}
	}
}

impl<'a> MakeString for mail_parser::ContentType<'a> {
	fn make_string(&self) -> Cow<str> {
		let attribute_str = self.attributes.as_ref().map(|attributes| {
			attributes
				.iter()
				.map(|(name, value)| {
					if value.is_empty() {
						name.to_string()
					} else {
						name.to_string() + "=\"" + value.as_ref() + "\""
					}
				})
				.collect::<Vec<_>>()
				.join(";")
		});

		let mut content_type = self.c_type.as_ref().to_string();
		if let Some(subtype) = self.c_subtype.as_ref() {
			content_type.push('/');
			content_type.push_str(subtype);
		}
		if let Some(attribute_str) = attribute_str {
			if !content_type.is_empty() {
				content_type.push_str(";");
			}
			content_type.push_str(attribute_str.as_str());
		}

		Cow::Owned(content_type)
	}
}

fn make_mail_address(name: Option<&str>, address: Option<&str>) -> String {
	let name = name.unwrap_or_default();
	let mut res = if name.is_empty() || name.starts_with("\"") {
		name.to_string()
	} else {
		// always wrap name in quotes. tutadb: #417
		String::from('"') + name + "\""
	};

	if let Some(address) = address {
		res.push('<');
		res.push_str(address);
		res.push('>');
	}
	res
}
