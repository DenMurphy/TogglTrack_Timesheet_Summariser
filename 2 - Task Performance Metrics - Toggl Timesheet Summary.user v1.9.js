// ==UserScript==
// @name         Task Performance Metrics - Toggl Timesheet Summary
// @namespace    https://tampermonkey.net/
// @version      1.9
// @description  Add timesheet summary table to the Toggl website. Added 'Last Monday' button.
// @author       Dennis Murphy
// @match        *://toggl.com/app/*
// @match        *://www.toggl.com/app/*
// @match        *://track.toggl.com/*
// @match        *://api.toggl.com/*
// @grant        none
// @require      https://momentjs.com/downloads/moment.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
// ==/UserScript==

/* globals jQuery, $, waitForKeyElements */

(function () {
    'use strict';

    // Declare global variables.
    var selectedDate = moment();

    // Format a Toggl time value as a string.
    var formatTime = function (duration) {
        var durationHours = duration / 3600000;
        return (Math.ceil(durationHours * 10) / 10).toFixed(1); // Round up to 1 decimal place.
    };

    // Apply table header cell styling.
    var applyTableHeaderCellStyle = function (tableCell) {
        applyTableCellStyle(tableCell);
        tableCell.css('background-color', 'grey');
        tableCell.css('color', 'white');
        tableCell.css('font-weight', 'bold');
    };

    // Apply table cell styling.
    var applyTableCellStyle = function (tableCell) {
        tableCell.css('border-color', 'lightgrey');
        tableCell.css('border-style', 'solid');
        tableCell.css('border-width', 1);
        tableCell.css('padding', 10);
        tableCell.css('font-size', 14);
    };

    // Apply button styling.
    var applyButtonStyle = function (button) {
        button.css('display', 'block');
        button.css('float', 'right');
        button.css('width', 100);
        button.css('margin-left', 10);
    };

    // Copy the task description text to the clipboard.
    var copyTaskDescHandler = function () {

        // Find page elements.
        var allTaskDescTableRows = $(this).parents('table#summaryTable tbody').find('tr');
        var curTaskDescTableRow = $(this).parents('table#summaryTable tr');

        // Highlight the rows containing the copied text.
        allTaskDescTableRows.css('background-color', '');
        curTaskDescTableRow.css('background-color', 'lightyellow');

        // Copy of task description text to the clipboard.
        var taskDescElem = curTaskDescTableRow.find('textarea');
        taskDescElem.select();
        document.execCommand('copy');
    };

    // Format the specified task description text.
    var formatTaskDescription = function (taskDescription) {
        const MAX_TASK_DESC_LENGTH = 100;
        var tempText = '* ' + taskDescription.trim();
        if (tempText.length > MAX_TASK_DESC_LENGTH) {
            return tempText.substring(0, MAX_TASK_DESC_LENGTH - 3) + '...';
        }
        return tempText;
    };

    // Update the content of the summary table.
    var updateSummaryTable = function (date, div) {

        // Get the page elements.
        var dateSpan = div.find('#selectedDate');
        var tableBody = div.find('#summaryContent');

        // Render the selected date.
        dateSpan.text(date.format('ddd, DD MMM YYYY'));

        // Get the Toggl user details.
        var togglApiToken = window.TaskPerformanceMetrics.Configuration.TogglApiToken;
        var workspaceId = window.TaskPerformanceMetrics.Configuration.TogglWorkspaceId;
        var userid = window.TaskPerformanceMetrics.Configuration.TogglUserId;

        // Check if the configuration properties are valid.
        if (togglApiToken == null || workspaceId == null || userid == null) {
            console.log('Invalid configuration found!');
            return;
        }

        // Build the Toggl API url.
        var dateFilter = date.format('YYYY-MM-DD');
        var apiUrl = 'https://api.toggl.com/reports/api/v3/summary?user_agent=none&workspace_id=' + workspaceId + '&user_ids=' + userid + '&since=' + dateFilter + '&until=' + dateFilter;

        // Disable all buttons.
        div.find('button').attr('disabled', 'disabled');

        // Clear contents of the summary table body.
        tableBody.empty();

        // Get data from Toggl API.
        $.ajax({
            dataType: 'JSON',
            url: apiUrl,
            beforeSend: function (xhr) {

                // Set authorization header.
                xhr.setRequestHeader("Authorization", "Basic " + btoa(togglApiToken + ':api_token'));

            },
            success: function (response) {

                // Render the API results in the summary table.
                response.data.sort(
                    function (a, b) {
                        // Sort by client & project name.
                        var clientAndProjectA = a.title.client + '|' + a.title.project;
                        var clientAndProjectB = b.title.client + '|' + b.title.project;
                        if (clientAndProjectA > clientAndProjectB) return 1;
                        if (clientAndProjectA < clientAndProjectB) return -1;
                        return 0;
                    }
                ).forEach(
                    function (projectData) {

                        var summaryTableDataRow = $('<tr></tr>');

                        var clientNameCell = $('<td></td>');
                        var clientName = projectData.title.client;
                        clientNameCell.text(clientName);
                        if (clientName === null) {
                            clientNameCell.css('color', 'red');
                        }
                        summaryTableDataRow.append(clientNameCell);

                        var projectNameCell = $('<td></td>');
                        var projectName = projectData.title.project;
                        projectNameCell.text(projectName);
                        if (projectName === null) {
                            projectNameCell.css('color', 'red');
                        }
                        summaryTableDataRow.append(projectNameCell);

                        var taskDescription = '';
                        projectData.items.sort(
                            // Sort tasks in descending order of duration.
                            function (a, b) {
                                if (a.time < b.time) return 1;
                                if (a.time > b.time) return -1;
                                else return 0;
                            }
                        ).forEach(
                            // Build a combined task description summary.
                            function (taskData) {
                                var tempDesc = taskDescription + formatTaskDescription(taskData.title.time_entry) + '\n';
                                if (tempDesc.length <= 255) {
                                    taskDescription = tempDesc;
                                }
                            }
                        );
                        taskDescription = taskDescription.trimEnd();

                        var taskDescPre = $('<pre></pre>');
                        taskDescPre.css('display', 'inline-block');
                        taskDescPre.css('float', 'left');
                        taskDescPre.text(taskDescription);

                        var taskDescTextArea = $('<textarea></textarea>'); // Required for "Copy" feature.
                        taskDescTextArea.css('position', 'absolute');
                        taskDescTextArea.css('width', 0);
                        taskDescTextArea.css('height', 0);
                        taskDescTextArea.css('left', -9999); // Hide the text area off screen.
                        taskDescTextArea.text(taskDescription);

                        var taskDescCopyButton = $('<button type="button">&#187;</button>');
                        taskDescCopyButton.css('display', 'inline-block');
                        taskDescCopyButton.css('float', 'right');
                        taskDescCopyButton.css('margin-left', 10);
                        taskDescCopyButton.click(copyTaskDescHandler);

                        var taskDescDataCell = $('<td></td>');
                        taskDescDataCell.append(taskDescPre);
                        taskDescDataCell.append(taskDescTextArea);
                        taskDescDataCell.append(taskDescCopyButton);

                        summaryTableDataRow.append(taskDescDataCell);
                        summaryTableDataRow.append($('<td></td>').text(formatTime(projectData.time)).css('text-align', 'center'));
                        tableBody.append(summaryTableDataRow);
                    });

                applyTableCellStyle(summaryTable.find('th, td'));

                // Enable all buttons.
                div.find('button').removeAttr('disabled');
            }
        });
    };

    // Build timesheet summary UI elements.
    var summaryDiv = $('<div></div>');
    summaryDiv.css('position', 'fixed');
    summaryDiv.css('bottom', 10);
    summaryDiv.css('right', 80);
    summaryDiv.css('padding', 10);
    summaryDiv.css('opacity', 1);
    summaryDiv.css('z-index', 9999);
    summaryDiv.css('background-color', 'white');
    summaryDiv.css('border-color', 'lightgrey');
    summaryDiv.css('border-style', 'solid');
    summaryDiv.css('border-width', 1);
    summaryDiv.css('margin-left', 10);

    var summaryTitle = $('<h1>Timesheet Summary | <span id="selectedDate"></span></h1>');
    summaryTitle.css('margin-bottom', 10);
    summaryTitle.css('font-weight', 'bold');
    summaryTitle.css('font-size', 14);
    summaryTitle.css('color', 'red');
    summaryDiv.append(summaryTitle);

    var summaryTable = $('<table id="summaryTable"></table>').css('margin-bottom', 10);
    summaryTable.css('display', 'none');
    summaryDiv.append(summaryTable);

    var summaryTableHeader = $('<thead></thead>');
    summaryTable.append(summaryTableHeader);

    var summaryTableHeaderRow = $('<tr></tr>');
    ['Client', 'Project', 'Task Description', 'Hours'].forEach(
        function (headerText) {
            var summaryTableHeaderCell = $('<th>' + headerText + '</hd>');
            applyTableHeaderCellStyle(summaryTableHeaderCell);
            summaryTableHeaderRow.append(summaryTableHeaderCell);
        });
    summaryTableHeader.append(summaryTableHeaderRow);

    var summaryTableBody = $('<tbody id="summaryContent"></tbody>');
    summaryTable.append(summaryTableBody);

    var showButton = $('<button type="button">Show</button>');
    applyButtonStyle(showButton);
    showButton.click(function () {
        updateSummaryTable(selectedDate, summaryDiv);
        summaryTable.show();
        summaryDiv.find('button').show();
        showButton.hide();
    });
    summaryDiv.append(showButton);

    var hideButton = $('<button type="button">Hide</button>');
    applyButtonStyle(hideButton);
    hideButton.css('display', 'none');
    hideButton.click(function () {
        summaryTable.hide();
        summaryDiv.find('button').hide();
        showButton.show();
    });
    summaryDiv.append(hideButton);

    var refreshButton = $('<button type="button">Refresh</button>');
    applyButtonStyle(refreshButton);
    refreshButton.css('display', 'none');
    refreshButton.click(function () {
        updateSummaryTable(selectedDate, summaryDiv);
    });
    summaryDiv.append(refreshButton);

    var thisMondayButton = $('<button type="button">This Monday</button>');
    applyButtonStyle(thisMondayButton);
    thisMondayButton.css('display', 'none');
    thisMondayButton.click(function () {
        selectedDate = moment().day('Monday');
        updateSummaryTable(selectedDate, summaryDiv);
    });
    summaryDiv.append(thisMondayButton);

    var nextDayButton = $('<button type="button">Next Day</button>');
    applyButtonStyle(nextDayButton);
    nextDayButton.css('display', 'none');
    nextDayButton.click(function () {
        selectedDate = selectedDate.add(1, 'days');
        updateSummaryTable(selectedDate, summaryDiv);
    });
    summaryDiv.append(nextDayButton);

    var todayButton = $('<button type="button">Today</button>');
    applyButtonStyle(todayButton);
    todayButton.css('display', 'none');
    todayButton.click(function () {
        selectedDate = moment();
        updateSummaryTable(selectedDate, summaryDiv);
    });
    summaryDiv.append(todayButton);

    var prevDayButton = $('<button type="button">Previous Day</button>');
    applyButtonStyle(prevDayButton);
    prevDayButton.css('display', 'none');
    prevDayButton.click(function () {
        selectedDate = selectedDate.subtract(1, 'days');
        updateSummaryTable(selectedDate, summaryDiv);
    });
    summaryDiv.append(prevDayButton);

    var lastMondayButton = $('<button type="button">Last Monday</button>');
    applyButtonStyle(lastMondayButton);
    lastMondayButton.css('display', 'none');
    lastMondayButton.click(function () {
        //selectedDate = moment().day('Monday');
        selectedDate = moment().startOf('isoWeek');
        updateSummaryTable(selectedDate, summaryDiv);
    });
    summaryDiv.append(lastMondayButton);

    // Update summary table content.
    updateSummaryTable(selectedDate, summaryDiv);

    // Add the timeheet summary DIV to the page.
    $('body').append(summaryDiv);

})();