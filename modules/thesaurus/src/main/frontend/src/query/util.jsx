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

// Make a request for a json file, calling callback with parameters (xhr status, json data)
export function MakeRequest(URL, callback) {
    var xhr = window.Sling.getXHR();
    xhr.open('GET', URL, true);
    xhr.responseType = 'json';
    xhr.onload = () => {
        var status = (xhr.status === 200 ? null : xhr.status);
        callback(status, xhr.response);
    }
    xhr.send();
}

// Find children of a node by id, calling callback with parameters (xhr status, json data)
export function MakeChildrenFindingRequest(id, callback) {
    var escapedId = id.replace(":", "%5C%3A");
    var URL = "https://services.phenotips.org/rest/vocabularies/hpo/suggest?sort=nameSort%20asc&maxResults=10000&input=" + id
        + "&customFilter=is_a:" + escapedId;
    MakeRequest(URL, callback);
}
