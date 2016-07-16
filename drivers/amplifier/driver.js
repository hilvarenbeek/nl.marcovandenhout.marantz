// We need network functions.
var net = require('net');
// Temporarily store the device's IP address and name. For later use, it gets added to the device's settings
var tempIP = '';
var tempDeviceName = '';
// The Denon/Marantz IP network interface always uses port 23, which is known as the telnet port.
var telnetPort = 23;
// Device information (device_data) gets stored in an array
var devices = {};
// All known inputs for supported Denon/Marantz AV receivers and a more friendly name to use.
// If you find your favorite input missing, please file a bug on the GitHub repository.
var allPossibleInputs = [
		{	inputName: "PHONO",
	 		friendlyName: "Phono"
		},
		{	inputName: "CD",
	 		friendlyName: "CD player"
		},
		{	inputName: "DVD",
	 		friendlyName: "DVD player"
		},
		{	inputName: "BD",
	 		friendlyName: "BluRay player"
		},
		{	inputName: "TV",
	 		friendlyName: "TV"
		},
		{	inputName: "SAT/CBL",
	 		friendlyName: "SAT/Cable TV"
		},
		{	inputName: "SAT",
			friendlyName: "Satellite"
		},
		{	inputName: "MPLAY",
			friendlyName: "Media Player"
		},
		{	inputName: "VCR",
			friendlyName: "VCR"
		},
		{	inputName: "GAME",
	 		friendlyName: "Game"
		},
		{	inputName: "V.AUX",
	 		friendlyName: "Video Aux"
		},
		{	inputName: "TUNER",
	 		friendlyName: "Tuner"
		},
		{	inputName: "DOCK",
	 		friendlyName: "Dock"
		},
		{	inputName: "HDRADIO",
			friendlyName: "HD Radio"
		},
		{	inputName: "SIRIUS",
	 		friendlyName: "Sirius Radio"
		},
		{	inputName: "SPOTIFY",
			friendlyName: "Spotify"
		},
		{	inputName: "SIRIUSXM",
	 		friendlyName: "SiriusXM"
		},
		{	inputName: "RHAPSODY",
	 		friendlyName: "Rhapsody"
		},
		{	inputName: "PANDORA",
	 		friendlyName: "Pandora"
		},
		{	inputName: "NAPSTER",
	 		friendlyName: "Napster"
		},
		{	inputName: "LASTFM",
	 		friendlyName: "Last.fm"
		},
		{	inputName: "FLICKR",
	 		friendlyName: "Flickr"
		},
		{	inputName: "IRADIO",
	 		friendlyName: "Internet Radio"
		},
		{	inputName: "SERVER",
	 		friendlyName: "Server"
		},
		{	inputName: "FAVORITES",
	 		friendlyName: "Favorites"
		},
		{	inputName: "CDR",
	 		friendlyName: "CDR"
		},
		{	inputName: "AUX1",
	 		friendlyName: "Aux 1"
		},
		{	inputName: "AUX2",
	 		friendlyName: "Aux 2"
		},
		{	inputName: "AUX3",
	 		friendlyName: "Aux 3"
		},
		{	inputName: "AUX4",
	 		friendlyName: "Aux 4"
		},
		{	inputName: "AUX5",
	 		friendlyName: "Aux 5"
		},
		{	inputName: "AUX6",
	 		friendlyName: "Aux 6"
		},
		{	inputName: "AUX7",
	 		friendlyName: "Aux 7"
		},
		{	inputName: "NET",
	 		friendlyName: "Net"
		},
		{	inputName: "NET/USB",
	 		friendlyName: "Net/USB"
		},
		{	inputName: "BT",
	 		friendlyName: "Bluetooth"
		},
		{	inputName: "M-XPORT",
	 		friendlyName: "M-XPort"
		},
		{	inputName: "USB/IPOD",
	 		friendlyName: "USB/iPod"
		},
		{	inputName: "USB",
	 		friendlyName: "USB port"
		},
		{	inputName: "IPD",
	 		friendlyName: "iPod direct start playback"
		},
		{	inputName: "IRP",
	 		friendlyName: "Internet Radio Recent Play"
		},
		{	inputName: "FVP",
	 		friendlyName: "Online Music Favorites Play"
		},
		{	inputName: "OTP",
	 		friendlyName: "One Touch Play"
		},
		{	inputName: "IPOD",
	 		friendlyName: "iPod"
		},
		{	inputName: "AUXA",
			friendlyName: "Aux A"
		},
		{	inputName: "AUXB",
	 		friendlyName: "Aux B"
		},
		{	inputName: "AUXC",
	 		friendlyName: "Aux C"
		}
];

