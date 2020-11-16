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
import LiveTable from "../dataHomepage/LiveTable.jsx";
import HeaderStyle from "../headerStyle.jsx";
import { getEntityIdentifier } from "./EntityIdentifier.jsx";
import { QuickSearchMatch, MatchAvatar } from "./Navbars/QuickSearchIdentifier.jsx";

import { Button, Card, CardContent, CardHeader, ListItem, ListItemText, ListItemAvatar, withStyles } from "@material-ui/core";
import { Link } from "react-router-dom";

// Location of the quick search result metadata in a node, outlining what needs to be highlighted
const LFS_QUERY_MATCH_KEY = "lfs:queryMatch";
const LFS_QUERY_MATCH_PATH_KEY = "@path";

function QuickSearchResults(props) {

  const { classes } = props;

  const url = new URL(window.location);

  const anchor = url.searchParams.get('query');
  const allowedResourceTypes = url.searchParams.getAll('allowedResourceTypes');

  // Display the result identifier with link to result section
  function QuickSearchIdentifier(resultData) {
    let anchorPath = resultData[LFS_QUERY_MATCH_KEY] ? resultData[LFS_QUERY_MATCH_KEY][LFS_QUERY_MATCH_PATH_KEY] : '';
    let fullPath = `/content.html${resultData["@path"]}#${anchorPath}`;
    if (resultData["jcr:primaryType"] == "lfs:Questionnaire") {
      fullPath = `/content.html/admin${resultData["@path"]}#${anchorPath}`;
    }
    return (<>
              <ListItem>
                <ListItemAvatar>
                  {MatchAvatar(resultData, classes)}
                </ListItemAvatar>
                <ListItemText
                  primary={(<a href={fullPath}>{getEntityIdentifier(resultData)}</a>)}
                />
              </ListItem>
            </>
           );
  }

  const columns = [
    {
      "key": "",
      "label": "Identifier",
      "format": QuickSearchIdentifier,
    },
    {
      "key": "",
      "label": "Resource type",
      "format": (row) => (row.type?.label || row["jcr:primaryType"]?.replace(/lfs:/,"") || ''),
    },
    {
      "key": "",
      "label": "Match",
      "format": (row) => (QuickSearchMatch(row[LFS_QUERY_MATCH_KEY], classes)),
    },
  ]

  // import the function

  return (
    <div>
      <Card>
        <CardHeader
          title={
            <Button className={classes.quickSearchResultsTitle}>
              Quick Search Results for <span className={classes.highlightedText}>{anchor}</span>
            </Button>
          }
        />
        <CardContent>
          <LiveTable
            columns={columns}
            customUrl={'/query?quick='+ encodeURIComponent(anchor) + allowedResourceTypes.map(i => `&allowedResourceTypes=${encodeURIComponent(i)}`).join('')}
            defaultLimit={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default withStyles(HeaderStyle)(QuickSearchResults);

