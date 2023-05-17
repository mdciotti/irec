import React from 'react';
import StatusItem from '../StatusItem';

export default class SerialDevice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            devices: []
        };
    }

    componentDidMount() {
        this.props.socket.on('serial ports', (serial_ports) => {
            console.log('Serial ports:', serial_ports);
            this.setDevices(serial_ports);
        });
    }

    componentWillUnmount() {}

    setDevices(deviceList) {
        this.setState({
            devices: deviceList.map(device => (
                <option
                    key={device.comName}
                    value={device.comName}
                >
                    {device.comName}
                </option>
            ))
        });
    }

    selectDevice(event) {
        const device = event.target.value;
        console.log('Selecting device:', device);
        this.props.socket.emit('select port', device);
    }

    render() {
        return (
            <StatusItem
                label="Serial Device"
                value={
                    <select onChange={this.selectDevice.bind(this)}>
                        {this.state.devices}
                    </select>
                }
            />
        );
    }
}
