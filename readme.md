# TECH YOUTUBE

This is a youtube instance using MERN STACK

Discussion about http(Hyper text transfer language)

In HTTP clear data is sent to server by client

## what are HTTP headers?

- These are metadata, key-value sent along with request and response

- request headers = from client
- response headers = from server
- representation headers = enconding/compression
- payload headers = data

### Most common headers 

Most Common Headers

- accept : What type of data is accepted mostly on server,i.e application/json
- user-agent : From which application request is coming like postman
- authorization : bearer ____ token is send in JWT style for authorization
- content-type : what type content image,video,data etc
- cookie : key value pair {} which holds till what time cookie available, what cokkie etc
- cache-control : when to expire data

Cors

- access control allow origin
- access control allow credentials
- access control allow method

security

- cross origin embedder policy
- cross origin opener policy
- content security policy


# HTTP methods

Basic set of operations that can be used to interact with server

- GET : retrieve a resource like i send a request to give me all users

- POST : interact with resource, mostly add some values

- HEAD : No message body, response headers only

- OPTION : what operations are available, like post get etc

- TRACE : loopback test(get some data), to get from which proxy data is coming

- DELETE : remove a resource

- PUT : replace a resource

- PATCH : change part of resource

# HTTP status code

- 1xx Informational
- 2xx success
- 3xx redirection
- 4xx client error
- 5xx server error
# 
- 100 = continue
- 102 = processing
- 200 = ok
- 201 = created
- 202 = accepted
- 307 = temporary redirect
- 308 = permanent redirect
- 400 = bad request
- 401 = unauthorized 
- 402 = pqyment required 
- 404 = not found
- 500 = internal server error
- 504 = gateway time out







