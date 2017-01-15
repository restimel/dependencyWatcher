# Installation and contribution

* [How to install the application]
* [How to contribute to the project]

[Back to main page](../README.md)

[How to install the application]:#Installation
<a name="Installation"></a>
## Installation

If you want to install the application on your own computer or server (in order to manage your own site or to improve the project), you are at the right place.

This application needs a bunch of pre-requist components.

First of all, you need to get the code from Github

	git clone https://github.com/restimel/dependencyWatcher.git


To get started, you’ll need node and npm installed on your computer (https://github.com/nodejs/node/wiki).

You also have to install gulp (which is used to build the project).

	npm install gulp -g

Finally, move to the root of the Dependency Watcher project and run the command:

	npm run build

This command will download all required dependencies and will build the files.

You can now run the application. You only have to connect with a browser to the file index.html.

As this application uses worker technollogy and some browser forbid them locally, you may have to run a local server. If you want you can start the one embed in utils.

	./utils/web-server.js

then you can connect to:

	http://localhost:8000/index.html


[How to contribute to the project]:#Contribution
<a name="Contribution"></a>
## Contribution

If you want to contribute.
First, thank you!

You'll need the code locally. So you can follow the steps described in the installation section.

Instead of only building the project, it may be more efficient to use another command to watch your changes and build the files automatically.

There are 2 helpfull commands
The first one add sourcemaps to code and does not minified files. It will help you to debug the code like you see it in files.

	npm run debug

The second one does not build sourcemaps but it will minified the files. It look likes the production version except that it rebuilds any time you change a source file.

	npm run js


You can run the same commands directly with gulp, but the ones with npm run will update your package if there are any changes.
