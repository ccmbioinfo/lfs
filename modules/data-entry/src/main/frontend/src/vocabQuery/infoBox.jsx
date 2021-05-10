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
import React, { useRef, useState } from "react";
import classNames from "classnames";
import { withStyles, Avatar, Button, Card, CardActions, CardContent, CardHeader, ClickAwayListener, Grow, IconButton, Link, Popper, Tooltip, Typography } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

import VocabularyBrowser from "./browse.jsx";
import QueryStyle from "./queryStyle.jsx";

// Component that renders a dialog with term info for a single vocabulary term.
//
function InfoBox(props) {
  const { open, anchorEl, infoRef, menuPopperRef, vocabulary, onClose, closeBrowser, term, logError,
    registerInfoButton, getInfo, browserRef, classes } = props;

  const [infoAboveBackground, setInfoAboveBackground] = useState(true);
  const [browseID, setBrowseID] = useState(term["identifier"] || "");
  const [browsePath, setBrowsePath] = useState(term["@path"] || "");
  const [browserOpened, setBrowserOpened] = useState(false);
  const [alsoKnownAs, setAlsoKnownAs] = useState(term["synonyms"] || term["has_exact_synonym"] || []);
  const [typeOf, setTypeOf] = useState(("parents" in term) ?
													        term["parents"].map(item =>
													          item["label"] || item["name"] || item["identifier"] || item["id"]
													        ).filter(i => i)
													       : []);

  let clickAwayInfo = (event) => {
    if (menuPopperRef?.current?.contains(event.target)
      || infoRef?.current?.contains(event.target)
      || browserRef?.current?.contains(event.target)) {
      return;
    }

    setBrowserOpened(false);
    closeBrowser();
  }

  let openBrowser = () => {
    setInfoAboveBackground(false);
    setBrowserOpened(true);
  }

  let changeBrowseTerm = (id, path) => {
    setBrowseID(id);
    setBrowsePath(path);
  }

  return ( <>
    <Popper
      placement="right"
      open={open}
      anchorEl={anchorEl}
      transition
      className={
        classNames({ [classes.popperClose]: !open })
        + " " + classes.popperNav
        + " " + (infoAboveBackground ? classes.infoAboveBackdrop : classes.popperInfoOnTop)
      }
      ref={infoRef}
      modifiers={{
        keepTogether: {
          enabled: true
        },
        preventOverflow: {
          boundariesElement: 'viewport',
          padding: '8',
          escapeWithReference: false,
          enabled: true
        },
        arrow: {
          enabled: false
        }
      }}
    >
      {({ TransitionProps }) => (
        <Grow
          {...TransitionProps}
          id="info-grow"
          style={{
            transformOrigin: "center left",
          }}
        >
          <Card className={classes.infoCard}>
            <ClickAwayListener onClickAway={clickAwayInfo}><div>
               <CardHeader
                 avatar={
                  <Link color="textSecondary"
                    href={vocabulary.url || ""}  target="_blank"
                    component={vocabulary.url ? 'a' : 'span'}
                    underline="none"
                    >
                    <Tooltip title={vocabulary.description}>
                      <Avatar aria-label="source" className={classes.vocabularyAvatar}>
                          {vocabulary.acronym}
                      </Avatar>
                    </Tooltip>
                  </Link>
                }
                action={
                  <IconButton aria-label="close" onClick={() => {event.stopPropagation(); onClose()}}>
                    <CloseIcon />
                  </IconButton>
                }
                title={term["label"]}
                subheader={term["identifier"]}
                titleTypographyProps={{variant: 'h5'}}
              />
              <CardContent className={classes.infoPaper}>
                <div className={classes.infoSection}>
                  <Typography className={classes.infoDefinition}>{term["def"] || term["description"] || term["definition"]}</Typography>
                </div>
                  {alsoKnownAs.length > 0 && (
                    <div className={classes.infoSection}>
                      <Typography variant="h6" className={classes.infoHeader}>Also known as</Typography>
                      {alsoKnownAs.map((name, index) => {
                        return (<Typography className={classes.infoAlsoKnownAs} key={index}>
                                  {name}
                                </Typography>
                        );
                      })}
                    </div>
                  )}
                  {typeOf.length > 0 && (
                    <div className={classes.infoSection}>
                      <Typography variant="h6" className={classes.infoHeader}>Is a type of</Typography>
                      {typeOf.map((name, index) => {
                        return (<Typography className={classes.typeOf} key={index}>
                                  {name}
                                </Typography>
                        );
                      })}
                    </div>
                  )}
                  </CardContent>
                  { <CardActions className={classes.infoPaper}>
                      <Button size="small" disabled={browserOpened} onClick={openBrowser} variant='contained' color='primary'>Learn more</Button>
                    </CardActions>
                  }
             </div></ClickAwayListener>
          </Card>
        </Grow>
      )}
    </Popper>
    { /* Browse dialog box */}
    { browseID && browserOpened &&
      <VocabularyBrowser
        ref={browserRef}
        open={browserOpened}
        id={browseID}
        path={browsePath}
        changeTerm={changeBrowseTerm}
        onClose={closeBrowser}
        onError={logError}
        registerInfo={registerInfoButton}
        getInfo={getInfo}
      />
    }
  </>
  );
}

export default withStyles(QueryStyle)(InfoBox);
