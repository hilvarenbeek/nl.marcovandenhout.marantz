"use strict";
// need Homey module, see SDK Guidelines
const Homey = require("homey");

class DMDriver extends Homey.Driver {

    onPair(socket) {
        // socket is a direct channel to the front-end

        function letsContinue(socket) {
            socket.emit("continue", null);
        }

        var devices = [
            {
                "data": { "id": "initial_id" },
                "name": "initial_name",
                "settings": { "settingIPAddress": "0.0.0.0", "settingZoneMain": "yes", "settingZone2": "yes", "settingZone3": "no" } // initial settings
            }
        ];

        // this is called when the user presses save settings button in start.html
        socket.on("get_devices", function (data, callback) {

            console.log("Marantz app - get_devices data: " + JSON.stringify(data));
            console.log("Marantz app - get_devices devices: " + JSON.stringify(devices));

            // assume IP is OK and continue, which will cause the front-end to run list_amplifiers which is the template list_devices

            devices = [
                {
                    data: { id: data.ipaddress },
                    name: data.deviceName,
                    settings: { "settingIPAddress": data.ipaddress, "settingZoneMain": true, "settingZone2": data.zone2, "settingZone3": data.zone3 }
                }];

            // ready to continue pairing
            letsContinue(socket);

        });

        // this method is run when Homey.emit('list_devices') is run on the front-end
        // which happens when you use the template `list_devices`
        // pairing: start.html -> get_devices -> list_devices -> add_devices
        socket.on("list_devices", function (data, callback) {

            console.log("Marantz app - list_devices data: " + JSON.stringify(data));
            console.log("Marantz app - list_devices devices: " + JSON.stringify(devices));

            callback(null, devices);
        });


        // this happens when user clicks away the pairing windows
        socket.on("disconnect", function () {
            console.log("Marantz app - Pairing is finished (done or aborted)");        // using console.log because this.log or Homey.log is not a function
        });
    }
}

module.exports = DMDriver;
