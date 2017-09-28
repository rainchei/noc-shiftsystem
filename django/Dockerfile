# Set the base image to python:latest
FROM python:latest

# Make a working directory for the django project in the container
RUN mkdir /django

# Copy all content of current directory including project folder, manage.py, uwsgi.ini, and requirement.txt
# into the container under the directory /mysite3/.
ADD . /django/

# Set the working directory
WORKDIR /django

# Using pip to install python models including django, uwsgi, mysqlclient, django-bower.
# Option -r means to install from the given requirements file.
RUN pip install -r requirements.txt

# Install node, npm
RUN curl -sL https://deb.nodesource.com/setup_7.x | bash - && apt-get install -y nodejs

# Install bower using npm
RUN npm install -g bower

# Download bower_components including fullcalendar, jquery, bootstrap
RUN python manage.py bower_install --allow-root

# Create database tables according to the django models ... (do not run this unless your db is ready)
#RUN python manage.py makemigrations && python manage.py migrate
