# Set the base image to the latest nginx
FROM nginx:latest

# Set the nginx's configure file
COPY ./conf.d/nginx.conf /etc/nginx/conf.d/nginx.conf

# Make some directories to store the static files
RUN mkdir -p /django/shiftsystem/static/bower_components && mkdir -p /django/shiftsystem/static/shiftsystem/images

# Set the uwsgi parameters for nginx
COPY ./uwsgi_params /django/uwsgi_params

# copy static files into nginx container
ADD ./static/ /django/shiftsystem/static/
