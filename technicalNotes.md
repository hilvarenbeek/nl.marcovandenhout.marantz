Classes
  DMDriver        Denon/Marantz driver in driver.js
  DMDevice        Denon/Marantz device in device.js

Settings (note: driver settings, not app settings. See app.json):
  settingIPAddress   IP address       NOTE: not checked. could be regex'd using pattern, see developer docs.
  (not yet: model)

Thoughts:
  - maybe the different zones (D/M terminology) should have separate devices? I.e. a Marantz SR6010 has Main Zone and Zone 2, some models even have Zone 3. Should they be treated as separate amplifiers in Homey?
  - should have something like a model setting to quickly chose which inputs are available, and which commands to use/are available.
  - need to check current status (e.g. onoff) at init
  - use ArpManager to get device's MAC address to use as unique ID in stead of initial IP address.
  - if IP changed (settings), check status again (onOff)


SR6010:
  - on PW?, amp replies with PWON;Z2ON (main was off, zone 2 was on)
  - on PW?, amp replies with PWON;Z2ON (main was on, zone 2 was on)
  - on ZMOFF, amp replies with ZMOFF;SSINFAISSIG 01;SSINFAISFSV NON;
  - on turning on main, amp replies with ZMON (not PWON)
