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
import classNames from "classnames";
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";

import { withStyles, FormControl } from "@material-ui/core";
import { ClickAwayListener, Grow, IconButton, Input, InputAdornment, InputLabel } from "@material-ui/core"
import { LinearProgress, MenuItem, MenuList, Paper, Popper, Snackbar, SnackbarContent } from "@material-ui/core";

import Search from "@material-ui/icons/Search";
import Info from "@material-ui/icons/Info";


import { REST_URL, MakeRequest } from "./util.jsx";
import QueryStyle from "./queryStyle.jsx";
import InfoBox from "./infoBox.jsx";

const NO_RESULTS_TEXT = "No results";
const MAX_RESULTS = 10;

// Component that renders a search bar for vocabulary terms.
//
// Required arguments:
//  clearOnClick: Whether selecting an option will clear the search bar (default: true)
//  onClick: Callback when the user clicks on this element
//  focusAfterSelecting: focus after selecting (default: true)
//
// Optional arguments:
//  onInputFocus: Callback when the input is focused on
//  disabled: Boolean representing whether or not this element is disabled
//  label: Default text to display in search bar when nothing has been entered (default: 'Search')
//  overrideText: When not undefined, this will overwrite the contents of the search bar
//  defaultValue: Default chosen term ID, which will be converted to the real ID when the vocabulary loads
//  noMargin: Removes the margin from the search wrapper
//  isNested:  If true, restyles the element to remove most padding and apply a negative margin for better nesting
//  placeholder: String to display as the input element's placeholder
//  value: String to use as the input element value
//  questionDefinition: Object describing the Vocabulary Question for which this suggested input is displayed

