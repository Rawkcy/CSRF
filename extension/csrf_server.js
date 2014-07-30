var token = "fake_token";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var sender_info = "";
  if (sender.tab) {
    var sender_info = sender.tab.url + " with ID " + sender.tab.id;
  } 

  // EVENTS
  if (request.func == "isAlive") {
    sendResponse({flag:0, msg:""});
  }
  if (request.func == "setToken") {
    console.log("set token was called");
    token = request.value;
    console.info("Received: " + token + " from " + sender_info);
    // update clients of new session token
    chrome.tabs.query({}, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        // do not send signal to self
        if (tabs[i].id != sender.tab.id) {
          chrome.tabs.sendMessage(tabs[i].id, {flag:0, func:"tokenUpdated"}, function(response) {
            console.log("Sent: Token updated signal sent to clients.");
          });
        } else {
          console.log('should have skipped one.');
        }
      }
    });
    sendResponse({flag:0, msg:token});
  }
  if (request.func == "getToken") {
    console.log("get token was called");
    if (token == "fake_token") {
      console.info("Error: No session token found.");
      sendResponse({flag:-1, msg:""});
    } else {
      console.info("Sent: " + token + " to " + sender_info);
      sendResponse({flag:0, msg:token});
    }
  }
  if (request.func == "attackDetected") {
    console.info("Received: Attack from " + sender_info + " was detected.");
    sendResponse({flag:2, msg:"Attacker with URL: " + sender.tab.url + " and ID: " + sender.tab.id});
  }
  if (request.func == "setSiteName") {
    console.info("set site name was changed to: " + request.msg);
    // update clients of new site name
    chrome.tabs.query({}, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, {flag:0, func:"siteNameUpdated", msg:request.msg}, function(response) {
          console.log("Sent: Site name updated signal sent to clients.");
        });
      }
    });
    sendResponse({flag:0, msg:""});
  }
});
