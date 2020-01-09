/*!
 =========================================================
 * Material Dashboard React - v1.7.0
 =========================================================
 * Product Page: https://www.creative-tim.com/product/material-dashboard-react
 * Copyright 2019 Creative Tim (https://www.creative-tim.com)
 * Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)
 * Coded by Creative Tim
 =========================================================
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */
import {
    successColor,
    whiteColor,
    grayColor,
    hexToRgb
  } from "./themeStyle.jsx";

const thesaurusStyle = theme => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    opacity: 0.5
  },
  successText: {
    color: successColor[0]
  },
  upArrowCardCategory: {
    width: "16px",
    height: "16px"
  },
  stats: {
    color: grayColor[0],
    display: "inline-flex",
    fontSize: "12px",
    lineHeight: "22px",
    "& svg": {
      top: "4px",
      width: "16px",
      height: "16px",
      position: "relative",
      marginRight: "3px",
      marginLeft: "3px"
    },
    "& .fab,& .fas,& .far,& .fal,& .material-icons": {
      top: "4px",
      fontSize: "16px",
      position: "relative",
      marginRight: "3px",
      marginLeft: "3px"
    }
  },
  cardCategory: {
    color: grayColor[0],
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    paddingTop: "10px",
    marginBottom: "0"
  },
  cardCategoryWhite: {
    color: "rgba(" + hexToRgb(whiteColor) + ",.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0"
  },
  cardTitle: {
    color: grayColor[2],
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: grayColor[1],
      fontWeight: "400",
      lineHeight: "1"
    }
  },
  cardTitleWhite: {
    color: whiteColor,
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: grayColor[1],
      fontWeight: "400",
      lineHeight: "1"
    }
  },
  // Info box typography styles
  infoPaper: {
    maxWidth: "500px",
    padding: theme.spacing(2),
  },
  infoCard: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    position: "static",
    zIndex: "4 !important",
  },
  vocabularyAvatar: {
    height: 64,
    minWidth: 64,
    width: "auto",
    padding: theme.spacing(0.5),
  },
  infoSection: {
    padding: theme.spacing(1, 0),
  },
  // The following ensures poppers are placed below the presentation (zIndex 1300)
  // but above everything else
  popperListOnTop: {
    zIndex: "1301 !important",
  },
  popperInfoOnTop: {
    zIndex: "1302 !important",
  },
  popperNav: {
    // Old material-dashboard-react style, overridden because of issues with small screens
  },
  suggestionProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25
  },
  errorSnack: {
    backgroundColor: theme.palette.error.dark,
  },
  searchWrapper: {
    margin: theme.spacing(0, 0, 0, 6.3),
    position: 'relative',
    display: 'inline-block',
    paddingBottom: "0px",
  },
  search: {
    paddingBottom: "0px",
    margin: "0px"
  },
  searchInput: {
    marginTop: "6px !important",
  },
  searchLabel: {
    marginTop: theme.spacing(-1.5),
  },
  searchShrink: {
    transform: "translate(0, 12px) scale(0.6)",
  },
  searchButton: {
    margin: "0px",
  },
  dropdownItem: {
    whiteSpace: 'normal',
  },
  infoAboveBackdrop: {
    // When the info box is spawned from the browse menu,
    // it should no longer be greyed out
    zIndex: "1352 !important",
  },
  inactiveProgress: {
    visibility: "hidden"
  },
  progressIndicator: {
    marginBottom: theme.spacing(-.5),
    height: theme.spacing(.5)
  },
  infoButton: {
    minWidth: "0px",
    width: "30px",
    color: "#00ACC1",
  },
  infoDialog: {
    zIndex: "1350 !important",
  }
});

export default thesaurusStyle;
