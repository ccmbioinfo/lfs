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
import Person from './person';
import PersonGroupVisuals from './personGroupVisuals';

/**
 * PersonGroup is node that represents a grouping of an unknown number of nodes ("n"). This type of
 * node is usually used to indicate the existence of relatives without providing any other information.
 * Therefore the options for this node are limited.
 *
 * @class PersonGroup
 * @constructor
 * @extends AbstractPerson
 * @param {Number} x The x coordinate on the Raphael canvas at which the node drawing will be centered
 * @param {Number} y The y coordinate on the Raphael canvas at which the node drawing will be centered
 * @param {String} gender Either 'M', 'F' or 'U' depending on the gender
 * @param {Number} id Unique ID number
 */
var PersonGroup = Class.create(Person, {

  initialize: function ($super, x, y, id, properties) {
    this._numPersons = 1;
    this._comment    = '';
    this._type       = 'PersonGroup';
    $super(x, y, id, properties);
    // already done as the last step in super():
    // this.assignProperties(properties);
  },

  /**
     * Initializes the object responsible for creating graphics for this PersonGroup
     *
     * @method _generateGraphics
     * @param {Number} x The x coordinate of hte PersonGroup Node
     * @param {Number} y The y coordinate of hte PersonGroup Node
     * @return {PersonGroupVisuals}
     */
  _generateGraphics: function(x, y) {
    return new PersonGroupVisuals(this, x, y);
  },

  /**
     * Always returns False - needed for compatibility with personHowerBox which uses this
     *
     * @method isProband
     */
  isProband: function() {
    return false;
  },

  /**
     * Changes the number of people who are in this PersonGroup
     *
     * @method setNumPersons
     * @param {Number} numPersons The number of people in this grouping
     */
  setNumPersons: function(numPersons) {
    this._numPersons = numPersons;
    this.getGraphics().setNumPersons(numPersons);
  },

  /**
     * Returns the number of people who are in this PersonGroup
     *
     * @method getNumPersons
     * @return {Number}
     */
  getNumPersons: function() {
    return this._numPersons;
  },

  /**
     * Changes the life status of this Person to newStatus
     *
     * @method setLifeStatus
     * @param {String} newStatus "alive", "deceased", "stillborn", "unborn", "aborted" or "miscarriage"
     */
  setLifeStatus: function ($super, newStatus) {
    $super(newStatus);
    this.getGraphics().setNumPersons(this._numPersons); // force-redraw of the "N" symbol on top of the new shape
  },

  /**
     * Returns an object containing all the properties of this node
     * except id, x, y & type
     *
     * @method getProperties
     * @return {Object} in the form
     *
     {
       property: value
     }
     */
  getProperties: function ($super) {
    var info = $super();
    info['numPersons'] = this.getNumPersons();
    return info;
  },

  /**
     * Applies the properties found in info to this node.
     *
     * @method loadProperties
     * @param properties Object
     * @return {Boolean} True if info was successfully assigned
     */
  assignProperties: function ($super, info) {
    if ($super(info) && info.numPersons) {
      if (this.getNumPersons() != info.numPersons) {
        this.setNumPersons(info.numPersons);
      }
      return true;
    }
    return false;
  },

  /**
     * Returns an object (to be accepted by the menu) with information about this Person
     *
     * @method getSummary
     * @return {Object} Summary object for the menu
     */
  getSummary: function() {
    var disorders = [];
    this.getDisorders().forEach(function(disorder) {
      var disorderName = editor.getDisorderLegend().getDisorder(disorder).getName();
      disorders.push({id: disorder, value: disorderName});
    });

    var cantChangeAdopted = this.isFetus() || editor.getGraph().hasToBeAdopted(this.getID());

    return {
      identifier:   {value : this.getID()},
      comment:      {value : this.getFirstName()},
      gender:       {value : this.getGender()},
      external_ids: {value : this.getExternalID()},
      disorders:    {value : disorders},
      adopted:      {value : this.isAdopted(), inactive: cantChangeAdopted},
      comments:     {value : this.getComments(), inactive: false},
      state:        {value : this.getLifeStatus()},
      numInGroup:   {value : this.getNumPersons()},
      evaluatedGrp: {value : this.getEvaluated() }
    };
  }
});

export default PersonGroup;
