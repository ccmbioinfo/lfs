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
import React from "react";
import PropTypes from "prop-types";
// @material-ui/core
import { withStyles } from "@material-ui/core/styles";
import { Dialog, Typography } from '@material-ui/core';
// material-dashboard-react
import Button from "material-dashboard-react/dist/components/CustomButtons/Button.js";

import BrowseListChild from "./browseListChild.jsx";
import BrowseTheme from "./browseStyle.jsx";

import { REST_URL, MakeRequest, MakeChildrenFindingRequest } from "./util.jsx";

class BrowseDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "Term browser",
      lastKnownTerm: "",
      parentNode: null,
      currentNode: null,
      childNodes: {},
      childTermsToLookup: [],
      hasChildren: {},
      isExpanded: {},
    };
  }

  // Construct a branch element for rendering
  constructBranch = (id, name, ischildnode, defaultexpanded, bolded) => {
    return(
      <BrowseListChild
        id={id}
        name={name}
        changeid={this.props.changeid}
        registerinfo={this.props.registerinfo}
        getinfo={this.props.getinfo}
        expands={ischildnode}
        defaultopen={defaultexpanded}
        key={id}
        headnode={!ischildnode}
        bolded={bolded}
      />
    );
  }

  // Check for children of children elements
  checkForChildren = (event, data, parent) => {
    if (event === null) {
      this.state.hasChildren[parent] = (data["rows"].length > 0);
      this.forceUpdate();
    } else {
      console.log("Error: children lookup failed with code " + event.ToString());
    }
  }

  // Callback from an onload to generate child nodes in state.childNodes
  rebuildChildren = (event, data, parent) => {
    if (event === null) {
      // We have the children of our parent
      this.state.childNodes[parent] = data["rows"].map((row, index) => {
        // We also need to determine if this child has children of its own
        MakeChildrenFindingRequest(row["id"], (status, data) => {this.checkForChildren(status, data, id)});
        return this.constructBranch(id, row["name_translated"], true, false, false);
      });
    } else {
      console.log("Error: term lookup failed with code " + event.ToString());
    }
  }

  // Callback from an onload to generate the tree from a /suggest query about the parent
  rebuildTree = (event, data) => {
    if (event === null) {
      // We have the node we're looking at, and its parent.
      var currentNodeData = data["rows"][0];
      var id = currentNodeData["id"];

      // Look up every child of this node
      MakeChildrenFindingRequest(id, (status, data) => {this.rebuildChildren(status, data, id)});

      // Construct parent elements
      const parentBranches = currentNodeData["parents"].map((row, index) => {
        return this.constructBranch(row["id"], row["name_translated"], false, false, false);
      });

      this.setState({
        parentNode: parentBranches,
        currentNode: this.constructBranch(currentNodeData["id"], currentNodeData["name_translated"], true, true, true),
        lastKnownTerm: id,
      })
    } else {
      console.log("Error: initial term lookup failed with code " + event.ToString());
    }
  }

  // Get suggestions and rebuild the browser tree for the given input
  rebuildBrowser = (id) => {
    // Do not re-grab suggestions for the same term
    if (id === this.state.lastKnownTerm) {
      return;
    }

    // If the search is empty, remove every component
    if (id === "" || id === null) {
      this.setState({
        parentNode: null,
        currentNode: null,
        childNodes: {},
        childTermsToLookup: [],
        lastKnownTerm: id,
      })
      return;
    }

    // Create the XHR request
    var URL = REST_URL + `/hpo/suggest?sort=nameSort%20asc&maxResults=10000&input=${id}`;
    MakeRequest(URL, this.rebuildTree);
  }

  render() {
    const { classes, term, changeid, registerinfo, getinfo, changeinfoid, onClose, ...rest } = this.props;
    const fullscreen = false;
    this.rebuildBrowser(term);

    return (
      <Dialog
        fullscreen={fullscreen.toString()}
        className={classes.dialog}
        onClose={onClose}
        {...rest}
      >
        <div className={classes.headbar}>
          <Typography inline className={classes.headbarText}>Related terms</Typography>
          <Button
            className={classes.closeButton}
            onClick={onClose}
            variant="outlined"
            justIcon={true}
            simple={true}
          >
            x
          </Button>
        </div>
        <div className={classes.treeContainer}>
          <div className={classes.treeRoot}>
            {this.state.parentNode}
          </div>
          <div className={classes.treeNode}>
            {this.state.currentNode}
          </div>
        </div>
      </Dialog>
    );
  }
}

BrowseDialog.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(BrowseTheme)(BrowseDialog);