var token;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var sender_info = sender.tab.url + " with ID " + sender.tab.id;
    //console.log(sender.tab ?
    //            "from a content script:" + sender.tab.url :
    //            "from the extension");
    if (request.func == "isAlive") {
      console.info("Server is alive.");
      sendResponse({flag:0, msg:self});
    }
    if (request.func == "setToken") {
      token = request.value;
      console.info("Received: " + token + " from " + sender_info);
      sendResponse({flag:0, msg:token});
    }
    if (request.func == "getToken") {
      if (token) {
        console.info("Sent: " + token + " to " + sender_info);
        sendResponse({flag:0, msg:token});
      } else {
        console.info("Error: No session token found.");
        sendResponse({flag:-1, msg:""});
      }
    }
  });
