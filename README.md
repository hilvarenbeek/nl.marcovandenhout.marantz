# Marantz IP control app for Athom Homey

This app lets you control a Marantz amplifier from within flows on a Homey device (by Athom). Homey is NodeJS based and allows for apps to extend its functionality.

This works for reasonably recent AVRs that have ethernet or WiFi connectivity and the IP control option, like the NR1604 or SR5007. It also works for some models by Denon.

In its current state, the app requires that you enter the amplifier's IP address so it is advised to set it up to have a fixed IP address or a 'static lease' from the DHCP server.

# Changelog

**Version 1.0.2:**
- added 'when...' and '...then' flow cards, added credits to Marco van 't Klooster
- made input select for action card case insensitive (e.g. typing cd or CD will both find CD/DVD)
- link to issue tracker and forum
- a little code cleanup

**Version 1.0.1:**
- Bug from 1.0.0 fixed: if you have multiple devices with this driver in Homey, sometimes mixes up commands and values between devices.

**Version 1.0.0 (beta only):**
- Rewritten for SDK2 (Homey 1.5 and up)
- Added capabilities, now a volume slider appears in mobile which sets main volume
- Improvements include checking IP address at pairing and in settings

**Version 0.0.8:**
- Added volume up/down action thanks to 'Marco van 't Klooster'

**Version 0.0.7:**
- Rewrite according to updated developers documentation at Athom
- Added capability to turn the amplifier on or off (shows on device cards)
- Added send custom command action, allowing for raw commands that are not covered yet (e.g. send MVUP to turn master volume one step up)

**Version 0.0.6:**
- Made the IP address a setting, so you can change it from the Devices tab using the wrench icon (mouseover)
- Improved error handling on network connectivity problems so the app is less likely to crash when it couldn't open a network socket

**Version 0.0.5:**
- Added possible inputs
- Added possibility to change the device's name as it is being added (paired)

**Version 0.0.4:**
- Bugfix: fixed a problem where the entered IP address was not registered

**Version 0.0.3:**
- Added zones in flow actions
- Added volume command (flow action)

**Version 0.0.2:**
- Added mute and source input commands (flow actions)

**Version 0.0.1:**
- Initial version
