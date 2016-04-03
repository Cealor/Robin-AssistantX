// ==UserScript==
// @name        Robin Enhancement Suite
// @description Growth in peace
// @namespace   com.github.Cealor
// @include     https://www.reddit.com/robin*
// @version     1.8
// @author      LeoVerto, Wiiplay123, Getnamo, K2L8M11N2, Cealor, vartan
// @updateURL   https://github.com/Cealor/Robin-Enhancement-Suite/raw/master/robin-es.user.js
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant   GM_getValue
// @grant   GM_setValue
// ==/UserScript==
var version = "1.8";
var autoVote = true;
var disableVoteMsgs = true;
var filterSpam = true;
var filterNonAscii = true;

$("#robinVoteWidget").append('<div class="addon"><div class="robin-chat--vote" style="font-weight: bold; padding: 5px;cursor: pointer;" id="openBtn">Open Settings</div></div>'); // Open Settings
$(".robin-chat--sidebar").before('<div class="robin-chat--sidebar" style="display:none;" id="settingContainer"><div class="robin-chat--sidebar-widget robin-chat--vote-widget" id="settingContent"></div></div>'); // Setting container

$("#robinVoteWidget").prepend("<div class='addon'><div class='nextround robin-chat--vote' style='font-weight:bold;pointer-events:none;'></div></div>");
$("#robinVoteWidget").prepend("<div class='addon'><div class='usercount robin-chat--vote' style='font-weight:bold;pointer-events:none;'></div></div>");
$("#robinVoteWidget").prepend("<div class='addon'><div class='timeleft robin-chat--vote' style='font-weight:bold;pointer-events:none;'></div></div>");

$('.robin-chat--buttons').prepend("<div class='robin-chat--vote robin--vote-class--novote'><span class='robin--icon'></span><div class='robin-chat--vote-label'></div></div>");
$('#robinVoteWidget .robin-chat--vote').css('padding', '5px');
$('.robin--vote-class--novote').css('pointer-events', 'none');




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
    localStorage["robinassistantx-settings"] = JSON.stringify(settings);
}

