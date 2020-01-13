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
import PropTypes from "prop-types";
import React, { useState } from "react";
import { withRouter } from "react-router-dom";

import { ClickAwayListener, Grow, IconButton, Input, InputAdornment, ListItemText, MenuItem, ListItemAvatar, Avatar}  from "@material-ui/core";
import { MenuList, Paper, Popper, Typography, withStyles } from "@material-ui/core";
import AssignmentIcon from "@material-ui/icons/Assignment";
import DescriptionIcon from "@material-ui/icons/Description";
import AssignmentIndIcon from "@material-ui/icons/AssignmentInd";
import Search from "@material-ui/icons/Search";
import HeaderStyle from "./headerStyle.jsx";

const QUERY_URL = "/query";
const MAX_RESULTS = 5;

function SearchBar(props) {
  const { classes, className, closeSidebar, invertColors, doNotEscapeQuery } = props;
  const [ search, setSearch ] = useState("");
  const [ results, setResults ] = useState([]);
  const [ popperOpen, setPopperOpen ] = useState(false);
  const [ timer, setTimer ] = useState();
  const [ error, setError ] = useState();

  let input = React.useRef();
  let suggestionMenu = React.useRef();

  // Callback to update the value of the search bar. Sends off a delayed fulltext request
  let changeSearch = (query) => {
    // Reset the timer if it exists
    if (timer !== null) {
      clearTimeout(timer);
    }

    setSearch(query);
    setPopperOpen(true);
    setResults([{
      name: 'Searching...',
      '@path': '',
      'disabled': true
    }]);
    setTimer(setTimeout(runQuery, 500, query));
    setError(false);
  }

  let sqlEscape = (query) => (
    // The list of characters to escape are taken from https://lucene.apache.org/core/2_9_4/queryparsersyntax.html#Escaping%20Special%20Characters
    // The single quote is escaped via our QueryBuilder, so we ignore it here
    doNotEscapeQuery ? query : (query && query.replace("([+-!(){}[]^\"~*?:\\&& ||])", "\\$1"))
    );

  // Runs a fulltext request
  let runQuery = (query) => {
    let new_url = new URL(QUERY_URL, window.location.origin);
    let escaped_query = "*" + sqlEscape(query) + "*";
    new_url.searchParams.set("quick", encodeURIComponent(escaped_query));
    fetch(new_url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(displayResults)
      .catch(handleError)
  }

  // Callback to store the results of the top results, or to display 'No results'
  let displayResults = (json) => {
    // Parse out the top 5 and display in popper
    if (json.length >= MAX_RESULTS) {
      setResults(json.slice(0, MAX_RESULTS));
    } else if (json.length > 0) {
      setResults(json);
    } else {
      setResults([{
        name: 'No results',
        '@path': '',
        'disabled': true
      }]);
    }
  }

  // Error handling
  let handleError = (response) => {
    setError(response);
  }

  const categoryToAvatar = {
    ["lfs:Form"]: <Avatar className={classes.searchResultFormIcon + " " + classes.searchResultAvatar}>
        <DescriptionIcon />
      </Avatar>,
    ["lfs:Questionnaire"]: <Avatar className={classes.searchResultQuestionnaireIcon + " " + classes.searchResultAvatar}>
        <AssignmentIcon />
      </Avatar>,
    ["lfs:Subject"]: <Avatar className={classes.searchResultSubjectIcon + " " + classes.searchResultAvatar}>
        <AssignmentIndIcon />
      </Avatar>
  }

  // Get a user friendly version of the icon
  let getCategoryIcon = (element) => (
    categoryToAvatar[element["jcr:primaryType"]] ?
      <ListItemAvatar>{categoryToAvatar[element["jcr:primaryType"]]}</ListItemAvatar>
      : " "
  );

  // Get a user friendly version of the category
  let getFriendlyCategory = (element) => {
    const friendlyType = element["jcr:primaryType"] && element["jcr:primaryType"].replace(/lfs:/,"");
    /* Prepend the questionnaire title, if this has it */
    return (element["questionnaire"] ? element["questionnaire"]["title"] + " " + friendlyType
    /* Otherwise just use the user-friendly element name */
      : friendlyType);
  }

  // Attempt a few different methods of getting the name of an element from <code>/query?quick</code>
  let getElementName = (element) => {
    /* Form data: grab the subject name */
    return (element["subject"] && element["subject"]["identifier"])
      /* Questionnaire: grab the title */
      || element["name"] || element["title"]
      /* Subject: grab the subject ID */
      || element["identifier"]
      /* Could not find any of the above: return the uuid */
      || element["jcr:uuid"];
  }

  return(
    <React.Fragment>
      <Input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(event) => changeSearch(event.target.value)}
        onFocus={(event) => {
          // Rerun the query
          changeSearch(search);
        }}
        onKeyDown={(event) => {
          if (event.key == 'ArrowDown' && suggestionMenu.current.children.length > 0) {
            // Move the focus to the suggestions list
            suggestionMenu.current.children[0].focus();
            event.preventDefault();
          }
        }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton className={invertColors ? classes.invertedColors : ""}>
              <Search />
            </IconButton>
          </InputAdornment>
        }
        className={
          classes.search
          + " " + (invertColors ? classes.invertedColors : "")
          + " " + (className ? className : "")
        }
        inputRef={input}
        />
      {/* Suggestions list using Popper */}
      <Popper
        open={popperOpen}
        anchorEl={input.current}
        className={classes.aboveBackground}
        modifiers={{
          keepTogether: {enabled: true}
        }}
        placement = "bottom-start"
        transition
        keepMounted
        >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            style={{transformOrigin: "top"}}
          >
            <Paper square className={classes.suggestionContainer}>
              <ClickAwayListener onClickAway={(event) => {
                // Ignore clickaway events if they're just clicking on the input box
                if (!input.current.contains(event.target)) {
                  setPopperOpen(false)
                }}}>
                <MenuList role="menu" className={classes.suggestions} ref={suggestionMenu}>
                  {error ?
                    /* Error message in the popper, if appropriate */
                    <MenuItem
                      className={classes.dropdownItem}
                      disabled
                      >
                      { /* Handle either a fetch error (which uses error.message/error.name)
                           or an HTTP error (error.status/error.statusText) */}
                      <ListItemText
                        primary={"Error: " + (error.statusText ? error.statusText : error.message)}
                        secondary={(error.status ? error.status : error.name)}
                        primaryTypographyProps={{color: "error"}}
                        />
                    </MenuItem>
                  : results.map( (element) => (
                    /* Results if no errors occurred */
                    <MenuItem
                      className={classes.dropdownItem}
                      key={element["@path"]}
                      disabled={element["disabled"]}
                      onClick={(e) => {
                        // Redirect using React-router
                        if (element["@path"]) {
                          props.history.push("/content.html" + element["@path"]);
                          closeSidebar && closeSidebar();
                          setPopperOpen(false);
                        }
                        }}
                      >
                        {getCategoryIcon(element)}
                        {/* for now, nothing in the secondary until we get the suggest() API working */}
                        <ListItemText
                          primary={(<div>
                            <Typography variant="body2" color="textSecondary">
                              {getFriendlyCategory(element)}
                            </Typography>
                            {getElementName(element)}
                          </div>)}
                          className={classes.dropdownItem}
                          />
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
}

SearchBar.propTypes = {
  invertColors: PropTypes.bool,
  doNotEscapeQuery: PropTypes.bool
}

export default withStyles(HeaderStyle)(withRouter(SearchBar));
