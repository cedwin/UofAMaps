To use this:

- import it to the python scripts
(ex: "from dbh import *")

- copy the campusDB.db to the location of your scripts
(could move the db location somewhere consistent later, if needed)

- you can run the sql script given to reset the db (from console
get to your script directory and run "sqlite3 campusDB.db < resetDB.sql")
(or delete the campusDB.db file)

FAQ:

Q: I'm getting a (table name) does not exist error!!

A: Try moving the campusDB.db given to your script's location
   (sqlite3 will create an empty database file if the one it is
   trying to load is not found, hence it is empty)

Q: I'm getting an "UnboundLocalError: local variable 'dataString' referenced
   before assignment"!!

A: Try populating your table with atleast 1 building graph and then
   1 navigation graph. It seems to only appear when the table is empty.
   (I'll look into a better solution when we get things wrapped up).