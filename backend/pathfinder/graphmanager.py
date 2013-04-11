import sys
# root = os.path.join("~", "UofACampusMaps")
# sys.path.(root)
import backend.pathfinder.graph
import backend.pathfinder.dbh as dbh
import cPickle as pickle

def loadFloorNavGraph(building, floor):
	return _loadFromDatabase([building, floor], dbh.getNavGraph)

def saveFloorNavGraph(building, floor, navGraph):
	return _saveToDatabase(navGraph, [building, floor], dbh.updateNavGraph)

def loadBuildingConnectionGraph(building):
	print "graphmanager: Loading building graph for " + building
	return _loadFromDatabase([building], dbh.getBldgGraph)

def saveBuildingConnectionGraph(connectionGraph, building):
	return _saveToDatabase(connectionGraph, [building], dbh.updateBldgGraph)

def loadCampusConnectionGraph(campus):
	return _loadFromDatabase([str(campus)], dbh.getCampusGraph)

def saveCampusConnectionGraph(connectionGraph, campus):
	return _saveToDatabase(connectionGraph, [str(campus)], dbh.updateCampusGraph)

def loadPath(building, edgeId):
	return _loadFromDatabase([building, edgeId], dbh.getPath)

def savePath(building, edgeId, path):
	return _saveToDatabase(path, [building, edgeId], dbh.updatePath)

def _loadFromDatabase(key, dbGetGraph):
	print "Loading from database..."
	graphString = dbGetGraph(*key)
	# print navGraphString
	print "Size is", sys.getsizeof(graphString), "bytes"
	if graphString is not None:
		print "Encoding to ascii..."
		graphString = graphString.encode("ascii")
		# as per workaround below, the graph is actually inside a list, so
		# return it as the first element
		print "Unpickling..."
		graph = pickle.loads(graphString)[0]
		return graph

def _saveToDatabase(graph, key, dbUpdateGraph):
	# this needs to be set high else we could get an exception
	sys.setrecursionlimit(50000)
	# Pickle the graph inside a list so that pickle doesn't need to import
	#   the graph module when unpickling, and get potential import errors.
	#   (Stupid workaround ...that took hours to figure out... but it works.)
	graphString = pickle.dumps([graph])
	try:
		if len(key) == 1:
			dbUpdateGraph(key[0], graphString)
		elif len(key) == 2:
			dbUpdateGraph(key[0], key[1], graphString)
		else:
			return False
		return True
	except Exception as e:
		print "Exception when calling database: "
		print e
		return False

if __name__ == '__main__':
	bldConGraph = loadBuildingConnectionGraph("sub")
	for key in bldConGraph.nodeMap.keys():
		print key
