(function () {
  if (sessionStorage.getItem('oumi_auth') !== '1') {
    var here = location.href;
    var base = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    location.replace(base + 'login.html?next=' + encodeURIComponent(here));
  }
})();
