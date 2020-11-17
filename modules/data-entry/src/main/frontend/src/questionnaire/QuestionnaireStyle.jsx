//
//  Licensed to the Apache Software Foundation (ASF) under one
//  or more contributor license agreements.  See the NOTICE file
//  distributed with this work for additional information
//  regarding copyright ownership.  The ASF licenses this file
//  to you under the Apache License, Version 2.0 (the
//  "License"); you may not use this file except in compliance
//  with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing,
//  software distributed under the License is distributed on an
//  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
//  KIND, either express or implied.  See the License for the
//  specific language governing permissions and limitations
//  under the License.
//

// Props used in grid containers for displaying Form entries
export const FORM_ENTRY_CONTAINER_PROPS = {
    direction: "column",
    spacing: 4,
    alignItems: "stretch",
    justify: "space-between",
    wrap: "nowrap"
  };

const GRID_SPACE_UNIT = FORM_ENTRY_CONTAINER_PROPS.spacing/2;

const questionnaireStyle = theme => ({
    checkbox: {
        margin: theme.spacing(-2,0),
    },
    radiobox: {
        margin: theme.spacing(-2,0),
    },
    ghostRadiobox: {
        margin: theme.spacing(0,0,-5,0),
    },
    ghostFormControl: {
        height: "0px",
    },
    ghostListItem: {
        padding: theme.spacing(0, 2, 0, 2),
    },
    searchWrapper: {
        margin: theme.spacing(0, 0, 0, 6),
        position: 'relative',
        display: 'inline-block',
        paddingBottom: "0px",
        paddingTop: theme.spacing(1)
    },
    answerField: {
        margin: theme.spacing(0, 0, 0, 6),
        position: 'relative',
    },
    textField: {
        // Differing input types have differing widths, so setting width:100%
        // is insufficient in making sure all components are the same size
        minWidth: "250px",
    },
    noteTextField: {
        // the input in notes should be the width of the form
        width: "50%",
        "&.Mui-focused": {
            width: "100%",
        }
    },
    checkboxList: {
        padding: theme.spacing(0),
    },
    deleteButton: {
        padding: theme.spacing(1,0),
        margin: theme.spacing(-1,0,-1,-1.5),
        fontSize: "10px",
        minWidth: "42px",
    },
    mdash: {
        padding: theme.spacing(0, 1),
    },
    cardHeaderButton: {
        // No styles here yet
    },
    questionHeader: {
        paddingBottom: theme.spacing(0),
    },
    hiddenQuestion: {
        display: "none"
    },
    warningTypography: {
        padding: theme.spacing(1, 1),
    },
    pedigreeThumbnail: {
        width: "100%",
        height: "100%"
    },
    pedigreeSmallSVG: {
        cursor: "pointer",
        border: "1px solid",
        display: "inline-block"
    },
    saveButton: {
        position: "fixed",
        top: 'auto',
        bottom: theme.spacing(1),
        right: theme.spacing(6.5)
    },
    newFormButtonWrapper: {
        height: "0px",
        margin: theme.spacing(1),
        position: "relative"
    },
    newFormTypePlaceholder: {
        position: 'relative',
        textAlign: 'center'
    },
    newFormLoadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: "-50%",
        marginTop: "-50%"
    },
    labeledSection: {
        marginTop: theme.spacing(GRID_SPACE_UNIT)
    },
    sectionHeader: {
        paddingBottom: "0 !important",
        marginBottom: theme.spacing(-1)
    },
    subjectCard: {
        minHeight: "200px",
    },
    subjectFormHeader: {
        paddingBottom: "0 !important",
    },
    subjectFormHeaderButton: {
        padding: "0 !important"
    },
    subjectContainer: {
        marginLeft: theme.spacing(4),
        marginTop: theme.spacing(4)
    },
    subjectNewButton: {
        width: "100%",
        height: "0px",
        textAlign: "right",
        marginRight: "90%",
        top: "0px",
        position: 'sticky',
    },
    collapsedSection: {
        padding: "0 !important"
    },
    hiddenSection: {
        display: "none"
    },
    addSectionButton: {
        marginTop: theme.spacing(GRID_SPACE_UNIT * 2)
    },
    childSection: {
        paddingLeft: theme.spacing(GRID_SPACE_UNIT)
    },
    entryActionIcon: {
        padding: theme.spacing(1),
        verticalAlign: "baseline",
        marginRight: theme.spacing(-1),
        float: "right",
        color: theme.palette.text.primary
    },
    recurrentSection: {
        marginLeft: theme.spacing(GRID_SPACE_UNIT),
        paddingLeft: "0 !important",
        width: "auto"
    },
    recurrentHeader: {
        marginLeft: theme.spacing(-GRID_SPACE_UNIT) + " !important",
        paddingLeft: "0 !important"
    },
    collapseWrapper: {
        // Select only questions that occur immediately after padded sections,
        // and add a large margin before them
        "& +.questionContainer": {
            marginTop: theme.spacing(GRID_SPACE_UNIT * 2)
        },
        "& .recurrentSectionInstance:not(:first-child)": {
            marginTop: theme.spacing(GRID_SPACE_UNIT * 3)
        }
    },
    recurrentSectionInstance: {
        // Select the add section button that occurs immediately after padded sections,
        // and add a large margin before it
        "& +.addSectionContainer": {
            marginTop: theme.spacing(GRID_SPACE_UNIT * 2)
        }
    },
    // When the user is deleting a section, highlight it via a border on the left

    highlightedSection: {
        borderLeftWidth: theme.spacing(GRID_SPACE_UNIT),
        borderLeftColor: theme.palette.primary.light,
        borderLeftStyle: "solid",
        marginLeft: theme.spacing(-GRID_SPACE_UNIT),
        marginTop: theme.spacing(GRID_SPACE_UNIT),
        marginBottom: theme.spacing(GRID_SPACE_UNIT),
        paddingTop: theme.spacing(0) + " !important",
        paddingBottom: theme.spacing(0) + " !important"
    },
    highlightedTitle: {
        color: theme.palette.primary.light,
    },
    toggleNotesContainer: {
        padding: theme.spacing(1, 0, 1, 2)
    },
    toggleNotesButton: {
        textTransform: "none"
    },
    noteSection: {
        display: "block",
        marginLeft: theme.spacing(6)
    },
    formHeader: {
        position: "sticky",
        width: "100%",
        top: theme.spacing(4),
        backgroundColor: "white",
        opacity: 1,
        zIndex: "1010",
        margin: theme.spacing(2),
    },
    formFooter: {
        position: "sticky",
        bottom: theme.spacing(0),
        zIndex: 1000,
        maxHeight: "68px",
    },
    formStepper: {
        position: "relative",
    },
    formStepperTop: {
        bottom: "16px",
    },
    formStepperBottom: {
        background: "transparent",
        bottom: "84px",
    },
    formStepperBottomBackground: {
        background: "transparent",
    },
    formStepperTopBar: {
        backgroundColor: theme.palette.secondary.main,
    },
    paginationButton: {
        float: "right",
        margin: theme.spacing(1),
    },
    titleButton: {
        float: "right"
    },
    subjectHeader: {
        display: "inline-block"
    },
    subjectSubHeader: {
        display: "block"
    },
    subjectHeaderButton: {
        float: "right",
        marginTop: theme.spacing(2),
        marginRight: theme.spacing(12)
    },
    childSubjectHeaderButton: {
        display: "inline-block",
        bottom: theme.spacing(1),
        left: theme.spacing(1)
    },
    addNewSubjectButton: {
        width: "250px"
    },
    subjectFilterInput: {
        width: "100%"
    },
    NewFormDialog: {
        width: "500px"
    },
    deleteText: {
        fontSize: "15px",
        color: theme.palette.error.main,
    },
    newSubjectPopper: {
        zIndex: "1301 !important"
    },
    createNewSubjectButton: {
        marginRight: 'auto',
    },
    newSubjectInput: {
        width: '100%'
    },
    invalidSubjectText: {
        fontStyle: "italic"
    },
    aboveBackground: {
        zIndex: 1300
    },
    NCRTooltip: {
        color: theme.palette.primary.main
    },
    NCRLoadingIndicator: {
        disable: "flex"
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500]
    },
    dialogTitle: {
        marginRight: theme.spacing(5)
    },
    fileInfo: {
        padding: theme.spacing(1),
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    },
    warningIcon: {
        color: theme.palette.warning.main
    },
    subjectChip: {
        color:'white',
        marginLeft: theme.spacing(2)
    },
    INCOMPLETEChip: {
        backgroundColor: theme.palette.warning.main
    },
    INVALIDChip: {
        backgroundColor: theme.palette.error.main
    },
    DefaultChip: {
        backgroundColor: theme.palette.warning.main
    },
    questionnaireDisabledListItem: {
        color: theme.palette.grey["500"]
    },
    questionnaireListItem: {
        color: theme.palette.grey["900"]
    },
    questionnaireItemContent: {
        "&.avatarCardContent": {
           paddingLeft: theme.spacing(9),
        },
        "& table th": {
            border: "0 none",
            fontWeight: "bold",
            verticalAlign: "top",
            width: "1%",
            whiteSpace: "nowrap",
            paddingLeft: 0,
            paddingTop: 0,
        },
        "& table td": {
            border: "0 none",
            paddingLeft: 0,
            paddingTop: 0,
        }
    },
    focusedQuestionnaireItem: {
      borderColor: theme.palette.warning.light,
      borderWidth: '2px',
      borderStyle: 'solid',
    },
    hierarchyEditButton: {
        marginLeft: theme.spacing(1)
    },
});

export default questionnaireStyle;
