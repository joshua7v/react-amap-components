import React, { Component } from 'react';
import './App.css';
import { Map } from '@joshua7v/react-amap';
import { Polygon, Circle, MouseTool } from 'react-amap-components';
import uuid from 'uuid/v4';

export default class App extends Component {
  state = {
    polygons: [],
    circles: [],
    showGeohashes: false,
    showCoverPolygons: false,
    precision: 5
  }

  render() {
    const { polygons, circles, showCoverPolygons, showGeohashes, precision } = this.state;
    const polygonProps = polygons.map(polygon => ({
      key: polygon.id,
      path: polygon.path,
      showCoverPolygons,
      showGeohashes,
      geohashPrecision: precision,
      coverPolygonsStyle: {
        fillColor: 'grey'
      },
      coverPolygonsEvents: {
        mouseover: e => {
          e.polygon.setOptions({ strokeWeight: 3 });
        },
        mouseout: e => {
          e.polygon.setOptions({ strokeWeight: 1 });
        }
      }
    }));
    const circleProps = circles.map(circle => ({
      key: circle.id,
      center: circle.center,
      radius: circle.radius,
      showCoverPolygons: showCoverPolygons,
      showGeohashes: showGeohashes,
      geohashPrecision: precision
    }));
    return (
      <div className="App">
        <div style={{ height: '70vh', width: '100%' }}>
          <Map center={this.state.center} zoom={13} version='1.4.2'>
            <div style={{ position: 'absolute', top: 0, right: 0 }}>
              <button onClick={() => this._mouseTool.polygon({ showDistance: true })}>draw polygon</button>
              <button onClick={() => this._mouseTool.circle({ showDistance: true })}>draw circle</button>
              <button onClick={() => this.setState({ showCoverPolygons: !showCoverPolygons })}>toggle cover polygons</button>
              <button onClick={() => this.setState({ showGeohashes: !showGeohashes })}>toggle geohashes</button>
              <label>precision: </label><Select onChange={e => this.setState({ precision: parseInt(e.target.value, 10) })} value={precision}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => {
                  return <option value={n} key={n}>{n}</option>
                })}
              </Select>
            </div>
            <MouseTool events={{
              ready: e => {
                this._mouseTool = e.mouseTool;
              },
              draw: e => {
                this._mouseTool.close(true);
                const { polygons, circles } = this.state;
                if (e.type === 'polygon') {
                  const polygon = { path: e.polygon, id: uuid() };
                  this.setState({ polygons: [ ...polygons, polygon ]});
                } else if (e.type === 'circle') {
                  const circle = { center: e.circle.center, radius: e.circle.radius, id: uuid() };
                  this.setState({ circles: [ ...circles, circle ]});
                }
              }
            }}/>
            {polygons.map((polygon, i) => <Polygon
              {...polygonProps[i]}
            />)}
            {circles.map((circle, i) => <Circle
              {...circleProps[i]}
            />)}
          </Map>
        </div>
        <div style={{ height: '30vh', width: '100%', textAlign: 'left', overflow: 'auto' }}>
          <pre style={{ width: '50%', float: 'left' }}>polygonProps: {JSON.stringify(polygonProps, null, 2)}</pre>
          <pre style={{ width: '50%', float: 'left' }}>circleProps: {JSON.stringify(circleProps, null, 2)}</pre>
        </div>
      </div>
    );
  }
}

class Select extends React.Component {
  render() {
    return <select {...this.props}>{this.props.children}</select>;
  }
}

