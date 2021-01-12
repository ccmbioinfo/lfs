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

import React, { useState } from "react";

import {
  Button,
  IconButton,
  Input,
  Grid,
  LinearProgress,
  Link,
  TextField,
  Typography,
  makeStyles
} from "@material-ui/core";
import AttachFile from '@material-ui/icons/AttachFile';
import BackupIcon from '@material-ui/icons/Backup';
import GetApp from '@material-ui/icons/GetApp';
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import DragAndDrop from "./dragAndDrop.jsx";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  fileinput: {
    display: 'none',
  },
  dialogTitle: {
    padding: theme.spacing(2,0,2,3),
  },
  buttonIcon: {
    verticalAlign: 'middle',
    paddingRight: theme.spacing(1)
  },
  uploadButton: {
    marginLeft: theme.spacing(2)
  },
  fileInfo: {
    padding: theme.spacing(1),
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  fileDetail: {
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(1)
  },
  fileName: {
    color: theme.palette.success.dark,
    fontWeight: "500"
  },
  progressBar: {
    width: "40%",
    height: theme.spacing(2),
    backgroundColor: theme.palette.success.dark,
    borderRadius: "2px",
    display: "inline-block",
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    verticalAlign: "text-top"
  },
  progress: {
    backgroundColor: theme.palette.success.main,
    height: "100%",
    margin: "0",
    borderRadius: "2px",
  },
  active: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: theme.spacing(2),
    width: theme.spacing(40),
    border: "4px dashed",
    borderColor: theme.palette.primary.main,
    padding: theme.spacing(4),
    paddingLeft: "0",
    textAlign: "center",
    borderRadius: theme.spacing(1),
    boxShadow: "5px 5px 10px " + theme.palette.background.paper,
    cursor: "pointer"
  },
  dropzone: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: theme.spacing(3),
    width: theme.spacing(44),
    border: "2px dashed",
    borderColor: theme.palette.primary.main,
    padding: "2rem",
    paddingLeft: "0",
    textAlign: "center",
    borderRadius: theme.spacing(1),
    cursor: "pointer"
  }
}));

