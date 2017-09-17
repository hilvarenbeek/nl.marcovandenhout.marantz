Classes
  DMDriver        Denon/Marantz driver in driver.js
  DMDevice        Denon/Marantz device in device.js

Settings (note: driver settings, not app settings. See app.json):
  settingIPAddress   IP address       NOTE: not checked. could be regex'd using pattern, see developer docs.
  (not yet: model)

Thoughts:
  - maybe the different zones (D/M terminology) should have separate devices? I.e. a Marantz SR6010 has Main Zone and Zone 2, some models even have Zone 3. Should they be treated as separate amplifiers in Homey?
  - should have something like a model setting to quickly chose which inputs are available, and which commands to use/are available.
