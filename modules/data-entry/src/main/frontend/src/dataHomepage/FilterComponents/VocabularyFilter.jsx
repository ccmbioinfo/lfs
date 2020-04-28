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

import React, { forwardRef, useState } from "react";
import { withStyles } from "@material-ui/core";
import PropTypes from "prop-types";

import FilterComponentManager from "./FilterComponentManager.jsx";
import { DEFAULT_COMPARATORS, UNARY_COMPARATORS, VALUE_COMPARATORS } from "./FilterComparators.jsx";
import VocabularySelector from "../../vocabQuery/query.jsx";
import QuestionnaireStyle from "../../questionnaire/QuestionnaireStyle.jsx";

const COMPARATORS = DEFAULT_COMPARATORS.slice().concat(UNARY_COMPARATORS).concat(VALUE_COMPARATORS);

/**
 * Display a filter on a vocabulary answer of a form. This is not meant to be instantiated directly, but is returned from FilterComponentManager's
 * getFilterComparatorsAndComponent method.
 *
 * @param {string} defaultValue The default value to place in the vocabulary filter
 * @param {func} onChangeInput Callback for when the value select has changed
 * @param {object} questionDefinition Object containing the definition of the question. Should include "sourceVocabulary" and "vocabularyFilter" children.
 * Other props are forwarded to the VocabularySelector component
 *
 */
const VocabularyFilter = forwardRef((props, ref) => {
  const { classes, defaultValue, onChangeInput, questionDefinition, ...rest } = props;
  let vocabulary = questionDefinition["sourceVocabulary"];
  let vocabularyFilter = questionDefinition["vocabularyFilter"];

  return (
    <VocabularySelector
      onClick={(id, name) => {onChangeInput(id, name)}}
      clearOnClick={false}
      vocabularyFilter={vocabularyFilter}
      defaultValue={defaultValue}
      vocabulary={vocabulary}
      placeholder="empty"
      ref={ref}
      noMargin
      {...rest}
      />
  )
});

VocabularyFilter.propTypes = {
  defaultValue: PropTypes.string,
  onChangeInput: PropTypes.func,
  questionDefinition: PropTypes.shape({
    sourceVocabulary: PropTypes.string,
    vocabularyFilter: PropTypes.string,
  })
}

const StyledVocabularyFilter = withStyles(QuestionnaireStyle)(VocabularyFilter)

export default StyledVocabularyFilter;

FilterComponentManager.registerFilterComponent((questionDefinition) => {
  if (questionDefinition.dataType === "vocabulary") {
    return [COMPARATORS, StyledVocabularyFilter, 50];
  }
});
