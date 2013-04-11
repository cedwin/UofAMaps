# Student: Colin Hunt
# CSID: colin

import itertools
import heapq

class PriorityQueue(object):
	# Priority queue as recommended from http://docs.python.org/3/library/heaheap.html
	def __init__(self):
		self.heap = []                         # list of entries arranged in a heap
		self.entry_finder = {}               # mapping of tasks to entries
		self.REMOVED = '<removed-task>'      # placeholder for a removed task
		self.counter = itertools.count()     # unique sequence count
	
	def insert(self, task, priority=0):
	   'Add a new task or update the priority of an existing task'
	   if task in self.entry_finder:
	      self.remove(task)
	   count = next(self.counter)
	   entry = [priority, count, task]
	   self.entry_finder[task] = entry
	   heapq.heappush(self.heap, entry)
	
	def remove(self, task):
	   'Mark an existing task as REMOVED.  Raise KeyError if not found.'
	   entry = self.entry_finder.pop(task)
	   entry[-1] = self.REMOVED
	
	def pop(self):
	   'Remove and return the lowest priority task. Raise KeyError if empty.'
	   while self.heap:
	      priority, count, task = heapq.heappop(self.heap)
	      if task is not self.REMOVED:
	         del self.entry_finder[task]
	         return task
	   raise KeyError('pop from an empty priority queue')
	  
	def isEmpty(self):
		for entry in self.heap:
			priority, count, task = entry
			if task is not self.REMOVED:
				return False
		return True
	
	def contains(self, task):
		return task in self.entry_finder

	def getTasks(self):
		return self.heap
	
	def __contains__(self, item):
		return self.contains(item)
