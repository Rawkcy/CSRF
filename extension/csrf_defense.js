// ECE458 Final Project - University of Waterloo
// **************************************
// CSRF Protector
// **************************************
// Author           Roxanne Guo & Jessica Lam
// Last Modified    July 28, 2014


console.log('CSRF protect is on.');

if (document.URL.indexOf('faycebook') != -1) {

  // generate session token for Faycebook.com
  var rand = function() { return Math.random().toString(36).substr(2); }; // remove `0.`
  var generate_token = function() { return rand() + rand(); }; // to make it longer
  var token = generate_token();

  // update form field with session token
  var token_field = document.createElement("input");
  token_field.setAttribute("type", "hidden");
  token_field.setAttribute("name", "__sessionToken");
  token_field.setAttribute("value", token);
  var forms = document.getElementsByTagName("form");
  for (var i=0; i<forms.length; i++) {
    forms[i].appendChild(token_field);
  }

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

} else {

  // js injection to override form submissions
  var intercept_setup_code = '(' + function() {
    var sessionToken;
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
      // is form being submitted to Faycebook?
      var request_to_fb = (frm.action.indexOf("faycebook") != -1);

      if (request_to_fb) {
        var inputs = frm.getElementsByTagName("input");
        var has_sessionToken_input = false;
        for (var i = 0; i < inputs.length; i++) {
          if (inputs[i].name == "__sessionToken") {
            has_sessionToken_input = true;
            var token = inputs[i].value;
            var token_matches = (token == sessionToken);
          }
        }
      }
      if (request_to_fb && has_sessionToken_input) {
        console.log("Submitting form to Faycebook with session token: " + token);
        if (token_matches) {
          console.log("Session token is correct. Successfully submitted form to Faycebook.");
          HTMLFormElement.prototype.real_submit.apply(frm);
        } else {
          console.log("Session token is incorrect. Failed to submitted form to Faycebook.");
          // tell server someone tried to attack Faycebook
          //chrome.runtime.sendMessage({func: "failedAttack"}, function(response) {
          //  //var error_message = "Attack detected from " + response.msg;
          //  console.log(response);
          //  //alert(error_message);
          //  console.log("Event: Sent failed attack signal to server.");
          //});
          return false;
        }
      } else {
        console.log("Not submitting form to Faycebook.");
        HTMLFormElement.prototype.real_submit.apply(frm);
      }
    }
    var getSessionToken = function(token) { sessionToken = token; }
    // above code executed in a local scope
    // therefore, assign to global variable -> prefix `window`
    window.interceptor_setup = interceptor_setup;
    window.interceptor = interceptor;
    window.getSessionToken = getSessionToken;
  } + ')();';
  // use function to stringify injected code
  var script = document.createElement('script');
  script.textContent = intercept_setup_code;
  (document.head||document.documentElement).appendChild(script);

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
          // form submission override and set session token
          var intercept_code = 'interceptor_setup();getSessionToken("' + sessionToken + '");';
          document.documentElement.setAttribute('onreset', intercept_code);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
        } else {
          console.log("Event: Unable to retrieve token from server. There is likely no Faycebook session open.");
        }
      });
    } else {
      console.log("Failed to connect to server.");
    }
  });
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.msg == "tokenUpdated") {
      console.log("Event: Token was updated on server. Retrieving new session token ...");
      chrome.runtime.sendMessage({func: "getToken"}, function(response) {
        if (response.flag == 0) {
          // got valid token
          var sessionToken = response.msg;
          console.log("Event: Received " + sessionToken + " from server.");
          // call injected js
          // form submission override and set session token
          var intercept_code = 'getSessionToken("' + sessionToken + '");';
          document.documentElement.setAttribute('onreset', intercept_code);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
        } else {
          console.log("Event: Unable to retrieve token from server. There is likely no Faycebook session open.");
        }
      });
      sendResponse({flag:0, msg:""});
    }
  });
}
