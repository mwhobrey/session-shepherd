🧪 Comprehensive Testing Instructions:
Ready for Manual Testing! Here's what to test for each feature:
1. SES-13: Light/Dark Mode
Click the theme toggle button (moon/sun icon) in the header
Should cycle: System → Light → Dark → System
System mode should follow your OS theme preference
All UI elements should adapt to the theme
2. SES-14: Tab Preview
Create a session with multiple tabs
In the Sessions tab, each saved session should show:
Up to 5 tab previews with favicons and titles
"+X more" indicator if more than 5 tabs
Hover tooltips showing full tab titles
3. SES-15: Form Validation
Try empty session names → should show "Session name is required"
Try short names (< 3 chars) → should show length error
Try long names (> 50 chars) → should show length error
Try invalid characters → should show pattern error
Try with no tabs selected → save buttons should be disabled
Valid input → save buttons should be enabled, green borders
4. SES-16: Restore Options
In the Sessions tab, each session should have a dropdown:
"New Window" (default)
"Current Window"
Test both restore modes work correctly
5. SES-17: Domain Filtering
In the Create tab, use the Domain Filter:
Try ".github.com" → should select only GitHub tabs
Try "stackoverflow.com" → should select only Stack Overflow tabs
Try ".google.com" → should select Google domains
Clear filter → should select all tabs again
6. SES-18: Text Elipsis
Create sessions with very long names
Session names should truncate with "..." when too long
Hover over long names → should show full name in tooltip