export default function VariantFilesContainer() {
  const classes = useStyles();

  // Error message set when file upload to the server fails
  let [ error, setError ] = useState();

  // uuids of the Subjects and the SomaticVariants questionnaire
  // To be fetch on page load
  let [ somaticVariantsUUID, setSomaticVariantsUUID ] = useState();
  let [ patientSubjectUUID, setPatientSubjectUUID ] = useState();
  let [ tumorSubjectUUID, setTumorSubjectUUID ] = useState();
  let [ regionSubjectUUID, setRegionSubjectUUID ] = useState();

  // Numerical upload progress object measured in %, for all files
  let [ uploadProgress, setUploadProgress ] = useState({});
  // Marks that a upload operation is in progress
  let [ uploadInProgress, setUploadInProgress ] = useState();

  // Main container to store info about files selected for upload
  // All corresponding subjects info derived from file and fetched will be stored here
  let [selectedFiles, setSelectedFiles] = useState([]);

  let constructQuery = (nodeType, query) => {
    let url = new URL("/query", window.location.origin);
    let sqlquery = "SELECT s.* FROM [" + nodeType + "] as s" + query;
    url.searchParams.set("query", sqlquery);
    return url;
  };

  /* FETCHING SUBJECTS INFO SECTION */

  // Fetch the SomaticVariants questionnaire and Subjects uuids
  let fetchBasicData = () => {
    fetch("/Questionnaires/SomaticVariants.json")
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((json) => {setSomaticVariantsUUID(json["jcr:uuid"])})
      .catch(handleError);

    fetch("/SubjectTypes/Patient.json")
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((json) => {setPatientSubjectUUID(json["jcr:uuid"])})
      .catch(handleError);

    fetch("/SubjectTypes/Tumor.json")
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((json) => {setTumorSubjectUUID(json["jcr:uuid"])})
      .catch(handleError);

    fetch("/SubjectTypes/TumorRegion.json")
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((json) => {setRegionSubjectUUID(json["jcr:uuid"])})
      .catch(handleError);
  };

  // Callback method for the `fetchData` method, invoked when the request failed.
  let handleError = (response) => {
    setError(response.status + " " + response.statusText);
  };

  // Fetch information about patient, tumor and region subjects from file name
  // on file drop to the drag&drop zone
  let onDrop = (accepted) => {
    cleanForm();
    let chosenFiles = accepted;
    if (chosenFiles.length == 0) {
      setError("Please submit valid file type");
      return;
    }

    let files = [];
    // Can not use await due to `regeneratorRuntime is not defined` error
    // as a result - using function passing itself as resolution-callback
    (function loop(i) {
        if (i < chosenFiles.length) new Promise((resolve, reject) => {
          let file = chosenFiles[i];

          let parsed = file.name.split('.csv')[0].split('_');
          if (parsed.length < 2 || parsed[0] == "" || parsed[1] == "") {
            setError("File name " + file.name + " does not follow the name convention <subject>_<tumour nb>***.csv");
            return;
          }
          file.subject  = {"id" : parsed[0]};
          file.tumor    = {"id" : parsed[1]};
          if (parsed.length > 2) {
            file.region = {"id" : parsed[2]};
          }

          setSingleFileSubjectData(file, files)
            .then( (processedFile) => {

              if (processedFile.tumor.existed && processedFile.tumor.id) {

                // query data about all of the already uploaded files
                let url = new URL("/query", window.location.origin);
                let sqlquery = `select f.* from [lfs:Form] as n inner join [nt:file] as f on isdescendantnode(f, n) where n.questionnaire = '${somaticVariantsUUID}' and n.subject = '${processedFile?.region?.uuid || processedFile.tumor.uuid}'`;
                url.searchParams.set("query", sqlquery);

                fetch(url)
                  .then((response) => response.ok ? response.json() : Promise.reject(response))
                  .then((json) => {
                    processedFile.sameFiles = json.rows.filter((row) => row["@name"] === file.name);
                    files.push(processedFile);
                    setSelectedFiles(files);
                  })
                  .finally( () => {resolve();} );
              } else {
                files.push(processedFile);
                setSelectedFiles(files);
                resolve();
              }
            });
        })
        .then(loop.bind(null, i+1));
    })(0);
  };

  // Need to check among already processed files if we have any SAME existing/created subjects
  // we want to avoid multiple creations of:
  //   -- same patient subject,
  //   -- or same tuples of tumor-patient subjects where parent is patient,
  //   -- or same tuples of region-tumor subjects, where parent is tumor.
  let setExistedFileSubjectData = (file, files) => {
    for (var i in files) {
      let fileEl = files[i];
      if (file.name === fileEl.name) { continue; }

      if (fileEl.subject.id === file.subject.id) {
        file.subject = generateSubject(file.subject, fileEl.subject.path, fileEl.subject.existed, fileEl.subject.uuid);
      }

      if (fileEl.subject.id === file.subject.id && fileEl.tumor.id === file.tumor.id) {
        file.tumor = generateSubject(file.tumor, fileEl.tumor.path, fileEl.tumor.existed, fileEl.tumor.uuid);
      }

      if (fileEl.region && file.region && fileEl.tumor.id === file.tumor.id && fileEl.region.id === file.region.id) {
        file.region = generateSubject(file.region, fileEl.region.path, fileEl.region.existed, fileEl.region.uuid);
      }
    }
    return file;
  };

  // Fetch existed subjects data from back-end
  let setSingleFileSubjectData = (file, files) => {

    // 1. Check whether we already have any subjects info not to duplicate
    file = setExistedFileSubjectData(file, files);

    let checkSubjectExistsURL = constructQuery("lfs:Subject", ` WHERE s.'identifier'='${file.subject.id}'`);
    let checkTumorExistsURL = "";
    let checkRegionExistsURL = "";

    //  Fetch other missing subjects data - subject, tumor, region links
    return new Promise((resolve, reject) => {

        if (!file.subject.path) {

          // Fire a fetch request for the patient subject
          fetch( checkSubjectExistsURL )
            .then((response) => response.ok ? response.json() : reject(response))
            .then((json) => {
              // If a patient subject is found
              if (json.rows && json.rows.length > 0) {
                let subject = json.rows[0];
                // get the path
                file.subject = generateSubject(file.subject, subject["@path"], true, subject["jcr:uuid"]);
                checkTumorExistsURL = constructQuery("lfs:Subject", ` WHERE s.'identifier'='${file.tumor.id}' AND s.'parents'='${subject['jcr:uuid']}'`);

                // Fire a fetch request for a tumor subject with the patient subject as its parent
                fetch( checkTumorExistsURL )
                    .then((response) => response.ok ? response.json() : reject(response))
                    .then((json) => {
                      // If a tumor subject is found and region subject is defined
                      if (json.rows && json.rows.length > 0) {
                        let subject = json.rows[0];
                        // get the path
                        file.tumor = generateSubject(file.tumor, subject["@path"], true, subject["jcr:uuid"]);

                        // If a region subject is defined
                        if (file.region) {
                          checkRegionExistsURL = constructQuery("lfs:Subject", ` WHERE s.'identifier'='${file.region.id}' AND s.'parents'='${subject['jcr:uuid']}'`);

                          // Fire a fetch request for a region subject with the tumor subject as its parent
                          fetch( checkRegionExistsURL )
                            .then((response) => response.ok ? response.json() : reject(response))
                            .then((json) => {
                              // If a region subject is found
                              if (json.rows && json.rows.length > 0) {
                                let subject = json.rows[0];
                                // get the path
                                file.region = generateSubject(file.region, subject["@path"], true, subject["jcr:uuid"]);
                              } else {
                                // if a region subject is not found
                                // record in variables that a region didn’t exist and generate a new random uuid as its path
                                file.region = generateSubject(file.region);
                              }
                              resolve(file);
                            })
                            .catch((err) => {console.log(err); reject(err);})
                        }
                        resolve(file);
                      } else {
                        // if a tumor subject is not found
                        // record in variables that a tumor and a region didn’t exist and generate a new random uuid as their path
                        file.tumor  = generateSubject(file.tumor);
                        if (file.region) {
                            file.region = generateSubject(file.region);
                        }
                        resolve(file);
                      }
                    })
                    .catch((err) => {console.log(err); reject(err);})

              } else {
                // If a patient subject is not found:
                // fetch existing or record in variables that it didn’t exist, and generate a new random uuid as its path
                file.subject = generateSubject(file.subject);
                file.tumor   = generateSubject(file.tumor);
                if (file.region) {
                    file.region = generateSubject(file.region);
                }
                resolve(file);
              }
            })
            .catch((err) => {console.log(err); reject(err);})


        } else {
          if (!file.tumor.path) {
            checkTumorExistsURL = constructQuery("lfs:Subject", ` WHERE s.'identifier'='${file.tumor.id}' AND s.'parents'='${file.subject.uuid}'`);

            // Fire a fetch request for a tumor subject with the patient subject as its parent
            fetch( checkTumorExistsURL )
                .then((response) => response.ok ? response.json() : reject(response))
                .then((json) => {
                  // If a tumor subject is found and region subject is defined
                  if (json.rows && json.rows.length > 0) {
                    let subject = json.rows[0];
                    // get the path
                    file.tumor = generateSubject(file.tumor, subject["@path"], true, subject["jcr:uuid"]);

                    // If a region subject is defined
                    if (file.region) {
                      checkRegionExistsURL = constructQuery("lfs:Subject", ` WHERE s.'identifier'='${file.region.id}' AND s.'parents'='${subject['jcr:uuid']}'`);

                      // Fire a fetch request for a region subject with the tumor subject as its parent
                      fetch( checkRegionExistsURL )
                        .then((response) => response.ok ? response.json() : reject(response))
                        .then((json) => {
                          // If a region subject is found
                          if (json.rows && json.rows.length > 0) {
                            let subject = json.rows[0];
                            // get the path
                            file.region = generateSubject(file.region, subject["@path"], true, subject["jcr:uuid"]);
                          } else {
                            // if a region subject is not found
                            // record in variables that a region didn’t exist, and generate a new random uuid as its path
                            file.region = generateSubject(file.region);
                          }
                          resolve(file);
                        })
                        .catch((err) => {console.log(err); reject(err);})
                      }

                  } else {
                    // if a tumor subject is not found
                    // record in variables that a tumor and a region didn’t exist, and generate a new random uuid as their path
                    file.tumor  = generateSubject(file.tumor);
                    if (file.region) {
                      file.region = generateSubject(file.region);
                    }
                    resolve(file);
                  }
                })
                .catch((err) => {console.log(err); reject(err);})

          } else {
            if (file.region && !file.region.path) {
              checkRegionExistsURL = constructQuery("lfs:Subject", ` WHERE s.'identifier'='${file.region.id}' AND s.'parents'='${file.tumor.uuid}'`);

              // Fire a fetch request for a region subject with the tumor subject as its parent
              fetch( checkRegionExistsURL )
                .then((response) => response.ok ? response.json() : reject(response))
                .then((json) => {
                  // If a region subject is found
                  if (json.rows && json.rows.length > 0) {
                    let subject = json.rows[0];
                    // get the path
                    file.region = generateSubject(file.region, subject["@path"], true, subject["jcr:uuid"]);
                  } else {
                    // if a region subject is not found
                    // record in variables that a region didn’t exist, and generate a new random uuid as its path
                    file.region = generateSubject(file.region);
                  }
                  resolve(file);
                })
                .catch((err) => {console.log(err); reject(err);})
            } else {
              resolve(file);
            }
          }
        }

    });
  };

  // Generate subject JSON in a form 'subject: {exists: true, id: <id>, @path: <path>, uuid: <uuid>}'
  // note - 'id' is already in subject object recorded at the load stage parsed from the filename
  //
  // Possible 3 scenarios:
  // 1. subject existed and was just fetched
  // 2. subject did not exist, need to create completely new
  // 3. subject did not exist, but was just created for one of previous loaded files, so it has path but no uuid
  //
  let generateSubject = (subject, path, existed, uuid) => {
    subject.existed = existed;
    subject.path = path || "/Subjects/" + uuidv4();
    subject.uuid = uuid;
    return subject;
  };

  // Change of subject id implies reset patient subject info and re-fetching all data
  let setSubject = (id, fileName) => {
    let newFiles = selectedFiles.slice();
    let index = newFiles.findIndex(file => file.name === fileName);
    newFiles[index].subject.id = id;
    newFiles[index].subject.existed = false;
    newFiles[index].subject.uuid = null;
    newFiles[index].subject.path = null;

    setSingleFileSubjectData(newFiles[index], selectedFiles)
      .then((file) => {
          // find all files with this name
          newFiles[index] = file;
          setSelectedFiles(newFiles);
      });
  };

  // Change of subject id implies reset tumor subject info and re-fetching all data
  let setTumor = (id, fileName) => {
    let newFiles = selectedFiles.slice();
    let index = newFiles.findIndex(file => file.name === fileName);
    newFiles[index].tumor.id = id;
    newFiles[index].tumor.existed = false;
    newFiles[index].tumor.uuid = null;
    newFiles[index].tumor.path = null;

    setSingleFileSubjectData(newFiles[index], selectedFiles)
      .then((file) => {
          // find all files with this name
          newFiles[index] = file;
          setSelectedFiles(newFiles);
        });
  };

  // Change of subject id implies reset region subject info and re-fetching all data
  let setRegion = (id, fileName) => {
    let newFiles = selectedFiles.slice();
    let index = newFiles.findIndex(file => file.name === fileName);
    newFiles[index].region.id = id;
    newFiles[index].region.existed = false;
    newFiles[index].region.uuid = null;
    newFiles[index].region.path = null;

    setSingleFileSubjectData(newFiles[index], selectedFiles)
      .then((file) => {
          // find all files with this name
          newFiles[index] = file;
          setSelectedFiles(newFiles);
        });
  };

  let cleanForm = () => {
    setUploadInProgress(false);
    setSelectedFiles([]);
    setError("");
    setUploadProgress({});
  };

   // Find the icon and load them
  let uploadAllFiles = (selectedFiles) => {
    const promises = [];
    selectedFiles.forEach(file => {
      promises.push(uploadSingleFile(file));
    });

    return Promise.all(promises);
  };

  // Event handler for the form submission event, replacing the normal browser form submission with a background fetch request.
  let upload = (event) => {
    // This stops the normal browser form submission
    event.preventDefault();

    // TODO - handle possible logged out situation here - open a login popup

    setUploadInProgress(true);
    setUploadProgress({});
    setError("");

    uploadAllFiles(selectedFiles)
      .then(() => {

        setUploadInProgress(false);
      })
      .catch( (error) => {

        handleError(error);
        setUploadInProgress(false);
    });
  };

  let uploadSingleFile = (file) => {
    return new Promise((resolve, reject) => {

      var reader = new FileReader();
      reader.readAsText(file);

      //When the file finish load
      reader.onload = function(event) {

        // get the file data
        var csv = event.target.result;
        let json = assembleJson(file, csv);

        let data = new FormData();
        data.append(':contentType', 'json');
        data.append(':operation', 'import');
        data.append(':content', JSON.stringify(json));

        var xhr = new XMLHttpRequest()
        xhr.open('POST', '/')

        xhr.onload = function() {

          if (xhr.status != 201) {
            uploadProgress[file.name] = { state: "error", percentage: 0 };
            console.log("Error", xhr.statusText)
          } else {
            // state: "done" change should turn all subject inputs into the link text
            uploadProgress[file.name] = { state: "done", percentage: 100 };

            file.formPath = "/" + Object.keys(json).find(str => str.startsWith("Forms/"));
            selectedFiles[selectedFiles.findIndex(el => el.name === file.name)] = file;
            setSelectedFiles(selectedFiles);
          }

          setUploadProgress(uploadProgress);
          resolve(xhr.response);
        }

        xhr.onerror = function() {
          uploadProgress[file.name] = { state: "error", percentage: 0 };
          setUploadProgress(uploadProgress);
          resolve(xhr.response);
        }

        xhr.upload.onprogress = function (event) {

          if (event.lengthComputable) {
            let done = event.position || event.loaded;
            let total = event.totalSize || event.total;
            let percent = Math.round((done / total) * 100);
            const copy = { ...uploadProgress };
            copy[file.name] = { state: "pending", percentage: percent };
            setUploadProgress(copy);
          }
        }
        xhr.send(data);
      }
    });
  };

  let generateSubjectJson = (refType, id, parent) => {
    let info = {};
    info["jcr:primaryType"] = "lfs:Subject";
    info["jcr:reference:type"] = "/SubjectTypes/" + refType;
    info["identifier"] = id;
    if (parent) { info["jcr:reference:parents"] = parent; }
    return info;
  };

  let assembleJson = (file, csvData) => {
      let json = {};

      if (!file.subject.existed) {
        json[file.subject.path.replace("/Subjects", "Subjects")] = generateSubjectJson("Patient", file.subject.id);
      }
      if (!file.tumor.existed) {
        json[file.tumor.path.replace("/Subjects", "Subjects")] = generateSubjectJson("Tumor", file.tumor.id, file.subject.path);
      }
      if (file.region && !file.region.existed) {
        json[file.region.path.replace("/Subjects", "Subjects")] = generateSubjectJson("TumorRegion", file.region.id, file.tumor.path);
      }

      let formInfo = {};
      formInfo["jcr:primaryType"] = "lfs:Form";
      formInfo["jcr:reference:questionnaire"] = "/Questionnaires/SomaticVariants";
      // The subject of the questionnaire is the region
      formInfo["jcr:reference:subject"] = file?.region?.path || file.tumor.path;

      let fileInfo = {};
      fileInfo["jcr:primaryType"] = "lfs:SomaticVariantsAnswer";
      fileInfo["jcr:reference:question"] = "/Questionnaires/SomaticVariants/file";

      let fileDetails = {};
      fileDetails["jcr:primaryType"] = "nt:file";
      fileDetails["jcr:content"] = {};
      fileDetails["jcr:content"]["jcr:primaryType"] = "nt:resource";

      fileDetails["jcr:content"]["jcr:data"] = csvData;

      fileInfo[file.name] = fileDetails;

      formInfo[uuidv4()] = fileInfo;

      json["Forms/" + uuidv4()] = formInfo;

      return json;
  };

  if (!somaticVariantsUUID) {
    fetchBasicData();
  }

  return (
  <React.Fragment>
    <form method="POST"
          encType="multipart/form-data"
          onSubmit={upload}
          key="file-upload">
      <Typography component="h2" variant="h5" className={classes.dialogTitle}>Variants Upload</Typography>
      { uploadInProgress && (
        <Grid item className={classes.root}>
          <LinearProgress color="primary" />
        </Grid>
      ) }

      <DragAndDrop
        accept={".csv"}
        multifile={false}
        handleDrop={onDrop}
        classes={classes}
        error={error}
      />

      <input type="hidden" name="*@TypeHint" value="nt:file" />
      <label htmlFor="contained-button-file">
        <Button type="submit" variant="contained" color="primary" disabled={uploadInProgress || !!error && selectedFiles.length == 0} className={classes.uploadButton}>
          <span><BackupIcon className={classes.buttonIcon}/>
            {uploadInProgress ? 'Uploading' :
                // TODO - judge upload status button message over all upload statuses of all files ??
                // uploadProgress[file.name].state =="done" ? 'Uploaded' :
                // uploadProgress[file.name].state =="error" ? 'Upload failed, try again?' :
                'Upload'}
          </span>
        </Button>
      </label>
    </form>

    { selectedFiles && selectedFiles.length > 0 && <span>
      <Typography variant="h6" className={classes.fileInfo}>Selected files info</Typography>

      { selectedFiles.map( (file, i) => {

          const upprogress = uploadProgress ? uploadProgress[file.name] : null;

          return (
            <div key={file.name} className={classes.fileInfo}>
              <div>
                <span>File <span className={classes.fileName}>{file.name}:</span></span>
                { upprogress && upprogress.state != "error" &&
                  <span>
                    <div className={classes.progressBar}>
                      <div className={classes.progress} style={{ width: upprogress.percentage + "%" }} />
                    </div>
                    { upprogress.percentage + "%" }
                  </span>
                }
                { upprogress && upprogress.state == "error" && <Typography color='error'>Error uploading file</Typography> }
              </div>
              { uploadProgress && uploadProgress[file.name] && uploadProgress[file.name].state === "done" ? 
                <Typography className={classes.fileDetail}>
                  Subject id: <Link href={file.subject.path.replace("/Subjects", "Subjects")} target="_blank"> {file.subject.id} </Link>
                  Tumor nb: <Link href={file.tumor.path.replace("/Subjects", "Subjects")} target="_blank"> {file.tumor.id} </Link>
                  { file?.region?.path && <span>Region nb: <Link href={file.region.path.replace("/Subjects", "Subjects")} target="_blank"> {file.region.id} </Link> </span> }
                  { file.formPath && <span>Form: <Link href={file.formPath.replace("/Forms", "Forms")} target="_blank"> {file.formPath.replace("/Forms/", "")} </Link></span> }
                </Typography>
              : <span>
                <TextField
                  label="Subject id"
                  value={file.subject.id}
                  onChange={(event) => setSubject(event.target.value, file.name)}
                  className={classes.fileDetail}
                  required
                />
                <TextField
                  label="Tumor nb"
                  value={file.tumor.id}
                  onChange={(event) => setTumor(event.target.value, file.name)}
                  className={classes.fileDetail}
                  required
                />
                <TextField
                  label="Region nb"
                  value={file?.region?.id}
                  onChange={(event) => setRegion(event.target.value, file.name)}
                  className={classes.fileDetail}
                  required
                />
                </span>
              }
              <Typography variant="body1" component="div" className={classes.fileInfo}>
                  {(!file.sameFiles || file.sameFiles.length == 0)
                      ?
                     <p>There are no versions of this file.</p>
                      :
                     <span>
                         <p>Other versions of this file :</p>
                         <ul>
                           {file.sameFiles && file.sameFiles.map( (samefile, index) => {
                            return (
                             <li key={index}>
                               Uploaded at {moment(samefile["jcr:created"]).format("dddd, MMMM Do YYYY")} by {samefile["jcr:createdBy"]}
                               <IconButton size="small" color="primary">
                                 <a href={samefile["@path"]} download><GetApp /></a>
                               </IconButton>
                             </li>
                           )})}
                         </ul>
                     </span>
                   }
              </Typography>
            </div>
        ) } ) }
    </span> }
  </React.Fragment>
  );
}