// init gets run at the time the app is loaded. We get the already added devices then need to run the callback when done.
module.exports.init = function( devices_data, callback ) {

    devices_data.forEach(function initdevice(device) {
//populate devices array
	    Homey.log('Marantz app - init device: ' + JSON.stringify(device));
	    devices[device.id] = device;
//put each device's settings in the devices array
	    module.exports.getSettings(device, function( err, settings ){
		    devices[device.id].settings = settings;
			})
		})

	Homey.log("Marantz app - driver init done");
//tell Homey we're happy to go
	callback (null, true);
};


// start of pairing functions
module.exports.pair = function( socket ) {
// socket is a direct channel to the front-end

// this method is run when Homey.emit('list_devices') is run on the front-end
// which happens when you use the template `list_devices`
	socket.on('list_devices', function( data, callback ) {

		console.log( "Marantz app - list_devices data: " + JSON.stringify(data));
// tempIP and tempDeviceName we got from when get_devices was run (hopefully?)

		var newDevices = [{
			data: {
				id				: tempIP
			},
			name: tempDeviceName,
			settings: { "settingIPAddress": tempIP } // initial settings
		}];

		callback( null, newDevices );
	});


// this is called when the user presses save settings button in start.html
	socket.on('get_devices', function( data, callback ) {

		// Set passed pair settings in variables
		tempIP = data.ipaddress;
		tempDeviceName = data.deviceName;
		console.log ( "Marantz app - got get_devices from front-end, tempIP =", tempIP, " tempDeviceName = ", tempDeviceName );
// FIXME: should check if IP leads to an actual Marantz device
// assume IP is OK and continue, which will cause the front-end to run list_amplifiers which is the template list_devices
		socket.emit ( 'continue', null );
	});

// this gets called when a device is added
	socket.on('add_device', function (device, callback) {
    Homey.log( "Marantz app - pairing: device added", device);

// update devices data array
		devices[device.data.id] = {
        	id: device.data.id,
					name: device.name,
					settings: {
						settingIPAddress: device.settings.ipaddress
            }
        };

    Homey.log('Marantz app - add done. devices =' + JSON.stringify(devices));
		callback(null);
    });


		socket.on('disconnect', function() {
			console.log("Marantz app - User aborted pairing, or pairing is finished");
	  })
}
// end pair

// handling settings (wrench icon in devices)
module.exports.settings = function( device_data, newSettingsObj, oldSettingsObj, changedKeysArr, callback ) {
    // run when the user has changed the device's settings in Homey.
    // changedKeysArr contains an array of keys that have been changed, for your convenience :)

    // always fire the callback, or the settings won't change!
    // if the settings must not be saved for whatever reason:
    // callback( "Your error message", null );
    // else callback( null, true );

		Homey.log ('Marantz app - Settings were changed: ' + JSON.stringify(device_data) + ' / ' + JSON.stringify(newSettingsObj) + ' / old = ' + JSON.stringify(oldSettingsObj) + ' / changedKeysArr = ' + JSON.stringify(changedKeysArr));

		try {
      changedKeysArr.forEach(function (key) {
					switch (key) {
						case 'settingIPAddress':
							newIP = newSettingsObj.settingIPAddress;
							Homey.log ('Marantz app - IP address changed to ' + newIP);
							break;
					}
      })
      callback(null, true)
    } catch (error) {
      callback(error)
    }

}

// capabilities

module.exports.capabilities = {
    onoff: {

        get: function( device_data, callback ){

					Homey.log('Getting device_status of ' + devices[device_data.id].settings.ipaddress);
					// FIXME: should get onoff status here
					callback (null, true);
        },

        set: function( device_data, turnon, callback ) {

	        Homey.log('Setting device_status of ' + devices[device_data.id].settings.ipaddress + ' to ' + turnon);

					if (turnon) {

						// FIXME: should send command to turn on here
						callback (null, true);

					} else {

						// FIXME: should send command to turn off here
						callback (null, true);

					}

        }
    },

    volume_set: {

        get: function( device_data, callback ){

			Homey.log('Getting volume of ' + devices[device_data.id].settings.ipaddress);
				// FIXME: should get actual volume setting
						var volume = 1;
	         	callback (null, volume);

        },

        set: function( device_data, volume, callback ) {

	        Homey.log('Setting volume of ' + devices[device_data.id].settings.ipaddress + ' to ' + volume);
					// FIXME: should send command to actually set volume here
					callback (null, true);

        }
    },

		volume_up: {

				set: function( device_data, callback ) {

					Homey.log('Turning up volume of ' + devices[device_data.id].settings.ipaddress);
					// FIXME: should send command to actually set volume here
					callback (null, true);

				}
		},

		volume_down: {

				set: function( device_data, callback ) {

					Homey.log('Turning down volume of ' + devices[device_data.id].settings.ipaddress);
					// FIXME: should send command to actually set volume here
					callback (null, true);

				}
		},

		volume_mute: {

        get: function( device_data, callback ){

					Homey.log('Getting mute status of ' + devices[device_data.id].settings.ipaddress);
					// FIXME: should get mute status here
					callback (null, true);
        },

        set: function( device_data, muteon, callback ) {

	        Homey.log('Setting mute status of ' + devices[device_data.id].settings.ipaddress + ' to ' + muteon);

					if (muteon) {

						// FIXME: should send command to mute here
						callback (null, true);

					} else {

						// FIXME: should send command to unmute here
						callback (null, true);

					}

        }
    }

}

