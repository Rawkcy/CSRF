var token;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var sender_info = sender.tab.url + " with ID " + sender.tab.id;
    //console.log(sender.tab ?
    //            "from a content script:" + sender.tab.url :
    //            "from the extension");
    if (request.func == "setToken") {
      token = request.value;
      console.info("Received: " + token + " from " + sender_info);
      sendResponse({flag:0, msg:token});
    }
    if (request.func == "getToken") {
      console.info("Sent: " + token + " to " + sender_info);
      sendResponse({flag:1, msg:token});
    }
  });
