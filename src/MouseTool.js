import React from 'react';
import humanize from '@joshua7v/humanize';
import jex from '@joshua7v/jex';

export default class MouseTool extends React.Component {

  unitMap = {
    m: '米',
    km: '公里'
  }

  distanceTemplate = (label, number, unit) => `
    <div style="background: white; font-size: 12px; padding: 3px 10px; border-radius: 1px; box-shadow: 0 2px 2px rgba(0, 0, 0, .15);"><span style="color: #7E7E7E; font-weight: bold;">${label}</span>: <span style="color: #FE383A; font-weight: bold;">${number} <span style="color: #7E7E7E;">${this.unitMap[unit]}</span></span></div>
  `

  distanceRenderer = (label, v) => v => this.distanceTemplate(label, humanize.distance(v)[0], humanize.distance(v)[1])

  defaultOptions = {
    showDistance: false,
    distanceLabel: '距离',
    offset: { x: 0, y: 0 },
  }

  rewritePolygon = (map, MouseTool, defaultOptions, defaultRenderer) => {
    const originPolygon = MouseTool.prototype.polygon;
    MouseTool.prototype.polygon = function(options) {
      options = { ...defaultOptions, ...options };
      const {
        showDistance,
        distanceLabel,
        distanceRenderer=defaultRenderer(distanceLabel),
        offset,
        ...opts,
      } = options;

      if (showDistance) {
        let startPoint = null;
        let handlers = [];

        let marker = new window.AMap.Marker({ map, content: ' ' });
        !!offset && marker.setOffset(offset);

        handlers.push(window.AMap.event.addListener(map, 'click', e => {
          startPoint = e.lnglat;

          handlers.push(window.AMap.event.addListener(map, 'mousemove', e => {
            const distance = e.lnglat.distance(startPoint);
            marker.setPosition(e.lnglat);
            if (distanceRenderer) {
              marker.setContent(distanceRenderer(distance));
            } else {
              marker.setContent(`${distance}`);
            }
          }));
        }));

        handlers.push(window.AMap.event.addListener(map, 'rightclick', () => {
          // window.AMap.event.trigger(this, 'draw', { obj: { x: 'xx' }});
          handlers.forEach(h => window.AMap.event.removeListener(h));
          marker.setMap(null);
        }));

      }
      originPolygon.call(this, opts);
    }
  }

  rewriteCircle = (map, MouseTool, defaultOptions, defaultRenderer) => {
    const originCircle = MouseTool.prototype.circle;
    MouseTool.prototype.circle = function(options) {
      options = { ...defaultOptions, ...options };
      const {
        showDistance,
        distanceLabel,
        distanceRenderer=defaultRenderer(distanceLabel),
        offset,
        ...opts,
      } = options;

      if (showDistance) {
        let startPoint = null;
        let handlers = [];

        let marker = new window.AMap.Marker({ map, content: ' ' });
        !!offset && marker.setOffset(offset);

        handlers.push(window.AMap.event.addListener(map, 'mousedown', function(e) {
          startPoint = e.lnglat;

          handlers.push(window.AMap.event.addListener(map, 'mousemove', function(e) {
            const distance = e.lnglat.distance(startPoint);
            marker.setPosition(e.lnglat);
            if (distanceRenderer) {
              marker.setContent(distanceRenderer(distance));
            } else {
              marker.setContent(`${distance}`);
            }
          }));
        }));

        handlers.push(window.AMap.event.addListener(map, 'mouseup', function() {
          handlers.forEach(h => window.AMap.event.removeListener(h));
          marker.setMap(null);
        }));

      }
      originCircle.call(this, opts);
    }
  }

  constructor(props) {
    super(props);
    jex.assert(props.__map__, jex.isObject, '<MouseTool /> need to be used within <Map></Map>')

    this._map = props.__map__;
    this.initMouseTool(props);
  }

  initMouseTool(props) {
    this._map.plugin(['AMap.MouseTool', 'AMap.Marker'], () => {
      this.configureMouseTool(props);
    });
  }

  configureMouseTool(props) {
    const events = props.events || {};
    this._mouseTool = new window.AMap.MouseTool(this._map);
    const MouseTool = window.AMap.MouseTool;
    const map = this._map;

    this.rewritePolygon(map, MouseTool, this.defaultOptions, this.distanceRenderer);
    this.rewriteCircle(map, MouseTool, this.defaultOptions, this.distanceRenderer);

    const { ready, draw, ...originalEvents } = events;

    if (ready) {
      ready({ mouseTool: this._mouseTool });
    }

    if (draw) {
      this._mouseTool.on('draw', e => {
        switch(e.obj.CLASS_NAME.split('.')[1]) {
          case 'Polygon':
            events.draw({
              e,
              type: 'polygon',
              polygon: e.obj.getPath().map(p => [p.lng, p.lat])
            });
            break;
          case 'Circle': {
            const center = e.obj.getCenter();
            events.draw({
              e,
              type: 'circle',
              circle: { center: [center.lng, center.lat], radius: e.obj.getRadius() }
            });
            break;
          }
          default:
            jex.assert(false, 'Unexpected draw type');
        }
      });
    }

    Object.keys(originalEvents).forEach(ek => {
      this._mouseTool.on(ek, e => originalEvents[ek]({
        e,
        mouseTool: this._mouseTool
      }));
    });
  }

  shouleComponentUpdate() { return false; }

  render() {
    return null;
  }
}
