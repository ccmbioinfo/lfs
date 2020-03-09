/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ca.sickkids.ccm.lfs;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;

import javax.jcr.ItemNotFoundException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.script.Bindings;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.scripting.sightly.pojo.Use;

/**
 * A HTL Use-API that can run a JCR query and output the results as JSON. The query to execute is taken from the request
 * parameter {@code query}, and must be in the JCR-SQL2 syntax. To use this API, simply place the following code in a
 * HTL file:
 *
 * <p><tt>
 * &lt;sly data-sly-use.query="ca.sickkids.ccm.lfs.QueryBuilder"&gt;${query.content @ context='unsafe'}&lt;/sly&gt;
 * </tt></p>
 *
 * <p>Or, send a HTTP request to {@code /query?query=select%20*%20from%20[lfs:Form]}.</p>
 *
 * @version $Id$
 */
public class QueryBuilder implements Use
{

    private static final int MAX_CONTEXT_MATCH = 8;

    // Property of the parent node in an quick search, outlining what needs to be highlighted
    private static final String LFS_QUERY_MATCH_KEY = "lfs:queryMatch";
    // Properties of the children nodes
    private static final String LFS_QUERY_QUESTION_KEY = "question";
    private static final String LFS_QUERY_MATCH_BEFORE_KEY = "before";
    private static final String LFS_QUERY_MATCH_TEXT_KEY = "text";
    private static final String LFS_QUERY_MATCH_AFTER_KEY = "after";
    private static final String LFS_QUERY_MATCH_NOTES_KEY = "isNotes";

    private String content;

    private ResourceResolver resourceResolver;

    private SlingHttpServletRequest request;

    /* Whether or not the input should be escaped, if it is used in a contains() call. */
    private boolean shouldEscape;

    @Override
    public void init(Bindings bindings)
    {
        this.request = (SlingHttpServletRequest) bindings.get("request");
        this.resourceResolver = (ResourceResolver) bindings.get("resolver");

        try {
            final String jcrQuery = this.request.getParameter("query");
            final String luceneQuery = this.request.getParameter("lucene");
            final String fullTextQuery = this.request.getParameter("fulltext");
            final String quickQuery = this.request.getParameter("quick");
            final String doNotEscape = this.request.getParameter("doNotEscapeQuery");
            final long limit = getLongValueOrDefault(this.request.getParameter("limit"), 10);
            final long offset = getLongValueOrDefault(this.request.getParameter("offset"), 0);
            this.shouldEscape = StringUtils.isBlank(doNotEscape) || !("true".equals(doNotEscape));

            // Try to use a JCR-SQL2 query first
            Iterator<JsonObject> results;
            if (StringUtils.isNotBlank(jcrQuery)) {
                results = QueryBuilder.adaptNodes(queryJCR(this.urlDecode(jcrQuery)));
            } else if (StringUtils.isNotBlank(luceneQuery)) {
                results = QueryBuilder.adaptNodes(queryLucene(this.urlDecode(luceneQuery)));
            } else if (StringUtils.isNotBlank(fullTextQuery)) {
                results = QueryBuilder.adaptNodes(fullTextSearch(this.urlDecode(fullTextQuery)));
            } else if (StringUtils.isNotBlank(quickQuery)) {
                results = quickSearch(this.urlDecode(quickQuery));
            } else {
                results = Collections.emptyIterator();
            }

            // output the results into our content
            JsonObjectBuilder builder = Json.createObjectBuilder();
            long[] metadata = this.addObjects(builder, results, offset, limit);
            this.addSummary(builder, this.request, metadata);
            this.content = builder.build().toString();
        } catch (Exception e) {
            this.content = "Unknown error: " + e.fillInStackTrace();
        }
    }

    /**
     * URL-decodes the given request parameter.
     *
     * @param param a URL-encoded request parameter
     * @return a decoded version of the input
     * @throws UnsupportedEncodingException should not be thrown unless UTF_8 is somehow not available
     */
    private String urlDecode(String param) throws UnsupportedEncodingException
    {
        return URLDecoder.decode(param, StandardCharsets.UTF_8.name());
    }

