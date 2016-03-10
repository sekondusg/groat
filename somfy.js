
// Control pins

const upPin = 4;
const downPin = 5;
const channelPin = 6;

// Indicator pins

const chan1Pin = 7;
const chan2Pin = 8;


// Counters for number of flashes on LEDs

var ch1FlashCount = 0;
var ch2FlashCount = 0;


// Somfy Channels

const doorBlindChan = 2;
const livingRoomBlindChan = 2;
const allBlindsChan = 4;

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

function pulse(gpio, cb) {
    //Set gpio.gpioPin output, low;
    console.log("pulse(): setting gpio: " + gpio.gpioPin + " to low");
    setTimeout(function() {
	// Set gpio.gpioPin input;
	console.log("pulse(): setting gpio: " + gpio.gpioPin + " to high-Z");
	setTimeout(cb, gpio.duration);
    }, gpio.duration);
}

function test() {
    pulse({gpioPin: 4, duration: 500}, function() {
	console.log("test(): finished pulsing");
    });
}

test()
