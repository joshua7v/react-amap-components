import React from 'react';
import jex from '@joshua7v/jex';
import geoex from '@joshua7v/geoex';

export default class Polygon extends React.Component {

  static defaultProps = {
    path: [],
    draggable: false,
    style: {
      strokeColor: '#006600',
      strokeOpacity: 0.9,
      strokeWeight: 1,
      fillColor: '#FFAA00',
      fillOpacity: 0.5,
      strokeStyle: 'solid',
      strokeDasharray: [0, 0, 0],
    },
    coverPolygonsStyle: {
      strokeColor: '#000000',
      strokeOpacity: 0.9,
      strokeWeight: 1,
      fillColor: 'red',
      fillOpacity: 0.1,
      strokeStyle: 'solid',
      strokeDasharray: [0, 0, 0],
    },
    showCoverPolygons: false,
    showGeohashes: false,
    geohashPrecision: 5
  }

  flatternOptions = ({ style, ...opts }) => ({ ...opts, ...style });

  getOptions = props => {
    const { events={}, ...opts } = props;
    const defaultOptions = this.flatternOptions(Polygon.defaultProps);
    const options = this.flatternOptions(jex.merge(defaultOptions, opts));
    const {
      showCoverPolygons,
      showGeohashes,
      geohashPrecision,
      coverPolygonsStyle,
      coverPolygonsEvents={},
      geohashesEvents={},
      __map__,
      __ele__,
      ...rest
    } = options;

    return {
      origin: rest,
      events,
      ex: {
        showCoverPolygons,
        showGeohashes,
        geohashPrecision,
        coverPolygonsEvents,
        coverPolygonsStyle,
        geohashesEvents,
      }
    };
  }

  calculateHashes = ({ path, precision }) => {
    if (precision !== this.props.precision) {
      this._hashes = null;
      this._bounds = null;
    }

    if (!this._hashes) this._hashes = geoex.coverHashes(path, precision);
    if (!this._bounds) this._bounds = geoex.boundingPaths(this._hashes);

    return { hashes: this._hashes, bounds: this._bounds };
  }

  constructor(props) {
    super(props);
    jex.assert(props.__map__, jex.isObject, '<Polygon /> need to be used within <Map></Map>')

    this._polygon = null;
    this._coverPolygons = null;
    this._coverPolygonsGroup = null;
    this._geohashes = null;
    this._geohashesGroup = null;
    this._map = props.__map__;
    this.initPolygon(this.getOptions(props));
  }

  initPolygon(options) {
    this._map.plugin(['AMap.Polygon'], () => {
      const { origin, events } = options;
      const { path, ...rest } = origin;

      this._polygon = new window.AMap.Polygon({ path: jex.clone(path), ...rest, map: this._map });

      const { ready, ...originalEvents } = events;

      if (ready) {
        ready({ polygon: this._polygon, path: this._polygon.getPath().map(p => [p.lng, p.lat]) });
      }

      Object.keys(originalEvents).forEach(ek => {
        this._polygon.on(ek, e => originalEvents[ek]({
          e,
          polygon: this._polygon,
          path: this._polygon.getPath().map(p => [p.lng, p.lat])
        }));
      });

      this.configurePolygon(options);
    });
  }

  initCoverPolygons(options) {
    this._map.plugin(['AMap.OverlayGroup'], () => {
      const { origin, ex } = options;
      const { path } = origin;
      const { geohashPrecision, coverPolygonsEvents, showCoverPolygons } = ex;

      const { bounds } = this.calculateHashes({ path, precision: geohashPrecision });
      this._coverPolygons = bounds.map(path => new window.AMap.Polygon({ path: jex.clone(path) }));
      this._coverPolygonsGroup = new window.AMap.OverlayGroup(this._coverPolygons);
      this._coverPolygonsGroup.setMap(this._map);

      const { ready, ...originalEvents } = coverPolygonsEvents;

      if (ready) {
        ready({ coverPolygons: this._coverPolygons, overlayGroup: this._coverPolygonsGroup });
      }

      this._coverPolygons.forEach(polygon => {
        Object.keys(originalEvents).forEach(ek => {
          polygon.on(ek, e => originalEvents[ek]({
            e,
            polygon,
            path: polygon.getPath().map(p => [p.lng, p.lat])
          }));
        });
      })

      showCoverPolygons ? this._coverPolygonsGroup.show() : this._coverPolygonsGroup.hide();
      this.configureCoverPolygons(options);
    });
  }

  initGeohashes(options) {
    this._map.plugin(['AMap.Text'], () => {
      const { origin, ex } = options;
      const { path } = origin;
      const { geohashPrecision, geohashesEvents, showGeohashes } = ex;

      const { hashes, bounds } = this.calculateHashes({ path, precision: geohashPrecision });
      this._geohashes = bounds.map((path, i) => new window.AMap.Text({ text: hashes[i], position: geoex.center(path) }));
      this._geohashesGroup = new window.AMap.OverlayGroup(this._geohashes);
      this._geohashesGroup.setMap(this._map);

      const { ready, ...originalEvents } = geohashesEvents;

      if (ready) {
        ready({ geohashes: this._geohashes, overlayGroup: this._geohashesGroup });
      }

      this._geohashes.forEach(geohash => {
        Object.keys(originalEvents).forEach(ek => {
          geohash.on(ek, e => originalEvents[ek]({
            e,
            geohash,
            text: geohash.getText()
          }));
        });
      })

      showGeohashes ? this._geohashesGroup.show() : this._geohashesGroup.hide();
      this.configureGeohashes(options);
    });
  }

  configurePolygon(options) {
    const { showCoverPolygons, showGeohashes } = options.ex;

    if (jex.exist(showCoverPolygons) && !this._coverPolygonsGroup) {
      this.initCoverPolygons(options);
    }

    if (jex.exist(showGeohashes) && !this._geohashesGroup) {
      this.initGeohashes(options);
    }

    showCoverPolygons ? this._coverPolygonsGroup.show() : this._coverPolygonsGroup.hide();
    showGeohashes ? this._geohashesGroup.show() : this._geohashesGroup.hide();
  }

  configureCoverPolygons(options) {
    const { coverPolygonsStyle } = options.ex;
    this._coverPolygonsGroup.setOptions(coverPolygonsStyle);
  }

  configureGeohashes(options) {
    // const { geohashesStyle } = options.ex;
    // this._geohashesGroup.setOptions(geohashesStyle);
  }

  componentWillReceiveProps(nextProps) {
    this._map && this.refresh(nextProps);
  }

  shouleComponentUpdate() { return false; }

  componentWillUnmount() {
    this._polygon.setMap(null);
    this._geohashesGroup.setMap(null);
    this._coverPolygonsGroup.setMap(null);
  }

  refresh(nextProps) {
    if (jex.equals(this.props, nextProps)) return;

    const options = this.getOptions(nextProps);
    const prevOptions = this.getOptions(this.props);
    this.configurePolygon(options);

    const { geohashPrecision, coverPolygonsStyle } = options.ex;
    if (!jex.equals(geohashPrecision, prevOptions.ex.geohashPrecision)) {
      this._coverPolygonsGroup.setMap(null);
      this.initCoverPolygons(options);

      this._geohashesGroup.setMap(null);
      this.initGeohashes(options);
    }

    if (!jex.equals(coverPolygonsStyle, prevOptions.ex.coverPolygonsStyle)) {
      this.configureCoverPolygons(options);
    }
  }

  render() {
    return null;
  }
}
