#modified code from:
#http://zetcode.com/db/sqlitepythontutorial/
import sqlite3 as lite
import datetime
import sys

#database path and name
dbPath = 'campusDB.db'
dbCreatePath = 'createDB.sql'

# function to get the building graph with a given building id
# ex: getCampusGraph('north')
# param: campus id (string)
# returns: a string with the campus graph data stored, 
# if none is found, returns None (ex: data == None ; evaluates to true).
def getCampusGraph(cid):
	con = None
	temp = None
	data = None
	dataString = None
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)
		cur = con.cursor()

		cur.execute("""SELECT campusGraph FROM CampusGraph WHERE cid = ?;""", [cid.lower()])
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
			
# function to update the campus graph with a given campus id and
# campus graph
# ex: updateBldgGraph('north', 'some campus graph string')
# param: campus id (string), campus graph (string)
def updateCampusGraph(cid, campusGraph):
	con = None
	time = str(datetime.datetime.now())
	
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)
		cur = con.cursor()
		cur.execute("INSERT OR REPLACE INTO CampusGraph VALUES (?, ?, ?)", (cid.lower(), campusGraph, time))

		#auto-commit is off, need to commit changes
		con.commit()
	except lite.Error as e:
		print ("Error %s", e.args[0])

	finally:
		if con:
			con.close()

# function to get the building graph with a given building id
# ex: getBldgGraph('cab')
# param: building id (string)
# returns: a string with all the building graph data stored, 
# if none is found, returns None (ex: data == None ; evaluates to true).
def getBldgGraph(bid):
	con = None
	temp = None
	data = None
	dataString = None
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)
		cur = con.cursor()
		print "here"
		cur.execute("SELECT bldgGraph FROM BldgGraph WHERE bid = ?;", [bid.lower()])
		data = cur.fetchone()
		print "there"
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
	
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)
		cur = con.cursor()

		cur.execute("""INSERT OR REPLACE INTO BldgGraph VALUES (?, ?, ?);""", (bid.lower(), bldgGraph, time))
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
	dataString = None
	
	try:
		#create and populate a db
		makeDB()
		
		con = lite.connect(dbPath)

		cur = con.cursor()
		cur.execute("""SELECT bldgGraph FROM NavGraph WHERE bid= ? AND floor= ?;""", (bid.lower(), floor))
	
		data = cur.fetchone()

		#join the tuple with a string for a new string object
		dataString = ''.join(data)
		
		#remove the extra white spaces
		dataString.strip()
		
	except lite.Error as e:
		print ("Error %s", e.args[0])
		return None
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
	
	try:
		con = lite.connect(dbPath)
		#create and populate a db
		makeDB()
		
		#creates a new entry or replaces it
		cur = con.cursor()

		cur.execute("""INSERT OR REPLACE INTO NavGraph VALUES (?, ?, ?, ?);""", (bid.lower(), floor, navGraph, time))
		#auto-commit is off, need to commit changes
		con.commit()
	except lite.Error as e:
		print ("Error", e)
		print "NavGraph is not updated"
	finally:
		if con:
			con.close()

# function used to retrieve the door coordinates given a door number
# (assigned in the graphs) using a given building id, floor number, and
# door number.
# ex: getDoors('ath')
# param: building id (string)
# returns: the floor number, door, and outdoor x and y coordinates (tuple) 
# of the corresponding building, if none is found, returns None
def getDoors(bid):
	con = None
	data = None
	
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)
		
		cur = con.cursor()
		cur.execute("""SELECT floor, door, xCoord, yCoord FROM DoorCoords WHERE bid= ?;""", [bid.lower()])
		
		data = cur.fetchall()

	except lite.Error as e:
		print ("Error %s", e.args[0])
		return None
	finally:
		if con:
			con.close()
		if data == []:
			data = None
		return data

# function to get the edge with a given edge index (eid) and building
# id (bid), ex: getEdge('cab', 1)
# param: building id (string), edge index (integer)
# returns: a string with edge stored, 
# if none is found, returns None (ex: data == None ; evaluates to true).
def getPath(bid, eid):
	con = None
	temp = None
	data = None
	dataString = None
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)
		cur = con.cursor()
		
		cur.execute("""SELECT edge FROM EdgeTable WHERE bid= ? AND eid= ?;""", (bid.lower(), str(eid)))
		data = cur.fetchone()
		
		#join the tuple with a string for a new string object
		dataString = ''.join(data)
		
		#remove the extra white spaces
		dataString.strip()
		dataString.encode('utf_8')
		
	except lite.Error as e:
		print ("Error %s", e.args[0])
	finally:
		if con:
			con.close()
		return dataString
			
