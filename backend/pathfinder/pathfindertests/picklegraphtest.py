#!/usr/bin/env python

# Do this to look up two directory levels for the pathfinder package
import os, sys
pathfinder_path = os.path.join("..", "..")
sys.path.append(pathfinder_path)

import pickle
from pathfinder.graph import *

g = Graph()
node1 = g.addNode()
node2 = g.addNode()
node3 = g.addNode()
node4 = g.addNode()
edge1 = g.addEdge(node1, node2)
edge2 = g.addEdge(node1, node3)
edge3 = g.addEdge(node2, node4)
edge4 = g.addEdge(node3, node4)

g.dict = dict({"one" 	 : node1,
							 "two"   : node2,
							 "three" : node3,
							 "four"  : node4})

assert(node2 in node1.getNeighbors())
assert(node3 in node1.getNeighbors())
assert(node4 in node3.getNeighbors())

assert(g.dict["one"] is node1)
assert(g.dict["two"] is node2)
assert(g.dict["three"] is node3)
assert(g.dict["four"] is node4)

# now we pickle and unpickle
gString = pickle.dumps(g)
g2 = pickle.loads(gString)

print sys.getsizeof(gString)
print gString

node12 = g2.dict["one"]
node22 = g2.dict["two"]
node32 = g2.dict["three"]
node42 = g2.dict["four"]

assert(node22 in node12.getNeighbors())

print sys.getsizeof(g)
print sys.getsizeof(node1)
print sys.getsizeof(edge1)

g3 = Graph()
for i in range(100):
	n1 = g3.addNode()
	n2 = g3.addNode()
	g3.addEdge(n1, n2)

print sys.getsizeof(pickle.dumps(g3))

