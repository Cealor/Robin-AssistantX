// ==UserScript==
// @name        Robin Enhancement Suite
// @description Growth in peace
// @namespace   com.github.Cealor
// @include     https://www.reddit.com/robin*
// @version     1.9
// @author      LeoVerto, Wiiplay123, Getnamo, K2L8M11N2, Cealor, vartan
// @updateURL   https://github.com/Cealor/Robin-Enhancement-Suite/raw/master/robin-es.user.js
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant   GM_getValue
// @grant   GM_setValue
// ==/UserScript==
var version = "1.9";

var userCount = 0;

var percentNonWordCharactersAllowed = .25;
var ratioUppercaseToLowercase = .25;

var msgsDeleted = 0;

var  autoVote = "grow";
var  disableVoteMsgs = true;
var  filterSpam = true;
var  filterNonAscii = true;
//var  keepMessageCount = 200;
var  findAndHideSpam = true;
var  useStorage = false;

var timeStarted = new Date();
var name = $(".robin-chat--room-name").text();
var urlRegex = new RegExp(/(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?/ig);

$("#robinVoteWidget").append('<div class="addon"><div class="robin-chat--vote" style="font-weight: bold; padding: 5px;cursor: pointer;" id="openBtn">Open Settings</div></div>'); // Open Settings
$(".robin-chat--sidebar").before('<div class="robin-chat--sidebar" style="display:none;" id="settingContainer"><div class="robin-chat--sidebar-widget robin-chat--vote-widget" id="settingContent"></div></div>'); // Setting container

$("#robinVoteWidget").prepend("<div class='addon'><div class='nextround robin-chat--vote' style='font-weight:bold;pointer-events:none;'></div></div>");
$("#robinVoteWidget").prepend("<div class='addon'><div class='usercount robin-chat--vote' style='font-weight:bold;pointer-events:none;'></div></div>");
$("#robinVoteWidget").prepend("<div class='addon'><div class='timeleft robin-chat--vote' style='font-weight:bold;pointer-events:none;'></div></div>");

$('.robin-chat--buttons').prepend("<div class='robin-chat--vote robin--vote-class--novote'><span class='robin--icon'></span><div class='robin-chat--vote-label'></div></div>");
$('#robinVoteWidget .robin-chat--vote').css('padding', '5px');
$('.robin--vote-class--novote').css('pointer-events', 'none');

$(".robin-chat--vote.robin--vote-class--abandon").on("click", setVote("abandon"));
$(".robin-chat--vote.robin--vote-class--continue").on("click", setVote("stay"));
$(".robin-chat--vote.robin--vote-class--increase").on("click", setVote("grow"));


function hasChannel(source, channel) {
    channel = String(channel).toLowerCase();
    return String(source).toLowerCase().startsWith(channel);
}

function openSettings() {
    $(".robin-chat--sidebar").hide();
    $("#settingContainer").show();
}
    $("#openBtn").on("click", openSettings);

function closeSettings() {
$(".robin-chat--sidebar").show();
$("#settingContainer").hide();
}
$("#settingContent").append('<div class="robin-chat--vote" style="font-weight: bold; padding: 5px;cursor: pointer;" id="closeBtn">Close Settings</div>');
$("#closeBtn").on("click", closeSettings);

function saveSetting(settings) {
    localStorage["robin-es-config"] = JSON.stringify(settings);
}

function loadSetting() {
    var setting = localStorage["robin-es-config"];
    if (setting) {
        setting = JSON.parse(setting);
} else {
    setting = {};
}
    return setting;
}

var settings = loadSetting();

function addBoolSetting(name, description, defaultSetting) {

    defaultSetting = settings[name] || defaultSetting;

    $("#settingContent").append('<div class="robin-chat--sidebar-widget robin-chat--notification-widget"><label><input type="checkbox" name="setting-' + name + '">' + description + '</label></div>');
    $("input[name='setting-" + name + "']").on("click", function() {
        settings[name] = !settings[name];
        saveSetting(settings);
    });
    if (settings[name] !== undefined) {
        $("input[name='setting-" + name + "']").prop("checked", settings[name]);
    } else {
        settings[name] = defaultSetting;
    }
}

function addInputSetting(name, description, defaultSetting) {

    defaultSetting = settings[name] || defaultSetting;

    $("#settingContent").append('<div id="robinDesktopNotifier" class="robin-chat--sidebar-widget robin-chat--notification-widget"><label><input type="text" name="setting-' + name + '">' + description + '</label></div>');
    $("input[name='setting-" + name + "']").prop("defaultValue", defaultSetting)
        .on("change", function() {
        settings[name] = $(this).val();
        saveSetting(settings);
    });
    settings[name] = defaultSetting;
}

// Options begin
addBoolSetting("findAndHideSpam", "Filter repost spamming", true);
addInputSetting("maxprune", "Max messages before pruning", "500");
addBoolSetting("filterChannel", "Filter by channel", false); 
addInputSetting("channel", "Channel filter", "");
//addBoolSetting("findAndHideSpam", "Filter repost spamming", true);
//addBoolSetting("autoVote", "Automatically vote for grow", true);
//addBoolSetting("filterSpam", "Filter known spam", true);
//addBoolSetting("disableVoteMsgs", "Filter Vote messages", true);
//addBoolSetting("filterNonAscii", "Filter after blacklist", true);




// Options end
$("#settingContent").append('<div class="robin-chat--sidebar-widget robin-chat--report" style="text-align:center;"><a target="_blank" href="https://github.com/Cealor/Robin-Enhancement-Suite/raw/master/robin-es.user.js">Robin Enhancement Suite - Version ' + version + '</a></div>');

// This is the function that checks for ALL CAPS MESSAGES and poop emojis
function isReal(s) {
    var upperStr = s.replace(/[A-Z]/g, '')
    var upper = s.length - upperStr.length;

    var lowerStr = upperStr.replace(/[a-z]/g, '')
    var lower = upperStr.length - lowerStr.length;

    var nonWord = lowerStr.length;

    // if the ratio of uppercase to lowercase letters is greater that .25, fail the message
    if ((upper / lower) > ratioUppercaseToLowercase) {
        //    console.log(upper + ' / ' + lower + ' / ' + nonWord + ' ratio is ' + upper / lower);
        filteredSpamCount += 1;
        updateCounter("filter-spam-counter", filteredSpamCount);
        return false;
    }

    // if the percentage of non-word characters is larger than 25% then fail the message
    if ((nonWord / s.length) > percentNonWordCharactersAllowed) {
        //    console.log(upper + ' / ' + lower + ' / ' + nonWord + ' percentage is ' + nonWord / s.length);
        filteredSpamCount += 1;
        updateCounter("filter-spam-counter", filteredSpamCount);
        return false;
    }
    return true;
}   


function removeCaps() {
    $("#robinChatMessageList").bind("DOMSubtreeModified", function() {
        var msgs = $('.robin-message--message');
          //  console.log('number of msgs: ' + msgs.length + '/' + msgsDeleted);

        for(var i = 0; i < msgs.length; i++) {
            if (!isReal(msgs[i].innerText)) {
                // allow the system messages to come through
                if (!$(msgs[i]).parent().hasClass('robin--user-class--system')) {
                    msgsDeleted++;
                    $(msgs[i]).parent().remove();
                }
            }
        }
    });
}



function filterMessages() {
    $(".robin--user-class--user").filter(function(num, message) {
        var text = $(message).find(".robin-message--message").text();

        if (settings["filterSpam"] && (text.indexOf("[") === 0 ||
                                       text == "voted to STAY" ||
                                       text == "voted to GROW" ||
                                       text == "voted to ABANDON" ||
                                       text.indexOf("Autovoter") > -1 ||
                                       (/[\u0080-\uFFFF]/.test(text)))) {

            return true;
        }

        if(settings['filterChannel'] &&
           String(settings['channel']).length > 0 &&
           !hasChannel($(message).find(".robin-message--message").text(), settings['channel'])) {
            return true;
        }

        return false;

    }).remove();

}

function isBotSpam(text) {
    // starts with a [, has "Autovoter", or is a vote
    var filter = text.indexOf("[") === 0 ||
        text == "voted to STAY" ||
        text == "voted to GROW" ||
        text == "voted to ABANDON" ||
        text.indexOf("Autovoter") > -1 ||
        /* Detects unicode spam - Credit to travelton
             * https://gist.github.com/travelton */
        (/[\u0080-\uFFFF]/.test(text));

    // if(filter)console.log("removing "+text);
    return filter;
}


// Individual mute button /u/verox-
var mutedList = [];
$('body').on('click', ".robin--username", function() {
    var username = $(this).text();
    var clickedUser = mutedList.indexOf(username);

    if (clickedUser == -1) {
        // Mute our user.
        mutedList.push(username);
        this.style.textDecoration = "line-through";
    } else {
        // Unmute our user.
        this.style.textDecoration = "none";
        mutedList.splice(clickedUser, 1);
    }
});


// credit to wwwroth for idea (notification audio)
// i think this method is better
var notifAudio = new Audio("https://slack.global.ssl.fastly.net/dfc0/sounds/push/knock_brush.mp3");

var myObserver = new MutationObserver(mutationHandler);
//--- Add a target node to the observer. Can only add one node at a time.
// XXX Shou: we should only need to watch childList, more can slow it down.
$("#robinChatMessageList").each(function() {
    myObserver.observe(this, { childList: true });
});
function mutationHandler(mutationRecords) {
    mutationRecords.forEach(function(mutation) {
        var jq = $(mutation.addedNodes);
        // There are nodes added
        if (jq.length > 0) {
            // cool we have a message.
            var thisUser = $(jq[0].children && jq[0].children[1]).text();
            var $message = $(jq[0].children && jq[0].children[2]);
            var messageText = $message.text();

            var remove_message =
                (mutedList.indexOf(thisUser) >= 0) ||
                (settings.removeSpam && isBotSpam(messageText)) ||
                (settings.filterChannel &&
                 !jq.hasClass('robin--user-class--system') &&
                 String(settings.channel).length > 0 &&
                 !hasChannel(messageText, settings.channel));


            if(nextIsRepeat && jq.hasClass('robin--user-class--system')) {
            }
            var nextIsRepeat = jq.hasClass('robin--user-class--system') && messageText.indexOf("try again") >= 0;
            if(nextIsRepeat) {
                $(".text-counter-input").val(jq.next().find(".robin-message--message").text());
            }

            remove_message = remove_message && !jq.hasClass("robin--user-class--system");
            if (remove_message) {
                $message = null;
                $(jq[0]).remove();
            } else {
                if(settings.filterChannel) {
                    if(messageText.indexOf(settings.channel) == 0) {
                        $message.text(messageText.substring(settings.channel.length).trim());
                    }
                }
                if (messageText.toLowerCase().indexOf(currentUsersName.toLowerCase()) !== -1) {
                    $message.parent().css("background","#FFA27F").css("color","white");
                    notifAudio.play();
                    console.log("got new mention");
                }
                if(urlRegex.test(messageText)) {
                    urlRegex.lastIndex = 0;
                    var url = encodeURI(urlRegex.exec(messageText)[0]);
                    var parsedUrl = url.replace(/^/, "<a target=\"_blank\" href=\"").replace(/$/, "\">"+url+"</a>");
                    var oldHTML = $(jq[0]).find('.robin-message--message').html();
                    var newHTML = oldHTML.replace(url, parsedUrl);
                    $(jq[0]).find('.robin-message--message').html(newHTML);
                }
                filterMessages();
                removeCaps();
            }
        }
    });
}

// hash string so finding spam doesn't take up too much memory
function hashString(str) {
    var hash = 0;

    if (str != 0) {
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            if (str.charCodeAt(i) > 0x40) { // Let's try to not include the number in the hash in order to filter bots
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
        }
    }

    return hash;
}
var currentUsersName = $('div#header span.user a').html();
function findAndHideSpam() {
    var $messages = $(".robin-message");

    var maxprune = parseInt(maxprune || "1000", 10);
    if (maxprune < 10 || isNaN(maxprune)) {
        maxprune = 1000;
    }

    if ($messages.length > maxprune) {
        $messages.slice(0, $messages.length - maxprune).remove();
    }

    if (findAndHideSpam) {
        // skips over ones that have been hidden during this run of the loop
        $('.robin--user-class--user .robin-message--message:not(.addon--hide)').each(function() {
            var $this = $(this);

            var hash = hashString($this.text());
            var user = $('.robin-message--from', $this.closest('.robin-message')).text();

            if (!(user in spamCounts)) {
                spamCounts[user] = {};
            }

            if (hash in spamCounts[user]) {
                spamCounts[user][hash].count++;
                spamCounts[user][hash].elements.push(this);
            } else {
                spamCounts[user][hash] = {
                    count: 1,
                    text: $this.text(),
                    elements: [this]
                };
            }
            $this = null;
        });

        $.each(spamCounts, function(user, messages) {
            $.each(messages, function(hash, message) {
                if (message.count >= 3) {
                    $.each(message.elements, function(index, element) {
                        console.log("SPAM REMOVE: "+$(element).closest('.robin-message').text())
                        $(element).closest('.robin-message').addClass('addon--hide').remove();
                    });
                } else {
                    message.count = 0;
                }

                message.elements = [];
            });
        });
    }
}


// Notifications
var notifAudio = new Audio("https://slack.global.ssl.fastly.net/dfc0/sounds/push/knock_brush.mp3");

var currentUsersName = $('div#header span.user a').html();







var flairColor = [
    '#e50000', // red
    '#db8e00', // orange
    '#ccc100', // yellow
    '#02be01', // green
    '#0083c7', // blue
    '#820080'  // purple
];

function colorFromName(name) {
    sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    flairNum = parseInt(sanitizedName, 36) % 6;
    return flairColor[flairNum];
}

// Color names in user list
$('#robinUserList .robin--username').each(function(){
    $(this).css('color', colorFromName($(this).text()));
});

// Bold current user's name in user list
$('#robinUserList .robin--user-class--self .robin--username').css('font-weight', 'bold');

// Color current user's name in chat and darken post backgrounds
var currentUserColor = colorFromName($('#robinUserList .robin--user-class--self .robin--username').text());
$('<style>.robin--user-class--self { background: #F5F5F5; } .robin--user-class--self .robin--username { color: ' + currentUserColor + ' !important; font-weight: bold;}</style>').appendTo('body');

// Send message button
$("#robinSendMessage").append('<div onclick={$(".text-counter-input").submit();} class="robin-chat--vote" style="font-weight: bold; padding: 5px;cursor: pointer; margin-left:0;" id="sendBtn">Send Message</div>'); // Send message
$('#robinChatInput').css('background', '#EFEFED');







var ownName = $('.user a').text();
var filteredSpamCount = 0;
var filteredVoteCount = 0;
var filteredNonAsciiCount = 0;


var votes = {
  grow: 0,
  stay: 0,
  abandon: 0,
  abstain: 0,
  action: 'Unknown'
}

var votesLastUpdated = 0;

var startTime = new Date();

var userWhitelist = ["nbagf"]
var userBlacklist = ["OldenNips", "chapebrone"];


var manualThaiList = ["̍", "̎", "̄", "̅", "̿", "̑", "̆", "̐", "͒", "͗", "\
", "͑", "̇", "̈", "̊", "͂", "̓", "̈́", "͊", "͋", "͌", "\
", "̃", "̂", "̌", "͐", "̀", "́", "̋", "̏", "̒", "̓", "\
", "̔", "̽", "̉", "ͣ", "ͤ", "ͥ", "ͦ", "ͧ", "ͨ", "ͩ", "\
", "ͪ", "ͫ", "ͬ", "ͭ", "ͮ", "ͯ", "̾", "͛", "͆", "̚", "\
", "̕", "̛", "̀", "́", "͘", "̡", "̢", "̧", "̨", "̴", "\
", "̵", "̶", "͏", "͜", "͝", "͞", "͟", "͠", "͢", "̸", "\
", "̷", "͡", "҉", "\
", "̖", "̗", "̘", "̙", "̜", "̝", "̞", "̟", "̠", "̤", "\
", "̥", "̦", "̩", "̪", "̫", "̬", "̭", "̮", "̯", "̰", "\
", "̱", "̲", "̳", "̹", "̺", "̻", "̼", "ͅ", "͇", "͈", "\
", "͉", "͍", "͎", "͓", "͔", "͕", "͖", "͙", "͚", "̣", "\
"];

var spamBlacklist = ["spam the most used",
  "ຈل͜ຈ", "hail", "autovoter", "﷽", "group to stay", "pasta", "robinplus",
  "automatically voted", "stayers are betrayers", "stayers aint players",
  "mins remaining. status", ">>>>", "trump", "#420", "้", "็", "◕_◕",
  "<<<<", "growing is all we know", "f it ends on you", "heil", "hitler",
  "timecube", "\( ͡° ͜ʖ ͡°\)", "◕", "guys can you please not spam the chat",
  "ｍｅｍｅｓ ｏｆ ｃａｐｉｔａｌｉｓｍ", "𝐁𝐄𝐑𝐍𝐈𝐄 𝐒𝐀𝐍𝐃𝐌𝐀𝐍", "█▄█▄",  "卐",
  "spam the most used phrase", "moob hunter", "someone in chat annoying",
  "cool ppl list", "can't beat me", "smexy", "my ruler", "bean",
  "current standings", "numbers & tits", "numbers and tits", "nigglets",
  "voting will end",
]

var nonEnglishSpamRegex = "[^\x00-\x7F]+";

function rewriteCSS() {
  $(".robin-chat--body").css({
    "height": "80vh"
  });
}

function sendMessage(msg) {
  $(".text-counter-input")[0].value = msg;
  $(".text-counter-input")[0].nextSibling.click();
}


// Config
function loadConfig() {
  if(typeof(Storage) !== "undefined") {
    useStorage = true;

    if (localStorage.getItem("robin-es-config") !== null) {
      var newConfig = JSON.parse(localStorage.getItem("robin-es-config"));
      // Config might have been saved by older version of script with less options
      for (property in config) {
        if (newConfig[property] !== undefined) {
          config[property] = newConfig[property];
        }
      }

      console.log("Loaded config!");
    }
  }
}

function writeConfig() {
  if (useStorage) {
    localStorage.setItem("robin-es-config", JSON.stringify(config));
    console.log("Saving config...")
  }
}

function updateConfigVar(variable, value) {
  [variable] = value;
  writeConfig();
}



// Custom options
function addOptions() {
  // Remove possible existing custom options
  $("#customOptions").remove();

  var customOptions = document.createElement("div");
  customOptions.id = "customOptions";
  customOptions.className =
    "robin-chat--sidebar-widget robin-chat--notification-widget";

  var header = "<b style=\"font-size: 14px;\">Settings</b>"

  var autoVoteGrow = createRadio("auto-vote", "grow",
    "Automatically vote \"Grow\"", autoVote, autoVoteListener);
  var autoVoteStay = createRadio("auto-vote", "stay",
    "Automatically vote \"Stay\"", autoVote, autoVoteListener);

  var filters = "<br><b style=\"font-size: 13px;\">Filters</b>"

  var filterVotesOption = createCheckbox("filter-votes",
    "Vote Messages", disableVoteMsgs, disableVoteMsgsListener, true);
  var filterSpamOption = createCheckbox("filter-spam",
    "Common spam", filterSpam, filterSpamListener, true);
  var filterNonAsciiOption = createCheckbox("filter-nonascii",
    "Non-ascii", filterNonAscii, filterNonAsciiListener, true);
    
  var userCounter =
    "<br><span style=\"font-size: 14px;\">Users here: <span id=\"user-count\">0</span></span>";
  var voteGrow =
    "<br><span style=\"font-size: 14px;\">Grow: <span id=\"vote-grow\">0</span></span>";
  var voteStay =
    "<br><span style=\"font-size: 14px;\">Stay: <span id=\"vote-stay\">0</span></span>";
  var voteAbandon =
    "<br><span style=\"font-size: 14px;\">Abandon: <span id=\"vote-abandon\">0</span></span>";
  var voteAbstain =
    "<br><span style=\"font-size: 14px;\">Abstain: <span id=\"vote-abstain\">0</span></span>";
  var timer =
    "<br><span style=\"font-size: 14px;\">Time Left: <span id=\"time-left\">0</span></span>";
  var nextAction =
    "<br><i><span id=\"next-action\" style=\"font-size: 14px;\">Unknown</span></i>";

  $(customOptions).insertAfter("#robinDesktopNotifier");
  $(customOptions).append(header);
  $(customOptions).append(autoVoteGrow);
  $(customOptions).append(autoVoteStay);
  $(customOptions).append(filters);
  $(customOptions).append(filterVotesOption);
  $(customOptions).append(filterSpamOption);
  $(customOptions).append(filterNonAsciiOption);
  //$(customOptions).append(userCounter);
  //$(customOptions).append(voteGrow);
  //$(customOptions).append(voteStay);
  //$(customOptions).append(voteAbandon);
  //$(customOptions).append(voteAbstain);
  //$(customOptions).append(nextAction);
  //$(customOptions).append(timer);
}

function createCheckbox(name, description, checked, listener, counter) {
  var label = document.createElement("label");

  var checkbox = document.createElement("input");
  checkbox.name = name;
  checkbox.type = "checkbox";
  checkbox.onclick = listener;
  $(checkbox).prop("checked", checked);

  var description = document.createTextNode(description);

  label.appendChild(checkbox);
  label.appendChild(description);

  if (counter) {
    var counter = "&nbsp;Filtered: <span id=\"" + name + "-counter\">0</span>";
    $(label).append(counter);
  }

  return label;
}


function createRadio(name, id, description, selectedRadio, listener) {
  var label = document.createElement("label");

  var radio = document.createElement("input");
  radio.name = name;
  radio.id = id;
  radio.type = "radio";
  radio.onclick = listener;
  if (selectedRadio === id) {
    console.log("Radio button selected " + id);
    $(radio).prop("checked", true);
  }

  var description = document.createTextNode(description);

  label.appendChild(radio);
  label.appendChild(description);

  return label;
}
// Listeners

function disableVoteMsgsListener(event) {
  if (event !== undefined) {
    disableVoteMsgs = $(event.target).is(":checked");
  }
}

function autoVoteListener(event) {
  if (event !== undefined) {
    updateConfigVar("autoVote", $(event.target).attr("id"));
    vote();
  }
}

function filterSpamListener(event) {
  if (event !== undefined) {
    filterSpam = $(event.target).is(":checked");
  }
}

function filterNonAsciiListener(event) {
  if (event !== undefined) {
    filterNonAscii = $(event.target).is(":checked");
  }
}

function addMins(date, mins) {
  var newDateObj = new Date(date.getTime() + mins * 60000);
  return newDateObj;
}

function howLongLeft() { // mostly from /u/Yantrio
    var soonMessageArray = $(".robin-message--message:contains('soon')");
    if (soonMessageArray.length > 0) {
        // for cases where it says "soon" instead of a time on page load
        var timeLeft = "Soon";
        return "Soon";
    }

    var remainingMessageArray = $(".robin-message--message:contains('approx')");

    if (remainingMessageArray.length == 0) {
        //This shouldn't happen
        return "Unknown";
    }

    var message = remainingMessageArray.text();
    var time = new Date(jQuery(
        ".robin--user-class--system:contains('approx') .robin-message--timestamp"
    ).attr("datetime"));
    try {
        var endTime = addMins(time, message.match(/\d+/)[0]);
        var fraction = Math.floor((endTime - new Date()) / 60 / 1000 * 10) / 10;
        var min = Math.floor(fraction);
        var sec = Math.round((fraction - min) * 60);
        return min + " m " + sec + " s";
        var timeLeft = min + " m " + sec + " s";
    } catch (e) {
        return "Fail";
    }

    //grab the timestamp from the first post and then calc the difference using the estimate it gives you on boot
}

function updateCounter(id, value) {
  $("#" + id).text(value);
}




function openSettings() {
    $(".robin-chat--sidebar").hide();
    $("#settingContainer").show();
}
$("#openBtn").on("click", openSettings);

function closeSettings() {
    $(".robin-chat--sidebar").show();
    $("#settingContainer").hide();
}

function saveSetting(settings) {
    localStorage["robin-es-config"] = JSON.stringify(settings);
}

function loadSetting() {
    var setting = localStorage["robin-es-config"];
    if(setting) {
        setting = JSON.parse(setting);
    } else {
        setting = {};
    }
    return setting;
}

var settings = loadSetting();

function addBoolSetting(name, description, defaultSetting) {
    $("#settingContent").append('<div id="robinDesktopNotifier" class="robin-chat--sidebar-widget robin-chat--notification-widget"><label><input type="checkbox" name="setting-' + name + '">' + description + '</label></div>');
    $("input[name='setting-" + name + "']").prop("checked", defaultSetting)
        .on("click", function() {
        settings[name] = !settings[name];
        saveSetting(settings);
    });
    settings[name] = defaultSetting;
}

// Spam Filter
function checkSpam(user, message) {
    for (i = 0; i < userWhitelist.length; i++) {
        if (user === userWhitelist[i]) {
            return false;
        }
    }

    if (filterNonAscii){
        if (message.match(nonEnglishSpamRegex)){
            filteredNonAsciiCount += 1;
            updateCounter("filter-nonascii-counter", filteredNonAsciiCount);
            console.log("Blocked spam message (non-ASCII): " + message);
            return true;
        }
    }

    if (filterSpam){
        // Check for 6 or more repetitions of the same character
        if (message.search(/(.)\1{5,}/) != -1) {
            filteredSpamCount += 1;
            updateCounter("filter-spam-counter", filteredSpamCount);
            console.log("Blocked spam message (Repetition): " + message);
            return true;
        }

        for (i = 0; i < userBlacklist.length; i++) {
            if (user === userBlacklist[i]) {
                updateCounter("filter-spam-counter", filteredSpamCount);
                console.log("Blocked spam message (Blacklisted User): " + message);
                return true;
            }
        }

        for (o = 0; o < spamBlacklist.length; o++) {
            if (message.toLowerCase().search(spamBlacklist[o]) != -1) {
                filteredSpamCount += 1;
                updateCounter("filter-spam-counter", filteredSpamCount);
                console.log("Blocked spam message (Blacklist): " + message);
                return true;
            }
        }
    }
    return false;
}

// Generic updates
function update() {
  updateCounter("time-left", howLongLeft());
  // update vote counters
  updateCounter("vote-grow", votes.grow);
  updateCounter("vote-stay", votes.stay);
  updateCounter("vote-abandon", votes.abandon);
  updateCounter("vote-abstain", votes.abstain);

  userCount = votes.grow + votes.stay + votes.abandon + votes.abstain;
  updateCounter("user-count", userCount);

  updateCounter("next-action", "Next round we will " + votes.action);
}



// Triggered whenever someone votes
function updateVotes() {
  // Cancel if updated during last 5 seconds
  if (Date.now() - votesLastUpdated < 5000) {
    return false;
  }

  console.log("Updating vote tally...");
  jQuery.get("/robin/", function(a) {
    var start = "{" + a.substring(a.indexOf("\"robin_user_list\": ["));
    var end = start.substring(0, start.indexOf("}]") + 2) + "}";
    list = JSON.parse(end).robin_user_list;
    votes.grow = list.filter(function(voter) {
      return voter.vote === "INCREASE"
    }).length;
    votes.stay = list.filter(function(voter) {
      return voter.vote === "CONTINUE"
    }).length;
    votes.abandon = list.filter(function(voter) {
      return voter.vote === "ABANDON"
    }).length;
    votes.abstain = list.filter(function(voter) {
      return voter.vote === "NOVOTE"
    }).length;

    var majority = userCount / 2;
    if (votes.grow > majority) {
      votes.action = "Grow";
    } else if (votes.stay > majority) {
      votes.action = "Stay";
    } else if (votes.abandon > majority) {
      votes.action = "Abandon";
    } else if (votes.abstain > majority) {
      votes.action = "Abstain";
    } else {
      vote.action = "No majority";
    }
      $('#robinVoteWidget .robin--vote-class--increase .robin-chat--vote-label').html('grow<br>(' + votes.grow + ')');
      $('#robinVoteWidget .robin--vote-class--abandon .robin-chat--vote-label').html('abandon<br>(' + votes.abandon + ')');
      $('#robinVoteWidget .robin--vote-class--novote .robin-chat--vote-label').html('no vote<br>(' + votes.abstain + ')');
      $('#robinVoteWidget .robin--vote-class--continue .robin-chat--vote-label').html('stay<br>(' + votes.stay + ')');
      $(".usercount").html('' + userCount + ' users in chat');
      $(".timeleft").html('' + howLongLeft() + '');
      $(".nextround").html('Next round we will ' + votes.action + '');
      //<br><span style=\"font-size: 14px;\">Users here: <span id=\"user-count\">0</span></span>
      //<br><span style=\"font-size: 14px;\">Time Left: <span id=\"time-left\">0</span></span>
      
  });
    
  votesLastUpdated = Date.now();
  return true;
}

// Mutation observer for new messages
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        var added = mutation.addedNodes[0];

        // Filters all new messages
        if ($(added).hasClass("robin-message")) {
            var msg = added;
            var msgText = $(msg).find(".robin-message--message").text();
            var msgUser = $(msg).find(".robin-message--from").text();
            var systemMessage = false;

            if ($(msg).hasClass("robin--user-class--system")) {
                systemMessage = true;
            }

            // Highlight messages containing own user name
            var re = new RegExp(ownName, "i");
            if (msgText.match(re)) {
                $(msg).css({
                    background: 'rgba(255, 0, 0, 0.3)',
                    color: '#242424'
                });
            }

            // Filter vote messages
            if ($(msg).hasClass("robin--message-class--action") && msgText.startsWith(
                "voted to ")) {
                updateVotes();
                if (disableVoteMsgs) {
                    $(msg).remove();
                    console.log("Blocked spam message (Voting): " + message);
                    filteredVoteCount += 1;
                    updateCounter("filter-votes-counter", filteredVoteCount);
                }
                updateVotes();
            }

            // Filter spam
            if (!systemMessage && checkSpam(msgUser, msgText)) {
                $(msg).remove();
            }
        }
    });
});
observer.observe($("#robinChatMessageList").get(0), {
    childList: true
});

