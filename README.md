# Robin Enhancement Suite
Robin Enhancement Suite is a neat userscript for [reddit robin](https://www.reddit.com/robin/) adding features such as:

## Features

* **Advanced, configurable Spam filter***
* Automatically vote for growth or stay
* Single-User mute
* **Displays user count, tally and current vote outcome**
* **Chat with Channel Filter**
* Chat and user list use the entire available site height
* Highlight messages containing your name (thanks to /u/rlemon, who made [this](https://gist.github.com/rlemon/cc13cb4c31861e5d5ba2a92bfc920aeb) great script)
* **Automatically try to rejoin, if kicked out of robin (again, thanks to /u/rlemon)**

* *Posts are filtered after:
  *  - a user and content blacklist
  *  - bot messages
  *  - containment of special characters, ASCII or CAPS
  *  - channel (configurable)

## Installation

The by far easiest way to install this script is by pasting it into your browser's developer console (`ctrl` + `shift` + `K` on **Firefox** or `ctrl` + `shift` + `J` on **Chrome**. This will however require you do do that again after every reload or growth.

Install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) for **Firefox** or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) for **Chrome** to use this userscript.
Opera has built-in userscript support

Next open this [raw url](https://github.com/Cealor/Robin-Enhancement-Suite/raw/master/robin-es.user.js) of the script and you should get an installation popup.

# Changelog
    1.9: Increased updating time, incorporated Caps filter by /gardner
    1.8: Advanced Spam filter added
    1.5: UX Updated
    1.3: First stage merging with /Cealor/robin-script complete
    1.2: Initial updates
    1.1: Initial fork


## Planned

* Use online spam blacklist
* Add ratelimit counter
* Limit vote count polling (especially important in bigger rooms)
* All-Time Stats
