/**
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/
 */

import { Class, $, $$, PElement, PObserveEvent, getDocumentDimensions } from '../shims/prototypeShim';
import Raphael from '../raphael';
import SVGWrapper from './svgWrapper';

/**
 * Workspace contains the Raphael canvas, the zoom/pan controls and the menu bar
 * on the top. The class includes functions for managing the Raphael paper object and coordinate transformation methods
 * for taking pan and zoom levels into account.
 *
 * @class Workspace
 * @constructor
 */

var Workspace = Class.create({

  initialize: function(parentDivID) {
    var me = this;
    this.canvas = PElement('div', {'id' : 'canvas'});
    this.workArea = PElement('div', { 'id': 'work-area' })._p_update(this.canvas);

    $(parentDivID)._p_update(this.generateTopMenu());
    $(parentDivID)._p_insert(this.workArea);
    // FIXME: removes scrollbar
    $(parentDivID)._p_up()._p_setStyle({ "padding": "2px" });

    var screenDimensions = getDocumentDimensions();
    
    this.width = screenDimensions.width;
    this.height = screenDimensions.height - this.canvas._p_cumulativeOffset().top - 4;
    this._paper = Raphael('canvas',this.width, this.height);
    this.viewBoxX = 0;
    this.viewBoxY = 0;
    this.zoomCoefficient = 1;

    this.background = this.getPaper().rect(0,0, this.width, this.height).attr({fill: 'blue', stroke: 'none', opacity: 0}).toBack();
    this.background.node.setAttribute('class', 'panning-background');

    this.adjustSizeToScreen = this.adjustSizeToScreen.bind(this);

    // note: by going through PObserveEvent the listener will be auto-removed on pedigree close
    PObserveEvent('resize', me.adjustSizeToScreen, window);

    this.generateViewControls();

    //Initialize pan by dragging
    var start = function() {
      if (editor.isAnyMenuVisible()) {
        return;
      }
      me.background.ox = me.background.attr('x');
      me.background.oy = me.background.attr('y');
      //me.background.attr({cursor: 'url(https://mail.google.com/mail/images/2/closedhand.cur)'});
      me.background.attr({cursor: 'move'});
    };
    var move = function(dx, dy) {
      var deltax = me.viewBoxX - dx/me.zoomCoefficient;
      var deltay = me.viewBoxY - dy/me.zoomCoefficient;

      me.getPaper().setViewBox(deltax, deltay, me.width/me.zoomCoefficient, me.height/me.zoomCoefficient);
      me.background.ox = deltax;
      me.background.oy = deltay;
      me.background.attr({x: deltax, y: deltay });
    };
    var end = function() {
      me.viewBoxX = me.background.ox;
      me.viewBoxY = me.background.oy;
      me.background.attr({cursor: 'default'});
    };
    me.background.drag(move, start, end);

    if (document.addEventListener) {
      // adapted from from raphaelZPD
      me.handleMouseWheel = function(evt) {
        if (evt.preventDefault) {
          evt.preventDefault();
        } else {
          evt.returnValue = false;
        }

        // disable while menu is active - too easy to scroll and get the active node out of sight, which is confusing
        if (editor.isAnyMenuVisible()) {
          return;
        }

        var delta;
        if (evt.wheelDelta) {
          delta = -evt.wheelDelta;
        } // Chrome/Safari
        else {
          delta = evt.detail;
        } // Mozilla

        if (delta > 0) {
          var x = $$('.zoom-out')[0];
          $$('.zoom-out')[0].click();
        } else {
          $$('.zoom-in')[0].click();
        }
      };

      if (navigator.userAgent.toLowerCase().indexOf('webkit') >= 0) {
        this.canvas.addEventListener('mousewheel', me.handleMouseWheel, false); // Chrome/Safari
      } else {
        this.canvas.addEventListener('DOMMouseScroll', me.handleMouseWheel, false); // Others
      }
    }
  },

  /**
    * Returns the SVGWrapper object containing a copy of pedigree SVG with all edit-related
    *                  elements such as handles, invisible interactive layers, etc. removed.
    *
    * @method getSVGCopy
    * @param {Object} anonymizeSettings a set of anonymization properties, currently "removePII" and "removeComments"
    * @return {Object} SVGWrapper object.
    */
  getSVGCopy: function (anonymizeSettings) {
    editor.getView().unmarkAll();

    var image = $('canvas');

    var background = image.getElementsByClassName('panning-background')[0];
    background.style.display = "none";

    editor.getView().setAnonymizeStatus(anonymizeSettings);

    // move white background up if it is not the first child element of <svg>, otherwise it will hide labels
    var backgroundEl = $('white-bbox-background');
    if (backgroundEl && backgroundEl.parentNode && backgroundEl.previousElementSibling) {
      backgroundEl.parentNode.insertBefore(backgroundEl, backgroundEl.parentNode.firstChild);
    }

    var _bbox = image._p_down().getBBox();
    var bbox = {};
    // Due to a bug (?) in firefox bounding box as reported by the browser may be a few pixels
    // too small and exclude lines at the very edge of the svg - so bbox is manually extended
    // by a few pixels in all directions.
    // Also, need to use _bbox and bbox bcause IE does not allow to modify the bbox obtained by getBBox()
    bbox.x = Math.floor(_bbox.x) - 2;
    bbox.y = Math.floor(_bbox.y) - 2;
    bbox.width = Math.ceil(_bbox.width) + 4;
    bbox.height = Math.ceil(_bbox.height) + 4;
    //console.log("BBOX: x:" + bbox.x + " y:" + bbox.y + " width: " + bbox.width + " height: " + bbox.height + "\n");

    var svgText = image.innerHTML.replace(/xmlns(:xlink)?=".*?"/g, '').replace(/width=".*?"/, '').replace(/height=".*?"/, '')
      .replace(/viewBox=".*?"/, "viewBox=\"" + bbox.x + " " + bbox.y + " " + bbox.width + " " + bbox.height + "\" width=\"" + (bbox.width) + "\" height=\"" + (bbox.height) +
        "\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns=\"http://www.w3.org/2000/svg\"");

    editor.getView().setAnonymizeStatus({});

    // set display:block
    svgText = svgText.replace(/(<svg[^<>]+style=")/g, "$1display:block; ");
    // remove invisible elements to slim down svg
    svgText = svgText.replace(/<[^<>]+display: ?none;[^<>]*([^/]><\/\w+|\/)>/g, "");
    svgText = svgText.replace(/<text[^<>]+?class="hidden"[^<>]*>(.*?)<\/text>/g, "");
    // remove elements with opacity==0 to slim down svg
    svgText = svgText.replace(/<[^<>]+[" ]opacity: ?0;[^<>]*([^/]><\/\w+|\/)>/g, "");
    // remove partnership clickable circles
    svgText = svgText.replace(/<circle [^<>]+?pedigree-partnership-circle[^<>]*([^/]><\/\w+|\/)>/g, "");
    // remove titles of the handles
    svgText = svgText.replace(/<a [^<>]*?xlink:title=[^<>]*([^/]><\/\w+|\/)>/g, "");
    // remove hoverboxes
    svgText = svgText.replace(/<[^<>]+?pedigree-hoverbox[^<>]*([^/]><\/\w+|\/)>/g, "");
    // remove node shadows
    svgText = svgText.replace(/<[^<>]+?pedigree-node-shadow[^<>]*([^/]><\/\w+|\/)>/g, "");
    // remove gradient definitions (only used for handles),
    // or they confuse the browser after used and discarded for print preview
    svgText = svgText.replace(/<linearGradient.*<\/linearGradient>/g, "");
    svgText = svgText.replace(/<radialGradient.*?<\/radialGradient>/g, "");
    // remove "created by raphael", some older browsers may be confused
    svgText = svgText.replace(/<desc>[^<>]+<\/desc>/g, "");
    // For the two fixes below see http://stackoverflow.com/questions/30273775/namespace-prefix-ns1-for-href-on-tagelement-is-not-defined-setattributens
    // Firefox, Safari root NS issue fix
    svgText = svgText.replace(' xlink=', ' xmlns:xlink=');
    // Safari xlink NS issue fix
    svgText = svgText.replace(/NS\d+:(href|show)/g, 'xlink:$1');
    // Remove "current patient arrow and "C" indicator, plus the proband "P" indicator
    svgText = svgText.replace(/<[^<>]+?node-arrow-text[^<>]*([^/]>\s*(<tspan(.*?)\/tspan>)\s*<\/\w+|\/)>/g, "");
    svgText = svgText.replace(/<[^<>]+?node-arrow-type-C[^<>]*([^/]><\/\w+|\/)>/g, "");

    background.style.display = "";

    return new SVGWrapper(svgText, bbox, 1.0);
  },

  /**
     * Returns the Raphael paper object.
     *
     * @method getPaper
     * @return {Object} Raphael Paper element
     */
  getPaper: function() {
    return this._paper;
  },

  /**
     * Returns the div element containing everything except the top menu bar
     *
     * @method getWorkArea
     * @return {HTMLElement}
     */
  getWorkArea: function() {
    return this.workArea;
  },

  /**
     * Returns width of the work area
     *
     * @method getWidth
     * @return {Number}
     */
  getWidth: function() {
    return this.width;
  },

  /**
     * Returns height of the work area
     *
     * @method getHeight
     * @return {Number}
     */
  getHeight: function() {
    return this.height;
  },

  /**
     * Creates the menu on the top
     *
     * @method generateTopMenu
     */
  generateTopMenu: function() {
    var menu = PElement('div', {'id' : 'editor-menu'});

    var submenus = [];

    if (editor.isReadOnlyMode()) {
      submenus = [{
        name : 'input',
        items: [
          { key : 'readonlymessage', label : 'Read only mode', icon : 'exclamation-triangle'}
        ]
      }, {
        name : 'output',
        items: [
          { key : 'export',    label : 'Export', icon : 'file-export'},
          { key : 'close',     label : 'Close', icon : 'times'}
        ]
      }];
    } else {
      submenus = [{
        name : 'input',
        items: [
          { key : 'templates', label : 'Templates', icon : 'copy'},
          { key : 'import',    label : 'Import', icon : 'download'} // in font-awesome v5, use: "file-import"
        ]
      }, {
        name : 'edit',
        items: [
          { key : 'undo', label : 'Undo', icon : 'undo'},
          { key : 'redo', label : 'Redo', icon : 'repeat' }  // unavailable in font-awesome v5, use: "redo"
        ]
      }, {
        name : 'reset',
        items: [
          { key : 'clear',  label : 'Clear all', icon : 'times-circle'},
          { key : 'layout', label : 'Automatic layout', icon: 'sitemap' }
        ]
      }, {
        name : 'output',
          items: [
          { key: 'export', label : 'Export', icon : 'upload' }, // in font-awesome v5, use: "file-export"
          { key: 'save',   label : 'Save',   icon : 'check' },
          { key : 'close', label : 'Close',  icon : 'times'}
        ]
      }];
    }
    var _createSubmenu = function(data) {
      var submenu = PElement('div', {'class' : data.name + '-actions action-group'});
      menu._p_insert(submenu);
      data.items.forEach(function (item) {
        submenu._p_insert(_createMenuItem(item));
      });
    };
    var _createMenuItem = function(data) {
      var mi = PElement('span', {'id' : 'action-' + data.key, 'class' : 'menu-item ' + data.key})._p_insert(PElement('span', {'class' : 'fa fa-' + data.icon}))._p_insert(' ')._p_insert(data.label);
      if (data.callback && typeof(this[data.callback]) == 'function') {
        mi._p_observe('click', function() {
          this[data.callback]();
        });
      }
      return mi;
    };
    submenus.forEach(_createSubmenu);

    return menu;
  },

  /**
     * Adjusts the canvas viewbox to the given zoom coefficient
     *
     * @method zoom
     * @param {Number} zoomCoefficient The zooming ratio
     */
  zoom: function(zoomCoefficient) {
    if (zoomCoefficient < 0.15) {
      zoomCoefficient = 0.15;
    }
    if (zoomCoefficient > 0.15 && zoomCoefficient < 0.25) {
      zoomCoefficient = 0.25;
    }
    zoomCoefficient = Math.round(zoomCoefficient/0.05)/20;
    var newWidth  = this.width/zoomCoefficient;
    var newHeight = this.height/zoomCoefficient;
    this.viewBoxX = this.viewBoxX + (this.width/this.zoomCoefficient - newWidth)/2;
    this.viewBoxY = this.viewBoxY + (this.height/this.zoomCoefficient - newHeight)/2;
    this.getPaper().setViewBox(this.viewBoxX, this.viewBoxY, newWidth, newHeight);
    this.zoomCoefficient = zoomCoefficient;
    this.background.attr({x: this.viewBoxX, y: this.viewBoxY, width: newWidth, height: newHeight});
  },

  /**
     * Creates the controls for panning and zooming
     *
     * @method generateViewControls
     */
  generateViewControls : function() {
    var _this = this;
    this.__controls = PElement('div', { 'class': 'view-controls' });
    // Pan controls
    this.__pan = PElement('div', {'class' : 'view-controls-pan', title : 'Pan'});
    this.__controls._p_insert(this.__pan);

    ['up', 'right', 'down', 'left', 'home'].forEach(function (direction) {
      var faIconClass = (direction == 'home') ? 'fa-user' : 'fa-arrow-' + direction;
      _this.__pan[direction] = PElement('span', {'class' : 'view-control-pan pan-' + direction + ' fa fa-fw ' + faIconClass, 'title' : 'Pan ' + direction});
      _this.__pan._p_insert(_this.__pan[direction]);
      _this.__pan[direction]._p_observe('click', function(event) {
        if (direction == 'home') {
          _this.centerAroundNode(0);
        } else if(direction == 'up') {
          _this.panTo(_this.viewBoxX, _this.viewBoxY - 300);
        } else if(direction == 'down') {
          _this.panTo(_this.viewBoxX, _this.viewBoxY + 300);
        } else if(direction == 'left') {
          _this.panTo(_this.viewBoxX - 300, _this.viewBoxY);
        } else {
          _this.panTo(_this.viewBoxX + 300, _this.viewBoxY);
        }
      });
    });
    // Zoom controls
    var trackLength = 200;
    this.__zoom = PElement('div', {'class' : 'view-controls-zoom', title : 'Zoom'});
    this.__controls._p_insert(this.__zoom);
    this.__zoom.track  = PElement('div', {'class' : 'zoom-track'});
    this.__zoom.handle = PElement('div', {'class' : 'zoom-handle', title : 'Drag to zoom'});
    this.__zoom['in']  = PElement('div', {'class' : 'zoom-button zoom-in fa fa-fw fa-search-plus', title : 'Zoom in'});
    this.__zoom['out'] = PElement('div', {'class' : 'zoom-button zoom-out fa fa-fw fa-search-minus', title : 'Zoom out'});
    this.__zoom.label  = PElement('div', {'class' : 'zoom-crt-value'});
    this.__zoom._p_insert(this.__zoom['in']);
    this.__zoom._p_insert(this.__zoom.track);
    this.__zoom.track._p_insert(this.__zoom.handle);
    this.__zoom.track.style.height = trackLength + 'px';
    this.__zoom._p_insert(this.__zoom.out);
    this.__zoom._p_insert(this.__zoom.label);

    // FIXME
    // This is a stub for slider implemented by a library which heavily depends on prototype.js (incompatible with React)
    var ZoomSlider = Class.create({
      setValue: function (value) {
        if (value <= 0.9) {
          _this.zoom(-value / 0.9 + 1.25);
        } else {
          _this.zoom(0.15);
        }
      }
    });
    this.zoomSlider = new ZoomSlider();
    /*
    // Scriptaculous slider
    // see also http://madrobby.github.com/scriptaculous/slider/
    //
    // Here a non-linear scale is used: slider positions form [0 to 0.9] correspond to
    // zoom coefficients from 1.25x to 0.25x, and zoom positions from (0.9 to 1]
    // correspond to single deepest zoom level 0.15x
    this.zoomSlider = new Control.Slider(this.__zoom.handle, this.__zoom.track, {
      axis:'vertical',
      minimum: 0,
      maximum: trackLength,
      increment : 1,
      alignY: 6,
      onSlide : function (value) {
        // Called whenever the Slider is moved by dragging.
        // The called function gets the slider value (or array if slider has multiple handles) as its parameter.
        if (value <= 0.9) {
          _this.zoom(-value/0.9 + 1.25);
        } else {
          _this.zoom(0.15);
        }
      },
      onChange : function (value) {
        // Called whenever the Slider has finished moving or has had its value changed via the setSlider Value function.
        // The called function gets the slider value (or array if slider has multiple handles) as its parameter.
        if (value <= 0.9) {
          _this.zoom(-value/0.9 + 1.25);
        } else {
          _this.zoom(0.15);
        }
      }
    });*/
    if (editor.isUnsupportedBrowser()) {
      this.zoomSlider.setValue(0.25 * 0.9); // 0.25 * 0.9 corresponds to zoomCoefficient of 1, i.e. 1:1
      // - for best chance of decent looks on non-SVG browsers like IE8
    } else {
      this.zoomSlider.setValue(0.5 * 0.9);  // 0.5 * 0.9 corresponds to zoomCoefficient of 0.75x
    }
    this.__zoom['in']._p_observe('click', function(event) {
      if (_this.zoomCoefficient < 0.25) {
        _this.zoomSlider.setValue(0.9);
      }   // zoom in from the any value below 0.25x goes to 0.25x (which is 0.9 on the slider)
      else {
        _this.zoomSlider.setValue(-(_this.zoomCoefficient - 1)*0.9);
      }     // +0.25x
    });
    this.__zoom['out']._p_observe('click', function(event) {
      if (_this.zoomCoefficient <= 0.25) {
        _this.zoomSlider.setValue(1);
      }     // zoom out from 0.25x goes to the final slider position
      else {
        _this.zoomSlider.setValue(-(_this.zoomCoefficient - 1.5)*0.9);
      }   // -0.25x
    });
    // Insert all controls in the document
    this.getWorkArea()._p_insert(this.__controls);
  },

  /* To work around a bug in Raphael or Raphaelzpd (?) which creates differently sized lines
     * @ different zoom levels given the same "stroke-width" in pixels this function computes
     * the pixel size to be used at this zoom level to create a line of the correct size.
     *
     * Returns the pixel value to be used in stoke-width
     */
  getSizeNormalizedToDefaultZoom: function(pixelSizeAtDefaultZoom) {
    return pixelSizeAtDefaultZoom;
  },

  /**
     * Returns the current zoom level (not normalized to any value, larger numbers mean deeper zoom-in)
     */
  getCurrentZoomLevel: function(pixelSizeAtDefaultZoom) {
    return this.zoomCoefficient;
  },

  /**
     * Converts the coordinates relative to the Raphael canvas to coordinates relative to the canvas div
     * and returns them
     *
     * @method canvasToDiv
     * @param {Number} canvasX The x coordinate relative to the Raphael canvas (ie with pan/zoom transformations)
     * @param {Number} canvasY The y coordinate relative to the Raphael canvas (ie with pan/zoom transformations)
     * @return {{x: number, y: number}} Object with coordinates
     */
  canvasToDiv: function(canvasX,canvasY) {
    return {
      x: this.zoomCoefficient * (canvasX - this.viewBoxX),
      y: this.zoomCoefficient * (canvasY - this.viewBoxY)
    };
  },

  /**
     * Converts the coordinates relative to the canvas div to coordinates relative to the Raphael canvas
     * by applying zoom/pan transformations and returns them.
     *
     * @method divToCanvas
     * @param {Number} divX The x coordinate relative to the canvas
     * @param {Number} divY The y coordinate relative to the canvas
     * @return {{x: number, y: number}} Object with coordinates
     */
  divToCanvas: function(divX,divY) {
    return {
      x: divX/this.zoomCoefficient + this.viewBoxX,
      y: divY/this.zoomCoefficient + this.viewBoxY
    };
  },

  /**
     * Converts the coordinates relative to the browser viewport to coordinates relative to the canvas div,
     * and returns them.
     *
     * @method viewportToDiv
     * @param {Number} absX The x coordinate relative to the viewport
     * @param {Number} absY The y coordinate relative to the viewport
     * @return {{x: number, y: number}} Object with coordinates
     */
  viewportToDiv : function (absX, absY) {
    return {
      x : + absX - this.canvas._p_cumulativeOffset().left,
      y : absY - this.canvas._p_cumulativeOffset().top
    };
  },

  /**
     * Animates a transformation of the viewbox to the given coordinate
     *
     * @method panTo
     * @param {Number} x The x coordinate relative to the Raphael canvas
     * @param {Number} y The y coordinate relative to the Raphael canvas
     */
  panTo: function(x, y, instant) {
    var me = this,
      oX = this.viewBoxX,
      oY = this.viewBoxY,
      xDisplacement = x - oX,
      yDisplacement = y - oY;

    if (editor.isUnsupportedBrowser()) {
      instant = true;
    }

    var numSeconds = instant ? 0 : .4;
    var frames     = instant ? 1 : 11;

    var xStep = xDisplacement/frames,
      yStep = yDisplacement/frames;

    if (xStep == 0 && yStep == 0) {
      return;
    }

    var progress = 0;

    (function draw() {
      setTimeout(function() {
        if(progress++ < frames) {
          me.viewBoxX += xStep;
          me.viewBoxY += yStep;
          me.getPaper().setViewBox(me.viewBoxX, me.viewBoxY, me.width/me.zoomCoefficient, me.height/me.zoomCoefficient);
          me.background.attr({x: me.viewBoxX, y: me.viewBoxY });
          draw();
        }
      }, 1000 * numSeconds / frames);
    })();
  },

  /**
     * Animates a transformation of the viewbox by the given delta in the X direction
     *
     * @method panTo
     * @param {Number} deltaX The move size
     */
  panByX: function(deltaX, instant) {
    this.panTo(this.viewBoxX + Math.floor(deltaX/this.zoomCoefficient), this.viewBoxY, instant);
  },

  /**
     * Adjusts the canvas size to the current viewport dimensions.
     *
     * @method adjustSizeToScreen
     */
  adjustSizeToScreen : function() {
    var screenDimensions = getDocumentDimensions();
    this.width = screenDimensions.width;
    this.height = screenDimensions.height - this.canvas._p_cumulativeOffset().top - 4;
    this.getPaper().setSize(this.width, this.height);
    this.getPaper().setViewBox(this.viewBoxX, this.viewBoxY, this.width/this.zoomCoefficient, this.height/this.zoomCoefficient);
    this.background && this.background.attr({'width': this.width, 'height': this.height});
    if (editor.getNodeMenu()) {
      editor.getNodeMenu().reposition();
    }
  },

  /**
     * Pans the canvas to put the node with the given id at the center.
     *
     * When (xCenterShift, yCenterShift) are given positions the node with the given shift relative
     * to the center instead of exact center of the screen
     *
     * @method centerAroundNode
     * @param {Number} nodeID The id of the node
     */
  centerAroundNode: function(nodeID, instant, xCenterShift, yCenterShift) {
    var node = editor.getNode(nodeID);
    if(node) {
      var x = node.getX(),
        y = node.getY();
      if (!xCenterShift) {
        xCenterShift = 0;
      }
      if (!yCenterShift) {
        yCenterShift = 0;
      }
      var xOffset = this.getWidth()/this.zoomCoefficient;
      var yOffset = this.getHeight()/this.zoomCoefficient;
      this.panTo(x - xOffset/2 - xCenterShift, y - yOffset/2 - yCenterShift, instant);
    }
  }
});

export default Workspace;
