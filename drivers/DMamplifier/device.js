/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */

'use strict';

const Homey = require('homey');

// We need network functions.
var net = require('net');

// Variable to hold responses from the AVR
var receivedData = "";
// client will hold the IP connection to the device
var client = "";
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
				var device=this;

				let settings = this.getSettings();
				// see if device is on or in standby
				this.getPowerState ( this, settings.settingZone );

        // register a capability listener
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))

				// register flow card actions
				new Homey.FlowCardAction('powerOn').register().registerRunListener((args, state) => {
					this.log("Flow card action powerOn args "+args);
					this.log(" powerOn state "+JSON.stringify(state));
					this.powerOn(args.device);

					return Promise.resolve(true);
				});

				new Homey.FlowCardAction('powerOff').register().registerRunListener((args, state) => {
					this.log("Flow card action powerOff args "+args);
					this.log(" powerOff state "+JSON.stringify(state));
					this.powerOff(args.device);

					return Promise.resolve(true);
				});

				new Homey.FlowCardAction('mute').register().registerRunListener((args, state) => {
					this.log("Flow card action mute args "+args);
					this.log(" mute state "+JSON.stringify(state));
					this.onActionMute(args.device);

					return Promise.resolve(true);
				});

				new Homey.FlowCardAction('unMute').register().registerRunListener((args, state) => {
					this.log("Flow card action unMute args "+args);
					this.log(" unMute state "+JSON.stringify(state));
					this.onActionUnMute(args.device);

					return Promise.resolve(true);
				});

				new Homey.FlowCardAction('setVolume').register().registerRunListener((args, state) => {
					this.log("Flow card action setVolume args "+args);
					this.log(" setVolume state "+JSON.stringify(state));
					this.log(" setVolume volume "+args.volume);
					this.onActionSetVolume (args.device, args.volume);

					return Promise.resolve(true);
				});

				new Homey.FlowCardAction('setVolumeStep').register().registerRunListener((args, state) => {
					this.log("Flow card action setVolumeStep args "+args);
					this.log(" setVolumeStep state "+JSON.stringify(state));
					this.log(" setVolumeStep volumeChange "+args.volumeChange);
					this.onActionSetVolumeStep (args.device, args.volumeChange);

					return Promise.resolve(true);
				});

				let changeInputAction = new Homey.FlowCardAction('changeInput');
				changeInputAction
					.register()
					.registerRunListener((args, state) => {
						this.log("Flow card action changeInput args "+args);
						this.log(" changeInput state "+JSON.stringify(state));
						this.log(" changeInput input "+args.input.inputName);
						this.onActionChangeInput (args.device, args.input.inputName);
						return Promise.resolve(true);
					})
					.getArgument('input')
					.registerAutocompleteListener(( query, args ) => {
						var items = this.searchForInputsByValue( query );
						return Promise.resolve( items );
				})

				new Homey.FlowCardAction('customCommand').register().registerRunListener((args, state) => {
					this.log("Flow card action customCommand args "+args);
					this.log(" customCommand state "+JSON.stringify(state));
					this.log(" customCommand command "+args.command);
					this.onActionCustomCommand (args.device, args.command);

					return Promise.resolve(true);
				});

    } // end onInit

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
					this.powerOn ( this, settings.settingZone );
				} else {
					this.powerOff ( this, settings.settingZone );
				}

        // Then, emit a callback ( err, result )
        callback( null );
    }

		onActionMute( device ) {
			this.log("Action called: mute");
			this.mute( device );
		}

		onActionUnMute( device ) {
			this.log("Action called: unMute");
			this.unMute( device );
		}

		onActionSetVolume( device, volume ) {
			this.log("Action called: setVolume");
			this.setVolume( device, volume );
		}

		onActionSetVolumeStep( device, volumeChange ) {
			this.log("Action called: setVolumeStep");
			this.setVolumeStep( device, volumeChange );
		}

		onActionChangeInput( device, input ) {
			this.log("Action called: changeInput");
			this.changeInputSource ( device, input );
		}

