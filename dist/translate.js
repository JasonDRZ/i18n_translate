!function(t,e){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=e():"function"==typeof define&&define.amd?define(["translate"],e):t.Translate=e(t)}("object"==typeof window?window:this,function(t){var e=(t&&t.__extends||function(t,e){function o(){this.constructor=t}for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);t.prototype=null===e?Object.create(e):(o.prototype=e.prototype,new o)},function(t,e){for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o])}),o=function(t,e){if(e.length)for(var o=0;o<e.length;t.push(e[o]),o++);console.log(t)},n={totalLangData:{},userSetLang:"",targetName:"",domList:[],domTransSourceName:"",namespace:""},r=function(){var e=window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver,o={attributes:!0,childList:!0,characterData:!0},n=Array.apply(null,arguments),r=n[0],a=t.document.querySelector("string"==typeof n[0]?(r=n[1],n[0]):"body"),i=new e(function(t){console.log(t),t.forEach(r)});return i.observe(a,o),i},a=function(t,e){n.userSetLang=t,"function"==typeof e&&e()},i=function(){y.prototype.language=n.totalLangData[n.userSetLang]},u=function(t){t=t.trim();var e=t.split("."),o=y.prototype.language;for(var n in e){if(!o[e[n]]){console.log("["+t+"] 未匹配到目标语言字段，请检查。"),o="Bad Translation!";break}o=o[e[n]]}return o},c=function(t){return Array.prototype.slice.call(t.querySelectorAll("["+n.targetName+"]"))},s=function(t){o(n.domList,t),console.log(n.domList)},l=function(e){var o,n;return n=t.document.createRange(),n.selectNode(t.document.body),o=n.createContextualFragment(e)},f=function(t){var e=c(t);e.forEach(function(t,o){var r=e[o][n.domTransSourceName]=t.getAttribute(n.targetName);t.removeAttribute(n.targetName),t.innerHTML=u(r)}),s(e)},g=function(t){var e=l(t);return f(e),e},m=function(){i(),f(document)},d=function(t){t=t.trim(),a(t,i),console.log(n.domList),n.domList.forEach(function(t,e){var o=n.domList[e][n.domTransSourceName];console.log(o),t.innerHTML=u(o)})},p=function(t,o){if(1==t.length)if("object"==typeof t)e(n.totalLangData,t[0]);else try{t=JSON.parse(t[0]),e(n.totalLangData,t)}catch(t){console.log()}else if(2==t.length){if("string"!=typeof t[0])throw Error("The [translation] parameters should be ([string],[object | JSON string ]) or ([object | JSON string]) !");var r={};r[t[0]]=t[1],e(n.totalLangData,r)}o&&o()},y=function(t){if(!t||t&&!t.default||t&&!t.namespace)throw Error("You must config 'Translate' at least two of Attrs {default: String,namespace: String} in your project.");n.userSetLang=t.default,n.namespace=t.namespace,n.targetName=t.AttributeName||"translate",n.domTransSourceName=t.dataBinder||"langdata",this.Name="Translate",this.Version="1.1.0"};return y.prototype={constructor:y,language:null,translation:function(){p(arguments,m);r(function(t){console.log(t)});return this},use:function(t){if("string"!=typeof t)throw Error("To Translate 'use' function parameter must be a string！");d(t)},domNodes:function(t){return g(t)}},y});