To help me with tracking multiple tasks/projects I use the Toggl Track (https://accounts.toggl.com/track/login/) desktop app, and toggl.com in the Chrome browser.

I then use Tamper monkey (https://chrome.google.com/webstore/detail/tampermonkey/) scripts to create a pop-over in Toggl Track to summarise each project as a line item which can be easily copied and pasted into a Timesheet program such as Microsoft Dynamics.
Each line item is shortened to be less than the character limit of Dynamics Time sheeting.

Toggl Track is a free tool that works both on your computer and phone and can be set up in multiple ways to aid in tracking time spent on various tasks.
Tamper Monkey is another free tool that allows you to run scripts in the browser to add features to a website.


# TogglTrack
Repo for TogglTrack Tampermonkey scripts

Prerequisites:
- Chrome Browser
- Tampermonkey account (free)
- TogglTrack account (free or paid)


To install:
- Install the Tampermonkey Chrome add-on: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- In Tampermonkey, open Utilities, and select 'Import from file' and upload the following scripts one at a time in correct numbered order:
-  1 - Task Performance Metrics - Configuration.user v1.9.js
-  2 - Task Performance Metrics - Toggl Timesheet Summary.user v1.9
[Note: be sure to install in order of numbering of scripts otherwise they won't load correctly.]
