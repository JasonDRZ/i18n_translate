/**
 * Created by JasonD on 16/10/14.
 * 此版本并未对对CommonJS和RequireJS做全功能适配，在模块化开发中需要做更多操作来适配所有新的功能
 */
;(function (root, factory) {
    'use strict'
    //适配CommonJS 的export模块化工作机制
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory()
    } else if (typeof define === 'function' && define.amd) {//适配require.js模块开发
        define(['Translate'], factory);
    } else {
        root.Translate = factory(root)
    }
})(typeof window == 'object' ? window : this, function (root) {
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


    /**------------------------**/
    /**---------简易、扩展方法--------**/
    /**------------------------**/
    // 解决办法，以filter为例，自己写一个filter
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun){
            var len = this.length;
            if (typeof fun != "function"){
                throw new TypeError();
            }
            var res = new Array();
            var parent = arguments[1];
            for (var i = 0; i < len; i++){
                if (i in this){
                    var val = this[i]; // in case fun mutates this
                    if (fun.call(parent, val, i, this)) {
                        res.push(val);
                    }
                }
            }
            return res;
        };
    }
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (call) {
            var len = this.length,i=0;
            for (;i<len;(call(this[i],i)),i++);
        }
    }
    //添加捷径
    var _slice = Array.prototype.slice,
        _filter = Array.prototype.filter;
    //删除数组中指定值的元素
    Array.prototype.clean = function(deleteValue) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {
                this.splice(i, 1);//返回指定的元素
                i--;
            }
        }
        return this;
    };
    //用于提供IE对querySelectorAll和querySelector的支持
    if (!root.document.querySelectorAll) {
        root.document.querySelectorAll = function (selectors) {
            var style = root.document.createElement('style'), elements = [], element;
            root.document.documentElement.firstChild.appendChild(style);
            root.document._qsa = [];

            style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
            window.scrollBy(0, 0);
            style.parentNode.removeChild(style);

            while (root.document._qsa.length) {
                element = root.document._qsa.shift();
                element.style.removeAttribute('x-qsa');
                elements.push(element);
            }
            root.document._qsa = null;
            return elements;
        };
    };

    if (!root.document.querySelector) {
        root.document.querySelector = function (selectors) {
            var elements = root.document.querySelectorAll(selectors);
            return (elements.length) ? elements[0] : null;
        };
    };

    /**--------------------**/
    /********根域配置*********/
    /**--------------------**/
    var rootConfig = {
        rootScope: root,//用于将插件查询作用域从window对象下更改到指定对象作用域
        scopeCamp: {
            // 'translate': {
            //     scope: Object,
            //     scopeString: "trans"
            // }
        },//use namespace to be objects tag
        scopesContainer: {//用于存储所有注册的插件调用栈
            //'namespace': 'namespace Object'
        },
        namespaceCamp: [],
        namespaceAttributeTag: "translatenamespace"
    };

    /**--------------------**/
    /********函数主体*********/
    /**--------------------**/
    var i18n = function (TSetting) {
        var main = this;
        /**
         * 检测实例化条件是否满足
         */
        if (!TSetting || (TSetting && !TSetting["default"]) || (TSetting && !TSetting["namespace"])) {
            throw Error("You must config 'Translate' at least two of Attrs {default: String,namespace: String} in your project.");
            return;
        } else if (!main instanceof i18n) return new i18n(TSetting);
        /**--------------------**/
        /********功能配置*********/
        /**--------------------**/

        //插件配置
        var config = {
            namespace: TSetting["namespace"],//用来标示当前Translation实例化之后赋值的对象，须从window下的对象开始
            userSetLanguageTag: TSetting["default"],
            elementMatchTagHead: 'TransMatch_',//用来二次存取每个翻译Dom属性中的的原始翻译字段
            elementRegisteredTagHead: 'TransRegistered_',
            translateTextTag: {'begin': '@{', 'end': '}'},
            translateWrapper: 'translateWrapper'//指定需要进行innerText翻译的区域
        };

        //创建内存缓存库
        var dataBank = {
            allLanguagesData: {},//当前域中所有已注册的语言数据
            allLanguagesMarks: [],//存储所有已注册的的语言标识
            nodeRegisteredList: []//存储所有生成注册的DOM元素
        };

        //接口配置
        main.Name = 'Translate';
        main.Version = '1.1.0';
        main.windowPath = TSetting.windowPath || "window";
        main.currentLanguage = null;
        main.namespace = config.namespace;
        main.defaultNS = 'default';
        //注册当前域,并检测是否已被注册过
        if (rootConfig.namespaceCamp.join(",").indexOf(main.namespace) == -1) {
            __arry__extends(rootConfig.namespaceCamp,[main.namespace]);
        } else {
            throw Error ("The namespace ["+main.namespace+"] has already been registered by {"+rootConfig.scopeCamp[main.namespace].scopePath+"},can not be used again!")
        };
        //注册windowPath到根域
        if (main.windowPath && main.windowPath != 'window'){
            rootConfig.scopeCamp[main.namespace] = {
                scopePath: main.windowPath
            }
        } else {
            console.log("The namespace ["+main.namespace+"] has unknown windowPath! So,this can not be referenced by another namespace!")
        };
        /**--------------------**/
        /********根域数据注册*********/
        /**--------------------**/
        /**
         * 通过scopePath配置参数获取已有的翻译构造函数对象
         * @param path 例如scopePath: 'translator.one',这将对应匹配window对象下的'translator'对象的'one'属性
         * @returns {*}
         */
        var parseScopePath = function (path) {
            //使用指定域进行scope查询
            var ar = path.split('.'), scope = rootConfig.rootScope;
            var i = 0;
            do {
                scope = scope[ar[i]];
                i++;
            } while (i < ar.length);
            return scope;
        };
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

        /**-----------------------------------**/
             /**---------翻译模块--------**/
        /**-----------------------------------**/
        var Modules = {
            commonMethod: {},
            textController: {},
            nodesController: {},
            pluginInterface: {}
        };
        /**---------------------------**/
        /**---------公共/主处理模块模块--------**/
        /**---------------------------**/
        __attr__extends(Modules.commonMethod,{

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
            translateMachine: function (matchString) {
                //检查是否存在当前注册的语言
                var tmp = main.currentLanguage === null
                    ? Modules.commonMethod.setCurrentLangData()
                    : main.currentLanguage,
                    ak = matchString.split('.');
                ak.clean("");
                if (ak.length < 1) {
                    return "{{Bad Translation!}}";
                }
                for (var i = 0; i < ak.length; i++) {
                    if (tmp[ak[i]]) tmp = tmp[ak[i]];
                    else {
                        console.log(tmp)
                        console.log('没跑气的：'+ak[i])
                        console.log("[" + matchString + "] 未匹配到目标语言字段，请检查。");
                        tmp = "{{Bad Translation!}}";
                        break;
                    }
                };
                return tmp;
            },
            switchAttrOrText: function (block,element) {
                var seg = block.split('|'),
                    translationText = Modules.commonMethod.translateMachine(seg[0]);
                if (seg.length > 1) {//用于操作属性值
                    var attrs = seg,i=0;
                    //去掉matchString
                    attrs.shift();
                    for (;i<attrs.length;i++){
                        element.setAttribute(attrs[i],translationText);
                    }
                } else {//用于替换innerHTML值
                    element.innerHTML = translationText;
                }
            },
            /**
             * 通过解析字段获取当前语言数据中对应的值
             * @param keyStr 解析字符串
             * @returns {String} 返回查询到的字符串值
             *
             * 带支持：插入内容为html和翻译标签时，跨域注册
             */
            getTargetTranslation: function (keyStr,element) {
                keyStr = keyStr.replace(/\s/g,"");
                var block = keyStr.match(/\{.*?\}/g);
                if (block){
                    block.forEach(function (b,i) {
                        var inblock = b.match(/\{(.+\S?)\}/)[1];
                        Modules.commonMethod.switchAttrOrText(inblock,element);
                    })
                } else {
                    Modules.commonMethod.switchAttrOrText(keyStr,element);
                }
            },
            /**
             * 设置并返回当前语言数据
             * @returns {currentLanguage}
             */
            setCurrentLangData: function () {
                return main.currentLanguage = dataBank.allLanguagesData[config.userSetLanguageTag];
            },
            /**
             * 设置变更语言标识
             * @param lang
             * @param cb
             */
            setCurrentLang: function (lang, cb) {
                config.userSetLanguageTag = lang;
                if (typeof cb == "function") cb();
            }
        });

        /**-------------------------------------------**/
        /**--文本翻译标签转译及文本翻译标签数据替换翻译模块--**/
        /**--------------------------------------------**/

        __attr__extends(Modules.textController,{
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
            stringNodeTranslator: function (str) {
                //创建新的node文档树
                var frag = Modules.nodesController.getNodeFragment(str);
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
                b.setAttribute(rootConfig.namespaceAttributeTag,attrName);
                if (rootConfig.namespaceCamp.join(",").indexOf(attrName) == -1){
                    console.log("Namespace ["+attrName+"] does not exist!");
                    b.innerHTML = "{{Not supported by any Translation namespace!}}";
                }
                return b;
            },
            /**
             * 支持default namespace,如果namespace被设为default，@{lang}将使用default进行翻译
             * @param innerHtml
             * @returns {XML|void|string|*}
             */
            matchTextTransSource: function (innerHtml) {
                return innerHtml.replace(Modules.textController.returnTextTagMatchRegExp('.*?', 'g'), function (e) {
                    var s = e.match(Modules.textController.returnTextTagMatchRegExp('(.+\S?)')), replacement;
                    s = s[1].replace(/\s/g, '');
                    if (s.indexOf('|') != -1) {
                        var sa = s.split('|');
                        //支持第一个参数
                        replacement = Modules.nodesController.getNodeInnerHtmlString(
                            Modules.textController.createBLabel(sa[1],sa[0])
                        );
                    } else {
                        //默认为当前命名空间
                        replacement = Modules.nodesController.getNodeInnerHtmlString(
                            Modules.textController.createBLabel(main.defaultNS,s)
                        );
                    }
                    return replacement;
                });
            },
            /**
             * 文本替换为'b'标签绑定数据主方法
             * @param tatgetString 目标转译字符串
             * @param cb Callback
             */
            innerTextCompiler: function (targetString,cb) {
                if (targetString && targetString != ""){
                    var repHtml = Modules.textController.matchTextTransSource(targetString);
                    if (cb && typeof cb == 'function') cb(repHtml);
                    return repHtml;
                } else {
                    var wrappers = Modules.commonMethod.getAllTargetNodes('[' + config.translateWrapper + ']');
                    console.log(_filter)
                    wrappers = _filter.call(wrappers,function (ele) {
                        return !ele[config.translateWrapper];
                    });
                    if (wrappers.length < 1) return;
                    wrappers.forEach(function (ele, i) {
                        var repHtml = Modules.textController.matchTextTransSource(ele.innerHTML);
                        ele.innerHTML = "";
                        ele[config.translateWrapper] = true;
                        ele.appendChild(Modules.textController.stringNodeTranslator(repHtml));
                    });
                    if (cb) cb();
                    return null;
                }
            }

        });

        /**--------------------------------------**/
        /**-------DOM元素、属性的操作、翻译模块------**/
        /**--------------------------------------**/

        __attr__extends(Modules.nodesController,{
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
             * 将html node对象转换成html字符串
             * @param node
             * @returns {string}
             */
            getNodeInnerHtmlString: function (node) {
                var div = root.document.createElement('div');
                div.appendChild(node);
                return div.innerHTML;
            },
            /**
             * 查询、翻译并注册DOM元素节点
             * @param range
             */
            selectTargetToRegTranslator: function (range) {
                var newTargets = [];
                rootConfig.namespaceCamp.forEach(function (n) {
                    __arry__extends(newTargets,Modules.commonMethod.getAllTargetNodes('[' + n + ']',range));
                });
                if (newTargets.length < 1) return;
                newTargets = newTargets.filter(function (ele) {
                    //去掉已注册过的元素
                    if (ele[config.elementRegisteredTagHead + main.namespace]) {
                        return false;
                    } else {
                        return true;
                    }
                });
                console.log(newTargets)
                newTargets.forEach(function (ele, i) {
                    //翻译当前域标签内容
                    var transSource = ele.getAttribute(main.namespace)
                    //验证当前是否已经注册了语言数据
                    if (main.currentLanguage && transSource) {
                        ele[config.elementMatchTagHead + main.namespace] = transSource;
                        ele.removeAttribute(main.namespace);
                        Modules.commonMethod.getTargetTranslation(transSource,ele);
                    }
                });
                newTargets = newTargets.filter(function (ele) {
                    //跨域注册并去掉非当前域的元素
                    var foreignSpace = [],flag = true;
                    rootConfig.namespaceCamp.forEach(function (n) {
                        if (n != main.namespace) foreignSpace.push(n);
                    });
                    foreignSpace.forEach(function (ns) {
                        var transSource = ele.getAttribute(ns);
                        if (transSource) {
                            var foreigner = rootConfig.scopesContainer[ns];
                            foreigner.registerElements(ele);
                            flag = false;
                        }
                    })
                    return flag;
                });
                //注册新的node节点
                Modules.nodesController.registerNodeList(newTargets);
            },
            /**
             * 将目标DOM对象注册到当前域中，并标示
             * @param TargetNodes
             */
            registerNodeList: function (TargetNodes) {
                TargetNodes.forEach(function (ele,i) {
                    ele[config.elementRegisteredTagHead + main.namespace] = true;
                });
                //需验证parent是否是合法Node节点
                __arry__extends(dataBank.nodeRegisteredList, TargetNodes);
            },
            /**
             * 独立调用注册翻译机，仅用作外部接口独立调用
             * @param ele
             */
            isolateTranslator: function (ele) {
                var transSource = ele.getAttribute(main.namespace)
                if (main.currentLanguage && transSource) {
                    ele[config.elementMatchTagHead + main.namespace] = transSource;
                    console.log(transSource)
                    ele.removeAttribute(main.namespace);
                    Modules.commonMethod.getTargetTranslation(transSource,ele);
                }
                Modules.nodesController.registerNodeList([ele]);
            }
        });

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
            stringSelectTargetToRegTranslator: function (str) {
                //创建新的node文档树
                var transStr = Modules.textController.innerTextCompiler(str),
                    frag = Modules.nodesController.getNodeFragment(transStr);
                Modules.nodesController.selectTargetToRegTranslator(frag);
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
            /**
             * 使用中切换语言
             * @param lang
             */
            switchTranslator: function (lang) {
                lang = lang.trim();
                Modules.commonMethod.setCurrentLang(lang, Modules.commonMethod.setCurrentLangData);
                //翻译每个需要翻译的DOM元素内容
                dataBank.nodeRegisteredList.forEach(function (ele, i) {
                    var transSource = dataBank.nodeRegisteredList[i][config.elementMatchTagHead + main.namespace];
                    Modules.commonMethod.getTargetTranslation(transSource,ele);
                    console.log(ele);
                })
            },
            /**
             * 初始化翻译处理
             */
            initTranslator: function () {
                //设置当前语言
                Modules.commonMethod.setCurrentLangData();
                Modules.nodesController.selectTargetToRegTranslator();
            },
            /**
             * 跨域调用接口
             * @param node element
             */
            foreignTranslator: function (node) {
                Modules.nodesController.isolateTranslator(node);
            }
        });


        //插件初始化//启动初始化函数
        //初始化编译所有翻译标签
        Modules.textController.innerTextCompiler();

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
            Modules.pluginInterface.registerLanguages(argus, Modules.pluginInterface.initTranslator);
            return main;
        };
        /**
         * //此方法用户切换语言
         * @param languageTag {String}传入要切换的语言标识
         */
        main.switch = function (languageTag) {
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
            Modules.pluginInterface.switchTranslator(languageTag);
        };
        /**
         * 此方法允许传入字符串或是html字符串，将返回绑定了语言的新的Node对象
         * @param htmlString
         * ！**注意**！：请不要将返回的Node对象转换成字符串添加到DOM结构中，这样会造成数据绑定失败！！！！！
         */
        main.nodeString = function (htmlString) {//返回
            return Modules.pluginInterface.stringSelectTargetToRegTranslator(htmlString);
        };
        /**
         * 外部独立注册新的元素
         * @param element
         */
        main.registerElements = function (element) {
            Modules.pluginInterface.foreignTranslator(element);
        };
        main.setRootScope = function (object) {

        }

        /**--------------------**/
        /********测试接口*********/
        /**--------------------**/
        /**
         * 用于获取当前域所有已注册的语言及数据
         * @returns {dataBank.allLanguagesData|{}}
         */
        // main.getAllLanguages = function () {
        //     return dataBank.allLanguagesData;
        // };
        // /**
        //  * 用于获取当前域所有已注册的DOM元素
        //  * @returns {Array}
        //  */
        // main.getElementRegistered = function () {
        //     return dataBank.nodeRegisteredList;
        // }
        // main.getRootConfig = function () {
        //     return rootConfig;
        // }
        // main.getScope = function () {
        //     return parseScopePath(main.windowPath);
        // }



        return main;
    };
    //expand prototype
    // i18n.prototype = {
    //     constructor: i18n,
    // };
    //注册作用域
    var registerNewScopeFunc = function (NI,CF) {
        var tmp = {};
        tmp[CF.namespace] = NI;
        //注册当前新的翻译作用域
        __attr__extends(rootConfig.scopesContainer,tmp);
    }
    //获取已注册作用域
    var useRegisteredNamespace = function (NS) {
        return rootConfig.scopesContainer[NS] ? rootConfig.scopesContainer[NS] : null;
    }
    //创建新的翻译作用域，并对新创建的作用域进行注册
    // var createNewI18n = function (config) {
    //     var newI18n = new i18n(config);
    //     registerNewScopeFunc(newI18n,config);
    //     return newI18n;
    // }
    //抛出全局接口
    var methods = {
        //创建新的翻译域
        create: function (config) {
            var newI18n = new i18n(config);
            registerNewScopeFunc(newI18n,config);
            return newI18n;
        },
        //使用已注册的翻译域
        use: function (namespace) {
            return useRegisteredNamespace(namespace);
        }
    }

    return methods;
})


