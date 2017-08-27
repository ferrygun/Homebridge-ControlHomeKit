var Service, Characteristic;
var request = require("request");
var BBCMicrobit = require('bbc-microbit')
var microbit1 = 'd681eeeafea8';
var microbit2 = 'eeb622f94613';
var BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

var ON = new Buffer('1F1F1F1F1F', 'hex');
var OFF = new Buffer('0000000000', 'hex');
//Destination
function Destination(microbit2, cb) {

  BBCMicrobit.discoverById(microbit2, function(microbit2) {
    console.log('\tFound a microbit: id = %s, address = %s', microbit2.id, microbit2.address);

    microbit2.on('disconnect', function() {
      console.log('\tmicrobit disconnected!');
      process.exit(0);
    });

    console.log('connecting to microbit2');
    microbit2.connectAndSetUp(function() {
      console.log('\tconnected to microbit2');

            
    });

     cb(microbit2);

  });
}


//Source
function Source(microbit1, switchService, Destination, cb) {

  BBCMicrobit.discoverById(microbit1, function(microbit1) {
    console.log('\tFound a microbit: id = %s, address = %s', microbit1.id, microbit1.address);

    microbit1.on('disconnect', function() {
      console.log('\tmicrobit disconnected!');
      process.exit(0);
    });

    microbit1.on('buttonAChange', function(value) {
      console.log('\ton -> microbit1 button A change: ', BUTTON_VALUE_MAPPER[value]);
      if(value == 1)
        this.on = !this.on;
                
       switchService.setCharacteristic(Characteristic.On, this.on);
       if(this.on) 
        Destination.writeLedMatrixState(ON, function() {
         console.log('\tpattern sent');
        });
       else
        Destination.writeLedMatrixState(OFF, function() {
         console.log('\tpattern sent');
        });

    });

    microbit1.on('buttonBChange', function(value) {
      console.log('\ton -> microbit1 button B change: ', BUTTON_VALUE_MAPPER[value]);
    });

    console.log('connecting to microbit1');
    microbit1.connectAndSetUp(function() {
      console.log('\tconnected to microbit1');

      // to only subscribe to one button use:
      //   microbit.subscribeButtonA();
      // or
      //   microbit.subscribeButtonB();
      microbit1.subscribeButtons(function() {
        //console.log('\tsubscribed to buttons');
      });
    });

    cb();

  });
}

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-microbit", "Microbit", microbitAccessory);
};


function microbitAccessory(log, config) {
    this.log = log;

    this.status_on = config["status_on"];
    this.status_off = config["status_off"];
    this.service = config["service"] || "Switch";
    this.name = config["name"];
    this.brightnessHandling = config["brightnessHandling"] || "no";

    this.isOn = false;
}


microbitAccessory.prototype = {

    getState: function(callback) {
        console.log('getState');
        return callback(null, this.isOn);
    },

    setState: function(value, callback) {
        console.log('setState');
        this.isOn = value;
        callback();
    },

    identify: function(callback) {
        this.log("Identify requested!");
        callback(); 
    },

    getServices: function() {

        // you can OPTIONALLY create an information service if you wish to override
        // the default values for things like serial number, model, etc.
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "micro:bit")
            .setCharacteristic(Characteristic.Model, "micro:bit")
            .setCharacteristic(Characteristic.SerialNumber, "FD18");

            this.switchService = new Service.Switch(this.name);

            this.switchService
                .getCharacteristic(Characteristic.On)
                .on('get', this.getState.bind(this))
                .on('set', this.setState.bind(this));

            var switchService_ = this.switchService;

            Destination(microbit2, function(returnValue) {
                Source(microbit1, switchService_, returnValue, function(returnValue) {
                });
            });

                               
                         

        return [informationService, this.switchService];
        
    }
};