    /**
     * Finds content matching the given lucene query.
     *
     * @param query a lucene query
     * @return the content matching the query
     */
    private Iterator<Resource> queryLucene(String query) throws RepositoryException
    {
        // Wrap our lucene query in JCR-SQL2 syntax for the resource resolver to understand
        return queryJCR(
            String.format("select n.* from [nt:base] as n where native('lucene', '%s')"
                + " and n.'sling:resourceSuperType' = 'lfs/Resource'", query.replace("'", "''")));
    }

    /**
     * Finds content using the given full text search.
     *
     * @param query text to search
     *
     * @return the content matching the query
     */
    private Iterator<Resource> fullTextSearch(String query) throws RepositoryException
    {
        // Wrap our full-text query in JCR-SQL2 syntax for the resource resolver to understand
        return queryJCR(
            String.format("select n.* from [nt:base] as n where contains(*, '%s')", this.fullTextEscape(query)));
    }

    /**
     * Escapes the input query if this.shouldEscape is true.
     *
     * @param input text to escape
     *
     * @return an escaped version of the input
     */
    private String fullTextEscape(String input)
    {
        if (!this.shouldEscape) {
            return input;
        }

        // Escape sequence taken from https://jackrabbit.apache.org/archive/wiki/JCR/EncodingAndEscaping_115513396.html
        return input.replaceAll("([\\Q+-&|!(){}[]^\"~*?:\\_%/\\E])", "\\\\$1").replaceAll("'", "''");
    }

    /**
     * Gets the question for a given answer JCR Resource.
     *
     * @param res the JCR Resource corresponding to an answer
     * @return the question string corresponding to the passed answer
     */
    private String getQuestion(Resource res) throws ItemNotFoundException
    {
        try {
            Node questionNode = res.adaptTo(Node.class).getProperty("question").getNode();
            if (questionNode != null) {
                return questionNode.getProperty("text").getString();
            }
        } catch (RepositoryException ex) {
            return null;
        }
        return null;
    }

    /**
     * Searches through a list of Strings and returns the first String in that list
     * for which in itself contains a given substring.
     *
     * @param arr the list of Strings to search through
     * @param str the String to check if any array elements contain this substring
     *
     * @return the first String in the list that contains the given substring
     */
    private String getMatchingFromArray(String[] arr, String str)
    {
        if (arr == null) {
            return null;
        }

        for (int i = 0; i < arr.length; i++) {
            if (StringUtils.containsIgnoreCase(arr[i], str)) {
                return arr[i];
            }
        }
        return null;
    }

    /**
     * Get the metadata about a match.
     * @param resourceValue The value that was matched
     * @param query The search value
     * @param question The text of the question itself
     * @param isNoteMatch Whether or not the match is on the notes of the answer, rather than the answer
     * @return the metadata as a JsonObject
     */
    private JsonObject getMatchMetadata(String resourceValue, String query, String question, boolean isNoteMatch)
    {
        JsonObjectBuilder builder = Json.createObjectBuilder();
        builder.add(QueryBuilder.LFS_QUERY_QUESTION_KEY, question);
        builder.add(QueryBuilder.LFS_QUERY_MATCH_NOTES_KEY, isNoteMatch);

        // Add metadata about the text before the match
        int matchIndex = resourceValue.toLowerCase().indexOf(query.toLowerCase());
        String matchBefore = resourceValue.substring(0, matchIndex);
        if (matchBefore.length() > QueryBuilder.MAX_CONTEXT_MATCH) {
            matchBefore = "..." + matchBefore.substring(
                matchBefore.length() - QueryBuilder.MAX_CONTEXT_MATCH, matchBefore.length()
            );
        }
        builder.add(QueryBuilder.LFS_QUERY_MATCH_BEFORE_KEY, matchBefore);

        // Add metadata about the text matched
        String matchText = resourceValue.substring(matchIndex, matchIndex + query.length());
        builder.add(QueryBuilder.LFS_QUERY_MATCH_TEXT_KEY, matchText);

        // Add metadata about the text after the match
        String matchAfter = resourceValue.substring(matchIndex + query.length());
        if (matchAfter.length() > QueryBuilder.MAX_CONTEXT_MATCH) {
            matchAfter = matchAfter.substring(0, QueryBuilder.MAX_CONTEXT_MATCH) + "...";
        }
        builder.add(QueryBuilder.LFS_QUERY_MATCH_AFTER_KEY, matchAfter);

        return builder.build();
    }

