/**
 * Created by JasonD on 16/10/14.
 */
;(function (root, factory) {
    'use strict'
    //适配require.js模块开发
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory()
    } else if (typeof define === 'function' && define.amd) {
        define(['Translate'], factory)
    } else {
        root.Translate = factory(root)
    }
})(typeof window == 'object' ? window : main, function (root) {
    /**--------------------**/
    /********根域方法集*********/
    /**--------------------**/
    /**
     * 原型继承
     * @type {any} [参数1]将继承[参数2]的所有属性及原型方法
     * @private
     */
    var __proto__extends = (root && root.__extends) || function (d, b) {
            for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    /**b
     * 属性继承，a将继承b的所有属性
     * @param a
     * @param b
     * @private
     */
    var __attr__extends = function (a, b) {
        for (var p in b) if (b.hasOwnProperty(p) && a && !a.hasOwnProperty(p)) a[p] = b[p];
    };
    //数组继承,将b继承到a中
    /**
     * 属性继承，a将继承b的元素
     * @param a
     * @param b
     * @private
     */
    var __arry__extends = function (a, b) {
        if (b.length) {
            for (var p = 0; p < b.length; (a.push(b[p])), p++);
        }
    };

    /**--------------------**/
    /********根域配置*********/
    /**--------------------**/


    /**--------------------**/
    /********函数主体*********/
    /**--------------------**/
    var i18n = function (setting) {
        var main = this;
        /**
         * 检测实例化条件是否满足
         */
        if (!setting || (setting && !setting.default) || (setting && !setting.namespace)) {
            throw Error("You must config 'Translate' at least two of Attrs {default: String,namespace: String} in your project.");
            return;
        } else if (!main instanceof i18n) return new i18n(setting);
        /**--------------------**/
        /********功能配置*********/
        /**--------------------**/

        //插件配置
        var config = {
            namespace: setting.namespace,//用来标示当前Translation实例化之后赋值的对象，须从window下的对象开始
            userSetLanguageTag: setting.default,
            elementLanguagePathKey: 'languageMatcher',//用来二次存取每个翻译Dom属性中的的原始翻译字段
            elementRegisteredTagName: 'translationRegistered',
            translateTextTag: {'begin': '@{', 'end': '}'},
            translateWrapper: 'translateWrapper',//指定需要进行innerText翻译的区域
        };

        //创建内存缓存库
        var dataBank = {
            allLanguagesData: {},//当前域中所有已注册的语言数据
            allLanguagesMarks: [],//存储所有已注册的的语言标识
            nodeRegisteredList: [],//存储所有生成注册的DOM元素
        };

        //接口配置
        main.Name = 'Translate';
        main.Version = '1.1.0';
        main.windowScope = setting.windowScope || root;
        main.curentLanguage = null;
        main.namespace = config.namespace;
        main.defaultNS = 'default';
        /**-----------------------------------------**/
                /*********函数私有方法集*********/
        /**-----------------------------------------**/
        //元素插入容器事件监听
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

        /**
         * 通过scopePath配置参数获取已有的翻译构造函数对象
         * @param path 例如scopePath: 'translator.one',这将对应匹配window对象下的'translator'对象的'one'属性
         * @returns {*}
         */
        var parseScopePath = function (path) {
            var ar = path.split('.'), space = root;
            var i = 0;
            do {
                space = space[ar[i]];
                i++;
            } while (i < ar.length);
            return space;
        };
        /**------------------------**/
        /**---------简易方法--------**/
        /**------------------------**/
        var _slice = Array.prototype.slice,
            _filter = Array.prototype.filter;
        /**-----------------------------------**/
             /**---------翻译模块--------**/
        /**-----------------------------------**/
        var Modules = {
            commonMethod: {},
            textTranslator: {},
            attributeTranslator: {},
            pluginInterface: {}
        };
        /**---------------------------**/
        /**---------公共/主处理模块模块--------**/
        /**---------------------------**/
        __attr__extends(Modules.commonMethod,{
            /**
             * 将html node对象转换成html字符串
             * @param node
             * @returns {string}
             */
            getFragInnerHtmlString: function (node) {
                var div = root.document.createElement('div');
                div.appendChild(node);
                return div.innerHTML;
            },
            /**
             * 按文档域查找目标元素
             * @param queryStr
             * @param parent
             * @returns {*}
             */
            getAllTargetNodes: function (queryStr,parent) {
                //需验证parent是否是合法Node节点
                parent = parent ? parent : root.document;
                return _slice.call(parent.querySelectorAll(queryStr));
            },
            /**
             * 将html字符串转换成文档对象
             * @param htmlString
             * @returns {*}
             */
            getNodeFragment: function (htmlString) {
                var frag, range, frame;
                //创建一个iframe文档域，用来暂时存储转译的文档碎片
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
                frag = range.createContextualFragment(htmlString);
                return frag;
            },
            /**
             * 通过解析字段获取当前语言数据中对应的值
             * @param keyStr 解析字符串
             * @returns {String} 返回查询到的字符串值
             *
             * 带支持：插入内容为html和翻译标签时，跨域注册
             */
            getTargetTranslation: function (keyStr) {
                keyStr = keyStr.trim();
                var ak = keyStr.split('.');
                var tmp = main.curentLanguage === null
                    ? setCurentLangData()
                    : main.curentLanguage;
                for (var i in ak) {
                    if (tmp[ak[i]]) tmp = tmp[ak[i]];
                    else {
                        console.log("[" + keyStr + "] 未匹配到目标语言字段，请检查。");
                        tmp = "{{Bad Translation!}}";
                        break;
                    }
                };
                return tmp;
            },
            /**
             * 查询、翻译并注册DOM元素节点
             * @param range
             */
            selectTargetToRegTranslater: function (range) {
                var newTargets = Modules.commonMethod.getAllTargetNodes('[' + main.namespace + ']',range);
                if (newTargets.length < 1) return;
                newTargets = newTargets.filter(function (ele) {
                    //去掉已注册过的元素
                    if (ele[config.elementRegisteredTagName]) {
                        return false;
                    } else {
                        return true;
                    }
                });
                newTargets.forEach(function (ele, i) {
                    //验证当前是否已经注册了语言数据
                    if (dataBank.allLanguagesData[config.userSetLanguageTag]) {
                        var transSource = newTargets[i][config.elementLanguagePathKey] = ele.getAttribute(main.namespace);
                        // ele.removeAttribute(main.namespace);
                        ele.innerHTML = Modules.commonMethod.getTargetTranslation(transSource);
                    }
                });
                //注册新的node节点
                Modules.commonMethod.registerNodeList(newTargets);
            },
            /**
             * 将目标DOM对象注册到当前域中，并标示
             * @param TargetNodes
             */
            registerNodeList: function (TargetNodes) {
                TargetNodes.forEach(function (ele,i) {
                    ele[config.elementRegisteredTagName] = true;
                });
                //需验证parent是否是合法Node节点
                __arry__extends(dataBank.nodeRegisteredList, TargetNodes);
            },
            /**
             * 设置并返回当前语言数据
             * @returns {curentLanguage}
             */
            setCurentLangData: function () {
                return main.curentLanguage = dataBank.allLanguagesData[config.userSetLanguageTag];
            },
            /**
             * 设置变更语言标识
             * @param lang
             * @param cb
             */
            setCurentLang: function (lang, cb) {
                config.userSetLanguageTag = lang;
                if (typeof cb == "function") cb();
            },
        });

        /**-------------------------------------------**/
        /**--文本翻译标签转译及文本翻译标签数据替换翻译模块--**/
        /**--------------------------------------------**/

        __attr__extends(Modules.textTranslator,{
            /**
             *
             * @param rule 内部匹配表达式
             * @param options 配置参数
             * @returns {RegExp}
             */
            returnTextTagMatchRegExp: function (rule, options) {
                return new RegExp(config.translateTextTag.begin + rule + config.translateTextTag.end, options)
            },
            /**
             * 获取未注册html字符串转译的文档对象
             * @param str
             */
            stringNodeTranslater: function (str) {
                //创建新的node文档树
                var frag = Modules.commonMethod.getNodeFragment(str);
                return frag;
            },
            /**
             * 生成一个带有翻译命名空间属性及字段的'b'标签
             * @param attrName
             * @param pathString
             * @returns {Element}
             */
            createBLabel: function (attrName,pathString) {
                var b = root.document.createElement('b');
                b.setAttribute(attrName, pathString);
                return b;
            },
            /**
             * 支持default namespace,如果namespace被设为default，@{lang}将使用default进行翻译
             * @param innerHtml
             * @returns {XML|void|string|*}
             */
            matchTextTransSource: function (innerHtml) {
                return innerHtml.replace(Modules.textTranslator.returnTextTagMatchRegExp('.*?', 'g'), function (e) {
                    var s = e.match(Modules.textTranslator.returnTextTagMatchRegExp('(.+\S?)')), replacement;
                    s = s[1].replace(/\s/g, '');
                    if (s.indexOf('|') != -1) {
                        var sa = s.split('|');
                        replacement = Modules.commonMethod.getFragInnerHtmlString(
                            Modules.textTranslator.createBLabel(sa[1],sa[0])
                        );
                    } else {
                        //默认为当前命名空间
                        replacement = Modules.commonMethod.getFragInnerHtmlString(
                            Modules.textTranslator.createBLabel(main.defaultNS,s)
                        );
                    }
                    return replacement;
                });
            },
            /**
             * 文本替换为'b'标签绑定数据主方法
             * @param cb Callback
             */
            innerTextCompiler: function (cb) {
                var wrappers = root.document.querySelectorAll('[' + config.translateWrapper + ']');
                wrappers = _filter.call(wrappers,function (ele) {
                    return !ele[config.translateWrapper];
                });
                if (wrappers.length < 1) return;
                wrappers.forEach(function (ele, i) {
                    var repHtml = Modules.textTranslator.matchTextTransSource(ele.innerHTML);
                    ele.innerHTML = "";
                    ele[config.translateWrapper] = true;
                    ele.appendChild(Modules.textTranslator.stringNodeTranslater(repHtml));
                });
                if (cb) cb();
            }
        });

        /**---------------------------**/
        /**-------标签属性翻译模块------**/
        /**---------------------------**/

        __attr__extends(Modules.attributeTranslator,{



        })

        /**---------------------------**/
        /**-------API调用模块------**/
        /**---------------------------**/

        __attr__extends(Modules.pluginInterface,{
            /**
             * 检测要切换的语言是否已被注册
             * @param language
             * @returns {boolean}
             */
            detectLanguageRegistered: function (language) {
                return dataBank.allLanguagesMarks.join(",").indexOf(language) != -1;
            },
            /**
             * html字符串解析API调用函数
             * @param str
             */
            stringselectTargetToRegTranslater: function (str) {
                //创建新的node文档树
                var frag = Modules.commonMethod.getNodeFragment(str);
                Modules.commonMethod.selectTargetToRegTranslater(frag);
                return frag;
            },
            /**
             * 注册翻译数据,二次注册同一种语言将不会生效
             * @param argue 支持两种数据方案：一、多语言集合型对象({"lang": data,"lang2": data2}),并且支持JSON字符串;
             *         二、支持第一个参数为语言标识，第二个参数为对应语言数据的单次语言注册方式，如("lang", data);
             * @param cb callback function
             */
            registerLanguages: function (argue, cb) {
                if (argue.length == 1) {
                    //初始化存储所有语言翻译数据
                    if (typeof argue[0] == 'object') __attr__extends(dataBank.allLanguagesData, argue[0]);
                    else try {
                        argue = JSON.parse(argue[0]);
                        __attr__extends(dataBank.allLanguagesData, argue);
                    } catch (e) {
                        console.log(e);
                    };
                } else if (argue.length == 2) {
                    if (typeof argue[0] == 'string') {
                        var tmp = {};
                        if (typeof argue[1] == 'object')
                            tmp[argue[0]] = argue[1];
                        else try {
                            tmp[argue[0]] = JSON.parse(argue[1]);
                        } catch (e) {
                            console.log(e);
                        };
                        __attr__extends(dataBank.allLanguagesData, tmp);
                    }
                    else throw Error("The [translation] parameters should be ([string],[object | JSON string ]) or ([object | JSON string]) !")
                }
                //将注册语言标识进行保存
                dataBank.allLanguagesMarks = [];
                for (var l in dataBank.allLanguagesData) dataBank.allLanguagesMarks.push(l);
                if (cb) cb();
            },
            switchTranslater: function (lang) {
                lang = lang.trim();
                Modules.commonMethod.setCurentLang(lang, Modules.commonMethod.setCurentLangData);
                //翻译每个需要翻译的DOM元素内容
                dataBank.nodeRegisteredList.forEach(function (ele, i) {
                    var transSource = dataBank.nodeRegisteredList[i][config.elementLanguagePathKey];
                    console.log(ele);
                    console.log(transSource)
                    ele.innerHTML = Modules.commonMethod.getTargetTranslation(transSource);
                    console.log(ele);

                })
            },
            initTranslater: function () {
                //设置当前语言
                Modules.commonMethod.setCurentLangData();
                Modules.commonMethod.selectTargetToRegTranslater(document);
            },
        })


        /**------------------------------------------------**/
        /*********************插件正式接口*********************/
        /**------------------------------------------------**/

        /**
         * 注册翻译数据,二次注册同一种语言将不会生效
         * @param arguments ({"lang": data,"lang2": data2}[Object / JSON String]) Or ("lang", data[Object / JSON String])
         * 支持两种数据方案：
         *  一、多语言集合型对象({"lang": data,"lang2": data2}),并且支持JSON字符串;
         *  二、支持第一个参数为语言标识，第二个参数为对应语言数据的单次语言注册方式，如("lang", data);
         */
        main.translation = function () {
            if (arguments.length < 1) return main;
            var argus = arguments;
            //初始化函数
            Modules.pluginInterface.registerLanguages(argus, Modules.pluginInterface.initTranslater);
            return main;
        };
        /**
         * //此方法用户切换语言
         * @param languageTag {String}传入要切换的语言标识
         */
        main.use = function (languageTag) {
            if (typeof languageTag != "string" || (languageTag && languageTag.trim() == "")) {
                throw Error("To Translate 'use' function parameter must be a string！");
                return;
            }
            //是否存在切换的语言
            if (!Modules.pluginInterface.detectLanguageRegistered(languageTag)) {
                alert("你要切换的语言{"+languageTag+"}未被注册，请注册后使用！")
                console.log("The language tag [" + languageTag + "] has not been registered!")
                return;
            }
            //调用内部方法
            Modules.pluginInterface.switchTranslater(languageTag);
        };
        /**
         * 此方法允许传入字符串或是html字符串，将返回绑定了语言的新的Node对象
         * @param htmlString
         * ！**注意**！：请不要将返回的Node对象转换成字符串添加到DOM结构中，这样会造成数据绑定失败！！！！！
         */
        main.nodeString = function (htmlString) {//返回
            return Modules.pluginInterface.stringselectTargetToRegTranslater(htmlString);
        };
        //插件初始化//启动初始化函数
        (function () {
            //初始化编译所有翻译标签
            Modules.textTranslator.innerTextCompiler();
        })()


        /**--------------------**/
        /********测试接口*********/
        /**--------------------**/
        /**
         * 用于获取当前域所有已注册的语言及数据
         * @returns {dataBank.allLanguagesData|{}}
         */
        main.getAllLanguages = function () {
            return dataBank.allLanguagesData;
        };
        /**
         * 用于获取当前域所有已注册的DOM元素
         * @returns {Array}
         */
        main.getElementRegistered = function () {
            return dataBank.nodeRegisteredList;
        }
        return main;
    };
    //expand prototype
    // i18n.prototype = {
    //     constructor: i18n,
    // };
    return i18n;
})


