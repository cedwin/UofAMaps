#modified code from:
#http://zetcode.com/db/sqlitepythontutorial/
import sqlite3 as lite
import datetime
import sys

# function to get the building graph with a given building id
# ex: getBldgGraph('cab')
# param: building id (string)
# returns: a string with all the building graph data stored, 
# if none is found, returns None (ex: data == None ; evaluates to true).
def getBldgGraph(bid):
	con = None
	temp = None
	data = None
	
	try:
		con = lite.connect('campusDB.db')
		cur = con.cursor()
		
		stmt = "SELECT bldgGraph FROM BldgGraph WHERE bid='" + bid.lower() + "';"
		cur.execute(stmt)

		data = cur.fetchone()
		
		#join the tuple with a string for a new string object
		dataString = ''.join(data)
		
		#remove the extra white spaces
		dataString.strip()
		
	except lite.Error as e:
		print ("Error %s", e.args[0])

	finally:
		if con:
			con.close()
		return dataString
			
# function to update the building graph with a given building id and
# building graph
# ex: updateBldgGraph('cab', 'some building graph string')
# param: building id (string), building graph (string)
def updateBldgGraph(bid, bldgGraph):
	con = None
	time = str(datetime.datetime.now())
	
	#convert graph to statement friendly format
	temp = makeSafe(bldgGraph)
	bldgGraph = temp
	
	try:
		con = lite.connect('campusDB.db')
		
		#creates a new entry or replaces it
		stmt = "INSERT OR REPLACE INTO BldgGraph VALUES (\"" + bid.lower() +"\",\"" + bldgGraph + "\", \"" + time + "\");"

		cur = con.cursor()
		cur.execute(stmt)
		
		#auto-commit is off, need to commit changes
		con.commit()
	except lite.Error as e:
		print ("Error %s", e.args[0])

	finally:
		if con:
			con.close()

# function to get the navigation graph with a given building id and floor
# ex: getNavGraph('cab', '1')
# param: building id (string), floor number (string)
# returns: a string with the navigation graph of the desired building's floor,
# if none is found, returns None (ex: data == None ; evaluates to true).
def getNavGraph(bid, floor):
	con = None
	data = None
	temp = floor.strip()
	floor = temp
	
	try:
		con = lite.connect('campusDB.db')

		cur = con.cursor()
		stmt = "SELECT bldgGraph FROM NavGraph WHERE bid='" + bid.lower() + "' AND floor=" + floor +";"
		cur.execute(stmt)
	
		data = cur.fetchone()

		#join the tuple with a string for a new string object
		dataString = ''.join(data)
		
		#remove the extra white spaces
		dataString.strip()
		
	except lite.Error as e:
		print ("Error %s", e.args[0])

	finally:
		if con:
			con.close()
		return dataString

# function to update the navigation graph with a given building id,
# floor number, and building graph string
# ex: updateNavGraph('cab', '1', 'some building graph string')
# param: building id (string), floor number (string),  building graph (string)		
def updateNavGraph(bid, floor, navGraph):
	con = None
	time = str(datetime.datetime.now())
	
	temp = floor.strip()
	floor = temp
	
	#convert graph to statement friendly format
	temp = makeSafe(navGraph)
	navGraph = temp
	
	try:
		con = lite.connect('campusDB.db')
		
		#need to turn on foreign key enforcement
		con.execute('pragma foreign_keys=ON')
		
		#creates a new entry or replaces it
		stmt = "INSERT OR REPLACE INTO NavGraph VALUES ('" + bid.lower() + "', " + floor + ", '" + navGraph + "', '" + time + "');"
		
		cur = con.cursor()
		cur.execute(stmt)
		
		#auto-commit is off, need to commit changes
		con.commit()
	except lite.Error as e:
		print ("Error %s", e.args[0])

	finally:
		if con:
			con.close()

# function used to retrieve the door coordinates given a door number
# (assigned in the graphs) using a given building id, floor number, and
# door number.
# ex: getDoor('ath', '1', '1')
# param: building id (string), floor number(string), door number(string)
# returns: the outdoor x and y coordinates (tuple) of the corresponding door,
# if none is found, returns None (ex: data == None ; evaluates to true).
def getDoor(bid, floor, dNum):
	con = None
	data = None
	
	try:
		con = lite.connect('campusDB.db')
		
		cur = con.cursor()
		stmt = "SELECT xCoord, yCoord FROM DoorCoords WHERE bid='" + bid.lower() + "' AND floor=" + floor + " AND door=" + dNum +";"

		cur.execute(stmt)
		
		data = cur.fetchone()

	except lite.Error as e:
		print ("Error %s", e.args[0])
	finally:
		if con:
			con.close()
		return data

# function that will convert graph string to statement friendly format
# it will replace each apostrophe in the given string to "\'"
def makeSafe(stmt):
	temp = stmt.replace("'","\'")
	return temp