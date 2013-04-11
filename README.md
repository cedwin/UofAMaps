# UofA Campus Maps

## Project Summary

The Campus Maps team is striving to provide a real time, user-friendly path finding
experience across all of the University of Alberta campuses. Currently anyone who would like to
find their way around using campus maps can do so, but the path provided does not give you
directions directly to a door or specific service inside of a building. Our team plans to fulfill this
need. Currently the interiors of the buildings are mapped and viewable on the web but no paths
are drawn indoors. Our team intends to provide a thorough and rich map experience. Currently
the campus maps web portion and the app are run off separate logic and infrastructure. Our
team plans to centralize the campus maps experience.

We envision seeing anyone unfamiliar with campus using this service to find a specific
door, something to eat or drink, or even the warmest route during those cold winter days. One
will also be able to add waypoints to a specific path. For example, one could plot a path of
classrooms, with coffee and bathroom stops along the way. This could be a users entire day at
school, all mapped out beforehand. We therefore envision students at the start of each
semester finding the perfect route to fit their schedule easy and stress free. Another example
would be a disabled route, taking into account both stairs and elevators when planning the route.
We would like to see this service working on modern browsers, accessible by both computers
and mobile devices. With the phonegap capabilities this browser version will be easily wrapped
into native apps for both iOS and Android

## Running locally

To obtain and properly install a distribution of UofA Campus Maps project on your local machine follow these instructions:

* Install Python 2.7.3 including pip/easy_install
* install Django v1.5 (pip install django==1.5)
* install dependencies/libraries:
    * pip install or easy_install pyparsing==1.5.7 
    * pip install or easy_install pydot
    * pip install or easy_install numpy
    * install polygon2 2.0.06, [click here for download page](https://bitbucket.org/jraedler/polygon2/downloads), extract the contents of the zip, then go to the directory, and run “python setup.py install” to install it.
* Git clone the repository, (UniversityOfAlberta/UofACampusMaps.git)
* go into UofACampusMaps directory
* run python manage.py syncdb
* run python manage.py runserver
* go to [http://localhost:8000](http://localhost:8000) to view CampusMaps

## Demo

Go to the following URL, [http://scdev06.srv.ualberta.ca:443](http://scdev06.srv.ualberta.ca:443) to access a pre-installed, final version of the application.

## Help Manual

[Help Manual on how to use the application](http://scdev06.srv.ualberta.ca:443/static/Manual/UserManual.html)