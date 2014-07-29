// ECE458 Final Project - University of Waterloo
// **************************************
// CSRF Protector
// **************************************
// Author           Roxanne Guo & Jessica Lam
// Last Modified    July 28, 2014


if (document.URL.indexOf('faycebook') != -1) {
  // generate session token for Faycebook session
  console.log('CSRF Nawt gotchu protected!');
  var rand = function() { return Math.random().toString(36).substr(2); }; // remove `0.`
  var generate_token = function() { return rand() + rand(); }; // to make it longer
  console.log("Generating session token ...");
  var token = generate_token();

  var token_field = document.createElement("input");
  token_field.setAttribute("type", "hidden");
  token_field.setAttribute("name", "__sessionToken");
  token_field.setAttribute("value", token);
  var forms = document.getElementsByTagName("form");
  for (var i=0; i<forms.length; i++) {
    forms[i].appendChild(token_field);
  }
  console.log("Session token " + token + " was inserted.");
} else {
  console.log("This is not Faycebook.com");
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
      var is_legit_form = false;
      var inputs = frm.getElementsByTagName("input");
      console.log(frm);
      console.log(inputs);
      if (frm.action.indexOf("faycebook") != -1) {
        console.log("Attacking Faycebook la! Helllll naw.");
        return false;
      } else {
        console.log("Not attacking Faycebook, let pass.");
        HTMLFormElement.prototype.real_submit.apply(frm);
      }
    }
    // All code is executed in a local scope.
    // Therefore, overwrite a global variable, prefix `window`:
    window.interceptor_setup = interceptor_setup;
    window.interceptor = interceptor;
  } + ')();';
  // inject js
  // use function to stringify injected code
  var script = document.createElement('script');
  script.textContent = intercept_setup_code;
  (document.head||document.documentElement).appendChild(script);

  // call injected js
  var intercept_code = 'interceptor_setup()';
  document.documentElement.setAttribute('onreset', intercept_code);
  document.documentElement.dispatchEvent(new CustomEvent('reset'));

  $(document).ready(function() {
  });
  //chrome.tabs.query(null, function(tabs){
  //  for (var i = 0; i < tabs.length; i++) {
  //    console.log(tabs[i]);
//      chrome.tabs.sendRequest(tabs[i].id, { action: "xxx" });
    //}
  //});
}
