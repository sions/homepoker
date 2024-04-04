## Home poker application.

## Run Locally
1. Install the [App Engine Python SDK](https://developers.google.com/appengine/downloads).
See the README file for directions. You'll need python 2.7 and [pip 1.4 or later](http://www.pip-installer.org/en/latest/installing.html) installed too.

1. Install

   ```
   npm install google-closure-deps
   npm install google-closure-compiler
   ```

1. Clone this repo with

   ```
   git clone https://github.com/sions/homepoker.git
   ```
1. Install dependencies in the project's lib directory.
   Note: App Engine can only import libraries from inside your project directory.

   ```
   cd appengine-python-flask-skeleton
   pip install -r requirements.txt -t lib

   ```
1. Install client side dependencies using Bower:

   ```
   bower install
   ```
1. Run this project locally from the command line:

   ```
   python main.py

   ```

   See setup in https://cloud.google.com/appengine/docs/standard/python3/building-app/writing-web-service#testing_your_web_service.

1. For auto update of CSS run:
   ```
   sass -Ilib/bower_components --style compressed --watch css/main.scss:generated/main.css
   ```

Visit the application [http://localhost:8080](http://localhost:8080)

See [the development server documentation](https://developers.google.com/appengine/docs/python/tools/devserver)
for options when running dev_appserver.

## Deploy
To deploy the application:

1. Use the [Admin Console](https://appengine.google.com) to create a
   project/app id. (App id and project id are identical)
1. [Deploy the
   application](https://developers.google.com/appengine/docs/python/tools/uploadinganapp) with

   ```
   gcloud app deploy --project=<your-app-id>
   ```
1. Congratulations!  Your application is now live at your-app-id.appspot.com
