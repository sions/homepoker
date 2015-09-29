from flask import Flask
app = Flask(__name__)
app.config['DEBUG'] = True

import os
import jinja2
import webapp2


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.


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
  return os.environ.get('JS_MODE', '') == 'compiled'