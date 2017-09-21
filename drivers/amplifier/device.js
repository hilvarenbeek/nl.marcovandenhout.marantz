/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */

'use strict';

const Homey = require('homey');

// We need network functions.
var net = require('net');

// Variable to hold responses from the AVR
var receivedData = "";
// Variable to remember if device is turned on or off. Initially assume it is off (standby)
var onOffState = false;
// The Denon/Marantz IP network interface always uses port 23, which is known as the telnet port.
var telnetPort = 23;
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

class DMDevice extends Homey.Device {

    // this method is called when the Device is inited
    onInit() {
        this.log('device init');
        this.log('name:', this.getName());
        this.log('class:', this.getClass());

				let settings = this.getSettings();

				// see if device is on or in standby
				this.getPowerState ( this.getData(), settings.settingZone );

        // register a capability listener
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))

				// register flow card actions
				new Homey.FlowCardAction('powerOn').register().registerRunListener((args, state) => {
					this.log("Flow card action powerOn args "+JSON.stringify(args));
					this.log(" powerOn state "+JSON.stringify(state));
					this.powerOn(args.device);

					return Promise.resolve(true);
				});

				new Homey.FlowCardAction('powerOff').register().registerRunListener((args, state) => {
					this.log("Flow card action powerOff args "+JSON.stringify(args));
					this.log(" powerOff state "+JSON.stringify(state));
					this.powerOff(args.device);

					return Promise.resolve(true);
				});


    }

    // this method is called when the Device is added
    onAdded() {
        this.log('device added');
    }

    // this method is called when the Device is deleted
    onDeleted() {
        this.log('device deleted');
    }

    // this method is called when the Device has requested a state change (turned on or off)
    onCapabilityOnoff( value, opts, callback ) {

        // ... set value to real device
        this.log("Capability called: OnOff");
				this.log("value: "+JSON.stringify(value));
				this.log("opts: "+JSON.stringify(opts));
			  let settings = this.getSettings();
				if (value) {
					this.powerOn ( this.getData(), settings.settingZone );
				} else {
					this.powerOff ( this.getData(), settings.settingZone );
				}

        // Then, emit a callback ( err, result )
        callback( null );
    }

		getPowerState ( device, zone ) {
			this.log( "Marantz app - getting device on/off status" );
			var command = 'PW?\r';
			switch (zone) {
				case 'Zone2':
					command = 'Z2?\r';
					break;
				case 'Zone3':
					command = 'Z3?\r'
					break;
			}
			this.sendCommandToDevice ( device, command, function(receivedData) {
					console.log("Marantz app - got callback, receivedData: " + receivedData);
	// if the response contained "PWON", the AVR was on. Else it was probably in standby.
					var expectedResponse = "PWON";
					switch (zone) {
						case 'Zone2':
							command = 'Z2ON';
							break;
						case 'Zone3':
							command = 'Z3ON'
							break;
					}
					if (receivedData.indexOf(expectedResponse) >= 0) {
						console.log("Marantz app - telling capability power is on");
						onOffState = true;
					}	else {
						console.log("Marantz app - telling capability power is off");
						onOffState = false;
					}
				}
			)
	  }

    powerOn ( device, zone ) {
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
				case 'Zone3':
    			command = 'Z3ON\r'
    			break;    	}
    	this.sendCommandToDevice ( device, command );
    }

    powerOff ( device, zone ) {
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
				case 'Zone3':
    			command = 'Z3OFF\r'
    			break;
    	}
    	this.sendCommandToDevice ( device, command );
    }

    //

    sendCommandToDevice ( device, command, callbackCommand ) {
    	let settings = this.getSettings();
    	this.log ( "Marantz app - got settings "+JSON.stringify(settings) );
    	var tempIP = settings.settingIPAddress;
    	this.sendCommand ( tempIP, command, callbackCommand );
    }

    sendCommand ( hostIP, command, callbackCommand ) {
    	// clear variable that holds data received from the AVR
    	receivedData = "";
    	// for logging strip last char which will be the newline \n char
    	var displayCommand=command.substring(0, command.length -1);
    	this.log ( "Marantz app - sending "+displayCommand+" to "+hostIP );
    	var client = new net.Socket();
    	client.on('error', function(err){
    	    console.log("Marantz app - IP socket error: "+err.message);
    	})
    	client.connect(telnetPort, hostIP);
    	client.write(command);

    // get a response
    	client.on('data', function(data){
    			var tempData = data.toString().replace("\r", ";");
    			console.log("Marantz app - got: " + tempData);
    			receivedData += tempData;
    	})

    // after a delay, close connection
    	setTimeout ( function() {
    		receivedData = receivedData.replace("\r", ";")
    		console.log("Marantz app - closing connection, receivedData: " + receivedData );
    		client.end();
    // if we got a callback function, call it with the receivedData
    		if (callbackCommand && typeof(callbackCommand) == "function") {
    			callbackCommand(receivedData);
    		}
      }, 1000);
    }

}

module.exports = DMDevice;
