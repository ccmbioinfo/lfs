<%-------------------------------------------------------------------%>
<%--  Licensed to the Apache Software Foundation (ASF) under one --%>
<%--  or more contributor license agreements.  See the NOTICE file --%>
<%--  distributed with this work for additional information --%>
<%--  regarding copyright ownership.  The ASF licenses this file --%>
<%--  to you under the Apache License, Version 2.0 (the --%>
<%--  "License"); you may not use this file except in compliance --%>
<%--  with the License.  You may obtain a copy of the License at --%>
<%-- --%>
<%--   http://www.apache.org/licenses/LICENSE-2.0 --%>
<%-- --%>
<%--  Unless required by applicable law or agreed to in writing, --%>
<%--  software distributed under the License is distributed on an --%>
<%--  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY --%>
<%--  KIND, either express or implied.  See the License for the --%>
<%--  specific language governing permissions and limitations --%>
<%--  under the License. --%>
<%-- --%>
<%@ page language="java" contentType="text/html; charset=US-ASCII"
    pageEncoding="US-ASCII" isErrorPage="true"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <sly data-sly-use.config="/libs/lfs/conf/Version">
      <meta name="version" content="${config['Version']}">
    </sly>
    <sly data-sly-use.config="/libs/lfs/conf/PlatformName">
      <meta name="platformName" content="${config['PlatformName']}">
    </sly>
    <sly data-sly-use.config="/libs/lfs/conf/AppName">
      <meta name="title" content="${config['AppName']}">
      <title>${config.AppName}</title>
    </sly>
    <sly data-sly-use.config="/libs/lfs/conf/ThemeColor">
      <meta name="themeColor" content="${config['ThemeColor']}">
    </sly>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&amp;display=swap" class="next-head"/>
    <script src="/system/sling.js"></script>
    <sly data-sly-use.assets="/libs/lfs/resources/assets">
      <script src="/libs/lfs/resources/${assets['vendor.js']}"></script>
      <script src="/libs/lfs/resources/${assets['runtime.js']}"></script>
    </sly>
  </head>
  <body>
    <div style="margin-top: 80px;
			font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
			align-items: center;
			flex-direction: column;
			text-align: center;
			width: 500px;
			margin-left: auto;
			margin-right: auto;
			display: flex;">
    
      <img style="max-width: 200px;" src="/libs/lfs/resources/logo_light_bg.png">
      <br>
      <div style="color: #35baf6; font-size: 6rem; font-weight: 300;">
        <div>404</div>
        <div>Not found</div>
      </div>
      <div style="color: #0000008a; font-size: 1.2rem; font-weight: 400; margin: 16px 0;">
	    The page you are trying to reach does not exist
	  </div>
	  <a href="/content.html/Questionnaires/User">
	    <button tabindex="0" style="margin-top: 32px;
								cursor: pointer;
								border: 0;
								color: #fff;
								background-color: #003366;
								padding: 14px 26px;
								font-size: 1rem;
								min-width: 64px;
								box-sizing: border-box;
								font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
								font-weight: 500;
								line-height: 1.75;
								border-radius: 26px;
								letter-spacing: 0.02857em;
								text-transform: uppercase;">
	      Go to the dashboard
        </button>
	  </a>
    </div>
  </body>
</html>