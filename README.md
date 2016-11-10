# i18n_translate
An independent i18n translation plugin for JS front-end  building work.

## DEMO
[Translate DEMO](http://example.com)

## 接口

### 主函数 Translate
- Translate.createNamespace()函数用于创建新的命名空间
    
    ```
    //示例：
    var namespace_one = Translate.createNamespace({
        namespace: "namespace-one",///新的名称(namespace不能重复)
        defaultLanguage: 'en'///默认初始的语言标识
    });
    //Translate.createNamespace()函数将返回一个 "i18n" 对象。
    
    ```


- Translate.use()函数用于调用已经注册过的命名空间
    ```
    //示例：
    var namespace_one = Translate.use(
        "namespace-one"///注册过的namespace名称字符串
    );
    //Translate.use()函数同样返回该命名空间的i18n对象。
    ```
    
### i18n对象
- i18n.translations(languageDataObject | languageDataJSONString)方法用于注册所有的翻译数据
  
 > **（注意：同一个命名空间对象只能调用一次，第二次调用将不会生效！）**

    ```
    //示例一（翻译数据对象）：
    namespace_one.translations({
                'en':{
                    'BOOK_ONE':{
                        'NAME': "HTML5 Authority Guidelines"
                    },
                    'BOOK_TWO':{
                        'NAME': "Javascript Authority Guidelines"
                    }
                },
                'cn':{
                    'BOOK_ONE':{
                        'NAME': "HTML5权威指南"
                    },
                    'BOOK_TWO':{
                        'NAME': "Javascript权威指南"
                    }
                }
            })；
            
    //示例二（翻译数据JSON字符串）：
    namespace_one.translations("{'en':{'BOOK_ONE':{'NAME': "HTML5 Authority Guidelines"},'BOOK_TWO':{'NAME': "Javascript Authority Guidelines"}},'cn':{'BOOK_ONE':{'NAME': "HTML5权威指南"},'BOOK_TWO':{'NAME': "Javascript权威指南"}}}")；
    
    //示例三（在名称空间初始化时，直接调用）：
    var namespace_one = Translate.createNamespace({
        namespace: "namespace-one",///新的名称(namespace不能重复)
        defaultLanguage: 'en'///默认初始的语言标识
    }).translations({
                'en':{
                    'BOOK_ONE':{
                        'NAME': "HTML5 Authority Guidelines"
                    },
                    'BOOK_TWO':{
                        'NAME': "Javascript Authority Guidelines"
                    }
                },
                'cn':{
                    'BOOK_ONE':{
                        'NAME': "HTML5权威指南"
                    },
                    'BOOK_TWO':{
                        'NAME': "Javascript权威指南"
                    }
                }
            })；
    ```
- i18n.switch(languageTagString)用于语言的切换，传入参数为标识字符。

    ```
    //示例：
    namespace_one.switch("en")
    ```
- i18n.nodeString(htmlString)用于将需要翻译的html字符串转换成DOM元素。

    ```
    //示例：
    //插入的html可以使用其他已注册是命名空间转换方法
    var tmp = '<h3 i18n-namespace-one="BOOK_TWO.NCLASS | class">' +
                    '@{BOOK_TWO.NAME | namespace-one} ' +
                    '<span i18n-namespace-one="BOOK_TWO.VCLASS | class">@{BOOK_TWO.VERSION | namespace-two}</span>' +
                    '@{BOOK_ONE.NAME | namespace-two} ' +
                    '<span i18n-namespace-two="BOOK_ONE.VCLASS | class">@{BOOK_ONE.VERSION | namespace-two}</span> </h3>';
            var insertBox = document.getElementById('append_demo');
            insertBox.appendChild(namespace_one.nodeString(tmp));
    ```

- i18n.registerElement(element,matches)用于注册单个DOM元素对象，第一个参数为目标DOM对象，第二个参数为对应的翻译keymap字符串。
     
    ```
    //示例：
    //元素中存在的翻译属性同样会被注册
    <h3 i18n-namespace-two="BOOK_ONE.NCLASS | class" id="new_ele"><h3>
    
    var newEle = document.getElementById('new_ele');
    <!--matches逗号分隔-->
    namespace_one.registerElement(newEle,'BOOK_ONE.NAME,BOOK_TWO.VCLASS | class');
    <!--matches {}包裹分隔-->
    namespace_one.registerElement(newEle,'{BOOK_ONE.NAME}{BOOK_TWO.VCLASS | class}');
    <!--matches数组-->
    namespace_one.registerElement(newEle,['BOOK_ONE.NAME','BOOK_TWO.VCLASS | class']);
    namespace_two.registerElement(newEle,'BOOK_ONE.NAME,BOOK_TWO.VCLASS | class');
    ```
