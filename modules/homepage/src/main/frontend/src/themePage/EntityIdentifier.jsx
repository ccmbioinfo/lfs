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
import { getTextHierarchy } from "../questionnaire/Subject.jsx";

import { Link } from "react-router-dom";

// Get the identifier of the item wrt item primaryType
export function getEntityIdentifier(row) {
    switch (row["jcr:primaryType"]) {
      // form identifier should be displayed as "123 / 1 : quesionaire title" as one solid link to the form
      case "lfs:Form":
        let questionnaire = row.questionnaire?.title || row["@name"];
        let subjectHierarchy = row.subject ? getTextHierarchy(row.subject).concat(' : ') : '';
        return `${subjectHierarchy}${questionnaire}`;
        // subject id should include all parents if any (e.g. "1003 / 1 / a")
        // with one link on the whole id, leading to the last subject (e.g. a)
      case "lfs:Subject":
        return getTextHierarchy(row);
      case "lfs:Questionnaire":
        return row.title;
      // default covers other cases
      default:
        return row.subject?.identifier || row["@name"] || anchor;
    }
}

// Display the identifier of the item as a link wrt item primaryType
export function getEntityIdentifierLink(row) {
    let id = getEntityIdentifier(row);
    let path = `/content.html${row["@path"]}`;
    if (row["jcr:primaryType"] == "lfs:Questionnaire") {
      path = `/content.html/admin${row["@path"]}`;
    }
    return (<a href={path}>{id}</a>);
}
