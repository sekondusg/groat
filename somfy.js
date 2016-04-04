// Control pins

const upPin = 5;
const downPin = 6;
const channelPin = 4;

// Indicator pins

const chan1Pin = 17;
const chan2Pin = 27;


// Counters for number of flashes on LEDs

var ch1FlashCount = 0;
var ch2FlashCount = 0;


// Somfy Channels

const doorBlindChan = 2;
const livingRoomBlindChan = 3;
const allBlindsChan = 4;

// Time Durations

const chanDisplayTimeout = 6000;
const chanDetectPeriod = 300;
const chanPulseDuration = 100;

// GPIO ports
var GPIO = require('onoff').Gpio
var chanGPIO = new GPIO(channelPin,'in');
var ch1LEDGPIO = new GPIO(chan1Pin,'in','falling');
var ch2LEDGPIO = new GPIO(chan2Pin,'in','falling');
var upGPIO = new GPIO(upPin,'in');
var downGPIO = new GPIO(downPin,'in');

var isChannel1 = function() {
}

var switchChanTo1 = function() {
}

var switchChanTo = function(channel) {

}

exports.allRaise = function(err, next) {
    doBlinds(err, {desired: allBlindsChan, reported: null}, 'raise', next);
}

exports.allLower = function(err, next) {
    doBlinds(err, {desired: allBlindsChan, reported: null}, 'lower', next);
}

exports.doorRaise = function(err, next) {
    console.log("doorRaise(): next: " + next);
    doBlinds(err, {desired: doorBlindChan, reported: null}, 'raise', next);
}

exports.doorLower = function(err, next) {
    console.log("doorLower(): next: " + next);
    doBlinds(err, {desired: doorBlindChan, reported: null}, 'lower', next);
}

exports.livingroomRaise = function(err, next) {
    doBlinds(err, {desired: livingRoomBlindChan, reported: null}, 'raise', next);
}

exports.livingroomLower = function(err, next) {
    doBlinds(err, {desired: livingRoomBlindChan, reported: null}, 'lower', next);
}

function pulse(gpioSel, next, err, args) {
    console.log("pulse(): gpioSel: " + JSON.stringify(gpioSel));
    var gpio;
    if (gpioSel.gpioPin == channelPin) {
	gpio = chanGPIO;
    } else if (gpioSel.gpioPin == upPin) {
	gpio = upGPIO;
    } else if (gpioSel.gpioPin == downPin) {
	gpio = downGPIO;
    }

    //Set gpio.gpioPin output, low;
    //console.log("pulse(): setting gpio: " + gpioSel.gpioPin + " to low");
    gpio.setDirection('out');
    gpio.write(0); 
    var err; // = "oops";

    //setTimeout(setHighZ(err), gpio.duration);
    setTimeout(setHighZ, gpioSel.duration, err, gpioSel);

    function setHighZ(err, gpioSel) {
	// Set gpio.gpioPin input;
	if (err) { return next(err); }
	
	//console.log("pulse(): setting gpio: " + gpioSel.gpioPin + " to high-Z");
    	gpio.setDirection('in');
	setTimeout(next, gpioSel.duration, err, args);
    }
}

function findChannelFive(err, channel, next) {
    // Reset edge counts
    ch1FlashCount = 0; ch2FlashCount = 0;

    // Pulse channel select
    pulse( {gpioPin: channelPin, duration: chanPulseDuration}, function detPause() {
	setTimeout(detectCh5, chanDetectPeriod);
    }, err, channel);

    // Check if in channel 5
    function detectCh5(){
	console.log("detectCh5() count: " + ch1FlashCount);
	if (ch1FlashCount > 1 && ch2FlashCount > 1) {
	    next(err, channel);
	} else {
	    findChannelFive(err, channel, next);
	}
    }
}

function countLED1Flash(err, val) {
    if (err) { return console.log("countLED1Flash() error: " + err); }
    ch1FlashCount = ch1FlashCount + 1;
    //console.log("countLED1Flash(): Flash detected, count: " + ch1FlashCount + ", val: " + val);
}

function countLED2Flash(err, val) {
    if (err) { return console.log("countLED2Flash() error: " + err); }
    ch2FlashCount = ch2FlashCount + 1;
    //console.log("countLED2Flash(): Flash detected, count: " + ch2FlashCount + ", val: " + val);
}


function selectChannel(channel, next, err, args) {
    channel.reported = 0;

    ch1LEDGPIO.watch(countLED1Flash);
    ch2LEDGPIO.watch(countLED2Flash);

    findChannelFive(err, channel, advanceChannel);

    function advanceChannel(err, channel) {
	if (err) { return next(err, channel); }
	if (channel.reported == channel.desired) { return cleanup(err, channel); }
	channel.reported = channel.reported + 1;
	pulse({gpioPin: channelPin, duration: chanPulseDuration}, advanceChannel, err, channel);
    }

    function cleanup(err, channel) {
	if (err) { next(err, channel); }
	ch1LEDGPIO.unwatch(countLED1Flash);
	ch2LEDGPIO.unwatch(countLED2Flash);
	console.log("cleanup()");
	return next(err, args);
    }
}


function doBlinds(err, channel, action, next) {
    console.log('doBlinds(): channel: ' + JSON.stringify(channel) + ', action: ' + action + ', next: ' + next);
    if (err) { return report(err); }
    
    selectChannel(channel, activateBlinds, err, action);
    

    function activateBlinds(err, action) {
	if (err) { return next(err, args); }
	if (action === 'raise') {
	    console.log("doBlinds(): raising blinds on channel: " + channel);
	    pulse({gpioPin: upPin, duration: chanPulseDuration}, report, err);
	} else if (action === 'lower') {
	    console.log("doBlinds(): lowering blinds on channel: " + JSON.stringify(channel));
	    pulse({gpioPin: downPin, duration: chanPulseDuration}, report, err);
	} else {
	    err = "activateBlinds(): unknown action: " + action;
	}
	report(err, next);
    }

    function report(err, next) {
	if (err) { return console.log("ERROR: " + err); }
	console.log("doBlinds:report(): action: " + action + ", channel: " + JSON.stringify(channel));
	next();
    }
}

function test() {
    //exports.doorLower();
    //exports.doorRaise();
    //setTimeout(exports.doorRaise, 30000);
    //setTimeout(process.exit, 15000);
    //testSelectChannel();
    
    /*
    pulse({gpioPin: channelPin, duration: chanPulseDuration}, function(err) {
	if (err) {
	    console.log("test(): pulse produced error: " + err);
	} else {
	    console.log("test(): finished pulsing");
	}
    }, err);
    */
}

function testSelectChannel() {
    var err;
    var channel = {desired: doorBlindChan, reported: null};
    selectChannel(channel, function(){
	console.log('testSelectChannel(): channel: ' + JSON.stringify(channel));
    	channel = {desired: 1, reported: null};
	setTimeout(function(){
	    selectChannel(channel, function(){
	        console.log('testSelectChannel(): channel: ' + JSON.stringify(channel));
            }, err);
	}, 5000);
    },err);
}

test()
