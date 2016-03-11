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
const chanDetectPeriod = 1000;
const chanPulseDuration = 100;

// GPIO ports
var GPIO = require('onoff').Gpio
var chanGPIO = new GPIO(channelPin,'in');

var isChannel1 = function() {
}

var switchChanTo1 = function() {
}

var switchChanTo = function(channel) {

}

var lower = function() {
}

var raise = function() {
}

exports.allRaise = function() {
    switchChanTo(allBlindsChan);
    raise();
}

exports.allLower = function() {
    switchChanTo(allBlindsChan);
    lower();
}

exports.doorRaise = function() {
    switchChanTo(doorChan);
    raise();
}

exports.doorLower = function() {
    switchChanTo(doorChan);
    lower();
}

exports.livingRoomRaise = function() {
    switchChanTo(livingRoomChan);
    raise();
}

exports.livingRoomdoorLower = function() {
    switchChanTo(livingRoomChan);
    lower();
}

function pulse(gpio, next) {
    //Set gpio.gpioPin output, low;
    console.log("pulse(): setting gpio: " + gpio.gpioPin + " to low");
    chanGPIO.setDirection('out');
    chanGPIO.write(0); 
    var err; // = "oops";

    //setTimeout(setHighZ(err), gpio.duration);
    setTimeout(setHighZ, gpio.duration, err, gpio);

    function setHighZ(err, gpio) {
	// Set gpio.gpioPin input;
	if (err) { return next(err); }
	
	console.log("pulse(): setting gpio: " + gpio.gpioPin + " to high-Z");
    	chanGPIO.setDirection('in');
	setTimeout(next, gpio.duration, err);
    }
}
// desired = {blind: "door/familyroom/all", direction: "up/down"}
function blindsActivate(desired, next) {
    findChannelFive();

    function selectChannel() {
	if (desired.blind == "all") {
	} else if (desired.blind == "door") {
	} else {
	}
    }
    function chanTwoActive(desired, err) {
	pulse({gpioPin: channelpin, duration: chanPulseDuration}, function activate() {
	});
    }

    function switchChannel(chanDiff, correctChannel) {
	if (chanDiff == 0) { return correctChannel(); }
	pulse({gpioPin: channelpin, duration: chanPulseDuration}, function() {
	    switchChannel(chanDiff - 1, correctChannel);
	});
    }
}

function findChannelFive(next) {
    var chOneCnt = 0, chTwoCnt = 0;
    // Set edge count callbacks

    // Pulse channel select
    pulse( {gpioPin: channelPin, duration: chanPulseDuration}, function detPause() {
	setTimeout(detectCh5, chanDetectPeriod);
    });
    // and wait for flashes

    // Check if in channel 5
    function detectCh5(){
	if (chOneCnt > 1 && chTwoCnt > 1) {
	    next();
	} else {
	    findChannelFive(next);
	}
    }
    // Pulse channel select
}

function test() {
    pulse({gpioPin: channelPin, duration: chanPulseDuration}, function(err) {
	if (err) {
	    console.log("test(): pulse produced error: " + err);
	} else {
	    console.log("test(): finished pulsing");
	}
    });
    findChannelFive( function(){
	console.log("findChannel5(): scanning");
    });
}

test()
