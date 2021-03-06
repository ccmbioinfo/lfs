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

import { Class, $, PFireEvent } from '../shims/prototypeShim';
import Raphael from '../raphael';
import Legend from './legend';
import Person from './person';
import { removeFirstOccurrenceByValue } from '../model/helpers';

/**
 * Class responsible for keeping track of candidate genes.
 * This information is graphically displayed in a 'Legend' box.
 *
 * @class GeneLegend
 * @constructor
 */
var GeneLegend = Class.create( Legend, {

  initialize: function ($super) {
    $super('Candidate Genes');
  },

  _getPrefix: function(id) {
    return 'gene';
  },

  /**
     * Generate the element that will display information about the given disorder in the legend
     *
     * @method _generateElement
     * @param {String} geneID The id for the gene
     * @param {String} name The human-readable gene description
     * @return {HTMLLIElement} List element to be insert in the legend
     */
  _generateElement: function ($super, geneID, name) {
    if (!this._objectColors.hasOwnProperty(geneID)) {
      var color = this._generateColor(geneID);
      this._objectColors[geneID] = color;
      PFireEvent('gene:color', {'id' : geneID, color: color});
    }

    return $super(geneID, name);
  },

  /**
     * Generates a CSS color.
     * Has preference for some predefined colors that can be distinguished in gray-scale
     * and are distint from disorder colors.
     *
     * @method generateColor
     * @return {String} CSS color
     */
  _generateColor: function(geneID) {
    if(this._objectColors.hasOwnProperty(geneID)) {
      return this._objectColors[geneID];
    }

    var usedColors = Object.values(this._objectColors),
      // green palette
      prefColors = ['#81a270', '#c4e8c4', '#56a270', '#b3b16f', '#4a775a', '#65caa3'];
    usedColors.forEach( function(color) {
      removeFirstOccurrenceByValue(prefColors, color);
    });
    if(prefColors.length > 0) {
      return prefColors[0];
    } else {
      var randomColor = Raphael.getColor();
      while(randomColor == '#ffffff' || usedColors.indexOf(randomColor) != -1) {
        randomColor = '#'+((1<<24)*Math.random()|0).toString(16);
      }
      return randomColor;
    }
  }
});

export default GeneLegend;
