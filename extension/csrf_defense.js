// ECE458 Final Project - University of Waterloo
// **************************************
// CSRF Protector
// **************************************
// Author           Roxanne Guo & Jessica Lam
// Last Modified    July 28, 2014


console.log('CSRF protect is on.');

var getSiteNameFunc = function() {
  return "getSiteName()";
}
var getSiteName = function() {
  var siteName = document.getElementById('__siteName');
  if (siteName) {
    return siteName.value;
  } else {
    return "faycebook";
  }
}
var setSiteName = function(siteName) {
  // generate DOM elem to hold site name value
  var siteNameElem = document.createElement("input");
  siteNameElem.setAttribute("id", "__siteName");
  siteNameElem.setAttribute("value", siteName);
  document.getElementsByTagName('body')[0].appendChild(siteNameElem);
  document.getElementById('__siteName').setAttribute('type', 'hidden');
}
window.onload = function() {
  setSiteName("faycebook"); // default ot Faycebook.com
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.func == "siteNameUpdated") {
    var siteName = request.msg;
    console.log("site name updated to: " + siteName);
    document.getElementById('__siteName').value = siteName;
    if (document.URL.indexOf(siteName) == -1) {
      console.log("Site protection switch detected! This site no longer under protection.");
    } else {
      console.log("Site protection switch detected! This site (www." + siteName + ".com) is now under protection.");
    }
  }
});

if (document.URL.indexOf(getSiteName()) != -1) {

  console.log("This site is under protection!");
  // generate session token for Faycebook.com
  var rand = function() { return Math.random().toString(36).substr(2); }; // remove `0.`
  var generate_token = function() { return rand() + rand(); }; // to make it longer
  var token = generate_token();

  // update form field with session token
  var token_field = document.createElement("input");
  token_field.setAttribute("id", "__sessionToken");
  token_field.setAttribute("value", token);
  document.getElementsByTagName('html')[0].appendChild(token_field);
  document.getElementById('__sessionToken').setAttribute('type', 'hidden');

  // check server status
  chrome.runtime.sendMessage({func: "isAlive"}, function(response) {
    console.log("Connecting to server ...");

    if (response.flag == 0) {
      // server is up and running
      console.log("Successfully connected to server.");
      // send session token to server to store
      chrome.runtime.sendMessage({func: "setToken", value: token}, function(response) {
        console.log("Event: Sent " + token + " to server.");
      });
    } else {
      console.log("Failed to connect to server.");
    }
  });
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.flag == 2) {
      console.log("Event: got attacked.");
      console.log(request.msg);
      sendResponse({flag:0, msg:""});
    }
  });

} else {

  // js injection to override form submissions
  var intercept_setup_code = '(' + function() {
    var interceptor_setup = function() {
      HTMLFormElement.prototype.real_submit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = interceptor;
      window.addEventListener("submit", function(e) {
        e.stopPropagation();
        e.preventDefault();
        interceptor(e);
      }, true);
    }
    var interceptor = function(e) {
      var frm = e ? e.target : this;
      var siteName = getSiteName();
      // is form being submitted to Faycebook?
      var request_to_protected_site = (frm.action.indexOf(siteName) != -1);

      if (request_to_protected_site) {
        var inputs = frm.getElementsByTagName("input");
        var has_sessionToken_input = false;
        for (var i = 0; i < inputs.length; i++) {
          if (inputs[i].name == "__sessionToken") {
            has_sessionToken_input = true;
            var token = inputs[i].value;
            var token_matches = (token == getCurrSessionToken());
          }
        }
      }
      // validation output
      if (request_to_protected_site && has_sessionToken_input) {
        console.log("Submitting form to " + siteName + " with session token: " + token);
        if (token_matches) {
          console.log("Session token is correct. Form submission successful.");
          //HTMLFormElement.prototype.real_submit.apply(frm);
        } else {
          console.log("Session token is incorrect. Form submission rejected.");
          alert("Are you trying to CSRF attack on " + siteName + "? Shtop.");
          return false;
        }
      } else {
        console.log("Successfully submitted form since destination site is not protected.");
      }
    }
    var getCurrSessionToken = function() { 
      // retrieve session token from a DOM elem
      var sessionTokenElem = document.getElementById('__sessionToken');
      var sessionToken = "";
      if (sessionTokenElem) {
        sessionToken = sessionTokenElem.value;
        console.info("Current session token value is " + sessionToken);
      } else {
        console.info("No session token found.");
      } return sessionToken;
    }
    var setCurrSessionToken = function(token) { 
      var sessionTokenElem = document.getElementById('__sessionToken');
      if (sessionTokenElem) {
        sessionTokenElem.value = token;
      } else {
        // store session token in the DOM
        var sessionTokenElem = document.createElement("input");
        sessionTokenElem.id = "__sessionToken";
        sessionTokenElem.value = token;
        document.getElementsByTagName('body')[0].appendChild(sessionTokenElem);
        document.getElementById('__sessionToken').setAttribute('type', 'hidden');
      }
    }
    var getSiteName = function() {
      var siteName = document.getElementById('__siteName');
      if (siteName) {
        return siteName.value;
      } else {
        return "faycebook";
      }
    }
    // above code executed in a local scope
    // therefore, assign to global variable -> prefix `window`
    window.interceptor_setup = interceptor_setup;
    window.interceptor = interceptor;
    window.setCurrSessionToken = setCurrSessionToken;
    window.getCurrSessionToken = getCurrSessionToken;
    window.getSiteName = getSiteName;
  } + ')();';
  // use function to stringify injected code
  var script = document.createElement('script');
  script.textContent = intercept_setup_code;
  (document.head||document.documentElement).appendChild(script);
  // call injected js
  // form submission override 
  var intercept_code = 'interceptor_setup();';
  document.documentElement.setAttribute('onreset', intercept_code);
  document.documentElement.dispatchEvent(new CustomEvent('reset'));

  // server status check
  chrome.runtime.sendMessage({func: "isAlive"}, function(response) {
    console.log("Connecting to server ...");

    if (response.flag == 0) {
      // server is up and running
      console.log("Successfully connected to server.");
      chrome.runtime.sendMessage({func: "getToken"}, function(response) {
        if (response.flag == 0) {
          // got valid token
          var sessionToken = response.msg;
          console.log("Event: Received " + sessionToken + " from server.");
          // call injected js
          // set session token
          var intercept_code = 'setCurrSessionToken("' + sessionToken + '");';
          document.documentElement.setAttribute('onreset', intercept_code);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
        } else {
          console.log("Event: Unable to retrieve token from server. There is likely no session open.");
        }
      });
    } else {
      console.log("Failed to connect to server.");
    }
  });
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.func == "tokenUpdated") {
      console.log("Event: Token was updated on server. Retrieving new session token ...");
      chrome.runtime.sendMessage({func: "getToken"}, function(response) {
        if (response.flag == 0) {
          // got valid token
          var sessionToken = response.msg;
          console.log("Event: Received " + sessionToken + " from server.");
          // call injected js
          // form submission override and set session token
          var intercept_code = 'setCurrSessionToken("' + sessionToken + '");';
          document.documentElement.setAttribute('onreset', intercept_code);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
        } else {
          console.log("Event: Unable to retrieve token from server. There is likely no session open.");
        }
      });
      sendResponse({flag:0, msg:""});
    }
  });
}
