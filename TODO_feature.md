# Features

## This is plan and must be done:

* Search tile → display graph from it
    * change code display
* Display graph starting from file
* show manager
    * In details hide non visible items (and add a 'X items are hidden' to show them)
    * show hide from graph
* configuration tab (do not center, credits, ...)
* Read file
    * Security (limit access)
        * Create cipher communication (https://github.com/ricmoo/aes-js)
        * hash password in sessionStorage
    * Edit file on server

## This has been done

* use argParser
* Find tile → bring in to view
* highlight dependencies
* allow to change configuration (to display different graph)
* Find a file from its type
* Fit zoom to see all fileBox
* Color filebox depending of types
    * allow to change color online
* show manager
    * hide a filebox +show
    * hide files with wildcards: "*.html"
    * hide all file of a type
    * hide/show child file
    * show parent files
* Read file
    * Ace
    * Security (limit access)
        * Ask and build challenge

# Bugs

* links on backward dep are glitchy display at start
