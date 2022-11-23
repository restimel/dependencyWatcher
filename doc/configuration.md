# Configuration

* [Configuration of config.json]
  * [Attributes]
  * [Configuration]
  * [Types]

[Back to main page](../README.md)

[Configuration of config.json]:#configurationJSON
<a name="configurationJSON"></a>
## Configuration of config.json

config.json is the main file to configure. It is a JSON which contains all information about what to parse and display.

It is located in the root folder of Dependency Watcher.


[Attributes]:#MainAttributes
<a name="MainAttributes"></a>
### Attributes


* **configuration** _([Configuration][])_: List of all configuration to parse part of the project. Each configuration can parse only a small chunk or the whole project. It is possible to parse the same code on different configuration (for example to display them differently).
The first one is used by default.

  example:
  ```json
  "configuration": [{
    "name": "backend",
    ...
  }, {
    "name": "frontend",
    ...
  }]
  ```

* **log** _(String)_ (optional): Path to logs all data.

  example:
  ```json
  "log": "trace.log"
  ```

* **logLevel** _(Number)_ (optional): Level to prompt logs

  _{ Warning: these values may change in a future version (to fit more what is usually done) }_
  * 0: *debug level* - display debug logs and following logs
  * 1: *trace level* - display trace logs and following logs
  * 2: *info level* - display info logs and following logs
  * 3: *warn level* - display warning logs and error logs
  * 4: *error level* - display only error logs
  * 5: *No Log* - no logs are displayed

  example:
  ```json
  "logLevel": 3
  ```

* **security** _([Security])_: Define security settings

  example:
  ```json
  "security": {
    "passwordFile": "password.txt",
    "maxStoreSalt": 10,
    "cert": "cert.pem",
    "key": "key.pem"
  }
  ```

[Configuration]:#ConfAttributes
<a name="ConfAttributes"></a>
### Configuration Attributes

Configuration defines what files or folder to parse, how to parse them and how then should be displayed.

