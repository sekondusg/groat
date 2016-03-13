# groat

Welcome to Groat, a small coin in the realm of IoT.

Introduction
============

Connected Home Automation devices are more and more common and available with a wide variety of features. For example the Amazon Echo is available to do voice activation of lights. The Samsung Smartthings Hub can tie together Lighting control and cameras. Each HA platform integrates well with a subset of the automatable products in the market. There are gaps though, the integration of many products are either non-existant or very expensive. There is also little support for custom hardware interfaces.

Purpose
=======
Grout bridges the gap between custom hardware based HA controllers and the Cloud of accessable interfaces.


Design
======

Grout uses distributed feedback control for HA via the AWS IoT platform. The AWS IoT platform is accessable via REST interfaces through AWS Lambda.


Deployment
==========
Launch web-app agent with:
node groat.js -F config.js -f $HOME/certs -g us-west-2 -t 1

Launch device agent with:
node groat.js -F config.js -f $HOME/certs -g us-west-2 -t 2

Troubleshooting Steps
=====================

Issues
======

Resources
=========

Log
===

### 2016.03.12
 * Somfy hardware integration is testing correctly. Interface is using continuation passing style throughout.

### 2016.03.08
 * Developing algorithm to select the Somfy channel. The trick is to get into a known state. Will probably count edges on the LED indicators which flash when changing channels.
 * Another idea is to simply power-cycle the Somfy remote to get back into a known state. Assuming the remote will startup quickly and be in a known state (channel 1) -- need to experiment with this to see if feasible. -- Would need to control power to the remote via a PMOS FET, this will have its own voltage drop through Rds_on and the Somfy operating current -- need to calculate this and be sure the Somfy Vdd requirements are met.
 * There are more than a few GPIO pins left on the Raspberry Pi.
 * The channel select button flashes the LED of the current channel at ~4 Hz on the first press. If pressed again within ~6 s, the channel advances to the next (1-5, then back to 1)
 * Scraped-away solder mask and soldered leads onto cathode side traces for LEDs for channels 1 and 2.
 * LEDs are connected with the anode at Vss and the cathode connected through a current limiting resistor to the Somfy uC. The uC brings its IO line to Vdd to activate the LED.
 
### 2016.03.07
 * Creation date. The basic flow via MQTT topics with AWS IoT is working.
 * Wiring the Somfy remote to a Raspberry Pi is testing successfully. Only staight interconnects were required (no pull-up, or buffering needed)
 * Using Node.js "onoff" library to interface with Raspberry Pi hardware
 * Ran-into a permissions problem for the GPIO device files. The 'pi' account is a member of the gpio group, but the gpio group write permission does not have full access to the OS dev nodes for GPIO ports. Manually chmod'd/chgrp'd as a work-around.
 * Should add a permissions setting project 'bootstrap' script to the project.
 * Followed [the Adafruit Node.js Embedded Dev on Raspberry Pi](https://learn.adafruit.com/node-embedded-development/events) to learn about the "onoff" library



