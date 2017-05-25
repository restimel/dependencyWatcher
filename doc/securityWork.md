# Security workflow

* [Explanation]
  * [whyExposed]
  * [whySecurity]
* [Communication]
* [Storage]

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

[Secure communication between front-end and back-end]:#Communication
<a name="Communication"></a>
## Secure communication between front-end and back-end

TODO

[Password storage]:#Storage
<a name="Storage"></a>
## Password storage
### Stored in file

TO WRITE

### Stored in sessionStorage

TO WRITE