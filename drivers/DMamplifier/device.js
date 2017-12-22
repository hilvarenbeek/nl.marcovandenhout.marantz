/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */

"use strict";

const Homey = require( "homey" );

// We need network functions.
var net = require( "net" );

// keep a list of devices in memory
var devices = [];

// client holds net.Socket
var client = "";
// receivedData holds unparsed data received from the client (data received over the network)
var receivedData = "";
// MVMax is the maximum volume number (e.g. 70)
var MVMax = 70;
// The Denon/Marantz IP network interface always uses port 23, which is known as the telnet port.
var telnetPort = 23;
// All known inputs for supported Denon/Marantz AV receivers and a more friendly name to use.
// If you find your favorite input missing, please file a bug on the GitHub repository.
var allPossibleInputs = [
		{	inputName: "PHONO",
            friendlyName: "Phono"
		},
        {   inputName: "CD",
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
        this.log( "device init" );
        this.log( "name: ", this.getName() );
        this.log( "class: ", this.getClass() );
				let id = this.getData().id;
				this.log( "id: ", id );

				devices[id] = {};
				devices[id].client = "";
				devices[id].receivedData = "";
				devices[id].MVMax = 70;

//				console.dir(devices);			// for debugging

				// get initial state
				this.getState();

        // register capability listeners
        this.registerCapabilityListener( "onoff", this.onCapabilityOnoff.bind( this ));
				this.registerCapabilityListener( "volume_set", this.onCapabilityVolumeSet.bind( this ));
				this.registerCapabilityListener( "volume_mute", this.onCapabilityVolumeMute.bind( this ));
				this.registerCapabilityListener( "volume_up", this.onCapabilityVolumeUp.bind( this ));
				this.registerCapabilityListener( "volume_down", this.onCapabilityVolumeDown.bind( this ));

				// register flow card actions
				let powerOnAction = new Homey.FlowCardAction( "powerOn" );
				powerOnAction
					.register().registerRunListener((args, state) => {
						this.log("Flow card action powerOn args.zone: " + JSON.stringify( args.zone ));
						this.powerOn(args.device, args.zone.zone);
						return Promise.resolve( true );
					}
				);
				powerOnAction
					.getArgument( "zone" ).registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					}
				);

				let powerOffAction = new Homey.FlowCardAction( "powerOff" );
				powerOffAction
					.register().registerRunListener((args, state) => {
						this.log( "Flow card action powerOff args " + args);
						this.powerOff( args.device, args.zone.zone );
						return Promise.resolve( true );
					}
				);
				powerOffAction
					.getArgument( "zone" ).registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					}
				);

				let muteAction = new Homey.FlowCardAction( "mute" );
				muteAction
					.register().registerRunListener(( args, state ) => {
						this.log( "Flow card action mute args " + args);
						this.onActionMute( args.device, args.zone.zone );
						return Promise.resolve( true );
					}
				);
				muteAction
					.getArgument( "zone" ).registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					}
				);

				let unMuteAction = new Homey.FlowCardAction( "unMute" );
				unMuteAction
					.register().registerRunListener(( args, state ) => {
						this.log( "Flow card action unMute args " + args);
						this.onActionUnMute( args.device, args.zone.zone );
						return Promise.resolve( true );
					}
				);
				unMuteAction
					.getArgument( "zone" ).registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					}
				);

				let setVolumeAction = new Homey.FlowCardAction( "setVolume" );
				setVolumeAction
					.register().registerRunListener(( args, state ) => {
						this.log( "Flow card action setVolume args " + args );
						this.log( " setVolume volume " + args.volume );
						this.onActionSetVolume( args.device, args.zone.zone, args.volume );
						return Promise.resolve( true );
					}
				);
				setVolumeAction
					.getArgument( "zone" ).registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					}
				);

				let setVolumeStepAction = new Homey.FlowCardAction( "setVolumeStep" );
				setVolumeStepAction
					.register().registerRunListener(( args, state ) => {
						this.log( "Flow card action setVolumeStep args: " + args);
						this.log( " setVolumeStep volumeChange " + args.volumeChange);
						this.onActionSetVolumeStep( args.device, args.zone.zone, args.volumeChange );
						return Promise.resolve(true);
					}
				);
				setVolumeStepAction
					.getArgument( "zone" ).registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					}
				);

				let changeInputAction = new Homey.FlowCardAction( "changeInput" );
				changeInputAction
					.register()
					.registerRunListener((args, state) => {
						this.log( "Flow card action changeInput args " + args );
						this.log( " changeInput input " + args.input.inputName );
						this.onActionChangeInput( args.device, args.zone.zone, args.input.inputName );
						return Promise.resolve( true );
					});
				changeInputAction
					.getArgument( "zone" )
					.registerAutocompleteListener(( query, args ) => {
						var items = this.availableZones( args.device, query );
						return Promise.resolve( items );
					});
				changeInputAction
					.getArgument( "input" )
					.registerAutocompleteListener(( query, args ) => {
						var items = this.searchForInputsByValue( query );
						return Promise.resolve( items );
					});

				new Homey.FlowCardAction( "customCommand" ).register().registerRunListener((args, state) => {
					this.log( "Flow card action customCommand args " + args );
					this.log( " customCommand command " + args.command );
					this.onActionCustomCommand ( args.device, args.command );
					return Promise.resolve( true );
				});

    } // end onInit

    // this method is called when the Device is added
    onAdded() {
				let id = this.getData().id;
        this.log( "device added: ",id );
				devices[id] = {};
				devices[id].client = "";
				devices[id].receivedData = "";
				devices[id].MVMax = 70;
    }

    // this method is called when the Device is deleted
    onDeleted() {
				let id = this.getData().id;
                this.log( "device deleted: ", id );
				delete devices[id];
    }

    // this method is called when the Device has requested a state change (turned on or off)
    onCapabilityOnoff( value, opts, callback ) {
        // ... set value to real device
        this.log( "Capability called: onoff value: ", value);
				if (value) {
					this.powerOn ( this, "Whole unit" );
				} else {
					this.powerOff ( this, "Whole unit" );
				}
        // Then, emit a callback ( err, result )
        callback( null );
    }

		onCapabilityVolumeMute( value, opts, callback ) {
			this.log( "Capability called: volume_mute value: ", value);
			if (value) {
				this.mute ( this, "Main Zone" );
			} else {
				this.muteOff ( this, "Main Zone" );
			}
			callback( null );
		}

		onCapabilityVolumeSet( value, opts, callback ) {
			var targetVolume = Math.round( value*MVMax );
			this.log( "Capability called: volume_set, value: " + value + " calculated volume: " + targetVolume );
			this.setVolume ( this, "Main Zone", targetVolume );
			callback( null );
		}

		onCapabilityVolumeUp( value, opts, callback ) {
			this.log( "Capability called: volume_up" );
			this.volumeUp ( this, "Main Zone" );
			callback( null );
		}

		onCapabilityVolumeDown( value, opts, callback ) {
			this.log( "Capability called: volume_down" );
			this.volumeDown ( this, "Main Zone" );
			callback( null );
		}

		onActionMute( device, zone ) {
			device.log( "Action called: mute" );
			device.mute( device, zone );
		}

		onActionUnMute( device, zone ) {
			device.log( "Action called: unMute" );
			device.unMute( device, zone );
		}

		onActionSetVolume( device, zone, volume ) {
			device.log( "Action called: setVolume" );
			device.setVolume( device, zone, volume );
		}

		onActionSetVolumeStep( device, zone, volumeChange ) {
			device.log( "Action called: setVolumeStep" );
			device.setVolumeStep( device, zone, volumeChange );
		}

		onActionChangeInput( device, zone, input ) {
			device.log( "Action called: changeInput" );
			device.changeInputSource ( device, zone, input );
		}

