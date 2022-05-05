// Copyright (c) 2022 SanCloud Ltd
// SPDX-License-Identifier: Apache-2.0

module.exports = function(RED) {
    function SensorNode(config) {
        RED.nodes.createNode(this,config);
        this.location = config.geofilelocation;
        this.sensor = config.sensor;
        var node = this;
        node.on('input', function(msg) {
                msg.payload = getDataValue(getLocation(node.sensor),node.sensor);
                node.send(msg);
        });
        
    }
    RED.nodes.registerType("get sensor values",SensorNode);
}

function getDataValue(location, sensorType) {
    var filenameList = [];
    if (sensorType == "Geo") {
        filenameList = ["in_accel_x_raw", "in_accel_y_raw", "in_accel_z_raw","in_anglvel_x_raw", "in_anglvel_y_raw", "in_anglvel_z_raw","in_accel_scale","in_anglvel_scale"];
    } else if (sensorType == "Temp") {
        filenameList = ["in_pressure_raw", "in_pressure_scale", "in_temp_offset","in_temp_raw", "in_temp_scale"];
    }
    
    var jsonPayloadString = "{";
    for (filename in filenameList) {
        data = getData(location + "/" +filenameList[filename]);
        jsonPayloadString += '"'+filenameList[filename]+'":"'+data+'",';
    }
    jsonPayloadString = jsonPayloadString.slice(0, -1)+"}";
    const json = JSON.parse(jsonPayloadString);
    var jsonPayload = {};
    if (sensorType == "Temp") {
        var pressure = (json.in_pressure_raw * json.in_pressure_scale) * 10;
        var temp = (parseInt(json.in_temp_offset) + parseInt(json.in_temp_raw)) * (json.in_temp_scale / 1000);
        jsonPayload = {"Pressure" : pressure , "Temperature" : temp};
    } else if (sensorType == "Geo") {
        var Accel_X = json.in_accel_x_raw * json.in_accel_scale;
        var Accel_Y = json.in_accel_y_raw * json.in_accel_scale;
        var Accel_Z = json.in_accel_z_raw * json.in_accel_scale;
        var Angle_X = json.in_anglvel_x_raw * json.in_anglvel_scale;
        var Angle_Y = json.in_anglvel_y_raw * json.in_anglvel_scale;
        var Angle_Z = json.in_anglvel_z_raw * json.in_anglvel_scale;
        jsonPayload = {"Acceleration_X":Accel_X,"Acceleration_Y":Accel_Y,"Acceleration_Z":Accel_Z,"Angle_X":Angle_X,"Angle_Y":Angle_Y,"Angle_Z":Angle_Z};
    }
    return jsonPayload;
}

function getData (location) {
        const fs = require('fs')
            try {
                const data = fs.readFileSync(location, 'utf8')
                return data.trim();
            } catch (err) {
                return data.trim();
            }
    }

function getLocation(sensorType) {
    var dataLocation = "/sys/bus/iio/devices"
    var fs = require('fs');
    var files = fs.readdirSync(dataLocation);
    var sensorTypeWant;
    if (sensorType == "Geo") {
        sensorTypeWant = "mpu6050";
    } else if (sensorType == "Temp") {
        sensorTypeWant = "lps331ap";
    }
    
    for (file in files) {
        filesLocation = dataLocation+"/"+files[file]
        var fileValue = getData(filesLocation+"/name");
        if (fileValue == sensorTypeWant) {
            return filesLocation;
        }
    }
}