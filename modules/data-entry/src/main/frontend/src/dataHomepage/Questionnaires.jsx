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
import LiveTable from "./LiveTable.jsx";
import Questionnaire from "../questionnaire/Questionnaire.jsx";
import QuestionnaireStyle from "../questionnaire/QuestionnaireStyle";
import NewQuestionnaireDialog from "../questionnaireEditor/NewQuestionnaireDialog.jsx";
import { Button, Card, CardHeader, CardContent, withStyles } from "@material-ui/core";
import DeleteButton from "./DeleteButton.jsx";
import EditButton from "./EditButton.jsx";
import { getEntityIdentifier } from "../themePage/EntityIdentifier.jsx";

function Questionnaires(props) {
  const { classes } = props;
  const entry = /Questionnaires\/([^.]+)/.exec(location.pathname);

  if (entry) {
    return <Questionnaire id={entry[1]} key={location.pathname}/>;
  }

  let columns = [
    {
      "key": "title",
      "label": "Title",
      "format": getEntityIdentifier,
      "link": "dashboard+path",
    },
    {
      "key": "jcr:created",
      "label": "Created on",
      "format": "date:YYYY-MM-DD HH:mm",
    },
    {
      "key": "jcr:createdBy",
      "label": "Created by",
      "format": "string",
    },
  ]
  const actions = [
    DeleteButton,
    EditButton
  ]

  return (
    <React.Fragment>
      <Card>
       <CardHeader
        title={
          <Button className={classes.cardHeaderButton}>
            Questionnaires
          </Button>
        }
        action={
          <NewQuestionnaireDialog />
        }
        classes={{
          action: classes.newFormButtonHeader
        }}
        />
        <CardContent>
          <LiveTable
            columns={columns}
            actions={actions}
            entryType={"Questionnaire"}
            admin={true}
            />
        </CardContent>
      </Card>
    </React.Fragment>
  );
}

export default withStyles(QuestionnaireStyle)(Questionnaires);
