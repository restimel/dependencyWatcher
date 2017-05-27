# Security workflow

* [Lets talk]
  * [Why security workflow is exposed?]
  * [Why do we need security?]
* [Communication between front-end and back-end]
* [Password storage]

[Back to main page](../README.md)

[Lets talk]:#Explanation
<a name="Explanation"></a>
## Lets talk first

[Why security workflow is exposed?]:#whyExposed
<a name="whyExposed"></a>
### Why security workflow is exposed?

When we speak about security some people think that hidden their security process is the good way to do. But I don't think so! In these lines I explain why:

  1. This project is open-source so anyone is able to read the code and know how the security system works.
  2. By writing these explanations, more people would be aware about security and we can talk more easily about any security hole and fix it.

[Why do we need security?]:#whySecurity
<a name="whySecurity"></a>
### Why do we need security?

In this project, there are some feature that can be a threat if someone else use it. This is why some feature can be protected.
As this project starts a web-server, anyone knowing on which port the project is run can access it.

Here are features which can be protected:

* Reading a file to watch its code (readFile): For some people, source code are private and it should not be accessible by anybody else.
* Modifying code of a file (writeFile): It modifies files directly on your drive. This feature must be enabled with great wariness.

[Communication between front-end and back-end]:#Communication
<a name="Communication"></a>
## Secure communication between front-end and back-end

There are 2 thing to protect:
* The possibility of malvious user to read the code from the application.
* The possibility of anyone on the network to read data into package.

### Untrusted user should not read the code

In the current project there are no sessions. So anyone who is able to connect to the web application is able to see the project architecture. This is a choice from start. This can be changed in a future version, but not now.
So in order to limit access to some features, the password must be asked task by task.

The front-end must ask for a challenge. A salt is returned by server. Only 10 salt can be created at the same time (this limitation is done to avoid flooding server with too many requests). It is possible to change this limit in configuration.json.
Front-end compute this salt with the password and create a challenge token.
The restricted request is then sent with the challenge token.
Back-end compare the challenge token with its own computation, if it matches, the salt is removed from the store (so no other request can be done with this challenge) and the operation is proccessed.

Salt are removed after a timeout delay if they are not used.


### Assert you are the one to read the given data

When requesting sensible data, we must encrypt data on network to ensure that no one between browser and web-server is able to read the data.
A good way should be to use a https connection. I wouldn't go so far by now (mainly to generate valid certificates).

As a common password is already known by both side, this password is used as key to cipher communication (symmetric-key algorithm). An AES-CTR algorithm has been chosen.

So communication cannot be understood by someone who ignore the password.



[Password storage]:#Storage
<a name="Storage"></a>
## Password storage
### Stored in file

The password is stored in a file. The path of this file can be configured via attribute `password` in configuration.json file.

Inside a file it is easier, to keep the same password when restarting the application. And out of configuration to avoid sending it by mistake.

There is no length restriction (but keep in mind that you should enter it in browser).

As the password is readable from this file, keep this file safe.

### Stored in sessionStorage

Any time a feature requiring a passowrd is perform, the application will use the password. To avoid requesting the password all the time to the user, it is stored in sessionStorage.
So the password is asked to user when sessionStorage does not know it, or if the password have expired (it failed to a challenge).

Anytime the page is no more loaded in browser, sessionStorage clear all its values. So password is not always kept in browser and will be asked every time the application page is restarted in the browser.
