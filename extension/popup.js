var getSiteName = function() {
  document.siteProtectForm.addEventListener("submit", function(e) {
    e.stopPropagation();
    e.preventDefault();
    var protectForm = document.siteProtectForm;
    var site = protectForm.getElementsByTagName("input")[0].value.split(".")[1];

    chrome.extension.sendMessage({func:"setSiteName", msg:site}, function(reponse) {
      if(reponse.flag == 0) {
        console.log("Success.");
      }
    });
  }, true);
}

window.onload = function() {
  getSiteName();
}