function vote() {
    if (autoVote === "grow") {
        $(".robin--vote-class--increase")[0].click();
        console.log("Voting grow!");
    } else {
        $(".robin--vote-class--continue")[0].click();
        console.log("Voting stay!");
    }
}

function deleteOldMessages() {
  var messageCount = $("#robinChatMessageList div").length;
  var removeMessageCount = messageCount - maxprune;

  if (removeMessageCount < 10) {
    console.log("Not enough messages to remove any (" + messageCount + ")");
    return;
  }

  // Remove all but most recent x messages, keep first four from robin
  $("robinChatMessageList div").slice(3, removeMessageCount + 3).remove();
  console.log("Removed " + removeMessageCount + " old messages.")
}



function setVote(vote) {
    return function() {
        autoVote = vote;
        saveSetting(settings);
    };
}

//function vote() {
//  if (setVote === "grow") {
//    $(".robin--vote-class--increase")[0].click();
//    console.log("Voting grow!");
//  } else {
//    $(".robin--vote-class--continue")[0].click();
//    console.log("Voting stay!");
//  }
//}



// Checks whether room name is not empty
function checkError() {
  if($(".robin-chat--room-name").text().length == 0) {
    // Something went wrong, hit reload after a 10 to 20 seconds!
    var timeout = Math.floor((Math.random() * 10 ) + 10);
    setTimeout(function() {
      window.location.reload();
    }, timeout);
  }
}




