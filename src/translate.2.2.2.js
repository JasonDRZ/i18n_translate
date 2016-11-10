/**
 * Created by JasonD on 16/10/14.
 * 此版本并未对对CommonJS和RequireJS做全功能适配，在模块化开发中需要做更多操作来适配所有新的功能
 */
;(function (factory) {
    'use strict'
    //适配CommonJS 的export模块化工作机制
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {//适配require.js模块开发
        define(function () {
            return factory();
        });
    } else {
        window.Translate = factory();
    }
})(function () {
    /**--------------------**/
    /********根域方法集*********/
    /**--------------------**/
    /**
     * 原型继承
     * @type {any} [参数1]将继承[参数2]的所有属性及原型方法
     * @private
     */
    var __proto__extends = (window && window.__extends) || function (d, b) {
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
        deleteValue = deleteValue ? deleteValue : '';
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {
                this.splice(i, 1);//返回指定的元素
                i--;
            }
        }
        return this;
    };
    //返回去掉空格的字符串
    String.prototype.cleanSpace = function () {
        return this.replace(/\s/g,'');
    }
    //用于提供IE对querySelectorAll和querySelector的支持
    if (!window.document.querySelectorAll) {
        window.document.querySelectorAll = function (selectors) {
            var style = window.document.createElement('style'), elements = [], element;
            window.document.documentElement.firstChild.appendChild(style);
            window.document._qsa = [];

            style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
            window.scrollBy(0, 0);
            style.parentNode.removeChild(style);

            while (window.document._qsa.length) {
                element = window.document._qsa.shift();
                element.style.removeAttribute('x-qsa');
                elements.push(element);
            }
            window.document._qsa = null;
            return elements;
        };
    };

    if (!window.document.querySelector) {
        window.document.querySelector = function (selectors) {
            var elements = window.document.querySelectorAll(selectors);
            return (elements.length) ? elements[0] : null;
        };
    };

    /**--------------------**/
    /********根域配置*********/
    /**--------------------**/
    var rootConfig = {
        //用于存储所有注册的命名空间函数调用栈
        NSWarehouse: {
            //'namespace name': 'namespace Object'
        },
        //已注册的命名空间名称字符串的集合
        NSNameCamp: [],
        //操作配置
        elementMatchTagHead: 'TransMatch_',//用来二次存取每个翻译Dom属性中的的原始翻译字段
        elementRegisteredTagHead: 'TransRegistered_',
        translateTextTag: {'begin': '@{', 'end': '}'},
        translateWrapper: 'multi-translation',//指定需要进行innerText翻译的域标签名
        translateWrapperHandleFlag: 'wrapperHandled',//用于标识语言转换块是否已被处理
        attributeNamespaceHead: 'i18n-'//用在元素属性开头标识符
    };

    /**--------------------**/
    /********函数主体*********/
    /**--------------------**/
    var i18n = function (TSetting) {
        var self = this;
        /**
         * 检测实例化条件是否满足
         */
        if (!TSetting || (TSetting && !TSetting["defaultLanguage"]) || (TSetting && !TSetting["namespace"])) {
            throw Error("You must config 'Translate' at least two of Attrs {defaultLanguage: String,namespace: String} in your project.");
            return;
        } else if (!self instanceof i18n) return new i18n(TSetting);
        /**--------------------**/
        /********功能配置*********/
        /**--------------------**/

        //当前插件域配置
        self.Name = 'Translate';//插件名称
        self.Version = '1.1.0';//插件版本
        self.currentLanguageData = null;
        self.currentLanguageTag = TSetting["defaultLanguage"];
        self.namespace = TSetting["namespace"];//用来标示当前Translation实例化之后赋值的对象，须从window下的对象开始
        self.defaultNS = 'default';

        //创建内存缓存库
        var dataBank = {
            allLanguagesData: {},//当前域中所有已注册的语言数据
            allLanguagesMarks: [],//存储所有已注册的的语言标识
            nodeRegisteredList: []//存储所有生成注册的DOM元素
        };
        var config = {
            transitionsBeenSet: false
        }
        //注册当前域,并检测是否已被注册过
        if (rootConfig.NSNameCamp.join(",").indexOf(self.namespace) == -1) {
            __arry__extends(rootConfig.NSNameCamp,[self.namespace]);
        } else {
            throw Error ("The namespace ["+self.namespace+"] has already been registered,can not be used again!")
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
                parent = parent ? parent : window.document;
                return _slice.call(parent.querySelectorAll(queryStr));
            },
            /**
             * 根据提供的match字符串，从翻译数据中获取对应的翻译字符串值
             * @param matchString
             * @return {*}
             */
            translateMachine: function (matchString) {
                //检查是否存在当前注册的语言
                var tmp = self.currentLanguageData === null
                        ? Modules.commonMethod.setCurrentLangData()
                        : self.currentLanguageData,
                    ak = matchString.split('.');
                ak.clean("");
                if (ak.length < 1) {
                    return "{{Bad Translation!}}";
                }
                for (var i = 0; i < ak.length; i++) {
                    if (tmp[ak[i]]) tmp = tmp[ak[i]];
                    else {
                        console.log(tmp);
                        console.log("未在{"+self.namespace+"}翻译域中匹配到[" + matchString + "] 的对应字段，请检查。");
                        tmp = "{{Bad Translation!}}";
                        break;
                    }
                };
                return tmp;
            },
            /**
             * 检测翻译标签是否存在附加属性，如有附加则将对应翻译作用于附加属性对应的元素标签属性。
             * 如不存在附加属性，默认替换元素的innerHTML值
             * @param block
             * @param element
             */
            switchAttrOrText: function (block,element) {
                var seg = block.split('|'),
                    translationText = Modules.commonMethod.translateMachine(seg[0]);
                if (seg.length > 1) {//用于操作属性值
                    var attrs = seg,i=0;
                    //去掉matchString
                    attrs.shift();
                    for (;i<attrs.length;i++){
                        if (attrs[i] === 'html') {
                            element.innerHTML = translationText;
                        } else {
                            element.setAttribute(attrs[i],translationText);
                        }
                    }
                } else {//用于替换innerHTML值
                    element.innerHTML = translationText;
                }
            },
            /**
             * 获取对应字符串中的翻译字符组，返回一个数组
             * @param matches 支持匹配式字符串或是字典字符串数组
             * @return matchArr
             */
            matchTranslateStr: function (matches,ele) {
                var matchArr = [];
                if (typeof matches === 'string') {
                    //去空格
                    matches = matches.cleanSpace();
                    if (!matches) return;
                    //在元素对应namespace属性值中查找块，支持{}包围的块，或使用','隔开的块
                    var block = matches.match(/\{.*?\}/g);
                    matchArr = matches.replace(/\{.*?\}/g,'').split(',').clean();
                    block && block.forEach(function (b) {
                        matchArr.push(b.match(/\{(.+\S?)\}/)[1]);
                    });
                } else if (matches instanceof Array) matchArr = matches;
                else return [];
                //将Match数组储存到当前元素上
                ele[rootConfig.elementMatchTagHead + self.namespace] = matchArr;
                //去掉当前带有命名空间的元素属性
                ele.removeAttribute(self.namespace);
                return matchArr;
            },
            /**
             * 通过解析字段获取当前语言数据中对应的值
             * @param matches 用于解析的素组或是去掉包裹的
             * @returns {String} 返回查询到的字符串值
             *
             */
            getTargetTranslation: function (matches,element) {
                //如果matches为数组则遍历
                if (matches instanceof Array && matches.length != 0) matches.forEach(function (s) {
                    Modules.commonMethod.switchAttrOrText(s,element);
                })
                else if (typeof matchs == "string"){
                    Modules.commonMethod.switchAttrOrText(matches,element);
                }
            },
            /**
             * 设置并返回当前语言数据
             * @returns {currentLanguageData}
             */
            setCurrentLangData: function () {
                return self.currentLanguageData = dataBank.allLanguagesData[self.currentLanguageTag];
            },
            /**
             * 设置变更语言标识
             * @param lang
             * @param cb
             */
            setCurrentLang: function (lang, cb) {
                self.currentLanguageTag = self.currentLanguageTag = lang;
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
                return new RegExp(rootConfig.translateTextTag.begin + rule + rootConfig.translateTextTag.end, options)
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
                var b = window.document.createElement('b');
                b.setAttribute(rootConfig.attributeNamespaceHead + attrName, pathString);
                if (rootConfig.NSNameCamp.join(",").indexOf(attrName) == -1){
                    console.log("Namespace ["+attrName+"] has not been registered yet!");
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
                    s = s[1].cleanSpace();
                    if (s.indexOf('|') != -1) {
                        var sa = s.split('|');
                        //支持第一个参数
                        replacement = Modules.nodesController.getNodeInnerHtmlString(
                            Modules.textController.createBLabel(sa[1],sa[0])
                        );
                    } else {
                        //默认为当前命名空间
                        replacement = Modules.nodesController.getNodeInnerHtmlString(
                            Modules.textController.createBLabel(self.defaultNS,s)
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
                //如果是有目标字符串，则从字符串中查询目标元素结构并返回
                if (targetString && targetString != ""){
                    var repHtml = Modules.textController.matchTextTransSource(targetString);
                    if (cb && typeof cb == 'function') cb(repHtml);
                    return repHtml;
                } else {
                    //如果未指定查询字符串，则在document上下文查找所有被属性为config.translateWrapper包裹的块元素
                    var wrappers = window.document.getElementsByTagName(rootConfig.translateWrapper);
                    //筛选掉已经被标记的包裹块
                    console.log(wrappers)
                    wrappers = _filter.call(wrappers,function (ele) {
                        return !ele[rootConfig.translateWrapperHandleFlag];
                    });
                    if (wrappers.length < 1) return;
                    wrappers.forEach(function (ele, i) {
                        //标记并转换翻译元素
                        var repHtml = Modules.textController.matchTextTransSource(ele.innerHTML);
                        ele.innerHTML = "";
                        ele[rootConfig.translateWrapperHandleFlag] = true;
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
                frame = window.document.getElementById('frame_range');
                if (frame === null) {
                    frame = window.document.createElement('iframe');
                    frame.setAttribute('id','frame_range');
                    frame.setAttribute("style","display: none;");
                    window.document.body.appendChild(frame);
                };
                range = window.document.createRange();
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
                var div = window.document.createElement('div');
                div.appendChild(node);
                return div.innerHTML;
            },
            /**
             * 获取目标元素属性，并删除暂存后的属性
             * @param ele
             * @return {string}
             */
            getElementNSMatches: function (ele) {
                var matches = '';
                matches = ele.getAttribute(rootConfig.attributeNamespaceHead + self.namespace);
                //去掉属性
                console.log("GET MATCHES")
                console.log(matches)
                if (matches !== null) {
                    console.log("删除属性")
                    ele.removeAttribute(rootConfig.attributeNamespaceHead + self.namespace);
                }
                return matches;
            },
            /**
             * 查询、翻译并注册DOM元素节点
             * @param range
             */
            selectTargetToRegTranslator: function (range) {
                var newTargets = [];
                rootConfig.NSNameCamp.forEach(function (n) {
                    __arry__extends(newTargets,Modules.commonMethod.getAllTargetNodes('[' + rootConfig.attributeNamespaceHead + n + ']',range));
                });
                newTargets = newTargets.filter(function (ele) {
                    //跨域注册并去掉非当前域的元素
                    var i = 0,flag = false;
                    for (;i < rootConfig.NSNameCamp.length; i ++ ){
                        var n = rootConfig.NSNameCamp[i];
                        if (!ele[rootConfig.elementRegisteredTagHead + n]) {
                            if (n === self.namespace) {
                                //筛选未被当前域注册的元素进行翻译注册
                                var transSource = Modules.nodesController.getElementNSMatches(ele);
                                //验证当前是否已经注册了语言数据
                                if (self.currentLanguageData && transSource !== null) {
                                    transSource = Modules.commonMethod.matchTranslateStr(transSource,ele);
                                    Modules.commonMethod.getTargetTranslation(transSource,ele);
                                }
                                //只要存在，则注册
                                flag = true;
                            } else {
                                //获取外部域的函数集
                                var foreigner = rootConfig.NSWarehouse[n];
                                foreigner.registerElement(ele);
                            }
                        }
                    }
                    return flag;
                });
                if (newTargets.length == 0) return;
                //注册新的node节点
                Modules.nodesController.registerNodeList(newTargets);
            },
            /**
             * 将目标DOM对象注册到当前域中，并标示
             * @param TargetNodes
             */
            registerNodeList: function (TargetNodes) {
                TargetNodes.forEach(function (ele,i) {
                    ele[rootConfig.elementRegisteredTagHead + self.namespace] = true;
                });
                console.log(TargetNodes)
                //需验证parent是否是合法Node节点
                __arry__extends(dataBank.nodeRegisteredList, TargetNodes);
            },
            /**
             * 独立调用注册翻译机，仅用作外部接口独立调用
             * @param ele
             */
            isolateTranslator: function (ele,matches) {
                var transSourceArr = [];
                if (self.currentLanguageData) {
                    var transSource = Modules.nodesController.getElementNSMatches(ele);
                    console.log(ele)
                    console.log(self.namespace)
                    if (transSource)
                    //将属性字符串转成Match数组
                        __arry__extends(transSourceArr,Modules.commonMethod.matchTranslateStr(transSource,ele));
                    if (matches)
                        __arry__extends(transSourceArr,Modules.commonMethod.matchTranslateStr(matches,ele));
                    //调用翻译验证函数
                    Modules.commonMethod.getTargetTranslation(transSourceArr,ele);
                }
                //注册元素
                Modules.nodesController.registerNodeList([ele]);
                return ele;
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
                    var transSource = dataBank.nodeRegisteredList[i][rootConfig.elementMatchTagHead + self.namespace];
                    console.log(transSource)
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
        self.translations = function () {
            //如果此方法没被使用过
            if (!!!config.transitionsBeenSet) {
                if (arguments.length < 1) return self;
                var argus = arguments;
                //初始化函数
                Modules.pluginInterface.registerLanguages(argus, Modules.pluginInterface.initTranslator);
                config.transitionsBeenSet = true;
            } else {
                console.log("The [transitions] method can not be used twice!")
            }
            return self;
        };
        /**
         * //此方法用户切换语言
         * @param languageTag {String}传入要切换的语言标识
         */
        self.switch = function (languageTag) {
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
            //检测当前语言是否与切换语言相通
            if (languageTag === self.currentLanguageTag) return;
            //调用内部方法
            Modules.pluginInterface.switchTranslator(languageTag);
        };
        /**
         * 此方法允许传入字符串或是html字符串，将返回绑定了语言的新的Node对象
         * @param htmlString
         * ！**注意**！：请不要将返回的Node对象转换成字符串添加到DOM结构中，这样会造成数据绑定失败！！！！！
         */
        self.nodeString = function (htmlString) {//返回
            return Modules.pluginInterface.stringSelectTargetToRegTranslator(htmlString);
        };
        /**
         * 外部独立注册新的元素
         * @param element DOM Element
         * @param matches ['a.a_a | ns1','a.a_b.a_b_a | ns2'] 或是 ''
         */
        self.registerElement = function (element,matches) {
            return Modules.nodesController.isolateTranslator(element,matches);
        };

        /**--------------------**/
        /********测试接口*********/
        /**--------------------**/
        /**
         * 用于获取当前域所有已注册的语言及数据
         * @returns {dataBank.allLanguagesData|{}}
         */
        // self.getAllLanguages = function () {
        //     return dataBank.allLanguagesData;
        // };
        // /**
        //  * 用于获取当前域所有已注册的DOM元素
        //  * @returns {Array}
        //  */
        // self.getElementRegistered = function () {
        //     return dataBank.nodeRegisteredList;
        // }
        // self.getRootConfig = function () {
        //     return rootConfig;
        // }
        // self.getScope = function () {
        //     return parseScopePath(self.windowPath);
        // }



        return self;
    };
    //注册作用域
    var registerNewScopeFunc = function (NI,CF) {
        var tmp = {};
        tmp[CF.namespace] = NI;
        //注册当前新的翻译作用域
        __attr__extends(rootConfig.NSWarehouse,tmp);
    }
    //获取已注册作用域
    var useRegisteredNamespace = function (NS) {
        return rootConfig.NSWarehouse[NS]
            ? rootConfig.NSWarehouse[NS]
            : (console.log("Can not find a namespace like [" +NS+ "]!")),null;
    }
    //抛出全局接口
    var methods = {
        //创建新的翻译域
        /**
         * 创建一个新的翻译命名空间
         * @param {Object} config
         * @example {default: 'zh',namespace: 'namespace_one'} config
         * @return {i18n} => Function
         */
        createNamespace: function (config) {
            var newI18n = new i18n(config);
            registerNewScopeFunc(newI18n,config);
            return newI18n;
        },
        //使用已注册的翻译域
        /**
         * 使用一个已经注册过的翻译命名空间
         * @param namespace => Namespace String: 'namespace_one'
         */
        use: function (namespace) {
            return useRegisteredNamespace(namespace);
        }
    }

    return methods;
})