// end capabilities

// start flow action handlers

Homey.manager('flow').on('action.powerOn', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	powerOn ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.powerOff', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	powerOff ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput', function( callback, args ){
	var input = args.input.inputName;
	var zone = args.zone;
	var device = args.device;
	changeInputSource ( device, zone, input );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput.input.autocomplete', function( callback, value ) {
	var inputSearchString = value.query;
	var items = searchForInputsByValue( inputSearchString );
	callback( null, items );
});

Homey.manager('flow').on('action.mute', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	mute ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.unMute', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	unMute ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.setVolume', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	var targetVolume = args.volume;
	setVolume ( device, zone, targetVolume );
  callback( null, true ); // we've fired successfully
});

//

function powerOn ( device, zone ) {
	// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
	var command = 'PWON\r';
	switch (zone) {
		case 'Whole unit':
			command = 'PWON\r';
			break;
		case 'Main Zone':
			command = 'ZMON\r';
			break;
		case 'Zone2':
			command = 'Z2ON\r'
			break;
	}
	sendCommandToDevice ( device, command );
}

function powerOff ( device, zone ) {
	// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
	var command = 'PWSTANDBY\r';
	switch (zone) {
		case 'Whole unit':
			command = 'PWSTANDBY\r';
			break;
		case 'Main Zone':
			command = 'ZMOFF\r';
			break;
		case 'Zone2':
			command = 'Z2OFF\r'
			break;
	}
	sendCommandToDevice ( device, command );
}

function changeInputSource ( device, zone, input ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
		var sourceZone = 'SI';
		switch (zone) {
			case 'Main Zone':
				sourceZone = 'SI';
				break;
			case 'Zone2':
				sourceZone = 'Z2';
				break;
			case 'Zone3':
				sourceZone = 'Z3';
				break;
		}
		var command = sourceZone+input+'\r';
		sendCommandToDevice ( device, command );
}

function mute ( device, zone ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	var command = 'MUON\r';
	switch (zone) {
		case 'Main Zone':
			command = 'MUON\r';
			break;
		case 'Zone2':
			command = 'Z2MUON\r';
			break;
		case 'Zone3':
			command = 'Z3MUON\r'
			break;
	}
	sendCommandToDevice ( device, command );
}

function unMute ( device, zone ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	var command = 'MUOFF\r';
	switch (zone) {
		case 'Main Zone':
			command = 'MUOFF\r';
			break;
		case 'Zone2':
			command = 'Z2MUOFF\r';
			break;
		case 'Zone3':
			command = 'Z3MUOFF\r'
			break;
	}
	sendCommandToDevice ( device, command );
}

function setVolume ( device, zone, targetVolume ) {
// volume ranges from 00 to 99
// apparently half steps are possible but not used here, eg 805 is 80.5
// according to Marantz protocol some models have 99 as --, some have 00 as --
	var asciiVolume = "0"+targetVolume.toString();
	var asciiVolume = asciiVolume.slice(-2);
// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	var volumeZone = 'MV';
	switch (zone) {
		case 'Main Zone':
			volumeZone = 'MV';
			break;
		case 'Zone2':
			volumeZone = 'Z2';
			break;
		case 'Zone3':
			volumeZone = 'Z3';
			break;
	}
	var command = volumeZone+asciiVolume+'\r';
	sendCommandToDevice ( device, command );
}

//

function sendCommandToDevice ( device, command ) {
	console.log ( "Marantz app - sending "+command+"\n to device "+device.id );
//	tempIP = device.ipaddress;
	module.exports.getSettings (device, function(err, settings){
		console.log ( "Marantz app - got settings "+JSON.stringify(settings) );
		tempIP = settings.settingIPAddress;
		sendCommand ( tempIP, command );
	});
}

function sendCommand ( hostIP, command ) {
	console.log ( "Marantz app - sending "+command+"\n to "+hostIP );
	var client = new net.Socket();
	client.on('error', function(err){
	    Homey.log("Marantz app - IP socket error: "+err.message);
	})
	client.connect(telnetPort, hostIP);
	client.write(command);
	client.end();
}

function searchForInputsByValue ( value ) {
// for now, consider all known Marantz/Denon inputs
	var possibleInputs = allPossibleInputs;
	var tempItems = [];
	for (var i = 0; i < possibleInputs.length; i++) {
		var tempInput = possibleInputs[i];
		if ( tempInput.friendlyName.indexOf(value) >= 0 ) {
			tempItems.push({ icon: "", name: tempInput.friendlyName, inputName: tempInput.inputName });
		}
	}
	return tempItems;
}
