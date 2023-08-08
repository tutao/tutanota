# Theming, colors and whitelabel

We have multiple themes built-in. Theme id is saved to the localStorage for web and into the native storage for apps.

Theme can be changed by user from multiple places:

- login screen
- appearance settings
- WhitelabelThemeSettings

Theme can also be applied automatically from:

- storage
- from `window.whitelabelCustomizations` (see below).
- from URL parameter in apps (see below)
- theme definition from whitelabel data (see below)

## Whitelabel

Custom colors can be defined for a whitelabel domain. When user logs in on a whitelabel domain they are applied to
index.html by the server (as `window.whitelabelCustomizations`). Custom theme is also stored in app storage.

If the user open custom domain we automatically always apply custom theme. For apps, we show it as one of the options in
the color picker.

## Theme application algorithm

On startup:

- If we have `window.whitelabelCustomizations`, apply theme from it
- If we have theme passed in URL, use that
- If we have a theme preference saved in storage [^1], resolve [^2] and use that
- Or fall back to default theme

[^1]: Storage can be either localStorage for web or device storage for apps. However, in this case we would be given a
theme if there was one already.

[^2]: System/automatic theme preference means that we need to query the system for the dark/light mode and pick a theme
according to that.

We are listening to the system theme changes and update the theme if needed (see theme.js).

After login (apps only):

- Check if whitelabelConfig exists and has colors defined. If yes:
	- Check if color already exists. If no, show dialog suggesting applying a theme.
	- Save new theme to storage.
- Otherwise, remove theme for this domain from storage and switch to default theme. This prevents buying whitelabel to
  define themes once.