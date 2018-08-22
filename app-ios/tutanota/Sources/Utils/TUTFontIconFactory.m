//
//  TUTFontIconFactory.m
//  tutanota
//
//  Created by Tutao GmbH on 22.08.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import "TUTFontIconFactory.h"
#import "UIKit/UIKit.h"
#import "Swiftier.h"

@implementation TUTFontIconFactory

+ (UIImage *)createFontImageForIconId:(NSString*)identifier fontName:(NSString*)fontName size:(CGFloat)fontSize {
	CGSize size = CGSizeMake(fontSize, fontSize);
	UIFont *font = [UIFont fontWithName:fontName size:fontSize];
	let paragraphStyle = [NSMutableParagraphStyle new];
	paragraphStyle.alignment = NSTextAlignmentCenter;
	NSDictionary *attributes = @{NSFontAttributeName            : font,
								 NSForegroundColorAttributeName : [UIColor blueColor],
								 NSBackgroundColorAttributeName : [UIColor clearColor],
								 NSParagraphStyleAttributeName: paragraphStyle
								 };
	let attributedString = [[NSAttributedString alloc] initWithString:identifier attributes:attributes];
	UIGraphicsBeginImageContextWithOptions(size, NO, 0);
	[attributedString drawInRect:CGRectMake(0, 0, size.width, size.height)];
	UIImage *fontImage = UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();
	return fontImage;
}

@end
