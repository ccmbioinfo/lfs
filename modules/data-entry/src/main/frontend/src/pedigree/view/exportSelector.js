import { Class, $, $$, PElement } from '../shims/prototypeShim';
import PModalPopup from '../shims/phenotipsShim';
import PedigreeExport from '../model/export';

/**
 * The UI Element for exporting pedigrees
 *
 * @class ExportSelector
 */

var ExportSelector = Class.create( {

  initialize: function() {
    var _this = this;

    var mainDiv = PElement('div', {'class': 'import-selector'});

    var _addTypeOption = function (checked, labelText, value) {
      var optionWrapper = PElement('tr');
      var input = PElement('input', {'type' : 'radio', 'value': value, 'name': 'export-type'});
      input._p_observe('click', _this.disableEnableOptions );
      if (checked) {
        input.checked = true;
      }
      var label = PElement('label', {'class': 'import-type-label'})._p_insert(input)._p_insert(labelText);
      optionWrapper._p_insert(label._p_wrap('td'));
      return optionWrapper;
    };
    var typeListElement = PElement('table');
    typeListElement._p_insert(_addTypeOption(true,  'PED', 'ped'));

    var fileDownload = PElement('a', {'id': 'downloadLink', 'style': 'display:none'});
    mainDiv._p_insert(fileDownload);

    var promptType = PElement('div', {'class': 'import-section'})._p_update('Data format:');
    var dataSection2 = PElement('div', {'class': 'import-block'});
    dataSection2._p_insert(promptType)._p_insert(typeListElement);
    mainDiv._p_insert(dataSection2);

    var _addConfigOption = function (checked, name, cssClass, labelText, value) {
      var optionWrapper = PElement('tr');
      var input = PElement('input', {'type' : 'radio', 'value': value, 'name': name });
      if (checked) {
        input.checked = true;
      }
      var label = PElement('label', {'class': cssClass})._p_insert(input)._p_insert(labelText);
      optionWrapper._p_insert(label._p_wrap('td'));
      return optionWrapper;
    };
    var configListElementPED = PElement('table', {'id': 'pedOptions'});
    var label = PElement('label', {'class': 'export-config-header'})._p_insert('Which of the following fields should be used to generate person IDs?');
    configListElementPED._p_insert(label._p_wrap('td')._p_wrap('tr'));
    configListElementPED._p_insert(_addConfigOption(true,  'ped-options', 'export-subconfig-label', 'External ID', 'external'));
    configListElementPED._p_insert(_addConfigOption(false, 'ped-options', 'export-subconfig-label', 'Name', 'name'));
    configListElementPED._p_insert(_addConfigOption(false, 'ped-options', 'export-subconfig-label', 'None, generate new numeric ID for everyone', 'newid'));

    var promptConfig = PElement('div', {'class': 'import-section'})._p_update('Options:');
    var dataSection3 = PElement('div', {'class': 'import-block'});
    dataSection3._p_insert(promptConfig)._p_insert(configListElementPED);
    mainDiv._p_insert(dataSection3);

    var buttons = PElement('div', {'class' : 'buttons import-block-bottom'});
    buttons._p_insert(PElement('input', {type: 'button', name : 'export', 'value': 'Export', 'class' : 'button', 'id': 'export_button'})._p_wrap('span', {'class' : 'buttonwrapper'}));
    buttons._p_insert(PElement('input', {type: 'button', name : 'cancel', 'value': 'Cancel', 'class' : 'button secondary'})._p_wrap('span', {'class' : 'buttonwrapper'}));
    mainDiv._p_insert(buttons);

    var cancelButton = buttons._p_down('input[name="cancel"]');
    cancelButton._p_observe('click', function(event) {
      _this.hide();
    });
    var exportButton = buttons._p_down('input[name="export"]');
    exportButton._p_observe('click', function(event) {
      _this._onExportStarted();
    });

    var closeShortcut = ['Esc'];
    this.dialog = new PModalPopup(mainDiv, {close: {method : this.hide.bind(this), keys : closeShortcut}}, {extraClassName: 'pedigree-import-chooser', title: 'Pedigree export', displayCloseButton: true});
  },

  /*
     * Disables unapplicable options on input type selection
     */
  disableEnableOptions: function () {
    var exportType = $$('input:checked[type=radio][name="export-type"]')[0].value;

    var pedOptionsTable = $('pedOptions');

    if (exportType == 'ped') {
      pedOptionsTable._p_show();
    } else {
      pedOptionsTable._p_hide();
    }
  },

  /**
     * Loads the template once it has been selected
     *
     * @param event
     * @param pictureBox
     * @private
     */
  _onExportStarted: function() {
    this.hide();

    var exportType = $$('input:checked[type=radio][name="export-type"]')[0].value;

    if (exportType == 'ped') {
      var idGenerationSetting = $$('input:checked[type=radio][name="ped-options"]')[0].value;
      if (exportType == 'ped') {
        var exportString = PedigreeExport.exportAsPED(editor.getGraph().DG, idGenerationSetting);
        var fileName = 'open-pedigree.ped';
      }
      var mimeType = 'text/plain';
    }

    saveTextAs(exportString, fileName);
  },

  /**
     * Displays the template selector
     *
     * @method show
     */
  show: function() {
    this.dialog.show();
  },

  /**
     * Removes the the template selector
     *
     * @method hide
     */
  hide: function() {
    this.dialog.closeDialog();
  }
});

export default ExportSelector;