function loadSetting() {
    var setting = localStorage["robinassistantx-settings"];
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
addBoolSetting("filterChannel", "Filter by channel", false); 
addInputSetting("channel", "Channel filter", "");
//addBoolSetting("autoVote", "Automatically vote for grow", true);
//addBoolSetting("filterSpam", "Filter known spam", true);
//addBoolSetting("disableVoteMsgs", "Filter Vote messages", true);
//addBoolSetting("filterNonAscii", "Filter after blacklist", true);




// Options end
$("#settingContent").append('<div class="robin-chat--sidebar-widget robin-chat--report" style="text-align:center;"><a target="_blank" href="https://github.com/Cealor/Robin-Enhancement-Suite/raw/master/robin-es.user.js">Robin Enhancement Suite - Version ' + version + '</a></div>');


function filterMessages() {

    $(".robin--user-class--user").filter(function(num, message) {
        var text = $(message).find(".robin-message--message").text();

        if (settings["removeSpam"] && (text.indexOf("[") === 0 ||
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
var targetNodes = $("#robinChatMessageList");
var myObserver = new MutationObserver(mutationHandler);
// XXX Shou: we should only need to watch childList, more can slow it down.
var obsConfig = {
    childList: true
};
var mutedList = [];

$(".robin--username").click(function() {
    var clickedUser = mutedList.indexOf($(this).text());

    if (clickedUser == -1) {
        // Mute our user.
        mutedList.push($(this).text());
        $(this).css("text-decoration", "line-through");
    } else {
        // Unmute our user.
        $(this).css("text-decoration", "none");
        mutedList.splice(clickedUser, 1);
    }
});

//--- Add a target node to the observer. Can only add one node at a time.
targetNodes.each(function() {
    myObserver.observe(this, obsConfig);
});

function mutationHandler(mutationRecords) {
    mutationRecords.forEach(function(mutation) {
        findAndHideSpam();
        var jq = $(mutation.addedNodes);
        var $messageUser = $(jq[0] && jq[0].children && jq[0].children[1]);
        var $messageText = $(jq[0] && jq[0].children && jq[0].children[2]);
        console.log("Mutation.");
        // There are nodes added
        if (jq.length > 0) {
            // Mute user
            console.log("Have message");
            // cool we have a message.
            var thisUser = $messageUser.text();
            var message = $messageText.text();
            console.log(thisUser);
            // Check if the user is muted.
            if (mutedList.indexOf(thisUser) >= 0 || isBotSpam(message)) {
                // He is, hide the message.
                $(jq[0]).remove();
            } else {
                // He isn't register an EH to mute the user on name-click.
                $messageUser.click(function() {
                    // Check the user actually wants to mute this person.
                    if (confirm('You are about to mute ' + $(this).text() + ". Press OK to confirm.")) {
                        // Mute our user.
                        mutedList.push($(this).text());
                        $(this).css("text-decoration", "line-through");
                        $(this).hide();
                    }

                    // Output currently muted people in the console for debuggery.
                    // console.log(mutedList);
                });

            }

            // He isn't register an EH to mute the user on name-click.
            $(jq[0].children[1]).click(function() {
                // Check the user actually wants to mute this person.
                if (confirm('You are about to mute ' + $(this).text() + ". Press OK to confirm.")) {
                    // Mute our user.
                    mutedList.push($(this).text());
                    $(this).css("text-decoration", "line-through");
                    $(this).remove();
                }

                // Output currently muted people in the console for debuggery.
                // console.log(mutedList);
            });

            filterMessages();
        }
    });
}









// Notifications
var notif = new Audio("https://slack.global.ssl.fastly.net/dfc0/sounds/push/knock_brush.mp3");

var currentUsersName = $('div#header span.user a').html();

$('#robinChatMessageList').on('DOMNodeInserted', function (e) {
    if ($(e.target).is('.robin--message-class--message.robin--user-class--user')) {
        console.log("got new message");
        if ($(".robin--message-class--message.robin--user-class--user").last().is(':contains("'+currentUsersName+'")')) {
            $(".robin--message-class--message.robin--user-class--user").last().css("background","orangered").css("color","white");
            notif.play();
            console.log("got new mention");
        }
    }
});

















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
var userCount = 0;

var votes = {
  grow: 0,
  stay: 0,
  abandon: 0,
  abstain: 0,
  action: 'Unknown'
}

var votesLastUpdated = 0;

var startTime = new Date();

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



// Custom options
function addOptions() {
  // Remove possible existing custom options
  $("#customOptions").remove();

  var customOptions = document.createElement("div");
  customOptions.id = "customOptions";
  customOptions.className =
    "robin-chat--sidebar-widget robin-chat--notification-widget";

  var header = "<b style=\"font-size: 14px;\">Settings</b>"

  var autoVoteOption = createCheckbox("auto-vote",
    "Automatically vote Grow", autoVote, autoVoteListener, false);

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
  $(customOptions).append(autoVoteOption);
  $(customOptions).append(filters);
  $(customOptions).append(filterVotesOption);
  $(customOptions).append(filterSpamOption);
  $(customOptions).append(filterNonAsciiOption);
  $(customOptions).append(userCounter);
  $(customOptions).append(voteGrow);
  $(customOptions).append(voteStay);
  $(customOptions).append(voteAbandon);
  $(customOptions).append(voteAbstain);
  $(customOptions).append(nextAction);
  $(customOptions).append(timer);
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

// Listeners
function disableVoteMsgsListener(event) {
  if (event !== undefined) {
    disableVoteMsgs = $(event.target).is(":checked");
  }
}

function autoVoteListener(event) {
  if (event !== undefined) {
    autoVote = $(event.target).is(":checked");
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
    localStorage["robinassistantx-settings"] = JSON.stringify(settings);
}

function loadSetting() {
    var setting = localStorage["robinassistantx-settings"];
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
function checkSpam(message) {
  // Check for 6 or more repetitions of the same character
  if (message.search(/(.)\1{5,}/) != -1) {
    filteredSpamCount += 1;
    updateCounter("filter-spam-counter", filteredSpamCount);
    console.log("Blocked spam message (Repetition): " + message);
    return true;
  }

  if(filterNonAscii){
    if(message.match(nonEnglishSpamRegex)){
      filteredNonAsciiCount += 1;
      updateCounter("filter-nonascii-counter", filteredNonAsciiCount);
      console.log("Blocked spam message (non-ASCII): " + message);
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
      //console.log(msgText)

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
      if (filterSpam) {
        if (checkSpam(msgText)) {
          $(msg).remove();
          filterMessages();
        }
      }
    }
  });
});
observer.observe($("#robinChatMessageList").get(0), {
  childList: true
});

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
}, 1);

// Update every 3 seconds
setInterval(function() {
  update();
  // Update votes at least every 30 seconds
  if (Date.now - votesLastUpdated > 30000) {
    updateVotes();
    filterMessages();
  }
}, 3000);

// Try to join robin if not in a chat once a minute
setInterval(function() {
  if ($("#joinRobinContainer".length)) {
    $("#joinRobinContainer.click()");
    setTimeout(function() {
      jQuery("#joinRobin").click();
    }, 1000);
  }
}, 60000);