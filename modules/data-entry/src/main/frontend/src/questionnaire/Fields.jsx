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

import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, withStyles } from "@material-ui/core";
import QuestionComponentManager from "./QuestionComponentManager";
import QuestionnaireStyle from './QuestionnaireStyle';

import BooleanInput from "./BooleanInput";
import NumberInput from "./NumberInput";
import TextInput from "./TextInput";
import ObjectInput from "./ObjectInput";

let Fields = (props) => {
  let { data, JSON } = props;
 /**
 * Method responsible for displaying a question from the questionnaire
 *
 * @param {String} key the lablel of the question
 * @param {Object} value the data type of the question
 * @returns a React component that renders the question
 */

let displayField = (key, value) => {
  // This variable must start with an upper case letter so that React treats it as a component
  const FieldDisplay = QuestionComponentManager.getQuestionComponent(key);
  return (
    <Grid item key={key}>
      <FieldDisplay
        objectKey={key}
        data={data}
        />
    </Grid>
  );
};

  return Object.entries(JSON).map(([key, value]) => (
    displayField(key, value)));
}

Fields.propTypes = {
  data: PropTypes.object.isRequired,
  JSON: PropTypes.object.isRequired
};
  
export default withStyles(QuestionnaireStyle)(Fields);