    /**
     * Add metadata about a match to the matching object's parent.
     * @param resourceValue The value that was matched
     * @param query The search value
     * @param question The text of the question itself
     * @param parent The parent of the matching node
     * @param isNoteMatch Whether or not the match is on the notes of the answer, rather than the answer
     * @return The given JsonObject with metadata appended to it.
     */
    private JsonObject addMatchMetadata(String resourceValue, String query, String question, JsonObject parent,
        boolean isNoteMatch)
    {
        JsonObject metadata = getMatchMetadata(resourceValue, query, question, isNoteMatch);

        // Construct a JsonObject that matches the parent, but with custom match metadata appended
        JsonObjectBuilder builder = Json.createObjectBuilder();
        for (String key : parent.keySet()) {
            builder.add(key, parent.get(key));
        }
        builder.add(QueryBuilder.LFS_QUERY_MATCH_KEY, metadata);
        return builder.build();
    }
    /**
     * Finds [lfs:Form]s, [lfs:Subject]s, and [lfs:Questionnaire]s using the given full text search.
     * This performs the search in such a way that values in child nodes (e.g. lfs:Answers of an lfs:Form)
     * are aggregated to their parent.
     *
     * @param query text to search
     *
     * @return the content matching the query
     */
    private Iterator<JsonObject> quickSearch(String query) throws RepositoryException
    {
        ArrayList<JsonObject> outputList = new ArrayList<JsonObject>();

        final StringBuilder xpathQuery = new StringBuilder();
        xpathQuery.append("/jcr:root/Forms//*[jcr:like(fn:lower-case(@value),'%");
        xpathQuery.append(this.fullTextEscape(query.toLowerCase()));
        xpathQuery.append("%') or jcr:like(fn:lower-case(@note),'%");
        xpathQuery.append(this.fullTextEscape(query.toLowerCase()));
        xpathQuery.append("%')]");

        Iterator<Resource> foundResources = queryXPATH(xpathQuery.toString());
        /*
        * For each Resource in foundResources, move up the tree until
        * we find an ancestor node of type `lfs:Form`
        */
        while (foundResources.hasNext()) {
            Resource thisResource = foundResources.next();
            Resource thisParent = thisResource;
            String[] resourceValues = thisResource.getValueMap().get("value", String[].class);
            String resourceValue = getMatchingFromArray(resourceValues, query);
            String noteValue = thisResource.getValueMap().get("note", String.class);
            String question = getQuestion(thisResource);
            boolean matchedNotes = false;

            // As a fallback for when the query isn't in the value field, attempt to use the note field
            if (resourceValue == null && StringUtils.containsIgnoreCase(noteValue, query)) {
                resourceValue = noteValue;
                matchedNotes = true;
            }

            // Find the Form parent of this question
            while (thisParent != null && !"lfs/Form".equals(thisParent.getResourceType())) {
                thisParent = thisParent.getParent();
            }

            if (thisParent != null && resourceValue != null && question != null) {
                outputList.add(this.addMatchMetadata(
                    resourceValue, query, question, thisParent.adaptTo(JsonObject.class), matchedNotes
                ));
            }
        }
        return outputList.listIterator();
    }


    /**
     * Finds content matching the given JCR_SQL2 query.
     *
     * @param query a JCR-SQL2 query
     * @return the content matching the query
     */
    private Iterator<Resource> queryJCR(String query) throws RepositoryException
    {
        return this.resourceResolver.findResources(query, "JCR-SQL2");
    }

