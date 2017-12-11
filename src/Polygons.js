import React from 'react';
import jex from '@joshua7v/jex';

export default class Polygons extends React.Component {

  static defaultProps = {
    paths: [],
    style: {
      strokeColor: '#006600',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: '#FFAA00',
      fillOpacity: 0.9,
      strokeStyle: 'solid',
      strokeDasharray: [0, 0, 0],
    },
  }

  flatternOptions = ({ style, ...opts }) => ({ ...style, ...opts });

  constructor(props) {
    super(props);
    jex.assert(props.__map__, jex.isObject, '<Polygons /> need to be used within <Map></Map>')

    this._polygons = null;
    this._overlayGroup = null;
    this._map = props.__map__;
    this.configurePolygons(props);
  }

  configurePolygons(props) {
    const { events={}, ...opts } = props;

    const defaultOptions = this.flatternOptions(Polygons.defaultProps);
    const options = { ...defaultOptions, ...this.flatternOptions(opts) };
    const { paths, ...rest } = options;

    this._map.plugin(['AMap.Polygon', 'AMap.OverlayGroup'], () => {
      this._polygons = paths.map(path => new window.AMap.Polygon({ path: jex.clone(path) }));
      this._overlayGroup = new window.AMap.OverlayGroup(this._polygons);
      this._overlayGroup.setOptions(rest);
      this._overlayGroup.setMap(this._map);

      const { ready, ...originalEvents } = events;

      if (ready) {
        ready(this._polygons);
      }

      Object.keys(originalEvents).forEach(ek => {
        this._polygons.forEach((polygon, i) => {
          polygon.on(ek, e => originalEvents[ek]({ e, polygon: this._polygons[i] , polygons: this._polygons }));
        });
      });

    });

  }

  componentWillReceiveProps(nextProps) {
    this._map && this.refresh(nextProps);
  }

  shouleComponentUpdate() { return false; }

  componentWillUnmount() {
    this._overlayGroup.clearOverlays();
    this._overlayGroup.setMap(null);
    delete this._overlayGroup;
  }

  refresh(nextProps) {
    // const { events={}, ...opts } = nextProps;

    const diffs = jex.differences(this.props, nextProps);

    diffs.forEach(diff => {
      if (diff.type === 'add' && diff.path.includes('path')) {
        const newPath = diff.vals;

        const newPolygon = new window.AMap.Polygon({ path: jex.clone(newPath) });
        this._polygons.push(newPolygon);
        this._overlayGroup.addOverlay(newPolygon);
      }
    })

  }

  render() {
    return null;
  }
}