// Note: customCommand affects all zones for a device, so you can run a customCommand from Zone2 and it will run just as if it was run from mainZone
		onActionCustomCommand( device, command ) {
			this.log("Action called: customCommand");
			command += '\r';
			this.sendCommandToDevice ( device, command );
		}

		getPowerState ( device, zone ) {
			this.log( "Getting device on/off status, zone: " + zone );
			var command = 'ZM?\r';
			switch (zone) {
				case 'Zone2':
					command = 'Z2?\r';
					break;
				case 'Zone3':
					command = 'Z3?\r'
					break;
			}
			this.sendCommandToDevice ( device, command );
		}

		parseResponse ( device ) {
			device.log("Parsing response, receivedData: " + receivedData);
// done with the receivedData, clear it for the next responses
			receivedData = "";
		}

    powerOn ( device ) {
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

    powerOff ( device ) {
    	// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
  		var zone = device.getSettings().settingZone;
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

		mute ( device ) {
			// supported zones: "Main Zone" (default), "Zone2", "Zone3"
			var zone = device.getSettings().settingZone;
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
			this.sendCommandToDevice ( device, command );
		}

		unMute ( device ) {
			// supported zones: "Main Zone" (default), "Zone2", "Zone3"
			var zone = device.getSettings().settingZone;
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
			this.sendCommandToDevice ( device, command );
		}

		setVolume ( device, targetVolume ) {
			var zone = device.getSettings().settingZone;
		// volume ranges from 00 to 99
		// apparently half steps are possible but not used here, eg 805 is 80.5
		// according to Marantz protocol some models have 99 as --, some have 00 as --
			var asciiVolume = "0"+targetVolume.toString();
			var asciiVolume = asciiVolume.slice(-2);
		// supported zones: "Main Zone" (default), "Zone2", "Zone3"
			var volumeZone = '--';
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
			this.sendCommandToDevice ( device, command );
		}

		setVolumeStep ( device, volumeChange ) {
			var zone = device.getSettings().settingZone;
			// Step up or down the volume. Argument volumeChange is the difference (e.g. +10 is 10 steps up or -5 is 5 steps down)
			var upOrDown = null;
			if(volumeChange > 0) {
				upOrDown = 'UP';
			}
			if(volumeChange < 0) {
				upOrDown = 'DOWN';
			}
			if(upOrDown !== null) {
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
				var command = volumeZone+upOrDown+'\r';
				for(var i = 0; i < Math.abs(volumeChange); i++) {
						setTimeout(function(device, command) {
							device.sendCommandToDevice ( device, command );
						}
					, (i * 750), device, command);
					}
				}
			}

			changeInputSource ( device, input ) {
					var zone = device.getSettings().settingZone;
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
					this.sendCommandToDevice ( device, command );
			}

    //

	    sendCommandToDevice ( device, command ) {
	    	let settings = device.getSettings();
				let name = device.getName();
	    	this.log ( "Got settings "+JSON.stringify(settings) );
	    	var tempIP = settings.settingIPAddress;
				var zone = settings.settingZone;
	    	this.sendCommand ( device, command );
	    }

	    sendCommand ( device, command ) {
				var settings = device.getSettings();
				var hostIP = settings.settingIPAddress;
				var zone = settings.settingZone;
	    	// for logging strip last char which will be the newline \n char
	    	var displayCommand=command.substring(0, command.length -1);
	    	device.log ( "Sending "+displayCommand+" to "+hostIP );
				device.log ( "  -- client: "+typeof(client) );
				if ((typeof(client.destroyed) != 'boolean') || (client.destroyed==true)) {
	    		client = new net.Socket();
					client.connect(telnetPort, hostIP);
				}
	    	client.on('error', function(err){
	    	    device.log("IP socket error: "+err.message);
	    	})
	    	client.write(command);

	    // add handler for any response or other data coming from the device
	    	client.on('data', function(data){
	    			var tempData = data.toString().replace("\r", ";");
	    			receivedData += tempData;
						device.log("Got data: " + tempData + " -- receivedData: "+ receivedData);
	    	})

	    // wait a while for a possible response
	    	setTimeout (this.parseResponse, 1000, device);
	    }

//			closeConnection (device, receivedData) {
//				device.log ("Closing connection, receivedData = " + receivedData);
//				if (typeof(client.end)==='function') {
//					client.end();
//				} else {
//					device.log ("  -- client.end was not a function");
//				}
//				device.parseResponse();
//			}

			searchForInputsByValue ( value ) {
			// for now, consider all known Marantz/Denon inputs
				var possibleInputs = allPossibleInputs;
				var tempItems = [];
				for (var i = 0; i < possibleInputs.length; i++) {
					var tempInput = possibleInputs[i];
					if ( tempInput.friendlyName.indexOf(value) >= 0 ) {
						tempItems.push({ icon: "", name: tempInput.friendlyName, description: "", inputName: tempInput.inputName });
					}
				}
				return tempItems;
			}
}

module.exports = DMDevice;
