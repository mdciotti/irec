import React from 'react';
import { setInterval, clearInterval } from 'timers';
import StatusItem from '../StatusItem';

export default class Clock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: new Date()
        };
    }

    componentDidMount() {
        this.timerID = setInterval(this.tick.bind(this), 1000);
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    getDateString() {
        return this.state.date.toLocaleDateString();
    }

    getTimeString() {
        return this.state.date.toLocaleTimeString();
    }

    tick() {
        this.setState({ date: new Date() })
    }

    render() {
        return (
            <StatusItem label={this.getDateString()} value={this.getTimeString()} style={{ textAlign: 'right' }} />
        );
    }
}
