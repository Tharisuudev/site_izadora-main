var qsProxy = {};
function FrameBuilder(
  formId,
  appendTo,
  initialHeight,
  iframeCode,
  title,
  embedStyleJSON
) {
  this.formId = formId;
  this.initialHeight = initialHeight;
  this.iframeCode = iframeCode;
  this.frame = null;
  this.timeInterval = 200;
  this.appendTo = appendTo || false;
  this.formSubmitted = 0;
  this.frameMinWidth = "100%";
  this.defaultHeight = "";
  this.init = function () {
    this.embedURLHash = this.getMD5(window.location.href);
    if (
      embedStyleJSON &&
      embedStyleJSON[this.embedURLHash] &&
      embedStyleJSON[this.embedURLHash]["inlineStyle"]["embedWidth"]
    ) {
      this.frameMinWidth =
        embedStyleJSON[this.embedURLHash]["inlineStyle"]["embedWidth"] + "px";
    }
    if (embedStyleJSON && embedStyleJSON[this.embedURLHash]) {
      if (
        embedStyleJSON[this.embedURLHash]["inlineStyle"] &&
        embedStyleJSON[this.embedURLHash]["inlineStyle"]["embedHeight"]
      ) {
        this.defaultHeight =
          'data-frameHeight="' +
          embedStyleJSON[this.embedURLHash]["inlineStyle"]["embedHeight"] +
          '"';
      }
    }
    this.createFrame();
    this.addFrameContent(this.iframeCode);
  };
  this.createFrame = function () {
    var tmp_is_ie = !!window.ActiveXObject;
    this.iframeDomId = document.getElementById(this.formId)
      ? this.formId + "_" + new Date().getTime()
      : this.formId;
    var htmlCode =
      "<" +
      'iframe title="' +
      title.replace(/[\\"']/g, "\\$&").replace(/&amp;/g, "&") +
      '" src="" allowtransparency="true" allow="geolocation; microphone; camera" allowfullscreen="true" name="' +
      this.formId +
      '" id="' +
      this.iframeDomId +
      '" style="width: 10px; min-width:' +
      this.frameMinWidth +
      "; display: block; overflow: hidden; height:" +
      this.initialHeight +
      'px; border: none;" scrolling="no"' +
      this.defaultHeight +
      "></if" +
      "rame>";
    if (this.appendTo === false) {
      document.write(htmlCode);
    } else {
      var tmp = document.createElement("div");
      tmp.innerHTML = htmlCode;
      var a = this.appendTo;
      document.getElementById(a).appendChild(tmp.firstChild);
    }
    this.frame = document.getElementById(this.iframeDomId);
    if (tmp_is_ie === true) {
      try {
        var iframe = this.frame;
        var doc = iframe.contentDocument
          ? iframe.contentDocument
          : iframe.contentWindow.document || iframe.document;
        doc.open();
        doc.write("");
      } catch (err) {
        this.frame.src =
          "javascript:void((function(){document.open();document.domain='" +
          this.getBaseDomain() +
          "';document.close();})())";
      }
    }
    this.addEvent(this.frame, "load", this.bindMethod(this.setTimer, this));
    var self = this;
    if (window.chrome !== undefined) {
      this.frame.onload = function () {
        try {
          var doc = this.contentWindow.document;
          var _jotform = this.contentWindow.JotForm;
          if (doc !== undefined) {
            var form = doc.getElementById("" + self.iframeDomId);
            self.addEvent(form, "submit", function () {
              if (_jotform.validateAll()) {
                self.formSubmitted = 1;
              }
            });
          }
        } catch (e) {}
      };
    }
  };
  this.addEvent = function (obj, type, fn) {
    if (obj.attachEvent) {
      obj["e" + type + fn] = fn;
      obj[type + fn] = function () {
        obj["e" + type + fn](window.event);
      };
      obj.attachEvent("on" + type, obj[type + fn]);
    } else {
      obj.addEventListener(type, fn, false);
    }
  };
  this.addFrameContent = function (string) {
    if (
      window.location.search &&
      window.location.search.indexOf("disableSmartEmbed") > -1
    ) {
      string = string.replace(new RegExp("smartEmbed=1(?:&amp;|&)"), "");
      string = string.replace(new RegExp("isSmartEmbed"), "");
    } else {
      var cssLink = "stylebuilder/" + this.formId + ".css";
      var cssPlace = string.indexOf(cssLink);
      var prepend = string[cssPlace + cssLink.length] === "?" ? "&amp;" : "?";
      var embedUrl = prepend + "embedUrl=" + window.location.href;
      if (cssPlace > -1) {
        var positionLastRequestElement = string.indexOf('"/>', cssPlace);
        if (positionLastRequestElement > -1) {
          string =
            string.substr(0, positionLastRequestElement) +
            embedUrl +
            string.substr(positionLastRequestElement);
          string = string.replace(
            cssLink,
            "stylebuilder/" + this.formId + "/" + this.embedURLHash + ".css"
          );
        }
      }
    }
    string = string.replace(
      new RegExp('src\\=\\"[^"]*captcha.php"></scr' + "ipt>", "gim"),
      'src="http://api.recaptcha.net/js/recaptcha_ajax.js"></scr' +
        "ipt><" +
        'div id="recaptcha_div"><' +
        "/div>" +
        "<" +
        "style>#recaptcha_logo{ display:none;} #recaptcha_tagline{display:none;} #recaptcha_table{border:none !important;} .recaptchatable .recaptcha_image_cell, #recaptcha_table{ background-color:transparent !important; } <" +
        "/style>" +
        "<" +
        'script defer="defer"> window.onload = function(){ Recaptcha.create("6Ld9UAgAAAAAAMon8zjt30tEZiGQZ4IIuWXLt1ky", "recaptcha_div", {theme: "clean",tabindex: 0,callback: function (){' +
        'if (document.getElementById("uword")) { document.getElementById("uword").parentNode.removeChild(document.getElementById("uword")); } if (window["validate"] !== undefined) { if (document.getElementById("recaptcha_response_field")){ document.getElementById("recaptcha_response_field").onblur = function(){ validate(document.getElementById("recaptcha_response_field"), "Required"); } } } if (document.getElementById("recaptcha_response_field")){ document.getElementsByName("recaptcha_challenge_field")[0].setAttribute("name", "anum"); } if (document.getElementById("recaptcha_response_field")){ document.getElementsByName("recaptcha_response_field")[0].setAttribute("name", "qCap"); }}})' +
        " }<" +
        "/script>"
    );
    string = string.replace(
      /(type="text\/javascript">)\s+(validate\(\"[^"]*"\);)/,
      '$1 jTime = setInterval(function(){if("validate" in window){$2clearTimeout(jTime);}}, 1000);'
    );
    if (string.match("#sublabel_litemode")) {
      string = string.replace(
        'class="form-all"',
        'class="form-all" style="margin-top:0;"'
      );
    }
    var iframe = this.frame;
    var doc = iframe.contentDocument
      ? iframe.contentDocument
      : iframe.contentWindow.document || iframe.document;
    doc.open();
    doc.write(string);
    setTimeout(function () {
      doc.close();
      try {
        if ("JotFormFrameLoaded" in window) {
          JotFormFrameLoaded();
        }
      } catch (e) {}
    }, 200);
  };
  this.setTimer = function () {
    var self = this;
    this.interval = setTimeout(this.changeHeight.bind(this), this.timeInterval);
  };
  this.getBaseDomain = function () {
    var thn = window.location.hostname;
    var cc = 0;
    var buff = "";
    for (var i = 0; i < thn.length; i++) {
      var chr = thn.charAt(i);
      if (chr == ".") {
        cc++;
      }
      if (cc == 0) {
        buff += chr;
      }
    }
    if (cc == 2) {
      thn = thn.replace(buff + ".", "");
    }
    return thn;
  };
  this.changeHeight = function () {
    var actualHeight = this.getBodyHeight();
    var currentHeight = this.getViewPortHeight();
    if (actualHeight === undefined) {
      this.frame.style.height = this.frameHeight;
      if (!this.frame.style.minHeight) {
        this.frame.style.minHeight = "300px";
        window.parent.scrollTo(0, 0);
      }
    } else if (Math.abs(actualHeight - currentHeight) > 18) {
      this.frame.style.height = actualHeight + "px";
    }
    this.setTimer();
  };
  this.bindMethod = function (method, scope) {
    return function () {
      method.apply(scope, arguments);
    };
  };
  this.frameHeight = 0;
  this.getBodyHeight = function () {
    if (this.formSubmitted === 1) {
      return;
    }
    var height;
    var scrollHeight;
    var offsetHeight;
    try {
      if (this.frame.contentWindow.document.height) {
        height = this.frame.contentWindow.document.height;
        if (this.frame.contentWindow.document.body.scrollHeight) {
          height = scrollHeight =
            this.frame.contentWindow.document.body.scrollHeight;
        }
        if (this.frame.contentWindow.document.body.offsetHeight) {
          height = offsetHeight =
            this.frame.contentWindow.document.body.offsetHeight;
        }
      } else if (this.frame.contentWindow.document.body) {
        if (this.frame.contentWindow.document.body.offsetHeight) {
          height = offsetHeight =
            this.frame.contentWindow.document.body.offsetHeight;
        }
        var formWrapper =
          this.frame.contentWindow.document.querySelector(".form-all");
        var margin = parseInt(getComputedStyle(formWrapper).marginTop, 10);
        if (!isNaN(margin)) {
          height += margin;
        }
      }
    } catch (e) {}
    this.frameHeight = height;
    return height;
  };
  this.getViewPortHeight = function () {
    if (this.formSubmitted === 1) {
      return;
    }
    var height = 0;
    try {
      if (this.frame.contentWindow.window.innerHeight) {
        height = this.frame.contentWindow.window.innerHeight - 18;
      } else if (
        this.frame.contentWindow.document.documentElement &&
        this.frame.contentWindow.document.documentElement.clientHeight
      ) {
        height = this.frame.contentWindow.document.documentElement.clientHeight;
      } else if (
        this.frame.contentWindow.document.body &&
        this.frame.contentWindow.document.body.clientHeight
      ) {
        height = this.frame.contentWindow.document.body.clientHeight;
      }
    } catch (e) {}
    return height;
  };
  this.getMD5 = function (s) {
    function L(k, d) {
      return (k << d) | (k >>> (32 - d));
    }
    function K(G, k) {
      var I, d, F, H, x;
      F = G & 2147483648;
      H = k & 2147483648;
      I = G & 1073741824;
      d = k & 1073741824;
      x = (G & 1073741823) + (k & 1073741823);
      if (I & d) {
        return x ^ 2147483648 ^ F ^ H;
      }
      if (I | d) {
        if (x & 1073741824) {
          return x ^ 3221225472 ^ F ^ H;
        } else {
          return x ^ 1073741824 ^ F ^ H;
        }
      } else {
        return x ^ F ^ H;
      }
    }
    function r(d, F, k) {
      return (d & F) | (~d & k);
    }
    function q(d, F, k) {
      return (d & k) | (F & ~k);
    }
    function p(d, F, k) {
      return d ^ F ^ k;
    }
    function n(d, F, k) {
      return F ^ (d | ~k);
    }
    function u(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(r(F, aa, Z), k), I));
      return K(L(G, H), F);
    }
    function f(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(q(F, aa, Z), k), I));
      return K(L(G, H), F);
    }
    function D(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(p(F, aa, Z), k), I));
      return K(L(G, H), F);
    }
    function t(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(n(F, aa, Z), k), I));
      return K(L(G, H), F);
    }
    function e(G) {
      var Z;
      var F = G.length;
      var x = F + 8;
      var k = (x - (x % 64)) / 64;
      var I = (k + 1) * 16;
      var aa = Array(I - 1);
      var d = 0;
      var H = 0;
      while (H < F) {
        Z = (H - (H % 4)) / 4;
        d = (H % 4) * 8;
        aa[Z] = aa[Z] | (G.charCodeAt(H) << d);
        H++;
      }
      Z = (H - (H % 4)) / 4;
      d = (H % 4) * 8;
      aa[Z] = aa[Z] | (128 << d);
      aa[I - 2] = F << 3;
      aa[I - 1] = F >>> 29;
      return aa;
    }
    function B(x) {
      var k = "",
        F = "",
        G,
        d;
      for (d = 0; d <= 3; d++) {
        G = (x >>> (d * 8)) & 255;
        F = "0" + G.toString(16);
        k = k + F.substr(F.length - 2, 2);
      }
      return k;
    }
    function J(k) {
      k = k.replace(/rn/g, "n");
      var d = "";
      for (var F = 0; F < k.length; F++) {
        var x = k.charCodeAt(F);
        if (x < 128) {
          d += String.fromCharCode(x);
        } else {
          if (x > 127 && x < 2048) {
            d += String.fromCharCode((x >> 6) | 192);
            d += String.fromCharCode((x & 63) | 128);
          } else {
            d += String.fromCharCode((x >> 12) | 224);
            d += String.fromCharCode(((x >> 6) & 63) | 128);
            d += String.fromCharCode((x & 63) | 128);
          }
        }
      }
      return d;
    }
    var C = Array();
    var P, h, E, v, g, Y, X, W, V;
    var S = 7,
      Q = 12,
      N = 17,
      M = 22;
    var A = 5,
      z = 9,
      y = 14,
      w = 20;
    var o = 4,
      m = 11,
      l = 16,
      j = 23;
    var U = 6,
      T = 10,
      R = 15,
      O = 21;
    s = J(s);
    C = e(s);
    Y = 1732584193;
    X = 4023233417;
    W = 2562383102;
    V = 271733878;
    for (P = 0; P < C.length; P += 16) {
      h = Y;
      E = X;
      v = W;
      g = V;
      Y = u(Y, X, W, V, C[P + 0], S, 3614090360);
      V = u(V, Y, X, W, C[P + 1], Q, 3905402710);
      W = u(W, V, Y, X, C[P + 2], N, 606105819);
      X = u(X, W, V, Y, C[P + 3], M, 3250441966);
      Y = u(Y, X, W, V, C[P + 4], S, 4118548399);
      V = u(V, Y, X, W, C[P + 5], Q, 1200080426);
      W = u(W, V, Y, X, C[P + 6], N, 2821735955);
      X = u(X, W, V, Y, C[P + 7], M, 4249261313);
      Y = u(Y, X, W, V, C[P + 8], S, 1770035416);
      V = u(V, Y, X, W, C[P + 9], Q, 2336552879);
      W = u(W, V, Y, X, C[P + 10], N, 4294925233);
      X = u(X, W, V, Y, C[P + 11], M, 2304563134);
      Y = u(Y, X, W, V, C[P + 12], S, 1804603682);
      V = u(V, Y, X, W, C[P + 13], Q, 4254626195);
      W = u(W, V, Y, X, C[P + 14], N, 2792965006);
      X = u(X, W, V, Y, C[P + 15], M, 1236535329);
      Y = f(Y, X, W, V, C[P + 1], A, 4129170786);
      V = f(V, Y, X, W, C[P + 6], z, 3225465664);
      W = f(W, V, Y, X, C[P + 11], y, 643717713);
      X = f(X, W, V, Y, C[P + 0], w, 3921069994);
      Y = f(Y, X, W, V, C[P + 5], A, 3593408605);
      V = f(V, Y, X, W, C[P + 10], z, 38016083);
      W = f(W, V, Y, X, C[P + 15], y, 3634488961);
      X = f(X, W, V, Y, C[P + 4], w, 3889429448);
      Y = f(Y, X, W, V, C[P + 9], A, 568446438);
      V = f(V, Y, X, W, C[P + 14], z, 3275163606);
      W = f(W, V, Y, X, C[P + 3], y, 4107603335);
      X = f(X, W, V, Y, C[P + 8], w, 1163531501);
      Y = f(Y, X, W, V, C[P + 13], A, 2850285829);
      V = f(V, Y, X, W, C[P + 2], z, 4243563512);
      W = f(W, V, Y, X, C[P + 7], y, 1735328473);
      X = f(X, W, V, Y, C[P + 12], w, 2368359562);
      Y = D(Y, X, W, V, C[P + 5], o, 4294588738);
      V = D(V, Y, X, W, C[P + 8], m, 2272392833);
      W = D(W, V, Y, X, C[P + 11], l, 1839030562);
      X = D(X, W, V, Y, C[P + 14], j, 4259657740);
      Y = D(Y, X, W, V, C[P + 1], o, 2763975236);
      V = D(V, Y, X, W, C[P + 4], m, 1272893353);
      W = D(W, V, Y, X, C[P + 7], l, 4139469664);
      X = D(X, W, V, Y, C[P + 10], j, 3200236656);
      Y = D(Y, X, W, V, C[P + 13], o, 681279174);
      V = D(V, Y, X, W, C[P + 0], m, 3936430074);
      W = D(W, V, Y, X, C[P + 3], l, 3572445317);
      X = D(X, W, V, Y, C[P + 6], j, 76029189);
      Y = D(Y, X, W, V, C[P + 9], o, 3654602809);
      V = D(V, Y, X, W, C[P + 12], m, 3873151461);
      W = D(W, V, Y, X, C[P + 15], l, 530742520);
      X = D(X, W, V, Y, C[P + 2], j, 3299628645);
      Y = t(Y, X, W, V, C[P + 0], U, 4096336452);
      V = t(V, Y, X, W, C[P + 7], T, 1126891415);
      W = t(W, V, Y, X, C[P + 14], R, 2878612391);
      X = t(X, W, V, Y, C[P + 5], O, 4237533241);
      Y = t(Y, X, W, V, C[P + 12], U, 1700485571);
      V = t(V, Y, X, W, C[P + 3], T, 2399980690);
      W = t(W, V, Y, X, C[P + 10], R, 4293915773);
      X = t(X, W, V, Y, C[P + 1], O, 2240044497);
      Y = t(Y, X, W, V, C[P + 8], U, 1873313359);
      V = t(V, Y, X, W, C[P + 15], T, 4264355552);
      W = t(W, V, Y, X, C[P + 6], R, 2734768916);
      X = t(X, W, V, Y, C[P + 13], O, 1309151649);
      Y = t(Y, X, W, V, C[P + 4], U, 4149444226);
      V = t(V, Y, X, W, C[P + 11], T, 3174756917);
      W = t(W, V, Y, X, C[P + 2], R, 718787259);
      X = t(X, W, V, Y, C[P + 9], O, 3951481745);
      Y = K(Y, h);
      X = K(X, E);
      W = K(W, v);
      V = K(V, g);
    }
    var i = B(Y) + B(X) + B(W) + B(V);
    return i.toLowerCase();
  };
  this.init();
}
FrameBuilder.get = qsProxy || [];
var i201575286154053 = new FrameBuilder(
  "201575286154053",
  false,
  "",
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n<html lang="en-US"  class="supernova"><head>\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n<link rel="alternate" type="application/json+oembed" href="https://www.jotform.com/oembed/?format=json&amp;url=https%3A%2F%2Fform.jotform.com%2F201575286154053" title="oEmbed Form">\n<link rel="alternate" type="text/xml+oembed" href="https://www.jotform.com/oembed/?format=xml&amp;url=https%3A%2F%2Fform.jotform.com%2F201575286154053" title="oEmbed Form">\n<meta property="og:title" content="Contact Form" >\n<meta property="og:url" content="https://form.jotform.com/201575286154053" >\n<meta property="og:description" content="Please click the link to complete this form.">\n<meta name="slack-app-id" content="AHNMASS8M">\n<meta data-name="preventCloning" content="1">\n<link rel="shortcut icon" href="https://cdn.jotfor.ms/favicon.ico">\n<link rel="canonical" href="https://form.jotform.com/201575286154053" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=1" />\n<meta name="HandheldFriendly" content="true" />\n<title>Contact Form</title>\n<link href="https://cdn.jotfor.ms/static/formCss.css?3.3.18290" rel="stylesheet" type="text/css" />\n<link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/css/styles/nova.css?3.3.18290" />\n<link type="text/css" media="print" rel="stylesheet" href="https://cdn.jotfor.ms/css/printForm.css?3.3.18290" />\n<link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/themes/CSS/566a91c2977cdfcd478b4567.css?"/>\n<link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/css/styles/payment/payment_styles.css?3.3.18290" />\n<link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/css/styles/payment/payment_feature.css?3.3.18290" />\n<style type="text/css">\n@import url(\'https://fonts.googleapis.com/css2?family=Quicksand&display=swap\');\n\n    .form-label-left{\n        width:150px;\n    }\n    .form-line{\n        padding-top:12px;\n        padding-bottom:12px;\n    }\n    .form-label-right{\n        width:150px;\n    }\n    body, html{\n        margin:0;\n        padding:0;\n        background:#fff;\n    }\n\n    .form-all{\n        margin:0px auto;\n        padding-top:20px;\n        width:690px;\n        color:#555 !important;\n        font-family:\'Arial\';\n        font-size:14px;\n    }\n</style>\n\n<style type="text/css" id="form-designer-style">\n    /* Injected CSS Code */\n/*PREFERENCES STYLE*/\n    .form-all {\n      font-family: Arial, sans-serif;\n    }\n    .form-all .qq-upload-button,\n    .form-all .form-submit-button,\n    .form-all .form-submit-reset,\n    .form-all .form-submit-print {\n      font-family: Arial, sans-serif;\n    }\n    .form-all .form-pagebreak-back-container,\n    .form-all .form-pagebreak-next-container {\n      font-family: Arial, sans-serif;\n    }\n    .form-header-group {\n      font-family: Arial, sans-serif;\n    }\n    .form-label {\n      font-family: Arial, sans-serif;\n    }\n  \n    \n  \n    .form-line {\n      margin-top: 12px;\n      margin-bottom: 12px;\n    }\n  \n    .form-all {\n      max-width: 690px;\n      width: 100%;\n    }\n  \n    .form-label.form-label-left,\n    .form-label.form-label-right,\n    .form-label.form-label-left.form-label-auto,\n    .form-label.form-label-right.form-label-auto {\n      width: 150px;\n    }\n  \n    .form-all {\n      font-size: 14px\n    }\n    .form-all .qq-upload-button,\n    .form-all .qq-upload-button,\n    .form-all .form-submit-button,\n    .form-all .form-submit-reset,\n    .form-all .form-submit-print {\n      font-size: 14px\n    }\n    .form-all .form-pagebreak-back-container,\n    .form-all .form-pagebreak-next-container {\n      font-size: 14px\n    }\n  \n    .supernova .form-all, .form-all {\n      background-color: #fff;\n      border: 1px solid transparent;\n    }\n  \n    .form-all {\n      color: #555;\n    }\n    .form-header-group .form-header {\n      color: #555;\n    }\n    .form-header-group .form-subHeader {\n      color: #555;\n    }\n    .form-label-top,\n    .form-label-left,\n    .form-label-right,\n    .form-html,\n    .form-checkbox-item label,\n    .form-radio-item label {\n      color: #555;\n    }\n    .form-sub-label {\n      color: #6f6f6f;\n    }\n  \n    .supernova {\n      background-color: #ffffff;\n    }\n    .supernova body {\n      background: transparent;\n    }\n  \n    .form-textbox,\n    .form-textarea,\n    .form-radio-other-input,\n    .form-checkbox-other-input,\n    .form-captcha input,\n    .form-spinner input {\n      background-color: #fff;\n    }\n  \n    .supernova {\n      background-image: none;\n    }\n    #stage {\n      background-image: none;\n    }\n  \n    .form-all {\n      background-image: none;\n    }\n  \n  .ie-8 .form-all:before { display: none; }\n  .ie-8 {\n    margin-top: auto;\n    margin-top: initial;\n  }\n  \n  /*PREFERENCES STYLE*//*__INSPECT_SEPERATOR__*/\n@import url(\'https://fonts.googleapis.com/css2?family=Quicksand&display=swap\');\n\n\n\n.form-all * {\n  font-family: \'Quicksand\', sans-serif;\n}\n\n.form-label.form-label-auto {\n        \n      display: block;\n      float: none;\n      text-align: left;\n      width: 100%;\n    \n      }\n    /* Injected CSS Code */\n</style>\n\n<script src="https://cdnjs.cloudflare.com/ajax/libs/punycode/1.4.1/punycode.min.js"></script>\n<script src="https://cdn.jotfor.ms/static/prototype.forms.js" type="text/javascript"></script>\n<script src="https://cdn.jotfor.ms/static/jotform.forms.js?3.3.18290" type="text/javascript"></script>\n<script type="text/javascript">\n var jsTime = setInterval(function(){try{\n   JotForm.jsForm = true;\n\n   JotForm.setConditions([{"action":[{"id":"action_1591462217636","field":"5","visibility":"Unrequire","isError":false}],"id":"1591462236216","index":"0","link":"Any","priority":"0","terms":[{"id":"term_1591462217636","field":"4","operator":"isFilled","value":"","isError":false}],"type":"require"},{"action":[{"id":"action_1591462195229","field":"4","visibility":"Unrequire","isError":false}],"id":"1591462210885","index":"1","link":"Any","priority":"1","terms":[{"id":"term_1591462195229","field":"5","operator":"isFilled","value":"","isError":false}],"type":"require"}]);\n\tJotForm.init(function(){\nif (window.JotForm && JotForm.accessible) $(\'input_6\').setAttribute(\'tabindex\',0);\n      JotForm.setCustomHint( \'input_6\', \'I have a question about...\' );\n\tJotForm.newDefaultTheme = false;\n\tJotForm.newPaymentUIForNewCreatedForms = true;\n\tJotForm.newPaymentUI = true;\n      JotForm.alterTexts({"ageVerificationError":"You must be older than {minAge} years old to submit this form.","alphabetic":"This field can only contain letters","alphanumeric":"This field can only contain letters and numbers.","appointmentSelected":"You\u2019ve selected {time} on {date}","ccDonationMinLimitError":"Minimum amount is {minAmount} {currency}","ccInvalidCVC":"CVC number is invalid.","ccInvalidExpireDate":"Expire date is invalid.","ccInvalidNumber":"Credit Card Number is invalid.","ccMissingDetails":"Please fill up the Credit Card details.","ccMissingDonation":"Please enter numeric values for donation amount.","ccMissingProduct":"Please select at least one product.","characterLimitError":"There are too many characters.  The limit is","characterMinLimitError":"There are too few characters. The minimum is","confirmClearForm":"Are you sure you want to clear the form?","confirmEmail":"E-mail does not match","currency":"This field can only contain currency values.","cyrillic":"This field can only contain cyrillic characters","dateInvalid":"This date is not valid. The date format is {format}","dateInvalidSeparate":"This date is not valid. Enter a valid {element}.","dateLimited":"This date is unavailable.","disallowDecimals":"Please enter a whole number.","email":"Please enter a valid e-mail address","fillMask":"Field value must fill mask.","freeEmailError":"Free email accounts are not allowed","generalError":"Please fix your errors before continuing.","generalPageError":"Please fix your errors before continuing.","gradingScoreError":"Score total should only be less than or equal to","incompleteFields":"Please fill out all required fields.","inputCarretErrorA":"Input should not be less than the minimum value:","inputCarretErrorB":"Input should not be greater than the maximum value:","lessThan":"Your score should be less than or equal to","maxDigitsError":"The maximum digits allowed is","maxSelectionsError":"The maximum number of selections allowed is ","minSelectionsError":"The minimum required number of selections is ","multipleFileUploads_emptyError":"{file} is empty, please select files again without it.","multipleFileUploads_fileLimitError":"Only {fileLimit} file uploads allowed.","multipleFileUploads_minSizeError":"{file} is too small, minimum file size is {minSizeLimit}.","multipleFileUploads_onLeave":"The files are being uploaded, if you leave now the upload will be cancelled.","multipleFileUploads_sizeError":"{file} is too large, maximum file size is {sizeLimit}.","multipleFileUploads_typeError":"{file} has invalid extension. Only {extensions} are allowed.","nextButtonText":"Next","noSlotsAvailable":"No slots available","numeric":"This field can only contain numeric values","pastDatesDisallowed":"Date must not be in the past.","pleaseWait":"Please wait...","prevButtonText":"Previous","progressMiddleText":"of","required":"This field is required.","requiredLegend":"All fields marked with * are required and must be filled.","requireEveryCell":"Every cell is required.","requireEveryRow":"Every row is required.","requireOne":"At least one field is required.","reviewBackText":"Back to Form","reviewSubmitText":"Review and Submit","seeAllText":"See All","slotUnavailable":"{time} on {date} has been taken. Please select another slot.","submissionLimit":"Sorry! Only one entry is allowed.  Multiple submissions are disabled for this form.","submitButtonText":"Submit","uploadExtensions":"You can only upload following files:","uploadFilesize":"File size cannot be bigger than:","uploadFilesizemin":"File size cannot be smaller than:","url":"This field can only contain a valid URL","wordLimitError":"There are too many words. The limit is","wordMinLimitError":"Too few words.  The minimum is"});\n\tJotForm.clearFieldOnHide="disable";\n\tJotForm.submitError="jumpToFirstError";\n    /*INIT-END*/\n\t});\n\n   clearInterval(jsTime);\n }catch(e){}}, 1000);\n\n   JotForm.prepareCalculationsOnTheFly([null,null,{"name":"submit2","qid":"2","text":"Submit","type":"control_button"},{"description":"","name":"name","qid":"3","text":"Name","type":"control_fullname"},{"description":"","name":"email","qid":"4","subLabel":"JaneDoe@example.com","text":"Email","type":"control_email"},{"description":"","name":"phoneNumber","qid":"5","text":"Phone Number","type":"control_phone"},{"description":"","name":"comments","qid":"6","subLabel":"","text":"Comments","type":"control_textarea"}]);\n   setTimeout(function() {\nJotForm.paymentExtrasOnTheFly([null,null,{"name":"submit2","qid":"2","text":"Submit","type":"control_button"},{"description":"","name":"name","qid":"3","text":"Name","type":"control_fullname"},{"description":"","name":"email","qid":"4","subLabel":"JaneDoe@example.com","text":"Email","type":"control_email"},{"description":"","name":"phoneNumber","qid":"5","text":"Phone Number","type":"control_phone"},{"description":"","name":"comments","qid":"6","subLabel":"","text":"Comments","type":"control_textarea"}]);}, 20); \n</script>\n</head>\n<body>\n<form class="jotform-form" action="https://submit.jotform.com/submit/201575286154053/" method="post" name="form_201575286154053" id="201575286154053" accept-charset="utf-8" autocomplete="on">\n  <input type="hidden" name="formID" value="201575286154053" />\n  <input type="hidden" id="JWTContainer" value="" />\n  <input type="hidden" id="cardinalOrderNumber" value="" />\n  <div role="main" class="form-all">\n    <ul class="form-section page-section">\n      <li class="form-line form-line-column form-col-1 jf-required" data-type="control_fullname" id="id_3">\n        <label class="form-label form-label-top form-label-auto" id="label_3" for="first_3">\n          Name\n          <span class="form-required">\n            *\n          </span>\n        </label>\n        <div id="cid_3" class="form-input-wide jf-required">\n          <div data-wrapper-react="true" class="extended">\n            <span class="form-sub-label-container " style="vertical-align:top" data-input-type="first">\n              <input type="text" id="first_3" name="q3_name[first]" class="form-textbox validate[required]" size="10" value="" data-component="first" aria-labelledby="label_3 sublabel_3_first" required="" />\n              <label class="form-sub-label" for="first_3" id="sublabel_3_first" style="min-height:13px" aria-hidden="false"> First Name </label>\n            </span>\n            <span class="form-sub-label-container " style="vertical-align:top" data-input-type="middle">\n              <input type="text" id="middle_3" name="q3_name[middle]" class="form-textbox" size="10" value="" data-component="middle" aria-labelledby="label_3 sublabel_3_middle" required="" />\n              <label class="form-sub-label" for="middle_3" id="sublabel_3_middle" style="min-height:13px" aria-hidden="false"> Middle Name </label>\n            </span>\n            <span class="form-sub-label-container " style="vertical-align:top" data-input-type="last">\n              <input type="text" id="last_3" name="q3_name[last]" class="form-textbox validate[required]" size="15" value="" data-component="last" aria-labelledby="label_3 sublabel_3_last" required="" />\n              <label class="form-sub-label" for="last_3" id="sublabel_3_last" style="min-height:13px" aria-hidden="false"> Last Name </label>\n            </span>\n          </div>\n        </div>\n      </li>\n      <li class="form-line form-line-column form-col-2 jf-required" data-type="control_phone" id="id_5">\n        <label class="form-label form-label-top form-label-auto" id="label_5" for="input_5_area">\n          Phone Number\n          <span class="form-required">\n            *\n          </span>\n        </label>\n        <div id="cid_5" class="form-input-wide jf-required">\n          <div data-wrapper-react="true">\n            <span class="form-sub-label-container " style="vertical-align:top" data-input-type="areaCode">\n              <input type="tel" id="input_5_area" name="q5_phoneNumber[area]" class="form-textbox validate[required]" size="6" value="" data-component="areaCode" aria-labelledby="label_5 sublabel_5_area" required="" />\n              <span class="phone-separate" aria-hidden="true">\n                \u00a0-\n              </span>\n              <label class="form-sub-label" for="input_5_area" id="sublabel_5_area" style="min-height:13px" aria-hidden="false"> Area Code </label>\n            </span>\n            <span class="form-sub-label-container " style="vertical-align:top" data-input-type="phone">\n              <input type="tel" id="input_5_phone" name="q5_phoneNumber[phone]" class="form-textbox validate[required]" size="12" value="" data-component="phone" aria-labelledby="label_5 sublabel_5_phone" required="" />\n              <label class="form-sub-label" for="input_5_phone" id="sublabel_5_phone" style="min-height:13px" aria-hidden="false"> Phone Number </label>\n            </span>\n          </div>\n        </div>\n      </li>\n      <li class="form-line form-line-column form-col-3 jf-required" data-type="control_email" id="id_4">\n        <label class="form-label form-label-top form-label-auto" id="label_4" for="input_4">\n          Email\n          <span class="form-required">\n            *\n          </span>\n        </label>\n        <div id="cid_4" class="form-input-wide jf-required">\n          <span class="form-sub-label-container " style="vertical-align:top">\n            <input type="email" id="input_4" name="q4_email" class="form-textbox validate[required, Email]" size="30" value="" data-component="email" aria-labelledby="label_4 sublabel_input_4" required="" />\n            <label class="form-sub-label" for="input_4" id="sublabel_input_4" style="min-height:13px" aria-hidden="false"> JaneDoe@example.com </label>\n          </span>\n        </div>\n      </li>\n      <li class="form-line form-line-column form-col-4" data-type="control_textarea" id="id_6">\n        <label class="form-label form-label-top form-label-auto" id="label_6" for="input_6"> Comments </label>\n        <div id="cid_6" class="form-input-wide">\n          <div class="form-textarea-limit">\n            <span>\n              <textarea id="input_6" class="form-textarea" name="q6_comments" cols="33" rows="6" data-component="textarea"></textarea>\n              <div class="form-textarea-limit-indicator">\n                <span data-limit="300" type="Letters" data-minimum="-1" data-typeminimum="Letters" id="input_6-limit">\n                  0/300\n                </span>\n              </div>\n            </span>\n          </div>\n        </div>\n      </li>\n      <li class="form-line" data-type="control_button" id="id_2">\n        <div id="cid_2" class="form-input-wide">\n          <div style="text-align:center" data-align="center" class="form-buttons-wrapper form-buttons-center   jsTest-button-wrapperField">\n            <button id="input_2" type="submit" class="form-submit-button submit-button jf-form-buttons jsTest-submitField" data-component="button" data-content="">\n              Submit\n            </button>\n          </div>\n        </div>\n      </li>\n      <li style="display:none">\n        Should be Empty:\n        <input type="text" name="website" value="" />\n      </li>\n    </ul>\n  </div>\n\n    </div>\n  </div>\n</form></body>\n</html>\n',
  "Contact Form",
  Array
);
(function () {
  window.handleIFrameMessage = function (e) {
    if (!e.data || !e.data.split) return;
    var args = e.data.split(":");
    if (args[2] != "201575286154053") {
      return;
    }
    var iframe = document.getElementById("201575286154053");
    if (!iframe) {
      return;
    }
    switch (args[0]) {
      case "scrollIntoView":
        if (!("nojump" in FrameBuilder.get)) {
          iframe.scrollIntoView();
        }
        break;
      case "setHeight":
        var height = args[1] + "px";
        if (window.jfDeviceType === "mobile" && typeof $jot !== "undefined") {
          var parent = $jot(iframe).closest(
            ".jt-feedback.u-responsive-lightbox"
          );
          if (parent) {
            height = "100%";
          }
        }
        iframe.style.height = height;
        break;
      case "setMinHeight":
        iframe.style.minHeight = args[1] + "px";
        break;
      case "collapseErrorPage":
        if (iframe.clientHeight > window.innerHeight) {
          iframe.style.height = window.innerHeight + "px";
        }
        break;
      case "reloadPage":
        if (iframe) {
          location.reload();
        }
        break;
      case "removeIframeOnloadAttr":
        iframe.removeAttribute("onload");
        break;
      case "loadScript":
        if (!window.isPermitted(e.origin, ["jotform.com", "jotform.pro"])) {
          break;
        }
        var src = args[1];
        if (args.length > 3) {
          src = args[1] + ":" + args[2];
        }
        var script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        document.body.appendChild(script);
        break;
      case "exitFullscreen":
        if (window.document.exitFullscreen) window.document.exitFullscreen();
        else if (window.document.mozCancelFullScreen)
          window.document.mozCancelFullScreen();
        else if (window.document.mozCancelFullscreen)
          window.document.mozCancelFullScreen();
        else if (window.document.webkitExitFullscreen)
          window.document.webkitExitFullscreen();
        else if (window.document.msExitFullscreen)
          window.document.msExitFullscreen();
        break;
      case "setDeviceType":
        window.jfDeviceType = args[1];
        break;
    }
  };
  window.isPermitted = function (url, whitelisted_domains) {
    var hostname = new URL(url).hostname;
    var result = false;
    if (typeof hostname !== "undefined") {
      if (whitelisted_domains.indexOf(hostname) > -1) {
        result = true;
      } else {
        whitelisted_domains.forEach(function (element) {
          if (hostname.endsWith(".".concat(element)) == true) {
            result = true;
          }
        });
      }
      return result;
    }
  };
  if (window.addEventListener) {
    window.addEventListener("message", handleIFrameMessage, false);
  } else if (window.attachEvent) {
    window.attachEvent("onmessage", handleIFrameMessage);
  }
})();