// Main run
console.log("Robin Enhancement Suite " + version + " enabled!");

rewriteCSS();
addOptions();
updateVotes();
update();

//Check for startup messages for timing
function fetchTimeIntervals() {
  var minArray = $(".robin-message--message:contains('approx')").text().match(
    "\\d+");
}

// Auto-grow
setTimeout(function() {
  if (autoVote) {
    $(".robin--vote-class--increase")[0].click();
    console.log("Voting grow!");
  }
}, 10000);

setInterval(function() {
    filterMessages();
    removeCaps();
}, 1);


setInterval(function() {
    $(".timeleft").html('' + howLongLeft() + '');
    update();
    updateVotes();
    $(".usercount").html('' + userCount + ' users in chat');
}, 10);

// Update every 3 seconds
//setInterval(function() {
//  update();
  // Update votes at least every 30 seconds
//  if (Date.now - votesLastUpdated > 30000) {
//    updateVotes();
//    filterMessages();
//    removeCaps();
//  }
//}, 3000);

// Try to join robin if not in a chat once a minute
setInterval(function() {
  if ($("#joinRobinContainer".length)) {
    $("#joinRobinContainer.click()");
    setTimeout(function() {
      jQuery("#joinRobin").click();
    }, 1000);
  }
}, 60000);
