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

import React, { useState, useRef } from "react";
import { fields } from "./EditDialog"
import PropTypes from "prop-types";
import {
  Grid,
  MenuItem,
  Select,
  Typography,
  withStyles
} from "@material-ui/core";

import QuestionnaireStyle from "./QuestionnaireStyle";

let ObjectInput = (props) => {
  let { objectKey, value, data } = props;
  let [ selectedValue, setSelectedValue] = useState(data[objectKey] || '');
  
  let formatString = (originalKey) => {
    let formattedString = originalKey.charAt(0).toUpperCase() + originalKey.slice(1);
    return formattedString.split(/(?=[A-Z])/).join(" ");
  }
  return (
    <div>
      <Grid container alignItems="flex-end" spacing={2}>
      <Grid item xs={6}>
        <Typography>{ formatString(objectKey) }</Typography>
      </Grid>
      <Grid item xs={6}>
          <Select id={objectKey} name={objectKey} defaultValue={data[objectKey] || ''} onChange={(event) => { setSelectedValue(event.target.value); }}>
          { typeof(value) === "object" && Object.keys(value).map((name, val) => 
            <MenuItem name={name} id={name} value={name}>
              <Typography>{name}</Typography>
            </MenuItem>
          )}
          </Select>
        </Grid>
      </Grid>
      { typeof(value) === "object" && selectedValue != '' && fields(data, value[selectedValue]) }
    </div>
  )
}

ObjectInput.propTypes = {
  objectKey: PropTypes.string.isRequired,
  value: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
};
  
export default withStyles(QuestionnaireStyle)(ObjectInput);