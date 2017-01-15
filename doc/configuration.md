# Configuration

* [Configuration of config.json]
  * [Attributes]
  * [Types]

[Back to main page](../README.md)

[Configuration of config.json]:#configurationJSON
<a name="configurationJSON"></a>
## Configuration of config.json

config.json is the main file to configure. It is a JSON which contains all information about what to parse and display.

It is located in the root folder of Dependency Watcher.

[Attributes]:#Attributes
<a name="Attributes"></a>
### Attributes

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
  "requireMatcher": [{"pattern": "require\\(['\"](.*?)['\"]\\)"}, {"pattern": "define\\(\\[['\"](.*)['\"]\\]\\)"}]
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
  * flags _(string)_: flags to apply for this regexp ("gimy").

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

