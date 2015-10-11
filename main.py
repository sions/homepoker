from flask import Flask
app = Flask(__name__)
app.config['DEBUG'] = True

import datetime
import json
import os
import jinja2
import webapp2


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
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
  return template.render({'game_id': game_id, 'js_compiled': _is_jsmode_compiled()})


@app.route('/')
def create():
  template = JINJA_ENVIRONMENT.get_template('index.html')
  return template.render({'game_id': None, 'js_compiled': _is_jsmode_compiled()})


@app.errorhandler(404)
def page_not_found(e):
  """Return a custom 404 error."""
  return 'Sorry, nothing at this URL.', 404


def _is_jsmode_compiled():
  return (not os.environ.get('SERVER_SOFTWARE', '').startswith('Dev') or 
          os.environ.get('FORCE_JS_COMPILED', '') == 'YES')