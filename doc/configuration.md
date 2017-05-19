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

[Configuration]:#ConfAttributes
<a name="ConfAttributes"></a>
### Configuration Attributes

Configuration defines what files or folder to parse, how to parse them and how then should be displayed.

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

* **fileNameAdapter** _([Replace] [])_: Format the name of files to be more understandable. It must stay unique in the whole project otherwise it will be considered as the same file.
  example:
  ```json
  "fileNameAdapter": [{
    "matcher": {"pattern": ".*/(?:scripts|modules)/(.*)$"},
    "output": "$1"
  }]
  ```

* **types** _([Type] [])_: set a type for given file. It helps to groups files in categories.
  example:
  ```json
  types: [{
    "name": "JS files",
    "matcher": {"pattern": "\\.js$"},
    "color": "green"
  }, {
    "name": "HTML files",
    "macther": {"pattern": "\\.html$"},
    "color": "blue"
  }]
  ```

* **requireMatcher** _([RegExp] [])_: Tell the parser what should be analysed to be considered as a dependency. The result $1 of the regexp must be the required file path.
  example:
  ```json
  "requireMatcher": [{"pattern": "require\\(['\"](.*?)['\"]\\)", "flags": "g"}, {"pattern": "define\\(\\[['\"](.*?)['\"]\\]\\)"}]
  ```

* **requireNameAdapter** _([Replace] [])_: Format the path got in requireMatcher to match unique file name.
  example:
  ```json
  "requireNameAdapter": [{
    "matcher": {"pattern": "^html!(.*)"},
    "output": "$1"
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
  * split _(RegExp)_ (optional): another regexp to apply on result to split it.

[Replace]:#Replace
<a name="Replace"></a>
* **Replace**: describe a replacements
  * matcher _([RegExp])_: If the input match this regexp, the replacement will be executed.
  * output _(string)_: the string which will replace the pattern.

[List]:#List
<a name="List"></a>
* **List**: describe a list of rules to accept or deny inputs.
  * whitelist _([RegExp] [])_: Accepts only input which match these rules.
  * blacklist _([RegExp] [])_: Deny all inputs which match these rules.

[Type]:#Type
<a name="Type"></a>
* **Type**: describe a type category
  * name _(string)_: the name of the category
  * matcher _([RegExp])_: If the input match this regexp, this category will be assign to it.
  * color _(string)_: describes how an item of this category would be displayed.

