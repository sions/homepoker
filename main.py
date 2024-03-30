from flask import Flask
app = Flask(__name__)
app.config['DEBUG'] = True

import datetime
import json
import os
import jinja2
# import webapp2

DEV_CLIENT_ID = '1026721110899-nj8vph4j6oe5hspslp9lnc9obmfsj3jp.apps.googleusercontent.com'
PROD_CLIENT_ID = '1026721110899-6t5r7pu7hdn49rtaoioe6tkn2inq8l2r.apps.googleusercontent.com'


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    autoescape=True,
    trim_blocks=True)

# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.


@app.route('/get_time')
def gettime():
  utctime = (datetime.datetime.utcnow() - datetime.datetime.utcfromtimestamp(0)).total_seconds()
  return json.dumps({'timestamp': int(round(utctime * 1000))})

@app.route('/open/<game_id>')
def open(game_id):
  template = JINJA_ENVIRONMENT.get_template('index.html')
  return template.render({
    'game_id': game_id,
    'js_compiled': _is_jsmode_compiled(),
    'client_id': _get_client_id()})


@app.route('/')
def create():
  template = JINJA_ENVIRONMENT.get_template('index.html')
  return template.render({
    'game_id': None,
    'js_compiled': _is_jsmode_compiled(),
    'client_id': _get_client_id()
    })


@app.errorhandler(404)
def page_not_found(e):
  """Return a custom 404 error."""
  return 'Sorry, nothing at this URL.', 404


def _is_jsmode_compiled():
  return (not os.environ.get('SERVER_SOFTWARE', '').startswith('Dev') or
          os.environ.get('FORCE_JS_COMPILED', '') == 'YES')

def _get_client_id():
  return DEV_CLIENT_ID if os.environ.get('SERVER_SOFTWARE', '').startswith('Dev') else PROD_CLIENT_ID


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
