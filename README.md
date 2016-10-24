# **Mobile Cloud Computing Project**  
## **Assignment 1 (Group 7)**

##### **HOW TO RUN** 

Assuming that the repo has been cloned and the Android SDK (22) is installed,
run the deploy script in the project root:  
```sudo ./deploy.sh```

The script will start the backend web server. Then, use the following
credentials to login to the application:


    username : user
    password : pass
 


##### **Project folder structure** 


> **android**
  Contains the android frontend project    
>
>**public**
  Contains public assets served by the backend server and that are used by both the web and the Android client    
>
>**server**
  Contains the backend server code    
>
>**spec**
  Contains some testing code    
>
>**web**
  Contains the web frontend project    
>>**app**
  Contains the Angular application that will only be served if the user is logged in    


##### **APIs**

```
POST /login

  request data:
    {
      "userid": <username>,
      "password": <password>
    }

  response:
    if login failed: 401 Unauthorized
    if login was successful: 200 OK

GET /logout

  response:
    200 OK

GET /loggedin

  response:
    if user is logged in:
      {
        "loggedIn" : true,
        "user": <userId>
      }

    if user is not logged in:
      {
        "loggedIn" : false
      }

GET /apps

  optional query to get location-based sorting:
    /apps?lat=...&lon=...

  optional query with custom accuracy:
    /apps?lat=...&lon=...&acc=...

  response:
    if logged in: An array of apps
    if not logged in: 401 Unauthorized

POST /gcloud/start

  request data:
    {
      "instance": <instanceName>
    }

  response:
    if success:
      {
        "name": <instanceName>,
        "status": <status>,
        "externalIP": <externalIP>
      }

    if error:
      Error status code and message

POST /gcloud/stop

  request data:
    {
      "instance": <instanceName>
    }

  response:
    if success:
      {
        "operation": <operationName>,
        "status": <status>
      }

    if error:
      Error status code and message
```

##### **Backend files**
```
server/apps.js
  Contains the code that returns the apps in a given order based on the
  geolocation given in the GET query string

server/auth-routes.js
  Contains the router setup for session management

server/auth.js
  Contains the authentication functions

server/cloud-routes.js
  Contains the API routes for cloud management

server/cloud.js
  Contains functions for cloud management

server/cors.js
  Contains setup for cross origin requests

server/instance-timeout.js
  Contains instance timeout management to automatically
  stop instances after being idle for 15 minutes

server/mcc-2016-g07-p1-79a74e3160e9.json
  Contains Google Cloud authentication info

server/server.js
  Contains the server entry point script that will handle the
  files in the correct order

server/web-routes.js
  Contains routing for the web frontend
```

##### **Web frontend files**
```
web/app/css/...
  Styles

web/app/img/...
  Icons used in the web frontend

web/app/js/app.js
  Angular app entry point

web/app/js/controllers.js
  Angular app controllers (i.e. the one controller used)

web/app/js/directives.js
  Angular app directives (i.e. the VNC client directive)

web/app/js/services.js
  Angular app services (i.e. the service providing access to the backend APIs)

web/app/novnc
  The noVNC library files

web/app/partials
  Angular app view partials

web/app/index.html
  The private index page that loads the Angular app, is behind authentication

web/login.html
  The login page, is public, but served over HTTPS so that credentials are not sent publicly without encryption
```