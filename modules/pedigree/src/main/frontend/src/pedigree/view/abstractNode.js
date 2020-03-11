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

/**
 * AbstractNode is the general abstract class for nodes on the Pedigree graph. An AbstractNode contains information
 * about its position on the canvas and about relationships with other nodes on the graph.
 *
 * @class AbstractNode
 * @constructor
 * @param {Number} x The x coordinate on the canvas
 * @param {Number} y The y coordinate on the canvas
 * @param {Number} [id] The id of the node
 */

var AbstractNode = Class.create( {

  initialize: function(x, y, id) {
    this._id = id;
    this._comments = '';
    !this._type && (this._type = 'AbstractNode');
    this._graphics = this._generateGraphics(x, y);
  },

  /**
     * Returns the unique ID of this node
     *
     * @method getID
     * @return {Number} the id of the node
     */
  getID: function() {
    return this._id;
  },

  /**
     * Sets the ID of this node
     * (when nodes get removed all ids above the removed id shift by one down)
     *
     * @method setID
     */
  setID: function(id) {
    if (id == this._id) {
      return;
    }
    this._id = id;
    this._graphics.onSetID(id);
  },

  /**
     * Generates an instance of AbstractNodeVisuals
     *
     * @method _generateGraphics
     * @param {Number} x The x coordinate of the node
     * @param {Number} y The y coordinate of the node
     * @return {AbstractNodeVisuals}
     * @private
     */
  _generateGraphics: function(x, y) {
    return new AbstractNodeVisuals(this, x, y);
  },

  /**
     * Returns the object responsible for managing graphics
     *
     * @method getGraphics
     * @return {AbstractNodeVisuals}
     */
  getGraphics: function() {
    return this._graphics;
  },

  /**
     * Returns the X coordinate of the node on the canvas
     *
     * @method getX
     * @return {Number} the x coordinate
     */
  getX: function() {
    return this.getGraphics().getX();
  },

  /**
     * Returns the Y coordinate of the node on the canvas
     *
     * @method getY
     * @return {Number} the y coordinate
     */
  getY: function() {
    return this.getGraphics().getY();
  },

  /**
     * Changes the position of the node to (x,y)
     *
     * @method setPos
     * @param {Number} x The x coordinate on the canvas
     * @param {Number} y The y coordinate on the canvas
     * @param {Boolean} [animate] Set to true if you want to animate the transition
     * @param {Function} [callback] The function called at the end of the animation
     */
  setPos: function(x,y, animate, callback) {
    this.getGraphics().setPos(x, y, animate, callback);
  },

  /**
     * Returns the type of this node
     *
     * @method getType
     * @return {String} The type (eg. "Partnership", "Person", etc)
     */
  getType: function() {
    return this._type;
  },

  /**
     * Removes the node and its visuals.
     *
     * @method remove
     * @param [skipConfirmation=false] {Boolean} if true, no confirmation box will pop up
     */
  remove: function() {
    this.getGraphics().remove();
  },

  /**
     * Returns any free-form comments associated with the node
     *
     * @method getComments
     * @return {String}
     */
  getComments: function() {
    return this._comments;
  },

  /**
     * Replaces free-form comments associated with the node
     *
     * @method setComments
     * @param comment
     */
  setComments: function(comment) {
    this._comments = comment;
  },

  /**
     * Returns an object containing all the properties of this node
     * except id, x, y & type
     *
     * @method getProperties
     * @return {Object} in the form
     *
     */
  getProperties: function() {
    var info = {};
    if (this.getComments() != '') {
      info['comments'] = this.getComments();
    }
    return info;
  },

  /**
     * Applies the properties found in info to this node.
     *
     * @method assignProperties
     * @param properties Object
     * @return {Boolean} True if properties were successfully assigned (i.e. no conflicts/invalid values)
     */
  assignProperties: function(properties) {
    if (properties.hasOwnProperty('comments') && this.getComments() != properties.comments) {
      this.setComments(properties.comments);
    }
    return true;
  },

  /**
     * Applies properties that happen to this node when a widget (such as the menu) is closed.
     *
     * @method onWidgetHide
     */
  onWidgetHide: function() {
    this.getGraphics().getHoverBox() && this.getGraphics().getHoverBox().onWidgetHide();
  },

  onWidgetShow: function() {
    this.getGraphics().getHoverBox() && this.getGraphics().getHoverBox().onWidgetShow();
  }
});


var ChildlessBehavior = {
  /**
     * Returns the childless status of this node
     *
     * @method getChildlessStatus
     * @return {Null|String} null, childless or infertile
     */
  getChildlessStatus: function() {
    return this._childlessStatus;
  },

  /**
     * Returns true if the status is either 'infertile' or 'childless'
     *
     * @method isValidChildlessStatus
     * @return {Boolean}
     */
  isValidChildlessStatus: function(status) {
    return ((status == 'infertile' || status == 'childless'));
  }
};

export { AbstractNode as default, ChildlessBehavior };
