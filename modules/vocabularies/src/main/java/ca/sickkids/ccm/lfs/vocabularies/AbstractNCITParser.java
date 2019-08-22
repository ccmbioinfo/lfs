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

package ca.sickkids.ccm.lfs.vocabularies;

import java.io.File;
import java.io.IOException;
import java.io.Writer;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.json.Json;
import javax.json.stream.JsonGenerator;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.service.log.LogService;


/**
 * @version $Id$
 */
public abstract class AbstractNCITParser implements VocabularyParser
{
    /**
     * Method called by the VocabularyIndexerServlet parse a NCIT vocabulary from a flat file.
     * Three mandatory parameters are required from the http request sent to the VocabularyIndexerServlet.
     * <p><code>"source"</code> - This must be "ncit" in order for this method to be called.</p>
     * <p><code>"identifier"</code> - the identifier the NCIT thesaurus instance is to be known by.</p>
     * <p><code>"version"</code> - the version of the NCIT thesaurus to be indexed.</p>
     * There are two optional parameters.
     * <p><code>"localpath"</code> - allows downloading of NCIT from a path relative to the
     * VocabularyIndexerServlet.</p>
     * <p><code>"httppath"</code>- allows downloading of NCIT from a url other than
     * "https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/".<p>
     * @param request - http request from the VocabularyIndexerServlet
     * @param response - http response from the VocabularyIndexerServlet
     * @param logger - logger from the VocabularyIndexerServlet to log exceptions caught
     * @throws IOException thrown when response Json cannot be written
     */
    public void parseVocabulary(SlingHttpServletRequest request, SlingHttpServletResponse response,
            LogService logger)
                    throws IOException
    {
        String identifier = request.getParameter("identifier");
        String version = request.getParameter("version");
        String httppath = request.getParameter("httppath");
        String localpath = request.getParameter("localpath");

        Node homepage = request.getResource().adaptTo(Node.class);

        try {
            if (identifier == null) {
                throw new VocabularyIndexException("Mandatory identifier parameter not provided.");
            }

            if (version == null) {
                throw new VocabularyIndexException("Mandatory version parameter not provided.");
            }

            if (homepage == null) {
                throw new VocabularyIndexException("Could not access resource of your request.");
            }

            clearVocabularyNode(homepage, identifier);

            VocabularyZipLoader zipLoader = new VocabularyZipLoader();
            if (localpath != null) {
                zipLoader.loadZipLocal(localpath, getTempFileDirectory(), getTempFileName());
            } else if (httppath != null) {
                zipLoader.loadZipHttp(httppath, getTempFileDirectory(), getTempFileName());
            } else {
                zipLoader.loadZipHttp("https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/Thesaurus_" + version + ".FLAT.zip",
                        getTempFileDirectory(), getTempFileName());
            }

            Node vocabularyNode = createNCITVocabularyNode(homepage, identifier, version);

            parseNCIT(vocabularyNode);

            deleteTempZipFile(getTempFileDirectory(), getTempFileName());
            saveSession(homepage);

            writeStatusJson(request, response, true, null);
        } catch (Exception e) {
            deleteTempZipFile(getTempFileDirectory(), getTempFileName());
            writeStatusJson(request, response, false, "NCIT Flat parsing error: " + e.getMessage());
            if (logger != null) {
                logger.log(LogService.LOG_ERROR, "NCIT Flat parsing error: " + e.getMessage());
            }
        }
    }

    /**
     * Writes a json to the http response consisting of two entries, "isSuccessful" which indicates if the
     * parsing attempt was successful or not, and "error" which is the error message in case of an error.
     * @param request - http request from the VocabularyIndexerServlet
     * @param response - http response from the VocabularyIndexerServlet
     * @param isSuccessful - boolean variable which is true if parsing is successful and false otherwise
     * @param errors - the error message caught which is null if there is no error
     * @throws IOException thrown when json cannot be written
     */
    public void writeStatusJson(SlingHttpServletRequest request, SlingHttpServletResponse response,
        boolean isSuccessful, String errors)
        throws IOException
    {
        Writer out = response.getWriter();
        JsonGenerator generator = Json.createGenerator(out);
        generator.writeStartObject();
        generator.write("isSuccessful", isSuccessful);
        generator.write("errors", errors);
        generator.writeEnd();
        generator.flush();
    }

    /**
     * Remove any previous instances of the vocabulary which is to be parsed and indexed in the JCR repository.
     * @param homepage - an instance of the VocabulariesHomepage node serving as the root of Vocabulary nodes
     * @param name - identifier of the vocabulary which will become its node name
     * @throws VocabularyIndexException thrown when node cannot be removed
     */
    public void clearVocabularyNode(Node homepage, String name)
        throws VocabularyIndexException
    {
        try {
            if (homepage.hasNode(name)) {
                Node target = homepage.getNode(name);
                target.remove();
            }
        } catch (RepositoryException e) {
            String message = "Error: Failed to delete existing Vocabulary node. " + e.getMessage();
            throw new VocabularyIndexException(message, e);
        }
    }

    private Node createNCITVocabularyNode(Node homepage, String identifier, String version)
        throws VocabularyIndexException
    {
        try {
            Node vocabularyNode = homepage.addNode("./" + identifier, "lfs:Vocabulary");

            vocabularyNode.setProperty("identifier", "ncit");
            vocabularyNode.setProperty("name", "National Cancer Institute Thesaurus");
            vocabularyNode.setProperty("source", "https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/");
            vocabularyNode.setProperty("version", version);
            vocabularyNode.setProperty("website", "https://ncit.nci.nih.gov/ncitbrowser/");
            return vocabularyNode;
        } catch (RepositoryException e) {
            String message = "Failed to create Vocabulary node: " + e.getMessage();
            throw new VocabularyIndexException(message, e);
        }
    }

    protected void createNCITVocabularyTermNode(Node vocabularyNode, String identifier, String label,
        String description, String[] synonyms, String[] parents, String[] ancestors)
        throws VocabularyIndexException
    {
        try {
            Node vocabularyTermNode = vocabularyNode.addNode("./" + identifier, "lfs:VocabularyTerm");
            vocabularyTermNode.setProperty("identifier", identifier);
            vocabularyTermNode.setProperty("label", label);
            vocabularyTermNode.setProperty("description", description);
            vocabularyTermNode.setProperty("synonyms", synonyms);
            vocabularyTermNode.setProperty("parents", parents);
            vocabularyTermNode.setProperty("ancestors", ancestors);
        } catch (RepositoryException e) {
            String message = "Failed to create VocabularyTerm node: " + e.getMessage();
            throw new VocabularyIndexException(message, e);
        }
    }

    private void deleteTempZipFile(String directory, String name)
    {
        File tempfile = new File(directory + name + ".zip");
        tempfile.delete();
    }

    private void saveSession(Node vocabulariesHomepage)
            throws VocabularyIndexException
    {
        try {
            vocabulariesHomepage.getSession().save();
        } catch (RepositoryException e) {
            String message = "Failed to save session: " + e.getMessage();
            throw new VocabularyIndexException(message, e);
        }
    }

    abstract void parseNCIT(Node vocabularyNode) throws VocabularyIndexException;

    abstract String getTempFileDirectory();

    abstract String getTempFileName();
}
