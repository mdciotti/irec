import React from 'react';
import StatusItem from '../StatusItem';

export default class BaudRate extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 9600,
            options: [
                1200,
                2400,
                4800,
                9600,
                19200,
                38400,
                76800,
                115200
            ]
        };
    }

    componentDidMount() {
        this.props.socket.on('baud rate', (baudRate) => {
            console.log('Baud rate:', baudRate, typeof baudRate);
            this.setState({ value: baudRate });
        });
    }

    onSelect(event) {
        const val = parseInt(event.target.value, 10);
        this.setState({ value: val });
        console.log('Setting baud rate:', val);
        this.props.socket.emit('set baud', val);
    }

    render() {
        return (
            <StatusItem
                label="Baud Rate"
                value={
                    <select onChange={this.onSelect} defaultValue={this.state.value}>
                        { this.state.options.map(opt => <option key={opt}>{opt}</option>) }
                    </select>
                }
            />
        );
    }
}
