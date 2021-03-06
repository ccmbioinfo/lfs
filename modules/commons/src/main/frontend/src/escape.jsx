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

// Escape a string to be safely usable inside a JQL string literal, as in
// query += " where n.property = '" + escapeJQL(userInput) + "'";
//
// @return an escaped string, with any non-string input also converted to a string
export function escapeJQL(input) {
  return new String(input).replace(/'/g, "''");
};

// 

// Convert a string to 32bit integer
//
// @return hashed string
export function stringToHash(string) {
  let hash = 0;

  if (string.length == 0) return hash;

  for (var i = 0; i < string.length; i++) {
    let char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return hash;
};
