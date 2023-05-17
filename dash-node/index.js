const http = require('http');
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const SerialPort = require('serialport');
const GPS = require('gps');
const dotenv = require('dotenv');
const nmea_data = require('./gps-sim.js');

dotenv.config();

const server_port = process.env.PORT || 3000;
const expressApp = express();
const server = http.createServer(expressApp);
server.listen(server_port, () => {
    console.log('Server listening on port %d', server_port);
});
expressApp.use(express.static(path.join(__dirname, 'dist')));

const io = socketIO(server);
const gps = new GPS();

let serial_port;
let serial_device = '';
let baud_rate = 9600;

const SIMULATED_PARABOLIC_DATA_DEVICE = "[SIMULATED] Parabolic Flight";
const gps_hz = 10;
let simulator_timer = null;
let nmea_i = 0;
function gps_tick() {
    gps.update(nmea_data[nmea_i]);
    nmea_i += 1;
    if (nmea_i >= nmea_data.length) nmea_i = 0;
}

function reset() {
    if (serial_port) serial_port.close();
    if (simulator_timer) clearInterval(simulator_timer);
    nmea_i = 0;
}

function serial_connect(socket) {
    reset();

    // Handle special cases: no device, simulated device
    if (serial_device === '') return;
    if (serial_device === SIMULATED_PARABOLIC_DATA_DEVICE) {
        console.log('simulating parabolic flight');
        simulator_timer = setInterval(gps_tick, 1000 / gps_hz);
        return;
    }

    serial_port = new SerialPort(serial_device, { baudRate: baud_rate });
    const parser = serial_port.pipe(new SerialPort.parsers.Readline({ delimiter: '\r\n' }));

    socket.emit('status', `Connected to serial device ${serial_device}`);

    serial_port.on('error', (err) => {
        // console.log('Error:', err.message);
        socket.emit('serial error', err);
    });

    parser.on('data', (data) => {
        // console.log('Received data:', data.toString());
        // socket.emit('data', data.toString());
        // TODO: determine data type
        gps.update(data);
    });
}

gps.on('data', (data) => {
    // console.log('gps data:', gps.state);
    // socket.emit('data', 'test');
    io.sockets.emit('gps data', data);
});

io.on('connection', (socket) => {
    if (serial_port) serial_port.close();

    console.log('new connection');
    console.log('sent baud rate');
    socket.emit('baud rate', baud_rate);
    socket.emit('mapbox token', process.env.MAPBOX_TOKEN);
    console.log('sent mapbox token');

    SerialPort.list().then((ports) => {
        console.log('sent serial ports');
        ports.unshift({ "comName": '' });
        ports.push({ 'comName': SIMULATED_PARABOLIC_DATA_DEVICE });
        socket.emit('serial ports', ports);
    });

    socket.on('select port', (device) => {
        console.log('selecting port', device);
        serial_device = device;
        serial_connect(socket);
    });

    socket.on('set baud', (baud) => {
        console.log('setting baud', baud);
        baud_rate = baud;
        serial_connect(socket);
    });

    socket.on('disconnect', () => {
        reset();
        console.log('client disconnected: closing serial port');
    });
});
