#!/usr/bin/env python

from math import sqrt

def straightLineDistance(fromNode, toNode):
	"""Return the straight line distance between two nodes calculated from their positions."""
	(x1, y1, z1) = (fromNode.getX(), fromNode.getY(), fromNode.getZ())
	(x2, y2, z2) = (toNode.getX(), toNode.getY(), toNode.getZ())
	return sqrt((x1 - x2)**2 + (y1 - y2)**2 + (z1 - z2)**2)

def zeroHeuristic(fromNode, toNode):
	"""The 0 Heuristic."""
	return 0

class MetaPolygon(object):
    
    def __init__(self, name, refId, positions):
        self._positionList = positions
        self._name = name
        self._refId = refId
    
    def getName(self):
        return self._name
    
    def getPolygon(self):
        return self._positionList
       
    def getRefId(self):
    	return self._refId

class Position(object):
	def __init__(self, x, y, z = 0):
		self._x = x
		self._y = y
		self._z = z
		
	def x(self):
		return self._x
	
	def y(self):
		return self._y
	
	def z(self):
		return self._z