# function to update the edge with a given building id,
# edge index, and edge string
# ex: updateEdge('cab', 1, 'some edge')
# param: building id (string), edge index (integer), edge (string)
def updatePath(bid, eid, edge):
	con = None
	time = str(datetime.datetime.now())
	
	try:
		#create and populate a db
		makeDB()
		con = lite.connect(dbPath)

		cur = con.cursor()
		cur.execute("INSERT OR REPLACE INTO EdgeTable VALUES (?,?,?,?)", 
		            (bid.lower(), eid, edge, time))

		
		#auto-commit is off, need to commit changes
		con.commit()
	except lite.Error as e:
		print ("Error %s", e.args[0])

	finally:
		if con:
			con.close()
		
# function that will convert graph string to statement friendly format
# it will replace each apostrophe in the given string to "\'"
def makeSafe(stmt):
	stmt = stmt.replace("'","\'")
	stmt = stmt.replace('"','\"')
	return stmt
	
# Create and populate the database
def makeDB():
	con = lite.connect(dbPath)
	cur = con.cursor()
	#hard coded database setup
	line = {}
	line[0] = "CREATE TABLE IF NOT EXISTS EdgeTable (bid VARCHAR(30), eid INTEGER, edge VARCHAR(512), lastUpdated TEXT, PRIMARY KEY (bid, eid));"
	line[1] = "CREATE TABLE IF NOT EXISTS BldgGraph (bid VARCHAR(30) PRIMARY KEY NOT NULL, bldgGraph VARCHAR(512) NOT NULL, lastUpdated TEXT);"
	line[2] = "CREATE TABLE IF NOT EXISTS NavGraph (bid VARCHAR(30) NOT NULL, floor INTEGER NOT NULL, bldgGraph VARCHAR(512) NOT NULL, lastUpdated TEXT, PRIMARY KEY(bid, floor));"
	line[3] = "CREATE TABLE IF NOT EXISTS CampusGraph (cid VARCHAR(30) PRIMARY KEY NOT NULL, campusGraph VARCHAR(512) NOT NULL, lastUpdated TEXT);"
	line[4] = "CREATE TABLE IF NOT EXISTS DoorCoords (bid VARCHAR(30) NOT NULL, floor INTEGER NOT NULL, door INTEGER NOT NULL, xCoord INTEGER NOT NULL, yCoord INTEGER NOT NULL, PRIMARY KEY(bid, floor, door));"
	line[5] = "INSERT OR IGNORE INTO DoorCoords VALUES ('sub', 1, 0, 53.525367, -113.527908);"
	line[6] = "INSERT OR IGNORE INTO DoorCoords VALUES ('sub', 1, 1, 53.524938, -113.527184);"
	line[7] = "INSERT OR IGNORE INTO DoorCoords VALUES ('sub', 1, 2, 53.525427, -113.526755);"
	line[8] = "INSERT OR IGNORE INTO DoorCoords VALUES ('sub', 1, 3, 53.525398, -113.526382);"
	line[9] = "INSERT OR IGNORE INTO DoorCoords VALUES ('ath', 1, 0, 53.526888, -113.526551);"
	line[10] = "INSERT OR IGNORE INTO DoorCoords VALUES ('ath', 1, 1, 53.526535, -113.526551);"
	line[11] = "INSERT OR IGNORE INTO DoorCoords VALUES ('ath', 2, 0, 53.526660, -113.526723);"
	line[12] = "INSERT OR IGNORE INTO DoorCoords VALUES ('ath', 2, 1, 53.526704, -113.526551);"
	line[13] = "INSERT OR IGNORE INTO DoorCoords VALUES ('cab', 1, 0, 53.526714, -113.525000);"
	line[14] = "INSERT OR IGNORE INTO DoorCoords VALUES ('cab', 1, 1, 53.526199, -113.524910);"
	for i in range(len(line)):
		cur.execute(line[i])
	if con:
		con.commit()
		con.close()