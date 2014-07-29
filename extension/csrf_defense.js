// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function interceptor_setup() {
  console.log("interceptor_setup is called before");
  // override submit handling
  HTMLFormElement.prototype.real_submit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = interceptor;

  // define our 'submit' handler on window, to avoid defining
  // on individual forms
  window.addEventListener('submit', function(e) {
    // stop the event before it gets to the element and causes onsubmit to
    // get called.
    e.stopPropagation();
    // stop the form from submitting
    e.preventDefault();

    interceptor(e);
  }, true);
  console.log("interceptor_setup is called after");
}
// interceptor: called in place of form.submit( )
// or as a result of submit handler on window (arg: event)
function interceptor(e) {
  console.log("interceptor is called before");
  var frm = e ? e.target : this;
  if (frm.action.indexOf('faycebook') != -1) {
    console.log('Attacking Faycebook la! Helllll naw.');
    return false;
  } else {
    console.log('Not attacking Faycebook, let pass.');
    HTMLFormElement.prototype.real_submit.apply(frm);
  }
  console.log("interceptor is called after");
}

if (document.URL.indexOf('faycebook') != -1) {
  // generate session token for Faycebook session
  console.log('CSRF Nawt is running!');
  var rand = function() { return Math.random().toString(36).substr(2); }; // remove `0.`
  var generate_token = function() { return rand() + rand(); }; // to make it longer
  console.log("Generating session token ...");
  var token = generate_token();
  console.log(token);

  var token_field = document.createElement("input");
  token_field.setAttribute("type", "hidden");
  token_field.setAttribute("name", "__sessionToken");
  token_field.setAttribute("value", token);
  var forms = document.getElementsByTagName("form");
  for (var i=0; i<forms.length; i++) {
    forms[i].appendChild(token_field);
  }

  console.log("Session token inserted.");
  var forms = document.getElementsByTagName("form");
  for (var i=0; i<forms.length; i++) {
    console.log(forms[i]);
  }
} else {
  console.log("This is not Faycebook.com");
  window.onload = function() {
    interceptor_setup();
    console.log("window.onload()");
  }
  interceptor_setup();
  console.log("end of else");
}
