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

var isChannel1 = function() {
}

var switchChanTo1 = function() {
}

var switchChanTo = function(channel) {

}

exports.allRaise = function() {
    var err;
    doBlinds(err, {desired: allBlindsChan, current: null}, 'raise');
}

exports.allLower = function() {
    var err;
    doBlinds(err, {desired: allBlindsChan, current: null}, 'lower');
}

exports.doorRaise = function() {
    var err;
    doBlinds(err, {desired: doorBlindChan, current: null}, 'raise');
}

exports.doorLower = function() {
    var err;
    doBlinds(err, {desired: doorBlindChan, current: null}, 'lower');
}

exports.livingroomRaise = function() {
    var err;
    doBlinds(err, {desired: livingRoomBlindChan, current: null}, 'raise');
}

exports.livingroomdoorLower = function() {
    var err;
    doBlinds(err, {desired: livingRoomBlindChan, current: null}, 'lower');
}

function pulse(gpio, next, err, args) {
    //Set gpio.gpioPin output, low;
    //console.log("pulse(): setting gpio: " + gpio.gpioPin + " to low");
    chanGPIO.setDirection('out');
    chanGPIO.write(0); 
    var err; // = "oops";

    //setTimeout(setHighZ(err), gpio.duration);
    setTimeout(setHighZ, gpio.duration, err, gpio);

    function setHighZ(err, gpio) {
	// Set gpio.gpioPin input;
	if (err) { return next(err); }
	
	//console.log("pulse(): setting gpio: " + gpio.gpioPin + " to high-Z");
    	chanGPIO.setDirection('in');
	setTimeout(next, gpio.duration, err, args);
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
    channel.current = 0;

    ch1LEDGPIO.watch(countLED1Flash);
    ch2LEDGPIO.watch(countLED2Flash);

    findChannelFive(err, channel, advanceChannel);

    function advanceChannel(err, channel) {
	if (err) { return next(err, channel); }
	if (channel.current == channel.desired) { return cleanup(err, channel); }
	channel.current = channel.current + 1;
	pulse({gpioPin: channelPin, duration: chanPulseDuration}, advanceChannel, err, channel);
    }

    function cleanup(err, channel) {
	if (err) { next(err, channel); }
	ch1LEDGPIO.watch(countLED1Flash);
	ch2LEDGPIO.watch(countLED2Flash);
	console.log("cleanup()");
	return next(err, args);
    }
}


function doBlinds(err, channel, action) {
    if (err) { return report(err); }
    
    selectChannel(channel, activateBlinds, err, action);

    function activateBlinds(err, action) {
	if (err) { return next(err, args); }
	if (action == 'raise') {
	    console.log("doBlinds(): raising blinds on channel: " + channel);
	    pulse({gpioPin: upPin, duration: chanPulseDuration}, next, err, args);
	} else if (action == 'lower') {
	    console.log("doBlinds(): raising blinds on channel: " + channel);
	    pulse({gpioPin: downPin, duration: chanPulseDuration}, next, err, args);
	} else {
	    err = "activateBlinds(): unknown action: " + action;
	}
	report(err);
    }

    function report(err) {
	if (err) { return console.log("ERROR: " + err); }
	console.log("doBlinds(): action: " + action + ", channel: " + JSON.stringify(channel));
    }
}

function test() {
    exports.doorRaise();
    setTimeout(exports.doorLower, 6000);
    
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

test()
