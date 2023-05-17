import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import ReactMapGL from 'react-map-gl';
import DeckGL, { LineLayer, ScatterplotLayer } from 'deck.gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const GRAVITY = -9.81e1;

export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mapStyle: 'mapbox://styles/mapbox/satellite-v9',
            follow: false,
            history: 100,
            mapboxApiAccessToken: '',
            viewport: {
                width: 400,
                height: 400,
                latitude: 32.990312,
                longitude: -106.975241,
                zoom: 13,
                pitch: 60,
                bearing: 0
            },
            data: [],
            segments: [],
            trajectory: []
        };
        this.$parent = null;
    }

    /**
     * Estimates the current velocity using a sampling window of the past n data points.
     */
    calculateVelocity() {
        const v = [0, 0, 0];
        const n = 10;

        let k_sum = 0;
        for (let i = 0; i < n; i++) {
            if (this.state.segments.length - 1 - i < 0) break;
            const seg = this.state.segments[this.state.segments.length - 1 - i];
            if (typeof seg === 'undefined') break;

            // Using linear falloff
            const k = 1 - i / n;
            v[0] += k * (seg.targetPosition[0] - seg.sourcePosition[0]) / seg.dt;
            v[1] += k * (seg.targetPosition[1] - seg.sourcePosition[1]) / seg.dt;
            v[2] += k * (seg.targetPosition[2] - seg.sourcePosition[2]) / seg.dt;
            k_sum += k;
        }
        
        // normalize
        v[0] /= k_sum;
        v[1] /= k_sum;
        v[2] /= k_sum;

        return v;
    }

    calculateTrajectory() {
        const newTrajectory = [];
        const seg = this.state.segments[this.state.segments.length - 1];
        const start_lon = seg.targetPosition[0];
        const start_lat = seg.targetPosition[1];
        const start_alt = seg.targetPosition[2];
        // const v_lon = (seg.targetPosition[0] - seg.sourcePosition[0]) / seg.dt;
        // const v_lat = (seg.targetPosition[1] - seg.sourcePosition[1]) / seg.dt;
        // const v_alt = (seg.targetPosition[2] - seg.sourcePosition[2]) / seg.dt;
        const velocity = this.calculateVelocity();

        const dt = 1 / 10;
        const p = [start_lon, start_lat, start_alt];
        // const v = [v_lon, v_lat, v_alt];
        const v = [...velocity];
        while (p[2] > 0) {
            const sp = [...p];
            p[0] += velocity[0] * dt;
            p[1] += velocity[1] * dt;
            p[2] = p[2] + (v[2] + 0.5 * GRAVITY * dt) * dt;
            v[2] = v[2] + GRAVITY * dt;
            newTrajectory.push({
                sourcePosition: sp,
                targetPosition: [...p],
                color: [0, 128, 255]
            });
        }

        this.setState({ trajectory: newTrajectory });
    }

    componentDidMount() {
        this.$parent = ReactDOM.findDOMNode(this).parentElement;
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();

        this.props.socket.on('mapbox token', (mapbox_token) => {
            this.setState({ mapboxApiAccessToken: mapbox_token });
            console.log('received mapbox token', mapbox_token);
        });

        this.props.socket.on('gps data', (gps_data) => {
            const newData = [...this.state.data];
            newData.push(gps_data);
            if (newData.length > this.state.history) {
                newData.shift();
            }
            this.setState({ data: newData });

            if (newData.length > 2) {
                const sp = newData[newData.length - 2];
                const tp = gps_data;
                const newSegments = [...this.state.segments];
                newSegments.push({
                    sourcePosition: [sp.lon, sp.lat, sp.alt],
                    targetPosition: [tp.lon, tp.lat, tp.alt],
                    color: [255, 255, 255],
                    dt: (new Date(tp.time).getTime() - new Date(sp.time).getTime()) / 1000
                });
                if (newSegments.length > this.state.history) {
                    newSegments.shift();
                }
                this.setState({ segments: newSegments });
                this.calculateTrajectory();
            }

            if (this.state.follow) {
                this.setState({
                    viewport: {
                        ...this.state.viewport,
                        latitude: gps_data.lat,
                        longitude: gps_data.lon
                    }
                });
            }
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize.bind(this));
    }

    resize() {
        this.setState({
            viewport: {
                ...this.state.viewport,
                width: this.$parent.offsetWidth,
                height: this.$parent.offsetHeight
            }
        });
    }

    render() {
        const lastDataPoint = this.state.data[this.state.data.length - 1];
        const layers = [
            new ScatterplotLayer({
                id: 'points',
                data: lastDataPoint ? [lastDataPoint] : [],
                radiusScale: 1,
                getPosition: d => [d.lon, d.lat, d.alt],
                getColor: d => [200, 16, 46],
                getRadius: d => 100
            }),
            new LineLayer({
                id: 'flight-path',
                data: this.state.segments,
                strokeWidth: 5
            }),
            new LineLayer({
                id: 'trajectory',
                data: this.state.trajectory,
                strokeWidth: 5
            })
        ];
        
        if (this.state.mapboxApiAccessToken === '') {
            return (<div/>);
        }

        return (
            <ReactMapGL
                {...this.state.viewport}
                mapStyle={this.state.mapStyle}
                onViewportChange={viewport => this.setState({ viewport })}
                mapboxApiAccessToken={this.state.mapboxApiAccessToken}
            >
                <DeckGL
                    {...this.state.viewport}
                    layers={layers}
                />
            </ReactMapGL>
        );
    }
}

Map.propTypes = {
    socket: PropTypes.any.isRequired
};
