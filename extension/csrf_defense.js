// ECE458 Final Project - University of Waterloo
// **************************************
// CSRF Protector
// **************************************
// Author           Roxanne Guo & Jessica Lam
// Last Modified    July 28, 2014


console.log('CSRF protect is on.');
// make sure server is live
chrome.runtime.sendMessage({func: "isAlive"}, function(response) {
  console.info("Connected to server: " + response.msg);
  console.info("Server status: " + response.flag);
});
var sessionToken;

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

  // send session token to server to store
  chrome.runtime.sendMessage({func: "setToken", value: token}, function(response) {
    console.log("Event: Sent " + token + " to server.");
  });

} else {

  chrome.runtime.sendMessage({func: "getToken"}, function(response) {
    console.log("Event: Received " + response.msg + " from server.");
    window.sessionToken = response.msg;
  });
  // js HACK to override form submissions
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
      // is form being submitted to Faycebook?
      var request_to_fb = (frm.action.indexOf("faycebook") != -1);

      if (request_to_fb) {
        var inputs = frm.getElementsByTagName("input");
        var has_sessionToken_input = false;
        for (var i = 0; i < inputs.length; i++) {
          if (inputs[i].name == "__sessionToken") {
            has_sessionToken_input = true;
            var token = inputs[i].value;
            var token_matches = (token == window.sessionToken);
          }
        }
      }
      if (request_to_fb && has_sessionToken_input) {
        console.log("Submitting form to Faycebook with session token: " + token);
        console.log("sessiontoken: " + window.sessionToken);
        if (token_matches) {
          console.log("Correct token. Successfully submitted form to Faycebook.");
          HTMLFormElement.prototype.real_submit.apply(frm);
        } else {
          console.log("Incorrect token. Failed to submitted form to Faycebook.");
          return false;
        }
      } else {
        console.log("Not submitting form to Faycebook.");
        HTMLFormElement.prototype.real_submit.apply(frm);
      }
    }
    // above code executed in a local scope
    // therefore, assign to global variable -> prefix `window`
    window.interceptor_setup = interceptor_setup;
    window.interceptor = interceptor;
  } + ')();';
  // use function to stringify injected code
  var script = document.createElement('script');
  script.textContent = intercept_setup_code;
  (document.head||document.documentElement).appendChild(script);

  // call injected js
  var intercept_code = 'interceptor_setup()'; // form submission override happens here
  document.documentElement.setAttribute('onreset', intercept_code);
  document.documentElement.dispatchEvent(new CustomEvent('reset'));
}