function VocabularyQuery(props) {
  const { classes, defaultValue, disabled, noMargin, isNested, onChange, onInputFocus, questionDefinition,
    focusAfterSelecting, placeholder, label, value, onClick, clearOnClick, overrideText } = props;

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [term, setTerm] = useState({});
  const [termInfoVisible, setTermInfoVisible] = useState(false);
  const [lookupTimer, setLookupTimer] = useState(null);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Information about the vocabulary
  const [vocab, setVocab] = useState({});
  const [buttonRefs, setButtonRefs] = useState({});

  let infoRef = useRef();
  let menuPopperRef = useRef();
  let anchorEl = useRef();
  let menuRef = useRef();
  let browserRef = useRef();

  const inputEl = (
    <Input
      disabled={disabled}
      variant='outlined'
      inputProps={{
        "aria-label": "Search"
      }}
      onChange={(event) => {
        delayLookup(event);
        setInputValue(event.target.value)
        onChange && onChange(event);
      }}
      inputRef={anchorEl}
      onKeyDown={(event) => {
        if (event.key == 'Enter') {
          queryInput(anchorEl.current.value);
          event.preventDefault();
        } else if (event.key == 'ArrowDown') {
          // Move the focus to the suggestions list
          if (menuRef.children.length > 0) {
            menuRef.children[0].focus();
          }
          event.preventDefault();
        }
      }}
      onFocus={(status) => {
        if (onInputFocus !== undefined) {
          onInputFocus(status);
        }
        delayLookup(status);
        anchorEl.current.select();
      }}
      disabled={disabled}
      className={noMargin ? "" : classes.searchInput}
      multiline={true}
      endAdornment={(
        <InputAdornment position="end" onClick={()=>{anchorEl.current.select();}} className = {classes.searchButton}>
          <Search />
        </InputAdornment>
      )}
      placeholder={placeholder}
      value={value || inputValue}
  />);

  // Lookup the search term after a short interval
  // This will reset the interval if called before the interval hangs up
  let delayLookup = (status) => {
    if (lookupTimer !== null) {
      clearTimeout(lookupTimer);
    }

    setLookupTimer(setTimeout(queryInput, 500, status.target.value));
    setSuggestionsVisible(true);
    setSuggestions([]);
  }

  let makeMultiRequest = (queue, input, status, prevData) => {
    //Get an vocabulary to search through
    var selectedVocab = queue.pop();
    if (selectedVocab === undefined) {
      showSuggestions(status, {rows: prevData.slice(0, MAX_RESULTS)});
      return;
    }
    var url = new URL(`./${selectedVocab}.search.json`, REST_URL);
    url.searchParams.set("suggest", input.replace(/[^\w\s]/g, ' '));

    //Are there any filters that should be associated with this request?
    if (props?.questionDefinition?.vocabularyFilters?.[selectedVocab]) {
      var filter = questionDefinition.vocabularyFilters[selectedVocab].map((category) => {
        return (`term_category:${category}`);
      }).join(" OR ");
      url.searchParams.set("customFilter", `(${filter})`);
    }

    MakeRequest(url, (status, data) => {
      makeMultiRequest(queue, input, status, prevData.concat(!status && data && data['rows'] ? data['rows'] : []));
    });
  }

  // Grab suggestions for the given input
  let queryInput = (input) => {
    // Hide the infobox and stop the timer
    setTermInfoVisible(false);
    setLookupTimer(null);

    // Empty/blank input? Do not query
    if (input.trim() === "") {
      return;
    }

    // Grab suggestions
    //...Make a queue of vocabularies to search through
    setSuggestionsLoading(true);
    var vocabQueue = questionDefinition.sourceVocabularies.slice();
    makeMultiRequest(vocabQueue, input, null, []);
  }

  // Callback for queryInput to populate the suggestions bar
  let showSuggestions = (status, data) => {
    if (!status) {
        // Populate suggestions
        var suggestions = [];

        if (data["rows"].length > 0) {
          data["rows"].forEach((element) => {
            var name = element["label"] || element["name"] || element["identifier"];
            suggestions.push(
              <MenuItem
                className={classes.dropdownItem}
                key={element["@path"]}
                onClick={(e) => {
                  if (e.target.localName === "li") {
                    onClick(element["@path"], name);
                    setInputValue(clearOnClick ? "" : name);
                    closeSuggestions();
                  }}
                }
              >
                {name}
                <IconButton
                  size="small"
                  buttonRef={node => {
                    registerInfoButton(element["identifier"], node);
                  }}
                  color="primary"
                  aria-owns={termInfoVisible ? "menu-list-grow" : null}
                  aria-haspopup={true}
                  onClick={(e) => getInfo(element["@path"])}
                  className={classes.infoButton}
                >
                  <Info color="primary" />
                </IconButton>
              </MenuItem>
              );
          });
        } else {
          suggestions.push(
            <MenuItem
              className={classes.dropdownItem}
              key={NO_RESULTS_TEXT}
              onClick={onClick}
              disabled={true}
            >
              {NO_RESULTS_TEXT}
            </MenuItem>
          )
        }

        setSuggestions(suggestions);
        setSuggestionsVisible(true);
        setSuggestionsLoading(false);
    } else {
      logError("Failed to search vocabulary term");
    }
  }

  // Event handler for clicking away from the autocomplete while it is open
  let closeAutocomplete = event => {
    if (menuPopperRef?.current?.contains(event.target)
      || infoRef?.current?.contains(event.target)
      || browserRef?.current?.contains(event.target)) {
      return;
    }

    setSuggestionsVisible(false);
    setTermInfoVisible(false);
  };

  // Register a button reference that the info box can use to align itself to
  let registerInfoButton = (id, node) => {
    // List items getting deleted will overwrite new browser button refs, so
    // we must ignore deregistration events
    if (node) {
      buttonRefs[id] = node;
    }
  }

  // Grab information about the given ID and populate the info box
  let getInfo = (path) => {
    setTermInfoVisible(false);
    // If we don't yet know anything about our vocabulary, fill it in
    var vocabPath = `${path.split("/").slice(0, -1).join("/")}.json`;
    if (vocab.path != vocabPath) {
      var url = new URL(vocabPath, window.location.origin);
      MakeRequest(url, parseVocabInfo);
    }

    var url = new URL(path + ".info.json", window.location.origin);
    MakeRequest(url, showInfo);
  }

  let parseVocabInfo = (status, data) => {
    if (status === null) {
      setVocab( { acronym: data["identifier"] || vocabPath.split("/")[2]?.split('.')[0] || "",
                  url: data["website"] || "",
                  description: data["description"],
                  path: data["@path"]
               } );
    } else {
      logError("Failed to search vocabulary details");
    }
  }

  // callback for getInfo to populate info box
  let showInfo = (status, data) => {
    if (status === null) {
      setTerm(data);
      setTermInfoVisible(true);
    } else {
      logError("Failed to search vocabulary term");
    }
  }

  // Event handler for clicking away from the info window while it is open
  let closeInfo = (event) => {
    setTermInfoVisible(false);
  };

  let closeSuggestions = () => {
    if (clearOnClick) {
      anchorEl.current.value = "";
    }
    if (focusAfterSelecting) {
      anchorEl.current.select();
    }
    setSuggestionsVisible(false);
    setTermInfoVisible(false);
  }

  let logError = (message) => {
    setSnackbarVisible(true);
    setSnackbarMessage(message);
    setSuggestionsLoading(false);
  }

  if (disabled) {
    // Alter our text to either the override ("Please select at most X options")
    // or empty it
    anchorEl.current.value = disabled ? overrideText : "";
  }

  return (
      <div>
        {props.children}

        <div className={noMargin ? "" : classes.searchWrapper}>
          {noMargin ?
          inputEl
          :
          <FormControl className={isNested ? classes.nestedSearchInput : classes.search}>
            <InputLabel
              classes={{
                root: classes.searchLabel,
                shrink: classes.searchShrink,
              }}
            >
              { /* Cover up a bug that causes the label to overlap the defaultValue:
                   if it has a displayed value and isn't focused, don't show the label
                 */ }
              { (document.activeElement === anchorEl.current || (!defaultValue && !(anchorEl.current?.value))) ? label : ''}
            </InputLabel>
            {inputEl}
          </FormControl>}
          <LinearProgress className={classes.progressIndicator + " " + (suggestionsLoading ? "" : classes.inactiveProgress)}/>
        </div>
        {/* Suggestions list using Popper */}
        <Popper
          open={suggestionsVisible}
          anchorEl={anchorEl.current}
          transition
          className={
            classNames({ [classes.popperClose]: !open })
            + " " + classes.popperNav
            + " " + classes.popperListOnTop
          }
          placement = "bottom-start"
          keepMounted
          modifiers={{
            flip: {
              enabled: true
            },
            preventOverflow: {
              enabled: true,
              boundariesElement: 'window',
              escapeWithReference: true,
            },
            hide: {
              enabled: true
            }
          }}
          ref={menuPopperRef}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              id="menu-list-grow"
              style={{
                transformOrigin: "left top"
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={closeAutocomplete}>
                  <MenuList role="menu" ref={menuRef}>
                    {suggestions}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
        {/* Info box using Popper */}
        { termInfoVisible && <InfoBox
          open={termInfoVisible}
          anchorEl={term && term["identifier"] ? buttonRefs[term["identifier"]] : null}
          infoRef={infoRef}
          menuPopperRef={menuPopperRef}
          vocabulary={vocab}
          onClose={closeInfo}
          term={term}
          closeBrowser={closeSuggestions}
          registerInfoButton={registerInfoButton}
          logError={logError}
          getInfo={getInfo}
          browserRef={browserRef}
        /> }
        { /* Error snackbar */}
        <Snackbar
          open={snackbarVisible}
          onClose={() => {setSnackbarVisible(false);}}
          autoHideDuration={6000}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          variant="error"
          >
            <SnackbarContent
              className={classes.errorSnack}
              role="alertdialog"
              message={snackbarMessage}
            />
          </Snackbar>
      </div>
    );
}

VocabularyQuery.propTypes = {
    classes: PropTypes.object.isRequired,
    clearOnClick: PropTypes.bool.isRequired,
    onInputFocus: PropTypes.func,
    onClick: PropTypes.func.isRequired,
    focusAfterSelecting: PropTypes.bool.isRequired,
    defaultValue: PropTypes.string,
    disabled: PropTypes.bool,
    label: PropTypes.string,
    overrideText: PropTypes.string,
    defaultValue: PropTypes.string,
    noMargin: PropTypes.bool,
    isNested: PropTypes.bool,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    questionDefinition: PropTypes.object,
};

VocabularyQuery.defaultProps = {
  label: 'Search',
  overrideText: '',
  clearOnClick: true,
  focusAfterSelecting: true
};

export default withStyles(QueryStyle)(VocabularyQuery);
