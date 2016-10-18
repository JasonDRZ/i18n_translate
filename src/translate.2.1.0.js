/**
 * Created by JasonD on 16/10/14.
 */
;(function (root, factory) {
    'use strict'
    //适配require.js模块开发
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory()
    } else if (typeof define === 'function' && define.amd) {
        define(['translate'], factory)
    } else {
        root.Translate = factory(root)
    }
})(typeof window == 'object' ? window : main, function (root) {
    //原型继承
    var __proto__extends = (root && root.__extends) || function (d, b) {
            for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            function __() {
                this.constructor = d;
            }

            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    //属性继承
    var __attr__extends = function (a, b) {
        for (var p in b) if (b.hasOwnProperty(p) && a && !a.hasOwnProperty(p)) a[p] = b[p];
    };
    //数组继承,将b继承到a中
    var __arry__extends = function (a, b) {
        if (b.length) {
            for (var p = 0; p < b.length; (a.push(b[p])), p++);
        }
    };
    //主函数体
    var i18n = function (setting) {
        var main = this;
        if (!setting || (setting && !setting.default) || (setting && !setting.namespace)) {
            throw Error("You must config 'Translate' at least two of Attrs {default: String,namespace: String} in your project.");
            return;
        } else if (!main instanceof i18n) return new i18n(setting);
        //初始化配置
        var config = {
            namespace: setting.namespace,//用来标示当前Translation实例化之后赋值的对象，须从window下的对象开始
            userSetLang: setting.default,
            domTransSourceName: setting.dataBinder || 'langdata',//用来二次存取每个翻译Dom属性中的的原始翻译字段
            elementRegTag: 'domRegistered',
        };
        //创建内存缓存库
        var dataBank = {
            totalLangData: {},//当前域中所有已注册的语言数据
            allLanguageMarks: [],
            domList: [],
            translateWrapper: 'translateWrapper',//指定需要进行innerText翻译的区域
            translateTextTag: {'begin': '@{', 'end': '}'}
        };
        //接口配置
        main.Name = 'Translate';
        main.Version = '1.1.0';
        main.language = null;
        main.namespace = config.namespace;
        main.defaultNS = 'default';
        //数据继承
        var onDomInsert = function () {
            // Firefox和Chrome早期版本中带有前缀
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
            // 配置观察选项:
            var watchOption = {attributes: true, childList: true, characterData: true};
            // 创建观察者对象
            var argus = Array.apply(null, arguments);
            var callback = argus[0];
            var watchTarget = root.document.querySelector(typeof argus[0] == "string" ? (callback = argus[1], argus[0]) : "body");
            var observer = new MutationObserver(function (mutations) {
                console.log(mutations)
                //个每一个可能的变化节点绑定执行函数
                mutations.forEach(callback);
            })
            //选择目标节点, 传入目标节点和观察选项
            observer.observe(watchTarget, watchOption);
            // 随后,你还可以停止观察
            //observer.disconnect();
            return observer;
        };
        //获取命名空间
        var getNameSpace = function (name) {
            var ar = name.split('.'), space = root;
            var i = 0;
            do {
                space = space[ar[i]];
                console.log(space)
                i++;
            } while (i < ar.length);
            return space;
        };
        //
        var returnMatchRegExp = function (rule, options) {
            return new RegExp(dataBank.translateTextTag.begin + rule + dataBank.translateTextTag.end, options)
        }
        //
        var createPLabel = function (attrName,matchStr) {
            var p = root.document.createElement('b');
            p.setAttribute(attrName, matchStr);
            return p;
        }
        //转译文本翻译源,
        //
        // 需要默认支持default namespace,如果namespace被设为default，@{lang}将使用default进行翻译
        //
        var matchTextTransSource = function (innerHtml) {
            return innerHtml.replace(returnMatchRegExp('.*?', 'g'), function (e) {
                var s = e.match(returnMatchRegExp('(.+\S?)')), replacement;
                s = String.prototype.replace.call(s[1], /\s/g, '');
                if (s.indexOf('|') != -1) {
                    var sa = s.split('|');
                    replacement = getFragInnerHtmlString(createPLabel(sa[1],sa[0]));
                } else {
                    //默认为当前命名空间
                    replacement = getFragInnerHtmlString(createPLabel(main.defaultNS,s));
                }
                return replacement;
            });
        }
        //获取文本翻译块
        var innerTextCompiler = function (cb) {
            var wrappers = root.document.querySelectorAll('[' + dataBank.translateWrapper + ']');
            wrappers = Array.prototype.filter.call(wrappers,function (ele) {
                return !ele[dataBank.translateWrapper];
            });
            if (wrappers.length < 1) return;
            wrappers.forEach(function (ele, i) {
                var repHtml = matchTextTransSource(ele.innerHTML);
                ele.innerHTML = "";
                ele[dataBank.translateWrapper] = true;
                ele.appendChild(stringNodeTranslater(repHtml));
            });
            if (cb) cb();
        };

        //设置当下语言
        var setCurentLang = function (lang, cb) {
            config.userSetLang = lang;
            if (typeof cb == "function") cb();
        }
        //设置当下语言的翻译数据
        var setCurentLangData = function () {
            return i18n.prototype.language = dataBank.totalLangData[config.userSetLang];
        };
        //查询翻译字段
        var getTranslate = function (keyStr) {
            keyStr = keyStr.trim();
            var ak = keyStr.split('.');
            var tmp = main.language === null ? setCurentLangData() : main.language;
            for (var i in ak) {
                if (tmp[ak[i]]) tmp = tmp[ak[i]];
                else {
                    console.log("[" + keyStr + "] 未匹配到目标语言字段，请检查。");
                    tmp = "Bad Translation!";
                    break;
                }
            }
            ;
            return tmp;
        };
        //获取所有需要转换Dom节点，并转换成数组形式
        var getAllTargetNodes = function (parent) {
            //需验证parent是否是合法Node节点
            return Array.prototype.slice.call(parent.querySelectorAll('[' + main.namespace + ']'));
        }
        var registerNodeList = function (TargetNodes) {
            TargetNodes.forEach(function (ele,i) {
                ele[config.elementRegTag] = true;
            });
            //需验证parent是否是合法Node节点
            __arry__extends(dataBank.domList, TargetNodes);
        }
        var getNodeFragment = function (str) {
            var frag, range, frame;
            //create range
            frame = root.document.getElementById('frame_range');
            if (frame === null) {
                frame = root.document.createElement('iframe');
                frame.setAttribute('id','frame_range');
                frame.setAttribute("style","display: none;");
                root.document.body.appendChild(frame);
            };
            range = root.document.createRange();
            //make the parent of the body in the document becomes the context node
            range.selectNode(frame);
            frag = range.createContextualFragment(str);
            // root.document.getElementById("frame_range").removeChild(frag);
            return frag;
        }
        //创建字符串Node节点
        var getTextFragment = function (str) {
            var text;
            text = root.document.createTextNode(str);
            return text;
        }
        //
        var getFragInnerHtmlString = function (frag) {
            var div = root.document.createElement('div');
            div.appendChild(frag);
            return div.innerHTML;
        }

        //字符串转译翻译机,输出html字符串
        var stringToHtmlTranslater = function (str) {
            var frag = getNodeFragment(str),
                div = root.document.createElement('div');
            div.appendChild(frag);
            return div.innerHTML;
        };

        //node节点注册型公用翻译机
        var nodeRegTranslater = function (range) {
            var newTargets = getAllTargetNodes(range);
            console.log(newTargets)
            if (newTargets.length < 1) return;
            console.log(dataBank.domList)
            newTargets = newTargets.filter(function (ele) {
                //去掉已注册过的元素
                if (ele[config.elementRegTag]) {
                    return false;
                } else {
                    return true;
                }
            });
            newTargets.forEach(function (ele, i) {
                //验证当前是否已经注册了语言数据
                if (dataBank.totalLangData[config.userSetLang]) {
                    var transSource = newTargets[i][config.domTransSourceName] = ele.getAttribute(main.namespace);
                    // ele.removeAttribute(main.namespace);
                    ele.innerHTML = getTranslate(transSource);
                }
            });
            //注册新的node节点
            registerNodeList(newTargets);
            console.log(main.namespace)
            console.log(dataBank.domList)
        }
        //字符串转译翻译机,输出Nodes节点,并注册节点
        var stringNodeRegTranslater = function (str) {
            //创建新的node文档树
            var frag = getNodeFragment(str);
            nodeRegTranslater(frag);
            return frag;
        }
        //字符串转译翻译机,输出Nodes节点
        var stringNodeTranslater = function (str) {
            //创建新的node文档树
            var frag = getNodeFragment(str);
            return frag;
        }
        //初始化运行翻译机
        var initTranslater = function () {
            //设置当前语言
            console.log("刚加载")
            setCurentLangData();
            nodeRegTranslater(document);
        };
        //后续运行翻译机
        var switchTranslater = function (lang) {
            lang = lang.trim();
            setCurentLang(lang, setCurentLangData);
            //翻译每个需要翻译的DOM元素内容
            console.log(dataBank.domList)
            dataBank.domList.forEach(function (ele, i) {
                var transSource = dataBank.domList[i][config.domTransSourceName];
                console.log(ele);
                console.log(transSource)
                ele.innerHTML = getTranslate(transSource);
                console.log(ele);

            })
        };
        /**
         * 注册翻译数据
         * @param argue 支持两种数据方案：一、Single Object{"lang": data}
         * @param cb
         */
        var registerLanguages = function (argue, cb) {
            if (argue.length == 1) {
                //初始化存储所有语言翻译数据
                if (typeof argue == 'object') __attr__extends(dataBank.totalLangData, argue[0]);
                else try {
                    argue = JSON.parse(argue[0]);
                    __attr__extends(dataBank.totalLangData, argue);
                } catch (e) {
                    console.log(e);
                };
            } else if (argue.length == 2) {
                if (typeof argue[0] == 'string') {
                    var tmp = {};
                    tmp[argue[0]] = argue[1];
                    __attr__extends(dataBank.totalLangData, tmp);
                }
                else throw Error("The [translation] parameters should be ([string],[object | JSON string ]) or ([object | JSON string]) !")
            }
            //将注册语言标识进行保存
            dataBank.allLanguageMarks = [];
            for (var l in dataBank.totalLangData) dataBank.allLanguageMarks.push(l);
            if (cb) cb();
        };
        //
        var detectLanguageRegistered = function (lang) {
            console.log(dataBank.allLanguageMarks.join(","))
            console.log(dataBank.allLanguageMarks.join(",").indexOf(lang))
            return dataBank.allLanguageMarks.join(",").indexOf(lang) != -1;
        }

        //插件正式接口
        main.translation = function () {
            var argus = arguments;
            //初始化函数
            registerLanguages(argus, initTranslater);
            var watchInsert = onDomInsert(function (mutasion) {
                console.log(mutasion)
            });
            return main;
        };
        main.use = function (langStr) {//此方法用户切换语言
            if (typeof langStr != "string" || (langStr && langStr.trim() == "")) {
                throw Error("To Translate 'use' function parameter must be a string！");
                return;
            }
            //是否存在切换的语言
            if (!detectLanguageRegistered(langStr)) {
                console.log("The language tag [" + langStr + "] has not been registered!")
                return;
            }
            switchTranslater(langStr);
        };
        main.domNodes = function (str) {//返回
            return stringNodeRegTranslater(str);
        };
        main.init = function () {
            //初始化编译所有翻译标签
            innerTextCompiler();
        }
        //启动初始化函数
        main.init();
        //插件测试接口
        main.getAllLanguages = function () {
            return dataBank.totalLangData;
        };
        main.getElementRegistered = function () {
            return dataBank.domList;
        }
        // main.domString = function (str) {
        //     return stringTranslater(str);
        // };
        return main;
    };
    //expand prototype
    // i18n.prototype = {
    //     constructor: i18n,
    // };
    return i18n;
})