// Note: customCommand affects all zones for a device, so you can run a customCommand from Zone2 and it will run just as if it was run from mainZone
		onActionCustomCommand( device, command ) {
			device.log( "Action called: customCommand" );
			command += "\r";
			device.sendCommand ( device, command );
		}

		getState () {
			this.log( "Getting device status" );
// whole unit
			this.sendCommand ( this, "PW?\r" );
// main zone
			this.sendCommand ( this, "ZM?\r" );				// Zone Main On?
			this.sendCommand ( this, "MV?\r" );				// Main Volume?
// zone 2 if applicable
			if ( this.getSettings().settingZone2 ) {
				this.sendCommand ( this, "Z2?\r" );
			}
// zone 3 if applicable
			if ( this.getSettings().settingZone3 ) {
				this.sendCommand ( this, "Z3?\r" );
			}
		}

		parseResponse ( device ) {
			let id = device.getData().id;
			let receivedData = devices[id].receivedData;
			device.log( "Parsing response, receivedData: " + receivedData);
			if (receivedData.indexOf( "PWON" ) >= 0) {
				device.setCapabilityValue( "onoff", true);
				device.log( "parseResponse: set onoff true" );
			}
			if (receivedData.indexOf( "PWSTANDBY" ) >= 0) {
				device.setCapabilityValue( "onoff", false);
				device.log( "parseResponse: set onoff false" );
			}
			if (receivedData.indexOf( "MVMAX" ) >= 0) {
                var max = receivedData.lastIndexOf( "MVMAX" );
                var maxSlice = receivedData.slice(max);
                var maxRes = maxSlice.split( ";" );
				MVMax = maxRes[0].substr(6,2);			// ignore possible third digit
				device.log( "parseResponse: found MVMAX of " + MVMax);
				let id = device.getData().id;
				devices[id].MVMax = MVMax;
			}
// Run a Regular Expression to find the first Main Volume response (if any)
			var MVRegEx = /MV(\d){2}/;
			var MainVolumeFound = MVRegEx.exec(receivedData);
			if (MainVolumeFound) {
				var MainVolumeNumber = MainVolumeFound[0].substr(2,2);
				var MainVolume = MainVolumeNumber / MVMax;
				device.setCapabilityValue( "volume_set", MainVolume);
				device.log( "parseResponse: set setVolume " + MainVolume);
			}
// done with the receivedData, clear it for the next responses
			devices[id].receivedData = "";
		}

		powerOn ( device, zone ) {
			// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
			var command = "PWON\r";
			switch ( zone ) {
				case "Whole unit":
					command = "PWON\r";
					break;
				case "Main Zone":
					command = "ZMON\r";
					break;
				case "Zone2":
                    command = "Z2ON\r";
					break;
			}
			device.sendCommand ( device, command );
		}

		powerOff ( device, zone ) {
			// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
			var command = "PWSTANDBY\r";
			switch ( zone ) {
				case "Whole unit":
					command = "PWSTANDBY\r";
					break;
				case "Main Zone":
					command = "ZMOFF\r";
					break;
				case "Zone2":
                    command = "Z2OFF\r";
					break;
			}
			device.sendCommand ( device, command );
		}

		mute ( device, zone ) {
			// supported zones: "Main Zone" (default), "Zone2", "Zone3"
			var command = "MUON\r";
			switch (zone) {
				case "Main Zone":
					command = "MUON\r";
					break;
				case "Zone2":
					command = "Z2MUON\r";
					break;
				case "Zone3":
                    command = "Z3MUON\r";
					break;
			}
			device.sendCommand ( device, command );
		}

		unMute ( device, zone ) {
			// supported zones: "Main Zone" (default), "Zone2", "Zone3"
			var command = "MUOFF\r";
			switch (zone) {
				case "Main Zone":
					command = "MUOFF\r";
					break;
				case "Zone2":
					command = "Z2MUOFF\r";
					break;
				case "Zone3":
                    command = "Z3MUOFF\r";
					break;
			}
			device.sendCommand ( device, command );
		}

		setVolume ( device, zone, targetVolume ) {
		// volume ranges from 00 to 99
		// apparently half steps are possible but not used here, eg 805 is 80.5
		// according to Marantz protocol some models have 99 as --, some have 00 as --
			var asciiVolume = "0" + targetVolume.toString();
			var asciiVolume = asciiVolume.slice( -2 );
		// supported zones: "Main Zone" (default), "Zone2", "Zone3"
			var volumeZone = "MV";
			switch (zone) {
				case "Main Zone":
					volumeZone = "MV";
					break;
				case "Zone2":
					volumeZone = "Z2";
					break;
				case "Zone3":
					volumeZone = "Z3";
					break;
			}
			var command = volumeZone + asciiVolume + "\r";
			device.sendCommand ( device, command );
		}

		setVolumeStep ( device, zone, volumeChange ) {
			// Step up or down the volume. Argument volumeChange is the difference (e.g. +10 is 10 steps up or -5 is 5 steps down)
			var upOrDown = null;
			if(volumeChange > 0) {
				upOrDown = "UP";
			}
			if(volumeChange < 0) {
				upOrDown = "DOWN";
			}
			if(upOrDown !== null) {
				// supported zones: "Main Zone" (default), "Zone2", "Zone3"
				var volumeZone = "MV";
				switch (zone) {
					case "Main Zone":
						volumeZone = "MV";
						break;
					case "Zone2":
						volumeZone = "Z2";
						break;
					case "Zone3":
						volumeZone = "Z3";
						break;
				}
				var command = volumeZone + upOrDown + "\r";
				for ( var i = 0; i < Math.abs( volumeChange ); i++ ) {
						setTimeout(	device.sendCommand, (i * 750), device, command);
					}
				}
			}

        volumeUp ( device, zone ) {
            var volumeZone = "MV";
            switch (zone) {
                case "Main Zone":
                    volumeZone = "MV";
                    break;
                case "Zone2":
                    volumeZone = "Z2";
                    break;
                case "Zone3":
                    volumeZone = "Z3";
                    break;
				}
            var command = volumeZone + "UP\r";
            device.sendCommand ( device, command );
        }

        volumeDown ( device, zone ) {
            var volumeZone = "MV";
            switch (zone) {
                case "Main Zone":
                    volumeZone = "MV";
                    break;
                case "Zone2":
                    volumeZone = "Z2";
			        break;
                case "Zone3":
                    volumeZone = "Z3";
			        break;
			}
            var command = volumeZone + "DOWN\r";
            device.sendCommand ( device, command );
        }

        changeInputSource ( device, zone, input ) {
            // supported zones: "Main Zone" (default), "Zone2", "Zone3"
            var sourceZone = "SI";
                switch (zone) {
                    case "Main Zone":
                        sourceZone = "SI";
                        break;
                    case "Zone2":
                        sourceZone = "Z2";
                        break;
                    case "Zone3":
                        sourceZone = "Z3";
                        break;
                }
            var command = sourceZone + input + "\r";
            device.sendCommand ( device, command );
        }

    //

	    sendCommand ( device, command ) {
            let settings = device.getSettings();
            let hostIP = settings.settingIPAddress;
            let id = device.getData().id;
            let client = devices[id].client;

            // for logging strip last char which will be the newline \n char
            let displayCommand=command.substring(0, command.length -1);
	    	device.log ( "Sending " + displayCommand + " to " + device.getName() + " at " + hostIP );

            // check if client (net.Socket) already exists, if not then open one.
            if ( ( typeof( client ) === "undefined" ) || ( typeof( client.destroyed ) != "boolean") || ( client.destroyed == true )) {
                device.log ( "Opening new net.Socket to " + hostIP + ":" + telnetPort );
                client = new net.Socket();
                client.connect(telnetPort, hostIP);
                // add handler for any response or other data coming from the device
                client.on( "data", function (data) {
                    let tempData = data.toString().replace(/\r/g, ";");
                    devices[id].receivedData += tempData;
                    device.log( "Got data: " + tempData + " -- receivedData: " + devices[id].receivedData );
                    device.parseResponse(device);
                });
                client.on( "error", function (err) {
                    device.log( "IP socket error: " + err.message );
                    if ( typeof (client.destroy) == "function" ) {
                        client.destroy();
                    }
                });
                devices[id].client = client;
            }

            client.write(command);
	    }

        searchForInputsByValue ( value ) {
			// for now, consider all known Marantz/Denon inputs
            var possibleInputs = allPossibleInputs;
            var tempItems = [];
            for ( var i = 0; i < possibleInputs.length; i++ ) {
                var tempInput = possibleInputs[i];
                if ( tempInput.friendlyName.indexOf(value) >= 0 ) {
                    tempItems.push({ icon: "", name: tempInput.friendlyName, description: "", inputName: tempInput.inputName });
                }
            }
            return tempItems;
        }

        availableZones ( device, value ) {
            var possibleZones = [];
            var settings = device.getSettings();
            if ( settings.settingZoneMain ) {
                possibleZones.push ( { icon: "", name: "Main Zone", description: "", zone: "Main Zone" } );
            }
            if ( settings.settingZone2 ) {
                possibleZones.push ( { icon: "", name: "Zone 2", description: "", zone: "Zone2" } );
            }
            if ( settings.settingZone3 ) {
                possibleZones.push ( { icon: "", name: "Zone 3", description: "", zone: "Zone3" } );
            }
            return possibleZones;
        }
}

module.exports = DMDevice;
