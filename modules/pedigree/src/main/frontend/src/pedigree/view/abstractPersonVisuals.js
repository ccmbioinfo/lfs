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

import { Class, $ } from '../shims/prototypeShim';
import AbstractNodeVisuals from './abstractNodeVisuals';
import GraphicHelpers from './graphicHelpers';
import PedigreeEditorParameters from '../pedigreeEditorParameters';

/**
 * An abstract superclass for the a graphic engine used by nodes on the Pedigree graph. Can display
 * a shape representing the gender of the attached node.
 *
 * @class AbstractPersonVisuals
 * @extends AbstractNodeVisuals
 * @constructor
 * @param {AbstractPerson} node The node for which this graphics are handled
 * @param {Number} x The x coordinate on the canvas
 * @param {Number} y the y coordinate on the canvas
 */

var AbstractPersonVisuals = Class.create(AbstractNodeVisuals, {

  initialize: function($super, node, x, y) {
    $super(node, x, y);

    this._radius = PedigreeEditorParameters.attributes.radius;
    this._width  = PedigreeEditorParameters.attributes.radius * 4;

    this._highlightBox   = null;
    this._adoptedShape   = null;
    this._genderShape    = null;
    this._genderGraphics = null;  // == set(_genderShape, shadow)

    this.setGenderGraphics();

    this.setHighlightBox();

    this.updateIDLabel();

    this._hoverBox = this.generateHoverbox(x, y);
  },

  updateIDLabel: function() {
    if (!editor.DEBUG_MODE) {
      return;
    }

    var x = this.getX();
    var y = this.getY();
    this._idLabel && this._idLabel.remove();
    this._idLabel = editor.getPaper().text(x, y, this.getNode().getID()).attr(PedigreeEditorParameters.attributes.dragMeLabel).toFront();
    this._idLabel.node.setAttribute('class', 'no-mouse-interaction');
  },

  generateHoverbox: function(x, y) {
    return null;
  },

  /**
     * Updates whatever needs to change when node id changes (e.g. id label)
     *
     * @method onSetID
     */
  onSetID: function($super, id) {
    $super(id);
    this.updateIDLabel();
  },

  /**
     * Changes the position of the node to (X,Y)
     *
     * @method setPos
     * @param {Number} x The x coordinate
     * @param {Number} y The y coordinate
     * @param {Boolean} animate Set to true if you want to animate the transition
     * @param {Function} callback The function called at the end of the animation
     */
  setPos: function($super, x, y, animate, callback) {

    this.getHoverBox().removeHandles();
    this.getHoverBox().removeButtons();

    var moveX = x - this.getX();
    var moveY = y - this.getY();

    if (moveX == 0 && moveY == 0) {
      return;
    }

    // need to set X and Y before animation finishes or other
    // stuff will be drawn incorrectly
    $super(x, y, animate);


    if(animate) {
      var me = this;
      this._callback = function() {
        if (me._toMark) {
          me.markPermanently();
          delete me._toMark;
        }
        delete me._callback;
        callback && callback();
      };

      this.getAllGraphics().animate( {'transform': 't ' + moveX + ',' + moveY + '...'},
        900, 'linear', me._callback ); //easeInOut

      //this.getAllGraphics().transform("t " + moveX + "," + moveY + "...");
      //callback && callback();
    } else {
      this.getAllGraphics().transform('t ' + moveX + ',' + moveY + '...');
      callback && callback();
    }
  },

  /**
     * Expands the partnership circle
     *
     * @method grow
     */
  grow: function ($super) {
    $super();

    if (this._callback) {
      throw 'Assertion failed: grow() during animation';
    }
    if (this.glow) {
      return;
    }
    this.glow = this._genderShape.glow({width: 11, fill: true, opacity: 0.4, color: 'green'});
    if (this.marked) {
      this.marked.hide();
    }
  },

  /**
     * Shrinks node graphics to the original size
     *
     * @method shrink
     */
  shrink: function ($super) {
    this.glow && this.glow.remove();
    delete this.glow;
    if (this.marked) {
      this.marked.show();
    }
    $super();
  },

  /**
     * Marks the node in  away different from glow
     *
     * @method grow
     */
  markPermanently: function() {
    if (this._callback && !this._toMark) {
      // trying to mark during animation - need ot wait until animation finishes to mark @ the final location
      this._toMark = true;
      return;
    }
    if (this.marked) {
      return;
    }
    this.marked = this._genderShape.glow({width: 11, fill: true, opacity: 0.6, color: '#ee8d00'});
  },

  /**
     * Unmarks the node
     *
     * @method shrink
     */
  unmark: function() {
    this.marked && this.marked.remove();
    delete this.marked;
  },

  /**
     * Returns true if this node's graphic representation covers coordinates (x,y)
     *
     * @method containsXY
     */
  containsXY: function(x,y) {
    if ( Math.abs(x - this.getX()) <= this._radius &&
             Math.abs(y - this.getY()) <= this._radius ) {
      return true;
    }
    return false;
  },

  /**
     * Returns the Y coordinate of the lowest part of this node's graphic on the canvas
     *
     * @method getY
     * @return {Number} The y coordinate
     */
  getBottomY: function() {
    return this._absoluteY + this._radius + PedigreeEditorParameters.attributes.childlessLength;
  },

  /**
     * Draws brackets around the node icon to show that this node is adopted
     *
     * @method drawAdoptedShape
     */
  drawAdoptedShape: function() {
    this._adoptedShape && this._adoptedShape.remove();
    var r = PedigreeEditorParameters.attributes.radius,
      x1 = this.getX() - ((0.8) * r),
      x2 = this.getX() + ((0.8) * r),
      y = this.getY() - ((1.3) * r) + 1,
      brackets = 'M' + x1 + ' ' + y + 'l' + r/(-2) +
                ' ' + 0 + 'l0 ' + (2.6 * r - 2) + 'l' + (r)/2 + ' 0M' + x2 +
                ' ' + y + 'l' + (r)/2 + ' 0' + 'l0 ' + (2.6 * r - 2) + 'l' +
                (r)/(-2) + ' 0';
    this._adoptedShape = editor.getPaper().path(brackets).attr('stroke-width', 2.5);
    this._adoptedShape.toBack();
  },

  /**
     * Removes the brackets around the node icon that show that this node is adopted
     *
     * @method removeAdoptedShape
     */
  removeAdoptedShape: function() {
    this._adoptedShape && this._adoptedShape.remove();
  },

  /**
     * Returns the raphael element or set containing the adoption shape
     *
     * @method getAdoptedShape
     * @return {Raphael.el} Raphael Element
     */
  getAdoptedShape: function() {
    return this._adoptedShape;
  },


  /**
     * Returns a Raphael set or element that contains the graphics associated with this node, excluding the labels.
     *
     * @method getShapes
     */
  getShapes: function ($super) {
    var parentShapes = $super();
    var shapes = parentShapes.push(this.getGenderGraphics());
    this.getAdoptedShape() && shapes.push(this.getAdoptedShape());
    return shapes;
  },

  /**
     * Returns a Raphael set that contains all the graphics and labels associated with this node.
     *
     * @method getAllGraphics
     * @return {Raphael.st}
     */
  getAllGraphics: function ($super) {
    return editor.getPaper().set(this.getHighlightBox(), this._idLabel).concat($super());
  },

  /**
     * Returns the Raphael element representing the gender of the node.
     *
     * @method getGenderGraphics
     * @return {Raphael.st|Raphael.el} Raphael set or Raphael element
     */
  getGenderGraphics: function() {
    return this._genderGraphics;
  },

  /**
     * Returns only the shape element from the genderGraphics (i.e. no shadow)
     *
     * @method getGenderShape
     * @return {Raphael.st|Raphael.el}
     */
  getGenderShape: function() {
    return this._genderShape;
  },

  /**
     * Sets/replaces the gender graphics with graphics appropriate for the gender
     *
     * @method setGenderGraphics
     */
  setGenderGraphics: function() {
    this.unmark();
    this._genderGraphics && this._genderGraphics.remove();

    this._shapeRadius = (this.getNode().getGender() == 'U') ? PedigreeEditorParameters.attributes.radius * 1.1 / Math.sqrt(2) : PedigreeEditorParameters.attributes.radius;
    if (this.getNode().isPersonGroup()) {
      this._shapeRadius *= PedigreeEditorParameters.attributes.groupNodesScale;
    }

    var shape;
    var x      = this.getX(),
      y      = this.getY(),
      radius = this._shapeRadius;

    if (this.getNode().getGender() == 'F') {
      shape = editor.getPaper().circle(x, y, radius);
    } else {
      shape = editor.getPaper().rect(x - radius, y - radius, radius * 2, radius * 2);
      //if (this.getNode().getGender() == 'M') {
      //    shape.node.setAttribute("shape-rendering","crispEdges");
      //}
    }

    var gender = this.getNode().getGender();
    if (gender == 'U') {
        shape.attr(PedigreeEditorParameters.attributes.nodeShapeDiag);
        shape.attr({transform: "...R45"});
    } else if (gender == 'O') {
        shape.attr(PedigreeEditorParameters.attributes.nodeShapeOther);
        shape.attr({transform: "...R45"});
    } else if (gender == 'M') {
        shape.attr(PedigreeEditorParameters.attributes.nodeShapeMale);
        //shape.node.setAttribute("shape-rendering","crispEdges");
    } else if (gender == 'F') {
        shape.attr(PedigreeEditorParameters.attributes.nodeShapeFemale);
    }

    if (!editor.isUnsupportedBrowser()) {
      //var shadow = shape.glow({width: 5, fill: true, opacity: 0.1}).translate(3,3);
      var shadow = shape.clone().attr({stroke: 'none', fill: 'gray', opacity: .3});
      shadow.translate(3,3);
      shadow.insertBefore(shape);
    }

    this._genderShape = shape;

    this._genderGraphics = editor.getPaper().set(shadow, shape);
  },

  /**
     * Sets/replaces the current highlight box
     *
     * @method setGenderGraphics
     */
  setHighlightBox: function() {
    this._highlightBox && this._highlightBox.remove();

    var radius = PedigreeEditorParameters.attributes.personHoverBoxRadius;
    this._highlightBox = editor.getPaper().rect(this.getX()-radius, this.getY()-radius,
      radius*2, radius*2, 5).attr(PedigreeEditorParameters.attributes.boxOnHover);
    this._highlightBox.attr({fill: 'black', opacity: 0, 'fill-opacity': 0});
    this._highlightBox.insertBefore(this.getGenderGraphics().flatten());
  },

  /**
     * Returns the box around the element that appears when the node is highlighted
     *
     * @method getHighlightBox
     * @return {Raphael.rect} Raphael rectangle element
     */
  getHighlightBox: function() {
    return this._highlightBox;
  },

  /**
     * Displays the highlightBox around the node
     *
     * @method highlight
     */
  highlight: function() {
    this.getHighlightBox() && this.getHighlightBox().attr({'opacity': .5, 'fill-opacity':.5});
  },

  /**
     * Hides the highlightBox around the node
     *
     * @method unHighlight
     */
  unHighlight: function() {
    this.getHighlightBox().attr({'opacity': 0, 'fill-opacity':0});
  },

  remove: function ($super) {
    this.marked && this.marked.remove();
    $super();
  }
});

export default AbstractPersonVisuals;
