import React from 'react';

function StatusItem(props) {
    return (
        <div className="status-item" style={props.style}>
            <div className="status-item-value">
                {props.value}
            </div>
            <div className="status-item-label">
                {props.label}
            </div>
        </div>
    );
}

export default StatusItem;
