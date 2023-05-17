import React from 'react';

import StatusItem from './StatusBar/StatusItem';
import Clock from './StatusBar/StatusItem/Clock';
import SerialDevice from './StatusBar/StatusItem/SerialDevice';
import BaudRate from './StatusBar/StatusItem/BaudRate';

function StatusBar(props) {
    return (
        <div className="dash-statusbar">
            <SerialDevice socket={props.socket} />
            <BaudRate socket={props.socket} />
            <StatusItem label="RSSI" value="-90dBm" />
            <div className="flex-space" />
            <Clock />
        </div>
    );
}

export default StatusBar;
