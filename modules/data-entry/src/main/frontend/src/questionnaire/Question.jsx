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

import { Card, CardHeader, CardContent, List, ListItem, Typography, withStyles } from "@material-ui/core";

import QuestionnaireStyle from "./QuestionnaireStyle";

// GUI for displaying answers
function Question (props) {
  let { classes, children, questionDefinition, existingAnswer, isEdit, preventDefaultView, defaultDisplayFormatter } = props;
  let { text, description } = { ...questionDefinition, ...props }

  return (
    <Card>
      <CardHeader
        title={text}
        titleTypographyProps={{ variant: 'h6' }}
        subheader={description}
        className={classes.questionHeader}
        />
      <CardContent>
        { !isEdit && !preventDefaultView && existingAnswer ?
          <List>
            { Array.of(existingAnswer?.[1]["displayedValue"]).flat().map( (item, idx) => {
              return(
                <ListItem key={item}> {defaultDisplayFormatter ? defaultDisplayFormatter(item, idx) : item} </ListItem>
              )})
            }
          </List>
          :
          children
        }
        { !isEdit && existingAnswer?.[1]["note"] &&
          <ListItem key="note">
            <Typography variant="subtitle1" className={classes.notesViewDisplay} >Notes: </Typography> {existingAnswer?.[1]["note"]}
          </ListItem>
        }
      </CardContent>
    </Card>
    );
}

Question.propTypes = {
    classes: PropTypes.object.isRequired,
    text: PropTypes.string,
    description: PropTypes.string
};

export default withStyles(QuestionnaireStyle)(Question);
