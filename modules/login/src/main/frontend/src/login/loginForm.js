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
import PropTypes from 'prop-types';
import { Avatar, Button, CssBaseline, FormControl, Input, InputLabel, Paper, Typography, withStyles, InputAdornment, IconButton, Tooltip, Icon, SvgIcon } from '@material-ui/core';
// core components
import Card from "material-dashboard-react/dist/components/Card/Card.js";
import CardHeader from "material-dashboard-react/dist/components/Card/CardHeader.js";
import CardBody from "material-dashboard-react/dist/components/Card/CardBody.js";
import styles from "../styling/styles";

class SignIn extends React.Component {
  constructor(props, selfContained) {
    super(props);

    this.state = {
      passwordIsMasked: false,
      failedLogin: false,

      username: "",
      password: ""
    };
  }

  loginRedirectPath() {
    const currentPath = window.location.pathname.startsWith("/login") ? "/" : window.location.pathname;
    return new URLSearchParams(window.location.search).get("resource") || currentPath;
  };

  loginValidationPOSTPath() {
    return "/j_security_check";
  };

  togglePasswordMask = () => {
    this.setState(prevState => ({
      passwordIsMasked: !prevState.passwordIsMasked,
    }));
  }

  submitLogin() {
    fetch('/j_security_check',
      {
        method: 'POST',
        body: new URLSearchParams({
          "j_username": this.state.username,
          "j_password": this.state.password,
          "j_validate": true
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    .then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      this.setState({failedLogin: false});
      window.location = this.loginRedirectPath();
    })
    .catch((error) => {
      this.setState({failedLogin: true});
    });
  }

  render() {
    const { classes, selfContained } = this.props;
    const { passwordIsMasked } = this.state;

    return (
      <main className={classes.main}>
        <CssBaseline />
        <Card>
          <CardHeader color="info">
            <h4 className={classes.cardTitle}>LFS Data Core</h4>
            <span className={classes.cardSubtitle}>Sign in</span>
          </CardHeader>
          <CardBody>

            {this.state.failedLogin && <Typography component="h2" className={classes.errorMessage}>Invalid username or password</Typography>}

            <form className={classes.form} onSubmit={(event)=>{event.preventDefault(); this.submitLogin();}} >

              <FormControl margin="normal" required fullWidth>
                <InputLabel htmlFor="j_username">Username</InputLabel>
                <Input id="j_username" name="j_username" autoComplete="email" autoFocus onChange={(event) => {this.setState({username: event.target.value});}}/>
              </FormControl>

              <FormControl margin="normal" required fullWidth>
                <InputLabel htmlFor="j_password">Password</InputLabel>
                <Input name="j_password" type={this.state.passwordIsMasked ? 'text' : 'password'} id="j_password" autoComplete="current-password" onChange={(event) => {this.setState({password: event.target.value});}}
                  endAdornment={
                  <InputAdornment position="end">
                    <Tooltip title={this.state.passwordIsMasked ? "Mask Password" : "Show Password"}>
                      <IconButton
                        aria-label="Toggle password visibility"
                        onClick={this.togglePasswordMask}
                      >
                        {this.state.passwordIsMasked ? <Icon>visibility</Icon> : <Icon >visibility_off</Icon>}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                }
              />
              </FormControl>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className={classes.submit}
              >
                Sign in
              </Button>
            </form>
            <Typography>
              Don't have an account?
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={this.props.swapForm}
              className={classes.register}
            >
              <Icon className={classes.buttonIcon}>person_add</Icon> Register
            </Button>
          </CardBody>
        </Card>
      </main>
    );
  }
}

SignIn.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SignIn);