You can read the [files analyze workflow](technical.md#workflow) to understand how these parameters are used.

* **name** _(string)_: The name of what is parsed inside this configuration. This name will be displayed in the GUI to choose among all configuration available.

  example:
  ```json
  "name": "Front-end - charts"
  ```

* **rootFolders** _(string[])_: The path of root directories which contains all files you want to parse. Path must be absolute or relative to where Dependency Watcher is running.

  example:
  ```json
  "rootFolders": ["scripts/", "modules/"]
  ```

* **fileFilter** _([List])_: Parse only files which match all given rules.

  example:
  ```json
  "fileFilter": {
    "whitelist": [{"pattern": "\\.js$"}],
    "blacklist": [{"pattern": "/node_mdules/"}, {"pattern": "temp.js"}]
  }
  ```

* **fileNameAdapter** _([Replace] [])_: Format the name of files to have a common pattern. It must stay unique in the whole project otherwise it will be considered as the same file. This must be used to avoid showing the real path of files and to consider as the same file path with different symbolic link. The source is the file path.

  example:
  ```json
  "fileNameAdapter": [{
    "matcher": {"pattern": ".*/(?:scripts|modules)/(.*)$"},
    "output": "$1"
  }]
  ```

* **fileLabelAdapter** _([Replace] [])_: Format the name of files to be more understandable by the user. The source is the file id (the result of fileNameAdapter).

  example:
  ```json
  "fileLabelAdapter": [{
    "matcher": {"pattern": ".*/([^/]+)$"},
    "output": "$1"
  }]
  ```

* **pathAdapter** _([Replace] [])_: Format the path of files in order to have the complete path but without showing every thing of your server architecture. The source is the file path.

  example:
  ```json
  "pathAdapter": [{
    "matcher": {"pattern": "^.*my-project/(.+)$"},
    "output": "$1"
  }]
  ```
  _To keep the whole full-path you can define: `"pattern": "^(.+)$"`_

* **requireMatcher** _([RequireRgxp] | [RequireString] [])_: Tell the parser what should be analysed to be considered as a dependency. The result $1 of the regexp must be the required file path.
It is possible to use _prettyOutput_ to format the result.

Instead of the object pattern which define a regexp, it is possible to use common pattern which are already set in the application (it is easier to configure and limit mistakes). Watch [RequireString] to know the full supported list of pre-configured pattern

  example:
  ```json
  "requireMatcher": [{"pattern": "require\\(['\"](.*?)['\"]\\)", "flags": "g"}, {"pattern": "define\\(\\[['\"](.*?)['\"]\\]\\)"}]
  ```

  example with pre-configured pattern:
  ```json
  "requireMatcher": ["requireJS", "ESmodule"]
  ```

_(it is possible to mix regexp pattern and pre-configured pattern)_


* **requireNameAdapter** _([Replace] [])_: Format the path got in requireMatcher to match unique file name. The source is the source code of the file.

  example:
  ```json
  "requireNameAdapter": [{
    "matcher": {"pattern": "^html!(.*)"},
    "output": "$1"
  }]
  ```
  _To transform strings like `html!toto.html` in `toto.html` (pattern used in requireJS)_

* **types** _([Type] [])_: set a type for given file. It helps to groups files in categories. The matcher will use the id of the file as source.

  example:
  ```json
  types: [{
    "name": "JS files",
    "matcher": {"pattern": "\\.js$"},
    "color": "#00FF00",
    "right": {
      "readFile": true,
      "writeFile": "password"
    }
  }, {
    "name": "HTML files",
    "macther": {"pattern": "\\.html?$"},
    "color": "#0000FF",

    "bgColor": "#CCFFFF",
    "rights": {
      "readFile": true,
      "writeFile": false
    },
    "language": "html"
  }]
  ```

[Types]:#Types
<a name="Types"></a>
### Types

[RegExp]:#RegExp
<a name="RegExp"></a>
* **RegExp**: describe a regexp
  * pattern _(string)_: the pattern to match.
  * flags _(string)_ (optional): flags to apply for this regexp ("gimy").
  * split _([RegExp])_ (optional): another regexp to apply on result to split it.
  * prettyOutput _([Replace])_ (optional): applied on result to modify it (to keep only some part or to add some other informations). _(only available for some Regexp)_

[Replace]:#Replace
<a name="Replace"></a>
* **Replace**: describe a replacements
  * matcher _([RegExp])_: If the input match this regexp, the replacement will be executed. (split and prettyOutput are ignored for this RegExp)
  * output _(string)_: the string which will replace the pattern.

[RequireRgxp]:#RequireRgxp
<a name="RequireRgxp"></a>
* **RequireRgxp**: describe a requirement _(it extends [RegExp])_
  * relativePath _(boolean)_ (default: `false`): If true `./` or `../` are estimated from the current file path. Otherwise the path is estimated as it is.

[RequireString]:#RequireString
<a name="RequireString"></a>
* **RequireString** _(string)_: Use a pre-configured pattern instead of RequireRgxp.
  * `"ES Module"`: The ES module relation system (see [MDN description](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import))
  * `"JS Module"`: _It is an alias of "ES module"_
  * `"commonJS"`: The main module relation system in NodeJS (see [Wikipedia definition](https://en.wikipedia.org/wiki/CommonJS))
  * `"AMD"`: (Asynchronous Module Definition) [wikipedia définition](https://en.wikipedia.org/wiki/Asynchronous_module_definition)
  * `"HTML"`: Get all text file linked to an HTML page (links from `<script>`, `<link>`, `<iframe>`, ...) but not (`<img>`, `<video>`, `<audio>`, ...)
  * `"HTML ressources"`: Get all ressources file from an HTML page (links from `<a>`, `<img>`, `<video>`, ...) but not (`<scrip>`, `<link>`, ...).
  _It does not support `<base>` tag._

[List]:#List
<a name="List"></a>
* **List**: describe a list of rules to accept or deny inputs.
  * whitelist _([RegExp] [])_: Accepts only input which match these rules.
  * blacklist _([RegExp] [])_: Deny all inputs which match these rules.

[Security]:#Security
<a name="Security"></a>
* **Security**: describe security settings
  * passwordFile _(string)_: The path of a file containing the password. If password is missing or if the file cannot be read, action requiring a password will be forbidden.

    example:
    ```json
    "passwordFile": "password.txt"
    ```
  * maxStoreSalt _(number)_: Define the maximum number of salt stored at the same time. Any salt asked when this number is reached will fail. See [security section]((securityWork.md)#Communication) for more details. (default value is 10)

    example:
    ```json
    "maxStoreSalt": 10
    ```
  * key _(string)_: Define the path of the `key` file. The path is relative to where the application is run. If defined with `cert` attribute, the connection will be done in HTTPS.

    example:
    ```json
    "key": "key.pem"
    ```
  * cert _(string)_: Define the path of the `certificate` file. The path is relative to where the application is run. If defined with `key` attribute, the connection will be done in HTTPS.

    example:
    ```json
    "cert": "cert.pem"
    ```

[Type]:#Type
<a name="Type"></a>
* **Type**: describe a type category
  * name _(string)_: the name of the category
  * matcher _([RegExp])_: If the input match this regexp, this category will be assign to it.
  * color _(string)_ (optional): describes how an item of this category would be displayed (text).
  * bgColor _(string)_ (optional): describes how the background of an item of this category would be displayed.
  * rights _([Rights])_ (optional): describes how files of this type can be manipulated.
  * language _(string_ (optional)): describes the file language for syntaxic color. If not defined, it tries to choose the best from the file extension.

[Rights]:#Rights
<a name="Rights"></a>
* **Right**: describe authorisation for reading files
  * readFile _([RightValue])_: Allow (or not) to watch code of files (default value is `false`)
  * writeFile _([RightValue])_: Allow (or not) to modify code of files (default value is `false`)

[RightValue]:#RightValue
<a name="RightValue"></a>
* **RightValue** _(string|boolean)_: It describes how to manage a right. The type of this attribute is not an object but either a boolean either a string.
  * _(boolean)_: If `true`, the action is always authorized. If `false`, the action is always forbiden
  * _(string)_: describes what todo.
    * "password": user must enter the password to perform the action.


[Back to main page](../README.md)