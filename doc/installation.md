# Installation and contribution

* [How to install the application]
* [How to contribute to the project]

[Back to main page](../README.md)

[How to install the application]:#Installation
<a name="Installation"></a>
## Installation

If you want to install the application on your own computer or server (in order to manage your own site or to improve the project), you are at the right place.

### Prerequisite

* NodeJs: https://nodejs.org/
* NPM: https://www.npmjs.com/

You can get help from these pages https://docs.npmjs.com/getting-started/installing-node
and https://github.com/nodejs/node/wiki

### Get code

This application needs a bunch of pre-requist components.

First of all, you need to get the code from Github

	git clone https://github.com/restimel/dependencyWatcher.git


After that you will have to get dependencies. Run the following command inside the git repository.

    npm install


### Run the application

You can now run the application with the following command:

    node main.js

This will start a server on port 8000. If you want to change port you can use command -p. To know all available commands use --help.

Then you can connect with your browser to:

	http://localhost:8000/index.html

By default it parses and watch the project itself. It would be more useful to parse your own project.

The parsing can be configured with configuration.json. To know more about configuration read [the configuration documentation](./configuration.md).


[How to contribute to the project]:#Contribution
<a name="Contribution"></a>
## Contribution

If you want to contribute.
First, thank you!

You'll need the code locally. So you can follow the steps described in the [installation section](#Installation).

All codes related to back-end (parsing and web-server) are stored in modules directory.
All codes related to front-end (displaying graph) are stored in pages directory.
