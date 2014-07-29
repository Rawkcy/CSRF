//chrome.tabs.query(null, function(tabs){
//  for (var i = 0; i < tabs.length; i++) {
//    console.log(tabs[i].id);
//    //chrome.tabs.sendRequest(tabs[i].id, { action: "xxx" });
//  } 
//});

var token;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.func == "setToken") {
      token = request.value;
      sendResponse({msg: "Token " + token + " is received."});
    }
  });
