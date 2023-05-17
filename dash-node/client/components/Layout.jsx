import React from 'react';

import Map from './Map';
import StatusBar from './StatusBar';

export default class Layout extends React.Component {
    constructor() {
        super();
        this.state = {};
    }

    componentDidMount() {
        // $layout = ReactDOM.findDOMNode(this);
    }

    render() {
        return (
            <div className="dash">
                <div className="dash-row">
                    <Map socket={this.props.socket} />
                </div>
                <StatusBar socket={this.props.socket} />
            </div>
        );
    }
}
