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
import React from 'react';

import { Fab, Grid, Paper, Typography, makeStyles } from '@material-ui/core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import NavigationIcon from '@material-ui/icons/Navigation';
import { lightBlue } from '@material-ui/core/colors';
import { appTheme } from "../themePalette.jsx";
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(2, 3, 3),
  },
  logo: {
    maxWidth: "200px",
  },
  notFoundTitle: {
    color: theme.palette.primary.main,
    fontSize: '5rem'
  },
  notFoundTitleContainer: {
    padding: '0!important'
  },
  notFoundContainer: {
    paddingTop: theme.spacing(10)
  },
  notFoundMessage: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
    color: theme.palette.textSecondary
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
}));

export default function PageNotFound() {
  const classes = useStyles();

  return (
    <MuiThemeProvider theme={appTheme}>
      <Paper className={`${classes.paper}`} elevation={0}>
        <Grid
          container
          direction="column"
          spacing={3}
          alignItems="center"
          alignContent="center"
          className={classes.notFoundContainer}
        >
          <Grid item>
            <img src="/libs/lfs/resources/logo_light_bg.png" alt="this.state.title" className={classes.logo}/>
          </Grid>
          <Grid item>
            <Typography variant="h2" color="primary" className={classes.notFoundTitle}>
              404
            </Typography>
          </Grid>
          <Grid item className={classes.notFoundTitleContainer}>
            <Typography variant="h2" color="primary" className={classes.notFoundTitle}>
              Not found
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="subtitle1" className={classes.notFoundMessage}>
              The page you are trying to reach does not exist
            </Typography>
          </Grid>
            <Grid item>
              <Fab
                variant="extended"
                color="primary"
                onClick={() => window.location.href = "/content.html/Questionnaires/User"}
               >
                <NavigationIcon className={classes.extendedIcon} />
                Go to the dashboard
              </Fab>
            </Grid>
        </Grid>
      </Paper>
    </MuiThemeProvider>
  );
}