    /**
     * Finds content matching the given XPATH query.
     *
     * @param query a XPATH query
     * @return the content matching the query
     */
    private Iterator<Resource> queryXPATH(String query) throws RepositoryException
    {
        return this.resourceResolver.findResources(query, "xpath");
    }

    /**
     * Convert an iterator of nodes into an iterator of JsonObjects.
     * @param nodes the iterator to convert
     * @return An iterator of the input nodes
     */
    private static Iterator<JsonObject> adaptNodes(Iterator<Resource> resources)
    {
        ArrayList<JsonObject> list = new ArrayList<JsonObject>();
        while (resources.hasNext()) {
            list.add(resources.next().adaptTo(JsonObject.class));
        }
        return list.iterator();
    }

    /**
     * Write metadata about the request and response. This includes the number of returned and total matching nodes, and
     * copying some request parameters.
     *
     * @param jsonGen the JSON generator where the results should be serialized
     * @param request the current request
     * @param offset the requested offset, may be the default value of {0}
     * @param limit the requested limit, may be the default value of {10}
     * @param returnedNodes the number of matching nodes included in the response, may be {@code 0} if no nodes were
     *            returned
     * @param totalMatchingNodes the total number of accessible nodes matching the request, may be {@code 0} if no nodes
     *            match the filters, or the current user cannot access the nodes
     */
    private void addSummary(final JsonObjectBuilder jsonGen, final SlingHttpServletRequest request, final long[] limits)
    {
        String req = request.getParameter("req");
        if (StringUtils.isBlank(req)) {
            req = "";
        }
        jsonGen.add("req", req);
        jsonGen.add("offset", limits[0]);
        jsonGen.add("limit", limits[1]);
        jsonGen.add("returnedrows", limits[2]);
        jsonGen.add("totalrows", limits[3]);
    }

    /**
     * Write the contents of the input nodes, subject to the an offset and a limit.
     *
     * @param jsonGen the JSON object generator where the results should be serialized
     * @param objects an iterator over the nodes to serialize, which will be consumed
     * @param offset the requested offset, may be the default value of {0}
     * @param limit the requested limit, may be the default value of {10}
     * @return an array of size 4, giving the [0]: offset, [1]: limit, [2]: results, [3]: total matches
     */
    private long[] addObjects(final JsonObjectBuilder jsonGen, final Iterator<JsonObject> objects,
        final long offset, final long limit)
    {
        final long[] counts = new long[4];
        counts[0] = offset;
        counts[1] = limit;
        counts[2] = 0;
        counts[3] = 0;

        long offsetCounter = offset < 0 ? 0 : offset;
        long limitCounter = limit < 0 ? 0 : limit;

        final JsonArrayBuilder builder = Json.createArrayBuilder();

        while (objects.hasNext()) {
            JsonObject n = objects.next();
            // Skip results up to the offset provided
            if (offsetCounter > 0) {
                --offsetCounter;
            // Count up to our limit
            } else if (limitCounter > 0) {
                builder.add(n);
                --limitCounter;
                ++counts[2];
            }
            // Count the total number of results
            ++counts[3];
        }

        jsonGen.add("rows", builder.build());

        return counts;
    }

    /**
     * Use the value given (usually from a request.getParameter()) or use a default value.
     *
     * @param stringValue the value to use if provided
     * @param defaultValue the value to use if stringValue is not given
     * @return Either stringValue, if provided, or defaultValue
     */
    private long getLongValueOrDefault(final String stringValue, final long defaultValue)
    {
        long value = defaultValue;
        try {
            value = Long.parseLong(stringValue);
        } catch (NumberFormatException exception) {
            value = defaultValue;
        }
        return value;
    }

    /**
     * Get the results of the query as a JSON array.
     *
     * @return a JsonArray with all the content matching the query
     */
    public String getContent()
    {
        return this.content;
    }
}
