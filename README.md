# noc-shiftsystem
Build upon docker-compose
1. On local, run “python manage.py bower_install” to download the bower components to “django/shiftsystem/static/bower_components”.
2. On local, run “python manage.py runserver” to test the static files served properly, especially those under bower_components.
3. On local, copy the folder "static" to the same directory of the nginx dockerfile. Make sure the nginx could serve those static files.
4. On local, run “docker-compose up -d --build” to start the containers.
5. Go to “http://127.0.0.1/shiftsystem/” to check the services run by docker-compose.
6. If its 404 not found, go check the server_name in the nginx.conf.
7. If css/js went wrong. The HTML static file path may need to be adjusted to add/delete prefix "bower_components".

Build upon docker
1. docker build -t rainchei/shift-django .
    * docker run --name django --expose 8001 -d rainchei/shift-django uwsgi --socket :8001 --module noc.wsgi
2. docker build -t rainchei/shift-nginx .
    * docker run --name nginx --link django:django -p 80:80 -d rainchei/shift-nginx
