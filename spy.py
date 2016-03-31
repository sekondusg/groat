import paho.mqtt.client as paho
import os
import socket
import ssl

def on_connect(client, userdata, flags, rc):
    print("Connection returned result: " + str(rc) )
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("#" , 1 )

def on_message(client, userdata, msg):
    print("topic: "+msg.topic)
    print("payload: "+str(msg.payload))

def on_log(client, userdata, level, msg):
    #print(str(msg.topic)+" "+str(msg.payload))
    print("msg: " + str(msg))

mqttc = paho.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message
mqttc.on_log = on_log

awshost = "A3LYBV9V64FKOF.iot.us-west-2.amazonaws.com"
awsport = 8883
clientId = "blinds"
thingName = "blinds"
caPath = "../certs/root-CA.crt"
certPath = "../certs/cert.pem"
keyPath = "../certs/privateKey.pem"

mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)

mqttc.connect(awshost, awsport, keepalive=60)

mqttc.loop_forever()
