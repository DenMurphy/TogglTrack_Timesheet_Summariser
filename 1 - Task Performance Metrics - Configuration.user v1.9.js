// ==UserScript==
// @name         Task Performance Metrics - Configuration
// @namespace    https://tampermonkey.net/
// @version      1.9
// @description  Task Performance Metrics - Configuration (Compatible with API v9 as per https://developers.track.toggl.com/docs/index.html). You can locate your personal API Token here: https://track.toggl.com/profile.
// @author       Dennis Murphy
// @match        *://support.allianceautomation.com.au/*
// @match        *://toggl.com/app/*
// @match        *://www.toggl.com/app/*
// @match        *://track.toggl.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Task Performance Metrics - Configuration applied.');

    // Declare configuration object.
    window.TaskPerformanceMetrics = window.TaskPerformanceMetrics || {};
    window.TaskPerformanceMetrics.Configuration = window.TaskPerformanceMetrics.Configuration || {};
    window.TaskPerformanceMetrics.Configuration.TogglApiToken = null;
    window.TaskPerformanceMetrics.Configuration.TogglWorkspaceId = null;
    window.TaskPerformanceMetrics.Configuration.TogglUserId = null;

    if (window.location.hostname.search(/toggl/i) >= 0){

        // Set user specific configuration values.
        var getUserDetails = function(){
            var userDetails = JSON.parse(sessionStorage.getItem('/api/v9/me'));
            if (userDetails == null){
                console.log('Toggl user details NOT found!');
                setTimeout(getUserDetails, 250);
            } else {
                console.log('Toggl user details found.');
                window.TaskPerformanceMetrics.Configuration.TogglApiToken = userDetails.api_token;
                window.TaskPerformanceMetrics.Configuration.TogglWorkspaceId = userDetails.default_workspace_id;
                window.TaskPerformanceMetrics.Configuration.TogglUserId = userDetails.id;
            }
        }
        getUserDetails();

    } else {

        // Set common configuration values.
        window.TaskPerformanceMetrics.Configuration.TogglApiToken = '1bcef883b215547d102f393c0bb0d838';
        window.TaskPerformanceMetrics.Configuration.TogglWorkspaceId = 2761433;

    }

})();