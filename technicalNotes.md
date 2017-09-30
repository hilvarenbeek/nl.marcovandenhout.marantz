Classes
  DMDriver        Denon/Marantz driver in driver.js
  DMDevice        Denon/Marantz device in device.js

Settings (note: driver settings, not app settings. See app.json):
  settingIPAddress   IP address       Since version 1.0.0 IP is checked against Ipv4 RegEx in pairing and settings.
  (not yet: model)

Thoughts:
  - should have something like a model setting to quickly chose which inputs are available, and which commands to use/are available.
  - use ArpManager to get device's MAC address to use as unique ID in stead of initial IP address.
  - if IP changed (settings), check status again (onOff)

SR6010:
  - on PW?, amp replies with PWON;Z2ON (main was off, zone 2 was on)
  - on PW?, amp replies with PWON;Z2ON (main was on, zone 2 was on)
  - on ZMOFF, amp replies with ZMOFF;SSINFAISSIG 01;SSINFAISFSV NON;
  - on turning on main, amp replies with ZMON (not PWON)
