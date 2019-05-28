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
import Assignment from '@material-ui/icons/Assignment';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import PropTypes from 'prop-types';
import React from "react";
import ReactDOM from "react-dom";
import { withStyles } from '@material-ui/core/styles';

const styles = {
  drawerPaper: {
    color: "white",
    backgroundColor: "#141414ff",
    backgroundImage: "url(/libs/lfs/resources/cancer-cells.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center center",
  },
  icon: {
    color: "#ffffffff"
  }
};

function Sidebar(props) {
  const { classes } = props;

  var icons = [(<HomeIcon className={classes.icon}/>), (<Assignment className={classes.icon}/>)]
  var items = ['Home', 'Data'];
  return (
    <React.Fragment>
      <Drawer
        anchor="left"
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <List>
          {items.map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{icons[index]}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </React.Fragment>
  );
}

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired,
};

const SidebarComponent = withStyles(styles)(Sidebar);

ReactDOM.render(
  <SidebarComponent />,
  document.querySelector('#main-container')
);
