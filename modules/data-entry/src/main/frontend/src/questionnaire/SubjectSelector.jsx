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

import React, { useRef, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import { Avatar, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Input, ListItem, ListItemAvatar, Typography, withStyles } from "@material-ui/core";
import AssignmentIndIcon from "@material-ui/icons/AssignmentInd";
import MaterialTable from "material-table";

import { getHierarchy } from "./Subject.jsx";
import QuestionnaireStyle from "./QuestionnaireStyle.jsx";

/***
 * Create a URL that checks for the existence of a subject
 */
let createQueryURL = (query, type) => {
  let url = new URL("/query", window.location.origin);
  url.searchParams.set("query", `SELECT * FROM [${type}] as n` + query);
  return url;
}

/**
 * Component that displays a dialog to create a new subject
 *
 * @param {array} allowedTypes A collection of lfs:SubjectTypes that are allowed to be chosen.
 * @param {bool} continueDisabled If true, the continue button is disabled.
 * @param {bool} disabled If true, all controls are disabled
 * @param {string} error Error message to display
 * @param {bool} open If true, this dialog is open
 * @param {func} onClose Callback fired when the user tries to close this dialog
 * @param {func} onChangeSubject Callback fired when the user changes the name of the subject
 * @param {func} onChangeType Callback fired when the user selects a subject type
 * @param {func} onSubmit Callback fired when the user clicks the "Create" or "Continue" button
 * @param {bool} requiresParents If true, the button to continue will read "Continue" instead of "Create"
 * @param {string} value The current name of the subject
 */
function UnstyledNewSubjectDialog (props) {
  const { allowedTypes, classes, continueDisabled, disabled, error, open, onClose, onChangeSubject, onChangeType, onSubmit, requiresParents, theme, value } = props;
  const [ newSubjectType, setNewSubjectType ] = useState();

  const COLUMNS = [
    { title: 'Subject type', field: 'label' },
  ];

  let changeType = (type) => {
    onChangeType(type);
    setNewSubjectType(type);
  }

  // Auto-select if there's only one valid SubjectType given in allowedTypes
  useEffect(() => {
    if (allowedTypes?.length === 1) {
      changeType(allowedTypes[0]);
    }
  }, [allowedTypes]);

  return(
    <React.Fragment>
      <Dialog open={open} onClose={onClose} className={classes.newSubjectPopper}>
        <DialogTitle id="new-form-title">
          Create new subject
        </DialogTitle>
        <DialogContent dividers className={classes.NewFormDialog}>
          { error && <Typography color="error">{error}</Typography>}
          <Input
            autoFocus
            disabled={disabled}
            value={value}
            onChange={onChangeSubject}
            className={classes.newSubjectInput}
            placeholder={"Enter subject identifier here"}
            />
          <MaterialTable
            title="Select a type"
            columns={COLUMNS}
            data={allowedTypes?.length ? allowedTypes :
              query => {
                let url = createQueryURL(query.search ? ` WHERE CONTAINS(n.label, '*${query.search}*')` : "", "lfs:SubjectType");
                url.searchParams.set("limit", query.pageSize);
                url.searchParams.set("offset", query.page*query.pageSize);
                return fetch(url)
                  .then(response => response.json())
                  .then(result => {
                    return {
                      data: result["rows"],
                      page: Math.trunc(result["offset"]/result["limit"]),
                      totalCount: result["totalrows"],
                    }}
                  )
              }
            }
            options={{
              search: true,
              addRowPosition: 'first',
              rowStyle: rowData => ({
                /* It doesn't seem possible to alter the className from here */
                backgroundColor: (newSubjectType?.["label"] === rowData["label"]) ? theme.palette.grey["200"] : theme.palette.background.default
              })
            }}
            onRowClick={(event, rowData) => {
              changeType(rowData);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {setNewSubjectType(""); onClose()}}
            variant="contained"
            color="default"
            disabled={disabled}
            >
            Cancel
          </Button>
          <Button
            onClick={() => {setNewSubjectType(""); onSubmit()}}
            variant="contained"
            color="primary"
            disabled={disabled || continueDisabled}
            >
            {requiresParents ? "Continue" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

const NewSubjectDialogChild = withStyles(QuestionnaireStyle, {withTheme: true})(UnstyledNewSubjectDialog)

/**
 * Component that displays a dialog to select parents for a new subject
 *
 * @param {object} childType The object representing the lfs:SubjectType of the child that is being created
 * @param {bool} continueDisabled If true, the continue button is disabled
 * @param {bool} disabled If true, all controls are disabled
 * @param {string} error Error message to display
 * @param {bool} isLast If true, the button to continue will read "Continue" instead of "Create"
 * @param {bool} open If true, this dialog is open
 * @param {func} onBack Callback fired when the user clicks the "Back" button
 * @param {func} onChangeParent Callback fired when the user changes the parent subject
 * @param {func} onCreateParent Callback fired when the user wants to create a new parent. If present, adds a "Create new subject" button.
 * @param {func} onClose Callback fired when the user tries to close this dialog
 * @param {func} onSubmit Callback fired when the user clicks the "Create" or "Continue" button
 * @param {object} parentType The object representing the lfs:SubjectType of the parent that is being selected
 * @param {ref} tableRef Pass a reference to the MaterialTable object
 * @param {object} value The currently selected parent
 */
function UnstyledSelectParentDialog (props) {
  const { classes, childType, continueDisabled, disabled, error, isLast, open, onBack, onChangeParent, onCreateParent, onClose, onSubmit, parentType, tableRef, theme, value } = props;

  const COLUMNS = [
    { title: 'Subject', field: 'hierarchy' },
  ];

  let initialized = parentType && childType;

  return(
    <Dialog open={open} onClose={onClose} className={classes.newSubjectPopper} keepMounted>
      <DialogTitle id="new-form-title">
        Select parent {parentType?.['label']} for new {childType?.['label']}
      </DialogTitle>
      <DialogContent dividers className={classes.NewFormDialog}>
        { error && <Typography color="error">{error}</Typography>}
        {
          initialized &&
            <MaterialTable
              title=""
              columns={COLUMNS}
              data={query => {
                  let url = createQueryURL(` WHERE n.type='${parentType?.["jcr:uuid"]}'` + (query.search ? ` AND CONTAINS(n.identifier, '*${query.search}*')` : ""), "lfs:Subject");
                  url.searchParams.set("limit", query.pageSize);
                  url.searchParams.set("offset", query.page*query.pageSize);
                  return fetch(url)
                    .then(response => response.json())
                    .then(result => {
                      return {
                        data: result["rows"].map((row) => ({
                          hierarchy: getHierarchy(row, React.Fragment, ()=>({})),
                          ...row })),
                        page: Math.trunc(result["offset"]/result["limit"]),
                        totalCount: result["totalrows"],
                      }}
                    )
                }
              }
              options={{
                search: true,
                addRowPosition: 'first',
                rowStyle: rowData => ({
                  /* It doesn't seem possible to alter the className from here */
                  backgroundColor: (value?.["jcr:uuid"] === rowData["jcr:uuid"]) ? theme.palette.grey["200"] : theme.palette.background.default
                })
              }}
              onRowClick={(event, rowData) => {onChangeParent(rowData);}}
              tableRef={tableRef}
            />
        }
      </DialogContent>
      <DialogActions>
        { onCreateParent &&
          <Button
              variant="contained"
              color="secondary"
              onClick={onCreateParent}
              className={classes.createNewSubjectButton}
              >
              New subject
            </Button>
        }
        <Button
          onClick={onClose}
          variant="contained"
          color="default"
          disabled={disabled}
          >
          Cancel
        </Button>
        <Button
          onClick={onBack}
          variant="contained"
          color="default"
          disabled={disabled}
          >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={disabled || continueDisabled}
          >
          { isLast ? "Create" : "Continue" }
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export const SelectParentDialog = withStyles(QuestionnaireStyle, {withTheme: true})(UnstyledSelectParentDialog)

// The value of a subjectType's parents are either an array, or if it is length 1 it will just be an object
// We must cast each case into an array to handle it properly
export const parseToArray = (object) => {
  // Null or undefined is length 0
  if (!object) {
    return [];
  }

  // Convert a non-array to a length 1 array
  return !Array.isArray(object) ? [object] : object;
}

/**
 * Component that displays a dialog to create a new subject
 *
 * @param {array} allowedTypes A collection of lfs:SubjectTypes that are allowed to be chosen.
 * @param {bool} disabled If true, all controls are disabled
 * @param {func} onClose Callback fired when the user tries to close this dialog
 * @param {func} onSubmit Callback fired when the user clicks the "Create" or "Continue" button
 * @param {bool} open If true, this dialog is open
 */
export function NewSubjectDialog (props) {
  const { allowedTypes, disabled, onClose, onSubmit, open, currentSubject } = props;
  const [ error, setError ] = useState("");
  const [ newSubjectName, setNewSubjectName ] = useState([""]);
  const [ newSubjectType, setNewSubjectType ] = useState([""]);
  const [ newSubjectParent, setNewSubjectParent ] = useState([]);
  const [ newSubjectIndex, setNewSubjectIndex ] = useState(0);
  const [ newSubjectAllowedTypes, setNewSubjectAllowedTypes ] = useState([]);
  const [ isPosting, setIsPosting ] = useState(false);

  const [ newSubjectPopperOpen, setNewSubjectPopperOpen ] = useState(true);
  const [ selectParentPopperOpen, setSelectParentPopperOpen ] = useState(false);

  const tableRef = useRef();

  let curSubjectRequiresParents = newSubjectType[newSubjectIndex]?.["parent"];
  let disabledControls = disabled || isPosting;

  let parentSet = (currentSubject && (curSubjectRequiresParents?.["@path"] == currentSubject.type["@path"]));

  let handleNewParent = (e) => {
    //handle SubjectType
    if (currentSubject && (parentSet)) {
      return currentSubject;
    }
    //handle Subject
    if (currentSubject && (e["parents"]?.["type"]["@path"] == currentSubject.type["@path"])) {
      handleNewParent(currentSubject);
    }
  }

  // Called only by createNewSubject, a callback to create the next child on our list
  let createNewSubjectRecursive = (subject, index) => {
    if (index <= -1) {
      // End of recursion
      setIsPosting(false);
      onSubmit(subject);
      clearDialog();
      return;
    }

    // Grab the parent as an array if it exists, or the callback from the previously created parent, or use an empty array
    let parent = newSubjectParent[index]?.["jcr:uuid"] || subject;
    if (parentSet) {
      parent = handleNewParent(newSubjectType[newSubjectIndex])?.["jcr:uuid"];
    }
    parent = (parent ? [parent] : []);
    createSubjects(
      [newSubjectName[index]],
      newSubjectType[index],
      parent,
      newSubjectName[index],
      (new_subject) => {createNewSubjectRecursive(new_subject, index-1)},
      handleError);
  }

  // Callback when an error occurs during createNewSubjectRecursive
  let handleError = (error) => {
    setIsPosting(false);
    setError(error);

    // Since the error will always be during the creation of a subject, we'll revert back to the create subject page
    setNewSubjectPopperOpen(true);
    setSelectParentPopperOpen(false);
  }

  // Called when creating a new subject
  let createNewSubject = () => {
    if (newSubjectName[newSubjectIndex] == "") {
      setError("Please enter a name for this subject.");
    } else if (newSubjectType[newSubjectIndex] == "") {
      setError("Please select a subject type.");
    } else if (selectParentPopperOpen && newSubjectParent.length < newSubjectIndex) {
      // They haven't selected a parent for the current type yet
      setError("Please select a valid parent.");
    } else if (newSubjectPopperOpen && curSubjectRequiresParents) {
      if (parentSet) {
        // Initiate the call if currentSubject is the parent
        setIsPosting(true);
        createNewSubjectRecursive(null, newSubjectIndex);
      }
      else {
        // Display the parent type to select
        setError();
        setNewSubjectPopperOpen(false);
        tableRef.current && tableRef.current.onQueryChange(); // Force the table to re-query our server with the new subjectType
        setSelectParentPopperOpen(true);
      }
    } else {
      // Initiate the call
      setIsPosting(true);
      createNewSubjectRecursive(null, newSubjectIndex);
    }
  }

  let changeNewSubjectName = (name) => {
    setNewSubjectName((old) => {
      let newNames = old.slice();
      newNames[newSubjectIndex] = name;
      return newNames;
    })
  }

  let changeNewSubjectType = (type) => {
    // Unselect all parents after this one
    setNewSubjectParent((old) => {
      let newParents = old.slice(0, newSubjectIndex);
      newParents.push("");
      return newParents;
    });
    setNewSubjectType((old) => {
      let newTypes = old.slice();
      newTypes[newSubjectIndex] = type;
      return newTypes;
    })
  }

  let changeNewSubjectParent = (parent) => {
    setNewSubjectParent((old) => {
      let newParents = old.slice();
      if (old.length < newSubjectIndex) {
        newParents.push(parent);
      } else {
        newParents[newSubjectIndex] = parent;
      }
      return newParents;
    });
  }

  // Handle the case where the user wants to create a new subject to act as the parent
  let addNewParentSubject = () => {
    let newAllowedTypes = parseToArray(newSubjectType[newSubjectIndex]["parent"]);
    setNewSubjectAllowedTypes((old) => {
      let newTypes = old.slice();
      newTypes.push(newAllowedTypes);
      return newTypes;
    });
    setNewSubjectIndex((old) => old+1);
    setNewSubjectName((old) => {
      let newNames = old.slice();
      newNames.push("");
      return newNames;
    });
    setNewSubjectType((old) => {
      let newTypes = old.slice();
      newTypes.push("");
      return newTypes;
    });
    setNewSubjectPopperOpen(true);
    setSelectParentPopperOpen(false);
  }

  let goBack = () => {
    // if there are no new subjects...
    if (newSubjectIndex == 0) {
      // Close the entire dialog
      closeDialog();
    } else {
      // Go back a stage, and reopen the select parent dialog
      setError();
      setNewSubjectIndex((old) => old-1);
      setNewSubjectPopperOpen(false);
      setSelectParentPopperOpen(true);
    }
  }

  let clearDialog = () => {
    setError();
    setNewSubjectIndex(0);
    setNewSubjectName([""]);
    setNewSubjectType([""]);
    setNewSubjectParent([]);
    setNewSubjectAllowedTypes([]);
    setNewSubjectPopperOpen(true);
    setSelectParentPopperOpen(false);
  }

  let closeDialog = () => {
    clearDialog();
    onClose();
  }

  return (
    <React.Fragment>
      <NewSubjectDialogChild
        allowedTypes={newSubjectIndex == 0 ? allowedTypes : newSubjectAllowedTypes[newSubjectIndex-1]}
        continueDisabled={!(newSubjectName[newSubjectIndex] && newSubjectType[newSubjectIndex])}
        disabled={disabledControls}
        error={error}
        onClose={goBack}
        onChangeSubject={(event) => {changeNewSubjectName(event.target.value)}}
        onChangeType = {changeNewSubjectType}
        onSubmit={createNewSubject}
        requiresParents={curSubjectRequiresParents}
        open={open && newSubjectPopperOpen}
        value={newSubjectName[newSubjectIndex]}
      />
      <SelectParentDialog
        childType={newSubjectType[newSubjectIndex]}
        continueDisabled={!newSubjectParent[newSubjectIndex]}
        disabled={disabledControls}
        error={error}
        onBack={() => {
          // Go back to the new subject popper
          setNewSubjectPopperOpen(true);
          setSelectParentPopperOpen(false);
          setError();
        }}
        onClose={closeDialog}
        onChangeParent={changeNewSubjectParent}
        onCreateParent={addNewParentSubject}
        onSubmit={createNewSubject}
        open={open && selectParentPopperOpen}
        parentType={newSubjectType[newSubjectIndex]?.["parent"]}
        tableRef={tableRef}
        value={newSubjectParent[newSubjectIndex]}
        />
    </React.Fragment>)
}

/**
 * Component that displays the list of subjects in a dialog. Double clicking a subject selects it.
 *
 * @param {array} allowedTypes A collection of lfs:SubjectTypes that are allowed to be chosen.
 * @param {bool} open Whether or not this dialog is open
 * @param {func} onChange Callback for when the user changes their selection
 * @param {func} onClose Callback for when the user closes this dialog
 * @param {func} onError Callback for when an error occurs during subject selection
 * @param {string} title Title of the dialog, if any
 */
function UnstyledSelectorDialog (props) {
  const { allowedTypes, classes, disabled, open, onChange, onClose, onError, title, selectedQuestionnaire, ...rest } = props;
  const [ subjects, setSubjects ] = useState([]);
  const [ selectedSubject, setSelectedSubject ] = useState();
  const [ newSubjectPopperOpen, setNewSubjectPopperOpen ] = useState(false);
  const [ isPosting, setIsPosting ] = useState(false);
  const [ error, setError ] = useState("");
  const [ disableProgress, setDisableProgress ] = useState(false);

  // Handle the user clicking on a subject, potentially submitting it
  let selectSubject = (subject) => {
    if (selectedSubject == subject) {
      handleSubmitExisting();
    }
    setSelectedSubject(subject);
  }

  // Obtain the full details on a new subject
  let grabNewSubject = (subjectPath) => {
    let url = new URL(subjectPath + ".deep.json", window.location.origin);

    setIsPosting(true);

    fetch(url)
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((data) => appendPath(data, subjectPath))
      .then(onChange)
      .then(() => setNewSubjectPopperOpen(false))
      .catch((err) => {console.log(err); onError(err);})
      .finally(() => {setIsPosting(false);});
  }

  // Append the @path attribute to an object
  let appendPath = (json, path) => {
    json["@path"] = path;
    return json;
  }

  // Handle the SubjectSelector clicking on a subject, selecting it
  let handleSubmitNew = (subject) => {
    if (disableProgress) {
      // don't allow user to progress if the maxPerSubject has been reached
      return;
    }
    setSelectedSubject(subject);
    grabNewSubject(subject);
    setNewSubjectPopperOpen(false);
  }

  // Handle the user selecting a subject that already exists
  let handleSubmitExisting = () => {
    onChange(selectedSubject);
    setNewSubjectPopperOpen(false);
  }

  let disabled_controls = isPosting || disabled;

  return (<React.Fragment>
    <NewSubjectDialog
      allowedTypes={allowedTypes}
      onClose={() => { setNewSubjectPopperOpen(false); }}
      onSubmit={handleSubmitNew}
      open={open && newSubjectPopperOpen}
      />
    <Dialog open={open} onClose={onClose}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent className={classes.NewFormDialog}>
        {isPosting && <CircularProgress />}
        {error && (!newSubjectPopperOpen) && <Typography color='error'>{error}</Typography>}
        <StyledSubjectSelectorList
          allowedTypes={allowedTypes}
          disabled={disabled_controls}
          onError={setError}
          onSelect={(data) => {selectSubject(data);}}
          setSubjects={setSubjects}
          selectedSubject={selectedSubject}
          subjects={subjects}
          selectedQuestionnaire={selectedQuestionnaire}
          disableProgress={setDisableProgress}
          {...rest}
          />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          disabled={disabled_controls}
          onClick={() => { setNewSubjectPopperOpen(true); }}
          className={classes.createNewSubjectButton}
          >
          New subject
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          color="default"
          disabled={disabled_controls}
          >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitExisting}
          variant="contained"
          color="primary"
          disabled={disabled_controls}
          >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  </React.Fragment>);
}

export const SelectorDialog = withStyles(QuestionnaireStyle)(UnstyledSelectorDialog)

/**
 * Create new subjects from an array of identifiers.
 *
 * @param {array} newSubjects The new subjects to add to the repository, as an array of strings.
 * @param {array} subjectType The subjectType uuid to use for the new subjects.
 * @param {array} subjectParents Parent subjects required by the subject type.
 * @param {object or string} subjectToTrack The selected subject to return the URL for
 * @param {func} returnCall The callback after all subjects have been created
 * @param {func} onError The callback if an error occurs during subject creation
 */
export function createSubjects(newSubjects, subjectType, subjectParents, subjectToTrack, returnCall, onError) {
  let selectedURL = subjectToTrack["@path"];
  let subjectTypeToUse = subjectType["jcr:uuid"] ? subjectType["jcr:uuid"] : subjectType;
  let lastPromise = null;
  for (let subjectName of newSubjects) {
    // Do not allow blank subjects
    if (subjectName == "") {
      continue;
    }

    let url = "/Subjects/" + uuidv4();

    // If this is the subject the user has selected, make a note of the output URL
    if (subjectName == subjectToTrack) {
      selectedURL = url;
    }

    // Make a POST request to create a new subject
    let parentCheckQuery = [];
    let requestData = new FormData();
    requestData.append('jcr:primaryType', 'lfs:Subject');
    requestData.append('identifier', subjectName);
    requestData.append('type', subjectTypeToUse);
    requestData.append('type@TypeHint', 'Reference');
    subjectParents.forEach((parent) => {
      requestData.append('parents', parent);
      parentCheckQuery.push(`n.'parents'='${parent}'`);
    })
    requestData.append('parents@TypeHint', 'Reference');

    let parentCheckQueryString = "";
    if (parentCheckQuery.length) {
      parentCheckQueryString = " AND (" + parentCheckQuery.join(" OR ") + ")";
    } else {
      parentCheckQueryString = " AND n.'parents' IS NULL";
    }

    let checkAlreadyExistsURL = createQueryURL(` WHERE n.'identifier'='${subjectName}'` + parentCheckQueryString, "lfs:Subject");
    let newPromise = fetch( checkAlreadyExistsURL )
      .then( (response) => response.ok ? response.json() : Promise.reject(response))
      .then( (json) => {
        if (json?.rows?.length > 0) {
          // Create an error message, adding the parents if they exist
          let error_msg = subjectType?.['@name'] || "Subject";
          error_msg += ` ${subjectName} already exists`;
          let id = json["rows"][0]["parents"]?.["identifier"];
          if (id) {
            let parentType = json["rows"][0]["parents"]?.["type"]?.["@name"] || "parent";
            error_msg += ` for ${parentType} ${id}.`;
          }

          return Promise.reject(error_msg);
        }
      });

    // Either chain the promise or create a new one
    if (lastPromise) {
      lastPromise
        .then(newPromise)
        .then(() => {fetch( url, { method: 'POST', body: requestData })});
    } else {
      lastPromise = newPromise.then(() => fetch( url, { method: 'POST', body: requestData }));
    }
  }
  // If we're finished creating subjects, create the rest of the form
  if (lastPromise) {
    lastPromise
      .then((response) => {returnCall(selectedURL)})
      .catch(onError);
  } else {
    returnCall(selectedURL);
  }
}

// Helper function to simplify the many kinds of subject list items
// This is outside of NewFormDialog to prevent rerenders from losing focus on the children
export function SubjectListItem(props) {
  let { avatarIcon, children, ...rest } = props;
  let AvatarIcon = avatarIcon;  // Rename to let JSX know this is a prop
  return (<ListItem
    button
    {...rest}
    >
    <ListItemAvatar>
      <Avatar><AvatarIcon /></Avatar>
    </ListItemAvatar>
    {children}
  </ListItem>);
}

SubjectListItem.defaultProps = {
  avatarIcon: AssignmentIndIcon
}

/**
 * Component that displays the list of subjects.
 *
 * @example
 * <SubjectSelectorList
 *   disabled={false}
 *   onSelect={(subject) => {setSelectedSubject(subject)}}
 *   />
 *
 * @param {allowedTypes} array A list of allowed SubjectTypes
 * @param {allowAddSubjects} bool If true, enables an "add user" button on this list
 * @param {allowDeleteSubjects} bool If true, enables an "delete user" button on this list
 * @param {disabled} bool whether selections should be disabled on this element
 * @param {onDelete} func Callback for the deletion of a subject. The only parameter is the subject deleted.
 * @param {onError} func Callback for an issue in the reading or editing of subjects. The only parameter is a response object.
 * @param {onSelect} func Callback for when the user selects a subject.
 * @param {selectedSubject} object The currently selected subject.
 * @param {selectedQuestionnaire} object The currently selected questionnaire
 * @param {disableProgress} bool If true, will not allow user to progress in the dialog (e.g. with creating the form)
 * @param {currentSubject} object The preselected subject (e.g. on the Subject page, the subject who's page it is is the 'currentSubject')
 */
function SubjectSelectorList(props) {
  const { allowedTypes, allowAddSubjects, allowDeleteSubjects, classes, disabled, onDelete, onEdit, onError, onSelect, selectedSubject, selectedQuestionnaire, disableProgress,
    currentSubject, theme, ...rest } = props;
  const COLUMNS = [
    { title: 'Identifier', field: 'hierarchy' },
  ];
  const [ relatedSubjects, setRelatedSubjects ] = useState();
  const [ rowCount, setRowCount ] = useState(5);

  // fetch the Subjects of each form of this questionnaire type
  let filterArray = () => {
    fetch(`/query?query=SELECT distinct s.* FROM [lfs:Subject] AS s inner join [lfs:Form] as f on f.'subject'=s.'jcr:uuid' where f.'questionnaire'='${selectedQuestionnaire?.['jcr:uuid']}'`)
    .then(response => response.json())
    .then(result => {
      setRelatedSubjects(result.rows);
      }
    )
  }

  if (!relatedSubjects) {
    filterArray();
  }

  // if the number of related forms of a certain questionnaire/subject is at the maxPerSubject, an error is set
  let handleSelection = (rowData) => {
    let atMax = (relatedSubjects && selectedQuestionnaire && (relatedSubjects.filter((i) => (i["jcr:uuid"] == rowData["jcr:uuid"])).length >= selectedQuestionnaire?.["maxPerSubject"]))
    if (atMax) {
      onError(`${rowData?.["type"]["@name"]} ${rowData?.["identifier"]} already has ${selectedQuestionnaire?.["maxPerSubject"]} ${selectedQuestionnaire?.["title"]} form(s) filled out.`);
      disableProgress(true);
    }
    else {
      onError("");
      disableProgress(false);
    }
  }

  return(
    <React.Fragment>
      <MaterialTable
        title=""
        columns={COLUMNS}
        data={query => {
            let conditions = [];
            if (allowedTypes?.length) {
              conditions.push("(" + allowedTypes.map((type) => `n.'type' = '${type["jcr:uuid"]}'`).join(" OR ") + ")");
            }
            if (query.search) {
              conditions.push(`CONTAINS(n.identifier, '*${query.search}*')`);
            }
            let condition = (conditions.length === 0) ? "" : ` WHERE ${conditions.join(" AND ")}`

            // fetch all subjects
            let url = createQueryURL( condition, "lfs:Subject");
            url.searchParams.set("limit", query.pageSize);
            url.searchParams.set("offset", query.page*query.pageSize);
            return fetch(url)
              .then(response => response.json())
              .then(result => {
                // recursive function to filter and find related subjects to the currentSubject
                // should also include subject at the same SubjectType level as currentSubject, if they exist

                let getRelatedChild = (e, array) => {
                  var array = array || [];
                  let output = e['parents']?.['@path'];
                  if (e["parents"]) {
                    array.push(output);
                    getRelatedChild(e["parents"], array);
                    return array;
                  } else {
                    return output;
                  }
                }

                let filterRelated = (e) => {
                  // if the selected questionnaire supports the type of current subject
                  if (e['type']?.['@path'] == currentSubject['type']['@path']) return true;
                  return getRelatedChild(e).includes(currentSubject['@path'])
                }

                // recursive function to check if the SubjectType of the selected questionnaire is a child of the 'currentSubject' SubjectType
                // e.g. will return true if the selected questionnaire supports Tumors and the currentSubject SubjectType is Patient
                // if yes, will filter results to find related subjects (with filterRelated)
                let toReturn = [];

                let isSubjectRelated = (e) => {
                  let output = e.type.label;
                  if (e["parents"]) {
                    let ancestors = isSubjectRelated(e["parents"]);
                    toReturn.push(ancestors);
                    toReturn.push(output);
                    return toReturn;
                  } else {
                    return output;
                  }
                }
                return {
                  data: (
                    (currentSubject && (result['rows'].map((row) => isSubjectRelated(row).includes(currentSubject.type.label)))[0])
                    ? result['rows'].filter((e) => filterRelated(e)) : result["rows"]
                  ).map((row) => ({
                    hierarchy: getHierarchy(row, React.Fragment, () => ({})),
                    ...row })),
                  page: Math.trunc(result["offset"]/result["limit"]),
                  totalCount: result["totalrows"],
                }}
              )
          }
        }
        editable={{
          onRowAdd: (allowAddSubjects ? newData => {
            // Do not allow blank subjects
            if (!newData["identifier"]) {
              onError("You cannot create a blank subject");
              return Promise.resolve();
            }

            // Prevent the user from creating a user that already exists
            let check_already_exists_url = new URL("/Subjects/" + newData["identifier"], window.location.origin);

            // Add the new data
            let url = new URL("/Subjects/" + uuidv4(), window.location.origin);

            // Make a POST request to create a new subject
            let request_data = new FormData();
            request_data.append('jcr:primaryType', 'lfs:Subject');
            request_data.append('identifier', newData["identifier"]);

            let check_url = createQueryURL(` WHERE n.'identifier'='${newData["identifier"]}'`, "lfs:Subject");
            return fetch( check_url )
              .then( (response) => response.ok ? response.json() : Promise.reject(response))
              .then( (json) => {
                if (json?.rows?.length > 0) {
                  onError("Subject already exists");
                  return Promise.reject();
                }
              })
              .then( () => (
                fetch( url, { method: 'POST', body: request_data })
                  .then( () => (
                    // Continually attempt to query the newly inserted data until we are certain it is findable
                    new Promise((resolve, reject) => {
                      let checkForNew = () => {
                        fetch(check_url)
                        .then((response) => response.ok ? response.json() : Promise.reject(response))
                        .then((json) => {
                          if (json.returnedrows > 0) {
                            onError();
                            resolve();
                          } else {
                            return Promise.reject(json);
                          }
                        })
                        .catch((error) => {console.log(error); setTimeout(checkForNew, 1000)});
                      }
                      setTimeout(checkForNew, 1000);
                    }))
                  )
                )
              );
          } : undefined),
          onRowDelete: (allowDeleteSubjects ? oldData => {
            // Get the URL of the old data
            let url = new URL(oldData["@path"], window.location.origin);

            // Make a POST request to delete the given subject
            let request_data = new FormData();
            request_data.append(':operation', 'delete');
            onDelete(oldData);
            return fetch( url, { method: 'POST', body: request_data })
            } : undefined),
        }}
        options={{
          search: true,
          actionsColumnIndex: -1,
          addRowPosition: 'first',
          pageSize: rowCount,
          rowStyle: rowData => ({
            /* It doesn't seem possible to alter the className from here */
            backgroundColor: (selectedSubject?.["jcr:uuid"] === rowData["jcr:uuid"]) ? theme.palette.grey["200"] : theme.palette.background.default,
            // grey out subjects that have already reached maxPerSubject
            color: ((relatedSubjects && selectedQuestionnaire && (relatedSubjects.filter((i) => (i["jcr:uuid"] == rowData["jcr:uuid"])).length >= selectedQuestionnaire?.["maxPerSubject"]))
            ? theme.palette.grey["500"]
            : theme.palette.grey["900"]
            )
          })
        }}
        localization={{
          body: {
            addTooltip: "Add a new subject",
            editRow: {
              /* NB: We can't escape the h6 placed around the delete text, so we instead override the style */
              deleteText: <span className={classes.deleteText}>Are you sure you want to delete this row?</span>
            }
          }
        }}
        onRowClick={(event, rowData) => {onSelect(rowData); handleSelection(rowData)}}
        onChangeRowsPerPage={pageSize => {setRowCount(pageSize);}}
      />
    </React.Fragment>
  )
};

const StyledSubjectSelectorList = withStyles(QuestionnaireStyle, {withTheme: true})(SubjectSelectorList)

export default StyledSubjectSelectorList;
