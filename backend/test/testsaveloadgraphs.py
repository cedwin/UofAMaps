from __future__ import absolute_import


import os
import sys
print sys.path
# print os.getcwd()
# print os.path.dirname(os.path.abspath(__file__))
rootDir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0,rootDir) 
print rootDir

from backend.pathfinder.graphmanager import saveFloorNavGraph, loadFloorNavGraph
from backend.pathfinder.graphvisualizer import outputGraph
import backend.pathfinder.graph
import unittest
# /Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages/
# CCIS, 2
# SUB, 2
# SUB, 1

class TestSaveLoadGraphs(unittest.TestCase):

	def testLoadNavGraph(self):
		print "here"
		# assume we already have some graphs saved into the database
		navGraph = loadFloorNavGraph("SUB", "2")
		self.assertIsNotNone(navGraph)
		# outputGraph(navGraph, None, "testLoadNavGraph")
		
	

if __name__ == '__main__':
    unittest.main()
