# Dependency Watcher

Watch relationship of your project files.

## Purpose

This tool is for anyone who would like to watch file dependencies inside projects.
It parses directories to find all files and keeps track of their dependencies.
It displays them in a chart and allow to see child and parent dependencies of a file.

## License

This project is under the [MIT License](LICENSE).

## Technology

This project uses NodeJS to parse files and creates a web server.
The display is done by an interactive HTML page.

Rendering and interaction are done with VueJs (currently under developpement use index2.html to use this version).

## More information

Please follow any of these links to have more information about what you look for:

* User manual
	* Usage overview
* Technical details
	* [Local installation and contribution](doc/installation.md)
	* [Configuration](doc/configuration.md)
	* [Technical overview](doc/technical.md)
	* [Security management](doc/securityWork.md)
	* Translations

## Main features

* Interactive chart to watch relationship of a file.
* Configurable to any kind of dependencies (watch [Configuration](doc/configuration.md) to see how to configure it).
* Filtering and grouping feature to analyze only what you want.
* Support very large project (tested on projects with more than 5000 files).
* Support different projects with the same interface.
* Read and write source file directly into the application (if configuration allows it).

## Compatibility

It uses ES6 features, so it works only with modern browsers (Chrome, Firefox, Opera, ...).
