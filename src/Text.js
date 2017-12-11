import React from 'react';
import jex from '@joshua7v/jex';

export default class MouseTool extends React.Component {

  defaultOptions = {
    text: '',
    textAlign: 'center',
    verticalAlign: 'middle',
    offset: { x: 0, y: 0 },
    topWhenClick: false,
    bubble: false,
    draggable: false,
    raiseOnDrag: false,
    cursor: '',
    visible: true,
    zIndex: 100,
    angle: 0,
    autoRotation: false,
    animation: 'AMAP_ANIMATION_NONE',
    title: '',
    clickable: false,
    extData: null
  }

  operations = {
    text      : 'setText',
    style     : 'setStyle',
    offset    : 'setOffset',
    animation : 'setAnimation',
    clickable : 'setClickable',
    position  : 'setPosition',
    angle     : 'setAngle',
    zIndex    : 'setzIndex',
    title     : 'setTitle',
    shadow    : 'setShadow',
    extData   : 'setExtData'
  }

  constructor(props) {
    super(props);
    jex.assert(props.__map__, jex.isObject, 'MouseTool need to be used within <Map></Map>');

    this._text = null;
    this._map = props.__map__;
    this.configureText(props);
  }

  configureText(props) {
    const { events={}, ...opts } = props;
    this._map.plugin(['AMap.Text'], () => {
      const options = { ...this.defaultOptions, ...opts };
      this._text = new window.AMap.Text({ ...options, map: this._map });

      if (events.created) {
        events.created(this._text);
      }

    });
  }

  componentWillReceiveProps(nextProps) {
    this._map && this.refresh(nextProps);
  }

  shouleComponentUpdate() { return false; }

  componentWillUnmount() {
    this._text.setMap(null);
    delete this._text;
  }

  refresh(nextProps) {
    const { events, ...opts } = nextProps;

    Object.keys(opts).filter(k => k.substr(0, 2) !== '__').forEach(key => {
      const operation = this._text[this.operations[key]];
      jex.isFunction(operation) && operation.call(this._text, opts[key]);
    });
  }

  render() {
    return null;
  }
}
