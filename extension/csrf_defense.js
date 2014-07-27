// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// generate session token for Faycebook
if (document.URL.indexOf('faycebook') != -1) {
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
}
