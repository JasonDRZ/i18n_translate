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
})(typeof window == 'object' ? window : this, function (root) {
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
        for (var p in b) if (b.hasOwnProperty(p)) a[p] = b[p];
    };
    //数组继承,将b继承到a中
    var __arry__extends = function (a, b) {
        if (b.length) {
            for (var p = 0; p < b.length; (a.push(b[p])),p++);
        }
        console.log(a)
    };
    //插件配置
    var config = {
        totalLangData: {},
        userSetLang: '',
        targetName: '',
        domList: [],
        domTransSourceName: '',//用来二次存取每个翻译Dom属性中的的原始翻译字段
    };
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

    //私有方法
    var setCurentLang = function (lang, cb) {
        config.userSetLang = lang;
        if (typeof cb == "function") cb();
    }
    var setCurentLangData = function () {
        i18n.prototype.language = config.totalLangData[config.userSetLang];
    };
    //查询翻译字段
    var getTranslate = function (keyStr) {
        var ak = keyStr.split('.');
        var tmp = i18n.prototype.language;
        for (var i in ak) {
            if (tmp[ak[i]]) tmp = tmp[ak[i]];
            else {
                console.log("["+keyStr+"] 未匹配到目标语言字段，请检查。");
                tmp = "Bad Translation!";
                break;
            }
        };
        return tmp;
    };
    //获取所有需要转换Dom节点，并转换成数组形式
    var getAllTargetNodes = function (parent) {
        //需验证parent是否是合法Node节点
        var nodesArr = Array.prototype.slice.call(parent.querySelectorAll('[' + config.targetName + ']'));
        return nodesArr;
    }
    var registerNodeList = function (TargetNodes) {
        //需验证parent是否是合法Node节点
        __arry__extends(config.domList,TargetNodes);
        console.log(config.domList)
    }
    var getNodeFragment = function (str) {
        var frag, range;
        //create range
        range = root.document.createRange();
        //make the parent of the body in the document becomes the context node
        range.selectNode(root.document.body);
        frag = range.createContextualFragment(str);
        return frag;
    }
    var getTextFragment = function (str) {
        var text;
        text = root.document.createTextNode(str);
        return text;
    }
    
    //字符串转译翻译机,输出字符串
    var stringTranslater = function (str) {
        console.log(str)
        var frag = getNodeFragment(str),
            div = root.document.createElement('div');
        div.appendChild(frag);
        console.log(div.innerHTML);
        return div.innerHTML;
    };
    //node节点注册型公用翻译机
    var nodeRegTranslater = function (range) {
        var newTargets = getAllTargetNodes(range);
        newTargets.forEach(function (ele, i) {
            var transSource = newTargets[i][config.domTransSourceName] = ele.getAttribute(config.targetName);
            ele.removeAttribute(config.targetName);
            ele.innerHTML = getTranslate(transSource);
        });
        //注册新的node节点
        registerNodeList(newTargets);
    }
    //字符串转译翻译机,输出Nodes节点
    var stringNodeTranslater = function (str) {
        //创建新的node文档树
        var frag = getNodeFragment(str);
        nodeRegTranslater(frag);
        return frag;
    }
    //初始化运行翻译机
    var initTranslater = function () {
        //设置当前语言
        setCurentLangData();
        nodeRegTranslater(document);
    };
    //后续运行翻译机
    var switchTranslater = function (lang) {
        setCurentLang(lang, setCurentLangData);
        //翻译每个需要翻译的DOM元素内容
        console.log(config.domList)
        config.domList.forEach(function (ele, i) {
            var transSource = config.domList[i][config.domTransSourceName];
            console.log(transSource)
            ele.innerHTML = getTranslate(transSource);
        })
    };
    //注册语言
    var registerLanguages = function (argue,cb) {
        if (argue.length == 1) {
            //初始化存储所有语言翻译数据
            if (typeof argue == 'object') __attr__extends(config.totalLangData,argue[0]);
            else try {
                argue = JSON.parse(argue[0]);
                __attr__extends(config.totalLangData,argue);
            } catch (e){
                console.log();
            };
        } else  if (argue.length == 2) {
            if (typeof argue[0] == 'string') {
                var tmp = {};
                tmp[argue[0]] = argue[1];
                __attr__extends(config.totalLangData,tmp);
            }
            else throw Error ("The [translation] parameters should be ([string],[object | JSON string ]) or ([object | JSON string]) !")
        }
        if (cb) cb();
    };
    //主函数
    var i18n = function (setting) {
        if (!setting) {
            throw Error("You must config 'Translate' plugin in your project.");
            return;
        }
        //初始化配置
        config.userSetLang = setting.default || root.navigator.language.toLowerCase();
        config.targetName = setting.AttributeName || 'translate';
        config.domTransSourceName = setting.dataBinder || 'langdata';
        //插件信息配置
        this.Name = 'Translate';
        this.Version = '1.1.0';
    };
    i18n.prototype = {
        constructor: i18n,
        language: null,
        translation: function () {
            registerLanguages(arguments,initTranslater);
            var watchInsert = onDomInsert(function (mutasion) {
                console.log(mutasion)
            });
            return this;
        },
        use: function (langStr) {//此方法用户切换语言
            if (typeof langStr != "string") {
                throw Error("To Translate 'use' function parameter must be a string！");
                return;
            }
            switchTranslater(langStr);
        },
        // domString: function (str) {
        //     return stringTranslater(str);
        // },
        domNodes: function (str) {//返回
            return stringNodeTranslater(str);
        }
    };
    return i18n;
})


