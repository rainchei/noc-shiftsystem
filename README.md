# noc-shiftsystem
Build upon docker-compose

1. First, you can run “python manage.py runserver” to test the static files served properly, especially those under bower_components.
2. On local, make sure nginx has the same "static" files as the django one.
3. Run “docker-compose up -d --build” to build images and start the services.
4. Go to “http://127.0.0.1/shiftsystem/” to check the services good or not.

* if 404 not found, go check the server_name in the nginx.conf.
* if css/js went wrong. The HTML static file path may need to be adjusted to add/delete prefix "bower_components".
