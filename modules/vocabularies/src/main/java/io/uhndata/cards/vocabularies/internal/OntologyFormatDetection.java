/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package io.uhndata.cards.vocabularies.internal;

public final class OntologyFormatDetection
{
    //Hide the utility class constructor
    private OntologyFormatDetection()
    {
    }

    public static String getSourceFormat(String sourceURL)
    {
        if (sourceURL != null && sourceURL.endsWith(".obo")) {
            return "OBO";
        }
        // TODO Can files ending in .rdf be parsed just like .owl files?
        // They use rdfs:Class instead of owl:Class, but otherwise the structure is similar
        return "OWL";
    }
}
